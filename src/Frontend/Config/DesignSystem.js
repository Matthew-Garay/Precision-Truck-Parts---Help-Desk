// ================================================================
//  PRECISION TRUCK PARTS — Design System
//  Atomic Design · Regla 60-30-10 · Heurísticas de Nielsen · Mobile-First
// ================================================================
//
//  ESTRATEGIA CROMÁTICA (60-30-10):
//  ┌──────────────────────────────────────────────────────────┐
//  │  60%  Neutros   #FFFFFF fondos · #F8FAFC contenedores    │
//  │  30%  Slate     #475569 textos · #E2E8F0 bordes sutiles  │
//  │  10%  Acento    #2563EB acciones principales ÚNICAMENTE  │
//  └──────────────────────────────────────────────────────────┘
//
//  SEMÁNTICA DE COLOR (solo estados funcionales):
//  • #DC2626  → Error crítico   (Stock = 0, eliminación)
//  • #D97706  → Alerta          (Stock bajo)
//  • #16A34A  → Confirmación    (operación exitosa)
//  Sin colores decorativos adicionales.
//
//  ATOMIC DESIGN:
//  ÁTOMOS     → Button · Input · Badge · Typography · Divider
//  MOLÉCULAS  → FormField · IconAction · SearchField
//  ORGANISMOS → Navbar · DataTable · SolicitudPanel
//
//  HEURÍSTICAS DE NIELSEN APLICADAS:
//  #1  Visibilidad     → Loading states en botones, skeletons
//  #4  Consistencia    → Patrón único Confirmar/Cancelar
//  #5  Prev. errores   → Focus rings, validación inline
//  #8  Minimalismo     → Espaciado en lugar de bordes decorativos
//
// ================================================================

// ── 60%: NEUTROS (fondos y superficies) ─────────────────────────
// Regla: todo lo que NO es acción ni texto usa esta escala
export const NEUTRAL = {
  white:      "#FFFFFF",   // fondo de página, cards, modales
  slate50:    "#F8FAFC",   // contenedores secundarios, table headers
  slate100:   "#F1F5F9",   // hover de filas, inputs en reposo
};

// ── 30%: SLATE (jerarquía textual y bordes) ──────────────────────
export const SLATE = {
  // Tipografía — Nielsen #8: jerarquía por peso/tono, sin color extra
  900:  "#0F172A",   // h1 headings (Semibold 700)
  700:  "#334155",   // h2/h3 subtítulos (Semibold 600)
  600:  "#475569",   // texto secundario (Regular 400)
  400:  "#94A3B8",   // placeholders, metadatos
  // Bordes — mínimos e invisibles a primera vista
  200:  "#E2E8F0",   // borde contenedor (sutil)
  300:  "#CBD5E1",   // borde input en reposo
};

// ── 10%: ACENTO único ────────────────────────────────────────────
// REGLA ABSOLUTA: solo en botón primario, ítem activo, focus ring, links
export const ACCENT = {
  base:   "#2563EB",
  dark:   "#1D4ED8",   // hover del botón primario
  light:  "#EFF6FF",   // bg de badge info / highlight
  muted:  "rgba(37,99,235,0.12)",  // focus ring
};

// ── ACENTO CORPORATIVO (Precision Truck Parts) ────────────────────
// Naranja #F97316 para acciones primarias corporativas (CTA, botones principales)
// Token unificado con themeTokens.js (LIGHT.orange / DARK.orange)
export const BRAND = {
  orange:      "#F47920",   // Precision Truck Parts — naranja corporativo
  orangeDark:  "#D4610A",   // hover (idéntico a themeTokens.LIGHT.orangeDark)
  orangeLight: "#FFF7ED",   // bg sutil
  orangeMuted: "rgba(244,121,32,0.12)",  // focus ring / highlight
};

// ── ESTADOS DE TICKET (colores semánticos) ───────────────────────
// Regla de Nielsen #1: el estado del sistema debe ser siempre visible.
// Usar EXCLUSIVAMENTE estos tokens para representar el ciclo de vida de un ticket.
export const TICKET_STATUS = {
  // Pendiente → Amarillo ámbar (espera, sin acción)
  pendiente: {
    label:     "Pendiente",
    color:     "#D97706",
    bg:        "#FFFBEB",
    bgDark:    "rgba(217,119,6,0.15)",
    border:    "#FDE68A",
    borderDark:"rgba(217,119,6,0.35)",
  },
  // En Proceso → Azul (actividad, en progreso)
  enProceso: {
    label:     "En proceso",
    color:     "#2563EB",
    bg:        "#EFF6FF",
    bgDark:    "rgba(37,99,235,0.15)",
    border:    "rgba(37,99,235,0.25)",
    borderDark:"rgba(37,99,235,0.40)",
  },
  // Resuelto → Verde (éxito, completado)
  resuelto: {
    label:     "Resuelto",
    color:     "#16A34A",
    bg:        "#F0FDF4",
    bgDark:    "rgba(22,163,74,0.15)",
    border:    "#BBF7D0",
    borderDark:"rgba(22,163,74,0.35)",
  },
  // No Resuelto → Rojo (error, atención requerida)
  noResuelto: {
    label:     "No Resuelto",
    color:     "#DC2626",
    bg:        "#FEF2F2",
    bgDark:    "rgba(220,38,38,0.15)",
    border:    "#FECACA",
    borderDark:"rgba(220,38,38,0.35)",
  },
};

/**
 * getTicketStatus(estatus) → tokens del estado
 * Uso: const s = getTicketStatus(ticket.estatus);
 *      <span style={{ color: s.color, background: s.bg }}>{ s.label }</span>
 */
export function getTicketStatus(estatus = "") {
  const key = estatus.toLowerCase().replace(" ", "");
  if (key === "enproceso")    return TICKET_STATUS.enProceso;
  if (key === "resuelto")     return TICKET_STATUS.resuelto;
  if (key === "noresuelto")   return TICKET_STATUS.noResuelto;
  return TICKET_STATUS.pendiente; // default
}

// ── SEMÁNTICOS (estados funcionales únicamente) ──────────────────
export const SEMANTIC = {
  danger:    "#DC2626",   // stock 0, eliminación, error crítico
  dangerBg:  "#FEF2F2",
  dangerBdr: "#FECACA",
  warning:   "#D97706",   // stock bajo, alerta
  warningBg: "#FFFBEB",
  warningBdr:"#FDE68A",
  success:   "#16A34A",   // operación exitosa
  successBg: "#F0FDF4",
  successBdr:"#BBF7D0",
};

// ── Alias exportado unificado (compatibilidad backward) ──────────
export const COLORS = {
  // Acento principal (reemplaza #FF6600)
  primary:       ACCENT.base,
  primaryDark:   ACCENT.dark,
  primaryLight:  ACCENT.light,
  primaryMuted:  ACCENT.muted,
  // Estructura (conserva navy para sidebar/modal headers)
  navy:          "#0F172A",
  navyDark:      "#020617",
  navyLight:     "#1E293B",
  navyMuted:     "rgba(15,23,42,0.06)",
  // Superficies
  neutral:       NEUTRAL.slate50,
  neutralAlt:    NEUTRAL.slate100,
  surface:       NEUTRAL.white,
  // Escala de texto
  text:          SLATE[700],
  textMuted:     SLATE[600],
  textFaint:     SLATE[400],
  // Bordes
  gray200:       SLATE[200],
  gray300:       SLATE[300],
  // Semánticos
  ...SEMANTIC,
  // Misc
  white:         "#FFFFFF",
  // ── Alias login (legacy) ──────────────────────────────────────
  whiteCard:     "#FFFFFF",
  silverBg:      NEUTRAL.slate50,
  silver:        SLATE[300],
  silverLight:   SLATE[200],
  dark:          "#0F172A",
  label:         SLATE[600],
  orange:        "#F47920",
  orangeDark:    "#D4610A",
};

// ================================================================
//  TIPOGRAFÍA — Inter, jerarquía por peso (sin colores extra)
//  Nielsen #8: el peso y el tamaño crean jerarquía, no el color
// ================================================================
// Semibold (600/700) → encabezados
// Regular  (400)     → cuerpo
export const FONT = {
  h1:    { fontSize: "24px", fontWeight: 700, letterSpacing: "-0.02em", lineHeight: "1.25", color: SLATE[900] },
  h2:    { fontSize: "18px", fontWeight: 600, letterSpacing: "-0.01em", lineHeight: "1.3",  color: SLATE[900] },
  h3:    { fontSize: "14px", fontWeight: 600, letterSpacing: "-0.005em",lineHeight: "1.4",  color: SLATE[700] },
  body:  { fontSize: "13px", fontWeight: 400, lineHeight: "1.6",                            color: SLATE[700] },
  small: { fontSize: "12px", fontWeight: 400, lineHeight: "1.5",                            color: SLATE[600] },
  label: { fontSize: "11px", fontWeight: 600, letterSpacing: "0.06em",  textTransform: "uppercase", color: SLATE[600] },
  micro: { fontSize: "10px", fontWeight: 600, letterSpacing: "0.08em",  textTransform: "uppercase", color: SLATE[400] },
  mono:  { fontFamily: "'JetBrains Mono','Fira Code','Courier New',monospace", fontSize: "12px" },
};

// ================================================================
//  ESPACIADO — grid de 4px (Tailwind-compatible)
// ================================================================
export const SPACE = {
  1: "4px", 2: "8px", 3: "12px", 4: "16px",
  5: "20px", 6: "24px", 8: "32px", 10: "40px", 12: "48px",
};

// ================================================================
//  RADIOS — dos niveles únicamente
// ================================================================
export const RADIUS = {
  sm:     "4px",   // átomos: inputs, botones, badges
  lg:     "6px",   // moléculas/organismos: cards, modales — enterprise
  input:  "4px",
  button: "4px",
  card:   "6px",
  modal:  "4px",   // el modal es más cuadrado que la card
};

// ================================================================
//  SOMBRAS — solo elevación funcional (no decorativa)
//  Nielsen #8: sin sombra donde el espaciado sea suficiente
// ================================================================
export const SHADOWS = {
  none:  "none",
  card:  "0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)",
  modal: "0 8px 32px rgba(0,0,0,0.12)",
};

// ================================================================
//  ÁTOMOS
// ================================================================

// ── Átomo: Botón Primario ────────────────────────────────────────
// Acento #2563EB — SOLO acciones de confirmación/envío principal
export const BTN_PRIMARY = {
  background:   ACCENT.base,
  color:        "#fff",
  height:       "40px",
  padding:      "0 20px",
  border:       "none",
  borderRadius: RADIUS.button,
  fontSize:     "13px",
  fontWeight:   600,
  cursor:       "pointer",
  display:      "inline-flex",
  alignItems:   "center",
  gap:          "6px",
  transition:   "background 0.15s",
  whiteSpace:   "nowrap",
};
export const BTN_PRIMARY_HOVER = { background: ACCENT.dark };

// ── Átomo: Botón Ghost ───────────────────────────────────────────
// Acciones secundarias — borde Slate-200, sin relleno
export const BTN_GHOST = {
  background:   "transparent",
  color:        SLATE[700],
  height:       "40px",
  padding:      "0 20px",
  border:       `1px solid ${SLATE[200]}`,
  borderRadius: RADIUS.button,
  fontSize:     "13px",
  fontWeight:   500,
  cursor:       "pointer",
  display:      "inline-flex",
  alignItems:   "center",
  gap:          "6px",
  transition:   "background 0.15s",
};
export const BTN_GHOST_HOVER = { background: NEUTRAL.slate100 };

// ── Átomo: Botón Danger ──────────────────────────────────────────
// Solo para acciones destructivas (eliminar, cancelar ticket)
export const BTN_DANGER = {
  background:   SEMANTIC.danger,
  color:        "#fff",
  height:       "40px",
  padding:      "0 20px",
  border:       "none",
  borderRadius: RADIUS.button,
  fontSize:     "13px",
  fontWeight:   600,
  cursor:       "pointer",
  display:      "inline-flex",
  alignItems:   "center",
  gap:          "6px",
  transition:   "filter 0.15s",
};

// ── Átomo: Botón Loading (Nielsen #1 — Visibilidad del estado) ───
// Patrón: al hacer clic → disabled + spinner + texto "Procesando..."
// Uso: <button style={loading ? BTN_LOADING : BTN_PRIMARY} disabled={loading}>
export const BTN_LOADING = {
  ...BTN_PRIMARY,
  opacity:  0.7,
  cursor:   "not-allowed",
  // El spinner se agrega como <Loader2 className="animate-spin" size={14} />
};

// ── Átomo: Input ─────────────────────────────────────────────────
// Background Slate-50 en reposo → blanco en foco (contraste sutil)
export const INPUT_BASE = {
  background:   NEUTRAL.slate50,
  border:       `1px solid ${SLATE[300]}`,
  borderRadius: RADIUS.input,
  color:        SLATE[700],
  fontSize:     "13px",
  padding:      "0 12px",
  height:       "40px",
  width:        "100%",
  outline:      "none",
  transition:   "border-color 0.15s, box-shadow 0.15s, background 0.15s",
};
// Alias
export const INPUT_STYLE = INPUT_BASE;

// Focus: acento azul + ring sutil (Nielsen #5 — prevención de errores)
export const INPUT_FOCUS = (e) => {
  e.target.style.borderColor = ACCENT.base;
  e.target.style.boxShadow   = `0 0 0 3px ${ACCENT.muted}`;
  e.target.style.background  = NEUTRAL.white;
};
export const INPUT_BLUR = (e) => {
  e.target.style.borderColor = SLATE[300];
  e.target.style.boxShadow   = "none";
  e.target.style.background  = NEUTRAL.slate50;
};
export const INPUT_ERROR_STYLE = {
  borderColor: SEMANTIC.danger,
  boxShadow:   `0 0 0 3px rgba(220,38,38,0.10)`,
};

// ── Átomo: Badge ─────────────────────────────────────────────────
export const BADGE = {
  base: {
    display: "inline-flex", alignItems: "center", gap: "4px",
    padding: "2px 8px", borderRadius: RADIUS.sm,
    fontSize: "11px", fontWeight: 600, lineHeight: "1.4", whiteSpace: "nowrap",
  },
  info:    { background: ACCENT.light,       color: ACCENT.base,       border: `1px solid ${ACCENT.muted}` },
  danger:  { background: SEMANTIC.dangerBg,  color: SEMANTIC.danger,   border: `1px solid ${SEMANTIC.dangerBdr}` },
  warning: { background: SEMANTIC.warningBg, color: SEMANTIC.warning,  border: `1px solid ${SEMANTIC.warningBdr}` },
  success: { background: SEMANTIC.successBg, color: SEMANTIC.success,  border: `1px solid ${SEMANTIC.successBdr}` },
  neutral: { background: NEUTRAL.slate100,   color: SLATE[600],        border: `1px solid ${SLATE[200]}` },
  // Legacy alias
  primary: { background: ACCENT.light,       color: ACCENT.base,       border: `1px solid ${ACCENT.muted}` },
  navy:    { background: "rgba(15,23,42,0.06)", color: "#0F172A",       border: "1px solid rgba(15,23,42,0.15)" },
};

// ================================================================
//  MOLÉCULAS
// ================================================================

// ── Molécula: FormField (Label + Input + InlineError) ────────────
// Nielsen #5: error visible inmediatamente bajo el campo
export const FORM_FIELD = {
  wrapper: { display: "flex", flexDirection: "column", gap: "4px" },
  label:   { ...FONT.label, marginBottom: "2px" },
  error:   { fontSize: "12px", color: SEMANTIC.danger, fontWeight: 500 },
};

// ── Molécula: IconAction (Icono + Texto en línea) ────────────────
// Para acciones en toolbar: gap: 6px, color slate-600
export const ICON_ACTION = {
  display: "inline-flex", alignItems: "center", gap: "6px",
  fontSize: "13px", fontWeight: 500, color: SLATE[600],
  cursor: "pointer",
};

// ── Molécula: Card ───────────────────────────────────────────────
// Nielsen #8: sin sombra elevada cuando el borde es suficiente
export const CARD = {
  background:   NEUTRAL.white,
  border:       `1px solid ${SLATE[200]}`,
  borderRadius: RADIUS.card,
  boxShadow:    SHADOWS.card,
  overflow:     "hidden",
};
export const CARD_FLAT     = { ...CARD, boxShadow: "none" };
export const CARD_ELEVATED = { ...CARD, boxShadow: SHADOWS.modal };
export const CARD_HEADER   = {
  padding: "12px 24px", borderBottom: `1px solid ${SLATE[200]}`,
  background: NEUTRAL.slate50, display: "flex", alignItems: "center", gap: "10px",
};
export const CARD_BODY   = { padding: "24px" };
export const CARD_FOOTER = {
  padding: "12px 24px", borderTop: `1px solid ${SLATE[200]}`,
  background: NEUTRAL.slate50, display: "flex",
  alignItems: "center", justifyContent: "flex-end", gap: "8px",
};

// ================================================================
//  ORGANISMOS
// ================================================================

// ── Organismo: Navbar (Barra de navegación) ──────────────────────
// Estructura: [Logo + Brand] · [Nav links] · [User + Notificaciones]
// Color: Slate-900 (#0F172A) — estructura máxima autoridad visual
// Acento: solo el ítem ACTIVO usa #2563EB
export const NAVBAR = {
  root: {
    height:      "56px",
    background:  "#0F172A",
    borderBottom:`1px solid rgba(255,255,255,0.06)`,
    padding:     "0 20px",
    display:     "flex",
    alignItems:  "center",
    gap:         "16px",
    color:       "#fff",
  },
  itemDefault: { color: "rgba(255,255,255,0.55)", fontSize: "13px", fontWeight: 500 },
  itemActive:  {
    color:        "#fff",
    fontWeight:   600,
    // Indicador activo: línea inferior acento — no background
    borderBottom: `2px solid ${ACCENT.base}`,
    paddingBottom:"2px",
  },
  itemHover:   { color: "rgba(255,255,255,0.85)" },
};

// ── Organismo: Sidebar ───────────────────────────────────────────
// Breakpoints (Mobile-First):
//  <768px  → off-canvas drawer + overlay
//  768px   → rail 64px (solo iconos)
//  1024px  → full 220px (iconos + labels)
export const SIDEBAR = {
  background:  "#0F172A",
  width:       "220px",
  widthRail:   "64px",
  itemActive:  { background: ACCENT.base,                    color: "#fff",             borderRadius: RADIUS.sm },
  itemHover:   { background: "rgba(255,255,255,0.07)",       color: "#fff" },
  itemDefault: { color: "rgba(255,255,255,0.50)" },
};

// ── Organismo: DataTable de Insumos ──────────────────────────────
// Nielsen #8: sin bordes externos en tabla — el espaciado separa las filas
// Mobile (<768px): cada fila → tarjeta con data-label (ver CSS)
export const TABLE = {
  header: {
    background:    NEUTRAL.slate50,
    borderBottom:  `2px solid ${SLATE[200]}`,
    padding:       "10px 16px",
    fontSize:      "11px",
    fontWeight:    700,
    color:         SLATE[700],       // slate, no acento — headers son estructura
    letterSpacing: "0.06em",
    textTransform: "uppercase",
    whiteSpace:    "nowrap",
  },
  row: {
    borderBottom:  `1px solid ${SLATE[200]}`,
    padding:       "12px 16px",
    fontSize:      "13px",
    color:         SLATE[700],
  },
  rowHover:    { background: NEUTRAL.slate50 },
  // Stock 0 → danger semántico
  rowDanger:   { background: SEMANTIC.dangerBg },
  // Stock bajo → warning semántico
  rowWarning:  { background: SEMANTIC.warningBg },
  emptyState: {
    padding: "48px 24px", textAlign: "center",
    color: SLATE[400], fontSize: "13px",
  },
};

// ── Organismo: Panel Lateral de Solicitud ────────────────────────
// Estructura: [Header sticky] · [Lista de ítems scroll] · [Footer con CTA]
// Breakpoint: en mobile (<768px) se convierte en bottom sheet (100vw)
export const SOLICITUD_PANEL = {
  root: {
    width:        "360px",
    height:       "100%",
    background:   NEUTRAL.white,
    borderLeft:   `1px solid ${SLATE[200]}`,
    display:      "flex",
    flexDirection:"column",
    overflow:     "hidden",
  },
  header: {
    padding:       "16px 20px",
    borderBottom:  `1px solid ${SLATE[200]}`,
    background:    NEUTRAL.slate50,
    fontWeight:    700,
    fontSize:      "14px",
    color:         SLATE[900],
    flexShrink:    0,
  },
  body: {
    flex:      1,
    overflowY: "auto",
    padding:   "12px",
    display:   "flex",
    flexDirection: "column",
    gap:       "8px",
  },
  footer: {
    padding:       "16px 20px",
    borderTop:     `1px solid ${SLATE[200]}`,
    background:    NEUTRAL.white,
    flexShrink:    0,
  },
};

// ── Organismo: Modal ─────────────────────────────────────────────
export const MODAL = {
  overlay: {
    position: "fixed", inset: 0,
    background: "rgba(0,0,0,0.40)",
    display: "flex", alignItems: "center", justifyContent: "center",
    zIndex: 50, padding: "16px",
  },
  container: {
    background:    NEUTRAL.white,
    borderRadius:  RADIUS.modal,
    border:        `1px solid ${SLATE[200]}`,
    boxShadow:     SHADOWS.modal,
    width:         "100%",
    maxWidth:      "520px",
    overflow:      "hidden",
    maxHeight:     "90vh",
    display:       "flex",
    flexDirection: "column",
  },
  header: {
    background:     "#0F172A",
    color:          "#fff",
    padding:        "16px 24px",
    display:        "flex",
    alignItems:     "center",
    justifyContent: "space-between",
    fontWeight:     700,
    fontSize:       "15px",
    flexShrink:     0,
  },
  body:   { padding: "24px", overflowY: "auto", flex: 1 },
  footer: {
    padding:        "14px 24px",
    borderTop:      `1px solid ${SLATE[200]}`,
    background:     NEUTRAL.slate50,
    display:        "flex",
    justifyContent: "flex-end",
    gap:            "8px",
    flexShrink:     0,
  },
};

// ================================================================
//  HEURÍSTICAS DE NIELSEN — Patrones de UX
// ================================================================

// ── Nielsen #4: Patrón ÚNICO de Confirmación / Cancelación ───────
// REGLA ABSOLUTA: orden siempre [Ghost/Cancelar] [Primary o Danger/Confirmar]
// La acción segura siempre va a la IZQUIERDA del footer.
//
//  Caso estándar (enviar formulario):
//    <footer>
//      <button style={BTN_GHOST}>Cancelar</button>
//      <button style={BTN_PRIMARY}>Guardar</button>   ← acento
//    </footer>
//
//  Caso destructivo (eliminar, cancelar ticket):
//    <footer>
//      <button style={BTN_GHOST}>Volver</button>      ← acción segura
//      <button style={BTN_DANGER}>Eliminar</button>   ← solo en modal de confirmación
//    </footer>
//
export const CONFIRM_PATTERN = {
  cancelBtn:  BTN_GHOST,
  confirmBtn: BTN_PRIMARY,
  destructiveBtn: BTN_DANGER,
  // Texto estándar:
  labels: { cancel: "Cancelar", confirm: "Guardar", destroy: "Eliminar" },
};

// ── Nielsen #8: Eliminación de bordes decorativos ────────────────
// Usar espaciado en lugar de líneas separadoras donde sea posible:
//  • Entre tarjetas: gap: 12px (no border + margin)
//  • Entre secciones de un formulario: paddingTop: 24px
//  • En listas: solo borderBottom en el elemento (no wrapper)
//  • Regla: si dos elementos del mismo nivel necesitan separación visual,
//    incrementar gap/padding ANTES de agregar un border.
export const SPACING_RULES = {
  sectionGap:   "24px",   // entre bloques de formulario
  cardGap:      "12px",   // entre tarjetas en grid
  inlineGap:    "8px",    // entre elementos en misma línea
  formFieldGap: "16px",   // entre campos de un formulario
};

// ── Nielsen #1: Feedback Visual (Estados del Sistema) ────────────
// Patrón de loading en botón:
//   1. Usuario hace clic → setLoading(true)
//   2. Botón: disabled + opacity 0.7 + <Loader2 size={14} className="animate-spin" />
//   3. Texto cambia a "Procesando..." o "Guardando..."
//   4. Al resolver: éxito → toast verde auto-dismiss 4s | error → toast rojo persistente
//
// Indicador de carga de página (skeleton):
//   Usar clase CSS `.skeleton` definida en design-system.css
//   Nunca usar spinners globales que bloqueen la UI completa.
export const LOADING_PATTERNS = {
  buttonLoading:  BTN_LOADING,
  // Toast de éxito: 4500ms auto-dismiss, icono CheckCircle2
  toastSuccess:   { duration: 4500, icon: "CheckCircle2" },
  // Toast de error crítico: persistente (duration: 0), icono XCircle
  toastError:     { duration: 0,    icon: "XCircle" },
  // Toast de alerta: 6000ms, icono AlertTriangle
  toastWarning:   { duration: 6000, icon: "AlertTriangle" },
};

// ── SKELETON PATTERN ─────────────────────────────────────────────
// Nielsen #1: preferir skeletons sobre spinners para listas y tablas.
// Los skeletons preservan el layout percibido y reducen la ansiedad de espera.
//
// USO EN JSX:
//   import { SKELETON_ROWS } from "../Config/DesignSystem";
//
//   {loading ? (
//     <SkeletonTable cols={5} rows={SKELETON_ROWS} />
//   ) : (
//     <DataTable data={tickets} />
//   )}
//
// El componente SkeletonTable se encuentra en:
//   src/Frontend/Components/SkeletonTable.jsx
export const SKELETON_ROWS = 6;  // filas de skeleton por defecto

// ================================================================
//  BREAKPOINTS — Mobile-First
// ================================================================
//  Base   (<640px)  : columna única, sin sidebar, tabla → tarjetas
//  sm     (≥640px)  : grid 2 col, sidebar rail (64px)
//  md     (≥768px)  : tabla HTML estándar, sidebar full
//  lg     (≥1024px) : panel lateral visible (SolicitudPanel)
//  xl     (≥1280px) : layout 3 columnas completo
//
//  Regla tabla → tarjeta (ver .ptp-table en design-system.css):
//  En <768px, cada <tr> es una tarjeta independiente con data-label.
export const BREAKPOINTS = {
  sm:  "640px",
  md:  "768px",
  lg:  "1024px",
  xl:  "1280px",
};

// ── ASSETS DE LOGIN (compatibilidad) ─────────────────────────────
export const DIAGONAL = {
  desktop: { background: "#000000", clipPath: "polygon(66% 100%, 100% 55%, 100% 100%)" },
  mobile:  { background: "#000000", clipPath: "polygon(0% 100%, 100% 84%, 100% 100%)" },
};
export const BG_OVERLAY = "rgba(10,10,10,0.65)";
export const BG_IMAGE = {
  backgroundImage:    "url('/assets/img/Fondo Precision Trucks.webp')",
  backgroundSize:     "cover",
  backgroundPosition: "center 15%",
  backgroundRepeat:   "no-repeat",
  transform:          "translateZ(0)",
};
export const ACCENT_BAR = {
  width: "3px", borderRadius: "0 3px 3px 0",
  background: ACCENT.base, flexShrink: 0,
};

// ── BTN_SECONDARY (alias legacy) ─────────────────────────────────
export const BTN_SECONDARY = {
  background:   "#0F172A",
  color:        "#fff",
  height:       "40px",
  padding:      "0 20px",
  border:       "none",
  borderRadius: RADIUS.button,
  fontSize:     "13px",
  fontWeight:   500,
  cursor:       "pointer",
  display:      "inline-flex",
  alignItems:   "center",
  gap:          "6px",
  transition:   "filter 0.15s",
};
export const BTN_ICON = {
  width: "36px", height: "36px",
  borderRadius: RADIUS.sm,
  border: `1px solid ${SLATE[200]}`,
  background: "transparent",
  color: SLATE[600],
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  transition: "background 0.15s",
};

// ── HEADER (alias legacy) ─────────────────────────────────────────
export const HEADER = NAVBAR.root;
