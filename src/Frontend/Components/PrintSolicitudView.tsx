import "./print-report.css";

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

interface PrintSolicitudViewProps {
  solicitud: Solicitud;
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
  "Pendiente":   { icon: "◷", bg: "#FFF7ED", color: "#C2410C", border: "#FDBA74" },
  "No Resuelto": { icon: "✕", bg: "#FEF2F2", color: "#B91C1C", border: "#FCA5A5" },
  "Rechazado":   { icon: "✕", bg: "#F1F5F9", color: "#475569", border: "#CBD5E1" },
};

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

function PageHeader({ folio, fechaGen }: { folio: string; fechaGen: string }) {
  return (
    <header className="pr-page-header">
      <div className="pr-header-logo">
        <img src="/assets/img/logo negro.png" alt="Precision Truck Parts" className="pr-logo-img" />
      </div>
      <div className="pr-header-center">
        <span className="pr-header-company">PRECISION TRUCK PARTS &amp; ACCESSORIES</span>
        <span className="pr-header-doc">Solicitud de Insumos</span>
        <span className="pr-header-dept">Departamento de Almacén e Inventario</span>
      </div>
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
        <div key={i} className={`pr-data-cell${wide ? " wide" : ""}${half ? " half" : ""}`}>
          <span className="pr-micro-label">{label}</span>
          <span className="pr-data-val">{value || "—"}</span>
        </div>
      ))}
    </div>
  );
}

function SolicitudStepper({ estatus, fechaSolicitud }: { estatus: string; fechaSolicitud: string }) {
  const pasos = ["Pendiente", "En proceso", "Resuelto"];
  const cerrado = estatus === "No Resuelto" || estatus === "Rechazado";
  const step = cerrado ? -1
    : estatus === "Resuelto"   ? 2
    : estatus === "En proceso" ? 1
    : 0;

  return (
    <div className="pr-stepper">
      {pasos.map((s, i) => {
        const done   = !cerrado && i <= step;
        const active = !cerrado && i === step;
        const last   = i === 2;
        return (
          <div key={s} className="pr-step">
            <div className="pr-step-track">
              <div className={`pr-step-node${done ? " done" : ""}${active ? " active" : ""}`}>
                {i < step ? "✓" : i + 1}
              </div>
              {!last && <div className={`pr-step-line${i < step ? " done" : ""}`} />}
            </div>
            <div className="pr-step-content">
              <span className={`pr-step-label${!done ? " pending" : ""}`}>{s}</span>
              {i === 0 && <span className="pr-step-sub">{fechaSolicitud}</span>}
            </div>
          </div>
        );
      })}
      {cerrado && (
        <div className="pr-step">
          <div className="pr-step-track">
            <div className="pr-step-node done" style={{ background: "#B91C1C", borderColor: "#B91C1C" }}>
              ✕
            </div>
          </div>
          <div className="pr-step-content">
            <span className="pr-step-label" style={{ color: "#B91C1C" }}>{estatus}</span>
          </div>
        </div>
      )}
    </div>
  );
}

function InsumosTable({ items }: { items: DetalleItem[] }) {
  if (!items.length) {
    return (
      <div className="pr-no-evidence">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect x="3" y="3" width="18" height="18" rx="2"/>
          <path d="M3 9h18M9 21V9"/>
        </svg>
        <span>No hay insumos registrados en esta solicitud.</span>
      </div>
    );
  }

  const cols = "2fr 1.6fr 0.8fr 0.6fr 0.7fr";

  return (
    <div style={{ width: "100%", borderRadius: 5, overflow: "hidden", border: "1px solid var(--pr-border)" }}>
      <div style={{ display: "grid", gridTemplateColumns: cols, background: "var(--pr-navy)", padding: "8px 12px", gap: 8 }}>
        {["Insumo", "Especificaciones", "Stock", "Cant.", "Estado"].map(h => (
          <span key={h} style={{ fontSize: "6pt", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.15em", color: "rgba(255,255,255,0.5)" }}>{h}</span>
        ))}
      </div>
      {items.map((d, i) => {
        const aprobado = d.aprobado == null ? true : Boolean(d.aprobado);
        return (
          <div key={d.id_solicitud_insumo} style={{
            display: "grid", gridTemplateColumns: cols,
            gap: 8, padding: "9px 12px",
            background: i % 2 === 0 ? "#FFFFFF" : "var(--pr-surface)",
            borderBottom: "1px solid var(--pr-border)",
            alignItems: "center",
          }}>
            <span style={{ fontSize: "9.5pt", fontWeight: 700, color: "var(--pr-ink)", lineHeight: 1.3 }}>{d.nombre}</span>
            <span style={{ fontSize: "8pt", color: "var(--pr-muted)", lineHeight: 1.4 }}>
              {[d.marca, d.modelo].filter(Boolean).join(" · ") || "—"}
              {d.num_serie && <><br /><span style={{ fontSize: "7pt", color: "var(--pr-faint)" }}>S/N: {d.num_serie}</span></>}
            </span>
            <span style={{
              fontSize: "9pt", fontWeight: 700,
              color: d.stock > 5 ? "#15803D" : d.stock > 0 ? "#B45309" : "#B91C1C",
            }}>{d.stock} uds.</span>
            <span style={{ fontSize: "12pt", fontWeight: 900, color: "var(--pr-accent)", letterSpacing: "-0.02em" }}>×{d.cantidad}</span>
            <span style={{
              display: "inline-flex", alignItems: "center", gap: 3,
              fontSize: "7pt", fontWeight: 800,
              color: aprobado ? "#15803D" : "#B91C1C",
              background: aprobado ? "#F0FDF4" : "#FEF2F2",
              border: `1px solid ${aprobado ? "#BBF7D0" : "#FECACA"}`,
              borderRadius: 3, padding: "2px 6px", whiteSpace: "nowrap" as const,
            }}>{aprobado ? "✓ Aprobado" : "✕ Denegado"}</span>
          </div>
        );
      })}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "8px 12px", background: "var(--pr-navy)",
      }}>
        <span style={{ fontSize: "6.5pt", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.15em", color: "rgba(255,255,255,0.45)" }}>
          Total de piezas solicitadas
        </span>
        <span style={{ fontSize: "13pt", fontWeight: 900, color: "#F47920", letterSpacing: "-0.02em" }}>
          {items.reduce((s, d) => s + d.cantidad, 0)} pzas.
        </span>
      </div>
    </div>
  );
}

export default function PrintSolicitudView({ solicitud }: PrintSolicitudViewProps) {
  const now      = new Date();
  const fechaGen = `${fmt.fechaCorta(now.toISOString())} · ${fmt.hora(now.toISOString())}`;
  const fechaSol = `${fmt.fechaCorta(solicitud.fecha)} · ${fmt.hora(solicitud.fecha)}`;
  const total    = solicitud.detalle.reduce((s, d) => s + d.cantidad, 0);

  const prio    = PRIO_META[solicitud.prioridad]  ?? PRIO_META.Baja;
  const estatus = ESTATUS_META[solicitud.estatus] ?? ESTATUS_META["Pendiente"];

  return (
    <div className="pr-root" data-ready="true">
      <div className="pr-content">

        <PageHeader folio={solicitud.folio_solicitud} fechaGen={fechaGen} />

        {/* ── Banda de estado ── */}
        <div className="pr-status-bar">
          <div className="pr-status-cell pr-status-cell--title">
            <span className="pr-micro-label">Solicitante</span>
            <span className="pr-status-title">{solicitud.nombre_empleado}</span>
          </div>
          <div className="pr-status-cell">
            <span className="pr-micro-label">Estatus</span>
            <Badge
              label={solicitud.estatus}
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
          <div className="pr-status-cell">
            <span className="pr-micro-label">Total piezas</span>
            <span className="pr-status-time">{total} pzas.</span>
          </div>
        </div>

        {/* ── Datos de la solicitud ── */}
        <Section title="Datos de la Solicitud">
          <DataGrid items={[
            { label: "Folio",              value: solicitud.folio_solicitud, half: true },
            { label: "Solicitante",        value: solicitud.nombre_empleado, half: true },
            { label: "Departamento",       value: solicitud.nombre_departamento, half: true },
            { label: "Fecha de solicitud", value: fechaSol, half: true },
            { label: "Estatus",            value: solicitud.estatus, half: true },
            { label: "Prioridad",          value: solicitud.prioridad, half: true },
            { label: "Tipos de insumo",    value: String(solicitud.detalle.length), half: true },
            { label: "Total de piezas",    value: `${total} unidades`, half: true },
          ]} />
        </Section>

        {/* ── Insumos solicitados ── */}
        <Section title={`Insumos Solicitados — ${solicitud.detalle.length} ítem${solicitud.detalle.length !== 1 ? "s" : ""}`}>
          <InsumosTable items={solicitud.detalle} />
        </Section>

        {/* ── Progreso + Firma ── */}
        <div className="pr-two-col">
          <Section title="Estado de la Solicitud">
            <SolicitudStepper estatus={solicitud.estatus} fechaSolicitud={fechaSol} />
          </Section>

          <Section title="Firma del Solicitante">
            <div className="pr-signature">
              <div className="pr-signature-area" />
              <div className="pr-signature-line" />
              <span className="pr-signature-name">{solicitud.nombre_empleado}</span>
              <span className="pr-signature-role">Solicitante</span>
              <span className="pr-signature-role">Precision Truck Parts &amp; Accessories</span>
            </div>
          </Section>
        </div>

        <PageFooter folio={solicitud.folio_solicitud} fechaGen={fechaGen} />
      </div>
    </div>
  );
}
