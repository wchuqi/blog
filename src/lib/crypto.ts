/**
 * 加密文章的客户端解密封装。
 *
 * 算法与 scripts/encrypt.mjs 完全对齐：
 *   PBKDF2(SHA-256, 150000) 派生 256 位密钥 → AES-256-GCM 解密。
 *   每篇文章带独立 salt(16B) 与 IV(12B)，密文格式见 ENCRYPTED_PREFIX。
 *
 * 全部使用浏览器原生 Web Crypto API，不引入额外依赖。
 */

/** 密文标记，用于识别一段 body 是否已加密 */
export const ENCRYPTED_PREFIX = 'ENC::v1::'

/** PBKDF2 迭代次数，必须与加密端一致 */
const PBKDF2_ITERATIONS = 150000

const KEY_CACHE = new Map<string, Promise<CryptoKey>>()
const SESSION_KEY = 'blog-encrypt-key'

/** base64 → ArrayBuffer（Web Crypto 的 BufferSource 接受 ArrayBuffer，规避 Uint8Array 泛型类型问题） */
function fromBase64(b64: string): ArrayBuffer {
  const bin = atob(b64)
  const buffer = new ArrayBuffer(bin.length)
  const bytes = new Uint8Array(buffer)
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
  return buffer
}

/** 判断一段正文是否为加密密文 */
export function isEncrypted(body: string): boolean {
  return body.startsWith(ENCRYPTED_PREFIX)
}

/**
 * 用密码派生 AES-GCM 密钥。
 * 按 salt 做内存缓存：同一会话内对同一 salt（即同一密码 + 同一文章）
 * 不重复跑 PBKDF2，避免多次解锁的卡顿。
 */
async function deriveKey(
  password: string,
  salt: ArrayBuffer
): Promise<CryptoKey> {
  // 缓存键用 base64 编码 salt，因为 ArrayBuffer 不能直接做 Map 的字符串键
  const saltBytes = new Uint8Array(salt)
  const saltKey = btoa(String.fromCharCode(...saltBytes))
  const cacheKey = `${password}::${saltKey}`
  const cached = KEY_CACHE.get(cacheKey)
  if (cached) return cached

  const task = (async () => {
    const enc = new TextEncoder()
    const baseKey = await crypto.subtle.importKey(
      'raw',
      enc.encode(password),
      'PBKDF2',
      false,
      ['deriveKey']
    )
    return crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt,
        iterations: PBKDF2_ITERATIONS,
        hash: 'SHA-256',
      },
      baseKey,
      { name: 'AES-GCM', length: 256 },
      false,
      ['decrypt']
    )
  })()

  KEY_CACHE.set(cacheKey, task)
  return task
}

/**
 * 解密一段 ENC::v1:: 格式的密文，返回明文。
 * 密码错误时 AES-GCM 校验失败，会 reject（调用方 catch 后提示密码错误）。
 */
export async function decryptBody(
  encStr: string,
  password: string
): Promise<string> {
  const parts = encStr.split('::')
  // ENC::v1::salt::iv::ciphertext
  if (parts.length !== 5 || parts[0] !== 'ENC' || parts[1] !== 'v1') {
    throw new Error('无法识别的密文格式')
  }
  const salt = fromBase64(parts[2])
  const iv = fromBase64(parts[3])
  const ciphertext = fromBase64(parts[4])

  const key = await deriveKey(password, salt)
  const plainBuf = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    ciphertext
  )
  return new TextDecoder().decode(plainBuf)
}

/** 从 sessionStorage 读取上次输入的密码（仅当前标签页会话内有效） */
export function getCachedPassword(): string | null {
  try {
    return sessionStorage.getItem(SESSION_KEY)
  } catch {
    return null
  }
}

/** 缓存密码到 sessionStorage，解锁一次后本次会话内自动解锁其他加密文章 */
export function setCachedPassword(password: string): void {
  try {
    sessionStorage.setItem(SESSION_KEY, password)
  } catch {
    /* 忽略隐私模式下 sessionStorage 不可用的情形 */
  }
}

/** 清除缓存的密码（登出） */
export function clearCachedPassword(): void {
  try {
    sessionStorage.removeItem(SESSION_KEY)
  } catch {
    /* 同上 */
  }
}
