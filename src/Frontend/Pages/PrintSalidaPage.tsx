import { useEffect, useState } from "react";
import PrintSalidaView, { SalidaPayload } from "../Components/PrintSalidaView";
import { LoadingPrint, ErrorPrint } from "../Components/PrintShared";
import { waitForImages } from "../Config/printUtils";

const SESSION_KEY = "print_salida_datos";

export default function PrintSalidaPage() {
  const [payload, setPayload] = useState<SalidaPayload | null>(null);
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(SESSION_KEY);
      if (!raw) { setError("No se encontraron datos para imprimir."); return; }
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed.folio !== "string" || !Array.isArray(parsed.rows)) {
        setError("Datos inválidos.");
        return;
      }
      setPayload({
        folio:          parsed.folio,
        fecha:          parsed.fecha ?? null,
        rows:           parsed.rows,
        destino:        parsed.destino ?? null,
        responsable:    parsed.responsable ?? null,
        motivo:         parsed.motivo ?? null,
        // Compatibilidad: el modal nuevo manda "solicitante" como quien entrega.
        registrado_por: parsed.registrado_por ?? parsed.solicitante ?? null,
      });
    } catch {
      setError("Error al leer los datos de la salida.");
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
        <span className="pr-toolbar-title">Vista previa — Salida interna {payload.folio} ({payload.rows.length} renglones)</span>
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

      <PrintSalidaView payload={payload} />
    </>
  );
}
