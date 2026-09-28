import styles from './Header.module.css'
import { Link, NavLink } from 'react-router-dom'
import { useState } from 'react'

type Theme = 'light' | 'dark'

type HeaderProps = {
  theme: Theme
  onToggleTheme: () => void
}

const navItems = [
  { to: '/', label: 'Home', end: true },
  { to: '/about', label: 'About' },
  { to: '/game', label: 'Minesweeper' },
  { to: '/leaderboard', label: 'Leaderboard' },
  { to: '/styling-examples', label: 'Styling Examples' },
  { to: '/clicking-game', label: 'Clicking Game' },
  { to: '/table', label: 'Table' },
  { to: '/spy-game', label: 'Spy Game' },
]

function Header({ theme, onToggleTheme }: HeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <header className={styles.headerContainer}>
      <Link className={styles.brand} to="/" onClick={() => setMenuOpen(false)}>
        <span className={styles.brandMark} aria-hidden="true" />
        <span className={styles.brandName}>Training Lab</span>
      </Link>
      <button
        type="button"
        className={menuOpen ? `${styles.menuButton} ${styles.menuButtonOpen}` : styles.menuButton}
        onClick={() => setMenuOpen(m => !m)}
        aria-label={menuOpen ? 'Close menu' : 'Open menu'}
        aria-expanded={menuOpen}
        aria-controls="main-nav"
      >
        <span className={styles.menuIcon} />
      </button>
      <nav
        id="main-nav"
        aria-label="Main navigation"
        className={`${styles.navMenu} ${menuOpen ? styles.navOpen : styles.navClosed}`}
      >
        {navItems.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) => isActive ? styles.navLinkActive : undefined}
            onClick={() => setMenuOpen(false)}
          >
            {item.label}
          </NavLink>
        ))}
        <button
          type="button"
          className={styles.themeToggle}
          onClick={onToggleTheme}
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {theme === 'dark' ? 'Light mode' : 'Dark mode'}
        </button>
      </nav>
    </header>
  )
}

export default Header
