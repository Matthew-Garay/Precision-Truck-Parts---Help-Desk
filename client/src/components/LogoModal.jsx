/**
 * LogoModal.jsx
 *
 * Logo pequeño de Precision Truck Parts para el encabezado de TODOS los
 * modales del sistema. Elige solo la versión negra (tema claro) o blanca
 * (tema oscuro) a partir de ThemeContext, así que no hace falta pasarle el
 * tema. En encabezados con fondo oscuro fijo (p. ej. el visor de manuales)
 * se fuerza la versión blanca con `claro`.
 *
 * Props:
 *   alto   altura en px (por defecto 20)
 *   claro  true = logo blanco siempre (para fondos oscuros)
 *   style  estilos extra opcionales
 *
 * @module client/components/LogoModal
 * @requires ../context/theme-context.js
 * @exports LogoModal (default)
 */
import { useTheme } from "../context/theme-context.js";

export default function LogoModal({ alto = 20, claro, style }) {
  const tema = useTheme();
  const oscuro = claro ?? Boolean(tema?.T?.isDark ?? tema?.isDark);
  return (
    <img
      src={oscuro ? "/assets/img/logo blanco.png" : "/assets/img/logo negro.png"}
      alt="Precision Truck Parts"
      draggable={false}
      style={{ height: alto, width: "auto", objectFit: "contain", flexShrink: 0,
               opacity: oscuro ? 0.85 : 0.75, userSelect: "none", ...style }}
    />
  );
}
