/**
 * resaltar.js
 *
 * Divide un texto en partes para marcar las palabras buscadas, ignorando
 * acentos y mayúsculas igual que el buscador del servidor
 * (server/utils/busqueda-conocimiento.js): "toner" marca "Tóner".
 *
 * @module client/utils/resaltar
 * @exports normalizar
 * @exports partesResaltadas
 */

/** Minúsculas, sin acentos ni signos, del MISMO largo que el original. */
export function normalizar(texto) {
  let out = "";
  for (const c of String(texto ?? "")) {
    if (c.length !== 1) { out += " ".repeat(c.length); continue; }
    const ch = c.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase()[0] ?? " ";
    out += /[a-z0-9]/.test(ch) ? ch : " ";
  }
  return out;
}

/**
 * @param {string} texto  texto a mostrar
 * @param {string} q      búsqueda del usuario
 * @returns {{texto: string, marca: boolean}[]}
 */
export function partesResaltadas(texto, q) {
  const s = String(texto ?? "");
  const terms = [...new Set(normalizar(q).split(/\s+/).filter(t => t.length >= 2))];
  if (!s || !terms.length) return [{ texto: s, marca: false }];
  const n = normalizar(s);
  const marcas = new Array(s.length).fill(false);
  for (const t of terms) {
    let i = n.indexOf(t);
    while (i !== -1) { marcas.fill(true, i, i + t.length); i = n.indexOf(t, i + t.length); }
  }
  const partes = [];
  for (let i = 0; i < s.length; i++) {
    const ult = partes[partes.length - 1];
    if (ult && ult.marca === marcas[i]) ult.texto += s[i];
    else partes.push({ texto: s[i], marca: marcas[i] });
  }
  return partes;
}
