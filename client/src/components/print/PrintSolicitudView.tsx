import {
  PageHeader, PageFooter, PageSize, Firma,
  PRIO_META, fmt, nowFechaGen,
} from '../PrintShared.tsx';

const API_BASE = import.meta.env.VITE_API_URL ?? "";
/** Convierte imagen_url del insumo en una URL visible (prefijo /storage + API). */
function imgSrc(u?: string | null): string {
  const s = String(u ?? "").trim();
  if (!s) return "";
  if (/^https?:\/\//i.test(s)) return s;
  const rel = s.startsWith("/storage/") ? s : `/storage/${s.replace(/^\/+/, "")}`;
  return API_BASE + rel;
}

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
  /** Observacion que Soporte Tecnico anoto sobre la solicitud (si la hay). */
  observacion?: string | null;
  observacion_autor?: string | null;
  observacion_fecha?: string | null;
  /** Soporte tecnico (o admin) que acepto la solicitud — "Quien entrega". */
  quien_entrega?: string | null;
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

function InsumosTable({ items, cerrado }: {
  items: DetalleItem[];
  cerrado: boolean;
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
    <table className="pr-inv-table" style={{ tableLayout: "fixed" }}>
      <colgroup>
        <col style={{ width: "4%" }} />
        <col style={{ width: "8%" }} />
        <col style={{ width: "20%" }} />
        <col style={{ width: "30%" }} />
        <col style={{ width: "11%" }} />
        <col style={{ width: "11%" }} />
        <col style={{ width: "16%" }} />
      </colgroup>
      <thead>
        <tr>
          {["#", "Foto", "Insumo", "Descripción", "Solicitado", "Aceptado", "Estado"].map((h, i) => (
            <th key={h} className="pr-inv-th" style={{ textAlign: i === 0 || i === 1 || i === 6 ? "center" : i === 4 || i === 5 ? "right" : "left" }}>{h}</th>
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
              <td className="pr-inv-td" style={{ textAlign: "center", color: "var(--pr-faint)" }}>{i + 1}</td>
              <td className="pr-inv-td pr-inv-td-img">
                {imgSrc(d.imagen_url) ? (
                  <img src={imgSrc(d.imagen_url)} alt="" className="pr-inv-thumb" />
                ) : (
                  <div className="pr-inv-thumb-placeholder"><span style={{ fontSize: "6pt", color: "var(--pr-faint)" }}>S/F</span></div>
                )}
              </td>
              <td className="pr-inv-td">
                <div className="pr-item-name">{d.nombre}</div>
                {modeloTxt && <div className="pr-item-sub">{modeloTxt}</div>}
              </td>
              <td className="pr-inv-td">
                {descTxt && <div style={{ lineHeight: 1.3 }}>{descTxt}</div>}
                {d.num_serie && <div className="pr-item-note">S/N: {d.num_serie}</div>}
                {!descTxt && !d.num_serie && <span style={{ color: "var(--pr-faint)" }}>&mdash;</span>}
              </td>
              <td className="pr-num" style={{ fontSize: "var(--pr-fs-num)", fontWeight: 700, color: "var(--pr-muted)" }}>
                {solicitadoDe(d)}
              </td>
              <td className="pr-num" style={{
                fontSize: "var(--pr-fs-num)", fontWeight: 800,
                color: cerrado ? (aprobado ? "var(--pr-ink)" : "var(--pr-faint)") : "var(--pr-faint)",
              }}>
                {cerrado ? entregadoDe(d) : solicitadoDe(d)}
              </td>
              <td className="pr-inv-td" style={{ textAlign: "center" }}>
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
          <td colSpan={4}>Total de piezas solicitadas</td>
          <td className="pr-num">{totalSolicitado}</td>
          <td className="pr-num">{cerrado ? totalAprobado : "—"}</td>
          <td colSpan={1} style={{ textTransform: "none", letterSpacing: 0, fontWeight: 400, color: "var(--pr-faint)" }}>
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
        <p style={{ margin: 0, fontSize: "var(--pr-fs-value)", fontWeight: 700, color: "var(--pr-ink)" }}>
          {cerrado ? (estatus === "Aceptado" ? "Solicitud aceptada" : "Solicitud rechazada") : "Pendiente de resolución"}
        </p>
        <p style={{ margin: 0, fontSize: "var(--pr-fs-label)", color: "var(--pr-faint)" }}>
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
  // logistica interna: el backend la omite de la respuesta a quien no es
  // Soporte Tecnico/Administracion, asi que en la hoja basta con imprimirla
  // cuando el dato llega en el payload (sin ids de departamento en cliente).
  const veRuta = !!(rutaOrigen || rutaDestino);

  // "Quien entrega" se llena al aceptar la solicitud (autor del movimiento de
  // salida generado). Mientras no exista, se imprime un texto claro en gris
  // en lugar de la linea de firma completamente vacia.
  const quienEntregaTxt = solicitud.quien_entrega?.trim()
    || (solicitud.estatus === "Rechazado" ? "Solicitud rechazada" : "Pendiente de entrega");

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
        .pr-solicitud .pr-signature-name { white-space: normal; overflow-wrap: anywhere; }
        .pr-solicitud .pr-solicitud-firmas { margin-top: 40px; padding-top: 24px; align-items: flex-end; grid-template-columns: 1fr 1fr; }
      `}</style>

      <PageHeader
        logoSrc="/assets/img/logo.png"
        titulo="Solicitud de Insumos"
        subtitulo="Departamento de Soporte Técnico"
        metaRows={[
          { label: "Folio", value: solicitud.folio_solicitud, mono: true },
          { label: "Fecha", value: fmt.fechaCorta(solicitud.fecha) },
          { label: "Generado", value: fechaGen },
        ]}
      />

      {veRuta && (
        <div className="pr-doc-ruta" style={{ marginTop: 6, padding: "0 10px" }}>
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

        {solicitud.justificacion && (
          <div className="pr-inv-section" style={{ padding: "6px 10px 10px" }}>
            <div className="pr-inv-section-hdr">
              <span className="pr-inv-section-title">Justificación del solicitante</span>
            </div>
            <div style={{ padding: "8px 12px", lineHeight: 1.5, color: "var(--pr-ink)" }}>
              {solicitud.justificacion}
            </div>
          </div>
        )}

        {/* Observacion de Soporte Tecnico (solo se imprime si existe) */}
        {solicitud.observacion && (
          <div className="pr-inv-section" style={{ padding: "6px 10px 10px" }}>
            <div className="pr-inv-section-hdr">
              <span className="pr-inv-section-title">Observación de Soporte Técnico</span>
            </div>
            <div style={{ padding: "8px 12px", lineHeight: 1.5, color: "var(--pr-ink)" }}>
              {solicitud.observacion}
              {(solicitud.observacion_autor || solicitud.observacion_fecha) && (
                <div className="pr-item-note" style={{ marginTop: 4 }}>
                  {[
                    solicitud.observacion_autor,
                    solicitud.observacion_fecha ? fmt.fechaHora(solicitud.observacion_fecha) : null,
                  ].filter(Boolean).join(" · ")}
                </div>
              )}
            </div>
          </div>
        )}

        <InsumosTable items={solicitud.detalle} cerrado={cerrado} />

        <div className="pr-doc-h2">
          Estado de la solicitud
        </div>
        <EstadoSolicitud estatus={solicitud.estatus} fechaSolicitud={fechaSol} />

        {/* Firmas estilo salida interna. "Quien recibe" queda en BLANCO: el
            area es para firmar a mano. "Quien entrega" muestra al admin (o
            soporte) que acepto la solicitud, o un texto claro en gris si aun
            no se ha atendido. */}
        <div className="pr-firmas pr-solicitud-firmas" style={{ padding: "0 14px" }}>
          <Firma nombre="" rol="Quien recibe" />
          <Firma
            nombre={quienEntregaTxt}
            rol="Quien entrega"
            placeholder={!solicitud.quien_entrega?.trim()}
          />
        </div>

      </div>

      <PageFooter right={`${solicitud.folio_solicitud} · ${fechaGen}`} logoSrc="/assets/img/logo.png" />
    </div>
  );
}
