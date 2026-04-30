import { useState } from "react";
import { Search, Star, Eye, ChevronDown, FileText, Ticket, CheckCircle2, Clock, Inbox } from "lucide-react";

const TICKETS = [];

const CATEGORIAS  = ["Todas","Mantenimiento","Redes","Soporte"];
const PRIORIDADES = [
  { label:"Urgente", color:"#dc2626", bg:"#fee2e2", border:"#fca5a5" },
  { label:"Alta",    color:"#ea580c", bg:"#ffedd5", border:"#fdba74" },
  { label:"Media",   color:"#ca8a04", bg:"#fef9c3", border:"#fde047" },
  { label:"Baja",    color:"#16a34a", bg:"#dcfce7", border:"#86efac" },
];
const ESTATUS_OPTS = ["Todos","Resuelto","En Proceso"];
const MESES = ["Todos","Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
const DIAS  = ["Todos",...Array.from({length:31},(_,i)=>String(i+1))];
const ANIOS = ["Todos","2023","2024","2025"];
const PCOLOR = { Urgente:"#dc2626", Alta:"#ea580c", Media:"#ca8a04", Baja:"#16a34a" };

// ── GAUGE ─────────────────────────────────────────────────────
function Gauge({ pct, T }) {
  const r = 44, cx = 60, cy = 58;
  const circ = Math.PI * r;
  const dash  = (pct / 100) * circ;
  const color = pct >= 75 ? "#16a34a" : pct >= 50 ? "#ca8a04" : "#dc2626";
  return (
    <div className="flex flex-col items-center">
      <svg width="120" height="66" viewBox="0 0 120 66" className="overflow-visible">
        <path d={`M ${cx-r} ${cy} A ${r} ${r} 0 0 1 ${cx+r} ${cy}`}
          fill="none" stroke={T.border} strokeWidth="10" strokeLinecap="round"/>
        <path d={`M ${cx-r} ${cy} A ${r} ${r} 0 0 1 ${cx+r} ${cy}`}
          fill="none" stroke={color} strokeWidth="10" strokeLinecap="round"
          strokeDasharray={`${dash} ${circ}`}
          style={{ filter:`drop-shadow(0 0 4px ${color}55)` }}/>
        <text x={cx} y={cy-8}  textAnchor="middle" fontSize="18" fontWeight="900" fill={T.text}>{pct}%</text>
        <text x={cx} y={cy+6}  textAnchor="middle" fontSize="7.5" fontWeight="600" fill={T.textMuted} letterSpacing="0.8">SATISFACCIÓN</text>
      </svg>
      <span className="mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold"
        style={{ background:`${color}15`, color, border:`1px solid ${color}35` }}>
        {pct >= 75 ? "Excelente" : pct >= 50 ? "Regular" : "Bajo"}
      </span>
    </div>
  );
}

// ── ESTRELLAS ─────────────────────────────────────────────────
function Stars({ n }) {
  return (
    <div className="flex gap-px">
      {[1,2,3,4,5].map(i => (
        <Star key={i} size={11} fill={i<=n?"#f59e0b":"none"} stroke={i<=n?"#f59e0b":"#cbd5e1"} strokeWidth={1.5}/>
      ))}
    </div>
  );
}

// ── MINI SELECT ───────────────────────────────────────────────
function Sel({ val, set, opts, lbl, active, T }) {
  return (
    <div className="relative">
      <select value={val} onChange={e => set(e.target.value)}
        className="appearance-none pl-2.5 pr-6 py-1.5 rounded-lg text-[11px] font-semibold outline-none cursor-pointer"
        style={{
          background: active ? "rgba(244,121,32,0.07)" : T.surfaceAlt,
          border: `1px solid ${active ? T.orange : T.border}`,
          color: active ? T.orange : T.text,
        }}>
        {opts.map(o => <option key={o} value={o}>{o === "Todos" || o === "Todas" ? lbl : o}</option>)}
      </select>
      <ChevronDown size={10} className="absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none"
        style={{ color: active ? T.orange : T.textMuted }}/>
    </div>
  );
}

// ── ESTADO VACÍO ──────────────────────────────────────────────
function EmptyState({ T, filtered }) {
  return (
    <tr>
      <td colSpan={10}>
        <div className="flex flex-col items-center justify-center py-12 gap-2">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background:T.surfaceAlt, border:`1px solid ${T.border}` }}>
            <Inbox size={20} style={{ color:T.textFaint }}/>
          </div>
          <p className="text-xs font-bold" style={{ color:T.textMuted }}>
            {filtered ? "Sin resultados" : "No hay incidencias registradas"}
          </p>
          <p className="text-[11px]" style={{ color:T.textFaint }}>
            {filtered ? "Ajusta los filtros" : "Los tickets aparecerán aquí una vez creados"}
          </p>
        </div>
      </td>
    </tr>
  );
}

// ── PRINCIPAL ─────────────────────────────────────────────────
export default function HistorialIncidencias({ T }) {
  const [busqueda,      setBusqueda]      = useState("");
  const [catFiltro,     setCatFiltro]     = useState("Todas");
  const [prioFiltro,    setPrioFiltro]    = useState([]);
  const [estatusFiltro, setEstatusFiltro] = useState("Todos");
  const [mesFiltro,     setMesFiltro]     = useState("Todos");
  const [diaFiltro,     setDiaFiltro]     = useState("Todos");
  const [anioFiltro,    setAnioFiltro]    = useState("Todos");

  const total    = TICKETS.length;
  const activos  = TICKETS.filter(t => t.estatus === "En Proceso").length;
  const resueltos= TICKETS.filter(t => t.estatus === "Resuelto").length;
  const pctSat   = resueltos > 0 ? 79 : 0;
  const pctRes   = total > 0 ? Math.round((resueltos/total)*100) : 0;

  const togglePrio = p =>
    setPrioFiltro(prev => prev.includes(p) ? prev.filter(x=>x!==p) : [...prev,p]);

  const limpiar = () => {
    setBusqueda(""); setCatFiltro("Todas"); setPrioFiltro([]);
    setEstatusFiltro("Todos"); setMesFiltro("Todos");
    setDiaFiltro("Todos"); setAnioFiltro("Todos");
  };

  const hayFiltros = busqueda || prioFiltro.length || estatusFiltro!=="Todos"
    || mesFiltro!=="Todos" || diaFiltro!=="Todos" || anioFiltro!=="Todos" || catFiltro!=="Todas";

  const filtrados = TICKETS.filter(t => {
    if (busqueda && !t.titulo.toLowerCase().includes(busqueda.toLowerCase())
      && !t.id.toLowerCase().includes(busqueda.toLowerCase())) return false;
    if (prioFiltro.length && !prioFiltro.includes(t.prioridad)) return false;
    if (estatusFiltro!=="Todos" && t.estatus!==estatusFiltro) return false;
    return true;
  });

  const card = { background:T.surface, border:`1px solid ${T.border}`, boxShadow:"0 1px 4px rgba(0,0,0,0.05)" };

  return (
    <div className="h-full overflow-y-auto" style={{ background:T.bg }}>
      <div className="p-3 md:p-4 flex flex-col gap-3 max-w-[1400px] mx-auto">

        {/* ── KPIs ─────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">

          {/* Gauge */}
          <div className="rounded-xl p-4 flex flex-col items-center gap-2" style={card}>
            <div className="flex items-center gap-1.5 w-full">
              <div className="w-0.5 h-3.5 rounded-full" style={{ background:T.orange }}/>
              <p className="text-[9px] font-black uppercase tracking-widest" style={{ color:T.textMuted }}>Nivel de Satisfacción</p>
            </div>
            <Gauge pct={pctSat} T={T}/>
            <p className="text-[11px] text-center" style={{ color:T.textMuted }}>
              Basado en <span className="font-bold" style={{ color:T.text }}>{resueltos}</span> tickets resueltos
            </p>
          </div>

          {/* Resumen */}
          <div className="lg:col-span-2 rounded-xl p-4 flex flex-col gap-3" style={card}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <div className="w-0.5 h-3.5 rounded-full" style={{ background:T.orange }}/>
                <p className="text-[9px] font-black uppercase tracking-widest" style={{ color:T.textMuted }}>Resumen de Tickets</p>
              </div>
              <button className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-bold text-white hover:brightness-110 active:scale-95 transition-all"
                style={{ background:`linear-gradient(135deg,${T.orange},#d97400)`, boxShadow:"0 3px 10px rgba(244,121,32,0.3)" }}>
                <FileText size={11}/> Crear Reporte
              </button>
            </div>

            {/* 3 mini-KPIs */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { icon:Ticket,       label:"Total",      val:total,    color:"#3b82f6", bg:"#eff6ff" },
                { icon:Clock,        label:"En Proceso", val:activos,  color:"#ea580c", bg:"#ffedd5" },
                { icon:CheckCircle2, label:"Resueltos",  val:resueltos,color:"#16a34a", bg:"#dcfce7" },
              ].map(({ icon:Icon, label, val, color, bg }) => (
                <div key={label} className="flex items-center gap-2.5 p-3 rounded-xl"
                  style={{ background:bg, border:`1px solid ${color}25` }}>
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background:`${color}20` }}>
                    <Icon size={14} style={{ color }}/>
                  </div>
                  <div className="min-w-0">
                    <p className="text-[9px] font-bold uppercase tracking-wide truncate" style={{ color:`${color}cc` }}>{label}</p>
                    <p className="text-xl font-black leading-none" style={{ color }}>{val}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Barra resolución */}
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-[10px] font-semibold" style={{ color:T.textMuted }}>Tasa de resolución</span>
                <span className="text-[10px] font-black" style={{ color:T.text }}>{pctRes}%</span>
              </div>
              <div className="h-1.5 rounded-full overflow-hidden" style={{ background:T.border }}>
                <div className="h-full rounded-full transition-all duration-700"
                  style={{ width:`${pctRes}%`, background:`linear-gradient(90deg,${T.orange},#16a34a)` }}/>
              </div>
            </div>
          </div>
        </div>

        {/* ── FILTROS ──────────────────────────────────────── */}
        <div className="rounded-xl overflow-hidden" style={card}>

          {/* Header */}
          <div className="flex items-center justify-between px-4 py-2"
            style={{ background:T.surfaceAlt, borderBottom:`1px solid ${T.border}` }}>
            <div className="flex items-center gap-1.5">
              <div className="w-0.5 h-3.5 rounded-full" style={{ background:T.orange }}/>
              <p className="text-[9px] font-black uppercase tracking-widest" style={{ color:T.textMuted }}>Filtros</p>
            </div>
            {hayFiltros && (
              <button onClick={limpiar}
                className="text-[10px] font-bold px-2 py-0.5 rounded-md transition-all hover:brightness-110"
                style={{ color:T.orange, background:"rgba(244,121,32,0.08)", border:"1px solid rgba(244,121,32,0.2)" }}>
                ✕ Limpiar
              </button>
            )}
          </div>

          <div className="px-4 py-3 flex flex-col gap-2.5">

            {/* Fila 1: buscador + selects */}
            <div className="flex flex-wrap gap-2 items-center">

              {/* Buscador */}
              <div className="relative flex-1 min-w-[160px]">
                <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
                  style={{ color:T.textFaint }}/>
                <input
                  className="w-full pl-7 pr-3 py-1.5 rounded-lg text-[11px] outline-none transition-all"
                  style={{ background:T.surfaceAlt, border:`1px solid ${T.border}`, color:T.text }}
                  placeholder="Buscar por título o ID..."
                  value={busqueda} onChange={e => setBusqueda(e.target.value)}
                  onFocus={e => { e.target.style.borderColor=T.orange; e.target.style.boxShadow="0 0 0 2px rgba(244,121,32,0.10)"; }}
                  onBlur={e  => { e.target.style.borderColor=T.border;  e.target.style.boxShadow="none"; }}/>
              </div>

              {/* Selects agrupados */}
              <Sel val={catFiltro}     set={setCatFiltro}     opts={CATEGORIAS}  lbl="Categoría" active={catFiltro!=="Todas"}     T={T}/>
              <Sel val={estatusFiltro} set={setEstatusFiltro} opts={ESTATUS_OPTS} lbl="Estatus"   active={estatusFiltro!=="Todos"} T={T}/>

              {/* Separador */}
              <div className="w-px h-5 hidden sm:block" style={{ background:T.border }}/>

              <Sel val={anioFiltro} set={setAnioFiltro} opts={ANIOS} lbl="Año" active={anioFiltro!=="Todos"} T={T}/>
              <Sel val={mesFiltro}  set={setMesFiltro}  opts={MESES} lbl="Mes" active={mesFiltro!=="Todos"}  T={T}/>
              <Sel val={diaFiltro}  set={setDiaFiltro}  opts={DIAS}  lbl="Día" active={diaFiltro!=="Todos"}  T={T}/>
            </div>

            {/* Fila 2: botones prioridad */}
            <div className="flex flex-wrap gap-1.5 items-center">
              <span className="text-[9px] font-black uppercase tracking-widest mr-1" style={{ color:T.textFaint }}>Prioridad:</span>
              {PRIORIDADES.map(p => {
                const sel = prioFiltro.includes(p.label);
                return (
                  <button key={p.label} onClick={() => togglePrio(p.label)}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all select-none"
                    style={{
                      background: sel ? p.bg      : T.surfaceAlt,
                      border:    `1px solid ${sel ? p.color : T.border}`,
                      color:      sel ? p.color   : T.textMuted,
                      boxShadow:  sel ? `0 1px 6px ${p.color}30` : "none",
                    }}>
                    <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background:p.color }}/>
                    {p.label}
                    {sel && <span className="text-[9px]">✓</span>}
                  </button>
                );
              })}
            </div>

            {/* Chips activos */}
            {hayFiltros && (
              <div className="flex flex-wrap gap-1.5 pt-0.5 border-t" style={{ borderColor:T.border }}>
                <span className="text-[9px] font-bold self-center" style={{ color:T.textFaint }}>Activos:</span>
                {busqueda && (
                  <Chip label={`"${busqueda}"`} onRemove={() => setBusqueda("")}
                    bg="rgba(244,121,32,0.10)" color={T.orange} border="rgba(244,121,32,0.25)"/>
                )}
                {prioFiltro.map(p => {
                  const pd = PRIORIDADES.find(x=>x.label===p);
                  return <Chip key={p} label={p} onRemove={() => togglePrio(p)} bg={pd.bg} color={pd.color} border={pd.border}/>;
                })}
                {catFiltro!=="Todas"     && <Chip label={catFiltro}     onRemove={() => setCatFiltro("Todas")}         bg={T.surfaceAlt} color={T.text} border={T.border}/>}
                {estatusFiltro!=="Todos" && <Chip label={estatusFiltro} onRemove={() => setEstatusFiltro("Todos")}     bg={T.surfaceAlt} color={T.text} border={T.border}/>}
                {anioFiltro!=="Todos"    && <Chip label={anioFiltro}    onRemove={() => setAnioFiltro("Todos")}        bg={T.surfaceAlt} color={T.text} border={T.border}/>}
                {mesFiltro!=="Todos"     && <Chip label={mesFiltro}     onRemove={() => setMesFiltro("Todos")}         bg={T.surfaceAlt} color={T.text} border={T.border}/>}
                {diaFiltro!=="Todos"     && <Chip label={`Día ${diaFiltro}`} onRemove={() => setDiaFiltro("Todos")}   bg={T.surfaceAlt} color={T.text} border={T.border}/>}
              </div>
            )}
          </div>
        </div>

        {/* ── TABLA ────────────────────────────────────────── */}
        <div className="rounded-xl overflow-hidden" style={card}>
          <div className="flex items-center justify-between px-4 py-2"
            style={{ background:T.surfaceAlt, borderBottom:`1px solid ${T.border}` }}>
            <div className="flex items-center gap-1.5">
              <div className="w-0.5 h-3.5 rounded-full" style={{ background:T.orange }}/>
              <p className="text-[9px] font-black uppercase tracking-widest" style={{ color:T.textMuted }}>Registros</p>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
              style={{ background:T.bg, color:T.textMuted, border:`1px solid ${T.border}` }}>
              {filtrados.length} resultado{filtrados.length!==1?"s":""}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse" style={{ minWidth:"820px" }}>
              <thead>
                <tr style={{ background:T.surfaceAlt }}>
                  {["ID","Título","Prioridad","Estatus","Activo","Técnico","Fecha","SLA","Satisfacción",""].map((col,i) => (
                    <th key={i} className="text-left px-3 py-2 text-[9px] font-black uppercase tracking-widest whitespace-nowrap"
                      style={{ color:T.textMuted, borderBottom:`1px solid ${T.border}` }}>
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtrados.length === 0
                  ? <EmptyState T={T} filtered={hayFiltros}/>
                  : filtrados.map((t,i) => {
                    const even = i%2===0;
                    return (
                      <tr key={t.id} className="transition-colors"
                        style={{ background:even?T.surface:T.surfaceAlt, borderBottom:`1px solid ${T.border}` }}
                        onMouseEnter={e => e.currentTarget.style.background="#eff6ff"}
                        onMouseLeave={e => e.currentTarget.style.background=even?T.surface:T.surfaceAlt}>
                        <td className="px-3 py-2 font-mono text-[11px] font-bold" style={{ color:T.orange }}>{t.id}</td>
                        <td className="px-3 py-2 text-[11px] font-semibold" style={{ maxWidth:"160px" }}>
                          <span className="block truncate" style={{ color:T.text }}>{t.titulo}</span>
                        </td>
                        <td className="px-3 py-2 text-[11px] font-bold" style={{ color:PCOLOR[t.prioridad] }}>{t.prioridad}</td>
                        <td className="px-3 py-2">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold"
                            style={{
                              background:t.estatus==="Resuelto"?"#dcfce7":"#ffedd5",
                              color:     t.estatus==="Resuelto"?"#16a34a":"#ea580c",
                            }}>
                            {t.estatus}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-[11px] font-mono" style={{ color:T.textMuted }}>{t.activo}</td>
                        <td className="px-3 py-2 text-[11px]"           style={{ color:T.text }}>{t.tecnico}</td>
                        <td className="px-3 py-2 text-[11px] whitespace-nowrap" style={{ color:T.textMuted }}>{t.fecha}</td>
                        <td className="px-3 py-2 text-[11px] font-bold whitespace-nowrap"
                          style={{ color:t.slaOk?T.textMuted:"#dc2626" }}>{t.sla}</td>
                        <td className="px-3 py-2"><Stars n={t.sat}/></td>
                        <td className="px-3 py-2">
                          <button className="flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md transition-all hover:brightness-110"
                            style={{ color:T.orange, background:"rgba(244,121,32,0.08)", border:"1px solid rgba(244,121,32,0.2)" }}>
                            <Eye size={11}/> Ver
                          </button>
                        </td>
                      </tr>
                    );
                  })
                }
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}

// ── CHIP ──────────────────────────────────────────────────────
function Chip({ label, onRemove, bg, color, border }) {
  return (
    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold"
      style={{ background:bg, color, border:`1px solid ${border}` }}>
      {label}
      <button onClick={onRemove} className="font-black leading-none hover:opacity-60">×</button>
    </span>
  );
}
