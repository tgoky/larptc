import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'

// iOS standalone (Add to Home Screen) home-screen apps have a WebKit bug where
// 100dvh/100svh under-report the real available height by roughly the home
// indicator's safe-area height. window.innerHeight (and visualViewport.height)
// are not affected, so we mirror the real value into a CSS var and let
// components fall back to it: height: var(--app-vh, 100dvh).
function setAppViewportHeight() {
  const height = window.visualViewport?.height || window.innerHeight;
  document.documentElement.style.setProperty('--app-vh', `${height}px`);
}
setAppViewportHeight();
window.addEventListener('resize', setAppViewportHeight);
window.addEventListener('orientationchange', () => window.setTimeout(setAppViewportHeight, 120));
window.visualViewport?.addEventListener('resize', setAppViewportHeight);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)