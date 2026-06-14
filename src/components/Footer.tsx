import { siteConfig } from '../config'

/** 页脚：版权、社交链接、RSS */
export function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="footer">
      <div className="footer__inner">
        <div className="footer__social">
          {siteConfig.social.map((s) => (
            <a
              key={s.href}
              href={s.href}
              target="_blank"
              rel="noopener noreferrer"
            >
              {s.label}
            </a>
          ))}
          <a href="/rss.xml" target="_blank" rel="noopener noreferrer">
            RSS
          </a>
        </div>
        <p className="footer__copy">
          © {year} {siteConfig.author} · Built with Vite + React
        </p>
      </div>
    </footer>
  )
}
