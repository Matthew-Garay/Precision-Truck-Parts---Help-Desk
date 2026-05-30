import { StrictMode, useState, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import './Frontend/Styles/login.css'
import Login            from './Frontend/Pages/login'
import AdminDashboard   from './Frontend/Pages/Admin/Dashboard'
import UsuarioDashboard from './Frontend/Pages/Usuario/Dashboard'
import API, { setToken, clearToken, clearSession, apiFetch } from './Frontend/Config/api'
import ErrorBoundary   from './Frontend/Components/ErrorBoundary'

// -- Helpers sesión --------------------------------------------
// Forzar favicon en todas las rutas (algunos navegadores lo cachean por ruta)
const faviconLink = document.querySelector("link[rel='icon']") || document.createElement("link");
faviconLink.rel  = "icon";
faviconLink.type = "image/x-icon";
faviconLink.href = "/assets/img/logo.ico?v=2";
if (!document.querySelector("link[rel='icon']")) document.head.appendChild(faviconLink);
export const getUsuario = () => {
  try {
    const u = JSON.parse(sessionStorage.getItem('usuario') || 'null')
    if (!u) return null
    // Compatibilidad: si viene en formato viejo (nombre concatenado sin ap_paterno)
    if (u.nombre && !u.ap_paterno) {
      const partes = u.nombre.trim().split(/\s+/)
      u.ap_paterno = partes[1] || ''
      u.ap_materno = partes[2] || ''
      u.nombre     = partes[0] || ''
    }
    return u
  } catch { return null }
}
export const setUsuario   = u  => sessionStorage.setItem('usuario', JSON.stringify(u))
export const clearUsuario = () => sessionStorage.removeItem('usuario')
export const getIdAcceso  = () => sessionStorage.getItem('id_acceso')
export const setIdAcceso  = id => sessionStorage.setItem('id_acceso', id)
export const clearIdAcceso= () => sessionStorage.removeItem('id_acceso')

// -- Rutas protegidas ------------------------------------------
function RutaAdmin({ onLogout, onUsuarioActualizado, usuarioActual }) {
  const u = usuarioActual || getUsuario()
  if (!u)                return <Navigate to="/login" replace />
  if (u.rol !== 'admin') return <Navigate to="/usuario/dashboard" replace />
  return <AdminDashboard usuario={u} onLogout={onLogout} onUsuarioActualizado={onUsuarioActualizado} />
}

function RutaUsuario({ onLogout, onUsuarioActualizado, usuarioActual }) {
  const u = usuarioActual || getUsuario()
  if (!u)                  return <Navigate to="/login" replace />
  if (u.rol !== 'usuario') return <Navigate to="/admin/dashboard" replace />
  return <UsuarioDashboard usuario={u} onLogout={onLogout} onUsuarioActualizado={onUsuarioActualizado} />
}


// -- Pantalla de cierre de sesión ------------------------------
function PantallaSalida() {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center gap-6"
      style={{ background: '#000000', fontFamily: "'Inter','Segoe UI',sans-serif", zIndex: 9999 }}>
      <div className="relative flex flex-col items-center gap-6">
        <img src="/assets/img/logo.png" alt="PTP" className="h-20 object-contain drop-shadow-2xl" />
        <div className="w-16 h-0.5 rounded-full" style={{ background: 'linear-gradient(90deg, transparent, #F47920, transparent)' }} />
        <div className="flex flex-col items-center gap-1">
          <p className="text-white text-lg font-black tracking-widest uppercase">Cerrando sesión</p>
          <p className="text-white/40 text-xs font-medium">Hasta pronto...</p>
        </div>
        <div className="w-48 h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.1)' }}>
          <div className="h-full rounded-full" style={{ background: 'linear-gradient(90deg, #F47920, #ffb347)', animation: 'progress 1.2s ease-in-out forwards' }} />
        </div>
        <div className="flex gap-2">
          {[0, 1, 2].map(i => (
            <div key={i} className="w-2.5 h-2.5 rounded-full"
              style={{ background: '#F47920', animation: `bounce 0.9s ease-in-out ${i * 0.2}s infinite` }} />
          ))}
        </div>
      </div>
      <style>{`
        @keyframes bounce  { 0%,100%{transform:translateY(0);opacity:0.3} 50%{transform:translateY(-10px);opacity:1} }
        @keyframes progress{ 0%{width:0%} 100%{width:100%} }
      `}</style>
    </div>
  )
}

// -- App raíz --------------------------------------------------
function App() {
  const navigate = useNavigate()
  const [saliendo, setSaliendo] = useState(false)
  const [usuarioActual, setUsuarioActual] = useState(getUsuario)

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
  // sendBeacon no puede enviar headers personalizados, por eso /logout está
  // exento de CSRF en security.js. Es seguro porque no modifica datos críticos.
  useEffect(() => {
    const cerrarAlSalir = () => {
      const idAcceso = sessionStorage.getItem('id_acceso')
      if (!idAcceso) return
      navigator.sendBeacon(
        `${API}/api/auth/logout`,
        new Blob(
          [JSON.stringify({ id_acceso: parseInt(idAcceso) })],
          { type: 'application/json' }
        )
      )
    }
    window.addEventListener('beforeunload', cerrarAlSalir)
    return () => window.removeEventListener('beforeunload', cerrarAlSalir)
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

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </BrowserRouter>
  </StrictMode>
)
