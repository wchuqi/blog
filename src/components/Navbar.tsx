import { NavLink, Link } from 'react-router-dom'
import { siteConfig } from '../config'
import { useTheme } from '../hooks/useTheme'
import { SearchBox } from './SearchBox'

/** 顶部导航栏：站点标题、导航链接、搜索、主题切换 */
export function Navbar() {
  const { theme, toggle } = useTheme()

  return (
    <header className="navbar">
      <div className="navbar__inner">
        <Link to="/" className="navbar__brand">
          {siteConfig.title}
        </Link>

        <nav className="navbar__nav" aria-label="主导航">
          {siteConfig.nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                'navbar__link' + (isActive ? ' navbar__link--active' : '')
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="navbar__actions">
          <SearchBox />
          <button
            type="button"
            className="navbar__theme"
            onClick={toggle}
            aria-label={theme === 'dark' ? '切换到浅色模式' : '切换到深色模式'}
            title={theme === 'dark' ? '切换到浅色模式' : '切换到深色模式'}
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
        </div>
      </div>
    </header>
  )
}
