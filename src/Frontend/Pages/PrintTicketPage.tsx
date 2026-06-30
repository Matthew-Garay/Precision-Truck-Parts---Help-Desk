import { useEffect, useRef, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { apiFetch, getToken, setToken } from "../Config/api";
import PrintReportView from "../Components/PrintReportView";

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

/** Espera a que todas las <img> del documento terminen de cargar o fallen */
function waitForImages(): Promise<void> {
  return new Promise((resolve) => {
    const imgs = Array.from(document.querySelectorAll<HTMLImageElement>("img"));
    const pending = imgs.filter((img) => !img.complete || img.naturalWidth === 0);
    if (pending.length === 0) { resolve(); return; }

    let remaining = pending.length;
    const done = () => { if (--remaining <= 0) resolve(); };
    pending.forEach((img) => {
      img.addEventListener("load",  done, { once: true });
      img.addEventListener("error", done, { once: true });
    });

    // Safety timeout: nunca quedar colgado más de 4 segundos
    setTimeout(resolve, 4000);
  });
}

export default function PrintTicketPage() {
  const { folio }           = useParams<{ folio: string }>();
  const [searchParams]      = useSearchParams();
  const [ticket, setTicket] = useState<TicketPrint | null>(null);
  const [error,  setError]  = useState<string>("");
  const printedRef           = useRef(false);

  // Preview en pantalla
  useEffect(() => {
    document.body.classList.add("print-preview");
    return () => document.body.classList.remove("print-preview");
  }, []);

  // Cargar ticket — resuelve el token del query param antes de hacer fetch
  useEffect(() => {
    if (!folio) return;

    // Resolver token: query param tiene prioridad sobre sessionStorage/memoria
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
      .then((r) => {
        if (r.status === 401) throw new Error("Sesión expirada. Inicia sesión de nuevo y vuelve a exportar el PDF.");
        if (!r.ok) throw new Error(`Error ${r.status} al cargar el ticket`);
        return r.json();
      })
      .then((data) => setTicket(data))
      .catch((e) => setError(e.message));
  }, [folio, searchParams]);

  // Cuando el ticket renderiza, esperar imágenes y disparar print
  useEffect(() => {
    if (!ticket || printedRef.current) return;
    printedRef.current = true;

    const triggerPrint = async () => {
      // Dar tiempo al DOM para pintar el componente
      await new Promise((r) => setTimeout(r, 300));
      // Esperar imágenes
      await waitForImages();
      // Quitar fondo gris antes de imprimir
      document.body.classList.remove("print-preview");
      // Otro tick para que el browser aplique el cambio de estilo
      await new Promise((r) => setTimeout(r, 100));
      window.print();
      // Restaurar preview si el usuario cancela la impresión
      document.body.classList.add("print-preview");
    };

    triggerPrint();
  }, [ticket]);

  /* ── Estados de carga / error ── */
  if (error) {
    return (
      <div style={{
        fontFamily: "sans-serif", padding: 40, color: "#DC2626",
        display: "flex", flexDirection: "column", gap: 8,
      }}>
        <strong style={{ fontSize: 15 }}>No se pudo cargar el reporte</strong>
        <span style={{ fontSize: 13, color: "#6B7280" }}>{error}</span>
        <span style={{ fontSize: 12, color: "#9CA3AF", marginTop: 4 }}>
          Verifica que la sesión siga activa y vuelve a intentarlo.
        </span>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div style={{
        fontFamily: "'Inter','Segoe UI',sans-serif",
        padding: 48,
        display: "flex",
        alignItems: "center",
        gap: 14,
        color: "#6B7280",
        fontSize: 14,
      }}>
        <svg
          width="20" height="20" viewBox="0 0 24 24"
          fill="none" stroke="#E8621A" strokeWidth="2.5" strokeLinecap="round"
          style={{ flexShrink: 0, animation: "pr-spin 0.9s linear infinite" }}
        >
          <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
        </svg>
        <style>{`@keyframes pr-spin { to { transform: rotate(360deg); } }`}</style>
        Preparando reporte para imprimir…
      </div>
    );
  }

  return (
    <PrintReportView
      ticket={ticket}
      generadoPor={ticket.generado_por}
    />
  );
}
