// ================================================================
//  DESIGN SYSTEM — Precision Truck Parts HelpDesk
//  Uso: import { COLORS, SHADOWS, BTN_PRIMARY } from '../Config/DesignSystem'
// ================================================================

// ── COLORES INSTITUCIONALES ──────────────────────────────────
export const COLORS = {
  orange:      "#F47920",
  orangeDark:  "#d97400",
  orangeGlow:  "rgba(244,121,32,0.40)",
  dark:        "#1D1D1B",
  silver:      "#C1C7C9",
  silverLight: "#edf2f7",
  silverBg:    "#f4f7fa",
  white:       "#ffffff",
  whiteCard:   "rgba(255,255,255,0.98)",
  label:       "#4a6278",
  textMuted:   "#6b7280",
};

// ── SOMBRAS ──────────────────────────────────────────────────
export const SHADOWS = {
  card:   "0 24px 64px rgba(29,29,27,0.30), 0 4px 16px rgba(29,29,27,0.10)",
  button: "0 4px 14px rgba(244,121,32,0.40)",
};

// ── BORDES REDONDEADOS ───────────────────────────────────────
export const RADIUS = {
  card:   "14px",
  input:  "8px",
  button: "8px",
};

// ── TIPOGRAFÍA ───────────────────────────────────────────────
export const FONT = {
  title:   { fontWeight: 900, letterSpacing: "-0.02em", color: "#1D1D1B" },
  label:   { fontSize: "10px", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#4a6278" },
  caption: { fontSize: "10px", letterSpacing: "0.1em", textTransform: "uppercase", color: "#C1C7C9" },
};

// ── INPUTS ───────────────────────────────────────────────────
export const INPUT_STYLE = {
  background:   "#f4f7fa",
  border:       "1px solid #C1C7C9",
  borderRadius: "8px",
  color:        "#1D1D1B",
  fontSize:     "13px",
  padding:      "10px 14px",
  outline:      "none",
  width:        "100%",
  transition:   "box-shadow 0.2s",
};

export const INPUT_FOCUS  = (e) => (e.target.style.boxShadow = "0 0 0 2px #F47920");
export const INPUT_BLUR   = (e) => (e.target.style.boxShadow = "none");

// ── BOTÓN PRINCIPAL ──────────────────────────────────────────
export const BTN_PRIMARY = {
  background:    "linear-gradient(135deg, #F47920, #d97400)",
  borderRadius:  "8px",
  boxShadow:     "0 4px 14px rgba(244,121,32,0.40)",
  color:         "#ffffff",
  fontWeight:    700,
  fontSize:      "13px",
  letterSpacing: "0.05em",
  padding:       "11px 16px",
  width:         "100%",
  border:        "none",
  cursor:        "pointer",
};

// ── BOTÓN SECUNDARIO ─────────────────────────────────────────
export const BTN_SECONDARY = {
  background:   "#f4f7fa",
  border:       "1px solid #C1C7C9",
  borderRadius: "8px",
  color:        "#1D1D1B",
  fontWeight:   600,
  fontSize:     "13px",
  padding:      "10px 16px",
  width:        "100%",
  cursor:       "pointer",
};

// ── DIAGONAL ─────────────────────────────────────────────────
export const DIAGONAL = {
  desktop: { background: "#1D1D1B",  clipPath: "polygon(66% 100%, 100% 55%, 100% 100%)" },
  mobile:  { background: "#1D1D1B",  clipPath: "polygon(0% 100%, 100% 84%, 100% 100%)" },
};

// ── OVERLAY DE FONDO ─────────────────────────────────────────
export const BG_OVERLAY =
  "linear-gradient(100deg, rgba(29,29,27,0.80) 0%, rgba(29,29,27,0.50) 45%, rgba(29,29,27,0.15) 75%, transparent 100%)";

// ── IMAGEN DE FONDO ──────────────────────────────────────────
export const BG_IMAGE = {
  backgroundImage:    "url('/assets/img/Fondo Precision Trucks.webp')",
  backgroundSize:     "cover",
  backgroundPosition: "center 15%",
  backgroundRepeat:   "no-repeat",
  transform:          "translateZ(0)",
};
