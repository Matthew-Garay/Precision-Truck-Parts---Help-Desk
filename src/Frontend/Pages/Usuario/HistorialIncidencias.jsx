import { useState, useEffect, useCallback, useRef } from "react";
import { Eye, Inbox, FileDown, Star } from "lucide-react";
import { apiFetch } from "../../Config/api";
import { useAutoRefresh } from "../../Config/useAutoRefresh";
import FiltrosToolbar from "../../Components/FiltrosToolbar";
import { useCardStyles } from "../../Components/Card";
import Modal from "../../Components/Modal";

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
  const isDark = T.isDark;
  const [tickets,      setTickets]      = useState([]);
  const [page,         setPage]         = useState(1);
  const [pages,        setPages]        = useState(1);
  const [limit,        setLimit]        = useState(25);
  const [totalCount,   setTotalCount]   = useState(0);
  const [categoriasOpts, setCategoriasOpts] = useState([]);
  const [filtros,      setFiltros]      = useState({ busqueda:"", estatus:"Todos", prioridad:"Todos", categoria:"Todos" });
  const [modalReporte, setModalReporte] = useState(false);
  const [paramReporte, setParamReporte] = useState({ fecha_inicio:"", fecha_fin:"", periodo:"mensual" });
  const [cargando,     setCargando]     = useState(false);
  const [statsGlobal,  setStatsGlobal]  = useState({ resueltos:0, activos:0, noRes:0, califs:[] });

  const filtrosRef = useRef(filtros);
  filtrosRef.current = filtros;

  const cargar = useCallback((f, p = 1, l = 25) => {
    if (!usuario?.id_empleado) return;
    setCargando(true);
    const qs = new URLSearchParams({ limit: l, page: p });
    if (f.busqueda)                             qs.set("q",         f.busqueda);
    if (f.estatus   && f.estatus   !== "Todos") qs.set("estatus",   f.estatus);
    if (f.prioridad && f.prioridad !== "Todos") qs.set("prioridad", f.prioridad);
    if (f.categoria && f.categoria !== "Todos") qs.set("categoria", f.categoria);
    apiFetch(`/api/tickets/empleado/${usuario.id_empleado}?${qs}`)
      .then(r => r.json())
      .then(d => {
        const lista = Array.isArray(d) ? d : (Array.isArray(d?.data) ? d.data : []);
        setTickets(prev => JSON.stringify(prev) === JSON.stringify(lista) ? prev : lista);
        if (!Array.isArray(d) && typeof d.total === "number") {
          setTotalCount(d.total);
          setPages(d.pages || Math.max(1, Math.ceil(d.total / l)));
        } else {
          setTotalCount(lista.length);
          setPages(1);
        }
      })
      .catch(() => {})
      .finally(() => setCargando(false));
  }, [usuario?.id_empleado]); // eslint-disable-line

  const filtrosStr = JSON.stringify(filtros);
  useEffect(() => { cargar(filtros, page, limit); }, [filtrosStr, page, limit]); // eslint-disable-line

  useEffect(() => {
    if (onRecargarRef) onRecargarRef.current = () => cargar(filtrosRef.current, page, limit);
  }, [onRecargarRef, cargar, page, limit]);

  useAutoRefresh(() => cargar(filtrosRef.current, page, limit), 30000, [page, limit]);

  // Carga sin filtros una sola vez para stats globales y opciones de categoría
  useEffect(() => {
    if (!usuario?.id_empleado) return;
    apiFetch(`/api/tickets/empleado/${usuario.id_empleado}?limit=2000&page=1`)
      .then(r => r.json())
      .then(d => {
        const lista = Array.isArray(d) ? d : (Array.isArray(d?.data) ? d.data : []);
        setCategoriasOpts(Array.from(new Set(lista.map(t => t.nombre_categoria).filter(Boolean))).sort());
        setStatsGlobal({
          resueltos: lista.filter(t => t.estatus === "Resuelto").length,
          activos:   lista.filter(t => t.estatus === "En proceso").length,
          noRes:     lista.filter(t => t.estatus === "No Resuelto").length,
          califs:    lista.filter(t => t.calificacion && parseInt(t.calificacion) > 0),
        });
      })
      .catch(() => {});
  }, [usuario?.id_empleado]); // eslint-disable-line

  const total     = totalCount;
  const resueltos = statsGlobal.resueltos;
  const activos   = statsGlobal.activos;
  const noRes     = statsGlobal.noRes;
  const califs    = statsGlobal.califs;
  const pctSat    = califs.length > 0
    ? Math.round((califs.reduce((s, t) => s + parseInt(t.calificacion), 0) / (califs.length * 5)) * 100)
    : 0;
  const satColor  = pctSat >= 75 ? "#16a34a" : pctSat >= 50 ? "#ca8a04" : "#dc2626";

  const toOpts = arr => ["Todos", ...arr];
  const camposFiltro = [
    { key:"busqueda",  label:"Búsqueda Rápida", type:"search",  placeholder:"Título o folio...", debounce:300 },
    { key:"estatus",   label:"Estatus",          type:"select",  opts:["Todos","Resuelto","En proceso","No Resuelto"] },
    { key:"prioridad", label:"Prioridad",         type:"select",  opts:["Todos","Urgente","Alta","Media","Baja"] },
    { key:"categoria", label:"Categoría",         type:"select",  opts:toOpts(categoriasOpts) },
  ];

  const limpiar = () => { setFiltros({ busqueda:"", estatus:"Todos", prioridad:"Todos", categoria:"Todos" }); setPage(1); };
  const hayFiltros = filtros.busqueda || filtros.estatus!=="Todos" || filtros.prioridad!=="Todos" || filtros.categoria!=="Todos";
  const handleFiltroChange = (k, v) => { setFiltros(p => ({...p,[k]:v})); setPage(1); };

  const fmt = d => d ? new Date(d).toLocaleDateString("es-MX",{day:"2-digit",month:"2-digit",year:"numeric"}) : "-";

  const labelPeriodo = () => {
    const ahora = new Date();
    const { periodo } = paramReporte;
    if (periodo === "diario")  return `Día ${ahora.toLocaleDateString("es-MX",{day:"2-digit",month:"long",year:"numeric"})}`;
    if (periodo === "semanal") {
      const lunes = new Date(ahora); lunes.setDate(ahora.getDate() - ahora.getDay() + 1);
      const domingo = new Date(lunes); domingo.setDate(lunes.getDate() + 6);
      return `Semana ${lunes.toLocaleDateString("es-MX",{day:"2-digit",month:"short"})} – ${domingo.toLocaleDateString("es-MX",{day:"2-digit",month:"short",year:"numeric"})}`;
    }
    if (periodo === "mensual") return ahora.toLocaleDateString("es-MX",{month:"long",year:"numeric"});
    if (periodo === "anual")   return `Año ${ahora.getFullYear()}`;
    return "";
  };

  const generarReporte = () => {
    const { fecha_inicio, fecha_fin, periodo } = paramReporte;
    const ahoraDate = new Date();
    const datos = tickets.filter(t => {
      if (!t.fecha_subido) return false;
      const f = new Date(t.fecha_subido);
      if (fecha_inicio && fecha_fin) {
        return f >= new Date(fecha_inicio+"T00:00:00") && f <= new Date(fecha_fin+"T23:59:59");
      }
      if (periodo === "diario")  return f.toDateString() === ahoraDate.toDateString();
      if (periodo === "semanal") {
        const lunes = new Date(ahoraDate); lunes.setDate(ahoraDate.getDate() - ((ahoraDate.getDay()+6)%7)); lunes.setHours(0,0,0,0);
        const domingo = new Date(lunes); domingo.setDate(lunes.getDate()+6); domingo.setHours(23,59,59,999);
        return f >= lunes && f <= domingo;
      }
      if (periodo === "mensual") return f.getMonth()===ahoraDate.getMonth() && f.getFullYear()===ahoraDate.getFullYear();
      if (periodo === "anual")   return f.getFullYear()===ahoraDate.getFullYear();
      return true;
    });
    const ahora    = ahoraDate.toLocaleDateString("es-MX",{day:"2-digit",month:"long",year:"numeric"});
    const fmtDate  = d => new Date(d+"T00:00:00").toLocaleDateString("es-MX",{day:"2-digit",month:"long",year:"numeric"});
    const periodo2 = fecha_inicio && fecha_fin ? `${fmtDate(fecha_inicio)} – ${fmtDate(fecha_fin)}` : labelPeriodo();
    const ESTATUS_COLOR = { "Resuelto":"#16a34a","En proceso":"#ea580c","No Resuelto":"#dc2626" };
    const ESTATUS_BG    = { "Resuelto":"#dcfce7","En proceso":"#ffedd5","No Resuelto":"#fee2e2" };
    const filas = datos.map((t,i) => `
      <tr style="background:${i%2===0?"#ffffff":"#f9fafb"}">
        <td style="padding:7px 10px;font-family:monospace;font-weight:700;color:#F47920;font-size:11px;border-bottom:1px solid #e5e7eb">${t.folio_ticket}</td>
        <td style="padding:7px 10px;font-size:11px;border-bottom:1px solid #e5e7eb">
          <div style="font-weight:600;color:#1D1D1B">${t.titulo}</div>
          <div style="font-size:10px;color:${PCOLOR[t.prioridad]||"#94a3b8"};font-weight:700;margin-top:2px">● ${t.prioridad}</div>
        </td>
        <td style="padding:7px 10px;border-bottom:1px solid #e5e7eb">
          <span style="background:${ESTATUS_BG[t.estatus]||"#f3f4f6"};color:${ESTATUS_COLOR[t.estatus]||"#374151"};padding:2px 8px;border-radius:20px;font-size:10px;font-weight:700">${t.estatus}</span>
        </td>
        <td style="padding:7px 10px;font-size:11px;color:#6b7280;border-bottom:1px solid #e5e7eb">${t.nombre_categoria||"-"}</td>
        <td style="padding:7px 10px;font-size:11px;color:#6b7280;white-space:nowrap;border-bottom:1px solid #e5e7eb">${fmt(t.fecha_subido)}</td>
        <td style="padding:7px 10px;font-size:11px;color:${t.fecha_resuelto?"#16a34a":"#9ca3af"};white-space:nowrap;border-bottom:1px solid #e5e7eb">${fmt(t.fecha_resuelto)}</td>
      </tr>`).join("");
    const html = `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"/><title>Mis Incidencias</title>
    <style>@page{size:A4;margin:18mm 15mm}*{box-sizing:border-box;margin:0;padding:0}body{font-family:'Segoe UI',Arial,sans-serif;background:#fff;color:#1D1D1B}
    .header{display:flex;align-items:center;justify-content:space-between;border:2px solid #F47920;border-radius:10px;padding:14px 20px;margin-bottom:14px}
    .header-logo{height:48px;object-fit:contain}
    .header-title{font-size:16px;font-weight:900;color:#1D1D1B}.header-sub{font-size:10px;color:#6b7280;text-transform:uppercase;letter-spacing:.1em}
    .header-badge{display:inline-block;margin-top:4px;background:linear-gradient(135deg,#F47920,#d97400);color:#fff;font-size:10px;font-weight:700;padding:3px 10px;border-radius:20px}
    .table-wrap{border:1.5px solid #e5e7eb;border-radius:10px;overflow:hidden}table{width:100%;border-collapse:collapse}thead tr{background:#f9fafb}
    th{padding:8px 10px;text-align:left;font-size:9px;font-weight:900;text-transform:uppercase;letter-spacing:.1em;color:#9ca3af;border-bottom:2px solid #e5e7eb;white-space:nowrap}
    td{vertical-align:middle}@media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}</style></head><body>
    <div class="header">
      <div style="display:flex;align-items:center;gap:16px">
        <img src="/assets/img/logo negro.png" class="header-logo" alt="PTP"/>
        <div style="width:2px;height:44px;background:linear-gradient(180deg,#F47920,#ffb347);border-radius:2px"></div>
        <div><div class="header-title">Mis Incidencias</div><div class="header-sub">Precision Truck Parts · HelpDesk</div></div>
      </div>
      <div style="text-align:right">
        <div style="font-size:11px;color:#6b7280">Generado el ${ahora}</div>
        <div style="font-size:11px;font-weight:700;color:#F47920;margin-top:4px">${periodo2}</div>
        <span class="header-badge">${datos.length} registro${datos.length!==1?"s":""}</span>
      </div>
    </div>
    <div class="table-wrap"><table><thead><tr><th>Folio</th><th>Título / Prioridad</th><th>Estatus</th><th>Categoría</th><th>Inicio</th><th>Cierre</th></tr></thead><tbody>${filas}</tbody></table></div>
    </body></html>`;
    setModalReporte(false);
    const win = window.open("","_blank","width=900,height=700");
    if (!win) {
      const aviso = document.createElement("div");
      aviso.style.cssText = "position:fixed;top:16px;left:50%;transform:translateX(-50%);z-index:9999;background:#1D1D1B;color:#fff;padding:12px 20px;border-radius:10px;font-size:13px;font-weight:700;border-left:4px solid #F47920;box-shadow:0 4px 20px rgba(0,0,0,0.4);";
      aviso.textContent = "Permite ventanas emergentes para generar el reporte.";
      document.body.appendChild(aviso);
      setTimeout(() => aviso.remove(), 5000);
      return;
    }
    win.document.write(html); win.document.close();
    setTimeout(() => { win.focus(); win.print(); }, 600);
  };

  const { card, hdr } = useCardStyles(T);

  return (
    <>
    <div className="flex flex-col h-full" style={{ background:T.bg, overflow:"hidden" }}>
      <div className="w-full p-2 sm:p-3 flex flex-col gap-2 sm:gap-3 flex-1 min-h-0" style={{ overflow:"hidden" }}>

        {/* ── KPIs ── */}
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
                      style={{ width:`${pctSat}%`, background:`linear-gradient(90deg,${satColor},${satColor}88)`, boxShadow:`0 0 6px ${satColor}55` }}/>
                  </div>
                  <div className="flex items-center gap-0.5">
                    {[1,2,3,4,5].map(i => {
                      const avg = califs.length>0?califs.reduce((a,t)=>a+parseInt(t.calificacion),0)/califs.length:0;
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
                  {califs.length>0?(califs.reduce((a,t)=>a+parseInt(t.calificacion),0)/califs.length).toFixed(1):"-"} / 5
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
                    style={{ width:`${total>0?Math.round(val/total*100):0}%`, background:color, boxShadow:`0 0 4px ${color}44` }}/>
                </div>
                <span className="text-[10px] font-semibold" style={{ color:subColor }}>{sub}</span>
              </div>
            ))}
          </div>

          {/* Por Prioridad */}
          <div className="col-span-12 sm:col-span-6 lg:col-span-3 rounded-xl overflow-hidden" style={card}>
            <div className="px-3 py-2 flex items-center gap-1.5" style={hdr}>
              <div className="w-1 h-3 rounded-full" style={{ background:T.orange }}/>
              <p className="text-[10px] font-black uppercase tracking-widest" style={{ color:T.textMuted }}>Por Prioridad</p>
            </div>
            <div className="p-3 flex flex-col gap-2">
              {[{l:"Urgente",c:"#dc2626"},{l:"Alta",c:"#ea580c"},{l:"Media",c:"#ca8a04"},{l:"Baja",c:"#16a34a"}].map(({l,c}) => {
                const n   = tickets.filter(t=>t.prioridad===l).length;
                const pct = total>0?Math.round(n/total*100):0;
                return (
                  <div key={l} className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background:c, boxShadow:`0 0 4px ${c}88` }}/>
                    <span className="text-[11px] font-semibold w-14 flex-shrink-0" style={{ color:T.text }}>{l}</span>
                    <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background:isDark?"rgba(255,255,255,0.06)":`${c}15` }}>
                      <div className="h-full rounded-full transition-all duration-700"
                        style={{ width:`${pct>0?Math.max(pct,5):0}%`, background:c, boxShadow:`0 0 4px ${c}55` }}/>
                    </div>
                    <span className="text-[11px] font-black w-5 text-right flex-shrink-0" style={{ color:c }}>{n}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Top Categorías */}
          <div className="col-span-12 sm:col-span-6 lg:col-span-3 rounded-xl overflow-hidden" style={card}>
            <div className="px-3 py-2 flex items-center gap-1.5" style={hdr}>
              <div className="w-1 h-3 rounded-full" style={{ background:T.orange }}/>
              <p className="text-[10px] font-black uppercase tracking-widest" style={{ color:T.textMuted }}>Top Categorías</p>
            </div>
            <div className="p-3 flex flex-col gap-2">
              {(() => {
                const conteo = {};
                tickets.forEach(t => { if(t.nombre_categoria) conteo[t.nombre_categoria]=(conteo[t.nombre_categoria]||0)+1; });
                const top = Object.entries(conteo).sort((a,b)=>b[1]-a[1]).slice(0,4);
                const max = top[0]?.[1]||1;
                const colors = [T.orange,"#3b82f6","#8b5cf6","#16a34a"];
                return top.length===0
                  ? <p className="text-[9px]" style={{ color:T.textFaint }}>Sin datos</p>
                  : top.map(([cat,n],idx) => (
                    <div key={cat} className="flex items-center gap-2">
                      <span className="text-[10px] font-black w-3 flex-shrink-0 text-center" style={{ color:colors[idx] }}>#{idx+1}</span>
                      <span className="text-[11px] font-semibold flex-1 truncate" style={{ color:T.text }}>{cat}</span>
                      <div className="w-12 h-2 rounded-full overflow-hidden flex-shrink-0" style={{ background:T.border }}>
                        <div className="h-full rounded-full transition-all duration-700"
                          style={{ width:`${Math.round(n/max*100)}%`, background:colors[idx], boxShadow:`0 0 4px ${colors[idx]}55` }}/>
                      </div>
                      <span className="text-[11px] font-black w-4 text-right flex-shrink-0" style={{ color:colors[idx] }}>{n}</span>
                    </div>
                  ));
              })()}
            </div>
          </div>

        </div>

        {/* ── Filtros ── */}
        <FiltrosToolbar campos={camposFiltro} valores={filtros} onChange={handleFiltroChange} onLimpiar={limpiar} T={T}>
          <button onClick={() => setModalReporte(true)}
            style={{ display:"flex", alignItems:"center", gap:"5px", padding:"5px 12px", borderRadius:"4px",
              fontSize:"12px", fontWeight:700, background:"#F47920", color:"#fff", border:"none", cursor:"pointer",
              whiteSpace:"nowrap", transition:"filter 0.15s" }}
            onMouseEnter={e => e.currentTarget.style.filter="brightness(1.08)"}
            onMouseLeave={e => e.currentTarget.style.filter="none"}>
            <FileDown size={13} strokeWidth={2.5}/> Generar Reporte
          </button>
        </FiltrosToolbar>

        <div className="rounded-xl overflow-hidden flex flex-col" style={{ ...card, flex:"1 1 0", minHeight:0 }}>
          <div className="flex items-center justify-between px-4 py-3 flex-shrink-0" style={hdr}>
            <div className="flex items-center gap-1.5">
              <div className="w-0.5 h-3.5 rounded-full" style={{ background:T.orange }}/>
              <p className="text-[10px] font-black uppercase tracking-widest" style={{ color:T.textMuted }}>Mis Incidencias</p>
            </div>
            <div className="flex items-center gap-2">
              {cargando && (
                <svg className="animate-spin" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={T.orange} strokeWidth="2.5"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
              )}
              <span className="text-[9px] font-bold px-2 py-0.5 rounded-full"
                style={{ background:T.bg, color:T.textMuted, border:`1px solid ${T.border}` }}>
                {totalCount} resultado{totalCount!==1?"s":""}
              </span>
            </div>
          </div>

          {/* Móvil */}
          <div className="flex flex-col gap-2 p-3 sm:hidden" style={{ overflowY:"auto" }}>
            {tickets.length === 0
              ? <div className="flex flex-col items-center justify-center py-8 gap-2">
                  <Inbox size={20} style={{ color:T.textFaint }}/>
                  <p className="text-xs font-bold" style={{ color:T.textMuted }}>{hayFiltros?"Sin resultados":"No hay incidencias"}</p>
                </div>
              : tickets.map(t => {
                  const calNum = t.calificacion ? parseInt(t.calificacion) : 0;
                  const eBg    = t.estatus==="Resuelto"?(isDark?"rgba(22,163,74,0.15)":"#dcfce7"):t.estatus==="No Resuelto"?(isDark?"rgba(220,38,38,0.15)":"#fee2e2"):(isDark?"rgba(234,88,12,0.15)":"#ffedd5");
                  const eColor = t.estatus==="Resuelto"?"#16a34a":t.estatus==="No Resuelto"?"#dc2626":"#ea580c";
                  return (
                    <div key={t.id_ticket} className="rounded-xl p-3 flex flex-col gap-2 cursor-pointer"
                      style={{ ...card, border:`1px solid ${T.border}` }}
                      onClick={() => onVerTicket?.(t)}>
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[10px] font-bold" style={{ color:T.orange }}>{t.folio_ticket}</span>
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold" style={{ background:eBg, color:eColor }}>{t.estatus}</span>
                      </div>
                      <p className="text-[12px] font-semibold truncate" style={{ color:T.text }}>{t.titulo}</p>
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1 text-[11px] font-bold">
                          <span className="w-1.5 h-1.5 rounded-full" style={{ background:PCOLOR[t.prioridad]||"#94a3b8" }}/>
                          <span style={{ color:PCOLOR[t.prioridad]||T.textMuted }}>{t.prioridad}</span>
                        </span>
                        <span className="text-[10px]" style={{ color:T.textMuted }}>{fmt(t.fecha_subido)}</span>
                      </div>
                      {calNum > 0 && <Estrellas n={calNum} isDark={isDark}/>}
                    </div>
                  );
                })
            }
          </div>

          {/* Desktop */}
          <div className="hidden sm:block overflow-y-auto overflow-x-auto" style={{ flex:"1 1 0", minHeight:0 }}>
            <table className="w-full border-collapse" style={{ minWidth:"760px" }}>
              <thead className="sticky top-0 z-10">
                <tr style={{ background:isDark?"rgba(255,255,255,0.03)":T.surfaceAlt }}>
                  {["Folio","Título","Prioridad","Estatus","Categoría","Técnico","Fecha","Satisfacción",""].map((col,i) => (
                    <th key={i} className="text-left px-3 py-2 text-[9px] font-black uppercase tracking-widest whitespace-nowrap"
                      style={{ color:T.textMuted, borderBottom:`1px solid ${T.border}` }}>
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tickets.length===0
                  ? <tr><td colSpan={9}>
                      <div className="flex flex-col items-center justify-center py-12 gap-2">
                        <Inbox size={22} style={{ color:T.textFaint }}/>
                        <p className="text-xs font-bold" style={{ color:T.textMuted }}>{hayFiltros?"Sin resultados":"No hay incidencias registradas"}</p>
                      </div>
                    </td></tr>
                  : tickets.map((t,i) => {
                    const bgRow  = i%2===0?(isDark?"#141720":T.surface):(isDark?"#1c2030":T.surfaceAlt);
                    const calNum = t.calificacion?parseInt(t.calificacion):0;
                    const eBg    = t.estatus==="Resuelto"?(isDark?"rgba(22,163,74,0.15)":"#dcfce7"):t.estatus==="No Resuelto"?(isDark?"rgba(220,38,38,0.15)":"#fee2e2"):(isDark?"rgba(234,88,12,0.15)":"#ffedd5");
                    const eColor = t.estatus==="Resuelto"?"#16a34a":t.estatus==="No Resuelto"?"#dc2626":"#ea580c";
                    return (
                      <tr key={t.id_ticket} className="cursor-pointer transition-colors"
                        style={{ background:bgRow, borderBottom:`1px solid ${T.border}` }}
                        onMouseEnter={e => e.currentTarget.style.background=isDark?"rgba(244,121,32,0.05)":"rgba(244,121,32,0.03)"}
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
                            style={{ background:eBg, color:eColor }}>{t.estatus}</span>
                        </td>
                        <td className="px-3 py-2 text-[11px]" style={{ color:T.textMuted }}>{t.nombre_categoria||"-"}</td>
                        <td className="px-3 py-2 text-[11px]" style={{ color:t.resuelto_por?T.text:T.textFaint }}>
                          {t.resuelto_por?t.resuelto_por.split(" ").filter(Boolean).slice(0,2).join(" "):"-"}
                        </td>
                        <td className="px-3 py-2 text-[11px] whitespace-nowrap" style={{ color:T.textMuted }}>{fmt(t.fecha_subido)}</td>
                        <td className="px-3 py-2">
                          {calNum>0 ? <Estrellas n={calNum} isDark={isDark}/> : <span className="text-[10px]" style={{ color:T.textFaint }}>-</span>}
                        </td>
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
          {/* ── Paginación ── */}
          <div className="flex items-center justify-between px-3 py-2 flex-shrink-0" style={{ borderTop:`1px solid ${T.border}`, background:T.bg }}>
            <div className="flex items-center gap-2">
              <button disabled={page<=1 || cargando} onClick={() => setPage(p => Math.max(1, p-1))}
                className="px-2 py-1 rounded border" style={{ borderColor:T.border, background:T.surfaceAlt, color:T.text }}>
                Anterior
              </button>
              <button disabled={page>=pages || cargando} onClick={() => setPage(p => Math.min(pages, p+1))}
                className="px-2 py-1 rounded border" style={{ borderColor:T.border, background:T.surfaceAlt, color:T.text }}>
                Siguiente
              </button>
              <span className="text-[11px] ml-2" style={{ color:T.textMuted }}>{`Página ${page} de ${pages}`}</span>
            </div>
            <div className="flex items-center gap-2">
              <label style={{ color:T.textMuted, fontSize:10 }}>Mostrar</label>
              <select value={limit} onChange={e => { setLimit(parseInt(e.target.value,10)); setPage(1); }}
                style={{ padding:"4px", borderRadius:6, border:`1px solid ${T.border}`, background:T.surface, color:T.text }}>
                {[10,25,50,100].map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
          </div>
        </div>

      </div>
    </div>

    {/* ── Modal Reporte ── */}
    {modalReporte && (
      <Modal
        T={T}
        title="Parámetros del Reporte"
        onClose={() => setModalReporte(false)}
        onConfirm={generarReporte}
        confirmLabel="Generar Reporte"
        maxWidth="360px"
      >
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-bold uppercase tracking-wider" style={{ color:T.textMuted }}>Período rápido</label>
            <div className="grid grid-cols-4 gap-1">
              {[["diario","Día"],["semanal","Semana"],["mensual","Mes"],["anual","Año"]].map(([val,lbl]) => (
                <button key={val}
                  onClick={() => setParamReporte(p => ({ ...p, periodo:val, fecha_inicio:"", fecha_fin:"" }))}
                  className="py-1.5 rounded-lg text-[11px] font-bold transition-all"
                  style={{
                    background: paramReporte.periodo===val && !paramReporte.fecha_inicio ? `${T.orange}20` : (isDark?"rgba(255,255,255,0.04)":T.surfaceAlt),
                    border: `1.5px solid ${paramReporte.periodo===val && !paramReporte.fecha_inicio ? T.orange : (isDark?"rgba(255,255,255,0.1)":T.border)}`,
                    color: paramReporte.periodo===val && !paramReporte.fecha_inicio ? T.orange : T.textMuted,
                  }}>{lbl}</button>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-bold uppercase tracking-wider" style={{ color:T.textMuted }}>Fecha inicio (opcional)</label>
            <input type="date" value={paramReporte.fecha_inicio}
              onChange={e => setParamReporte(p => ({ ...p, fecha_inicio: e.target.value }))}
              className="rounded-lg px-3 py-2 text-sm"
              style={{ background:T.surfaceAlt, border:`1px solid ${T.border}`, color:T.text, outline:"none", colorScheme:isDark?"dark":"light" }}/>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-bold uppercase tracking-wider" style={{ color:T.textMuted }}>Fecha fin (opcional)</label>
            <input type="date" value={paramReporte.fecha_fin}
              onChange={e => setParamReporte(p => ({ ...p, fecha_fin: e.target.value }))}
              className="rounded-lg px-3 py-2 text-sm"
              style={{ background:T.surfaceAlt, border:`1px solid ${T.border}`, color:T.text, outline:"none", colorScheme:isDark?"dark":"light" }}/>
          </div>
        </div>
      </Modal>
    )}
    </>
  );
}
