import { useState, useEffect, useCallback } from "react";
import { Star, Users, Clock, CheckCircle2, Inbox, FileDown } from "lucide-react";
import { apiFetch, API_ROUTES } from "../../Config/api";
import { useCardStyles } from "../../Components/Card";

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

export default function RendimientoTecnicos({ T }) {
  const [datos, setDatos]         = useState([]);
  const [cargando, setCargando]   = useState(false);
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin]       = useState("");
  const isDark = T.isDark;
  const { card, hdr } = useCardStyles(T);

  const cargar = useCallback((fi, ff) => {
    setCargando(true);
    const qs = new URLSearchParams();
    if (fi) qs.set("fecha_inicio", fi);
    if (ff) qs.set("fecha_fin", ff);
    apiFetch(`${API_ROUTES.TICKETS_RENDIMIENTO}?${qs}`)
      .then(r => r.json())
      .then(d => setDatos(Array.isArray(d) ? d : []))
      .catch(() => setDatos([]))
      .finally(() => setCargando(false));
  }, []);

  useEffect(() => { cargar("", ""); }, [cargar]);

  const aplicarFiltro = () => {
    if (fechaInicio && fechaFin && fechaInicio > fechaFin) return;
    cargar(fechaInicio, fechaFin);
  };

  const limpiar = () => { setFechaInicio(""); setFechaFin(""); cargar("", ""); };

  const maxResueltos = Math.max(...datos.map(r => r.resueltos ?? 0), 1);

  // Totales resumen
  const totalResueltos = datos.reduce((a, r) => a + Number(r.resueltos ?? 0), 0);
  const totalAtendidos = datos.reduce((a, r) => a + Number(r.total_atendidos ?? 0), 0);
  const promedioHoras  = datos.length > 0
    ? (datos.reduce((a, r) => a + Number(r.promedio_horas ?? 0), 0) / datos.length).toFixed(1)
    : "—";
  const promedioCalif  = (() => {
    const con = datos.filter(r => r.calificacion_promedio > 0);
    if (!con.length) return "—";
    return (con.reduce((a, r) => a + Number(r.calificacion_promedio), 0) / con.length).toFixed(2);
  })();

  const exportar = () => {
    if (!datos.length) return;
    const ahora = new Date().toLocaleDateString("es-MX", { day:"2-digit", month:"long", year:"numeric" });
    const filas = datos.map((r, i) => {
      const calif = Number(r.calificacion_promedio ?? 0);
      const tasa  = r.total_atendidos > 0 ? Math.round((r.resueltos / r.total_atendidos) * 100) : 0;
      return `
        <tr style="background:${i % 2 === 0 ? "#fff" : "#f9fafb"}">
          <td style="padding:7px 10px;font-weight:700;font-size:11px;border-bottom:1px solid #e5e7eb">${r.nombre_tecnico}</td>
          <td style="padding:7px 10px;font-size:11px;text-align:center;border-bottom:1px solid #e5e7eb">${r.total_atendidos}</td>
          <td style="padding:7px 10px;font-size:11px;text-align:center;color:#16a34a;font-weight:700;border-bottom:1px solid #e5e7eb">${r.resueltos}</td>
          <td style="padding:7px 10px;font-size:11px;text-align:center;border-bottom:1px solid #e5e7eb">${tasa}%</td>
          <td style="padding:7px 10px;font-size:11px;text-align:center;border-bottom:1px solid #e5e7eb">${r.promedio_horas != null ? r.promedio_horas + "h" : "—"}</td>
          <td style="padding:7px 10px;font-size:11px;text-align:center;border-bottom:1px solid #e5e7eb">${calif > 0 ? "★".repeat(Math.round(calif)) + "☆".repeat(5 - Math.round(calif)) + ` (${calif})` : "—"}</td>
          <td style="padding:7px 10px;font-size:11px;text-align:center;border-bottom:1px solid #e5e7eb">${r.total_calificaciones}</td>
        </tr>`;
    }).join("");

    const periodo = fechaInicio && fechaFin
      ? `${new Date(fechaInicio + "T00:00:00").toLocaleDateString("es-MX", { day:"2-digit", month:"long", year:"numeric" })} – ${new Date(fechaFin + "T00:00:00").toLocaleDateString("es-MX", { day:"2-digit", month:"long", year:"numeric" })}`
      : "Todo el historial";

    const html = `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"/>
      <title>Reporte de Rendimiento por Técnico</title>
      <style>
        @page{size:A4 landscape;margin:18mm 15mm}
        *{box-sizing:border-box;margin:0;padding:0}
        body{font-family:'Segoe UI',Arial,sans-serif;color:#1D1D1B}
        .header{display:flex;align-items:center;justify-content:space-between;border:2px solid #F47920;border-radius:10px;padding:14px 20px;margin-bottom:14px}
        .header-logo{height:48px;object-fit:contain}
        .header-title{font-size:18px;font-weight:900;color:#1D1D1B}
        .header-sub{font-size:10px;color:#6b7280;margin-top:2px;text-transform:uppercase;letter-spacing:.1em}
        .header-badge{display:inline-block;margin-top:4px;background:linear-gradient(135deg,#F47920,#d97400);color:#fff;font-size:10px;font-weight:700;padding:3px 10px;border-radius:20px}
        .kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:14px}
        .kpi{border:1.5px solid #e5e7eb;border-radius:8px;padding:10px 14px}
        .kpi-label{font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:#9ca3af;margin-bottom:4px}
        .kpi-val{font-size:22px;font-weight:900;line-height:1}
        .section-title{font-size:10px;font-weight:900;text-transform:uppercase;letter-spacing:.12em;color:#6b7280;display:flex;align-items:center;gap:8px;margin-bottom:8px}
        .section-title::before{content:'';display:inline-block;width:3px;height:14px;border-radius:2px;background:#F47920}
        .table-wrap{border:1.5px solid #e5e7eb;border-radius:10px;overflow:hidden}
        table{width:100%;border-collapse:collapse}
        thead tr{background:#f9fafb}
        th{padding:8px 10px;text-align:left;font-size:9px;font-weight:900;text-transform:uppercase;letter-spacing:.1em;color:#9ca3af;border-bottom:2px solid #e5e7eb;white-space:nowrap}
        th[data-center]{text-align:center}
        .footer{margin-top:14px;display:flex;align-items:center;justify-content:space-between;border-top:1.5px solid #e5e7eb;padding-top:10px;font-size:9px;color:#9ca3af}
        .footer-brand{font-weight:900;color:#F47920}
        @media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
      </style></head><body>
      <div class="header">
        <div style="display:flex;align-items:center;gap:16px">
          <img src="/assets/img/logo negro.png" class="header-logo" alt="PTP"/>
          <div style="width:2px;height:48px;background:linear-gradient(180deg,#F47920,#ffb347);border-radius:2px"></div>
          <div>
            <div class="header-title">Rendimiento por Técnico</div>
            <div class="header-sub">Precision Truck Parts · HelpDesk</div>
          </div>
        </div>
        <div style="text-align:right">
          <div style="font-size:11px;color:#6b7280">Generado el ${ahora}</div>
          <div style="font-size:11px;font-weight:700;color:#F47920;margin-top:4px">${periodo}</div>
          <span class="header-badge">${datos.length} técnico${datos.length !== 1 ? "s" : ""}</span>
        </div>
      </div>
      <div class="kpis">
        <div class="kpi"><div class="kpi-label">Técnicos activos</div><div class="kpi-val" style="color:#F47920">${datos.length}</div></div>
        <div class="kpi"><div class="kpi-label">Total atendidos</div><div class="kpi-val" style="color:#3b82f6">${totalAtendidos}</div></div>
        <div class="kpi"><div class="kpi-label">Total resueltos</div><div class="kpi-val" style="color:#16a34a">${totalResueltos}</div></div>
        <div class="kpi"><div class="kpi-label">Satisfacción prom.</div><div class="kpi-val" style="color:#f59e0b">${promedioCalif}</div></div>
      </div>
      <div class="section-title">Detalle por Técnico</div>
      <div class="table-wrap">
        <table>
          <thead><tr>
            <th>Técnico</th>
            <th data-center style="text-align:center">Atendidos</th>
            <th data-center style="text-align:center">Resueltos</th>
            <th data-center style="text-align:center">Tasa resolución</th>
            <th data-center style="text-align:center">Promedio horas</th>
            <th data-center style="text-align:center">Calificación</th>
            <th data-center style="text-align:center">Calif. recibidas</th>
          </tr></thead>
          <tbody>${filas}</tbody>
        </table>
      </div>
      <div class="footer">
        <div><span class="footer-brand">Precision Truck Parts</span> · Sistema HelpDesk</div>
        <div>Documento generado automáticamente · ${ahora}</div>
      </div>
    </body></html>`;

    const win = window.open("", "_blank", "width=1200,height=800");
    if (!win) return;
    win.document.write(html);
    win.document.close();
    win.onload = () => { win.focus(); win.print(); };
  };

  const inputStyle = {
    background: T.surfaceAlt, border: `1px solid ${T.border}`,
    color: T.text, borderRadius: "6px", padding: "5px 8px",
    fontSize: "12px", outline: "none",
  };

  return (
    <div className="flex flex-col h-full" style={{ background: T.bg, overflow: "hidden" }}>
      <div className="w-full p-2 sm:p-3 flex flex-col gap-3 overflow-y-auto flex-1 min-h-0">

        {/* KPIs resumen */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Técnicos",       val: datos.length,    color: T.orange,  icon: Users },
            { label: "Total atendidos",val: totalAtendidos,  color: "#3b82f6", icon: CheckCircle2 },
            { label: "Resueltos",      val: totalResueltos,  color: "#16a34a", icon: CheckCircle2 },
            { label: "Prom. horas",    val: promedioHoras,   color: "#8b5cf6", icon: Clock },
          ].map(({ label, val, color, icon: Icon }) => (
            <div key={label} className="rounded-xl p-3 flex flex-col gap-1 relative overflow-hidden" style={card}>
              <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: `linear-gradient(90deg,${color},${color}33)` }} />
              <div className="flex items-center gap-1.5">
                <Icon size={11} style={{ color }} />
                <p className="text-[10px] font-black uppercase tracking-wider" style={{ color: T.textMuted }}>{label}</p>
              </div>
              <span className="text-2xl font-black leading-none" style={{ color }}>{val}</span>
            </div>
          ))}
        </div>

        {/* Filtros */}
        <div className="rounded-xl p-3 flex flex-wrap items-end gap-3" style={card}>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-black uppercase tracking-wider" style={{ color: T.textMuted }}>Desde</label>
            <input type="date" value={fechaInicio} onChange={e => setFechaInicio(e.target.value)} style={inputStyle} />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-black uppercase tracking-wider" style={{ color: T.textMuted }}>Hasta</label>
            <input type="date" value={fechaFin} onChange={e => setFechaFin(e.target.value)} style={inputStyle} />
          </div>
          <button onClick={aplicarFiltro}
            className="px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all hover:brightness-110 active:scale-95"
            style={{ background: T.orange, color: "#fff" }}>
            Filtrar
          </button>
          {(fechaInicio || fechaFin) && (
            <button onClick={limpiar}
              className="px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all hover:brightness-110"
              style={{ background: T.surfaceAlt, color: T.textMuted, border: `1px solid ${T.border}` }}>
              Limpiar
            </button>
          )}
          <div className="flex-1" />
          <button onClick={exportar} disabled={!datos.length}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all hover:brightness-110 active:scale-95 disabled:opacity-40"
            style={{ background: "#F47920", color: "#fff" }}>
            <FileDown size={13} strokeWidth={2.5} /> Exportar PDF
          </button>
        </div>

        {/* Tabla */}
        <div className="rounded-xl overflow-hidden flex flex-col" style={{ ...card, flex: "1 1 0", minHeight: "300px" }}>
          <div className="flex items-center justify-between px-4 py-3 flex-shrink-0" style={hdr}>
            <div className="flex items-center gap-1.5">
              <div className="w-0.5 h-3.5 rounded-full" style={{ background: T.orange }} />
              <p className="text-xs font-black uppercase tracking-widest" style={{ color: T.textMuted }}>Técnicos</p>
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
                <div className="flex flex-col items-center justify-center py-8 gap-2">
                  <Inbox size={20} style={{ color: T.textFaint }} />
                  <p className="text-xs font-bold" style={{ color: T.textMuted }}>Sin datos</p>
                </div>
              ) : datos.map((r) => {
                const tasa = r.total_atendidos > 0 ? Math.round((r.resueltos / r.total_atendidos) * 100) : 0;
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
                        <p className="text-[9px] font-black uppercase" style={{ color: T.textMuted }}>Tasa</p>
                        <p className="text-base font-black" style={{ color: T.orange }}>{tasa}%</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      {calif > 0 ? <Estrellas n={Math.round(calif)} isDark={isDark} /> : <span className="text-[10px]" style={{ color: T.textFaint }}>Sin calificaciones</span>}
                      <span className="text-[10px] font-bold" style={{ color: "#8b5cf6" }}>
                        {r.promedio_horas != null ? `${r.promedio_horas}h prom.` : "—"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Tabla desktop */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full border-collapse" style={{ minWidth: "800px" }}>
                <thead className="sticky top-0 z-10">
                  <tr style={{ background: isDark ? "#1c2030" : T.surfaceAlt }}>
                    {["#", "Técnico", "Atendidos", "Resueltos", "Tasa resolución", "Prom. horas", "Calificación prom.", "Calif. recibidas"].map((col, i) => (
                      <th key={i} className="text-left px-3 py-2 text-[10px] font-black uppercase tracking-widest whitespace-nowrap"
                        style={{ color: T.textMuted, borderBottom: `1px solid ${T.border}` }}>
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {datos.length === 0 ? (
                    <tr><td colSpan={8}>
                      <div className="flex flex-col items-center justify-center py-12 gap-2">
                        <Inbox size={22} style={{ color: T.textFaint }} />
                        <p className="text-xs font-bold" style={{ color: T.textMuted }}>Sin datos de rendimiento</p>
                        <p className="text-[11px]" style={{ color: T.textFaint }}>Aún no hay tickets cerrados con técnico asignado</p>
                      </div>
                    </td></tr>
                  ) : datos.map((r, i) => {
                    const bgRow = i % 2 === 0 ? (isDark ? "#141720" : T.surface) : (isDark ? "#1c2030" : T.surfaceAlt);
                    const tasa  = r.total_atendidos > 0 ? Math.round((r.resueltos / r.total_atendidos) * 100) : 0;
                    const calif = Number(r.calificacion_promedio ?? 0);
                    const tasaColor = tasa >= 75 ? "#16a34a" : tasa >= 50 ? "#ca8a04" : "#dc2626";
                    return (
                      <tr key={r.id_tecnico}
                        style={{ background: bgRow, borderBottom: `1px solid ${T.border}` }}
                        onMouseEnter={e => e.currentTarget.style.background = isDark ? "rgba(244,121,32,0.05)" : "rgba(244,121,32,0.03)"}
                        onMouseLeave={e => e.currentTarget.style.background = bgRow}>

                        <td className="px-3 py-2 text-[10px] font-black" style={{ color: T.textFaint }}>{i + 1}</td>

                        <td className="px-3 py-2">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-black"
                              style={{ background: `${T.orange}20`, color: T.orange, border: `1px solid ${T.orange}30` }}>
                              {r.nombre_tecnico.charAt(0).toUpperCase()}
                            </div>
                            <span className="text-[11px] font-semibold" style={{ color: T.text }}>{r.nombre_tecnico}</span>
                          </div>
                        </td>

                        <td className="px-3 py-2">
                          <BarraRendimiento val={Number(r.resueltos)} max={maxResueltos} color="#3b82f6" />
                        </td>

                        <td className="px-3 py-2">
                          <span className="text-[11px] font-black" style={{ color: "#16a34a" }}>{r.resueltos}</span>
                          <span className="text-[10px] ml-1" style={{ color: T.textFaint }}>/ {r.total_atendidos}</span>
                        </td>

                        <td className="px-3 py-2">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black"
                            style={{ background: `${tasaColor}15`, color: tasaColor, border: `1px solid ${tasaColor}30` }}>
                            {tasa}%
                          </span>
                        </td>

                        <td className="px-3 py-2 text-[11px] font-semibold" style={{ color: "#8b5cf6" }}>
                          {r.promedio_horas != null ? `${r.promedio_horas}h` : "—"}
                        </td>

                        <td className="px-3 py-2">
                          {calif > 0 ? (
                            <div className="flex flex-col gap-0.5">
                              <Estrellas n={Math.round(calif)} isDark={isDark} />
                              <span className="text-[9px] font-semibold" style={{ color: T.textFaint }}>{calif.toFixed(2)} / 5.00</span>
                            </div>
                          ) : (
                            <span className="text-[10px]" style={{ color: T.textFaint }}>—</span>
                          )}
                        </td>

                        <td className="px-3 py-2 text-[11px] font-semibold text-center" style={{ color: T.textMuted }}>
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
