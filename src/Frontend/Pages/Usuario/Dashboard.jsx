import { useState, useEffect } from "react";
import {
  LayoutDashboard, ClipboardList, ShoppingCart,
  BookOpen, LogOut, Plus, User, Sun, Moon,
  Menu, X, TrendingUp, Clock, CheckCircle2,
  AlertCircle, Filter, FilePlus
} from "lucide-react";
import NuevoReporte from "./NuevoReporte";
import HistorialIncidencias from "./HistorialIncidencias";
import ManualesIncidencias from "./ManualesIncidencias";

const LIGHT = {
  orange:      "#F47920",
  bg:          "#f1f5f9",
  surface:     "#ffffff",
  surfaceAlt:  "#f8fafc",
  border:      "#e2e8f0",
  text:        "#1D1D1B",
  textMuted:   "#64748b",
  textFaint:   "#cbd5e1",
  sidebar:     "#1D1D1B",
  sidebarText: "#94a3b8",
};
const DARK = {
  orange:      "#F47920",
  bg:          "#0b0e14",
  surface:     "#141720",
  surfaceAlt:  "#1c2030",
  border:      "#252a3a",
  text:        "#f1f5f9",
  textMuted:   "#94a3b8",
  textFaint:   "#3d4460",
  sidebar:     "#0d1018",
  sidebarText: "#5a6480",
};

const STATS = [
  { label: "Tickets Totales", valor: 0, color: "#3b82f6", bgL: "#eff6ff", bgD: "#0f1f3d", icon: TrendingUp  },
  { label: "En Proceso",      valor: 0, color: "#F47920", bgL: "#fff7ed", bgD: "#2d1200", icon: Clock        },
  { label: "Finalizados",     valor: 0, color: "#16a34a", bgL: "#f0fdf4", bgD: "#071a0e", icon: CheckCircle2 },
];
const TICKETS = [];
const USUARIO = { nombre: "", puesto: "" };
const P_BADGE = {
  Alta:  { background: "#fee2e2", color: "#dc2626" },
  Media: { background: "#fef9c3", color: "#ca8a04" },
  Baja:  { background: "#dcfce7", color: "#16a34a" },
};
const E_BADGE = {
  Abierto:      { background: "#dbeafe", color: "#2563eb" },
  "En Proceso": { background: "#ffedd5", color: "#ea580c" },
  Cerrado:      { background: "#f3f4f6", color: "#6b7280" },
};
const NAV = [
  { icon: LayoutDashboard, label: "Dashboard"               },
  { icon: FilePlus,        label: "Nuevo Reporte"            },
  { icon: ClipboardList,   label: "Historial de Incidencias" },
  { icon: ShoppingCart,    label: "Solicitud de Insumo"      },
  { icon: BookOpen,        label: "Manuales de Incidencias"  },
];

// ── RELOJ ────────────────────────────────────────────────────
function RelojFecha({ T }) {
  const [ahora, setAhora] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setAhora(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  const pad  = n => String(n).padStart(2, "0");
  const dia  = pad(ahora.getDate());
  const mes  = pad(ahora.getMonth() + 1);
  const anio = ahora.getFullYear();
  const hrs  = ahora.getHours();
  const min  = pad(ahora.getMinutes());
  const seg  = pad(ahora.getSeconds());
  const ampm = hrs >= 12 ? "pm" : "am";
  const h12  = pad(hrs % 12 || 12);
  return (
    <div className="rounded-xl overflow-hidden"
      style={{ border: `1px solid ${T.border}` }}>
      <div className="px-4 py-2 flex items-center justify-between"
        style={{ background: T.orange }}>
        <span className="text-[9px] font-bold uppercase tracking-widest text-white/80">Fecha y hora</span>
        <Clock size={11} color="rgba(255,255,255,0.7)" />
      </div>
      <div className="px-4 py-3 flex items-center justify-between"
        style={{ background: T.surfaceAlt }}>
        <p className="text-xs font-semibold">
          <span style={{ color: T.text, fontWeight: 700 }}>{dia}</span>
          <span style={{ color: T.orange, fontWeight: 700 }}>/</span>
          <span style={{ color: T.text, fontWeight: 700 }}>{mes}</span>
          <span style={{ color: T.orange, fontWeight: 700 }}>/</span>
          <span style={{ color: T.text, fontWeight: 700 }}>{anio}</span>
        </p>
        <p className="text-xs font-black" style={{ color: T.text }}>
          {h12}:{min}<span style={{ color: T.orange }}>:{seg}</span>
          <span className="text-[10px] font-semibold ml-1" style={{ color: T.textMuted }}>{ampm}</span>
        </p>
      </div>
    </div>
  );
}

// ── CALENDARIO ───────────────────────────────────────────────
function Calendario({ T }) {
  const hoy = new Date();
  const mes  = hoy.getMonth();
  const anio = hoy.getFullYear();
  const MESES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio",
                 "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
  const DIAS  = ["Do","Lu","Ma","Mi","Ju","Vi","Sa"];
  const primerDia = new Date(anio, mes, 1).getDay();
  const totalDias = new Date(anio, mes+1, 0).getDate();
  const celdas = [
    ...Array(primerDia).fill(null),
    ...Array.from({ length: totalDias }, (_, i) => i + 1),
  ];
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-center">
        <span className="text-[11px] font-bold" style={{ color: T.text }}>{MESES[mes]} {anio}</span>
      </div>
      <div className="grid grid-cols-7">
        {DIAS.map(d => (
          <div key={d} className="text-center text-[9px] font-bold py-0.5" style={{ color: T.textFaint }}>{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-y-0.5">
        {celdas.map((dia, i) => {
          const esHoy = dia === hoy.getDate();
          return (
            <div key={i} className="flex items-center justify-center h-6">
              {dia && (
                <span className="w-6 h-6 flex items-center justify-center rounded-full text-[11px] select-none transition-all"
                  style={{
                    background: esHoy ? T.orange : "transparent",
                    color:      esHoy ? "#fff"   : T.textMuted,
                    fontWeight: esHoy ? 700 : 400,
                    boxShadow:  esHoy ? `0 2px 8px rgba(244,121,32,0.5)` : "none",
                  }}>
                  {dia}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── SIDEBAR CONTENT ──────────────────────────────────────────
function SidebarContent({ T, activo, setActivo, onClose }) {
  return (
    <div className="relative flex flex-col h-full">

      {/* Logo */}
      <div className="flex flex-col items-center justify-center py-6 px-4"
        style={{ borderBottom: `1px solid rgba(255,255,255,0.06)` }}>
        <img src="/assets/img/logo.png" alt="PTP"
          className="object-contain drop-shadow-lg"
          style={{ height: "80px", width: "auto", maxWidth: "160px" }} />
      </div>

      {onClose && (
        <button onClick={onClose} className="absolute top-4 right-4 transition-colors"
          style={{ color: T.sidebarText }}
          onMouseEnter={e => e.currentTarget.style.color = "#fff"}
          onMouseLeave={e => e.currentTarget.style.color = T.sidebarText}>
          <X size={17} />
        </button>
      )}

      {/* Label sección */}
      <p className="px-5 pt-5 pb-2 text-[9px] font-bold uppercase tracking-[0.18em]"
        style={{ color: "rgba(255,255,255,0.2)" }}>
        Menú principal
      </p>

      {/* Nav */}
      <nav className="flex flex-col gap-0.5 flex-1 px-3">
        {NAV.map((item, i) => (
          <button key={i} onClick={() => { setActivo(i); onClose?.(); }}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all w-full text-left relative"
            style={{
              background: activo === i
                ? `linear-gradient(135deg, ${T.orange}, #d97400)`
                : "transparent",
              color: activo === i ? "#fff" : T.sidebarText,
              boxShadow: activo === i ? `0 4px 12px rgba(244,121,32,0.35)` : "none",
            }}
            onMouseEnter={e => { if (activo !== i) { e.currentTarget.style.background = "rgba(255,255,255,0.06)"; e.currentTarget.style.color = "#fff"; }}}
            onMouseLeave={e => { if (activo !== i) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = T.sidebarText; }}}
          >
            <item.icon size={16} strokeWidth={activo === i ? 2.5 : 1.8} style={{ flexShrink: 0 }} />
            <span style={{ fontSize: "12.5px", fontWeight: activo === i ? 700 : 500, lineHeight: "1.3" }}>
              {item.label}
            </span>
          </button>
        ))}
      </nav>

      {/* Cerrar sesión */}
      <div className="px-3 pb-4 pt-2" style={{ borderTop: `1px solid rgba(255,255,255,0.06)` }}>
        <button
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all w-full"
          style={{ color: T.sidebarText }}
          onMouseEnter={e => { e.currentTarget.style.background = "rgba(239,68,68,0.1)"; e.currentTarget.style.color = "#ef4444"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = T.sidebarText; }}
        >
          <LogOut size={16} strokeWidth={1.8} style={{ flexShrink: 0 }} />
          <span style={{ fontSize: "12.5px", fontWeight: 500 }}>Cerrar sesión</span>
        </button>
      </div>
    </div>
  );
}

function Sidebar({ T, activo, setActivo }) {
  return (
    <aside className="hidden md:flex flex-shrink-0 flex-col h-screen"
      style={{ width: "220px", background: T.sidebar, boxShadow: "2px 0 12px rgba(0,0,0,0.15)" }}>
      <SidebarContent T={T} activo={activo} setActivo={setActivo} />
    </aside>
  );
}

function SidebarMobile({ T, activo, setActivo, open, onClose }) {
  if (!open) return null;
  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden" onClick={onClose} />
      <aside className="fixed top-0 left-0 z-50 flex flex-col h-screen md:hidden"
        style={{ width: "260px", background: T.sidebar }}>
        <SidebarContent T={T} activo={activo} setActivo={setActivo} onClose={onClose} />
      </aside>
    </>
  );
}

// ── PANEL DERECHO ─────────────────────────────────────────────
function PanelDerecho({ T }) {
  return (
    <aside className="hidden lg:flex flex-shrink-0 flex-col h-screen overflow-y-auto"
      style={{ width: "280px", background: T.surface, borderLeft: `1px solid ${T.border}` }}>
      <div className="flex flex-col h-full p-4 gap-3">

        {/* Perfil */}
        <div className="flex flex-col items-center text-center py-4 px-3 rounded-2xl relative overflow-hidden flex-shrink-0"
          style={{ background: T.surfaceAlt, border: `1px solid ${T.border}` }}>
          {/* Banda decorativa superior */}
          <div className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl"
            style={{ background: `linear-gradient(90deg, ${T.orange}, #ffb347)` }} />
          <div className="flex items-center justify-center rounded-full mt-2 mb-3"
            style={{ width: "68px", height: "68px", background: T.bg, border: `2.5px solid ${T.orange}`, boxShadow: `0 0 0 4px rgba(244,121,32,0.1)` }}>
            <User size={30} style={{ color: T.textFaint }} />
          </div>
          <p className="font-black text-sm" style={{ color: T.text }}>{USUARIO.nombre || "—"}</p>
          <p className="text-xs mt-0.5" style={{ color: T.textMuted }}>{USUARIO.puesto || "—"}</p>
          <span className="mt-3 px-3 py-1 rounded-full text-[10px] font-bold"
            style={{ background: `linear-gradient(135deg, rgba(244,121,32,0.15), rgba(244,121,32,0.08))`, color: T.orange, border: `1px solid rgba(244,121,32,0.2)` }}>
            ● Usuario activo
          </span>
        </div>

        {/* Reloj */}
        <RelojFecha T={T} />

        {/* Métricas */}
        <div className="flex flex-col gap-1.5 flex-shrink-0">
          {STATS.map((s, i) => (
            <div key={i} className="flex items-center justify-between px-4 py-3 rounded-xl"
              style={{ background: T === DARK ? s.bgD : s.bgL, border: `1px solid ${T.border}` }}>
              <div className="flex items-center gap-2.5">
                <s.icon size={14} style={{ color: s.color, flexShrink: 0 }} />
                <span className="text-xs font-semibold" style={{ color: T.textMuted }}>{s.label}</span>
              </div>
              <span className="text-2xl font-black" style={{ color: s.color }}>{s.valor}</span>
            </div>
          ))}
        </div>

        {/* Calendario */}
        <div className="rounded-2xl overflow-hidden flex-shrink-0"
          style={{ border: `1px solid ${T.border}` }}>
          <div className="px-4 py-2.5 flex items-center justify-between"
            style={{ background: T.surfaceAlt, borderBottom: `1px solid ${T.border}` }}>
            <p className="text-[9px] font-bold uppercase tracking-widest" style={{ color: T.textMuted }}>
              Calendario
            </p>
          </div>
          <div className="p-4" style={{ background: T.surface }}>
            <Calendario T={T} />
          </div>
        </div>
      </div>
    </aside>
  );
}

// ── ESTADÍSTICAS ─────────────────────────────────────────────
const PRIORIDAD_DATA = [
  { label: "Urgente", valor: 0, total: 0, color: "#dc2626", bg: "#fee2e2" },
  { label: "Alta",    valor: 0, total: 0, color: "#ea580c", bg: "#ffedd5" },
  { label: "Media",   valor: 0, total: 0, color: "#ca8a04", bg: "#fef9c3" },
  { label: "Baja",    valor: 0, total: 0, color: "#16a34a", bg: "#dcfce7" },
];

const ESTATUS_DATA = [
  { label: "Finalizado", valor: 0, color: "#16a34a" },
  { label: "En Proceso", valor: 0, color: "#ca8a04" },
  { label: "Revisión",   valor: 0, color: "#ea580c" },
];

function GraficaPastel({ data, size = 100 }) {
  const total = data.reduce((s, d) => s + d.valor, 0);
  const r  = size / 2 - 6;
  const cx = size / 2;
  const cy = size / 2;
  const circ = 2 * Math.PI * r;

  if (total === 0) return (
    <svg width={size} height={size}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#e2e8f0" strokeWidth="12" />
      <text x={cx} y={cy + 4} textAnchor="middle" fontSize="9" fill="#94a3b8" fontWeight="600">Sin datos</text>
    </svg>
  );

  let offset = 0;
  const segs = data.map(d => {
    const dash = (d.valor / total) * circ;
    const s = { ...d, dash, gap: circ - dash, offset };
    offset += dash;
    return s;
  });

  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
      {segs.map((s, i) => (
        <circle key={i} cx={cx} cy={cy} r={r} fill="none"
          stroke={s.color} strokeWidth="12"
          strokeDasharray={`${s.dash} ${s.gap}`}
          strokeDashoffset={-s.offset} strokeLinecap="butt" />
      ))}
    </svg>
  );
}

function SeccionEstadisticas({ T }) {
  const isDark = T.bg === "#0b0e14";
  const cardStyle = {
    background: isDark ? "#141720" : T.surface,
    border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : T.border}`,
    boxShadow: isDark ? "0 4px 20px rgba(0,0,0,0.4)" : "0 1px 6px rgba(0,0,0,0.06)",
  };
  const totalEstatus = ESTATUS_DATA.reduce((s, d) => s + d.valor, 0);
  const hdr = { borderBottom: `1px solid ${isDark ? "rgba(255,255,255,0.07)" : T.border}`, background: isDark ? "rgba(255,255,255,0.03)" : T.surfaceAlt };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">

      {/* Tarjeta 1: Prioridad */}
      <div className="rounded-xl overflow-hidden" style={cardStyle}>
        <div className="px-4 py-2.5 flex items-center gap-2" style={hdr}>
          <div className="w-1 h-3.5 rounded-full" style={{ background: "#F47920" }} />
          <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: isDark ? "rgba(255,255,255,0.45)" : T.textMuted }}>Reportes por Prioridad</p>
        </div>
        <div className="px-4 py-3 flex flex-col gap-2.5">
          {PRIORIDAD_DATA.map((p, i) => {
            const pct = p.total > 0 ? Math.round((p.valor / p.total) * 100) : 0;
            return (
              <div key={i} className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
                    <span className="text-[11px] font-semibold" style={{ color: isDark ? "rgba(255,255,255,0.65)" : T.text }}>{p.label}</span>
                  </div>
                  <span className="text-[11px] font-black" style={{ color: p.color }}>{p.valor}</span>
                </div>
                <div className="relative h-4 rounded-full overflow-hidden"
                  style={{ background: isDark ? "rgba(255,255,255,0.06)" : p.bg }}>
                  <div className="h-full rounded-full flex items-center justify-end pr-2 transition-all duration-700"
                    style={{ width: `${pct > 0 ? Math.max(pct, 10) : 0}%`, background: p.color }}>
                    {p.valor > 0 && <span className="text-[9px] font-black text-white">{pct}%</span>}
                  </div>
                  {p.valor === 0 && (
                    <span className="absolute inset-0 flex items-center pl-2.5 text-[9px]"
                      style={{ color: isDark ? "rgba(255,255,255,0.2)" : T.textFaint }}>Sin registros</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tarjeta 2: Estatus */}
      <div className="rounded-xl overflow-hidden" style={cardStyle}>
        <div className="px-4 py-2.5 flex items-center gap-2" style={hdr}>
          <div className="w-1 h-3.5 rounded-full" style={{ background: "#F47920" }} />
          <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: isDark ? "rgba(255,255,255,0.45)" : T.textMuted }}>Tickets por Estatus</p>
        </div>
        <div className="px-4 py-3 flex items-center gap-4">
          {/* Pastel */}
          <div className="relative flex-shrink-0">
            <GraficaPastel data={ESTATUS_DATA} size={100} />
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-base font-black" style={{ color: isDark ? "#f1f5f9" : T.text }}>{totalEstatus}</span>
              <span className="text-[8px] font-semibold" style={{ color: isDark ? "rgba(255,255,255,0.3)" : T.textMuted }}>total</span>
            </div>
          </div>
          {/* Leyenda */}
          <div className="flex flex-col gap-2 flex-1">
            {ESTATUS_DATA.map((e, i) => {
              const pct = totalEstatus > 0 ? Math.round((e.valor / totalEstatus) * 100) : 0;
              return (
                <div key={i} className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: e.color }} />
                  <span className="text-[11px] flex-1" style={{ color: isDark ? "rgba(255,255,255,0.6)" : T.text }}>{e.label}</span>
                  <span className="text-[11px] font-black" style={{ color: e.color }}>{pct}%</span>
                  <span className="text-[10px]" style={{ color: isDark ? "rgba(255,255,255,0.22)" : T.textFaint }}>({e.valor})</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── TABLA ─────────────────────────────────────────────────────
const P_BADGE_DARK = {
  Urgente: { background: "rgba(220,38,38,0.18)",  color: "#f87171" },
  Alta:    { background: "rgba(234,88,12,0.18)",  color: "#fb923c" },
  Media:   { background: "rgba(202,138,4,0.18)",  color: "#fbbf24" },
  Baja:    { background: "rgba(22,163,74,0.18)",  color: "#4ade80" },
};
const E_BADGE_DARK = {
  Finalizado:   { background: "rgba(22,163,74,0.18)",  color: "#4ade80" },
  "En Proceso": { background: "rgba(202,138,4,0.18)",  color: "#fbbf24" },
  "Revisión":   { background: "rgba(234,88,12,0.18)",  color: "#fb923c" },
};

function Tabla({ T }) {
  const isDark = T.bg === "#0b0e14";
  const [busqueda, setBusqueda] = useState("");
  const COLS = ["ID", "Asunto", "Categoría", "Prioridad", "Estatus", "Fecha"];

  const filtrados = TICKETS.filter(t =>
    !busqueda ||
    Object.values(t).some(v => String(v).toLowerCase().includes(busqueda.toLowerCase()))
  );

  const pBadge = (p) => isDark ? (P_BADGE_DARK[p] || {}) : (P_BADGE[p] || {});
  const eBadge = (e) => isDark ? (E_BADGE_DARK[e] || {}) : (E_BADGE[e] || {});

  return (
    <div className="rounded-2xl overflow-hidden"
      style={{ border: `1px solid ${T.border}`, boxShadow: `0 1px 3px rgba(0,0,0,0.06)` }}>

      {/* Buscador */}
      <div className="flex items-center justify-between px-4 py-3"
        style={{ borderBottom: `1px solid ${T.border}`, background: T.surfaceAlt }}>
        <p className="text-xs font-bold" style={{ color: T.textMuted }}>Incidencias</p>
        <div className="relative">
          <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" width="12" height="12" viewBox="0 0 12 12" fill="none">
            <circle cx="5" cy="5" r="3.5" stroke={T.textFaint} strokeWidth="1.4"/>
            <path d="M8 8l2 2" stroke={T.textFaint} strokeWidth="1.4" strokeLinecap="round"/>
          </svg>
          <input
            className="pl-7 pr-3 py-1.5 rounded-lg text-xs outline-none transition-all w-40 sm:w-52"
            style={{ background: T.bg, border: `1px solid ${T.border}`, color: T.text }}
            placeholder="Buscar ticket..."
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            onFocus={e => { e.target.style.borderColor = "#F47920"; e.target.style.boxShadow = "0 0 0 2px rgba(244,121,32,0.12)"; }}
            onBlur={e =>  { e.target.style.borderColor = T.border;   e.target.style.boxShadow = "none"; }}
          />
        </div>
      </div>

      {/* Tabla */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse" style={{ minWidth: "560px" }}>
          <thead>
            <tr style={{ background: T.surfaceAlt }}>
              {COLS.map(col => (
                <th key={col}
                  className="text-left px-5 py-3.5 text-[10px] font-bold uppercase tracking-widest whitespace-nowrap"
                  style={{ color: T.textMuted, borderBottom: `1px solid ${T.border}` }}>
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtrados.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ background: T.surface }}>
                  <div className="flex flex-col items-center justify-center py-16 gap-3">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
                      style={{ background: T.surfaceAlt, border: `1px solid ${T.border}` }}>
                      <AlertCircle size={22} style={{ color: T.textFaint }} />
                    </div>
                    <p className="text-sm font-semibold" style={{ color: T.textMuted }}>
                      {busqueda ? "Sin resultados" : "No hay incidencias registradas"}
                    </p>
                    <p className="text-xs" style={{ color: T.textFaint }}>
                      {busqueda ? `No se encontró "${busqueda}"` : "Crea un nuevo reporte para comenzar"}
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              filtrados.map((t, i) => (
                <tr key={i} className="cursor-pointer transition-colors"
                  style={{ borderBottom: `1px solid ${T.border}`, background: T.surface }}
                  onMouseEnter={e => e.currentTarget.style.background = T.surfaceAlt}
                  onMouseLeave={e => e.currentTarget.style.background = T.surface}>
                  <td className="px-5 py-3.5 font-mono text-xs font-bold" style={{ color: T.orange }}>#{t.id}</td>
                  <td className="px-5 py-3.5 font-semibold text-xs max-w-[160px]">
                    <span className="block truncate" style={{ color: T.text }}>{t.asunto}</span>
                  </td>
                  <td className="px-5 py-3.5 text-xs" style={{ color: T.textMuted }}>{t.categoria}</td>
                  <td className="px-5 py-3.5">
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold"
                      style={pBadge(t.prioridad)}>{t.prioridad}</span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold"
                      style={eBadge(t.estatus)}>{t.estatus}</span>
                  </td>
                  <td className="px-5 py-3.5 text-xs whitespace-nowrap" style={{ color: T.textFaint }}>{t.fecha}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── LAYOUT PRINCIPAL ──────────────────────────────────────────
export default function UsuarioDashboard() {
  const [dark,        setDark]        = useState(false);
  const [activo,      setActivo]      = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const T = dark ? DARK : LIGHT;

  return (
    <div className="flex flex-row h-screen w-screen overflow-hidden"
      style={{ fontFamily: "'Inter','Segoe UI',sans-serif", background: T.bg }}>

      <Sidebar T={T} activo={activo} setActivo={setActivo} />
      <SidebarMobile T={T} activo={activo} setActivo={setActivo}
        open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex flex-col flex-1 overflow-hidden">

        {/* Header */}
        <header className="flex-shrink-0 flex items-center justify-between px-4 md:px-7 py-4"
          style={{ background: T.surface, borderBottom: `1px solid ${T.border}`, minHeight: "68px", boxShadow: `0 1px 4px rgba(0,0,0,0.05)` }}>

          <div className="flex items-center gap-3">
            <button className="md:hidden flex items-center justify-center w-9 h-9 rounded-xl"
              style={{ background: T.surfaceAlt, color: T.textMuted, border: `1px solid ${T.border}` }}
              onClick={() => setSidebarOpen(true)}>
              <Menu size={17} />
            </button>
            <div className="hidden md:flex items-center gap-2.5">
              <div className="w-1 h-7 rounded-full" style={{ background: `linear-gradient(180deg, ${T.orange}, #ffb347)` }} />
              <h1 className="text-[17px] font-black tracking-tight" style={{ color: T.text }}>
                {activo === 1 ? "Nuevo Reporte" : activo === 2 ? "Historial de Incidencias" : activo === 4 ? "Manuales de Incidencias" : "Incidencias Actuales"}
              </h1>
            </div>
            <h1 className="md:hidden text-[15px] font-black" style={{ color: T.text }}>
              Incidencias
            </h1>
          </div>

          <div className="flex items-center gap-2">

            {/* Toggle modo */}
            <button onClick={() => setDark(d => !d)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl transition-all text-xs font-semibold"
              style={{ background: T.surfaceAlt, color: dark ? "#f59e0b" : T.textMuted, border: `1px solid ${T.border}` }}>
              {dark ? <Sun size={14} /> : <Moon size={14} />}
              <span className="hidden sm:inline">{dark ? "Claro" : "Oscuro"}</span>
            </button>

            {/* Nuevo ticket */}
            <button
              onClick={() => setActivo(1)}
              className="flex items-center gap-1.5 px-3 md:px-4 py-2 md:py-2.5 rounded-xl text-xs md:text-sm font-bold text-white hover:brightness-110 active:scale-95 transition-all"
              style={{ background: `linear-gradient(135deg, ${T.orange}, #d97400)`, boxShadow: "0 4px 14px rgba(244,121,32,0.4)" }}>
              <Plus size={14} strokeWidth={2.5} />
              <span className="hidden sm:inline">Nuevo Reporte</span>
              <span className="sm:hidden">Nuevo</span>
            </button>
          </div>
        </header>

        {/* Contenido */}
        <div className="flex-1 overflow-hidden" style={{ background: T.bg }}>
          {activo === 1
            ? <NuevoReporte T={T} />
            : activo === 2
            ? <HistorialIncidencias T={T} />
            : activo === 4
            ? <ManualesIncidencias T={T} />
            : <div className="h-full overflow-y-auto p-4 md:p-6 flex flex-col gap-0">
                <SeccionEstadisticas T={T} />
                <Tabla T={T} />
              </div>
          }
        </div>
      </div>

      <PanelDerecho T={T} />
    </div>
  );
}
