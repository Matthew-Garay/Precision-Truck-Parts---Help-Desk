import "./print-report.css";

export type TipoReporte = "incidencias" | "insumos" | "rendimiento";

interface TicketRow {
  folio_ticket: string;
  titulo: string;
  prioridad: string;
  estatus: string;
  nombre_empleado: string;
  nombre_departamento: string;
  resuelto_por?: string | null;
  fecha_subido: string;
  fecha_resuelto?: string | null;
  calificacion?: number | null;
}
interface InsumoRow {
  folio_solicitud: string;
  nombre_empleado: string;
  nombre_departamento: string;
  prioridad: string;
  estatus: string;
  total_insumos?: number | null;
  total_piezas?: number | null;
  detalle_insumos?: string | null;
  fecha: string;
}
interface RendimientoRow {
  nombre_tecnico: string;
  total_atendidos: number;
  resueltos: number;
  promedio_horas?: number | null;
  calificacion_promedio?: number | null;
  total_calificaciones: number;
}
export interface ReportePayload {
  tipo: TipoReporte;
  periodo: string;
  datos: TicketRow[] | InsumoRow[] | RendimientoRow[];
}

const fmtFecha = (d: string) =>
  new Date(d).toLocaleDateString("es-MX", { day: "2-digit", month: "2-digit", year: "numeric" });

const PRIO: Record<string, { bg: string; color: string; border: string }> = {
  Urgente: { bg: "#FEF2F2", color: "#B91C1C", border: "#FCA5A5" },
  Alta:    { bg: "#FFF7ED", color: "#C2410C", border: "#FDBA74" },
  Media:   { bg: "#FEFCE8", color: "#A16207", border: "#FDE047" },
  Baja:    { bg: "#F0FDF4", color: "#15803D", border: "#86EFAC" },
};
const EST: Record<string, { bg: string; color: string; border: string }> = {
  "Resuelto":    { bg: "#F0FDF4", color: "#15803D", border: "#86EFAC" },
  "En proceso":  { bg: "#FFF7ED", color: "#C2410C", border: "#FDBA74" },
  "No Resuelto": { bg: "#FEF2F2", color: "#B91C1C", border: "#FCA5A5" },
  "Cancelado":   { bg: "#F1F5F9", color: "#475569", border: "#CBD5E1" },
  "Pendiente":   { bg: "#EFF6FF", color: "#1D4ED8", border: "#BFDBFE" },
  "Rechazado":   { bg: "#FEF2F2", color: "#B91C1C", border: "#FCA5A5" },
};

function Badge({ label, meta }: { label: string; meta: { bg: string; color: string; border: string } }) {
  return (
    <span className="pr-badge" style={{ background: meta.bg, color: meta.color, border: `1px solid ${meta.border}` }}>
      {label}
    </span>
  );
}

function Stars({ n }: { n: number }) {
  return (
    <span className="pr-stars">
      {[1,2,3,4,5].map(i => (
        <svg key={i} width="11" height="11" viewBox="0 0 24 24"
          fill={i <= n ? "#F59E0B" : "none"} stroke={i <= n ? "#D97706" : "#CBD5E1"} strokeWidth="1.5">
          <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
        </svg>
      ))}
    </span>
  );
}

function PageHeader({ titulo, subtitulo, periodo, total, fechaGen }: {
  titulo: string; subtitulo: string; periodo: string; total: number; fechaGen: string;
}) {
  return (
    <header className="pr-page-header">
      <div className="pr-header-logo">
        <img src="/assets/img/logo negro.png" alt="Precision Truck Parts" className="pr-logo-img" />
      </div>
      <div className="pr-header-center">
        <span className="pr-header-company">PRECISION TRUCK PARTS &amp; ACCESSORIES</span>
        <span className="pr-header-doc">{titulo}</span>
        <span className="pr-header-dept">{subtitulo}</span>
      </div>
      <div className="pr-header-meta">
        <div className="pr-header-meta-row">
          <span className="pr-micro-label">Período</span>
          <span className="pr-header-fecha" style={{ fontWeight: 700, color: "var(--pr-navy)" }}>{periodo}</span>
        </div>
        <div className="pr-header-meta-row">
          <span className="pr-micro-label">Registros</span>
          <span className="pr-folio">{total}</span>
        </div>
        <div className="pr-header-meta-row">
          <span className="pr-micro-label">Generado</span>
          <span className="pr-header-fecha">{fechaGen}</span>
        </div>
      </div>
    </header>
  );
}

function PageFooter({ titulo, fechaGen }: { titulo: string; fechaGen: string }) {
  return (
    <footer className="pr-page-footer">
      <div className="pr-footer-logo-wrap">
        <img src="/assets/img/log.png" alt="" className="pr-footer-logo" />
      </div>
      <span className="pr-footer-center-text">
        Precision Truck Parts &amp; Accessories — Sistema de Soporte Técnico HelpDesk
      </span>
      <span className="pr-footer-right-text">{titulo} · {fechaGen}</span>
    </footer>
  );
}

function KpiStrip({ items }: { items: { label: string; value: string | number; color: string }[] }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: `repeat(${items.length}, 1fr)`, gap: 5, marginBottom: 8 }}>
      {items.map(({ label, value, color }) => (
        <div key={label} className="pr-data-cell" style={{ borderTop: `2.5px solid ${color}` }}>
          <span className="pr-micro-label">{label}</span>
          <span style={{ fontSize: "13pt", fontWeight: 900, color, lineHeight: 1.1, marginTop: 2, display: "block" }}>{value}</span>
        </div>
      ))}
    </div>
  );
}

function ReporteTable({ headers, rows }: { headers: string[]; rows: React.ReactNode[][] }) {
  return (
    <div className="pr-section" style={{ marginBottom: 8 }}>
      <div className="pr-section-hdr">
        <span className="pr-section-title">Detalle</span>
      </div>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ background: "var(--pr-surface)" }}>
            {headers.map(h => (
              <th key={h} style={{
                padding: "5px 8px", textAlign: "left", fontSize: "5.5pt", fontWeight: 900,
                textTransform: "uppercase", letterSpacing: "0.15em", color: "var(--pr-faint)",
                borderBottom: "1px solid var(--pr-border)", whiteSpace: "nowrap",
              }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={headers.length} style={{ padding: 16, textAlign: "center", color: "var(--pr-faint)", fontSize: "8pt", fontStyle: "italic" }}>
                Sin registros en el período seleccionado.
              </td>
            </tr>
          ) : rows.map((cells, i) => (
            <tr key={i} style={{ background: i % 2 === 0 ? "#fff" : "var(--pr-surface)", borderBottom: "1px solid var(--pr-border)" }}>
              {cells.map((cell, j) => (
                <td key={j} style={{ padding: "5px 8px", verticalAlign: "middle" }}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function VistaIncidencias({ datos, periodo, fechaGen }: { datos: TicketRow[]; periodo: string; fechaGen: string }) {
  const resueltos   = datos.filter(t => t.estatus === "Resuelto").length;
  const enProceso   = datos.filter(t => t.estatus === "En proceso").length;
  const noResueltos = datos.filter(t => t.estatus === "No Resuelto").length;
  const califs      = datos.filter(t => (t.calificacion ?? 0) > 0);
  const prom        = califs.length > 0
    ? (califs.reduce((a, t) => a + (t.calificacion ?? 0), 0) / califs.length).toFixed(1) : "—";

  const rows = datos.map(t => {
    const calNum = Math.min(5, Math.max(1, t.calificacion ?? 0));
    return [
      <span style={{ fontFamily: "monospace", fontWeight: 900, color: "var(--pr-accent)", fontSize: "8pt" }}>{t.folio_ticket}</span>,
      <div>
        <div style={{ fontWeight: 700, fontSize: "8pt", color: "var(--pr-ink)" }}>{t.titulo}</div>
        <Badge label={t.prioridad} meta={PRIO[t.prioridad] ?? PRIO.Baja} />
      </div>,
      <Badge label={t.estatus} meta={EST[t.estatus] ?? EST["Cancelado"]} />,
      <div>
        <div style={{ fontWeight: 600, fontSize: "8pt" }}>{t.nombre_empleado || "—"}</div>
        <div style={{ fontSize: "7pt", color: "var(--pr-muted)" }}>{t.nombre_departamento || "—"}</div>
      </div>,
      <span style={{ fontSize: "8pt" }}>{t.resuelto_por ? t.resuelto_por.split(" ").slice(0, 2).join(" ") : "—"}</span>,
      <span style={{ fontSize: "7.5pt", color: "var(--pr-muted)" }}>{fmtFecha(t.fecha_subido)}</span>,
      <span style={{ fontSize: "7.5pt", color: t.fecha_resuelto ? "#15803D" : "var(--pr-faint)" }}>
        {t.fecha_resuelto ? fmtFecha(t.fecha_resuelto) : "—"}
      </span>,
      (t.calificacion ?? 0) > 0 ? <Stars n={calNum} /> : <span style={{ color: "var(--pr-faint)", fontSize: "7pt" }}>—</span>,
    ];
  });

  return (
    <>
      <PageHeader titulo="Reporte de Incidencias Técnicas" subtitulo="Departamento de Soporte Técnico"
        periodo={periodo} total={datos.length} fechaGen={fechaGen} />
      <KpiStrip items={[
        { label: "Total del período",  value: datos.length,  color: "var(--pr-accent)" },
        { label: "Resueltos",          value: resueltos,     color: "#15803D" },
        { label: "En proceso",         value: enProceso,     color: "#C2410C" },
        { label: "Sin resolver",       value: noResueltos,   color: "#B91C1C" },
        { label: "Satisfacción prom.", value: prom,          color: "#D97706" },
      ]} />
      <ReporteTable
        headers={["Folio", "Título / Prioridad", "Estatus", "Usuario / Área", "Técnico", "Inicio", "Cierre", "Satisf."]}
        rows={rows}
      />
      <PageFooter titulo="Reporte de Incidencias" fechaGen={fechaGen} />
    </>
  );
}

function VistaInsumos({ datos, periodo, fechaGen }: { datos: InsumoRow[]; periodo: string; fechaGen: string }) {
  const resueltos   = datos.filter(s => s.estatus === "Resuelto").length;
  const enProceso   = datos.filter(s => s.estatus === "En proceso").length;
  const pendientes  = datos.filter(s => s.estatus === "Pendiente").length;
  const totalPiezas = datos.reduce((a, s) => a + (parseInt(String(s.total_piezas ?? 0)) || 0), 0);

  const rows = datos.map(s => [
    <span style={{ fontFamily: "monospace", fontWeight: 900, color: "var(--pr-accent)", fontSize: "8pt" }}>{s.folio_solicitud}</span>,
    <div>
      <div style={{ fontWeight: 600, fontSize: "8pt" }}>{s.nombre_empleado || "—"}</div>
      <div style={{ fontSize: "7pt", color: "var(--pr-muted)" }}>{s.nombre_departamento || "—"}</div>
    </div>,
    <Badge label={s.prioridad} meta={PRIO[s.prioridad] ?? PRIO.Baja} />,
    <Badge label={s.estatus}   meta={EST[s.estatus]    ?? EST["Cancelado"]} />,
    <span style={{ fontSize: "8pt" }}>{s.total_insumos ?? "—"}</span>,
    <span style={{ fontSize: "8pt" }}>{s.total_piezas  ?? "—"}</span>,
    <span style={{ fontSize: "7pt", color: "var(--pr-muted)", maxWidth: 160, display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>
      {s.detalle_insumos || "—"}
    </span>,
    <span style={{ fontSize: "7.5pt", color: "var(--pr-muted)" }}>{fmtFecha(s.fecha)}</span>,
  ]);

  return (
    <>
      <PageHeader titulo="Reporte de Solicitudes de Insumos" subtitulo="Departamento de Soporte Técnico"
        periodo={periodo} total={datos.length} fechaGen={fechaGen} />
      <KpiStrip items={[
        { label: "Total del período", value: datos.length,  color: "var(--pr-accent)" },
        { label: "Resueltos",         value: resueltos,     color: "#15803D" },
        { label: "En proceso",        value: enProceso,     color: "#C2410C" },
        { label: "Pendientes",        value: pendientes,    color: "#1D4ED8" },
        { label: "Total piezas",      value: totalPiezas,   color: "#7C3AED" },
      ]} />
      <ReporteTable
        headers={["Folio", "Empleado / Área", "Prioridad", "Estatus", "Insumos", "Piezas", "Detalle", "Fecha"]}
        rows={rows}
      />
      <PageFooter titulo="Reporte de Insumos" fechaGen={fechaGen} />
    </>
  );
}

function VistaRendimiento({ datos, periodo, fechaGen }: { datos: RendimientoRow[]; periodo: string; fechaGen: string }) {
  const totalAtendidos = datos.reduce((a, r) => a + Number(r.total_atendidos ?? 0), 0);
  const totalResueltos = datos.reduce((a, r) => a + Number(r.resueltos ?? 0), 0);
  const promedioHoras  = datos.length > 0
    ? (datos.reduce((a, r) => a + Number(r.promedio_horas ?? 0), 0) / datos.length).toFixed(1) : "—";
  const conCalif = datos.filter(r => (r.calificacion_promedio ?? 0) > 0);
  const promedioCalif = conCalif.length > 0
    ? (conCalif.reduce((a, r) => a + Number(r.calificacion_promedio), 0) / conCalif.length).toFixed(2) : "—";

  const rows = datos.map((r, i) => {
    const tasa  = r.total_atendidos > 0 ? Math.round((r.resueltos / r.total_atendidos) * 100) : 0;
    const calif = Number(r.calificacion_promedio ?? 0);
    const tasaColor = tasa >= 75 ? "#15803D" : tasa >= 50 ? "#A16207" : "#B91C1C";
    return [
      <span style={{ fontSize: "8pt", fontWeight: 900, color: "var(--pr-faint)" }}>{i + 1}</span>,
      <span style={{ fontSize: "8.5pt", fontWeight: 700, color: "var(--pr-ink)" }}>{r.nombre_tecnico}</span>,
      <span style={{ fontSize: "9pt", fontWeight: 900, color: "#1D4ED8" }}>{r.total_atendidos}</span>,
      <span style={{ fontSize: "9pt", fontWeight: 900, color: "#15803D" }}>{r.resueltos}</span>,
      <span style={{
        display: "inline-block", padding: "1px 7px", borderRadius: 3,
        fontSize: "7.5pt", fontWeight: 800,
        background: `${tasaColor}18`, color: tasaColor, border: `1px solid ${tasaColor}30`,
      }}>{tasa}%</span>,
      <span style={{ fontSize: "8.5pt", fontWeight: 700, color: "#7C3AED" }}>
        {r.promedio_horas != null ? `${r.promedio_horas}h` : "—"}
      </span>,
      calif > 0 ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
          <Stars n={Math.round(calif)} />
          <span style={{ fontSize: "6.5pt", color: "var(--pr-faint)" }}>{calif.toFixed(2)} / 5.00</span>
        </div>
      ) : <span style={{ color: "var(--pr-faint)", fontSize: "7pt" }}>—</span>,
      <span style={{ fontSize: "8pt", color: "var(--pr-muted)" }}>{r.total_calificaciones}</span>,
    ];
  });

  return (
    <>
      <PageHeader titulo="Reporte de Rendimiento por Técnico" subtitulo="Departamento de Soporte Técnico"
        periodo={periodo} total={datos.length} fechaGen={fechaGen} />
      <KpiStrip items={[
        { label: "Técnicos activos",   value: datos.length,   color: "var(--pr-accent)" },
        { label: "Total atendidos",    value: totalAtendidos, color: "#1D4ED8" },
        { label: "Total resueltos",    value: totalResueltos, color: "#15803D" },
        { label: "Prom. horas",        value: promedioHoras,  color: "#7C3AED" },
        { label: "Satisfacción prom.", value: promedioCalif,  color: "#D97706" },
      ]} />
      <ReporteTable
        headers={["#", "Técnico", "Atendidos", "Resueltos", "Tasa resolución", "Prom. horas", "Calificación prom.", "Calif. recibidas"]}
        rows={rows}
      />
      <PageFooter titulo="Rendimiento por Técnico" fechaGen={fechaGen} />
    </>
  );
}

export default function PrintReporteListaView({ payload }: { payload: ReportePayload }) {
  const now      = new Date();
  const fechaGen = `${now.toLocaleDateString("es-MX", { day: "2-digit", month: "2-digit", year: "numeric" })} · ${now.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })}`;

  return (
    <div className="pr-root" data-ready="true">
      <div className="pr-content">
        {payload.tipo === "incidencias"  && <VistaIncidencias  datos={payload.datos as TicketRow[]}      periodo={payload.periodo} fechaGen={fechaGen} />}
        {payload.tipo === "insumos"      && <VistaInsumos      datos={payload.datos as InsumoRow[]}      periodo={payload.periodo} fechaGen={fechaGen} />}
        {payload.tipo === "rendimiento"  && <VistaRendimiento  datos={payload.datos as RendimientoRow[]} periodo={payload.periodo} fechaGen={fechaGen} />}
      </div>
    </div>
  );
}
