import * as pdfjs from "pdfjs-dist";
import workerUrl from "pdfjs-dist/build/pdf.worker.mjs?url";

pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;

// Derivar la carpeta wasm/ desde la URL del worker que Vite ya resolvió.
// En dev:  /node_modules/.vite/deps/pdfjs-dist... → reemplazamos por la ruta real
// En prod: el worker queda en assets/, los wasm también quedan copiados ahí
const wasmUrl = new URL("../../../node_modules/pdfjs-dist/wasm/", import.meta.url).href;

export const PDFJS_PARAMS = {
  useWorkerFetch:  false,
  isEvalSupported: false,
  useSystemFonts:  true,
  wasmUrl,
};

export default pdfjs;
