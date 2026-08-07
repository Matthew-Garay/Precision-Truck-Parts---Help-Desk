/**
 * pdfjs.js — Configuración central de PDF.js (pdfjs-dist)
 *
 * Este módulo configura el worker de PDF.js y los parámetros de renderizado.
 * Se usa en PdfViewer.jsx y en el hook usePdfCover.js.
 *
 * Importante: Vite copia el worker a /assets/ en producción y lo sirve
 * desde ahí en desarrollo vía el sufijo `?url`. Los archivos .wasm se
 * cargan desde la misma ubicación para el soporte de OpenJPEG (JPEG2000).
 */
import * as pdfjs from "pdfjs-dist";
import workerUrl from "pdfjs-dist/build/pdf.worker.mjs?url";

// Asignar el URL del worker resuelto por Vite
pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;

// Derivar la carpeta wasm/ desde la URL del worker.
// En desarrollo, Vite sirve los archivos desde node_modules.
// En producción, los archivos .wasm se copian a /assets/ por Vite.
// Usamos la ruta relativa correcta desde src/Frontend/Config/ hasta node_modules.
// Importante: agregar slash final para evitar error "Invalid factory url"
const wasmUrl = new URL("../../../node_modules/pdfjs-dist/wasm/", import.meta.url).href.replace(/\/?$/, "/");

export const PDFJS_PARAMS = {
  // No descargar los archivos con fetch del worker (evita problemas de CORS)
  useWorkerFetch: false,
  // Deshabilitar eval() para cumplir CSP estricto
  isEvalSupported: false,
  // Usar fuentes del sistema cuando el PDF no embebe las suyas
  useSystemFonts: true,
  // Ruta de los binarios .wasm (OpenJPEG y otras dependencias nativas)
  wasmUrl,
  // Mejora el rendimiento en dispositivos con poca memoria
  disableFontFace: false,
  // Permitir cargar datos directamente (ya los pasamos como Uint8Array)
  disableRange: true,
  // Evita múltiples descargas del mismo documento
  disableAutoFetch: true,
  // Worker streaming desactivado para evitar problemas de caché
  verbosity: 0,
};

export default pdfjs;