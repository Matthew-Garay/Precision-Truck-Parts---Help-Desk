import { useState } from "react";
import { User, TrendingUp, Clock, CheckCircle2, Timer, Building2, BarChart2, AlertTriangle } from "lucide-react";
import { RelojFecha, Calendario } from "../Config/theme.jsx";

// -- TENDENCIA CHART (HTML puro, sin SVG, 100% responsive) ----
function TendenciaChart({ tendencia, T, isDark, MESES_CORTOS }) {
  const maxVal    = Math.max(...tendencia.map(t => t.total), 1);
  const totalAcum = tendencia.reduce((s, t) => s + t.total, 0);
  const totalRes  = tendencia.reduce((s, t) => s + t.resueltos, 0);
  const tasaGlobal = totalAcum > 0 ? Math.round((totalRes / totalAcum) * 100) : 0;

  return (
    <div style={{ width: "100%" }}>

      {/* Fila de valores numéricos */}
      <div style={{ display: "flex", gap: "4px", marginBottom: "4px" }}>
        {tendencia.map((t, i) => {
          const esUltimo = i === tendencia.length - 1;
          return (
            <div key={i} style={{ flex: 1, display: "flex", justifyContent: "center" }}>
              <span style={{
                fontSize: "8px", fontWeight: 800, lineHeight: 1,
                color: esUltimo ? T.orange : (isDark ? "rgba(255,255,255,0.35)" : "#94a3b8"),
                visibility: t.total > 0 ? "visible" : "hidden",
              }}>
                {t.total}
              </span>
            </div>
          );
        })}
      </div>

      {/* Zona de barras */}
      <div style={{ display: "flex", alignItems: "flex-end", gap: "4px", height: "72px", width: "100%" }}>
        {tendencia.map((t, i) => {
          const esUltimo = i === tendencia.length - 1;
          const pctT = t.total     > 0 ? Math.max((t.total     / maxVal) * 100, 5) : 0;
          const pctR = t.resueltos > 0 ? Math.max((t.resueltos / maxVal) * 100, 3) : 0;
          const colorT = esUltimo ? T.orange : (isDark ? "rgba(244,121,32,0.55)" : "rgba(244,121,32,0.45)");
          const colorR = esUltimo ? "#16a34a" : (isDark ? "rgba(22,163,74,0.6)" : "rgba(22,163,74,0.5)");
          return (
            <div key={i} style={{ flex: 1, minWidth: 0, display: "flex", alignItems: "flex-end", gap: "2px", height: "100%" }}>
              <div style={{ flex: 1, height: `${pctT}%`, minHeight: t.total > 0 ? "4px" : "0", background: colorT, borderRadius: "3px 3px 1px 1px", transition: "height 0.4s ease" }} />
              <div style={{ flex: 1, height: `${pctR}%`, minHeight: t.resueltos > 0 ? "3px" : "0", background: colorR, borderRadius: "3px 3px 1px 1px", transition: "height 0.4s ease" }} />
            </div>
          );
        })}
      </div>

      {/* Fila de etiquetas de mes */}
      <div style={{ display: "flex", gap: "4px", marginTop: "4px" }}>
        {tendencia.map((t, i) => {
          const [, mesNum] = t.mes.split("-");
          const label    = MESES_CORTOS[parseInt(mesNum) - 1];
          const esUltimo = i === tendencia.length - 1;
          return (
            <div key={i} style={{ flex: 1, display: "flex", justifyContent: "center" }}>
              <span style={{ fontSize: "8px", fontWeight: esUltimo ? 800 : 500, lineHeight: 1, color: esUltimo ? T.orange : (isDark ? "rgba(255,255,255,0.28)" : "#94a3b8") }}>
                {label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Panel de datos — siempre visible */}
      <div style={{
        marginTop: "10px",
        borderRadius: "8px",
        overflow: "hidden",
        border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : T.border}`,
      }}>
        <div style={{
          display: "grid", gridTemplateColumns: "1fr 1fr 1fr",
          background: isDark ? "rgba(255,255,255,0.03)" : T.surfaceAlt,
        }}>
          {[
            { label: "Total",     val: totalAcum, color: T.orange },
            { label: "Resueltos", val: totalRes,  color: "#16a34a" },
            { label: "Tasa",      val: `${tasaGlobal}%`, color: tasaGlobal >= 75 ? "#16a34a" : tasaGlobal >= 50 ? "#ca8a04" : "#dc2626" },
          ].map(({ label, val, color }, i) => (
            <div key={i} style={{
              padding: "7px 8px",
              borderRight: i < 2 ? `1px solid ${isDark ? "rgba(255,255,255,0.07)" : T.border}` : "none",
              display: "flex", flexDirection: "column", alignItems: "center", gap: "2px",
            }}>
              <span style={{ fontSize: "13px", fontWeight: 900, color, lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>{val}</span>
              <span style={{ fontSize: "8px", fontWeight: 600, color: isDark ? "rgba(255,255,255,0.3)" : "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Leyenda */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "8px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
          <span style={{ width: "8px", height: "8px", borderRadius: "2px", background: T.orange, flexShrink: 0 }} />
          <span style={{ fontSize: "9px", fontWeight: 600, color: isDark ? "rgba(255,255,255,0.35)" : "#94a3b8" }}>Total</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
          <span style={{ width: "8px", height: "8px", borderRadius: "2px", background: "#16a34a", flexShrink: 0 }} />
          <span style={{ fontSize: "9px", fontWeight: 600, color: isDark ? "rgba(255,255,255,0.35)" : "#94a3b8" }}>Resueltos</span>
        </div>
        <span style={{ marginLeft: "auto", fontSize: "9px", fontWeight: 700, padding: "2px 7px", borderRadius: "99px", background: isDark ? "rgba(255,255,255,0.06)" : "#f1f5f9", color: isDark ? "rgba(255,255,255,0.3)" : "#94a3b8" }}>
          {tendencia.length}m
        </span>
      </div>
    </div>
  );
}

// â”€â”€ GRAFICA PASTEL â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export function GraficaPastel({ data, size = 80, T }) {
  const total  = data.reduce((s, d) => s + d.valor, 0);
  const isDark = T?.isDark;
  const r = size / 2 - 8, cx = size / 2, cy = size / 2;
  const circ = 2 * Math.PI * r;

  if (total === 0) return (
    <svg width={size} height={size}>
      <circle cx={cx} cy={cy} r={r} fill="none"
        stroke={isDark ? "rgba(255,255,255,0.1)" : "#e2e8f0"} strokeWidth="10" />
      <text x={cx} y={cy + 4} textAnchor="middle" fontSize="9"
        fill={isDark ? "rgba(255,255,255,0.3)" : "#94a3b8"} fontWeight="600">Sin datos</text>
    </svg>
  );

  let offset = 0;
  const segs = data.map(d => {
    const dash = (d.valor / total) * circ;
    const s = { ...d, dash, gap: circ - dash, offset };
    offset += dash;
    return s;
  });

  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        {segs.map((s, i) => (
          <circle key={i} cx={cx} cy={cy} r={r} fill="none"
            stroke={s.color} strokeWidth="10"
            strokeDasharray={`${s.dash} ${s.gap}`}
            strokeDashoffset={-s.offset} strokeLinecap="butt" />
        ))}
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
        <span style={{ fontSize: "15px", fontWeight: 900, lineHeight: 1,
          color: isDark ? "#f1f5f9" : "#1D1D1B" }}>{total}</span>
        <span style={{ fontSize: "8px", fontWeight: 600, marginTop: "2px",
          color: isDark ? "rgba(255,255,255,0.4)" : "#94a3b8" }}>total</span>
      </div>
    </div>
  );
}

// â”€â”€ SECCIÃ“N MÃ‰TRICAS AVANZADAS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export function SeccionMetricas({ T, metricas }) {
  const isDark = T.isDark;
  if (!metricas) return null;

  const { promedio_horas = 0, porDepartamento = [], tendencia = [] } = metricas;

  const cardStyle = {
    background: isDark ? "#141720" : T.surface,
    border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : T.border}`,
    boxShadow: isDark ? "0 4px 20px rgba(0,0,0,0.4)" : "0 1px 6px rgba(0,0,0,0.06)",
  };
  const hdr = {
    borderBottom: `1px solid ${isDark ? "rgba(255,255,255,0.07)" : T.border}`,
    background: isDark ? "rgba(255,255,255,0.03)" : T.surfaceAlt,
  };

  // Tiempo promedio formateado
  const horas = parseFloat(promedio_horas) || 0;
  const tiempoLabel = horas === 0 ? "â€”"
    : horas < 1 ? `${Math.round(horas * 60)} min`
    : horas < 24 ? `${horas.toFixed(1)} h`
    : `${(horas / 24).toFixed(1)} dias`;

  // Tendencia: etiquetas de mes abreviadas
  const MESES_CORTOS = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];

  // Departamentos: maximo 5
  const deptos = porDepartamento.slice(0, 5);
  const maxDepto = Math.max(...deptos.map(d => d.total), 1);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3 w-full">

      {/* Tiempo promedio de resolucion */}
      <div className="rounded-xl overflow-hidden" style={cardStyle}>
        <div className="px-4 py-2.5 flex items-center gap-2" style={hdr}>
          <div className="w-1 h-3.5 rounded-full" style={{ background: "#3b82f6" }} />
          <Timer size={11} style={{ color: isDark ? "rgba(255,255,255,0.4)" : T.textMuted }} />
          <p className="text-[10px] font-black uppercase tracking-widest"
            style={{ color: isDark ? "rgba(255,255,255,0.45)" : T.textMuted }}>Tiempo Prom. Resolucion</p>
        </div>
        <div className="px-4 py-4 flex flex-col items-center justify-center gap-1">
          <span className="text-4xl font-black" style={{ color: "#3b82f6" }}>{tiempoLabel}</span>
          <span className="text-[10px] font-semibold" style={{ color: T.textMuted }}>promedio por ticket resuelto</span>
          <div className="mt-2 flex items-center gap-1.5 px-3 py-1 rounded-full"
            style={{ background: isDark ? "rgba(59,130,246,0.12)" : "#eff6ff", border: "1px solid rgba(59,130,246,0.2)" }}>
            <Clock size={10} style={{ color: "#3b82f6" }} />
            <span className="text-[10px] font-bold" style={{ color: "#3b82f6" }}>SLA: 2 días</span>
          </div>
        </div>
      </div>

      {/* Tickets por departamento */}
      <div className="rounded-xl overflow-hidden" style={cardStyle}>
        <div className="px-4 py-2.5 flex items-center gap-2" style={hdr}>
          <div className="w-1 h-3.5 rounded-full" style={{ background: "#F47920" }} />
          <Building2 size={11} style={{ color: isDark ? "rgba(255,255,255,0.4)" : T.textMuted }} />
          <p className="text-[10px] font-black uppercase tracking-widest"
            style={{ color: isDark ? "rgba(255,255,255,0.45)" : T.textMuted }}>Tickets por Departamento</p>
        </div>
        <div className="px-4 py-3 flex flex-col gap-2">
          {deptos.length === 0 ? (
            <p className="text-xs text-center py-3" style={{ color: T.textFaint }}>Sin datos</p>
          ) : deptos.map((d, i) => {
            const pct = Math.round((d.total / maxDepto) * 100);
            const resPct = d.total > 0 ? Math.round((d.resueltos / d.total) * 100) : 0;
            return (
              <div key={i} className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold truncate max-w-[65%]"
                    style={{ color: isDark ? "rgba(255,255,255,0.65)" : T.text }}>
                    {d.departamento || "Sin depto."}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-black" style={{ color: T.orange }}>{d.total}</span>
                    <span className="text-[9px]" style={{ color: "#16a34a" }}>({resPct}% res.)</span>
                  </div>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden"
                  style={{ background: isDark ? "rgba(255,255,255,0.06)" : T.border }}>
                  <div className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${Math.max(pct, 4)}%`, background: `linear-gradient(90deg, #F47920, #ffb347)` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tendencia mensual */}
      <div className="rounded-xl overflow-hidden" style={cardStyle}>
        <div className="px-4 py-2.5 flex items-center justify-between" style={hdr}>
          <div className="flex items-center gap-2">
            <div className="w-1 h-3.5 rounded-full" style={{ background: "#16a34a" }} />
            <BarChart2 size={11} style={{ color: isDark ? "rgba(255,255,255,0.4)" : T.textMuted }} />
            <p className="text-[10px] font-black uppercase tracking-widest"
              style={{ color: isDark ? "rgba(255,255,255,0.45)" : T.textMuted }}>Tendencia Mensual</p>
          </div>
          {tendencia.length >= 2 && (() => {
            const diff = tendencia[tendencia.length-1].total - tendencia[tendencia.length-2].total;
            const sube = diff > 0;
            return (
              <span className="flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full"
                style={{
                  background: sube ? (isDark ? "rgba(220,38,38,0.12)" : "#fef2f2") : (isDark ? "rgba(22,163,74,0.12)" : "#f0fdf4"),
                  color: sube ? "#dc2626" : "#16a34a",
                }}>
                {sube ? "▲" : "▼"} {Math.abs(diff)} vs ant.
              </span>
            );
          })()}
        </div>
        <div className="px-3 pt-3 pb-2">
          {tendencia.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-6 gap-2">
              <BarChart2 size={20} style={{ color: T.textFaint }} />
              <p className="text-[11px]" style={{ color: T.textFaint }}>Sin datos</p>
            </div>
          ) : (
            <TendenciaChart tendencia={tendencia} T={T} isDark={isDark} MESES_CORTOS={MESES_CORTOS} />
          )}
        </div>
      </div>

    </div>
  );
}

// â”€â”€ SECCIÃ“N ESTADISTICAS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export function SeccionMetricasUsuario({ T, tickets = [] }) {
  const isDark = T.isDark;
  const total     = tickets.length;
  const resueltos = tickets.filter(t => t.estatus === "Resuelto").length;
  const enProceso = tickets.filter(t => t.estatus === "En proceso").length;
  const noRes     = tickets.filter(t => t.estatus === "No Resuelto").length;

  const conTiempo = tickets.filter(t => t.estatus === "Resuelto" && t.fecha_subido && t.fecha_resuelto);
  const promedioH = conTiempo.length > 0
    ? conTiempo.reduce((s, t) => s + (new Date(t.fecha_resuelto) - new Date(t.fecha_subido)) / 36e5, 0) / conTiempo.length
    : 0;
  const fmtTiempo = promedioH === 0 ? "â€”"
    : promedioH < 1 ? `${Math.round(promedioH * 60)} min`
    : promedioH < 24 ? `${promedioH.toFixed(1)} h`
    : `${(promedioH / 24).toFixed(1)} dias`;

  const tasaRes = total > 0 ? Math.round((resueltos / total) * 100) : 0;

  const cardStyle = {
    background: isDark ? "#141720" : T.surface,
    border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : T.border}`,
    boxShadow: isDark ? "0 4px 20px rgba(0,0,0,0.4)" : "0 1px 6px rgba(0,0,0,0.06)",
  };

  const stats = [
    { label: "Mis tickets",   val: total,     color: "#3b82f6", bgL: "#eff6ff", bgD: "#0f1f3d" },
    { label: "En proceso",    val: enProceso, color: "#F47920", bgL: "#fff7ed", bgD: "#2d1200" },
    { label: "Resueltos",     val: resueltos, color: "#16a34a", bgL: "#f0fdf4", bgD: "#071a0e" },
    { label: "Sin resolver",  val: noRes,     color: "#dc2626", bgL: "#fef2f2", bgD: "#2d0a0a" },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3 mb-3 w-full">
      {stats.map((s, i) => (
        <div key={i} className="rounded-xl px-3 py-2.5 flex flex-col gap-1"
          style={{ background: isDark ? s.bgD : s.bgL, border: `1px solid ${isDark ? "rgba(255,255,255,0.07)" : T.border}` }}>
          <p className="text-[9px] font-bold uppercase tracking-wider" style={{ color: isDark ? "rgba(255,255,255,0.4)" : T.textMuted }}>{s.label}</p>
          <p className="text-2xl font-black leading-none" style={{ color: s.color }}>{s.val}</p>
        </div>
      ))}

      <div className="rounded-xl px-3 py-2.5 flex flex-col gap-1 col-span-1" style={cardStyle}>
        <p className="text-[9px] font-bold uppercase tracking-wider" style={{ color: T.textMuted }}>Tasa resolucion</p>
        <p className="text-2xl font-black leading-none" style={{ color: "#16a34a" }}>{tasaRes}%</p>
        <div className="h-1 rounded-full overflow-hidden mt-1" style={{ background: isDark ? "rgba(255,255,255,0.08)" : T.border }}>
          <div className="h-full rounded-full transition-all duration-700"
            style={{ width: `${tasaRes}%`, background: "linear-gradient(90deg,#16a34a,#4ade80)" }} />
        </div>
      </div>

      <div className="rounded-xl px-3 py-2.5 flex flex-col gap-1 col-span-1" style={cardStyle}>
        <p className="text-[9px] font-bold uppercase tracking-wider" style={{ color: T.textMuted }}>Tiempo prom.</p>
        <p className="text-xl font-black leading-none" style={{ color: "#3b82f6" }}>{fmtTiempo}</p>
        <p className="text-[9px]" style={{ color: T.textFaint }}>por ticket resuelto</p>
      </div>
    </div>
  );
}

export function SeccionEstadisticas({ T, tickets = [] }) {
  const isDark = T.isDark;
  const total  = tickets.length;

  const prioridadData = [
    { label: "Urgente", color: "#dc2626", bg: "#fee2e2" },
    { label: "Alta",    color: "#ea580c", bg: "#ffedd5" },
    { label: "Media",   color: "#ca8a04", bg: "#fef9c3" },
    { label: "Baja",    color: "#16a34a", bg: "#dcfce7" },
  ].map(p => ({ ...p, valor: tickets.filter(t => t.prioridad === p.label).length }));

  const estatusData = [
    { label: "Resuelto",    color: "#16a34a", valor: tickets.filter(t => t.estatus === "Resuelto").length },
    { label: "En proceso",  color: "#ca8a04", valor: tickets.filter(t => t.estatus === "En proceso").length },
    { label: "No Resuelto", color: "#ea580c", valor: tickets.filter(t => t.estatus === "No Resuelto").length },
  ];
  const totalEstatus = estatusData.reduce((s, d) => s + d.valor, 0);

  const cardStyle = {
    background: isDark ? "#141720" : T.surface,
    border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : T.border}`,
    boxShadow: isDark ? "0 4px 20px rgba(0,0,0,0.4)" : "0 1px 6px rgba(0,0,0,0.06)",
  };
  const hdr = {
    borderBottom: `1px solid ${isDark ? "rgba(255,255,255,0.07)" : T.border}`,
    background: isDark ? "rgba(255,255,255,0.03)" : T.surfaceAlt,
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3 w-full">
      <div className="rounded-xl overflow-hidden" style={cardStyle}>
        <div className="px-4 py-2.5 flex items-center gap-2" style={hdr}>
          <div className="w-1 h-3.5 rounded-full" style={{ background: "#F47920" }} />
          <p className="text-[10px] font-black uppercase tracking-widest"
            style={{ color: isDark ? "rgba(255,255,255,0.45)" : T.textMuted }}>Reportes por Prioridad</p>
        </div>
        <div className="px-4 py-3 flex flex-col gap-2.5">
          {prioridadData.map((p, i) => {
            const pct = total > 0 ? Math.round((p.valor / total) * 100) : 0;
            return (
              <div key={i} className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
                    <span className="text-[11px] font-semibold"
                      style={{ color: isDark ? "rgba(255,255,255,0.65)" : T.text }}>{p.label}</span>
                  </div>
                  <span className="text-[11px] font-black" style={{ color: p.color }}>{p.valor}</span>
                </div>
                <div className="relative h-4 rounded-full overflow-hidden"
                  style={{ background: isDark ? "rgba(255,255,255,0.06)" : p.bg }}>
                  <div className="h-full rounded-full flex items-center justify-end pr-2 transition-all duration-700"
                    style={{ width: `${pct > 0 ? Math.max(pct, 10) : 0}%`, background: p.color }}>
                    {p.valor > 0 && <span className="text-[9px] font-black text-white">{pct}%</span>}
                  </div>
                  {p.valor === 0 && (
                    <span className="absolute inset-0 flex items-center pl-2.5 text-[9px]"
                      style={{ color: isDark ? "rgba(255,255,255,0.2)" : T.textFaint }}>Sin registros</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="rounded-xl overflow-hidden flex flex-col" style={cardStyle}>
        <div className="px-4 py-2.5 flex items-center gap-2" style={hdr}>
          <div className="w-1 h-3.5 rounded-full" style={{ background: "#F47920" }} />
          <p className="text-[10px] font-black uppercase tracking-widest"
            style={{ color: isDark ? "rgba(255,255,255,0.45)" : T.textMuted }}>Reportes por Estatus</p>
        </div>
        <div className="px-4 py-3 flex gap-4 flex-1">
          <div className="flex-shrink-0"><GraficaPastel data={estatusData} size={80} T={T} /></div>
          <div className="flex flex-col gap-2.5 flex-1 justify-center">
            {estatusData.map((e, i) => {
              const pct = totalEstatus > 0 ? Math.round((e.valor / totalEstatus) * 100) : 0;
              return (
                <div key={i} className="flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: e.color }} />
                      <span className="text-[11px] font-semibold"
                        style={{ color: isDark ? "rgba(255,255,255,0.65)" : T.text }}>{e.label}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] font-black" style={{ color: e.color }}>{e.valor}</span>
                      <span className="text-[9px] font-semibold" style={{ color: T.textFaint }}>({pct}%)</span>
                    </div>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden"
                    style={{ background: isDark ? "rgba(255,255,255,0.06)" : T.border }}>
                    <div className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${pct > 0 ? Math.max(pct, 5) : 0}%`, background: e.color }} />
                  </div>
                </div>
              );
            })}
            <div className="mt-1 pt-2 border-t" style={{ borderColor: isDark ? "rgba(255,255,255,0.07)" : T.border }}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[9px] font-black uppercase tracking-widest" style={{ color: T.textFaint }}>
                  Tasa de resolucion
                </span>
                <span className="text-[10px] font-black" style={{ color: "#16a34a" }}>
                  {totalEstatus > 0 ? Math.round((estatusData[0].valor / totalEstatus) * 100) : 0}%
                </span>
              </div>
              <div className="h-1.5 rounded-full overflow-hidden"
                style={{ background: isDark ? "rgba(255,255,255,0.06)" : T.border }}>
                <div className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${totalEstatus > 0 ? Math.round((estatusData[0].valor / totalEstatus) * 100) : 0}%`,
                    background: "linear-gradient(90deg, #16a34a, #4ade80)",
                  }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// â”€â”€ KANBAN BOARD â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const PRIORIDADES = [
  { id: "Urgente", label: "Urgente", color: "#dc2626", bg: "#fee2e2", bgDark: "rgba(220,38,38,0.18)" },
  { id: "Alta",    label: "Alta",    color: "#ea580c", bg: "#ffedd5", bgDark: "rgba(234,88,12,0.18)"  },
  { id: "Media",   label: "Media",   color: "#ca8a04", bg: "#fef9c3", bgDark: "rgba(202,138,4,0.18)"  },
  { id: "Baja",    label: "Baja",    color: "#16a34a", bg: "#dcfce7", bgDark: "rgba(22,163,74,0.18)"  },
];

export function KanbanBoard({ T, tickets = [], onVerTicket, inline = false }) {
  const isDark = T.isDark;

  const ticketsEnProceso = tickets.filter(t => t.estatus === "En proceso" || t.estatus === "En Proceso");

  const grupos = {};
  PRIORIDADES.forEach(p => { grupos[p.id] = []; });
  ticketsEnProceso.forEach(t => { if (grupos[t.prioridad]) grupos[t.prioridad].push(t); });

  const columnas = PRIORIDADES.map(prioridad => {
    const tks       = grupos[prioridad.id];
    const bgCol     = isDark ? "#141720" : T.surface;
    const borderCol = isDark ? "rgba(255,255,255,0.08)" : T.border;
    return (
      <div key={prioridad.id}
        className="flex flex-col rounded-xl overflow-hidden w-full md:flex-1"
        style={{ minWidth: "200px", background: bgCol, border: `1px solid ${borderCol}`,
          boxShadow: isDark ? "0 4px 20px rgba(0,0,0,0.4)" : "0 1px 6px rgba(0,0,0,0.06)" }}>
        <div className="px-4 py-3 flex items-center justify-between flex-shrink-0"
          style={{ background: isDark ? "rgba(255,255,255,0.03)" : T.surfaceAlt,
            borderBottom: `1px solid ${borderCol}` }}>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full" style={{ background: prioridad.color }} />
            <span className="text-sm font-bold" style={{ color: prioridad.color }}>{prioridad.label}</span>
          </div>
          <span className="px-2 py-0.5 rounded-full text-xs font-bold"
            style={{ background: isDark ? prioridad.bgDark : prioridad.bg, color: prioridad.color }}>
            {tks.length}
          </span>
        </div>
        <div className="overflow-y-auto p-3 flex flex-col gap-2.5"
          style={{ maxHeight: "320px", minHeight: "80px" }}>
          {tks.length === 0 ? (
            <div className="flex items-center justify-center py-6">
              <p className="text-xs" style={{ color: T.textFaint }}>Sin tickets</p>
            </div>
          ) : tks.map(t => (
            <div key={t.id_ticket}
              className="p-3 rounded-xl cursor-pointer transition-all hover:scale-[1.01] active:scale-95 flex flex-col gap-2"
              style={{ background: isDark ? "rgba(255,255,255,0.05)" : T.bg,
                border: `1px solid ${borderCol}`,
                boxShadow: isDark ? "0 2px 8px rgba(0,0,0,0.3)" : "0 1px 4px rgba(0,0,0,0.06)" }}
              onClick={() => onVerTicket(t)}>
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: prioridad.color }} />
                  <span className="text-[10px] font-mono font-black" style={{ color: T.orange }}>
                    #{t.folio_ticket}
                  </span>
                </div>
                <img src={isDark ? "/assets/img/logo%20blanco.png" : "/assets/img/logo%20negro.png"}
                  alt="logo" className="h-4 object-contain opacity-50" />
              </div>
              <p className="text-xs font-semibold leading-snug line-clamp-2" style={{ color: T.text }}>
                {t.titulo}
              </p>
              <div className="pt-1.5 flex items-center justify-between"
                style={{ borderTop: `1px solid ${borderCol}` }}>
                <span className="text-[10px] truncate max-w-[60%]" style={{ color: T.textMuted }}>
                  {t.nombre_empleado || "â€”"}
                </span>
                <span className="text-[10px] font-semibold flex-shrink-0" style={{ color: T.textFaint }}>
                  {t.fecha_subido
                    ? new Date(t.fecha_subido).toLocaleDateString("es-MX", { day: "2-digit", month: "2-digit" })
                    : "â€”"}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  });

  if (inline) return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 flex-1 overflow-y-auto md:overflow-y-hidden" style={{ minWidth: 0 }}>
        {columnas}
      </div>
    </div>
  );
  return (
    <div className="h-full flex flex-col overflow-hidden px-3 pt-2 pb-4 md:px-4">
      <div className="flex-1 overflow-x-auto">
        <div className="flex gap-3 h-full" style={{ minWidth: "max-content" }}>{columnas}</div>
      </div>
    </div>
  );
}

// ── PANEL DERECHO (Glassmorphism) ──────────────────────────────
// Props:
//   T            → tokens de tema (LIGHT | DARK)
//   nombre       → nombre completo del usuario
//   departamento → cargo / departamento
//   foto         → URL de la foto de perfil (null = avatar genérico)
//   tickets      → array de tickets para calcular KPIs
//   etiquetaRol  → badge de rol (ej. "Administrador")
//   insumosStockBajo → array [{ nombre, marca, nombre_categoria }] con stock = 0
//   tareasHoy    → array [{ hora, titulo, tipo }] de tareas del día
export function PanelDerecho({
  T,
  nombre,
  departamento,
  foto,
  tickets        = [],
  etiquetaRol    = "Activo",
}) {
  const isDark    = T.isDark;
  const total     = tickets.length;
  const enProceso = tickets.filter(t => t.estatus === "En proceso").length;
  const resueltos = tickets.filter(t => t.estatus === "Resuelto").length;
  const noRes     = tickets.filter(t => t.estatus === "No Resuelto").length;

  // ── Estilos base glassmorphism ──
  const glassBase = isDark
    ? { background: "rgba(13,17,23,0.72)", backdropFilter: "blur(18px)", WebkitBackdropFilter: "blur(18px)", borderLeft: "1px solid rgba(255,255,255,0.07)" }
    : { background: "rgba(255,255,255,0.65)", backdropFilter: "blur(18px)", WebkitBackdropFilter: "blur(18px)", borderLeft: "1px solid rgba(0,0,0,0.07)" };

  const divider = <div style={{ height: "1px", background: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)", margin: "2px 0" }} />;

  const sectionLabel = (text) => (
    <p style={{ fontSize: "9px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em",
      color: isDark ? "rgba(255,255,255,0.3)" : "#9CA3AF", margin: "0 0 6px" }}>
      {text}
    </p>
  );

  // ── KPIs ──
  const kpis = [
    { label: "Total Tickets", valor: total,      color: "#2563EB", bgL: "rgba(37,99,235,0.08)",   bgD: "rgba(37,99,235,0.15)"  },
    { label: "En Proceso",    valor: enProceso,  color: "#F47920", bgL: "rgba(244,121,32,0.08)",  bgD: "rgba(244,121,32,0.15)" },
    { label: "Resueltos",     valor: resueltos,  color: "#16a34a", bgL: "rgba(22,163,74,0.08)",   bgD: "rgba(22,163,74,0.15)"  },
    { label: "Sin Resolver",  valor: noRes,      color: "#dc2626", bgL: "rgba(220,38,38,0.08)",   bgD: "rgba(220,38,38,0.15)"  },
  ];

  return (
    <aside
      className="hidden xl:flex flex-shrink-0 flex-col overflow-y-auto"
      style={{ width: "240px", height: "100vh", position: "sticky", top: 0, ...glassBase }}
    >
      {/* Banda naranja superior */}
      <div style={{ height: "3px", background: `linear-gradient(90deg, ${T.orange}, ${T.orangeDark})`, flexShrink: 0 }} />

      <div style={{ padding: "14px 12px", display: "flex", flexDirection: "column", gap: "14px", flex: 1 }}>

        {/* ── A) PERFIL ── */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
          {/* Avatar con anillo naranja */}
          <div style={{
            width: "60px", height: "60px", borderRadius: "50%",
            overflow: "hidden", border: `2.5px solid ${T.orange}`,
            boxShadow: `0 0 0 4px ${isDark ? "rgba(244,121,32,0.18)" : "rgba(244,121,32,0.12)"}`,
            background: isDark ? "#1C2230" : "#F3F4F6",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            {foto
              ? <img src={foto} alt="perfil" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              : <User size={26} style={{ color: T.textFaint }} />}
          </div>
          <div style={{ textAlign: "center" }}>
            <p style={{ fontSize: "13px", fontWeight: 700, color: T.text, margin: "0 0 2px", lineHeight: 1.3 }}>
              {nombre || "—"}
            </p>
            <p style={{ fontSize: "10px", color: T.textMuted, margin: "0 0 6px" }}>
              {departamento || "—"}
            </p>
            <span style={{
              display: "inline-flex", alignItems: "center", gap: "4px",
              padding: "2px 10px", borderRadius: "99px",
              fontSize: "10px", fontWeight: 600,
              background: isDark ? "rgba(244,121,32,0.15)" : "#FFF7ED",
              border: `1px solid ${isDark ? "rgba(244,121,32,0.3)" : "rgba(244,121,32,0.25)"}`,
              color: T.orange,
            }}>
              <span style={{ width: "5px", height: "5px", borderRadius: "50%",
                background: T.orange, boxShadow: `0 0 5px ${T.orange}` }} />
              {etiquetaRol}
            </span>
          </div>
        </div>

        {divider}

        {/* ── RELOJ ── */}
        <RelojFecha T={T} />

        {divider}

        {/* ── B) KPIs ── */}
        <div>
          {sectionLabel("Resumen de Tickets")}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "5px" }}>
            {kpis.map((s, i) => (
              <div
                key={i}
                title={s.label}
                style={{
                  padding: "8px", borderRadius: "10px",
                  background: isDark ? s.bgD : s.bgL,
                  border: `1px solid ${isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.06)"}`,
                  display: "flex", flexDirection: "column", gap: "2px",
                  cursor: "default", transition: "transform 0.15s, box-shadow 0.15s",
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = "scale(1.04)";
                  e.currentTarget.style.boxShadow = `0 4px 16px ${s.color}33`;
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = "scale(1)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                <span style={{ fontSize: "22px", fontWeight: 900, color: s.color,
                  lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>
                  {s.valor}
                </span>
                <span style={{ fontSize: "9px", fontWeight: 600, color: T.textMuted,
                  lineHeight: 1.3, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                  {s.label}
                </span>
                {/* Mini barra de progreso */}
                <div style={{ height: "2px", borderRadius: "1px", marginTop: "3px",
                  background: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.07)", overflow: "hidden" }}>
                  <div style={{
                    height: "100%", borderRadius: "1px", background: s.color,
                    width: `${total > 0 ? Math.max(Math.round((s.valor / total) * 100), s.valor > 0 ? 8 : 0) : 0}%`,
                    transition: "width 0.6s ease",
                  }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {divider}

        {/* ── CALENDARIO ── */}
        <div>
          {sectionLabel("Calendario")}
          <Calendario T={T} />
        </div>

      </div>

      {/* Keyframe para el punto parpadeante — inyectado inline */}
    </aside>
  );
}


