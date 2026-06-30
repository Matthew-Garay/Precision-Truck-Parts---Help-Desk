/**
 * useSocket.js
 *
 * Hook de React que establece y gestiona la conexion de Socket.io con el servidor.
 * Envia el JWT en el handshake para que el servidor autentique al empleado y lo
 * una automaticamente a su sala personal y a la sala "admins" si corresponde.
 *
 * Parametros:
 *   id_empleado  - id del empleado autenticado. Si es null/undefined no conecta.
 *   onEvento     - callback que recibe { tipo, data } por cada evento Socket.io.
 *                  Se mantiene actualizado via ref para evitar recrear la conexion
 *                  cuando cambia el callback.
 *
 * Eventos escuchados del lado del usuario:
 *   ticket:actualizado    - el estatus del ticket cambio
 *   ticket:en_atencion    - un tecnico tomo el ticket
 *   solicitud:actualizada - el estatus de una solicitud cambio
 *   ticket:confirmado     - el ticket fue registrado correctamente
 *
 * Eventos escuchados del lado del administrador:
 *   ticket:nuevo          - un usuario creo un nuevo ticket
 *   solicitud:nueva       - un usuario creo una nueva solicitud de insumos
 *   ticket:calificado     - un usuario califico un ticket resuelto
 *   tickets:vencidos      - el worker cerro tickets por vencimiento de SLA
 *   ticket:sla_warning    - un ticket esta proximo a superar las 48 horas
 *   insumo:stock_critico  - un insumo bajo del umbral de stock minimo
 *   ticket:sin_atender    - un ticket lleva mas de 24 horas sin tecnico asignado
 *
 * La conexion se cierra automaticamente cuando el componente se desmonta.
 * La URL del servidor se deriva de VITE_API_URL o de window.location.origin
 * reemplazando el puerto 5173 de Vite por el 3001 del servidor en desarrollo.
 */
import { useEffect, useRef } from "react";
import { io } from "socket.io-client";
import { getToken } from "./api";
export function useSocket(id_empleado, onEvento) {
  const socketRef = useRef(null);
  const cbRef     = useRef(onEvento);
  cbRef.current   = onEvento;

  const tokenRef = useRef(getToken());

  useEffect(() => {
    if (!id_empleado) return;

    const token = getToken();
    if (!token) return;
    tokenRef.current = token;

    const SOCKET_URL = import.meta.env.VITE_API_URL || window.location.origin.replace(":5173", ":3001");

    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    const socket = io(SOCKET_URL, {
      auth: { token },
      transports: ["websocket", "polling"],
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
    });
    socketRef.current = socket;

    socket.on("connect_error", (err) => {
      console.warn("[Socket] Error de conexion:", err.message);
    });

    // Eventos que escucha el usuario
    socket.on("ticket:actualizado",   d => cbRef.current?.({ tipo: "ticket:actualizado",   data: d }));
    socket.on("ticket:en_atencion",   d => cbRef.current?.({ tipo: "ticket:en_atencion",   data: d }));
    socket.on("solicitud:actualizada",d => cbRef.current?.({ tipo: "solicitud:actualizada", data: d }));
    socket.on("ticket:confirmado",    d => cbRef.current?.({ tipo: "ticket:confirmado",    data: d }));
    socket.on("ticket:cancelado",     d => cbRef.current?.({ tipo: "ticket:cancelado",     data: d }));

    // Eventos que escucha el admin
    socket.on("ticket:nuevo",         d => cbRef.current?.({ tipo: "ticket:nuevo",         data: d }));
    socket.on("solicitud:nueva",      d => cbRef.current?.({ tipo: "solicitud:nueva",      data: d }));
    socket.on("ticket:calificado",    d => cbRef.current?.({ tipo: "ticket:calificado",    data: d }));
    socket.on("tickets:vencidos",     d => cbRef.current?.({ tipo: "tickets:vencidos",     data: d }));
    socket.on("ticket:sla_warning",   d => cbRef.current?.({ tipo: "ticket:sla_warning",   data: d }));
    socket.on("insumo:stock_critico", d => cbRef.current?.({ tipo: "insumo:stock_critico", data: d }));
    socket.on("ticket:sin_atender",   d => cbRef.current?.({ tipo: "ticket:sin_atender",   data: d }));

    return () => { socket.disconnect(); socketRef.current = null; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id_empleado, tokenRef.current]);

  return socketRef;
}
