/** 
 * Barra de paginación compartida por las interfaces con tabla
 * (Historial de Insumos, Personal, Inventario, Historial de Incidencias,
 * Solicitudes de Insumos, ...). Mismo diseño responsivo en todas:
 *   ‹ Ant · n / m · Sig ›   +   selector "Mostrar" [10|25|50|100]
 *
 * Paleta de variantes:
 *   - "table"   : barra de paginación en el footer de la tabla.
 *                 layout:  flex items-center justify-between  (ver props below)
 *   - "bottom"  : barra inferior del listado.
 *                 layout:  flex flex-wrap items-center justify-between gap-2
 *
 * Props:
 *   total          — total de ítems (>= 0); se calcula totalPages internamente
 *   page           — página actual (ya normalizada por el padre)
 *   pageSize       — registros por página
 *   onPageChange   — callback al cambiar de página
 *   onPageSizeChange — callback al cambiar el tamaño de página (resetea a 1)
 *   T              — tokens del tema (border / bg / text / surfaceAlt / surface / textMuted)
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

  const irPagina = (p) => {
    if (p >= 1 && p <= totalPages) onPageChange(p);
  };

  // Estilos base aplicables a cualquier variante
  const base = {
    borderTop: `1px solid ${T.border}`,
    flexShrink: 0,
  };

  // Alineación principal — varía según variant
  const containerStyle = variant === "table"
    ? { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }
    : { display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 2 };

  // Estilos comunes a botones de navegación
  const btnBase = {
    borderColor: T.border,
    background: T.surfaceAlt,
    color: T.text,
    borderRadius: 6,
  };

  return (
    <div style={{ ...containerStyle, ...base }}>
      <div style={{ display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
        <button
          disabled={page <= 1 || cargando}
          onClick={() => irPagina(page - 1)}
          style={{
            ...btnBase,
            padding: "4px 10px",
            fontSize: 11,
            fontWeight: 600,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 4,
          }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ flexShrink: 0 }}>
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Ant
        </button>

        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: T.textMuted,
            minWidth: 36,
            textAlign: "center",
          }}
        >
          {page} / {totalPages}
        </span>

        <button
          disabled={page >= totalPages || cargando}
          onClick={() => irPagina(page + 1)}
          style={{
            ...btnBase,
            padding: "4px 10px",
            fontSize: 11,
            fontWeight: 600,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 4,
          }}
        >
          Sig
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ flexShrink: 0 }}>
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 4, flexWrap: "wrap" }}>
        <label style={{ fontSize: 10, fontWeight: 600, color: T.textMuted, margin: 0 }}>
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
          style={{
            fontSize: 11,
            padding: "3px 6px",
            borderRadius: 6,
            border: `1px solid ${T.border}`,
            background: T.surface,
            color: T.text,
            cursor: "pointer",
            minWidth: 56,
          }}
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
