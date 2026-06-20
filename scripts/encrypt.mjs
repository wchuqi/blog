#!/usr/bin/env node
// 加密文章 CLI。
//
// 用法：
//   npm run encrypt -- <file>                 加密单篇（明文 .md → 密文 .md）
//   npm run encrypt -- --all                  批量加密：扫描所有标了 encrypted: true 但还是明文的文章
//   npm run encrypt -- <file> --decrypt       解密回明文（作者自用/校验）
//   npm run encrypt -- <file> --reencrypt     用新密码重新加密（改密码时用）
//
// 批量加密的工作流：在 .md 的 frontmatter 里写 encrypted: true，正文照常写明文，
// 然后跑 `npm run encrypt -- --all`，脚本会找到所有「标了加密但还没加密」的文件，用同一个密码依次加密。
// 已经是密文的文件会自动跳过。
//
// 密码来源（按优先级）：
//   1. 环境变量 BLOG_ENCRYPT_KEY
//   2. 交互式提示输入（不回显）
//
// 算法与 src/lib/crypto.ts 完全对齐：
//   PBKDF2(SHA-256, 150000) → AES-256-GCM。
//   密文格式 ENC::v1::<salt>::<iv>::<ciphertext>，其中 ciphertext = encrypted + authTag，
//   与浏览器 Web Crypto 的 AES-GCM 输出格式一致。
import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createInterface } from 'node:readline/promises'
import { stdin, stdout } from 'node:process'
import { randomBytes, pbkdf2Sync, createCipheriv, createDecipheriv } from 'node:crypto'

const PBKDF2_ITERATIONS = 150000
const SALT_BYTES = 16
const IV_BYTES = 12
const KEY_BYTES = 32
const PREFIX = 'ENC::v1::'

// ---------- 密码读取 ----------

/** 交互式读取密码（不回显，Windows 下无原生隐藏，至少不混入其他输出） */
async function askPassword(prompt) {
  const rl = createInterface({ input: stdin, output: stdout })
  // 关闭回显：对多数终端有效，Windows cmd 不支持时至少功能可用
  stdout.write(prompt)
  let password = ''
  for await (const chunk of stdin) {
    password += chunk.toString()
    break // readline on raw stdin returns full line on Enter
  }
  rl.close()
  return password.replace(/\r?\n$/, '')
}

async function getPassword(actionLabel) {
  if (process.env.BLOG_ENCRYPT_KEY) {
    return process.env.BLOG_ENCRYPT_KEY
  }
  const pw = await askPassword(`请输入用于${actionLabel}的密码：`)
  if (!pw) {
    console.error('错误：密码不能为空（也可用环境变量 BLOG_ENCRYPT_KEY 提供）')
    process.exit(1)
  }
  return pw
}

// ---------- frontmatter 解析/序列化（与 gen-rss.mjs 风格一致，纯字符串处理） ----------

const FM_RE = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/

function parseMd(raw) {
  const m = FM_RE.exec(raw)
  if (!m) return { fmText: '', body: raw, hasFm: false }
  return { fmText: m[1], body: m[2], hasFm: true }
}

/** 读取 frontmatter 文本里某个布尔字段 */
function fmBool(fmText, key) {
  const re = new RegExp(`^${key}:\\s*(.+)$`, 'm')
  const m = re.exec(fmText)
  if (!m) return false
  const v = m[1].trim().replace(/^['"]|['"]$/g, '')
  return v === 'true' || v === 'True' || v === 'TRUE'
}

/** 在 frontmatter 末尾追加 encrypted: true（若不存在） */
function setEncryptedFlag(fmText) {
  if (/^encrypted:/m.test(fmText)) return fmText
  return `${fmText.replace(/\s+$/, '')}\nencrypted: true\n`
}

/** 移除 frontmatter 中的 encrypted 行（解密时还原为普通文章），并保证末尾有换行 */
function removeEncryptedFlag(fmText) {
  const cleaned = fmText
    .split(/\r?\n/)
    .filter((line) => !/^encrypted:/.test(line.trimStart()))
    .join('\n')
    .replace(/\s+$/, '')
  return `${cleaned}\n`
}

// ---------- 加密 / 解密核心 ----------

function encryptText(plaintext, password) {
  const salt = randomBytes(SALT_BYTES)
  const iv = randomBytes(IV_BYTES)
  const key = pbkdf2Sync(password, salt, PBKDF2_ITERATIONS, KEY_BYTES, 'sha256')
  const cipher = createCipheriv('aes-256-gcm', key, iv)
  const encrypted = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ])
  const authTag = cipher.getAuthTag()
  // Web Crypto 期望密文末尾拼接 authTag
  const payload = Buffer.concat([encrypted, authTag])
  return `${PREFIX}${salt.toString('base64')}::${iv.toString('base64')}::${payload.toString('base64')}`
}

function decryptText(encStr, password) {
  const parts = encStr.split('::')
  if (parts.length !== 5 || parts[0] !== 'ENC' || parts[1] !== 'v1') {
    throw new Error('无法识别的密文格式')
  }
  const salt = Buffer.from(parts[2], 'base64')
  const iv = Buffer.from(parts[3], 'base64')
  const payload = Buffer.from(parts[4], 'base64')
  // 末尾 16 字节是 authTag
  const authTag = payload.subarray(payload.length - 16)
  const ciphertext = payload.subarray(0, payload.length - 16)
  const key = pbkdf2Sync(password, salt, PBKDF2_ITERATIONS, KEY_BYTES, 'sha256')
  const decipher = createDecipheriv('aes-256-gcm', key, iv)
  decipher.setAuthTag(authTag)
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8')
}

/** 判断正文是否已经是密文（避免重复加密） */
function isAlreadyEncrypted(body) {
  return body.trim().startsWith(PREFIX)
}

/** 递归收集目录下所有 .md 文件的绝对路径 */
function collectMd(dir) {
  const out = []
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) {
      out.push(...collectMd(full))
    } else if (entry.endsWith('.md')) {
      out.push(full)
    }
  }
  return out
}

// ---------- 主流程 ----------

function usage() {
  console.log(`用法：
  npm run encrypt -- <file>               加密单篇文章
  npm run encrypt -- --all                批量加密：扫描所有标了 encrypted: true 但还是明文的文章
  npm run encrypt -- <file> --decrypt     解密回明文
  npm run encrypt -- <file> --reencrypt   用新密码重新加密
示例：
  npm run encrypt -- src/posts/private.md
  $env:BLOG_ENCRYPT_KEY="你的密码"; npm run encrypt -- src/posts/private.md
  $env:BLOG_ENCRYPT_KEY="你的密码"; npm run encrypt -- --all`)
}

/** 加密单个文件（已加密的跳过）。返回是否实际执行了加密。 */
function encryptOne(file, password) {
  const raw = readFileSync(file, 'utf-8')
  const { fmText, body, hasFm } = parseMd(raw)
  if (!fmBool(fmText, 'encrypted')) {
    console.log(`[encrypt] ${file} 未标记 encrypted: true，跳过。（--all 只加密标记过的文章）`)
    return false
  }
  if (isAlreadyEncrypted(body)) {
    console.log(`[encrypt] ${file} 已经是密文，跳过。`)
    return false
  }
  const enc = encryptText(body, password)
  const newFm = setEncryptedFlag(hasFm ? fmText : '')
  const out = `---\n${newFm}---\n\n${enc}\n`
  writeFileSync(file, out, 'utf-8')
  return true
}

async function main() {
  const args = process.argv.slice(2)
  const isAll = args.includes('--all')
  const file = args.find((a) => !a.startsWith('--'))
  const mode = args.includes('--decrypt')
    ? 'decrypt'
    : args.includes('--reencrypt')
      ? 'reencrypt'
      : 'encrypt'

  if (mode === 'encrypt' && isAll) {
    // 批量模式：扫描 src/posts 下所有「标了 encrypted: true 但正文还是明文」的文章
    const __dirname = dirname(fileURLToPath(import.meta.url))
    const postsDir = join(__dirname, '..', 'src', 'posts')
    if (!existsSync(postsDir)) {
      console.error('错误：找不到 src/posts 目录')
      process.exit(1)
    }
    const candidates = collectMd(postsDir).filter((f) => {
      const { fmText, body } = parseMd(readFileSync(f, 'utf-8'))
      return fmBool(fmText, 'encrypted') && !isAlreadyEncrypted(body)
    })
    if (candidates.length === 0) {
      console.log('[encrypt] 没有待加密的文章（所有 encrypted 文章都已是密文，或没有标记过）')
      return
    }
    console.log(`[encrypt] 找到 ${candidates.length} 篇待加密文章：`)
    candidates.forEach((f) => console.log(`          - ${f}`))
    const password = await getPassword('批量加密')
    let done = 0
    for (const f of candidates) {
      if (encryptOne(f, password)) {
        done++
        console.log(`[encrypt] 已加密：${f}`)
      }
    }
    console.log(`[encrypt] 完成，共加密 ${done} 篇。`)
    return
  }

  if (!file) {
    usage()
    process.exit(1)
  }

  const raw = readFileSync(file, 'utf-8')
  const { fmText, body, hasFm } = parseMd(raw)

  if (mode === 'encrypt') {
    if (isAlreadyEncrypted(body)) {
      console.log(`[encrypt] ${file} 已经是密文，跳过。`)
      return
    }
    if (!fmBool(fmText, 'encrypted')) {
      console.log(`[encrypt] ${file} 未标记 encrypted: true。请先在 frontmatter 里加 encrypted: true，或确认你想加密的是这篇。`)
      return
    }
    const password = await getPassword('加密')
    if (encryptOne(file, password)) {
      console.log(`[encrypt] 已加密：${file}`)
      console.log(`          正文已被替换为密文，frontmatter 已加 encrypted: true`)
    }
  } else if (mode === 'decrypt') {
    if (!fmBool(fmText, 'encrypted')) {
      console.log(`[encrypt] ${file} 不是加密文章，无需解密。`)
      return
    }
    const password = await getPassword('解密')
    let plain
    try {
      plain = decryptText(body.trim(), password)
    } catch {
      console.error('错误：密码错误或密文已损坏')
      process.exit(1)
    }
    const newFm = removeEncryptedFlag(fmText)
    const out = `---\n${newFm}---\n\n${plain}\n`
    writeFileSync(file, out, 'utf-8')
    console.log(`[decrypt] 已解密：${file}`)
    console.log(`          正文已还原为明文，frontmatter 的 encrypted 字段已移除`)
  } else {
    // reencrypt
    if (!fmBool(fmText, 'encrypted')) {
      console.log(`[encrypt] ${file} 不是加密文章，重新加密前请先加密。`)
      return
    }
    const oldPw = await getPassword('解密（旧密码）')
    let plain
    try {
      plain = decryptText(body.trim(), oldPw)
    } catch {
      console.error('错误：旧密码错误')
      process.exit(1)
    }
    const newPw = await getPassword('重新加密（新密码）')
    const enc = encryptText(plain, newPw)
    const out = `---\n${fmText}---\n\n${enc}\n`
    writeFileSync(file, out, 'utf-8')
    console.log(`[reencrypt] 已用新密码重新加密：${file}`)
  }
}

main().catch((err) => {
  console.error('错误：', err.message)
  process.exit(1)
})
