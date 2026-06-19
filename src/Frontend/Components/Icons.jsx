/**
 * Icons.jsx
 *
 * Iconos SVG personalizados del sistema HelpDesk que no estan disponibles
 * en la libreria lucide-react o que requieren un diseno especifico.
 *
 * EyeIcon
 *   Icono de ojo abierto para mostrar contrasena en el campo de login.
 *   Renderiza el clasico ojo con iris circular.
 *
 * EyeOffIcon
 *   Icono de ojo tachado para ocultar contrasena en el campo de login.
 *   Renderiza el ojo con una linea diagonal que lo atraviesa.
 *
 * Ambos iconos usan currentColor para heredar el color del padre
 * y tienen dimensiones de 16x16 (h-4 w-4 de Tailwind).
 */
// ================================================================
//  ICONS - Precision Truck Parts HelpDesk
//  Uso: import { EyeIcon, EyeOffIcon, GoogleIcon, LogoIcon } from '../Components/Icons'
// ================================================================

export const EyeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
);

export const EyeOffIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.477 0-8.268-2.943-9.542-7a9.97 9.97 0 012.163-3.592M6.53 6.533A9.956 9.956 0 0112 5c4.477 0 8.268 2.943 9.542 7a10.025 10.025 0 01-4.132 5.411M3 3l18 18" />
  </svg>
);

