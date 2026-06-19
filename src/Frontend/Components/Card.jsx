/**
 * Card.jsx
 *
 * Componente base de tarjeta del sistema de diseno de Precision Truck Parts.
 * Todo panel, widget, tabla o formulario del sistema debe usar este componente
 * o el hook useCardStyles(T) para mantener consistencia visual en toda la app.
 *
 * Variantes:
 *   "default"  - sombra ligera para uso general
 *   "elevated" - sombra media para metricas y secciones destacadas
 *   "flat"     - sin sombra para items anidados dentro de otras cards
 *
 * Sub-componentes:
 *   Card.Header - franja superior con fondo surfaceAlt, borde inferior y slots
 *                 para acento de color, icono, titulo y acciones a la derecha
 *   Card.Body   - cuerpo de la card con padding configurable (default 24px)
 *   Card.Footer - franja inferior con fondo surfaceAlt, borde superior
 *                 y alineacion de botones a la derecha
 *
 * Hook useCardStyles(T, variant)
 *   Retorna { card, hdr, ftr } como objetos de estilo inline.
 *   Usar cuando el JSX de Card no sea posible, por ejemplo en componentes
 *   que ya tienen un div externo propio.
 *
 * Props de Card:
 *   T         - tokens del tema activo (obligatorio)
 *   variant   - variante de sombra: "default" | "elevated" | "flat"
 *   style     - estilos adicionales para el contenedor
 *   className - clases CSS adicionales
 *   children  - contenido de la card
 */

// ── Tokens de sombra por variante ────────────────────────────
const SHADOWS = {
  default: {
    light: "0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)",
    dark:  "0 1px 4px rgba(0,0,0,0.30)",
  },
  elevated: {
    light: "0 4px 12px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.04)",
    dark:  "0 4px 20px rgba(0,0,0,0.40)",
  },
  flat: { light: "none", dark: "none" },
};

// ── Hook: estilos inline equivalentes al componente ──────────
export function useCardStyles(T, variant = "default") {
  const mode = T.isDark ? "dark" : "light";

  const card = {
    background:   T.isDark ? "#141720" : T.surface,
    border:       `1px solid ${T.isDark ? "rgba(255,255,255,0.08)" : T.border}`,
    borderRadius: "12px",
    boxShadow:    (SHADOWS[variant] ?? SHADOWS.default)[mode],
    overflow:     "hidden",
  };

  const hdr = {
    background:   T.isDark ? "rgba(255,255,255,0.03)" : T.surfaceAlt,
    borderBottom: `1px solid ${T.isDark ? "rgba(255,255,255,0.07)" : T.border}`,
  };

  const ftr = {
    background: T.isDark ? "rgba(255,255,255,0.03)" : T.surfaceAlt,
    borderTop:  `1px solid ${T.isDark ? "rgba(255,255,255,0.07)" : T.border}`,
  };

  return { card, hdr, ftr };
}

// ── Card raíz ────────────────────────────────────────────────
export default function Card({
  T,
  variant   = "default",
  style     = {},
  className = "",
  children,
}) {
  const { card } = useCardStyles(T, variant);
  return (
    <div style={{ ...card, ...style }} className={className}>
      {children}
    </div>
  );
}

// ── Card.Header ──────────────────────────────────────────────
Card.Header = function CardHeader({
  T,
  title,
  icon,
  accent,
  actions,
  style   = {},
  children,
}) {
  const { hdr } = useCardStyles(T);

  return (
    <div style={{
      ...hdr,
      padding:        "10px 16px",
      display:        "flex",
      alignItems:     "center",
      justifyContent: "space-between",
      gap:            "10px",
      ...style,
    }}>
      {/* Izquierda: acento · icono · título */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px", minWidth: 0 }}>
        {accent && (
          <span style={{
            display: "block", width: "3px", height: "14px",
            borderRadius: "99px", flexShrink: 0, background: accent,
          }} />
        )}
        {icon && (
          <span style={{
            color: T.isDark ? "rgba(255,255,255,0.4)" : T.textMuted,
            flexShrink: 0, display: "flex",
          }}>
            {icon}
          </span>
        )}
        {title && (
          <p style={{
            margin: 0, fontSize: "10px", fontWeight: 800,
            textTransform: "uppercase", letterSpacing: "0.1em",
            color: T.isDark ? "rgba(255,255,255,0.45)" : T.textMuted,
            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
          }}>
            {title}
          </p>
        )}
        {children}
      </div>

      {/* Derecha: acciones opcionales */}
      {actions && (
        <div style={{ display: "flex", alignItems: "center", gap: "6px", flexShrink: 0 }}>
          {actions}
        </div>
      )}
    </div>
  );
};

// ── Card.Body ────────────────────────────────────────────────
// padding por defecto: 24px = p-6 (estándar del sistema)
Card.Body = function CardBody({ padding = "24px", style = {}, className = "", children }) {
  return (
    <div style={{ padding, ...style }} className={className}>
      {children}
    </div>
  );
};

// ── Card.Footer ──────────────────────────────────────────────
Card.Footer = function CardFooter({ T, style = {}, children }) {
  const { ftr } = useCardStyles(T);
  return (
    <div style={{
      ...ftr,
      padding:        "10px 16px",
      display:        "flex",
      alignItems:     "center",
      justifyContent: "flex-end",
      gap:            "8px",
      ...style,
    }}>
      {children}
    </div>
  );
};
