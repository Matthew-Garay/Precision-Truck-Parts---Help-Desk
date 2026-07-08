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

let _pdfjsLib = null;
async function getPdfjs() {
  if (_pdfjsLib) return _pdfjsLib;
  const mod = await import("pdfjs-dist");
  mod.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.mjs",
    import.meta.url
  ).href;
  _pdfjsLib = mod;
  return _pdfjsLib;
}

export default function PdfViewer({ url, isDark }) {
  const canvasRef   = useRef(null);
  const renderTask  = useRef(null);
  const pdfRef      = useRef(null);

  const [numPages,  setNumPages]  = useState(0);
  const [pageNum,   setPageNum]   = useState(1);
  const [scale,     setScale]     = useState(1.2);
  const [rotation,  setRotation]  = useState(0);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState(false);

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
        const pdfjs = await getPdfjs();
        const pdf   = await pdfjs.getDocument({ url, withCredentials: false }).promise;
        if (cancelled) return;
        pdfRef.current = pdf;
        setNumPages(pdf.numPages);
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
        height: 40, flexShrink: 0, display: "flex", alignItems: "center",
        justifyContent: "center", gap: 8, padding: "0 12px",
        background: isDark ? "#0f1117" : "#f1f5f9",
        borderBottom: `1px solid ${isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.08)"}`,
      }}>
        {/* Navegación páginas */}
        <button style={btnSt} onClick={() => setPageNum(p => Math.max(1, p - 1))} disabled={pageNum <= 1 || loading}>
          <ChevronLeft size={14} />
        </button>
        <span style={{ fontSize: 11, fontWeight: 600, color: txt, minWidth: 70, textAlign: "center" }}>
          {loading ? "..." : `${pageNum} / ${numPages}`}
        </span>
        <button style={btnSt} onClick={() => setPageNum(p => Math.min(numPages, p + 1))} disabled={pageNum >= numPages || loading}>
          <ChevronRight size={14} />
        </button>

        <div style={{ width: 1, height: 20, background: isDark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.10)", margin: "0 4px" }} />

        {/* Zoom */}
        <button style={btnSt} onClick={() => setScale(s => Math.max(0.5, +(s - 0.2).toFixed(1)))} disabled={loading}>
          <ZoomOut size={13} />
        </button>
        <span style={{ fontSize: 11, fontWeight: 600, color: txt, minWidth: 38, textAlign: "center" }}>
          {Math.round(scale * 100)}%
        </span>
        <button style={btnSt} onClick={() => setScale(s => Math.min(3, +(s + 0.2).toFixed(1)))} disabled={loading}>
          <ZoomIn size={13} />
        </button>

        <div style={{ width: 1, height: 20, background: isDark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.10)", margin: "0 4px" }} />

        {/* Rotar */}
        <button style={btnSt} onClick={() => setRotation(r => (r + 90) % 360)} disabled={loading}>
          <RotateCw size={13} />
        </button>
      </div>

      {/* Canvas */}
      <div style={{ flex: 1, overflow: "auto", display: "flex", alignItems: "flex-start", justifyContent: "center", padding: 16 }}>
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
              maxWidth: "100%", height: "auto",
              boxShadow: "0 4px 24px rgba(0,0,0,0.25)",
              borderRadius: 4,
              display: "block",
            }}
          />
        )}
      </div>
    </div>
  );
}
