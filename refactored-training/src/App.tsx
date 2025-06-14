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
import StylingExamples from './StylingExamples/StylingExamples'

function App() {
  return (
    <Router>
      <Header />
        <Routes>
          <Route path="/refactored-training" element={<Home />} />
          <Route path="/refactored-training/about" element={<About />} />
          <Route path="/refactored-training/events" element={<Events />} />
          <Route path="/refactored-training/places" element={<Places />} />
          <Route path="/refactored-training/contact" element={<Contact />} />
          <Route path="/refactored-training/game" element={<Minesweeper />} />
          <Route path="/refactored-training/leaderboard" element={<Leaderboard />} />
          <Route path="/refactored-training/styling-examples" element={<StylingExamples />} />
        </Routes>
    </Router>
  )
}

export default App
