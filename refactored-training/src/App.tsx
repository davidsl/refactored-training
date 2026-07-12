import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { useEffect, useState } from 'react'
import './App.css'
import Home from './Home/Home'
import About from './About/About'
import Minesweeper from './Minesweeper/Minesweeper'
import Leaderboard from './Leaderboard/Leaderboard'
import Header from './Header/Header'
import StylingExamples from './StylingExamples/StylingExamples'
import Thumbnails from './Thumbnails/Thumbnails'
import ClickingGame from './ClickingGame/ClickingGame'
import TableDemo from './TableDemo/TableDemo'
import SpyGame from './SpyGame/SpyGame'

type Theme = 'light' | 'dark'

const THEME_STORAGE_KEY = 'refactored-training-theme'

function getInitialTheme(): Theme {
  const savedTheme = window.localStorage.getItem(THEME_STORAGE_KEY)

  if (savedTheme === 'light' || savedTheme === 'dark') {
    return savedTheme
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function App() {
  const [theme, setTheme] = useState<Theme>(getInitialTheme)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    document.documentElement.style.colorScheme = theme
    window.localStorage.setItem(THEME_STORAGE_KEY, theme)
  }, [theme])

  return (
    <Router>
      <Header
        theme={theme}
        onToggleTheme={() => setTheme(currentTheme => (currentTheme === 'light' ? 'dark' : 'light'))}
      />
      <main className="appContent">
        <Routes>
          <Route path="/refactored-training" element={<Home />} />
          <Route path="/refactored-training/about" element={<About />} />
          <Route path="/refactored-training/game" element={<Minesweeper />} />
          <Route path="/refactored-training/leaderboard" element={<Leaderboard />} />
          <Route path="/refactored-training/styling-examples" element={<StylingExamples />} />
          <Route path="/refactored-training/thumbnails" element={<Thumbnails />} />
          <Route path="/refactored-training/clicking-game" element={<ClickingGame />} />
          <Route path="/refactored-training/table" element={<TableDemo />} />
          <Route path="/refactored-training/spy-game" element={<SpyGame />} />
        </Routes>
      </main>
    </Router>
  )
}

export default App
