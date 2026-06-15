import { useEffect, useState } from "react";

let pdfjsLib = null;

async function getPdfjs() {
  if (pdfjsLib) return pdfjsLib;
  const mod = await import("pdfjs-dist");
  // pdfjs-dist v6: el worker se carga como módulo desde un blob para evitar
  // problemas de CORS/CSP en entornos de desarrollo y producción.
  const workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.mjs",
    import.meta.url
  ).href;
  mod.GlobalWorkerOptions.workerSrc = workerSrc;
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
        const pdfjs = await getPdfjs();
        const pdf   = await pdfjs.getDocument({ url, withCredentials: false }).promise;
        if (cancelled) return;
        const page  = await pdf.getPage(1);
        if (cancelled) return;
        const vp0   = page.getViewport({ scale: 1 });
        const scale = 200 / vp0.width;
        const vp    = page.getViewport({ scale });
        const canvas = document.createElement("canvas");
        canvas.width  = vp.width;
        canvas.height = vp.height;
        await page.render({ canvasContext: canvas.getContext("2d"), viewport: vp }).promise;
        if (!cancelled) {
          setImgSrc(canvas.toDataURL("image/jpeg", 0.85));
          setLoading(false);
        }
      } catch (e) {
        console.error("[usePdfCover]", e);
        if (!cancelled) { setLoading(false); setError(true); }
      }
    })();

    return () => { cancelled = true; };
  }, [url]);

  return { imgSrc, loading, error };
}
