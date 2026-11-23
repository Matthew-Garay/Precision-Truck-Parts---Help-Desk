/**
 * texto-pdf.js
 *
 * Extrae el texto de un PDF con pdfjs-dist (el mismo paquete que usa el
 * navegador para las portadas; la versión "legacy" corre en Node sin canvas).
 * Las páginas se separan con \f para que el buscador sepa en qué página está
 * cada coincidencia.
 *
 * Un PDF escaneado (solo imágenes) devuelve "" — no tiene texto que buscar.
 *
 * @module server/utils/texto-pdf
 * @requires fs
 * @requires pdfjs-dist
 * @exports extraerTextoPdf
 */
import fs from "fs";

/** Límites para que un PDF enorme no acapare memoria ni la columna MEDIUMTEXT. */
const MAX_PAGINAS = 500;
const MAX_CARACTERES = 3_000_000;

let _pdfjs = null;
async function pdfjs() {
  // Import diferido: solo se carga cuando hay un PDF que leer.
  _pdfjs ??= await import("pdfjs-dist/legacy/build/pdf.mjs");
  return _pdfjs;
}

/**
 * @param {string} ruta  ruta absoluta del PDF en disco
 * @returns {Promise<string>} texto con páginas separadas por \f
 */
export async function extraerTextoPdf(ruta) {
  const { getDocument } = await pdfjs();
  const data = new Uint8Array(await fs.promises.readFile(ruta));
  // Se libera con la tarea de carga (en pdfjs 6 el documento ya no tiene destroy()).
  const tarea = getDocument({ data, isEvalSupported: false, useSystemFonts: false, verbosity: 0 });
  try {
    const doc = await tarea.promise;
    const paginas = [];
    let total = 0;
    const n = Math.min(doc.numPages, MAX_PAGINAS);
    for (let i = 1; i <= n && total < MAX_CARACTERES; i++) {
      const page = await doc.getPage(i);
      const { items } = await page.getTextContent();
      let txt = "";
      for (const it of items) txt += (it.str ?? "") + (it.hasEOL ? "\n" : " ");
      txt = txt.replace(/[ \t]+/g, " ").replace(/\n\s*\n+/g, "\n").trim();
      paginas.push(txt);
      total += txt.length;
      page.cleanup();
    }
    const texto = paginas.join("\f").slice(0, MAX_CARACTERES);
    // Sin texto real (escaneado): solo separadores y espacios.
    return /[\p{L}\p{N}]/u.test(texto) ? texto : "";
  } finally {
    await tarea.destroy();
  }
}
