/**
 * PrintSolicitudPage.tsx
 * Ruta standalone: /print/solicitud/:folio
 *
 * Renderiza PrintSolicitudView sin ningún elemento de la app.
 * El flujo es idéntico al de PrintTicketPage.
 */

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { apiFetch, setToken } from "../Config/api";
import PrintSolicitudView from "../Components/PrintSolicitudView";

interface SolicitudPrint {
  folio_solicitud: string;
  fecha: string;
  estatus: string;
  prioridad: string;
  nombre_empleado: string;
  nombre_departamento: string;
  detalle: {
    id_solicitud_insumo: number;
    id_insumo: number;
    nombre: string;
    marca?: string | null;
    modelo?: string | null;
    num_serie?: string | null;
    cantidad: number;
    stock: number;
    descripcion?: string | null;
    aprobado?: number | null;
  }[];
}

export default function PrintSolicitudPage() {
  const { folio }           = useParams<{ folio: string }>();
  const [searchParams]      = useSearchParams();
  const [solicitud, setSolicitud] = useState<SolicitudPrint | null>(null);
  const [error, setError]   = useState<string>("");

  useEffect(() => {
    document.body.classList.add("print-preview");
    return () => document.body.classList.remove("print-preview");
  }, []);

  useEffect(() => {
    if (!folio) return;
    const tokenParam = searchParams.get("token");
    if (tokenParam) setToken(tokenParam);

    const tid = setTimeout(() => {
      apiFetch(`/api/solicitudes/folio/${folio}`)
        .then((r) => {
          if (!r.ok) throw new Error(`HTTP ${r.status}`);
          return r.json();
        })
        .then((data) => setSolicitud(data))
        .catch((e) => setError(e.message));
    }, 50);
    return () => clearTimeout(tid);
  }, [folio, searchParams]);

  if (error) {
    return (
      <div style={{ fontFamily: "sans-serif", padding: 32, color: "#DC2626" }}>
        <strong>Error al cargar el reporte:</strong> {error}
      </div>
    );
  }

  if (!solicitud) {
    return (
      <div style={{ fontFamily: "sans-serif", padding: 32, color: "#6B7280" }}>
        Cargando reporte…
      </div>
    );
  }

  return <PrintSolicitudView solicitud={solicitud} />;
}
