/**
 * MobileDrawer.jsx — Design System PTP
 *
 * Navegación principal en menú deslizable (off-canvas / drawer) para móvil.
 * Se abre desde el encabezado fijo (sticky header) mediante un botón de menú.
 *
 * Props:
 *   isOpen    — boolean, controla visibilidad
 *   onClose   — () => void
 *   items     — array de { label, icon (ReactNode), onClick, active?: boolean }
 *   brand     — ReactNode (logo) opcional
 *   userName  — string opcional, se muestra en el footer del drawer
 *   T         — tokens del tema (opcional)
 */
import { useEffect } from "react";
import { X, Menu } from "lucide-react";

export default function MobileDrawer({
  isOpen = false,
  onClose,
  items = [],
  brand,
  userName,
  T,
}) {
  // Bloquea scroll del body cuando el drawer está abierto
  useEffect(() => {
    if (!isOpen) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  return (
    <>
      {/* Overlay */}
      <div
        className={`mobile-drawer-overlay${isOpen ? " open" : ""}`}
        onClick={onClose}
        role="none"
      />
      {/* Drawer */}
      <div
        className={`mobile-drawer${isOpen ? " open" : ""}`}
        role="navigation"
        aria-label="Menú principal"
      >
        <div className="mobile-drawer__header">
          {brand ? (
            <button
              type="button"
              onClick={onClose}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: 0,
                display: "flex",
                alignItems: "center",
              }}
            >
              {brand}
            </button>
          ) : null}
          <button
            type="button"
            className="mobile-drawer__close"
            onClick={onClose}
            aria-label="Cerrar menú"
          >
            <X size={20} strokeWidth={2.5} />
          </button>
        </div>

        <nav className="mobile-drawer__nav">
          {items.map((item, i) => (
            <button
              key={i}
              className={`mobile-drawer__item${item.active ? " is-active" : ""}`}
              onClick={() => {
                item.onClick?.();
                onClose();
              }}
              aria-pressed={item.active === true}
            >
              {item.icon ? (
                <span style={{ flexShrink: 0 }}>{item.icon}</span>
              ) : null}
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        {userName && (
          <div
            style={{
              padding: "14px 16px",
              borderTop: "1px solid rgba(255,255,255,0.08)",
              fontSize: "0.85rem",
              color: "rgba(255,255,255,0.7)",
              fontWeight: 500,
            }}
          >
            {userName}
          </div>
        )}
      </div>
    </>
  );
}
