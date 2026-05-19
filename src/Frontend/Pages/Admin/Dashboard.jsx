import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Users, Package, FileText, BookOpen, Settings,
  LogOut, Menu, X, Sun, Moon, User, TrendingUp, Clock, CheckCircle2
} from "lucide-react";
import VistaTicket from "./VistaTicket";
import HistorialIncidencias from "./HistorialIncidencias";
import Inventario from "./Inventario";
import Personal from "./Personal";
import ManualesIncidencias from "./ManualesIncidencias";
import ConfiguracionPerfil from "./ConfiguracionPerfil";
import API from "../../Config/api";
import { LIGHT, DARK, RelojFecha, Calendario } from "../../Config/theme.jsx";

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
        <img src="/assets/img/logo.png" alt="PTP"
          className="object-contain"
          style={{ height: "72px", width: "auto", maxWidth: "180px", mixBlendMode: "screen" }} />
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

function PanelDerecho({ T, nombre, departamento, foto, tickets = [] }) {
  const isDark = T.bg === "#0b0e14";
  const total     = tickets.length;
  const enProceso = tickets.filter(t => t.estatus === "En proceso").length;
  const resueltos = tickets.filter(t => t.estatus === "Resuelto").length;
  const stats = [
    { label: "Tickets Totales", valor: total,     color: "#3b82f6", bgL: "#eff6ff", bgD: "#0f1f3d", icon: TrendingUp  },
    { label: "En Proceso",      valor: enProceso, color: "#F47920", bgL: "#fff7ed", bgD: "#2d1200", icon: Clock        },
    { label: "Finalizados",     valor: resueltos, color: "#16a34a", bgL: "#f0fdf4", bgD: "#071a0e", icon: CheckCircle2 },
  ];
  return (
    <aside className="hidden xl:flex flex-shrink-0 flex-col h-screen overflow-y-auto"
      style={{ width: "280px", background: T.surface, borderLeft: `1px solid ${T.border}` }}>
      <div className="flex flex-col h-full p-4 gap-3">
        <div className="flex flex-col items-center text-center py-4 px-3 rounded-2xl relative overflow-hidden flex-shrink-0"
          style={{ background: T.surfaceAlt, border: `1px solid ${T.border}` }}>
          <div className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl"
            style={{ background: `linear-gradient(90deg, ${T.orange}, #ffb347)` }} />
          <div className="flex items-center justify-center rounded-full mt-2 mb-3 overflow-hidden"
            style={{ width: "68px", height: "68px", background: T.bg, border: `2.5px solid ${T.orange}`, boxShadow: `0 0 0 4px rgba(244,121,32,0.1)` }}>
            {foto
              ? <img src={foto} alt="perfil" className="w-full h-full object-cover" />
              : <User size={30} style={{ color: T.textFaint }} />
            }
          </div>
          <p className="font-black text-sm" style={{ color: T.text }}>{nombre || "—"}</p>
          <p className="text-xs mt-0.5" style={{ color: T.textMuted }}>{departamento || "—"}</p>
          <span className="mt-3 px-3 py-1 rounded-full text-[10px] font-bold"
            style={{ background: `linear-gradient(135deg, rgba(244,121,32,0.15), rgba(244,121,32,0.08))`, color: T.orange, border: `1px solid rgba(244,121,32,0.2)` }}>
            ● Activo
          </span>
        </div>
        <RelojFecha T={T} />
        <div className="flex flex-col gap-1.5 flex-shrink-0">
          {stats.map((s, i) => (
            <div key={i} className="flex items-center justify-between px-4 py-3 rounded-xl"
              style={{ background: isDark ? s.bgD : s.bgL, border: `1px solid ${T.border}` }}>
              <div className="flex items-center gap-2.5">
                <s.icon size={14} style={{ color: s.color, flexShrink: 0 }} />
                <span className="text-xs font-semibold" style={{ color: T.textMuted }}>{s.label}</span>
              </div>
              <span className="text-2xl font-black" style={{ color: s.color }}>{s.valor}</span>
            </div>
          ))}
        </div>
        <div className="rounded-2xl overflow-hidden flex-shrink-0" style={{ border: `1px solid ${T.border}` }}>
          <div className="px-4 py-2.5" style={{ background: T.surfaceAlt, borderBottom: `1px solid ${T.border}` }}>
            <p className="text-[9px] font-bold uppercase tracking-widest" style={{ color: T.textMuted }}>Calendario</p>
          </div>
          <div className="p-4" style={{ background: T.surface }}>
            <Calendario T={T} />
          </div>
        </div>
      </div>
    </aside>
  );
}

function GraficaPastel({ data, size = 80, T }) {
  const total = data.reduce((s, d) => s + d.valor, 0);
  const isDark = T?.bg === "#0b0e14";
  const r = size / 2 - 8, cx = size / 2, cy = size / 2;
  const circ = 2 * Math.PI * r;
  if (total === 0) return (
    <svg width={size} height={size}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={isDark ? "rgba(255,255,255,0.1)" : "#e2e8f0"} strokeWidth="10" />
      <text x={cx} y={cy + 4} textAnchor="middle" fontSize="9" fill={isDark ? "rgba(255,255,255,0.3)" : "#94a3b8"} fontWeight="600">Sin datos</text>
    </svg>
  );
  let offset = 0;
  const segs = data.map(d => { const dash = (d.valor / total) * circ; const s = { ...d, dash, gap: circ - dash, offset }; offset += dash; return s; });
  const textColor = isDark ? "#f1f5f9" : "#1D1D1B";
  const subColor  = isDark ? "rgba(255,255,255,0.4)" : "#94a3b8";
  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        {segs.map((s, i) => (
          <circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke={s.color} strokeWidth="10"
            strokeDasharray={`${s.dash} ${s.gap}`} strokeDashoffset={-s.offset} strokeLinecap="butt" />
        ))}
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
        <span style={{ fontSize: "15px", fontWeight: 900, lineHeight: 1, color: textColor }}>{total}</span>
        <span style={{ fontSize: "8px", fontWeight: 600, marginTop: "2px", color: subColor }}>total</span>
      </div>
    </div>
  );
}

function SeccionEstadisticas({ T, tickets = [] }) {
  const isDark = T.bg === "#0b0e14";
  const total = tickets.length;
  const prioridadData = [
    { label: "Urgente", color: "#dc2626", bg: "#fee2e2" },
    { label: "Alta",    color: "#ea580c", bg: "#ffedd5" },
    { label: "Media",   color: "#ca8a04", bg: "#fef9c3" },
    { label: "Baja",    color: "#16a34a", bg: "#dcfce7" },
  ].map(p => ({ ...p, valor: tickets.filter(t => t.prioridad === p.label).length }));
  const estatusData = [
    { label: "Resuelto",    color: "#16a34a", valor: tickets.filter(t => t.estatus === "Resuelto").length },
    { label: "En proceso",  color: "#ca8a04", valor: tickets.filter(t => t.estatus === "En proceso").length },
    { label: "No Resuelto", color: "#ea580c", valor: tickets.filter(t => t.estatus === "No Resuelto").length },
  ];
  const totalEstatus = estatusData.reduce((s, d) => s + d.valor, 0);
  const cardStyle = {
    background: isDark ? "#141720" : T.surface,
    border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : T.border}`,
    boxShadow: isDark ? "0 4px 20px rgba(0,0,0,0.4)" : "0 1px 6px rgba(0,0,0,0.06)",
  };
  const hdr = { borderBottom: `1px solid ${isDark ? "rgba(255,255,255,0.07)" : T.border}`, background: isDark ? "rgba(255,255,255,0.03)" : T.surfaceAlt };
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3 w-full">
      <div className="rounded-xl overflow-hidden" style={cardStyle}>
        <div className="px-4 py-2.5 flex items-center gap-2" style={hdr}>
          <div className="w-1 h-3.5 rounded-full" style={{ background: "#F47920" }} />
          <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: isDark ? "rgba(255,255,255,0.45)" : T.textMuted }}>Reportes por Prioridad</p>
        </div>
        <div className="px-4 py-3 flex flex-col gap-2.5">
          {prioridadData.map((p, i) => {
            const pct = total > 0 ? Math.round((p.valor / total) * 100) : 0;
            return (
              <div key={i} className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
                    <span className="text-[11px] font-semibold" style={{ color: isDark ? "rgba(255,255,255,0.65)" : T.text }}>{p.label}</span>
                  </div>
                  <span className="text-[11px] font-black" style={{ color: p.color }}>{p.valor}</span>
                </div>
                <div className="relative h-4 rounded-full overflow-hidden" style={{ background: isDark ? "rgba(255,255,255,0.06)" : p.bg }}>
                  <div className="h-full rounded-full flex items-center justify-end pr-2 transition-all duration-700"
                    style={{ width: `${pct > 0 ? Math.max(pct, 10) : 0}%`, background: p.color }}>
                    {p.valor > 0 && <span className="text-[9px] font-black text-white">{pct}%</span>}
                  </div>
                  {p.valor === 0 && <span className="absolute inset-0 flex items-center pl-2.5 text-[9px]" style={{ color: isDark ? "rgba(255,255,255,0.2)" : T.textFaint }}>Sin registros</span>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <div className="rounded-xl overflow-hidden flex flex-col" style={cardStyle}>
        <div className="px-4 py-2.5 flex items-center gap-2" style={hdr}>
          <div className="w-1 h-3.5 rounded-full" style={{ background: "#F47920" }} />
          <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: isDark ? "rgba(255,255,255,0.45)" : T.textMuted }}>Tickets por Estatus</p>
        </div>
        <div className="px-4 py-3 flex gap-4 flex-1">
          <div className="flex-shrink-0"><GraficaPastel data={estatusData} size={80} T={T} /></div>
          <div className="flex flex-col gap-2.5 flex-1 justify-center">
            {estatusData.map((e, i) => {
              const pct = totalEstatus > 0 ? Math.round((e.valor / totalEstatus) * 100) : 0;
              return (
                <div key={i} className="flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: e.color }} />
                      <span className="text-[11px] font-semibold" style={{ color: isDark ? "rgba(255,255,255,0.65)" : T.text }}>{e.label}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] font-black" style={{ color: e.color }}>{e.valor}</span>
                      <span className="text-[9px] font-semibold" style={{ color: T.textFaint }}>({pct}%)</span>
                    </div>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: isDark ? "rgba(255,255,255,0.06)" : T.border }}>
                    <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct > 0 ? Math.max(pct, 5) : 0}%`, background: e.color }} />
                  </div>
                </div>
              );
            })}
            <div className="mt-1 pt-2 border-t" style={{ borderColor: isDark ? "rgba(255,255,255,0.07)" : T.border }}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[9px] font-black uppercase tracking-widest" style={{ color: T.textFaint }}>Tasa de resolución</span>
                <span className="text-[10px] font-black" style={{ color: "#16a34a" }}>
                  {totalEstatus > 0 ? Math.round((estatusData[0].valor / totalEstatus) * 100) : 0}%
                </span>
              </div>
              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: isDark ? "rgba(255,255,255,0.06)" : T.border }}>
                <div className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${totalEstatus > 0 ? Math.round((estatusData[0].valor / totalEstatus) * 100) : 0}%`, background: "linear-gradient(90deg, #16a34a, #4ade80)" }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const PRIORIDADES = [
  { id: "Urgente", label: "Urgente", color: "#dc2626", bg: "#fee2e2", bgDark: "rgba(220,38,38,0.18)" },
  { id: "Alta",    label: "Alta",    color: "#ea580c", bg: "#ffedd5", bgDark: "rgba(234,88,12,0.18)" },
  { id: "Media",   label: "Media",   color: "#ca8a04", bg: "#fef9c3", bgDark: "rgba(202,138,4,0.18)" },
  { id: "Baja",    label: "Baja",    color: "#16a34a", bg: "#dcfce7", bgDark: "rgba(22,163,74,0.18)" },
];

function KanbanBoard({ T, tickets = [], onVerTicket, inline = false }) {
  const isDark = T.bg === "#0b0e14";
  const ticketsEnProceso = tickets.filter(t => t.estatus === "En proceso");
  const grupos = {};
  PRIORIDADES.forEach(p => { grupos[p.id] = []; });
  ticketsEnProceso.forEach(t => { if (grupos[t.prioridad]) grupos[t.prioridad].push(t); });
  const columnas = PRIORIDADES.map(prioridad => {
    const tks = grupos[prioridad.id];
    const bgCol = isDark ? "#141720" : T.surface;
    const borderCol = isDark ? "rgba(255,255,255,0.08)" : T.border;
    return (
      <div key={prioridad.id} className="flex flex-col rounded-xl overflow-hidden w-full md:flex-1"
        style={{ minWidth: "0", background: bgCol, border: `1px solid ${borderCol}`, boxShadow: isDark ? "0 4px 20px rgba(0,0,0,0.4)" : "0 1px 6px rgba(0,0,0,0.06)" }}>
        <div className="px-4 py-3 flex items-center justify-between flex-shrink-0"
          style={{ background: isDark ? "rgba(255,255,255,0.03)" : T.surfaceAlt, borderBottom: `1px solid ${borderCol}` }}>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full" style={{ background: prioridad.color }} />
            <span className="text-sm font-bold" style={{ color: prioridad.color }}>{prioridad.label}</span>
          </div>
          <span className="px-2 py-0.5 rounded-full text-xs font-bold"
            style={{ background: isDark ? prioridad.bgDark : prioridad.bg, color: prioridad.color }}>
            {tks.length}
          </span>
        </div>
        <div className="overflow-y-auto p-3 flex flex-col gap-2.5" style={{ maxHeight: "320px" }}>
          {tks.length === 0 ? (
            <div className="flex items-center justify-center py-6">
              <p className="text-xs" style={{ color: T.textFaint }}>Sin tickets</p>
            </div>
          ) : tks.map(t => (
            <div key={t.id_ticket}
              className="p-3 rounded-xl cursor-pointer transition-all hover:scale-[1.01] active:scale-95 flex flex-col gap-2"
              style={{ background: isDark ? "rgba(255,255,255,0.05)" : T.bg, border: `1px solid ${borderCol}`, boxShadow: isDark ? "0 2px 8px rgba(0,0,0,0.3)" : "0 1px 4px rgba(0,0,0,0.06)" }}
              onClick={() => onVerTicket(t)}>
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: prioridad.color }} />
                  <span className="text-[10px] font-mono font-black" style={{ color: T.orange }}>#{t.folio_ticket}</span>
                </div>
                <img src={isDark ? "/assets/img/logo%20blanco.png" : "/assets/img/logo%20negro.png"} alt="logo" className="h-4 object-contain opacity-50" />
              </div>
              <p className="text-xs font-semibold leading-snug line-clamp-2" style={{ color: T.text }}>{t.titulo}</p>
              <div className="pt-1.5 flex items-center justify-between" style={{ borderTop: `1px solid ${borderCol}` }}>
                <span className="text-[10px] truncate max-w-[60%]" style={{ color: T.textMuted }}>{t.nombre_empleado || "—"}</span>
                <span className="text-[10px] font-semibold flex-shrink-0" style={{ color: T.textFaint }}>
                  {t.fecha_subido ? new Date(t.fecha_subido).toLocaleDateString("es-MX", { day: "2-digit", month: "2-digit" }) : "—"}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  });
  if (inline) return <>{columnas}</>;
  return (
    <div className="h-full overflow-x-auto px-3 pt-2 pb-4 md:px-4">
      <div className="flex gap-3 h-full" style={{ minWidth: "max-content" }}>{columnas}</div>
    </div>
  );
}

function DashboardContent({ T, usuario, tickets = [], onVerTicket }) {
  return (
    <div className="h-full flex flex-col overflow-hidden" style={{ background: T.bg }}>
      <div className="flex-shrink-0 px-3 pt-3 md:px-4 md:pt-4">
        <SeccionEstadisticas T={T} tickets={tickets} />
      </div>
      <div className="flex-1 overflow-x-auto overflow-y-auto md:overflow-y-hidden px-3 pt-2 pb-4 md:px-4">
        <div className="flex flex-col md:flex-row gap-3 md:h-full" style={{ minWidth: "0" }}>
          <KanbanBoard T={T} tickets={tickets} onVerTicket={onVerTicket} inline />
        </div>
      </div>
    </div>
  );
}

export default function AdminDashboard({ usuario = {}, onLogout, onUsuarioActualizado }) {
  const [dark, setDark]               = useState(() => localStorage.getItem("theme") === "dark");
  const toggleDark = (v) => { setDark(v); localStorage.setItem("theme", v ? "dark" : "light"); };
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [tickets, setTickets]         = useState([]);
  const [ticketVer, setTicketVer]     = useState(null);
  const navigate     = useNavigate();
  const location     = useLocation();
  const activoIdx    = NAV.findIndex(n => n.path === location.pathname);
  const activo       = activoIdx === -1 ? 0 : activoIdx;
  const onNavigate   = (path) => { setTicketVer(null); navigate(path, { replace: true }); };
  const T = dark ? DARK : LIGHT;
  const nombreCompleto = [usuario.nombre, usuario.ap_paterno, usuario.ap_materno].filter(Boolean).join(" ") || "—";
  const departamento   = usuario.departamento || "—";

  const cargarTickets = () =>
    fetch(`${API}/api/tickets`)
      .then(r => r.json())
      .then(data => {
        const lista = Array.isArray(data) ? data : (Array.isArray(data?.data) ? data.data : []);
        setTickets(prev => JSON.stringify(prev) === JSON.stringify(lista) ? prev : lista);
        setTicketVer(prev => {
          if (!prev) return null;
          const actualizado = lista.find(t => t.id_ticket === prev.id_ticket);
          return actualizado ?? prev;
        });
      })
      .catch(() => {});

  useEffect(() => {
    cargarTickets();
    const id = setInterval(cargarTickets, 5000);
    return () => clearInterval(id);
  }, []);

  const tituloHeader = ticketVer ? ticketVer.folio_ticket : (NAV[activo]?.label || 'Dashboard');

  return (
    <div className="flex flex-col md:flex-row h-screen w-screen overflow-hidden"
      style={{ fontFamily: "'Inter','Segoe UI',sans-serif", background: T.bg }}>

      <aside className="hidden md:flex flex-shrink-0 flex-col h-screen"
        style={{ width: "220px", background: T.sidebar, boxShadow: "2px 0 12px rgba(0,0,0,0.15)" }}>
        <SidebarContent T={T} activo={activo} onNavigate={onNavigate} onLogout={onLogout} />
      </aside>

      {sidebarOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-black/60 md:hidden" onClick={() => setSidebarOpen(false)} />
          <aside className="fixed top-0 left-0 z-50 flex flex-col h-screen md:hidden"
            style={{ width: "260px", background: T.sidebar }}>
            <SidebarContent T={T} activo={activo} onNavigate={onNavigate} onClose={() => setSidebarOpen(false)} onLogout={onLogout} />
          </aside>
        </>
      )}

      <div className="flex flex-col flex-1 overflow-hidden">
        <header className="flex-shrink-0 flex items-center justify-between px-4 md:px-6 py-4"
          style={{ background: T.surface, borderBottom: `1px solid ${T.border}`, minHeight: "64px", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
          <div className="flex items-center gap-3">
            <button className="md:hidden flex items-center justify-center w-9 h-9 rounded-xl"
              style={{ background: T.surfaceAlt, color: T.textMuted, border: `1px solid ${T.border}` }}
              onClick={() => setSidebarOpen(true)}>
              <Menu size={17} />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-0.5 h-6 rounded-full" style={{ background: `linear-gradient(180deg,${T.orange},#ffb347)` }} />
              <div>
                <h1 className="text-base font-black tracking-tight" style={{ color: T.text }}>
                  {tituloHeader}
                </h1>
                <p className="text-[10px]" style={{ color: T.textMuted }}>Panel de Administración · Precision Truck Parts</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => toggleDark(!dark)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl transition-all text-xs font-semibold"
              style={{ background: T.surfaceAlt, color: dark ? "#f59e0b" : T.textMuted, border: `1px solid ${T.border}` }}>
              {dark ? <Sun size={14} /> : <Moon size={14} />}
              <span className="hidden sm:inline">{dark ? "Claro" : "Oscuro"}</span>
            </button>
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold"
              style={{ background: `rgba(244,121,32,0.10)`, color: T.orange, border: `1px solid rgba(244,121,32,0.25)` }}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: T.orange }} />
              Administrador
            </span>
          </div>
        </header>

        <div className="flex-1 overflow-hidden min-h-0 relative">
          {ticketVer ? (
            <VistaTicket T={T} ticket={ticketVer} onVolver={() => { setTicketVer(null); cargarTickets(); }} esAdmin usuario={usuario} />
          ) : activo === 0 ? (
            <DashboardContent T={T} usuario={usuario} tickets={tickets} onVerTicket={setTicketVer} />
          ) : activo === 1 ? (
            <div className="absolute inset-0"><HistorialIncidencias T={T} usuario={usuario} onVerTicket={setTicketVer} /></div>
          ) : activo === 2 ? (
            <div className="absolute inset-0"><Inventario T={T} /></div>
          ) : activo === 3 ? (
            <Personal T={T} />
          ) : activo === 4 ? (
            <div className="absolute inset-0"><ManualesIncidencias T={T} /></div>
          ) : activo === 5 ? (
            <div className="absolute inset-0"><ConfiguracionPerfil T={T} usuario={usuario} onUsuarioActualizado={onUsuarioActualizado} /></div>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center flex-col gap-3">
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

      <PanelDerecho T={T} nombre={nombreCompleto} departamento={departamento}
        foto={usuario.foto ? `${API}/fotos/${usuario.foto.split("/").pop()}` : null}
        tickets={tickets} />
    </div>
  );
}
