import { useState, useEffect, useCallback, useRef } from "react";
import { Inbox, FileDown } from "lucide-react";
import { apiFetch } from "../../Config/api";
import { abrirReporteLista } from "../PrintReportePage";
import { useAutoRefresh } from "../../Config/useAutoRefresh";
import FiltrosToolbar from "../../Components/FiltrosToolbar";
import { useCardStyles } from "../../Components/Card";
import VistaSolicitud from "../Usuario/VistaSolicitud";
import Modal from "../../Components/Modal";

const PRIORIDAD_COLOR = { Urgente: "#dc2626", Alta: "#ea580c", Media: "#ca8a04", Baja: "#16a34a" };
const ESTATUS_COLOR   = { Resuelto: "#16a34a", "En proceso": "#ea580c", "No Resuelto": "#dc2626", Pendiente: "#3b82f6", Rechazado: "#6b7280" };
const ESTATUS_BG      = { Resuelto: "rgba(22,163,74,0.13)", "En proceso": "rgba(234,88,12,0.13)", "No Resuelto": "rgba(220,38,38,0.13)", Pendiente: "rgba(59,130,246,0.13)", Rechazado: "rgba(107,114,128,0.13)" };

const fmt = d => d ? new Date(d).toLocaleDateString("es-MX", { day: "2-digit", month: "2-digit", year: "numeric" }) : "-";

const LIMIT = 50;
const FILTROS_INIT = { busqueda: "", estatus: "Todos", prioridad: "Todos", area: "Todos", fecha_inicio: "", fecha_fin: "" };

export default function HistorialInsumos({ T }) {
  const isDark = T.isDark;
  const { card, hdr } = useCardStyles(T);

  const [solicitudes,   setSolicitudes]   = useState([]);
  const [total,         setTotal]         = useState(0);
  const [pagina,        setPagina]        = useState(1);
  const [cargando,      setCargando]      = useState(false);
  const [filtros,       setFiltros]       = useState(FILTROS_INIT);
  const [areas,         setAreas]         = useState([]);
  const [metricas,      setMetricas]      = useState({ total: 0, pendientes: 0, en_proceso: 0, resueltos: 0, no_resueltos: 0, rechazados: 0 });
  const [solicitudVer,  setSolicitudVer]  = useState(null);
  const [modalReporte,  setModalReporte]  = useState(false);
  const [paramReporte,  setParamReporte]  = useState({ fecha_inicio: "", fecha_fin: "" });
  const [generando,     setGenerando]     = useState(false);

  const debounceRef = useRef(null);

  // Cargar áreas para el select (una sola vez)
  useEffect(() => {
    apiFetch("/api/solicitudes?limit=1&page=1")
      .then(r => r.json())
      .catch(() => null);
    // Obtener áreas únicas desde el backend con un fetch amplio
    apiFetch("/api/solicitudes?limit=500&page=1")
      .then(r => r.json())
      .then(d => {
        const lista = Array.isArray(d?.data) ? d.data : [];
        const unicas = [...new Set(lista.map(s => s.nombre_departamento).filter(Boolean))];
        setAreas(unicas);
      })
      .catch(() => {});
  }, []);

  const cargarMetricas = useCallback(() => {
    apiFetch("/api/solicitudes/metricas")
      .then(r => r.json())
      .then(d => { if (d?.total !== undefined) setMetricas(d); })
      .catch(() => {});
  }, []);

  const cargar = useCallback((pag = 1, filt = filtros) => {
    setCargando(true);
    const qs = new URLSearchParams({ limit: LIMIT, page: pag });
    if (filt.estatus      && filt.estatus      !== "Todos") qs.set("estatus",      filt.estatus);
    if (filt.prioridad    && filt.prioridad    !== "Todos") qs.set("prioridad",    filt.prioridad);
    if (filt.area         && filt.area         !== "Todos") qs.set("area",         filt.area);
    if (filt.busqueda)                                      qs.set("busqueda",     filt.busqueda);
    if (filt.fecha_inicio)                                  qs.set("fecha_inicio", filt.fecha_inicio);
    if (filt.fecha_fin)                                     qs.set("fecha_fin",    filt.fecha_fin);
    apiFetch(`/api/solicitudes?${qs}`)
      .then(r => r.json())
      .then(d => {
        setSolicitudes(Array.isArray(d?.data) ? d.data : []);
        setTotal(d?.total ?? 0);
      })
      .catch(() => {})
      .finally(() => setCargando(false));
  }, [filtros]);

  // Cuando cambian filtros distintos a búsqueda de texto → recarga inmediata en pág 1
  useEffect(() => {
    setPagina(1);
    cargar(1, filtros);
    cargarMetricas();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtros.estatus, filtros.prioridad, filtros.area, filtros.fecha_inicio, filtros.fecha_fin]);

  // Búsqueda de texto con debounce 350ms
  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setPagina(1);
      cargar(1, filtros);
    }, 350);
    return () => clearTimeout(debounceRef.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtros.busqueda]);

  // Cambio de página
  useEffect(() => {
    cargar(pagina, filtros);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagina]);

  useAutoRefresh(() => { cargar(pagina, filtros); cargarMetricas(); }, 30000, [pagina]);

  const totalPaginas = Math.max(1, Math.ceil(total / LIMIT));
  const irPagina = p => { if (p >= 1 && p <= totalPaginas) setPagina(p); };

  const setFiltro = (key, val) => setFiltros(prev => ({ ...prev, [key]: val }));
  const limpiar   = () => setFiltros(FILTROS_INIT);
  const hayFiltros = filtros.busqueda || filtros.estatus !== "Todos" || filtros.prioridad !== "Todos" || filtros.area !== "Todos" || filtros.fecha_inicio || filtros.fecha_fin;

  const areasOpts = [{ value: "Todos", label: "Todos" }, ...areas.map(v => ({ value: v, label: v }))];

  const camposFiltro = [
    { key: "busqueda",     label: "Búsqueda",   type: "search", placeholder: "Folio o empleado..." },
    { key: "estatus",      label: "Estatus",     type: "select", opts: ["Todos", "Pendiente", "En proceso", "Resuelto", "No Resuelto", "Rechazado"] },
    { key: "prioridad",    label: "Prioridad",   type: "select", opts: ["Todos", "Urgente", "Alta", "Media", "Baja"] },
    { key: "area",         label: "Área",        type: "select", opts: areasOpts },
    { key: "fecha_inicio", label: "Desde",       type: "date" },
    { key: "fecha_fin",    label: "Hasta",       type: "date" },
  ];

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
    const fmtDate = d => new Date(d + "T00:00:00").toLocaleDateString("es-MX", { day: "2-digit", month: "long", year: "numeric" });
    abrirReporteLista({
      tipo: "insumos",
      periodo: `${fmtDate(paramReporte.fecha_inicio)} – ${fmtDate(paramReporte.fecha_fin)}`,
      datos,
    });
  };

  const totalKpi = Number(metricas.total ?? 0);

  if (solicitudVer) return (
    <VistaSolicitud T={T} id_solicitud={solicitudVer.id_solicitud} esAdmin onBack={() => setSolicitudVer(null)} />
  );

  return (
    <>
    <div className="flex flex-col h-full overflow-hidden" style={{ background: T.bg }}>
      <div className="w-full p-2 sm:p-3 flex flex-col gap-2 sm:gap-3 h-full overflow-hidden">

        {/* ── MÉTRICAS ── */}
        <div className="grid grid-cols-12 gap-3">

          {/* Distribución por estatus */}
          <div className="col-span-12 sm:col-span-6 lg:col-span-3 rounded-xl overflow-hidden relative" style={card}>
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
              style={{ background: `radial-gradient(circle at 80% 20%, ${T.orange}, transparent 60%)` }} />
            <div className="h-0.5" style={{ background: `linear-gradient(90deg,${T.orange},${T.orange}33)` }} />
            <div className="p-3 flex flex-col gap-2">
              <div className="flex items-center gap-1.5">
                <div className="w-1 h-3 rounded-full" style={{ background: T.orange }} />
                <p className="text-xs font-black uppercase tracking-widest" style={{ color: T.textMuted }}>Distribución</p>
              </div>
              <div className="flex items-end gap-2">
                <span className="text-3xl font-black leading-none" style={{ color: T.orange }}>{totalKpi}</span>
                <span className="text-[11px] font-semibold mb-0.5" style={{ color: T.textMuted }}>solicitudes totales</span>
              </div>
              <div className="flex flex-col gap-1.5 pt-1">
                {[
                  { label: "Resueltos",    val: Number(metricas.resueltos    ?? 0), color: "#16a34a" },
                  { label: "En proceso",   val: Number(metricas.en_proceso   ?? 0), color: "#ea580c" },
                  { label: "Pendientes",   val: Number(metricas.pendientes   ?? 0), color: "#3b82f6" },
                  { label: "No Resueltos", val: Number(metricas.no_resueltos ?? 0), color: "#dc2626" },
                  { label: "Rechazados",   val: Number(metricas.rechazados   ?? 0), color: "#6b7280" },
                ].map(({ label, val, color }) => {
                  const pct = totalKpi > 0 ? Math.round(val / totalKpi * 100) : 0;
                  return (
                    <div key={label} className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: color }} />
                      <span className="text-[10px] font-semibold w-20 flex-shrink-0" style={{ color: T.text }}>{label}</span>
                      <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: T.border }}>
                        <div className="h-full rounded-full transition-all duration-700"
                          style={{ width: `${pct > 0 ? Math.max(pct, 4) : 0}%`, background: color }} />
                      </div>
                      <span className="text-[10px] font-black w-4 text-right flex-shrink-0" style={{ color }}>{val}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* KPIs numéricos */}
          <div className="col-span-12 sm:col-span-6 lg:col-span-3 grid grid-cols-2 gap-2">
            {[
              { label: "Total",        val: totalKpi,                                  color: T.orange,  sub: `${Number(metricas.pendientes ?? 0)} pendientes`,    subColor: "#3b82f6" },
              { label: "Pendientes",   val: Number(metricas.pendientes  ?? 0),         color: "#3b82f6", sub: `${totalKpi > 0 ? Math.round(Number(metricas.pendientes ?? 0) / totalKpi * 100) : 0}% del total`, subColor: T.textFaint },
              { label: "Resueltos",    val: Number(metricas.resueltos   ?? 0),         color: "#16a34a", sub: `${totalKpi > 0 ? Math.round(Number(metricas.resueltos ?? 0) / totalKpi * 100) : 0}% tasa`,      subColor: "#16a34a" },
              { label: "Sin Resolver", val: Number(metricas.no_resueltos ?? 0),        color: "#dc2626", sub: `${totalKpi > 0 ? Math.round(Number(metricas.no_resueltos ?? 0) / totalKpi * 100) : 0}% del total`, subColor: "#dc2626" },
            ].map(({ label, val, color, sub, subColor }) => (
              <div key={label} className="rounded-xl p-2 flex flex-col gap-1 relative overflow-hidden" style={card}>
                <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: `linear-gradient(90deg,${color},${color}33)` }} />
                <p className="text-[10px] font-black uppercase tracking-wider leading-tight" style={{ color: T.textMuted }}>{label}</p>
                <span className="text-2xl font-black leading-none" style={{ color }}>{val}</span>
                <div className="h-1 rounded-full overflow-hidden" style={{ background: T.border }}>
                  <div className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${totalKpi > 0 ? Math.round(val / totalKpi * 100) : 0}%`, background: color, boxShadow: `0 0 4px ${color}44` }} />
                </div>
                <span className="text-[10px] font-semibold" style={{ color: subColor }}>{sub}</span>
              </div>
            ))}
          </div>

          {/* Tasa de resolución */}
          <div className="col-span-12 sm:col-span-6 lg:col-span-3 rounded-xl overflow-hidden relative" style={card}>
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
              style={{ background: `radial-gradient(circle at 20% 80%, #16a34a, transparent 60%)` }} />
            <div className="h-0.5" style={{ background: "linear-gradient(90deg,#16a34a,#16a34a33)" }} />
            <div className="p-3 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <div className="w-1 h-3 rounded-full" style={{ background: "#16a34a" }} />
                  <p className="text-xs font-black uppercase tracking-widest" style={{ color: T.textMuted }}>Resolución</p>
                </div>
                {(() => {
                  const resueltos = Number(metricas.resueltos ?? 0);
                  const cerrados  = resueltos + Number(metricas.no_resueltos ?? 0) + Number(metricas.rechazados ?? 0);
                  const pct = cerrados > 0 ? Math.round(resueltos / cerrados * 100) : 0;
                  const label = pct >= 75 ? "Excelente" : pct >= 50 ? "Regular" : "Bajo";
                  const color = pct >= 75 ? "#16a34a" : pct >= 50 ? "#ca8a04" : "#dc2626";
                  return (
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full"
                      style={{ background: `${color}15`, color, border: `1px solid ${color}30` }}>
                      {label}
                    </span>
                  );
                })()}
              </div>
              {(() => {
                const resueltos   = Number(metricas.resueltos    ?? 0);
                const noResueltos = Number(metricas.no_resueltos ?? 0);
                const rechazados  = Number(metricas.rechazados   ?? 0);
                const enProceso   = Number(metricas.en_proceso   ?? 0);
                const cerrados    = resueltos + noResueltos + rechazados;
                const pct         = cerrados > 0 ? Math.round(resueltos / cerrados * 100) : 0;
                const color       = pct >= 75 ? "#16a34a" : pct >= 50 ? "#ca8a04" : "#dc2626";
                return (
                  <>
                    <div className="flex items-end gap-1">
                      <span className="text-3xl font-black leading-none" style={{ color }}>{pct}%</span>
                      <span className="text-[11px] font-semibold mb-0.5" style={{ color: T.textMuted }}>tasa de éxito</span>
                    </div>
                    <div className="h-2 rounded-full overflow-hidden" style={{ background: T.border }}>
                      <div className="h-full rounded-full transition-all duration-1000"
                        style={{ width: `${pct}%`, background: `linear-gradient(90deg,${color},${color}88)`, boxShadow: `0 0 6px ${color}55` }} />
                    </div>
                    <div className="grid grid-cols-2 gap-1.5 pt-1">
                      <div className="rounded-lg p-1.5" style={{ background: isDark ? "rgba(234,88,12,0.1)" : "#fff7ed", border: "1px solid rgba(234,88,12,0.2)" }}>
                        <p className="text-[9px] font-black uppercase" style={{ color: "#ea580c" }}>En proceso</p>
                        <p className="text-base font-black" style={{ color: "#ea580c" }}>{enProceso}</p>
                      </div>
                      <div className="rounded-lg p-1.5" style={{ background: isDark ? "rgba(107,114,128,0.1)" : "#f9fafb", border: "1px solid rgba(107,114,128,0.2)" }}>
                        <p className="text-[9px] font-black uppercase" style={{ color: "#6b7280" }}>Rechazados</p>
                        <p className="text-base font-black" style={{ color: "#6b7280" }}>{rechazados}</p>
                      </div>
                    </div>
                    <div className="pt-2" style={{ borderTop: `1px solid ${T.border}` }}>
                      <p className="text-[10px]" style={{ color: T.textFaint }}>{resueltos} resueltas de {cerrados} cerradas · {noResueltos} sin resolver</p>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>

          {/* Prioridad + Top Áreas */}
          <div className="col-span-12 sm:col-span-6 lg:col-span-3 rounded-xl overflow-hidden flex flex-col" style={card}>
            <div className="px-3 py-2 flex items-center gap-1.5" style={hdr}>
              <div className="w-1 h-3 rounded-full" style={{ background: T.orange }} />
              <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: T.textMuted }}>Por Prioridad</p>
            </div>
            <div className="px-3 pt-2 pb-1 flex flex-col gap-1.5">
              {[{ l: "Urgente", c: "#dc2626" }, { l: "Alta", c: "#ea580c" }, { l: "Media", c: "#ca8a04" }, { l: "Baja", c: "#16a34a" }].map(({ l, c }) => {
                const n = solicitudes.filter(s => s.prioridad === l).length;
                const pct = solicitudes.length > 0 ? Math.round(n / solicitudes.length * 100) : 0;
                return (
                  <div key={l} className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: c }} />
                    <span className="text-[10px] font-semibold w-12 flex-shrink-0" style={{ color: T.text }}>{l}</span>
                    <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: isDark ? "rgba(255,255,255,0.06)" : `${c}15` }}>
                      <div className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${pct > 0 ? Math.max(pct, 4) : 0}%`, background: c }} />
                    </div>
                    <span className="text-[10px] font-black w-4 text-right flex-shrink-0" style={{ color: c }}>{n}</span>
                  </div>
                );
              })}
            </div>
            <div className="mx-3 my-1.5" style={{ height: "1px", background: T.border }} />
            <div className="px-3 py-1 flex items-center gap-1.5">
              <div className="w-1 h-3 rounded-full" style={{ background: T.orange }} />
              <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: T.textMuted }}>Top Áreas</p>
            </div>
            <div className="px-3 pb-2 flex flex-col gap-1.5">
              {(() => {
                const conteo = {};
                solicitudes.forEach(s => { if (s.nombre_departamento) conteo[s.nombre_departamento] = (conteo[s.nombre_departamento] || 0) + 1; });
                const top = Object.entries(conteo).sort((a, b) => b[1] - a[1]).slice(0, 3);
                const maxN = top[0]?.[1] || 1;
                const rankColors = [T.orange, "#3b82f6", "#8b5cf6"];
                return top.length === 0
                  ? <p className="text-[9px]" style={{ color: T.textFaint }}>Sin datos</p>
                  : top.map(([area, n], idx) => (
                    <div key={area} className="flex items-center gap-1.5">
                      <span className="text-[9px] font-black w-3 flex-shrink-0 text-center" style={{ color: rankColors[idx] }}>#{idx + 1}</span>
                      <span className="text-[10px] font-semibold flex-1 truncate" style={{ color: T.text }}>{area}</span>
                      <div className="w-10 h-1.5 rounded-full overflow-hidden flex-shrink-0" style={{ background: T.border }}>
                        <div className="h-full rounded-full transition-all duration-700"
                          style={{ width: `${Math.round(n / maxN * 100)}%`, background: rankColors[idx] }} />
                      </div>
                      <span className="text-[10px] font-black w-4 text-right flex-shrink-0" style={{ color: rankColors[idx] }}>{n}</span>
                    </div>
                  ));
              })()}
            </div>
          </div>

        </div>

        {/* Filtros */}
        <FiltrosToolbar
          campos={camposFiltro}
          valores={filtros}
          onChange={setFiltro}
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
        <div className="rounded-xl overflow-hidden flex flex-col flex-1 min-h-0" style={{ ...card }}>
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
                {total} resultado{total !== 1 ? "s" : ""} · pág. {pagina}/{totalPaginas}
              </span>
            </div>
          </div>

          <div className="overflow-x-auto overflow-y-auto flex-1 min-h-0">
            {/* Mobile */}
            <div className="flex flex-col gap-2 p-3 sm:hidden">
              {solicitudes.length === 0
                ? <div className="flex flex-col items-center justify-center py-8 gap-2">
                    <Inbox size={20} style={{ color: T.textFaint }} />
                    <p className="text-xs font-bold" style={{ color: T.textMuted }}>{hayFiltros ? "Sin resultados" : "No hay solicitudes"}</p>
                  </div>
                : solicitudes.map(s => (
                  <div key={s.id_solicitud}
                    className="rounded-xl p-3 flex flex-col gap-2 cursor-pointer active:scale-[0.98] transition-all"
                    style={{ background: isDark ? "rgba(255,255,255,0.04)" : T.surfaceAlt, border: `1px solid ${T.border}` }}
                    onClick={() => setSolicitudVer(s)}>
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

            {/* Desktop */}
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
                  {solicitudes.length === 0 ? (
                    <tr><td colSpan={8}>
                      <div className="flex flex-col items-center justify-center py-12 gap-2">
                        <Inbox size={22} style={{ color: T.textFaint }} />
                        <p className="text-xs font-bold" style={{ color: T.textMuted }}>
                          {hayFiltros ? "Sin resultados para los filtros aplicados" : "No hay solicitudes registradas"}
                        </p>
                      </div>
                    </td></tr>
                  ) : solicitudes.map((s, i) => {
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
                            onClick={() => setSolicitudVer(s)}
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
      <Modal
        T={T}
        title="Parámetros del Reporte"
        onClose={() => setModalReporte(false)}
        onConfirm={generarReporte}
        confirmLabel={generando ? "Generando..." : "Generar Reporte"}
        loading={generando}
        maxWidth="360px"
      >
        <div className="flex flex-col gap-3">
          {[["fecha_inicio", "Fecha inicio"], ["fecha_fin", "Fecha fin"]].map(([key, label]) => (
            <div key={key} className="flex flex-col gap-1">
              <label className="text-[11px] font-bold uppercase tracking-wider" style={{ color: T.textMuted }}>{label}</label>
              <input type="date" value={paramReporte[key]}
                onChange={e => setParamReporte(p => ({ ...p, [key]: e.target.value }))}
                className="rounded-lg px-3 py-2 text-sm"
                style={{ background: T.surfaceAlt, border: `1px solid ${T.border}`, color: T.text, outline: "none" }} />
            </div>
          ))}
        </div>
      </Modal>
    )}
  </>
  );
}
