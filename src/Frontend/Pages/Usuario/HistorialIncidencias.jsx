import { useState, useEffect } from "react";
import { Search, Eye, ChevronDown, Ticket, CheckCircle2, Clock, Inbox, X, SlidersHorizontal } from "lucide-react";
import API from "../../Config/api";

const PRIORIDADES_OPTS = ["Todos","Urgente","Alta","Media","Baja"];
const ESTATUS_OPTS     = ["Todos","Resuelto","En proceso","No Resuelto"];
const MESES            = ["Todos","Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
const PCOLOR           = { Urgente:"#dc2626", Alta:"#ea580c", Media:"#ca8a04", Baja:"#16a34a" };

function Gauge({ pct, T }) {
  const r = 40, cx = 54, cy = 52;
  const circ = Math.PI * r;
  const dash  = (pct / 100) * circ;
  const color = pct >= 75 ? "#16a34a" : pct >= 50 ? "#ca8a04" : "#dc2626";
  return (
    <div className="flex flex-col items-center">
      <svg width="108" height="60" viewBox="0 0 108 60" className="overflow-visible">
        <path d={`M ${cx-r} ${cy} A ${r} ${r} 0 0 1 ${cx+r} ${cy}`}
          fill="none" stroke={T.border} strokeWidth="9" strokeLinecap="round"/>
        <path d={`M ${cx-r} ${cy} A ${r} ${r} 0 0 1 ${cx+r} ${cy}`}
          fill="none" stroke={color} strokeWidth="9" strokeLinecap="round"
          strokeDasharray={`${dash} ${circ}`}
          style={{ filter:`drop-shadow(0 0 3px ${color}55)` }}/>
        <text x={cx} y={cy-7}  textAnchor="middle" fontSize="16" fontWeight="900" fill={T.text}>{pct}%</text>
        <text x={cx} y={cy+5}  textAnchor="middle" fontSize="7" fontWeight="600" fill={T.textMuted} letterSpacing="0.8">SATISFACCIÓN</text>
      </svg>
      <span className="mt-1 px-2 py-0.5 rounded-full text-[9px] font-bold"
        style={{ background:`${color}15`, color, border:`1px solid ${color}35` }}>
        {pct >= 75 ? "Excelente" : pct >= 50 ? "Regular" : "Bajo"}
      </span>
    </div>
  );
}

function FiltroSelect({ label, value, onChange, opts, active, T, isDark }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[8px] font-black uppercase tracking-wider"
        style={{ color: active ? T.orange : T.textFaint }}>{label}</span>
      <div className="relative">
        <select value={value} onChange={e => onChange(e.target.value)}
          className="appearance-none pl-2 pr-5 py-1 rounded-md text-[11px] font-semibold outline-none cursor-pointer"
          style={{
            background: active?(isDark?"rgba(244,121,32,0.12)":"rgba(244,121,32,0.07)"):(isDark?"rgba(255,255,255,0.05)":T.surfaceAlt),
            border:`1px solid ${active?T.orange:T.border}`,
            color: active?T.orange:T.text,
            colorScheme: isDark?"dark":"light",
            minWidth: "90px",
            maxWidth: "160px",
            flexShrink: 0,
          }}>
          {opts.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
        <ChevronDown size={9} className="absolute right-1 top-1/2 -translate-y-1/2 pointer-events-none"
          style={{ color: active?T.orange:T.textMuted }} />
      </div>
    </div>
  );
}

function EmptyState({ T, filtered }) {
  return (
    <tr><td colSpan={7}>
      <div className="flex flex-col items-center justify-center py-10 gap-2">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background:T.surfaceAlt, border:`1px solid ${T.border}` }}>
          <Inbox size={18} style={{ color:T.textFaint }}/>
        </div>
        <p className="text-xs font-bold" style={{ color:T.textMuted }}>
          {filtered ? "Sin resultados" : "No hay incidencias registradas"}
        </p>
        <p className="text-[11px]" style={{ color:T.textFaint }}>
          {filtered ? "Ajusta los filtros" : "Los tickets aparecerán aquí una vez creados"}
        </p>
      </div>
    </td></tr>
  );
}

export default function HistorialIncidencias({ T, usuario = {}, onVerTicket }) {
  const [tickets,        setTickets]        = useState([]);
  const [busqueda,       setBusqueda]       = useState("");
  const [prioFiltro,     setPrioFiltro]     = useState("Todos");
  const [estatusFiltro,  setEstatusFiltro]  = useState("Todos");
  const [categoriaFiltro,setCategoriaFiltro]= useState("Todos");
  const [mesFiltro,      setMesFiltro]      = useState("Todos");
  const [anioFiltro,     setAnioFiltro]     = useState("Todos");

  useEffect(() => {
    if (!usuario?.id_empleado) return;
    const cargar = () =>
      fetch(`${API}/api/tickets/empleado/${usuario.id_empleado}`)
        .then(r => r.json())
        .then(d => { if (Array.isArray(d)) setTickets(prev => JSON.stringify(prev) === JSON.stringify(d) ? prev : d); })
        .catch(() => {});
    cargar();
    const id = setInterval(cargar, 5000);
    return () => clearInterval(id);
  }, [usuario?.id_empleado]);

  const total     = tickets.length;
  const activos   = tickets.filter(t => t.estatus === "En proceso").length;
  const resueltos = tickets.filter(t => t.estatus === "Resuelto").length;
  const calificados = tickets.filter(t => t.calificacion && parseInt(t.calificacion) > 0);
  const pctSat = calificados.length > 0
    ? Math.round((calificados.reduce((sum, t) => sum + parseInt(t.calificacion), 0) / (calificados.length * 5)) * 100)
    : 0;

  const aniosDisponibles = ["Todos", ...Array.from(
    new Set(tickets.filter(t => t.fecha_subido).map(t => new Date(t.fecha_subido).getFullYear().toString()))
  ).sort((a,b) => b - a)];

  const categoriasOpts = ["Todos", ...Array.from(new Set(tickets.map(t => t.nombre_categoria).filter(Boolean)))];

  const limpiar = () => {
    setBusqueda(""); setPrioFiltro("Todos"); setEstatusFiltro("Todos");
    setCategoriaFiltro("Todos"); setMesFiltro("Todos"); setAnioFiltro("Todos");
  };

  const hayFiltros = busqueda || prioFiltro!=="Todos" || estatusFiltro!=="Todos"
    || categoriaFiltro!=="Todos" || mesFiltro!=="Todos" || anioFiltro!=="Todos";

  const filtrados = tickets.filter(t => {
    if (busqueda && !t.titulo?.toLowerCase().includes(busqueda.toLowerCase())
      && !t.folio_ticket?.toLowerCase().includes(busqueda.toLowerCase())) return false;
    if (prioFiltro     !== "Todos" && t.prioridad          !== prioFiltro)     return false;
    if (estatusFiltro  !== "Todos" && t.estatus            !== estatusFiltro)  return false;
    if (categoriaFiltro!== "Todos" && t.nombre_categoria   !== categoriaFiltro)return false;
    if (anioFiltro !== "Todos" && t.fecha_subido)
      if (new Date(t.fecha_subido).getFullYear().toString() !== anioFiltro) return false;
    if (mesFiltro !== "Todos" && t.fecha_subido)
      if (new Date(t.fecha_subido).getMonth()+1 !== MESES.indexOf(mesFiltro)) return false;
    return true;
  });

  const isDark = T.bg === "#0b0e14";
  const card = {
    background: isDark?"#141720":T.surface,
    border:`1px solid ${isDark?"rgba(255,255,255,0.08)":T.border}`,
    boxShadow: isDark?"0 4px 20px rgba(0,0,0,0.3)":"0 1px 4px rgba(0,0,0,0.05)",
  };
  const hdr = {
    background: isDark?"rgba(255,255,255,0.03)":T.surfaceAlt,
    borderBottom:`1px solid ${isDark?"rgba(255,255,255,0.07)":T.border}`,
  };

  return (
    <div className="h-full flex flex-col overflow-hidden" style={{ background:T.bg }}>
      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        <div className="max-w-[1400px] mx-auto p-3 flex flex-col gap-3">

        {/* ── KPIs ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">

          {/* Satisfacción */}
          <div className="rounded-xl p-3 flex flex-col items-center gap-1.5" style={card}>
            <div className="flex items-center gap-1.5 w-full">
              <div className="w-0.5 h-3 rounded-full" style={{ background:T.orange }}/>
              <p className="text-[9px] font-black uppercase tracking-widest" style={{ color:T.textMuted }}>Nivel de Satisfacción</p>
            </div>
            <Gauge pct={pctSat} T={T}/>
            <p className="text-[10px] text-center" style={{ color:T.textMuted }}>
              Basado en <span className="font-bold" style={{ color:T.text }}>{calificados.length}</span> ticket{calificados.length !== 1 ? "s" : ""} calificado{calificados.length !== 1 ? "s" : ""}
            </p>
          </div>

          {/* Resumen */}
          <div className="lg:col-span-2 rounded-xl p-3 flex flex-col gap-2.5" style={card}>
            <div className="flex items-center gap-1.5">
              <div className="w-0.5 h-3 rounded-full" style={{ background:T.orange }}/>
              <p className="text-[9px] font-black uppercase tracking-widest" style={{ color:T.textMuted }}>Resumen de Tickets</p>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[
                { icon:Ticket,       label:"Total",      val:total,    color:"#3b82f6", bg:isDark?"#0f1f3d":"#eff6ff" },
                { icon:Clock,        label:"En Proceso", val:activos,  color:"#ea580c", bg:isDark?"#2d1200":"#ffedd5" },
                { icon:CheckCircle2, label:"Resueltos",  val:resueltos,color:"#16a34a", bg:isDark?"#071a0e":"#dcfce7" },
              ].map(({ icon:Icon, label, val, color, bg }) => (
                <div key={label} className="flex items-center gap-2 p-2.5 rounded-xl"
                  style={{ background:bg, border:`1px solid ${color}25` }}>
                  <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background:`${color}20` }}>
                    <Icon size={12} style={{ color }}/>
                  </div>
                  <div className="min-w-0">
                    <p className="text-[8px] font-bold uppercase tracking-wide truncate" style={{ color:`${color}cc` }}>{label}</p>
                    <p className="text-lg font-black leading-none" style={{ color }}>{val}</p>
                  </div>
                </div>
              ))}
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-[9px] font-semibold" style={{ color:T.textMuted }}>Tasa de resolución</span>
                <span className="text-[9px] font-black" style={{ color:T.text }}>{pctSat}%</span>
              </div>
              <div className="h-1.5 rounded-full overflow-hidden" style={{ background:T.border }}>
                <div className="h-full rounded-full transition-all duration-700"
                  style={{ width:`${pctSat}%`, background:`linear-gradient(90deg,${T.orange},#16a34a)` }}/>
              </div>
            </div>
          </div>
        </div>

        {/* ── FILTROS ── */}
        <div className="rounded-xl overflow-hidden" style={card}>
          <div className="flex items-center justify-between px-3 py-2" style={hdr}>
            <div className="flex items-center gap-1.5">
              <SlidersHorizontal size={12} style={{ color:T.orange }}/>
              <p className="text-[9px] font-black uppercase tracking-widest" style={{ color:T.textMuted }}>Filtros</p>
            </div>
            {hayFiltros && (
              <button onClick={limpiar}
                className="flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-md"
                style={{ color:T.orange, background:"rgba(244,121,32,0.08)", border:"1px solid rgba(244,121,32,0.2)" }}>
                <X size={9} strokeWidth={3}/> Limpiar
              </button>
            )}
          </div>

          <div className="px-3 py-2 flex flex-wrap items-end gap-x-2 gap-y-2">
            {/* Buscador */}
            <div className="flex flex-col gap-0.5" style={{ minWidth:"120px", flex:"1 1 120px", maxWidth:"180px" }}>
              <span className="text-[8px] font-black uppercase tracking-wider"
                style={{ color:busqueda?T.orange:T.textFaint }}>Buscar</span>
              <div className="relative">
                <Search size={11} className="absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none"
                  style={{ color:busqueda?T.orange:T.textFaint }}/>
                <input
                  className="w-full pl-6 pr-5 py-1 rounded-md text-[11px] outline-none"
                  style={{ background:isDark?"rgba(255,255,255,0.05)":T.surfaceAlt,
                    border:`1px solid ${busqueda?T.orange:T.border}`, color:T.text }}
                  placeholder="Título o folio..."
                  value={busqueda} onChange={e => setBusqueda(e.target.value)}
                  onFocus={e => { e.target.style.borderColor=T.orange; }}
                  onBlur={e  => { if(!busqueda) e.target.style.borderColor=T.border; }}/>
                {busqueda && (
                  <button onClick={()=>setBusqueda("")}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2">
                    <X size={9} strokeWidth={2.5} style={{ color:T.textMuted }}/>
                  </button>
                )}
              </div>
            </div>

            <FiltroSelect label="Estatus"   value={estatusFiltro}   onChange={setEstatusFiltro}   opts={ESTATUS_OPTS}      active={estatusFiltro!=="Todos"}   T={T} isDark={isDark}/>
            <FiltroSelect label="Categoría" value={categoriaFiltro} onChange={setCategoriaFiltro} opts={categoriasOpts}    active={categoriaFiltro!=="Todos"} T={T} isDark={isDark}/>
            <FiltroSelect label="Prioridad" value={prioFiltro}      onChange={setPrioFiltro}      opts={PRIORIDADES_OPTS}  active={prioFiltro!=="Todos"}      T={T} isDark={isDark}/>
            <FiltroSelect label="Año"       value={anioFiltro}      onChange={setAnioFiltro}      opts={aniosDisponibles}  active={anioFiltro!=="Todos"}      T={T} isDark={isDark}/>
            <FiltroSelect label="Mes"       value={mesFiltro}       onChange={setMesFiltro}       opts={MESES}             active={mesFiltro!=="Todos"}       T={T} isDark={isDark}/>
          </div>
        </div>{/* fin filtros */}

          {/* ── TABLA ── */}
          <div className="rounded-xl overflow-hidden flex flex-col" style={{ ...card, minHeight: "300px" }}>
          <div className="flex items-center justify-between px-3 py-2" style={hdr}>
            <div className="flex items-center gap-1.5">
              <div className="w-0.5 h-3 rounded-full" style={{ background:T.orange }}/>
              <p className="text-[9px] font-black uppercase tracking-widest" style={{ color:T.textMuted }}>Registros</p>
            </div>
            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full"
              style={{ background:T.bg, color:T.textMuted, border:`1px solid ${T.border}` }}>
              {filtrados.length} resultado{filtrados.length!==1?"s":""}
            </span>
          </div>

          {/* Móvil */}
          <div className="flex flex-col gap-2 p-3 sm:hidden">
            {filtrados.length === 0
              ? <div className="flex flex-col items-center justify-center py-8 gap-2">
                  <Inbox size={20} style={{ color:T.textFaint }}/>
                  <p className="text-xs font-bold" style={{ color:T.textMuted }}>
                    {hayFiltros?"Sin resultados":"No hay incidencias"}
                  </p>
                </div>
              : filtrados.map(t => {
                  const fecha = t.fecha_subido?new Date(t.fecha_subido).toLocaleDateString("es-MX",{day:"2-digit",month:"2-digit",year:"numeric"}):"—";
                  return (
                    <div key={t.id_ticket}
                      className="rounded-xl p-3 flex flex-col gap-2 active:scale-[0.98] transition-all"
                      style={{ background:isDark?"rgba(255,255,255,0.04)":T.surfaceAlt, border:`1px solid ${T.border}` }}
                      onClick={() => onVerTicket?.(t)}>
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-[11px] font-black" style={{ color:T.orange }}>{t.folio_ticket}</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold"
                          style={{
                            background:t.estatus==="Resuelto"?(isDark?"rgba(22,163,74,0.15)":"#dcfce7"):t.estatus==="No Resuelto"?(isDark?"rgba(220,38,38,0.15)":"#fee2e2"):(isDark?"rgba(234,88,12,0.15)":"#ffedd5"),
                            color:t.estatus==="Resuelto"?"#16a34a":t.estatus==="No Resuelto"?"#dc2626":"#ea580c",
                          }}>{t.estatus}</span>
                      </div>
                      <p className="text-xs font-semibold leading-snug" style={{ color:T.text }}>{t.titulo}</p>
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1 text-[11px] font-bold">
                          <span className="w-2 h-2 rounded-full" style={{ background:PCOLOR[t.prioridad]||"#94a3b8" }}/>
                          <span style={{ color:PCOLOR[t.prioridad]||T.textMuted }}>{t.prioridad}</span>
                        </span>
                        <span className="text-[11px]" style={{ color:T.textFaint }}>{fecha}</span>
                      </div>
                    </div>
                  );
                })
            }
          </div>

          {/* Desktop */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full border-collapse" style={{ minWidth:"680px" }}>
              <thead>
                <tr style={{ background:isDark?"rgba(255,255,255,0.03)":T.surfaceAlt }}>
                  {["Folio","Título","Prioridad","Estatus","Categoría","Fecha",""].map((col,i) => (
                    <th key={i} className="text-left px-3 py-2 text-[9px] font-black uppercase tracking-widest whitespace-nowrap"
                      style={{ color:T.textMuted, borderBottom:`1px solid ${T.border}` }}>
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtrados.length===0
                  ? <EmptyState T={T} filtered={hayFiltros}/>
                  : filtrados.map((t,i) => {
                    const fecha = t.fecha_subido?new Date(t.fecha_subido).toLocaleDateString("es-MX",{day:"2-digit",month:"2-digit",year:"numeric"}):"—";
                    const bgRow = i%2===0?(isDark?"#141720":T.surface):(isDark?"#1c2030":T.surfaceAlt);
                    return (
                      <tr key={t.id_ticket} className="transition-colors cursor-pointer"
                        style={{ background:bgRow, borderBottom:`1px solid ${T.border}` }}
                        onMouseEnter={e => e.currentTarget.style.background=isDark?"rgba(244,121,32,0.06)":"#eff6ff"}
                        onMouseLeave={e => e.currentTarget.style.background=bgRow}
                        onClick={() => onVerTicket?.(t)}>
                        <td className="px-3 py-2 font-mono text-[10px] font-bold" style={{ color:T.orange }}>{t.folio_ticket}</td>
                        <td className="px-3 py-2 text-[11px] font-semibold" style={{ maxWidth:"180px" }}>
                          <span className="block truncate" style={{ color:T.text }}>{t.titulo}</span>
                        </td>
                        <td className="px-3 py-2">
                          <span className="flex items-center gap-1 text-[11px] font-bold">
                            <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background:PCOLOR[t.prioridad]||"#94a3b8" }}/>
                            <span style={{ color:PCOLOR[t.prioridad]||T.textMuted }}>{t.prioridad}</span>
                          </span>
                        </td>
                        <td className="px-3 py-2">
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold"
                            style={{
                              background:t.estatus==="Resuelto"?(isDark?"rgba(22,163,74,0.15)":"#dcfce7"):t.estatus==="No Resuelto"?(isDark?"rgba(220,38,38,0.15)":"#fee2e2"):(isDark?"rgba(234,88,12,0.15)":"#ffedd5"),
                              color:t.estatus==="Resuelto"?"#16a34a":t.estatus==="No Resuelto"?"#dc2626":"#ea580c",
                            }}>{t.estatus}</span>
                        </td>
                        <td className="px-3 py-2 text-[11px]" style={{ color:T.textMuted }}>{t.nombre_categoria||"—"}</td>
                        <td className="px-3 py-2 text-[11px] whitespace-nowrap" style={{ color:T.textMuted }}>{fecha}</td>
                        <td className="px-3 py-2">
                          <button onClick={e => { e.stopPropagation(); onVerTicket?.(t); }}
                            className="flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-lg transition-all hover:brightness-110 active:scale-95"
                            style={{ color:T.orange, background:"rgba(244,121,32,0.08)", border:"1px solid rgba(244,121,32,0.2)" }}>
                            <Eye size={10}/> Ver
                          </button>
                        </td>
                      </tr>
                    );
                  })
                }
              </tbody>
            </table>
          </div>
        </div>{/* fin tabla */}
        </div>{/* fin max-w */}
      </div>{/* fin scroll */}
    </div>
  );
}
