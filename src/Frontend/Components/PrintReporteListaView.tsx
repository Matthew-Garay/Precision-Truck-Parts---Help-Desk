import {
  PageHeader, PageFooter, PageSize, ReporteTable,
  PRIO_META, ESTATUS_META, nowFechaGen,
  Stars, fmt,
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
  nombre_sucursal?: string | null;
  nombre_sucursal_origen?: string | null;
  nombre_sucursal_destino?: string | null;
  prioridad: string;
  estatus: string;
  total_insumos?: number | null;
  total_piezas?: number | null;
  detalle_insumos?: string | null;
  items_detalle?: string | null;
  fecha: string;
}
interface RendimientoRow {
  id_tecnico: number;
  nombre_tecnico: string;
  total_atendidos: number;
  resueltos: number;
  no_resueltos: number;
  promedio_horas?: number | null;
  min_horas?: number | null;
  max_horas?: number | null;
  calificacion_promedio?: number | null;
  total_calificaciones: number;
  alta_prioridad_resueltos: number;
  en_proceso_activos: number;
  tickets_cancelados: number;
  pct_calificados?: number | null;
  resueltos_a_tiempo: number;
}
export interface ReportePayload {
  tipo: TipoReporte;
  periodo: string;
  datos: TicketRow[] | InsumoRow[] | RendimientoRow[];
  nombreEmpleado?: string;
}

function calcTiempo(inicio: string, fin: string): string {
  const mins = Math.floor((new Date(fin).getTime() - new Date(inicio).getTime()) / 60000);
  const d = Math.floor(mins / 1440);
  const h = Math.floor((mins % 1440) / 60);
  const m = mins % 60;
  return [d > 0 ? `${d}d` : "", h > 0 ? `${h}h` : "", `${m}m`].filter(Boolean).join(" ");
}

function VistaIncidencias({ datos, periodo, fechaGen, nombreEmpleado }: { datos: TicketRow[]; periodo: string; fechaGen: string; nombreEmpleado?: string }) {
  const rows = datos.map(t => {
    const prio   = PRIO_META[t.prioridad]  ?? PRIO_META.Baja;
    const est    = ESTATUS_META[t.estatus] ?? ESTATUS_META["Cancelado"];
    const calNum = t.calificacion ? Math.min(5, Math.max(1, t.calificacion)) : 0;
    const tiempoRes = t.fecha_resuelto && t.estatus === "Resuelto"
      ? calcTiempo(t.fecha_subido, t.fecha_resuelto) : null;
    return [
      <span style={{ fontFamily: "monospace", fontSize: "7pt", color: "var(--pr-accent)", whiteSpace: "nowrap" }}>{t.folio_ticket}</span>,
      <span style={{ fontSize: "7.5pt", color: "var(--pr-ink)", lineHeight: 1.4 }}>{t.titulo}</span>,
      <span style={{ fontSize: "7pt", color: est.color, whiteSpace: "nowrap" }}>{t.estatus}</span>,
      <span style={{ fontSize: "7pt", color: prio.color, whiteSpace: "nowrap" }}>{t.prioridad}</span>,
      <span style={{ fontSize: "7pt", color: "var(--pr-ink)", lineHeight: 1.35 }}>{t.nombre_empleado || "—"}</span>,
      <span style={{ fontSize: "7pt", color: "var(--pr-muted)", lineHeight: 1.35 }}>{t.nombre_departamento || "—"}</span>,
      <span style={{ fontSize: "7pt", color: t.resuelto_por ? "var(--pr-ink)" : "var(--pr-faint)", fontStyle: t.resuelto_por ? "normal" : "italic", lineHeight: 1.35 }}>{t.resuelto_por || "—"}</span>,
      <span style={{ fontSize: "7pt", color: "var(--pr-muted)", whiteSpace: "nowrap" }}>{fmt.fechaCorta(t.fecha_subido)}</span>,
      <span style={{ fontSize: "7pt", color: t.fecha_resuelto ? "var(--pr-muted)" : "var(--pr-faint)", whiteSpace: "nowrap" }}>{t.fecha_resuelto ? fmt.fechaCorta(t.fecha_resuelto) : "—"}</span>,
      <span style={{ fontSize: "7pt", color: "var(--pr-muted)", whiteSpace: "nowrap" }}>{tiempoRes ?? "—"}</span>,
      calNum > 0 ? <Stars n={calNum} size={8} /> : <span style={{ fontSize: "7pt", color: "var(--pr-faint)" }}>—</span>,
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
          ...(nombreEmpleado ? [{ label: "Solicitante", value: nombreEmpleado }] : []),
          { label: "Generado",  value: fechaGen },
        ]}
      />
      <ReporteTable
        headers={["Folio", "Título de la Incidencia", "Estatus", "Prioridad", "Empleado", "Área / Depto.", "Técnico Asignado", "Fecha Alta", "Fecha Cierre", "Tiempo", "Cal."]}
        rows={rows}
        colWidths={["88px", "auto", "72px", "56px", "110px", "100px", "110px", "68px", "68px", "44px", "32px"]}
      />
      <PageFooter right={`Reporte de Incidencias · ${nombreEmpleado ? nombreEmpleado + " · " : ""}${fechaGen}`} />
    </>
  );
}

function VistaInsumos({ datos, periodo, fechaGen }: { datos: InsumoRow[]; periodo: string; fechaGen: string }) {
  const parseItems = (raw?: string | null) =>
    (raw ?? "").split(";;")
      .filter(Boolean)
      .map(seg => {
        const [nombre, qty, aprobado, imagen_url] = seg.split("|");
        return { nombre: nombre ?? "", qty: qty ?? "1", aprobado: aprobado !== "0", imagen_url: imagen_url || null };
      });

  /* Cuantas solicitudes del reporte ya tienen ruta autorizada: si el periodo
     abarca folios anteriores a la captura de la ruta, la columna sale vacia. */
  const conRuta = datos.filter(s => s.nombre_sucursal_origen || s.nombre_sucursal_destino).length;

  const rows = datos.map(s => {
    const items = parseItems(s.items_detalle);
    return [
      <span style={{ fontFamily: "monospace", fontSize: "7pt", color: "var(--pr-ink)" }}>{s.folio_solicitud}</span>,
      <div>
        <div style={{ fontSize: "7.5pt", color: "var(--pr-ink)" }}>{s.nombre_empleado || "—"}</div>
        <div style={{ fontSize: "6.5pt", color: "var(--pr-muted)" }}>{s.nombre_departamento || "—"}</div>
      </div>,
      <span style={{ fontSize: "7pt", color: "var(--pr-muted)" }}>{s.nombre_sucursal || "—"}</span>,
      // Ruta del material elegida por el administrador (origen → destino)
      <span style={{ fontSize: "7pt", lineHeight: 1.35 }}>
        {s.nombre_sucursal_origen || s.nombre_sucursal_destino ? (
          <>
            <span style={{ fontWeight: 700, color: "var(--pr-ink)" }}>{s.nombre_sucursal_origen ?? "—"}</span>
            <span style={{ color: "var(--pr-faint)" }}> → </span>
            <span style={{ fontWeight: 700, color: "var(--pr-ink)" }}>{s.nombre_sucursal_destino ?? "—"}</span>
          </>
        ) : (
          <span style={{ color: "var(--pr-faint)", fontStyle: "italic" }}>Sin definir</span>
        )}
      </span>,
      <span style={{ fontSize: "7pt", color: "var(--pr-ink)" }}>{s.prioridad}</span>,
      <span style={{ fontSize: "7pt", color: "var(--pr-ink)" }}>{s.estatus}</span>,
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {items.length > 0 ? items.map((it, j) => (
          <div key={j} style={{ display: "flex", alignItems: "center", gap: 4 }}>
            {it.imagen_url
              ? <img src={it.imagen_url} alt={it.nombre} style={{ width: 22, height: 22, objectFit: "cover", borderRadius: 2, border: "1px solid #ccc", flexShrink: 0 }} />
              : <div style={{ width: 22, height: 22, flexShrink: 0 }} />}
            <span style={{ fontSize: "6.5pt", color: "var(--pr-ink)" }}>{it.nombre} · x{it.qty} · {it.aprobado ? "Aprobado" : "Rechazado"}</span>
          </div>
        )) : (
          <span style={{ fontSize: "6.5pt", color: "var(--pr-faint)" }}>{s.detalle_insumos || "—"}</span>
        )}
      </div>,
      <span style={{ fontSize: "7pt", color: "var(--pr-muted)" }}>{fmt.fechaCorta(s.fecha)}</span>,
    ];
  });

  return (
    <>
      <PageHeader
        titulo="Reporte de Solicitudes de Insumos"
        subtitulo="Departamento de Soporte Técnico"
        metaRows={[
          { label: "Período",   value: periodo },
          { label: "Registros", value: datos.length, mono: true },
          { label: "Con ruta",  value: `${conRuta} de ${datos.length}`, mono: true },
          { label: "Generado",  value: fechaGen },
        ]}
      />
      <ReporteTable
        headers={["Folio", "Empleado / Área", "Sucursal", "Ruta del material", "Prioridad", "Estatus", "Insumos solicitados", "Fecha"]}
        rows={rows}
        colWidths={["68px", "130px", "92px", "150px", "52px", "58px", "auto", "62px"]}
      />
      <PageFooter right={`Reporte de Insumos · ${fechaGen}`} />
    </>
  );
}

function VistaRendimiento({ datos, periodo, fechaGen }: { datos: RendimientoRow[]; periodo: string; fechaGen: string }) {
  const header = (
    <PageHeader
      titulo="Reporte de Rendimiento por Técnico"
      subtitulo="Departamento de Soporte Técnico"
      metaRows={[
        { label: "Período",  value: periodo },
        { label: "Técnicos", value: datos.length, mono: true },
        { label: "Generado", value: fechaGen },
      ]}
    />
  );

  if (datos.length === 0) return (
    <>
      {header}
      <p style={{ textAlign: "center", color: "var(--pr-faint)", fontSize: "8pt", fontStyle: "italic", margin: "32px 0" }}>
        Sin registros en el período seleccionado.
      </p>
      <PageFooter right={`Rendimiento por Técnico · ${fechaGen}`} />
    </>
  );

  /* ── estilos de celda ── */
  const th: React.CSSProperties = {
    padding: "5px 8px", fontSize: "5.5pt", fontWeight: 900,
    textTransform: "uppercase" as const, letterSpacing: "0.12em",
    color: "rgba(255,255,255,0.85)", whiteSpace: "nowrap" as const,
    textAlign: "center" as const, background: "var(--pr-ink)",
  };
  const thLeft: React.CSSProperties = { ...th, textAlign: "left" as const };
  const td: React.CSSProperties = {
    padding: "7px 8px", fontSize: "8pt", fontWeight: 700,
    color: "var(--pr-ink)", textAlign: "center" as const,
    verticalAlign: "middle" as const, borderBottom: "1px solid var(--pr-border)",
  };
  const tdLeft: React.CSSProperties = { ...td, textAlign: "left" as const, minWidth: 150 };
  const thSep: React.CSSProperties = { ...th, borderLeft: "2px solid rgba(255,255,255,0.15)" };
  const tdSep: React.CSSProperties = { ...td, borderLeft: "2px solid var(--pr-border)" };

  /* barra de progreso inline */
  const PctBar = ({ pct }: { pct: number }) => (
    <div style={{ marginTop: 3, height: 3, borderRadius: 2,
      background: "var(--pr-border)", overflow: "hidden" as const, width: "100%" }}>
      <div style={{ height: "100%", width: `${Math.min(100, pct)}%`,
        background: "var(--pr-ink)", borderRadius: 2 }} />
    </div>
  );

  const rows = datos.map((r, i) => {
    const tasa   = r.total_atendidos > 0 ? Math.round((r.resueltos / r.total_atendidos) * 100) : 0;
    const slaPct = r.resueltos > 0 ? Math.round((r.resueltos_a_tiempo / r.resueltos) * 100) : 0;
    const calif  = Number(r.calificacion_promedio ?? 0);
    const rowBg  = i % 2 === 0 ? "#fff" : "var(--pr-surface)";
    return (
      <tr key={i} style={{ background: rowBg }}>
        {/* Técnico — acento naranja de marca */}
        <td style={{ ...tdLeft, background: rowBg,
          borderLeft: "3px solid var(--pr-accent)", paddingLeft: 10 }}>
          <div style={{ fontSize: "5pt", fontWeight: 700, textTransform: "uppercase" as const,
            letterSpacing: "0.16em", color: "var(--pr-faint)", marginBottom: 2 }}>
            Técnico &nbsp;·&nbsp; #{String(i + 1).padStart(2, "0")}
          </div>
          <div style={{ fontSize: "9.5pt", fontWeight: 900, color: "var(--pr-ink)",
            letterSpacing: "-0.01em", lineHeight: 1.2, marginBottom: 3 }}>
            {r.nombre_tecnico}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <span style={{ fontSize: "5.5pt", color: "var(--pr-muted)", fontWeight: 600 }}>
              En proceso: <strong style={{ color: "var(--pr-ink)" }}>{r.en_proceso_activos}</strong>
            </span>
            <span style={{ fontSize: "5.5pt", color: "var(--pr-muted)", fontWeight: 600 }}>
              Cancelados: <strong style={{ color: "var(--pr-ink)" }}>{r.tickets_cancelados}</strong>
            </span>
          </div>
        </td>
        {/* Volumen */}
        <td style={{ ...td, background: rowBg }}>
          <div>{r.total_atendidos}</div>
          <div style={{ fontSize: "5.5pt", color: "var(--pr-faint)", fontWeight: 600, marginTop: 1 }}>
            {r.en_proceso_activos > 0 ? `${r.en_proceso_activos} activos` : "sin activos"}
          </div>
        </td>
        <td style={{ ...td, background: rowBg }}>
          <div>{r.resueltos}</div>
          <div style={{ fontSize: "5.5pt", color: "var(--pr-faint)", fontWeight: 600, marginTop: 1 }}>
            {r.alta_prioridad_resueltos > 0 ? `${r.alta_prioridad_resueltos} alta prior.` : "—"}
          </div>
        </td>
        <td style={{ ...td, background: rowBg, color: "var(--pr-muted)" }}>{r.no_resueltos}</td>
        <td style={{ ...td, background: rowBg, color: "var(--pr-muted)" }}>{r.tickets_cancelados}</td>
        {/* Eficiencia */}
        <td style={{ ...tdSep, background: rowBg }}>
          <div>{tasa}%</div>
          <PctBar pct={tasa} />
        </td>
        <td style={{ ...td, background: rowBg }}>
          <div>{slaPct}%</div>
          <PctBar pct={slaPct} />
        </td>
        <td style={{ ...td, background: rowBg, color: "var(--pr-muted)" }}>{r.alta_prioridad_resueltos}</td>
        {/* Tiempos */}
        <td style={{ ...tdSep, background: rowBg }}>
          {r.promedio_horas != null ? `${r.promedio_horas}h` : "—"}
        </td>
        <td style={{ ...td, background: rowBg, color: "var(--pr-muted)" }}>
          {r.min_horas != null ? `${r.min_horas}h` : "—"}
        </td>
        <td style={{ ...td, background: rowBg, color: "var(--pr-muted)" }}>
          {r.max_horas != null ? `${r.max_horas}h` : "—"}
        </td>
        {/* Satisfacción */}
        <td style={{ ...tdSep, background: rowBg }}>
          {calif > 0
            ? <span style={{ display: "inline-flex", flexDirection: "column" as const, alignItems: "center", gap: 1 }}>
                <Stars n={Math.round(calif)} size={7} />
                <span style={{ fontSize: "7.5pt", fontWeight: 800 }}>{calif.toFixed(1)}</span>
              </span>
            : <span style={{ color: "var(--pr-faint)" }}>—</span>}
        </td>
        <td style={{ ...td, background: rowBg, color: "var(--pr-muted)", fontSize: "7.5pt" }}>
          {r.total_calificaciones}
          {r.pct_calificados != null &&
            <div style={{ fontSize: "6pt", color: "var(--pr-faint)", fontWeight: 600 }}>{r.pct_calificados}%</div>}
        </td>
      </tr>
    );
  });

  return (
    <>
      {header}
      <div style={{ overflowX: "auto" as const }}>
        <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "auto" as const }}>
          <thead>
            {/* Fila de grupos */}
            <tr style={{ background: "var(--pr-ink)" }}>
              <th style={{ ...thLeft, background: "var(--pr-ink)", borderBottom: "1px solid rgba(255,255,255,0.08)" }} rowSpan={2}>
                Técnico
              </th>
              <th style={{ ...th, background: "var(--pr-ink)", borderBottom: "1px solid rgba(255,255,255,0.08)",
                borderLeft: "1px solid rgba(255,255,255,0.08)" }} colSpan={4}>
                Volumen
              </th>
              <th style={{ ...th, background: "var(--pr-ink)", borderBottom: "1px solid rgba(255,255,255,0.08)",
                borderLeft: "2px solid rgba(255,255,255,0.15)" }} colSpan={3}>
                Eficiencia
              </th>
              <th style={{ ...th, background: "var(--pr-ink)", borderBottom: "1px solid rgba(255,255,255,0.08)",
                borderLeft: "2px solid rgba(255,255,255,0.15)" }} colSpan={3}>
                Tiempos
              </th>
              <th style={{ ...th, background: "var(--pr-ink)", borderBottom: "1px solid rgba(255,255,255,0.08)",
                borderLeft: "2px solid rgba(255,255,255,0.15)" }} colSpan={2}>
                Satisfacción
              </th>
            </tr>
            {/* Fila de columnas */}
            <tr style={{ background: "var(--pr-ink)" }}>
              <th style={{ ...thSep }}>Atendidos</th>
              <th style={th}>Resueltos</th>
              <th style={th}>No res.</th>
              <th style={th}>Cancelados</th>
              <th style={{ ...thSep }}>Tasa %</th>
              <th style={th}>SLA %</th>
              <th style={th}>Alta prior.</th>
              <th style={{ ...thSep }}>Prom.</th>
              <th style={th}>Mín.</th>
              <th style={th}>Máx.</th>
              <th style={{ ...thSep }}>Calif.</th>
              <th style={th}>Votos</th>
            </tr>
          </thead>
          <tbody>{rows}</tbody>
        </table>
      </div>
      <PageFooter right={`Rendimiento por Técnico · ${fechaGen}`} />
    </>
  );
}

export default function PrintReporteListaView({ payload }: { payload: ReportePayload }) {
  const fechaGen = nowFechaGen();
  const isLandscape = true;
  return (
    <div className={`pr-root${isLandscape ? " pr-landscape" : ""}`} data-ready="true">
      <PageSize landscape />
      <div className="pr-content">
        {payload.tipo === "incidencias" && <VistaIncidencias  datos={payload.datos as TicketRow[]}      periodo={payload.periodo} fechaGen={fechaGen} nombreEmpleado={payload.nombreEmpleado} />}
        {payload.tipo === "insumos"     && <VistaInsumos      datos={payload.datos as InsumoRow[]}      periodo={payload.periodo} fechaGen={fechaGen} />}
        {payload.tipo === "rendimiento" && <VistaRendimiento  datos={payload.datos as RendimientoRow[]} periodo={payload.periodo} fechaGen={fechaGen} />}
      </div>
    </div>
  );
}
