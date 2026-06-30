import { useState, useEffect, useCallback } from "react";
import {
  ArrowLeft, Package, User, Calendar, Tag, AlertTriangle,
  CheckCircle2, XCircle, Clock, Loader2, ChevronDown, Check, X as XIcon
} from "lucide-react";
import { apiFetch, API_ROUTES, getToken } from "../../Config/api";

const ESTATUS_META = {
  "Pendiente":   { color: "#d97706", bgL: "#fef3c7", bgD: "rgba(217,119,6,0.15)",  borderL: "#fde68a", borderD: "rgba(217,119,6,0.3)",   icon: Clock        },
  "En proceso":  { color: "#3b82f6", bgL: "#eff6ff", bgD: "rgba(59,130,246,0.15)", borderL: "#bfdbfe", borderD: "rgba(59,130,246,0.3)",  icon: Loader2      },
  "Resuelto":    { color: "#16a34a", bgL: "#dcfce7", bgD: "rgba(22,163,74,0.15)",  borderL: "#86efac", borderD: "rgba(22,163,74,0.3)",   icon: CheckCircle2 },
  "No Resuelto": { color: "#dc2626", bgL: "#fee2e2", bgD: "rgba(220,38,38,0.15)",  borderL: "#fca5a5", borderD: "rgba(220,38,38,0.3)",   icon: XCircle      },
  "Rechazado":   { color: "#7c3aed", bgL: "#ede9fe", bgD: "rgba(124,58,237,0.15)", borderL: "#c4b5fd", borderD: "rgba(124,58,237,0.3)",  icon: XCircle      },
};

const PRIO_META = {
  "Urgente": { color: "#dc2626", bgL: "#fee2e2", bgD: "rgba(220,38,38,0.15)",  borderL: "#fca5a5", borderD: "rgba(220,38,38,0.3)"  },
  "Alta":    { color: "#ea580c", bgL: "#ffedd5", bgD: "rgba(234,88,12,0.15)",  borderL: "#fdba74", borderD: "rgba(234,88,12,0.3)"  },
  "Media":   { color: "#ca8a04", bgL: "#fef9c3", bgD: "rgba(202,138,4,0.15)",  borderL: "#fde047", borderD: "rgba(202,138,4,0.3)"  },
  "Baja":    { color: "#16a34a", bgL: "#dcfce7", bgD: "rgba(22,163,74,0.15)",  borderL: "#86efac", borderD: "rgba(22,163,74,0.3)"  },
};

const PASOS = ["Pendiente", "En proceso", "Resuelto"];
const ESTATUS_OPTS = ["En proceso", "Resuelto", "No Resuelto", "Rechazado"];

export default function VistaSolicitud({ id_solicitud, T, esAdmin = false, onBack }) {
  const isDark  = T?.isDark ?? false;
  const orange  = T?.orange  ?? "#f47920";

  const [solicitud, setSolicitud] = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState("");
  const [updating,  setUpdating]  = useState(false);
  const [guardado,  setGuardado]  = useState(false);
  const [dropdown,  setDropdown]  = useState(false);
  // aprobacion parcial: mapa id_solicitud_insumo -> true/false
  const [aprobados,    setAprobados]    = useState({});
  const [guardandoItems, setGuardandoItems] = useState(false);
  const [itemsGuardados, setItemsGuardados] = useState(false);

  const cargar = useCallback(() => {
    if (!id_solicitud) return;
    setLoading(true);
    apiFetch(API_ROUTES.SOLICITUD(id_solicitud))
      .then(r => r.json())
      .then(d => {
        if (d.error) { setError(d.error); return; }
        setSolicitud(d);
        // Inicializar mapa de aprobados: null/undefined => true (aprobado por defecto)
        const mapa = {};
        (d.detalle || []).forEach(item => {
          mapa[item.id_solicitud_insumo] = item.aprobado == null ? true : Boolean(item.aprobado);
        });
        setAprobados(mapa);
      })
      .catch(() => setError("Error al cargar la solicitud"))
      .finally(() => setLoading(false));
  }, [id_solicitud]);

  useEffect(() => { cargar(); }, [cargar]);

  const cambiarEstatus = async (nuevoEstatus) => {
    if (!solicitud) return;
    setUpdating(true);
    setDropdown(false);
    try {
      const r = await apiFetch(API_ROUTES.SOLICITUD_ESTATUS(solicitud.id_solicitud), {
        method: "PATCH",
        body: { estatus: nuevoEstatus },
      });
      if (r.ok) {
        setSolicitud(prev => ({ ...prev, estatus: nuevoEstatus }));
        setGuardado(true);
        setTimeout(() => setGuardado(false), 2500);
      }
    } finally {
      setUpdating(false);
    }
  };

  const guardarAprobados = async () => {
    if (!solicitud) return;
    setGuardandoItems(true);
    try {
      const items = (solicitud.detalle || []).map(d => ({
        id_solicitud_insumo: d.id_solicitud_insumo,
        aprobado: aprobados[d.id_solicitud_insumo] ? 1 : 0,
      }));
      const r = await apiFetch(API_ROUTES.SOLICITUD_ITEMS(solicitud.id_solicitud), {
        method: "PATCH",
        body: { items },
      });
      if (r.ok) {
        setItemsGuardados(true);
        setTimeout(() => setItemsGuardados(false), 2500);
        // Recargar para reflejar cambios
        cargar();
      }
    } finally {
      setGuardandoItems(false);
    }
  };

  const card = {
    background: isDark ? "#141720" : (T?.surface ?? "#fff"),
    border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : (T?.border ?? "#e2e8f0")}`,
    boxShadow: isDark ? "0 4px 20px rgba(0,0,0,0.4)" : "0 1px 6px rgba(0,0,0,0.06)",
  };
  const hdr = {
    background: isDark ? "rgba(255,255,255,0.03)" : (T?.surfaceAlt ?? "#f8fafc"),
    borderBottom: `1px solid ${isDark ? "rgba(255,255,255,0.07)" : (T?.border ?? "#e2e8f0")}`,
  };
  const labelStyle = { color: isDark ? "rgba(255,255,255,0.45)" : (T?.textMuted ?? "#94a3b8") };
  const valStyle   = { color: T?.text ?? "#1e293b" };

  if (loading) return (
    <div className="flex justify-center items-center py-24">
      <svg className="animate-spin" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={orange} strokeWidth="2">
        <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
      </svg>
    </div>
  );

  if (error || !solicitud) return (
    <div className="flex flex-col items-center py-24 gap-3">
      <XCircle size={32} style={{ color: "#dc2626" }} />
      <p className="text-sm font-bold" style={valStyle}>{error || "Solicitud no encontrada"}</p>
      {onBack && (
        <button onClick={onBack} className="text-xs font-bold px-4 py-2 rounded-xl transition-all hover:brightness-110"
          style={{ background: `${orange}15`, color: orange, border: `1px solid ${orange}40` }}>
          ← Regresar
        </button>
      )}
    </div>
  );

  const estatusMeta  = ESTATUS_META[solicitud.estatus] || ESTATUS_META["Pendiente"];
  const prioMeta     = PRIO_META[solicitud.prioridad]  || PRIO_META["Baja"];
  const estatusBg    = isDark ? estatusMeta.bgD    : estatusMeta.bgL;
  const estatusBrd   = isDark ? estatusMeta.borderD : estatusMeta.borderL;
  const prioBg       = isDark ? prioMeta.bgD       : prioMeta.bgL;
  const prioBrd      = isDark ? prioMeta.borderD   : prioMeta.borderL;

  const pasoActual = solicitud.estatus === "Resuelto" ? 2
    : solicitud.estatus === "En proceso" ? 1 : 0;
  const cerrado = solicitud.estatus === "Resuelto" || solicitud.estatus === "No Resuelto" || solicitud.estatus === "Rechazado";

  const aprobadosCount = Object.values(aprobados).filter(Boolean).length;
  const totalItems = solicitud.detalle?.length ?? 0;

  const EstatusIcon = estatusMeta.icon;
  const fmtFecha = (d) => d ? new Date(d).toLocaleDateString("es-MX", { day: "2-digit", month: "2-digit", year: "numeric" }) : "—";
  const fmtFechaHora = (d) => d ? new Date(d).toLocaleString("es-MX", { dateStyle: "medium", timeStyle: "short" }) : "—";

  const generarReportePrintView = () => {
    const token = getToken?.() || sessionStorage.getItem("token") || "";
    const url = `/print/solicitud/${solicitud.folio_solicitud}${token ? `?token=${encodeURIComponent(token)}` : ""}`;
    const win = window.open(url, "_blank", "width=1000,height=800");
    if (!win) {
      // Fallback: generar HTML inline
      generarReporte();
    }
  };

  const generarReporte = () => {
    const origin   = window.location.origin;
    const pasoIdx  = solicitud.estatus === "Resuelto" ? 2 : solicitud.estatus === "En proceso" ? 1 : 0;
    const esCerrado = solicitud.estatus === "Resuelto" || solicitud.estatus === "No Resuelto";

    const stepperHtml = ["Pendiente", "En proceso", "Resuelto"].map((paso, i) => {
      const done   = esCerrado ? false : i <= pasoIdx;
      const active = esCerrado ? false : i === pasoIdx;
      const isLast = i === 2;
      const circBg  = done ? (i === 2 && pasoIdx === 2 ? "#16a34a" : "#F47920") : "#f1f5f9";
      const circBdr = done ? (i === 2 && pasoIdx === 2 ? "#16a34a" : "#F47920") : "#d1d5db";
      const lineBg  = i < pasoIdx ? (i + 1 === 2 && pasoIdx === 2 ? "#16a34a" : "#F47920") : "#e5e7eb";
      const fechaPaso = i === 0 ? (solicitud.fecha ? fmtFecha(solicitud.fecha) : "") : "";
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
            <div style="width:24px;height:24px;border-radius:50%;background:${circBg};border:2px solid ${circBdr};display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:900;color:${done?"#fff":"#9ca3af"};-webkit-print-color-adjust:exact;print-color-adjust:exact">&#10003;</div>
            ${!isLast ? `<div style="width:2px;height:26px;background:${lineBg};margin:2px 0;border-radius:2px;-webkit-print-color-adjust:exact;print-color-adjust:exact"></div>` : ""}
          </div>
          <div style="flex:1;padding-top:3px">
            <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin-bottom:2px">
              <span style="font-size:10.5px;font-weight:${active?"900":done?"700":"500"};color:${done?"#1D1D1B":"#9ca3af"}">${paso}</span>
              ${badgeHtml}
            </div>
            ${fechaPaso ? `<span style="font-size:8px;color:#6b7280">${fechaPaso}</span>` : ""}
          </div>
        </div>`;
    }).join("");

    const noResueltoHtml = solicitud.estatus === "No Resuelto"
      ? `<div style="display:flex;align-items:center;gap:6px;padding:8px 12px;border-radius:8px;background:#fef2f2;border:1px solid #fca5a5;color:#dc2626;font-size:9px;font-weight:700;margin-top:6px">&#10007; Solicitud marcada como No Resuelta</div>`
      : "";

    const insumosHtml = !solicitud.detalle?.length
      ? `<p style="font-size:9px;color:#9ca3af;font-style:italic">Sin insumos registrados.</p>`
      : solicitud.detalle.map((d, i) => `
        <div style="display:flex;align-items:center;gap:10px;padding:8px 10px;border-bottom:1px solid #f1f5f9">
          <div style="width:30px;height:30px;border-radius:8px;background:#fff7ed;border:1px solid rgba(244,121,32,0.2);display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:13px">&#128230;</div>
          <div style="flex:1;min-width:0">
            <p style="font-size:11px;font-weight:800;color:#1D1D1B;margin:0">${d.nombre}</p>
            <p style="font-size:8.5px;color:#6b7280;margin:2px 0 0">${[d.marca, d.modelo].filter(Boolean).join(" · ") || "Sin especificaciones"}${d.num_serie ? ` · S/N: ${d.num_serie}` : ""}</p>
          </div>
          <div style="text-align:right;flex-shrink:0">
            <p style="font-size:16px;font-weight:900;color:#F47920;margin:0">&times;${d.cantidad}</p>
            <p style="font-size:8px;font-weight:700;color:${d.stock > 0 ? "#16a34a" : "#dc2626"};margin:0">${d.stock > 0 ? `Stock: ${d.stock}` : "Agotado"}</p>
          </div>
        </div>`).join("");

    const totalPiezas = solicitud.detalle?.reduce((s, d) => s + d.cantidad, 0) ?? 0;

    const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8"/>
<title>Reporte ${solicitud.folio_solicitud}</title>
<style>
  @page { size: letter portrait; margin: 10mm 12mm; }
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family:'Segoe UI',Arial,sans-serif; background:#fff; color:#1D1D1B; -webkit-print-color-adjust:exact; print-color-adjust:exact; }
  .hdr { display:flex; align-items:center; justify-content:space-between; padding:10px 0; border-bottom:3px solid #F47920; margin-bottom:10px; }
  .hdr-logo { height:52px; object-fit:contain; }
  .hdr-center { flex:1; text-align:center; }
  .hdr-center-title { font-size:8px; font-weight:700; text-transform:uppercase; letter-spacing:.18em; color:#9ca3af; }
  .hdr-center-name  { font-size:14px; font-weight:900; color:#1D1D1B; margin-top:2px; }
  .hdr-right { text-align:right; }
  .hdr-folio { font-family:monospace; font-size:18px; font-weight:900; color:#F47920; }
  .hdr-date  { font-size:7.5px; color:#9ca3af; margin-top:3px; }
  .titulo-block { border:1.5px solid #e5e7eb; border-radius:8px; overflow:hidden; margin-bottom:8px; }
  .titulo-top { background:#f8fafc; padding:10px 14px; display:flex; align-items:flex-start; justify-content:space-between; gap:12px; border-bottom:1.5px solid #e5e7eb; }
  .titulo-text { font-size:15px; font-weight:900; color:#1D1D1B; flex:1; line-height:1.3; }
  .titulo-folio { font-family:monospace; font-size:13px; font-weight:900; color:#F47920; background:#fff7ed; padding:4px 10px; border-radius:6px; border:1.5px solid #fed7aa; white-space:nowrap; flex-shrink:0; }
  .titulo-sub { display:flex; background:#fff; }
  .titulo-sub-item { flex:1; padding:8px 14px; display:flex; flex-direction:column; gap:2px; }
  .titulo-sub-item + .titulo-sub-item { border-left:1.5px solid #e5e7eb; }
  .sub-lbl { font-size:7px; font-weight:900; text-transform:uppercase; letter-spacing:.1em; color:#9ca3af; }
  .sub-val { font-size:13px; font-weight:800; color:#1D1D1B; }
  .g2 { display:grid; grid-template-columns:1fr 1fr; gap:7px; margin-bottom:7px; }
  .sec { border:1.5px solid #e5e7eb; border-radius:7px; overflow:hidden; }
  .sec-h { background:#f8fafc; padding:5px 10px; border-bottom:1.5px solid #e5e7eb; display:flex; align-items:center; gap:5px; }
  .sec-dot { width:3px; height:12px; border-radius:2px; background:#F47920; flex-shrink:0; }
  .sec-title { font-size:7px; font-weight:900; text-transform:uppercase; letter-spacing:.14em; color:#6b7280; }
  .sec-b { padding:8px 10px; }
  .dato-grid { display:grid; grid-template-columns:1fr 1fr; gap:5px; }
  .dato { background:#f9fafb; border:1px solid #e5e7eb; border-radius:5px; padding:5px 8px; }
  .dato-lbl { font-size:6.5px; font-weight:900; text-transform:uppercase; letter-spacing:.1em; color:#9ca3af; margin-bottom:3px; }
  .dato-val { font-size:10px; font-weight:700; color:#1D1D1B; line-height:1.3; }
  .badge { display:inline-block; padding:3px 10px; border-radius:20px; font-size:9.5px; font-weight:800; border:1.5px solid; }
  .b-pendiente  { background:#fef3c7; color:#d97706; border-color:#fde68a; }
  .b-proceso    { background:#eff6ff; color:#3b82f6; border-color:#bfdbfe; }
  .b-resuelto   { background:#dcfce7; color:#16a34a; border-color:#86efac; }
  .b-nores      { background:#fee2e2; color:#dc2626; border-color:#fca5a5; }
  .b-urgente    { background:#fee2e2; color:#dc2626; border-color:#fca5a5; }
  .b-alta       { background:#ffedd5; color:#ea580c; border-color:#fdba74; }
  .b-media      { background:#fef9c3; color:#ca8a04; border-color:#fde047; }
  .b-baja       { background:#dcfce7; color:#16a34a; border-color:#86efac; }
  .ftr { background:#1D1D1B; border-radius:8px; margin-top:10px; padding:12px 18px; display:flex; align-items:center; justify-content:space-between; gap:16px; -webkit-print-color-adjust:exact; print-color-adjust:exact; }
  .ftr-left { display:flex; flex-direction:column; gap:3px; }
  .ftr-brand { font-size:11px; font-weight:900; color:#F47920; }
  .ftr-sub { font-size:7.5px; color:rgba(255,255,255,0.45); }
  .ftr-divider { width:1px; height:32px; background:rgba(255,255,255,0.12); flex-shrink:0; }
  .ftr-center { flex:1; display:flex; flex-direction:column; align-items:center; gap:2px; }
  .ftr-folio { font-family:monospace; font-size:13px; font-weight:900; color:#fff; }
  .ftr-right { text-align:right; }
  .ftr-date { font-size:7.5px; color:rgba(255,255,255,0.45); }
  .ftr-logo { height:26px; object-fit:contain; margin-top:4px; filter:brightness(0) invert(1); opacity:.6; }
</style>
</head>
<body>

<div class="hdr">
  <img src="${origin}/assets/img/logo negro.png" class="hdr-logo" alt="PTP"/>
  <div class="hdr-center">
    <div class="hdr-center-title">Precision Truck Parts &amp; Accessories</div>
    <div class="hdr-center-name">Reporte de Solicitud de Insumos</div>
  </div>
  <div class="hdr-right">
    <div class="hdr-folio">${solicitud.folio_solicitud}</div>
    <div class="hdr-date">Generado: ${new Date().toLocaleDateString("es-MX", { day: "2-digit", month: "long", year: "numeric" })} &bull; ${new Date().toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })}</div>
  </div>
</div>

<div class="titulo-block">
  <div class="titulo-top">
    <div class="titulo-text">Solicitud de Insumos</div>
    <div class="titulo-folio">${solicitud.folio_solicitud}</div>
  </div>
  <div class="titulo-sub">
    <div class="titulo-sub-item"><span class="sub-lbl">Solicitante</span><span class="sub-val">${solicitud.nombre_empleado || "&mdash;"}</span></div>
    <div class="titulo-sub-item"><span class="sub-lbl">&Aacute;rea / Departamento</span><span class="sub-val">${solicitud.nombre_departamento || "&mdash;"}</span></div>
    <div class="titulo-sub-item"><span class="sub-lbl">Fecha de solicitud</span><span class="sub-val">${fmtFechaHora(solicitud.fecha)}</span></div>
  </div>
</div>

<div class="g2">
  <div class="sec">
    <div class="sec-h"><div class="sec-dot"></div><span class="sec-title">Clasificaci&oacute;n</span></div>
    <div class="sec-b">
      <div class="dato-grid">
        <div class="dato"><div class="dato-lbl">Prioridad</div><span class="badge b-${(solicitud.prioridad||"baja").toLowerCase()}">${solicitud.prioridad || "&mdash;"}</span></div>
        <div class="dato"><div class="dato-lbl">Estatus</div><span class="badge ${solicitud.estatus==="Resuelto"?"b-resuelto":solicitud.estatus==="En proceso"?"b-proceso":solicitud.estatus==="No Resuelto"?"b-nores":"b-pendiente"}">${solicitud.estatus || "Pendiente"}</span></div>
        <div class="dato" style="grid-column:1/-1"><div class="dato-lbl">Total de insumos</div><div class="dato-val">${solicitud.detalle?.length ?? 0} tipo(s) &bull; ${totalPiezas} pieza(s)</div></div>
      </div>
    </div>
  </div>
  <div class="sec">
    <div class="sec-h"><div class="sec-dot"></div><span class="sec-title">Progreso de la solicitud</span></div>
    <div class="sec-b" style="padding:10px 12px">${stepperHtml}${noResueltoHtml}</div>
  </div>
</div>

<div class="sec" style="margin-bottom:7px">
  <div class="sec-h"><div class="sec-dot"></div><span class="sec-title">Insumos Solicitados</span></div>
  <div style="padding:0">
    ${insumosHtml}
    <div style="display:flex;align-items:center;justify-content:space-between;padding:8px 12px;background:#f8fafc;border-top:1.5px solid #e5e7eb">
      <span style="font-size:8px;font-weight:900;text-transform:uppercase;letter-spacing:.1em;color:#9ca3af">Total de piezas</span>
      <span style="font-size:13px;font-weight:900;color:#F47920">${totalPiezas} pza.</span>
    </div>
  </div>
</div>

<div class="ftr">
  <div class="ftr-left">
    <span class="ftr-brand">Precision Truck Parts &amp; Accessories</span>
    <span class="ftr-sub">Sistema HelpDesk &bull; Documento de uso interno</span>
  </div>
  <div class="ftr-divider"></div>
  <div class="ftr-center"><span class="ftr-folio">${solicitud.folio_solicitud}</span></div>
  <div class="ftr-divider"></div>
  <div class="ftr-right">
    <div class="ftr-date">${new Date().toLocaleDateString("es-MX", { day: "2-digit", month: "long", year: "numeric" })}</div>
    <img src="${origin}/assets/img/logo blanco.png" class="ftr-logo" alt="PTP"/>
  </div>
</div>

<script>window.onload=function(){window.print();}<\/script>
</body></html>`;

    const win = window.open("", "_blank", "width=900,height=700");
    if (!win) {
      const aviso = document.createElement("div");
      aviso.style.cssText = "position:fixed;top:16px;left:50%;transform:translateX(-50%);z-index:9999;background:#1D1D1B;color:#fff;padding:12px 20px;border-radius:10px;font-size:13px;font-weight:700;border-left:4px solid #F47920;box-shadow:0 4px 20px rgba(0,0,0,0.4);";
      aviso.textContent = "Permite ventanas emergentes para generar el reporte.";
      document.body.appendChild(aviso);
      setTimeout(() => aviso.remove(), 5000);
      return;
    }
    win.document.open();
    win.document.write(html);
    win.document.close();
  };

  return (
    <div className="overflow-y-auto" style={{ background: T?.bg ?? "#f8fafc" }}>
      <div className="max-w-5xl mx-auto p-3 sm:p-4 md:p-6 pb-6 space-y-3 sm:space-y-4">

        {/* ── HEADER CARD ── */}
        <div className="rounded-2xl overflow-hidden" style={card}>
          <div className="h-1" style={{ background: `linear-gradient(90deg, ${estatusMeta.color}, ${estatusMeta.color}55)` }} />
          <div className="px-4 py-3 sm:px-5 md:px-6">
            {/* Top row */}
            <div className="flex flex-col gap-2 mb-2 sm:flex-row sm:items-center sm:gap-3">
              <div className="flex items-center gap-2">
                {onBack && (
                  <button onClick={onBack}
                    className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl transition-all hover:brightness-110 active:scale-95 flex-shrink-0"
                    style={{ background: isDark ? "rgba(255,255,255,0.06)" : T?.surfaceAlt, color: T?.textMuted, border: `1px solid ${T?.border}` }}>
                    <ArrowLeft size={13} /> Volver
                  </button>
                )}
                <span className="sm:hidden font-mono text-xs font-black px-2.5 py-1 rounded-xl"
                  style={{ background: isDark ? "rgba(255,255,255,0.06)" : T?.surfaceAlt, color: T?.text, border: `1px solid ${T?.border}` }}>
                  {solicitud.folio_solicitud}
                </span>
              </div>

              <h1 className="text-sm font-black leading-snug flex-1" style={{ color: T?.text }}>
                Solicitud de Insumos
              </h1>

              <div className="hidden sm:flex flex-col items-end gap-1 flex-shrink-0">
                <span className="font-mono text-xs font-black px-2.5 py-1 rounded-xl"
                  style={{ background: isDark ? "rgba(255,255,255,0.06)" : T?.surfaceAlt, color: T?.text, border: `1px solid ${T?.border}` }}>
                  {solicitud.folio_solicitud}
                </span>
                <img
                  src={isDark ? "/assets/img/logo blanco.png" : "/assets/img/logo negro.png"}
                  alt="logo" style={{ height: "28px", width: "auto", objectFit: "contain" }}
                />
              </div>
            </div>

            {/* Badges */}
            <div className="flex flex-wrap gap-2">
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold"
                style={{ background: prioBg, color: prioMeta.color, border: `1px solid ${prioBrd}` }}>
                <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: prioMeta.color }} />
                Prioridad: {solicitud.prioridad}
              </span>
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold"
                style={{ background: estatusBg, color: estatusMeta.color, border: `1px solid ${estatusBrd}` }}>
                <EstatusIcon size={11} className={solicitud.estatus === "En proceso" ? "animate-spin" : ""} />
                Estado: {solicitud.estatus || "Pendiente"}
              </span>
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold"
                style={{ background: isDark ? "rgba(255,255,255,0.06)" : T?.surfaceAlt, color: T?.textMuted, border: `1px solid ${T?.border}` }}>
                <Package size={10} />
                {solicitud.detalle?.length ?? 0} insumo{solicitud.detalle?.length !== 1 ? "s" : ""}
              </span>
            </div>
          </div>
        </div>

        {/* ── CUERPO ── */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-3 sm:gap-4">

          {/* ── COLUMNA IZQUIERDA ── */}
          <div className="lg:col-span-3 space-y-3 sm:space-y-4">

            {/* Información general */}
            <div className="rounded-2xl overflow-hidden" style={card}>
              <div className="px-4 py-2.5 flex items-center gap-2" style={hdr}>
                <div className="w-1 h-3.5 rounded-full flex-shrink-0" style={{ background: orange }} />
                <p className="text-[10px] font-black uppercase tracking-widest" style={labelStyle}>Información del reporte</p>
              </div>
              <div className="p-3 sm:p-4 grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                {[
                  { icon: User,          label: "Solicitante",  val: solicitud.nombre_empleado    || "—" },
                  { icon: Tag,           label: "Área",         val: solicitud.nombre_departamento || "—" },
                  { icon: Calendar,      label: "Fecha",        val: fmtFechaHora(solicitud.fecha) },
                  { icon: AlertTriangle, label: "Prioridad",    val: solicitud.prioridad || "—" },
                ].map(({ icon: Icon, label, val }) => (
                  <div key={label} className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
                    style={{ background: isDark ? "rgba(255,255,255,0.03)" : T?.bg, border: `1px solid ${T?.border}` }}>
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: "rgba(244,121,32,0.1)" }}>
                      <Icon size={13} style={{ color: orange }} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[9px] font-black uppercase tracking-widest" style={labelStyle}>{label}</p>
                      <p className="text-xs font-semibold truncate mt-0.5" style={valStyle}>{val}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Insumos solicitados */}
            <div className="rounded-2xl overflow-hidden" style={card}>
              <div className="px-4 py-2.5 flex items-center justify-between" style={hdr}>
                <div className="flex items-center gap-2">
                  <div className="w-1 h-3.5 rounded-full flex-shrink-0" style={{ background: orange }} />
                  <p className="text-[10px] font-black uppercase tracking-widest" style={labelStyle}>Insumos Solicitados</p>
                </div>
                <div className="flex items-center gap-2">
                  {esAdmin && !cerrado && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                      style={{ background: isDark ? "rgba(22,163,74,0.12)" : "#dcfce7", color: "#16a34a", border: "1px solid rgba(22,163,74,0.3)" }}>
                      {aprobadosCount}/{totalItems} aprobados
                    </span>
                  )}
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                    style={{ background: T?.bg, color: T?.textMuted, border: `1px solid ${T?.border}` }}>
                    {totalItems} ítem{totalItems !== 1 ? "s" : ""}
                  </span>
                </div>
              </div>

              {/* Aviso aprobación parcial — solo admin, solicitud abierta */}
              {esAdmin && !cerrado && (
                <div className="px-4 py-2 flex items-center gap-2"
                  style={{ background: isDark ? "rgba(59,130,246,0.06)" : "#eff6ff", borderBottom: `1px solid ${T?.border}` }}>
                  <p className="text-[10px] flex-1" style={{ color: isDark ? "rgba(255,255,255,0.5)" : "#64748b" }}>
                    Marca los insumos a aprobar. Al resolver, solo se descontará el stock de los marcados.
                  </p>
                  <button
                    onClick={() => {
                      const todosAprobados = (solicitud.detalle || []).every(d => aprobados[d.id_solicitud_insumo] !== false);
                      const nuevoVal = !todosAprobados;
                      const nuevo = {};
                      (solicitud.detalle || []).forEach(d => { nuevo[d.id_solicitud_insumo] = nuevoVal; });
                      setAprobados(nuevo);
                    }}
                    className="text-[10px] font-bold px-2.5 py-1 rounded-lg flex-shrink-0 transition-all hover:brightness-110"
                    style={{ background: isDark ? "rgba(255,255,255,0.06)" : T?.surfaceAlt, color: T?.textMuted, border: `1px solid ${T?.border}` }}>
                    {(solicitud.detalle || []).every(d => aprobados[d.id_solicitud_insumo] !== false) ? "Desmarcar todos" : "Aprobar todos"}
                  </button>
                </div>
              )}

              <div className="divide-y" style={{ borderColor: isDark ? "rgba(255,255,255,0.07)" : T?.border }}>
                {!solicitud.detalle?.length ? (
                  <p className="px-4 py-8 text-center text-xs" style={labelStyle}>Sin insumos registrados</p>
                ) : solicitud.detalle.map((d, i) => {
                  const aprobado = aprobados[d.id_solicitud_insumo] !== false;
                  return (
                    <div key={d.id_solicitud_insumo ?? i}
                      className="px-4 py-3 flex items-center gap-3 transition-all"
                      style={{ opacity: esAdmin && !cerrado && !aprobado ? 0.45 : 1 }}>

                      {/* Checkbox admin solicitud abierta */}
                      {esAdmin && !cerrado && (
                        <button
                          onClick={() => setAprobados(prev => ({ ...prev, [d.id_solicitud_insumo]: !aprobado }))}
                          className="flex-shrink-0 w-5 h-5 rounded-md flex items-center justify-center transition-all active:scale-90"
                          style={{
                            background: aprobado ? "#16a34a" : isDark ? "rgba(255,255,255,0.06)" : "#f1f5f9",
                            border: `2px solid ${aprobado ? "#16a34a" : isDark ? "rgba(255,255,255,0.2)" : "#d1d5db"}`,
                            boxShadow: aprobado ? "0 1px 4px rgba(22,163,74,0.4)" : "none",
                          }}>
                          {aprobado && <Check size={11} color="#fff" strokeWidth={3} />}
                        </button>
                      )}

                      {/* Indicador estado en solicitud cerrada */}
                      {cerrado && d.aprobado != null && (
                        <div className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center"
                          style={{ background: d.aprobado ? "rgba(22,163,74,0.15)" : "rgba(220,38,38,0.15)" }}>
                          {d.aprobado
                            ? <Check size={10} style={{ color: "#16a34a" }} strokeWidth={3} />
                            : <XIcon size={10} style={{ color: "#dc2626" }} strokeWidth={3} />}
                        </div>
                      )}

                      <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ background: isDark ? "rgba(244,121,32,0.10)" : "#fff7ed", border: "1px solid rgba(244,121,32,0.2)" }}>
                        <Package size={15} style={{ color: orange }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-bold truncate" style={valStyle}>{d.nombre}</p>
                        <p className="text-[11px] mt-0.5" style={labelStyle}>
                          {[d.marca, d.modelo].filter(Boolean).join(" · ") || "Sin especificaciones"}
                          {d.num_serie ? ` · S/N: ${d.num_serie}` : ""}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-[18px] font-black leading-none" style={{ color: orange }}>×{d.cantidad}</p>
                        <p className="text-[9px] font-bold uppercase tracking-wider mt-0.5"
                          style={{ color: d.stock > 0 ? "#16a34a" : "#dc2626" }}>
                          {d.stock > 0 ? `Stock: ${d.stock}` : "Agotado"}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Botón guardar selección — solo admin, solicitud abierta */}
              {esAdmin && !cerrado && (
                <div className="px-4 py-3" style={{ borderTop: `1px solid ${T?.border}` }}>
                  {itemsGuardados && (
                    <p className="text-[10px] font-semibold mb-1.5 flex items-center gap-1" style={{ color: "#16a34a" }}>
                      <CheckCircle2 size={10} /> Selección guardada
                    </p>
                  )}
                  <button onClick={guardarAprobados} disabled={guardandoItems}
                    className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-[11px] font-bold transition-all hover:brightness-110 active:scale-95 disabled:opacity-50"
                    style={{ background: isDark ? "rgba(22,163,74,0.12)" : "#dcfce7", color: "#16a34a", border: "1px solid rgba(22,163,74,0.3)" }}>
                    <Check size={12} strokeWidth={2.5} />
                    {guardandoItems ? "Guardando..." : `Guardar selección (${aprobadosCount}/${totalItems})`}
                  </button>
                </div>
              )}

              {/* Total */}
              <div className="px-4 py-2.5 flex items-center justify-between"
                style={{ borderTop: `1px solid ${isDark ? "rgba(255,255,255,0.07)" : T?.border}`, ...hdr }}>
                <span className="text-[10px] font-black uppercase tracking-wider" style={labelStyle}>Total de piezas</span>
                <span className="text-sm font-black" style={{ color: orange }}>
                  {solicitud.detalle?.reduce((s, d) => s + d.cantidad, 0) ?? 0} pza.
                </span>
              </div>
            </div>

          </div>

          {/* ── COLUMNA DERECHA ── */}
          <div className="lg:col-span-2 space-y-3 sm:space-y-4">

            {/* Progreso */}
            <div className="rounded-2xl overflow-hidden" style={card}>
              <div className="px-4 py-3 flex items-center gap-2" style={hdr}>
                <div className="w-1 h-4 rounded-full flex-shrink-0" style={{ background: orange }} />
                <p className="text-[11px] font-black uppercase tracking-widest" style={labelStyle}>Estado de la solicitud</p>
              </div>
              <div className="p-5">
                <div className="flex flex-col gap-0">
                  {[
                    {
                      label: "Pendiente",
                      sub: "Solicitud registrada en el sistema",
                      fecha: fmtFecha(solicitud.fecha),
                      icon: <Clock size={12} />,
                    },
                    {
                      label: "En proceso",
                      sub: "Siendo atendida por el equipo",
                      fecha: null,
                      icon: <Loader2 size={12} />,
                    },
                    {
                      label: "Resuelto",
                      sub: "Insumos entregados",
                      fecha: null,
                      icon: <CheckCircle2 size={12} />,
                    },
                  ].map((paso, i) => {
                    const completado = solicitud.estatus === "No Resuelto" ? false : i <= pasoActual;
                    const actual     = solicitud.estatus === "No Resuelto" ? false : i === pasoActual;
                    const esUltimo   = i === 2;
                    const circleColor = completado
                      ? (esUltimo && pasoActual === 2 ? "#16a34a" : orange)
                      : "transparent";
                    const circleBorder = completado
                      ? (esUltimo && pasoActual === 2 ? "#16a34a" : orange)
                      : isDark ? "rgba(255,255,255,0.15)" : "#d1d5db";

                    return (
                      <div key={paso.label} className="flex gap-3">
                        <div className="flex flex-col items-center flex-shrink-0" style={{ width: "28px" }}>
                          <div className="relative flex items-center justify-center rounded-full transition-all duration-500"
                            style={{
                              width: "28px", height: "28px",
                              background: completado
                                ? (esUltimo && pasoActual === 2
                                    ? "linear-gradient(135deg,#16a34a,#4ade80)"
                                    : `linear-gradient(135deg,${orange},#d97400)`)
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
                            {actual && (
                              <span className="absolute inset-0 rounded-full animate-ping"
                                style={{ background: pasoActual === 2 ? "rgba(22,163,74,0.25)" : "rgba(244,121,32,0.25)", animationDuration: "1.8s" }} />
                            )}
                          </div>
                          {!esUltimo && (
                            <div className="relative flex-1 overflow-hidden"
                              style={{ width: "2px", minHeight: "32px", borderRadius: "999px",
                                background: isDark ? "rgba(255,255,255,0.07)" : "#e2e8f0", margin: "3px 0" }}>
                              <div className="absolute top-0 left-0 w-full transition-all duration-700"
                                style={{
                                  height: i < pasoActual ? "100%" : "0%",
                                  background: i + 1 === 2 && pasoActual === 2
                                    ? "linear-gradient(180deg,#16a34a,#4ade80)"
                                    : `linear-gradient(180deg,${orange},#ffb347)`,
                                  borderRadius: "999px",
                                }} />
                            </div>
                          )}
                        </div>

                        <div className="flex-1 pb-4" style={{ paddingTop: "3px" }}>
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-black" style={{ color: completado ? T?.text : T?.textFaint }}>
                              {paso.label}
                            </p>
                            {actual && pasoActual < 2 && (
                              <span className="inline-flex items-center gap-1 text-[8px] font-black px-1.5 py-0.5 rounded-full"
                                style={{ background: `rgba(244,121,32,0.12)`, color: orange, border: `1px solid rgba(244,121,32,0.3)` }}>
                                <span className="w-1 h-1 rounded-full" style={{ background: orange, animation: "pulse 1s infinite" }} /> Actual
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
                            {!completado && !actual && solicitud.estatus !== "No Resuelto" && (
                              <span className="text-[8px] font-semibold px-1.5 py-0.5 rounded-full"
                                style={{ background: isDark ? "rgba(255,255,255,0.04)" : "#f8fafc", color: T?.textFaint, border: `1px solid ${T?.border}` }}>
                                Pendiente
                              </span>
                            )}
                          </div>
                          <p className="text-xs mt-1" style={{ color: T?.textFaint }}>{paso.sub}</p>
                          {paso.fecha && i === 0 && (
                            <div className="mt-1.5 inline-flex items-center gap-1.5 px-2 py-1 rounded-lg"
                              style={{ background: isDark ? "rgba(255,255,255,0.04)" : "#f8fafc", border: `1px solid ${T?.border}` }}>
                              <Calendar size={9} style={{ color: orange }} />
                              <span className="text-[11px] font-bold" style={valStyle}>{paso.fecha}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {/* No Resuelto */}
                  {solicitud.estatus === "No Resuelto" && (
                    <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-[11px] font-semibold -mt-2"
                      style={{ background: isDark ? "rgba(220,38,38,0.1)" : "#fef2f2", color: "#dc2626", border: "1px solid rgba(220,38,38,0.25)" }}>
                      <XCircle size={13} /> Solicitud marcada como No Resuelta
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Exportar PDF */}
            <div style={card} className="rounded-2xl overflow-hidden"
              onMouseEnter={e => Object.assign(e.currentTarget.style, { boxShadow: isDark ? "0 12px 40px rgba(0,0,0,0.55)" : "0 12px 40px rgb(0,0,0,0.09)" })}
              onMouseLeave={e => Object.assign(e.currentTarget.style, { boxShadow: card.boxShadow })}>
              <div className="px-4 py-2.5 flex items-center gap-2" style={hdr}>
                <div className="w-1 h-3.5 rounded-full flex-shrink-0" style={{ background: "#dc2626" }} />
                <p className="text-[10px] font-black uppercase tracking-widest" style={labelStyle}>Exportar reporte</p>
              </div>
              <div className="px-5 py-5">
                <p className="text-[11px] mb-3" style={{ color: T?.textFaint }}>Genera un PDF con toda la información de esta solicitud.</p>
                <button
                  onClick={generarReportePrintView}
                  className="w-full flex items-center justify-center gap-2.5 py-3 rounded-xl text-xs font-bold transition-all active:scale-95"
                  style={{
                    background: isDark ? "rgba(220,38,38,0.12)" : "#fef2f2",
                    color: "#dc2626",
                    border: `1px solid ${isDark ? "rgba(220,38,38,0.25)" : "#fca5a5"}`,
                    letterSpacing: "0.03em",
                    transition: "all 0.18s ease",
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = isDark ? "rgba(220,38,38,0.2)" : "#fee2e2";
                    e.currentTarget.style.boxShadow = "0 4px 14px rgba(220,38,38,0.15)";
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = isDark ? "rgba(220,38,38,0.12)" : "#fef2f2";
                    e.currentTarget.style.boxShadow = "none";
                  }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z"/>
                    <polyline points="14 2 14 8 20 8"/>
                    <line x1="16" y1="13" x2="8" y2="13"/>
                    <line x1="16" y1="17" x2="8" y2="17"/>
                    <polyline points="10 9 9 9 8 9"/>
                  </svg>
                  Exportar PDF
                </button>
              </div>
            </div>

            {/* Acciones admin */}
            {esAdmin && (
              <div className="rounded-2xl overflow-hidden" style={card}>
                <div className="h-0.5" style={{ background: "linear-gradient(90deg,#16a34a,#4ade80,#16a34a)" }} />
                <div className="px-4 py-2.5 flex items-center justify-between" style={hdr}>
                  <div className="flex items-center gap-2">
                    <div className="w-1 h-3.5 rounded-full flex-shrink-0" style={{ background: "#16a34a" }} />
                    <p className="text-[10px] font-black uppercase tracking-widest" style={labelStyle}>Acciones del administrador</p>
                  </div>
                  {cerrado && (
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold"
                      style={{ background: isDark ? "rgba(22,163,74,0.15)" : "#dcfce7", color: "#16a34a", border: "1px solid rgba(22,163,74,0.3)" }}>
                      <CheckCircle2 size={10} /> Cerrado
                    </span>
                  )}
                </div>
                <div className="p-4 flex flex-col gap-3">
                  {guardado && (
                    <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold"
                      style={{ background: isDark ? "rgba(22,163,74,0.15)" : "#dcfce7", color: "#16a34a", border: isDark ? "1px solid rgba(22,163,74,0.3)" : "1px solid #86efac" }}>
                      <CheckCircle2 size={13} /> Estatus actualizado
                    </div>
                  )}
                  {!cerrado ? (
                    <div className="relative">
                      <button
                        onClick={() => setDropdown(d => !d)}
                        disabled={updating}
                        className="w-full flex items-center justify-between gap-2 py-2.5 px-4 rounded-xl text-sm font-bold transition-all hover:brightness-110 active:scale-95 disabled:opacity-50"
                        style={{ background: `linear-gradient(135deg,${orange},#d97400)`, color: "#fff", boxShadow: "0 3px 12px rgba(244,121,32,0.3)", minHeight: "48px" }}>
                        <span>{updating ? "Actualizando..." : "Cambiar estatus"}</span>
                        <ChevronDown size={16} className={dropdown ? "rotate-180" : ""} style={{ transition: "transform 0.2s" }} />
                      </button>
                      {dropdown && (
                        <div className="absolute top-full left-0 right-0 mt-1 rounded-xl overflow-hidden z-20"
                          style={{ background: isDark ? "#1c2030" : "#fff", border: `1px solid ${T?.border}`, boxShadow: "0 8px 24px rgba(0,0,0,0.15)" }}>
                          {ESTATUS_OPTS.map(opt => {
                            const m = ESTATUS_META[opt];
                            return (
                              <button key={opt} onClick={() => cambiarEstatus(opt)}
                                className="w-full flex items-center gap-2 px-4 py-2.5 text-[12px] font-bold transition-all hover:brightness-110 text-left"
                                style={{ color: m.color, borderBottom: `1px solid ${T?.border}` }}>
                                <m.icon size={13} /> {opt}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2 py-3">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center"
                        style={{ background: isDark ? "rgba(22,163,74,0.15)" : "#dcfce7", border: isDark ? "2px solid rgba(22,163,74,0.3)" : "2px solid #86efac" }}>
                        <CheckCircle2 size={20} style={{ color: "#16a34a" }} />
                      </div>
                      <p className="text-xs font-black" style={{ color: "#16a34a" }}>Solicitud cerrada</p>
                      <p className="text-[11px] text-center" style={{ color: T?.textFaint }}>No se pueden realizar más acciones</p>
                    </div>
                  )}
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
