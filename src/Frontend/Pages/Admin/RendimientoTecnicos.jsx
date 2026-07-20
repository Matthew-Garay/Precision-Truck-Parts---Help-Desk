import { useState, useEffect, useCallback } from "react";
import { Star, Users, Clock, CheckCircle2, Inbox, FileDown, XCircle, Zap, Activity, Ban, ShieldCheck } from "lucide-react";
import { apiFetch, API_ROUTES } from "../../Config/api";
import { useCardStyles } from "../../Components/Card";
import { abrirReporteLista } from "../PrintReportePage";
import ModalReporte from "../../Components/ModalReporte";

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

const COLS = ["#","Técnico","Atendidos","Resueltos","No Res.","Tasa","Prom. h","SLA","Calificación"];

export default function RendimientoTecnicos({ T }) {
  const [datos, setDatos]           = useState([]);
  const [cargando, setCargando]     = useState(false);
  const [modalPDF, setModalPDF]     = useState(false);
  const [generando, setGenerando]   = useState(false);
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
  const generarReporte = ({ fecha_inicio, fecha_fin }) => {
    if (!datos.length) return;
    setGenerando(true);
    setModalPDF(false);
    const fmtDate = d => new Date(d + "T00:00:00").toLocaleDateString("es-MX", { day: "2-digit", month: "long", year: "numeric" });
    const periodo = fecha_inicio && fecha_fin
      ? `${fmtDate(fecha_inicio)} – ${fmtDate(fecha_fin)}`
      : "Todo el historial";
    abrirReporteLista({ tipo: "rendimiento", periodo, datos });
    setGenerando(false);
  };

  return (
    <>
    <div className="flex flex-col h-full" style={{ background: T.bg, overflow: "hidden" }}>

      <div className="w-full p-3 flex flex-col gap-3 overflow-y-auto flex-1 min-h-0">

        {/* ── KPIs 2 cols móvil → 5 cols desktop ───────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
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
          <button onClick={() => setModalPDF(true)} disabled={!datos.length}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[11px] font-bold transition-all hover:brightness-110 active:scale-95 disabled:opacity-40"
            style={{ background: "#F47920", color: "#fff" }}>
            <FileDown size={13} strokeWidth={2.5} /> Exportar PDF
          </button>
        </div>

        {/* ── Tabla ─────────────────────────────────────────────── */}
        <div className="rounded-xl overflow-hidden flex flex-col" style={{ ...card, flex: "1 1 0", minHeight: 0 }}>

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

          <div className="overflow-x-auto overflow-y-auto" style={{ flex: "1 1 0", minHeight: 0 }}>
            <table className="w-full border-collapse" style={{ minWidth: "640px" }}>
              <thead className="sticky top-0 z-10">
                <tr style={{ background: isDark ? "#1c2030" : T.surfaceAlt }}>
                  {COLS.map((col, i) => (
                    <th key={i}
                      className="px-3 py-2 text-left text-[10px] font-black uppercase tracking-widest"
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
                  const bgRow     = i % 2 === 0 ? (isDark ? "#141720" : T.surface) : (isDark ? "#1c2030" : T.surfaceAlt);
                  const tasa      = r.total_atendidos > 0 ? Math.round((r.resueltos / r.total_atendidos) * 100) : 0;
                  const calif     = Number(r.calificacion_promedio ?? 0);
                  const tasaColor = tasa >= 75 ? "#16a34a" : tasa >= 50 ? "#ca8a04" : "#dc2626";
                  const maxAtend  = Math.max(...datos.map(x => Number(x.total_atendidos ?? 0)), 1);
                  const sla       = Number(r.resueltos_a_tiempo ?? 0);
                  const res       = Number(r.resueltos ?? 0);
                  const slaPct    = res > 0 ? Math.round((sla / res) * 100) : 0;
                  const slaColor  = slaPct >= 80 ? "#16a34a" : slaPct >= 60 ? "#ca8a04" : "#dc2626";

                  return (
                    <tr key={r.id_tecnico}
                      style={{ background: bgRow, borderBottom: `1px solid ${T.border}` }}
                      onMouseEnter={e => e.currentTarget.style.background = isDark ? "rgba(244,121,32,0.06)" : "rgba(244,121,32,0.04)"}
                      onMouseLeave={e => e.currentTarget.style.background = bgRow}>

                      <td className="px-3 py-2 text-[10px] font-black" style={{ color: T.textFaint }}>{i + 1}</td>

                      <td className="px-3 py-2">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-black flex-shrink-0"
                            style={{ background: `${T.orange}20`, color: T.orange, border: `1px solid ${T.orange}30` }}>
                            {r.nombre_tecnico.charAt(0).toUpperCase()}
                          </div>
                          <span className="text-[11px] font-semibold truncate" style={{ color: T.text }}>{r.nombre_tecnico}</span>
                        </div>
                      </td>

                      <td className="px-3 py-2" style={{ minWidth: "90px" }}>
                        <BarraRendimiento val={Number(r.total_atendidos)} max={maxAtend} color="#3b82f6" />
                      </td>

                      <td className="px-3 py-2 text-center">
                        <span className="text-[11px] font-black" style={{ color: "#16a34a" }}>{r.resueltos}</span>
                      </td>

                      <td className="px-3 py-2 text-center">
                        <span className="text-[11px] font-black"
                          style={{ color: Number(r.no_resueltos) > 0 ? "#dc2626" : T.textFaint }}>
                          {r.no_resueltos ?? 0}
                        </span>
                      </td>

                      <td className="px-3 py-2 text-center">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black"
                          style={{ background: `${tasaColor}15`, color: tasaColor, border: `1px solid ${tasaColor}30` }}>
                          {tasa}%
                        </span>
                      </td>

                      <td className="px-3 py-2 text-center text-[11px] font-semibold" style={{ color: "#8b5cf6" }}>
                        {r.promedio_horas != null ? `${r.promedio_horas}h` : "—"}
                      </td>

                      <td className="px-3 py-2 text-center">
                        {res > 0 ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black"
                            style={{ background: `${slaColor}15`, color: slaColor, border: `1px solid ${slaColor}30` }}>
                            {slaPct}%
                          </span>
                        ) : <span className="text-[10px]" style={{ color: T.textFaint }}>—</span>}
                      </td>

                      <td className="px-3 py-2">
                        {calif > 0 ? (
                          <div className="flex flex-col gap-0.5">
                            <Estrellas n={Math.round(calif)} isDark={isDark} />
                            <span className="text-[9px]" style={{ color: T.textFaint }}>{calif.toFixed(1)}/5</span>
                          </div>
                        ) : <span className="text-[10px]" style={{ color: T.textFaint }}>—</span>}
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

    {modalPDF && (
      <ModalReporte
        T={T}
        admins={[]}
        generando={generando}
        titulo="Rendimiento Técnico"
        onClose={() => setModalPDF(false)}
        onGenerar={generarReporte}
      />
    )}
    </>
  );
}
