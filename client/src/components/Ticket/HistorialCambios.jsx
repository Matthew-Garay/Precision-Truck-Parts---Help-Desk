/**
 * HistorialCambios.jsx
 *
 * Línea de tiempo con el historial de cambios de un ticket.
 *
 * Extraído de pages/Usuario/VistaTicket.jsx para facilitar su mantenimiento.
 */
import { useState, useEffect } from "react";
import { apiFetch } from '../../services/api-client.js';
import { fechaHora } from '../../utils/fechas.js';

export function HistorialCambios({ T, id_ticket }) {
  const isDark = T.isDark;
  const [items,    setItems]    = useState([]);
  const [cargando, setCargando] = useState(true);
  const [abierto,  setAbierto]  = useState(false);

  useEffect(() => {
    if (!abierto) return;
    setCargando(true);
    apiFetch(`/api/tickets/${id_ticket}/historial`)
      .then(r => r.json())
      .then(d => setItems(Array.isArray(d) ? d : []))
      .catch(() => setItems([]))
      .finally(() => setCargando(false));
  }, [id_ticket, abierto]);

  const fmt = (iso) => fechaHora(iso);

  const CAMPO_LABEL = { estatus: "Estatus", comentarios: "Comentarios" };

  const card = {
    background: isDark ? "#141720" : T.surface,
    border: `1px solid ${T.border}`,
    boxShadow: isDark ? "0 8px 32px rgba(0,0,0,0.45)" : "0 2px 8px rgba(0,0,0,0.06)",
    borderRadius: "16px",
  };
  const hdr = {
    background: T.surfaceAlt,
    borderBottom: `1px solid ${T.border}`,
  };

  return (
    <div style={card}>
      <button
        onClick={() => setAbierto(o => !o)}
        className="w-full px-6 py-4 flex items-center justify-between"
        style={{ ...hdr, borderRadius: abierto ? "16px 16px 0 0" : "16px", cursor: "pointer", background: "transparent" }}>
        <div className="flex items-center gap-2.5">
          <div className="w-1 h-4 rounded-full flex-shrink-0" style={{ background: "#8b5cf6" }} />
          <p className="text-[9px] font-semibold uppercase tracking-[0.12em]"
            style={{ color: T.textFaint }}>Historial de cambios</p>
        </div>
        <div className="flex items-center gap-2">
          {items.length > 0 && (
            <span className="text-[9px] font-semibold px-2 py-0.5 rounded-full"
              style={{ background: isDark ? "rgba(139,92,246,0.15)" : "#f5f3ff", color: "#8b5cf6", border: "1px solid rgba(139,92,246,0.25)" }}>
              {items.length}
            </span>
          )}
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={T.textFaint} strokeWidth="2.5"
            style={{ transform: abierto ? "rotate(180deg)" : "none", transition: "transform .2s" }}>
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      </button>

      {abierto && (
        <div className="px-6 py-4 flex flex-col gap-3">
          {cargando ? (
            <div className="flex justify-center py-4">
              <svg className="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none"
                stroke="#8b5cf6" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
            </div>
          ) : items.length === 0 ? (
            <p className="text-[11px] text-center py-4" style={{ color: T.textFaint }}>Sin cambios registrados</p>
          ) : (
            <div className="flex flex-col gap-2">
              {items.map((item) => (
                <div key={item.id_historial} className="flex gap-3 items-start">
                  <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ background: "#8b5cf6" }} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[9px] font-black uppercase tracking-wider"
                        style={{ color: "#8b5cf6" }}>
                        {CAMPO_LABEL[item.campo_cambiado] ?? item.campo_cambiado}
                      </span>
                      <span className="text-[9px]" style={{ color: T.textFaint }}>{fmt(item.fecha_cambio)}</span>
                      <span className="text-[9px] font-medium" style={{ color: T.textMuted }}>por {item.nombre_empleado}</span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                      {item.valor_anterior && (
                        <span className="text-[10px] px-2 py-0.5 rounded-md line-through"
                          style={{ background: isDark ? "rgba(220,38,38,0.1)" : "#fef2f2", color: "#dc2626" }}>
                          {item.valor_anterior}
                        </span>
                      )}
                      {item.valor_anterior && item.valor_nuevo && (
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={T.textFaint} strokeWidth="2">
                          <path d="M5 12h14M12 5l7 7-7 7" />
                        </svg>
                      )}
                      {item.valor_nuevo && (
                        <span className="text-[10px] px-2 py-0.5 rounded-md font-semibold"
                          style={{ background: isDark ? "rgba(22,163,74,0.1)" : "#f0fdf4", color: "#16a34a" }}>
                          {item.campo_cambiado === "comentarios"
                            ? (item.valor_nuevo.length > 60 ? item.valor_nuevo.slice(0, 60) + "…" : item.valor_nuevo)
                            : item.valor_nuevo}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
