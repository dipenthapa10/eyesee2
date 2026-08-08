import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import favicon from './assets/favicon.png'

const faviconLink = document.querySelector('link[rel="icon"]')
faviconLink?.setAttribute('type', 'image/png')
faviconLink?.setAttribute('sizes', '512x512')
faviconLink?.setAttribute('href', `${favicon}?v=3`)

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
