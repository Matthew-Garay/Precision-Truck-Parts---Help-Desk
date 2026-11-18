/**
 * CalificacionEstrellas.jsx
 *
 * Calificación con estrellas de un ticket resuelto.
 *
 * Extraído de pages/Usuario/VistaTicket.jsx para facilitar su mantenimiento.
 */
import { useState, useEffect } from "react";
import { Clock, CheckCircle2, XCircle, Star } from "lucide-react";
import { apiFetch } from '../../services/api-client.js';


export function CalificacionEstrellas({ T, ticket, estatusActual }) {
  const isDark = T.isDark;
  const calInicial = Math.max(0, parseInt(ticket.calificacion, 10) || 0);
  const idTicket   = parseInt(ticket.id_ticket, 10);
  const [hover,        setHover]        = useState(0);
  const [calificacion, setCalificacion] = useState(calInicial);
  const [guardando,    setGuardando]    = useState(false);
  const [guardado,     setGuardado]     = useState(calInicial > 0);

  useEffect(() => {
    const n = Math.max(0, parseInt(ticket.calificacion, 10) || 0);
    setCalificacion(n);
    setGuardado(n > 0);
  }, [ticket.calificacion]);
  const [error,        setError]        = useState("");
  const MENSAJES = ["", "Muy malo", "Malo", "Regular", "Bueno", "Excelente"];

  const bloqueado  = estatusActual === "En proceso" || estatusActual === "No Resuelto";
  const yaGuardado = guardado && calificacion > 0;

  const guardar = async (n) => {
    if (bloqueado || yaGuardado || guardando) return;
    setError("");
    setCalificacion(n);
    setGuardando(true);
    try {
      const res = await apiFetch(`/api/tickets/${idTicket}/calificar`, {
        method: "PATCH",
        body: { calificacion: Number(n) },
      });
      const text = await res.text();
      let data = {};
      try { data = JSON.parse(text); } catch { data = {}; }
      if (res.ok && data.ok) {
        setGuardado(true);
      } else {
        setError(data.error || "No se pudo guardar");
        setCalificacion(calInicial);
      }
    } catch {
      setError("Error de conexión");
      setCalificacion(calInicial);
    } finally {
      setGuardando(false);
    }
  };

  if (estatusActual === "No Resuelto") return (
    <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-[10px] font-semibold"
      style={{ background: isDark ? "rgba(220,38,38,0.08)" : "#fef2f2", color: "#dc2626", border: "1px solid rgba(220,38,38,0.25)" }}>
      <XCircle size={12} />
      No disponible — ticket marcado como No Resuelto
    </div>
  );

  if (estatusActual === "En proceso") return (
    <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-[10px] font-semibold"
      style={{ background: isDark ? "rgba(244,121,32,0.08)" : "#fff7ed", color: "#ea580c", border: "1px solid rgba(234,88,12,0.25)" }}>
      <Clock size={12} />
      Disponible una vez resuelta la incidencia
    </div>
  );

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-center gap-1.5 py-2">
        {[1,2,3,4,5].map(n => {
          const activa = n <= (hover || calificacion);
          return (
            <button key={n}
              disabled={bloqueado || yaGuardado || guardando}
              onClick={() => guardar(n)}
              onMouseEnter={() => !yaGuardado && setHover(n)}
              onMouseLeave={() => setHover(0)}
              className="transition-all duration-150 active:scale-90"
              style={{ cursor: yaGuardado ? "default" : "pointer" }}>
              <Star size={28} fill={activa ? "#f59e0b" : "none"}
                style={{
                  color: activa ? "#f59e0b" : isDark ? "rgba(255,255,255,0.15)" : "#d1d5db",
                  filter: activa ? "drop-shadow(0 0 4px rgba(245,158,11,0.5))" : "none",
                  transform: hover === n && !yaGuardado ? "scale(1.2)" : "scale(1)",
                  transition: "all 0.15s",
                }}/>
            </button>
          );
        })}
      </div>
      <p className="text-center text-[10px] font-bold"
        style={{ color: calificacion ? "#f59e0b" : T.textFaint }}>
        {guardando ? "Guardando..." : calificacion ? MENSAJES[calificacion] : "Selecciona una calificación"}
      </p>
      {yaGuardado && (
        <div className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-semibold"
          style={{ background: isDark ? "rgba(22,163,74,0.08)" : "#f0fdf4", color: "#16a34a", border: "1px solid rgba(22,163,74,0.25)" }}>
          <CheckCircle2 size={12} /> Gracias por tu opinión
        </div>
      )}
      {error && (
        <p className="text-center text-[9px] font-semibold" style={{ color: "#dc2626" }}>{error}</p>
      )}
    </div>
  );
}
