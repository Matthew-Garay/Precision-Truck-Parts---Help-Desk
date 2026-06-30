/**
 * usePdfCover.js
 *
 * Hook que genera una imagen miniatura de la portada (primera página)
 * de un archivo PDF usando pdfjs-dist con carga lazy.
 *
 * @param {string|null} url - URL del PDF a renderizar
 * @returns {{ imgSrc: string|null, loading: boolean, error: boolean }}
 */
import { useEffect, useState } from "react";

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

export function usePdfCover(url) {
  const [imgSrc,  setImgSrc]  = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(false);

  useEffect(() => {
    if (!url) return;
    let cancelled = false;
    setLoading(true);
    setError(false);
    setImgSrc(null);

    (async () => {
      try {
        const pdfjs  = await getPdfjs();
        const pdf    = await pdfjs.getDocument({ url, withCredentials: false }).promise;
        if (cancelled) return;
        const page   = await pdf.getPage(1);
        if (cancelled) return;
        const vp0    = page.getViewport({ scale: 1 });
        const vp     = page.getViewport({ scale: 200 / vp0.width });
        const canvas = document.createElement("canvas");
        canvas.width  = vp.width;
        canvas.height = vp.height;
        await page.render({ canvasContext: canvas.getContext("2d"), viewport: vp }).promise;
        if (!cancelled) { setImgSrc(canvas.toDataURL("image/jpeg", 0.85)); setLoading(false); }
      } catch (e) {
        console.error("[usePdfCover]", e);
        if (!cancelled) { setLoading(false); setError(true); }
      }
    })();

    return () => { cancelled = true; };
  }, [url]);

  return { imgSrc, loading, error };
}
