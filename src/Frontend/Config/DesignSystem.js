// ================================================================
//  DESIGN SYSTEM - Precision Truck Parts HelpDesk
//  Estilo: Industrial-Modern · Enterprise · Funcional
//  Paleta: #FF6600 primario + grises neutros #F9FAFB → #1F2937
//  Espaciado: múltiplos de 4px
//  Tipografía: Inter / Geist sans-serif
// ================================================================

// -- COLORES --------------------------------------------------
export const COLORS = {
  // Marca - solo para CTAs y acciones críticas
  orange:      "#F47920",
  orangeDark:  "#d96a10",
  orangeLight: "#fff7ed",
  orangeMuted: "rgba(244,121,32,0.10)",

  // Escala de grises neutros (base del sistema)
  gray50:  "#F9FAFB",
  gray100: "#F3F4F6",
  gray200: "#E5E7EB",
  gray300: "#D1D5DB",
  gray400: "#9CA3AF",
  gray500: "#6B7280",
  gray600: "#4B5563",
  gray700: "#374151",
  gray800: "#1F2937",
  gray900: "#111827",

  // Semánticos
  success:     "#16a34a",
  successBg:   "#F0FDF4",
  successBorder:"#BBF7D0",
  danger:      "#DC2626",
  dangerBg:    "#FEF2F2",
  dangerBorder:"#FECACA",
  warning:     "#D97706",
  warningBg:   "#FFFBEB",
  warningBorder:"#FDE68A",
  info:        "#2563EB",
  infoBg:      "#EFF6FF",
  infoBorder:  "#BFDBFE",

  // Alias semánticos
  dark:        "#1F2937",
  white:       "#FFFFFF",
  label:       "#6B7280",
  textMuted:   "#9CA3AF",
  textFaint:   "#D1D5DB",

  // Legados (compatibilidad)
  silverBg:    "#F9FAFB",
  silverLight: "#E5E7EB",
  silver:      "#9CA3AF",
  whiteCard:   "#FFFFFF",
};

// -- ESPACIADO (múltiplos de 4px) -----------------------------
export const SPACE = {
  1:  "4px",
  2:  "8px",
  3:  "12px",
  4:  "16px",
  5:  "20px",
  6:  "24px",
  8:  "32px",
  10: "40px",
  12: "48px",
  16: "64px",
};

// -- TIPOGRAFÍA -----------------------------------------------
export const FONT = {
  // Escala tipográfica
  h1:    { fontSize: "24px", fontWeight: 800, letterSpacing: "-0.02em", lineHeight: "1.2" },
  h2:    { fontSize: "18px", fontWeight: 700, letterSpacing: "-0.01em", lineHeight: "1.3" },
  h3:    { fontSize: "14px", fontWeight: 700, letterSpacing: "-0.01em", lineHeight: "1.4" },
  body:  { fontSize: "13px", fontWeight: 400, lineHeight: "1.6" },
  small: { fontSize: "12px", fontWeight: 400, lineHeight: "1.5" },
  label: { fontSize: "11px", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase" },
  micro: { fontSize: "10px", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" },
  mono:  { fontFamily: "'JetBrains Mono','Fira Code','Courier New',monospace", fontSize: "12px" },
};

// -- BORDES ---------------------------------------------------
export const RADIUS = {
  none:   "0px",
  sm:     "4px",
  md:     "6px",
  lg:     "8px",
  xl:     "12px",
  "2xl":  "16px",
  full:   "9999px",
  // Alias semánticos
  input:  "6px",
  button: "6px",
  card:   "8px",
  modal:  "12px",
};

// -- SOMBRAS - mínimas y funcionales -------------------------
export const SHADOWS = {
  none:   "none",
  sm:     "0 1px 2px rgba(0,0,0,0.05)",
  card:   "0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)",
  md:     "0 4px 12px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.04)",
  lg:     "0 8px 24px rgba(0,0,0,0.10), 0 2px 8px rgba(0,0,0,0.06)",
  modal:  "0 20px 48px rgba(0,0,0,0.16), 0 4px 16px rgba(0,0,0,0.08)",
  orange: "0 2px 8px rgba(244,121,32,0.28)",
};

// -- INPUTS ---------------------------------------------------
export const INPUT_BASE = {
  background:   COLORS.gray50,
  border:       `1px solid ${COLORS.gray200}`,
  borderRadius: RADIUS.input,
  color:        COLORS.gray800,
  fontSize:     "13px",
  padding:      "10px 12px",
  outline:      "none",
  width:        "100%",
  transition:   "border-color 0.15s, box-shadow 0.15s",
  minHeight:    "40px",
};

// Alias para compatibilidad
export const INPUT_STYLE = INPUT_BASE;

export const INPUT_FOCUS = (e) => {
  e.target.style.borderColor = COLORS.orange;
  e.target.style.boxShadow   = `0 0 0 3px ${COLORS.orangeMuted}`;
  e.target.style.background  = COLORS.white;
};
export const INPUT_BLUR = (e) => {
  e.target.style.borderColor = COLORS.gray200;
  e.target.style.boxShadow   = "none";
  e.target.style.background  = COLORS.gray50;
};

// -- BOTONES --------------------------------------------------
// Altura mínima 44px para accesibilidad táctil
export const BTN_PRIMARY = {
  background:    COLORS.orange,
  borderRadius:  RADIUS.button,
  boxShadow:     SHADOWS.orange,
  color:         COLORS.white,
  fontWeight:    600,
  fontSize:      "13px",
  letterSpacing: "0.01em",
  padding:       "10px 20px",
  minHeight:     "44px",
  border:        "none",
  cursor:        "pointer",
  transition:    "filter 0.15s, transform 0.1s",
};

export const BTN_SECONDARY = {
  background:   COLORS.white,
  border:       `1px solid ${COLORS.gray200}`,
  borderRadius: RADIUS.button,
  color:        COLORS.gray700,
  fontWeight:   500,
  fontSize:     "13px",
  padding:      "10px 20px",
  minHeight:    "44px",
  cursor:       "pointer",
  transition:   "background 0.15s, border-color 0.15s",
};

export const BTN_GHOST = {
  background:   "transparent",
  border:       `1px solid ${COLORS.gray200}`,
  borderRadius: RADIUS.button,
  color:        COLORS.gray600,
  fontWeight:   500,
  fontSize:     "13px",
  padding:      "10px 20px",
  minHeight:    "44px",
  cursor:       "pointer",
};

export const BTN_DANGER = {
  background:   COLORS.danger,
  borderRadius: RADIUS.button,
  color:        COLORS.white,
  fontWeight:   600,
  fontSize:     "13px",
  padding:      "10px 20px",
  minHeight:    "44px",
  border:       "none",
  cursor:       "pointer",
};

// -- CARDS ----------------------------------------------------
export const CARD = {
  background:   COLORS.white,
  border:       `1px solid ${COLORS.gray200}`,
  borderRadius: RADIUS.card,
  boxShadow:    SHADOWS.card,
};

export const CARD_HEADER = {
  padding:      "12px 16px",
  borderBottom: `1px solid ${COLORS.gray100}`,
  background:   COLORS.gray50,
};

// -- BADGES / CHIPS -------------------------------------------
export const BADGE = {
  base: {
    display:      "inline-flex",
    alignItems:   "center",
    gap:          "4px",
    padding:      "2px 8px",
    borderRadius: RADIUS.full,
    fontSize:     "11px",
    fontWeight:   600,
    lineHeight:   "1.4",
  },
  success: { background: COLORS.successBg, color: COLORS.success, border: `1px solid ${COLORS.successBorder}` },
  danger:  { background: COLORS.dangerBg,  color: COLORS.danger,  border: `1px solid ${COLORS.dangerBorder}`  },
  warning: { background: COLORS.warningBg, color: COLORS.warning, border: `1px solid ${COLORS.warningBorder}` },
  info:    { background: COLORS.infoBg,    color: COLORS.info,    border: `1px solid ${COLORS.infoBorder}`    },
  neutral: { background: COLORS.gray100,   color: COLORS.gray600, border: `1px solid ${COLORS.gray200}`       },
  orange:  { background: COLORS.orangeLight, color: COLORS.orange, border: `1px solid rgba(244,121,32,0.25)` },
};

// -- TABLA ----------------------------------------------------
export const TABLE = {
  header: {
    background:  COLORS.gray50,
    borderBottom:`1px solid ${COLORS.gray200}`,
    padding:     "10px 16px",
    fontSize:    "11px",
    fontWeight:  600,
    color:       COLORS.gray500,
    letterSpacing:"0.06em",
    textTransform:"uppercase",
  },
  row: {
    borderBottom: `1px solid ${COLORS.gray100}`,
    padding:      "12px 16px",
    fontSize:     "13px",
    color:        COLORS.gray700,
  },
  rowHover: { background: COLORS.gray50 },
};

// -- SIDEBAR --------------------------------------------------
export const SIDEBAR = {
  background: "#111827",
  width:      "220px",
  itemActive: {
    background: COLORS.orange,
    color:      COLORS.white,
    borderRadius: RADIUS.md,
  },
  itemHover: {
    background: "rgba(255,255,255,0.06)",
    color:      COLORS.white,
  },
  itemDefault: {
    color: "#9CA3AF",
  },
};

// -- HEADER ---------------------------------------------------
export const HEADER = {
  height:     "56px",
  background: COLORS.white,
  borderBottom:`1px solid ${COLORS.gray200}`,
  padding:    "0 20px",
  boxShadow:  SHADOWS.sm,
};

// -- ASSETS DE LOGIN (compatibilidad) -------------------------
export const DIAGONAL = {
  desktop: { background: "#000000", clipPath: "polygon(66% 100%, 100% 55%, 100% 100%)" },
  mobile:  { background: "#000000", clipPath: "polygon(0% 100%, 100% 84%, 100% 100%)" },
};

export const BG_OVERLAY =
  "linear-gradient(105deg, rgba(17,24,39,0.88) 0%, rgba(17,24,39,0.60) 45%, rgba(17,24,39,0.22) 70%, transparent 100%)";

export const BG_IMAGE = {
  backgroundImage:    "url('/assets/img/Fondo Precision Trucks.webp')",
  backgroundSize:     "cover",
  backgroundPosition: "center 15%",
  backgroundRepeat:   "no-repeat",
  transform:          "translateZ(0)",
};

export const ACCENT_BAR = {
  width:        "3px",
  borderRadius: "0 3px 3px 0",
  background:   COLORS.orange,
  flexShrink:   0,
};
