import { useEffect, useState, useRef } from "react";

const cache   = new Map();          // url → objectURL
const pending = new Map();          // id  → resolve
let worker    = null;
let nextId    = 0;

function getWorker() {
  if (worker) return worker;
  worker = new Worker(new URL("./pdfCoverWorker.js", import.meta.url), { type: "module" });
  worker.onmessage = ({ data: { id, buffer } }) => {
    const resolve = pending.get(id);
    if (!resolve) return;
    pending.delete(id);
    const url = buffer ? URL.createObjectURL(new Blob([buffer], { type: "image/jpeg" })) : null;
    resolve(url);
  };
  worker.onerror = () => {};
  return worker;
}

function requestCover(url) {
  if (cache.has(url)) return Promise.resolve(cache.get(url));
  return new Promise(resolve => {
    const id = nextId++;
    pending.set(id, result => { cache.set(url, result); resolve(result); });
    getWorker().postMessage({ id, url });
  });
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
      requestCover(url).then(src => { if (!cancelled) { setImgSrc(src); setLoading(false); } });
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
