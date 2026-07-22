/**
 * usePdfCover.js — con Intersection Observer
 * Solo encola la miniatura cuando la tarjeta entra en el viewport.
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
