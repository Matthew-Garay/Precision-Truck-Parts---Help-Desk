import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { getToken, setToken } from "../Config/api";
import PrintReportView from "../Components/PrintReportView";
import { LoadingPrint, ErrorPrint } from "../Components/PrintShared";
import { waitForImages } from "../Config/printUtils";

interface TicketPrint {
  folio_ticket: string;
  titulo: string;
  descripcion: string;
  estatus: "En proceso" | "Resuelto" | "No Resuelto" | "Cancelado";
  prioridad: "Urgente" | "Alta" | "Media" | "Baja";
  nombre_empleado: string;
  nombre_departamento: string;
  nombre_categoria: string;
  fecha_subido: string;
  fecha_resuelto: string | null;
  resuelto_por: string | null;
  comentarios: string | null;
  calificacion: number | null;
  imagenes: string[];
  generado_por?: string;
}

export default function PrintTicketPage() {
  const { folio }           = useParams<{ folio: string }>();
  const [searchParams]      = useSearchParams();
  const [ticket, setTicket] = useState<TicketPrint | null>(null);
  const [error,  setError]  = useState<string>("");
  const [ready,  setReady]  = useState(false);

  useEffect(() => {
    if (!folio) return;
    const tokenParam = searchParams.get("token");
    if (tokenParam) setToken(tokenParam);
    const token = tokenParam ?? getToken();
    if (!token) {
      setError("Sesión no válida. Cierra esta pestaña, inicia sesión y vuelve a exportar el PDF.");
      return;
    }
    fetch(`/api/tickets/folio/${folio}`, {
      headers: {
        "Authorization": `Bearer ${token}`,
        "x-requested-with": "XMLHttpRequest",
      },
    })
      .then(r => {
        if (r.status === 401) throw new Error("Sesión expirada. Inicia sesión de nuevo y vuelve a exportar el PDF.");
        if (!r.ok) throw new Error(`Error ${r.status} al cargar el ticket`);
        return r.json();
      })
      .then(data => setTicket(data))
      .catch(e => setError(e.message));
  }, [folio, searchParams]);

  useEffect(() => {
    if (!ticket) return;
    waitForImages().then(() => setReady(true));
  }, [ticket]);

  if (error)  return <ErrorPrint message={error} />;
  if (!ticket) return <LoadingPrint />;

  return (
    <>
      <div className="pr-toolbar">
        <span className="pr-toolbar-title">Vista previa del ticket {ticket.folio_ticket}</span>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="pr-btn pr-btn--outline" onClick={() => window.close()}>Cerrar</button>
          <button
            className="pr-btn pr-btn--primary"
            disabled={!ready}
            onClick={() => window.print()}
          >
            {ready ? "🖨  Imprimir / Guardar PDF" : "Cargando…"}
          </button>
        </div>
      </div>
      <PrintReportView ticket={ticket} />
    </>
  );
}
