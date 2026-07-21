import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard, ClipboardList,
  BookOpen, LogOut, Plus, Sun, Moon,
  Menu, X, FilePlus, Settings, Package
} from "lucide-react";
import { useAutoRefresh } from "../../Config/useAutoRefresh";
import NuevoReporte from "./NuevoReporte";
import HistorialIncidencias from "./HistorialIncidencias";
import ManualesIncidencias from "./ManualesIncidencias";
import SolicitudInsumo from "./SolicitudInsumo";
import VistaTicket from "./VistaTicket";
import VistaSolicitud from "./VistaSolicitud";
import ConfiguracionPerfil from "./ConfiguracionPerfil";
import { apiFetch, API_ROUTES } from "../../Config/api";
import { useTheme } from "../../Config/themeContext.js";
import { SeccionEstadisticas, SeccionMetricasUsuario, KanbanBoard, PanelDerecho } from "../../Components/DashboardShared.jsx";
import CampanaNotificaciones from "../../Components/CampanaNotificaciones.jsx";
import { useTicketNotification } from "../../Config/useTicketNotification.js";

const NAV = [
  { icon: LayoutDashboard, label: "Dashboard",               path: "/usuario/dashboard"        },
  { icon: FilePlus,        label: "Nuevo Reporte",            path: "/usuario/nuevo"            },
  { icon: ClipboardList,   label: "Historial de Incidencias", path: "/usuario/historial"        },
  { icon: Package,         label: "Gestión de Insumos",        path: "/usuario/solicitar"        },
  { icon: BookOpen,        label: "Manuales de Incidencias",  path: "/usuario/manuales"         },
  { icon: Settings,        label: "Configuración",            path: "/usuario/configuracion"    },

];

// -- SIDEBAR CONTENT ------------------------------------------
function SidebarContent({ T, activo, onNavigate, onClose, onLogout }) {
  return (
    <div className="relative flex flex-col h-full">

      {/* Logo */}
      <div className="flex flex-col items-center justify-center px-4"
        style={{ borderBottom: `1px solid rgba(255,255,255,0.06)`, paddingTop: "clamp(16px,2.5vh,28px)", paddingBottom: "clamp(14px,2vh,24px)" }}>
        <button onClick={() => onNavigate("/usuario/dashboard")} className="focus:outline-none" style={{ cursor: "pointer" }}>
          <img src="/assets/img/logo.png" alt="PTP"
            className="object-contain"
            style={{ height: "clamp(72px,10vh,110px)", width: "auto", maxWidth: "200px", mixBlendMode: "screen" }} />
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

      <p className="px-5 pb-2 font-bold uppercase tracking-[0.18em]"
        style={{ color: "rgba(255,255,255,0.45)", fontSize: "var(--fs-label)", paddingTop: "clamp(8px,1.5vh,20px)" }}>
        Menú principal
      </p>
      <div style={{ height: "1px", background: "rgba(255,255,255,0.18)", marginLeft: "20px", marginRight: "20px", marginBottom: "6px" }} />

      <nav className="flex flex-col gap-0.5 flex-1 px-3">
        {NAV.map((item, i) => (
          <button key={i} onClick={() => { onNavigate(item.path); onClose?.(); }}
            className="flex items-center gap-3 px-3 rounded-xl transition-all w-full text-left relative"
            style={{
              background: activo === i ? `linear-gradient(135deg, ${T.orange}, #d97400)` : "transparent",
              color: activo === i ? "#fff" : T.sidebarText,
              boxShadow: activo === i ? `0 4px 12px rgba(244,121,32,0.35)` : "none",
              paddingTop: "clamp(6px,0.9vh,10px)",
              paddingBottom: "clamp(6px,0.9vh,10px)",
            }}
            onMouseEnter={e => { if (activo !== i) { e.currentTarget.style.background = "rgba(255,255,255,0.06)"; e.currentTarget.style.color = "#fff"; }}}
            onMouseLeave={e => { if (activo !== i) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = T.sidebarText; }}}
          >
            <item.icon size={16} strokeWidth={activo === i ? 2.5 : 1.8} style={{ flexShrink: 0, width: "var(--icon-nav)", height: "var(--icon-nav)" }} />
            <span style={{ fontSize: "var(--fs-nav)", fontWeight: activo === i ? 700 : 500, lineHeight: "1.3", flex: 1 }}>
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
          <span style={{ fontSize: "var(--fs-nav)", fontWeight: 500 }}>Cerrar sesión</span>
        </button>
      </div>
    </div>
  );
}

function Sidebar({ T, activo, onNavigate, onLogout }) {
  return (
    <aside className="hidden lg:flex flex-shrink-0 flex-col sticky top-0 h-[100dvh] overflow-hidden"
      style={{ width: "var(--sidebar-w)", minWidth: 0, background: T.sidebar, boxShadow: "2px 0 12px rgba(0,0,0,0.15)" }}>
      <SidebarContent T={T} activo={activo} onNavigate={onNavigate} onLogout={onLogout} />
    </aside>
  );
}

function SidebarMobile({ T, activo, onNavigate, open, onClose, onLogout }) {
  if (!open) return null;
  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden" onClick={onClose} />
      <aside className="fixed top-0 left-0 z-50 flex flex-col h-[100dvh] overflow-y-auto lg:hidden"
        style={{ width: "min(260px, 80vw)", background: T.sidebar }}>
        <SidebarContent T={T} activo={activo} onNavigate={onNavigate} onClose={onClose} onLogout={onLogout} />
      </aside>
    </>
  );
}

// -- LAYOUT PRINCIPAL ------------------------------------------
export default function UsuarioDashboard({ usuario = {}, onLogout, onUsuarioActualizado }) {
  const { dark, toggleDark, T } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [tickets,      setTickets]     = useState([]);
  const [solicitudes,  setSolicitudes] = useState([]);
  const [ticketVer,    setTicketVer]   = useState(null);
  const [solicitudVer, setSolicitudVer] = useState(null);
  const [errorRed,     setErrorRed]    = useState(false);
  const [ultimaActualizacion, setUltimaActualizacion] = useState(null);
  const navigate = useNavigate();
  const location  = useLocation();

  const recargarHistorialRef  = useRef(null);
  const cargarTicketsRef      = useRef(null);
  const cargarSolicitudesRef  = useRef(null);
  const ticketsRef            = useRef(tickets);
  ticketsRef.current          = tickets;

  const { notificaciones, onDismiss, onDismissAll, onClickNotif } =
    useTicketNotification({
      usuario,
      onNavegar: useCallback((tipo, data) => {
        if (["ticket:actualizado", "ticket:en_atencion", "ticket:confirmado", "solicitud:actualizada"].includes(tipo)) {
          cargarTicketsRef.current?.();
          recargarHistorialRef.current?.();
          if (tipo === "solicitud:actualizada") cargarSolicitudesRef.current?.();
        }
        if (["ticket:actualizado", "ticket:en_atencion", "ticket:confirmado"].includes(tipo) && data?.id_ticket) {
          const abrir = (t) => { if (t?.id_ticket) { setTicketVer(t); navigate("/usuario/dashboard"); } };
          const enMemoria = ticketsRef.current.find(tk => tk.id_ticket === data.id_ticket);
          if (enMemoria) { abrir(enMemoria); }
          else {
            apiFetch(API_ROUTES.TICKET(data.id_ticket))
              .then(r => r.ok ? r.json() : null)
              .then(abrir)
              .catch(() => {});
          }
        }
        if (tipo === "solicitud:actualizada" && data?.id_solicitud) {
          navigate("/usuario/dashboard");
          setSolicitudVer({ id_solicitud: data.id_solicitud });
        }
      // eslint-disable-next-line react-hooks/exhaustive-deps
      }, [navigate]),
    });

  const activo    = NAV.findIndex(n => location.pathname.startsWith(n.path));
  const activoIdx = activo === -1 ? 0 : activo;
  const onNavigate = (path) => {
    if (path !== location.pathname) {
      setTicketVer(null);
      setSolicitudVer(null);
    }
    navigate(path);
  };

  const solicitudVerRef = useRef(null);
  const skipResetRef    = useRef(false);

  useEffect(() => {
    if (skipResetRef.current) {
      skipResetRef.current = false;
      return;
    }
    if (solicitudVerRef.current) {
      setSolicitudVer(solicitudVerRef.current);
      solicitudVerRef.current = null;
      return;
    }
    // Solo limpiar vistas si no hay un ticket abierto desde historial
    if (!ticketVer) setTicketVer(null);
    setSolicitudVer(null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  const nombreCompleto = [usuario.nombre, usuario.ap_paterno, usuario.ap_materno].filter(Boolean).join(" ") || "-";
  const departamento   = usuario.departamento || "-";

  const ticketVerRef = useRef(null);
  ticketVerRef.current = ticketVer;

  const cargarTickets = useCallback(() => {
    if (!usuario?.id_empleado) return;
    apiFetch(`/api/tickets/empleado/${usuario.id_empleado}`)
      .then(r => r.json())
      .then(res => {
        const data = Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : null;
        if (!data) return;
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

  const cargarSolicitudes = useCallback(() => {
    if (!usuario?.id_empleado) return;
    apiFetch(API_ROUTES.SOLICITUDES_EMP(usuario.id_empleado))
      .then(r => r.json())
      .then(res => {
        const data = Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : [];
        setSolicitudes(data);
      })
      .catch(err => console.error("[Usuario] Error cargando solicitudes:", err.message));
  }, [usuario?.id_empleado]);

  useEffect(() => {
    cargarTicketsRef.current     = cargarTickets;
    cargarSolicitudesRef.current = cargarSolicitudes;
    cargarTickets();
    cargarSolicitudes();
  }, [cargarTickets, cargarSolicitudes]);

  useAutoRefresh(() => { cargarTickets(); cargarSolicitudes(); }, 30000, [cargarTickets, cargarSolicitudes]);

  // Interceptar botón atrás cuando hay ticket o solicitud abierta
  useEffect(() => {
    if (!ticketVer && !solicitudVer) return;
    const handlePop = () => {
      if (ticketVer) { setTicketVer(null); cargarTickets(); }
      else { setSolicitudVer(null); cargarSolicitudes(); }
    };
    window.addEventListener('popstate', handlePop);
    return () => window.removeEventListener('popstate', handlePop);
  }, [ticketVer, solicitudVer, cargarTickets, cargarSolicitudes]);

  const irDashboard      = () => { onNavigate('/usuario/dashboard'); };
  const volverDeTicket   = () => { setTicketVer(null); cargarTickets(); };
  const volverDeSolicitud = () => { setSolicitudVer(null); cargarSolicitudes(); };

  const handleVerSolicitud = (item) => {
    if (location.pathname !== '/usuario/dashboard') {
      solicitudVerRef.current = item;
      navigate('/usuario/dashboard');
    } else {
      setSolicitudVer(item);
    }
  };

  const tituloHeader = ticketVer
    ? ticketVer.folio_ticket
    : solicitudVer
      ? solicitudVer.folio_solicitud
      : NAV[activoIdx]?.label || 'Dashboard';

  return (
    <div className="flex h-[100dvh] w-full overflow-hidden"
      style={{ fontFamily: "var(--font-sans, 'Inter','Segoe UI',sans-serif)", background: T.bg }}>

      <Sidebar T={T} activo={activoIdx} onNavigate={onNavigate} onLogout={onLogout} />
      <SidebarMobile T={T} activo={activoIdx} onNavigate={onNavigate}
        open={sidebarOpen} onClose={() => setSidebarOpen(false)} onLogout={onLogout} />

      <div className="flex flex-col flex-1 min-w-0">

        <header className="flex-shrink-0 z-30 flex items-center justify-between px-3 md:px-5"
          style={{ background: T.surface, borderBottom: `1px solid ${T.border}`, height: "var(--header-h)", boxShadow: `0 1px 4px rgba(0,0,0,0.05)` }}>
          {errorRed && (
            <div className="absolute top-0 left-0 right-0 z-50 flex items-center justify-center gap-2 py-1.5 text-xs font-bold"
              style={{ background:"#dc2626", color:"#fff" }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M12 8v4m0 4h.01" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"/><circle cx="12" cy="12" r="9" stroke="#fff" strokeWidth="2"/></svg>
              <span className="hidden sm:inline">Sin conexión con el servidor -</span> datos desactualizados
            </div>
          )}
          <div className="flex items-center gap-2 min-w-0">
            <button className="lg:hidden flex items-center justify-center w-9 h-9 rounded-xl flex-shrink-0"
              style={{ background: T.surfaceAlt, color: T.textMuted, border: `1px solid ${T.border}` }}
              onClick={() => setSidebarOpen(true)}>
              <Menu size={17} />
            </button>
            {(ticketVer || solicitudVer) && (
              <button
                onClick={ticketVer ? volverDeTicket : volverDeSolicitud}
                className="flex items-center justify-center w-9 h-9 rounded-xl flex-shrink-0 transition-all hover:brightness-110 active:scale-95"
                style={{ background: T.surfaceAlt, color: T.textMuted, border: `1px solid ${T.border}` }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
              </button>
            )}
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
              className="flex items-center justify-center w-9 h-9 rounded-xl transition-all"
              style={{ background: T.surfaceAlt, color: dark ? "#f59e0b" : T.textMuted, border: `1px solid ${T.border}` }}>
              {dark ? <Sun size={14} /> : <Moon size={14} />}
            </button>
            <CampanaNotificaciones
              T={T}
              notificaciones={notificaciones}
              onDismiss={onDismiss}
              onDismissAll={onDismissAll}
              onClickNotif={onClickNotif}
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

        <div className="flex-1 min-h-0" style={{ background: T.bg, overflow: activoIdx === 2 && !ticketVer && !solicitudVer ? "hidden" : "auto", scrollBehavior: "smooth", overscrollBehavior: "contain" }}>
          {ticketVer ? (
            <VistaTicket T={T} ticket={ticketVer} onVolver={volverDeTicket} usuario={usuario} />
          ) : solicitudVer ? (
            <VistaSolicitud T={T} id_solicitud={solicitudVer.id_solicitud} onBack={volverDeSolicitud} />
          ) : activoIdx === 1 ? (
            <NuevoReporte T={T} solicitante={nombreCompleto} area={departamento} usuario={usuario}
              onSuccess={irDashboard}
              onVerTicket={(id_ticket) => {
                apiFetch(API_ROUTES.TICKET(id_ticket))
                  .then(r => r.ok ? r.json() : null)
                  .then(t => {
                    if (t?.id_ticket) {
                      skipResetRef.current = true;
                      setTicketVer(t);
                      navigate('/usuario/dashboard');
                    } else irDashboard();
                  })
                  .catch(irDashboard);
              }}
            />
          ) : activoIdx === 2 ? (
            <div className="h-full">
              <HistorialIncidencias T={T} usuario={usuario} onVerTicket={(t) => { skipResetRef.current = true; setTicketVer(t); }} onRecargarRef={recargarHistorialRef} />
            </div>
          ) : activoIdx === 3 ? (
            <div className="h-full overflow-hidden">
              <SolicitudInsumo T={T} usuario={usuario} />
            </div>
          ) : activoIdx === 4 ? (
            <ManualesIncidencias T={T} />
          ) : activoIdx === 5 ? (
            <ConfiguracionPerfil T={T} usuario={usuario} onUsuarioActualizado={onUsuarioActualizado} />
          ) : (
            <div className="flex flex-col" style={{ background: T.bg, minHeight: "100%" }}>
              <div className="flex-shrink-0" style={{ padding: "var(--content-pt) var(--content-px) 0" }}>
                <SeccionMetricasUsuario T={T} tickets={tickets} />
                <SeccionEstadisticas T={T} tickets={tickets} solicitudes={solicitudes} />
              </div>
              <div className="flex-shrink-0" style={{ padding: "8px var(--content-px) 16px" }}>
                <KanbanBoard T={T} tickets={tickets} solicitudes={solicitudes} onVerTicket={setTicketVer} onVerSolicitud={handleVerSolicitud} inline />
              </div>
            </div>
          )}
        </div>
      </div>

      <PanelDerecho T={T} nombre={nombreCompleto} departamento={departamento}
        foto={usuario.foto ? `/storage/${usuario.foto}` : null}
        tickets={tickets} etiquetaRol="Usuario activo" />
    </div>
  );
}
