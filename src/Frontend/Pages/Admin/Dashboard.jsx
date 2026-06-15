import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Users, Package, FileText, BookOpen, Settings,
  LogOut, Menu, X, Sun, Moon
} from "lucide-react";
import VistaTicket from "./VistaTicket";
import VistaSolicitud from "./VistaSolicitud";
import HistorialIncidencias from "./HistorialIncidencias";
import Inventario from "./Inventario";
import Personal from "./Personal";
import ManualesIncidencias from "./ManualesIncidencias";
import ConfiguracionPerfil from "./ConfiguracionPerfil";
import HistorialInsumos from "./HistorialInsumos";
import { apiFetch, API_ROUTES } from "../../Config/api";
import { useTheme } from "../../Config/themeContext.js";
import { SeccionEstadisticas, SeccionMetricas, KanbanBoard, PanelDerecho } from "../../Components/DashboardShared.jsx";
import CampanaNotificaciones from "../../Components/CampanaNotificaciones.jsx";
import { useTicketNotification } from "../../Config/useTicketNotification.js";

const NAV = [
  { icon: LayoutDashboard, label: "Dashboard",               path: "/admin/dashboard"      },
  { icon: FileText,        label: "Historial de Incidencias", path: "/admin/historial"      },
  { icon: Package,         label: "Historial de Insumos",    path: "/admin/insumos"        },
  { icon: Package,         label: "Inventario",              path: "/admin/inventario"     },
  { icon: Users,           label: "Personal",                path: "/admin/personal"       },
  { icon: BookOpen,        label: "Manuales de Incidencias",  path: "/admin/manuales"       },
  { icon: Settings,        label: "Configuración",            path: "/admin/configuracion"  },
];

function SidebarContent({ T, activo, onNavigate, onClose, onLogout }) {
  return (
    <div className="relative flex flex-col h-full">
      <div className="flex flex-col items-center justify-center px-4"
        style={{ borderBottom: `1px solid rgba(255,255,255,0.06)`, paddingTop: "clamp(8px,1.5vh,16px)", paddingBottom: "clamp(8px,1.5vh,16px)" }}>
        <button onClick={() => onNavigate("/admin/dashboard")} className="focus:outline-none" style={{ cursor: "pointer" }}>
          <img src="/assets/img/logo.png" alt="PTP"
            className="object-contain"
            style={{ height: "var(--sidebar-logo-h)", width: "auto", maxWidth: "180px", mixBlendMode: "screen" }} />
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
        style={{ color: "rgba(255,255,255,0.2)", fontSize: "var(--fs-label)", paddingTop: "clamp(8px,1.5vh,20px)" }}>Panel Administrador</p>
      <nav className="flex flex-col gap-0.5 flex-1 px-3">
        {NAV.map((item, i) => (
          <button key={i} onClick={() => { onNavigate(item.path); onClose?.(); }}
            className="flex items-center gap-3 px-3 rounded-xl transition-all w-full text-left"
            style={{
              background: activo === i ? `linear-gradient(135deg, ${T.orange}, #d97400)` : "transparent",
              color: activo === i ? "#fff" : T.sidebarText,
              boxShadow: activo === i ? `0 4px 12px rgba(244,121,32,0.35)` : "none",
              paddingTop: "clamp(6px,0.9vh,10px)",
              paddingBottom: "clamp(6px,0.9vh,10px)",
            }}
            onMouseEnter={e => { if (activo !== i) { e.currentTarget.style.background = "rgba(255,255,255,0.06)"; e.currentTarget.style.color = "#fff"; }}}
            onMouseLeave={e => { if (activo !== i) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = T.sidebarText; }}}>
            <item.icon size={16} strokeWidth={activo === i ? 2.5 : 1.8} style={{ flexShrink: 0, width: "var(--icon-nav)", height: "var(--icon-nav)" }} />
            <span style={{ fontSize: "var(--fs-nav)", fontWeight: activo === i ? 700 : 500 }}>{item.label}</span>
          </button>
        ))}
      </nav>
      <div className="px-3 pb-4 pt-2" style={{ borderTop: `1px solid rgba(255,255,255,0.06)` }}>
        <button className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all w-full"
          style={{ color: T.sidebarText }}
          onMouseEnter={e => { e.currentTarget.style.background = "rgba(239,68,68,0.1)"; e.currentTarget.style.color = "#ef4444"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = T.sidebarText; }}
          onClick={onLogout}>
          <LogOut size={16} strokeWidth={1.8} style={{ flexShrink: 0 }} />
          <span style={{ fontSize: "12.5px", fontWeight: 500 }}>Cerrar sesión</span>
        </button>
      </div>
    </div>
  );
}


function DashboardContent({ T, usuario, tickets = [], solicitudes = [], metricas, onVerTicket, onVerSolicitud }) {
  return (
        <div className="flex flex-col h-full overflow-hidden" style={{ background: T.bg }}>
      <div className="flex-shrink-0" style={{ padding: "var(--content-pt) var(--content-px) 0" }}>
        <SeccionMetricas T={T} metricas={metricas} />
        <SeccionEstadisticas T={T} tickets={tickets} solicitudes={solicitudes} />
      </div>
      <div className="flex-1 min-h-0 overflow-hidden" style={{ padding: "8px var(--content-px) 12px" }}>
        <KanbanBoard T={T} tickets={tickets} solicitudes={solicitudes} onVerTicket={onVerTicket} onVerSolicitud={onVerSolicitud} inline />
      </div>
    </div>
  );
}

function AdminDashboardInner({ usuario, onLogout, onUsuarioActualizado }) {
  const { dark, toggleDark, T } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [tickets, setTickets]         = useState([]);
  const [solicitudes, setSolicitudes]  = useState([]);
  const [metricas, setMetricas]        = useState(null);
  const [ticketVer, setTicketVer]     = useState(null);
  const [solicitudVer, setSolicitudVer] = useState(null);
  const [errorRed, setErrorRed]       = useState(false);
  const [ultimaActualizacion, setUltimaActualizacion] = useState(null);
  const recargarHistorialRef = useRef(null);
  const cargarTicketsRef      = useRef(null);
  const cargarMetricasRef     = useRef(null);
  const cargarSolicitudesRef  = useRef(null);
  const ticketsRef          = useRef(tickets);
  ticketsRef.current        = tickets;
  const solicitudesRef      = useRef(solicitudes);
  solicitudesRef.current    = solicitudes;

  const { notificaciones, onDismiss, onDismissAll, onClickNotif } =
    useTicketNotification({
      usuario,
      onNavegar: useCallback((tipo, data) => {
        const RECARGA = new Set(["ticket:nuevo","solicitud:nueva","ticket:calificado","tickets:vencidos","ticket:sla_warning","ticket:actualizado","ticket:en_atencion"]);
        if (RECARGA.has(tipo)) {
          cargarTicketsRef.current?.();
          cargarMetricasRef.current?.();
          recargarHistorialRef.current?.();
          if (tipo === "solicitud:nueva" || tipo === "solicitud:actualizada") cargarSolicitudesRef.current?.();
        }
        if (["ticket:nuevo","ticket:calificado","ticket:sla_warning","ticket:actualizado","ticket:en_atencion"].includes(tipo) && data?.id_ticket) {
          // Buscar en memoria primero; si no, ir directo al API
          const enMemoria = ticketsRef.current.find(tk => tk.id_ticket === data.id_ticket);
          if (enMemoria) {
            setTicketVer(enMemoria);
          } else {
            apiFetch(API_ROUTES.TICKET(data.id_ticket))
              .then(r => r.ok ? r.json() : null)
              .then(t => { if (t?.id_ticket) setTicketVer(t); })
              .catch(() => {});
          }
        }
        if (tipo === "solicitud:nueva" && data?.id_solicitud) {
          const s = solicitudesRef.current.find(s => s.id_solicitud === data.id_solicitud);
          if (s) setSolicitudVer(s); else cargarSolicitudesRef.current?.();
        }
      // eslint-disable-next-line react-hooks/exhaustive-deps
      }, []),
    });

  const navigate     = useNavigate();
  const location     = useLocation();
  const activoIdx    = NAV.findIndex(n => n.path === location.pathname);
  const activo       = activoIdx === -1 ? 0 : activoIdx;
  const onNavigate   = (path) => { setTicketVer(null); setSolicitudVer(null); navigate(path); };

  useEffect(() => {
    setTicketVer(null); setSolicitudVer(null);
  }, [location.pathname]);

  const nombreCompleto = [usuario.nombre, usuario.ap_paterno, usuario.ap_materno].filter(Boolean).join(" ") || "-";
  const departamento   = usuario.departamento || "-";

  const ticketVerRef = useRef(null);
  ticketVerRef.current = ticketVer;

  const cargarTickets = useCallback(() =>
    apiFetch(`/api/tickets?limit=500&page=1`)
      .then(r => r.json())
      .then(data => {
        setErrorRed(false);
        setUltimaActualizacion(new Date());
        const lista = Array.isArray(data) ? data : (Array.isArray(data?.data) ? data.data : []);
        setTickets(prev => JSON.stringify(prev) === JSON.stringify(lista) ? prev : lista);
        if (ticketVerRef.current) {
          const actualizado = lista.find(t => t.id_ticket === ticketVerRef.current.id_ticket);
          if (actualizado) setTicketVer(actualizado);
        }
      })
      .catch((err) => { console.error("[Admin] Error cargando tickets:", err.message); setErrorRed(true); })
  , []);

  const cargarSolicitudes = useCallback(() =>
    apiFetch(API_ROUTES.SOLICITUDES_PEND)
      .then(r => r.json())
      .then(data => setSolicitudes(Array.isArray(data) ? data : []))
      .catch(err => console.error("[Admin] Error cargando solicitudes pendientes:", err.message))
  , []);

  const cargarMetricas = useCallback(() =>
    apiFetch(`/api/tickets/metricas`)
      .then(r => r.json())
      .then(data => setMetricas(data))
      .catch((err) => console.error("[Admin] Error cargando metricas:", err.message))
  , []);

  useEffect(() => {
    cargarTicketsRef.current     = cargarTickets;
    cargarMetricasRef.current    = cargarMetricas;
    cargarSolicitudesRef.current = cargarSolicitudes;
    cargarTickets();
    cargarMetricas();
    cargarSolicitudes();
  }, [cargarTickets, cargarMetricas, cargarSolicitudes]);

  const tituloHeader = ticketVer
    ? ticketVer.folio_ticket
    : solicitudVer
      ? solicitudVer.folio_solicitud
      : (NAV[activo]?.label || 'Dashboard');

  return (
    <div className="flex min-h-screen w-full"
      style={{ fontFamily: "'Inter','Segoe UI',sans-serif", background: T.bg }}>

      {/* Sidebar desktop */}
      <aside className="hidden lg:flex flex-shrink-0 flex-col sticky top-0 h-screen"
        style={{ width: "var(--sidebar-w)", background: "#000000", boxShadow: "2px 0 12px rgba(0,0,0,0.15)" }}>
        <SidebarContent T={T} activo={activo} onNavigate={onNavigate} onLogout={onLogout} />
      </aside>

      {/* Sidebar mobile */}
      {sidebarOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-black/60 md:hidden" onClick={() => setSidebarOpen(false)} />
          <aside className="fixed top-0 left-0 z-50 flex flex-col h-screen md:hidden"
            style={{ width: "260px", background: "#000000" }}>
            <SidebarContent T={T} activo={activo} onNavigate={onNavigate} onClose={() => setSidebarOpen(false)} onLogout={onLogout} />
          </aside>
        </>
      )}

      {/* Contenido principal */}
      <div className="flex flex-col flex-1 min-w-0">

        <header className="sticky top-0 z-30 flex items-center justify-between px-3 md:px-5"
          style={{ background: T.surface, borderBottom: `1px solid ${T.border}`, height: "var(--header-h)", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
          {errorRed && (
            <div className="absolute top-0 left-0 right-0 z-50 flex items-center justify-center gap-2 py-1 text-xs font-bold"
              style={{ background: "#dc2626", color: "#fff" }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M12 8v4m0 4h.01" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"/><circle cx="12" cy="12" r="9" stroke="#fff" strokeWidth="2"/></svg>
              <span className="hidden sm:inline">Sin conexión con el servidor -</span> datos desactualizados
            </div>
          )}

          {/* Izquierda: hamburguesa + título */}
          <div className="flex items-center gap-2 min-w-0">
            <button className="md:hidden flex items-center justify-center w-9 h-9 rounded-xl flex-shrink-0"
              style={{ background: T.surfaceAlt, color: T.textMuted, border: `1px solid ${T.border}` }}
              onClick={() => setSidebarOpen(true)}>
              <Menu size={17} />
            </button>
            <div className="flex flex-col justify-center min-w-0">
              <div className="flex items-center gap-2">
                <div className="w-0.5 h-5 rounded-full flex-shrink-0" style={{ background: `linear-gradient(180deg,${T.orange},#ffb347)` }} />
                <h1 className="text-sm sm:text-base font-black tracking-tight truncate" style={{ color: T.text }}>
                  {tituloHeader}
                </h1>
              </div>
              <p className="hidden sm:block text-[10px] font-medium ml-3 truncate" style={{ color: T.textMuted }}>
                Panel de administracion - Precision Trucks Parts
              </p>
            </div>
          </div>

          {/* Derecha: hora + modo + campana */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {ultimaActualizacion && !errorRed && (
              <span className="hidden lg:flex items-center gap-1 text-[10px] px-2 py-1 rounded-lg"
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
              onDismiss={onDismiss}
              onDismissAll={onDismissAll}
              onClickNotif={onClickNotif}
            />
          </div>
        </header>

        <div className="flex-1 min-h-0 overflow-hidden">
          {ticketVer ? (
            <VistaTicket T={T} ticket={ticketVer} onVolver={() => { setTicketVer(null); cargarTickets(); }} esAdmin usuario={usuario} />
          ) : solicitudVer ? (
            <VistaSolicitud T={T} id_solicitud={solicitudVer.id_solicitud} esAdmin onBack={() => setSolicitudVer(null)} />
          ) : activo === 0 ? (
            <DashboardContent T={T} usuario={usuario} tickets={tickets} solicitudes={solicitudes} metricas={metricas} onVerTicket={setTicketVer} onVerSolicitud={setSolicitudVer} />
          ) : activo === 1 ? (
            <HistorialIncidencias T={T} usuario={usuario} onVerTicket={setTicketVer} onRecargarRef={recargarHistorialRef} />
          ) : activo === 2 ? (
            <HistorialInsumos T={T} onVerSolicitud={setSolicitudVer} />
          ) : activo === 3 ? (
            <Inventario T={T} />
          ) : activo === 4 ? (
            <Personal T={T} />
          ) : activo === 5 ? (
            <ManualesIncidencias T={T} />
          ) : activo === 6 ? (
            <ConfiguracionPerfil T={T} usuario={usuario} onUsuarioActualizado={onUsuarioActualizado} />
          ) : (
            <div className="flex items-center justify-center flex-col gap-3 py-20">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
                style={{ background: T.surfaceAlt, border: `1px solid ${T.border}` }}>
                {(() => { const Icon = NAV[activo]?.icon; return Icon ? <Icon size={24} style={{ color: T.textFaint }} /> : null; })()}
              </div>
              <p className="text-sm font-bold" style={{ color: T.textMuted }}>{NAV[activo]?.label}</p>
              <p className="text-xs" style={{ color: T.textFaint }}>Módulo en desarrollo</p>
            </div>
          )}
        </div>
      </div>

      {/* Panel derecho solo en xl+ */}
      <PanelDerecho T={T} nombre={nombreCompleto} departamento={departamento}
        foto={usuario.foto ? `/storage/${usuario.foto}` : null}
        tickets={tickets}
        etiquetaRol="Activo" />
    </div>
  );
}

export default function AdminDashboard({ usuario = {}, onLogout, onUsuarioActualizado }) {
  return (
    <AdminDashboardInner usuario={usuario} onLogout={onLogout} onUsuarioActualizado={onUsuarioActualizado} />
  );
}
