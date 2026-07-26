/**
 * usePdfCover.js
 *
 * Hook de React que genera una miniatura de la portada de un archivo PDF
 * usando la libreria pdfjs-dist. Implementa carga diferida mediante
 * IntersectionObserver para no procesar PDFs que no estan visibles en pantalla.
 *
 * Arquitectura interna:
 *
 *   Cache en memoria (Map)
 *     Almacena el resultado de cada URL procesada para no volver a renderizar
 *     el mismo PDF si el componente se desmonta y vuelve a montar.
 *
 *   Cola de concurrencia (maximo 3 en paralelo)
 *     Limita cuantos PDFs se procesan al mismo tiempo para no saturar el hilo
 *     principal del navegador. Las peticiones adicionales se encolan y se
 *     procesan en orden a medida que se liberan los slots.
 *
 *   Deduplicacion de peticiones en vuelo
 *     Si dos componentes solicitan la miniatura del mismo URL al mismo tiempo,
 *     solo se lanza una peticion real. Ambos componentes reciben el mismo resultado
 *     cuando la promesa se resuelve.
 *
 *   Singleton de pdfjs
 *     La libreria pdfjs-dist se importa de forma dinamica una sola vez y se
 *     reutiliza en todas las llamadas posteriores.
 *
 * Parametros del hook:
 *   url          - URL del archivo PDF a procesar
 *   containerRef - ref del elemento DOM contenedor. Si se proporciona, el hook
 *                  usa IntersectionObserver para esperar a que el elemento sea
 *                  visible antes de encolar el procesamiento (lazy load).
 *                  Si no se proporciona, encola inmediatamente.
 *
 * Retorna:
 *   imgSrc  - string con la imagen en formato data URL (JPEG), o null si aun
 *             no esta lista o si ocurrio un error
 *   loading - booleano que indica si la miniatura esta siendo generada
 *   error   - booleano que indica si el procesamiento fallo
 */
import { useEffect, useState, useRef } from "react";

// ── Cache permanente en memoria ───────────────────────────────────
const cache = new Map();
// Promesas en vuelo para deduplicar peticiones concurrentes al mismo URL
const inflight = new Map();

// ── Cola de concurrencia (máx 3) ──────────────────────────────────
const MAX_CONCURRENT = 3;
let running = 0;
const queue = [];

function dequeue() {
  if (running >= MAX_CONCURRENT || queue.length === 0) return;
  running++;
  const { url, resolve } = queue.shift();
  processUrl(url).then(result => {
    cache.set(url, result);
    inflight.delete(url);
    resolve(result);
    running--;
    dequeue();
  });
}

function enqueue(url) {
  if (cache.has(url)) return Promise.resolve(cache.get(url));
  // Reutilizar promesa en vuelo para el mismo URL
  if (inflight.has(url)) return inflight.get(url);
  const p = new Promise(resolve => {
    queue.push({ url, resolve });
    dequeue();
  });
  inflight.set(url, p);
  return p;
}

// ── pdfjs singleton ───────────────────────────────────────────────
let pdfjsLib = null;
async function getPdfjs() {
  if (pdfjsLib) return pdfjsLib;
  const mod = await import("pdfjs-dist");
  mod.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.mjs",
    import.meta.url
  ).href;
  pdfjsLib = mod;
  return pdfjsLib;
}

async function processUrl(url, targetWidth = 160) {
  try {
    const pdfjs = await getPdfjs();
    const pdf   = await pdfjs.getDocument({ url, withCredentials: false }).promise;
    const page  = await pdf.getPage(1);
    const vp0   = page.getViewport({ scale: 1 });
    const vp    = page.getViewport({ scale: targetWidth / vp0.width });
    const canvas = document.createElement("canvas");
    canvas.width  = vp.width;
    canvas.height = vp.height;
    await page.render({ canvasContext: canvas.getContext("2d"), viewport: vp }).promise;
    pdf.destroy();
    return { imgSrc: canvas.toDataURL("image/jpeg", 0.72), error: false };
  } catch {
    return { imgSrc: null, error: true };
  }
}

// ── Hook público con lazy load por IntersectionObserver ───────────
export function usePdfCover(url, containerRef) {
  const cached = url ? cache.get(url) : null;
  const [state,   setState]   = useState(cached ?? { imgSrc: null, error: false });
  const [loading, setLoading] = useState(!cached);
  const enqueuedRef = useRef(false);

  useEffect(() => {
    if (!url) return;
    if (cache.has(url)) {
      setState(cache.get(url));
      setLoading(false);
      return;
    }

    const trigger = () => {
      if (enqueuedRef.current) return;
      enqueuedRef.current = true;
      let cancelled = false;
      enqueue(url).then(result => {
        if (!cancelled) { setState(result); setLoading(false); }
      });
      return () => { cancelled = true; };
    };

    // Si hay ref de contenedor, usar IntersectionObserver
    const el = containerRef?.current;
    if (el && "IntersectionObserver" in window) {
      const obs = new IntersectionObserver(([entry]) => {
        if (entry.isIntersecting) { obs.disconnect(); trigger(); }
      }, { rootMargin: "200px" });
      obs.observe(el);
      return () => obs.disconnect();
    }

    // Sin ref: encolar inmediatamente
    return trigger();
  }, [url, containerRef]);

  return { imgSrc: state.imgSrc, loading, error: state.error };
}
