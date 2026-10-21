/**
 * Barra de paginación compartida por las interfaces con tabla.
 * Diseño moderno, consistente y responsivo.
 *
 * Props:
 *   total          — total de ítems (>= 0)
 *   page           — página actual (normalizada por el padre)
 *   pageSize       — registros por página
 *   onPageChange   — callback al cambiar de página
 *   onPageSizeChange — callback al cambiar el tamaño de página (resetea a 1)
 *   T              — tokens del tema (border / surface / surfaceAlt / text / textMain / textMuted / isDark)
 *   variant        — "table" | "bottom" (default: "bottom")
 *   cargando       — opcional; deshabilita la navegación mientras carga
 */
export default function Paginacion({
  total,
  page,
  pageSize,
  onPageChange,
  onPageSizeChange,
  T,
  variant = "bottom",
  cargando = false,
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const isDark = T?.isDark ?? false;

  // Fallbacks defensivos para tokens del tema (evita errores si T o alguna clave es undefined)
  const textMain = T?.text ?? T?.textMain ?? (isDark ? "#e2e8f0" : "#1a202c");
  const textMuted = T?.textMuted ?? (isDark ? "#94a3b8" : "#64748b");
  const surfaceAlt = T?.surfaceAlt ?? (isDark ? "#1e2330" : "#f8fafc");
  const surface = T?.surface ?? (isDark ? "#0f1420" : "#ffffff");
  const border = T?.border ?? (isDark ? "rgba(255,255,255,0.08)" : "#e2e8f0");

  const irPagina = (p) => {
    if (p >= 1 && p <= totalPages && !cargando) onPageChange(p);
  };

  // ─── Estilos base ───
  const containerStyle = {
    borderTop: `1px solid ${border}`,
    padding: "12px 16px",
    flexShrink: 0,
    background: surface,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 12,
  };

  // Botones de navegación (Ant / Sig)
  const navBtn = (disabled) => ({
    border: `1px solid ${border}`,
    background: surfaceAlt,
    color: textMain,
    borderRadius: 8,
    padding: "6px 14px",
    fontSize: 12,
    fontWeight: 600,
    cursor: disabled ? "not-allowed" : "pointer",
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    transition: "all 0.2s ease",
    userSelect: "none",
    opacity: disabled ? 0.5 : 1,
  });

  // Indicador de página actual
  const pageIndicator = {
    fontSize: 12,
    fontWeight: 700,
    color: textMuted,
    minWidth: 44,
    textAlign: "center",
  };

  // Selector de cantidad (Mostrar X)
  const selectStyle = {
    fontSize: 12,
    padding: "6px 10px",
    borderRadius: 8,
    border: `1px solid ${border}`,
    background: surface,
    color: textMain,
    cursor: "pointer",
    minWidth: 56,
    outline: "none",
  };

  const labelStyle = {
    fontSize: 11,
    fontWeight: 600,
    color: textMuted,
    margin: 0,
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  };

  const svgSize = { width: 14, height: 14, flexShrink: 0 };

  return (
    <div style={containerStyle}>
      {/* ─── Lado izquierdo: navegación Ant / Sig ─── */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        <button
          disabled={page <= 1 || cargando}
          onClick={() => irPagina(page - 1)}
          style={navBtn(page <= 1 || cargando)}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={svgSize}>
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Ant
        </button>

        <span style={pageIndicator}>
          {page} / {totalPages}
        </span>

        <button
          disabled={page >= totalPages || cargando}
          onClick={() => irPagina(page + 1)}
          style={navBtn(page >= totalPages || cargando)}
        >
          Sig
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={svgSize}>
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>

      {/* ─── Lado derecho: selector de cantidad ─── */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        <label style={labelStyle}>
          Mostrar
        </label>
        <select
          value={pageSize}
          onChange={(e) => {
            const n = parseInt(e.target.value, 10);
            if (!isNaN(n)) {
              onPageSizeChange(n);
              onPageChange(1);
            }
          }}
          style={selectStyle}
        >
          {[10, 25, 50, 100].map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}