/**
 * NotificationService.js
 *
 * Servicio centralizado de notificaciones en tiempo real.
 * Es consumido por useTicketNotification.js y no debe usarse directamente
 * desde los componentes de pagina.
 *
 * Responsabilidades:
 *
 * 1. Sonido (Web Audio API)
 *    playNotificationSound(tipo) genera tonos programaticamente usando
 *    osciladores del AudioContext del navegador. Cada tipo de evento tiene
 *    su propia configuracion de notas, frecuencias, duracion y forma de onda.
 *    No depende de archivos de audio externos.
 *    El AudioContext se desbloquea en el primer gesto del usuario (click o
 *    keydown) para cumplir con la politica de autoplay de los navegadores.
 *
 * 2. Configuracion visual (NOTIFICATION_DISPLAY)
 *    Mapa que asocia cada tipo de evento Socket.io con su titulo, mensaje
 *    y tipo de toast (info, success, warning, error). Los mensajes son
 *    funciones que reciben el payload del evento y retornan el texto final.
 *
 * 3. Verificacion de existencia (verifyTicketExists)
 *    Antes de mostrar una notificacion de ticket, verifica que el ticket
 *    aun existe en la base de datos consultando el endpoint del ticket.
 *    Evita notificaciones fantasma por eventos de Socket.io desincronizados.
 *
 * 4. Construccion de notificacion (buildNotification)
 *    Toma el tipo de evento y el payload, aplica las funciones de titulo
 *    y mensaje del mapa NOTIFICATION_DISPLAY y retorna el objeto final
 *    { toastTipo, titulo, mensaje } listo para mostrar.
 */
import { apiFetch, API_ROUTES } from "./api.js";

// ── AudioContext compartido ────────────────────────────────────
// Se reutiliza la misma instancia para no saturar el límite del navegador.
let _audioCtx = null;

function getAudioCtx() {
  if (!_audioCtx)
    _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if (_audioCtx.state === "suspended") _audioCtx.resume();
  return _audioCtx;
}

// Desbloquear AudioContext en el primer gesto del usuario
if (typeof window !== "undefined") {
  const unlock = () => {
    getAudioCtx();
    document.removeEventListener("click", unlock);
    document.removeEventListener("keydown", unlock);
  };
  document.addEventListener("click", unlock);
  document.addEventListener("keydown", unlock);
}

// ── Configuración de sonido por tipo de evento ─────────────────
const SOUND_CONFIG = {
  "ticket:nuevo": {
    // Dos tonos ascendentes — indica "llegó algo nuevo"
    notas: [
      { freq: 520, inicio: 0,    dur: 0.10 },
      { freq: 700, inicio: 0.12, dur: 0.10 },
    ],
    vol: 0.09,
    tipo: "sine",
  },
  "solicitud:nueva": {
    notas: [
      { freq: 440, inicio: 0,    dur: 0.10 },
      { freq: 580, inicio: 0.12, dur: 0.10 },
    ],
    vol: 0.08,
    tipo: "sine",
  },
  "ticket:en_atencion": {
    // Tono medio único — confirmación tranquila
    notas: [{ freq: 560, inicio: 0, dur: 0.15 }],
    vol: 0.07,
    tipo: "sine",
  },
  "ticket:actualizado": {
    // Dos tonos: interrogación → resolución
    notas: [
      { freq: 660, inicio: 0,    dur: 0.10 },
      { freq: 880, inicio: 0.13, dur: 0.12 },
    ],
    vol: 0.08,
    tipo: "sine",
  },
  "ticket:calificado": {
    notas: [
      { freq: 700, inicio: 0,    dur: 0.08 },
      { freq: 900, inicio: 0.10, dur: 0.08 },
      { freq: 1100, inicio: 0.20, dur: 0.10 },
    ],
    vol: 0.07,
    tipo: "triangle",
  },
  "ticket:sla_warning": {
    // Tres pulsos descendentes — urgencia sin ser agresivo
    notas: [
      { freq: 400, inicio: 0,    dur: 0.15 },
      { freq: 320, inicio: 0.20, dur: 0.15 },
      { freq: 260, inicio: 0.40, dur: 0.18 },
    ],
    vol: 0.11,
    tipo: "sawtooth",
  },
  "tickets:vencidos": {
    notas: [
      { freq: 300, inicio: 0,    dur: 0.18 },
      { freq: 220, inicio: 0.22, dur: 0.20 },
    ],
    vol: 0.11,
    tipo: "sawtooth",
  },
  "ticket:confirmado": {
    notas: [
      { freq: 600, inicio: 0,    dur: 0.08 },
      { freq: 800, inicio: 0.10, dur: 0.10 },
    ],
    vol: 0.07,
    tipo: "sine",
  },
  "insumo:stock_critico": {
    notas: [
      { freq: 380, inicio: 0,    dur: 0.14 },
      { freq: 300, inicio: 0.18, dur: 0.14 },
      { freq: 380, inicio: 0.36, dur: 0.14 },
    ],
    vol: 0.10,
    tipo: "sawtooth",
  },
  "ticket:sin_atender": {
    notas: [
      { freq: 440, inicio: 0,    dur: 0.12 },
      { freq: 440, inicio: 0.20, dur: 0.12 },
    ],
    vol: 0.08,
    tipo: "triangle",
  },
  default: {
    notas: [{ freq: 520, inicio: 0, dur: 0.12 }],
    vol: 0.07,
    tipo: "sine",
  },
};

/**
 * playNotificationSound(tipo)
 * Reproduce un sonido sutil via Web Audio API.
 * Maneja la promesa de resume() para evitar errores en Chrome/Safari.
 * No usa archivos externos — funciona sin assets adicionales.
 *
 * @param {string} tipo — clave del evento Socket.io
 */
export function playNotificationSound(tipo) {
  try {
    const ctx = getAudioCtx();
    const cfg = SOUND_CONFIG[tipo] ?? SOUND_CONFIG.default;

    cfg.notas.forEach(({ freq, inicio, dur }) => {
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.type = cfg.tipo;
      osc.frequency.setValueAtTime(freq, ctx.currentTime + inicio);
      gain.gain.setValueAtTime(cfg.vol, ctx.currentTime + inicio);
      gain.gain.exponentialRampToValueAtTime(
        0.001,
        ctx.currentTime + inicio + dur + 0.04
      );
      osc.start(ctx.currentTime + inicio);
      osc.stop(ctx.currentTime + inicio + dur + 0.05);
      // Cleanup automático al terminar
      osc.onended = () => {
        osc.disconnect();
        gain.disconnect();
      };
    });
  } catch {
    // Navegador sin soporte o política de autoplay bloqueada
  }
}

// ── Mapa de configuración visual por tipo de evento ───────────
// Cada entrada define: título, mensaje, tipo de toast y si tiene acción
export const NOTIFICATION_DISPLAY = {
  "ticket:nuevo": {
    toastTipo: "info",
    titulo: () => "Nuevo ticket recibido",
    mensaje: (d) =>
      `${d.nombre_empleado || "Usuario"} · ${d.departamento || "Sin área"} — "${d.titulo}"`,
  },
  "solicitud:nueva": {
    toastTipo: "info",
    titulo: () => "Nueva solicitud de insumo",
    mensaje: (d) =>
      `${d.nombre_empleado || "Usuario"} — ${d.total_insumos} insumo${d.total_insumos !== 1 ? "s" : ""} · Prioridad: ${d.prioridad}`,
  },
  "ticket:en_atencion": {
    toastTipo: "info",
    titulo: () => "Tu ticket esta siendo atendido",
    mensaje: (d) =>
      `#${d.folio_ticket} — Técnico: ${d.nombre_tecnico || "Soporte técnico"}`,
  },
  "ticket:actualizado": {
    toastTipo: (d) => (d.estatus === "Resuelto" ? "success" : "warning"),
    titulo: (d) =>
      d.estatus === "Resuelto"
        ? "Tu ticket fue resuelto"
        : `Ticket marcado como "${d.estatus}"`,
    mensaje: (d) => {
      const tecnico = d.resuelto_por || d.nombre_tecnico;
      return `#${d.folio_ticket} — ${d.titulo}${tecnico ? ` · Por: ${tecnico}` : ""}`;
    },
  },
  "ticket:calificado": {
    toastTipo: "success",
    titulo: () => "Ticket calificado",
    mensaje: (d) =>
      `${d.nombre_empleado} calificó #${d.folio_ticket} con ${"★".repeat(d.calificacion)}`,
  },
  "ticket:sla_warning": {
    toastTipo: "warning",
    titulo: () => "⚠ Advertencia de SLA",
    mensaje: (d) =>
      `#${d.folio_ticket} — Tiempo restante: ${d.tiempo_restante} · Prioridad: ${d.prioridad}`,
  },
  "tickets:vencidos": {
    toastTipo: "error",
    titulo: () => "Tickets cerrados por vencimiento",
    mensaje: (d) =>
      `${d.total} ticket${d.total !== 1 ? "s" : ""} marcado${d.total !== 1 ? "s" : ""} como "No Resuelto" (SLA 48h superado)`,
  },
  "solicitud:actualizada": {
    toastTipo: (d) =>
      d.estatus === "Resuelto"
        ? "success"
        : d.estatus === "No Resuelto"
        ? "error"
        : "info",
    titulo: (d) => `Solicitud de insumo: ${d.estatus}`,
    mensaje: (d) => `#${d.folio_solicitud}`,
  },
  "ticket:confirmado": {
    toastTipo: "success",
    titulo: () => "Reporte recibido",
    mensaje: (d) => `Tu ticket #${d.folio_ticket} fue registrado. Prioridad: ${d.prioridad}`,
  },
  "insumo:stock_critico": {
    toastTipo: "warning",
    titulo: () => "Stock critico de insumo",
    mensaje: (d) => d.stock === 0
      ? `"${d.nombre}" esta AGOTADO (0 unidades)`
      : `"${d.nombre}" tiene solo ${d.stock} unidad${d.stock !== 1 ? "es" : ""} restante${d.stock !== 1 ? "s" : ""}`,
  },
  "ticket:sin_atender": {
    toastTipo: "warning",
    titulo: () => "Ticket sin atender",
    mensaje: (d) => `#${d.folio_ticket} lleva ${d.horas}h sin tecnico asignado - Prioridad: ${d.prioridad}`,
  },
};

/**
 * verifyTicketExists(id_ticket)
 * Verifica que el ticket exista en la base de datos antes de mostrar
 * la notificación. Evita notificaciones fantasma por eventos desincronizados.
 *
 * @param {number} id_ticket
 * @returns {Promise<boolean>}
 */
export async function verifyTicketExists(id_ticket) {
  if (!id_ticket || isNaN(Number(id_ticket))) return false;
  try {
    // Usar el endpoint del ticket directamente, no el de imágenes
    // TICKET(id) devuelve 404 real si no existe; imágenes siempre retorna 200+[]
    const res = await apiFetch(API_ROUTES.TICKET(id_ticket));
    if (res.status === 404) return false;
    return true;
  } catch {
    return true;
  }
}

/**
 * buildNotification(tipo, data)
 * Construye el objeto de notificación con título, mensaje y timestamp.
 *
 * @param {string} tipo
 * @param {object} data — payload del evento Socket.io
 * @returns {{ titulo: string, mensaje: string, toastTipo: string }}
 */
export function buildNotification(tipo, data) {
  const cfg = NOTIFICATION_DISPLAY[tipo];
  if (!cfg) return null;

  const toastTipo =
    typeof cfg.toastTipo === "function" ? cfg.toastTipo(data) : cfg.toastTipo;
  const titulo =
    typeof cfg.titulo === "function" ? cfg.titulo(data) : cfg.titulo;
  const mensaje =
    typeof cfg.mensaje === "function" ? cfg.mensaje(data) : cfg.mensaje;

  return { toastTipo, titulo, mensaje };
}
