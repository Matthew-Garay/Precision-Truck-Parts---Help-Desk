import { useState, useEffect, useCallback, useRef } from "react";
import { Eye, Inbox, Package, CheckCircle2, XCircle, Clock } from "lucide-react";
import { apiFetch } from "../../Config/api";
import { useAutoRefresh } from "../../Config/useAutoRefresh";
import FiltrosToolbar from "../../Components/FiltrosToolbar";
import { useCardStyles } from "../../Components/Card";

const PCOLOR = { Urgente: "#dc2626", Alta: "#ea580c", Media: "#ca8a04", Baja: "#16a34a" };
const ESTATUS_META = {
  "En proceso": { color: "#d97706", bgL: "#fef3c7", bgD: "rgba(217,119,6,0.15)"  },
  "Aceptado":   { color: "#16a34a", bgL: "#dcfce7", bgD: "rgba(22,163,74,0.15)"  },
  "Rechazado":  { color: "#dc2626", bgL: "#fee2e2", bgD: "rgba(220,38,38,0.15)"  },
};

export default function HistorialInsumos({ T, usuario = {}, onVerSolicitud, onRecargarRef }) {
  const isDark = T.isDark;
  const [solicitudes, setSolicitudes] = useState([]);
  const [page,        setPage]        = useState(1);
  const [pages,       setPages]       = useState(1);
  const [limit,       setLimit]       = useState(25);
  const [totalCount,  setTotalCount]  = useState(0);
  const [filtros,     setFiltros]     = useState({ busqueda: "", estatus: "Todos", prioridad: "Todos" });
  const [cargando,    setCargando]    = useState(false);
  const [stats,       setStats]       = useState({ total: 0, enProceso: 0, aceptados: 0, rechazados: 0 });

  const filtrosRef = useRef(filtros);
  filtrosRef.current = filtros;

  const cargar = useCallback((f, p = 1, l = 25) => {
    if (!usuario?.id_empleado) return;
    setCargando(true);
    const qs = new URLSearchParams({ limit: l, page: p });
    if (f.busqueda)                             qs.set("q",         f.busqueda);
    if (f.estatus   && f.estatus   !== "Todos") qs.set("estatus",   f.estatus);
    if (f.prioridad && f.prioridad !== "Todos") qs.set("prioridad", f.prioridad);
    apiFetch(`/api/solicitudes/empleado/${usuario.id_empleado}?${qs}`)
      .then(r => r.json())
      .then(d => {
        const lista = Array.isArray(d) ? d : (Array.isArray(d?.data) ? d.data : []);
        setSolicitudes(prev => JSON.stringify(prev) === JSON.stringify(lista) ? prev : lista);
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

  // Stats globales sin filtro
  useEffect(() => {
    if (!usuario?.id_empleado) return;
    apiFetch(`/api/solicitudes/empleado/${usuario.id_empleado}?limit=2000&page=1`)
      .then(r => r.json())
      .then(d => {
        const lista = Array.isArray(d) ? d : (Array.isArray(d?.data) ? d.data : []);
        setStats({
          total:      lista.length,
          enProceso:  lista.filter(s => s.estatus === "En proceso").length,
          aceptados:  lista.filter(s => s.estatus === "Aceptado").length,
          rechazados: lista.filter(s => s.estatus === "Rechazado").length,
        });
      })
      .catch(() => {});
  }, [usuario?.id_empleado]); // eslint-disable-line

  const { total, enProceso, aceptados, rechazados } = stats;
  const tasa      = (aceptados + rechazados) > 0 ? Math.round(aceptados / (aceptados + rechazados) * 100) : 0;
  const tasaColor = tasa >= 75 ? "#16a34a" : tasa >= 50 ? "#ca8a04" : "#dc2626";

  const camposFiltro = [
    { key: "busqueda",  label: "Búsqueda Rápida", type: "search", placeholder: "Folio...", debounce: 300 },
    { key: "estatus",   label: "Estatus",          type: "select", opts: ["Todos", "En proceso", "Aceptado", "Rechazado"] },
    { key: "prioridad", label: "Prioridad",         type: "select", opts: ["Todos", "Urgente", "Alta", "Media", "Baja"] },
  ];
  const limpiar          = () => { setFiltros({ busqueda: "", estatus: "Todos", prioridad: "Todos" }); setPage(1); };
  const hayFiltros       = filtros.busqueda || filtros.estatus !== "Todos" || filtros.prioridad !== "Todos";
  const handleFiltroChange = (k, v) => { setFiltros(p => ({ ...p, [k]: v })); setPage(1); };
  const fmt              = d => d ? new Date(d).toLocaleDateString("es-MX", { day: "2-digit", month: "2-digit", year: "numeric" }) : "-";

  const { card, hdr } = useCardStyles(T);

  return (
    <div className="flex flex-col h-full" style={{ background: T.bg, overflow: "hidden" }}>
      <div className="w-full p-1.5 flex flex-col gap-1.5 flex-1 min-h-0"
        style={{ overflowY: "auto", overflowX: "hidden", WebkitOverflowScrolling: "touch" }}>

        {/* ── KPIs ── */}
        <div className="grid grid-cols-12 gap-1.5" style={{ flexShrink: 0 }}>

          {/* Tasa de aceptación */}
          <div className="col-span-6 sm:col-span-6 lg:col-span-3 rounded-xl overflow-hidden relative" style={card}>
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
              style={{ background: `radial-gradient(circle at 80% 20%, ${tasaColor}, transparent 60%)` }} />
            <div className="h-0.5" style={{ background: `linear-gradient(90deg,${tasaColor},${tasaColor}33)` }} />
            <div className="p-2 sm:p-3 flex flex-col gap-1 sm:gap-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <div className="w-1 h-2.5 rounded-full" style={{ background: tasaColor }} />
                  <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: T.textMuted }}>Aceptación</p>
                </div>
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                  style={{ background: `${tasaColor}15`, color: tasaColor, border: `1px solid ${tasaColor}30` }}>
                  {tasa >= 75 ? "Excelente" : tasa >= 50 ? "Regular" : "Bajo"}
                </span>
              </div>
              <div className="flex items-end gap-2">
                <span className="text-2xl font-black leading-none" style={{ color: tasaColor }}>{tasa}%</span>
                <div className="flex-1 mb-0.5">
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: T.border }}>
                    <div className="h-full rounded-full transition-all duration-1000"
                      style={{ width: `${tasa}%`, background: `linear-gradient(90deg,${tasaColor},${tasaColor}88)`, boxShadow: `0 0 6px ${tasaColor}55` }} />
                  </div>
                </div>
              </div>
              <div className="pt-1 flex items-center justify-between" style={{ borderTop: `1px solid ${T.border}` }}>
                <span className="text-[10px]" style={{ color: T.textFaint }}>Aprobadas</span>
                <span className="text-[10px] font-black" style={{ color: tasaColor }}>{aceptados} / {aceptados + rechazados}</span>
              </div>
            </div>
          </div>

          {/* KPIs numéricos */}
          <div className="col-span-6 sm:col-span-6 lg:col-span-3 grid grid-cols-2 gap-1.5">
            {[
              { label: "Total",      val: total,     color: T.orange,  sub: `${enProceso} activas`,                                    subColor: "#ea580c"    },
              { label: "En Proceso", val: enProceso, color: "#ea580c", sub: `${Math.round(enProceso  / Math.max(total,1)*100)}% total`, subColor: T.textFaint  },
              { label: "Aceptadas",  val: aceptados, color: "#16a34a", sub: `${Math.round(aceptados  / Math.max(total,1)*100)}% tasa`,  subColor: "#16a34a"    },
              { label: "Rechazadas", val: rechazados,color: "#dc2626", sub: `${Math.round(rechazados / Math.max(total,1)*100)}% total`, subColor: "#dc2626"    },
            ].map(({ label, val, color, sub, subColor }) => (
              <div key={label} className="rounded-lg p-1.5 sm:p-2 flex flex-col gap-0.5 sm:gap-1 relative overflow-hidden" style={card}>
                <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: `linear-gradient(90deg,${color},${color}33)` }} />
                <p className="text-[9px] font-black uppercase tracking-wider leading-tight" style={{ color: T.textMuted }}>{label}</p>
                <span className="text-xl font-black leading-none" style={{ color }}>{val}</span>
                <div className="h-1 rounded-full overflow-hidden" style={{ background: T.border }}>
                  <div className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${total > 0 ? Math.round(val/total*100) : 0}%`, background: color, boxShadow: `0 0 4px ${color}44` }} />
                </div>
                <span className="text-[10px] font-semibold" style={{ color: subColor }}>{sub}</span>
              </div>
            ))}
          </div>

          {/* Por Prioridad */}
          <div className="col-span-12 sm:col-span-6 lg:col-span-3 rounded-xl overflow-hidden" style={{ ...card, flexShrink: 0 }}>
            <div className="px-3 py-2 flex items-center gap-1.5" style={hdr}>
              <div className="w-1 h-3 rounded-full" style={{ background: T.orange }} />
              <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: T.textMuted }}>Por Prioridad</p>
            </div>
            <div className="p-3 flex flex-col gap-2">
              {[{ l:"Urgente",c:"#dc2626"},{l:"Alta",c:"#ea580c"},{l:"Media",c:"#ca8a04"},{l:"Baja",c:"#16a34a"}].map(({ l, c }) => {
                const n   = solicitudes.filter(s => s.prioridad === l).length;
                const pct = totalCount > 0 ? Math.round(n / totalCount * 100) : 0;
                return (
                  <div key={l} className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: c, boxShadow: `0 0 4px ${c}88` }} />
                    <span className="text-[11px] font-semibold w-14 flex-shrink-0" style={{ color: T.text }}>{l}</span>
                    <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: isDark ? "rgba(255,255,255,0.06)" : `${c}15` }}>
                      <div className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${pct > 0 ? Math.max(pct, 5) : 0}%`, background: c, boxShadow: `0 0 4px ${c}55` }} />
                    </div>
                    <span className="text-[11px] font-black w-5 text-right flex-shrink-0" style={{ color: c }}>{n}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Por Estatus */}
          <div className="col-span-12 sm:col-span-6 lg:col-span-3 rounded-xl overflow-hidden" style={{ ...card, flexShrink: 0 }}>
            <div className="px-3 py-2 flex items-center gap-1.5" style={hdr}>
              <div className="w-1 h-3 rounded-full" style={{ background: T.orange }} />
              <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: T.textMuted }}>Por Estatus</p>
            </div>
            <div className="p-3 flex flex-col gap-3">
              {[
                { l: "En proceso", c: "#d97706", Icon: Clock,        val: enProceso  },
                { l: "Aceptado",   c: "#16a34a", Icon: CheckCircle2, val: aceptados  },
                { l: "Rechazado",  c: "#dc2626", Icon: XCircle,      val: rechazados },
              ].map(({ l, c, Icon, val }) => (
                <div key={l} className="flex items-center gap-2">
                  <Icon size={12} style={{ color: c, flexShrink: 0 }} />
                  <span className="text-[11px] font-semibold flex-1" style={{ color: T.text }}>{l}</span>
                  <div className="w-16 h-2 rounded-full overflow-hidden flex-shrink-0" style={{ background: T.border }}>
                    <div className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${total > 0 ? Math.round(val/total*100) : 0}%`, background: c }} />
                  </div>
                  <span className="text-[11px] font-black w-5 text-right flex-shrink-0" style={{ color: c }}>{val}</span>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* ── Filtros ── */}
        <div style={{ flexShrink: 0 }}>
          <FiltrosToolbar campos={camposFiltro} valores={filtros} onChange={handleFiltroChange} onLimpiar={limpiar} T={T} />
        </div>

        {/* ── Tabla ── */}
        <div className="rounded-xl overflow-hidden flex flex-col" style={{ ...card, flex: "1 1 0", minHeight: "320px" }}>
          <div className="flex items-center justify-between px-4 py-3 flex-shrink-0" style={hdr}>
            <div className="flex items-center gap-1.5">
              <div className="w-0.5 h-3.5 rounded-full" style={{ background: T.orange }} />
              <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: T.textMuted }}>Mis Solicitudes</p>
            </div>
            <div className="flex items-center gap-2">
              {cargando && (
                <svg className="animate-spin" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={T.orange} strokeWidth="2.5">
                  <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                </svg>
              )}
              <span className="text-[9px] font-bold px-2 py-0.5 rounded-full"
                style={{ background: T.bg, color: T.textMuted, border: `1px solid ${T.border}` }}>
                {totalCount} resultado{totalCount !== 1 ? "s" : ""}
              </span>
            </div>
          </div>

          {/* Móvil (<1024px) */}
          <div className="flex flex-col gap-2 p-2 lg:hidden"
            style={{ overflowY: "auto", flex: "1 1 0", minHeight: 0, WebkitOverflowScrolling: "touch" }}>
            {solicitudes.length === 0
              ? <div className="flex flex-col items-center justify-center py-8 gap-2">
                  <Inbox size={20} style={{ color: T.textFaint }} />
                  <p className="text-xs font-bold" style={{ color: T.textMuted }}>
                    {hayFiltros ? "Sin resultados" : "No hay solicitudes"}
                  </p>
                </div>
              : solicitudes.map(s => {
                  const em  = ESTATUS_META[s.estatus] || ESTATUS_META["En proceso"];
                  const eBg = isDark ? em.bgD : em.bgL;
                  return (
                    <div key={s.id_solicitud}
                      className="rounded-xl p-3 flex flex-col gap-2 active:scale-[0.98] transition-all cursor-pointer"
                      style={{ background: isDark ? "rgba(255,255,255,0.04)" : T.surfaceAlt, border: `1px solid ${T.border}` }}
                      onClick={() => onVerSolicitud?.(s)}>
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-[11px] font-black" style={{ color: T.orange }}>{s.folio_solicitud}</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ background: eBg, color: em.color }}>{s.estatus}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1 text-[11px] font-bold">
                          <span className="w-2 h-2 rounded-full" style={{ background: PCOLOR[s.prioridad] || "#94a3b8" }} />
                          <span style={{ color: PCOLOR[s.prioridad] || T.textMuted }}>{s.prioridad}</span>
                        </span>
                        <span className="text-[11px]" style={{ color: T.textFaint }}>{fmt(s.fecha)}</span>
                      </div>
                      <div className="flex items-center pt-1" style={{ borderTop: `1px solid ${T.border}` }}>
                        <span className="flex items-center gap-1 text-[10px]" style={{ color: T.textFaint }}>
                          <Package size={10} /> {s.total_items ?? "—"} ítem{s.total_items !== 1 ? "s" : ""}
                        </span>
                      </div>
                    </div>
                  );
                })
            }
          </div>

          {/* Desktop (≥1024px) */}
          <div className="hidden lg:flex lg:flex-col" style={{ overflowY: "auto", flex: "1 1 0", minHeight: 0 }}>
            <table className="w-full border-collapse" style={{ minWidth: "600px" }}>
              <thead className="sticky top-0 z-10">
                <tr style={{ background: isDark ? "rgba(255,255,255,0.03)" : T.surfaceAlt }}>
                  {["Folio", "Prioridad", "Estatus", "Ítems", "Fecha", ""].map((col, i) => (
                    <th key={i} className="text-left px-3 py-2 text-[9px] font-black uppercase tracking-widest whitespace-nowrap"
                      style={{ color: T.textMuted, borderBottom: `1px solid ${T.border}` }}>
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {solicitudes.length === 0
                  ? <tr><td colSpan={6}>
                      <div className="flex flex-col items-center justify-center py-12 gap-2">
                        <Inbox size={22} style={{ color: T.textFaint }} />
                        <p className="text-xs font-bold" style={{ color: T.textMuted }}>
                          {hayFiltros ? "Sin resultados" : "No hay solicitudes registradas"}
                        </p>
                      </div>
                    </td></tr>
                  : solicitudes.map((s, i) => {
                      const bgRow = i % 2 === 0 ? (isDark ? "#141720" : T.surface) : (isDark ? "#1c2030" : T.surfaceAlt);
                      const em    = ESTATUS_META[s.estatus] || ESTATUS_META["En proceso"];
                      const eBg   = isDark ? em.bgD : em.bgL;
                      return (
                        <tr key={s.id_solicitud} className="cursor-pointer transition-colors"
                          style={{ background: bgRow, borderBottom: `1px solid ${T.border}` }}
                          onMouseEnter={e => e.currentTarget.style.background = isDark ? "rgba(244,121,32,0.05)" : "rgba(244,121,32,0.03)"}
                          onMouseLeave={e => e.currentTarget.style.background = bgRow}
                          onClick={() => onVerSolicitud?.(s)}>
                          <td className="px-3 py-2 font-mono text-[10px] font-bold" style={{ color: T.orange }}>{s.folio_solicitud}</td>
                          <td className="px-3 py-2">
                            <span className="flex items-center gap-1 text-[11px] font-bold">
                              <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: PCOLOR[s.prioridad] || "#94a3b8" }} />
                              <span style={{ color: PCOLOR[s.prioridad] || T.textMuted }}>{s.prioridad}</span>
                            </span>
                          </td>
                          <td className="px-3 py-2">
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold"
                              style={{ background: eBg, color: em.color }}>{s.estatus}</span>
                          </td>
                          <td className="px-3 py-2 text-[11px]" style={{ color: T.textMuted }}>
                            <span className="flex items-center gap-1">
                              <Package size={10} style={{ color: T.textFaint }} />
                              {s.total_items ?? "—"}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-[11px] whitespace-nowrap" style={{ color: T.textMuted }}>{fmt(s.fecha)}</td>
                          <td className="px-3 py-2">
                            <button onClick={e => { e.stopPropagation(); onVerSolicitud?.(s); }}
                              className="flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-lg transition-all hover:brightness-110 active:scale-95"
                              style={{ color: T.orange, background: "rgba(244,121,32,0.08)", border: "1px solid rgba(244,121,32,0.2)" }}>
                              <Eye size={10} /> Ver
                            </button>
                          </td>
                        </tr>
                      );
                    })
                }
              </tbody>
            </table>
          </div>

          {/* Paginación */}
          <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2"
            style={{ borderTop: `1px solid ${T.border}`, background: T.bg }}>
            <div className="flex items-center gap-2">
              <button disabled={page <= 1 || cargando} onClick={() => setPage(p => Math.max(1, p - 1))}
                className="px-2 py-1 rounded border" style={{ borderColor: T.border, background: T.surfaceAlt, color: T.text }}>
                Anterior
              </button>
              <button disabled={page >= pages || cargando} onClick={() => setPage(p => Math.min(pages, p + 1))}
                className="px-2 py-1 rounded border" style={{ borderColor: T.border, background: T.surfaceAlt, color: T.text }}>
                Siguiente
              </button>
              <span className="text-[11px] ml-2" style={{ color: T.textMuted }}>{`Página ${page} de ${pages}`}</span>
            </div>
            <div className="flex items-center gap-2">
              <label style={{ color: T.textMuted, fontSize: 10 }}>Mostrar</label>
              <select value={limit} onChange={e => { setLimit(parseInt(e.target.value, 10)); setPage(1); }}
                style={{ padding: "4px", borderRadius: 6, border: `1px solid ${T.border}`, background: T.surface, color: T.text }}>
                {[10, 25, 50, 100].map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
