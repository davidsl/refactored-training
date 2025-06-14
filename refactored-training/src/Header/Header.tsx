import styles from './Header.module.css'
import { Link } from 'react-router-dom'
import { useState } from 'react'

function Header() {
  const [menuOpen, setMenuOpen] = useState(false)
  return (
    <div className={styles.headerContainer}>
      <div className={styles.mobileNavBar}>
        <button
          className={styles.menuButton}
          onClick={() => setMenuOpen(m => !m)}
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
        >
          <span className={styles.menuIcon} />
        </button>
        <span className={styles.logo}>Menu</span>
      </div>
      <nav className={menuOpen ? styles.navOpen : styles.navClosed}>
        <Link to="/refactored-training" onClick={() => setMenuOpen(false)}>Home</Link> |{' '}
        <Link to="/refactored-training/about" onClick={() => setMenuOpen(false)}>About</Link> |{' '}
        <Link to="/refactored-training/events" onClick={() => setMenuOpen(false)}>Events</Link> |{' '}
        <Link to="/refactored-training/places" onClick={() => setMenuOpen(false)}>Places</Link> |{' '}
        <Link to="/refactored-training/contact" onClick={() => setMenuOpen(false)}>Contact</Link> |{' '}
        <Link to="/refactored-training/game" onClick={() => setMenuOpen(false)}>Minesweeper</Link> |{' '}
        <Link to="/refactored-training/leaderboard" onClick={() => setMenuOpen(false)}>Leaderboard</Link> |{' '}
        <Link to="/refactored-training/styling-examples" onClick={() => setMenuOpen(false)}>Styling Examples</Link>
      </nav>
    </div>
  )
}

export default Header
