/**
 * Modal.jsx — Componente base · Design System PTP
 *
 * Props:
 *   title          — texto del header (requerido)
 *   subtitle       — línea secundaria bajo el título
 *   icon           — ReactNode junto al título
 *   children       — contenido del body
 *   onClose        — función de cierre (requerida)
 *   isOpen         — controla visibilidad (default true)
 *   onConfirm      — activa botón de acción principal
 *   confirmLabel   — texto botón confirmar  (default "Aceptar")
 *   cancelLabel    — texto botón cancelar   (default "Cancelar"; null = ocultar)
 *   loading        — spinner + deshabilita botones
 *   maxWidth       — ancho máximo (default "480px")
 *   danger         — alias de variant="danger"
 *   variant        — "default"|"danger"|"success"|"warning"|"info"
 *   noBodyPadding  — suprime padding del body
 *   closeOnOverlay — click en overlay cierra (default true)
 *   T              — tokens del tema (opcional)
 */
import { useEffect, useRef } from "react";
import { X } from "lucide-react";

const ACCENT_COLORS = {
  default: "#F47920",
  danger:  "#DC2626",
  success: "#16A34A",
  warning: "#D97706",
  info:    "#2563EB",
};

const CSS = `
@keyframes _modal_overlay_in { from { opacity:0 } to { opacity:1 } }
@keyframes _modal_in { from { opacity:0; transform:translateY(-5px) } to { opacity:1; transform:translateY(0) } }
@keyframes _modal_spin { to { transform:rotate(360deg) } }
._modal_overlay { animation: _modal_overlay_in 0.15s ease forwards }
._modal_dialog  { animation: _modal_in 0.18s ease forwards }
._modal_spinner { animation: _modal_spin 0.65s linear infinite }
`;
if (typeof document !== "undefined" && !document.getElementById("__modal_css")) {
  const s = document.createElement("style");
  s.id = "__modal_css";
  s.textContent = CSS;
  document.head.appendChild(s);
}

export default function Modal({
  isOpen         = true,
  title,
  subtitle,
  icon,
  children,
  onClose,
  onConfirm,
  confirmLabel   = "Aceptar",
  cancelLabel    = "Cancelar",
  loading        = false,
  maxWidth       = "480px",
  danger         = false,
  variant        = "default",
  noBodyPadding  = false,
  closeOnOverlay = true,
  T              = null,
}) {
  const dialogRef = useRef(null);
  const isDark = T?.isDark ?? false;
  const resolvedVariant = danger ? "danger" : variant;
  const accentColor = ACCENT_COLORS[resolvedVariant] ?? ACCENT_COLORS.default;

  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => { if (e.key === "Escape" && !loading) onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isOpen, onClose, loading]);

  useEffect(() => {
    if (isOpen) setTimeout(() => dialogRef.current?.focus(), 10);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const el = dialogRef.current;
    if (!el) return;
    const sel = 'button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';
    const trap = (e) => {
      if (e.key !== "Tab") return;
      const nodes = [...el.querySelectorAll(sel)];
      if (!nodes.length) return;
      const first = nodes[0], last = nodes[nodes.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", trap);
    return () => document.removeEventListener("keydown", trap);
  }, [isOpen]);

  if (!isOpen) return null;

  const hasCancelBtn  = cancelLabel !== null;
  const hasConfirmBtn = !!onConfirm;
  const showFooter    = hasConfirmBtn || hasCancelBtn;

  // ── Tokens de color ──────────────────────────────────────────
  const surface    = isDark ? "#161B22" : "#ffffff";
  const surfaceAlt = isDark ? "#1a2030" : "#f8fafc";
  const border     = isDark ? "rgba(255,255,255,0.07)" : "#e8ecf0";
  const textMain   = T?.text     ?? (isDark ? "#e2e8f0" : "#1a202c");
  const textMuted  = T?.textMuted ?? (isDark ? "#8b949e" : "#64748b");
  const textFaint  = T?.textFaint ?? (isDark ? "rgba(255,255,255,0.30)" : "#a0aec0");
  const bodyColor  = T?.text     ?? (isDark ? "#e6edf3" : "#334155");
  const overlayBg  = isDark ? "rgba(0,0,0,0.55)" : "rgba(15,23,42,0.40)";

  return (
    <div
      role="presentation"
      className="_modal_overlay"
      style={{
        position: "fixed", inset: 0, zIndex: 1000,
        background: overlayBg,
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "16px",
      }}
      onMouseDown={(e) => { if (e.target === e.currentTarget && !loading && closeOnOverlay) onClose(); }}
    >
      <div
        ref={dialogRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="_modal_title"
        className="_modal_dialog"
        style={{
          width: "95%", maxWidth, outline: "none",
          background: surface,
          border: `1px solid ${border}`,
          borderRadius: "10px",
          boxShadow: isDark
            ? "0 16px 40px rgba(0,0,0,0.50), 0 1px 0 rgba(255,255,255,0.04) inset"
            : "0 16px 40px rgba(15,23,42,0.12), 0 1px 3px rgba(15,23,42,0.06)",
          overflow: "hidden",
          display: "flex", flexDirection: "column",
          maxHeight: "90vh",
        }}
      >
        {/* Banda acento */}
        <div aria-hidden="true" style={{
          height: "2px", flexShrink: 0,
          background: accentColor,
          borderRadius: "10px 10px 0 0",
        }} />

        {/* Header */}
        <div style={{
          padding: "14px 18px 12px",
          borderBottom: `1px solid ${border}`,
          display: "flex", alignItems: "flex-start",
          justifyContent: "space-between", gap: "12px",
          flexShrink: 0,
        }}>
          <div style={{ minWidth: 0, flex: 1 }}>
            {subtitle && (
              <p style={{ margin: 0, fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.09em", color: accentColor }}>
                {subtitle}
              </p>
            )}
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: subtitle ? "3px" : 0 }}>
              {icon && (
                <div aria-hidden="true" style={{
                  width: "28px", height: "28px", borderRadius: "6px", flexShrink: 0,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  background: `${accentColor}18`, border: `1px solid ${accentColor}35`,
                  color: accentColor,
                }}>
                  {icon}
                </div>
              )}
              <p id="_modal_title" style={{
                margin: 0, fontSize: "16px", fontWeight: 700,
                color: textMain, lineHeight: "1.2",
                letterSpacing: "-0.02em",
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              }}>
                {title}
              </p>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexShrink: 0, paddingTop: "2px" }}>
            <img
              src={isDark ? "/assets/img/logo blanco.png" : "/assets/img/logo negro.png"}
              alt="Precision Trucks"
              style={{ height: "28px", width: "auto", objectFit: "contain", opacity: isDark ? 0.80 : 0.70 }}
            />
            {!loading && (
              <button
                type="button"
                onClick={onClose}
                aria-label="Cerrar modal"
                style={{
                  width: "26px", height: "26px", borderRadius: "6px", flexShrink: 0,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  background: "transparent",
                  border: `1px solid ${border}`,
                  cursor: "pointer", color: textFaint,
                  transition: "all 0.12s",
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = textMuted; e.currentTarget.style.color = textMain; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = border; e.currentTarget.style.color = textFaint; }}
              >
                <X size={12} strokeWidth={2} />
              </button>
            )}
          </div>
        </div>

        {/* Body */}
        <div
          style={{
            padding: noBodyPadding ? 0 : "16px 18px",
            overflowY: "auto", flex: 1,
            fontSize: "13px", lineHeight: "1.55",
            color: bodyColor,
          }}
        >
          {children}
        </div>

        {/* Footer */}
        {showFooter && (
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "flex-end",
            gap: "8px", padding: "10px 18px",
            borderTop: `1px solid ${border}`,
            background: surfaceAlt, flexShrink: 0,
          }}>
            {hasCancelBtn && (
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                style={{
                  padding: "6px 16px",
                  border: `1px solid ${border}`,
                  color: textMuted,
                  background: "transparent",
                  borderRadius: "6px",
                  fontSize: "12px", fontWeight: 600,
                  cursor: loading ? "not-allowed" : "pointer",
                  opacity: loading ? 0.5 : 1,
                  transition: "all 0.12s",
                  whiteSpace: "nowrap",
                }}
                onMouseEnter={e => { if (!loading) { e.currentTarget.style.borderColor = textMuted; e.currentTarget.style.color = textMain; } }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = border; e.currentTarget.style.color = textMuted; }}
              >
                {cancelLabel}
              </button>
            )}
            {hasConfirmBtn && (
              <button
                type="button"
                onClick={onConfirm}
                disabled={loading}
                style={{
                  padding: "6px 18px",
                  borderRadius: "6px", border: "none",
                  background: loading ? `${accentColor}99` : accentColor,
                  color: "#ffffff",
                  fontSize: "12px", fontWeight: 700,
                  cursor: loading ? "not-allowed" : "pointer",
                  display: "inline-flex", alignItems: "center", gap: "6px",
                  whiteSpace: "nowrap",
                  transition: "opacity 0.12s",
                }}
                onMouseEnter={e => { if (!loading) e.currentTarget.style.opacity = "0.88"; }}
                onMouseLeave={e => { e.currentTarget.style.opacity = "1"; }}
              >
                {loading ? (
                  <>
                    <span
                      className="_modal_spinner"
                      aria-hidden="true"
                      style={{
                        display: "inline-block",
                        width: "13px", height: "13px",
                        border: "2px solid rgba(255,255,255,0.30)",
                        borderTopColor: "#ffffff",
                        borderRadius: "50%", flexShrink: 0,
                      }}
                    />
                    Procesando…
                  </>
                ) : confirmLabel}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
