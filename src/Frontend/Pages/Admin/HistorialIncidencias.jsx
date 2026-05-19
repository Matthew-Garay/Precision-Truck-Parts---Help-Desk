import { useState, useEffect } from "react";
import { Search, X, SlidersHorizontal, Star, ChevronDown, Inbox, FileDown } from "lucide-react";
import API from "../../Config/api";

const PRIORIDADES = ["Todos","Urgente","Alta","Media","Baja"];
const ESTATUS_OPTS = ["Todos","Resuelto","En proceso","No Resuelto"];
const MESES = ["Todos","Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
const DIAS  = ["Todos",...Array.from({length:31},(_,i)=>String(i+1))];
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

export default function HistorialIncidencias({ T, usuario = {}, onVerTicket }) {
  const [tickets,       setTickets]       = useState([]);
  const [busqueda,      setBusqueda]      = useState("");
  const [prioFiltro,    setPrioFiltro]    = useState("Todos");
  const [estatusFiltro, setEstatusFiltro] = useState("Todos");
  const [usuarioFiltro, setUsuarioFiltro] = useState("Todos");
  const [areaFiltro,    setAreaFiltro]    = useState("Todos");
  const [mesFiltro,     setMesFiltro]     = useState("Todos");
  const [diaFiltro,     setDiaFiltro]     = useState("Todos");

  const isDark = T.bg === "#0b0e14";

  const LIMIT = 500;
  const cargar = () =>
    fetch(`${API}/api/tickets?limit=${LIMIT}&page=1`)
      .then(r => r.json())
      .then(d => {
        const lista = Array.isArray(d) ? d : (Array.isArray(d?.data) ? d.data : []);
        setTickets(prev => JSON.stringify(prev) === JSON.stringify(lista) ? prev : lista);
      })
      .catch(() => {});

  useEffect(() => { cargar(); const id = setInterval(cargar, 30000); return () => clearInterval(id); }, []);

  const total     = tickets.length;
  const resueltos = tickets.filter(t => t.estatus === "Resuelto").length;
  const activos   = tickets.filter(t => t.estatus === "En proceso").length;
  const noRes     = tickets.filter(t => t.estatus === "No Resuelto").length;
  const califs    = tickets.filter(t => t.calificacion > 0);
  const pctSat    = califs.length > 0
    ? Math.round((califs.reduce((a,t) => a + t.calificacion, 0) / (califs.length * 5)) * 100) : 0;

  const usuariosOpts = ["Todos",...Array.from(new Set(tickets.map(t=>t.nombre_empleado).filter(Boolean)))];
  const areasOpts    = ["Todos",...Array.from(new Set(tickets.map(t=>t.nombre_departamento).filter(Boolean)))];

  const limpiar = () => {
    setBusqueda(""); setPrioFiltro("Todos"); setEstatusFiltro("Todos");
    setUsuarioFiltro("Todos"); setAreaFiltro("Todos");
    setMesFiltro("Todos"); setDiaFiltro("Todos");
  };

  const hayFiltros = busqueda || prioFiltro!=="Todos" || estatusFiltro!=="Todos"
    || usuarioFiltro!=="Todos" || areaFiltro!=="Todos"
    || mesFiltro!=="Todos" || diaFiltro!=="Todos";

  const filtrados = tickets.filter(t => {
    if (busqueda && !t.titulo?.toLowerCase().includes(busqueda.toLowerCase())
      && !t.folio_ticket?.toLowerCase().includes(busqueda.toLowerCase())) return false;
    if (prioFiltro    !== "Todos" && t.prioridad          !== prioFiltro)    return false;
    if (estatusFiltro !== "Todos" && t.estatus            !== estatusFiltro) return false;
    if (usuarioFiltro !== "Todos" && t.nombre_empleado    !== usuarioFiltro) return false;
    if (areaFiltro    !== "Todos" && t.nombre_departamento!== areaFiltro)    return false;
    if (mesFiltro !== "Todos" && t.fecha_subido)
      if (new Date(t.fecha_subido).getMonth()+1 !== MESES.indexOf(mesFiltro)) return false;
    if (diaFiltro !== "Todos" && t.fecha_subido)
      if (new Date(t.fecha_subido).getDate() !== parseInt(diaFiltro)) return false;
    return true;
  });

  const fmt = d => d ? new Date(d).toLocaleDateString("es-MX",{day:"2-digit",month:"2-digit",year:"numeric"}) : "—";

  const generarReporte = () => {
    const ahora = new Date().toLocaleDateString("es-MX", { day:"2-digit", month:"long", year:"numeric" });
    const resueltos2 = filtrados.filter(t => t.estatus === "Resuelto").length;
    const activos2   = filtrados.filter(t => t.estatus === "En proceso").length;
    const noRes2     = filtrados.filter(t => t.estatus === "No Resuelto").length;
    const califs2    = filtrados.filter(t => t.calificacion > 0);
    const prom       = califs2.length > 0 ? (califs2.reduce((a,t) => a + t.calificacion, 0) / califs2.length).toFixed(1) : "—";

    const PCOLOR_MAP = { Urgente:"#dc2626", Alta:"#ea580c", Media:"#ca8a04", Baja:"#16a34a" };
    const ESTATUS_COLOR = { "Resuelto":"#16a34a", "En proceso":"#ea580c", "No Resuelto":"#dc2626" };
    const ESTATUS_BG    = { "Resuelto":"#dcfce7", "En proceso":"#ffedd5", "No Resuelto":"#fee2e2" };

    const filas = filtrados.map((t, i) => `
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
          <div style="font-weight:600;color:#1D1D1B">${t.nombre_empleado||"—"}</div>
          <div style="font-size:10px;color:#6b7280">${t.nombre_departamento||"—"}</div>
        </td>
        <td style="padding:7px 10px;font-size:11px;color:#374151;border-bottom:1px solid #e5e7eb">${t.resuelto_por ? t.resuelto_por.split(" ").slice(0,2).join(" ") : "—"}</td>
        <td style="padding:7px 10px;font-size:11px;color:#6b7280;white-space:nowrap;border-bottom:1px solid #e5e7eb">${fmt(t.fecha_subido)}</td>
        <td style="padding:7px 10px;font-size:11px;color:${t.fecha_resuelto?"#16a34a":"#9ca3af"};white-space:nowrap;border-bottom:1px solid #e5e7eb">${fmt(t.fecha_resuelto)}</td>
        <td style="padding:7px 10px;font-size:11px;text-align:center;border-bottom:1px solid #e5e7eb">${t.calificacion > 0 ? "★".repeat(t.calificacion) + "☆".repeat(5 - t.calificacion) : "—"}</td>
      </tr>
    `).join("");

    const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <title>Reporte de Incidencias — Precision Truck Parts</title>
  <style>
    @page { size: A4 landscape; margin: 18mm 15mm; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', Arial, sans-serif; background: #fff; color: #1D1D1B; }

    /* ── PORTADA / ENCABEZADO ── */
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

    /* ── KPIs ── */
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

    /* ── TABLA ── */
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

    /* ── PIE ── */
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
      <span class="header-badge">${filtrados.length} registro${filtrados.length !== 1 ? "s" : ""}</span>
    </div>
  </div>

  <!-- KPIs -->
  <div class="kpis">
    <div class="kpi">
      <div class="kpi-label">Total filtrados</div>
      <div class="kpi-val" style="color:#F47920">${filtrados.length}</div>
      <div class="kpi-bar"><div class="kpi-bar-fill" style="width:100%;background:#F47920"></div></div>
    </div>
    <div class="kpi">
      <div class="kpi-label">Resueltos</div>
      <div class="kpi-val" style="color:#16a34a">${resueltos2}</div>
      <div class="kpi-sub">${filtrados.length > 0 ? Math.round(resueltos2/filtrados.length*100) : 0}% del total</div>
      <div class="kpi-bar"><div class="kpi-bar-fill" style="width:${filtrados.length > 0 ? Math.round(resueltos2/filtrados.length*100) : 0}%;background:#16a34a"></div></div>
    </div>
    <div class="kpi">
      <div class="kpi-label">En Proceso</div>
      <div class="kpi-val" style="color:#ea580c">${activos2}</div>
      <div class="kpi-sub">${filtrados.length > 0 ? Math.round(activos2/filtrados.length*100) : 0}% del total</div>
      <div class="kpi-bar"><div class="kpi-bar-fill" style="width:${filtrados.length > 0 ? Math.round(activos2/filtrados.length*100) : 0}%;background:#ea580c"></div></div>
    </div>
    <div class="kpi">
      <div class="kpi-label">Sin Resolver</div>
      <div class="kpi-val" style="color:#dc2626">${noRes2}</div>
      <div class="kpi-sub">${filtrados.length > 0 ? Math.round(noRes2/filtrados.length*100) : 0}% del total</div>
      <div class="kpi-bar"><div class="kpi-bar-fill" style="width:${filtrados.length > 0 ? Math.round(noRes2/filtrados.length*100) : 0}%;background:#dc2626"></div></div>
    </div>
    <div class="kpi">
      <div class="kpi-label">Satisfacción prom.</div>
      <div class="kpi-val" style="color:#f59e0b">${prom}</div>
      <div class="kpi-sub">${califs2.length} calificaciones</div>
      <div class="kpi-bar"><div class="kpi-bar-fill" style="width:${prom !== "—" ? Math.round((parseFloat(prom)/5)*100) : 0}%;background:#f59e0b"></div></div>
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
    <div className="h-full flex flex-col overflow-hidden" style={{ background:T.bg }}>
      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        <div className="max-w-[1400px] mx-auto p-3 flex flex-col gap-3">

        {/* ── ESTADÍSTICOS ── */}
        <div className="grid grid-cols-12 gap-2">

          {/* Satisfacción */}
          <div className="col-span-12 sm:col-span-6 lg:col-span-3 rounded-xl overflow-hidden relative" style={card}>
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
              style={{ background:`radial-gradient(circle at 80% 20%, ${satColor}, transparent 60%)` }}/>
            <div className="h-0.5" style={{ background:`linear-gradient(90deg,${satColor},${satColor}33)` }}/>
            <div className="p-3 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <div className="w-1 h-3 rounded-full" style={{ background:satColor }}/>
                  <p className="text-[8px] font-black uppercase tracking-widest" style={{ color:T.textMuted }}>Satisfacción</p>
                </div>
                <span className="text-[9px] font-bold px-2 py-0.5 rounded-full"
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
                    <span className="text-[8px] ml-1 font-semibold" style={{ color:T.textFaint }}>{califs.length} calif.</span>
                  </div>
                </div>
              </div>
              <div className="pt-2 mt-1 flex items-center justify-between" style={{ borderTop:`1px solid ${T.border}` }}>
                <span className="text-[9px]" style={{ color:T.textFaint }}>Promedio calificación</span>
                <span className="text-[10px] font-black" style={{ color:satColor }}>
                  {califs.length>0?(califs.reduce((a,t)=>a+t.calificacion,0)/califs.length).toFixed(1):"—"} / 5
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
              <div key={label} className="rounded-xl p-2.5 flex flex-col gap-1.5 relative overflow-hidden" style={card}>
                <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background:`linear-gradient(90deg,${color},${color}33)` }}/>
                <p className="text-[8px] font-black uppercase tracking-wider leading-tight" style={{ color:T.textMuted }}>{label}</p>
                <span className="text-2xl font-black leading-none" style={{ color }}>{val}</span>
                <div className="h-1 rounded-full overflow-hidden" style={{ background:T.border }}>
                  <div className="h-full rounded-full transition-all duration-700"
                    style={{ width:`${total>0?Math.round(val/total*100):0}%`, background:color,
                      boxShadow:`0 0 4px ${color}44` }}/>
                </div>
                <span className="text-[8px] font-semibold" style={{ color:subColor }}>{sub}</span>
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
                <p className="text-[8px] font-black uppercase tracking-widest" style={{ color:T.textMuted }}>Tiempo de Respuesta</p>
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
                      <span className="text-[9px] font-semibold mb-0.5" style={{ color:T.textMuted }}>promedio</span>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5">
                      <div className="rounded-lg p-1.5" style={{ background:isDark?"rgba(22,163,74,0.1)":"#f0fdf4", border:"1px solid rgba(22,163,74,0.2)" }}>
                        <p className="text-[7px] font-black uppercase" style={{ color:"#16a34a" }}>Mínimo</p>
                        <p className="text-sm font-black" style={{ color:"#16a34a" }}>{fmtH(min)}</p>
                      </div>
                      <div className="rounded-lg p-1.5" style={{ background:isDark?"rgba(220,38,38,0.1)":"#fef2f2", border:"1px solid rgba(220,38,38,0.2)" }}>
                        <p className="text-[7px] font-black uppercase" style={{ color:"#dc2626" }}>Máximo</p>
                        <p className="text-sm font-black" style={{ color:"#dc2626" }}>{fmtH(max)}</p>
                      </div>
                    </div>
                    <div className="pt-2" style={{ borderTop:`1px solid ${T.border}` }}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[8px] font-black uppercase tracking-wider" style={{ color:T.textMuted }}>SLA &lt;24h</span>
                        <span className="text-[9px] font-black" style={{ color:slaColor }}>{slaPct}%</span>
                      </div>
                      <div className="h-2 rounded-full overflow-hidden" style={{ background:T.border }}>
                        <div className="h-full rounded-full transition-all duration-700"
                          style={{ width:`${slaPct}%`, background:`linear-gradient(90deg,${slaColor},${slaColor}88)`,
                            boxShadow:`0 0 4px ${slaColor}44` }}/>
                      </div>
                      <p className="text-[8px] mt-1" style={{ color:T.textFaint }}>{slaOk} de {horas.length} tickets en tiempo</p>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>

          {/* Prioridad + Top Áreas */}
          <div className="col-span-12 sm:col-span-6 lg:col-span-3 flex flex-col gap-2">

            {/* Prioridad */}
            <div className="rounded-xl overflow-hidden flex-1" style={card}>
              <div className="px-3 py-2 flex items-center gap-1.5" style={hdr}>
                <div className="w-1 h-3 rounded-full" style={{ background:T.orange }}/>
                <p className="text-[8px] font-black uppercase tracking-widest" style={{ color:T.textMuted }}>Por Prioridad</p>
              </div>
              <div className="p-3 flex flex-col gap-1.5">
                {[{l:"Urgente",c:"#dc2626"},{l:"Alta",c:"#ea580c"},{l:"Media",c:"#ca8a04"},{l:"Baja",c:"#16a34a"}].map(({l,c}) => {
                  const n = tickets.filter(t=>t.prioridad===l).length;
                  const pct = total>0?Math.round(n/total*100):0;
                  return (
                    <div key={l} className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background:c, boxShadow:`0 0 4px ${c}88` }}/>
                      <span className="text-[9px] font-semibold w-11 flex-shrink-0" style={{ color:T.text }}>{l}</span>
                      <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background:isDark?"rgba(255,255,255,0.06)":`${c}15` }}>
                        <div className="h-full rounded-full transition-all duration-700"
                          style={{ width:`${pct>0?Math.max(pct,5):0}%`, background:c, boxShadow:`0 0 4px ${c}55` }}/>
                      </div>
                      <span className="text-[9px] font-black w-5 text-right flex-shrink-0" style={{ color:c }}>{n}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Top Áreas */}
            <div className="rounded-xl overflow-hidden flex-1" style={card}>
              <div className="px-3 py-2 flex items-center gap-1.5" style={hdr}>
                <div className="w-1 h-3 rounded-full" style={{ background:T.orange }}/>
                <p className="text-[8px] font-black uppercase tracking-widest" style={{ color:T.textMuted }}>Top Áreas</p>
              </div>
              <div className="p-3 flex flex-col gap-1.5">
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
                        <span className="text-[8px] font-black w-3 flex-shrink-0 text-center" style={{ color:rankColors[idx] }}>#{idx+1}</span>
                        <span className="text-[9px] font-semibold flex-1 truncate" style={{ color:T.text }}>{area}</span>
                        <div className="w-12 h-2 rounded-full overflow-hidden flex-shrink-0" style={{ background:T.border }}>
                          <div className="h-full rounded-full transition-all duration-700"
                            style={{ width:`${Math.round(n/max*100)}%`, background:rankColors[idx],
                              boxShadow:`0 0 4px ${rankColors[idx]}55` }}/>
                        </div>
                        <span className="text-[9px] font-black w-4 text-right flex-shrink-0" style={{ color:rankColors[idx] }}>{n}</span>
                      </div>
                    ));
                })()}
              </div>
            </div>

          </div>

        </div>

        {/* ── FILTROS ── */}
        <div className="rounded-xl overflow-hidden" style={card}>
          <div className="flex items-center justify-between px-3 py-2" style={hdr}>
            <div className="flex items-center gap-1.5">
              <SlidersHorizontal size={12} style={{ color:T.orange }} />
              <p className="text-[9px] font-black uppercase tracking-widest" style={{ color:T.textMuted }}>Filtros</p>
            </div>
            <div className="flex items-center gap-2 ml-auto">
            {hayFiltros && (
              <button onClick={limpiar}
                className="flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-md"
                style={{ color:T.orange, background:"rgba(244,121,32,0.08)", border:"1px solid rgba(244,121,32,0.2)" }}>
                <X size={9} strokeWidth={3}/> Limpiar
              </button>
            )}
            <button onClick={generarReporte}
              className="flex items-center gap-1.5 text-[10px] font-bold px-3 py-1.5 rounded-md transition-all hover:brightness-110 active:scale-95"
              style={{ color:"#fff", background:`linear-gradient(135deg,${T.orange},#d97400)`, boxShadow:"0 2px 8px rgba(244,121,32,0.35)" }}>
              <FileDown size={11} strokeWidth={2.5}/> Generar Reporte
            </button>
          </div>
          </div>

          <div className="px-3 py-2 flex flex-wrap items-end gap-x-2 gap-y-2">
            {/* Buscador */}
            <div className="flex flex-col gap-0.5" style={{ minWidth:"120px", flex:"1 1 120px", maxWidth:"180px" }}>
              <span className="text-[8px] font-black uppercase tracking-wider"
                style={{ color:busqueda?T.orange:T.textFaint }}>Buscar</span>
              <div className="relative">
                <Search size={11} className="absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none"
                  style={{ color:busqueda?T.orange:T.textFaint }} />
                <input
                  className="w-full pl-6 pr-5 py-1 rounded-md text-[11px] outline-none"
                  style={{ background:isDark?"rgba(255,255,255,0.05)":T.surfaceAlt,
                    border:`1px solid ${busqueda?T.orange:T.border}`, color:T.text }}
                  placeholder="Título o folio..."
                  value={busqueda} onChange={e => setBusqueda(e.target.value)}
                  onFocus={e => { e.target.style.borderColor=T.orange; }}
                  onBlur={e  => { if(!busqueda) e.target.style.borderColor=T.border; }} />
                {busqueda && (
                  <button onClick={()=>setBusqueda("")}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2">
                    <X size={9} strokeWidth={2.5} style={{ color:T.textMuted }} />
                  </button>
                )}
              </div>
            </div>

            <FiltroSelect label="Estatus"   value={estatusFiltro} onChange={setEstatusFiltro} opts={ESTATUS_OPTS}  active={estatusFiltro!=="Todos"} T={T} isDark={isDark} />
            <FiltroSelect label="Prioridad" value={prioFiltro}    onChange={setPrioFiltro}    opts={PRIORIDADES}   active={prioFiltro!=="Todos"}    T={T} isDark={isDark} />
            <FiltroSelect label="Usuario"   value={usuarioFiltro} onChange={setUsuarioFiltro} opts={usuariosOpts}  active={usuarioFiltro!=="Todos"} T={T} isDark={isDark} />
            <FiltroSelect label="Área"      value={areaFiltro}    onChange={setAreaFiltro}    opts={areasOpts}     active={areaFiltro!=="Todos"}    T={T} isDark={isDark} />
            <FiltroSelect label="Mes"       value={mesFiltro}     onChange={setMesFiltro}     opts={MESES}         active={mesFiltro!=="Todos"}     T={T} isDark={isDark} />
            <FiltroSelect label="Día"       value={diaFiltro}     onChange={setDiaFiltro}     opts={DIAS}          active={diaFiltro!=="Todos"}     T={T} isDark={isDark} />
          </div>
        </div>{/* fin filtros */}

          {/* ── TABLA ── */}
          <div className="rounded-xl overflow-hidden flex flex-col" style={{ ...card, minHeight: "300px" }}>
          <div className="flex items-center justify-between px-3 py-2 flex-shrink-0" style={hdr}>
            <div className="flex items-center gap-1.5">
              <div className="w-0.5 h-3.5 rounded-full" style={{ background:T.orange }} />
              <p className="text-[9px] font-black uppercase tracking-widest" style={{ color:T.textMuted }}>Registros</p>
            </div>
            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full"
              style={{ background:T.bg, color:T.textMuted, border:`1px solid ${T.border}` }}>
              {filtrados.length} resultado{filtrados.length!==1?"s":""}
            </span>
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
                          <span className="text-[11px]" style={{ color:T.textFaint }}>{t.nombre_empleado?.split(" ").slice(0,2).join(" ")||"—"}</span>
                        </div>
                      </div>
                    );
                  })
              }
            </div>
            {/* Vista tabla desktop */}
            <div className="hidden sm:block overflow-x-auto">
            <table className="w-full border-collapse" style={{ minWidth:"860px" }}>
              <thead className="sticky top-0 z-10">
                <tr style={{ background:isDark?"#1c2030":T.surfaceAlt }}>
                  {["Folio","Título","Estatus","Usuario / Área","Técnico","Inicio","Cierre","Satisfacción",""].map((col,i) => (
                    <th key={i} className="text-left px-3 py-2 text-[9px] font-black uppercase tracking-widest whitespace-nowrap"
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

                      <td className="px-3 py-2" style={{ maxWidth:"180px" }}>
                        <span className="block truncate text-[11px] font-semibold"
                          style={{ color:esCrit?PCOLOR[t.prioridad]:T.text }}>{t.titulo}</span>
                        <span className="flex items-center gap-1 mt-0.5">
                          <span className="w-1.5 h-1.5 rounded-full" style={{ background:PCOLOR[t.prioridad]||"#94a3b8" }} />
                          <span className="text-[9px] font-bold" style={{ color:PCOLOR[t.prioridad]||T.textMuted }}>{t.prioridad}</span>
                        </span>
                      </td>

                      <td className="px-3 py-2">
                        <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold whitespace-nowrap"
                          style={{ background:eBg, color:eColor }}>{t.estatus}</span>
                      </td>

                      <td className="px-3 py-2">
                        <span className="block text-[10px] font-semibold" style={{ color:T.text }}>{t.nombre_empleado||"—"}</span>
                        <span className="block text-[9px]" style={{ color:T.textMuted }}>{t.nombre_departamento||"—"}</span>
                      </td>

                      <td className="px-3 py-2 text-[10px]" style={{ color:t.resuelto_por?T.text:T.textFaint }}>
                        {t.resuelto_por?t.resuelto_por.split(" ").filter(Boolean).slice(0,2).join(" "):"—"}
                      </td>

                      <td className="px-3 py-2 text-[10px] whitespace-nowrap" style={{ color:T.textMuted }}>{fmt(t.fecha_subido)}</td>

                      <td className="px-3 py-2 text-[10px] whitespace-nowrap"
                        style={{ color:t.fecha_resuelto?"#16a34a":T.textFaint }}>{fmt(t.fecha_resuelto)}</td>

                      <td className="px-3 py-2">
                        {calNum>0
                          ? <Estrellas n={calNum} isDark={isDark}/>
                          : <span className="text-[9px]" style={{ color:T.textFaint }}>—</span>}
                      </td>

                      <td className="px-3 py-2">
                        <button
                          onClick={() => onVerTicket(t)}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all hover:brightness-110 active:scale-95"
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
        </div>{/* fin max-w */}
      </div>{/* fin scroll */}
    </div>
  );
}
