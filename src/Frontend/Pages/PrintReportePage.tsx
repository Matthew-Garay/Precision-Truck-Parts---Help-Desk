import { useEffect, useRef, useState } from "react";
import PrintReporteListaView, { type ReportePayload } from "../Components/PrintReporteListaView";

export const REPORTE_STORAGE_KEY = "pr_reporte_lista_payload";

function waitForImages(): Promise<void> {
  return new Promise((resolve) => {
    const imgs = Array.from(document.querySelectorAll<HTMLImageElement>("img"));
    const pending = imgs.filter(img => !img.complete || img.naturalWidth === 0);
    if (pending.length === 0) { resolve(); return; }
    let remaining = pending.length;
    const done = () => { if (--remaining <= 0) resolve(); };
    pending.forEach(img => {
      img.addEventListener("load",  done, { once: true });
      img.addEventListener("error", done, { once: true });
    });
    setTimeout(resolve, 4000);
  });
}

export default function PrintReportePage() {
  const [payload, setPayload] = useState<ReportePayload | null>(null);
  const [error,   setError]   = useState("");
  const printedRef             = useRef(false);

  useEffect(() => {
    document.body.classList.add("print-preview");
    return () => document.body.classList.remove("print-preview");
  }, []);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(REPORTE_STORAGE_KEY);
      if (!raw) throw new Error("No se encontraron datos del reporte.");
      setPayload(JSON.parse(raw));
    } catch (e: any) {
      setError(e?.message ?? "Error al cargar el reporte.");
    }
  }, []);

  useEffect(() => {
    if (!payload || printedRef.current) return;
    printedRef.current = true;
    (async () => {
      await new Promise(r => setTimeout(r, 300));
      await waitForImages();
      document.body.classList.remove("print-preview");
      await new Promise(r => setTimeout(r, 100));
      window.print();
      document.body.classList.add("print-preview");
    })();
  }, [payload]);

  if (error) return (
    <div style={{ fontFamily: "sans-serif", padding: 40, color: "#DC2626", display: "flex", flexDirection: "column", gap: 8 }}>
      <strong style={{ fontSize: 15 }}>No se pudo cargar el reporte</strong>
      <span style={{ fontSize: 13, color: "#6B7280" }}>{error}</span>
      <span style={{ fontSize: 12, color: "#9CA3AF", marginTop: 4 }}>
        Cierra esta pestaña y vuelve a generar el reporte.
      </span>
    </div>
  );

  if (!payload) return (
    <div style={{ fontFamily: "'Inter','Segoe UI',sans-serif", padding: 48, display: "flex", alignItems: "center", gap: 14, color: "#6B7280", fontSize: 14 }}>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#E8621A" strokeWidth="2.5" strokeLinecap="round"
        style={{ flexShrink: 0, animation: "pr-spin 0.9s linear infinite" }}>
        <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
      </svg>
      <style>{`@keyframes pr-spin { to { transform: rotate(360deg); } }`}</style>
      Preparando reporte para imprimir…
    </div>
  );

  return <PrintReporteListaView payload={payload} />;
}

/** Guarda el payload en sessionStorage y abre /print/reporte en nueva pestaña */
export function abrirReporteLista(payload: ReportePayload): void {
  sessionStorage.setItem(REPORTE_STORAGE_KEY, JSON.stringify(payload));
  const win = window.open("/print/reporte", "_blank", "width=1200,height=800");
  if (!win) {
    const aviso = document.createElement("div");
    aviso.style.cssText =
      "position:fixed;top:16px;left:50%;transform:translateX(-50%);z-index:9999;" +
      "background:#1D1D1B;color:#fff;padding:12px 20px;border-radius:10px;" +
      "font-size:13px;font-weight:700;border-left:4px solid #F47920;" +
      "box-shadow:0 4px 20px rgba(0,0,0,0.4);";
    aviso.textContent = "El navegador bloqueó la ventana emergente. Permite las ventanas emergentes para este sitio e intenta de nuevo.";
    document.body.appendChild(aviso);
    setTimeout(() => aviso.remove(), 5000);
  }
}
