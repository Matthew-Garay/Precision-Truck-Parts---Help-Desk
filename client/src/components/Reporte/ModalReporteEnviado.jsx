/**
 * ModalReporteEnviado.jsx — Ventana de confirmación al enviar un reporte (folio y "¿Qué sigue?").
 * Separado de pages/Usuario/NuevoReporte.jsx.
 */
import { useEffect } from "react";
import { X, FileDown, CheckCircle2 } from "lucide-react";
import { FS } from '../../utils/tipografia.js';
import LogoModal from '../LogoModal.jsx';
import { fechaCorta } from '../../utils/fechas.js';

export const PRIORIDADES = [
  { label:"Urgente", nivel:"Urgente", color:"#dc2626", bgL:"#fee2e2", bgD:"#2d0a0a" },
  { label:"Alta",    nivel:"Alta",    color:"#ea580c", bgL:"#ffedd5", bgD:"#2d1200" },
  { label:"Media",   nivel:"Media",   color:"#ca8a04", bgL:"#fef9c3", bgD:"#1f1a00" },
  { label:"Baja",    nivel:"Baja",    color:"#16a34a", bgL:"#dcfce7", bgD:"#0a2d14" },
];

export function ModalReporteEnviado({ T, modal, onVerTicket, onSuccess, onClose }) {
  const isDark    = T?.isDark ?? false;
  const surface    = isDark ? "#161B22" : "#ffffff";
  const surfaceAlt = isDark ? "#1a2030" : "#f8fafc";
  const border     = isDark ? "rgba(255,255,255,0.07)" : "#e8ecf0";
  const textMain   = T?.text      ?? (isDark ? "#e2e8f0" : "#1a202c");
  const textMuted  = T?.textMuted ?? (isDark ? "#8b949e" : "#64748b");
  const textFaint  = T?.textFaint ?? (isDark ? "rgba(255,255,255,0.25)" : "#a0aec0");
  const ORANGE = "#F47920";

  useEffect(() => {
    const fn = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", fn);
    return () => document.removeEventListener("keydown", fn);
  }, [onClose]);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  const prioColor = PRIORIDADES.find(p => p.nivel === modal.prioridad)?.color;

  const rows = [
    { label: "Folio",     value: `#${modal.folio}`,                                  color: ORANGE },
    { label: "Prioridad", value: modal.prioridad,                                     color: prioColor },
    { label: "Estado",    value: "En Proceso",                                        color: "#ca8a04" },
    { label: "Categoría", value: modal.categoria,                                     color: null },
    { label: "Fecha",     value: fechaCorta(new Date()), color: null },
  ];

  const handleConfirm = () => {
    onClose();
    if (modal.id_ticket && onVerTicket) onVerTicket(modal.id_ticket);
    else onSuccess?.();
  };

  return (
    <div
      role="presentation"
      style={{
        position: "fixed", inset: 0, zIndex: 1000,
        background: isDark ? "rgba(0,0,0,0.55)" : "rgba(15,23,42,0.40)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "16px",
        animation: "dmFade 0.15s ease",
      }}
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        role="dialog"
        aria-modal="true"
        style={{
          width: "95%", maxWidth: "460px",
          background: surface,
          border: `1px solid ${border}`,
          borderRadius: "10px",
          display: "flex", flexDirection: "column",
          maxHeight: "90vh", overflow: "hidden",
          boxShadow: isDark
            ? "0 16px 40px rgba(0,0,0,0.50), 0 1px 0 rgba(255,255,255,0.04) inset"
            : "0 16px 40px rgba(15,23,42,0.12), 0 1px 3px rgba(15,23,42,0.06)",
          animation: "dmSlide 0.18s ease",
        }}
      >
        <div style={{ height: "2px", flexShrink: 0, background: "#16a34a", borderRadius: "10px 10px 0 0" }} />

        {/* Header */}
        <div style={{
          padding: "14px 18px 12px",
          background: surface,
          borderBottom: `1px solid ${border}`,
          display: "flex", alignItems: "flex-start", justifyContent: "space-between",
          gap: "12px", flexShrink: 0,
        }}>
          <div style={{ minWidth: 0, flex: 1 }}>
            <p style={{ margin: 0, fontSize: FS.secundario, fontWeight: 700, textTransform: "uppercase",
              letterSpacing: "0.09em", color: "#16a34a" }}>
              Incidencias
            </p>
            <h2 style={{ margin: "3px 0 0", fontSize: FS.subtitulo, fontWeight: 700, color: textMain,
              letterSpacing: "-0.02em", lineHeight: 1.2 }}>
              Reporte enviado
            </h2>
            <p style={{ margin: "4px 0 0", fontSize: FS.cuerpo, color: textMuted, fontWeight: 400 }}>
              Tu ticket fue registrado correctamente
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexShrink: 0, paddingTop: "2px" }}>
            <LogoModal />
            <button
              onClick={onClose}
              aria-label="Cerrar"
              style={{
                width: "26px", height: "26px",
                display: "flex", alignItems: "center", justifyContent: "center",
                background: "transparent",
                border: `1px solid ${border}`,
                borderRadius: "6px", cursor: "pointer",
                color: textFaint, transition: "all 0.12s",
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = textMuted; e.currentTarget.style.color = textMain; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = border;    e.currentTarget.style.color = textFaint; }}
            >
              <X size={12} strokeWidth={2} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "16px 18px" }}>
          {/* Ícono de éxito */}
          <div style={{ display: "flex", justifyContent: "center", marginBottom: "16px" }}>
            <div style={{
              width: "48px", height: "48px", borderRadius: "50%",
              background: "rgba(22,163,74,0.10)", border: "1px solid rgba(22,163,74,0.25)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <CheckCircle2 size={24} style={{ color: "#16a34a" }} />
            </div>
          </div>

          {/* Filas de detalle */}
          {rows.map(({ label, value, color }) => (
            <div key={label} style={{
              display: "grid", gridTemplateColumns: "108px 1fr",
              alignItems: "center", gap: "10px",
              padding: "8px 0",
              borderBottom: `1px solid ${isDark ? "rgba(255,255,255,0.05)" : "#f1f5f9"}`,
            }}>
              <span style={{ fontSize: FS.secundario, fontWeight: 600, textTransform: "uppercase",
                letterSpacing: "0.06em", color: isDark ? "rgba(255,255,255,0.30)" : "#a0aec0" }}>
                {label}
              </span>
              <span style={{ fontSize: FS.enfasis, fontWeight: 600, color: color || textMain }}>
                {value}
              </span>
            </div>
          ))}

          {/* Qué sigue: para que el usuario sepa qué esperar después de enviar */}
          <div style={{
            marginTop: "14px", padding: "10px 12px", borderRadius: "8px",
            background: isDark ? "rgba(59,130,246,0.08)" : "#eff6ff",
            border: `1px solid ${isDark ? "rgba(59,130,246,0.25)" : "#bfdbfe"}`,
          }}>
            <p style={{ margin: "0 0 4px", fontSize: FS.secundario, fontWeight: 700, color: isDark ? "#93c5fd" : "#1d4ed8" }}>¿Qué sigue?</p>
            <p style={{ margin: 0, fontSize: FS.secundario, lineHeight: 1.55, color: textMuted }}>
              Soporte Técnico ya recibió tu reporte. Te llegará una notificación cuando un técnico lo tome y cuando quede resuelto.
              Puedes ver su avance en <b>Historial de Incidencias</b>. Guarda tu folio por si necesitas preguntar por él.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: "10px 18px",
          borderTop: `1px solid ${border}`,
          background: surfaceAlt,
          display: "flex", justifyContent: "flex-end", gap: "8px",
          flexShrink: 0,
        }}>
          <button
            onClick={onClose}
            style={{
              padding: "6px 16px", borderRadius: "6px",
              fontSize: FS.cuerpo, fontWeight: 600,
              background: "transparent",
              border: `1px solid ${border}`,
              color: textMuted, cursor: "pointer", transition: "all 0.12s",
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = textMuted; e.currentTarget.style.color = textMain; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = border;    e.currentTarget.style.color = textMuted; }}
          >
            Cerrar
          </button>
          {onVerTicket && (
            <button
              onClick={handleConfirm}
              style={{
                padding: "6px 16px", borderRadius: "6px",
                fontSize: FS.cuerpo, fontWeight: 700,
                background: "#16a34a", color: "#fff",
                border: "none", cursor: "pointer",
                display: "flex", alignItems: "center", gap: "6px",
                transition: "filter 0.12s",
              }}
              onMouseEnter={e => { e.currentTarget.style.filter = "brightness(1.08)"; }}
              onMouseLeave={e => { e.currentTarget.style.filter = "none"; }}
            >
              <FileDown size={12} strokeWidth={2.5} />
              Ver mi ticket
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
