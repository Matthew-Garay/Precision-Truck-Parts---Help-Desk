import { useState, useEffect, useCallback } from "react";
import { Star, Users, Clock, CheckCircle2, Inbox, FileDown, XCircle, Zap, Activity, Ban, ShieldCheck, X } from "lucide-react";
import { apiFetch, API_ROUTES } from "../../Config/api";
import { useCardStyles } from "../../Components/Card";
import { abrirReporteLista } from "../PrintReportePage";

function Estrellas({ n, isDark }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1,2,3,4,5].map(i => (
        <Star key={i} size={10} fill={i <= n ? "#f59e0b" : "none"}
          style={{ color: i <= n ? "#f59e0b" : isDark ? "rgba(255,255,255,0.15)" : "#d1d5db" }} />
      ))}
    </div>
  );
}

function BarraRendimiento({ val, max, color }) {
  const pct = max > 0 ? Math.min(Math.round((val / max) * 100), 100) : 0;
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(0,0,0,0.1)" }}>
        <div className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="text-[10px] font-black w-6 text-right flex-shrink-0" style={{ color }}>{val}</span>
    </div>
  );
}

const KPI_LIST = [
  { key: "tecnicos",   label: "Técnicos",       color: "#F47920", icon: Users },
  { key: "atendidos",  label: "Atendidos",       color: "#3b82f6", icon: Activity },
  { key: "resueltos",  label: "Resueltos",       color: "#16a34a", icon: CheckCircle2 },
  { key: "noRes",      label: "No resueltos",    color: "#dc2626", icon: XCircle },
  { key: "enProceso",  label: "En proceso",      color: "#f59e0b", icon: Zap },
  { key: "tasaGlobal", label: "Tasa global",     color: null,      icon: CheckCircle2 },
  { key: "promHoras",  label: "Prom. horas",     color: "#8b5cf6", icon: Clock },
  { key: "satisf",     label: "Satisfacción",    color: "#f59e0b", icon: Star },
  { key: "cancelados", label: "Cancelados",      color: "#6b7280", icon: Ban },
  { key: "sla",        label: "Dentro de SLA",   color: null,      icon: ShieldCheck },
];

const COLS = ["#","Técnico","Atendidos","Resueltos","No Res.","Tasa","Prom. h","Rango h","En proceso","Alta prior.","Dentro SLA","% Calif.","Cancelados","Calificación","Calif. rec."];

export default function RendimientoTecnicos({ T }) {
  const [datos, setDatos]           = useState([]);
  const [cargando, setCargando]     = useState(false);
  const [modalPDF, setModalPDF]     = useState(false);
  const [pdfDesde, setPdfDesde]     = useState("");
  const [pdfHasta, setPdfHasta]     = useState("");
  const isDark = T.isDark;
  const { card, hdr } = useCardStyles(T);

  const cargar = useCallback(() => {
    setCargando(true);
    apiFetch(API_ROUTES.TICKETS_RENDIMIENTO)
      .then(r => r.json())
      .then(d => setDatos(Array.isArray(d) ? d : []))
      .catch(() => setDatos([]))
      .finally(() => setCargando(false));
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  // ── Totales ──────────────────────────────────────────────────
  const totalResueltos   = datos.reduce((a, r) => a + Number(r.resueltos ?? 0), 0);
  const totalAtendidos   = datos.reduce((a, r) => a + Number(r.total_atendidos ?? 0), 0);
  const totalNoResueltos = datos.reduce((a, r) => a + Number(r.no_resueltos ?? 0), 0);
  const totalEnProceso   = datos.reduce((a, r) => a + Number(r.en_proceso_activos ?? 0), 0);
  const totalCancelados  = datos.reduce((a, r) => a + Number(r.tickets_cancelados ?? 0), 0);
  const totalSLA         = datos.reduce((a, r) => a + Number(r.resueltos_a_tiempo ?? 0), 0);
  const tasaSLAGlobal    = totalResueltos > 0 ? Math.round((totalSLA / totalResueltos) * 100) : 0;
  const tasaGlobal       = totalAtendidos > 0 ? Math.round((totalResueltos / totalAtendidos) * 100) : 0;
  const promedioHoras    = datos.length > 0
    ? (datos.reduce((a, r) => a + Number(r.promedio_horas ?? 0), 0) / datos.length).toFixed(1)
    : "—";
  const promedioCalif = (() => {
    const con = datos.filter(r => r.calificacion_promedio > 0);
    if (!con.length) return "—";
    return (con.reduce((a, r) => a + Number(r.calificacion_promedio), 0) / con.length).toFixed(2);
  })();

  const kpiValues = {
    tecnicos:   datos.length,
    atendidos:  totalAtendidos,
    resueltos:  totalResueltos,
    noRes:      totalNoResueltos,
    enProceso:  totalEnProceso,
    tasaGlobal: `${tasaGlobal}%`,
    promHoras:  promedioHoras,
    satisf:     promedioCalif,
    cancelados: totalCancelados,
    sla:        `${tasaSLAGlobal}%`,
  };

  const kpiColor = (key, base) => {
    if (key === "tasaGlobal") return tasaGlobal >= 75 ? "#16a34a" : tasaGlobal >= 50 ? "#ca8a04" : "#dc2626";
    if (key === "sla")        return tasaSLAGlobal >= 80 ? "#16a34a" : tasaSLAGlobal >= 60 ? "#ca8a04" : "#dc2626";
    return base;
  };

  // ── Exportar PDF ─────────────────────────────────────────────
  const exportar = () => {
    if (!datos.length) return;
    setModalPDF(false);
    const fmtDate = (d) =>
      new Date(d + "T00:00:00").toLocaleDateString("es-MX", { day: "2-digit", month: "long", year: "numeric" });
    const periodo = pdfDesde && pdfHasta
      ? `${fmtDate(pdfDesde)} – ${fmtDate(pdfHasta)}`
      : "Todo el historial";
    abrirReporteLista({ tipo: "rendimiento", periodo, datos });
  };

  const inputStyle = {
    background: T.surfaceAlt, border: `1px solid ${T.border}`,
    color: T.text, borderRadius: "6px", padding: "6px 10px",
    fontSize: "12px", outline: "none", width: "100%",
  };

  return (
    <div className="flex flex-col h-full" style={{ background: T.bg, overflow: "hidden" }}>

      {/* ── Modal parámetros PDF ──────────────────────────────── */}
      {modalPDF && (
        <div className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.5)" }}
          onClick={e => { if (e.target === e.currentTarget) setModalPDF(false); }}>
          <div className="rounded-2xl p-5 flex flex-col gap-4 w-80" style={card}>

            {/* Header modal */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-0.5 h-4 rounded-full" style={{ background: T.orange }} />
                <p className="text-xs font-black uppercase tracking-widest" style={{ color: T.textMuted }}>Exportar reporte PDF</p>
              </div>
              <button onClick={() => setModalPDF(false)}
                className="rounded-lg p-1 transition-all hover:brightness-110"
                style={{ background: T.surfaceAlt, color: T.textMuted }}>
                <X size={13} />
              </button>
            </div>

            {/* Campos */}
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-black uppercase tracking-wider" style={{ color: T.textMuted }}>Desde (opcional)</label>
                <input type="date" value={pdfDesde} onChange={e => setPdfDesde(e.target.value)} style={inputStyle} />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-black uppercase tracking-wider" style={{ color: T.textMuted }}>Hasta (opcional)</label>
                <input type="date" value={pdfHasta} onChange={e => setPdfHasta(e.target.value)} style={inputStyle} />
              </div>
              {pdfDesde && pdfHasta && pdfDesde > pdfHasta && (
                <p className="text-[10px] font-bold" style={{ color: "#dc2626" }}>La fecha inicio no puede ser mayor a la fecha fin</p>
              )}
            </div>

            {/* Acciones */}
            <div className="flex gap-2 justify-end">
              <button onClick={() => setModalPDF(false)}
                className="px-4 py-1.5 rounded-lg text-[11px] font-bold transition-all hover:brightness-110"
                style={{ background: T.surfaceAlt, color: T.textMuted, border: `1px solid ${T.border}` }}>
                Cancelar
              </button>
              <button
                onClick={exportar}
                disabled={!!(pdfDesde && pdfHasta && pdfDesde > pdfHasta)}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-[11px] font-bold transition-all hover:brightness-110 active:scale-95 disabled:opacity-40"
                style={{ background: "#F47920", color: "#fff" }}>
                <FileDown size={13} strokeWidth={2.5} /> Generar PDF
              </button>
            </div>

          </div>
        </div>
      )}

      <div className="w-full p-3 flex flex-col gap-3 overflow-y-auto flex-1 min-h-0">

        {/* ── KPIs 5×2 ─────────────────────────────────────────── */}
        <div className="grid grid-cols-5 gap-2">
          {KPI_LIST.map(({ key, label, color: baseColor, icon: Icon }) => {
            const color = kpiColor(key, baseColor);
            return (
              <div key={key} className="rounded-xl p-3 flex flex-col gap-1.5 relative overflow-hidden" style={card}>
                <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-xl"
                  style={{ background: `linear-gradient(90deg,${color},${color}33)` }} />
                <div className="flex items-center gap-1.5">
                  <Icon size={11} style={{ color }} />
                  <p className="text-[10px] font-black uppercase tracking-wider truncate" style={{ color: T.textMuted }}>{label}</p>
                </div>
                <span className="text-2xl font-black leading-none" style={{ color }}>{kpiValues[key]}</span>
              </div>
            );
          })}
        </div>

        {/* ── Barra exportar ───────────────────────────────────── */}
        <div className="flex justify-end">
          <button onClick={() => { setPdfDesde(""); setPdfHasta(""); setModalPDF(true); }} disabled={!datos.length}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[11px] font-bold transition-all hover:brightness-110 active:scale-95 disabled:opacity-40"
            style={{ background: "#F47920", color: "#fff" }}>
            <FileDown size={13} strokeWidth={2.5} /> Exportar PDF
          </button>
        </div>

        {/* ── Tabla ─────────────────────────────────────────────── */}
        <div className="rounded-xl overflow-hidden flex flex-col" style={{ ...card, flex: "1 1 0", minHeight: "300px" }}>

          {/* Header tabla */}
          <div className="flex items-center justify-between px-4 py-2.5 flex-shrink-0" style={hdr}>
            <div className="flex items-center gap-2">
              <div className="w-0.5 h-3.5 rounded-full" style={{ background: T.orange }} />
              <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: T.textMuted }}>Detalle por técnico</p>
            </div>
            <div className="flex items-center gap-2">
              {cargando && (
                <svg className="animate-spin" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={T.orange} strokeWidth="2.5">
                  <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                </svg>
              )}
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full"
                style={{ background: T.bg, color: T.textMuted, border: `1px solid ${T.border}` }}>
                {datos.length} resultado{datos.length !== 1 ? "s" : ""}
              </span>
            </div>
          </div>

          <div className="overflow-y-auto overflow-x-auto" style={{ flex: "1 1 0", minHeight: 0 }}>

            {/* Tarjetas móvil */}
            <div className="flex flex-col gap-2 p-3 sm:hidden">
              {datos.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 gap-2">
                  <Inbox size={22} style={{ color: T.textFaint }} />
                  <p className="text-xs font-bold" style={{ color: T.textMuted }}>Sin datos</p>
                </div>
              ) : datos.map((r) => {
                const tasa  = r.total_atendidos > 0 ? Math.round((r.resueltos / r.total_atendidos) * 100) : 0;
                const calif = Number(r.calificacion_promedio ?? 0);
                return (
                  <div key={r.id_tecnico} className="rounded-xl p-3 flex flex-col gap-2"
                    style={{ background: isDark ? "rgba(255,255,255,0.04)" : T.surfaceAlt, border: `1px solid ${T.border}` }}>
                    <p className="text-xs font-black" style={{ color: T.text }}>{r.nombre_tecnico}</p>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div>
                        <p className="text-[9px] font-black uppercase" style={{ color: T.textMuted }}>Atendidos</p>
                        <p className="text-base font-black" style={{ color: "#3b82f6" }}>{r.total_atendidos}</p>
                      </div>
                      <div>
                        <p className="text-[9px] font-black uppercase" style={{ color: T.textMuted }}>Resueltos</p>
                        <p className="text-base font-black" style={{ color: "#16a34a" }}>{r.resueltos}</p>
                      </div>
                      <div>
                        <p className="text-[9px] font-black uppercase" style={{ color: T.textMuted }}>No Res.</p>
                        <p className="text-base font-black" style={{ color: Number(r.no_resueltos) > 0 ? "#dc2626" : T.textFaint }}>{r.no_resueltos ?? 0}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div>
                        <p className="text-[9px] font-black uppercase" style={{ color: T.textMuted }}>Tasa</p>
                        <p className="text-base font-black" style={{ color: T.orange }}>{tasa}%</p>
                      </div>
                      <div>
                        <p className="text-[9px] font-black uppercase" style={{ color: T.textMuted }}>En proceso</p>
                        <p className="text-base font-black" style={{ color: "#f59e0b" }}>{r.en_proceso_activos ?? 0}</p>
                      </div>
                      <div>
                        <p className="text-[9px] font-black uppercase" style={{ color: T.textMuted }}>Alta prior.</p>
                        <p className="text-base font-black" style={{ color: "#dc2626" }}>{r.alta_prioridad_resueltos ?? 0}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      {calif > 0
                        ? <Estrellas n={Math.round(calif)} isDark={isDark} />
                        : <span className="text-[10px]" style={{ color: T.textFaint }}>Sin calificaciones</span>}
                      <span className="text-[10px] font-bold" style={{ color: "#8b5cf6" }}>
                        {r.promedio_horas != null ? `${r.promedio_horas}h prom.` : "—"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Tabla desktop */}
            <div className="hidden sm:block">
              <table className="w-full border-collapse" style={{ minWidth: "900px" }}>
                <thead className="sticky top-0 z-10">
                  <tr style={{ background: isDark ? "#1c2030" : T.surfaceAlt }}>
                    {COLS.map((col, i) => (
                      <th key={i}
                        className="px-3 py-2.5 text-left text-[10px] font-black uppercase tracking-widest whitespace-nowrap"
                        style={{ color: T.textMuted, borderBottom: `2px solid ${T.border}` }}>
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {datos.length === 0 ? (
                    <tr><td colSpan={COLS.length}>
                      <div className="flex flex-col items-center justify-center py-14 gap-2">
                        <Inbox size={24} style={{ color: T.textFaint }} />
                        <p className="text-xs font-bold" style={{ color: T.textMuted }}>Sin datos de rendimiento</p>
                        <p className="text-[11px]" style={{ color: T.textFaint }}>Aún no hay tickets cerrados con técnico asignado</p>
                      </div>
                    </td></tr>
                  ) : datos.map((r, i) => {
                    const bgRow       = i % 2 === 0 ? (isDark ? "#141720" : T.surface) : (isDark ? "#1c2030" : T.surfaceAlt);
                    const tasa        = r.total_atendidos > 0 ? Math.round((r.resueltos / r.total_atendidos) * 100) : 0;
                    const calif       = Number(r.calificacion_promedio ?? 0);
                    const tasaColor   = tasa >= 75 ? "#16a34a" : tasa >= 50 ? "#ca8a04" : "#dc2626";
                    const enProceso   = Number(r.en_proceso_activos ?? 0);
                    const altaPrior   = Number(r.alta_prioridad_resueltos ?? 0);
                    const maxAtend    = Math.max(...datos.map(x => Number(x.total_atendidos ?? 0)), 1);

                    return (
                      <tr key={r.id_tecnico}
                        style={{ background: bgRow, borderBottom: `1px solid ${T.border}` }}
                        onMouseEnter={e => e.currentTarget.style.background = isDark ? "rgba(244,121,32,0.06)" : "rgba(244,121,32,0.04)"}
                        onMouseLeave={e => e.currentTarget.style.background = bgRow}>

                        {/* # */}
                        <td className="px-3 py-2.5 text-[10px] font-black" style={{ color: T.textFaint }}>{i + 1}</td>

                        {/* Técnico */}
                        <td className="px-3 py-2.5">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-black flex-shrink-0"
                              style={{ background: `${T.orange}20`, color: T.orange, border: `1px solid ${T.orange}30` }}>
                              {r.nombre_tecnico.charAt(0).toUpperCase()}
                            </div>
                            <span className="text-[11px] font-semibold whitespace-nowrap" style={{ color: T.text }}>{r.nombre_tecnico}</span>
                          </div>
                        </td>

                        {/* Atendidos */}
                        <td className="px-3 py-2.5" style={{ minWidth: "110px" }}>
                          <BarraRendimiento val={Number(r.total_atendidos)} max={maxAtend} color="#3b82f6" />
                        </td>

                        {/* Resueltos */}
                        <td className="px-3 py-2.5 text-center">
                          <span className="text-[11px] font-black" style={{ color: "#16a34a" }}>{r.resueltos}</span>
                        </td>

                        {/* No resueltos */}
                        <td className="px-3 py-2.5 text-center">
                          <span className="text-[11px] font-black"
                            style={{ color: Number(r.no_resueltos) > 0 ? "#dc2626" : T.textFaint }}>
                            {r.no_resueltos ?? 0}
                          </span>
                        </td>

                        {/* Tasa resolución */}
                        <td className="px-3 py-2.5 text-center">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black"
                            style={{ background: `${tasaColor}15`, color: tasaColor, border: `1px solid ${tasaColor}30` }}>
                            {tasa}%
                          </span>
                        </td>

                        {/* Prom. horas */}
                        <td className="px-3 py-2.5 text-center text-[11px] font-semibold" style={{ color: "#8b5cf6" }}>
                          {r.promedio_horas != null ? `${r.promedio_horas}h` : "—"}
                        </td>

                        {/* Rango horas */}
                        <td className="px-3 py-2.5 text-center text-[10px]" style={{ color: T.textMuted }}>
                          {r.min_horas != null
                            ? <span>{r.min_horas}h – {r.max_horas}h</span>
                            : <span style={{ color: T.textFaint }}>—</span>}
                        </td>

                        {/* En proceso */}
                        <td className="px-3 py-2.5 text-center">
                          {enProceso > 0 ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black"
                              style={{ background: "#f59e0b18", color: "#f59e0b", border: "1px solid #f59e0b30" }}>
                              {enProceso}
                            </span>
                          ) : <span className="text-[10px]" style={{ color: T.textFaint }}>0</span>}
                        </td>

                        {/* Alta prioridad */}
                        <td className="px-3 py-2.5 text-center">
                          {altaPrior > 0 ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black"
                              style={{ background: "#dc262618", color: "#dc2626", border: "1px solid #dc262630" }}>
                              {altaPrior}
                            </span>
                          ) : <span className="text-[10px]" style={{ color: T.textFaint }}>0</span>}
                        </td>

                        {/* Dentro SLA */}
                        <td className="px-3 py-2.5 text-center">
                          {(() => {
                            const sla = Number(r.resueltos_a_tiempo ?? 0);
                            const res = Number(r.resueltos ?? 0);
                            const pct = res > 0 ? Math.round((sla / res) * 100) : 0;
                            const c   = pct >= 80 ? "#16a34a" : pct >= 60 ? "#ca8a04" : "#dc2626";
                            return res > 0 ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-black"
                                style={{ background: `${c}15`, color: c, border: `1px solid ${c}30` }}>
                                {sla}/{res} ({pct}%)
                              </span>
                            ) : <span className="text-[10px]" style={{ color: T.textFaint }}>—</span>;
                          })()}
                        </td>

                        {/* % Calificados */}
                        <td className="px-3 py-2.5 text-center">
                          {(() => {
                            const pct = r.pct_calificados != null ? Number(r.pct_calificados) : null;
                            if (pct === null) return <span className="text-[10px]" style={{ color: T.textFaint }}>—</span>;
                            const c = pct >= 60 ? "#16a34a" : pct >= 30 ? "#ca8a04" : "#dc2626";
                            return (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-black"
                                style={{ background: `${c}15`, color: c, border: `1px solid ${c}30` }}>
                                {pct}%
                              </span>
                            );
                          })()}
                        </td>

                        {/* Cancelados */}
                        <td className="px-3 py-2.5 text-center">
                          {Number(r.tickets_cancelados ?? 0) > 0 ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black"
                              style={{ background: "#6b728018", color: "#6b7280", border: "1px solid #6b728030" }}>
                              {r.tickets_cancelados}
                            </span>
                          ) : <span className="text-[10px]" style={{ color: T.textFaint }}>0</span>}
                        </td>

                        {/* Calificación promedio */}
                        <td className="px-3 py-2.5">
                          {calif > 0 ? (
                            <div className="flex flex-col gap-0.5">
                              <Estrellas n={Math.round(calif)} isDark={isDark} />
                              <span className="text-[9px] font-semibold" style={{ color: T.textFaint }}>{calif.toFixed(2)} / 5.00</span>
                            </div>
                          ) : (
                            <span className="text-[10px]" style={{ color: T.textFaint }}>—</span>
                          )}
                        </td>

                        {/* Calif. recibidas */}
                        <td className="px-3 py-2.5 text-center text-[11px] font-semibold" style={{ color: T.textMuted }}>
                          {r.total_calificaciones}
                        </td>

                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
