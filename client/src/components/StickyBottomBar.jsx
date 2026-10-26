/**
 * StickyBottomBar.jsx — Design System PTP
 *
 * Barra de acción principal fija en la parte inferior de la pantalla en móvil.
 * Permite acceso rápido con el pulgar a la acción primaria de la vista.
 * Oculta automáticamente en escritorio (≥768px) mediante CSS.
 *
 * Props:
 *   children  — ReactNode (normalmente un <button mobile-bottom-bar__btn>)
 *   show      — boolean; si false, la barra permanece oculta
 */
export default function StickyBottomBar({ children, show = true }) {
  return (
    <div
      className={`mobile-bottom-bar${show ? " show" : ""}`}
      role="region"
      aria-label="Acciones rápidas"
    >
      {children}
    </div>
  );
}
