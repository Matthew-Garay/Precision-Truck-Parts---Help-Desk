/**
 * DashboardShared.jsx
 *
 * Componentes graficos y de layout compartidos entre el dashboard
 * del administrador y el del usuario.
 *
 * Componentes exportados:
 *
 * GraficaPastel({ data, size, T })
 *   Grafica de pastel SVG con strokeDasharray. Muestra el total en el centro.
 *   data = [{ label, color, valor }]
 *
 * SeccionMetricas({ T, metricas })
 *   Tres tarjetas para el dashboard del administrador:
 *   tiempo promedio de resolucion, tickets por departamento con barras,
 *   y tendencia mensual de los ultimos 6 meses con grafica de barras interactiva.
 *
 * SeccionMetricasUsuario({ T, tickets })
 *   Fila de KPIs para el dashboard del usuario: total, en proceso,
 *   resueltos, sin resolver, tasa de resolucion y tiempo promedio.
 *
 * SeccionEstadisticas({ T, tickets, solicitudes })
 *   Dos tarjetas: reportes por prioridad (con barras) y reportes por
 *   estatus (con grafica de pastel y barras). Combina tickets y solicitudes.
 *
 * KanbanBoard({ T, tickets, solicitudes, onVerTicket, onVerSolicitud, inline })
 *   Tablero kanban de cuatro columnas (Urgente, Alta, Media, Baja).
 *   Muestra tickets en proceso y solicitudes activas mezclados.
 *   Cada card es clicable y llama a onVerTicket u onVerSolicitud.
 *   Con inline=true se renderiza en un grid en lugar de scroll horizontal.
 *
 * PanelDerecho({ T, nombre, departamento, sucursal, foto, tickets })
 *   Panel lateral fijo visible en pantallas lg o mayores.
 *   Contiene foto de perfil con estado activo, reloj, estadisticas
 *   personales con barra de tasa de resolucion y calendario mensual.
 */
import { useState } from "react";
import { User, Clock, CheckCircle2, Timer, Building2, BarChart2, Package, TrendingUp } from "lucide-react";
import { RelojFecha, Calendario } from "./RelojCalendario.jsx";
import { useCardStyles } from "./Card";

// -- TENDENCIA CHART (HTML puro, sin SVG, 100% responsive) ----
function TendenciaChart({ tendencia, T, isDark, MESES_CORTOS }) {
  const maxVal     = Math.max(...tendencia.map(t => t.total), 1);
  const totalAcum  = tendencia.reduce((s, t) => s + t.total, 0);
  const totalRes   = tendencia.reduce((s, t) => s + t.resueltos, 0);
  const tasaGlobal = totalAcum > 0 ? Math.round((totalRes / totalAcum) * 100) : 0;

  // Mes activo (hover)
  const [hover, setHover] = useState(null);
  const mesActivo = hover !== null ? tendencia[hover] : tendencia[tendencia.length - 1];
  const idxActivo = hover !== null ? hover : tendencia.length - 1;

  return (
    <div style={{ width: "100%" }}>

      {/* Tooltip del mes seleccionado */}
      {mesActivo && (
        <div style={{
          marginBottom: "6px", padding: "6px 8px", borderRadius: "8px",
          background: isDark ? "rgba(255,255,255,0.05)" : T.surfaceAlt,
          border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : T.border}`,
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <span style={{ fontSize: "10px", fontWeight: 800, color: T.orange }}>
            {(() => { const [, m] = mesActivo.mes.split("-"); return MESES_CORTOS[parseInt(m) - 1]; })()}
          </span>
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <span style={{ fontSize: "10px", fontWeight: 700, color: isDark ? "rgba(255,255,255,0.6)" : T.text }}>
              Total: <b style={{ color: T.orange }}>{mesActivo.total}</b>
            </span>
            <span style={{ fontSize: "10px", fontWeight: 700, color: "#16a34a" }}>
              Res: {mesActivo.resueltos}
            </span>
            <span style={{ fontSize: "10px", fontWeight: 700,
              color: mesActivo.total > 0
                ? (Math.round((mesActivo.resueltos / mesActivo.total) * 100) >= 75 ? "#16a34a"
                  : Math.round((mesActivo.resueltos / mesActivo.total) * 100) >= 50 ? "#ca8a04" : "#dc2626")
                : "#94a3b8"
            }}>
              {mesActivo.total > 0 ? Math.round((mesActivo.resueltos / mesActivo.total) * 100) : 0}%
            </span>
          </div>
        </div>
      )}

      {/* Zona de barras */}
      <div style={{ display: "flex", alignItems: "flex-end", gap: "3px", height: "48px", width: "100%" }}>
        {tendencia.map((t, i) => {
          const esActivo = i === idxActivo;
          const pctT = t.total     > 0 ? Math.max((t.total     / maxVal) * 100, 5) : 0;
          const pctR = t.resueltos > 0 ? Math.max((t.resueltos / maxVal) * 100, 3) : 0;
          const colorT = esActivo ? T.orange : (isDark ? "rgba(244,121,32,0.45)" : "rgba(244,121,32,0.35)");
          const colorR = esActivo ? "#16a34a" : (isDark ? "rgba(22,163,74,0.5)" : "rgba(22,163,74,0.4)");
          return (
            <div key={i}
              style={{ flex: 1, minWidth: 0, display: "flex", alignItems: "flex-end", gap: "2px", height: "100%", cursor: "pointer" }}
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}>
              <div style={{ flex: 1, height: `${pctT}%`, minHeight: t.total > 0 ? "4px" : "0", background: colorT, borderRadius: "3px 3px 1px 1px", transition: "height 0.3s, background 0.2s" }} />
              <div style={{ flex: 1, height: `${pctR}%`, minHeight: t.resueltos > 0 ? "3px" : "0", background: colorR, borderRadius: "3px 3px 1px 1px", transition: "height 0.3s, background 0.2s" }} />
            </div>
          );
        })}
      </div>

      {/* Fila de etiquetas de mes */}
      <div style={{ display: "flex", gap: "4px", marginTop: "4px" }}>
        {tendencia.map((t, i) => {
          const [, mesNum] = t.mes.split("-");
          const label    = MESES_CORTOS[parseInt(mesNum) - 1];
          const esActivo = i === idxActivo;
          return (
            <div key={i} style={{ flex: 1, display: "flex", justifyContent: "center" }}>
              <span style={{ fontSize: "8px", fontWeight: esActivo ? 800 : 500, lineHeight: 1,
                color: esActivo ? T.orange : (isDark ? "rgba(255,255,255,0.28)" : "#94a3b8") }}>
                {label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Panel de datos globales */}
      <div style={{
        marginTop: "6px", borderRadius: "6px", overflow: "hidden",
        border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : T.border}`,
      }}>
        <div style={{
          display: "grid", gridTemplateColumns: "1fr 1fr 1fr",
          background: isDark ? "rgba(255,255,255,0.03)" : T.surfaceAlt,
        }}>
          {[
            { label: "Total",     val: totalAcum,       color: T.orange },
            { label: "Resueltos", val: totalRes,         color: "#16a34a" },
            { label: "Tasa",      val: `${tasaGlobal}%`, color: tasaGlobal >= 75 ? "#16a34a" : tasaGlobal >= 50 ? "#ca8a04" : "#dc2626" },
          ].map(({ label, val, color }, i) => (
            <div key={i} style={{
              padding: "4px 6px",
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
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "5px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
          <span style={{ width: "8px", height: "8px", borderRadius: "2px", background: T.orange, flexShrink: 0 }} />
          <span style={{ fontSize: "9px", fontWeight: 600, color: isDark ? "rgba(255,255,255,0.35)" : "#94a3b8" }}>Total</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
          <span style={{ width: "8px", height: "8px", borderRadius: "2px", background: "#16a34a", flexShrink: 0 }} />
          <span style={{ fontSize: "9px", fontWeight: 600, color: isDark ? "rgba(255,255,255,0.35)" : "#94a3b8" }}>Resueltos</span>
        </div>
        <span style={{ marginLeft: "auto", fontSize: "9px", fontWeight: 700, padding: "2px 7px", borderRadius: "99px",
          background: isDark ? "rgba(255,255,255,0.06)" : "#f1f5f9",
          color: isDark ? "rgba(255,255,255,0.3)" : "#94a3b8" }}>
          {tendencia.length}m
        </span>
      </div>
    </div>
  );
}

// -- GRAFICA PASTEL --
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

// -- SECCION METRICAS AVANZADAS --
export function SeccionMetricas({ T, metricas }) {
  const isDark = T.isDark;
  if (!metricas) return null;

  const { promedio_horas = 0, porDepartamento = [], tendencia = [] } = metricas;

  const { card: cardStyle, hdr } = useCardStyles(T, "elevated");

  // Tiempo promedio formateado
  const horas = parseFloat(promedio_horas) || 0;
  const tiempoLabel = horas === 0 ? "-" : horas < 1 ? `${Math.round(horas * 60)} min` : horas < 24 ? `${horas.toFixed(1)} h` : `${(horas / 24).toFixed(1)} dias`;

  // Tendencia: etiquetas de mes abreviadas
  const MESES_CORTOS = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];

  // Departamentos: maximo 5
  const deptos = porDepartamento.slice(0, 5);
  const maxDepto = Math.max(...deptos.map(d => d.total), 1);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-2 w-full">

      {/* Tiempo promedio de resolucion */}
      <div className="rounded-xl overflow-hidden" style={cardStyle}>
        <div className="px-3 py-1.5 flex items-center gap-2" style={hdr}>
          <div className="w-1 h-3 rounded-full" style={{ background: "#3b82f6" }} />
          <Timer size={10} style={{ color: isDark ? "rgba(255,255,255,0.4)" : T.textMuted }} />
          <p className="text-[10px] font-black uppercase tracking-widest"
            style={{ color: isDark ? "rgba(255,255,255,0.45)" : T.textMuted }}>Tiempo Prom. Resolucion</p>
        </div>
        <div className="px-3 py-2 flex flex-col items-center justify-center gap-0.5">
          <span className="text-2xl sm:text-3xl font-black" style={{ color: "#3b82f6" }}>{tiempoLabel}</span>
          <span className="text-[10px] font-semibold" style={{ color: T.textMuted }}>promedio por ticket resuelto</span>
          <div className="mt-1 flex items-center gap-1.5 px-2 py-0.5 rounded-full"
            style={{ background: isDark ? "rgba(59,130,246,0.12)" : "#eff6ff", border: "1px solid rgba(59,130,246,0.2)" }}>
            <Clock size={9} style={{ color: "#3b82f6" }} />
            <span className="text-[10px] font-bold" style={{ color: "#3b82f6" }}>SLA: 2 días</span>
          </div>
        </div>
      </div>

      {/* Tickets por departamento */}
      <div className="rounded-xl overflow-hidden" style={cardStyle}>
        <div className="px-3 py-1.5 flex items-center gap-2" style={hdr}>
          <div className="w-1 h-3 rounded-full" style={{ background: "#F47920" }} />
          <Building2 size={10} style={{ color: isDark ? "rgba(255,255,255,0.4)" : T.textMuted }} />
          <p className="text-[10px] font-black uppercase tracking-widest"
            style={{ color: isDark ? "rgba(255,255,255,0.45)" : T.textMuted }}>Tickets por Departamento</p>
        </div>
        <div className="px-3 py-2 flex flex-col gap-1.5">
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
        <div className="px-3 py-1.5 flex items-center justify-between" style={hdr}>
          <div className="flex items-center gap-2">
            <div className="w-1 h-3 rounded-full" style={{ background: "#16a34a" }} />
            <BarChart2 size={10} style={{ color: isDark ? "rgba(255,255,255,0.4)" : T.textMuted }} />
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
        <div className="px-2 pt-2 pb-1">
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

// -- SECCION ESTADISTICAS --
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
  const fmtTiempo = promedioH === 0 ? "-" : promedioH < 1 ? `${Math.round(promedioH * 60)} min` : promedioH < 24 ? `${promedioH.toFixed(1)} h` : `${(promedioH / 24).toFixed(1)} dias`;

  const tasaRes = total > 0 ? Math.round((resueltos / total) * 100) : 0;

  const { card: cardStyle } = useCardStyles(T, "elevated");

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
          <p className="text-xl sm:text-2xl font-black leading-none" style={{ color: s.color }}>{s.val}</p>
        </div>
      ))}

      <div className="rounded-xl px-3 py-2.5 flex flex-col gap-1 col-span-1" style={cardStyle}>
        <p className="text-[9px] font-bold uppercase tracking-wider" style={{ color: T.textMuted }}>Tasa resolucion</p>
        <p className="text-xl sm:text-2xl font-black leading-none" style={{ color: "#16a34a" }}>{tasaRes}%</p>
        <div className="h-1 rounded-full overflow-hidden mt-1" style={{ background: isDark ? "rgba(255,255,255,0.08)" : T.border }}>
          <div className="h-full rounded-full transition-all duration-700"
            style={{ width: `${tasaRes}%`, background: "linear-gradient(90deg,#16a34a,#4ade80)" }} />
        </div>
      </div>

      <div className="rounded-xl px-3 py-2.5 flex flex-col gap-1 col-span-1" style={cardStyle}>
        <p className="text-[9px] font-bold uppercase tracking-wider" style={{ color: T.textMuted }}>Tiempo prom.</p>
        <p className="text-lg sm:text-xl font-black leading-none" style={{ color: "#3b82f6" }}>{fmtTiempo}</p>
        <p className="text-[9px]" style={{ color: T.textFaint }}>por ticket resuelto</p>
      </div>
    </div>
  );
}

export function SeccionEstadisticas({ T, tickets = [], solicitudes = [] }) {
  const isDark = T.isDark;
  const total  = tickets.length;

  const prioridadData = [
    { label: "Urgente", color: "#dc2626", bg: "#fee2e2" },
    { label: "Alta",    color: "#ea580c", bg: "#ffedd5" },
    { label: "Media",   color: "#ca8a04", bg: "#fef9c3" },
    { label: "Baja",    color: "#16a34a", bg: "#dcfce7" },
  ].map(p => ({
    ...p,
    valor:   tickets.filter(t => t.prioridad === p.label).length,
    insumos: solicitudes.filter(s => s.prioridad === p.label).length,
  }));

  const estatusData = [
    { label: "Resuelto",    color: "#16a34a", valor: tickets.filter(t => t.estatus === "Resuelto").length },
    { label: "En proceso",  color: "#ca8a04", valor: tickets.filter(t => t.estatus === "En proceso").length },
    { label: "No Resuelto", color: "#ea580c", valor: tickets.filter(t => t.estatus === "No Resuelto").length },
  ];
  const totalEstatus = estatusData.reduce((s, d) => s + d.valor, 0);

  const { card: cardStyle, hdr } = useCardStyles(T, "elevated");

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-2 w-full">
      <div className="rounded-xl overflow-hidden" style={cardStyle}>
        <div className="px-3 py-1.5 flex items-center gap-2" style={hdr}>
          <div className="w-1 h-3 rounded-full" style={{ background: "#F47920" }} />
          <p className="text-[10px] font-black uppercase tracking-widest"
            style={{ color: isDark ? "rgba(255,255,255,0.45)" : T.textMuted }}>Reportes por Prioridad</p>
        </div>
        <div className="px-3 py-2 flex flex-col gap-1.5">
          {prioridadData.map((p, i) => {
            const totalFila = p.valor + p.insumos;
            const pct = total > 0 ? Math.round((totalFila / (total + solicitudes.length)) * 100) : 0;
            return (
              <div key={i} className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
                    <span className="text-[11px] font-semibold"
                      style={{ color: isDark ? "rgba(255,255,255,0.65)" : T.text }}>{p.label}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-black" style={{ color: p.color }}>{totalFila}</span>
                    {p.insumos > 0 && (
                      <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-black"
                        style={{ background: isDark ? 'rgba(59,130,246,0.2)' : '#dbeafe', color: '#3b82f6', border: '1px solid rgba(59,130,246,0.3)' }}>
                        <Package size={8} />{p.insumos}
                      </span>
                    )}
                  </div>
                </div>
                <div className="relative h-3 rounded-full overflow-hidden"
                  style={{ background: isDark ? "rgba(255,255,255,0.06)" : p.bg }}>
                  <div className="h-full rounded-full flex items-center justify-end pr-2 transition-all duration-700"
                    style={{ width: `${pct > 0 ? Math.max(pct, 10) : 0}%`, background: p.color }}>
                    {totalFila > 0 && <span className="text-[9px] font-black text-white">{pct}%</span>}
                  </div>
                  {totalFila === 0 && (
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
        <div className="px-3 py-1.5 flex items-center gap-2" style={hdr}>
          <div className="w-1 h-3 rounded-full" style={{ background: "#F47920" }} />
          <p className="text-[10px] font-black uppercase tracking-widest"
            style={{ color: isDark ? "rgba(255,255,255,0.45)" : T.textMuted }}>Reportes por Estatus</p>
        </div>
        <div className="px-3 py-2 flex gap-3 flex-1">
          <div className="flex-shrink-0"><GraficaPastel data={estatusData} size={64} T={T} /></div>
          <div className="flex flex-col gap-1.5 flex-1 justify-center">
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
            <div className="mt-1 pt-1 border-t" style={{ borderColor: isDark ? "rgba(255,255,255,0.07)" : T.border }}>
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

// -- KANBAN BOARD --
const PRIORIDADES = [
  { id: "Urgente", label: "Urgente", color: "#dc2626", bg: "#fee2e2", bgDark: "rgba(220,38,38,0.18)" },
  { id: "Alta",    label: "Alta",    color: "#ea580c", bg: "#ffedd5", bgDark: "rgba(234,88,12,0.18)"  },
  { id: "Media",   label: "Media",   color: "#ca8a04", bg: "#fef9c3", bgDark: "rgba(202,138,4,0.18)"  },
  { id: "Baja",    label: "Baja",    color: "#16a34a", bg: "#dcfce7", bgDark: "rgba(22,163,74,0.18)"  },
];

export function KanbanBoard({ T, tickets = [], solicitudes = [], onVerTicket, onVerSolicitud, inline = false }) {
  const isDark = T.isDark;

  // Mezclar tickets (en proceso) y solicitudes (activas) por prioridad
  const grupos = {};
  PRIORIDADES.forEach(p => { grupos[p.id] = []; });

  tickets
    .filter(t => t.estatus === 'En proceso' || t.estatus === 'En Proceso')
    .forEach(t => { if (grupos[t.prioridad]) grupos[t.prioridad].push({ ...t, _tipo: 'ticket' }); });

  const ESTATUS_CERRADOS = new Set(['Resuelto', 'No Resuelto', 'Rechazado', 'Cerrado', 'cerrado', 'Aceptado', 'aceptado']);
  solicitudes
    .filter(s => !ESTATUS_CERRADOS.has(s.estatus))
    .forEach(s => { if (grupos[s.prioridad]) grupos[s.prioridad].push({ ...s, _tipo: 'insumo' }); });

  const columnas = PRIORIDADES.map(prioridad => {
    const items     = grupos[prioridad.id];
    const bgCol     = isDark ? '#141720' : T.surface;
    const borderCol = isDark ? 'rgba(255,255,255,0.08)' : T.border;
    const total     = items.length;

    return (
      <div key={prioridad.id}
        className="flex flex-col rounded-xl overflow-hidden w-full"
        style={{ background: bgCol, border: `1px solid ${borderCol}`,
          boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.4)' : '0 1px 6px rgba(0,0,0,0.06)' }}>
        <div className="px-3 py-2 flex items-center justify-between flex-shrink-0"
          style={{ background: isDark ? 'rgba(255,255,255,0.03)' : T.surfaceAlt,
            borderBottom: `1px solid ${borderCol}` }}>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full" style={{ background: prioridad.color }} />
            <span className="text-xs font-bold" style={{ color: prioridad.color }}>{prioridad.label}</span>
          </div>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold"
            style={{ background: isDark ? prioridad.bgDark : prioridad.bg, color: prioridad.color }}>
            {total}
          </span>
        </div>
        <div className="p-2 flex flex-col gap-1.5"
          style={{ minHeight: '60px' }}>
          {total === 0 ? (
            <div className="flex items-center justify-center py-6">
              <p className="text-xs" style={{ color: T.textFaint }}>Sin elementos</p>
            </div>
          ) : items.map(item => {
            const esInsumo = item._tipo === 'insumo';
            const cardBorder = esInsumo
              ? (isDark ? 'rgba(59,130,246,0.35)' : 'rgba(59,130,246,0.3)')
              : borderCol;
            const cardBg = esInsumo
              ? (isDark ? 'rgba(59,130,246,0.06)' : 'rgba(59,130,246,0.03)')
              : (isDark ? 'rgba(255,255,255,0.05)' : T.bg);

            return esInsumo ? (
              // ── Card de INSUMO ──────────────────────────────────────
              <div key={`sol-${item.id_solicitud}`}
                onClick={() => onVerSolicitud?.(item)}
                className={`p-2 rounded-lg flex flex-col gap-1${onVerSolicitud ? ' cursor-pointer transition-all hover:scale-[1.01] active:scale-95' : ''}`}
                style={{ background: cardBg, border: `1px solid ${cardBorder}`,
                  boxShadow: isDark ? '0 2px 8px rgba(0,0,0,0.3)' : '0 1px 4px rgba(59,130,246,0.08)' }}>
                <div className="flex items-center justify-between gap-1">
                  <div className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: prioridad.color }} />
                    <span className="text-[10px] font-mono font-black" style={{ color: '#3b82f6' }}>
                      #{item.folio_solicitud}
                    </span>
                  </div>
                  <span className="flex items-center gap-0.5 px-1 py-0.5 rounded-full text-[9px] font-black flex-shrink-0"
                    style={{ background: isDark ? 'rgba(59,130,246,0.2)' : '#dbeafe',
                      color: '#3b82f6', border: '1px solid rgba(59,130,246,0.35)' }}>
                    <Package size={7} />INSUMO
                  </span>
                </div>
                <p className="text-[10px] font-semibold leading-snug line-clamp-2" style={{ color: T.text }}>
                  {item.insumos_nombres || '—'}
                </p>
                <div className="pt-1 flex items-center justify-between"
                  style={{ borderTop: `1px solid ${cardBorder}` }}>
                  <span className="text-[10px] truncate max-w-[60%]" style={{ color: T.textMuted }}>
                    {item.nombre_empleado || '—'}
                  </span>
                  <span className="text-[10px] font-semibold flex-shrink-0" style={{ color: T.textFaint }}>
                    {item.fecha
                      ? new Date(item.fecha).toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit' })
                      : '—'}
                  </span>
                </div>
              </div>
            ) : (
              // ── Card de TICKET ──────────────────────────────────────
              <div key={`tk-${item.id_ticket}`}
                className="p-2 rounded-lg cursor-pointer transition-all hover:scale-[1.01] active:scale-95 flex flex-col gap-1"
                style={{ background: cardBg, border: `1px solid ${cardBorder}`,
                  boxShadow: isDark ? '0 2px 8px rgba(0,0,0,0.3)' : '0 1px 4px rgba(0,0,0,0.06)' }}
                onClick={() => onVerTicket(item)}>
                <div className="flex items-center justify-between gap-1">
                  <div className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: prioridad.color }} />
                    <span className="text-[10px] font-mono font-black" style={{ color: T.orange }}>
                      #{item.folio_ticket}
                    </span>
                  </div>
                  <img src={isDark ? '/assets/img/logo%20blanco.png' : '/assets/img/logo%20negro.png'}
                    alt="logo" className="h-3 object-contain opacity-50" />
                </div>
                <p className="text-[10px] font-semibold leading-snug line-clamp-2" style={{ color: T.text }}>
                  {item.titulo}
                </p>
                <div className="pt-1 flex items-center justify-between"
                  style={{ borderTop: `1px solid ${cardBorder}` }}>
                  <span className="text-[10px] truncate max-w-[60%]" style={{ color: T.textMuted }}>
                    {item.nombre_empleado || '—'}
                  </span>
                  <span className="text-[10px] font-semibold flex-shrink-0" style={{ color: T.textFaint }}>
                    {item.fecha_subido
                      ? new Date(item.fecha_subido).toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit' })
                      : '—'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  });

  if (inline) return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2" style={{ minWidth: 0 }}>
      {columnas}
    </div>
  );
  return (
    <div className="overflow-x-auto pb-2">
      <div className="flex gap-3" style={{ minWidth: 'max-content' }}>{columnas}</div>
    </div>
  );
}

export function PanelDerecho({ T, nombre, departamento, sucursal, foto, tickets = [], totalArea = 0, etiquetaRol = "Activo" }) {
  const isDark    = T.isDark;
  const total     = tickets.length;
  const enProceso = tickets.filter(t => t.estatus === "En proceso").length;
  const resueltos = tickets.filter(t => t.estatus === "Resuelto").length;
  const tasaRes   = total > 0 ? Math.round((resueltos / total) * 100) : 0;

  const hoy = new Date().toDateString();
  const abiertosHoy = tickets.filter(t => new Date(t.fecha_subido).toDateString() === hoy).length;
  const vencidos = tickets.filter(t => {
    if (t.estatus === "Resuelto") return false;
    const diff = (Date.now() - new Date(t.fecha_subido)) / 36e5;
    return diff > 48;
  }).length;

  const stats = [
    { label: "Abiertos hoy", valor: abiertosHoy, color: "#3b82f6", bgL: "#eff6ff", bgD: "rgba(37,99,235,0.15)",  icon: TrendingUp  },
    { label: "En proceso",   valor: enProceso,   color: "#F47920", bgL: "#fff7ed", bgD: "rgba(244,121,32,0.15)", icon: Clock        },
    { label: "Vencidos",     valor: vencidos,    color: "#dc2626", bgL: "#fef2f2", bgD: "rgba(220,38,38,0.15)",  icon: CheckCircle2 },
  ];

  return (
    <aside className="hidden lg:flex flex-shrink-0 flex-col sticky top-0 h-screen"
      style={{ width: "var(--panel-r-w)", background: T.surface, borderLeft: `1px solid ${T.border}` }}>

      {/* Separador entre bloques — mismo ritmo en toda la barra */}
      <div className="flex flex-col flex-1 min-h-0 overflow-y-auto">

        {/* -- PERFIL -- */}
        <div className="flex-shrink-0 px-3.5 py-4" style={{ borderBottom: `1px solid ${T.border}` }}>
          <div className="flex flex-col items-center text-center gap-2">
            <div className="flex-shrink-0 rounded-full overflow-hidden"
              style={{ width: "40px", height: "40px", border: `2px solid ${T.surface}`, outline: `2px solid ${T.orange}`, background: T.bg, boxShadow: `0 0 0 3px ${isDark ? "rgba(244,121,32,0.15)" : "rgba(244,121,32,0.1)"}` }}>
              {foto
                ? <img src={foto} alt="perfil" className="w-full h-full object-cover" />
                : <div className="w-full h-full flex items-center justify-center"><User size={16} style={{ color: T.textFaint }} /></div>}
            </div>
            <div className="w-full min-w-0">
              <p className="text-[11.5px] font-bold leading-tight truncate" style={{ color: T.text }} title={nombre || ""}>
                {nombre || "—"}
              </p>
              <p className="text-[10px] leading-tight mt-0.5 truncate" style={{ color: T.textMuted }} title={departamento || ""}>
                {departamento || "—"}
              </p>
              <p className="text-[10px] leading-tight mt-px truncate" style={{ color: T.textFaint }} title={sucursal || ""}>
                {sucursal || "—"}
              </p>
            </div>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-semibold self-center"
              style={{ background: isDark ? "rgba(22,163,74,0.18)" : "#f0fdf4", color: "#16a34a", border: `1px solid rgba(22,163,74,0.3)` }}>
              <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: "#16a34a", flexShrink: 0 }} />
              Activo
            </span>
          </div>
        </div>

        {/* -- RELOJ -- */}
        <div className="flex-shrink-0 px-3.5 py-3" style={{ borderBottom: `1px solid ${T.border}` }}>
          <p className="text-[10px] font-bold uppercase tracking-widest mb-1.5" style={{ color: T.textFaint }}>Fecha y hora</p>
          <RelojFecha T={T} />
        </div>

        {/* -- MÉTRICAS -- */}
        <div className="flex-shrink-0 px-3.5 py-3 flex flex-col gap-2.5" style={{ borderBottom: `1px solid ${T.border}` }}>
          <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: T.textFaint }}>Mis estadísticas</p>
          <div className="grid gap-1.5" style={{ gridTemplateColumns: "repeat(3, minmax(0, 1fr))" }}>
            {stats.map((s, i) => (
              <div key={i} className="flex flex-col items-center justify-center py-2 gap-1 rounded-lg"
                style={{ background: isDark ? s.bgD : s.bgL, border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : T.border}`, minWidth: 0 }}>
                <s.icon size={12} style={{ color: s.color, flexShrink: 0 }} />
                <span className="font-black leading-none" style={{ color: s.color, fontSize: "17px" }}>{s.valor}</span>
                <span className="font-medium text-center leading-tight px-0.5" style={{ color: T.textFaint, fontSize: "9px" }}>{s.label}</span>
              </div>
            ))}
          </div>
          <div className="px-2.5 py-2 rounded-lg"
            style={{ background: isDark ? "rgba(22,163,74,0.08)" : "#f0fdf4", border: `1px solid ${isDark ? "rgba(22,163,74,0.2)" : "#bbf7d0"}` }}>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-semibold" style={{ color: T.textMuted }}>Tasa de resolución</span>
              <span className="text-[13px] font-black" style={{ color: "#16a34a" }}>{tasaRes}%</span>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: isDark ? "rgba(255,255,255,0.08)" : "#dcfce7" }}>
              <div className="h-full rounded-full transition-all duration-700"
                style={{ width: `${tasaRes}%`, background: "linear-gradient(90deg, #16a34a, #4ade80)" }} />
            </div>
          </div>
        </div>

        {/* -- CALENDARIO -- */}
        <div className="flex-shrink-0 px-3.5 py-3 flex flex-col gap-1.5">
          <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: T.textFaint }}>Calendario</p>
          <div className="rounded-lg overflow-hidden" style={{ border: `1px solid ${T.border}`, background: T.surface }}>
            <div className="px-2 py-2">
              <Calendario T={T} />
            </div>
          </div>
        </div>

      </div>
    </aside>
  );
}


