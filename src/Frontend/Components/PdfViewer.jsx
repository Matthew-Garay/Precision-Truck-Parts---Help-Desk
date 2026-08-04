/**
 * PdfViewer.jsx
 * Visor PDF embebido con pdfjs-dist. Renderiza página a página en canvas.
 * Usado en el DrawerVisor de Manuales (Admin y Usuario).
 *
 * Props:
 *   url    - URL completa del PDF
 *   isDark - boolean para tema
 */
import { useEffect, useRef, useState, useCallback } from "react";
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RotateCw } from "lucide-react";

import pdfjs, { PDFJS_PARAMS } from "../Config/pdfjs";

export default function PdfViewer({ url, isDark }) {
  const canvasRef   = useRef(null);
  const renderTask  = useRef(null);
  const pdfRef      = useRef(null);
  const scrollRef   = useRef(null);
  const pageNumRef  = useRef(1);

  const [numPages,  setNumPages]  = useState(0);
  const [pageNum,   setPageNum]   = useState(1);
  const numPagesRef = useRef(0);
  const [scale,     setScale]     = useState(1.2);
  const [scaleInput, setScaleInput] = useState("");
  const [rotation,  setRotation]  = useState(0);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState(false);

  const [isMobileOrTablet, setIsMobileOrTablet] = useState(() => window.innerWidth < 768);
  useEffect(() => {
    const check = () => setIsMobileOrTablet(window.innerWidth < 768);
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Cargar documento
  useEffect(() => {
    if (!url) return;
    let cancelled = false;
    setLoading(true);
    setError(false);
    setPageNum(1);
    setNumPages(0);

    (async () => {
      try {
        const token = localStorage.getItem("_tk");
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const pdfRes  = await fetch(url, { headers });
        const data    = new Uint8Array(await pdfRes.arrayBuffer());
        const loadingTask = pdfjs.getDocument({ ...PDFJS_PARAMS, data });
        const pdf = await loadingTask.promise;
        if (cancelled) { await loadingTask.destroy(); return; }
        pdfRef.current = pdf;
        numPagesRef.current = pdf.numPages;
        setNumPages(pdf.numPages);
        // Ajustar scale al ancho del contenedor
        if (scrollRef.current) {
          const page1 = await pdf.getPage(1);
          const vp = page1.getViewport({ scale: 1, rotation: 0 });
          const available = scrollRef.current.clientWidth - 48;
          setScale(+(available / vp.width).toFixed(2));
        }
        setLoading(false);
      } catch (e) {
        console.error("[PdfViewer] load error", e);
        if (!cancelled) { setLoading(false); setError(true); }
      }
    })();

    return () => { cancelled = true; };
  }, [url]);

  // Renderizar página
  const renderPage = useCallback(async () => {
    const pdf = pdfRef.current;
    if (!pdf || !canvasRef.current) return;

    // Cancelar render anterior si existe
    if (renderTask.current) {
      try { renderTask.current.cancel(); } catch {}
      renderTask.current = null;
    }

    try {
      const page = await pdf.getPage(pageNum);
      const vp   = page.getViewport({ scale, rotation });
      const canvas = canvasRef.current;
      const ctx    = canvas.getContext("2d");
      canvas.width  = vp.width;
      canvas.height = vp.height;

      const task = page.render({ canvasContext: ctx, viewport: vp });
      renderTask.current = task;
      await task.promise;
      renderTask.current = null;
    } catch (e) {
      if (e?.name !== "RenderingCancelledException") {
        console.error("[PdfViewer] render error", e);
      }
    }
  }, [pageNum, scale, rotation]);

  useEffect(() => {
    if (!loading && !error && pdfRef.current) renderPage();
  }, [loading, error, renderPage]);

  // Sincronizar ref de página para el handler de wheel
  useEffect(() => { pageNumRef.current = pageNum; }, [pageNum]);

  // Scroll para cambiar de página
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    let lastWheel = 0;
    const onWheel = (e) => {
      const atTop    = el.scrollTop === 0;
      const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 2;
      const goingDown = e.deltaY > 0;
      const goingUp   = e.deltaY < 0;
      if ((goingDown && atBottom) || (goingUp && atTop)) {
        const now = Date.now();
        if (now - lastWheel < 400) return;
        lastWheel = now;
        e.preventDefault();
        setPageNum(p => {
          if (goingDown) return Math.min(numPagesRef.current, p + 1);
          return Math.max(1, p - 1);
        });
        el.scrollTop = goingDown ? 0 : el.scrollHeight;
      }
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  const bg   = isDark ? "#1e293b" : "#e2e8f0";
  const ctrl = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";
  const txt  = isDark ? "rgba(255,255,255,0.7)"  : "#334155";

  const btnSt = {
    width: 30, height: 30, borderRadius: 6,
    border: `1px solid ${isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.12)"}`,
    background: ctrl, color: txt,
    cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: 11, fontWeight: 600,
  };

  if (error) return (
    <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 8, background: bg }}>
      <span style={{ fontSize: 13, color: isDark ? "rgba(255,255,255,0.4)" : "#64748b" }}>
        No se pudo cargar el PDF
      </span>
      <a href={url} target="_blank" rel="noreferrer"
        style={{ fontSize: 12, color: "#F47920", textDecoration: "underline" }}>
        Abrir en nueva pestaña
      </a>
    </div>
  );

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", background: bg }}>
      {/* Barra de controles */}
      <div style={{
        minHeight: 40, flexShrink: 0, display: "flex", alignItems: "center",
        justifyContent: "center", gap: 6, padding: "6px 10px", flexWrap: "wrap",
        background: isDark ? "#0f1117" : "#f1f5f9",
        borderBottom: `1px solid ${isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.08)"}`,
      }}>
        {/* Navegación páginas */}
        <button style={btnSt} onClick={() => setPageNum(p => Math.max(1, p - 1))} disabled={pageNum <= 1 || loading}>
          <ChevronLeft size={14} />
        </button>
        {loading ? (
          <span style={{ fontSize: 11, fontWeight: 600, color: txt, minWidth: 70, textAlign: "center" }}>...</span>
        ) : (
          <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 600, color: txt }}>
            <input
              type="number"
              min={1}
              max={numPages}
              value={pageNum}
              onChange={e => {
                const v = parseInt(e.target.value, 10);
                if (!isNaN(v)) setPageNum(Math.min(numPages, Math.max(1, v)));
              }}
              style={{
                width: 38, height: 24, textAlign: "center", borderRadius: 5,
                border: `1px solid ${isDark ? "rgba(255,255,255,0.18)" : "rgba(0,0,0,0.15)"}`,
                background: isDark ? "rgba(255,255,255,0.07)" : "#fff",
                color: txt, fontSize: 11, fontWeight: 600,
                outline: "none", padding: 0,
                MozAppearance: "textfield",
              }}
            />
            <span style={{ opacity: 0.55 }}>/ {numPages}</span>
          </span>
        )}
        <button style={btnSt} onClick={() => setPageNum(p => Math.min(numPages, p + 1))} disabled={pageNum >= numPages || loading}>
          <ChevronRight size={14} />
        </button>

        <div style={{ width: 1, height: 20, background: isDark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.10)", margin: "0 4px" }} />

        {/* Zoom — siempre visible */}
        <>
          <button style={btnSt} onClick={() => { const s = Math.max(0.5, +(scale - 0.25).toFixed(2)); setScale(s); setScaleInput(""); }} disabled={loading}>
            <ZoomOut size={13} />
          </button>
          <div style={{
            display: "flex", alignItems: "center",
            border: `1px solid ${isDark ? "rgba(255,255,255,0.18)" : "rgba(0,0,0,0.15)"}`,
            borderRadius: 5, overflow: "hidden",
            background: isDark ? "rgba(255,255,255,0.07)" : "#fff",
          }}>
            <input
              type="number"
              min={25}
              max={500}
              value={scaleInput !== "" ? scaleInput : Math.round(scale * 100)}
              onChange={e => setScaleInput(e.target.value)}
              onBlur={e => {
                const v = parseInt(e.target.value, 10);
                if (!isNaN(v) && v >= 25 && v <= 500) setScale(v / 100);
                setScaleInput("");
              }}
              onKeyDown={e => {
                if (e.key === "Enter") {
                  const v = parseInt(e.target.value, 10);
                  if (!isNaN(v) && v >= 25 && v <= 500) setScale(v / 100);
                  setScaleInput("");
                  e.target.blur();
                }
              }}
              disabled={loading}
              style={{
                width: 44, height: 24, textAlign: "center",
                border: "none", background: "transparent",
                color: txt, fontSize: 11, fontWeight: 600,
                outline: "none", padding: 0,
                MozAppearance: "textfield",
              }}
            />
            <span style={{
              padding: "0 6px", fontSize: 11, fontWeight: 600,
              color: txt, opacity: 0.55,
              borderLeft: `1px solid ${isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.10)"}`,
              background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)",
              height: 24, display: "flex", alignItems: "center",
              userSelect: "none",
            }}>%</span>
          </div>
          <button style={btnSt} onClick={() => { const s = Math.min(5, +(scale + 0.25).toFixed(2)); setScale(s); setScaleInput(""); }} disabled={loading}>
            <ZoomIn size={13} />
          </button>
          <div style={{ width: 1, height: 20, background: isDark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.10)", margin: "0 4px" }} />
        </>

        {/* Rotar */}
        <button style={btnSt} onClick={() => setRotation(r => (r + 90) % 360)} disabled={loading}>
          <RotateCw size={13} />
        </button>
      </div>

      {/* Canvas */}
      <div ref={scrollRef} style={{ flex: 1, overflow: "auto", display: "flex", alignItems: "flex-start", justifyContent: "center", padding: 16 }}>
        {loading ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "100%", height: "100%" }}>
            <svg className="animate-spin" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#F47920" strokeWidth="2">
              <path d="M21 12a9 9 0 1 1-6.219-8.56" />
            </svg>
          </div>
        ) : (
          <canvas
            ref={canvasRef}
            style={{
              display: "block",
              boxShadow: "0 4px 24px rgba(0,0,0,0.25)",
              borderRadius: 4,
            }}
          />
        )}
      </div>
    </div>
  );
}
