import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import './App.css'
import MapWidget from './MapWidget/MapWidget'
import About from './About/About'
import Minesweeper from './Minesweeper/Minesweeper'
import Leaderboard from './Leaderboard/Leaderboard'
import Header from './Header/Header'
import StylingExamples from './StylingExamples/StylingExamples'
import ClickingGame from './ClickingGame/ClickingGame'
import TableDemo from './TableDemo/TableDemo'
import SpyGame from './SpyGame/SpyGame'
import { GAME_RESULTS_API_ERROR_EVENT, type GameResultsApiErrorDetail } from './api/gameResultsApi'

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
  const [apiAlerts, setApiAlerts] = useState<Array<{ id: number; message: string }>>([])

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    document.documentElement.style.colorScheme = theme
    window.localStorage.setItem(THEME_STORAGE_KEY, theme)
  }, [theme])

  useEffect(() => {
    const onApiError = (event: Event) => {
      const apiEvent = event as CustomEvent<GameResultsApiErrorDetail>
      const detail = apiEvent.detail
      const endpoint = detail.url.replace(window.location.origin, '')
      const statusSuffix = detail.status === null ? '' : ` Status: ${detail.status}.`
      const message = `${detail.message} Endpoint: ${endpoint}.${statusSuffix}`

      setApiAlerts(current => {
        const next = [...current, { id: Date.now(), message }]
        return next.slice(-3)
      })
    }

    window.addEventListener(GAME_RESULTS_API_ERROR_EVENT, onApiError)
    return () => window.removeEventListener(GAME_RESULTS_API_ERROR_EVENT, onApiError)
  }, [])

  return (
    <Router basename={import.meta.env.BASE_URL}>
      <Header
        theme={theme}
        onToggleTheme={() => setTheme(currentTheme => (currentTheme === 'light' ? 'dark' : 'light'))}
      />
      {apiAlerts.length > 0 && (
        <section className="apiAlertStack" aria-live="assertive" aria-atomic="false">
          {apiAlerts.map(alert => (
            <article key={alert.id} className="apiAlert" role="alert">
              <p>{alert.message}</p>
              <button
                type="button"
                className="apiAlertDismiss"
                onClick={() => setApiAlerts(current => current.filter(item => item.id !== alert.id))}
                aria-label="Dismiss API error alert"
              >
                Dismiss
              </button>
            </article>
          ))}
        </section>
      )}
      <main className="appContent">
        <Routes>
          <Route path="/" element={<MapWidget />} />
          <Route path="/about" element={<About />} />
          <Route path="/game" element={<Minesweeper />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/styling-examples" element={<StylingExamples />} />
          <Route path="/clicking-game" element={<ClickingGame />} />
          <Route path="/table" element={<TableDemo />} />
          <Route path="/spy-game" element={<SpyGame />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </Router>
  )
}

export default App
