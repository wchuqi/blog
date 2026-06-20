import { useState, useRef, useEffect } from 'react'
import {
  decryptBody,
  getCachedPassword,
  setCachedPassword,
} from '../lib/crypto'

/**
 * 加密文章的密码门。
 * 挂载时先用 sessionStorage 里缓存的密码尝试自动解锁；
 * 用户输入密码后调用 Web Crypto 解密，成功则 onUnlock 回调把明文交给父组件，
 * 并缓存密码供本次会话内的其他加密文章复用。
 */
export function PasswordGate({
  encryptedBody,
  onUnlock,
}: {
  /** 密文（ENC::v1::... 格式） */
  encryptedBody: string
  /** 解锁成功时回调，参数为解密后的明文 Markdown */
  onUnlock: (plaintext: string) => void
}) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // 挂载时自动用缓存的密码尝试解锁（刷新页面也能直接进）
  useEffect(() => {
    const cached = getCachedPassword()
    if (!cached) return
    setLoading(true)
    decryptBody(encryptedBody, cached)
      .then((plain) => onUnlock(plain))
      .catch(() => {
        /* 缓存的密码对不上，留空让用户重新输入 */
      })
      .finally(() => setLoading(false))
  }, [encryptedBody, onUnlock])

  // 聚焦输入框
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!password || loading) return
    setError('')
    setLoading(true)
    try {
      const plain = await decryptBody(encryptedBody, password)
      setCachedPassword(password) // 缓存，本次会话内其他加密文章自动解锁
      onUnlock(plain)
    } catch {
      setError('密码错误，请重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="password-gate">
      <div className="password-gate__icon" aria-hidden>
        🔒
      </div>
      <p className="password-gate__title">本文已加密</p>
      <p className="password-gate__hint">请输入密码查看全文</p>
      <form className="password-gate__form" onSubmit={handleSubmit}>
        <input
          ref={inputRef}
          type="password"
          className="password-gate__input"
          placeholder="输入密码"
          value={password}
          autoComplete="off"
          onChange={(e) => setPassword(e.target.value)}
          disabled={loading}
        />
        <button type="submit" className="btn" disabled={loading || !password}>
          {loading ? '解锁中…' : '解锁'}
        </button>
      </form>
      {error && <p className="password-gate__error">{error}</p>}
    </div>
  )
}
