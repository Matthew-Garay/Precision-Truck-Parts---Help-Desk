/**
 * generarPortada.js
 * Renderiza la primera página de un PDF en el backend usando pdfjs-dist + canvas.
 * Guarda el resultado como JPG en storage/Portadas/ y retorna la ruta relativa.
 */
import path         from "path";
import fs           from "fs";
import { fileURLToPath } from "url";
import { createCanvas }  from "canvas";

const __dirname    = path.dirname(fileURLToPath(import.meta.url));
export const PORTADAS_DIR = path.resolve(__dirname, "../../../storage/Portadas");
fs.mkdirSync(PORTADAS_DIR, { recursive: true });

let pdfjsLib = null;
async function getPdfjs() {
  if (pdfjsLib) return pdfjsLib;
  const mod = await import("pdfjs-dist/legacy/build/pdf.mjs");
  // En Node no hay worker — usar modo sin worker
  mod.GlobalWorkerOptions.workerSrc = false;
  pdfjsLib = mod;
  return pdfjsLib;
}

/**
 * @param {string} pdfAbsPath  Ruta absoluta al archivo PDF
 * @param {string} nombreBase  Nombre base sin extensión (para el JPG)
 * @returns {Promise<string|null>} Ruta relativa "/storage/Portadas/xxx.jpg" o null si falla
 */
export async function generarPortada(pdfAbsPath, nombreBase) {
  const destPath = path.join(PORTADAS_DIR, `${nombreBase}.jpg`);
  // Si ya existe, no regenerar
  try { await fs.promises.access(destPath); return `/storage/Portadas/${nombreBase}.jpg`; } catch {}

  try {
    const pdfjs  = await getPdfjs();
    const data   = new Uint8Array(await fs.promises.readFile(pdfAbsPath));
    const pdf    = await pdfjs.getDocument({ data, useWorkerFetch: false, isEvalSupported: false, useSystemFonts: true }).promise;
    const page   = await pdf.getPage(1);
    const vp0    = page.getViewport({ scale: 1 });
    const scale  = 160 / vp0.width;
    const vp     = page.getViewport({ scale });

    const canvas  = createCanvas(Math.round(vp.width), Math.round(vp.height));
    const ctx     = canvas.getContext("2d");

    await page.render({
      canvasContext: ctx,
      viewport: vp,
      canvasFactory: {
        create: (w, h) => { const c = createCanvas(w, h); return { canvas: c, context: c.getContext("2d") }; },
        reset:  (obj, w, h) => { obj.canvas.width = w; obj.canvas.height = h; },
        destroy: () => {},
      },
    }).promise;

    pdf.destroy();
    await fs.promises.writeFile(destPath, canvas.toBuffer("image/jpeg", { quality: 0.75 }));
    return `/storage/Portadas/${nombreBase}.jpg`;
  } catch (e) {
    console.error("[generarPortada] error:", e.message);
    return null;
  }
}
