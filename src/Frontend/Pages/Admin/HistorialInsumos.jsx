import { useState, useEffect, useCallback } from "react";
import { Inbox, FileDown, X } from "lucide-react";
import { apiFetch } from "../../Config/api";
import { useAutoRefresh } from "../../Config/useAutoRefresh";
import FiltrosToolbar from "../../Components/FiltrosToolbar";
import { useCardStyles } from "../../Components/Card";

const PRIORIDAD_COLOR = { Urgente: "#dc2626", Alta: "#ea580c", Media: "#ca8a04", Baja: "#16a34a" };
const ESTATUS_COLOR   = { Resuelto: "#16a34a", "En proceso": "#ea580c", "No Resuelto": "#dc2626", Pendiente: "#3b82f6" };
const ESTATUS_BG      = { Resuelto: "rgba(22,163,74,0.13)", "En proceso": "rgba(234,88,12,0.13)", "No Resuelto": "rgba(220,38,38,0.13)", Pendiente: "rgba(59,130,246,0.13)" };

const fmt = d => d ? new Date(d).toLocaleDateString("es-MX", { day: "2-digit", month: "2-digit", year: "numeric" }) : "-";

const LIMIT = 50;

export default function HistorialInsumos({ T, onVerSolicitud }) {
  const isDark = T.isDark;
  const { card, hdr } = useCardStyles(T);

  const [solicitudes, setSolicitudes] = useState([]);
  const [total,       setTotal]       = useState(0);
  const [pagina,      setPagina]      = useState(1);
  const [cargando,    setCargando]    = useState(false);
  const [filtros,     setFiltros]     = useState({ busqueda: "", estatus: "Todos", prioridad: "Todos", usuario: "Todos", area: "Todos" });
  const [modalReporte, setModalReporte] = useState(false);
  const [paramReporte, setParamReporte] = useState({ fecha_inicio: "", fecha_fin: "" });
  const [generando,    setGenerando]    = useState(false);

  const cargar = useCallback((pag = 1) => {
    setCargando(true);
    apiFetch(`/api/solicitudes?limit=${LIMIT}&page=${pag}`)
      .then(r => r.json())
      .then(d => {
        const lista = Array.isArray(d?.data) ? d.data : (Array.isArray(d) ? d : []);
        setSolicitudes(lista);
        setTotal(d?.total ?? lista.length);
      })
      .catch(() => {})
      .finally(() => setCargando(false));
  }, []);

  useEffect(() => { cargar(pagina); }, [pagina, cargar]);
  useAutoRefresh(() => cargar(pagina), 30000, [pagina]);

  const totalPaginas = Math.max(1, Math.ceil(total / LIMIT));
  const irPagina = p => { if (p >= 1 && p <= totalPaginas) setPagina(p); };

  const usuariosOpts = [{ value: "Todos", label: "Todos" }, ...Array.from(new Set(solicitudes.map(s => s.nombre_empleado).filter(Boolean))).map(v => ({ value: v, label: v }))];
  const areasOpts    = [{ value: "Todos", label: "Todos" }, ...Array.from(new Set(solicitudes.map(s => s.nombre_departamento).filter(Boolean))).map(v => ({ value: v, label: v }))];

  const camposFiltro = [
    { key: "busqueda",  label: "Búsqueda rápida", type: "search", placeholder: "Título o folio..." },
    { key: "estatus",   label: "Estatus",          type: "select", opts: ["Todos", "Pendiente", "En proceso", "Resuelto", "No Resuelto"] },
    { key: "prioridad", label: "Prioridad",         type: "select", opts: ["Todos", "Urgente", "Alta", "Media", "Baja"] },
    { key: "usuario",   label: "Usuario",           type: "select", opts: usuariosOpts },
    { key: "area",      label: "Área",              type: "select", opts: areasOpts },
  ];

  const limpiar = () => setFiltros({ busqueda: "", estatus: "Todos", prioridad: "Todos", usuario: "Todos", area: "Todos" });
  const hayFiltros = filtros.busqueda || filtros.estatus !== "Todos" || filtros.prioridad !== "Todos" || filtros.usuario !== "Todos" || filtros.area !== "Todos";

  const generarReporte = async () => {
    if (!paramReporte.fecha_inicio || !paramReporte.fecha_fin) return;
    setGenerando(true);
    let datos = [];
    try {
      const qs = new URLSearchParams({ fecha_inicio: paramReporte.fecha_inicio, fecha_fin: paramReporte.fecha_fin });
      const r  = await apiFetch(`/api/solicitudes/reporte?${qs}`);
      datos    = await r.json();
      if (!Array.isArray(datos)) datos = [];
    } catch { datos = []; }
    setGenerando(false);
    setModalReporte(false);

    const ahora   = new Date().toLocaleDateString("es-MX", { day: "2-digit", month: "long", year: "numeric" });
    const fmtDate = d => new Date(d + "T00:00:00").toLocaleDateString("es-MX", { day: "2-digit", month: "long", year: "numeric" });
    const periodo = `${fmtDate(paramReporte.fecha_inicio)} – ${fmtDate(paramReporte.fecha_fin)}`;

    const resueltos2  = datos.filter(s => s.estatus === "Resuelto").length;
    const enProceso2  = datos.filter(s => s.estatus === "En proceso").length;
    const pendientes2 = datos.filter(s => s.estatus === "Pendiente").length;
    const totalPiezas = datos.reduce((a, s) => a + (parseInt(s.total_piezas) || 0), 0);

    const ESTATUS_COLOR = { Resuelto: "#16a34a", "En proceso": "#ea580c", "No Resuelto": "#dc2626", Pendiente: "#3b82f6" };
    const ESTATUS_BG    = { Resuelto: "#dcfce7", "En proceso": "#ffedd5", "No Resuelto": "#fee2e2", Pendiente: "#dbeafe" };
    const PCOLOR_MAP    = { Urgente: "#dc2626", Alta: "#ea580c", Media: "#ca8a04", Baja: "#16a34a" };

    const filas = datos.map((s, i) => `
      <tr style="background:${i % 2 === 0 ? "#ffffff" : "#f9fafb"}">
        <td style="padding:7px 10px;font-family:monospace;font-weight:700;color:#F47920;font-size:11px;border-bottom:1px solid #e5e7eb">${s.folio_solicitud}</td>
        <td style="padding:7px 10px;font-size:11px;border-bottom:1px solid #e5e7eb">
          <div style="font-weight:600;color:#1D1D1B">${s.nombre_empleado || "-"}</div>
          <div style="font-size:10px;color:#6b7280">${s.nombre_departamento || "-"}</div>
        </td>
        <td style="padding:7px 10px;border-bottom:1px solid #e5e7eb">
          <span style="color:${PCOLOR_MAP[s.prioridad] || "#94a3b8"};font-weight:700;font-size:11px">● ${s.prioridad}</span>
        </td>
        <td style="padding:7px 10px;border-bottom:1px solid #e5e7eb">
          <span style="background:${ESTATUS_BG[s.estatus] || "#f3f4f6"};color:${ESTATUS_COLOR[s.estatus] || "#374151"};padding:2px 8px;border-radius:20px;font-size:10px;font-weight:700">${s.estatus}</span>
        </td>
        <td style="padding:7px 10px;font-size:11px;color:#374151;border-bottom:1px solid #e5e7eb;text-align:center">${s.total_insumos ?? "-"}</td>
        <td style="padding:7px 10px;font-size:11px;color:#374151;border-bottom:1px solid #e5e7eb;text-align:center">${s.total_piezas ?? "-"}</td>
        <td style="padding:7px 10px;font-size:11px;color:#6b7280;border-bottom:1px solid #e5e7eb;max-width:220px">
          <div style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${s.detalle_insumos || "-"}</div>
        </td>
        <td style="padding:7px 10px;font-size:11px;color:#6b7280;white-space:nowrap;border-bottom:1px solid #e5e7eb">${fmt(s.fecha)}</td>
      </tr>
    `).join("");

    const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8"/>
  <title>Reporte de Insumos - Precision Truck Parts</title>
  <style>
    @page { size: A4 landscape; margin: 18mm 15mm; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', Arial, sans-serif; background: #fff; color: #1D1D1B; }
    .header { display:flex; align-items:center; justify-content:space-between; border:2px solid #F47920; border-radius:10px; padding:14px 20px; margin-bottom:14px; }
    .header-left { display:flex; align-items:center; gap:16px; }
    .header-logo { height:52px; object-fit:contain; }
    .header-divider { width:2px; height:48px; background:linear-gradient(180deg,#F47920,#ffb347); border-radius:2px; }
    .header-title { font-size:18px; font-weight:900; color:#1D1D1B; }
    .header-sub   { font-size:10px; color:#6b7280; margin-top:2px; text-transform:uppercase; letter-spacing:0.1em; }
    .header-date  { font-size:11px; color:#6b7280; }
    .header-badge { display:inline-block; margin-top:4px; background:linear-gradient(135deg,#F47920,#d97400); color:#fff; font-size:10px; font-weight:700; padding:3px 10px; border-radius:20px; }
    .kpis { display:grid; grid-template-columns:repeat(4,1fr); gap:10px; margin-bottom:14px; }
    .kpi { border:1.5px solid #e5e7eb; border-radius:8px; padding:10px 14px; }
    .kpi-label { font-size:9px; font-weight:700; text-transform:uppercase; letter-spacing:0.1em; color:#9ca3af; margin-bottom:4px; }
    .kpi-val   { font-size:22px; font-weight:900; line-height:1; }
    .kpi-sub   { font-size:9px; color:#9ca3af; margin-top:3px; }
    .kpi-bar   { height:3px; border-radius:2px; margin-top:6px; background:#f3f4f6; overflow:hidden; }
    .kpi-bar-fill { height:100%; border-radius:2px; }
    .section-title { font-size:10px; font-weight:900; text-transform:uppercase; letter-spacing:0.12em; color:#6b7280; display:flex; align-items:center; gap:8px; margin-bottom:8px; }
    .section-title::before { content:''; display:inline-block; width:3px; height:14px; border-radius:2px; background:#F47920; }
    .table-wrap { border:1.5px solid #e5e7eb; border-radius:10px; overflow:hidden; }
    table { width:100%; border-collapse:collapse; }
    thead tr { background:#f9fafb; }
    th { padding:8px 10px; text-align:left; font-size:9px; font-weight:900; text-transform:uppercase; letter-spacing:0.1em; color:#9ca3af; border-bottom:2px solid #e5e7eb; white-space:nowrap; }
    td { vertical-align:middle; }
    .footer { margin-top:14px; display:flex; align-items:center; justify-content:space-between; border-top:1.5px solid #e5e7eb; padding-top:10px; }
    .footer-left  { font-size:9px; color:#9ca3af; }
    .footer-right { font-size:9px; color:#9ca3af; text-align:right; }
    .footer-brand { font-weight:900; color:#F47920; }
    @media print { body { -webkit-print-color-adjust:exact; print-color-adjust:exact; } }
  </style>
</head>
<body>
  <div class="header">
    <div class="header-left">
      <img src="/assets/img/logo negro.png" class="header-logo" alt="PTP"/>
      <div class="header-divider"></div>
      <div>
        <div class="header-title">Reporte de Solicitudes de Insumos</div>
        <div class="header-sub">Precision Truck Parts · HelpDesk</div>
      </div>
    </div>
    <div style="text-align:right">
      <div class="header-date">Generado el ${ahora}</div>
      <div class="header-date" style="margin-top:4px;font-weight:700;color:#F47920">${periodo}</div>
      <span class="header-badge">${datos.length} registro${datos.length !== 1 ? "s" : ""}</span>
    </div>
  </div>
  <div class="kpis">
    <div class="kpi">
      <div class="kpi-label">Total del período</div>
      <div class="kpi-val" style="color:#F47920">${datos.length}</div>
      <div class="kpi-bar"><div class="kpi-bar-fill" style="width:100%;background:#F47920"></div></div>
    </div>
    <div class="kpi">
      <div class="kpi-label">Resueltos</div>
      <div class="kpi-val" style="color:#16a34a">${resueltos2}</div>
      <div class="kpi-sub">${datos.length > 0 ? Math.round(resueltos2 / datos.length * 100) : 0}% del total</div>
      <div class="kpi-bar"><div class="kpi-bar-fill" style="width:${datos.length > 0 ? Math.round(resueltos2 / datos.length * 100) : 0}%;background:#16a34a"></div></div>
    </div>
    <div class="kpi">
      <div class="kpi-label">En Proceso</div>
      <div class="kpi-val" style="color:#ea580c">${enProceso2}</div>
      <div class="kpi-sub">${datos.length > 0 ? Math.round(enProceso2 / datos.length * 100) : 0}% del total</div>
      <div class="kpi-bar"><div class="kpi-bar-fill" style="width:${datos.length > 0 ? Math.round(enProceso2 / datos.length * 100) : 0}%;background:#ea580c"></div></div>
    </div>
    <div class="kpi">
      <div class="kpi-label">Total piezas</div>
      <div class="kpi-val" style="color:#3b82f6">${totalPiezas}</div>
      <div class="kpi-sub">${pendientes2} solicitudes pendientes</div>
      <div class="kpi-bar"><div class="kpi-bar-fill" style="width:100%;background:#3b82f6"></div></div>
    </div>
  </div>
  <div class="section-title">Detalle de Solicitudes</div>
  <div class="table-wrap">
    <table>
      <thead><tr>
        <th>Folio</th><th>Empleado / Área</th><th>Prioridad</th><th>Estatus</th>
        <th style="text-align:center">Insumos</th><th style="text-align:center">Piezas</th>
        <th>Detalle</th><th>Fecha</th>
      </tr></thead>
      <tbody>${filas}</tbody>
    </table>
  </div>
  <div class="footer">
    <div class="footer-left"><span class="footer-brand">Precision Truck Parts</span> · Sistema HelpDesk</div>
    <div class="footer-right">Documento generado automáticamente · ${ahora}</div>
  </div>
</body>
</html>`;

    const win = window.open("", "_blank", "width=1200,height=800");
    if (!win) {
      setModalReporte(false);
      setGenerando(false);
      // Mostrar aviso en UI en lugar de alert()
      const aviso = document.createElement("div");
      aviso.style.cssText = "position:fixed;top:16px;left:50%;transform:translateX(-50%);z-index:9999;background:#1D1D1B;color:#fff;padding:12px 20px;border-radius:10px;font-size:13px;font-weight:700;border-left:4px solid #F47920;box-shadow:0 4px 20px rgba(0,0,0,0.4);";
      aviso.textContent = "El navegador bloqueó la ventana emergente. Permite las ventanas emergentes para este sitio e intenta de nuevo.";
      document.body.appendChild(aviso);
      setTimeout(() => aviso.remove(), 5000);
      return;
    }
    win.document.write(html);
    win.document.close();
    win.onload = () => { win.focus(); win.print(); };
  };

  const filtrados = solicitudes.filter(s => {
    if (filtros.busqueda) {
      const q = filtros.busqueda.toLowerCase();
      if (!s.folio_solicitud?.toLowerCase().includes(q) && !s.titulo?.toLowerCase().includes(q)) return false;
    }
    if (filtros.estatus   !== "Todos" && s.estatus           !== filtros.estatus)   return false;
    if (filtros.prioridad !== "Todos" && s.prioridad         !== filtros.prioridad) return false;
    if (filtros.usuario   !== "Todos" && s.nombre_empleado   !== filtros.usuario)   return false;
    if (filtros.area      !== "Todos" && s.nombre_departamento !== filtros.area)    return false;
    return true;
  });

  // KPIs
  const total_sol    = solicitudes.length;
  const resueltos    = solicitudes.filter(s => s.estatus === "Resuelto").length;
  const enProceso    = solicitudes.filter(s => s.estatus === "En proceso").length;
  const pendientes   = solicitudes.filter(s => s.estatus === "Pendiente").length;

  const kpis = [
    { label: "Total",       val: total_sol, color: T.orange  },
    { label: "Pendientes",  val: pendientes, color: "#3b82f6" },
    { label: "En proceso",  val: enProceso,  color: "#ea580c" },
    { label: "Resueltos",   val: resueltos,  color: "#16a34a" },
  ];

  return (
    <>
    <div className="flex flex-col overflow-y-auto" style={{ background: T.bg }}>
      <div className="w-full p-2 sm:p-3 flex flex-col gap-2 sm:gap-3">

        {/* KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {kpis.map(({ label, val, color }) => (
            <div key={label} className="rounded-xl p-3 flex flex-col gap-1 relative overflow-hidden" style={card}>
              <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: `linear-gradient(90deg,${color},${color}33)` }} />
              <p className="text-[10px] font-black uppercase tracking-wider" style={{ color: T.textMuted }}>{label}</p>
              <span className="text-2xl font-black leading-none" style={{ color }}>{val}</span>
              <div className="h-1 rounded-full overflow-hidden" style={{ background: T.border }}>
                <div className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${total_sol > 0 ? Math.round(val / total_sol * 100) : 0}%`, background: color }} />
              </div>
            </div>
          ))}
        </div>

        {/* Filtros */}
        <FiltrosToolbar
          campos={camposFiltro}
          valores={filtros}
          onChange={(key, val) => setFiltros(prev => ({ ...prev, [key]: val }))}
          onLimpiar={limpiar}
          T={T}
        >
          <button onClick={() => setModalReporte(true)}
            style={{ display: "flex", alignItems: "center", gap: "5px", padding: "5px 12px", borderRadius: "4px",
              fontSize: "12px", fontWeight: 700, background: "#F47920", color: "#fff", border: "none", cursor: "pointer",
              whiteSpace: "nowrap", transition: "filter 0.15s" }}
            onMouseEnter={e => e.currentTarget.style.filter = "brightness(1.08)"}
            onMouseLeave={e => e.currentTarget.style.filter = "none"}>
            <FileDown size={13} strokeWidth={2.5} /> Generar Reporte
          </button>
        </FiltrosToolbar>

        {/* Tabla */}
        <div className="rounded-xl overflow-hidden flex flex-col" style={{ ...card, minHeight: "300px" }}>
          <div className="flex items-center justify-between px-4 py-3 flex-shrink-0" style={hdr}>
            <div className="flex items-center gap-1.5">
              <div className="w-0.5 h-3.5 rounded-full" style={{ background: T.orange }} />
              <p className="text-xs font-black uppercase tracking-widest" style={{ color: T.textMuted }}>Solicitudes de Insumos</p>
            </div>
            <div className="flex items-center gap-2">
              {cargando && (
                <svg className="animate-spin" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={T.orange} strokeWidth="2.5"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
              )}
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full"
                style={{ background: T.bg, color: T.textMuted, border: `1px solid ${T.border}` }}>
                {filtrados.length} resultado{filtrados.length !== 1 ? "s" : ""} · pág. {pagina}/{totalPaginas}
              </span>
            </div>
          </div>

          <div className="overflow-x-auto flex-1">
            {/* Mobile: tarjetas */}
            <div className="flex flex-col gap-2 p-3 sm:hidden">
              {filtrados.length === 0
                ? <div className="flex flex-col items-center justify-center py-8 gap-2">
                    <Inbox size={20} style={{ color: T.textFaint }} />
                    <p className="text-xs font-bold" style={{ color: T.textMuted }}>{hayFiltros ? "Sin resultados" : "No hay solicitudes"}</p>
                  </div>
                : filtrados.map(s => (
                  <div key={s.id_solicitud}
                    className="rounded-xl p-3 flex flex-col gap-2 cursor-pointer active:scale-[0.98] transition-all"
                    style={{ background: isDark ? "rgba(255,255,255,0.04)" : T.surfaceAlt, border: `1px solid ${T.border}` }}
                    onClick={() => onVerSolicitud?.(s)}>
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-[11px] font-black" style={{ color: T.orange }}>{s.folio_solicitud}</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold"
                        style={{ background: ESTATUS_BG[s.estatus] || "rgba(148,163,184,0.13)", color: ESTATUS_COLOR[s.estatus] || T.textMuted }}>
                        {s.estatus}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold" style={{ color: T.text }}>{s.nombre_empleado || "-"}</span>
                      <span className="text-[11px] font-bold" style={{ color: PRIORIDAD_COLOR[s.prioridad] || T.textMuted }}>{s.prioridad}</span>
                    </div>
                    <span className="text-[10px]" style={{ color: T.textFaint }}>{s.nombre_departamento || "-"} · {fmt(s.fecha)}</span>
                  </div>
                ))
              }
            </div>

            {/* Desktop: tabla */}
            <div className="hidden sm:block">
              <table className="w-full border-collapse" style={{ minWidth: "800px" }}>
                <thead className="sticky top-0 z-10">
                  <tr style={{ background: isDark ? "#1c2030" : T.surfaceAlt }}>
                    {["Folio", "Empleado / Área", "Prioridad", "Estatus", "Insumos", "Piezas", "Fecha", ""].map((col, i) => (
                      <th key={i} className="text-left px-3 py-2 text-[10px] font-black uppercase tracking-widest whitespace-nowrap"
                        style={{ color: T.textMuted, borderBottom: `1px solid ${T.border}` }}>
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtrados.length === 0 ? (
                    <tr><td colSpan={8}>
                      <div className="flex flex-col items-center justify-center py-12 gap-2">
                        <Inbox size={22} style={{ color: T.textFaint }} />
                        <p className="text-xs font-bold" style={{ color: T.textMuted }}>
                          {hayFiltros ? "Sin resultados" : "No hay solicitudes registradas"}
                        </p>
                      </div>
                    </td></tr>
                  ) : filtrados.map((s, i) => {
                    const bgRow = i % 2 === 0 ? (isDark ? "#141720" : T.surface) : (isDark ? "#1c2030" : T.surfaceAlt);
                    return (
                      <tr key={s.id_solicitud}
                        style={{ background: bgRow, borderBottom: `1px solid ${T.border}` }}
                        onMouseEnter={e => e.currentTarget.style.background = isDark ? "rgba(244,121,32,0.05)" : "rgba(244,121,32,0.03)"}
                        onMouseLeave={e => e.currentTarget.style.background = bgRow}>
                        <td className="px-3 py-2">
                          <span className="font-mono text-[10px] font-black" style={{ color: T.orange }}>{s.folio_solicitud}</span>
                        </td>
                        <td className="px-3 py-2">
                          <span className="block text-[11px] font-semibold" style={{ color: T.text }}>{s.nombre_empleado || "-"}</span>
                          <span className="block text-[10px]" style={{ color: T.textMuted }}>{s.nombre_departamento || "-"}</span>
                        </td>
                        <td className="px-3 py-2">
                          <span className="flex items-center gap-1 text-[11px] font-bold">
                            <span className="w-1.5 h-1.5 rounded-full" style={{ background: PRIORIDAD_COLOR[s.prioridad] || "#94a3b8" }} />
                            <span style={{ color: PRIORIDAD_COLOR[s.prioridad] || T.textMuted }}>{s.prioridad}</span>
                          </span>
                        </td>
                        <td className="px-3 py-2">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold whitespace-nowrap"
                            style={{ background: ESTATUS_BG[s.estatus] || "rgba(148,163,184,0.13)", color: ESTATUS_COLOR[s.estatus] || T.textMuted }}>
                            {s.estatus}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-[11px]" style={{ color: T.textMuted }}>{s.total_insumos ?? "-"}</td>
                        <td className="px-3 py-2 text-[11px]" style={{ color: T.textMuted }}>{s.total_piezas ?? "-"}</td>
                        <td className="px-3 py-2 text-[10px] whitespace-nowrap" style={{ color: T.textMuted }}>{fmt(s.fecha)}</td>
                        <td className="px-3 py-2">
                          <button
                            onClick={() => onVerSolicitud?.(s)}
                            className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold transition-all hover:brightness-110 active:scale-95"
                            style={{ background: "rgba(244,121,32,0.08)", color: T.orange, border: "1px solid rgba(244,121,32,0.2)" }}>
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
        </div>

        {/* Paginación */}
        {totalPaginas > 1 && (
          <div className="flex items-center justify-center gap-2 py-2">
            <button onClick={() => irPagina(1)} disabled={pagina === 1}
              className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-all hover:brightness-110 disabled:opacity-30"
              style={{ background: isDark ? "rgba(255,255,255,0.06)" : T.surfaceAlt, color: T.textMuted, border: `1px solid ${T.border}` }}>«</button>
            <button onClick={() => irPagina(pagina - 1)} disabled={pagina === 1}
              className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-all hover:brightness-110 disabled:opacity-30"
              style={{ background: isDark ? "rgba(255,255,255,0.06)" : T.surfaceAlt, color: T.textMuted, border: `1px solid ${T.border}` }}>‹ Anterior</button>
            {Array.from({ length: Math.min(5, totalPaginas) }, (_, i) => {
              const start = Math.max(1, Math.min(pagina - 2, totalPaginas - 4));
              const p = start + i;
              if (p > totalPaginas) return null;
              return (
                <button key={p} onClick={() => irPagina(p)}
                  className="w-8 h-8 rounded-lg text-[11px] font-bold transition-all hover:brightness-110"
                  style={{ background: p === pagina ? T.orange : (isDark ? "rgba(255,255,255,0.06)" : T.surfaceAlt), color: p === pagina ? "#fff" : T.textMuted, border: `1px solid ${p === pagina ? T.orange : T.border}` }}>
                  {p}
                </button>
              );
            })}
            <button onClick={() => irPagina(pagina + 1)} disabled={pagina === totalPaginas}
              className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-all hover:brightness-110 disabled:opacity-30"
              style={{ background: isDark ? "rgba(255,255,255,0.06)" : T.surfaceAlt, color: T.textMuted, border: `1px solid ${T.border}` }}>Siguiente ›</button>
            <button onClick={() => irPagina(totalPaginas)} disabled={pagina === totalPaginas}
              className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-all hover:brightness-110 disabled:opacity-30"
              style={{ background: isDark ? "rgba(255,255,255,0.06)" : T.surfaceAlt, color: T.textMuted, border: `1px solid ${T.border}` }}>»</button>
          </div>
        )}

      </div>
    </div>

    {modalReporte && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ background: "rgba(0,0,0,0.55)" }}
        onClick={() => setModalReporte(false)}>
        <div className="rounded-2xl w-full max-w-sm flex flex-col gap-4 p-5"
          style={{ background: isDark ? "#161B22" : "#fff", border: `1px solid ${T.border}`, boxShadow: "0 20px 60px rgba(0,0,0,0.4)" }}
          onClick={e => e.stopPropagation()}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-1 h-4 rounded-full" style={{ background: T.orange }} />
              <span className="text-sm font-black" style={{ color: T.text }}>Parámetros del Reporte</span>
            </div>
            <button onClick={() => setModalReporte(false)}
              className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: T.surfaceAlt, color: T.textMuted, border: `1px solid ${T.border}` }}>
              <X size={13} />
            </button>
          </div>
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-bold uppercase tracking-wider" style={{ color: T.textMuted }}>Fecha inicio</label>
              <input type="date" value={paramReporte.fecha_inicio}
                onChange={e => setParamReporte(p => ({ ...p, fecha_inicio: e.target.value }))}
                className="rounded-lg px-3 py-2 text-sm"
                style={{ background: T.surfaceAlt, border: `1px solid ${T.border}`, color: T.text, outline: "none" }} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-bold uppercase tracking-wider" style={{ color: T.textMuted }}>Fecha fin</label>
              <input type="date" value={paramReporte.fecha_fin}
                onChange={e => setParamReporte(p => ({ ...p, fecha_fin: e.target.value }))}
                className="rounded-lg px-3 py-2 text-sm"
                style={{ background: T.surfaceAlt, border: `1px solid ${T.border}`, color: T.text, outline: "none" }} />
            </div>
          </div>
          <button onClick={generarReporte} disabled={!paramReporte.fecha_inicio || !paramReporte.fecha_fin || generando}
            className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all hover:brightness-110 active:scale-95 disabled:opacity-50"
            style={{ background: `linear-gradient(135deg,${T.orange},#d97400)`, color: "#fff" }}>
            {generando
              ? <><svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg> Generando...</>
              : <><FileDown size={14} /> Generar Reporte</>}
          </button>
        </div>
      </div>
    )}
  </>
  );
}
