import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import gameLogo from './assets/logo.png'

document.querySelector('link[rel="icon"]')?.setAttribute('href', gameLogo)

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
