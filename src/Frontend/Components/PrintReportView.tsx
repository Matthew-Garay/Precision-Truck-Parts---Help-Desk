import "./print-report.css";

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

interface PrintReportViewProps {
  ticket: Ticket;
  generadoPor?: string;
}

const fmt = {
  fecha: (d: string) =>
    new Date(d).toLocaleDateString("es-MX", { day: "2-digit", month: "long", year: "numeric" }),
  fechaCorta: (d: string) =>
    new Date(d).toLocaleDateString("es-MX", { day: "2-digit", month: "2-digit", year: "numeric" }),
  hora: (d: string) =>
    new Date(d).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" }),
};

const PRIO_META: Record<string, { label: string; bg: string; color: string; border: string }> = {
  Urgente: { label: "URGENTE", bg: "#FEF2F2", color: "#B91C1C", border: "#FCA5A5" },
  Alta:    { label: "ALTA",    bg: "#FFF7ED", color: "#C2410C", border: "#FDBA74" },
  Media:   { label: "MEDIA",   bg: "#FEFCE8", color: "#A16207", border: "#FDE047" },
  Baja:    { label: "BAJA",    bg: "#F0FDF4", color: "#15803D", border: "#86EFAC" },
};

const ESTATUS_META: Record<string, { icon: string; bg: string; color: string; border: string }> = {
  "Resuelto":    { icon: "✓", bg: "#F0FDF4", color: "#15803D", border: "#86EFAC" },
  "En proceso":  { icon: "◷", bg: "#FFF7ED", color: "#C2410C", border: "#FDBA74" },
  "No Resuelto": { icon: "✕", bg: "#FEF2F2", color: "#B91C1C", border: "#FCA5A5" },
  "Cancelado":   { icon: "✕", bg: "#F1F5F9", color: "#475569", border: "#CBD5E1" },
};

const CAL_LABEL = ["", "Muy malo", "Malo", "Regular", "Bueno", "Excelente"];

function calcTiempo(inicio: string, fin: string): string {
  const mins = Math.floor((new Date(fin).getTime() - new Date(inicio).getTime()) / 60000);
  const d = Math.floor(mins / 1440);
  const h = Math.floor((mins % 1440) / 60);
  const m = mins % 60;
  return [d > 0 ? `${d}d` : "", h > 0 ? `${h}h` : "", `${m}m`].filter(Boolean).join(" ");
}

function Badge({ label, bg, color, border, icon }: {
  label: string; bg: string; color: string; border: string; icon?: string;
}) {
  return (
    <span className="pr-badge" style={{ background: bg, color, border: `1px solid ${border}` }}>
      {icon && <span>{icon}</span>}
      {label}
    </span>
  );
}

function Stars({ n }: { n: number }) {
  return (
    <span className="pr-stars">
      {[1,2,3,4,5].map(i => (
        <svg key={i} width="13" height="13" viewBox="0 0 24 24"
          fill={i <= n ? "#F59E0B" : "none"}
          stroke={i <= n ? "#D97706" : "#CBD5E1"}
          strokeWidth="1.5">
          <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
        </svg>
      ))}
    </span>
  );
}

function PageHeader({ folio, fechaGen }: { folio: string; fechaGen: string }) {
  return (
    <header className="pr-page-header">
      {/* Logo izquierda */}
      <div className="pr-header-logo">
        <img src="/assets/img/logo negro.png" alt="Precision Truck Parts" className="pr-logo-img" />
      </div>

      {/* Centro: nombre empresa + tipo documento */}
      <div className="pr-header-center">
        <span className="pr-header-company">PRECISION TRUCK PARTS &amp; ACCESSORIES</span>
        <span className="pr-header-doc">Reporte de Incidencia Técnica</span>
        <span className="pr-header-dept">Departamento de Soporte Técnico</span>
      </div>

      {/* Derecha: folio + fecha */}
      <div className="pr-header-meta">
        <div className="pr-header-meta-row">
          <span className="pr-micro-label">Folio</span>
          <span className="pr-folio">{folio}</span>
        </div>
        <div className="pr-header-meta-row">
          <span className="pr-micro-label">Generado</span>
          <span className="pr-header-fecha">{fechaGen}</span>
        </div>
      </div>
    </header>
  );
}

function PageFooter({ folio, fechaGen }: { folio: string; fechaGen: string }) {
  return (
    <footer className="pr-page-footer">
      <div className="pr-footer-logo-wrap">
        <img src="/assets/img/log.png" alt="" className="pr-footer-logo" />
      </div>
      <span className="pr-footer-center-text">
        Precision Truck Parts &amp; Accessories — Sistema de Soporte Técnico HelpDesk
      </span>
      <span className="pr-footer-right-text">{folio} · {fechaGen}</span>
    </footer>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="pr-section">
      <div className="pr-section-hdr">
        <span className="pr-section-title">{title}</span>
      </div>
      <div className="pr-section-body">{children}</div>
    </section>
  );
}

function DataGrid({ items }: { items: { label: string; value: React.ReactNode; wide?: boolean; half?: boolean }[] }) {
  return (
    <div className="pr-data-grid">
      {items.map(({ label, value, wide, half }, i) => (
        <div
          key={i}
          className={`pr-data-cell${wide ? " wide" : ""}${half ? " half" : ""}`}
        >
          <span className="pr-micro-label">{label}</span>
          <span className="pr-data-val">{value || "—"}</span>
        </div>
      ))}
    </div>
  );
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

export default function PrintReportView({ ticket }: PrintReportViewProps) {
  const now       = new Date();
  const fechaGen  = `${fmt.fechaCorta(now.toISOString())} · ${fmt.hora(now.toISOString())}`;
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

        <PageHeader folio={ticket.folio_ticket} fechaGen={fechaGen} />

        {/* ── Banda de estado ── */}
        <div className="pr-status-bar">
          <div className="pr-status-cell pr-status-cell--title">
            <span className="pr-micro-label">Título del Incidente</span>
            <span className="pr-status-title">{ticket.titulo}</span>
          </div>
          <div className="pr-status-cell">
            <span className="pr-micro-label">Estatus</span>
            <Badge
              label={ticket.estatus}
              icon={estatus.icon}
              bg={estatus.bg}
              color={estatus.color}
              border={estatus.border}
            />
          </div>
          <div className="pr-status-cell">
            <span className="pr-micro-label">Prioridad</span>
            <Badge
              label={prio.label}
              bg={prio.bg}
              color={prio.color}
              border={prio.border}
            />
          </div>
          {tiempoRes && (
            <div className="pr-status-cell">
              <span className="pr-micro-label">Tiempo resolución</span>
              <span className="pr-status-time">{tiempoRes}</span>
            </div>
          )}
        </div>

        {/* ── Datos del reporte ── */}
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

        {/* ── Descripción ── */}
        <Section title="Descripción del Problema">
          <div
            className="pr-rich-text"
            dangerouslySetInnerHTML={{
              __html: ticket.descripcion || "<em>Sin descripción registrada.</em>",
            }}
          />
        </Section>

        {/* ── Resolución del técnico ── */}
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

        {/* ── Progreso + Calificación ── */}
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
            <div className="pr-signature">
              <div className="pr-signature-area" />
              <div className="pr-signature-line" />
              <span className="pr-signature-name">{ticket.resuelto_por ?? "Pendiente"}</span>
              <span className="pr-signature-role">Técnico de Soporte</span>
              <span className="pr-signature-role">Precision Truck Parts &amp; Accessories</span>
            </div>
          </Section>
        </div>

        {/* ── Evidencias (siempre visible, estructurada aunque esté vacía) ── */}
        <Section title={ticket.imagenes.length > 0 ? `Evidencias Fotográficas — ${ticket.imagenes.length} archivo${ticket.imagenes.length !== 1 ? "s" : ""}` : "Evidencias Fotográficas"}>
          <EvidenceGallery folio={ticket.folio_ticket} imagenes={ticket.imagenes} />
        </Section>

        <PageFooter folio={ticket.folio_ticket} fechaGen={fechaGen} />
      </div>
    </div>
  );
}
