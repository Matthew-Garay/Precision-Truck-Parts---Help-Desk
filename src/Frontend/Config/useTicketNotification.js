/**
 * useTicketNotification.js
 * Hook que orquesta:
 *  - Conexión Socket.io (via useSocket)
 *  - Reproducción de sonido (via NotificationService)
 *  - Toast visual (via useToast de Feedback.jsx)
 *  - Historial de notificaciones para CampanaNotificaciones (persistido en localStorage)
 *  - Verificación de existencia del ticket antes de mostrar
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
]);

// Eventos exclusivos de usuario (id_rol !== 1)
const EVENTOS_USUARIO = new Set([
  "ticket:actualizado",
  "ticket:en_atencion",
  "solicitud:actualizada",
  "ticket:confirmado",
]);

// Eventos que requieren verificar si el ticket aun existe en BD
const EVENTOS_CON_TICKET_ID = new Set([
  "ticket:actualizado",
  "ticket:en_atencion",
  "ticket:calificado",
  "ticket:sla_warning",
  "ticket:confirmado",
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
      "ticket:actualizado", "ticket:en_atencion", "solicitud:actualizada", "ticket:confirmado",
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

  const [notificaciones, setNotificaciones] = useState(
    () => cargarDelStorage(idEmpleado)
  );

  // Cuando cambia el usuario (login diferente), recargar sus notificaciones
  useEffect(() => {
    setNotificaciones(cargarDelStorage(idEmpleado));
  }, [idEmpleado]);

  // Ref para deduplicación — no necesita ser estado
  const procesandoRef = useRef(new Set());

  // procesarEvento es estable (sin dependencias que cambien) gracias a los refs
  const procesarEvento = useCallback(async ({ tipo, data }) => {
    const esAdmin = esAdminRef.current;
    // Filtrar eventos por rol: admin no recibe eventos de usuario y viceversa
    if (esAdmin  && EVENTOS_USUARIO.has(tipo)) return;
    if (!esAdmin && EVENTOS_ADMIN.has(tipo))   return;

    const entityId =
      data?.id_ticket ?? data?.id_solicitud ??
      data?.folio_ticket ?? data?.folio_solicitud;
    if (!entityId) return;

    const dedupeKey = `${tipo}_${entityId}_${data?.estatus ?? ""}`;
    if (procesandoRef.current.has(dedupeKey)) return;
    procesandoRef.current.add(dedupeKey);
    setTimeout(() => procesandoRef.current.delete(dedupeKey), 3000);

    // Verificar existencia del ticket
    if (EVENTOS_CON_TICKET_ID.has(tipo) && data?.id_ticket) {
      const existe = await verifyTicketExists(data.id_ticket);
      if (!existe) return;
    }

    const notif = buildNotification(tipo, data);
    if (!notif) return;

    playNotificationSound(tipo);

    const duracion =
      tipo === "ticket:sla_warning" || tipo === "tickets:vencidos" ? 0 : 5000;
    toastRef.current[notif.toastTipo](notif.mensaje, {
      title: notif.titulo,
      duration: duracion,
    });

    setNotificaciones((prev) => {
      const nueva = { id: `${dedupeKey}_${Date.now()}`, tipo, data, ts: Date.now() };
      const actualizado = [nueva, ...prev].slice(0, MAX_NOTIFICACIONES);
      // Guardar con el idEmpleado actual (leído via closure seguro)
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
