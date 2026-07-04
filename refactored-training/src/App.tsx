import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import './App.css'
import Home from './Home/Home'
import About from './About/About'
import Minesweeper from './Minesweeper/Minesweeper'
import Leaderboard from './Leaderboard/Leaderboard'
import Header from './Header/Header'
import StylingExamples from './StylingExamples/StylingExamples'
import Thumbnails from './Thumbnails/Thumbnails'
import ClickingGame from './ClickingGame/ClickingGame'

function App() {
  return (
    <Router>
      <Header />
      <main className="appContent">
        <Routes>
          <Route path="/refactored-training" element={<Home />} />
          <Route path="/refactored-training/about" element={<About />} />
          <Route path="/refactored-training/game" element={<Minesweeper />} />
          <Route path="/refactored-training/leaderboard" element={<Leaderboard />} />
          <Route path="/refactored-training/styling-examples" element={<StylingExamples />} />
          <Route path="/refactored-training/thumbnails" element={<Thumbnails />} />
          <Route path="/refactored-training/clicking-game" element={<ClickingGame />} />
        </Routes>
      </main>
    </Router>
  )
}

export default App
