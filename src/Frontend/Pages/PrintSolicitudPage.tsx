import { useEffect, useRef, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { getToken, setToken } from "../Config/api";
import PrintSolicitudView from "../Components/PrintSolicitudView";
import { LoadingPrint, ErrorPrint } from "../Components/PrintShared";
import { triggerPrint } from "../Config/printUtils";

interface DetalleItem {
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
}

interface Solicitud {
  folio_solicitud: string;
  fecha: string;
  estatus: string;
  prioridad: string;
  nombre_empleado: string;
  nombre_departamento: string;
  detalle: DetalleItem[];
}

export default function PrintSolicitudPage() {
  const { folio }                 = useParams<{ folio: string }>();
  const [searchParams]            = useSearchParams();
  const [solicitud, setSolicitud] = useState<Solicitud | null>(null);
  const [error, setError]         = useState<string>("");
  const printedRef                = useRef(false);

  useEffect(() => {
    document.body.classList.add("print-preview");
    return () => document.body.classList.remove("print-preview");
  }, []);

  useEffect(() => {
    if (!folio) return;
    const tokenParam = searchParams.get("token");
    if (tokenParam) setToken(tokenParam);
    const token = tokenParam ?? getToken();
    if (!token) {
      setError("Sesión no válida. Cierra esta pestaña, inicia sesión y vuelve a exportar el PDF.");
      return;
    }
    fetch(`/api/solicitudes/folio/${folio}`, {
      headers: {
        "Authorization": `Bearer ${token}`,
        "x-requested-with": "XMLHttpRequest",
      },
    })
      .then(r => {
        if (r.status === 401) throw new Error("Sesión expirada. Inicia sesión de nuevo y vuelve a exportar el PDF.");
        if (!r.ok) throw new Error(`Error ${r.status} al cargar la solicitud`);
        return r.json();
      })
      .then(data => setSolicitud(data))
      .catch(e => setError(e.message));
  }, [folio, searchParams]);

  useEffect(() => {
    if (!solicitud || printedRef.current) return;
    printedRef.current = true;
    triggerPrint();
  }, [solicitud]);

  if (error)      return <ErrorPrint message={error} />;
  if (!solicitud) return <LoadingPrint />;

  return <PrintSolicitudView solicitud={solicitud} />;
}
