import { useEffect, useRef } from "react";
import { io } from "socket.io-client";
import { getToken } from "./api";

/**
 * Hook Socket.io - conecta al servidor enviando el JWT para autenticacion.
 * El servidor valida el token y une al empleado a su sala automaticamente.
 */
export function useSocket(id_empleado, onEvento) {
  const socketRef = useRef(null);
  const cbRef     = useRef(onEvento);
  cbRef.current   = onEvento;

  useEffect(() => {
    if (!id_empleado) return;

    const token = getToken();
    if (!token) return;

    const SOCKET_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";
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

    // Eventos que escucha el admin
    socket.on("ticket:nuevo",      d => cbRef.current?.({ tipo: "ticket:nuevo",      data: d }));
    socket.on("solicitud:nueva",   d => cbRef.current?.({ tipo: "solicitud:nueva",   data: d }));
    socket.on("ticket:calificado", d => cbRef.current?.({ tipo: "ticket:calificado", data: d }));
    socket.on("tickets:vencidos",  d => cbRef.current?.({ tipo: "tickets:vencidos",  data: d }));
    socket.on("ticket:sla_warning",d => cbRef.current?.({ tipo: "ticket:sla_warning",data: d }));

    return () => { socket.disconnect(); };
  }, [id_empleado]);

  return socketRef;
}
