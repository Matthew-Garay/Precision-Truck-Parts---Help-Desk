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

function ProgressStepper({ estatus, fechaAlta, horaAlta, fechaRes, horaRes, tecnico }: {
  estatus: string; fechaAlta: string; horaAlta: string;
  fechaRes: string | null; horaRes: string | null; tecnico: string | null;
}) {
  const step = estatus === "Resuelto" ? 2 : estatus === "En proceso" ? 1 : 0;
  const steps = [
    { label: "Recibido",   sub: `${fechaAlta} · ${horaAlta}` },
    { label: "En proceso", sub: tecnico ? `Téc. ${tecnico}` : "Pendiente asignación" },
    { label: "Resuelto",   sub: fechaRes ? `${fechaRes} · ${horaRes}` : "Pendiente" },
  ];
  return (
    <div className="pr-stepper">
      {steps.map((s, i) => {
        const done   = i <= step;
        const active = i === step;
        const last   = i === steps.length - 1;
        return (
          <div key={s.label} className="pr-step">
            <div className="pr-step-track">
              <div className={`pr-step-node${done ? " done" : ""}${active ? " active" : ""}`}>
                {i < step ? "✓" : i + 1}
              </div>
              {!last && <div className={`pr-step-line${i < step ? " done" : ""}`} />}
            </div>
            <div className="pr-step-content">
              <span className={`pr-step-label${!done ? " pending" : ""}`}>{s.label}</span>
              <span className="pr-step-sub">{s.sub}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function EvidenceGallery({ folio, imagenes }: { folio: string; imagenes: string[] }) {
  const apiBase = import.meta.env.VITE_API_URL || "";
  if (imagenes.length === 0) {
    return (
      <div className="pr-no-evidence">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect x="3" y="3" width="18" height="18" rx="2"/>
          <circle cx="8.5" cy="8.5" r="1.5"/>
          <polyline points="21 15 16 10 5 21"/>
        </svg>
        <span>No se adjuntaron evidencias fotográficas a este reporte.</span>
      </div>
    );
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
      <div className="pr-content">

        <PageHeader
          titulo="Reporte de Incidencia Técnica"
          subtitulo="Departamento de Soporte Técnico"
          metaRows={[
            { label: "Folio",    value: ticket.folio_ticket, mono: true },
            { label: "Generado", value: fechaGen },
          ]}
        />

        {/* ── Banda de estado ── */}
        <div className="pr-status-bar">
          <div className="pr-status-cell pr-status-cell--title">
            <span className="pr-micro-label">Título del Incidente</span>
            <span className="pr-status-title">{ticket.titulo}</span>
          </div>
          <div className="pr-status-cell">
            <span className="pr-micro-label">Estatus</span>
            <Badge label={ticket.estatus} icon={estatus.icon} bg={estatus.bg} color={estatus.color} border={estatus.border} />
          </div>
          <div className="pr-status-cell">
            <span className="pr-micro-label">Prioridad</span>
            <Badge label={prio.label} bg={prio.bg} color={prio.color} border={prio.border} />
          </div>
          {tiempoRes && (
            <div className="pr-status-cell">
              <span className="pr-micro-label">Tiempo resolución</span>
              <span className="pr-status-time">{tiempoRes}</span>
            </div>
          )}
        </div>

        <Section title="Datos del Reporte">
          <DataGrid items={[
            { label: "Folio",          value: ticket.folio_ticket, half: true },
            { label: "Solicitante",    value: ticket.nombre_empleado, half: true },
            { label: "Departamento",   value: ticket.nombre_departamento, half: true },
            { label: "Categoría",      value: ticket.nombre_categoria, half: true },
            { label: "Fecha de alta",  value: `${fechaAlta} · ${horaAlta}`, half: true },
            ...(fechaRes ? [
              { label: "Fecha resolución",     value: `${fechaRes} · ${horaRes}`, half: true },
              { label: "Resuelto por",         value: ticket.resuelto_por ?? "—", half: true },
              { label: "Tiempo de resolución", value: tiempoRes ?? "—", half: true },
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
          <div className="pr-resolution-box">
            <div className="pr-resolution-header">
              <span className="pr-resolution-tech">{ticket.resuelto_por ?? "Sin técnico asignado"}</span>
              <span className="pr-resolution-role">Técnico de Soporte · Precision Truck Parts &amp; Accessories</span>
            </div>
            <div className="pr-rich-text pr-rich-text--white">
              {ticket.comentarios
                ? <span dangerouslySetInnerHTML={{ __html: ticket.comentarios }} />
                : <em>Sin comentarios registrados.</em>
              }
            </div>
          </div>
        </Section>

        <div className="pr-two-col">
          <Section title="Progreso del Ticket">
            <ProgressStepper
              estatus={ticket.estatus}
              fechaAlta={fechaAlta}
              horaAlta={horaAlta}
              fechaRes={fechaRes}
              horaRes={horaRes}
              tecnico={ticket.resuelto_por ?? null}
            />
          </Section>

          <Section title="Calificación y Firma">
            {calNum > 0 ? (
              <div className="pr-rating">
                <Stars n={calNum} />
                <span className="pr-rating-score">{calNum} / 5</span>
                <span className="pr-rating-label">{CAL_LABEL[calNum]}</span>
                <span className="pr-rating-by">Evaluado por: {ticket.nombre_empleado}</span>
              </div>
            ) : (
              <p className="pr-empty">Valoración pendiente.</p>
            )}
            <Firma nombre={ticket.resuelto_por ?? "Pendiente"} rol="Técnico de Soporte" />
          </Section>
        </div>

        <Section title={ticket.imagenes.length > 0
          ? `Evidencias Fotográficas — ${ticket.imagenes.length} archivo${ticket.imagenes.length !== 1 ? "s" : ""}`
          : "Evidencias Fotográficas"
        }>
          <EvidenceGallery folio={ticket.folio_ticket} imagenes={ticket.imagenes} />
        </Section>

        <PageFooter right={`${ticket.folio_ticket} · ${fechaGen}`} />
      </div>
    </div>
  );
}
