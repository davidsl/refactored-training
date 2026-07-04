import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { MOTION_PRESET_CLASS } from './motionPreset'

document.body.classList.add(MOTION_PRESET_CLASS)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
)
