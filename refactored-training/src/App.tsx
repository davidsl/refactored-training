import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'
import './App.css'
import Home from './Home'
import About from './About'
import Events from './Events'
import Places from './Places'
import Contact from './Contact'
import Game from './Game'

function App() {
  return (
    <Router>
      <nav>
        <Link to="/">Home</Link> | <Link to="/about">About</Link> |{' '}
        <Link to="/events">Events</Link> | <Link to="/places">Places</Link> |{' '}
        <Link to="/contact">Contact</Link> | <Link to="/game">Game</Link>
      </nav>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/events" element={<Events />} />
        <Route path="/places" element={<Places />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/game" element={<Game />} />
      </Routes>
    </Router>
  )
}

export default App
