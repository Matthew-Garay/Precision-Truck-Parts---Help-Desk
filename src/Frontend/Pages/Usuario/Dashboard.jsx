import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard, ClipboardList, ShoppingCart,
  BookOpen, LogOut, Plus, Sun, Moon,
  Menu, X, FilePlus, Settings
} from "lucide-react";
import NuevoReporte from "./NuevoReporte";
import HistorialIncidencias from "./HistorialIncidencias";
import ManualesIncidencias from "./ManualesIncidencias";
import SolicitudInsumo from "./SolicitudInsumo";
import VistaTicket from "./VistaTicket";
import ConfiguracionPerfil from "./ConfiguracionPerfil";
import { apiFetch } from "../../Config/api";
import { LIGHT, DARK } from "../../Config/theme.jsx";
import { SeccionEstadisticas, SeccionMetricasUsuario, KanbanBoard, PanelDerecho } from "../../Components/DashboardShared.jsx";
import CampanaNotificaciones from "../../Components/CampanaNotificaciones.jsx";
import { ToastProvider } from "../../Components/Feedback.jsx";
import { useSocket } from "../../Config/useSocket.js";

const NAV = [
  { icon: LayoutDashboard, label: "Dashboard",               path: "/usuario/dashboard"                    },
  { icon: FilePlus,        label: "Nuevo Reporte",            path: "/usuario/nuevo"              },
  { icon: ClipboardList,   label: "Historial de Incidencias", path: "/usuario/historial"          },
  { icon: ShoppingCart,    label: "Solicitud de Insumo",      path: "/usuario/insumo" },
  { icon: BookOpen,        label: "Manuales de Incidencias",  path: "/usuario/manuales"           },
  { icon: Settings,        label: "Configuración",            path: "/usuario/configuracion"      },
];

// -- SIDEBAR CONTENT ------------------------------------------
function SidebarContent({ T, activo, onNavigate, onClose, onLogout }) {
  return (
    <div className="relative flex flex-col h-full">

      {/* Logo */}
      <div className="flex flex-col items-center justify-center py-4 px-4"
        style={{ borderBottom: `1px solid rgba(255,255,255,0.06)` }}>
        <button onClick={() => { onNavigate("/usuario/dashboard"); onClose?.(); }} className="focus:outline-none"
          style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}>
          <img src="/assets/img/log .png" alt="PTP"
            className="object-contain transition-opacity hover:opacity-80"
            style={{ height: "80px", width: "auto", maxWidth: "190px" }} />
        </button>
      </div>

      {onClose && (
        <button onClick={onClose} className="absolute top-4 right-4 transition-colors"
          style={{ color: T.sidebarText }}
          onMouseEnter={e => e.currentTarget.style.color = "#fff"}
          onMouseLeave={e => e.currentTarget.style.color = T.sidebarText}>
          <X size={17} />
        </button>
      )}

      <p className="px-5 pt-5 pb-2 text-[9px] font-bold uppercase tracking-[0.18em]"
        style={{ color: "rgba(255,255,255,0.2)" }}>
        Menú principal
      </p>

      <nav className="flex flex-col gap-0.5 flex-1 px-3">
        {NAV.map((item, i) => (
          <button key={i} onClick={() => { onNavigate(item.path); onClose?.(); }}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all w-full text-left relative"
            style={{
              background: activo === i ? `linear-gradient(135deg, ${T.orange}, #d97400)` : "transparent",
              color: activo === i ? "#fff" : T.sidebarText,
              boxShadow: activo === i ? `0 4px 12px rgba(244,121,32,0.35)` : "none",
            }}
            onMouseEnter={e => { if (activo !== i) { e.currentTarget.style.background = "rgba(255,255,255,0.06)"; e.currentTarget.style.color = "#fff"; }}}
            onMouseLeave={e => { if (activo !== i) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = T.sidebarText; }}}
          >
            <item.icon size={16} strokeWidth={activo === i ? 2.5 : 1.8} style={{ flexShrink: 0 }} />
            <span style={{ fontSize: "12.5px", fontWeight: activo === i ? 700 : 500, lineHeight: "1.3", flex: 1 }}>
              {item.label}
            </span>
            {item.pronto && (
              <span className="text-[8px] font-black px-1.5 py-0.5 rounded-full flex-shrink-0"
                style={{ background: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.45)", letterSpacing: "0.05em" }}>
                PRONTO
              </span>
            )}
          </button>
        ))}
      </nav>

      <div className="px-3 pb-4 pt-2" style={{ borderTop: `1px solid rgba(255,255,255,0.06)` }}>
        <button
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all w-full"
          style={{ color: T.sidebarText }}
          onMouseEnter={e => { e.currentTarget.style.background = "rgba(239,68,68,0.1)"; e.currentTarget.style.color = "#ef4444"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = T.sidebarText; }}
          onClick={onLogout}
        >
          <LogOut size={16} strokeWidth={1.8} style={{ flexShrink: 0 }} />
          <span style={{ fontSize: "12.5px", fontWeight: 500 }}>Cerrar sesión</span>
        </button>
      </div>
    </div>
  );
}

function Sidebar({ T, activo, onNavigate, onLogout }) {
  return (
    <aside className="hidden md:flex flex-shrink-0 flex-col sticky top-0 h-screen"
      style={{ width: "220px", background: "#000000", boxShadow: "2px 0 12px rgba(0,0,0,0.15)" }}>
      <SidebarContent T={T} activo={activo} onNavigate={onNavigate} onLogout={onLogout} />
    </aside>
  );
}

function SidebarMobile({ T, activo, onNavigate, open, onClose, onLogout }) {
  if (!open) return null;
  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden" onClick={onClose} />
      <aside className="fixed top-0 left-0 z-50 flex flex-col h-screen md:hidden"
        style={{ width: "260px", background: "#000000" }}>
        <SidebarContent T={T} activo={activo} onNavigate={onNavigate} onClose={onClose} onLogout={onLogout} />
      </aside>
    </>
  );
}

// -- LAYOUT PRINCIPAL ------------------------------------------
export default function UsuarioDashboard({ usuario = {}, onLogout, onUsuarioActualizado }) {
  const [dark,        setDark]        = useState(() => localStorage.getItem("theme") === "dark");
  const toggleDark = (v) => { setDark(v); localStorage.setItem("theme", v ? "dark" : "light"); };
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [tickets,     setTickets]     = useState([]);
  const [ticketVer,   setTicketVer]   = useState(null);
  const [errorRed,    setErrorRed]    = useState(false);
  const [ultimaActualizacion, setUltimaActualizacion] = useState(null);
  const [notificaciones, setNotificaciones] = useState([]);

  const agregarNotif = useCallback((notif) => {
    setNotificaciones(prev => [{ id: Date.now(), ts: Date.now(), ...notif }, ...prev].slice(0, 20));
  }, []);

  const recargarHistorialRef = useRef(null);
  // Ref estable para cargarTickets — evita que el callback del socket capture
  // una versión stale de la función antes de que esté definida
  const cargarTicketsRef = useRef(null);

  useSocket(usuario?.id_empleado, useCallback(({ tipo, data }) => {
    agregarNotif({ tipo, data });
    if (tipo === "ticket:actualizado" || tipo === "ticket:en_atencion" || tipo === "solicitud:actualizada") {
      cargarTicketsRef.current?.();
      recargarHistorialRef.current?.();
    }
  }, [agregarNotif]));

  const navigate = useNavigate();
  const location = useLocation();
  const activo    = NAV.findIndex(n => location.pathname.startsWith(n.path));
  const activoIdx = activo === -1 ? 0 : activo;
  const onNavigate = (path) => { setTicketVer(null); navigate(path); };

  useEffect(() => {
    setTicketVer(null);
  }, [location.pathname]);

  const T = dark ? DARK : LIGHT;
  const nombreCompleto = [usuario.nombre, usuario.ap_paterno, usuario.ap_materno].filter(Boolean).join(" ") || "-";
  const departamento   = usuario.departamento || "-";

  const ticketVerRef = useRef(null);
  ticketVerRef.current = ticketVer;

  const cargarTickets = useCallback(() => {
    if (!usuario?.id_empleado) return;
    apiFetch(`/api/tickets/empleado/${usuario.id_empleado}`)
      .then(r => r.json())
      .then(data => {
        if (!Array.isArray(data)) return;
        setErrorRed(false);
        setUltimaActualizacion(new Date());
        setTickets(prev => JSON.stringify(prev) === JSON.stringify(data) ? prev : data);
        if (ticketVerRef.current) {
          const actualizado = data.find(t => t.id_ticket === ticketVerRef.current.id_ticket);
          if (actualizado) setTicketVer(actualizado);
        }
      })
      .catch((err) => { console.error("[Usuario] Error cargando tickets:", err.message); setErrorRed(true); });
  }, [usuario?.id_empleado]);

  useEffect(() => {
    cargarTicketsRef.current = cargarTickets;
    cargarTickets();
    const id = setInterval(cargarTickets, 30000);
    return () => clearInterval(id);
  }, [cargarTickets]);

  // Interceptar botón atrás cuando hay ticket abierto
  useEffect(() => {
    if (!ticketVer) return;
    const handlePop = () => { setTicketVer(null); cargarTickets(); };
    window.addEventListener('popstate', handlePop);
    return () => window.removeEventListener('popstate', handlePop);
  }, [ticketVer, cargarTickets]);

  const irDashboard    = () => { onNavigate('/usuario/dashboard'); };
  const volverDeTicket = () => { setTicketVer(null); cargarTickets(); };

  const tituloHeader = ticketVer
    ? ticketVer.folio_ticket
    : NAV[activoIdx]?.label || 'Dashboard';

  return (
    <ToastProvider T={T}>
    <div className="flex min-h-screen w-full"
      style={{ fontFamily: "'Inter','Segoe UI',sans-serif", background: T.bg }}>

      <Sidebar T={T} activo={activoIdx} onNavigate={onNavigate} onLogout={onLogout} />
      <SidebarMobile T={T} activo={activoIdx} onNavigate={onNavigate}
        open={sidebarOpen} onClose={() => setSidebarOpen(false)} onLogout={onLogout} />

      <div className="flex flex-col flex-1 min-w-0">

        <header className="sticky top-0 z-30 flex items-center justify-between px-3 md:px-5 py-3"
          style={{ background: T.surface, borderBottom: `1px solid ${T.border}`, minHeight: "56px", boxShadow: `0 1px 4px rgba(0,0,0,0.05)` }}>
          {errorRed && (
            <div className="absolute top-0 left-0 right-0 z-50 flex items-center justify-center gap-2 py-1.5 text-xs font-bold"
              style={{ background:"#dc2626", color:"#fff" }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M12 8v4m0 4h.01" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"/><circle cx="12" cy="12" r="9" stroke="#fff" strokeWidth="2"/></svg>
              <span className="hidden sm:inline">Sin conexión con el servidor -</span> datos desactualizados
            </div>
          )}
          <div className="flex items-center gap-2 min-w-0">
            <button className="md:hidden flex items-center justify-center w-9 h-9 rounded-xl flex-shrink-0"
              style={{ background: T.surfaceAlt, color: T.textMuted, border: `1px solid ${T.border}` }}
              onClick={() => setSidebarOpen(true)}>
              <Menu size={17} />
            </button>
            <div className="flex flex-col justify-center min-w-0">
              <div className="flex items-center gap-2">
                <div className="w-0.5 h-5 rounded-full flex-shrink-0" style={{ background: `linear-gradient(180deg, ${T.orange}, #ffb347)` }} />
                <h1 className="text-sm sm:text-base font-black tracking-tight truncate" style={{ color: T.text }}>{tituloHeader}</h1>
              </div>
              <p className="hidden sm:block text-[10px] font-medium ml-3 truncate" style={{ color: T.textMuted }}>
                {NAV[activoIdx]?.label || 'Dashboard'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {ultimaActualizacion && !errorRed && (
              <span className="hidden md:flex items-center gap-1 text-[10px] px-2 py-1 rounded-lg"
                style={{ color: T.textFaint, background: T.surfaceAlt, border: `1px solid ${T.border}` }}>
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#16a34a" }}/>
                {ultimaActualizacion.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })}
              </span>
            )}
            <button onClick={() => toggleDark(!dark)}
              className="flex items-center justify-center h-9 rounded-xl transition-all px-2 gap-1.5"
              style={{ background: T.surfaceAlt, color: dark ? "#f59e0b" : T.textMuted, border: `1px solid ${T.border}` }}>
              {dark ? <Sun size={14} /> : <Moon size={14} />}
              <span className="hidden md:inline text-[11px] font-semibold">{dark ? "Claro" : "Oscuro"}</span>
            </button>
            <CampanaNotificaciones
              T={T}
              notificaciones={notificaciones}
              onDismiss={id => setNotificaciones(p => p.filter(n => n.id !== id))}
              onDismissAll={() => setNotificaciones([])}
              onClickNotif={(n) => {
                if (n.tipo === "ticket:actualizado" || n.tipo === "ticket:en_atencion") {
                  const t = tickets.find(tk => tk.id_ticket === n.data.id_ticket);
                  if (t) { setTicketVer(t); onNavigate("/usuario/dashboard"); }
                  else cargarTickets();
                }
              }}
            />
            <button onClick={() => onNavigate('/usuario/nuevo')}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-white hover:brightness-110 active:scale-95 transition-all"
              style={{ background: `linear-gradient(135deg, ${T.orange}, #d97400)`, boxShadow: "0 4px 14px rgba(244,121,32,0.4)" }}>
              <Plus size={14} strokeWidth={2.5} />
              <span className="hidden sm:inline">Nuevo Reporte</span>
              <span className="sm:hidden">Nuevo</span>
            </button>
          </div>
        </header>

        <div className="flex-1" style={{ background: T.bg }}>
          {ticketVer ? (
            <VistaTicket T={T} ticket={ticketVer} onVolver={volverDeTicket} usuario={usuario} />
          ) : activoIdx === 1 ? (
            <NuevoReporte T={T} solicitante={nombreCompleto} area={departamento} usuario={usuario} onSuccess={irDashboard} />
          ) : activoIdx === 2 ? (
            <HistorialIncidencias T={T} usuario={usuario} onVerTicket={setTicketVer} onRecargarRef={recargarHistorialRef} />
          ) : activoIdx === 3 ? (
            <SolicitudInsumo T={T} usuario={usuario} />
          ) : activoIdx === 4 ? (
            <ManualesIncidencias T={T} />
          ) : activoIdx === 5 ? (
            <ConfiguracionPerfil T={T} usuario={usuario} onUsuarioActualizado={onUsuarioActualizado} />
          ) : (
            <div className="flex flex-col overflow-y-auto">
              <div className="px-3 pt-3 md:px-4 md:pt-4">
                <SeccionMetricasUsuario T={T} tickets={tickets} />
                <SeccionEstadisticas T={T} tickets={tickets} />
              </div>
              <div className="px-3 pt-2 pb-4 md:px-4">
                <KanbanBoard T={T} tickets={tickets} onVerTicket={setTicketVer} inline />
              </div>
            </div>
          )}
        </div>
      </div>

      <PanelDerecho T={T} nombre={nombreCompleto} departamento={departamento}
        foto={usuario.foto ? `/fotos/${usuario.foto.split("/").pop()}` : null}
        tickets={tickets} etiquetaRol="Usuario activo" />
    </div>
    </ToastProvider>
  );
}
