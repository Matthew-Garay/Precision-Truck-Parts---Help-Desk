/**
 * Paginacion.jsx
 *
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
 *
 * @module client/components/Paginacion
 * @requires ../utils/tipografia.js
 * @exports Paginacion (default)
 */
import { FS } from '../utils/tipografia.js';
/** Lista de páginas a mostrar con elipsis: 1 … 4 5 [6] 7 8 … 20 */
function paginasVisibles(actual, total, vecinos = 1) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const desde = Math.max(2, actual - vecinos);
  const hasta = Math.min(total - 1, actual + vecinos);
  const out = [1];
  if (desde > 2) out.push("…");
  for (let p = desde; p <= hasta; p++) out.push(p);
  if (hasta < total - 1) out.push("…");
  out.push(total);
  return out;
}

export default function Paginacion({
  total,
  page,
  pageSize,
  onPageChange,
  onPageSizeChange,
  T,
  cargando = false,
}) {
  const totalPages = Math.max(1, Math.ceil((Number(total) || 0) / pageSize));
  const actual = Math.min(Math.max(1, page), totalPages);
  const isDark = T?.isDark ?? false;

  // Fallbacks defensivos para tokens del tema (evita errores si T o alguna clave es undefined)
  const textMain  = T?.text ?? T?.textMain ?? (isDark ? "#e2e8f0" : "#1a202c");
  const textMuted = T?.textMuted ?? (isDark ? "#94a3b8" : "#64748b");
  const surface   = T?.surface ?? (isDark ? "#0f1420" : "#ffffff");
  const border    = T?.border ?? (isDark ? "rgba(255,255,255,0.08)" : "#e2e8f0");
  const ACENTO    = "#F47920";

  const irPagina = (p) => {
    if (p >= 1 && p <= totalPages && p !== actual && !cargando) onPageChange(p);
  };

  const desde = total > 0 ? (actual - 1) * pageSize + 1 : 0;
  const hasta = Math.min(actual * pageSize, total || 0);

  // ─── Estilos (compactos: 28 px de alto, texto 11–12 px) ───
  const contenedor = {
    borderTop: `1px solid ${border}`,
    padding: "6px 12px",
    flexShrink: 0,
    background: surface,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: "6px 12px",
    fontSize: FS.secundario,
    color: textMuted,
  };
  const btn = (activo, deshabilitado) => ({
    minWidth: 28,
    height: 28,
    padding: "0 7px",
    borderRadius: 6,
    border: `1px solid ${activo ? ACENTO : border}`,
    background: activo ? ACENTO : "transparent",
    color: activo ? "#fff" : textMain,
    fontSize: FS.secundario,
    fontWeight: activo ? 700 : 500,
    fontVariantNumeric: "tabular-nums",
    cursor: deshabilitado ? "default" : "pointer",
    opacity: deshabilitado ? 0.35 : 1,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    userSelect: "none",
    transition: "background .15s, border-color .15s",
  });
  const flecha = (d) => (
    <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
      {d.includes("M") ? <path d={d} /> : <polyline points={d} />}
    </svg>
  );

  const enPrimera = actual <= 1 || cargando;
  const enUltima  = actual >= totalPages || cargando;

  return (
    <nav aria-label="Paginación" style={contenedor}>
      {/* Rango de registros visibles */}
      <span style={{ fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>
        {total > 0
          ? <><strong style={{ color: textMain, fontWeight: 600 }}>{desde}–{hasta}</strong> de <strong style={{ color: textMain, fontWeight: 600 }}>{total}</strong></>
          : "Sin registros"}
      </span>

      {/* Navegación: « ‹ 1 … 4 [5] 6 … 20 › » */}
      <div style={{ display: "flex", alignItems: "center", gap: 3, flexWrap: "wrap" }}>
        <button type="button" aria-label="Primera página" title="Primera página" disabled={enPrimera}
          onClick={() => irPagina(1)} style={btn(false, enPrimera)}>{flecha("M11 17l-5-5 5-5M18 17l-5-5 5-5")}</button>
        <button type="button" aria-label="Página anterior" title="Anterior" disabled={enPrimera}
          onClick={() => irPagina(actual - 1)} style={btn(false, enPrimera)}>{flecha("15 18 9 12 15 6")}</button>

        {paginasVisibles(actual, totalPages).map((p, i) =>
          p === "…"
            ? <span key={`e${i}`} style={{ minWidth: 16, textAlign: "center" }}>…</span>
            : <button key={p} type="button" aria-label={`Página ${p}`} aria-current={p === actual ? "page" : undefined}
                onClick={() => irPagina(p)} disabled={cargando} style={btn(p === actual, cargando)}>{p}</button>
        )}

        <button type="button" aria-label="Página siguiente" title="Siguiente" disabled={enUltima}
          onClick={() => irPagina(actual + 1)} style={btn(false, enUltima)}>{flecha("9 18 15 12 9 6")}</button>
        <button type="button" aria-label="Última página" title="Última página" disabled={enUltima}
          onClick={() => irPagina(totalPages)} style={btn(false, enUltima)}>{flecha("M13 17l5-5-5-5M6 17l5-5-5-5")}</button>
      </div>

      {/* Filas por página */}
      {onPageSizeChange && (
        <label style={{ display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap", margin: 0 }}>
          Filas
          <select
            value={pageSize}
            onChange={(e) => {
              const n = parseInt(e.target.value, 10);
              if (!isNaN(n)) { onPageSizeChange(n); onPageChange(1); }
            }}
            style={{ height: 28, fontSize: FS.secundario, padding: "0 6px", borderRadius: 6, border: `1px solid ${border}`,
              background: surface, color: textMain, cursor: "pointer", outline: "none" }}
          >
            {[10, 25, 50, 100].map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </label>
      )}
    </nav>
  );
}
