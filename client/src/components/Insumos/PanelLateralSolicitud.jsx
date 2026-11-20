/**
 * PanelLateralSolicitud.jsx — Columna derecha de la vista de una solicitud de
 * insumos: estado, acciones del administrador y exportar.
 * Separado de pages/Usuario/VistaSolicitud.jsx (que era de más de 1,000 líneas).
 */
import { Calendar, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import { FS } from '../../utils/tipografia.js';

export const ESTATUS_META = {
  "En proceso": { color: "#d97706", bgL: "#fef3c7", bgD: "rgba(217,119,6,0.15)",  borderL: "#fde68a", borderD: "rgba(217,119,6,0.3)",   icon: AlertTriangle },
  "Aceptado":   { color: "#16a34a", bgL: "#dcfce7", bgD: "rgba(22,163,74,0.15)",  borderL: "#86efac", borderD: "rgba(22,163,74,0.3)",   icon: CheckCircle2  },
  "Rechazado":  { color: "#dc2626", bgL: "#fee2e2", bgD: "rgba(220,38,38,0.15)",  borderL: "#fca5a5", borderD: "rgba(220,38,38,0.3)",   icon: XCircle       },
};
export const ESTATUS_OPTS = ["Aceptado", "Rechazado"];

export default function PanelLateralSolicitud({ T, cambiarEstatus, card, cerrado, errorAccion, esAdmin, fmtFechaHora, generarReporte, guardado, hdr, isDark, labelStyle, orange, solicitud, updating, valStyle }) {
  return (
  <div className="lg:col-span-2 space-y-3 sm:space-y-4">

    {/* Estado de la solicitud */}
    <div className="rounded-2xl overflow-hidden" style={card}>
      <div className="px-4 py-3 flex items-center gap-2" style={hdr}>
        <div className="w-1 h-4 rounded-full flex-shrink-0" style={{ background: orange }} />
        <p className="text-[10px] font-black uppercase tracking-widest" style={labelStyle}>Estado de la solicitud</p>
      </div>
      <div className="p-5 flex flex-col gap-3">

        {/* Fecha de solicitud */}
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
          style={{ background: isDark ? "rgba(255,255,255,0.03)" : T?.bg, border: `1px solid ${T?.border}` }}>
          <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: `${orange}18` }}>
            <Calendar size={13} style={{ color: orange }} />
          </div>
          <div>
            <p className="text-[9px] font-black uppercase tracking-widest" style={labelStyle}>Fecha de solicitud</p>
            <p className="text-[11px] font-semibold mt-0.5" style={valStyle}>{fmtFechaHora(solicitud.fecha)}</p>
          </div>
        </div>

        {/* Estado actual */}
        {!cerrado ? (
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl"
            style={{
              background: isDark ? `${orange}12` : "#fff7ed",
              border: `1px solid ${orange}40`,
            }}>
            <div className="relative flex-shrink-0">
              <div className="w-9 h-9 rounded-full flex items-center justify-center"
                style={{ background: `${orange}20`, border: `2px solid ${orange}` }}>
                <AlertTriangle size={16} style={{ color: orange }} />
              </div>
              <span className="absolute inset-0 rounded-full animate-ping"
                style={{ background: `${orange}25`, animationDuration: "2s" }} />
            </div>
            <div>
              <p className="text-[11px] font-black" style={{ color: orange }}>Pendiente de resolución</p>
              <p className="text-[9px] mt-0.5" style={{ color: T?.textFaint }}>
                {esAdmin ? "En espera de acción del administrador" : "Soporte Técnico revisará tu solicitud y te llegará una notificación cuando la resuelva."}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl"
            style={{
              background: isDark
                ? (solicitud.estatus === "Aceptado" ? "rgba(22,163,74,0.12)" : "rgba(220,38,38,0.12)")
                : (solicitud.estatus === "Aceptado" ? "#dcfce7" : "#fee2e2"),
              border: solicitud.estatus === "Aceptado"
                ? (isDark ? "1px solid rgba(22,163,74,0.3)" : "1px solid #86efac")
                : (isDark ? "1px solid rgba(220,38,38,0.3)" : "1px solid #fca5a5"),
            }}>
            <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
              style={{
                background: solicitud.estatus === "Aceptado" ? "rgba(22,163,74,0.2)" : "rgba(220,38,38,0.2)",
                border: solicitud.estatus === "Aceptado" ? "2px solid #16a34a" : "2px solid #dc2626",
              }}>
              {solicitud.estatus === "Aceptado"
                ? <CheckCircle2 size={18} style={{ color: "#16a34a" }} />
                : <XCircle size={18} style={{ color: "#dc2626" }} />}
            </div>
            <div>
              <p className="text-[11px] font-black"
                style={{ color: solicitud.estatus === "Aceptado" ? "#16a34a" : "#dc2626" }}>
                {solicitud.estatus === "Aceptado" ? "Solicitud aceptada" : "Solicitud rechazada"}
              </p>
              {solicitud.estatus === "Aceptado" ? (() => {
                const entregados = (solicitud.detalle || []).filter(d => d.aprobado === 1 || d.aprobado === true).length;
                const noEntregados = (solicitud.detalle || []).filter(d => d.aprobado === 0).length;
                return (
                  <p className="text-[9px] mt-0.5" style={{ color: T?.textFaint }}>
                    {entregados > 0 && noEntregados > 0
                      ? `${entregados} insumo${entregados !== 1 ? "s" : ""} se entregará${entregados !== 1 ? "n" : ""} · ${noEntregados} no (abajo ves cuáles)`
                      : entregados > 0
                      ? (esAdmin ? "Todos los insumos aprobados y stock descontado" : "Se aprobaron todos los insumos que pediste.")
                      : "Ningún insumo fue aprobado"}
                  </p>
                );
              })() : (
                <p className="text-[9px] mt-0.5" style={{ color: T?.textFaint }}>
                  {esAdmin ? "La solicitud fue denegada por el administrador" : "Soporte Técnico no aprobó esta solicitud. Si dejó una observación, ahí verás el motivo."}
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>

    {/* Exportar PDF */}
    <div style={card} className="rounded-2xl overflow-hidden"
      onMouseEnter={e => Object.assign(e.currentTarget.style, { boxShadow: isDark ? "0 12px 40px rgba(0,0,0,0.55)" : "0 12px 40px rgb(0,0,0,0.09)" })}
      onMouseLeave={e => Object.assign(e.currentTarget.style, { boxShadow: card.boxShadow })}>
      <div className="px-4 py-2.5 flex items-center gap-2" style={hdr}>
        <div className="w-1 h-3.5 rounded-full flex-shrink-0" style={{ background: "#dc2626" }} />
        <p className="text-[9px] font-black uppercase tracking-widest" style={labelStyle}>Exportar reporte</p>
      </div>
      <div className="px-5 py-5">
        <p className="text-[10px] mb-3" style={{ color: T?.textFaint }}>Genera un PDF con toda la información de esta solicitud.</p>
        <button
          onClick={generarReporte}
          className="w-full flex items-center justify-center gap-2.5 py-3 rounded-xl text-[11px] font-bold transition-all active:scale-95"
          style={{
            background: isDark ? "rgba(220,38,38,0.12)" : "#fef2f2",
            color: "#dc2626",
            border: `1px solid ${isDark ? "rgba(220,38,38,0.25)" : "#fca5a5"}`,
            letterSpacing: "0.03em",
            transition: "all 0.18s ease",
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = isDark ? "rgba(220,38,38,0.2)" : "#fee2e2";
            e.currentTarget.style.boxShadow = "0 4px 14px rgba(220,38,38,0.15)";
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = isDark ? "rgba(220,38,38,0.12)" : "#fef2f2";
            e.currentTarget.style.boxShadow = "none";
          }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="16" y1="13" x2="8" y2="13"/>
            <line x1="16" y1="17" x2="8" y2="17"/>
            <polyline points="10 9 9 9 8 9"/>
          </svg>
          Exportar PDF
        </button>
      </div>
    </div>

    {/* Cambiar estatus — solo admin */}
    {esAdmin && (
      <div className="rounded-2xl" style={{ ...card, overflow: "visible" }}>
        <div className="h-0.5 rounded-t-2xl" style={{ background: "linear-gradient(90deg,#16a34a,#4ade80,#16a34a)" }} />
        <div className="px-4 py-3 flex items-center gap-2"
          style={{ ...hdr, borderRadius: "0", borderTop: "none" }}>
          <div className="w-1 h-3.5 rounded-full flex-shrink-0" style={{ background: "#16a34a" }} />
          <p className="text-[9px] font-black uppercase tracking-widest" style={labelStyle}>Cambiar estatus</p>
        </div>
        <div className="p-4 flex flex-col gap-3">
          {guardado && (
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-[11px] font-semibold"
              style={{ background: isDark ? "rgba(22,163,74,0.15)" : "#dcfce7", color: "#16a34a", border: isDark ? "1px solid rgba(22,163,74,0.3)" : "1px solid #86efac" }}>
              <CheckCircle2 size={13} /> Estatus actualizado
            </div>
          )}
          {errorAccion && (
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-[11px] font-semibold"
              style={{ background: isDark ? "rgba(220,38,38,0.12)" : "#fee2e2", color: "#dc2626", border: "1px solid rgba(220,38,38,0.3)" }}>
              <XCircle size={13} /> {errorAccion}
            </div>
          )}
          {!cerrado ? (
            <div className="flex flex-col gap-3">
              {ESTATUS_OPTS.map(opt => {
                const m = ESTATUS_META[opt];
                const isAceptado = opt === "Aceptado";
                return (
                  <button
                    key={opt}
                    onClick={() => cambiarEstatus(opt)}
                    disabled={updating}
                    className="w-full flex items-center gap-3 px-4 rounded-xl font-bold transition-all hover:brightness-110 active:scale-95 disabled:opacity-50"
                    style={{
                      background: isAceptado
                        ? (isDark ? "rgba(22,163,74,0.15)" : "#dcfce7")
                        : (isDark ? "rgba(220,38,38,0.12)" : "#fee2e2"),
                      color: m.color,
                      border: `1px solid ${isDark ? `${m.color}40` : (isAceptado ? "#86efac" : "#fca5a5")}`,
                      minHeight: "52px",
                      fontSize: FS.enfasis,
                    }}
                  >
                    <m.icon size={17} />
                    {updating ? "Actualizando..." : opt}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 py-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{
                  background: isDark
                    ? (solicitud.estatus === "Rechazado" ? "rgba(220,38,38,0.15)" : "rgba(22,163,74,0.15)")
                    : (solicitud.estatus === "Rechazado" ? "#fee2e2" : "#dcfce7"),
                  border: solicitud.estatus === "Rechazado"
                    ? (isDark ? "2px solid rgba(220,38,38,0.3)" : "2px solid #fca5a5")
                    : (isDark ? "2px solid rgba(22,163,74,0.3)" : "2px solid #86efac"),
                }}>
                {solicitud.estatus === "Rechazado"
                  ? <XCircle size={20} style={{ color: "#dc2626" }} />
                  : <CheckCircle2 size={20} style={{ color: "#16a34a" }} />}
              </div>
              <p className="text-[11px] font-black"
                style={{ color: solicitud.estatus === "Rechazado" ? "#dc2626" : "#16a34a" }}>
                {solicitud.estatus === "Rechazado" ? "Rechazado" : "Aceptado"}
              </p>
              <p className="text-[10px] text-center" style={{ color: T?.textFaint }}>Solicitud cerrada</p>
            </div>
          )}
        </div>
      </div>
    )}

  </div>
  );
}
