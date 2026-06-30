/**
 * ProgressTimeline.jsx — Vertical Stepper desacoplado
 *
 * Props:
 *   T          – tokens del tema
 *   pasoActual – 0 = Recibido | 1 = Técnico asignado | 2 = En proceso | 3 = Resuelto
 *   metadata   – { fechaAlta, horaAlta, fechaResuelto, horaResuelto,
 *                  nombreEmpleado, resuelto_por, tiempoResolucion }
 */

const PASOS = [
  {
    id:    "recibido",
    label: "Recibido",
    desc:  "Reporte registrado en el sistema",
    getMeta: ({ fechaAlta, horaAlta, nombreEmpleado }) => ({
      timestamp: fechaAlta && horaAlta ? `${fechaAlta} · ${horaAlta}` : null,
      extra:     nombreEmpleado        ? `Por ${nombreEmpleado}`       : null,
    }),
  },
  {
    id:    "tecnico_asignado",
    label: "Técnico asignado",
    desc:  "Se asignó un técnico a la incidencia",
    getMeta: ({ resuelto_por, nombreTecnico }, pasoActual) => {
      const nombre = resuelto_por || nombreTecnico || null;
      return {
        timestamp: null,
        extra:     nombre && pasoActual >= 1 ? `Técnico: ${nombre}` : null,
      };
    },
  },
  {
    id:    "en_proceso",
    label: "En proceso",
    desc:  "Incidencia siendo atendida",
    getMeta: (_, pasoActual) => ({
      timestamp: null,
      extra:     pasoActual >= 2 ? "Trabajando en la solución" : null,
    }),
  },
  {
    id:    "resuelto",
    label: "Resuelto",
    desc:  "Incidencia cerrada exitosamente",
    getMeta: ({ fechaResuelto, horaResuelto, tiempoResolucion }, pasoActual) => ({
      timestamp: pasoActual === 3 && fechaResuelto ? `${fechaResuelto} · ${horaResuelto}` : null,
      extra:     tiempoResolucion                  ? `Tiempo total: ${tiempoResolucion}`   : null,
    }),
  },
];

const PALETTE = {
  done: {
    dot:   { bg: { light: "#fff7ed", dark: "rgba(244,121,32,0.14)" }, border: "#f47920", color: "#f47920" },
    badge: { bg: { light: "#fff7ed", dark: "rgba(244,121,32,0.12)" }, text: "#f47920", border: "rgba(244,121,32,0.28)", label: "Completado" },
    line:  { light: "linear-gradient(180deg,#f47920,rgba(244,121,32,0.12))", dark: "linear-gradient(180deg,#f47920,rgba(244,121,32,0.06))" },
  },
  "done-final": {
    dot:   { bg: { light: "#dcfce7", dark: "rgba(22,163,74,0.14)" }, border: "#16a34a", color: "#16a34a" },
    badge: { bg: { light: "#f0fdf4", dark: "rgba(22,163,74,0.12)" }, text: "#16a34a", border: "rgba(22,163,74,0.28)", label: "Resuelto" },
    line:  { light: "#dcfce7", dark: "rgba(22,163,74,0.14)" },
  },
  active: {
    dot:   { bg: { light: "#fff7ed", dark: "rgba(244,121,32,0.14)" }, border: "#f47920", color: "#f47920" },
    badge: { bg: { light: "#fff7ed", dark: "rgba(244,121,32,0.12)" }, text: "#f47920", border: "rgba(244,121,32,0.28)", label: "En curso" },
    line:  { light: "#e2e8f0", dark: "rgba(255,255,255,0.07)" },
  },
  "active-final": {
    dot:   { bg: { light: "#dcfce7", dark: "rgba(22,163,74,0.14)" }, border: "#16a34a", color: "#16a34a" },
    badge: { bg: { light: "#f0fdf4", dark: "rgba(22,163,74,0.12)" }, text: "#16a34a", border: "rgba(22,163,74,0.28)", label: "Resuelto" },
    line:  { light: "#e2e8f0", dark: "rgba(255,255,255,0.07)" },
  },
  pending: {
    dot:   { bg: { light: "#f8fafc", dark: "rgba(255,255,255,0.04)" }, border: { light: "#e2e8f0", dark: "rgba(255,255,255,0.10)" }, color: { light: "#cbd5e1", dark: "rgba(255,255,255,0.20)" } },
    badge: { bg: { light: "#f8fafc", dark: "rgba(255,255,255,0.05)" }, text: { light: "#94a3b8", dark: "rgba(255,255,255,0.30)" }, border: { light: "#e2e8f0", dark: "rgba(255,255,255,0.08)" }, label: "Pendiente" },
    line:  { light: "#e2e8f0", dark: "rgba(255,255,255,0.07)" },
  },
};

function tok(value, isDark) {
  if (value && typeof value === "object" && ("light" in value || "dark" in value))
    return isDark ? value.dark : value.light;
  return value;
}

function getPalKey(state, isLast) {
  if (state === "done"   && isLast) return "done-final";
  if (state === "active" && isLast) return "active-final";
  return state;
}

function DotIcon({ palKey, index }) {
  if (palKey === "done" || palKey === "done-final" || palKey === "active-final") {
    return (
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12" />
      </svg>
    );
  }
  if (palKey === "active") {
    return (
      <svg className="animate-spin" width="10" height="10" viewBox="0 0 24 24"
        fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
        <path d="M21 12a9 9 0 1 1-6.219-8.56" />
      </svg>
    );
  }
  return <span style={{ fontSize: 9, fontWeight: 800, lineHeight: 1 }}>{index + 1}</span>;
}

export default function ProgressTimeline({ T, pasoActual = 0, metadata = {} }) {
  const { isDark } = T;

  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      {PASOS.map((paso, i) => {
        const isLast  = i === PASOS.length - 1;
        const state   = i < pasoActual ? "done" : i === pasoActual ? "active" : "pending";
        const palKey  = getPalKey(state, isLast);
        const pal     = PALETTE[palKey];
        const meta    = paso.getMeta(metadata, pasoActual);
        const isPending = state === "pending";
        const isActive  = palKey === "active" || palKey === "active-final";

        return (
          <div key={paso.id} style={{ display: "flex", gap: 16 }}>

            {/* Eje: dot + línea */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0, width: 32 }}>
              <div style={{
                width: 32, height: 32,
                borderRadius: "50%",
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0,
                background: tok(pal.dot.bg,    isDark),
                border:    `1.5px solid ${tok(pal.dot.border, isDark)}`,
                color:      tok(pal.dot.color,  isDark),
                boxShadow:  isActive
                  ? `0 0 0 5px ${tok(pal.dot.bg, isDark)}, 0 2px 8px ${tok(pal.dot.border, isDark)}22`
                  : "none",
                transition: "all 0.3s ease",
              }}>
                <DotIcon palKey={palKey} index={i} />
              </div>

              {!isLast && (
                <div style={{
                  width: 2, flex: 1, minHeight: 40,
                  borderRadius: 999, margin: "4px 0",
                  background:   tok(pal.line, isDark),
                  transition:   "background 0.4s ease",
                }} />
              )}
            </div>

            {/* Contenido */}
            <div style={{ flex: 1, paddingTop: 8, paddingBottom: isLast ? 0 : 24 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
                <p style={{
                  margin: 0, fontSize: 13,
                  fontWeight: isPending ? 500 : 700,
                  color: isPending
                    ? (isDark ? "rgba(255,255,255,0.25)" : "#94a3b8")
                    : T.text,
                  transition: "color 0.3s ease",
                }}>
                  {paso.label}
                </p>
                <span style={{
                  fontSize: 9, fontWeight: 700,
                  padding: "2px 8px", borderRadius: 99,
                  letterSpacing: "0.04em", textTransform: "uppercase",
                  background: tok(pal.badge.bg,    isDark),
                  color:      tok(pal.badge.text,   isDark),
                  border:    `1px solid ${tok(pal.badge.border, isDark)}`,
                }}>
                  {pal.badge.label}
                </span>
              </div>

              <p style={{
                margin: 0, fontSize: 11, fontWeight: 400, lineHeight: 1.5,
                color: isDark ? "rgba(255,255,255,0.35)" : "#94a3b8",
              }}>
                {paso.desc}
              </p>

              {meta.timestamp && (
                <p style={{
                  margin: "8px 0 0", fontSize: 10, fontWeight: 500, letterSpacing: "0.01em",
                  color: isDark ? "rgba(255,255,255,0.28)" : "#b0bac7",
                }}>
                  {meta.timestamp}
                </p>
              )}

              {meta.extra && (
                <p style={{
                  margin: "4px 0 0", fontSize: 10, fontWeight: 400,
                  color: isDark ? "rgba(255,255,255,0.22)" : "#b0bac7",
                }}>
                  {meta.extra}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
