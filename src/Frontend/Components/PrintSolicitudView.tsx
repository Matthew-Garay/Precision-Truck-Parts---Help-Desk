import {
  PageFooter, PageSize, Firma,
  PRIO_META, fmt, nowFechaGen,
} from "./PrintShared";
import { getUsuario } from "../Config/session";

interface DetalleItem {
  id_solicitud_insumo: number;
  id_insumo: number;
  nombre: string;
  marca?: string | null;
  modelo?: string | null;
  num_serie?: string | null;
  /** Cantidad pedida por el empleado */
  cantidad: number;
  cantidad_solicitada?: number | null;
  /** Cantidad que el administrador acepto entregar */
  cantidad_aprobada?: number | null;
  cantidad_a_entregar?: number | null;
  descripcion?: string | null;
  justificacion?: string | null;
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
  nombre_sucursal_origen?: string | null;
  nombre_sucursal_destino?: string | null;
  fecha_atencion?: string | null;
  justificacion?: string | null;
  detalle: DetalleItem[];
}

/** Cantidad pedida por el empleado */
const solicitadoDe = (d: DetalleItem) => d.cantidad_solicitada ?? d.cantidad;
/** Cantidad que realmente se entrega (0 si el item fue negado) */
const entregadoDe  = (d: DetalleItem) => d.cantidad_a_entregar ?? d.cantidad_aprobada ?? d.cantidad;

/* Etiqueta de texto tipo pill. Sin íconos, sin checks, sin emojis:
   el estado se lee solo con la palabra. */
function Pill({ children, tone = "default" }: {
  children: React.ReactNode;
  tone?: "default" | "solid" | "accent" | "quiet";
}) {
  return <span className={`pr-pill${tone !== "default" ? ` pr-pill--${tone}` : ""}`}>{children}</span>;
}

/** Pastilla del estatus de la solicitud (o de cada renglón) */
function StatusPill({ estatus }: { estatus: string }) {
  const tone =
    estatus === "Aceptado" ? "solid" :
    estatus === "Rechazado" ? "quiet"  : "default";
  return <Pill tone={tone}>{estatus}</Pill>;
}

/** Pastilla de prioridad. El naranja es exclusivo de "Urgente". */
function PrioridadPill({ prioridad }: { prioridad: string }) {
  const tone = prioridad === "Urgente" ? "accent" : "default";
  return <Pill tone={tone}>{(PRIO_META[prioridad] ?? PRIO_META.Baja).label}</Pill>;
}

function InsumosTable({ items, cerrado, justificacionGeneral }: {
  items: DetalleItem[];
  cerrado: boolean;
  justificacionGeneral?: string | null;
}) {
  if (!items.length) {
    return <p className="pr-empty">No hay insumos registrados en esta solicitud.</p>;
  }

  const totalSolicitado = items.reduce((s, d) => s + solicitadoDe(d), 0);
  const totalAprobado = cerrado
    ? items.filter(d => d.aprobado === 1 || (d.aprobado as unknown) === true)
        .reduce((s, d) => s + entregadoDe(d), 0)
    : null;

  return (
    <table className="pr-items-table">
      <colgroup>
        <col style={{ width: "4%" }} />
        <col style={{ width: "24%" }} />
        <col style={{ width: "22%" }} />
        <col style={{ width: "10%" }} />
        <col style={{ width: "10%" }} />
        <col style={{ width: "19%" }} />
        <col style={{ width: "11%" }} />
      </colgroup>
      <thead>
        <tr>
          {["#", "Insumo", "Descripción y S/N", "Solicitado", "Aceptado", "Justificación", "Estado"].map((h, i) => (
            <th key={h} className={i === 3 || i === 4 ? "pr-num" : undefined}>{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {items.map((d, i) => {
          const sinRevisar = d.aprobado == null;
          const aprobado   = d.aprobado === 1 || (d.aprobado as unknown) === true;
          const modeloTxt  = [d.marca, d.modelo].filter(Boolean).join(" · ");
          const descTxt    = (d.descripcion ?? "").trim();
          return (
            <tr key={d.id_solicitud_insumo}>
              <td style={{ textAlign: "center", color: "var(--pr-faint)", fontSize: "6.5pt" }}>{i + 1}</td>
              <td>
                <div className="pr-item-name">{d.nombre}</div>
                {modeloTxt && <div className="pr-item-sub">{modeloTxt}</div>}
              </td>
              <td>
                {descTxt && <div style={{ fontSize: "7pt" }}>{descTxt}</div>}
                {d.num_serie && <div className="pr-item-note">S/N: {d.num_serie}</div>}
                {!descTxt && !d.num_serie && <span style={{ color: "var(--pr-faint)" }}>&mdash;</span>}
              </td>
              {/* Lo que el empleado pidio */}
              <td className="pr-num" style={{ fontSize: "9pt", fontWeight: 700, color: "var(--pr-muted)" }}>
                {solicitadoDe(d)}
              </td>
              {/* Lo que el administrador acepto entregar (puede ser menor) */}
              <td className="pr-num" style={{
                fontSize: "9.5pt", fontWeight: 800,
                color: !cerrado ? "var(--pr-faint)" : aprobado ? "var(--pr-ink)" : "var(--pr-faint)",
              }}>
                {cerrado ? entregadoDe(d) : solicitadoDe(d)}
              </td>
              <td style={{ fontSize: "7pt", color: "var(--pr-muted)" }}>
                {(d.justificacion ?? "").trim() || justificacionGeneral?.trim() || <span style={{ color: "var(--pr-faint)" }}>&mdash;</span>}
              </td>
              <td>
                {sinRevisar
                  ? <Pill tone="quiet">Pendiente</Pill>
                  : aprobado
                    ? <Pill tone="solid">Aprobado</Pill>
                    : <Pill tone="quiet">Denegado</Pill>}
              </td>
            </tr>
          );
        })}
      </tbody>
      <tfoot>
        <tr>
          <td colSpan={3}>Total de piezas solicitadas</td>
          <td className="pr-num">{totalSolicitado}</td>
          <td className="pr-num">{cerrado ? totalAprobado : "—"}</td>
          <td colSpan={2} style={{ textTransform: "none", letterSpacing: 0, fontWeight: 400, color: "var(--pr-faint)" }}>
            {totalAprobado !== null ? `${totalAprobado} piezas aprobadas` : ""}
          </td>
        </tr>
      </tfoot>
    </table>
  );
}

function EstadoSolicitud({ estatus, fechaSolicitud }: { estatus: string; fechaSolicitud: string }) {
  const cerrado = estatus === "Aceptado" || estatus === "Rechazado";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
      <StatusPill estatus={estatus} />
      <div>
        <p style={{ margin: 0, fontSize: "8.5pt", fontWeight: 700, color: "var(--pr-ink)" }}>
          {cerrado ? (estatus === "Aceptado" ? "Solicitud aceptada" : "Solicitud rechazada") : "Pendiente de resolución"}
        </p>
        <p style={{ margin: 0, fontSize: "7pt", color: "var(--pr-faint)" }}>
          {cerrado
            ? (estatus === "Aceptado" ? "Insumos aprobados y stock descontado" : "La solicitud fue denegada")
            : `Fecha de solicitud: ${fechaSolicitud}`}
        </p>
      </div>
    </div>
  );
}

export default function PrintSolicitudView({ solicitud }: { solicitud: Solicitud }) {
  const fechaGen  = nowFechaGen();
  const fechaSol  = fmt.fechaHora(solicitud.fecha);
  const cerrado   = solicitud.estatus === "Aceptado" || solicitud.estatus === "Rechazado";

  // Ruta del material elegida por el administrador: de qué sucursal sale el
  // material y a qué sucursal llega (se define antes de aceptar la solicitud).
  const rutaOrigen  = solicitud.nombre_sucursal_origen?.trim()  || null;
  const rutaDestino = solicitud.nombre_sucursal_destino?.trim() || null;

  // La ruta del material (de donde sale y a donde llega el material) es
  // logistica interna: en la hoja solo la imprimen Administracion y Soporte
  // Tecnico (mismo criterio que la API). El resto del personal no debe verla;
  // el backend ademas la omite de la respuesta.
  const DEPTO_SOPORTE = 2;
  const sesion = getUsuario();
  const veRuta = sesion?.id_rol === 1
    || Number(sesion?.id_departamento) === DEPTO_SOPORTE;

  return (
    <div className="pr-root pr-solicitud" data-ready="true">
      {/* Carta vertical: este documento cabe en una hoja tamaño carta */}
      <PageSize />

      {/* Firmas iguales a la salida interna: área amplia para sello/pluma. */}
      <style>{`
        .pr-solicitud .pr-signature-area { height: 96px; border-bottom: none; }
        .pr-solicitud .pr-solicitud-firmas .pr-signature:first-child .pr-signature-area { height: 150px; }
        .pr-solicitud .pr-signature { width: 42%; }
        .pr-solicitud .pr-signature-line { width: 100%; height: 1px; background: var(--pr-ink); }
        .pr-solicitud .pr-solicitud-firmas { margin-top: 40px; padding-top: 24px; align-items: flex-end; }
      `}</style>

      {/* Encabezado: logo a la izquierda, título y folio a la derecha.
          La ruta del material va debajo del título, discreta, sin mezclarse
          con el estatus. */}
      <header className="pr-doc-hdr">
        <div className="pr-doc-brand">
          <img src="/assets/img/logo negro.png" alt="Precision Truck Parts" className="pr-doc-logo" />
          <div className="pr-doc-company">
            Precision Truck Parts, Parts and Accesories, S.A de C.V.
            <br />
            Departamento de Soporte Técnico
          </div>
        </div>

        <div className="pr-doc-hdr-right">
          <span className="pr-doc-title">Solicitud de Insumos</span>
          <span className="pr-doc-folio">{solicitud.folio_solicitud}</span>
          <span className="pr-doc-gen">Generado {fechaGen}</span>

          {/* Ruta del material — la imprimen Administracion y Soporte Tecnico.
              Si aun no se define se muestra "Por definir". */}
          {veRuta && (
            <div className="pr-doc-ruta">
              <span className="pr-doc-ruta-label">Ruta del material</span>
              {rutaOrigen || rutaDestino ? (
                <span className="pr-doc-ruta-val">
                  {rutaOrigen ?? "—"} → {rutaDestino ?? "—"}
                </span>
              ) : (
                <span className="pr-doc-ruta-val">Por definir</span>
              )}
            </div>
          )}
        </div>
      </header>

      <div className="pr-content">

        {/* Cuadrícula de datos generales: dos columnas */}
        <div className="pr-info-grid">
          <div>
            <div className="pr-info-col-title">Origen</div>
            <div className="pr-info-row">
              <span className="pr-info-label">Solicitante</span>
              <span className="pr-info-value">{solicitud.nombre_empleado}</span>
            </div>
            <div className="pr-info-row">
              <span className="pr-info-label">Departamento</span>
              <span className="pr-info-value">{solicitud.nombre_departamento}</span>
            </div>
            <div className="pr-info-row">
              <span className="pr-info-label">Sucursal</span>
              <span className="pr-info-value">{solicitud.nombre_sucursal || "—"}</span>
            </div>
          </div>

          <div>
            <div className="pr-info-col-title">Control</div>
            <div className="pr-info-row">
              <span className="pr-info-label">Fecha de solicitud</span>
              <span className="pr-info-value">{fechaSol}</span>
            </div>
            <div className="pr-info-row">
              <span className="pr-info-label">Estatus</span>
              <span className="pr-info-value"><StatusPill estatus={solicitud.estatus} /></span>
            </div>
            <div className="pr-info-row">
              <span className="pr-info-label">Prioridad</span>
              <span className="pr-info-value"><PrioridadPill prioridad={solicitud.prioridad} /></span>
            </div>
          </div>
        </div>

        <div className="pr-doc-h2">
          Insumos solicitados — {solicitud.detalle.length} ítem{solicitud.detalle.length !== 1 ? "s" : ""}
        </div>

        <InsumosTable items={solicitud.detalle} cerrado={cerrado} justificacionGeneral={solicitud.justificacion ?? null} />

        <div className="pr-doc-h2">
          Estado de la solicitud
        </div>
        <EstadoSolicitud estatus={solicitud.estatus} fechaSolicitud={fechaSol} />

        {/* Firmas iguales a la salida interna: Quien recibe (solicitante) / Quien entrega (se llena a mano). */}
        <div className="pr-solicitud-firmas" style={{ display: "flex", justifyContent: "space-around", gap: 24, padding: "0 14px 6px" }}>
          <Firma nombre={solicitud.nombre_empleado} rol="Quien recibe" />
          <Firma nombre="" rol="Quien entrega" />
        </div>

      </div>

      <PageFooter right={`${solicitud.folio_solicitud} · ${fechaGen}`} />
    </div>
  );
}
