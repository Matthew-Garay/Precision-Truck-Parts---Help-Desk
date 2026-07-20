import { useState, useEffect, useCallback, useRef } from "react";
import { Inbox, FileDown } from "lucide-react";
import { apiFetch } from "../../Config/api";
import { abrirReporteLista } from "../PrintReportePage";
import { useAutoRefresh } from "../../Config/useAutoRefresh";
import FiltrosToolbar from "../../Components/FiltrosToolbar";
import { useCardStyles } from "../../Components/Card";
import VistaSolicitud from "../Usuario/VistaSolicitud";
import ModalReporte from "../../Components/ModalReporte";

const PCOLOR = { Urgente: "#dc2626", Alta: "#ea580c", Media: "#ca8a04", Baja: "#16a34a" };
const ESTATUS_COLOR = { Resuelto: "#16a34a", Pendiente: "#3b82f6", "En proceso": "#d97706", Aceptado: "#16a34a", Rechazado: "#dc2626" };
const ESTATUS_BG    = { Resuelto: "rgba(22,163,74,0.13)", Pendiente: "rgba(59,130,246,0.13)", "En proceso": "rgba(217,119,6,0.13)", Aceptado: "rgba(22,163,74,0.13)", Rechazado: "rgba(220,38,38,0.13)" };

const fmt = d => d ? new Date(d).toLocaleDateString("es-MX", { day: "2-digit", month: "2-digit", year: "numeric" }) : "-";

const LIMIT = 25;
const FILTROS_INIT = { busqueda: "", estatus: "Todos", prioridad: "Todos", area: "Todos", usuario: "Todos", sucursal: "Todos" };

export default function HistorialInsumos({ T }) {
  const isDark = T.isDark;
  const { card, hdr } = useCardStyles(T);

  const [solicitudes,  setSolicitudes]  = useState([]);
  const [page,         setPage]         = useState(1);
  const [pages,        setPages]        = useState(1);
  const [limit,        setLimit]        = useState(LIMIT);
  const [totalCount,   setTotalCount]   = useState(0);
  const [optsCache,    setOptsCache]    = useState({ usuarios: [], areas: [], sucursales: [] });
  const [filtros,      setFiltros]      = useState(FILTROS_INIT);
  const [modalReporte, setModalReporte] = useState(false);
  const [generando,    setGenerando]    = useState(false);
  const [cargando,     setCargando]     = useState(false);
  const [solicitudVer, setSolicitudVer] = useState(null);
  const [metricas,     setMetricas]     = useState({ total: 0, pendientes: 0, resueltos: 0, rechazados: 0 });

  const filtrosRef = useRef(filtros);
  filtrosRef.current = filtros;

  const cargarMetricas = useCallback(() => {
    apiFetch("/api/solicitudes/metricas")
      .then(r => r.json())
      .then(d => { if (d?.total !== undefined) setMetricas(d); })
      .catch(() => {});
  }, []);

  const buildQs = (f) => {
    const qs = new URLSearchParams();
    if (f.busqueda)                             qs.set("busqueda", f.busqueda);
    if (f.estatus   && f.estatus   !== "Todos") qs.set("estatus",  f.estatus);
    if (f.prioridad && f.prioridad !== "Todos") qs.set("prioridad",f.prioridad);
    if (f.usuario   && f.usuario   !== "Todos") qs.set("empleado", f.usuario);
    if (f.area      && f.area      !== "Todos") qs.set("area",     f.area);
    if (f.sucursal  && f.sucursal  !== "Todos") qs.set("sucursal", f.sucursal);
    return qs;
  };

  const cargar = useCallback((f, p = 1, l = LIMIT) => {
    setCargando(true);
    const qs = buildQs(f);
    qs.set("limit", l); qs.set("page", p);
    apiFetch(`/api/solicitudes?${qs}`)
      .then(r => r.json())
      .then(d => {
        const lista = Array.isArray(d?.data) ? d.data : [];
        setSolicitudes(lista);
        if (typeof d?.total === "number") {
          setTotalCount(d.total);
          setPages(d.pages || Math.max(1, Math.ceil(d.total / l)));
        } else {
          setTotalCount(lista.length);
          setPages(1);
        }
      })
      .catch(() => {})
      .finally(() => setCargando(false));
  }, []); // eslint-disable-line

  const filtrosStr = JSON.stringify(filtros);
  useEffect(() => { cargar(filtros, page, limit); cargarMetricas(); }, [filtrosStr, page, limit]); // eslint-disable-line

  useAutoRefresh(() => { cargar(filtrosRef.current, page, limit); cargarMetricas(); }, 30000, [page, limit]);

  // Opciones para selects — una sola vez
  useEffect(() => {
    apiFetch("/api/solicitudes?limit=2000&page=1")
      .then(r => r.json())
      .then(d => {
        const lista = Array.isArray(d?.data) ? d.data : [];
        const uniq = arr => [...new Set(arr.filter(Boolean).map(s => s.replace(/\s+/g, " ").trim()))].sort();
        setOptsCache({
          usuarios:   uniq(lista.map(s => s.nombre_empleado)),
          areas:      uniq(lista.map(s => s.nombre_departamento)),
          sucursales: uniq(lista.map(s => s.nombre_sucursal)),
        });
      })
      .catch(() => {});
  }, []);

  const limpiar = () => setFiltros(FILTROS_INIT);
  const hayFiltros = filtros.busqueda || filtros.estatus !== "Todos" || filtros.prioridad !== "Todos"
    || filtros.usuario !== "Todos" || filtros.area !== "Todos" || filtros.sucursal !== "Todos";

  const toOpts = arr => [{ value: "Todos", label: "Todos" }, ...arr.map(v => ({ value: v, label: v }))];

  const camposFiltro = [
    { key: "busqueda",  label: "Búsqueda Rápida", type: "search",  placeholder: "Folio o empleado...", debounce: 400 },
    { key: "estatus",   label: "Estatus",          type: "select",  opts: ["Todos", "En proceso", "Aceptado", "Rechazado"] },
    { key: "prioridad", label: "Prioridad",         type: "select",  opts: ["Todos", "Urgente", "Alta", "Media", "Baja"] },
    { key: "usuario",   label: "Usuario",           type: "select",  opts: toOpts(optsCache.usuarios) },
    { key: "area",      label: "Área",              type: "select",  opts: toOpts(optsCache.areas) },
    { key: "sucursal",  label: "Sucursal",          type: "select",  opts: toOpts(optsCache.sucursales) },
  ];

  const generarReporte = async (params) => {
    const { fecha_inicio, fecha_fin } = params;
    if (!fecha_inicio || !fecha_fin || fecha_inicio > fecha_fin) return;
    setGenerando(true);
    let datos = [];
    try {
      const qs = new URLSearchParams({ fecha_inicio, fecha_fin });
      const r  = await apiFetch(`/api/solicitudes/reporte?${qs}`);
      datos    = await r.json();
      if (!Array.isArray(datos)) datos = [];
    } catch (e) { console.error("[generarReporte insumos]", e); datos = []; }
    setGenerando(false);
    setModalReporte(false);
    const fmtDate = d => new Date(d + "T00:00:00").toLocaleDateString("es-MX", { day: "2-digit", month: "long", year: "numeric" });
    abrirReporteLista({ tipo: "insumos", periodo: `${fmtDate(fecha_inicio)} – ${fmtDate(fecha_fin)}`, datos });
  };

  const totalKpi = Number(metricas.total ?? 0);

  if (solicitudVer) return (
    <VistaSolicitud T={T} id_solicitud={solicitudVer.id_solicitud} esAdmin onBack={() => setSolicitudVer(null)} />
  );

  return (
    <>
    <div className="flex flex-col h-full" style={{ background: T.bg, overflow: "hidden" }}>
      <div className="w-full p-1.5 flex flex-col gap-1.5 flex-1 min-h-0"
        style={{ overflowY: "auto", overflowX: "hidden", WebkitOverflowScrolling: "touch" }}>

        {/* ── MÉTRICAS ── */}
        <div className="grid grid-cols-12 gap-1.5" style={{ flexShrink: 0 }}>

          {/* Distribución por estatus */}
          <div className="col-span-6 sm:col-span-6 lg:col-span-3 rounded-xl overflow-hidden relative" style={card}>
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
              style={{ background: `radial-gradient(circle at 80% 20%, ${T.orange}, transparent 60%)` }} />
            <div className="h-0.5" style={{ background: `linear-gradient(90deg,${T.orange},${T.orange}33)` }} />
            <div className="p-2 flex flex-col gap-1">
              <div className="flex items-center gap-1">
                <div className="w-1 h-2.5 rounded-full" style={{ background: T.orange }} />
                <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: T.textMuted }}>Distribución</p>
              </div>
              <div className="flex items-end gap-2">
                <span className="text-2xl font-black leading-none" style={{ color: T.orange }}>{totalKpi}</span>
                <span className="text-[11px] font-semibold mb-0.5" style={{ color: T.textMuted }}>solicitudes totales</span>
              </div>
              <div className="flex flex-col gap-0.5 pt-1">
                {[
                  { label: "Resueltos",  val: Number(metricas.resueltos  ?? 0), color: "#16a34a" },
                  { label: "Pendientes", val: Number(metricas.pendientes  ?? 0), color: "#3b82f6" },
                  { label: "Rechazados", val: Number(metricas.rechazados  ?? 0), color: "#dc2626" },
                ].map(({ label, val, color }) => {
                  const pct = totalKpi > 0 ? Math.round(val / totalKpi * 100) : 0;
                  return (
                    <div key={label} className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: color }} />
                      <span className="text-[10px] font-semibold w-20 flex-shrink-0" style={{ color: T.text }}>{label}</span>
                      <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: isDark ? "rgba(255,255,255,0.06)" : `${color}15` }}>
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
          <div className="col-span-6 sm:col-span-6 lg:col-span-3 grid grid-cols-2 gap-1.5">
            {[
              { label: "Total",      val: totalKpi,                         color: T.orange,  sub: `${Number(metricas.pendientes ?? 0)} pendientes`,    subColor: "#3b82f6" },
              { label: "Pendientes", val: Number(metricas.pendientes ?? 0), color: "#3b82f6", sub: `${totalKpi > 0 ? Math.round(Number(metricas.pendientes ?? 0) / totalKpi * 100) : 0}% del total`, subColor: T.textFaint },
              { label: "Resueltos",  val: Number(metricas.resueltos  ?? 0), color: "#16a34a", sub: `${totalKpi > 0 ? Math.round(Number(metricas.resueltos  ?? 0) / totalKpi * 100) : 0}% tasa`,      subColor: "#16a34a" },
              { label: "Rechazados", val: Number(metricas.rechazados ?? 0), color: "#dc2626", sub: `${totalKpi > 0 ? Math.round(Number(metricas.rechazados ?? 0) / totalKpi * 100) : 0}% del total`, subColor: "#dc2626" },
            ].map(({ label, val, color, sub, subColor }) => (
              <div key={label} className="rounded-lg p-1.5 flex flex-col gap-0.5 relative overflow-hidden" style={card}>
                <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: `linear-gradient(90deg,${color},${color}33)` }} />
                <p className="text-[9px] font-black uppercase tracking-wider leading-tight" style={{ color: T.textMuted }}>{label}</p>
                <span className="text-xl font-black leading-none" style={{ color }}>{val}</span>
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
            <div className="p-2 flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <div className="w-1 h-2.5 rounded-full" style={{ background: "#16a34a" }} />
                  <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: T.textMuted }}>Resolución</p>
                </div>
                {(() => {
                  const resueltos = Number(metricas.resueltos ?? 0);
                  const cerrados  = resueltos + Number(metricas.rechazados ?? 0);
                  const pct   = cerrados > 0 ? Math.round(resueltos / cerrados * 100) : 0;
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
                const resueltos  = Number(metricas.resueltos  ?? 0);
                const rechazados = Number(metricas.rechazados ?? 0);
                const cerrados   = resueltos + rechazados;
                const pct        = cerrados > 0 ? Math.round(resueltos / cerrados * 100) : 0;
                const color      = pct >= 75 ? "#16a34a" : pct >= 50 ? "#ca8a04" : "#dc2626";
                return (
                  <>
                    <div className="flex items-end gap-1">
                      <span className="text-2xl font-black leading-none" style={{ color }}>{pct}%</span>
                      <span className="text-[11px] font-semibold mb-0.5" style={{ color: T.textMuted }}>tasa de éxito</span>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: T.border }}>
                      <div className="h-full rounded-full transition-all duration-1000"
                        style={{ width: `${pct}%`, background: `linear-gradient(90deg,${color},${color}88)`, boxShadow: `0 0 6px ${color}55` }} />
                    </div>
                    <div className="grid grid-cols-2 gap-1">
                      <div className="rounded-lg p-1" style={{ background: isDark ? "rgba(59,130,246,0.1)" : "#eff6ff", border: "1px solid rgba(59,130,246,0.2)" }}>
                        <p className="text-[9px] font-black uppercase" style={{ color: "#3b82f6" }}>Pendientes</p>
                        <p className="text-[11px] font-black" style={{ color: "#3b82f6" }}>{Number(metricas.pendientes ?? 0)}</p>
                      </div>
                      <div className="rounded-lg p-1" style={{ background: isDark ? "rgba(220,38,38,0.1)" : "#fef2f2", border: "1px solid rgba(220,38,38,0.2)" }}>
                        <p className="text-[9px] font-black uppercase" style={{ color: "#dc2626" }}>Rechazados</p>
                        <p className="text-[11px] font-black" style={{ color: "#dc2626" }}>{rechazados}</p>
                      </div>
                    </div>
                    <div className="pt-1" style={{ borderTop: `1px solid ${T.border}` }}>
                      <p className="text-[10px]" style={{ color: T.textFaint }}>{resueltos} resueltas de {cerrados} cerradas</p>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>

          {/* Prioridad + Top Áreas */}
          <div className="col-span-12 sm:col-span-6 lg:col-span-3 rounded-xl overflow-hidden flex flex-col" style={card}>
            <div className="px-2 py-1 flex items-center gap-1" style={hdr}>
              <div className="w-1 h-2.5 rounded-full" style={{ background: T.orange }} />
              <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: T.textMuted }}>Por Prioridad</p>
            </div>
            <div className="px-2 pt-1 pb-1 flex flex-col gap-0.5">
              {[{ l: "Urgente", c: "#dc2626", k: "p_urgente" }, { l: "Alta", c: "#ea580c", k: "p_alta" }, { l: "Media", c: "#ca8a04", k: "p_media" }, { l: "Baja", c: "#16a34a", k: "p_baja" }].map(({ l, c, k }) => {
                const n = Number(metricas[k] ?? 0);
                const pct = totalKpi > 0 ? Math.round(n / totalKpi * 100) : 0;
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
            <div className="mx-2" style={{ height: "1px", background: T.border }} />
            <div className="px-2 py-1 flex items-center gap-1">
              <div className="w-1 h-2.5 rounded-full" style={{ background: T.orange }} />
              <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: T.textMuted }}>Top Áreas</p>
            </div>
            <div className="px-2 pb-1 flex flex-col gap-0.5">
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
        <div style={{ flexShrink: 0 }}>
          <FiltrosToolbar
            campos={camposFiltro}
            valores={filtros}
            onChange={(key, val) => { setFiltros(prev => ({ ...prev, [key]: val })); setPage(1); }}
            onLimpiar={limpiar}
            loading={cargando}
            T={T}
          >
            <button onClick={() => setModalReporte(true)}
              style={{ display: "flex", alignItems: "center", gap: "4px", padding: "3px 8px", borderRadius: "4px",
                fontSize: "10px", fontWeight: 700, background: "#F47920", color: "#fff", border: "none", cursor: "pointer",
                whiteSpace: "nowrap", transition: "filter 0.15s" }}
              onMouseEnter={e => e.currentTarget.style.filter = "brightness(1.08)"}
              onMouseLeave={e => e.currentTarget.style.filter = "none"}>
              <FileDown size={10} strokeWidth={2.5} /> Generar Reporte
            </button>
          </FiltrosToolbar>
        </div>

        {/* Tabla */}
        <div className="rounded-xl overflow-hidden flex flex-col" style={{ ...card, flex: "1 1 0", minHeight: "320px" }}>
          <div className="flex items-center justify-between px-3 py-2 flex-shrink-0" style={hdr}>
            <div className="flex items-center gap-1.5">
              <div className="w-0.5 h-3.5 rounded-full" style={{ background: T.orange }} />
              <p className="text-xs font-black uppercase tracking-widest" style={{ color: T.textMuted }}>Registros</p>
            </div>
            <div className="flex items-center gap-2">
              {cargando && (
                <svg className="animate-spin" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={T.orange} strokeWidth="2.5"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
              )}
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full"
                style={{ background: T.bg, color: T.textMuted, border: `1px solid ${T.border}` }}>
                {totalCount} resultado{totalCount !== 1 ? "s" : ""}
              </span>
            </div>
          </div>

          <div className="overflow-y-auto overflow-x-auto" style={{ flex: "1 1 0", minHeight: 0, WebkitOverflowScrolling: "touch" }}>

            {/* Móvil (<640px) */}
            <div className="flex flex-col gap-2 p-2 sm:hidden">
              {solicitudes.length === 0
                ? <div className="flex flex-col items-center justify-center py-8 gap-2">
                    <Inbox size={20} style={{ color: T.textFaint }} />
                    <p className="text-xs font-bold" style={{ color: T.textMuted }}>
                      {hayFiltros ? "Sin resultados" : "No hay solicitudes"}
                    </p>
                  </div>
                : solicitudes.map(s => {
                    const eBg    = ESTATUS_BG[s.estatus]    || "rgba(148,163,184,0.13)";
                    const eColor = ESTATUS_COLOR[s.estatus] || T.textMuted;
                    return (
                      <div key={s.id_solicitud}
                        className="rounded-xl p-3 flex flex-col gap-2 active:scale-[0.98] transition-all cursor-pointer"
                        style={{ background: isDark ? "rgba(255,255,255,0.04)" : T.surfaceAlt, border: `1px solid ${T.border}` }}
                        onClick={() => setSolicitudVer(s)}>
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-mono text-[11px] font-black" style={{ color: T.orange }}>{s.folio_solicitud}</span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ background: eBg, color: eColor }}>{s.estatus}</span>
                        </div>
                        <p className="text-xs font-semibold leading-snug" style={{ color: T.text }}>{s.nombre_empleado || "-"}</p>
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1 text-[11px] font-bold">
                            <span className="w-2 h-2 rounded-full" style={{ background: PCOLOR[s.prioridad] || "#94a3b8" }} />
                            <span style={{ color: PCOLOR[s.prioridad] || T.textMuted }}>{s.prioridad}</span>
                          </span>
                          <span className="text-[11px]" style={{ color: T.textFaint }}>{s.nombre_departamento || "-"}</span>
                        </div>
                        <div className="flex items-center justify-between pt-1" style={{ borderTop: `1px solid ${T.border}` }}>
                          <span className="text-[10px]" style={{ color: T.textFaint }}>{fmt(s.fecha)}</span>
                        </div>
                      </div>
                    );
                  })
              }
            </div>

            {/* Tablet (640–1023px) */}
            <div className="hidden sm:block lg:hidden">
              <table className="w-full border-collapse" style={{ minWidth: "560px" }}>
                <thead className="sticky top-0 z-10">
                  <tr style={{ background: isDark ? "#1c2030" : T.surfaceAlt }}>
                    {["Folio", "Empleado / Área", "Prioridad", "Estatus", "Fecha", ""].map((col, i) => (
                      <th key={i} className="text-left px-2 py-1.5 text-[10px] font-black uppercase tracking-widest whitespace-nowrap"
                        style={{ color: T.textMuted, borderBottom: `1px solid ${T.border}` }}>
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {solicitudes.length === 0 ? (
                    <tr><td colSpan={6}>
                      <div className="flex flex-col items-center justify-center py-10 gap-2">
                        <Inbox size={20} style={{ color: T.textFaint }} />
                        <p className="text-xs font-bold" style={{ color: T.textMuted }}>
                          {hayFiltros ? "Sin resultados" : "No hay solicitudes registradas"}
                        </p>
                      </div>
                    </td></tr>
                  ) : solicitudes.map((s, i) => {
                    const bgRow  = i % 2 === 0 ? (isDark ? "#141720" : T.surface) : (isDark ? "#1c2030" : T.surfaceAlt);
                    const eBg    = ESTATUS_BG[s.estatus]    || "rgba(148,163,184,0.13)";
                    const eColor = ESTATUS_COLOR[s.estatus] || T.textMuted;
                    return (
                      <tr key={s.id_solicitud}
                        style={{ background: bgRow, borderBottom: `1px solid ${T.border}` }}
                        onMouseEnter={e => e.currentTarget.style.background = isDark ? "rgba(244,121,32,0.05)" : "rgba(244,121,32,0.03)"}
                        onMouseLeave={e => e.currentTarget.style.background = bgRow}>
                        <td className="px-2 py-1.5">
                          <span className="font-mono text-[10px] font-black" style={{ color: T.orange }}>{s.folio_solicitud}</span>
                        </td>
                        <td className="px-2 py-1.5" style={{ maxWidth: "160px" }}>
                          <span className="block truncate text-[11px] font-semibold" style={{ color: T.text }}>{s.nombre_empleado || "-"}</span>
                          <span className="block text-[10px] truncate" style={{ color: T.textMuted }}>{s.nombre_departamento || "-"}</span>
                        </td>
                        <td className="px-2 py-1.5">
                          <span className="flex items-center gap-1 mt-0.5">
                            <span className="w-1.5 h-1.5 rounded-full" style={{ background: PCOLOR[s.prioridad] || "#94a3b8" }} />
                            <span className="text-[10px] font-bold" style={{ color: PCOLOR[s.prioridad] || T.textMuted }}>{s.prioridad}</span>
                          </span>
                        </td>
                        <td className="px-2 py-1.5">
                          <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold whitespace-nowrap" style={{ background: eBg, color: eColor }}>{s.estatus}</span>
                        </td>
                        <td className="px-2 py-1.5 text-[10px] whitespace-nowrap" style={{ color: T.textMuted }}>{fmt(s.fecha)}</td>
                        <td className="px-2 py-1.5">
                          <button onClick={() => setSolicitudVer(s)}
                            className="flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all hover:brightness-110 active:scale-95"
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

            {/* Desktop (≥1024px) */}
            <div className="hidden lg:block">
              <table className="w-full border-collapse" style={{ minWidth: "860px" }}>
                <thead className="sticky top-0 z-10">
                  <tr style={{ background: isDark ? "#1c2030" : T.surfaceAlt }}>
                    {["Folio", "Empleado / Área", "Sucursal", "Prioridad", "Estatus", "Insumos", "Piezas", "Fecha", ""].map((col, i) => (
                      <th key={i} className="text-left px-2 py-1.5 text-[10px] font-black uppercase tracking-widest whitespace-nowrap"
                        style={{ color: T.textMuted, borderBottom: `1px solid ${T.border}` }}>
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {solicitudes.length === 0 ? (
                    <tr><td colSpan={9}>
                      <div className="flex flex-col items-center justify-center py-12 gap-2">
                        <Inbox size={22} style={{ color: T.textFaint }} />
                        <p className="text-xs font-bold" style={{ color: T.textMuted }}>
                          {hayFiltros ? "Sin resultados" : "No hay solicitudes registradas"}
                        </p>
                      </div>
                    </td></tr>
                  ) : solicitudes.map((s, i) => {
                    const bgRow  = i % 2 === 0 ? (isDark ? "#141720" : T.surface) : (isDark ? "#1c2030" : T.surfaceAlt);
                    const eBg    = ESTATUS_BG[s.estatus]    || "rgba(148,163,184,0.13)";
                    const eColor = ESTATUS_COLOR[s.estatus] || T.textMuted;
                    return (
                      <tr key={s.id_solicitud}
                        style={{ background: bgRow, borderBottom: `1px solid ${T.border}` }}
                        onMouseEnter={e => e.currentTarget.style.background = isDark ? "rgba(244,121,32,0.05)" : "rgba(244,121,32,0.03)"}
                        onMouseLeave={e => e.currentTarget.style.background = bgRow}>
                        <td className="px-2 py-1.5">
                          <span className="font-mono text-[10px] font-black" style={{ color: T.orange }}>{s.folio_solicitud}</span>
                        </td>
                        <td className="px-2 py-1.5">
                          <span className="block text-[11px] font-semibold" style={{ color: T.text }}>{s.nombre_empleado || "-"}</span>
                          <span className="block text-[10px]" style={{ color: T.textMuted }}>{s.nombre_departamento || "-"}</span>
                        </td>
                        <td className="px-2 py-1.5 text-[11px]" style={{ color: T.textMuted }}>{s.nombre_sucursal || "-"}</td>
                        <td className="px-2 py-1.5">
                          <span className="flex items-center gap-1 mt-0.5">
                            <span className="w-1.5 h-1.5 rounded-full" style={{ background: PCOLOR[s.prioridad] || "#94a3b8" }} />
                            <span className="text-[10px] font-bold" style={{ color: PCOLOR[s.prioridad] || T.textMuted }}>{s.prioridad}</span>
                          </span>
                        </td>
                        <td className="px-2 py-1.5">
                          <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold whitespace-nowrap" style={{ background: eBg, color: eColor }}>{s.estatus}</span>
                        </td>
                        <td className="px-2 py-1.5 text-[11px]" style={{ color: T.textMuted }}>{s.total_insumos ?? "-"}</td>
                        <td className="px-2 py-1.5 text-[11px]" style={{ color: T.textMuted }}>{s.total_piezas ?? "-"}</td>
                        <td className="px-2 py-1.5 text-[10px] whitespace-nowrap" style={{ color: T.textMuted }}>{fmt(s.fecha)}</td>
                        <td className="px-2 py-1.5">
                          <button onClick={() => setSolicitudVer(s)}
                            className="flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all hover:brightness-110 active:scale-95"
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

          {/* Paginación */}
          <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2" style={{ borderTop: `1px solid ${T.border}`, background: T.bg, flexShrink: 0 }}>
            <div className="flex items-center gap-1.5">
              <button disabled={page <= 1 || cargando} onClick={() => setPage(p => Math.max(1, p - 1))}
                className="px-2 py-1 rounded border text-[11px]" style={{ borderColor: T.border, background: T.surfaceAlt, color: T.text }}>
                ‹ Ant
              </button>
              <span className="text-[11px] px-1" style={{ color: T.textMuted }}>{page} / {pages}</span>
              <button disabled={page >= pages || cargando} onClick={() => setPage(p => Math.min(pages, p + 1))}
                className="px-2 py-1 rounded border text-[11px]" style={{ borderColor: T.border, background: T.surfaceAlt, color: T.text }}>
                Sig ›
              </button>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-[10px]" style={{ color: T.textMuted }}>Mostrar</label>
              <select value={limit} onChange={e => { setLimit(parseInt(e.target.value, 10)); setPage(1); }}
                className="text-[11px]" style={{ padding: "3px 6px", borderRadius: 6, border: `1px solid ${T.border}`, background: T.surface, color: T.text }}>
                {[10, 25, 50, 100].map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
          </div>
        </div>

      </div>
    </div>

    {modalReporte && (
      <ModalReporte
        T={T}
        admins={[]}
        generando={generando}
        onClose={() => setModalReporte(false)}
        onGenerar={generarReporte}
      />
    )}
    </>
  );
}
