/**
 * Modal.jsx — Componente base reutilizable · Design System PTP
 *
 * Props mínimas  : title + children + onClose
 * Props opcionales:
 *   isOpen        — controla visibilidad (default true para backward-compat)
 *   T             — tokens del tema activo
 *   subtitle      — línea secundaria bajo el título
 *   icon          — ReactNode junto al título
 *   onConfirm     — activa el footer; si se omite no hay footer
 *   confirmLabel  — texto botón confirmar  (default "Aceptar")
 *   cancelLabel   — texto botón cancelar   (default "Cancelar")
 *   loading       — spinner + deshabilita ambos botones
 *   maxWidth      — ancho máximo del contenedor (default "480px")
 *   danger        — botón confirmar en rojo (acciones destructivas)
 *   noBodyPadding — suprime padding del body
 *
 * Funcionalidad accesible:
 *   - Cierra con Escape
 *   - Cierra al hacer click en el overlay
 *   - Bloquea scroll del body mientras está abierto
 *   - Trap de foco: Tab/Shift+Tab circula dentro del modal
 *   - Focus inicial en el contenedor al montar
 */
import { useEffect, useRef } from "react";
import { X } from "lucide-react";

export default function Modal({
  isOpen        = true,
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
  const dialogRef = useRef(null);

  /* Bloquear scroll del body mientras el modal está abierto */
  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [isOpen]);

  /* Cerrar con Escape */
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => { if (e.key === "Escape" && !loading) onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isOpen, onClose, loading]);

  /* Focus inicial */
  useEffect(() => {
    if (isOpen) dialogRef.current?.focus();
  }, [isOpen]);

  /* Trap de foco: mantiene Tab/Shift+Tab dentro del modal */
  useEffect(() => {
    if (!isOpen) return;
    const el = dialogRef.current;
    if (!el) return;
    const focusable = 'button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';
    const trap = (e) => {
      if (e.key !== "Tab") return;
      const nodes = [...el.querySelectorAll(focusable)];
      if (!nodes.length) return;
      const first = nodes[0];
      const last  = nodes[nodes.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault(); last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault(); first.focus();
      }
    };
    document.addEventListener("keydown", trap);
    return () => document.removeEventListener("keydown", trap);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="ptp-modal-title"
      className="ptp-modal-overlay"
      onClick={(e) => { if (e.target === e.currentTarget && !loading) onClose(); }}
    >
      <div
        ref={dialogRef}
        tabIndex={-1}
        className="ptp-modal-container"
        style={{ maxWidth }}
      >
        {/* ── Accent bar ──────────────────────────────────── */}
        <div className="ptp-modal-accent-bar" aria-hidden="true" />

        {/* ── Header ──────────────────────────────────────── */}
        <div role="banner" className="ptp-modal-header">
          <div className="ptp-modal-header-left">
            {icon && (
              <div aria-hidden="true" className="ptp-modal-icon">
                {icon}
              </div>
            )}
            <div style={{ minWidth: 0 }}>
              <p id="ptp-modal-title" className="ptp-modal-title">{title}</p>
              {subtitle && (
                <p className="ptp-modal-subtitle">{subtitle}</p>
              )}
            </div>
          </div>

          {!loading && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar modal"
              className="ptp-modal-close-btn"
            >
              <X size={14} strokeWidth={2} />
            </button>
          )}
        </div>

        {/* ── Body ────────────────────────────────────────── */}
        <div
          role="region"
          aria-label="Contenido del modal"
          className={noBodyPadding ? "ptp-modal-body ptp-modal-body--no-pad" : "ptp-modal-body"}
        >
          {children}
        </div>

        {/* ── Footer ──────────────────────────────────────── */}
        {onConfirm && (
          <div role="contentinfo" className="ptp-modal-footer">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="btn-ghost ptp-modal-btn-cancel"
            >
              {cancelLabel}
            </button>

            <button
              type="button"
              onClick={onConfirm}
              disabled={loading}
              aria-label={loading ? "Procesando" : confirmLabel}
              className={`ptp-modal-btn-confirm${danger ? " ptp-modal-btn-confirm--danger" : ""}`}
            >
              {loading ? (
                <>
                  <span aria-hidden="true" className="ptp-spinner" />
                  Procesando…
                </>
              ) : confirmLabel}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
