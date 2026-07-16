import styles from './Header.module.css'
import { Link } from 'react-router-dom'
import { useState } from 'react'

type Theme = 'light' | 'dark'

type HeaderProps = {
  theme: Theme
  onToggleTheme: () => void
}

function Header({ theme, onToggleTheme }: HeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div className={styles.headerContainer}>
      <div className={styles.mobileNavBar}>
        <button
          className={menuOpen ? `${styles.menuButton} ${styles.menuButtonOpen}` : styles.menuButton}
          onClick={() => setMenuOpen(m => !m)}
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={menuOpen}
          aria-controls="main-nav"
        >
          <span className={styles.menuIcon} />
        </button>
        <span className={styles.logo}>Menu</span>
      </div>
      <nav id="main-nav" className={`${styles.navMenu} ${menuOpen ? styles.navOpen : styles.navClosed}`}>
        <Link to="/" onClick={() => setMenuOpen(false)}>Home</Link>
        <Link to="/about" onClick={() => setMenuOpen(false)}>About</Link>
        <Link to="/game" onClick={() => setMenuOpen(false)}>Minesweeper</Link>
        <Link to="/leaderboard" onClick={() => setMenuOpen(false)}>Leaderboard</Link>
        <Link to="/styling-examples" onClick={() => setMenuOpen(false)}>Styling Examples</Link>
        <Link to="/clicking-game" onClick={() => setMenuOpen(false)}>Clicking Game</Link>
        <Link to="/table" onClick={() => setMenuOpen(false)}>Table</Link>
        <Link to="/spy-game" onClick={() => setMenuOpen(false)}>Spy Game</Link>
        <button
          type="button"
          className={styles.themeToggle}
          onClick={onToggleTheme}
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {theme === 'dark' ? 'Light mode' : 'Dark mode'}
        </button>
      </nav>
    </div>
  )
}

export default Header
