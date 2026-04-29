import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './Frontend/Styles/Login.css'
import Dashboard from './Frontend/Pages/usuario/Dashboard'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Dashboard />
  </StrictMode>
)
