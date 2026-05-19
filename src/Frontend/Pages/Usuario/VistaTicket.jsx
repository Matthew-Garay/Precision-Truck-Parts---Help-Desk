import { useState, useEffect } from "react";
import {
  ArrowLeft, Tag, Calendar, User, Clock,
  CheckCircle2, XCircle, ImageOff, ZoomIn,
  X, MessageSquare, ChevronLeft, ChevronRight, Star
} from "lucide-react";
import API from "../../Config/api";

const PRIO = {
  Urgente: { color: "#dc2626", bgL: "#fee2e2", bgD: "rgba(220,38,38,0.15)", borderL: "#fca5a5", borderD: "rgba(220,38,38,0.3)" },
  Alta:    { color: "#ea580c", bgL: "#ffedd5", bgD: "rgba(234,88,12,0.15)",  borderL: "#fdba74", borderD: "rgba(234,88,12,0.3)"  },
  Media:   { color: "#ca8a04", bgL: "#fef9c3", bgD: "rgba(202,138,4,0.15)",  borderL: "#fde047", borderD: "rgba(202,138,4,0.3)"  },
  Baja:    { color: "#16a34a", bgL: "#dcfce7", bgD: "rgba(22,163,74,0.15)",  borderL: "#86efac", borderD: "rgba(22,163,74,0.3)"  },
};

function CalificacionEstrellas({ T, ticket, isDark, estatusActual }) {
  const calInicial = ticket.calificacion ? parseInt(ticket.calificacion, 10) : 0;
  const idTicket   = parseInt(ticket.id_ticket, 10);
  const [hover,        setHover]        = useState(0);
  const [calificacion, setCalificacion] = useState(calInicial);
  const [guardando,    setGuardando]    = useState(false);
  const [guardado,     setGuardado]     = useState(calInicial > 0);
  const [error,        setError]        = useState("");
  const MENSAJES = ["", "Muy malo", "Malo", "Regular", "Bueno", "Excelente"];

  const enProceso  = estatusActual === "En proceso";
  const yaGuardado = guardado && calificacion > 0;

  const guardar = async (n) => {
    if (enProceso || yaGuardado || guardando) return;
    setError("");
    setCalificacion(n);
    setGuardando(true);
    try {
      const res = await fetch(`${API}/api/tickets/${idTicket}/calificar`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ calificacion: Number(n) }),
      });
      const text = await res.text();
      let data = {};
      try { data = JSON.parse(text); } catch { data = {}; }
      if (res.ok && data.ok) {
        setGuardado(true);
      } else {
        setError(data.error || `Error ${res.status}`);
        setCalificacion(calInicial);
      }
    } catch {
      setError("No se pudo conectar. Verifica que el servidor esté activo.");
      setCalificacion(calInicial);
    } finally {
      setGuardando(false);
    }
  };

  if (enProceso) return (
    <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-[11px] font-semibold"
      style={{ background: isDark ? "rgba(244,121,32,0.08)" : "#fff7ed", color: "#ea580c", border: "1px solid rgba(234,88,12,0.25)" }}>
      <Clock size={12} />
      Disponible una vez resuelta la incidencia
    </div>
  );

  return (
    <div className="flex flex-col gap-2">
      {yaGuardado && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl text-[11px] font-semibold"
          style={{ background: isDark ? "rgba(22,163,74,0.08)" : "#f0fdf4", color: "#16a34a", border: "1px solid rgba(22,163,74,0.25)" }}>
          <CheckCircle2 size={12} />
          Calificación registrada — gracias por tu opinión
        </div>
      )}
      <div className={`flex items-center justify-center gap-1.5 py-2 ${yaGuardado ? "opacity-60" : ""}`}>
        {[1,2,3,4,5].map(n => {
          const activa = n <= (hover || calificacion);
          return (
            <button key={n}
              disabled={yaGuardado || guardando}
              onClick={() => guardar(n)}
              onMouseEnter={() => !yaGuardado && setHover(n)}
              onMouseLeave={() => setHover(0)}
              className="transition-all duration-150 active:scale-90"
              style={{ cursor: yaGuardado ? "default" : "pointer" }}>
              <Star size={28} fill={activa ? "#f59e0b" : "none"}
                style={{
                  color: activa ? "#f59e0b" : isDark ? "rgba(255,255,255,0.15)" : "#d1d5db",
                  filter: activa && !yaGuardado ? "drop-shadow(0 0 4px rgba(245,158,11,0.6))" : "none",
                  transform: hover === n && !yaGuardado ? "scale(1.2)" : "scale(1)",
                  transition: "all 0.15s",
                }}/>
            </button>
          );
        })}
      </div>
      <p className="text-center text-[11px] font-bold"
        style={{ color: calificacion ? "#f59e0b" : T.textFaint }}>
        {guardando ? "Guardando..." : calificacion ? MENSAJES[calificacion] : "Selecciona una calificación"}
      </p>
      {error && (
        <p className="text-center text-[10px] font-semibold" style={{ color: "#dc2626" }}>{error}</p>
      )}
    </div>
  );
}

export default function VistaTicket({ T, ticket, onVolver, esAdmin = false, usuario = {} }) {
  const isDark = T.bg === "#0b0e14";
  const prio   = PRIO[ticket.prioridad] || PRIO.Media;
  const prioBg     = isDark ? prio.bgD     : prio.bgL;
  const prioBorder = isDark ? prio.borderD : prio.borderL;

  // Leer id del admin: primero del prop, luego sessionStorage como fallback
  const getAdminId = () => {
    if (usuario?.id_empleado) return parseInt(usuario.id_empleado, 10);
    try {
      const s = JSON.parse(sessionStorage.getItem("usuario") || "{}");
      return s.id_empleado ? parseInt(s.id_empleado, 10) : null;
    } catch { return null; }
  };
  const getNombreAdmin = () => {
    if (usuario?.nombre) {
      const partes = [usuario.nombre, usuario.ap_paterno, usuario.ap_materno].filter(Boolean);
      return partes.join(' ');
    }
    try {
      const s = JSON.parse(sessionStorage.getItem("usuario") || "{}");
      const partes = [s.nombre, s.ap_paterno, s.ap_materno].filter(Boolean);
      return partes.length > 0 ? partes.join(' ') : null;
    } catch { return null; }
  };
  const [imgs,        setImgs]        = useState([]);
  const [visor,       setVisor]       = useState(null);
  const [comentario,  setComentario]  = useState(ticket.comentarios || "");
  const [estatus,     setEstatus]     = useState(ticket.estatus);
  const [guardando,   setGuardando]   = useState(false);
  const [guardado,    setGuardado]    = useState(false);
  const [errorGuard,  setErrorGuard]  = useState("");
  const [confirmCierre, setConfirmCierre] = useState(false);

  const [fechaResueltoState, setFechaResueltoState] = useState(ticket.fecha_resuelto || null);
  const [resueltoporState,   setResueltoporState]   = useState(ticket.resuelto_por   || null);

  const fmtFecha = (d) => new Date(d).toLocaleDateString("es-MX", { day: "2-digit", month: "2-digit", year: "numeric" });
  const fmtHora  = (d) => new Date(d).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" });
  const fechaAlta     = ticket.fecha_subido    ? fmtFecha(ticket.fecha_subido)   : "—";
  const horaAlta      = ticket.fecha_subido    ? fmtHora(ticket.fecha_subido)    : "—";
  const fechaResuelto = fechaResueltoState     ? fmtFecha(fechaResueltoState)    : null;
  const horaResuelto  = fechaResueltoState     ? fmtHora(fechaResueltoState)     : null;

  const generarReporte = () => {
    const origin    = window.location.origin;
    const pasoIdx   = estatus === 'Resuelto' ? 2 : estatus === 'En proceso' ? 1 : 0;
    const fResuelto = fechaResueltoState ? fmtFecha(fechaResueltoState) : null;
    const hResuelto = fechaResueltoState ? fmtHora(fechaResueltoState)  : null;
    const tecnico   = resueltoporState ? resueltoporState.trim() : 'Pendiente';
    const calNum    = ticket.calificacion ? parseInt(ticket.calificacion, 10) : 0;
    const MENSAJES_CAL = ['', 'Muy malo', 'Malo', 'Regular', 'Bueno', 'Excelente'];

    const estrellasSvg = (n) => [1,2,3,4,5].map(i =>
      `<svg width="18" height="18" viewBox="0 0 24 24" fill="${i<=n?'#f59e0b':'#e5e7eb'}" stroke="${i<=n?'#f59e0b':'#d1d5db'}" stroke-width="1.5" style="display:inline-block;vertical-align:middle"><polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/></svg>`
    ).join('');

    // Stepper vertical
    const stepperHtml = ['Recibido','En proceso','Resuelto'].map((paso, i) => {
      const done   = i <= pasoIdx;
      const active = i === pasoIdx;
      const isLast = i === 2;
      const circBg  = done ? (i===2&&pasoIdx===2 ? '#16a34a' : '#F47920') : '#f1f5f9';
      const circBdr = done ? (i===2&&pasoIdx===2 ? '#16a34a' : '#F47920') : '#d1d5db';
      const lineBg  = i < pasoIdx ? (i+1===2&&pasoIdx===2 ? '#16a34a' : '#F47920') : '#e5e7eb';
      const fechaPaso = i===0 ? (fechaAlta&&horaAlta ? `${fechaAlta} &bull; ${horaAlta}` : '') :
                        i===2 ? (fResuelto&&hResuelto ? `${fResuelto} &bull; ${hResuelto}` : '') : '';
      const badgeHtml = active && pasoIdx < 2
        ? `<span style="font-size:7.5px;font-weight:800;color:#F47920;background:#fff7ed;border:1px solid #fed7aa;padding:1px 7px;border-radius:20px">Actual</span>`
        : active && pasoIdx === 2
        ? `<span style="font-size:7.5px;font-weight:800;color:#16a34a;background:#dcfce7;border:1px solid #86efac;padding:1px 7px;border-radius:20px">&#10003; Completado</span>`
        : done && !active
        ? `<span style="font-size:7.5px;font-weight:700;color:#16a34a;background:#f0fdf4;border:1px solid #bbf7d0;padding:1px 6px;border-radius:20px">&#10003;</span>`
        : `<span style="font-size:7.5px;color:#9ca3af;background:#f9fafb;border:1px solid #e5e7eb;padding:1px 6px;border-radius:20px">Pendiente</span>`;
      return `
        <div style="display:flex;gap:10px;align-items:flex-start">
          <div style="display:flex;flex-direction:column;align-items:center;flex-shrink:0;width:24px">
            <div style="width:24px;height:24px;border-radius:50%;background:${circBg};border:2px solid ${circBdr};display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:900;color:${done?'#fff':'#9ca3af'};-webkit-print-color-adjust:exact;print-color-adjust:exact">&#10003;</div>
            ${!isLast ? `<div style="width:2px;height:26px;background:${lineBg};margin:2px 0;border-radius:2px;-webkit-print-color-adjust:exact;print-color-adjust:exact"></div>` : ''}
          </div>
          <div style="flex:1;padding-top:3px;padding-bottom:${!isLast?'0':'0'}">
            <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin-bottom:2px">
              <span style="font-size:10.5px;font-weight:${active?'900':done?'700':'500'};color:${done?'#1D1D1B':'#9ca3af'}">${paso}</span>
              ${badgeHtml}
            </div>
            ${fechaPaso ? `<span style="font-size:8px;color:#6b7280">${fechaPaso}</span>` : ''}
          </div>
        </div>`;
    }).join('');

    // Grid de evidencias: siempre 4 columnas, altura fija pequeña para caber en hoja
    const cols = imgs.length === 0 ? 0 : 4;
    const imgGridHtml = imgs.length === 0
      ? `<p style="font-size:9px;color:#9ca3af;font-style:italic">No se adjuntaron evidencias fotogr&aacute;ficas.</p>`
      : `<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:4px">
          ${imgs.map((img,i) => `
            <div style="position:relative;border-radius:4px;overflow:hidden;border:1px solid #e5e7eb;width:100%;height:60px">
              <img src="${API}/storage/Evidencias_Tickets/${ticket.folio_ticket}/${img}" style="width:100%;height:100%;object-fit:cover;display:block"/>
              <span style="position:absolute;bottom:2px;right:2px;background:rgba(0,0,0,0.6);color:#fff;font-size:6px;font-weight:900;padding:1px 3px;border-radius:2px">${String(i+1).padStart(2,'0')}</span>
            </div>`).join('')}
         </div>`;

    const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8"/>
<title>Reporte ${ticket.folio_ticket}</title>
<style>
  @page { size: letter portrait; margin: 10mm 12mm; }
  *  { margin:0; padding:0; box-sizing:border-box; }
  body { font-family:'Segoe UI',Arial,sans-serif; background:#fff; color:#1D1D1B; -webkit-print-color-adjust:exact; print-color-adjust:exact; }

  /* ── HEADER ── */
  .hdr { display:flex; align-items:center; justify-content:space-between; padding:10px 0 10px 0; border-bottom:3px solid #F47920; margin-bottom:10px; }
  .hdr-logo { height:52px; object-fit:contain; }
  .hdr-center { flex:1; text-align:center; }
  .hdr-center-title { font-size:8px; font-weight:700; text-transform:uppercase; letter-spacing:.18em; color:#9ca3af; }
  .hdr-center-name  { font-size:14px; font-weight:900; color:#1D1D1B; margin-top:2px; letter-spacing:-.01em; }
  .hdr-right { text-align:right; }
  .hdr-folio { font-family:monospace; font-size:18px; font-weight:900; color:#F47920; }
  .hdr-date  { font-size:7.5px; color:#9ca3af; margin-top:3px; }

  /* ── BANDA ── */
  .banda { height:3px; background:linear-gradient(90deg,#F47920,#ffb347,#F47920); margin-bottom:10px; }

  /* ── BLOQUE TITULO ── */
  .titulo-block { border:1.5px solid #e5e7eb; border-radius:8px; overflow:hidden; margin-bottom:8px; }
  .titulo-top   { background:#f8fafc; padding:10px 14px; display:flex; align-items:flex-start; justify-content:space-between; gap:12px; border-bottom:1.5px solid #e5e7eb; }
  .titulo-text  { font-size:15px; font-weight:900; color:#1D1D1B; flex:1; line-height:1.3; }
  .titulo-folio { font-family:monospace; font-size:13px; font-weight:900; color:#F47920; background:#fff7ed; padding:4px 10px; border-radius:6px; border:1.5px solid #fed7aa; white-space:nowrap; flex-shrink:0; }
  .titulo-sub   { display:flex; background:#fff; }
  .titulo-sub-item { flex:1; padding:8px 14px; display:flex; flex-direction:column; gap:2px; }
  .titulo-sub-item + .titulo-sub-item { border-left:1.5px solid #e5e7eb; }
  .sub-lbl { font-size:7px; font-weight:900; text-transform:uppercase; letter-spacing:.1em; color:#9ca3af; }
  .sub-val { font-size:13px; font-weight:800; color:#1D1D1B; }

  /* ── GRID ── */
  .g2 { display:grid; grid-template-columns:1fr 1fr; gap:7px; margin-bottom:7px; }
  .g3 { display:grid; grid-template-columns:1fr 1fr 1fr; gap:7px; margin-bottom:7px; }

  /* ── SECCIONES ── */
  .sec { border:1.5px solid #e5e7eb; border-radius:7px; overflow:hidden; }
  .sec-h { background:#f8fafc; padding:5px 10px; border-bottom:1.5px solid #e5e7eb; display:flex; align-items:center; gap:5px; }
  .sec-dot { width:3px; height:12px; border-radius:2px; background:#F47920; flex-shrink:0; }
  .sec-title { font-size:7px; font-weight:900; text-transform:uppercase; letter-spacing:.14em; color:#6b7280; }
  .sec-b { padding:8px 10px; }

  /* ── DATOS ── */
  .dato-grid { display:grid; grid-template-columns:1fr 1fr; gap:5px; }
  .dato { background:#f9fafb; border:1px solid #e5e7eb; border-radius:5px; padding:5px 8px; }
  .dato.full { grid-column:1/-1; }
  .dato-lbl { font-size:6.5px; font-weight:900; text-transform:uppercase; letter-spacing:.1em; color:#9ca3af; margin-bottom:3px; }
  .dato-val { font-size:10px; font-weight:700; color:#1D1D1B; line-height:1.3; }

  /* ── BADGES ── */
  .badge { display:inline-block; padding:3px 10px; border-radius:20px; font-size:9.5px; font-weight:800; border:1.5px solid; }
  .b-urgente  { background:#fee2e2; color:#dc2626; border-color:#fca5a5; }
  .b-alta     { background:#ffedd5; color:#ea580c; border-color:#fdba74; }
  .b-media    { background:#fef9c3; color:#ca8a04; border-color:#fde047; }
  .b-baja     { background:#dcfce7; color:#16a34a; border-color:#86efac; }
  .b-resuelto { background:#dcfce7; color:#16a34a; border-color:#86efac; }
  .b-proceso  { background:#ffedd5; color:#ea580c; border-color:#fdba74; }
  .b-nores    { background:#fee2e2; color:#dc2626; border-color:#fca5a5; }

  /* ── TEXTO LIBRE ── */
  .tx     { border-left:3px solid #e5e7eb; padding:7px 10px; font-size:10.5px; line-height:1.7; color:#374151; background:#f9fafb; border-radius:0 5px 5px 0; min-height:30px; }
  .tx-tec { border-left-color:#F47920; background:#fff7ed; }

  /* ── TECNICO ── */
  .tec-box { background:#f8fafc; border:1.5px solid #e5e7eb; border-radius:7px; padding:10px 14px; }
  .tec-lbl  { font-size:7px; font-weight:900; text-transform:uppercase; letter-spacing:.12em; color:#9ca3af; margin-bottom:5px; }
  .tec-name { font-size:14px; font-weight:900; color:#1D1D1B; line-height:1.2; }
  .tec-role { font-size:8px; font-weight:700; text-transform:uppercase; letter-spacing:.1em; color:#F47920; margin-top:3px; }

  /* ── VALORACION ── */
  .val-box  { background:#fffbeb; border:1.5px solid #fde68a; border-radius:7px; padding:10px 12px; }
  .val-lbl  { font-size:7px; font-weight:900; text-transform:uppercase; letter-spacing:.12em; color:#92400e; margin-bottom:6px; }
  .val-stars{ display:flex; align-items:center; gap:2px; margin-bottom:4px; }
  .val-txt  { font-size:11px; font-weight:800; color:#b45309; }
  .val-sub  { font-size:8px; color:#9ca3af; margin-top:1px; }
  .val-none { font-size:9px; color:#9ca3af; font-style:italic; }

  /* ── EVIDENCIAS ── */
  .ev-sec { border:1.5px solid #e5e7eb; border-radius:7px; overflow:hidden; margin-bottom:7px; }

  /* ── FOOTER NEGRO ── */
  .ftr {
    background:#1D1D1B;
    border-radius:8px;
    margin-top:10px;
    padding:12px 18px;
    display:flex;
    align-items:center;
    justify-content:space-between;
    gap:16px;
    -webkit-print-color-adjust:exact;
    print-color-adjust:exact;
  }
  .ftr-left  { display:flex; flex-direction:column; gap:3px; }
  .ftr-brand { font-size:11px; font-weight:900; color:#F47920; letter-spacing:.02em; }
  .ftr-sub   { font-size:7.5px; color:rgba(255,255,255,0.45); letter-spacing:.06em; }
  .ftr-divider { width:1px; height:32px; background:rgba(255,255,255,0.12); flex-shrink:0; }
  .ftr-center { flex:1; display:flex; flex-direction:column; align-items:center; gap:2px; }
  .ftr-folio  { font-family:monospace; font-size:13px; font-weight:900; color:#fff; letter-spacing:.06em; }
  .ftr-conf   { font-size:7px; font-weight:600; color:rgba(255,255,255,0.35); text-transform:uppercase; letter-spacing:.12em; }
  .ftr-right  { text-align:right; }
  .ftr-date   { font-size:7.5px; color:rgba(255,255,255,0.45); }
  .ftr-logo   { height:26px; object-fit:contain; margin-top:4px; filter:brightness(0) invert(1); opacity:.6; }
</style>
</head>
<body>

<!-- HEADER -->
<div class="hdr">
  <img src="${origin}/assets/img/logo negro.png" class="hdr-logo" alt="PTP"/>
  <div class="hdr-center">
    <div class="hdr-center-title">Precision Truck Parts &amp; Accessories</div>
    <div class="hdr-center-name">Reporte de Incidencia T&eacute;cnica</div>
  </div>
  <div class="hdr-right">
    <div class="hdr-folio">${ticket.folio_ticket}</div>
    <div class="hdr-date">Generado: ${new Date().toLocaleDateString('es-MX',{day:'2-digit',month:'long',year:'numeric'})} &bull; ${new Date().toLocaleTimeString('es-MX',{hour:'2-digit',minute:'2-digit'})}</div>
  </div>
</div>

<!-- TITULO -->
<div class="titulo-block">
  <div class="titulo-top">
    <div class="titulo-text">${ticket.titulo || '&mdash;'}</div>
    <div class="titulo-folio">${ticket.folio_ticket}</div>
  </div>
  <div class="titulo-sub">
    <div class="titulo-sub-item">
      <span class="sub-lbl">Solicitante</span>
      <span class="sub-val">${ticket.nombre_empleado || '&mdash;'}</span>
    </div>
    <div class="titulo-sub-item">
      <span class="sub-lbl">Departamento</span>
      <span class="sub-val">${ticket.nombre_departamento || '&mdash;'}</span>
    </div>
    <div class="titulo-sub-item">
      <span class="sub-lbl">Categor&iacute;a</span>
      <span class="sub-val">${ticket.nombre_categoria || '&mdash;'}</span>
    </div>
  </div>
</div>

<!-- CLASIFICACION + FECHAS -->
<div class="g2">
  <div class="sec">
    <div class="sec-h"><div class="sec-dot"></div><span class="sec-title">Clasificaci&oacute;n</span></div>
    <div class="sec-b">
      <div class="dato-grid">
        <div class="dato">
          <div class="dato-lbl">Prioridad</div>
          <span class="badge b-${(ticket.prioridad||'media').toLowerCase()}">${ticket.prioridad||'&mdash;'}</span>
        </div>
        <div class="dato full">
          <div class="dato-lbl">Estatus</div>
          <span class="badge ${estatus==='Resuelto'?'b-resuelto':estatus==='En proceso'?'b-proceso':'b-nores'}">${estatus}</span>
        </div>
      </div>
    </div>
  </div>
  <div class="sec">
    <div class="sec-h"><div class="sec-dot"></div><span class="sec-title">Fechas</span></div>
    <div class="sec-b">
      <div class="dato-grid">
        <div class="dato"><div class="dato-lbl">Fecha alta</div><div class="dato-val">${fechaAlta}</div></div>
        <div class="dato"><div class="dato-lbl">Hora alta</div><div class="dato-val">${horaAlta}</div></div>
        <div class="dato"><div class="dato-lbl">Fecha resoluci&oacute;n</div><div class="dato-val">${fResuelto||'Pendiente'}</div></div>
        <div class="dato"><div class="dato-lbl">Hora resoluci&oacute;n</div><div class="dato-val">${hResuelto||'Pendiente'}</div></div>
      </div>
    </div>
  </div>
</div>

<!-- DESCRIPCION -->
<div class="sec" style="margin-bottom:7px">
  <div class="sec-h"><div class="sec-dot"></div><span class="sec-title">Descripci&oacute;n del problema</span></div>
  <div class="sec-b"><div class="tx">${ticket.descripcion||'<em style="color:#9ca3af">Sin descripci&oacute;n registrada.</em>'}</div></div>
</div>

<!-- COMENTARIOS TECNICO -->
<div class="sec" style="margin-bottom:7px">
  <div class="sec-h"><div class="sec-dot" style="background:#F47920"></div><span class="sec-title">Comentarios del t&eacute;cnico</span></div>
  <div class="sec-b"><div class="tx tx-tec">${comentario||'<em style="color:#9ca3af">Sin comentarios del t&eacute;cnico.</em>'}</div></div>
</div>

<!-- PROGRESO + CIERRE -->
<div class="g2">
  <div class="sec">
    <div class="sec-h"><div class="sec-dot"></div><span class="sec-title">Progreso del ticket</span></div>
    <div class="sec-b" style="padding:10px 12px">${stepperHtml}</div>
  </div>
  <div class="sec">
    <div class="sec-h"><div class="sec-dot"></div><span class="sec-title">Cierre y valoraci&oacute;n</span></div>
    <div class="sec-b" style="display:flex;flex-direction:column;gap:8px">

      <!-- Tecnico -->
      <div class="tec-box">
        <div class="tec-lbl">T&eacute;cnico responsable</div>
        <div class="tec-name">${tecnico}</div>
        <div class="tec-role">Soporte T&eacute;cnico</div>
      </div>

      <!-- Valoracion -->
      <div class="val-box">
        <div class="val-lbl">Valoraci&oacute;n del usuario</div>
        ${calNum > 0 ? `
          <div class="val-stars">${estrellasSvg(calNum)}</div>
          <div class="val-txt">${MENSAJES_CAL[calNum]}</div>
          <div class="val-sub">${calNum} de 5 estrellas</div>
        ` : `<div class="val-none">Sin valoraci&oacute;n registrada</div>`}
      </div>

    </div>
  </div>
</div>

<!-- EVIDENCIAS -->
<div class="ev-sec">
  <div class="sec-h"><div class="sec-dot"></div><span class="sec-title">Evidencias fotogr&aacute;ficas${imgs.length>0?' ('+imgs.length+')':''}</span></div>
  <div class="sec-b">${imgGridHtml}</div>
</div>

<!-- FOOTER NEGRO -->
<div class="ftr">
  <div class="ftr-left">
    <span class="ftr-brand">Precision Truck Parts &amp; Accessories</span>
    <span class="ftr-sub">Sistema HelpDesk &bull; Documento de uso interno</span>
  </div>
  <div class="ftr-divider"></div>
  <div class="ftr-center">
    <span class="ftr-folio">${ticket.folio_ticket}</span>
  </div>
  <div class="ftr-divider"></div>
  <div class="ftr-right">
    <div class="ftr-date">${new Date().toLocaleDateString('es-MX',{day:'2-digit',month:'long',year:'numeric'})}</div>
    <div class="ftr-date">${new Date().toLocaleTimeString('es-MX',{hour:'2-digit',minute:'2-digit'})}</div>
    <img src="${origin}/assets/img/logo blanco.png" class="ftr-logo" alt="PTP"/>
  </div>
</div>

<script>window.onload=function(){window.print();}<\/script>
</body></html>`;

    const win = window.open('', '_blank', 'width=900,height=700');
    if (!win) { alert('Permite ventanas emergentes para generar el reporte.'); return; }
    win.document.open();
    win.document.write(html);
    win.document.close();
  };



  const pasoActual = estatus === "Resuelto" ? 2
    : estatus === "En proceso" ? 1 : 0;

  const guardarCambios = async (nuevoEstatus) => {
    setGuardando(true);
    setErrorGuard("");
    const estatusFinal = nuevoEstatus ?? estatus;
    const adminId = getAdminId();
    const adminNombre = getNombreAdmin();
    console.warn("[guardarCambios] estatus:", estatusFinal);
    try {
      const url = `${API}/api/tickets/${ticket.id_ticket}`;
      const res = await fetch(url, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          comentarios: comentario,
          estatus: estatusFinal,
          id_resuelto_por: estatusFinal === "Resuelto" ? adminId : null,
        }),
      });
      const text = await res.text();
      let data;
      try { data = JSON.parse(text); }
      catch { throw new Error(`Respuesta inesperada del servidor: ${text.slice(0, 80)}`); }
      if (!res.ok) throw new Error(data.error || "Error del servidor");
      if (data.estatus) setEstatus(data.estatus);
      if (data.fecha_resuelto) setFechaResueltoState(data.fecha_resuelto);
      if (data.resuelto_por)   setResueltoporState(data.resuelto_por);
      else if (estatusFinal === "Resuelto") setResueltoporState(adminNombre || "Administrador");
      setGuardado(true);
      setTimeout(() => setGuardado(false), 2500);
    } catch (err) {
      setErrorGuard(err.message || "No se pudo guardar. Intenta de nuevo.");
    } finally {
      setGuardando(false);
      setConfirmCierre(false);
    }
  };

  useEffect(() => {
    if (!ticket.id_ticket) return;
    fetch(`${API}/api/tickets/${ticket.id_ticket}/imagenes`)
      .then(r => r.json())
      .then(d => setImgs(Array.isArray(d) ? d : []))
      .catch(() => setImgs([]));
  }, [ticket.id_ticket]);

  const card = {
    background: isDark ? "#141720" : T.surface,
    border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : T.border}`,
    boxShadow: isDark ? "0 4px 20px rgba(0,0,0,0.4)" : "0 1px 6px rgba(0,0,0,0.06)",
  };
  const hdr = {
    background: isDark ? "rgba(255,255,255,0.03)" : T.surfaceAlt,
    borderBottom: `1px solid ${isDark ? "rgba(255,255,255,0.07)" : T.border}`,
  };
  const labelStyle = { color: isDark ? "rgba(255,255,255,0.45)" : T.textMuted };
  const valStyle   = { color: T.text };

  return (
    <div className="absolute inset-0 overflow-y-auto" style={{ background: T.bg }}>
      <div className="max-w-5xl mx-auto p-3 sm:p-4 md:p-6 pb-6 space-y-3 sm:space-y-4">

        {/* ── HEADER CARD ── */}
        <div className="rounded-2xl overflow-hidden" style={card}>
          <div className="h-1" style={{ background: `linear-gradient(90deg, ${prio.color}, ${prio.color}55)` }} />

          <div className="px-4 py-2 sm:px-5 md:px-6">
            {/* Top row: Volver + Folio + Título */}
            <div className="flex flex-col gap-2 mb-2 sm:flex-row sm:items-center sm:gap-3">
              <div className="flex items-center gap-2">
                <button onClick={onVolver}
                  className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl transition-all hover:brightness-110 active:scale-95 flex-shrink-0"
                  style={{ background: isDark ? "rgba(255,255,255,0.06)" : T.surfaceAlt, color: T.textMuted, border: `1px solid ${T.border}` }}>
                  <ArrowLeft size={13} /> Volver
                </button>
                {/* Folio visible solo en móvil junto al botón */}
                <span className="sm:hidden font-mono text-xs font-black px-2.5 py-1 rounded-xl"
                  style={{ background: isDark ? "rgba(255,255,255,0.06)" : T.surfaceAlt, color: T.text, border: `1px solid ${T.border}` }}>
                  #{ticket.folio_ticket}
                </span>
              </div>

              <h1 className="text-sm sm:text-lg md:text-xl font-black leading-snug flex-1" style={{ color: T.text }}>
                {ticket.titulo}
              </h1>

              {/* Folio + logo — solo desktop */}
              <div className="hidden sm:flex flex-col items-end gap-1 flex-shrink-0">
                <span className="font-mono text-xs font-black px-2.5 py-1 rounded-xl"
                  style={{ background: isDark ? "rgba(255,255,255,0.06)" : T.surfaceAlt, color: T.text, border: `1px solid ${T.border}` }}>
                  #{ticket.folio_ticket}
                </span>
                <img
                  src={isDark ? "/assets/img/logo%20blanco.png" : "/assets/img/logo%20negro.png"}
                  alt="logo"
                  style={{ height: "28px", width: "auto", objectFit: "contain" }}
                />
              </div>
            </div>

            {/* Badges */}
            <div className="flex flex-wrap gap-2">
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold"
                style={{ background: prioBg, color: prio.color, border: `1px solid ${prioBorder}` }}>
                <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: prio.color }} />
                Prioridad: {ticket.prioridad}
              </span>
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold"
                style={{
                  background: isDark
                    ? (estatus === "Resuelto" ? "rgba(22,163,74,0.15)" : estatus === "No Resuelto" ? "rgba(220,38,38,0.15)" : "rgba(234,88,12,0.15)")
                    : (estatus === "Resuelto" ? "#dcfce7" : estatus === "No Resuelto" ? "#fee2e2" : "#ffedd5"),
                  color: estatus === "Resuelto" ? "#16a34a" : estatus === "No Resuelto" ? "#dc2626" : "#ea580c",
                  border: `1px solid ${estatus === "Resuelto" ? (isDark?"rgba(22,163,74,0.3)":"#86efac") : estatus === "No Resuelto" ? (isDark?"rgba(220,38,38,0.3)":"#fca5a5") : (isDark?"rgba(234,88,12,0.3)":"#fdba74")}`,
                }}>
                {estatus === "Resuelto"    ? <CheckCircle2 size={11}/> :
                 estatus === "No Resuelto" ? <XCircle size={11}/>      : <Clock size={11}/>}
                Estado: {estatus}
              </span>
              {ticket.nombre_categoria && (
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold"
                  style={{ background: isDark ? "rgba(255,255,255,0.06)" : T.surfaceAlt, color: T.textMuted, border: `1px solid ${T.border}` }}>
                  <Tag size={10}/> Categoría: {ticket.nombre_categoria}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ── CUERPO ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4">

          {/* ── COLUMNA IZQUIERDA ── */}
          <div className="lg:col-span-2 space-y-3 sm:space-y-4">

            {/* Descripción */}
            <div className="rounded-2xl overflow-hidden" style={card}>
              <div className="px-4 py-2.5 flex items-center gap-2" style={hdr}>
                <div className="w-1 h-3.5 rounded-full flex-shrink-0" style={{ background: T.orange }} />
                <p className="text-[10px] font-black uppercase tracking-widest" style={labelStyle}>
                  Descripción del problema
                </p>
              </div>
              <div className="p-4 sm:p-5">
                {ticket.descripcion ? (
                  <div className="text-sm leading-relaxed break-words" style={{ color: T.text }}
                    dangerouslySetInnerHTML={{ __html: ticket.descripcion }} />
                ) : (
                  <p className="text-sm italic" style={{ color: T.textFaint }}>Sin descripción registrada.</p>
                )}
              </div>
            </div>

            {/* Información del reporte */}
            <div className="rounded-2xl overflow-hidden" style={card}>
              <div className="px-4 py-2.5 flex items-center gap-2" style={hdr}>
                <div className="w-1 h-3.5 rounded-full flex-shrink-0" style={{ background: T.orange }} />
                <p className="text-[10px] font-black uppercase tracking-widest" style={labelStyle}>
                  Información del reporte
                </p>
              </div>
              <div className="p-3 sm:p-4 grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                {[
                  { icon: User,         label: "Solicitante",                    val: ticket.nombre_empleado     || "—" },
                  { icon: Tag,          label: "Departamento",                   val: ticket.nombre_departamento || "—" },
                  { icon: Calendar,     label: "Fecha de alta",                  val: fechaAlta },
                  { icon: CheckCircle2, label: "Fecha Resolución de Incidencia", val: fechaResuelto || "Pendiente" },
                  { icon: User,         label: "Resuelto por",                   val: resueltoporState || "Pendiente" },
                ].map(({ icon: Icon, label, val }) => (
                  <div key={label} className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
                    style={{ background: isDark ? "rgba(255,255,255,0.03)" : T.bg, border: `1px solid ${T.border}` }}>
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: "rgba(244,121,32,0.1)" }}>
                      <Icon size={13} style={{ color: T.orange }} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[9px] font-black uppercase tracking-widest" style={labelStyle}>{label}</p>
                      <p className="text-xs font-semibold truncate mt-0.5" style={valStyle}>{val}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Evidencias */}
            <div className="rounded-2xl overflow-hidden" style={card}>
              <div className="px-4 py-2.5 flex items-center justify-between" style={hdr}>
                <div className="flex items-center gap-2">
                  <div className="w-1 h-3.5 rounded-full flex-shrink-0" style={{ background: T.orange }} />
                  <p className="text-[10px] font-black uppercase tracking-widest" style={labelStyle}>
                    Evidencias fotográficas
                  </p>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0"
                  style={{ background: T.bg, color: T.textMuted, border: `1px solid ${T.border}` }}>
                  {imgs.length} foto{imgs.length !== 1 ? "s" : ""}
                </span>
              </div>
              <div className="p-3 sm:p-4">
                {imgs.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 gap-2">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ background: isDark ? "rgba(255,255,255,0.04)" : T.surfaceAlt, border: `1px solid ${T.border}` }}>
                      <ImageOff size={18} style={{ color: T.textFaint }} />
                    </div>
                    <p className="text-xs font-semibold" style={{ color: T.textMuted }}>Sin evidencias adjuntas</p>
                    <p className="text-[11px]" style={{ color: T.textFaint }}>No se subieron imágenes con este reporte</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3">
                    {imgs.map((img, i) => (
                      <button key={i} onClick={() => setVisor(i)}
                        className="aspect-square rounded-xl overflow-hidden relative group transition-all duration-200 hover:scale-[1.03] active:scale-95"
                        style={{ border: `1.5px solid ${T.border}`, boxShadow: isDark ? "0 4px 12px rgba(0,0,0,0.4)" : "0 2px 8px rgba(0,0,0,0.08)" }}>
                        <img
                          src={`${API}/storage/Evidencias_Tickets/${ticket.folio_ticket}/${img}`}
                          alt={`Evidencia ${i + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          style={{ background: "rgba(0,0,0,0.55)" }}>
                          <ZoomIn size={22} color="#fff" />
                        </div>
                        <span className="absolute bottom-1.5 right-1.5 text-[9px] font-black px-1.5 py-0.5 rounded-md"
                          style={{ background: "rgba(0,0,0,0.65)", color: "#fff" }}>
                          {String(i + 1).padStart(2, "0")}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Comentarios */}
            <div className="rounded-2xl overflow-hidden" style={card}>
              <div className="px-4 py-2.5 flex items-center gap-2" style={hdr}>
                <div className="w-1 h-3.5 rounded-full flex-shrink-0" style={{ background: T.orange }} />
                <p className="text-[10px] font-black uppercase tracking-widest" style={labelStyle}>
                  Comentarios del técnico
                </p>
              </div>
              <div className="p-3 sm:p-4">
                {esAdmin ? (
                  <div className="flex flex-col gap-1.5">
                    <div className="relative">
                      <div className="absolute left-0 top-3 bottom-3 w-0.5 rounded-full"
                        style={{ background: estatus === "Resuelto" ? T.border : "#F47920", marginLeft: "12px" }} />
                      <textarea
                        rows={5}
                        disabled={estatus === "Resuelto"}
                        className="w-full rounded-xl text-sm outline-none resize-none transition-all"
                        style={{
                          background: estatus === "Resuelto"
                            ? isDark ? "rgba(255,255,255,0.02)" : "#f4f4f4"
                            : isDark ? "rgba(255,255,255,0.04)" : "#fafafa",
                          border: `1.5px solid ${estatus === "Resuelto" ? T.border : isDark ? "rgba(255,255,255,0.1)" : "#e2e8f0"}`,
                          color: estatus === "Resuelto" ? T.textMuted : T.text,
                          fontSize: "13px",
                          lineHeight: "1.65",
                          padding: "12px 14px 12px 28px",
                          letterSpacing: "0.01em",
                          cursor: estatus === "Resuelto" ? "not-allowed" : "text",
                          opacity: estatus === "Resuelto" ? 0.6 : 1,
                        }}
                        placeholder="Describe la solución aplicada, pasos realizados o notas relevantes para el cierre del ticket..."
                        value={comentario}
                        onChange={e => estatus !== "Resuelto" && setComentario(e.target.value)}
                        onFocus={e => {
                          if (estatus === "Resuelto") return;
                          e.target.style.borderColor = "#F47920";
                          e.target.style.boxShadow  = "0 0 0 3px rgba(244,121,32,0.10)";
                          e.target.style.background = isDark ? "rgba(244,121,32,0.04)" : "#fff";
                        }}
                        onBlur={e => {
                          e.target.style.borderColor = isDark ? "rgba(255,255,255,0.1)" : "#e2e8f0";
                          e.target.style.boxShadow  = "none";
                          e.target.style.background = estatus === "Resuelto"
                            ? isDark ? "rgba(255,255,255,0.02)" : "#f4f4f4"
                            : isDark ? "rgba(255,255,255,0.04)" : "#fafafa";
                        }}
                      />
                    </div>
                    <div className="flex items-center justify-between px-1">
                      <span className="text-[10px]" style={{ color: T.textFaint }}>
                        {estatus === "Resuelto" ? "Ticket cerrado — comentarios bloqueados" : "Visible para el solicitante una vez guardado"}
                      </span>
                      {estatus !== "Resuelto" && (
                        <span className="text-[10px] font-semibold" style={{ color: comentario.length > 900 ? "#dc2626" : T.textFaint }}>
                          {comentario.length} / 1000
                        </span>
                      )}
                    </div>
                  </div>
                ) : comentario ? (
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                      style={{ background: "rgba(244,121,32,0.1)", border: "1px solid rgba(244,121,32,0.2)" }}>
                      <MessageSquare size={13} style={{ color: T.orange }} />
                    </div>
                    <div className="flex-1 px-3 py-2.5 rounded-xl text-sm leading-relaxed break-words"
                      style={{ background: isDark ? "rgba(255,255,255,0.04)" : T.bg, color: T.text, border: `1px solid ${T.border}` }}>
                      {comentario}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 py-5 justify-center flex-col">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ background: isDark ? "rgba(255,255,255,0.04)" : T.surfaceAlt, border: `1px solid ${T.border}` }}>
                      <MessageSquare size={18} style={{ color: T.textFaint }} />
                    </div>
                    <p className="text-xs font-semibold" style={{ color: T.textMuted }}>Sin comentarios aún</p>
                    <p className="text-[11px]" style={{ color: T.textFaint }}>El técnico asignado agregará notas aquí</p>
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* ── COLUMNA DERECHA ── */}
          <div className="space-y-3 sm:space-y-4">
            <div className="rounded-2xl overflow-hidden" style={card}>
              <div className="px-3 py-2 flex items-center gap-2" style={hdr}>
                <div className="w-1 h-3 rounded-full flex-shrink-0" style={{ background: T.orange }} />
                <p className="text-[9px] font-black uppercase tracking-widest" style={labelStyle}>
                  Estado del ticket
                </p>
              </div>
              <div className="p-4">

                {/* ── Pasos ── */}
                <div className="flex flex-col gap-0">
                  {[
                    {
                      label: "Recibido",
                      sub: "Ticket registrado en el sistema",
                      fecha: fechaAlta,
                      hora: horaAlta,
                      icon: (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/>
                          <path d="M5.45 5.11L2 12v6a2 2 0 002 2h16a2 2 0 002-2v-6l-3.45-6.89A2 2 0 0016.76 4H7.24a2 2 0 00-1.79 1.11z"/>
                        </svg>
                      ),
                    },
                    {
                      label: "En proceso",
                      sub: "Técnico asignado trabajando",
                      fecha: null,
                      hora: null,
                      icon: (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10"/>
                          <polyline points="12 6 12 12 16 14"/>
                        </svg>
                      ),
                    },
                    {
                      label: "Resuelto",
                      sub: "Incidencia cerrada exitosamente",
                      fecha: fechaResuelto,
                      hora: horaResuelto,
                      icon: (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/>
                          <polyline points="22 4 12 14.01 9 11.01"/>
                        </svg>
                      ),
                    },
                  ].map((paso, i) => {
                    const completado = i <= pasoActual;
                    const actual     = i === pasoActual;
                    const pendiente  = i > pasoActual;
                    const esUltimo   = i === 2;

                    const circleColor = completado
                      ? (esUltimo && pasoActual === 2 ? "#16a34a" : T.orange)
                      : "transparent";
                    const circleBorder = completado
                      ? (esUltimo && pasoActual === 2 ? "#16a34a" : T.orange)
                      : isDark ? "rgba(255,255,255,0.15)" : "#d1d5db";

                    return (
                      <div key={paso.label} className="flex gap-3">

                        {/* Nodo + conector */}
                        <div className="flex flex-col items-center flex-shrink-0" style={{ width: "28px" }}>
                          {/* Círculo */}
                          <div className="relative flex items-center justify-center rounded-full transition-all duration-500"
                            style={{
                              width: "28px", height: "28px",
                              background: completado
                                ? (esUltimo && pasoActual === 2
                                    ? "linear-gradient(135deg,#16a34a,#4ade80)"
                                    : `linear-gradient(135deg,${T.orange},#d97400)`)
                                : isDark ? "rgba(255,255,255,0.04)" : "#f1f5f9",
                              border: `2px solid ${circleBorder}`,
                              boxShadow: actual
                                ? (pasoActual === 2
                                    ? "0 0 0 5px rgba(22,163,74,0.15), 0 4px 14px rgba(22,163,74,0.4)"
                                    : `0 0 0 5px rgba(244,121,32,0.15), 0 4px 14px rgba(244,121,32,0.4)`)
                                : completado ? "0 2px 8px rgba(0,0,0,0.15)" : "none",
                              color: completado ? "#fff" : isDark ? "rgba(255,255,255,0.25)" : "#cbd5e1",
                            }}>
                            {paso.icon}
                            {/* Pulso animado en paso actual */}
                            {actual && (
                              <span className="absolute inset-0 rounded-full animate-ping"
                                style={{
                                  background: pasoActual === 2
                                    ? "rgba(22,163,74,0.25)"
                                    : "rgba(244,121,32,0.25)",
                                  animationDuration: "1.8s",
                                }}
                              />
                            )}
                          </div>

                          {/* Línea conectora */}
                          {!esUltimo && (
                            <div className="relative flex-1 overflow-hidden"
                              style={{ width: "2px", minHeight: "32px", borderRadius: "999px",
                                background: isDark ? "rgba(255,255,255,0.07)" : "#e2e8f0",
                                margin: "3px 0",
                              }}>
                              <div className="absolute top-0 left-0 w-full transition-all duration-700"
                                style={{
                                  height: i < pasoActual ? "100%" : "0%",
                                  background: i + 1 === 2 && pasoActual === 2
                                    ? "linear-gradient(180deg,#16a34a,#4ade80)"
                                    : `linear-gradient(180deg,${T.orange},#ffb347)`,
                                  borderRadius: "999px",
                                }}
                              />
                            </div>
                          )}
                        </div>

                        {/* Contenido del paso */}
                        <div className="flex-1 pb-4" style={{ paddingTop: "3px" }}>
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-xs font-black"
                              style={{ color: completado ? T.text : T.textFaint }}>
                              {paso.label}
                            </p>

                            {/* Badge estado */}
                            {actual && pasoActual < 2 && (
                              <span className="inline-flex items-center gap-1 text-[8px] font-black px-1.5 py-0.5 rounded-full"
                                style={{ background: "rgba(244,121,32,0.12)", color: T.orange, border: `1px solid rgba(244,121,32,0.3)` }}>
                                <span className="w-1 h-1 rounded-full" style={{ background: T.orange, animation: "pulse 1s infinite" }} />
                                Actual
                              </span>
                            )}
                            {actual && pasoActual === 2 && (
                              <span className="inline-flex items-center gap-1 text-[8px] font-black px-1.5 py-0.5 rounded-full"
                                style={{ background: "rgba(22,163,74,0.12)", color: "#16a34a", border: "1px solid rgba(22,163,74,0.3)" }}>
                                ✓ Completado
                              </span>
                            )}
                            {completado && !actual && (
                              <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-full"
                                style={{ background: isDark ? "rgba(22,163,74,0.1)" : "#f0fdf4", color: "#16a34a", border: "1px solid rgba(22,163,74,0.2)" }}>
                                ✓
                              </span>
                            )}
                            {pendiente && (
                              <span className="text-[8px] font-semibold px-1.5 py-0.5 rounded-full"
                                style={{ background: isDark ? "rgba(255,255,255,0.04)" : "#f8fafc", color: T.textFaint, border: `1px solid ${T.border}` }}>
                                Pendiente
                              </span>
                            )}
                          </div>

                          <p className="text-[10px] mt-0.5" style={{ color: T.textFaint }}>{paso.sub}</p>

                          {/* Fecha/hora si existe */}
                          {paso.fecha && (
                            <div className="mt-1.5 flex flex-wrap gap-1.5">
                              <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg"
                                style={{ background: isDark ? "rgba(255,255,255,0.04)" : "#f8fafc", border: `1px solid ${T.border}` }}>
                                <Calendar size={9} style={{ color: T.orange, flexShrink: 0 }} />
                                <span className="text-[9px] font-bold" style={{ color: T.text }}>{paso.fecha}</span>
                              </div>
                              <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg"
                                style={{ background: isDark ? "rgba(255,255,255,0.04)" : "#f8fafc", border: `1px solid ${T.border}` }}>
                                <Clock size={9} style={{ color: T.orange, flexShrink: 0 }} />
                                <span className="text-[9px] font-bold" style={{ color: T.text }}>{paso.hora}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* ── CALIFICACIÓN ── solo usuario ── */}
            {!esAdmin && (
            <div className="rounded-2xl overflow-hidden" style={card}>
              <div className="px-4 py-2.5 flex items-center gap-2" style={hdr}>
                <div className="w-1 h-3.5 rounded-full flex-shrink-0" style={{ background: "#f59e0b" }} />
                <p className="text-[10px] font-black uppercase tracking-widest" style={labelStyle}>
                  Calificar atención
                </p>
              </div>
              <div className="p-4 flex flex-col gap-3">
                <CalificacionEstrellas T={T} ticket={ticket} isDark={isDark} estatusActual={estatus} />
              </div>
            </div>
            )}

            {/* ── GENERACIÓN DE REPORTE ── */}
            <div className="rounded-2xl overflow-hidden" style={card}>
              <div className="px-4 py-2.5 flex items-center gap-2" style={hdr}>
                <div className="w-1 h-3.5 rounded-full flex-shrink-0" style={{ background: "#dc2626" }} />
                <p className="text-[10px] font-black uppercase tracking-widest" style={labelStyle}>
                  Generación de Reporte
                </p>
              </div>
              <div className="p-4 flex flex-col gap-3">
                <p className="text-[11px]" style={{ color: T.textMuted }}>Incluye información del ticket, descripción y comentarios del técnico.</p>
                <button onClick={generarReporte}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all hover:brightness-110 active:scale-95"
                  style={{ background: "linear-gradient(135deg, #dc2626, #b91c1c)", color: "#fff", boxShadow: "0 3px 12px rgba(220,38,38,0.35)" }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M14 2v6h6" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M8 13h2.5a1.5 1.5 0 010 3H8v-3zM8 16v2" stroke="#fff" strokeWidth="1.8" strokeLinecap="round"/>
                    <path d="M13 13v5M13 13h2a1.5 1.5 0 010 3h-2" stroke="#fff" strokeWidth="1.8" strokeLinecap="round"/>
                    <path d="M17 13h1.5a1.5 1.5 0 011.5 1.5v2a1.5 1.5 0 01-1.5 1.5H17v-5z" stroke="#fff" strokeWidth="1.8" strokeLinecap="round"/>
                  </svg>
                  Generar Reporte PDF
                </button>
              </div>
            </div>

            {/* ── ACCIONES ADMIN ── */}
            {esAdmin && (
              <div className="rounded-2xl overflow-hidden" style={card}>
                <div className="h-0.5" style={{ background: "linear-gradient(90deg,#16a34a,#4ade80,#16a34a)" }} />
                <div className="px-4 py-2.5 flex items-center justify-between" style={hdr}>
                  <div className="flex items-center gap-2">
                    <div className="w-1 h-3.5 rounded-full flex-shrink-0" style={{ background: "#16a34a" }} />
                    <p className="text-[10px] font-black uppercase tracking-widest" style={labelStyle}>Acciones del administrador</p>
                  </div>
                  {estatus === "Resuelto" && (
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold"
                      style={{ background: isDark ? "rgba(22,163,74,0.15)" : "#dcfce7", color: "#16a34a", border: "1px solid rgba(22,163,74,0.3)" }}>
                      <CheckCircle2 size={10}/> Cerrado
                    </span>
                  )}
                </div>
                <div className="p-4 flex flex-col gap-3">
                  {errorGuard && (
                    <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold"
                      style={{ background: isDark ? "rgba(220,38,38,0.15)" : "#fee2e2", color: "#dc2626", border: isDark ? "1px solid rgba(220,38,38,0.3)" : "1px solid #fca5a5" }}>
                      <XCircle size={13}/> {errorGuard}
                    </div>
                  )}
                  {guardado && (
                    <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold"
                      style={{ background: isDark ? "rgba(22,163,74,0.15)" : "#dcfce7", color: "#16a34a", border: isDark ? "1px solid rgba(22,163,74,0.3)" : "1px solid #86efac" }}>
                      <CheckCircle2 size={13}/> Cambios guardados
                    </div>
                  )}
                  {estatus !== "Resuelto" ? (
                    <>
                      <button onClick={() => guardarCambios(null)} disabled={guardando}
                        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all hover:brightness-110 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{ background: `linear-gradient(135deg,${T.orange},#d97400)`, color: "#fff", boxShadow: "0 3px 12px rgba(244,121,32,0.3)" }}>
                        <MessageSquare size={14}/> {guardando ? "Guardando..." : "Guardar comentario"}
                      </button>
                      {!confirmCierre ? (
                        <button onClick={() => setConfirmCierre(true)}
                          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all hover:brightness-110 active:scale-95"
                          style={{ background: "linear-gradient(135deg,#16a34a,#15803d)", color: "#fff", boxShadow: "0 3px 12px rgba(22,163,74,0.3)" }}>
                          <CheckCircle2 size={14}/> Cerrar ticket
                        </button>
                      ) : (
                        <div className="rounded-xl overflow-hidden"
                          style={{ border: isDark ? "1.5px solid rgba(22,163,74,0.3)" : "1.5px solid #86efac", background: isDark ? "rgba(22,163,74,0.08)" : "#f0fdf4" }}>
                          <div className="px-4 py-3 flex items-center gap-2"
                            style={{ borderBottom: isDark ? "1px solid rgba(22,163,74,0.2)" : "1px solid #86efac", background: isDark ? "rgba(22,163,74,0.12)" : "#dcfce7" }}>
                            <CheckCircle2 size={13} style={{ color: "#16a34a" }}/>
                            <p className="text-xs font-black" style={{ color: "#16a34a" }}>¿Confirmar cierre?</p>
                          </div>
                          <p className="px-4 py-2 text-[11px]" style={{ color: isDark ? "rgba(255,255,255,0.5)" : "#64748b" }}>
                            Marcará el ticket como <strong>Resuelto</strong> y guardará los comentarios.
                          </p>
                          <div className="flex gap-2 px-4 pb-4">
                            <button onClick={() => guardarCambios("Resuelto")} disabled={guardando}
                              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all hover:brightness-110 active:scale-95 disabled:opacity-50"
                              style={{ background: "#16a34a", color: "#fff", boxShadow: "0 2px 8px rgba(22,163,74,0.3)" }}>
                              <CheckCircle2 size={12}/> {guardando ? "Cerrando..." : "Sí, cerrar"}
                            </button>
                            <button onClick={() => setConfirmCierre(false)}
                              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all hover:brightness-110 active:scale-95"
                              style={{ background: isDark ? "rgba(255,255,255,0.08)" : T.surface, color: T.textMuted, border: `1px solid ${T.border}` }}>
                              <X size={12}/> Cancelar
                            </button>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="flex flex-col items-center gap-2 py-3">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center"
                        style={{ background: isDark ? "rgba(22,163,74,0.15)" : "#dcfce7", border: isDark ? "2px solid rgba(22,163,74,0.3)" : "2px solid #86efac" }}>
                        <CheckCircle2 size={20} style={{ color: "#16a34a" }}/>
                      </div>
                      <p className="text-xs font-black" style={{ color: "#16a34a" }}>Ticket cerrado</p>
                      <p className="text-[11px] text-center" style={{ color: T.textFaint }}>No se pueden realizar más acciones</p>
                    </div>
                  )}
                </div>
              </div>
            )}

          </div>
        </div>

      </div>

      {/* ── VISOR MODAL ── */}
      {visor !== null && imgs[visor] && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.93)" }}
          onClick={() => setVisor(null)}>
          <div className="relative w-full max-w-3xl flex flex-col items-center gap-4"
            onClick={e => e.stopPropagation()}>
            <img
              src={`${API}/storage/Evidencias_Tickets/${ticket.folio_ticket}/${imgs[visor]}`}
              alt="" className="rounded-2xl object-contain w-full"
              style={{ maxHeight: "70vh", boxShadow: "0 20px 60px rgba(0,0,0,0.8)" }}
            />
            <p className="text-xs text-center px-4" style={{ color: "rgba(255,255,255,0.4)" }}>
              {imgs[visor]} · {visor + 1} de {imgs.length}
            </p>
            <div className="flex items-center gap-3">
              <button onClick={() => setVisor(v => Math.max(0, v - 1))} disabled={visor === 0}
                className="w-10 h-10 rounded-full flex items-center justify-center disabled:opacity-25 hover:scale-110 active:scale-95 transition-all"
                style={{ background: "rgba(255,255,255,0.12)", color: "#fff" }}>
                <ChevronLeft size={20} />
              </button>
              <span className="text-sm font-bold text-white">{visor + 1} / {imgs.length}</span>
              <button onClick={() => setVisor(v => Math.min(imgs.length - 1, v + 1))} disabled={visor === imgs.length - 1}
                className="w-10 h-10 rounded-full flex items-center justify-center disabled:opacity-25 hover:scale-110 active:scale-95 transition-all"
                style={{ background: "rgba(255,255,255,0.12)", color: "#fff" }}>
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
          <button onClick={() => setVisor(null)}
            className="absolute top-4 right-4 w-10 h-10 rounded-full flex items-center justify-center hover:scale-110 transition-all"
            style={{ background: "rgba(255,255,255,0.1)", color: "#fff", border: "1px solid rgba(255,255,255,0.15)" }}>
            <X size={18} />
          </button>
        </div>
      )}
    </div>
  );
}
