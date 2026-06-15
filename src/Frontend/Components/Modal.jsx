import { useEffect } from "react";
import { X } from "lucide-react";
import { SLATE, NEUTRAL, COLORS, RADIUS } from "../Config/DesignSystem";

const CSS = `
  @keyframes modalIn {
    from { opacity: 0; transform: scale(0.97) translateY(6px); }
    to   { opacity: 1; transform: scale(1)    translateY(0);   }
  }
  @keyframes spin { to { transform: rotate(360deg); } }
`;

/**
 * Modal — Componente base reutilizable · Design System PTP
 *
 * Props mínimas  : title + children + onClose
 * Props opcionales:
 *   T             {object}    — tokens del tema activo (LIGHT | DARK)
 *   subtitle      {string}    — línea secundaria bajo el título
 *   icon          {ReactNode} — icono junto al título
 *   onConfirm     {function}  — activa el footer; si se omite no hay footer
 *   confirmLabel  {string}    — texto botón confirmar  (default "Aceptar")
 *   cancelLabel   {string}    — texto botón cancelar   (default "Cancelar")
 *   loading       {boolean}   — spinner + deshabilita ambos botones
 *   maxWidth      {string}    — ancho máximo del contenedor (default "480px")
 *   danger        {boolean}   — botón confirmar en rojo (acciones destructivas)
 *   noBodyPadding {boolean}   — suprime padding del body (contenido con scroll propio)
 */
export default function Modal({
  title,
  subtitle,
  icon,
  children,
  onClose,
  onConfirm,
  confirmLabel  = "Aceptar",
  cancelLabel   = "Cancelar",
  loading       = false,
  maxWidth      = "480px",
  danger        = false,
  noBodyPadding = false,
  T             = null,
}) {
  const surface    = T?.surface    ?? NEUTRAL.white;
  const surfaceAlt = T?.surfaceAlt ?? NEUTRAL.slate50;
  const border     = T?.border     ?? SLATE[200];
  const textMuted  = T?.textMuted  ?? SLATE[600];
  const isDark     = T?.isDark     ?? false;

  const ORANGE    = COLORS.orange;
  const confirmBg = danger ? COLORS.danger : ORANGE;

  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape" && !loading) onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose, loading]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      onClick={(e) => { if (e.target === e.currentTarget && !loading) onClose(); }}
      style={{
        position: "fixed", inset: 0, zIndex: 50,
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "16px",
        background: isDark ? "rgba(0,0,0,0.65)" : "rgba(15,23,42,0.50)",
        backdropFilter: "blur(2px)",
        WebkitBackdropFilter: "blur(2px)",
      }}
    >
      <div style={{
        width: "100%", maxWidth,
        background: surface,
        borderRadius: RADIUS.lg,
        border: `1px solid ${border}`,
        boxShadow: isDark
          ? "0 20px 48px rgba(0,0,0,0.55), 0 4px 16px rgba(0,0,0,0.30)"
          : "0 20px 48px rgba(0,0,0,0.14), 0 4px 16px rgba(0,0,0,0.06)",
        overflow: "hidden",
        display: "flex", flexDirection: "column",
        maxHeight: "90vh",
        animation: "modalIn 0.18s cubic-bezier(0.16,1,0.3,1)",
      }}>

        {/* ── Header slate-800 ───────────────────────────────── */}
        <div style={{
          padding: "16px 24px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          borderBottom: `1px solid ${border}`,
          background: isDark ? "#0f1117" : "#1e293b",
          flexShrink: 0,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {icon && (
              <div style={{
                width: 30, height: 30, borderRadius: RADIUS.sm, flexShrink: 0,
                background: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.12)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                {icon}
              </div>
            )}
            <div>
              <p id="modal-title" style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#fff", letterSpacing: "-0.01em" }}>
                {title}
              </p>
              {subtitle && (
                <p style={{ margin: "2px 0 0", fontSize: 11, color: "rgba(255,255,255,0.45)", fontWeight: 400 }}>
                  {subtitle}
                </p>
              )}
            </div>
          </div>

          {!loading && (
            <button
              onClick={onClose}
              aria-label="Cerrar modal"
              style={{
                background: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.14)",
                borderRadius: RADIUS.sm,
                padding: "5px",
                color: "rgba(255,255,255,0.55)",
                cursor: "pointer",
                display: "flex",
                transition: "background 0.12s",
                flexShrink: 0,
              }}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.14)"; e.currentTarget.style.color = "#fff"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.08)"; e.currentTarget.style.color = "rgba(255,255,255,0.55)"; }}
            >
              <X size={14} strokeWidth={2} />
            </button>
          )}
        </div>

        {/* ── Body ───────────────────────────────────────────── */}
        <div style={
          noBodyPadding
            ? { overflowY: "auto", flex: 1, minHeight: 0 }
            : { padding: "24px", overflowY: "auto", flex: 1, minHeight: 0, display: "flex", flexDirection: "column", gap: "16px" }
        }>
          {children}
        </div>

        {/* ── Footer ─────────────────────────────────────────── */}
        {onConfirm && (
          <div style={{
            padding: "14px 24px",
            borderTop: `1px solid ${border}`,
            background: isDark ? "rgba(255,255,255,0.02)" : surfaceAlt,
            display: "flex", justifyContent: "flex-end", gap: "8px",
            flexShrink: 0,
          }}>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              style={{
                height: "36px", padding: "0 16px",
                borderRadius: RADIUS.sm,
                border: `1px solid ${border}`,
                background: "transparent",
                color: textMuted,
                fontSize: "13px", fontWeight: 500,
                cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.5 : 1,
                transition: "background 0.12s",
              }}
              onMouseEnter={e => { if (!loading) e.currentTarget.style.background = isDark ? "rgba(255,255,255,0.06)" : NEUTRAL.slate100; }}
              onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
            >
              {cancelLabel}
            </button>

            <button
              type="button"
              onClick={onConfirm}
              disabled={loading}
              style={{
                height: "36px", padding: "0 16px",
                borderRadius: RADIUS.sm,
                border: "none",
                background: confirmBg,
                color: "#fff",
                fontSize: "13px", fontWeight: 600,
                cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.75 : 1,
                display: "flex", alignItems: "center", gap: "6px",
                transition: "filter 0.15s",
              }}
              onMouseEnter={e => { if (!loading) e.currentTarget.style.filter = "brightness(0.9)"; }}
              onMouseLeave={e => { e.currentTarget.style.filter = "none"; }}
            >
              {loading ? (
                <>
                  <span style={{
                    width: "12px", height: "12px", flexShrink: 0,
                    border: "2px solid rgba(255,255,255,0.30)",
                    borderTopColor: "#fff",
                    borderRadius: "50%",
                    animation: "spin 0.7s linear infinite",
                  }} />
                  Procesando…
                </>
              ) : confirmLabel}
            </button>
          </div>
        )}
      </div>

      <style>{CSS}</style>
    </div>
  );
}
