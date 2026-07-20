import { useEffect, useState } from "react";
import PrintInventarioView from "../Components/PrintInventarioView";
import { LoadingPrint, ErrorPrint } from "../Components/PrintShared";
import { waitForImages } from "../Config/printUtils";

const SESSION_KEY = "print_inventario_datos";

export default function PrintInventarioPage() {
  const [datos, setDatos] = useState<object[] | null>(null);
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(SESSION_KEY);
      if (!raw) { setError("No se encontraron datos para imprimir."); return; }
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) { setError("Datos inválidos."); return; }
      setDatos(parsed);
    } catch {
      setError("Error al leer los datos del inventario.");
    }
  }, []);

  useEffect(() => {
    if (!datos) return;
    waitForImages().then(() => setReady(true));
  }, [datos]);

  if (error)  return <ErrorPrint message={error} />;
  if (!datos) return <LoadingPrint />;

  return (
    <>
      <div className="pr-toolbar">
        <span className="pr-toolbar-title">Vista previa — Inventario de Insumos ({datos.length} registros)</span>
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
      <PrintInventarioView datos={datos as never} />
    </>
  );
}
