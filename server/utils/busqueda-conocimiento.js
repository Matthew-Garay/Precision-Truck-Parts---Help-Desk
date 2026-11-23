/**
 * busqueda-conocimiento.js
 *
 * Buscador de la base de conocimiento (artículos de texto y PDF). Son funciones
 * puras: reciben los documentos ya cargados y devuelven los resultados
 * ordenados, así que se prueban sin base de datos.
 *
 * Por qué en JavaScript y no con FULLTEXT de MySQL: el volumen es chico (cientos
 * de documentos) y así se consigue lo que FULLTEXT no da sin configurar el
 * servidor: ignorar acentos y mayúsculas, encontrar palabras incompletas
 * ("impre" → "impresora"), no depender de la lista de palabras vacías en inglés
 * de InnoDB y devolver un fragmento del texto con su número de página.
 *
 * Normalización 1:1: `normalizar()` devuelve una cadena del MISMO largo que la
 * original (cada carácter se convierte en exactamente uno), así una posición
 * encontrada en el texto normalizado sirve tal cual para cortar el original.
 *
 * Puntuación por término: título 10 (+4 si empieza palabra), etiquetas 6,
 * categoría 3, resumen 3, cuerpo 1 por aparición (máx. 5). Gana primero el
 * documento que contiene MÁS términos distintos y luego el de más puntos.
 *
 * @module server/utils/busqueda-conocimiento
 * @exports normalizar
 * @exports terminos
 * @exports prepararDocumento
 * @exports buscar
 * @exports fragmento
 */

/** Palabras muy comunes en español que no ayudan a encontrar nada. */
const VACIAS = new Set(`
  de la el en y a los las del un una unos unas por para con sin que se no es mi me lo al
  como o u su sus mas ya hay le les tu te nos este esta esto ese esa eso son fue ser muy
  pero si porque cuando donde cual quien tengo tiene tenemos puedo puede hacer hago favor
  ayuda problema hola buenas buenos dias tardes noches gracias necesito favor
`.split(/\s+/).filter(Boolean));

/** Convierte un carácter en exactamente uno: minúscula, sin acento, o espacio. */
function normChar(c) {
  const base = c.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  const ch = base[0] ?? " ";
  return /[a-z0-9ñ]/.test(ch) ? ch : (c === "ñ" || c === "Ñ" ? "n" : " ");
}

/** Texto en minúsculas, sin acentos y sin signos, del MISMO largo que el original. */
export function normalizar(texto) {
  const s = String(texto ?? "");
  let out = "";
  for (const c of s) {
    // Los caracteres fuera del plano básico ocupan 2 posiciones en JS:
    // se rellenan con espacios para conservar el largo.
    out += c.length === 1 ? normChar(c) : " ".repeat(c.length);
  }
  return out;
}

/** Términos útiles de una búsqueda: sin repetir, sin palabras vacías, máx. 8. */
export function terminos(q) {
  const lista = normalizar(q).split(/\s+/).filter(t => t.length >= 2 && !VACIAS.has(t));
  return [...new Set(lista)].slice(0, 8);
}

/** Quita la sintaxis de Markdown que no es texto (URLs de enlaces e imágenes). */
function textoDeMarkdown(md) {
  return String(md ?? "")
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1");
}

/**
 * Precalcula los campos normalizados de un documento para buscar rápido.
 * doc: { tipo, id, titulo, resumen, etiquetas, nombre_categoria, cuerpo, ... }
 * `cuerpo` es el Markdown del artículo o el texto del PDF (páginas con \f).
 */
export function prepararDocumento(doc) {
  const cuerpo = doc.tipo === "articulo" ? textoDeMarkdown(doc.cuerpo) : String(doc.cuerpo ?? "");
  return {
    ...doc,
    cuerpo,
    _n: {
      titulo:    normalizar(doc.titulo),
      etiquetas: normalizar(doc.etiquetas),
      categoria: normalizar(doc.nombre_categoria),
      resumen:   normalizar(doc.resumen),
      cuerpo:    normalizar(cuerpo),
    },
  };
}

/** Cuántas veces aparece `t` en `s` (hasta `max`). */
function contar(s, t, max) {
  let n = 0, i = s.indexOf(t);
  while (i !== -1 && n < max) { n++; i = s.indexOf(t, i + t.length); }
  return n;
}

/** ¿`t` aparece al inicio de alguna palabra de `s`? */
const empiezaPalabra = (s, t) => s.startsWith(t) || s.includes(" " + t);

function puntuar(d, terms) {
  let puntos = 0, encontrados = 0;
  for (const t of terms) {
    const n = d._n;
    let p = 0;
    if (n.titulo.includes(t))    p += 10 + (empiezaPalabra(n.titulo, t) ? 4 : 0);
    if (n.etiquetas.includes(t)) p += 6;
    if (n.categoria.includes(t)) p += 3;
    if (n.resumen.includes(t))   p += 3;
    p += contar(n.cuerpo, t, 5);
    if (p > 0) { encontrados++; puntos += p; }
  }
  return { puntos, encontrados };
}

/**
 * Fragmento de ~`largo` caracteres alrededor de la primera coincidencia en el
 * cuerpo, con su número de página (solo PDF). Si no hay coincidencia en el
 * cuerpo devuelve el inicio del texto.
 */
export function fragmento(original, normal, terms, largo = 220) {
  const texto = String(original ?? "");
  if (!texto.trim()) return { texto: "", pagina: null };
  let pos = -1;
  for (const t of terms) {
    const i = normal.indexOf(t);
    if (i !== -1 && (pos === -1 || i < pos)) pos = i;
  }
  const pagina = pos === -1 ? null : (texto.slice(0, pos).match(/\f/g)?.length ?? 0) + 1;
  const desde = pos === -1 ? 0 : Math.max(0, pos - Math.floor(largo / 3));
  let corte = texto.slice(desde, desde + largo);
  // Empezar y terminar en palabra completa.
  if (desde > 0) corte = corte.replace(/^\S*\s/, "");
  if (desde + largo < texto.length) corte = corte.replace(/\s\S*$/, "");
  corte = corte.replace(/[\f\s]+/g, " ").replace(/[#>*_`]+/g, "").trim();
  return {
    texto: (desde > 0 ? "… " : "") + corte + (desde + largo < texto.length ? " …" : ""),
    pagina,
  };
}

/**
 * Busca en los documentos preparados.
 * @param {object[]} docs     resultado de prepararDocumento()
 * @param {string}   q        texto buscado
 * @param {object}   [opc]    { limite = 30 }
 * @returns {object[]} documentos (sin `_n` ni `cuerpo`) con puntos, fragmento y página
 */
export function buscar(docs, q, { limite = 30 } = {}) {
  const terms = terminos(q);
  if (!terms.length) return [];
  // Con 3+ términos basta con que coincida la mayoría: "no imprime la impresora
  // de recepción" debe encontrar el artículo de la impresora aunque no diga "recepción".
  const minimo = terms.length >= 3 ? Math.ceil(terms.length / 2) : 1;
  const res = [];
  for (const d of docs) {
    const { puntos, encontrados } = puntuar(d, terms);
    if (encontrados < minimo) continue;
    const { _n, cuerpo, ...pub } = d;
    const fr = fragmento(cuerpo, _n.cuerpo, terms);
    res.push({
      ...pub,
      puntos,
      coincidencias: encontrados,
      fragmento: fr.texto || pub.resumen || "",
      pagina: d.tipo === "pdf" ? fr.pagina : null,
    });
  }
  res.sort((a, b) => b.coincidencias - a.coincidencias || b.puntos - a.puntos);
  return res.slice(0, limite);
}
