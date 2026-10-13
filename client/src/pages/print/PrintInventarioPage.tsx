import { useEffect, useState } from "react";
import PrintInventarioView from '../../components/print/PrintInventarioView.tsx';
import { LoadingPrint, ErrorPrint } from '../../components/PrintShared.tsx';
import { waitForImages } from '../../utils/print-utils.ts';

const SESSION_KEY = "print_inventario_datos";

export default function PrintInventarioPage() {
  const [datos, setDatos] = useState<object[] | null>(null);
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);
  const [aplicados, setAplicados] = useState<string[]>([]);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(SESSION_KEY);
      if (!raw) { setError("No se encontraron datos para imprimir."); return; }
      const parsed = JSON.parse(raw);
      // Compat: antes se guardaba un array plano; ahora { rows, filtros }
      const rows = Array.isArray(parsed) ? parsed : parsed?.rows;
      if (!Array.isArray(rows)) { setError("Datos inválidos."); return; }
      setDatos(rows);
      setAplicados(Array.isArray(parsed) ? [] : (Array.isArray(parsed?.filtros) ? parsed.filtros : []));
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
      <PrintInventarioView datos={datos as never} filtros={aplicados} />
    </>
  );
}
