/**
 * CampanaNotificaciones.jsx
 *
 * Componente de la campana de notificaciones en tiempo real.
 * Se muestra en la barra de navegacion y permite al usuario ver
 * el historial de notificaciones recibidas durante la sesion.
 *
 * Correcciones aplicadas:
 *   - Panel siempre posicionado como absolute relativo al boton (nunca fixed),
 *     usando clamp() para ancho responsivo. Elimina la logica de window.innerWidth
 *     evaluada solo al montar que causaba posicion incorrecta.
 *   - Cierre-fuera reemplazado: ya no usa capture:true que se disparaba antes
 *     del click del boton de accion. Ahora usa un flag (accionRef) para que el
 *     handler de cierre ignore el evento que origino una accion interna.
 *   - Botones de accion cambiados de onMouseDown+preventDefault a onClick para
 *     que el flujo de evento sea el estandar y no interfiera con el cierre.
 *   - Tipografia unificada via var(--font-sans).
 */
import { useState, useRef, useEffect, useCallback } from "react";
import { Bell, X, CheckCircle2, Package, Ticket, Star, Clock, AlertTriangle, Wrench, VolumeX, Volume2 } from "lucide-react";
import { isMuted, setMuted } from "../Config/NotificationService.js";

// -- Configuración de cada tipo de notificación ---------------------------
const TIPO_CONFIG = {
  "ticket:nuevo": {
    icon:   Ticket,
    color:  () => "#F47920",
    bg:     () => "rgba(244,121,32,0.12)",
    titulo: () => "Nuevo ticket recibido",
    sub:    (d) => `${d.nombre_empleado || "Usuario"} · ${d.departamento || "Sin área"}\n#${d.folio_ticket} · ${d.prioridad} — ${d.titulo}`,
    accion: "Ver ticket",
  },
  "solicitud:nueva": {
    icon:   Package,
    color:  () => "#3b82f6",
    bg:     () => "rgba(59,130,246,0.12)",
    titulo: () => "Nueva solicitud de insumo",
    sub:    (d) => `${d.nombre_empleado || "Usuario"} · ${d.departamento || "Sin área"}\n#${d.folio_solicitud} · ${d.prioridad} · ${d.total_insumos} insumo${d.total_insumos !== 1 ? "s" : ""}`,
    accion: "Ver solicitud",
  },
  "ticket:calificado": {
    icon:   Star,
    color:  () => "#f59e0b",
    bg:     () => "rgba(245,158,11,0.12)",
    titulo: () => "Ticket calificado",
    sub:    (d) => {
      const LABELS = ["", "Muy malo", "Malo", "Regular", "Bueno", "Excelente"];
      return `${d.nombre_empleado} · #${d.folio_ticket}\n${"★".repeat(d.calificacion)}${"☆".repeat(5 - d.calificacion)} ${LABELS[d.calificacion] || ""}`;
    },
    accion: "Ver ticket",
  },
  "ticket:sla_warning": {
    icon:   AlertTriangle,
    color:  () => "#dc2626",
    bg:     () => "rgba(220,38,38,0.14)",
    titulo: () => "Vencimiento de SLA",
    sub:    (d) => `${d.mensaje || `Advertencia: El ticket #${d.folio_ticket} está próximo a superar el tiempo de respuesta acordado (SLA).`}\nTiempo restante: ${d.tiempo_restante} · Prioridad: ${d.prioridad}`,
    accion: "Ver ticket",
  },
  "tickets:vencidos": {
    icon:   Clock,
    color:  () => "#dc2626",
    bg:     () => "rgba(220,38,38,0.12)",
    titulo: () => "Tickets cerrados por vencimiento",
    sub:    (d) => `${d.total} ticket${d.total !== 1 ? "s" : ""} marcado${d.total !== 1 ? "s" : ""} como "No Resuelto" por superar el SLA de 48h.`,
    accion: null,
  },
  "ticket:actualizado": {
    icon:   CheckCircle2,
    color:  (d) => d.estatus === "Resuelto" ? "#16a34a" : "#dc2626",
    bg:     (d) => d.estatus === "Resuelto" ? "rgba(22,163,74,0.12)" : "rgba(220,38,38,0.12)",
    titulo: (d) => d.estatus === "Resuelto"
      ? "Tu ticket fue resuelto"
      : `Ticket marcado como "${d.estatus}"`,
    sub:    (d) => {
      const tecnico = d.resuelto_por || d.nombre_tecnico;
      const linea2  = d.estatus === "Resuelto"
        ? (tecnico ? `Cerrado por: ${tecnico} · Toca para calificar` : "Toca para calificar la atención")
        : (tecnico ? `Cerrado por: ${tecnico}` : "");
      return `#${d.folio_ticket} — ${d.titulo}${linea2 ? `\n${linea2}` : ""}`;
    },
    accion: (d) => d.estatus === "Resuelto" ? "Calificar atencion" : "Ver ticket",
  },
  "ticket:en_atencion": {
    icon:   Wrench,
    color:  () => "#8b5cf6",
    bg:     () => "rgba(139,92,246,0.12)",
    titulo: (d) => d._esAdmin ? "Ticket tomado por técnico" : "Tu ticket esta siendo atendido",
    sub:    (d) => `#${d.folio_ticket} — ${d.titulo}\nTécnico asignado: ${d.nombre_tecnico || "Soporte técnico"}`,
    accion: "Ver ticket",
  },
  "solicitud:actualizada": {
    icon:   Package,
    color:  (d) => d.estatus === "Resuelto" ? "#16a34a" : (d.estatus === "No Resuelto" || d.estatus === "Rechazado") ? "#dc2626" : "#F47920",
    bg:     (d) => d.estatus === "Resuelto" ? "rgba(22,163,74,0.12)" : (d.estatus === "No Resuelto" || d.estatus === "Rechazado") ? "rgba(220,38,38,0.12)" : "rgba(244,121,32,0.12)",
    titulo: (d) => `Solicitud de insumo: ${d.estatus}`,
    sub:    (d) => `#${d.folio_solicitud}`,
    accion: null,
  },
  "ticket:confirmado": {
    icon:   CheckCircle2,
    color:  () => "#16a34a",
    bg:     () => "rgba(22,163,74,0.12)",
    titulo: () => "Reporte recibido",
    sub:    (d) => `#${d.folio_ticket} — ${d.titulo}\nPrioridad: ${d.prioridad} · En revisión por soporte`,
    accion: "Ver ticket",
  },
  "insumo:stock_critico": {
    icon:   Package,
    color:  (d) => d.stock === 0 ? "#dc2626" : "#f59e0b",
    bg:     (d) => d.stock === 0 ? "rgba(220,38,38,0.14)" : "rgba(245,158,11,0.12)",
    titulo: (d) => d.stock === 0 ? "Insumo agotado" : "Stock critico de insumo",
    sub:    (d) => d.stock === 0
      ? `"${d.nombre}" no tiene unidades disponibles`
      : `"${d.nombre}" tiene solo ${d.stock} unidad${d.stock !== 1 ? "es" : ""} restante${d.stock !== 1 ? "s" : ""}`,
    accion: null,
    imagen: (d) => d.imagen_url || null,
  },
  "ticket:cancelado": {
    icon:   X,
    color:  () => "#6b7280",
    bg:     () => "rgba(107,114,128,0.10)",
    titulo: () => "Ticket cancelado",
    sub:    (d) => `#${d.folio_ticket}${d.titulo ? ` — ${d.titulo}` : ""}`,
    accion: null,
  },
  "ticket:sin_atender": {
    icon:   Clock,
    color:  () => "#f59e0b",
    bg:     () => "rgba(245,158,11,0.12)",
    titulo: () => "Ticket sin atender",
    sub:    (d) => `#${d.folio_ticket} — ${d.titulo}\n${d.horas}h sin técnico asignado · Prioridad: ${d.prioridad}`,
    accion: "Ver ticket",
  },
};

// -- Componente principal -------------------------------------------------
export default function CampanaNotificaciones({ T, notificaciones, onDismiss, onDismissAll, onClickNotif }) {
  const [abierto, setAbierto]   = useState(false);
  const [animando, setAnimando] = useState(false);
  const [muted, setMutedState]  = useState(() => isMuted());

  const toggleMute = useCallback(() => {
    const next = !muted;
    setMuted(next);
    setMutedState(next);
  }, [muted]);

  const btnRef    = useRef(null);  // botón de la campana
  const panelRef  = useRef(null);  // panel flotante
  const prevLen   = useRef(notificaciones.length);
  // Flag para que el handler de cierre-fuera ignore el evento que originó
  // un clic en un botón interno (evita cerrar antes de que onClick se ejecute)
  const accionRef = useRef(false);
  const isDark    = T.isDark;
  const noLeidas  = notificaciones.length;

  // Animar campana cuando llega una notificación nueva
  useEffect(() => {
    if (notificaciones.length > prevLen.current) {
      setAnimando(true);
      setTimeout(() => setAnimando(false), 600);
    }
    prevLen.current = notificaciones.length;
  }, [notificaciones]);

  // Cerrar al hacer clic fuera del botón y del panel
  // Usa mousedown sin capture para no interceptar clicks internos antes de
  // que React los procese. El flag accionRef protege los clics de acción.
  useEffect(() => {
    if (!abierto) return;
    const handler = (e) => {
      if (accionRef.current) { accionRef.current = false; return; }
      const enBoton = btnRef.current?.contains(e.target);
      const enPanel = panelRef.current?.contains(e.target);
      if (!enBoton && !enPanel) setAbierto(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [abierto]);

  // Marca el flag ANTES del mousedown externo y luego ejecuta la acción
  const handleClickNotif = useCallback((n) => {
    accionRef.current = true;
    setAbierto(false);
    setTimeout(() => { accionRef.current = false; onClickNotif?.(n); }, 80);
  }, [onClickNotif]);

  return (
    // relative es imprescindible para que el panel absolute se posicione
    // correctamente respecto al botón en todos los tamaños de pantalla
    <div className="relative">

      {/* -- Botón campana -- */}
      <button
        ref={btnRef}
        onClick={() => setAbierto(v => !v)}
        className="relative flex items-center justify-center w-9 h-9 rounded-xl transition-all hover:brightness-110 active:scale-95"
        style={{
          fontFamily: "var(--font-sans, 'Inter','Segoe UI',sans-serif)",
          background: abierto ? "rgba(244,121,32,0.15)" : T.surfaceAlt,
          border: `1px solid ${abierto ? "rgba(244,121,32,0.4)" : T.border}`,
          color: abierto ? T.orange : T.textMuted,
        }}>
        <Bell size={16} style={{
          animation: animando ? "campana-ring 0.6s ease-in-out" : "none",
        }} />
        {noLeidas > 0 && (
          <span
            className="absolute -top-1 -right-1 flex items-center justify-center rounded-full text-[9px] font-black text-white"
            style={{
              minWidth: "16px", height: "16px", padding: "0 3px",
              background: "linear-gradient(135deg, #F47920, #d97400)",
              boxShadow: "0 2px 6px rgba(244,121,32,0.5)",
              animation: animando ? "badge-pop 0.4s ease-out" : "none",
            }}>
            {noLeidas > 9 ? "9+" : noLeidas}
          </span>
        )}
      </button>

      <style>{`
        @keyframes campana-ring {
          0%,100% { transform: rotate(0deg); }
          20%      { transform: rotate(-18deg); }
          40%      { transform: rotate(18deg); }
          60%      { transform: rotate(-12deg); }
          80%      { transform: rotate(8deg); }
        }
        @keyframes badge-pop {
          0%   { transform: scale(0.5); opacity: 0; }
          60%  { transform: scale(1.3); }
          100% { transform: scale(1);   opacity: 1; }
        }
        @keyframes notif-slide-in {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* -- Panel desplegable --
          Siempre absolute relativo al wrapper .relative.
          clamp(280px, 88vw, 420px) garantiza que nunca desborde en móvil
          ni sea demasiado estrecho en desktop. */}
      {abierto && (
        <div
          ref={panelRef}
          className="absolute z-50 rounded-2xl overflow-hidden"
          style={{
            top: "calc(100% + 8px)",
            right: 0,
            width: "clamp(280px, 88vw, 420px)",
            fontFamily: "var(--font-sans, 'Inter','Segoe UI',sans-serif)",
            background: isDark ? "#141720" : T.surface,
            border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : T.border}`,
            boxShadow: isDark ? "0 20px 60px rgba(0,0,0,0.6)" : "0 8px 32px rgba(0,0,0,0.15)",
            animation: "notif-slide-in 0.18s ease-out",
          }}>

          {/* Header */}
          <div
            className="flex items-center justify-between px-4 py-3"
            style={{
              borderBottom: `1px solid ${isDark ? "rgba(255,255,255,0.07)" : T.border}`,
              background: isDark ? "rgba(255,255,255,0.03)" : T.surfaceAlt,
            }}>
            <div className="flex items-center gap-2">
              <Bell size={13} style={{ color: T.orange }} />
              <span className="text-xs font-black" style={{ color: T.text }}>Notificaciones</span>
              {noLeidas > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-[9px] font-black"
                  style={{ background: T.orange, color: "#fff" }}>
                  {noLeidas}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={toggleMute}
                title={muted ? "Activar sonido" : "Silenciar"}
                className="flex items-center justify-center w-6 h-6 rounded-lg transition-all hover:brightness-110"
                style={{ background: muted ? "rgba(220,38,38,0.12)" : T.bg, color: muted ? "#dc2626" : T.textFaint, border: `1px solid ${T.border}` }}>
                {muted ? <VolumeX size={11} /> : <Volume2 size={11} />}
              </button>
              {noLeidas > 0 && (
                <button
                  onClick={onDismissAll}
                  className="text-[10px] font-bold transition-colors hover:underline"
                  style={{ color: T.textMuted }}>
                  Limpiar
                </button>
              )}
            </div>
          </div>

          {/* Lista */}
          <div style={{ maxHeight: "420px", overflowY: "auto" }}>
            {notificaciones.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 gap-2">
                <Bell size={28} style={{ color: T.textFaint }} />
                <p className="text-xs font-semibold" style={{ color: T.textMuted }}>Sin notificaciones</p>
                <p className="text-[11px]" style={{ color: T.textFaint }}>Todo al día por ahora</p>
              </div>
            ) : notificaciones.map((n, i) => {
              const cfg    = TIPO_CONFIG[n.tipo];
              if (!cfg) return null;
              const Icon   = cfg.icon;
              const color  = cfg.color(n.data);
              const bg     = cfg.bg(n.data);
              const titulo = cfg.titulo(n.data) ?? "";
              const sub    = cfg.sub(n.data) ?? "";
              const accion = typeof cfg.accion === "function" ? cfg.accion(n.data) : cfg.accion;
              const imgUrl = cfg.imagen ? cfg.imagen(n.data) : null;

              const esCalificable = n.tipo === "ticket:actualizado" && n.data.estatus === "Resuelto";
              const tieneAccion = accion && (
                n.tipo === "ticket:nuevo" ||
                n.tipo === "solicitud:nueva" ||
                n.tipo === "ticket:calificado" ||
                n.tipo === "ticket:sla_warning" ||
                n.tipo === "ticket:en_atencion" ||
                n.tipo === "ticket:actualizado" ||
                n.tipo === "ticket:confirmado" ||
                n.tipo === "ticket:sin_atender"
              );
              const esSLA = n.tipo === "ticket:sla_warning";

              return (
                <div
                  key={n.id}
                  className="flex flex-col"
                  style={{
                    borderTop: i > 0 ? `1px solid ${isDark ? "rgba(255,255,255,0.05)" : T.border}` : "none",
                    animation: "notif-slide-in 0.2s ease-out",
                  }}>

                  {/* Banda de color superior para SLA */}
                  {esSLA && (
                    <div style={{ height: "2px", background: "linear-gradient(90deg, #dc2626, #ef4444, #dc2626)" }} />
                  )}

                  <div
                    className="flex items-start gap-3 px-4 py-3 transition-colors"
                    style={{ background: bg }}
                    onMouseEnter={e => e.currentTarget.style.filter = "brightness(1.05)"}
                    onMouseLeave={e => e.currentTarget.style.filter = "none"}>

                    {/* Icono */}
                    <div
                      className="flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center mt-0.5 overflow-hidden"
                      style={{
                        background: imgUrl ? "transparent" : `${color}20`,
                        border: `1px solid ${color}30`,
                        boxShadow: esSLA ? `0 0 8px ${color}40` : "none",
                      }}>
                      {imgUrl
                        ? <img src={imgUrl} alt="" className="w-full h-full object-cover rounded-xl" />
                        : <Icon size={14} style={{ color }} />
                      }
                    </div>

                    {/* Texto */}
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-black leading-tight" style={{ color }}>
                        {titulo}
                      </p>
                      {sub.split("\n").map((linea, li) => (
                        <p
                          key={li}
                          className="text-[10px] leading-snug mt-0.5"
                          style={{
                            color: li === 0 ? T.textMuted : T.textFaint,
                            fontWeight: li === 0 ? 500 : 400,
                          }}>
                          {linea}
                        </p>
                      ))}
                      <p className="text-[9px] mt-1" style={{ color: T.textFaint }}>
                        {new Date(n.ts).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>

                    {/* Cerrar — onClick en lugar de onMouseDown para no
                        activar el handler de cierre-fuera antes de tiempo */}
                    <button
                      onClick={(e) => { e.stopPropagation(); onDismiss(n.id); }}
                      className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center transition-colors"
                      style={{ color: T.textFaint }}
                      onMouseEnter={e => e.currentTarget.style.color = T.text}
                      onMouseLeave={e => e.currentTarget.style.color = T.textFaint}>
                      <X size={11} />
                    </button>
                  </div>

                  {/* Botón de acción — onClick estándar; handleClickNotif
                      establece el flag antes de setAbierto(false) para que
                      el listener externo no interfiera */}
                  {tieneAccion && (
                    <button
                      onClick={(e) => { e.stopPropagation(); handleClickNotif(n); }}
                      className="mx-3 mb-2 flex items-center justify-center gap-1.5 py-1.5 rounded-xl text-[10px] font-bold transition-all hover:brightness-110 active:scale-95"
                      style={{
                        fontFamily: "var(--font-sans, 'Inter','Segoe UI',sans-serif)",
                        ...(esCalificable
                          ? { background: "linear-gradient(135deg, #f59e0b, #d97706)", color: "#fff", boxShadow: "0 2px 8px rgba(245,158,11,0.35)" }
                          : esSLA
                          ? { background: "linear-gradient(135deg, #dc2626, #b91c1c)", color: "#fff", boxShadow: "0 2px 8px rgba(220,38,38,0.35)" }
                          : { background: isDark ? "rgba(255,255,255,0.08)" : T.surfaceAlt, color: T.orange, border: `1px solid rgba(244,121,32,0.3)` })
                      }}>
                      {esCalificable && <Star size={10} />}
                      {esSLA && <AlertTriangle size={10} />}
                      {accion}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
