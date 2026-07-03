/**
 * useTabLeader.js
 *
 * Permite múltiples pestañas con la misma cuenta.
 * Bloquea solo si se detecta una cuenta DISTINTA activa en otra pestaña.
 *
 * Retorna: { isLeader: true, conflicto: false } siempre que la cuenta sea la misma.
 * Retorna: { isLeader: false, conflicto: true } si hay otra cuenta diferente abierta.
 */
import { useState, useEffect } from "react";
import { getUsuario } from "./session.js";

const CHANNEL = "ptp_tab_channel";

export function useTabLeader() {
  const [conflicto, setConflicto] = useState(false);

  useEffect(() => {
    const channel = new BroadcastChannel(CHANNEL);

    // Anunciar qué usuario está activo en esta pestaña
    const usuario = getUsuario();
    if (usuario?.id_empleado) {
      channel.postMessage({ type: "tab_activa", id: usuario.id_empleado });
    }

    channel.onmessage = (e) => {
      if (e.data?.type !== "tab_activa") return;
      const yo = getUsuario();
      if (yo?.id_empleado && e.data.id !== yo.id_empleado) {
        setConflicto(true);
      }
    };

    return () => channel.close();
  }, []);

  return { isLeader: true, conflicto };
}
