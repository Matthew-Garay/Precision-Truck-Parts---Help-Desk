import {
  Badge, Stars, PageHeader, PageFooter, Section, DataGrid, Firma,
  PRIO_META, ESTATUS_META, fmt, nowFechaGen,
} from "./PrintShared";

interface Ticket {
  folio_ticket: string;
  titulo: string;
  descripcion: string;
  estatus: "En proceso" | "Resuelto" | "No Resuelto" | "Cancelado";
  prioridad: "Urgente" | "Alta" | "Media" | "Baja";
  nombre_empleado: string;
  nombre_departamento: string;
  nombre_sucursal: string | null;
  nombre_categoria: string;
  fecha_subido: string;
  fecha_resuelto: string | null;
  resuelto_por: string | null;
  comentarios: string | null;
  calificacion: number | null;
  imagenes: string[];
}

const CAL_LABEL = ["", "Muy malo", "Malo", "Regular", "Bueno", "Excelente"];

function calcTiempo(inicio: string, fin: string): string {
  const mins = Math.floor((new Date(fin).getTime() - new Date(inicio).getTime()) / 60000);
  const d = Math.floor(mins / 1440);
  const h = Math.floor((mins % 1440) / 60);
  const m = mins % 60;
  return [d > 0 ? `${d}d` : "", h > 0 ? `${h}h` : "", `${m}m`].filter(Boolean).join(" ");
}

function EvidenceGallery({ folio, imagenes }: { folio: string; imagenes: string[] }) {
  const apiBase = import.meta.env.VITE_API_URL || "";
  if (imagenes.length === 0) {
    return <p className="pr-empty">No se adjuntaron evidencias fotográficas.</p>;
  }
  return (
    <div className="pr-gallery">
      {imagenes.map((nombre, i) => (
        <div key={nombre} className="pr-gallery-item">
          <img
            src={`${apiBase}/storage/Evidencias_Tickets/${folio}/${nombre}`}
            alt={`Evidencia ${i + 1}`}
            className="pr-gallery-img"
            loading="eager"
          />
          <span className="pr-gallery-caption">
            {String(i + 1).padStart(2, "0")} — {nombre}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function PrintReportView({ ticket }: { ticket: Ticket }) {
  const fechaGen  = nowFechaGen();
  const calNum    = ticket.calificacion ? Math.min(5, Math.max(1, ticket.calificacion)) : 0;
  const fechaAlta = fmt.fechaCorta(ticket.fecha_subido);
  const horaAlta  = fmt.hora(ticket.fecha_subido);
  const fechaRes  = ticket.fecha_resuelto ? fmt.fechaCorta(ticket.fecha_resuelto) : null;
  const horaRes   = ticket.fecha_resuelto ? fmt.hora(ticket.fecha_resuelto) : null;
  const tiempoRes = ticket.fecha_resuelto && ticket.estatus === "Resuelto"
    ? calcTiempo(ticket.fecha_subido, ticket.fecha_resuelto) : null;

  const prio    = PRIO_META[ticket.prioridad]  ?? PRIO_META.Media;
  const estatus = ESTATUS_META[ticket.estatus] ?? ESTATUS_META["En proceso"];

  return (
    <div className="pr-root" data-ready="true">

      <PageHeader
        titulo="Reporte de Incidencia Técnica"
        subtitulo="Departamento de Soporte Técnico"
        metaRows={[
          { label: "Folio",    value: ticket.folio_ticket, mono: true },
          { label: "Generado", value: fechaGen },
        ]}
      />

      <div className="pr-content">

        {/* Línea de estado */}
        <div style={{
          display: "flex", alignItems: "center", flexWrap: "wrap", gap: 8,
          padding: "6px 10px", marginBottom: 10,
          border: "1px solid #cccccc", background: "#f5f5f5",
        }}>
          <span style={{ flex: 1, fontSize: "9pt", fontWeight: "bold", color: "#000" }}>
            {ticket.titulo}
          </span>
          <Badge label={ticket.estatus} icon={estatus.icon} bg="#f5f5f5" color="#000" border="#cccccc" />
          <Badge label={prio.label} bg="#f5f5f5" color="#000" border="#cccccc" />
          {tiempoRes && (
            <span style={{ fontSize: "7.5pt", color: "#444" }}>Resuelto en: {tiempoRes}</span>
          )}
        </div>

        <Section title="Datos del Reporte" noPad>
          <DataGrid items={[
            { label: "Folio",             value: ticket.folio_ticket,           half: true },
            { label: "Solicitante",       value: ticket.nombre_empleado,        half: true },
            { label: "Departamento",      value: ticket.nombre_departamento,    half: true },
            { label: "Sucursal",          value: ticket.nombre_sucursal ?? "—", half: true },
            { label: "Categoría",         value: ticket.nombre_categoria,       half: true },
            { label: "Fecha de alta",     value: `${fechaAlta} · ${horaAlta}`,  half: true },
            ...(fechaRes ? [
              { label: "Fecha resolución",     value: `${fechaRes} · ${horaRes}`, half: true },
              { label: "Resuelto por",         value: ticket.resuelto_por ?? "—", half: true },
              { label: "Tiempo de resolución", value: tiempoRes ?? "—",           half: true },
            ] : [
              { label: "Fecha resolución", value: "Pendiente", half: true },
              { label: "Resuelto por",     value: "Pendiente", half: true },
            ]),
          ]} />
        </Section>

        <Section title="Descripción del Problema">
          <div
            className="pr-rich-text"
            dangerouslySetInnerHTML={{
              __html: ticket.descripcion || "<em>Sin descripción registrada.</em>",
            }}
          />
        </Section>

        <Section title="Resolución y Comentarios del Técnico">
          <div style={{ borderLeft: "3px solid #cccccc", paddingLeft: 10 }}>
            <div className="pr-rich-text">
              {ticket.comentarios
                ? <span dangerouslySetInnerHTML={{ __html: ticket.comentarios }} />
                : <em>Sin comentarios registrados.</em>
              }
            </div>
          </div>
        </Section>

        <div className="pr-two-col">
          <Section title="Calificación del Servicio">
            {calNum > 0 ? (
              <div className="pr-rating">
                <Stars n={calNum} size={12} />
                <span className="pr-rating-score">{calNum} / 5 — {CAL_LABEL[calNum]}</span>
                <span className="pr-rating-by">Evaluado por: {ticket.nombre_empleado}</span>
              </div>
            ) : (
              <p className="pr-empty">Sin calificación registrada.</p>
            )}
          </Section>

          <Section title="Firma del Técnico">
            <Firma nombre={ticket.resuelto_por ?? "Pendiente"} rol="Soporte Técnico" />
          </Section>
        </div>

        <Section title={
          ticket.imagenes.length > 0
            ? `Evidencias Fotográficas (${ticket.imagenes.length})`
            : "Evidencias Fotográficas"
        }>
          <EvidenceGallery folio={ticket.folio_ticket} imagenes={ticket.imagenes} />
        </Section>

      </div>

      <PageFooter right={`${ticket.folio_ticket} · ${fechaGen}`} />

    </div>
  );
}
