/**
 * PanelLateralTicket.jsx — Columna derecha de la vista de un ticket: línea del
 * tiempo, calificación, exportar PDF y acciones del administrador.
 * Separado de pages/Usuario/VistaTicket.jsx (que era de más de 1,000 líneas).
 */
import { CheckCircle2, XCircle, MessageSquare, Star } from 'lucide-react';
import ProgressTimeline from '../ProgressTimeline.jsx';
import { FS } from '../../utils/tipografia.js';
import { CalificacionEstrellas } from './CalificacionEstrellas.jsx';

export default function PanelLateralTicket({ FIN, T, card, cardHover, cerrado, errorGuard, esAdmin, estatus, explicacion, fechaAlta, fechaResuelto, generarReporte, guardado, guardando, guardarCambios, hdr, horaAlta, horaResuelto, isDark, pasoActual, resueltoporState, setConfirmCierre, ticket, ticketLocal, tiempoResolucion, usuario }) {
  return (
  <div className="lg:col-span-2 space-y-4 sm:space-y-5">

    {/* ── LÍNEA DEL TIEMPO ── */}
    <div
      style={card}
      onMouseEnter={e => Object.assign(e.currentTarget.style, cardHover)}
      onMouseLeave={e => Object.assign(e.currentTarget.style, { boxShadow: card.boxShadow })}>
      <div className="px-6 py-4 flex items-center justify-between" style={hdr}>
        <div className="flex items-center gap-2.5">
          <div className="w-1 h-4 rounded-full flex-shrink-0" style={{ background:T.orange }}/>
          <p className="font-semibold uppercase tracking-[0.12em]" style={{ fontSize: FS.secundario, color: T.textFaint }}>Progreso</p>
        </div>
        <span className="font-semibold px-3 py-1 rounded-full"
          style={{ fontSize: FS.secundario, background: isDark?"rgba(255,255,255,0.06)":"#f1f5f9", color:T.textMuted, border:`1px solid ${isDark?"rgba(255,255,255,0.08)":"rgba(0,0,0,0.07)"}` }}>
          {pasoActual+1} / 4
        </span>
      </div>
      {/* barra progreso estilizada — 4 pasos */}
      <div className="px-6 pt-5 pb-2">
        <div className="relative h-3 rounded-full" style={{ background: isDark ? "rgba(255,255,255,0.06)" : "#e9eef5" }}>
          <div
            className="absolute left-0 top-0 h-full rounded-full transition-all duration-700"
            style={{
              width: ["8%", "40%", "73%", "100%"][pasoActual],
              background: pasoActual === 3
                ? `linear-gradient(90deg,${FIN.fuerte},${FIN.suave})`
                : "linear-gradient(90deg,#ea6000,#F47920,#ffb347)",
              boxShadow: pasoActual < 3
                ? "0 0 10px rgba(244,121,32,0.55)"
                : `0 0 10px ${FIN.brillo}`,
            }}
          />
          {[0, 1, 2, 3].map((i) => {
            const pct = ["0%", "33.3%", "66.6%", "100%"][i];
            return (
              <div key={i}
                className="absolute top-1/2 w-3 h-3 rounded-full border-2 transition-all duration-500"
                style={{
                  left: pct, transform: "translate(-50%,-50%)",
                  background: i <= pasoActual ? (pasoActual===3?FIN.suave:"#ffb347") : isDark?"#2a2f3e":"#d1d8e3",
                  borderColor: i <= pasoActual ? (pasoActual===3?FIN.fuerte:T.orange) : isDark?"rgba(255,255,255,0.1)":"#c5cdd8",
                  boxShadow: i === pasoActual ? (pasoActual===3?`0 0 8px ${FIN.brillo}`:"0 0 8px rgba(244,121,32,0.7)") : "none",
                  zIndex: 2,
                }}
              />
            );
          })}
        </div>
        <div className="flex justify-between mt-2">
          {["Recibido", "Asignado", "En proceso", FIN.etiqueta].map((l, i) => (
            <span key={l} className="text-[9px] font-bold"
              style={{ color: i <= pasoActual ? (pasoActual===3?FIN.fuerte:T.orange) : "#94a3b8", letterSpacing:"0.04em" }}>
              {l}
            </span>
          ))}
        </div>
      </div>
      {/* Stepper desacoplado */}
      <div className="px-6 pt-4 pb-6">
        <ProgressTimeline
          T={T}
          pasoActual={pasoActual}
          estatus={estatus}
          esAdmin={esAdmin}
          metadata={{
            fechaAlta,
            horaAlta,
            fechaResuelto,
            horaResuelto,
            nombreEmpleado: ticket.nombre_empleado,
            resuelto_por:   resueltoporState,
            nombreTecnico:  resueltoporState || ticket.nombre_tecnico || ticketLocal.nombre_tecnico,
            tiempoResolucion,
          }}
        />
        {explicacion && (
          <div className="mt-5 rounded-xl px-4 py-3"
            style={{ background: isDark ? "rgba(59,130,246,0.08)" : "#eff6ff", border: `1px solid ${isDark ? "rgba(59,130,246,0.25)" : "#bfdbfe"}` }}>
            <p className="font-bold mb-1" style={{ fontSize: FS.secundario, color: isDark ? "#93c5fd" : "#1d4ed8" }}>¿Qué significa esto?</p>
            <p style={{ fontSize: FS.secundario, lineHeight: 1.55, color: T.textMuted, margin: 0 }}>{explicacion}</p>
          </div>
        )}
      </div>
    </div>

    {/* -- CALIFICACIÓN -- usuario: interactiva / admin: solo lectura -- */}
    {!esAdmin ? (
    <div
      style={card}
      onMouseEnter={e => Object.assign(e.currentTarget.style, cardHover)}
      onMouseLeave={e => Object.assign(e.currentTarget.style, { boxShadow: card.boxShadow })}>
      <div className="px-6 py-4 flex items-center gap-2.5" style={hdr}>
        <div className="w-1 h-4 rounded-full flex-shrink-0" style={{ background: "#f59e0b" }} />
        <p className="font-semibold uppercase tracking-[0.12em]" style={{ fontSize: FS.secundario, color: T.textFaint }}>Calificar atención</p>
      </div>
      <div className="px-6 py-6 flex flex-col gap-3">
        <CalificacionEstrellas T={T} ticket={ticketLocal} estatusActual={estatus} />
      </div>
    </div>
    ) : (estatus === "Resuelto" || estatus === "No Resuelto") && (
    <div
      style={card}
      onMouseEnter={e => Object.assign(e.currentTarget.style, cardHover)}
      onMouseLeave={e => Object.assign(e.currentTarget.style, { boxShadow: card.boxShadow })}>
      <div className="px-6 py-4 flex items-center gap-2.5" style={hdr}>
        <div className="w-1 h-4 rounded-full flex-shrink-0" style={{ background: "#f59e0b" }} />
        <p className="font-semibold uppercase tracking-[0.12em]" style={{ fontSize: FS.secundario, color: T.textFaint }}>Calificación del usuario</p>
      </div>
      <div className="px-6 py-5 flex flex-col gap-2">
        {(() => {
          const calNum = Math.max(0, parseInt(ticketLocal.calificacion, 10) || 0);
          const MENSAJES = ["", "Muy malo", "Malo", "Regular", "Bueno", "Excelente"];
          return calNum > 0 ? (
            <>
              <div className="flex items-center justify-center gap-1.5 py-2">
                {[1,2,3,4,5].map(n => (
                  <Star key={n} size={28} fill={n <= calNum ? "#f59e0b" : "none"}
                    style={{ color: n <= calNum ? "#f59e0b" : isDark ? "rgba(255,255,255,0.15)" : "#d1d5db",
                      filter: n <= calNum ? "drop-shadow(0 0 4px rgba(245,158,11,0.5))" : "none" }}/>
                ))}
              </div>
              <p className="text-center text-[10px] font-bold" style={{ color: "#f59e0b" }}>
                {MENSAJES[calNum]} · {calNum}/5
              </p>
            </>
          ) : (
            <p className="text-center text-[11px] py-3" style={{ color: T.textFaint }}>Sin calificación aún</p>
          );
        })()}
      </div>
    </div>
    )}

    {/* -- EXPORTAR PDF (admin y usuario) -- */}
    <div
      style={card}
      onMouseEnter={e => Object.assign(e.currentTarget.style, cardHover)}
      onMouseLeave={e => Object.assign(e.currentTarget.style, { boxShadow: card.boxShadow })}>
      <div className="px-6 py-4 flex items-center gap-2.5" style={hdr}>
        <div className="w-1 h-4 rounded-full flex-shrink-0" style={{ background: "#dc2626" }} />
        <p className="font-semibold uppercase tracking-[0.12em]" style={{ fontSize: FS.secundario, color: T.textFaint }}>Exportar reporte</p>
      </div>
      <div className="px-5 py-5">
        <p className="mb-3" style={{ fontSize: FS.cuerpo, color: T.textFaint }}>Genera un PDF con toda la información de esta incidencia.</p>
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

    {/* -- ACCIONES ADMIN -- */}
    {esAdmin && (
      <div
        style={card}
        onMouseEnter={e => Object.assign(e.currentTarget.style, cardHover)}
        onMouseLeave={e => Object.assign(e.currentTarget.style, { boxShadow: card.boxShadow })}>
        <div className="h-0.5 rounded-t-2xl" style={{ background: "linear-gradient(90deg,#16a34a99,#4ade8066)" }} />
        <div className="px-6 py-4 flex items-center justify-between" style={hdr}>
          <div className="flex items-center gap-2.5">
            <div className="w-1 h-4 rounded-full flex-shrink-0" style={{ background: "#16a34a" }} />
            <p className="font-semibold uppercase tracking-[0.12em]" style={{ fontSize: FS.secundario, color: T.textFaint }}>Acciones del administrador</p>
          </div>
          {estatus === "Resuelto" && (
            <span className="flex items-center gap-1 px-3 py-1 rounded-full font-semibold"
              style={{ fontSize: FS.secundario, background: isDark ? "rgba(22,163,74,0.12)" : "#f0fdf4", color: "#16a34a", border: "1px solid rgba(22,163,74,0.2)" }}>
              <CheckCircle2 size={10}/> Cerrado
            </span>
          )}
        </div>
        <div className="px-6 py-5 flex flex-col gap-3">
          {errorGuard && (
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-[11px] font-semibold"
              style={{ background: isDark ? "rgba(220,38,38,0.15)" : "#fee2e2", color: "#dc2626", border: isDark ? "1px solid rgba(220,38,38,0.3)" : "1px solid #fca5a5" }}>
              <XCircle size={13}/> {errorGuard}
            </div>
          )}
          {guardado && (
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-[11px] font-semibold"
              style={{ background: isDark ? "rgba(22,163,74,0.15)" : "#dcfce7", color: "#16a34a", border: isDark ? "1px solid rgba(22,163,74,0.3)" : "1px solid #86efac" }}>
              <CheckCircle2 size={13}/> Cambios guardados
            </div>
          )}
          {!cerrado ? (
            <>
              <button
                onClick={() => guardarCambios(null)}
                disabled={guardando}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-[12px] font-bold active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ background: `linear-gradient(135deg,${T.orange},#ea6000)`, color: "#fff", boxShadow: "0 4px 14px rgba(249,115,22,0.35)", minHeight: "48px", transition: "all 0.18s ease" }}
                onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 6px 20px rgba(249,115,22,0.45)"; e.currentTarget.style.transform = "translateY(-1px)"; }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 4px 14px rgba(249,115,22,0.35)"; e.currentTarget.style.transform = "none"; }}>
                <MessageSquare size={14}/> {guardando ? "Guardando..." : "Guardar comentario"}
              </button>
              <button onClick={() => setConfirmCierre(true)}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-[12px] font-bold transition-all hover:brightness-110 active:scale-95"
                style={{ background: "linear-gradient(135deg,#16a34a,#15803d)", color: "#fff", boxShadow: "0 3px 12px rgba(22,163,74,0.3)", minHeight: "48px" }}>
                <CheckCircle2 size={14}/> Cerrar ticket
              </button>
            </>
          ) : (
            <div className="flex flex-col items-center gap-2 py-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ background: isDark ? "rgba(22,163,74,0.15)" : "#dcfce7", border: isDark ? "2px solid rgba(22,163,74,0.3)" : "2px solid #86efac" }}>
                <CheckCircle2 size={20} style={{ color: "#16a34a" }}/>
              </div>
              <p className="text-[11px] font-black" style={{ color: "#16a34a" }}>Ticket cerrado</p>
              <p className="text-[10px] text-center" style={{ color: T.textFaint }}>No se pueden realizar más acciones</p>
            </div>
          )}
        </div>
      </div>
    )}

  </div>
  );
}
