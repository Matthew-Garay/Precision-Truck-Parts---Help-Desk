/**
 * miniatura.js — Foto chica de un insumo para listas y tablas.
 *
 * Cada foto /storage/Insumos/<nombre>.<ext> tiene su miniatura de 128 px en
 * /storage/Insumos/min/<nombre>.webp (≈2 KB en vez de ≈50–500 KB). Si la
 * miniatura no existe, la imagen cae sola a la foto completa.
 *
 *   <img {...fotoMini(insumo.imagen_url)} alt="" />
 *
 * @module client/utils/miniatura
 */
const RE_INSUMO = /^(.*\/storage\/Insumos\/)([^/?#]+)\.[a-z0-9]+$/i;

/** URL de la miniatura (o la misma URL si no es una foto de insumo). */
export function miniatura(url) {
  if (!url) return url;
  const m = String(url).match(RE_INSUMO);
  return m ? `${m[1]}min/${m[2]}.webp` : url;
}

/** Props para <img>: miniatura con respaldo a la foto completa si falla. */
export function fotoMini(url) {
  const mini = miniatura(url);
  return {
    src: mini || undefined,
    loading: "lazy",
    decoding: "async",
    onError: mini && mini !== url
      ? (e) => { if (e.currentTarget.dataset.completa !== "1") { e.currentTarget.dataset.completa = "1"; e.currentTarget.src = url; } }
      : undefined,
  };
}
