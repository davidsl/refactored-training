import styles from './Header.module.css'
import { Link } from 'react-router-dom'

function Header() {
  return (
    <div className={styles.headerContainer}>
      <nav>
        <Link to="/">Home</Link> | <Link to="/about">About</Link> |{' '}
        <Link to="/events">Events</Link> | <Link to="/places">Places</Link> |{' '}
        <Link to="/contact">Contact</Link> | <Link to="/game">Game</Link> |{' '}
        <Link to="/leaderboard">Leaderboard</Link>
      </nav>
    </div>
  )
}

export default Header
