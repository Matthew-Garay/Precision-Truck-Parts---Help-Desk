import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Users, Package, FileText, BookOpen, Settings,
  LogOut, Menu, X, Sun, Moon
} from "lucide-react";
import VistaTicket from "./VistaTicket";
import HistorialIncidencias from "./HistorialIncidencias";
import Inventario from "./Inventario";
import Personal from "./Personal";
import ManualesIncidencias from "./ManualesIncidencias";
import ConfiguracionPerfil from "./ConfiguracionPerfil";
import { apiFetch } from "../../Config/api";
import { LIGHT, DARK } from "../../Config/theme.jsx";
import { SeccionEstadisticas, SeccionMetricas, KanbanBoard, PanelDerecho } from "../../Components/DashboardShared.jsx";
import CampanaNotificaciones from "../../Components/CampanaNotificaciones.jsx";
import { ToastProvider } from "../../Components/Feedback.jsx";
import { useSocket } from "../../Config/useSocket.js";

const NAV = [
  { icon: LayoutDashboard, label: "Dashboard",               path: "/admin/dashboard"      },
  { icon: FileText,        label: "Historial de Incidencias", path: "/admin/historial"      },
  { icon: Package,         label: "Inventario",              path: "/admin/inventario"     },
  { icon: Users,           label: "Personal",                path: "/admin/personal"       },
  { icon: BookOpen,        label: "Manuales de Incidencias",  path: "/admin/manuales"       },
  { icon: Settings,        label: "Configuración",            path: "/admin/configuracion"  },
];

function SidebarContent({ T, activo, onNavigate, onClose, onLogout }) {
  return (
    <div className="relative flex flex-col h-full">
      <div className="flex flex-col items-center justify-center py-4 px-4"
        style={{ borderBottom: `1px solid rgba(255,255,255,0.06)` }}>
        <button onClick={() => onNavigate("/admin/dashboard")} className="focus:outline-none"
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
        style={{ color: "rgba(255,255,255,0.2)" }}>Panel Administrador</p>
      <nav className="flex flex-col gap-0.5 flex-1 px-3">
        {NAV.map((item, i) => (
          <button key={i} onClick={() => { onNavigate(item.path); onClose?.(); }}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all w-full text-left"
            style={{
              background: activo === i ? `linear-gradient(135deg, ${T.orange}, #d97400)` : "transparent",
              color: activo === i ? "#fff" : T.sidebarText,
              boxShadow: activo === i ? `0 4px 12px rgba(244,121,32,0.35)` : "none",
            }}
            onMouseEnter={e => { if (activo !== i) { e.currentTarget.style.background = "rgba(255,255,255,0.06)"; e.currentTarget.style.color = "#fff"; }}}
            onMouseLeave={e => { if (activo !== i) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = T.sidebarText; }}}>
            <item.icon size={16} strokeWidth={activo === i ? 2.5 : 1.8} style={{ flexShrink: 0 }} />
            <span style={{ fontSize: "12.5px", fontWeight: activo === i ? 700 : 500 }}>{item.label}</span>
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


function DashboardContent({ T, usuario, tickets = [], metricas, onVerTicket }) {
  return (
    <div className="overflow-y-auto" style={{ background: T.bg }}>
      <div className="px-3 pt-3 md:px-4 md:pt-4">
        <SeccionMetricas T={T} metricas={metricas} />
        <SeccionEstadisticas T={T} tickets={tickets} />
      </div>
      <div className="px-3 pt-2 pb-4 md:px-4">
        <KanbanBoard T={T} tickets={tickets} onVerTicket={onVerTicket} inline />
      </div>
    </div>
  );
}

export default function AdminDashboard({ usuario = {}, onLogout, onUsuarioActualizado }) {
  const [dark, setDark]               = useState(() => localStorage.getItem("theme") === "dark");
  const toggleDark = (v) => { setDark(v); localStorage.setItem("theme", v ? "dark" : "light"); };
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [tickets, setTickets]         = useState([]);
  const [metricas, setMetricas]        = useState(null);
  const [ticketVer, setTicketVer]     = useState(null);
  const [errorRed, setErrorRed]       = useState(false);
  const [ultimaActualizacion, setUltimaActualizacion] = useState(null);
  const [notificaciones, setNotificaciones] = useState([]);


  const agregarNotif = useCallback((notif) => {
    setNotificaciones(prev => [{ id: Date.now(), ts: Date.now(), ...notif }, ...prev].slice(0, 20));
  }, []);

  const recargarHistorialRef = useRef(null);
  // Ref estable para evitar closure stale en el callback del socket
  const cargarTicketsRef = useRef(null);
  const cargarMetricasRef = useRef(null);

  useSocket(usuario?.id_empleado, useCallback(({ tipo, data }) => {
    agregarNotif({ tipo, data });
    if (tipo === "ticket:nuevo" || tipo === "solicitud:nueva" || tipo === "ticket:calificado" || tipo === "tickets:vencidos" || tipo === "ticket:sla_warning" || tipo === "ticket:actualizado") {
      cargarTicketsRef.current?.();
      cargarMetricasRef.current?.();
      recargarHistorialRef.current?.();
    }
  }, [agregarNotif]));

  const navigate     = useNavigate();
  const location     = useLocation();
  const activoIdx    = NAV.findIndex(n => n.path === location.pathname);
  const activo       = activoIdx === -1 ? 0 : activoIdx;
  const onNavigate   = (path) => { setTicketVer(null); navigate(path); };

  // Cuando el usuario usa flechas del navegador, cerrar ticket abierto
  useEffect(() => {
    setTicketVer(null);
  }, [location.pathname]);
  const T = dark ? DARK : LIGHT;
  const nombreCompleto = [usuario.nombre, usuario.ap_paterno, usuario.ap_materno].filter(Boolean).join(" ") || "-";
  const departamento   = usuario.departamento || "-";

  const ticketVerRef = useRef(null);
  ticketVerRef.current = ticketVer;

  const cargarTickets = useCallback(() =>
    apiFetch(`/api/tickets`)
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

  const cargarMetricas = useCallback(() =>
    apiFetch(`/api/tickets/metricas`)
      .then(r => r.json())
      .then(data => setMetricas(data))
      .catch((err) => console.error("[Admin] Error cargando metricas:", err.message))
  , []);

  useEffect(() => {
    cargarTicketsRef.current  = cargarTickets;
    cargarMetricasRef.current = cargarMetricas;
    cargarTickets();
    cargarMetricas();
    const id = setInterval(() => { cargarTickets(); cargarMetricas(); }, 30000);
    return () => clearInterval(id);
  }, [cargarTickets, cargarMetricas]);

  const tituloHeader = ticketVer ? ticketVer.folio_ticket : (NAV[activo]?.label || 'Dashboard');

  return (
    <ToastProvider T={T}>
    <div className="flex min-h-screen w-full"
      style={{ fontFamily: "'Inter','Segoe UI',sans-serif", background: T.bg }}>

      {/* Sidebar desktop */}
      <aside className="hidden md:flex flex-shrink-0 flex-col sticky top-0 h-screen"
        style={{ width: "220px", background: "#000000", boxShadow: "2px 0 12px rgba(0,0,0,0.15)" }}>
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

        <header className="sticky top-0 z-30 flex items-center justify-between px-3 md:px-5 py-3"
          style={{ background: T.surface, borderBottom: `1px solid ${T.border}`, minHeight: "56px", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
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
              onDismiss={id => setNotificaciones(p => p.filter(n => n.id !== id))}
              onDismissAll={() => setNotificaciones([])}
              onClickNotif={(n) => {
                if (n.tipo === "ticket:nuevo" || n.tipo === "ticket:calificado" || n.tipo === "ticket:sla_warning") {
                  const t = tickets.find(tk => tk.id_ticket === n.data.id_ticket);
                  if (t) setTicketVer(t);
                  else cargarTickets();
                }
              }}
            />
          </div>
        </header>

        <div className="flex-1 min-h-0">
          {ticketVer ? (
            <VistaTicket T={T} ticket={ticketVer} onVolver={() => { setTicketVer(null); cargarTickets(); }} esAdmin usuario={usuario} />
          ) : activo === 0 ? (
            <DashboardContent T={T} usuario={usuario} tickets={tickets} metricas={metricas} onVerTicket={setTicketVer} />
          ) : activo === 1 ? (
            <HistorialIncidencias T={T} usuario={usuario} onVerTicket={setTicketVer} onRecargarRef={recargarHistorialRef} />
          ) : activo === 2 ? (
            <Inventario T={T} />
          ) : activo === 3 ? (
            <Personal T={T} />
          ) : activo === 4 ? (
            <ManualesIncidencias T={T} />
          ) : activo === 5 ? (
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
        foto={usuario.foto ? `/fotos/${usuario.foto.split("/").pop()}` : null}
        tickets={tickets} etiquetaRol="Administrador" />
    </div>
    </ToastProvider>
  );
}
