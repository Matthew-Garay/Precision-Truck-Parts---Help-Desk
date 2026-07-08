import {
  Badge, Stars, PageHeader, PageFooter, KpiStrip, ReporteTable,
  PRIO_META, ESTATUS_META, nowFechaGen,
} from "./PrintShared";

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

function VistaIncidencias({ datos, periodo, fechaGen }: { datos: TicketRow[]; periodo: string; fechaGen: string }) {
  const resueltos   = datos.filter(t => t.estatus === "Resuelto").length;
  const enProceso   = datos.filter(t => t.estatus === "En proceso").length;
  const noResueltos = datos.filter(t => t.estatus === "No Resuelto").length;
  const califs      = datos.filter(t => (t.calificacion ?? 0) > 0);
  const prom        = califs.length > 0
    ? (califs.reduce((a, t) => a + (t.calificacion ?? 0), 0) / califs.length).toFixed(1) : "—";

  const rows = datos.map(t => {
    const calNum = Math.min(5, Math.max(1, t.calificacion ?? 0));
    const prio   = PRIO_META[t.prioridad]  ?? PRIO_META.Baja;
    const est    = ESTATUS_META[t.estatus] ?? ESTATUS_META["Cancelado"];
    return [
      <span style={{ fontFamily: "monospace", fontWeight: 900, color: "var(--pr-accent)", fontSize: "8pt" }}>{t.folio_ticket}</span>,
      <div>
        <div style={{ fontWeight: 700, fontSize: "8pt", color: "var(--pr-ink)" }}>{t.titulo}</div>
        <Badge label={t.prioridad} bg={prio.bg} color={prio.color} border={prio.border} />
      </div>,
      <Badge label={t.estatus} bg={est.bg} color={est.color} border={est.border} />,
      <div>
        <div style={{ fontWeight: 600, fontSize: "8pt" }}>{t.nombre_empleado || "—"}</div>
        <div style={{ fontSize: "7pt", color: "var(--pr-muted)" }}>{t.nombre_departamento || "—"}</div>
      </div>,
      <span style={{ fontSize: "8pt" }}>{t.resuelto_por ? t.resuelto_por.split(" ").slice(0, 2).join(" ") : "—"}</span>,
      <span style={{ fontSize: "7.5pt", color: "var(--pr-muted)" }}>{fmtFecha(t.fecha_subido)}</span>,
      <span style={{ fontSize: "7.5pt", color: t.fecha_resuelto ? "#15803D" : "var(--pr-faint)" }}>
        {t.fecha_resuelto ? fmtFecha(t.fecha_resuelto) : "—"}
      </span>,
      (t.calificacion ?? 0) > 0
        ? <Stars n={calNum} size={11} />
        : <span style={{ color: "var(--pr-faint)", fontSize: "7pt" }}>—</span>,
    ];
  });

  return (
    <>
      <PageHeader
        titulo="Reporte de Incidencias Técnicas"
        subtitulo="Departamento de Soporte Técnico"
        metaRows={[
          { label: "Período",    value: periodo },
          { label: "Registros", value: datos.length, mono: true },
          { label: "Generado",  value: fechaGen },
        ]}
      />
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
      <PageFooter right={`Reporte de Incidencias · ${fechaGen}`} />
    </>
  );
}

function VistaInsumos({ datos, periodo, fechaGen }: { datos: InsumoRow[]; periodo: string; fechaGen: string }) {
  const resueltos   = datos.filter(s => s.estatus === "Resuelto").length;
  const enProceso   = datos.filter(s => s.estatus === "En proceso").length;
  const pendientes  = datos.filter(s => s.estatus === "Pendiente").length;
  const totalPiezas = datos.reduce((a, s) => a + (parseInt(String(s.total_piezas ?? 0)) || 0), 0);

  const rows = datos.map(s => {
    const prio = PRIO_META[s.prioridad]  ?? PRIO_META.Baja;
    const est  = ESTATUS_META[s.estatus] ?? ESTATUS_META["Cancelado"];
    return [
      <span style={{ fontFamily: "monospace", fontWeight: 900, color: "var(--pr-accent)", fontSize: "8pt" }}>{s.folio_solicitud}</span>,
      <div>
        <div style={{ fontWeight: 600, fontSize: "8pt" }}>{s.nombre_empleado || "—"}</div>
        <div style={{ fontSize: "7pt", color: "var(--pr-muted)" }}>{s.nombre_departamento || "—"}</div>
      </div>,
      <Badge label={s.prioridad} bg={prio.bg} color={prio.color} border={prio.border} />,
      <Badge label={s.estatus}   bg={est.bg}  color={est.color}  border={est.border} />,
      <span style={{ fontSize: "8pt" }}>{s.total_insumos ?? "—"}</span>,
      <span style={{ fontSize: "8pt" }}>{s.total_piezas  ?? "—"}</span>,
      <span style={{ fontSize: "7pt", color: "var(--pr-muted)", maxWidth: 160, display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>
        {s.detalle_insumos || "—"}
      </span>,
      <span style={{ fontSize: "7.5pt", color: "var(--pr-muted)" }}>{fmtFecha(s.fecha)}</span>,
    ];
  });

  return (
    <>
      <PageHeader
        titulo="Reporte de Solicitudes de Insumos"
        subtitulo="Departamento de Soporte Técnico"
        metaRows={[
          { label: "Período",    value: periodo },
          { label: "Registros", value: datos.length, mono: true },
          { label: "Generado",  value: fechaGen },
        ]}
      />
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
      <PageFooter right={`Reporte de Insumos · ${fechaGen}`} />
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
          <Stars n={Math.round(calif)} size={11} />
          <span style={{ fontSize: "6.5pt", color: "var(--pr-faint)" }}>{calif.toFixed(2)} / 5.00</span>
        </div>
      ) : <span style={{ color: "var(--pr-faint)", fontSize: "7pt" }}>—</span>,
      <span style={{ fontSize: "8pt", color: "var(--pr-muted)" }}>{r.total_calificaciones}</span>,
    ];
  });

  return (
    <>
      <PageHeader
        titulo="Reporte de Rendimiento por Técnico"
        subtitulo="Departamento de Soporte Técnico"
        metaRows={[
          { label: "Período",    value: periodo },
          { label: "Técnicos",  value: datos.length, mono: true },
          { label: "Generado",  value: fechaGen },
        ]}
      />
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
      <PageFooter right={`Rendimiento por Técnico · ${fechaGen}`} />
    </>
  );
}

export default function PrintReporteListaView({ payload }: { payload: ReportePayload }) {
  const fechaGen = nowFechaGen();

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
