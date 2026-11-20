/**
 * MetricasSolicitudes.jsx — Tarjetas de métricas del historial de solicitudes
 * (tasa de aceptación, totales, por prioridad, insumos más pedidos y actividad
 * mensual). Separado de pages/Usuario/SolicitudInsumo.jsx.
 */

export default function MetricasSolicitudes({ T, aceptadosSol, actividadMes, card, hdr, maxActMes, pendientesSol, prioridades, rechazadosSol, tasaColorSol, tasaSol, topInsumos, totalPiezas, totalSol }) {
  return (
    <div className="grid grid-cols-12 gap-1.5" style={{ flexShrink: 0 }}>

      {/* Tasa de aceptación — card grande */}
      <div className="col-span-6 sm:col-span-6 lg:col-span-3 rounded-xl overflow-hidden relative" style={card}>
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{ background: `radial-gradient(circle at 80% 20%, ${tasaColorSol}, transparent 60%)` }} />
        <div className="h-0.5" style={{ background: `linear-gradient(90deg,${tasaColorSol},${tasaColorSol}33)` }} />
        <div className="p-2 sm:p-3 flex flex-col gap-1 sm:gap-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <div className="w-1 h-2.5 rounded-full" style={{ background: tasaColorSol }} />
              <p className="text-[9px] font-black uppercase tracking-widest" style={{ color: T.textMuted }}>Solicitudes aceptadas</p>
            </div>
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
              style={{ background: `${tasaColorSol}15`, color: tasaColorSol, border: `1px solid ${tasaColorSol}30` }}>
              {tasaSol >= 75 ? "Excelente" : tasaSol >= 50 ? "Regular" : "Bajo"}
            </span>
          </div>
          <div className="flex items-end gap-2">
            <span className="text-[18px] font-black leading-none" style={{ color: tasaColorSol }}>{tasaSol}%</span>
            <div className="flex flex-col gap-1 mb-0.5 flex-1">
              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: T.border }}>
                <div className="h-full rounded-full transition-all duration-1000"
                  style={{ width: `${tasaSol}%`, background: `linear-gradient(90deg,${tasaColorSol},${tasaColorSol}88)`, boxShadow: `0 0 6px ${tasaColorSol}55` }} />
              </div>
            </div>
          </div>
          <div className="pt-1 flex items-center justify-between" style={{ borderTop: `1px solid ${T.border}` }}>
            <span className="text-[9px]" style={{ color: T.textFaint }}>Piezas totales</span>
            <span className="text-[9px] font-black" style={{ color: tasaColorSol }}>{totalPiezas} pza.</span>
          </div>
        </div>
      </div>

      {/* KPIs numéricos */}
      <div className="col-span-6 sm:col-span-6 lg:col-span-3 grid grid-cols-2 gap-1.5">
        {[
          { label: "Total",      val: totalSol,      color: T.orange,  sub: `${pendientesSol} activas` },
          { label: "En Proceso", val: pendientesSol, color: "#d97706", sub: `${Math.round(pendientesSol / Math.max(totalSol,1) * 100)}% del total` },
          { label: "Aceptadas",  val: aceptadosSol,  color: "#16a34a", sub: `${tasaSol}% tasa` },
          { label: "Rechazadas", val: rechazadosSol, color: "#dc2626", sub: `${Math.round(rechazadosSol / Math.max(totalSol,1) * 100)}% del total` },
        ].map(({ label, val, color, sub }) => (
          <div key={label} className="rounded-lg p-1.5 sm:p-2 flex flex-col gap-0.5 sm:gap-1 relative overflow-hidden" style={card}>
            <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: `linear-gradient(90deg,${color},${color}33)` }} />
            <p className="text-[9px] font-black uppercase tracking-wider leading-tight" style={{ color: T.textMuted }}>{label}</p>
            <span className="text-[18px] font-black leading-none" style={{ color }}>{val}</span>
            <div className="h-1 rounded-full overflow-hidden" style={{ background: T.border }}>
              <div className="h-full rounded-full transition-all duration-700"
                style={{ width: `${totalSol > 0 ? Math.round(val / totalSol * 100) : 0}%`, background: color, boxShadow: `0 0 4px ${color}44` }} />
            </div>
            <span className="text-[9px] font-semibold" style={{ color }}>{sub}</span>
          </div>
        ))}
      </div>

      {/* Por Prioridad */}
      <div className="col-span-12 sm:col-span-6 lg:col-span-3 rounded-xl overflow-hidden" style={{ ...card, flexShrink: 0 }}>
        <div className="px-3 py-2 flex items-center gap-1.5" style={hdr}>
          <div className="w-1 h-3 rounded-full" style={{ background: T.orange }} />
          <p className="text-[9px] font-black uppercase tracking-widest" style={{ color: T.textMuted }}>Por Prioridad</p>
        </div>
        <div className="p-3 flex flex-col gap-2">
          {[{ l: "Urgente", c: "#dc2626" }, { l: "Alta", c: "#ea580c" }, { l: "Media", c: "#ca8a04" }, { l: "Baja", c: "#16a34a" }].map(({ l, c }) => {
            const n   = prioridades[l] || 0;
            const pct = totalSol > 0 ? Math.round(n / totalSol * 100) : 0;
            return (
              <div key={l} className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: c, boxShadow: `0 0 4px ${c}88` }} />
                <span className="text-[10px] font-semibold w-14 flex-shrink-0" style={{ color: T.text }}>{l}</span>
                <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: T.isDark ? "rgba(255,255,255,0.06)" : `${c}15` }}>
                  <div className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${pct > 0 ? Math.max(pct, 5) : 0}%`, background: c, boxShadow: `0 0 4px ${c}55` }} />
                </div>
                <span className="text-[10px] font-black w-5 text-right flex-shrink-0" style={{ color: c }}>{n}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Top insumos + actividad mensual */}
      <div className="col-span-12 sm:col-span-6 lg:col-span-3 rounded-xl overflow-hidden" style={{ ...card, flexShrink: 0 }}>
        <div className="px-3 py-2 flex items-center gap-1.5" style={hdr}>
          <div className="w-1 h-3 rounded-full" style={{ background: T.orange }} />
          <p className="text-[9px] font-black uppercase tracking-widest" style={{ color: T.textMuted }}>Insumos Frecuentes</p>
        </div>
        <div className="p-3 flex flex-col gap-2">
          {topInsumos.length === 0
            ? <p className="text-[9px]" style={{ color: T.textFaint }}>Sin datos</p>
            : topInsumos.map(([nombre, n], idx) => {
                const colors = [T.orange, "#3b82f6", "#8b5cf6", "#16a34a"];
                const maxN   = topInsumos[0][1];
                return (
                  <div key={nombre} className="flex items-center gap-2">
                    <span className="text-[9px] font-black w-3 flex-shrink-0 text-center" style={{ color: colors[idx] }}>#{idx + 1}</span>
                    <span className="text-[10px] font-semibold flex-1 truncate" style={{ color: T.text }} title={nombre}>{nombre}</span>
                    <div className="w-12 h-2 rounded-full overflow-hidden flex-shrink-0" style={{ background: T.border }}>
                      <div className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${Math.round(n / maxN * 100)}%`, background: colors[idx], boxShadow: `0 0 4px ${colors[idx]}55` }} />
                    </div>
                    <span className="text-[10px] font-black w-4 text-right flex-shrink-0" style={{ color: colors[idx] }}>{n}</span>
                  </div>
                );
              })
          }
        </div>
        {/* Mini gráfica actividad mensual */}
        <div className="px-3 pb-3">
          <p className="text-[9px] font-black uppercase tracking-widest mb-1.5" style={{ color: T.textFaint }}>Actividad últimos 6 meses</p>
          <div className="flex items-end gap-1" style={{ height: 28 }}>
            {actividadMes.map(({ mes, count }) => (
              <div key={mes} className="flex flex-col items-center gap-0.5 flex-1">
                <div className="w-full rounded-sm transition-all duration-700"
                  style={{ height: `${count > 0 ? Math.max(Math.round(count / maxActMes * 22), 3) : 2}px`, background: count > 0 ? T.orange : T.border }} />
                <span className="text-[9px]" style={{ color: T.textFaint }}>{mes}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
}
