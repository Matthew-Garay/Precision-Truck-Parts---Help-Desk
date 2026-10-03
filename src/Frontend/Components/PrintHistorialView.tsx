import {
  Badge, PageHeader, PageFooter, Section, DataGrid, ReporteTable, Firma,
  PageSize, ESTATUS_META, fmt, nowFechaGen,
} from "./PrintShared";

interface Acceso {
  fecha_entrada: string;
  fecha_salida:  string | null;
}

interface Empleado {
  id_empleado:         number;
  num_empleado:        string | null;
  nombre:              string;
  ap_paterno:          string;
  ap_materno:          string | null;
  email:               string;
  nombre_rol:          string | null;
  nombre_departamento: string | null;
  nombre_sucursal:     string | null;
  estatus:             string;
}

interface HistorialData {
  empleado: Empleado;
  accesos:  Acceso[];
  desde:    string | null;
  hasta:    string | null;
}

function durMin(entrada: string, salida: string): number {
  return Math.round((new Date(salida).getTime() - new Date(entrada).getTime()) / 60000);
}

function fmtMin(m: number): string {
  return m < 60 ? `${m} min` : `${Math.floor(m / 60)}h ${m % 60}m`;
}

function buildResumen(
  nombreCompleto: string,
  periodo: string,
  accesos: Acceso[],
  cerradas: number,
  activas: number,
): string {
  if (!accesos.length)
    return "<em>Sin registros de acceso en el período seleccionado.</em>";

  const sorted = [...accesos].sort(
    (a, b) => new Date(a.fecha_entrada).getTime() - new Date(b.fecha_entrada).getTime(),
  );
  const primera = fmt.fechaHora(sorted[0].fecha_entrada);
  const ultima  = fmt.fechaHora(sorted[sorted.length - 1].fecha_entrada);

  const duraciones = accesos
    .filter(a => a.fecha_salida)
    .map(a => durMin(a.fecha_entrada, a.fecha_salida!));

  const promedio = duraciones.length
    ? fmtMin(Math.round(duraciones.reduce((s, d) => s + d, 0) / duraciones.length))
    : null;
  const maxima = duraciones.length ? fmtMin(Math.max(...duraciones)) : null;

  const activasStr = activas > 0
    ? ` y <strong>${activas}</strong> permanece${activas !== 1 ? "n" : ""} activa${activas !== 1 ? "s" : ""}`
    : "";

  const durStr = promedio
    ? ` La duración promedio de sesión fue de <strong>${promedio}</strong>, con una sesión máxima de <strong>${maxima}</strong>.`
    : "";

  return (
    `Durante el período <strong>${periodo}</strong>, el empleado <strong>${nombreCompleto}</strong> ` +
    `registró un total de <strong>${accesos.length} sesión${accesos.length !== 1 ? "es" : ""}</strong> en el sistema, ` +
    `de las cuales <strong>${cerradas}</strong> fueron cerradas correctamente${activasStr}. ` +
    `La primera sesión registrada fue el <strong>${primera}</strong> ` +
    `y la más reciente el <strong>${ultima}</strong>.${durStr}`
  );
}

export default function PrintHistorialView({ data }: { data: HistorialData }) {
  const { empleado, accesos, desde, hasta } = data;
  const fechaGen       = nowFechaGen();
  const nombreCompleto = [empleado.nombre, empleado.ap_paterno, empleado.ap_materno]
    .filter(Boolean).join(" ");

  const periodo = desde && hasta
    ? `${fmt.fechaCorta(desde + "T00:00:00")} — ${fmt.fechaCorta(hasta + "T00:00:00")}`
    : desde ? `Desde ${fmt.fechaCorta(desde + "T00:00:00")}`
    : hasta  ? `Hasta ${fmt.fechaCorta(hasta  + "T00:00:00")}`
    : "Todos los registros";

  const cerradas = accesos.filter(a => !!a.fecha_salida).length;
  const activas  = accesos.length - cerradas;

  const estatusMeta = ESTATUS_META[empleado.estatus === "Activo" ? "Resuelto" : "Cancelado"];

  const rows = accesos.map(a => {
    const activa = !a.fecha_salida;
    return [
      <span style={{ fontSize: "7.5pt" }}>{fmt.fechaHora(a.fecha_entrada)}</span>,
      <span style={{ fontSize: "7.5pt", color: activa ? "var(--pr-faint)" : undefined, fontStyle: activa ? "italic" : undefined }}>
        {a.fecha_salida ? fmt.fechaHora(a.fecha_salida) : "—"}
      </span>,
      <span style={{ fontSize: "7.5pt", fontWeight: 600 }}>
        {a.fecha_salida ? fmtMin(durMin(a.fecha_entrada, a.fecha_salida)) : "—"}
      </span>,
      <span style={{ fontSize: "7.5pt", fontWeight: 700, color: activa ? "var(--pr-accent)" : "var(--pr-muted)" }}>
        {activa ? "Activa" : "Cerrada"}
      </span>,
    ];
  });

  return (
    <div className="pr-root" data-ready="true">
      {/* Carta vertical: este documento cabe en una hoja tamaño carta */}
      <PageSize />
      <PageHeader
        titulo="Historial de Accesos al Sistema"
        subtitulo="Departamento de Soporte Técnico"
        metaRows={[
          { label: "Empleado", value: nombreCompleto },
          { label: "Período",  value: periodo },
          { label: "Generado", value: fechaGen },
        ]}
      />

      <div className="pr-content">

        {/* Banda de identificación — igual que ticket */}
        <div style={{
          display: "flex", alignItems: "center", flexWrap: "wrap", gap: 8,
          padding: "6px 10px", marginBottom: 10,
          border: "1px solid var(--pr-border)", background: "var(--pr-light)",
        }}>
          <span style={{ flex: 1, fontSize: "9pt", fontWeight: "bold", color: "var(--pr-ink)" }}>
            {nombreCompleto}
          </span>
          <Badge label={empleado.estatus} icon={estatusMeta.icon} bg="var(--pr-light)" color="#000" border="var(--pr-border)" />
          <span style={{ fontSize: "7.5pt", color: "#444" }}>Período: {periodo}</span>
        </div>

        {/* Datos del empleado — sin Rol, con Sucursal */}
        <Section title="Datos del Empleado" noPad>
          <DataGrid items={[
            { label: "N.º Empleado",  value: empleado.num_empleado        ?? "—", half: true },
            { label: "Correo",        value: empleado.email,                      half: true },
            { label: "Departamento",  value: empleado.nombre_departamento ?? "—", half: true },
            { label: "Sucursal",      value: empleado.nombre_sucursal     ?? "—", half: true },
            { label: "Estatus",       value: empleado.estatus,                    half: true },
            { label: "Total sesiones",value: String(accesos.length),              half: true },
          ]} />
        </Section>

        {/* Resumen narrativo — igual que "Resolución y Comentarios" en ticket */}
        <Section title="Resumen de Actividad del Período">
          <div style={{ borderLeft: "3px solid var(--pr-border)", paddingLeft: 10 }}>
            <div
              className="pr-rich-text"
              dangerouslySetInnerHTML={{
                __html: buildResumen(nombreCompleto, periodo, accesos, cerradas, activas),
              }}
            />
          </div>
        </Section>

        {/* Tabla de sesiones */}
        <Section title={`Registro de Sesiones (${accesos.length})`} noPad>
          <ReporteTable
            headers={["Entrada", "Salida", "Duración", "Estado"]}
            colWidths={["30%", "30%", "20%", "20%"]}
            rows={rows}
          />
        </Section>

        {/* Dos firmas — igual que ticket */}
        <div className="pr-two-col">
          <Section title="Responsable del Reporte">
            <Firma nombre="Administrador del Sistema" rol="Soporte Técnico" />
          </Section>
          <Section title="Conformidad del Empleado">
            <Firma nombre={nombreCompleto} rol={empleado.nombre_departamento ?? "Empleado"} />
          </Section>
        </div>

      </div>

      <PageFooter right={`${nombreCompleto} · ${fechaGen}`} />

    </div>
  );
}
