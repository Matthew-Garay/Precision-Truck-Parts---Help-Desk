import {
  PageHeader, PageFooter, Section, DataGrid, KpiStrip,
  ReporteTable, nowFechaGen, fmt,
} from "./PrintShared";

interface AccesoRow {
  id_acceso: number;
  fecha_entrada: string | null;
  fecha_salida:  string | null;
}

interface Empleado {
  nombre:          string;
  ap_paterno:      string;
  ap_materno?:     string;
  num_empleado?:   string;
  departamento?:   string;
  nombre_sucursal?: string;
  email?:          string;
}

export interface AccesosPayload {
  empleado:   Empleado;
  accesos:    AccesoRow[];
  periodo:    string;
}

function fmtMin(m: number): string {
  return m < 60 ? `${m} min` : `${Math.floor(m / 60)}h ${m % 60}m`;
}

function durMin(a: AccesoRow): number | null {
  if (!a.fecha_entrada || !a.fecha_salida) return null;
  return Math.round((new Date(a.fecha_salida).getTime() - new Date(a.fecha_entrada).getTime()) / 60000);
}

export default function PrintAccesosView({ payload }: { payload: AccesosPayload }) {
  const fechaGen = nowFechaGen();
  const { empleado, accesos, periodo } = payload;

  const nombreCompleto = [empleado.nombre, empleado.ap_paterno, empleado.ap_materno]
    .filter(Boolean).join(" ");

  const duraciones = accesos.map(durMin).filter((d): d is number => d !== null);
  const durProm    = duraciones.length ? Math.round(duraciones.reduce((s, d) => s + d, 0) / duraciones.length) : 0;
  const durMax     = duraciones.length ? Math.max(...duraciones) : 0;
  const cerradas   = accesos.filter(a => a.fecha_salida).length;

  const rows = accesos.map(a => {
    const d = durMin(a);
    return [
      <span style={{ fontFamily: "monospace", fontSize: "7pt", color: "var(--pr-accent)" }}>{a.id_acceso}</span>,
      <span style={{ fontSize: "7.5pt" }}>{a.fecha_entrada ? fmt.fechaHora(a.fecha_entrada) : "—"}</span>,
      <span style={{ fontSize: "7.5pt", color: a.fecha_salida ? "var(--pr-ink)" : "var(--pr-faint)", fontStyle: a.fecha_salida ? "normal" : "italic" }}>
        {a.fecha_salida ? fmt.fechaHora(a.fecha_salida) : "Activo"}
      </span>,
      <span style={{ fontSize: "7.5pt", fontWeight: 600 }}>{d !== null ? fmtMin(d) : "—"}</span>,
    ];
  });

  return (
    <div className="pr-root" data-ready="true">

      <PageHeader
        titulo="Historial de Accesos al Sistema"
        subtitulo="Departamento de Soporte Técnico"
        metaRows={[
          { label: "Período",   value: periodo },
          { label: "Registros", value: accesos.length, mono: true },
          { label: "Generado",  value: fechaGen },
        ]}
      />

      <div className="pr-content">

        <Section title="Datos del Empleado" noPad>
          <DataGrid items={[
            { label: "Nombre completo",  value: nombreCompleto,                half: true },
            { label: "N° Empleado",      value: empleado.num_empleado ?? "—",  half: true },
            { label: "Departamento",     value: empleado.departamento  ?? "—", half: true },
            { label: "Sucursal",         value: empleado.nombre_sucursal ?? "—", half: true },
          ]} />
        </Section>

        <KpiStrip items={[
          { label: "Total sesiones",    value: accesos.length, color: "#E8621A" },
          { label: "Sesiones cerradas", value: cerradas,       color: "#15803D" },
          { label: "Sesiones activas",  value: accesos.length - cerradas, color: "#1D4ED8" },
          { label: "Duración promedio", value: fmtMin(durProm), color: "#7C3AED" },
          { label: "Sesión más larga",  value: fmtMin(durMax),  color: "#0C1A2E" },
        ]} />

        <Section title={`Detalle de Accesos (${accesos.length})`} noPad>
          <ReporteTable
            headers={["#", "Entrada", "Salida", "Duración"]}
            rows={rows}
            colWidths={["60px", "auto", "auto", "80px"]}
          />
        </Section>

      </div>

      <PageFooter right={`Historial de Accesos · ${fechaGen}`} />
    </div>
  );
}
