/**
 * useTicketNotification.js
 *
 * Hook principal que orquesta el sistema completo de notificaciones en tiempo real.
 * Combina Socket.io, sonido, toasts visuales e historial persistente.
 *
 * Responsabilidades:
 *
 * 1. Filtra eventos por rol:
 *    Los admins solo reciben eventos de EVENTOS_ADMIN (ticket nuevo, solicitud nueva, etc.)
 *    Los usuarios solo reciben eventos de EVENTOS_USUARIO (ticket actualizado, confirmado, etc.)
 *
 * 2. Deduplicacion:
 *    Usa un Set en ref (procesandoRef) para ignorar el mismo evento que llegue
 *    dos veces en menos de 3 segundos. La clave de deduplicacion combina
 *    tipo + id de entidad + estatus.
 *
 * 3. Verificacion de existencia:
 *    Para los eventos que llevan id_ticket, verifica que el ticket exista
 *    en la base de datos antes de mostrar la notificacion.
 *
 * 4. Historial persistente:
 *    Las notificaciones se guardan en localStorage bajo la clave
 *    ptp_notif_{id_empleado} para que sobrevivan recargas de pagina.
 *    Se conservan las ultimas MAX_NOTIFICACIONES (30) notificaciones.
 *    Al cambiar de usuario se cargan las notificaciones del nuevo usuario.
 *
 * 5. Toast y sonido:
 *    Usa buildNotification() para construir el mensaje y playNotificationSound()
 *    para el audio. Las alertas de SLA y vencimientos tienen duracion infinita
 *    (el admin debe cerrarlas manualmente).
 *
 * Parametros:
 *   usuario    - objeto del usuario autenticado con id_empleado e id_rol
 *   onNavegar  - callback opcional que recibe (tipo, data) cuando el usuario
 *                hace clic en una notificacion del historial para navegar
 *                a la pantalla relevante
 *
 * Retorna:
 *   notificaciones - arreglo de notificaciones del historial
 *   onDismiss      - elimina una notificacion del historial por id
 *   onDismissAll   - elimina todas las notificaciones del historial
 *   onClickNotif   - marca como leida y llama a onNavegar
 */
import { useState, useCallback, useRef, useEffect } from "react";
import { useSocket } from "./useSocket.js";
import { useToast } from "../Components/Feedback.jsx";
import {
  playNotificationSound,
  verifyTicketExists,
  buildNotification,
} from "./NotificationService.js";

// Eventos exclusivos de admin (id_rol === 1)
const EVENTOS_ADMIN = new Set([
  "ticket:nuevo",
  "solicitud:nueva",
  "ticket:calificado",
  "tickets:vencidos",
  "ticket:sla_warning",
  "insumo:stock_critico",
  "ticket:sin_atender",
  "ticket:en_atencion",  // admin también recibe para actualizar vista en tiempo real
]);

// Eventos exclusivos de usuario (id_rol !== 1)
const EVENTOS_USUARIO = new Set([
  "ticket:actualizado",
  "ticket:en_atencion",
  "solicitud:actualizada",
  "ticket:confirmado",
  "ticket:cancelado",
]);

// Eventos que requieren verificar si el ticket aun existe en BD
const EVENTOS_CON_TICKET_ID = new Set([
  "ticket:actualizado",
  "ticket:en_atencion",
  "ticket:calificado",
  "ticket:sla_warning",
  "ticket:confirmado",
  "ticket:cancelado",
  "ticket:sin_atender",
]);

const MAX_NOTIFICACIONES = 30;

function storageKey(id_empleado) {
  return `ptp_notif_${id_empleado ?? "0"}`;
}

function cargarDelStorage(id_empleado) {
  try {
    const raw = localStorage.getItem(storageKey(id_empleado));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    // Filtrar notificaciones con tipo desconocido o datos corruptos
    const TIPOS_VALIDOS = new Set([
      "ticket:nuevo", "solicitud:nueva", "ticket:calificado", "tickets:vencidos",
      "ticket:sla_warning", "insumo:stock_critico", "ticket:sin_atender",
      "ticket:actualizado", "ticket:en_atencion", "solicitud:actualizada",
      "ticket:confirmado", "ticket:cancelado",
    ]);
    return parsed.filter(n => n?.tipo && n?.data && TIPOS_VALIDOS.has(n.tipo));
  } catch { return []; }
}

function guardarEnStorage(id_empleado, notifs) {
  try {
    localStorage.setItem(storageKey(id_empleado), JSON.stringify(notifs));
  } catch {}
}

export function useTicketNotification({ usuario, onNavegar }) {
  const toast    = useToast();
  const toastRef = useRef(toast);
  toastRef.current = toast;

  const idEmpleado = usuario?.id_empleado;
  const esAdmin    = Number(usuario?.id_rol) === 1;
  const esAdminRef = useRef(esAdmin);
  esAdminRef.current = esAdmin;

  const [notificaciones, setNotificaciones] = useState([]);

  // Cargar notificaciones cuando se conoce el id del empleado
  useEffect(() => {
    if (!idEmpleado) return;
    setNotificaciones(cargarDelStorage(idEmpleado));
  }, [idEmpleado]);

  // Ref para deduplicación — no necesita ser estado
  const procesandoRef = useRef(new Set());

  // procesarEvento es estable (sin dependencias que cambien) gracias a los refs
  const procesarEvento = useCallback(async ({ tipo, data }) => {
    const esAdmin = esAdminRef.current;
    if (esAdmin  && EVENTOS_USUARIO.has(tipo) && !EVENTOS_ADMIN.has(tipo)) return;
    if (!esAdmin && EVENTOS_ADMIN.has(tipo)   && !EVENTOS_USUARIO.has(tipo)) return;

    // entityId solo se usa para deduplicación — no bloquea eventos sin id
    const entityId =
      data?.id_ticket ?? data?.id_solicitud ??
      data?.folio_ticket ?? data?.folio_solicitud ??
      tipo; // fallback: usar el tipo como clave para eventos sin entidad (tickets:vencidos, insumo:stock_critico)

    const dedupeKey = `${tipo}_${entityId}_${data?.estatus ?? ""}`;
    if (procesandoRef.current.has(dedupeKey)) return;
    procesandoRef.current.add(dedupeKey);
    setTimeout(() => procesandoRef.current.delete(dedupeKey), 3000);

    // Verificar existencia del ticket — excepto ticket:confirmado (recién creado, puede no estar aún)
    if (EVENTOS_CON_TICKET_ID.has(tipo) && data?.id_ticket && tipo !== "ticket:confirmado") {
      const existe = await verifyTicketExists(data.id_ticket);
      if (!existe) return;
    }

    // Marcar el dato con _esAdmin para que CampanaNotificaciones y buildNotification ajusten el título
    const dataConRol = esAdmin ? { ...data, _esAdmin: true } : data;

    const notif = buildNotification(tipo, dataConRol);
    if (!notif) return;

    playNotificationSound(tipo);

    const duracion = 0;
    toastRef.current[notif.toastTipo](notif.mensaje, {
      title: notif.titulo,
      duration: duracion,
    });

    setNotificaciones((prev) => {
      const nueva = { id: `${dedupeKey}_${Date.now()}`, tipo, data: dataConRol, ts: Date.now() };
      const actualizado = [nueva, ...prev].slice(0, MAX_NOTIFICACIONES);
      guardarEnStorage(idEmpleado, actualizado);
      return actualizado;
    });
  }, [idEmpleado]);

  useSocket(idEmpleado, procesarEvento);

  const onDismiss = useCallback((id) => {
    setNotificaciones((prev) => {
      const actualizado = prev.filter((n) => n.id !== id);
      guardarEnStorage(idEmpleado, actualizado);
      return actualizado;
    });
  }, [idEmpleado]);

  const onDismissAll = useCallback(() => {
    guardarEnStorage(idEmpleado, []);
    setNotificaciones([]);
  }, [idEmpleado]);

  const onClickNotif = useCallback((n) => {
    onDismiss(n.id);
    onNavegar?.(n.tipo, n.data);
  }, [onDismiss, onNavegar]);

  return { notificaciones, onDismiss, onDismissAll, onClickNotif };
}
