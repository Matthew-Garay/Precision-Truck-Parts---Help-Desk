import { useState, useEffect } from "react";
import {
  LayoutDashboard, ClipboardList, ShoppingCart,
  BookOpen, LogOut, Plus, User, Sun, Moon,
  Menu, X, TrendingUp, Clock, CheckCircle2,
  AlertCircle, Filter, FilePlus
} from "lucide-react";
import NuevoReporte from "./NuevoReporte";

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

// ── TABLA ─────────────────────────────────────────────────────
function Tabla({ T }) {
  const COLS = ["ID", "Asunto", "Categoría", "Prioridad", "Estatus", "Fecha"];
  return (
    <div className="rounded-2xl overflow-hidden"
      style={{ border: `1px solid ${T.border}`, boxShadow: `0 1px 3px rgba(0,0,0,0.06)` }}>
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
          {TICKETS.length === 0 ? (
            <tr>
              <td colSpan={6} style={{ background: T.surface }}>
                <div className="flex flex-col items-center justify-center py-20 gap-3">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
                    style={{ background: T.surfaceAlt, border: `1px solid ${T.border}` }}>
                    <AlertCircle size={24} style={{ color: T.textFaint }} />
                  </div>
                  <p className="text-sm font-semibold" style={{ color: T.textMuted }}>
                    No hay incidencias registradas
                  </p>
                  <p className="text-xs" style={{ color: T.textFaint }}>
                    Crea un nuevo ticket para comenzar
                  </p>
                </div>
              </td>
            </tr>
          ) : (
            TICKETS.map((t, i) => (
              <tr key={i} className="cursor-pointer transition-colors"
                style={{ borderBottom: `1px solid ${T.border}`, background: T.surface }}
                onMouseEnter={e => e.currentTarget.style.background = T.surfaceAlt}
                onMouseLeave={e => e.currentTarget.style.background = T.surface}
              >
                <td className="px-5 py-3.5 font-mono text-xs font-bold" style={{ color: T.orange }}>#{t.id}</td>
                <td className="px-5 py-3.5 font-semibold" style={{ color: T.text }}>{t.asunto}</td>
                <td className="px-5 py-3.5 text-xs" style={{ color: T.textMuted }}>{t.categoria}</td>
                <td className="px-5 py-3.5">
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold"
                    style={P_BADGE[t.prioridad] || {}}>{t.prioridad}</span>
                </td>
                <td className="px-5 py-3.5">
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold"
                    style={E_BADGE[t.estatus] || {}}>{t.estatus}</span>
                </td>
                <td className="px-5 py-3.5 text-xs whitespace-nowrap" style={{ color: T.textFaint }}>{t.fecha}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
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
                {activo === 1 ? "Nuevo Reporte" : "Incidencias Actuales"}
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
            : <div className="h-full overflow-y-auto p-4 md:p-6"><Tabla T={T} /></div>
          }
        </div>
      </div>

      <PanelDerecho T={T} />
    </div>
  );
}
