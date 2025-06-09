import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import './App.css'
import Home from './Home/Home'
import About from './About/About'
import Events from './Events/Events'
import Places from './Places/Places'
import Contact from './Contact/Contact'
import Minesweeper from './Minesweeper/Minesweeper'
import Leaderboard from './Leaderboard/Leaderboard'
import Header from './Header/Header'

function App() {
  return (
    <Router>
      <Header />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/events" element={<Events />} />
          <Route path="/places" element={<Places />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/game" element={<Minesweeper />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
        </Routes>
    </Router>
  )
}

export default App
