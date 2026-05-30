import { useState, useEffect } from "react";
import { Eye, Ticket, CheckCircle2, Clock, Inbox, FileDown, Star, X } from "lucide-react";
import { apiFetch } from "../../Config/api";
import FiltrosToolbar from "../../Components/FiltrosToolbar";

const PCOLOR = { Urgente:"#dc2626", Alta:"#ea580c", Media:"#ca8a04", Baja:"#16a34a" };

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


function EmptyState({ T, filtered }) {
  return (
    <tr><td colSpan={9}>
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

export default function HistorialIncidencias({ T, usuario = {}, onVerTicket, onRecargarRef }) {
  const [tickets,        setTickets]        = useState([]);
  const [filtros,       setFiltros]       = useState({ busqueda:"", estatus:"Todos", prioridad:"Todos", categoria:"Todos" });
  const [modalReporte,   setModalReporte]   = useState(false);
  const [paramReporte,   setParamReporte]   = useState({ fecha_inicio:"", fecha_fin:"", periodo:"mensual" });
  const [pagina,         setPagina]         = useState(1);
  const [cargando,       setCargando]       = useState(false);
  const LIMIT = 50;

  useEffect(() => {
    if (!usuario?.id_empleado) return;
    setCargando(true);
    const cargar = () =>
      apiFetch(`/api/tickets/empleado/${usuario.id_empleado}`)
        .then(r => r.json())
        .then(d => { if (Array.isArray(d)) setTickets(prev => JSON.stringify(prev) === JSON.stringify(d) ? prev : d); })
        .catch(() => {})
        .finally(() => setCargando(false));
    // Ref estable para que el socket del Dashboard siempre llame a la versión actual
    const cargarRef = { current: cargar };
    if (onRecargarRef) onRecargarRef.current = () => cargarRef.current();
    cargar();
    const id = setInterval(() => cargarRef.current(), 30000);
    return () => clearInterval(id);
  }, [usuario?.id_empleado, onRecargarRef]);

  const total     = tickets.length;
  const activos   = tickets.filter(t => t.estatus === "En proceso").length;
  const resueltos = tickets.filter(t => t.estatus === "Resuelto").length;
  const calificados = tickets.filter(t => t.calificacion && parseInt(t.calificacion) > 0);
  const pctSat = calificados.length > 0
    ? Math.round((calificados.reduce((sum, t) => sum + parseInt(t.calificacion), 0) / (calificados.length * 5)) * 100)
    : 0;

  const categoriasOpts = ["Todos", ...Array.from(new Set(tickets.map(t => t.nombre_categoria).filter(Boolean)))];

  const camposFiltro = [
    { key:"busqueda",  label:"Búsqueda Rápida", type:"search",  placeholder:"Título o folio..." },
    { key:"estatus",   label:"Estatus",          type:"select",  opts:["Todos","Resuelto","En proceso","No Resuelto"] },
    { key:"prioridad", label:"Prioridad",         type:"select",  opts:["Todos","Urgente","Alta","Media","Baja"] },
    { key:"categoria", label:"Categoría",         type:"select",  opts:categoriasOpts },
  ];

  const limpiar = () => { setFiltros({ busqueda:"", estatus:"Todos", prioridad:"Todos", categoria:"Todos" }); setPagina(1); };

  const hayFiltros = filtros.busqueda || filtros.estatus!=="Todos" || filtros.prioridad!=="Todos" || filtros.categoria!=="Todos";

  const filtrados = tickets.filter(t => {
    if (filtros.busqueda && !t.titulo?.toLowerCase().includes(filtros.busqueda.toLowerCase())
      && !t.folio_ticket?.toLowerCase().includes(filtros.busqueda.toLowerCase())) return false;
    if (filtros.prioridad !== "Todos" && t.prioridad        !== filtros.prioridad)  return false;
    if (filtros.estatus   !== "Todos" && t.estatus          !== filtros.estatus)    return false;
    if (filtros.categoria !== "Todos" && t.nombre_categoria !== filtros.categoria)  return false;
    return true;
  });

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
        const ini = new Date(fecha_inicio + "T00:00:00");
        const fin = new Date(fecha_fin   + "T23:59:59");
        return f >= ini && f <= fin;
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
    const fmtDate = d => new Date(d+"T00:00:00").toLocaleDateString("es-MX",{day:"2-digit",month:"long",year:"numeric"});
    const ahora = ahoraDate.toLocaleDateString("es-MX",{day:"2-digit",month:"long",year:"numeric"});
    const periodo2 = fecha_inicio && fecha_fin
      ? `${fmtDate(fecha_inicio)} – ${fmtDate(fecha_fin)}`
      : labelPeriodo();
    const PCOLOR_MAP = { Urgente:"#dc2626", Alta:"#ea580c", Media:"#ca8a04", Baja:"#16a34a" };
    const ESTATUS_COLOR = { "Resuelto":"#16a34a", "En proceso":"#ea580c", "No Resuelto":"#dc2626" };
    const ESTATUS_BG    = { "Resuelto":"#dcfce7", "En proceso":"#ffedd5", "No Resuelto":"#fee2e2" };
    const fmt2 = d => d ? new Date(d).toLocaleDateString("es-MX",{day:"2-digit",month:"2-digit",year:"numeric"}) : "-";
    const filas = datos.map((t,i) => `
      <tr style="background:${i%2===0?"#ffffff":"#f9fafb"}">
        <td style="padding:7px 10px;font-family:monospace;font-weight:700;color:#F47920;font-size:11px;border-bottom:1px solid #e5e7eb">${t.folio_ticket}</td>
        <td style="padding:7px 10px;font-size:11px;border-bottom:1px solid #e5e7eb">
          <div style="font-weight:600;color:#1D1D1B">${t.titulo}</div>
          <div style="font-size:10px;color:${PCOLOR_MAP[t.prioridad]||"#94a3b8"};font-weight:700;margin-top:2px">● ${t.prioridad}</div>
        </td>
        <td style="padding:7px 10px;border-bottom:1px solid #e5e7eb">
          <span style="background:${ESTATUS_BG[t.estatus]||"#f3f4f6"};color:${ESTATUS_COLOR[t.estatus]||"#374151"};padding:2px 8px;border-radius:20px;font-size:10px;font-weight:700">${t.estatus}</span>
        </td>
        <td style="padding:7px 10px;font-size:11px;color:#6b7280;border-bottom:1px solid #e5e7eb">${t.nombre_categoria||"-"}</td>
        <td style="padding:7px 10px;font-size:11px;color:#6b7280;white-space:nowrap;border-bottom:1px solid #e5e7eb">${fmt2(t.fecha_subido)}</td>
        <td style="padding:7px 10px;font-size:11px;color:${t.fecha_resuelto?"#16a34a":"#9ca3af"};white-space:nowrap;border-bottom:1px solid #e5e7eb">${fmt2(t.fecha_resuelto)}</td>
      </tr>
    `).join("");
    const html = `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"/><title>Mis Incidencias</title>
    <style>@page{size:A4;margin:18mm 15mm}*{box-sizing:border-box;margin:0;padding:0}body{font-family:'Segoe UI',Arial,sans-serif;background:#fff;color:#1D1D1B}
    .header{display:flex;align-items:center;justify-content:space-between;border:2px solid #F47920;border-radius:10px;padding:14px 20px;margin-bottom:14px}
    .header-logo{height:48px;object-fit:contain}.header-title{font-size:16px;font-weight:900;color:#1D1D1B}.header-sub{font-size:10px;color:#6b7280;text-transform:uppercase;letter-spacing:.1em}
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
        <div style="font-size:10px;color:#6b7280;margin-top:2px">${periodo2}</div>
      </div>
    </div>
    <div class="table-wrap"><table><thead><tr><th>Folio</th><th>Título / Prioridad</th><th>Estatus</th><th>Categoría</th><th>Inicio</th><th>Cierre</th></tr></thead><tbody>${filas}</tbody></table></div>
    </body></html>`;
    setModalReporte(false);
    const win = window.open("","_blank","width=900,height=700");
    win.document.write(html); win.document.close();
    win.onload = () => { win.focus(); win.print(); };
  };

  const totalPaginas  = Math.max(1, Math.ceil(filtrados.length / LIMIT));
  const paginados     = filtrados.slice((pagina - 1) * LIMIT, pagina * LIMIT);
  const irPagina      = (p) => { if (p >= 1 && p <= totalPaginas) setPagina(p); };

  const isDark = T.isDark;
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
    <>
    <div className="flex flex-col overflow-y-auto" style={{ background:T.bg }}>
      <div className="w-full p-3 flex flex-col gap-3">

        {/* -- KPIs -- */}
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

        {/* -- FILTROS -- */}
        <FiltrosToolbar campos={camposFiltro} valores={filtros} onChange={(k,v) => setFiltros(p=>({...p,[k]:v}))} onLimpiar={limpiar} T={T}>
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
          <div className="rounded-xl overflow-hidden flex flex-col" style={{ ...card, minHeight: "300px" }}>
          <div className="flex items-center justify-between px-3 py-2" style={hdr}>
            <div className="flex items-center gap-1.5">
              <div className="w-0.5 h-3 rounded-full" style={{ background:T.orange }}/>
              <p className="text-[9px] font-black uppercase tracking-widest" style={{ color:T.textMuted }}>Registros</p>
            </div>
            <div className="flex items-center gap-2">
              {cargando && (
                <svg className="animate-spin" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={T.orange} strokeWidth="2.5"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
              )}
              <span className="text-[9px] font-bold px-2 py-0.5 rounded-full"
                style={{ background:T.bg, color:T.textMuted, border:`1px solid ${T.border}` }}>
                {filtrados.length} resultado{filtrados.length!==1?"s":""}{totalPaginas > 1 ? ` · pág. ${pagina}/${totalPaginas}` : ""}
              </span>
            </div>
          </div>

          {/* Móvil */}
          <div className="flex flex-col gap-2 p-3 sm:hidden">
            {paginados.length === 0
              ? <div className="flex flex-col items-center justify-center py-8 gap-2">
                  <Inbox size={20} style={{ color:T.textFaint }}/>
                  <p className="text-xs font-bold" style={{ color:T.textMuted }}>
                    {hayFiltros?"Sin resultados":"No hay incidencias"}
                  </p>
                </div>
              : paginados.map(t => {
                  const fecha = t.fecha_subido ? new Date(t.fecha_subido).toLocaleDateString("es-MX",{day:"2-digit",month:"2-digit",year:"numeric"}) : "-";
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
                        {t.resuelto_por && (
                          <span className="text-[10px] truncate" style={{ color:T.textFaint }}>
                            {t.resuelto_por.split(" ").filter(Boolean).slice(0,2).join(" ")}
                          </span>
                        )}
                        {t.calificacion && parseInt(t.calificacion) > 0 && (
                          <div className="flex items-center gap-0.5">
                            {[1,2,3,4,5].map(s => (
                              <Star key={s} size={9}
                                fill={s <= parseInt(t.calificacion) ? "#f59e0b" : "none"}
                                style={{ color: s <= parseInt(t.calificacion) ? "#f59e0b" : "rgba(255,255,255,0.15)" }}/>
                            ))}
                          </div>
                        )}
                        <span className="text-[11px]" style={{ color:T.textFaint }}>{fecha}</span>
                      </div>
                    </div>
                  );
                })
            }
          </div>

          {/* Desktop */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full border-collapse" style={{ minWidth:"760px" }}>
              <thead>
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
                {paginados.length===0
                  ? <EmptyState T={T} filtered={hayFiltros}/>
                  : paginados.map((t,i) => {
                    const fecha = t.fecha_subido?new Date(t.fecha_subido).toLocaleDateString("es-MX",{day:"2-digit",month:"2-digit",year:"numeric"}):"-";
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
                        <td className="px-3 py-2 text-[11px]" style={{ color:T.textMuted }}>{t.nombre_categoria||"-"}</td>
                        <td className="px-3 py-2 text-[11px]" style={{ color:t.resuelto_por?T.text:T.textFaint }}>
                          {t.resuelto_por ? t.resuelto_por.split(" ").filter(Boolean).slice(0,2).join(" ") : "-"}
                        </td>
                        <td className="px-3 py-2 text-[11px] whitespace-nowrap" style={{ color:T.textMuted }}>{fecha}</td>
                        <td className="px-3 py-2">
                          {t.calificacion && parseInt(t.calificacion) > 0
                            ? <div className="flex items-center gap-0.5">
                                {[1,2,3,4,5].map(s => (
                                  <Star key={s} size={10}
                                    fill={s <= parseInt(t.calificacion) ? "#f59e0b" : "none"}
                                    style={{ color: s <= parseInt(t.calificacion) ? "#f59e0b" : isDark?"rgba(255,255,255,0.15)":"#d1d5db" }}/>
                                ))}
                              </div>
                            : <span className="text-[10px]" style={{ color:T.textFaint }}>-</span>}
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
        </div>
        {totalPaginas > 1 && (
          <div className="flex items-center justify-center gap-2 py-2">
            <button onClick={() => irPagina(1)} disabled={pagina===1}
              className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-all hover:brightness-110 disabled:opacity-30"
              style={{ background:isDark?"rgba(255,255,255,0.06)":T.surfaceAlt, color:T.textMuted, border:`1px solid ${T.border}` }}>
              «
            </button>
            <button onClick={() => irPagina(pagina-1)} disabled={pagina===1}
              className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-all hover:brightness-110 disabled:opacity-30"
              style={{ background:isDark?"rgba(255,255,255,0.06)":T.surfaceAlt, color:T.textMuted, border:`1px solid ${T.border}` }}>
              ‹ Anterior
            </button>
            {Array.from({ length: Math.min(5, totalPaginas) }, (_, i) => {
              const start = Math.max(1, Math.min(pagina-2, totalPaginas-4));
              const p = start + i;
              if (p > totalPaginas) return null;
              return (
                <button key={p} onClick={() => irPagina(p)}
                  className="w-8 h-8 rounded-lg text-[11px] font-bold transition-all hover:brightness-110"
                  style={{ background:p===pagina?T.orange:(isDark?"rgba(255,255,255,0.06)":T.surfaceAlt), color:p===pagina?"#fff":T.textMuted, border:`1px solid ${p===pagina?T.orange:T.border}` }}>
                  {p}
                </button>
              );
            })}
            <button onClick={() => irPagina(pagina+1)} disabled={pagina===totalPaginas}
              className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-all hover:brightness-110 disabled:opacity-30"
              style={{ background:isDark?"rgba(255,255,255,0.06)":T.surfaceAlt, color:T.textMuted, border:`1px solid ${T.border}` }}>
              Siguiente ›
            </button>
            <button onClick={() => irPagina(totalPaginas)} disabled={pagina===totalPaginas}
              className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-all hover:brightness-110 disabled:opacity-30"
              style={{ background:isDark?"rgba(255,255,255,0.06)":T.surfaceAlt, color:T.textMuted, border:`1px solid ${T.border}` }}>
              »
            </button>
          </div>
        )}
        </div>
    </div>

    {/* -- MODAL REPORTE -- */}

    {modalReporte && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ background:"rgba(0,0,0,0.55)" }}
        onClick={() => setModalReporte(false)}>
        <div className="rounded-2xl w-full max-w-sm flex flex-col gap-4 p-5"
          style={{ background:isDark?"#161B22":"#fff", border:`1px solid ${T.border}`, boxShadow:"0 20px 60px rgba(0,0,0,0.4)" }}
          onClick={e => e.stopPropagation()}>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-1 h-4 rounded-full" style={{ background:T.orange }}/>
              <span className="text-sm font-black" style={{ color:T.text }}>Parámetros del Reporte</span>
            </div>
            <button onClick={() => setModalReporte(false)}
              className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background:T.surfaceAlt, color:T.textMuted, border:`1px solid ${T.border}` }}>
              <X size={13}/>
            </button>
          </div>

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

          <button onClick={generarReporte}
            className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all hover:brightness-110 active:scale-95"
            style={{ background:`linear-gradient(135deg,${T.orange},#d97400)`, color:"#fff" }}>
            <FileDown size={14}/> Generar Reporte
          </button>
        </div>
      </div>
    )}
    </>
  );
}
