import styles from './Header.module.css'
import { Link, NavLink } from 'react-router-dom'
import StylingExamples from '../StylingExamples/StylingExamples'

function Header() {
  return (
    <div className={styles.headerContainer}>
      <nav className={styles.nav}>
        <Link to="/">Home</Link> | <Link to="/about">About</Link> |{' '}
        <Link to="/events">Events</Link> | <Link to="/places">Places</Link> |{' '}
        <Link to="/contact">Contact</Link> | <Link to="/game">Minesweeper</Link> |{' '}
        <Link to="/leaderboard">Leaderboard</Link> |{' '}
        <NavLink to="/styling-examples" className={({ isActive }) => isActive ? styles.active : ''}>
          Styling Examples
        </NavLink>
      </nav>
    </div>
  )
}

export default Header
