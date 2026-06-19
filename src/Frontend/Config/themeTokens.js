/**
 * themeTokens.js
 *
 * Define los tokens de color para los dos temas de la aplicacion: claro y oscuro.
 * Es un archivo JS puro sin JSX para no interferir con el Fast Refresh de Vite.
 *
 * Cada objeto de tema contiene:
 *   isDark       - bandera booleana para que los componentes puedan hacer logica condicional
 *   orange       - naranja corporativo de Precision Truck Parts (#F47920)
 *   orangeDark   - naranja oscuro para hover y estados activos
 *   orangeMuted  - naranja transparente para fondos y focus rings
 *   navy         - azul marino muy oscuro para la sidebar y elementos de estructura
 *   bg           - color de fondo de la pagina completa
 *   surface      - color de fondo de tarjetas y contenedores
 *   surfaceAlt   - variante alternativa de surface para filas alternas y headers de tabla
 *   surfaceHover - color al hacer hover sobre un elemento interactivo
 *   border       - color de borde de separadores y contenedores
 *   borderFocus  - color de borde cuando un input tiene el foco
 *   text         - color de texto principal
 *   textMuted    - color de texto secundario (subtitulos, metadatos)
 *   textFaint    - color de texto muy tenue (placeholders, info muy secundaria)
 *   sidebar      - color de fondo de la barra lateral
 *   sidebarText  - color del texto de los items de la sidebar sin seleccionar
 *   sidebarHover - color de fondo al hacer hover sobre un item de la sidebar
 *   shadowSm/Md/Lg - sombras de diferente intensidad para tarjetas y modales
 *   radius/radiusSm/radiusLg - radios de borde para bordes redondeados
 *
 * Uso:
 *   import { useTheme } from "./themeContext.js";
 *   const { T } = useTheme();
 *   <div style={{ background: T.surface, color: T.text }}>
 */
// Tokens de color — archivo .js puro (sin JSX) para no romper Fast Refresh

export const LIGHT = {
  isDark:       false,
  orange:       "#F47920",
  orangeDark:   "#D4610A",
  orangeMuted:  "rgba(244,121,32,0.12)",
  navy:         "#0F172A",
  navyDark:     "#020617",
  bg:           "#F8FAFC",
  surface:      "#FFFFFF",
  surfaceAlt:   "#F1F5F9",
  surfaceHover: "#E2E8F0",
  border:       "#E2E8F0",
  borderFocus:  "#F47920",
  text:         "#334155",
  textMuted:    "#475569",
  textFaint:    "#94A3B8",
  sidebar:      "#000000",
  sidebarText:  "rgba(255,255,255,0.55)",
  sidebarHover: "rgba(255,255,255,0.08)",
  shadowSm:     "0 1px 3px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.03)",
  shadowMd:     "0 4px 16px rgba(0,0,0,0.08)",
  shadowLg:     "0 8px 32px rgba(0,0,0,0.12)",
  radius:       "6px",
  radiusSm:     "4px",
  radiusLg:     "6px",
};

export const DARK = {
  isDark:       true,
  orange:       "#F47920",
  orangeDark:   "#D4610A",
  orangeMuted:  "rgba(244,121,32,0.14)",
  navy:         "#0F172A",
  navyDark:     "#020617",
  bg:           "#0D1117",
  surface:      "#161B22",
  surfaceAlt:   "#1C2230",
  surfaceHover: "#21283A",
  border:       "rgba(255,255,255,0.08)",
  borderFocus:  "#F47920",
  text:         "#E6EDF3",
  textMuted:    "#8B949E",
  textFaint:    "#484F58",
  sidebar:      "#000000",
  sidebarText:  "rgba(255,255,255,0.35)",
  sidebarHover: "rgba(255,255,255,0.06)",
  shadowSm:     "0 1px 4px rgba(0,0,0,0.30)",
  shadowMd:     "0 4px 20px rgba(0,0,0,0.40)",
  shadowLg:     "0 8px 32px rgba(0,0,0,0.55)",
  radius:       "6px",
  radiusSm:     "4px",
  radiusLg:     "6px",
};
