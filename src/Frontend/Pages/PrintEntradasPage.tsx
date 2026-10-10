import { useEffect, useState } from "react";
import PrintEntradasView, { EntradasPayload } from "../Components/PrintEntradasView";
import { LoadingPrint, ErrorPrint } from "../Components/PrintShared";
import { waitForImages } from "../Config/printUtils";

const SESSION_KEY = "print_entradas_datos";

export default function PrintEntradasPage() {
  const [payload, setPayload] = useState<EntradasPayload | null>(null);
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(SESSION_KEY);
      if (!raw) { setError("No se encontraron datos para imprimir."); return; }
      const parsed = JSON.parse(raw);
      if (!parsed || !Array.isArray(parsed.rows)) { setError("Datos inválidos."); return; }
      setPayload({
        rows:    parsed.rows,
        filtros: Array.isArray(parsed.filtros) ? parsed.filtros : [],
        total:   Number(parsed.total) || parsed.rows.length,
        tipo:    parsed.tipo === "Salida" ? "Salida" : "Entrada",
      });
    } catch {
      setError("Error al leer los datos de las entradas.");
    }
  }, []);

  useEffect(() => {
    if (!payload) return;
    waitForImages().then(() => setReady(true));
  }, [payload]);

  if (error)  return <ErrorPrint message={error} />;
  if (!payload) return <LoadingPrint />;

  return (
    <>
      <div className="pr-toolbar">
        <span className="pr-toolbar-title">Vista previa — {payload?.tipo === "Salida" ? "Salidas" : "Entradas"} de material ({payload.rows.length} registros)</span>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="pr-btn pr-btn--outline" onClick={() => window.close()}>Cerrar</button>
          <button
            className="pr-btn pr-btn--primary"
            disabled={!ready}
            onClick={() => window.print()}
          >
            {ready ? "🖨  Imprimir / Guardar PDF" : "Cargando…"}
          </button>
        </div>
      </div>
      <PrintEntradasView payload={payload} />
    </>
  );
}