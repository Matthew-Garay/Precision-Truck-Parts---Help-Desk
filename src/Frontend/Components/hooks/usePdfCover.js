import { useEffect, useState, useRef } from "react";
import { getToken } from "../../Config/api";
import pdfjs, { PDFJS_PARAMS } from "../../Config/pdfjs";

const cache    = new Map(); // url → objectURL | null
const inflight = new Map(); // url → Promise

async function renderCover(url) {
  if (cache.has(url))    return cache.get(url);
  if (inflight.has(url)) return inflight.get(url);

  const promise = (async () => {
    try {
      const token   = getToken();
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res     = await fetch(url, { headers });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = new Uint8Array(await res.arrayBuffer());

      // Deshabilitar worker para evitar problemas de contexto en miniaturas
      const task = pdfjs.getDocument({ 
        ...PDFJS_PARAMS, 
        data,
        useWorker: false 
      });
      const pdf  = await task.promise;
      const page = await pdf.getPage(1);
      const vp0  = page.getViewport({ scale: 1 });
      
      // Calcular escala segura con límites
      const targetWidth = 140;
      const scale = Math.max(0.5, Math.min(3, targetWidth / Math.max(vp0.width, 1)));
      const vp   = page.getViewport({ scale });

      const canvas  = document.createElement("canvas");
      const dpr     = window.devicePixelRatio || 1;
      canvas.width  = Math.round(vp.width * dpr);
      canvas.height = Math.round(vp.height * dpr);
      canvas.style.width  = `${vp.width}px`;
      canvas.style.height = `${vp.height}px`;
      
      const ctx = canvas.getContext("2d");
      ctx.scale(dpr, dpr);
      
      await page.render({ canvasContext: ctx, viewport: vp }).promise;
      await task.destroy();

      const objectUrl = await new Promise((resolve, reject) =>
        canvas.toBlob(b => b ? resolve(URL.createObjectURL(b)) : reject(), "image/jpeg", 0.85)
      );
      cache.set(url, objectUrl);
      return objectUrl;
    } catch (err) {
      console.error("[usePdfCover] Error rendering cover:", err);
      cache.set(url, null);
      return null;
    } finally {
      inflight.delete(url);
    }
  })();

  inflight.set(url, promise);
  return promise;
}

export function usePdfCover(url, containerRef) {
  const [imgSrc,  setImgSrc]  = useState(() => cache.get(url) ?? null);
  const [loading, setLoading] = useState(!cache.has(url));
  const triggered = useRef(false);

  useEffect(() => {
    if (!url) return;
    if (cache.has(url)) { setImgSrc(cache.get(url)); setLoading(false); return; }

    const trigger = () => {
      if (triggered.current) return;
      triggered.current = true;
      let cancelled = false;
      renderCover(url).then(src => { if (!cancelled) { setImgSrc(src); setLoading(false); } });
      return () => { cancelled = true; };
    };

    const el = containerRef?.current;
    if (el && "IntersectionObserver" in window) {
      const obs = new IntersectionObserver(([e]) => {
        if (e.isIntersecting) { obs.disconnect(); trigger(); }
      }, { rootMargin: "300px" });
      obs.observe(el);
      return () => obs.disconnect();
    }
    return trigger();
  }, [url, containerRef]);

  return { imgSrc, loading };
}
