/**
 * Barra de paginación compartida por las interfaces con tabla
 * (Personal, Historial de Insumos, ...). Mismo diseño en todas:
 *   ‹ Ant · n / m · Sig ›   +   selector "Mostrar" [10|25|50|100]
 *
 * Props:
 *   pagina        — página actual (ya normalizada por el padre)
 *   setPagina     — setter de la página
 *   totalPaginas  — total de páginas (>= 1)
 *   pageSize      — registros por página
 *   setPageSize   — setter de registros por página (resetea a página 1)
 *   T             — tokens del tema (border / bg / text / surfaceAlt / surface / textMuted)
 *   cargando      — opcional; deshabilita la navegación mientras carga
 */
export default function Paginacion({ pagina, setPagina, totalPaginas, pageSize, setPageSize, T, cargando = false }) {
  const irPagina = p => { if (p >= 1 && p <= totalPaginas) setPagina(p); };

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2" style={{ borderTop: `1px solid ${T.border}`, background: T.bg, flexShrink: 0 }}>
      <div className="flex items-center gap-1.5">
        <button disabled={pagina <= 1 || cargando} onClick={() => irPagina(pagina - 1)}
          className="px-2 py-1 rounded border text-[11px] disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ borderColor: T.border, background: T.surfaceAlt, color: T.text }}>
          ‹ Ant
        </button>
        <span className="text-[11px] px-1" style={{ color: T.textMuted }}>{pagina} / {totalPaginas}</span>
        <button disabled={pagina >= totalPaginas || cargando} onClick={() => irPagina(pagina + 1)}
          className="px-2 py-1 rounded border text-[11px] disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ borderColor: T.border, background: T.surfaceAlt, color: T.text }}>
          Sig ›
        </button>
      </div>
      <div className="flex items-center gap-2">
        <label className="text-[10px]" style={{ color: T.textMuted }}>Mostrar</label>
        <select value={pageSize} onChange={e => { setPageSize(parseInt(e.target.value, 10)); setPagina(1); }}
          className="text-[11px]" style={{ padding: "3px 6px", borderRadius: 6, border: `1px solid ${T.border}`, background: T.surface, color: T.text }}>
          {[10, 25, 50, 100].map(n => <option key={n} value={n}>{n}</option>)}
        </select>
      </div>
    </div>
  );
}
