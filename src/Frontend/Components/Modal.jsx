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
@keyframes _modal_in { from { opacity:0; transform:scale(0.96) translateY(8px) } to { opacity:1; transform:scale(1) translateY(0) } }
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
  const overlayBg   = "rgba(0,0,0,0.55)";
  const containerBg = isDark ? "#141720" : "#ffffff";
  const containerBd = isDark ? "rgba(255,255,255,0.08)" : "#e2e8f0";
  const containerSh = isDark
    ? "0 24px 60px rgba(0,0,0,0.70)"
    : "0 24px 60px rgba(0,0,0,0.18)";
  const headerBg    = isDark ? "rgba(255,255,255,0.03)" : "#f8fafc";
  const headerBd    = isDark ? "rgba(255,255,255,0.07)" : "#e2e8f0";
  const titleColor  = isDark ? "#e6edf3" : "#1e293b";
  const subtitleColor = "#94a3b8";
  const closeBg     = isDark ? "rgba(255,255,255,0.06)" : "#f1f5f9";
  const closeBd     = isDark ? "rgba(255,255,255,0.10)" : "#e2e8f0";
  const closeColor  = isDark ? "#94a3b8" : "#64748b";
  const bodyBg      = isDark ? "#141720" : "#ffffff";
  const bodyColor   = isDark ? "#e6edf3" : "#334155";
  const footerBg    = isDark ? "rgba(255,255,255,0.02)" : "#f8fafc";
  const footerBd    = isDark ? "rgba(255,255,255,0.07)" : "#e2e8f0";
  const cancelBg    = isDark ? "rgba(255,255,255,0.06)" : "#f1f5f9";
  const cancelBd    = isDark ? "rgba(255,255,255,0.10)" : "#e2e8f0";
  const cancelColor = isDark ? "#94a3b8" : "#64748b";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="_modal_title"
      className="_modal_overlay"
      style={{
        position: "fixed", inset: 0, zIndex: 1000,
        background: overlayBg,
        backdropFilter: "blur(4px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "16px",
      }}
      onClick={(e) => { if (e.target === e.currentTarget && !loading && closeOnOverlay) onClose(); }}
    >
      <div
        ref={dialogRef}
        tabIndex={-1}
        className="_modal_dialog"
        style={{
          width: "100%", maxWidth, outline: "none",
          background: containerBg,
          border: `1px solid ${containerBd}`,
          borderRadius: "14px",
          boxShadow: containerSh,
          overflow: "hidden",
          display: "flex", flexDirection: "column",
          maxHeight: "90vh",
        }}
      >
        {/* Barra de acento */}
        <div aria-hidden="true" style={{
          height: "3px", flexShrink: 0,
          background: `linear-gradient(90deg, ${accentColor}, ${accentColor}55)`,
        }} />

        {/* Header */}
        <div style={{
          padding: "14px 16px 12px",
          background: headerBg,
          borderBottom: `1px solid ${headerBd}`,
          display: "flex", alignItems: "flex-start",
          justifyContent: "space-between", gap: "10px",
          flexShrink: 0,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0, flex: 1 }}>
            {icon && (
              <div aria-hidden="true" style={{
                width: "34px", height: "34px", borderRadius: "8px", flexShrink: 0,
                display: "flex", alignItems: "center", justifyContent: "center",
                background: `${accentColor}18`,
                border: `1px solid ${accentColor}35`,
                color: accentColor,
              }}>
                {icon}
              </div>
            )}
            <div style={{ minWidth: 0 }}>
              {subtitle && (
                <p style={{
                  margin: 0, fontSize: "10px", fontWeight: 700,
                  textTransform: "uppercase", letterSpacing: "0.07em",
                  color: subtitleColor,
                }}>
                  {subtitle}
                </p>
              )}
              <p id="_modal_title" style={{
                margin: subtitle ? "2px 0 0" : 0,
                fontSize: "13px", fontWeight: 700,
                color: titleColor, lineHeight: "1.3",
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              }}>
                {title}
              </p>
            </div>
          </div>

          {!loading && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar modal"
              style={{
                width: "28px", height: "28px", borderRadius: "6px", flexShrink: 0,
                display: "flex", alignItems: "center", justifyContent: "center",
                background: closeBg,
                border: `1px solid ${closeBd}`,
                cursor: "pointer", color: closeColor,
                transition: "background 0.15s",
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = isDark ? "rgba(255,255,255,0.12)" : "#e2e8f0";
                e.currentTarget.style.color = isDark ? "#e6edf3" : "#334155";
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = closeBg;
                e.currentTarget.style.color = closeColor;
              }}
            >
              <X size={14} strokeWidth={2} />
            </button>
          )}
        </div>

        {/* Body */}
        <div
          role="region"
          aria-label="Contenido del modal"
          style={{
            padding: noBodyPadding ? 0 : "16px",
            overflowY: "auto", flex: 1,
            fontSize: "13px", lineHeight: "1.55",
            color: bodyColor,
            background: bodyBg,
          }}
        >
          {children}
        </div>

        {/* Footer */}
        {showFooter && (
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "flex-end",
            gap: "8px", padding: "12px 16px",
            borderTop: `1px solid ${footerBd}`,
            background: footerBg, flexShrink: 0,
          }}>
            {hasCancelBtn && (
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                style={{
                  height: "36px", padding: "0 16px",
                  border: `1px solid ${cancelBd}`,
                  color: cancelColor,
                  background: cancelBg,
                  borderRadius: "8px",
                  fontSize: "12px", fontWeight: 700,
                  cursor: loading ? "not-allowed" : "pointer",
                  opacity: loading ? 0.5 : 1,
                  transition: "background 0.15s",
                  whiteSpace: "nowrap",
                }}
                onMouseEnter={e => { if (!loading) e.currentTarget.style.background = isDark ? "rgba(255,255,255,0.10)" : "#e2e8f0"; }}
                onMouseLeave={e => { e.currentTarget.style.background = cancelBg; }}
              >
                {cancelLabel}
              </button>
            )}
            {hasConfirmBtn && (
              <button
                type="button"
                onClick={onConfirm}
                disabled={loading}
                aria-label={loading ? "Procesando" : confirmLabel}
                style={{
                  height: "36px", padding: "0 18px",
                  borderRadius: "8px", border: "none",
                  background: accentColor,
                  color: "#ffffff",
                  fontSize: "12px", fontWeight: 700,
                  cursor: loading ? "not-allowed" : "pointer",
                  opacity: loading ? 0.55 : 1,
                  display: "inline-flex", alignItems: "center", gap: "6px",
                  whiteSpace: "nowrap",
                  transition: "filter 0.15s",
                }}
                onMouseEnter={e => { if (!loading) e.currentTarget.style.filter = "brightness(1.08)"; }}
                onMouseLeave={e => { e.currentTarget.style.filter = "none"; }}
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
