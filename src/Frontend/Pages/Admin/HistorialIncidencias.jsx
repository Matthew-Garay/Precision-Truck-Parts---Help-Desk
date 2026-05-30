import { useState, useEffect } from "react";
import { Star, Inbox, FileDown, X } from "lucide-react";
import { apiFetch } from "../../Config/api";
import FiltrosToolbar from "../../Components/FiltrosToolbar";

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
  const [filtros, setFiltros] = useState({ busqueda:"", estatus:"Todos", prioridad:"Todos", usuario:"Todos", area:"Todos" });
  const [modalReporte, setModalReporte] = useState(false);
  const [paramReporte, setParamReporte] = useState({ fecha_inicio: "", fecha_fin: "", id_tecnico: "todos" });
  const [admins, setAdmins] = useState([]);
  const [generando, setGenerando] = useState(false);
  const [pagina,        setPagina]        = useState(1);
  const [totalBD,       setTotalBD]       = useState(0);
  const [cargando,      setCargando]      = useState(false);

  const isDark = T.isDark;
  const LIMIT = 50;

  const cargar = (pag = pagina) => {
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
  };

  // Ref estable para que el socket del Dashboard siempre llame a la versión actual
  const cargarRef = useRef(cargar);
  useEffect(() => { cargarRef.current = cargar; });

  useEffect(() => {
    if (onRecargarRef) onRecargarRef.current = () => cargarRef.current(pagina);
  }, [pagina, onRecargarRef]);

  useEffect(() => { cargar(pagina); const id = setInterval(() => cargarRef.current(pagina), 30000); return () => clearInterval(id); }, [pagina]);

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

  const usuariosOpts = [{value:"Todos",label:"Todos"},...Array.from(new Set(tickets.map(t=>t.nombre_empleado).filter(Boolean))).map(v=>({value:v,label:v}))];
  const areasOpts    = [{value:"Todos",label:"Todos"},...Array.from(new Set(tickets.map(t=>t.nombre_departamento).filter(Boolean))).map(v=>({value:v,label:v}))];

  const camposFiltro = [
    { key:"busqueda",  label:"Búsqueda Rápida", type:"search",  placeholder:"Título o folio..." },
    { key:"estatus",   label:"Estatus",          type:"select",  opts:["Todos","Resuelto","En proceso","No Resuelto"] },
    { key:"prioridad", label:"Prioridad",         type:"select",  opts:["Todos","Urgente","Alta","Media","Baja"] },
    { key:"usuario",   label:"Usuario",           type:"select",  opts:usuariosOpts },
    { key:"area",      label:"Área",              type:"select",  opts:areasOpts },
  ];

  const limpiar = () => setFiltros({ busqueda:"", estatus:"Todos", prioridad:"Todos", usuario:"Todos", area:"Todos" });

  const hayFiltros = filtros.busqueda || filtros.estatus!=="Todos" || filtros.prioridad!=="Todos"
    || filtros.usuario!=="Todos" || filtros.area!=="Todos";

  const filtrados = tickets.filter(t => {
    if (filtros.busqueda && !t.titulo?.toLowerCase().includes(filtros.busqueda.toLowerCase())
      && !t.folio_ticket?.toLowerCase().includes(filtros.busqueda.toLowerCase())) return false;
    if (filtros.prioridad !== "Todos" && t.prioridad           !== filtros.prioridad) return false;
    if (filtros.estatus   !== "Todos" && t.estatus             !== filtros.estatus)   return false;
    if (filtros.usuario   !== "Todos" && t.nombre_empleado     !== filtros.usuario)   return false;
    if (filtros.area      !== "Todos" && t.nombre_departamento !== filtros.area)      return false;
    return true;
  });

  const fmt = d => d ? new Date(d).toLocaleDateString("es-MX",{day:"2-digit",month:"2-digit",year:"numeric"}) : "-";

  const generarReporte = async () => {
    if (!paramReporte.fecha_inicio || !paramReporte.fecha_fin) return;
    setGenerando(true);
    let datos = [];
    try {
      const qs = new URLSearchParams({ fecha_inicio: paramReporte.fecha_inicio, fecha_fin: paramReporte.fecha_fin, ...(paramReporte.id_tecnico !== "todos" && { id_tecnico: paramReporte.id_tecnico }) });
      const r = await apiFetch(`/api/tickets/reporte?${qs}`);
      datos = await r.json();
      if (!Array.isArray(datos)) datos = [];
    } catch { datos = []; }
    setGenerando(false);
    setModalReporte(false);
    const ahora    = new Date().toLocaleDateString("es-MX", { day:"2-digit", month:"long", year:"numeric" });
    const fmtDate  = d => new Date(d + "T00:00:00").toLocaleDateString("es-MX", { day:"2-digit", month:"long", year:"numeric" });
    const periodo  = `${fmtDate(paramReporte.fecha_inicio)} – ${fmtDate(paramReporte.fecha_fin)}`;
    const tecnicoLabel = paramReporte.id_tecnico === "todos" ? "Todos los técnicos" : (admins.find(a => String(a.id_empleado) === String(paramReporte.id_tecnico))?.nombre_completo || "-");
    const resueltos2 = datos.filter(t => t.estatus === "Resuelto").length;
    const activos2   = datos.filter(t => t.estatus === "En proceso").length;
    const noRes2     = datos.filter(t => t.estatus === "No Resuelto").length;
    const califs2    = datos.filter(t => t.calificacion > 0);
    const prom       = califs2.length > 0 ? (califs2.reduce((a,t) => a + t.calificacion, 0) / califs2.length).toFixed(1) : "-";

    const PCOLOR_MAP = { Urgente:"#dc2626", Alta:"#ea580c", Media:"#ca8a04", Baja:"#16a34a" };
    const ESTATUS_COLOR = { "Resuelto":"#16a34a", "En proceso":"#ea580c", "No Resuelto":"#dc2626" };
    const ESTATUS_BG    = { "Resuelto":"#dcfce7", "En proceso":"#ffedd5", "No Resuelto":"#fee2e2" };

    const filas = datos.map((t, i) => `
      <tr style="background:${i%2===0?"#ffffff":"#f9fafb"}">
        <td style="padding:7px 10px;font-family:monospace;font-weight:700;color:#F47920;font-size:11px;border-bottom:1px solid #e5e7eb">${t.folio_ticket}</td>
        <td style="padding:7px 10px;font-size:11px;border-bottom:1px solid #e5e7eb;max-width:200px">
          <div style="font-weight:600;color:#1D1D1B;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${t.titulo}</div>
          <div style="font-size:10px;color:${PCOLOR_MAP[t.prioridad]||"#94a3b8"};font-weight:700;margin-top:2px">● ${t.prioridad}</div>
        </td>
        <td style="padding:7px 10px;border-bottom:1px solid #e5e7eb">
          <span style="background:${ESTATUS_BG[t.estatus]||"#f3f4f6"};color:${ESTATUS_COLOR[t.estatus]||"#374151"};padding:2px 8px;border-radius:20px;font-size:10px;font-weight:700;white-space:nowrap">${t.estatus}</span>
        </td>
        <td style="padding:7px 10px;font-size:11px;border-bottom:1px solid #e5e7eb">
          <div style="font-weight:600;color:#1D1D1B">${t.nombre_empleado||"-"}</div>
          <div style="font-size:10px;color:#6b7280">${t.nombre_departamento||"-"}</div>
        </td>
        <td style="padding:7px 10px;font-size:11px;color:#374151;border-bottom:1px solid #e5e7eb">${t.resuelto_por ? t.resuelto_por.split(" ").slice(0,2).join(" ") : "-"}</td>
        <td style="padding:7px 10px;font-size:11px;color:#6b7280;white-space:nowrap;border-bottom:1px solid #e5e7eb">${fmt(t.fecha_subido)}</td>
        <td style="padding:7px 10px;font-size:11px;color:${t.fecha_resuelto?"#16a34a":"#9ca3af"};white-space:nowrap;border-bottom:1px solid #e5e7eb">${fmt(t.fecha_resuelto)}</td>
        <td style="padding:7px 10px;font-size:11px;text-align:center;border-bottom:1px solid #e5e7eb">${t.calificacion > 0 ? "★".repeat(t.calificacion) + "☆".repeat(5 - t.calificacion) : "-"}</td>
      </tr>
    `).join("");

    const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <title>Reporte de Incidencias - Precision Truck Parts</title>
  <style>
    @page { size: A4 landscape; margin: 18mm 15mm; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', Arial, sans-serif; background: #fff; color: #1D1D1B; }

    /* -- PORTADA / ENCABEZADO -- */
    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      border: 2px solid #F47920;
      border-radius: 10px;
      padding: 14px 20px;
      margin-bottom: 14px;
      background: #fff;
    }
    .header-left { display: flex; align-items: center; gap: 16px; }
    .header-logo { height: 52px; object-fit: contain; }
    .header-divider { width: 2px; height: 48px; background: linear-gradient(180deg,#F47920,#ffb347); border-radius: 2px; }
    .header-title { font-size: 18px; font-weight: 900; color: #1D1D1B; letter-spacing: -0.02em; }
    .header-sub   { font-size: 10px; color: #6b7280; margin-top: 2px; text-transform: uppercase; letter-spacing: 0.1em; }
    .header-right { text-align: right; }
    .header-date  { font-size: 11px; color: #6b7280; }
    .header-badge {
      display: inline-block; margin-top: 4px;
      background: linear-gradient(135deg,#F47920,#d97400);
      color: #fff; font-size: 10px; font-weight: 700;
      padding: 3px 10px; border-radius: 20px;
    }

    /* -- KPIs -- */
    .kpis { display: grid; grid-template-columns: repeat(5,1fr); gap: 10px; margin-bottom: 14px; }
    .kpi {
      border: 1.5px solid #e5e7eb;
      border-radius: 8px;
      padding: 10px 14px;
      background: #fff;
    }
    .kpi-label { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: #9ca3af; margin-bottom: 4px; }
    .kpi-val   { font-size: 22px; font-weight: 900; line-height: 1; }
    .kpi-sub   { font-size: 9px; color: #9ca3af; margin-top: 3px; }
    .kpi-bar   { height: 3px; border-radius: 2px; margin-top: 6px; background: #f3f4f6; overflow: hidden; }
    .kpi-bar-fill { height: 100%; border-radius: 2px; }

    /* -- TABLA -- */
    .section-title {
      font-size: 10px; font-weight: 900; text-transform: uppercase;
      letter-spacing: 0.12em; color: #6b7280;
      display: flex; align-items: center; gap: 8px;
      margin-bottom: 8px;
    }
    .section-title::before {
      content: ''; display: inline-block;
      width: 3px; height: 14px; border-radius: 2px;
      background: #F47920;
    }
    .table-wrap {
      border: 1.5px solid #e5e7eb;
      border-radius: 10px;
      overflow: hidden;
    }
    table { width: 100%; border-collapse: collapse; }
    thead tr { background: #f9fafb; }
    th {
      padding: 8px 10px;
      text-align: left;
      font-size: 9px;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: #9ca3af;
      border-bottom: 2px solid #e5e7eb;
      white-space: nowrap;
    }
    td { vertical-align: middle; }

    /* -- PIE -- */
    .footer {
      margin-top: 14px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-top: 1.5px solid #e5e7eb;
      padding-top: 10px;
    }
    .footer-left  { font-size: 9px; color: #9ca3af; }
    .footer-right { font-size: 9px; color: #9ca3af; text-align: right; }
    .footer-brand { font-weight: 900; color: #F47920; }

    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
  </style>
</head>
<body>

  <!-- ENCABEZADO -->
  <div class="header">
    <div class="header-left">
      <img src="/assets/img/logo negro.png" class="header-logo" alt="PTP" />
      <div class="header-divider"></div>
      <div>
        <div class="header-title">Reporte de Incidencias</div>
        <div class="header-sub">Precision Truck Parts · HelpDesk</div>
      </div>
    </div>
    <div class="header-right">
      <div class="header-date">Generado el ${ahora}</div>
      <div class="header-date" style="margin-top:4px;font-weight:700;color:#F47920">${periodo}</div>
      <span class="header-badge">${datos.length} registro${datos.length !== 1 ? "s" : ""}</span>
    </div>
  </div>

  <!-- KPIs -->
  <div class="kpis">
    <div class="kpi">
      <div class="kpi-label">Total del período</div>
      <div class="kpi-val" style="color:#F47920">${datos.length}</div>
      <div class="kpi-bar"><div class="kpi-bar-fill" style="width:100%;background:#F47920"></div></div>
    </div>
    <div class="kpi">
      <div class="kpi-label">Resueltos</div>
      <div class="kpi-val" style="color:#16a34a">${resueltos2}</div>
      <div class="kpi-sub">${datos.length > 0 ? Math.round(resueltos2/datos.length*100) : 0}% del total</div>
      <div class="kpi-bar"><div class="kpi-bar-fill" style="width:${datos.length > 0 ? Math.round(resueltos2/datos.length*100) : 0}%;background:#16a34a"></div></div>
    </div>
    <div class="kpi">
      <div class="kpi-label">En Proceso</div>
      <div class="kpi-val" style="color:#ea580c">${activos2}</div>
      <div class="kpi-sub">${datos.length > 0 ? Math.round(activos2/datos.length*100) : 0}% del total</div>
      <div class="kpi-bar"><div class="kpi-bar-fill" style="width:${datos.length > 0 ? Math.round(activos2/datos.length*100) : 0}%;background:#ea580c"></div></div>
    </div>
    <div class="kpi">
      <div class="kpi-label">Sin Resolver</div>
      <div class="kpi-val" style="color:#dc2626">${noRes2}</div>
      <div class="kpi-sub">${datos.length > 0 ? Math.round(noRes2/datos.length*100) : 0}% del total</div>
      <div class="kpi-bar"><div class="kpi-bar-fill" style="width:${datos.length > 0 ? Math.round(noRes2/datos.length*100) : 0}%;background:#dc2626"></div></div>
    </div>
    <div class="kpi">
      <div class="kpi-label">Satisfacción prom.</div>
      <div class="kpi-val" style="color:#f59e0b">${prom}</div>
      <div class="kpi-sub">${califs2.length} calificaciones</div>
      <div class="kpi-bar"><div class="kpi-bar-fill" style="width:${prom !== "-" ? Math.round((parseFloat(prom)/5)*100) : 0}%;background:#f59e0b"></div></div>
    </div>
  </div>

  <!-- TABLA -->
  <div class="section-title">Detalle de Incidencias</div>
  <div class="table-wrap">
    <table>
      <thead>
        <tr>
          <th>Folio</th>
          <th>Título / Prioridad</th>
          <th>Estatus</th>
          <th>Usuario / Área</th>
          <th>Técnico</th>
          <th>Inicio</th>
          <th>Cierre</th>
          <th style="text-align:center">Satisf.</th>
        </tr>
      </thead>
      <tbody>${filas}</tbody>
    </table>
  </div>

  <!-- PIE -->
  <div class="footer">
    <div class="footer-left"><span class="footer-brand">Precision Truck Parts</span> · Sistema HelpDesk</div>
    <div class="footer-right">Documento generado automáticamente · ${ahora}</div>
  </div>

</body>
</html>`;

    const win = window.open("", "_blank", "width=1200,height=800");
    win.document.write(html);
    win.document.close();
    win.onload = () => { win.focus(); win.print(); };
  };

  const card = {
    background: isDark?"#141720":T.surface,
    border:`1px solid ${isDark?"rgba(255,255,255,0.08)":T.border}`,
    boxShadow: isDark?"0 4px 20px rgba(0,0,0,0.3)":"0 1px 4px rgba(0,0,0,0.05)",
  };
  const hdr = {
    background: isDark?"rgba(255,255,255,0.03)":T.surfaceAlt,
    borderBottom:`1px solid ${isDark?"rgba(255,255,255,0.07)":T.border}`,
  };
  const satColor = pctSat>=75?"#16a34a":pctSat>=50?"#ca8a04":"#dc2626";

  return (
    <>
    <div className="flex flex-col overflow-y-auto" style={{ background:T.bg }}>
        <div className="w-full p-3 sm:p-4 flex flex-col gap-3 sm:gap-4">

        {/* -- ESTADÍSTICOS -- */}
        <div className="grid grid-cols-12 gap-4">

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
                <span className="text-4xl font-black leading-none" style={{ color:satColor }}>{pctSat}%</span>
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
          <div className="col-span-12 sm:col-span-6 lg:col-span-3 grid grid-cols-2 gap-3">
            {[
              { label:"Total",       val:total,    color:T.orange,  sub:`${activos} activos`,    subColor:"#ea580c" },
              { label:"En Proceso",  val:activos,  color:"#ea580c", sub:`${Math.round(activos/Math.max(total,1)*100)}% del total`, subColor:T.textFaint },
              { label:"Resueltos",   val:resueltos,color:"#16a34a", sub:`${Math.round(resueltos/Math.max(total,1)*100)}% tasa`,    subColor:"#16a34a" },
              { label:"Sin Resolver",val:noRes,    color:"#dc2626", sub:`${Math.round(noRes/Math.max(total,1)*100)}% del total`,   subColor:"#dc2626" },
            ].map(({label,val,color,sub,subColor}) => (
              <div key={label} className="rounded-xl p-2.5 flex flex-col gap-1.5 relative overflow-hidden" style={card}>
                <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background:`linear-gradient(90deg,${color},${color}33)` }}/>
                <p className="text-[10px] font-black uppercase tracking-wider leading-tight" style={{ color:T.textMuted }}>{label}</p>
                <span className="text-3xl font-black leading-none" style={{ color }}>{val}</span>
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
                const slaOk = horas.filter(h=>h<=24).length;
                const slaPct= horas.length>0?Math.round(slaOk/horas.length*100):0;
                const slaColor = slaPct>=80?"#16a34a":slaPct>=50?"#ca8a04":"#dc2626";
                return (
                  <>
                    <div className="flex items-end gap-1">
                      <span className="text-3xl font-black leading-none" style={{ color:"#3b82f6" }}>{fmtH(avg)}</span>
                      <span className="text-[11px] font-semibold mb-0.5" style={{ color:T.textMuted }}>promedio</span>
                    </div>
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
                        <span className="text-[10px] font-black uppercase tracking-wider" style={{ color:T.textMuted }}>SLA &lt;24h</span>
                        <span className="text-[11px] font-black" style={{ color:slaColor }}>{slaPct}%</span>
                      </div>
                      <div className="h-2 rounded-full overflow-hidden" style={{ background:T.border }}>
                        <div className="h-full rounded-full transition-all duration-700"
                          style={{ width:`${slaPct}%`, background:`linear-gradient(90deg,${slaColor},${slaColor}88)`,
                            boxShadow:`0 0 4px ${slaColor}44` }}/>
                      </div>
                      <p className="text-[10px] mt-1" style={{ color:T.textFaint }}>{slaOk} de {horas.length} tickets en tiempo</p>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>

          {/* Prioridad + Top Áreas */}
          <div className="col-span-12 sm:col-span-6 lg:col-span-3 flex flex-col gap-3">

            {/* Prioridad */}
            <div className="rounded-xl overflow-hidden flex-1" style={card}>
              <div className="px-3 py-2 flex items-center gap-1.5" style={hdr}>
                <div className="w-1 h-3 rounded-full" style={{ background:T.orange }}/>
                <p className="text-[10px] font-black uppercase tracking-widest" style={{ color:T.textMuted }}>Por Prioridad</p>
              </div>
              <div className="p-3 flex flex-col gap-2">
                {[{l:"Urgente",c:"#dc2626"},{l:"Alta",c:"#ea580c"},{l:"Media",c:"#ca8a04"},{l:"Baja",c:"#16a34a"}].map(({l,c}) => {
                  const n = tickets.filter(t=>t.prioridad===l).length;
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

            {/* Top Áreas */}
            <div className="rounded-xl overflow-hidden flex-1" style={card}>
              <div className="px-3 py-2 flex items-center gap-1.5" style={hdr}>
                <div className="w-1 h-3 rounded-full" style={{ background:T.orange }}/>
                <p className="text-[10px] font-black uppercase tracking-widest" style={{ color:T.textMuted }}>Top Áreas</p>
              </div>
              <div className="p-3 flex flex-col gap-2">
                {(() => {
                  const conteo = {};
                  tickets.forEach(t => { if(t.nombre_departamento) conteo[t.nombre_departamento]=(conteo[t.nombre_departamento]||0)+1; });
                  const top = Object.entries(conteo).sort((a,b)=>b[1]-a[1]).slice(0,3);
                  const max = top[0]?.[1]||1;
                  const rankColors = [T.orange,"#3b82f6","#8b5cf6"];
                  return top.length===0
                    ? <p className="text-[9px]" style={{ color:T.textFaint }}>Sin datos</p>
                    : top.map(([area,n],idx) => (
                      <div key={area} className="flex items-center gap-2">
                        <span className="text-[10px] font-black w-3 flex-shrink-0 text-center" style={{ color:rankColors[idx] }}>#{idx+1}</span>
                        <span className="text-[11px] font-semibold flex-1 truncate" style={{ color:T.text }}>{area}</span>
                        <div className="w-12 h-2 rounded-full overflow-hidden flex-shrink-0" style={{ background:T.border }}>
                          <div className="h-full rounded-full transition-all duration-700"
                            style={{ width:`${Math.round(n/max*100)}%`, background:rankColors[idx],
                              boxShadow:`0 0 4px ${rankColors[idx]}55` }}/>
                        </div>
                        <span className="text-[11px] font-black w-4 text-right flex-shrink-0" style={{ color:rankColors[idx] }}>{n}</span>
                      </div>
                    ));
                })()}
              </div>
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
          <div className="rounded-xl overflow-hidden flex flex-col" style={{ ...card, minHeight: "300px" }}>
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

          <div className="overflow-y-auto overflow-x-auto flex-1">
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
          <div className="flex items-center justify-center gap-2 py-2">
            <button onClick={() => irPagina(1)} disabled={pagina === 1}
              className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-all hover:brightness-110 disabled:opacity-30"
              style={{ background: isDark?"rgba(255,255,255,0.06)":T.surfaceAlt, color:T.textMuted, border:`1px solid ${T.border}` }}>
              «
            </button>
            <button onClick={() => irPagina(pagina - 1)} disabled={pagina === 1}
              className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-all hover:brightness-110 disabled:opacity-30"
              style={{ background: isDark?"rgba(255,255,255,0.06)":T.surfaceAlt, color:T.textMuted, border:`1px solid ${T.border}` }}>
              ‹ Anterior
            </button>
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
            <button onClick={() => irPagina(pagina + 1)} disabled={pagina === totalPaginas}
              className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-all hover:brightness-110 disabled:opacity-30"
              style={{ background: isDark?"rgba(255,255,255,0.06)":T.surfaceAlt, color:T.textMuted, border:`1px solid ${T.border}` }}>
              Siguiente ›
            </button>
            <button onClick={() => irPagina(totalPaginas)} disabled={pagina === totalPaginas}
              className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-all hover:brightness-110 disabled:opacity-30"
              style={{ background: isDark?"rgba(255,255,255,0.06)":T.surfaceAlt, color:T.textMuted, border:`1px solid ${T.border}` }}>
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
              <label className="text-[11px] font-bold uppercase tracking-wider" style={{ color:T.textMuted }}>Fecha inicio</label>
              <input type="date" value={paramReporte.fecha_inicio}
                onChange={e => setParamReporte(p => ({ ...p, fecha_inicio: e.target.value }))}
                className="rounded-lg px-3 py-2 text-sm"
                style={{ background:T.surfaceAlt, border:`1px solid ${T.border}`, color:T.text, outline:"none" }}/>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-bold uppercase tracking-wider" style={{ color:T.textMuted }}>Fecha fin</label>
              <input type="date" value={paramReporte.fecha_fin}
                onChange={e => setParamReporte(p => ({ ...p, fecha_fin: e.target.value }))}
                className="rounded-lg px-3 py-2 text-sm"
                style={{ background:T.surfaceAlt, border:`1px solid ${T.border}`, color:T.text, outline:"none" }}/>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-bold uppercase tracking-wider" style={{ color:T.textMuted }}>Técnico</label>
              <select value={paramReporte.id_tecnico}
                onChange={e => setParamReporte(p => ({ ...p, id_tecnico: e.target.value }))}
                className="rounded-lg px-3 py-2 text-sm"
                style={{ background:T.surfaceAlt, border:`1px solid ${T.border}`, color:T.text, outline:"none" }}>
                <option value="todos">Todos los técnicos</option>
                {admins.map(a => (
                  <option key={a.id_empleado} value={a.id_empleado}>{a.nombre_completo}</option>
                ))}
              </select>
            </div>
          </div>

          <button onClick={generarReporte} disabled={!paramReporte.fecha_inicio || !paramReporte.fecha_fin || generando}
            className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all hover:brightness-110 active:scale-95 disabled:opacity-50"
            style={{ background:`linear-gradient(135deg,${T.orange},#d97400)`, color:"#fff" }}>
            {generando
              ? <><svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg> Generando...</>
              : <><FileDown size={14}/> Generar Reporte</>}
          </button>
        </div>
      </div>
    )}
    </>
  );
}
