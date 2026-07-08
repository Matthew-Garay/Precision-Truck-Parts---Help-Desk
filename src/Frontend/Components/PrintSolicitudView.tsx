import {
  Badge, PageHeader, PageFooter, Section, DataGrid, Firma,
  PRIO_META, ESTATUS_META, fmt, nowFechaGen,
} from "./PrintShared";

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
            <div className="pr-step-node done" style={{ background: "#B91C1C", borderColor: "#B91C1C" }}>✕</div>
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

export default function PrintSolicitudView({ solicitud }: { solicitud: Solicitud }) {
  const fechaGen = nowFechaGen();
  const fechaSol = fmt.fechaHora(solicitud.fecha);
  const total    = solicitud.detalle.reduce((s, d) => s + d.cantidad, 0);

  const prio    = PRIO_META[solicitud.prioridad]  ?? PRIO_META.Baja;
  const estatus = ESTATUS_META[solicitud.estatus] ?? ESTATUS_META["Pendiente"];

  return (
    <div className="pr-root" data-ready="true">
      <div className="pr-content">

        <PageHeader
          titulo="Solicitud de Insumos"
          subtitulo="Departamento de Almacén e Inventario"
          metaRows={[
            { label: "Folio",    value: solicitud.folio_solicitud, mono: true },
            { label: "Generado", value: fechaGen },
          ]}
        />

        {/* ── Banda de estado ── */}
        <div className="pr-status-bar">
          <div className="pr-status-cell pr-status-cell--title">
            <span className="pr-micro-label">Solicitante</span>
            <span className="pr-status-title">{solicitud.nombre_empleado}</span>
          </div>
          <div className="pr-status-cell">
            <span className="pr-micro-label">Estatus</span>
            <Badge label={solicitud.estatus} icon={estatus.icon} bg={estatus.bg} color={estatus.color} border={estatus.border} />
          </div>
          <div className="pr-status-cell">
            <span className="pr-micro-label">Prioridad</span>
            <Badge label={prio.label} bg={prio.bg} color={prio.color} border={prio.border} />
          </div>
          <div className="pr-status-cell">
            <span className="pr-micro-label">Total piezas</span>
            <span className="pr-status-time">{total} pzas.</span>
          </div>
        </div>

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

        <Section title={`Insumos Solicitados — ${solicitud.detalle.length} ítem${solicitud.detalle.length !== 1 ? "s" : ""}`}>
          <InsumosTable items={solicitud.detalle} />
        </Section>

        <div className="pr-two-col">
          <Section title="Estado de la Solicitud">
            <SolicitudStepper estatus={solicitud.estatus} fechaSolicitud={fechaSol} />
          </Section>
          <Section title="Firma del Solicitante">
            <Firma nombre={solicitud.nombre_empleado} rol="Solicitante" />
          </Section>
        </div>

        <PageFooter right={`${solicitud.folio_solicitud} · ${fechaGen}`} />
      </div>
    </div>
  );
}
