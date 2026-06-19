/**
 * main.jsx
 *
 * Punto de entrada del frontend de PrecisionTrucks HelpDesk.
 * Monta el arbol de React en el elemento #root del index.html.
 *
 * Responsabilidades:
 *
 * 1. Proveedores globales:
 *    - ThemeProvider  : gestiona el tema claro/oscuro y lo sincroniza con localStorage
 *    - ToastProvider  : expone la API de toasts visuales a todo el arbol
 *    - BrowserRouter  : provee el historial de navegacion del lado del cliente
 *    - ErrorBoundary  : captura errores de renderizado y muestra pantalla de error
 *
 * 2. Rutas protegidas:
 *    RutaAdmin  : redirige a /login si el usuario no tiene rol 'admin'
 *    RutaUsuario: redirige a /login si el usuario no tiene rol 'usuario'
 *
 * 3. Arbol de rutas:
 *    /login           - pantalla de autenticacion
 *    /admin/*         - dashboard completo del administrador (componente persistente)
 *    /usuario/*       - dashboard completo del usuario (componente persistente)
 *    /                - redirige segun el rol almacenado en sessionStorage
 *    /*               - cualquier ruta desconocida redirige a /login
 *
 * 4. Ciclo de sesion:
 *    - Al montar, renueva el JWT via POST /api/auth/refresh-token para detectar
 *      expiración despues de una recarga de pagina.
 *    - Al cerrar la pestana (evento pagehide), envia el logout con navigator.sendBeacon
 *      para cerrar la sesion del historial_acceso de forma no bloqueante.
 *    - El logout manual muestra PantallaSalida durante 1.2 segundos antes de redirigir.
 *
 * 5. Favicon:
 *    Se establece dinamicamente dentro de useEffect para evitar errores en entornos SSR.
 */
import { StrictMode, useState, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import './Frontend/Styles/login.css'
import './Frontend/Styles/design-system.css'
import Login            from './Frontend/Pages/login'
import AdminDashboard   from './Frontend/Pages/Admin/Dashboard'
import UsuarioDashboard from './Frontend/Pages/Usuario/Dashboard'
import API_BASE, { setToken, clearSession, apiFetch } from './Frontend/Config/api'
import ErrorBoundary   from './Frontend/Components/ErrorBoundary'
import { ToastProvider } from './Frontend/Components/Feedback.jsx'
import { ThemeProvider } from './Frontend/Config/ThemeContext.jsx'
import { useTheme } from './Frontend/Config/themeContext.js'
import { getUsuario, setUsuario, setIdAcceso } from './Frontend/Config/session.js'

const useThemeCtx = useTheme

// -- Rutas protegidas ------------------------------------------
function RutaAdmin({ onLogout, onUsuarioActualizado, usuarioActual }) {
  const u = getUsuario()
  if (!u || u.rol !== 'admin') return <Navigate to="/login" replace />
  return <AdminDashboard usuario={usuarioActual || u} onLogout={onLogout} onUsuarioActualizado={onUsuarioActualizado} />
}

function RutaUsuario({ onLogout, onUsuarioActualizado, usuarioActual }) {
  const u = getUsuario()
  if (!u || u.rol !== 'usuario') return <Navigate to="/login" replace />
  return <UsuarioDashboard usuario={usuarioActual || u} onLogout={onLogout} onUsuarioActualizado={onUsuarioActualizado} />
}

// -- App raíz --------------------------------------------------
function App() {
  const navigate = useNavigate()
  const [saliendo, setSaliendo] = useState(false)
  const [usuarioActual, setUsuarioActual] = useState(getUsuario)

  // Fix #11: mover manipulación del favicon dentro de useEffect para evitar
  // errores en entornos SSR/testing y respetar el ciclo de vida de React
  useEffect(() => {
    let link = document.querySelector("link[rel='icon']");
    if (!link) {
      link = document.createElement("link");
      document.head.appendChild(link);
    }
    link.rel  = "icon";
    link.type = "image/x-icon";
    link.href = "/assets/img/logo.ico?v=2";
  }, [])

  // -- Rehidratar token al recargar la página ------------------
  // El token ya fue rehidratado desde sessionStorage en api.js.
  // Aqui solo lo renovamos contra el backend para detectar expiración.
  useEffect(() => {
    const u = getUsuario()
    if (!u) return
    apiFetch('/api/auth/refresh-token', { method: 'POST' })
      .then(async (res) => {
        if (res.ok) {
          const data = await res.json()
          if (data.token) setToken(data.token)
        }
        // Si falla (401), apiFetch ya llama clearSession() automáticamente
      })
      .catch(() => {})
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleUsuarioActualizado = (nuevoUsuario) => {
    setUsuario(nuevoUsuario)
    setUsuarioActual(nuevoUsuario)
  }

  const handleLogout = () => {
    setSaliendo(true)
    const idAcceso = sessionStorage.getItem('id_acceso')
    if (idAcceso) {
      apiFetch('/api/auth/logout', {
        method: 'POST',
        body: { id_acceso: parseInt(idAcceso) },
      }).catch(() => {})
    }
    setTimeout(() => {
      clearSession()
      setSaliendo(false)
      navigate('/login', { replace: true })
    }, 1200)
  }

  // -- Cierre de sesión al cerrar pestaña/navegador ---------------------
  // Usamos pagehide en lugar de beforeunload para no cerrar sesión en F5/recarga.
  // event.persisted=true significa que la página va a bfcache (navegar atrás),
  // en ese caso tampoco cerramos sesión.
  useEffect(() => {
    const cerrarAlSalir = (e) => {
      if (e.persisted) return  // bfcache — no es cierre real
      const idAcceso = sessionStorage.getItem('id_acceso')
      if (!idAcceso) return
      navigator.sendBeacon(
        `${API_BASE}/api/auth/logout`,
        new Blob(
          [JSON.stringify({ id_acceso: parseInt(idAcceso) })],
          { type: 'application/json' }
        )
      )
    }
    window.addEventListener('pagehide', cerrarAlSalir)
    return () => window.removeEventListener('pagehide', cerrarAlSalir)
  }, [])

  if (saliendo) return <PantallaSalida />

  return (
    <Routes>
      <Route path="/login" element={
        <Login onLogin={(u, idAcceso, token) => {
          setUsuario(u)
          if (idAcceso) setIdAcceso(idAcceso)
          if (token) setToken(token)
          navigate(u.rol === 'admin' ? '/admin/dashboard' : '/usuario/dashboard', { replace: true })
        }} />
      } />

      {/* Admin - un solo componente persistente para todas las sub-rutas */}
      <Route path="/admin/*" element={<RutaAdmin onLogout={handleLogout} onUsuarioActualizado={handleUsuarioActualizado} usuarioActual={usuarioActual} />} />

      {/* Usuario - un solo componente persistente para todas las sub-rutas */}
      <Route path="/usuario/*" element={<RutaUsuario onLogout={handleLogout} onUsuarioActualizado={handleUsuarioActualizado} usuarioActual={usuarioActual} />} />

      {/* Raíz → redirige según sesión */}
      <Route path="/" element={<Navigate to={(() => {
        const u = getUsuario()
        return u?.rol === 'admin' ? '/admin/dashboard' : u?.rol === 'usuario' ? '/usuario/dashboard' : '/login'
      })()} replace />} />

      {/* Ruta desconocida → login */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}

function Root() {
  return (
    <ThemeProvider>
      <RootInner />
    </ThemeProvider>
  )
}

function RootInner() {
  const { T } = useThemeCtx()
  return (
    <ToastProvider T={T}>
      <App />
    </ToastProvider>
  )
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <ErrorBoundary>
        <Root />
      </ErrorBoundary>
    </BrowserRouter>
  </StrictMode>
)
