/**
 * ExportarPDFBtn — Átomo de acción de exportación
 *
 * Principio de Responsabilidad Única (SRP):
 * Extraído de VistaTicket donde estaba duplicado (bloque idéntico
 * para rol admin y rol usuario). Un solo componente, cero duplicación.
 *
 * Props:
 *   onClick  : () => void   — función generarReporte del padre
 *   T        : tema (tokens light/dark)
 *   label    : string       — texto del botón (default: "Exportar PDF")
 */
export default function ExportarPDFBtn({ onClick, T, label = "Exportar PDF" }) {
  const isDark = T.isDark;

  return (
    <button
      onClick={onClick}
      className="w-full flex items-center justify-center gap-2.5 py-3 rounded-xl text-xs font-bold transition-all active:scale-95"
      style={{
        background:    isDark ? "rgba(220,38,38,0.12)" : "#fef2f2",
        color:         "#dc2626",
        border:        `1px solid ${isDark ? "rgba(220,38,38,0.25)" : "#fca5a5"}`,
        letterSpacing: "0.03em",
        minHeight:     "44px",   /* Touch target WCAG 2.5.5 */
        transition:    "all 0.18s ease",
      }}
      onMouseEnter={e => {
        e.currentTarget.style.background  = isDark ? "rgba(220,38,38,0.2)" : "#fee2e2";
        e.currentTarget.style.boxShadow   = "0 4px 14px rgba(220,38,38,0.15)";
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background  = isDark ? "rgba(220,38,38,0.12)" : "#fef2f2";
        e.currentTarget.style.boxShadow   = "none";
      }}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z"/>
        <polyline points="14 2 14 8 20 8"/>
        <line x1="16" y1="13" x2="8" y2="13"/>
        <line x1="16" y1="17" x2="8" y2="17"/>
        <polyline points="10 9 9 9 8 9"/>
      </svg>
      {label}
    </button>
  );
}
