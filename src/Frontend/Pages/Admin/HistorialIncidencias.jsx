import { useState, useEffect, useCallback, useRef } from "react";
import { Star, Inbox, FileDown } from "lucide-react";
import ModalReporte from "../../Components/ModalReporte";
import { apiFetch } from "../../Config/api";
import { abrirReporteLista } from "../PrintReportePage";
import { useAutoRefresh } from "../../Config/useAutoRefresh";
import FiltrosToolbar from "../../Components/FiltrosToolbar";
import { useCardStyles } from "../../Components/Card";

const PCOLOR = { Urgente:"#dc2626", Alta:"#ea580c", Media:"#ca8a04", Baja:"#16a34a" };

function Estrellas({ n, isDark }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1,2,3,4,5].map(i => (
        <Star key={i} size={10} fill={i<=n?"#f59e0b":"none"}
          style={{ color: i<=n?"#f59e0b":isDark?"rgba(255,255,255,0.15)":"#d1d5db" }} />
      ))}
    </div>
  );
}

export default function HistorialIncidencias({ T, usuario = {}, onVerTicket, onRecargarRef }) {
  const [tickets,       setTickets]       = useState([]);
  const [filtros, setFiltros] = useState({ busqueda:"", estatus:"Todos", prioridad:"Todos", tecnico:"Todos", usuario:"Todos", area:"Todos", sucursal:"Todos" });
  const [modalReporte, setModalReporte] = useState(false);
  const [admins, setAdmins] = useState([]);
  const [generando, setGenerando] = useState(false);
  const [pagina,        setPagina]        = useState(1);
  const [totalBD,       setTotalBD]       = useState(0);
  const [cargando,      setCargando]      = useState(false);

  const isDark = T.isDark;
  const LIMIT = 50;

  const cargarRef = useRef(null);

  const cargar = useCallback((pag = 1) => {
    setCargando(true);
    apiFetch(`/api/tickets?limit=${LIMIT}&page=${pag}`)
      .then(r => r.json())
      .then(d => {
        const lista = Array.isArray(d) ? d : (Array.isArray(d?.data) ? d.data : []);
        const total = d?.total ?? lista.length;
        setTickets(prev => JSON.stringify(prev) === JSON.stringify(lista) ? prev : lista);
        setTotalBD(total);
      })
      .catch(() => {})
      .finally(() => setCargando(false));
  }, []);

  useEffect(() => { cargarRef.current = cargar; }, [cargar]);

  // Carga inicial y cuando cambia la página
  useEffect(() => { cargar(pagina); }, [pagina, cargar]);

  useEffect(() => {
    if (onRecargarRef) onRecargarRef.current = () => cargarRef.current?.(pagina);
  }, [pagina, onRecargarRef]);

  useAutoRefresh(() => cargarRef.current?.(pagina), 30000, [pagina]);

  useEffect(() => {
    apiFetch("/api/tickets/admins").then(r => r.json()).then(d => { if (Array.isArray(d)) setAdmins(d); }).catch(() => {});
  }, []);

  const totalPaginas = Math.max(1, Math.ceil(totalBD / LIMIT));
  const irPagina = (p) => { if (p >= 1 && p <= totalPaginas) setPagina(p); };

  const total     = tickets.length;
  const resueltos = tickets.filter(t => t.estatus === "Resuelto").length;
  const activos   = tickets.filter(t => t.estatus === "En proceso").length;
  const noRes     = tickets.filter(t => t.estatus === "No Resuelto").length;
  const califs    = tickets.filter(t => t.calificacion > 0);
  const pctSat    = califs.length > 0
    ? Math.round((califs.reduce((a,t) => a + t.calificacion, 0) / (califs.length * 5)) * 100) : 0;

  const usuariosOpts  = [{value:"Todos",label:"Todos"},...Array.from(new Set(tickets.map(t=>t.nombre_empleado).filter(Boolean))).map(v=>({value:v,label:v}))];
  const areasOpts     = [{value:"Todos",label:"Todos"},...Array.from(new Set(tickets.map(t=>t.nombre_departamento).filter(Boolean))).map(v=>({value:v,label:v}))];
  const sucursalesOpts = [{value:"Todos",label:"Todos"},...Array.from(new Set(tickets.map(t=>t.nombre_sucursal).filter(Boolean))).map(v=>({value:v,label:v}))];

  const tecnicosOpts = [{value:"Todos",label:"Todos"},...Array.from(new Set(tickets.map(t=>t.resuelto_por).filter(Boolean))).map(v=>({value:v,label:v}))];

  const camposFiltro = [
    { key:"busqueda",  label:"Búsqueda Rápida", type:"search",  placeholder:"Título o folio..." },
    { key:"estatus",   label:"Estatus",          type:"select",  opts:["Todos","Resuelto","En proceso","No Resuelto","Cancelado"] },
    { key:"prioridad", label:"Prioridad",         type:"select",  opts:["Todos","Urgente","Alta","Media","Baja"] },
    { key:"tecnico",   label:"Técnico",           type:"select",  opts:tecnicosOpts },
    { key:"usuario",   label:"Usuario",           type:"select",  opts:usuariosOpts },
    { key:"area",      label:"Área",              type:"select",  opts:areasOpts },
    { key:"sucursal",  label:"Sucursal",           type:"select",  opts:sucursalesOpts },
  ];

  const limpiar = () => setFiltros({ busqueda:"", estatus:"Todos", prioridad:"Todos", tecnico:"Todos", usuario:"Todos", area:"Todos", sucursal:"Todos" });

  const hayFiltros = filtros.busqueda || filtros.estatus!=="Todos" || filtros.prioridad!=="Todos"
    || filtros.tecnico!=="Todos" || filtros.usuario!=="Todos" || filtros.area!=="Todos" || filtros.sucursal!=="Todos";

  const filtrados = tickets.filter(t => {
    if (filtros.busqueda) {
      const q = filtros.busqueda.toLowerCase();
      if (!t.titulo?.toLowerCase().includes(q) && !t.folio_ticket?.toLowerCase().includes(q)) return false;
    }
    if (filtros.prioridad !== "Todos" && t.prioridad           !== filtros.prioridad) return false;
    if (filtros.estatus   !== "Todos" && t.estatus             !== filtros.estatus)   return false;
    if (filtros.tecnico   !== "Todos" && (t.resuelto_por ?? "Sin asignar") !== filtros.tecnico) return false;
    if (filtros.usuario   !== "Todos" && t.nombre_empleado     !== filtros.usuario)   return false;
    if (filtros.area      !== "Todos" && t.nombre_departamento !== filtros.area)      return false;
    if (filtros.sucursal  !== "Todos" && (t.nombre_sucursal ?? "Sin sucursal") !== filtros.sucursal) return false;
    return true;
  });

  const fmt = d => d ? new Date(d).toLocaleDateString("es-MX",{day:"2-digit",month:"2-digit",year:"numeric"}) : "-";

  const generarReporte = async (params) => {
    const { fecha_inicio, fecha_fin, id_tecnico } = params;
    if (!fecha_inicio || !fecha_fin || fecha_inicio > fecha_fin) return;
    setGenerando(true);
    let datos = [];
    try {
      const qs = new URLSearchParams({ fecha_inicio, fecha_fin, ...(id_tecnico !== "todos" && { id_tecnico }) });
      const r = await apiFetch(`/api/tickets/reporte?${qs}`);
      datos = await r.json();
      if (!Array.isArray(datos)) datos = [];
    } catch { datos = []; }
    setGenerando(false);
    setModalReporte(false);
    const fmtDate = d => new Date(d + "T00:00:00").toLocaleDateString("es-MX", { day: "2-digit", month: "long", year: "numeric" });
    abrirReporteLista({
      tipo: "incidencias",
      periodo: `${fmtDate(fecha_inicio)} – ${fmtDate(fecha_fin)}`,
      datos,
    });
  };

  const { card, hdr } = useCardStyles(T);
  const satColor = pctSat>=75?"#16a34a":pctSat>=50?"#ca8a04":"#dc2626";

  return (
    <>
    <div className="flex flex-col h-full" style={{ background:T.bg, overflow:"hidden" }}>
        <div className="w-full p-2 sm:p-3 flex flex-col gap-2 sm:gap-3 flex-1 min-h-0" style={{ overflow:"hidden" }}>

        {/* -- ESTADÍSTICOS -- */}
        <div className="grid grid-cols-12 gap-3">

          {/* Satisfacción */}
          <div className="col-span-12 sm:col-span-6 lg:col-span-3 rounded-xl overflow-hidden relative" style={card}>
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
              style={{ background:`radial-gradient(circle at 80% 20%, ${satColor}, transparent 60%)` }}/>
            <div className="h-0.5" style={{ background:`linear-gradient(90deg,${satColor},${satColor}33)` }}/>
            <div className="p-3 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <div className="w-1 h-3 rounded-full" style={{ background:satColor }}/>
                  <p className="text-xs font-black uppercase tracking-widest" style={{ color:T.textMuted }}>Satisfacción</p>
                </div>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full"
                  style={{ background:`${satColor}15`, color:satColor, border:`1px solid ${satColor}30` }}>
                  {pctSat>=75?"Excelente":pctSat>=50?"Regular":"Bajo"}
                </span>
              </div>
              <div className="flex items-end gap-2">
                <span className="text-3xl font-black leading-none" style={{ color:satColor }}>{pctSat}%</span>
                <div className="flex flex-col gap-1.5 mb-0.5 flex-1">
                  <div className="h-2 rounded-full overflow-hidden" style={{ background:T.border }}>
                    <div className="h-full rounded-full transition-all duration-1000"
                      style={{ width:`${pctSat}%`, background:`linear-gradient(90deg,${satColor},${satColor}88)`,
                        boxShadow:`0 0 6px ${satColor}55` }}/>
                  </div>
                  <div className="flex items-center gap-0.5">
                    {[1,2,3,4,5].map(i => {
                      const avg = califs.length>0?califs.reduce((a,t)=>a+t.calificacion,0)/califs.length:0;
                      return <Star key={i} size={10} fill={i<=Math.round(avg)?"#f59e0b":"none"}
                        style={{ color:i<=Math.round(avg)?"#f59e0b":T.textFaint }}/>;
                    })}
                    <span className="text-[10px] ml-1 font-semibold" style={{ color:T.textFaint }}>{califs.length} calif.</span>
                  </div>
                </div>
              </div>
              <div className="pt-2 mt-1 flex items-center justify-between" style={{ borderTop:`1px solid ${T.border}` }}>
                <span className="text-[11px]" style={{ color:T.textFaint }}>Promedio calificación</span>
                <span className="text-xs font-black" style={{ color:satColor }}>
                  {califs.length>0?(califs.reduce((a,t)=>a+t.calificacion,0)/califs.length).toFixed(1):"-"} / 5
                </span>
              </div>
            </div>
          </div>

          {/* KPIs numéricos */}
          <div className="col-span-12 sm:col-span-6 lg:col-span-3 grid grid-cols-2 gap-2">
            {[
              { label:"Total",       val:total,    color:T.orange,  sub:`${activos} activos`,    subColor:"#ea580c" },
              { label:"En Proceso",  val:activos,  color:"#ea580c", sub:`${Math.round(activos/Math.max(total,1)*100)}% del total`, subColor:T.textFaint },
              { label:"Resueltos",   val:resueltos,color:"#16a34a", sub:`${Math.round(resueltos/Math.max(total,1)*100)}% tasa`,    subColor:"#16a34a" },
              { label:"Sin Resolver",val:noRes,    color:"#dc2626", sub:`${Math.round(noRes/Math.max(total,1)*100)}% del total`,   subColor:"#dc2626" },
            ].map(({label,val,color,sub,subColor}) => (
              <div key={label} className="rounded-xl p-2 flex flex-col gap-1 relative overflow-hidden" style={card}>
                <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background:`linear-gradient(90deg,${color},${color}33)` }}/>
                <p className="text-[10px] font-black uppercase tracking-wider leading-tight" style={{ color:T.textMuted }}>{label}</p>
                <span className="text-2xl font-black leading-none" style={{ color }}>{val}</span>
                <div className="h-1 rounded-full overflow-hidden" style={{ background:T.border }}>
                  <div className="h-full rounded-full transition-all duration-700"
                    style={{ width:`${total>0?Math.round(val/total*100):0}%`, background:color,
                      boxShadow:`0 0 4px ${color}44` }}/>
                </div>
                <span className="text-[10px] font-semibold" style={{ color:subColor }}>{sub}</span>
              </div>
            ))}
          </div>

          {/* Tiempo de respuesta */}
          <div className="col-span-12 sm:col-span-6 lg:col-span-3 rounded-xl overflow-hidden relative" style={card}>
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
              style={{ background:`radial-gradient(circle at 20% 80%, #3b82f6, transparent 60%)` }}/>
            <div className="h-0.5" style={{ background:"linear-gradient(90deg,#3b82f6,#3b82f633)" }}/>
            <div className="p-3 flex flex-col gap-2">
              <div className="flex items-center gap-1.5">
                <div className="w-1 h-3 rounded-full" style={{ background:"#3b82f6" }}/>
                <p className="text-xs font-black uppercase tracking-widest" style={{ color:T.textMuted }}>Tiempo de Respuesta</p>
              </div>
              {(() => {
                const resueltosCon = tickets.filter(t => t.estatus==="Resuelto" && t.fecha_subido && t.fecha_resuelto);
                const horas = resueltosCon.map(t => (new Date(t.fecha_resuelto)-new Date(t.fecha_subido))/36e5);
                const avg   = horas.length>0 ? horas.reduce((a,b)=>a+b,0)/horas.length : 0;
                const min   = horas.length>0 ? Math.min(...horas) : 0;
                const max   = horas.length>0 ? Math.max(...horas) : 0;
                const fmtH  = h => h<24 ? `${Math.round(h)}h` : `${Math.round(h/24)}d`;
                const slaOk = horas.filter(h=>h<=48).length;
                const slaPct= horas.length>0?Math.round(slaOk/horas.length*100):0;
                const slaColor = slaPct>=80?"#16a34a":slaPct>=50?"#ca8a04":"#dc2626";
                const vencidos = tickets.filter(t => t.estatus==="En proceso" && t.fecha_subido && ((Date.now()-new Date(t.fecha_subido))/36e5)>48).length;
                return (
                  <>
                    <div className="flex items-end gap-1">
                      <span className="text-3xl font-black leading-none" style={{ color: avg>48?"#dc2626":"#3b82f6" }}>{fmtH(avg)}</span>
                      <span className="text-[11px] font-semibold mb-0.5" style={{ color:T.textMuted }}>promedio</span>
                    </div>
                    {vencidos > 0 && (
                      <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg"
                        style={{ background:isDark?"rgba(220,38,38,0.15)":"#fef2f2", border:"1px solid rgba(220,38,38,0.3)" }}>
                        <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background:"#dc2626" }}/>
                        <span className="text-[10px] font-bold" style={{ color:"#dc2626" }}>{vencidos} ticket{vencidos!==1?"s":""} vencido{vencidos!==1?"s":""} (+48h)</span>
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-1.5">
                      <div className="rounded-lg p-1.5" style={{ background:isDark?"rgba(22,163,74,0.1)":"#f0fdf4", border:"1px solid rgba(22,163,74,0.2)" }}>
                        <p className="text-[9px] font-black uppercase" style={{ color:"#16a34a" }}>Mínimo</p>
                        <p className="text-base font-black" style={{ color:"#16a34a" }}>{fmtH(min)}</p>
                      </div>
                      <div className="rounded-lg p-1.5" style={{ background:isDark?"rgba(220,38,38,0.1)":"#fef2f2", border:"1px solid rgba(220,38,38,0.2)" }}>
                        <p className="text-[9px] font-black uppercase" style={{ color:"#dc2626" }}>Máximo</p>
                        <p className="text-base font-black" style={{ color:"#dc2626" }}>{fmtH(max)}</p>
                      </div>
                    </div>
                    <div className="pt-2" style={{ borderTop:`1px solid ${T.border}` }}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-black uppercase tracking-wider" style={{ color:T.textMuted }}>SLA &lt;48h</span>
                        <span className="text-[11px] font-black" style={{ color:slaColor }}>{slaPct}%</span>
                      </div>
                      <div className="h-2 rounded-full overflow-hidden" style={{ background:T.border }}>
                        <div className="h-full rounded-full transition-all duration-700"
                          style={{ width:`${slaPct}%`, background:`linear-gradient(90deg,${slaColor},${slaColor}88)`,
                            boxShadow:`0 0 4px ${slaColor}44` }}/>
                      </div>
                      <p className="text-[10px] mt-1" style={{ color:T.textFaint }}>{slaOk} de {horas.length} resueltos dentro de 48h · límite SLA</p>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>

          {/* Prioridad + Top Áreas — card unificada */}
          <div className="col-span-12 sm:col-span-6 lg:col-span-3 rounded-xl overflow-hidden flex flex-col" style={card}>

            {/* Por Prioridad */}
            <div className="px-3 py-2 flex items-center gap-1.5" style={hdr}>
              <div className="w-1 h-3 rounded-full" style={{ background:T.orange }}/>
              <p className="text-[10px] font-black uppercase tracking-widest" style={{ color:T.textMuted }}>Por Prioridad</p>
            </div>
            <div className="px-3 pt-2 pb-1 flex flex-col gap-1.5">
              {[{l:"Urgente",c:"#dc2626"},{l:"Alta",c:"#ea580c"},{l:"Media",c:"#ca8a04"},{l:"Baja",c:"#16a34a"}].map(({l,c}) => {
                const n = tickets.filter(t=>t.prioridad===l).length;
                const pct = total>0?Math.round(n/total*100):0;
                return (
                  <div key={l} className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background:c }}/>
                    <span className="text-[10px] font-semibold w-12 flex-shrink-0" style={{ color:T.text }}>{l}</span>
                    <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background:isDark?"rgba(255,255,255,0.06)":`${c}15` }}>
                      <div className="h-full rounded-full transition-all duration-700"
                        style={{ width:`${pct>0?Math.max(pct,4):0}%`, background:c }}/>
                    </div>
                    <span className="text-[10px] font-black w-4 text-right flex-shrink-0" style={{ color:c }}>{n}</span>
                  </div>
                );
              })}
            </div>

            {/* Divisor */}
            <div className="mx-3 my-1.5" style={{ height:"1px", background:T.border }}/>

            {/* Top Áreas */}
            <div className="px-3 py-1 flex items-center gap-1.5">
              <div className="w-1 h-3 rounded-full" style={{ background:T.orange }}/>
              <p className="text-[10px] font-black uppercase tracking-widest" style={{ color:T.textMuted }}>Top Áreas</p>
            </div>
            <div className="px-3 pb-2 flex flex-col gap-1.5">
              {(() => {
                const conteo = {};
                tickets.forEach(t => { if(t.nombre_departamento) conteo[t.nombre_departamento]=(conteo[t.nombre_departamento]||0)+1; });
                const top = Object.entries(conteo).sort((a,b)=>b[1]-a[1]).slice(0,3);
                const maxN = top[0]?.[1]||1;
                const rankColors = [T.orange,"#3b82f6","#8b5cf6"];
                return top.length===0
                  ? <p className="text-[9px]" style={{ color:T.textFaint }}>Sin datos</p>
                  : top.map(([area,n],idx) => (
                    <div key={area} className="flex items-center gap-1.5">
                      <span className="text-[9px] font-black w-3 flex-shrink-0 text-center" style={{ color:rankColors[idx] }}>#{idx+1}</span>
                      <span className="text-[10px] font-semibold flex-1 truncate" style={{ color:T.text }}>{area}</span>
                      <div className="w-10 h-1.5 rounded-full overflow-hidden flex-shrink-0" style={{ background:T.border }}>
                        <div className="h-full rounded-full transition-all duration-700"
                          style={{ width:`${Math.round(n/maxN*100)}%`, background:rankColors[idx] }}/>
                      </div>
                      <span className="text-[10px] font-black w-4 text-right flex-shrink-0" style={{ color:rankColors[idx] }}>{n}</span>
                    </div>
                  ));
              })()}
            </div>

          </div>

        </div>

        {/* -- FILTROS -- */}
        <FiltrosToolbar
          campos={camposFiltro}
          valores={filtros}
          onChange={(key, val) => setFiltros(prev => ({ ...prev, [key]: val }))}
          onLimpiar={limpiar}
          T={T}
        >
          <button onClick={() => setModalReporte(true)}
            style={{ display:"flex", alignItems:"center", gap:"5px", padding:"5px 12px", borderRadius:"4px",
              fontSize:"12px", fontWeight:700, background:"#F47920", color:"#fff", border:"none", cursor:"pointer",
              whiteSpace:"nowrap", transition:"filter 0.15s" }}
            onMouseEnter={e => e.currentTarget.style.filter="brightness(1.08)"}
            onMouseLeave={e => e.currentTarget.style.filter="none"}>
            <FileDown size={13} strokeWidth={2.5}/> Generar Reporte
          </button>
        </FiltrosToolbar>

          {/* -- TABLA -- */}
          <div className="rounded-xl overflow-hidden flex flex-col" style={{ ...card, flex:"1 1 0", minHeight:0 }}>
          <div className="flex items-center justify-between px-4 py-3 flex-shrink-0" style={hdr}>
            <div className="flex items-center gap-1.5">
              <div className="w-0.5 h-3.5 rounded-full" style={{ background:T.orange }} />
              <p className="text-xs font-black uppercase tracking-widest" style={{ color:T.textMuted }}>Registros</p>
            </div>
            <div className="flex items-center gap-2">
              {cargando && (
                <svg className="animate-spin" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={T.orange} strokeWidth="2.5"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
              )}
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full"
                style={{ background:T.bg, color:T.textMuted, border:`1px solid ${T.border}` }}>
                {filtrados.length} resultado{filtrados.length!==1?"s":""} · pág. {pagina}/{totalPaginas}
              </span>
            </div>
          </div>

          <div className="overflow-y-auto overflow-x-auto" style={{ flex:"1 1 0", minHeight:0 }}>
            {/* Vista tarjetas móvil */}
            <div className="flex flex-col gap-2 p-3 sm:hidden">
              {filtrados.length === 0
                ? <div className="flex flex-col items-center justify-center py-8 gap-2">
                    <Inbox size={20} style={{ color:T.textFaint }}/>
                    <p className="text-xs font-bold" style={{ color:T.textMuted }}>
                      {hayFiltros?"Sin resultados":"No hay incidencias"}
                    </p>
                  </div>
                : filtrados.map(t => {
                    const eBg    = t.estatus==="Resuelto"?(isDark?"rgba(22,163,74,0.15)":"#dcfce7"):t.estatus==="No Resuelto"?(isDark?"rgba(220,38,38,0.15)":"#fee2e2"):(isDark?"rgba(234,88,12,0.15)":"#ffedd5");
                    const eColor = t.estatus==="Resuelto"?"#16a34a":t.estatus==="No Resuelto"?"#dc2626":"#ea580c";
                    return (
                      <div key={t.id_ticket}
                        className="rounded-xl p-3 flex flex-col gap-2 active:scale-[0.98] transition-all cursor-pointer"
                        style={{ background:isDark?"rgba(255,255,255,0.04)":T.surfaceAlt, border:`1px solid ${T.border}` }}
                        onClick={() => onVerTicket(t)}>
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-mono text-[11px] font-black" style={{ color:T.orange }}>{t.folio_ticket}</span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ background:eBg, color:eColor }}>{t.estatus}</span>
                        </div>
                        <p className="text-xs font-semibold leading-snug" style={{ color:T.text }}>{t.titulo}</p>
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1 text-[11px] font-bold">
                            <span className="w-2 h-2 rounded-full" style={{ background:PCOLOR[t.prioridad]||"#94a3b8" }}/>
                            <span style={{ color:PCOLOR[t.prioridad]||T.textMuted }}>{t.prioridad}</span>
                          </span>
                          <span className="text-[11px]" style={{ color:T.textFaint }}>{t.nombre_empleado?.split(" ").slice(0,2).join(" ")||"-"}</span>
                        </div>
                      </div>
                    );
                  })
              }
            </div>
            {/* Vista tabla desktop */}
            <div className="hidden sm:block overflow-x-auto">
            <table className="w-full border-collapse" style={{ minWidth:"960px" }}>
              <thead className="sticky top-0 z-10">
                <tr style={{ background:isDark?"#1c2030":T.surfaceAlt }}>
                  {["Folio","Título","Estatus","Usuario / Área","Técnico","Inicio","Cierre","Satisfacción",""].map((col,i) => (
                    <th key={i} className="text-left px-3 py-2 text-[10px] font-black uppercase tracking-widest whitespace-nowrap"
                      style={{ color:T.textMuted, borderBottom:`1px solid ${T.border}` }}>
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtrados.length === 0 ? (
                  <tr><td colSpan={8}>
                    <div className="flex flex-col items-center justify-center py-12 gap-2">
                      <Inbox size={22} style={{ color:T.textFaint }} />
                      <p className="text-xs font-bold" style={{ color:T.textMuted }}>
                        {hayFiltros?"Sin resultados":"No hay incidencias registradas"}
                      </p>
                    </div>
                  </td></tr>
                ) : filtrados.map((t,i) => {
                  const bgRow = i%2===0?(isDark?"#141720":T.surface):(isDark?"#1c2030":T.surfaceAlt);
                  const esCrit = t.prioridad==="Urgente"||t.prioridad==="Alta";
                  const calNum = t.calificacion?parseInt(t.calificacion):0;
                  const eBg    = t.estatus==="Resuelto"?(isDark?"rgba(22,163,74,0.15)":"#dcfce7"):t.estatus==="No Resuelto"?(isDark?"rgba(220,38,38,0.15)":"#fee2e2"):(isDark?"rgba(234,88,12,0.15)":"#ffedd5");
                  const eColor = t.estatus==="Resuelto"?"#16a34a":t.estatus==="No Resuelto"?"#dc2626":"#ea580c";
                  return (
                    <tr key={t.id_ticket}
                      style={{ background:bgRow, borderBottom:`1px solid ${T.border}` }}
                      onMouseEnter={e => e.currentTarget.style.background=isDark?"rgba(244,121,32,0.05)":"rgba(244,121,32,0.03)"}
                      onMouseLeave={e => e.currentTarget.style.background=bgRow}>

                      <td className="px-3 py-2">
                        <span className="font-mono text-[10px] font-black" style={{ color:T.orange }}>{t.folio_ticket}</span>
                      </td>

                      <td className="px-3 py-2" style={{ maxWidth:"220px" }}>
                        <span className="block truncate text-[11px] font-semibold"
                          style={{ color:esCrit?PCOLOR[t.prioridad]:T.text }}>{t.titulo}</span>
                        <span className="flex items-center gap-1 mt-0.5">
                          <span className="w-1.5 h-1.5 rounded-full" style={{ background:PCOLOR[t.prioridad]||"#94a3b8" }} />
                          <span className="text-[10px] font-bold" style={{ color:PCOLOR[t.prioridad]||T.textMuted }}>{t.prioridad}</span>
                        </span>
                      </td>

                      <td className="px-3 py-2">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold whitespace-nowrap"
                          style={{ background:eBg, color:eColor }}>{t.estatus}</span>
                      </td>

                      <td className="px-3 py-2">
                        <span className="block text-[11px] font-semibold" style={{ color:T.text }}>{t.nombre_empleado||"-"}</span>
                        <span className="block text-[10px]" style={{ color:T.textMuted }}>{t.nombre_departamento||"-"}</span>
                      </td>

                      <td className="px-3 py-2 text-[11px]" style={{ color:t.resuelto_por?T.text:T.textFaint }}>
                        {t.resuelto_por?t.resuelto_por.split(" ").filter(Boolean).slice(0,2).join(" "):"-"}
                      </td>

                      <td className="px-3 py-2 text-[10px] whitespace-nowrap" style={{ color:T.textMuted }}>{fmt(t.fecha_subido)}</td>

                      <td className="px-3 py-2 text-[10px] whitespace-nowrap"
                        style={{ color:t.fecha_resuelto?"#16a34a":T.textFaint }}>{fmt(t.fecha_resuelto)}</td>

                      <td className="px-3 py-2">
                        {calNum>0
                          ? <Estrellas n={calNum} isDark={isDark}/>
                          : <span className="text-[10px]" style={{ color:T.textFaint }}>-</span>}
                      </td>

                      <td className="px-3 py-2">
                        <button
                          onClick={() => onVerTicket(t)}
                          className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold transition-all hover:brightness-110 active:scale-95"
                          style={{ background:"rgba(244,121,32,0.08)", color:T.orange, border:"1px solid rgba(244,121,32,0.2)" }}>
                          Ver
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          </div>
        </div>{/* fin tabla */}

        {/* -- PAGINACIÓN -- */}
        {totalPaginas > 1 && (
          <div className="flex items-center justify-center gap-2 py-2 flex-shrink-0">
            {Array.from({ length: Math.min(5, totalPaginas) }, (_, i) => {
              const start = Math.max(1, Math.min(pagina - 2, totalPaginas - 4));
              const p = start + i;
              if (p > totalPaginas) return null;
              return (
                <button key={p} onClick={() => irPagina(p)}
                  className="w-8 h-8 rounded-lg text-[11px] font-bold transition-all hover:brightness-110"
                  style={{
                    background: p === pagina ? T.orange : (isDark?"rgba(255,255,255,0.06)":T.surfaceAlt),
                    color: p === pagina ? "#fff" : T.textMuted,
                    border: `1px solid ${p === pagina ? T.orange : T.border}`,
                  }}>
                  {p}
                </button>
              );
            })}
          </div>
        )}
        </div>
    </div>

    {/* -- MODAL REPORTE -- */}

    {modalReporte && (
      <ModalReporte
        T={T}
        admins={admins}
        generando={generando}
        onClose={() => setModalReporte(false)}
        onGenerar={generarReporte}
      />
    )}
    </>
  );
}
