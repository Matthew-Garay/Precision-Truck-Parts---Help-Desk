/**
 * CampanaNotificaciones.jsx
 *
 * Componente de la campana de notificaciones en tiempo real.
 * Se muestra en la barra de navegacion y permite al usuario ver
 * el historial de notificaciones recibidas durante la sesion.
 *
 * Comportamiento:
 *   - Muestra un badge naranja con el conteo de notificaciones no leidas.
 *   - La campana se anima con un efecto de bamboleo cuando llega una notificacion nueva.
 *   - Al hacer clic se despliega un panel flotante con la lista de notificaciones.
 *   - El panel se cierra al hacer clic fuera de el.
 *   - Cada notificacion muestra un icono de color segun su tipo, el titulo,
 *     el mensaje en dos lineas y la hora de recepcion.
 *   - Las notificaciones con accion (ver ticket, calificar) muestran un boton
 *     que al presionarlo llama a onClickNotif y cierra el panel.
 *   - Las alertas de SLA tienen una banda roja superior y un boton rojo de urgencia.
 *
 * Props:
 *   T              - tokens del tema activo (claro u oscuro)
 *   notificaciones - arreglo de notificaciones del historial (de useTicketNotification)
 *   onDismiss      - funcion(id) para eliminar una notificacion del historial
 *   onDismissAll   - funcion() para limpiar todo el historial
 *   onClickNotif   - funcion(notificacion) al hacer clic en el boton de accion
 *
 * Tipos de notificacion soportados (TIPO_CONFIG):
 *   ticket:nuevo, solicitud:nueva, ticket:calificado, ticket:sla_warning,
 *   tickets:vencidos, ticket:actualizado, ticket:en_atencion,
 *   solicitud:actualizada, ticket:confirmado, insumo:stock_critico, ticket:sin_atender
 */
import { useState, useRef, useEffect, useCallback } from "react";
import { Bell, X, CheckCircle2, Package, Ticket, Star, Clock, AlertTriangle, Wrench } from "lucide-react";

// -- Configuración de cada tipo de notificación ---------------------------
const TIPO_CONFIG = {
  // ADMIN: nuevo ticket con nombre y área
  "ticket:nuevo": {
    icon:   Ticket,
    color:  () => "#F47920",
    bg:     () => "rgba(244,121,32,0.12)",
    titulo: () => "Nuevo ticket recibido",
    sub:    (d) => `${d.nombre_empleado || "Usuario"} · ${d.departamento || "Sin área"}\n#${d.folio_ticket} · ${d.prioridad} — ${d.titulo}`,
    accion: "Ver ticket",
  },
  // ADMIN: nueva solicitud de insumo con nombre y área
  "solicitud:nueva": {
    icon:   Package,
    color:  () => "#3b82f6",
    bg:     () => "rgba(59,130,246,0.12)",
    titulo: () => "Nueva solicitud de insumo",
    sub:    (d) => `${d.nombre_empleado || "Usuario"} · ${d.departamento || "Sin área"}\n#${d.folio_solicitud} · ${d.prioridad} · ${d.total_insumos} insumo${d.total_insumos !== 1 ? "s" : ""}`,
    accion: "Ver solicitud",
  },
  // ADMIN: ticket calificado
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
  // ADMIN: alerta SLA próximo a vencer
  "ticket:sla_warning": {
    icon:   AlertTriangle,
    color:  () => "#dc2626",
    bg:     () => "rgba(220,38,38,0.14)",
    titulo: () => "Vencimiento de SLA",
    sub:    (d) => `${d.mensaje || `Advertencia: El ticket #${d.folio_ticket} está próximo a superar el tiempo de respuesta acordado (SLA).`}\nTiempo restante: ${d.tiempo_restante} · Prioridad: ${d.prioridad}`,
    accion: "Ver ticket",
  },
  // ADMIN: tickets cerrados automáticamente
  "tickets:vencidos": {
    icon:   Clock,
    color:  () => "#dc2626",
    bg:     () => "rgba(220,38,38,0.12)",
    titulo: () => "Tickets cerrados por vencimiento",
    sub:    (d) => `${d.total} ticket${d.total !== 1 ? "s" : ""} marcado${d.total !== 1 ? "s" : ""} como "No Resuelto" por superar el SLA de 48h.`,
    accion: null,
  },
  // USUARIO: su ticket fue resuelto o cerrado → debe calificar
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
  // USUARIO: su ticket está siendo atendido por un técnico
  "ticket:en_atencion": {
    icon:   Wrench,
    color:  () => "#8b5cf6",
    bg:     () => "rgba(139,92,246,0.12)",
    titulo: () => "Tu ticket esta siendo atendido",
    sub:    (d) => `#${d.folio_ticket} — ${d.titulo}\nTécnico asignado: ${d.nombre_tecnico || "Soporte técnico"}`,
    accion: "Ver ticket",
  },
  // USUARIO: su solicitud fue actualizada
  "solicitud:actualizada": {
    icon:   Package,
    color:  (d) => d.estatus === "Resuelto" ? "#16a34a" : d.estatus === "No Resuelto" ? "#dc2626" : "#F47920",
    bg:     (d) => d.estatus === "Resuelto" ? "rgba(22,163,74,0.12)" : d.estatus === "No Resuelto" ? "rgba(220,38,38,0.12)" : "rgba(244,121,32,0.12)",
    titulo: (d) => `Solicitud de insumo: ${d.estatus}`,
    sub:    (d) => `#${d.folio_solicitud}`,
    accion: null,
  },
  // USUARIO: confirmación inmediata de ticket creado
  "ticket:confirmado": {
    icon:   CheckCircle2,
    color:  () => "#16a34a",
    bg:     () => "rgba(22,163,74,0.12)",
    titulo: () => "Reporte recibido",
    sub:    (d) => `#${d.folio_ticket} — ${d.titulo}\nPrioridad: ${d.prioridad} · En revisión por soporte`,
    accion: "Ver ticket",
  },
  // ADMIN: stock crítico de insumo
  "insumo:stock_critico": {
    icon:   Package,
    color:  (d) => d.stock === 0 ? "#dc2626" : "#f59e0b",
    bg:     (d) => d.stock === 0 ? "rgba(220,38,38,0.14)" : "rgba(245,158,11,0.12)",
    titulo: (d) => d.stock === 0 ? "Insumo agotado" : "Stock critico de insumo",
    sub:    (d) => d.stock === 0
      ? `"${d.nombre}" no tiene unidades disponibles`
      : `"${d.nombre}" tiene solo ${d.stock} unidad${d.stock !== 1 ? "es" : ""} restante${d.stock !== 1 ? "s" : ""}`,
    accion: null,
  },
  // ADMIN: ticket sin técnico asignado más de 24h
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
  const [abierto, setAbierto] = useState(false);
  const [animando, setAnimando] = useState(false);
  const ref      = useRef(null);
  const prevLen  = useRef(notificaciones.length);
  const isDark   = T.isDark;
  const noLeidas = notificaciones.length;

  // Animar campana cuando llega una notificación nueva
  useEffect(() => {
    if (notificaciones.length > prevLen.current) {
      setAnimando(true);
      setTimeout(() => setAnimando(false), 600);
    }
    prevLen.current = notificaciones.length;
  }, [notificaciones]);

  // Cerrar al hacer click fuera
  useEffect(() => {
    if (!abierto) return;
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setAbierto(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [abierto]);

  const handleClickNotif = useCallback((n) => {
    onClickNotif?.(n);
    setAbierto(false);
  }, [onClickNotif]);

  return (
    <div className="relative" ref={ref}>

      {/* -- Botón campana -- */}
      <button
        onClick={() => setAbierto(v => !v)}
        className="relative flex items-center justify-center w-9 h-9 rounded-xl transition-all hover:brightness-110 active:scale-95"
        style={{
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

      {/* -- Panel desplegable -- */}
      {abierto && (
        <div
          className="fixed sm:absolute left-2 right-2 sm:left-auto sm:right-0 z-50 rounded-2xl overflow-hidden"
          style={{
            top: "60px",
            width: "auto",
            maxWidth: "100vw",
            minWidth: "min(340px, calc(100vw - 16px))",
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
            {noLeidas > 0 && (
              <button
                onClick={onDismissAll}
                className="text-[10px] font-bold transition-colors hover:underline"
                style={{ color: T.textMuted }}>
                Limpiar todo
              </button>
            )}
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

              // Botón calificar solo para ticket resuelto del usuario
              const esCalificable = n.tipo === "ticket:actualizado" && n.data.estatus === "Resuelto";
              // Botón "Ver" para admin en ticket nuevo / solicitud / calificado / sla
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

              // Color especial para SLA warning
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
                      className="flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center mt-0.5"
                      style={{
                        background: `${color}20`,
                        border: `1px solid ${color}30`,
                        boxShadow: esSLA ? `0 0 8px ${color}40` : "none",
                      }}>
                      <Icon size={14} style={{ color }} />
                    </div>

                    {/* Texto */}
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-black leading-tight" style={{ color }}>
                        {titulo}
                      </p>
                      {/* Sub con saltos de línea */}
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

                    {/* Cerrar */}
                    <button
                      onMouseDown={(e) => { e.stopPropagation(); onDismiss(n.id); }}
                      className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center transition-colors"
                      style={{ color: T.textFaint }}
                      onMouseEnter={e => e.currentTarget.style.color = T.text}
                      onMouseLeave={e => e.currentTarget.style.color = T.textFaint}>
                      <X size={11} />
                    </button>
                  </div>

                  {/* Botón de acción */}
                  {tieneAccion && (
                    <button
                      onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); handleClickNotif(n); }}
                      className="mx-3 mb-2 flex items-center justify-center gap-1.5 py-1.5 rounded-xl text-[10px] font-bold transition-all hover:brightness-110 active:scale-95"
                      style={
                        esCalificable
                          ? { background: "linear-gradient(135deg, #f59e0b, #d97706)", color: "#fff", boxShadow: "0 2px 8px rgba(245,158,11,0.35)" }
                          : esSLA
                          ? { background: "linear-gradient(135deg, #dc2626, #b91c1c)", color: "#fff", boxShadow: "0 2px 8px rgba(220,38,38,0.35)" }
                          : { background: isDark ? "rgba(255,255,255,0.08)" : T.surfaceAlt, color: T.orange, border: `1px solid rgba(244,121,32,0.3)` }
                      }>
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
