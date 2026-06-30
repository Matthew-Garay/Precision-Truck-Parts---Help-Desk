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

const PRIO_META: Record<string, { cls: string; dot: string }> = {
  Urgente: { cls: "badge-urgente", dot: "#991B1B" },
  Alta:    { cls: "badge-alta",    dot: "#9A3412" },
  Media:   { cls: "badge-media",   dot: "#92400E" },
  Baja:    { cls: "badge-baja",    dot: "#15803D" },
};

const ESTATUS_META: Record<string, { cls: string; icon: string }> = {
  "Resuelto":    { cls: "badge-resuelto",   icon: "✓" },
  "En proceso":  { cls: "badge-proceso",    icon: "◷" },
  "Pendiente":   { cls: "badge-proceso",    icon: "◷" },
  "No Resuelto": { cls: "badge-noresuelto", icon: "✕" },
  "Rechazado":   { cls: "badge-noresuelto", icon: "✕" },
};

function LogoPTP({ size = 48 }: { size?: number }) {
  return (
    <svg height={size} viewBox="0 0 220 60" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="220" height="60" rx="4" fill="#0C1A2E" />
      <text x="14" y="40" fontFamily="Inter,Arial,sans-serif" fontSize="22" fontWeight="900" fill="#E8621A" letterSpacing="-1">PTP</text>
      <line x1="62" y1="10" x2="62" y2="50" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
      <text x="72" y="27" fontFamily="Inter,Arial,sans-serif" fontSize="8" fontWeight="700" fill="rgba(255,255,255,0.7)" letterSpacing="2.5">PRECISION TRUCK PARTS</text>
      <text x="72" y="42" fontFamily="Inter,Arial,sans-serif" fontSize="7" fontWeight="400" fill="rgba(255,255,255,0.35)" letterSpacing="1">&amp; ACCESSORIES</text>
    </svg>
  );
}

function PageHeader({ folio }: { folio: string }) {
  return (
    <header className="pr-page-header">
      <LogoPTP size={34} />
      <div className="pr-page-header-center">
        <span className="pr-page-header-label">Precision Truck Parts &amp; Accessories</span>
        <span className="pr-page-header-title">Solicitud de Insumos</span>
      </div>
      <div className="pr-page-header-right">
        <span className="pr-folio-chip">{folio}</span>
      </div>
    </header>
  );
}

function PageFooter({ folio, fecha }: { folio: string; fecha: string }) {
  return (
    <footer className="pr-page-footer">
      <span className="pr-footer-brand">Precision Truck Parts &amp; Accessories · HelpDesk</span>
      <span className="pr-footer-folio">{folio}</span>
      <span className="pr-footer-date">Generado: {fecha} · CONFIDENCIAL</span>
    </footer>
  );
}

function CoverPage({ solicitud, fechaGen }: { solicitud: Solicitud; fechaGen: string }) {
  const prio    = PRIO_META[solicitud.prioridad]  ?? PRIO_META.Baja;
  const estatus = ESTATUS_META[solicitud.estatus] ?? ESTATUS_META["Pendiente"];
  const total   = solicitud.detalle.reduce((s, d) => s + d.cantidad, 0);

  return (
    <div className="pr-cover">
      <div className="pr-cover-hero">
        <LogoPTP size={46} />
        <div style={{ marginTop: 36 }}>
          <span className="pr-cover-hero-accent">Documento Oficial de Solicitud</span>
          <h1 className="pr-cover-hero-title">Solicitud de<br />Insumos</h1>
          <div className="pr-cover-hero-rule" />
        </div>
        <div style={{ marginTop: 24, display: "flex", gap: 8, flexWrap: "wrap" as const }}>
          <span className={`pr-badge ${prio.cls}`}>
            <span className="pr-badge-dot" style={{ background: prio.dot }} />
            Prioridad {solicitud.prioridad}
          </span>
          <span className={`pr-badge ${estatus.cls}`}>
            {estatus.icon} {solicitud.estatus}
          </span>
        </div>
      </div>

      <div className="pr-cover-body">
        <div className="pr-cover-folio-block">
          <div>
            <span className="pr-micro-label">Folio del documento</span>
            <div className="pr-cover-folio">{solicitud.folio_solicitud}</div>
          </div>
        </div>

        <div className="pr-cover-card">
          <div className="pr-cover-card-header">
            <span className="pr-cover-card-label">Datos de la solicitud</span>
          </div>
          <div className="pr-cover-card-body">
            <div className="pr-cover-card-cell">
              <span className="pr-micro-label">Solicitante</span>
              <span className="pr-cover-card-val">{solicitud.nombre_empleado}</span>
            </div>
            <div className="pr-cover-card-cell">
              <span className="pr-micro-label">Departamento</span>
              <span className="pr-cover-card-val">{solicitud.nombre_departamento}</span>
            </div>
            <div className="pr-cover-card-cell">
              <span className="pr-micro-label">Fecha de solicitud</span>
              <span className="pr-cover-card-val">{fmt.fecha(solicitud.fecha)}</span>
            </div>
            <div className="pr-cover-card-cell">
              <span className="pr-micro-label">Total de piezas</span>
              <span className="pr-cover-card-val">{total} unidades · {solicitud.detalle.length} tipo{solicitud.detalle.length !== 1 ? "s" : ""}</span>
            </div>
          </div>
        </div>

        <div className="pr-cover-meta-strip">
          <div className="pr-cover-meta-item">
            <span className="pr-micro-label">Generado el</span>
            <span className="pr-cover-meta-val">{fechaGen}</span>
          </div>
          <div className="pr-cover-meta-item">
            <span className="pr-micro-label">Sistema</span>
            <span className="pr-cover-meta-val">PTP HelpDesk v1.0</span>
          </div>
          <div className="pr-cover-meta-item">
            <span className="pr-micro-label">Clasificación</span>
            <span className="pr-cover-meta-val">Uso interno · Confidencial</span>
          </div>
        </div>
      </div>

      <div className="pr-cover-bottombar">
        <span className="pr-cover-bottombar-text">Precision Truck Parts &amp; Accessories — Sistema de Soporte Técnico</span>
        <span className="pr-cover-bottombar-folio">{solicitud.folio_solicitud}</span>
      </div>
    </div>
  );
}

function Section({
  title, icon, accent = false, children,
}: { title: string; icon: string; accent?: boolean; children: React.ReactNode }) {
  return (
    <section className={`pr-section${accent ? " pr-section--accent" : ""}`}>
      <div className="pr-section-hdr">
        <span className="pr-section-icon">{icon}</span>
        <span className="pr-section-title">{title}</span>
        <div className="pr-section-rule" />
      </div>
      <div className="pr-section-body">{children}</div>
    </section>
  );
}

function DataRow({ items }: { items: { label: string; value: string; wide?: boolean }[] }) {
  return (
    <div className="pr-data-row">
      {items.map(({ label, value, wide }) => (
        <div key={label} className={`pr-data-cell${wide ? " pr-data-cell--wide" : ""}`}>
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
              <div className={`pr-step-node${done ? " pr-step-node--done" : ""}${active ? " pr-step-node--active" : ""}`}>
                <span className="pr-step-check">{i < step ? "✓" : i + 1}</span>
              </div>
              {!last && <div className={`pr-step-line${i < step ? " pr-step-line--done" : ""}`} />}
            </div>
            <div className="pr-step-content">
              <span className={`pr-step-label${active ? " pr-step-label--active" : ""}${!done ? " pr-step-label--pending" : ""}`}>
                {s}
                {active && step < 2 && <span className="pr-step-current-badge">Actual</span>}
                {active && step === 2 && <span className="pr-step-done-badge">✓ Completado</span>}
              </span>
              {i === 0 && <span className="pr-step-sub">{fechaSolicitud}</span>}
            </div>
          </div>
        );
      })}
      {cerrado && (
        <div className="pr-step">
          <div className="pr-step-track">
            <div className="pr-step-node" style={{ background: "#B91C1C", borderColor: "#B91C1C" }}>
              <span className="pr-step-check">✕</span>
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
        <span className="pr-no-evidence-icon">□</span>
        <span>No hay insumos registrados en esta solicitud.</span>
      </div>
    );
  }

  const cols = "2fr 1.6fr 0.8fr 0.6fr 0.7fr";

  return (
    <div style={{ width: "100%", borderRadius: 5, overflow: "hidden", border: "1px solid var(--pr-border)" }}>
      {/* Cabecera */}
      <div style={{ display: "grid", gridTemplateColumns: cols, background: "var(--pr-navy)", padding: "8px 12px", gap: 8 }}>
        {["Insumo", "Especificaciones", "Stock", "Cant.", "Estado"].map(h => (
          <span key={h} style={{ fontSize: "6pt", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.15em", color: "rgba(255,255,255,0.5)" }}>{h}</span>
        ))}
      </div>

      {/* Filas */}
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
            <span style={{ fontSize: "12pt", fontWeight: 900, color: "var(--pr-orange)", letterSpacing: "-0.02em" }}>×{d.cantidad}</span>
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

      {/* Total */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "8px 12px", background: "var(--pr-navy)",
      }}>
        <span style={{ fontSize: "6.5pt", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.15em", color: "rgba(255,255,255,0.45)" }}>
          Total de piezas solicitadas
        </span>
        <span style={{ fontSize: "13pt", fontWeight: 900, color: "var(--pr-orange2, #F47920)", letterSpacing: "-0.02em" }}>
          {items.reduce((s, d) => s + d.cantidad, 0)} pzas.
        </span>
      </div>
    </div>
  );
}

export default function PrintSolicitudView({ solicitud }: PrintSolicitudViewProps) {
  const now      = new Date();
  const fechaGen = `${fmt.fecha(now.toISOString())} · ${fmt.hora(now.toISOString())}`;
  const fechaSol = `${fmt.fechaCorta(solicitud.fecha)} · ${fmt.hora(solicitud.fecha)}`;

  const prio    = PRIO_META[solicitud.prioridad]  ?? PRIO_META.Baja;
  const estatus = ESTATUS_META[solicitud.estatus] ?? ESTATUS_META["Pendiente"];
  const total   = solicitud.detalle.reduce((s, d) => s + d.cantidad, 0);

  return (
    <div className="pr-root" data-ready="true">

      <CoverPage solicitud={solicitud} fechaGen={fechaGen} />

      <div className="pr-content">
        <PageHeader folio={solicitud.folio_solicitud} />

        <Section title="Resumen de la Solicitud" icon="▪">
          <div className="pr-summary-banner">
            <div className="pr-summary-left">
              <span className="pr-micro-label">Folio</span>
              <span className="pr-summary-folio">{solicitud.folio_solicitud}</span>
            </div>
            <div className="pr-summary-divider" />
            <div className="pr-summary-badges">
              <span className={`pr-badge pr-badge--lg ${prio.cls}`}>
                <span className="pr-badge-dot" style={{ background: prio.dot }} />
                Prioridad {solicitud.prioridad}
              </span>
              <span className={`pr-badge pr-badge--lg ${estatus.cls}`}>
                {estatus.icon} {solicitud.estatus}
              </span>
              <span className="pr-badge pr-badge--lg badge-proceso">
                {solicitud.detalle.length} tipo{solicitud.detalle.length !== 1 ? "s" : ""} · {total} pzas.
              </span>
            </div>
          </div>
          <DataRow items={[
            { label: "Solicitante",        value: solicitud.nombre_empleado },
            { label: "Departamento",       value: solicitud.nombre_departamento },
            { label: "Fecha de solicitud", value: fechaSol },
            { label: "Estado",             value: solicitud.estatus },
          ]} />
        </Section>

        <Section title={`Insumos Solicitados (${solicitud.detalle.length} ítems)`} icon="▪" accent>
          <InsumosTable items={solicitud.detalle} />
        </Section>

        <div className="pr-two-col">
          <Section title="Estado de la Solicitud" icon="▪">
            <SolicitudStepper estatus={solicitud.estatus} fechaSolicitud={fechaSol} />
          </Section>

          <Section title="Información Adicional" icon="▪">
            <DataRow items={[
              { label: "Solicitante",            value: solicitud.nombre_empleado, wide: true },
            ]} />
            <DataRow items={[
              { label: "Departamento / Área",    value: solicitud.nombre_departamento, wide: true },
            ]} />
            <DataRow items={[
              { label: "Tipos de insumo",        value: String(solicitud.detalle.length) },
              { label: "Total de piezas",        value: `${total} unidades` },
            ]} />
            <div className="pr-signature" style={{ marginTop: 12 }}>
              <div className="pr-signature-line" />
              <span className="pr-signature-name">{solicitud.nombre_empleado}</span>
              <span className="pr-signature-role">Solicitante</span>
              <span className="pr-signature-role">Precision Truck Parts &amp; Accessories</span>
            </div>
          </Section>
        </div>

        <PageFooter folio={solicitud.folio_solicitud} fecha={fechaGen} />
      </div>
    </div>
  );
}
