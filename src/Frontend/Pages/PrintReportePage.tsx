import { useEffect, useRef, useState } from "react";
import PrintReporteListaView, { type ReportePayload } from "../Components/PrintReporteListaView";
import { LoadingPrint, ErrorPrint } from "../Components/PrintShared";
import { triggerPrint } from "../Config/printUtils";

export const REPORTE_STORAGE_KEY = "pr_reporte_lista_payload";

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
    triggerPrint();
  }, [payload]);

  if (error)   return <ErrorPrint message={error} />;
  if (!payload) return <LoadingPrint />;

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
