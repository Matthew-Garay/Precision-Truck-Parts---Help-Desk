import { PageHeader, PageFooter, PageSize, nowFechaGen } from "./PrintShared";
import "./print-report.css";

export interface MovRow {
  id_movimiento?: number;
  fecha?: string | null;
  cantidad?: number | null;
  stock_anterior?: number | null;
  stock_nuevo?: number | null;
  nombre_insumo?: string | null;
  marca?: string | null;
  modelo?: string | null;
  nombre_empleado?: string | null;
  motivo?: string | null;
  folio_solicitud?: string | null;
}

export interface EntradasPayload {
  rows: MovRow[];
  filtros?: string[];
  total?: number;
  tipo?: string;
}

/* Solo hay entradas de material: sin columna de tipo ni de ruta */
const COLS = ["Fecha", "Insumo", "Cantidad", "Stock resultante", "Registró", "Motivo"];

/* La hora viene en la columna DATETIME; se imprime en 24 h y en dos lineas
   (fecha / hora) para que no se recorte en la celda de 15%. */
function toDate(v?: string | null) {
  const s = String(v ?? "").trim();
  if (!s) return null;
  // MySQL devuelve "YYYY-MM-DD HH:MM:SS"; la API lo envia como ISO ("...Z")
  const d = new Date(/^\d{4}-\d{2}-\d{2} /.test(s) ? s.replace(" ", "T") : s);
  return Number.isNaN(d.getTime()) ? null : d;
}

function fmtFecha(f?: string | null) {
  const d = toDate(f);
  if (!d) return { dia: f ? String(f) : "—", hora: "" };
  return {
    dia:  d.toLocaleDateString("es-MX", { day: "2-digit", month: "2-digit", year: "numeric" }),
    hora: d.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit", hour12: false }),
  };
}

export default function PrintEntradasView({ payload }: { payload: EntradasPayload }) {
  const rows    = payload?.rows ?? [];
  const filtros = payload?.filtros ?? [];
  const total   = Number(payload?.total) || rows.length;
  const esSalida = payload?.tipo === "Salida";
  const titulo   = esSalida ? "Salidas de material" : "Entradas de material";
  const sing     = esSalida ? "salida" : "entrada";
  const plur     = esSalida ? "salidas" : "entradas";

  const now      = new Date();
  const fechaGen = nowFechaGen();
  const folioDoc = `${esSalida ? "SAL" : "ENT"}-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

  return (
    <div className="pr-root pr-landscape" data-ready="true">
      <PageSize landscape />

      <PageHeader
        titulo={titulo}
        subtitulo="Departamento de Soporte Técnico"
        metaRows={[
          { label: "Folio",     value: folioDoc, mono: true },
          { label: "Registros", value: total > rows.length ? `${rows.length} de ${total}` : rows.length, mono: true },
          { label: "Generado",  value: fechaGen },
        ]}
      />

      <div className="pr-content">

        <section className="pr-inv-section">
          <div className="pr-inv-section-hdr">
            <span className="pr-inv-section-title">{titulo}</span>
            <span className="pr-inv-section-count">{rows.length} {rows.length !== 1 ? plur : sing}</span>
          </div>

          {/* Filtros activos — los mismos que muestra la barra en pantalla */}
          {filtros.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 5, padding: "5px 8px", borderBottom: "1px solid var(--pr-border)", background: "var(--pr-surface)" }}>
              {filtros.map(f => (
                <span key={f} style={{ fontSize: "6pt", fontWeight: 700, color: "var(--pr-accent)", padding: "1px 7px", whiteSpace: "nowrap" }}>
                  {f}
                </span>
              ))}
            </div>
          )}

          <table className="pr-inv-table" style={{ tableLayout: "fixed" }}>
            <colgroup>
              <col style={{ width: "15%" }} />
              <col style={{ width: "29%" }} />
              <col style={{ width: "11%" }} />
              <col style={{ width: "16%" }} />
              <col style={{ width: "15%" }} />
              <col />
            </colgroup>
            <thead>
              <tr>
                {COLS.map(c => <th key={c} className="pr-inv-th">{c}</th>)}
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: 20, textAlign: "center", color: "var(--pr-faint)", fontStyle: "italic", fontSize: "7.5pt" }}>
                    {esSalida ? "Sin salidas con los filtros actuales." : "Sin entradas con los filtros actuales."}
                  </td>
                </tr>
              ) : rows.map((m) => {
                return (
                  <tr key={`${m.id_movimiento ?? "m"}-${m.fecha ?? ""}`}>
                    <td className="pr-inv-td" style={{ whiteSpace: "nowrap" }}>
                      <div style={{ lineHeight: 1.2 }}>{fmtFecha(m.fecha).dia}</div>
                      {fmtFecha(m.fecha).hora && (
                        <div style={{ fontWeight: 900, color: "var(--pr-ink)", lineHeight: 1.2, fontVariantNumeric: "tabular-nums" }}>
                          {fmtFecha(m.fecha).hora}
                        </div>
                      )}
                    </td>
                    <td className="pr-inv-td">
                      <div style={{ fontWeight: 700, fontSize: "7.5pt", color: "var(--pr-ink)", lineHeight: 1.25, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {m.nombre_insumo || "—"}
                      </div>
                      {(m.marca || m.modelo) && (
                        <div style={{ fontSize: "6.5pt", color: "var(--pr-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {[m.marca, m.modelo].filter(Boolean).join(" · ")}
                        </div>
                      )}
                    </td>
                    <td className="pr-inv-td" style={{ fontWeight: 900, fontSize: "8.5pt", color: "var(--pr-accent)", whiteSpace: "nowrap", fontVariantNumeric: "tabular-nums" }}>
                      {esSalida ? "-" : "+"}{m.cantidad ?? 0}
                    </td>
                    <td className="pr-inv-td" style={{ fontSize: "7pt", color: "var(--pr-muted)", whiteSpace: "nowrap", fontVariantNumeric: "tabular-nums" }}>
                      {m.stock_anterior ?? 0} → {m.stock_nuevo ?? 0}
                    </td>
                    <td className="pr-inv-td" style={{ fontSize: "7pt", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {m.nombre_empleado || "—"}
                    </td>
                    <td className="pr-inv-td">
                      <div style={{ fontSize: "7pt", color: "var(--pr-muted)", lineHeight: 1.35 }}>
                        {m.motivo || "—"}
                      </div>
                      {m.folio_solicitud && (
                        <span className="pr-badge" style={{ fontSize: "6pt", marginTop: 2, color: "var(--pr-accent)", fontFamily: "monospace" }}>
                          {m.folio_solicitud}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Pie de totales */}
          <div style={{ display: "flex", justifyContent: "space-between", padding: "5px 10px", borderTop: "1px solid var(--pr-border)", background: "var(--pr-light)", fontSize: "6.5pt", fontWeight: 700, color: "var(--pr-muted)" }}>
            <span>Total: {rows.length} {rows.length !== 1 ? plur : sing}</span>
            <span>Registros: {total > rows.length ? `${rows.length} de ${total}` : rows.length}</span>
          </div>
        </section>

      </div>

      <PageFooter right={`${titulo} · Folio ${folioDoc} · ${fechaGen}`} />

    </div>
  );
}