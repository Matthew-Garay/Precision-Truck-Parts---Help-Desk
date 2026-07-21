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
  imagen_url?: string | null;
}

interface Solicitud {
  folio_solicitud: string;
  fecha: string;
  estatus: string;
  prioridad: string;
  nombre_empleado: string;
  nombre_departamento: string;
  nombre_sucursal?: string | null;
  detalle: DetalleItem[];
}

function InsumosTable({ items }: { items: DetalleItem[] }) {
  if (!items.length) {
    return <p className="pr-empty">No hay insumos registrados en esta solicitud.</p>;
  }

  return (
    <table className="pr-insumos-table">
      <thead>
        <tr>
          {["#", "Img.", "Insumo", "Especificaciones", "Stock", "Cant.", "Estado"].map(h => (
            <th key={h}>{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {items.map((d, i) => {
          const sinRevisar = d.aprobado == null;
          const aprobado   = d.aprobado === 1 || (d.aprobado as unknown) === true;
          const badgeColor  = sinRevisar ? "#92400E" : aprobado ? "#15803D" : "#B91C1C";
          const badgeBg     = sinRevisar ? "#FFFBEB" : aprobado ? "#F0FDF4" : "#FEF2F2";
          const badgeBorder = sinRevisar ? "#FDE68A" : aprobado ? "#BBF7D0" : "#FECACA";
          const badgeLabel  = sinRevisar ? "— Pendiente" : aprobado ? "✓ Aprobado" : "✕ Denegado";
          return (
            <tr key={d.id_solicitud_insumo}>
              <td style={{ fontSize: "7pt", color: "var(--pr-faint)", textAlign: "center" }}>{i + 1}</td>
              <td style={{ textAlign: "center", padding: "4px" }}>
                {d.imagen_url
                  ? <img src={d.imagen_url} alt={d.nombre}
                      style={{ width: 36, height: 36, objectFit: "cover", borderRadius: 4, display: "block", margin: "0 auto" }} />
                  : <span style={{
                      display: "inline-flex", alignItems: "center", justifyContent: "center",
                      width: 36, height: 36, borderRadius: 4,
                      background: "#f1f5f9", fontSize: "14pt", color: "#94a3b8",
                    }}>□</span>
                }
              </td>
              <td style={{ fontSize: "9pt", fontWeight: 700, color: "var(--pr-ink)" }}>{d.nombre}</td>
              <td style={{ fontSize: "7.5pt", color: "var(--pr-muted)", lineHeight: 1.4 }}>
                {[d.marca, d.modelo].filter(Boolean).join(" · ") || "—"}
                {d.num_serie && <><br /><span style={{ fontSize: "6.5pt", color: "var(--pr-faint)" }}>S/N: {d.num_serie}</span></>}
              </td>
              <td style={{
                fontSize: "9pt", fontWeight: 700,
                color: d.stock > 5 ? "#15803D" : d.stock > 0 ? "#B45309" : "#B91C1C",
              }}>{d.stock} uds.</td>
              <td style={{ fontSize: "11pt", fontWeight: 900, color: "var(--pr-accent)" }}>×{d.cantidad}</td>
              <td>
                <span style={{
                  display: "inline-flex", alignItems: "center", gap: 3,
                  fontSize: "7pt", fontWeight: 800,
                  color: badgeColor, background: badgeBg,
                  border: `1px solid ${badgeBorder}`,
                  borderRadius: 3, padding: "2px 6px", whiteSpace: "nowrap" as const,
                }}>{badgeLabel}</span>
              </td>
            </tr>
          );
        })}
      </tbody>
      <tfoot>
        <tr style={{ background: "var(--pr-navy)" }}>
          <td colSpan={5} style={{ padding: "7px 8px", fontSize: "6.5pt", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.15em", color: "rgba(255,255,255,0.45)" }}>
            Total de piezas solicitadas
          </td>
          <td colSpan={2} style={{ padding: "7px 8px", fontSize: "12pt", fontWeight: 900, color: "#F47920", letterSpacing: "-0.02em" }}>
            {items.reduce((s, d) => s + d.cantidad, 0)} pzas.
          </td>
        </tr>
      </tfoot>
    </table>
  );
}

function EstadoSolicitud({ estatus, fechaSolicitud }: { estatus: string; fechaSolicitud: string }) {
  const cerrado = estatus === "Aceptado" || estatus === "Rechazado";
  const color   = estatus === "Aceptado" ? "#15803D" : estatus === "Rechazado" ? "#B91C1C" : "#C2410C";
  const icon    = estatus === "Aceptado" ? "✓" : estatus === "Rechazado" ? "✕" : "◷";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, padding: "6px 8px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{
          width: 28, height: 28, borderRadius: "50%", display: "flex", alignItems: "center",
          justifyContent: "center", flexShrink: 0, fontSize: "13pt", fontWeight: 900,
          background: cerrado ? (estatus === "Aceptado" ? "#F0FDF4" : "#FEF2F2") : "#FFF7ED",
          border: `2px solid ${color}`, color,
        }}>{icon}</span>
        <div>
          <p style={{ margin: 0, fontSize: "9pt", fontWeight: 700, color }}>
            {cerrado ? (estatus === "Aceptado" ? "Solicitud aceptada" : "Solicitud rechazada") : "Pendiente de resolución"}
          </p>
          <p style={{ margin: 0, fontSize: "7pt", color: "var(--pr-faint)" }}>
            {cerrado
              ? (estatus === "Aceptado" ? "Insumos aprobados y stock descontado" : "La solicitud fue denegada")
              : `Fecha de solicitud: ${fechaSolicitud}`}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function PrintSolicitudView({ solicitud }: { solicitud: Solicitud }) {
  const fechaGen  = nowFechaGen();
  const fechaSol  = fmt.fechaHora(solicitud.fecha);
  const totalSolicitado = solicitud.detalle.reduce((s, d) => s + d.cantidad, 0);
  const cerrado = solicitud.estatus === "Aceptado" || solicitud.estatus === "Rechazado";
  const totalAprobado = cerrado
    ? solicitud.detalle.filter(d => d.aprobado === 1 || (d.aprobado as unknown) === true).reduce((s, d) => s + d.cantidad, 0)
    : null;

  const prio    = PRIO_META[solicitud.prioridad]  ?? PRIO_META.Baja;
  const estatus = ESTATUS_META[solicitud.estatus] ?? ESTATUS_META["Pendiente"];

  return (
    <div className="pr-root" data-ready="true">

      <PageHeader
        titulo="Solicitud de Insumos"
        subtitulo="Departamento de Almacén e Inventario"
        metaRows={[
          { label: "Folio",    value: solicitud.folio_solicitud, mono: true },
          { label: "Generado", value: fechaGen },
        ]}
      />

      <div className="pr-content">

        {/* Línea de estado — igual que en PrintReportView */}
        <div style={{
          display: "flex", alignItems: "center", flexWrap: "wrap", gap: 8,
          padding: "6px 10px", marginBottom: 10,
          border: "1px solid #cccccc", background: "#f5f5f5",
        }}>
          <span style={{ flex: 1, fontSize: "9pt", fontWeight: "bold", color: "#000" }}>
            {solicitud.nombre_empleado} — {solicitud.nombre_departamento}
          </span>
          <Badge label={solicitud.estatus} icon={estatus.icon} bg="#f5f5f5" color="#000" border="#cccccc" />
          <Badge label={prio.label} bg="#f5f5f5" color="#000" border="#cccccc" />
          <span style={{ fontSize: "7.5pt", color: "#444" }}>
            {totalSolicitado} pzas.{totalAprobado !== null ? ` · ${totalAprobado} aprobadas` : ""}
          </span>
        </div>

        <Section title="Datos de la Solicitud" noPad>
          <DataGrid items={[
            { label: "Folio",              value: solicitud.folio_solicitud,       half: true },
            { label: "Solicitante",        value: solicitud.nombre_empleado,       half: true },
            { label: "Departamento",       value: solicitud.nombre_departamento,   half: true },
            { label: "Sucursal",           value: solicitud.nombre_sucursal ?? "—", half: true },
            { label: "Fecha de solicitud", value: fechaSol,                        half: true },
            { label: "Estatus",            value: solicitud.estatus,               half: true },
            { label: "Prioridad",          value: solicitud.prioridad,             half: true },
            { label: "Tipos de insumo",    value: String(solicitud.detalle.length), half: true },
            { label: "Total solicitado",   value: `${totalSolicitado} unidades`,   half: true },
            ...(totalAprobado !== null
              ? [{ label: "Total aprobado", value: `${totalAprobado} unidades`, half: true }]
              : []),
          ]} />
        </Section>

        <Section title={`Insumos Solicitados — ${solicitud.detalle.length} ítem${solicitud.detalle.length !== 1 ? "s" : ""}`}>
          <InsumosTable items={solicitud.detalle} />
        </Section>

        <div className="pr-two-col">
          <Section title="Estado de la Solicitud">
            <EstadoSolicitud estatus={solicitud.estatus} fechaSolicitud={fechaSol} />
          </Section>
          <Section title="Firma del Solicitante">
            <Firma nombre={solicitud.nombre_empleado} rol="Solicitante" />
          </Section>
        </div>

      </div>

      <PageFooter right={`${solicitud.folio_solicitud} · ${fechaGen}`} />
    </div>
  );
}
