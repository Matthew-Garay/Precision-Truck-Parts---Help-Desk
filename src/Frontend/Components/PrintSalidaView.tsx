/**
 * PrintSalidaView.tsx — Hoja de SALIDA INTERNA de insumos (uso interno).
 * Mismo formato B/N minimalista del resto de impresiones. El formato está
 * pensado para LLENARSE A MANO: los campos destino / quien recibe / firmas
 * se imprimen con línea punteada cuando la API no trae valor.
 */
import { PageHeader, PageFooter, PageSize, Firma, nowFechaGen } from "./PrintShared";
import "./print-report.css";

export interface SalidaRenglon {
  id_movimiento?: number;
  nombre_insumo?: string | null;
  descripcion?: string | null;
  imagen_url?: string | null;
  marca?: string | null;
  modelo?: string | null;
  cantidad?: number | null;
  stock_anterior?: number | null;
  stock_nuevo?: number | null;
}

export interface SalidaPayload {
  folio: string;
  fecha?: string | null;
  rows: SalidaRenglon[];
  destino?: string | null;
  responsable?: string | null;
  motivo?: string | null;
  registrado_por?: string | null;
  solicitante?: string | null;
  solicitante_puesto?: string | null;
  solicitante_sucursal?: string | null;
  solicitante_num?: string | null;
}

const COLS = ["#", "Foto", "Insumo", "Marca / Modelo", "Cantidad"];

const API_BASE = import.meta.env.VITE_API_URL ?? "";
/** Convierte imagen_url del insumo en una URL visible (prefijo /storage + API). */
function imgSrc(u?: string | null): string {
  const s = String(u ?? "").trim();
  if (!s) return "";
  if (/^https?:\/\//i.test(s)) return s;
  const rel = s.startsWith("/storage/") ? s : `/storage/${s.replace(/^\/+/, "")}`;
  return API_BASE + rel;
}

function fmtFecha(f?: string | null) {
  const s = String(f ?? "").trim();
  if (!s) return "—";
  // MySQL manda "YYYY-MM-DD HH:MM:SS"; la API puede mandar ISO ("...Z")
  const d = new Date(/^\d{4}-\d{2}-\d{2} /.test(s) ? s.replace(" ", "T") : s);
  if (Number.isNaN(d.getTime())) return s;
  return d.toLocaleDateString("es-MX", { day: "2-digit", month: "2-digit", year: "numeric" });
}

/** Dato del formato: valor impreso si existe, o línea punteada para escribir a mano */
function Campo({ label, value }: { label: string; value?: string | null }) {
  const v = (value ?? "").trim();
  return (
    <div style={{ minWidth: 0 }}>
      <div style={{ fontSize: "6pt", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--pr-muted)" }}>
        {label}
      </div>
      <div style={{
        marginTop: 3, minHeight: "14pt", fontSize: "8.5pt", fontWeight: 700, color: "var(--pr-ink)",
        borderBottom: v ? "1px solid var(--pr-border)" : "1px dotted var(--pr-faint)",
        paddingBottom: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
      }}>
        {v || "\u00a0"}
      </div>
    </div>
  );
}

export default function PrintSalidaView({ payload }: { payload: SalidaPayload }) {
  const rows        = payload?.rows ?? [];
  const totalPiezas = rows.reduce((s, r) => s + (Number(r.cantidad) || 0), 0);
  const fechaGen    = nowFechaGen();
  const folio       = payload?.folio || `SAL-${new Date().getFullYear()}`;

  return (
    <div className="pr-root pr-salida" data-ready="true" style={{ background: "#ffffff" }}>
      <PageSize />
      {/* Pulido SOLO de esta hoja: fondo blanco puro, rejilla limpia y área de firma amplia para el SELLO. */}
      <style>{`
        .pr-salida, .pr-salida .pr-content { background: #ffffff; }
        .pr-salida { box-shadow: none !important; border: none !important; }
        .pr-salida .pr-content { display: flex; flex-direction: column; flex: 1; }
        .pr-salida .pr-inv-td { border-bottom: 1px solid #d6d6d6; }
        .pr-salida .pr-inv-th { background: #ffffff; border-bottom: 1.5px solid #000; }
        .pr-salida .pr-signature-area { height: 96px; border-bottom: none; }
        /* "Quien recibe" (primer bloque) lleva MÁS altura para firmar con pluma. */
        .pr-salida .pr-salida-firmas .pr-signature:first-child .pr-signature-area { height: 150px; }
        .pr-salida .pr-signature { width: 42%; }
        .pr-salida .pr-signature-line { width: 100%; height: 1px; background: var(--pr-ink); }
        .pr-salida .pr-salida-firmas { margin-top: 40px; padding-top: 24px; align-items: flex-end; }
      `}</style>

      <PageHeader
        logoSrc="/assets/img/log.png"
        titulo="Salida interna de insumos"
        subtitulo="Departamento de Soporte Técnico"
        metaRows={[
          { label: "Folio",    value: folio, mono: true },
          { label: "Fecha",    value: fmtFecha(payload?.fecha) },
          { label: "Generado", value: fechaGen },
        ]}
      />

      <div className="pr-content">

        {/* ── Datos del formato ─────────────────────────────────── */}
        <section className="pr-inv-section">
          <div className="pr-inv-section-hdr">
            <span className="pr-inv-section-title">Datos de la salida</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 16px", padding: "8px 10px 10px" }}>
            <Campo label="Solicitante" value={payload?.solicitante} />
            <Campo label="Puesto / área" value={payload?.solicitante_puesto} />
            <Campo label="Sucursal" value={payload?.solicitante_sucursal} />
            <Campo label="Fecha" value={fmtFecha(payload?.fecha)} />
            <div style={{ gridColumn: "1 / -1" }}>
              <Campo label="Motivo / observaciones" value={payload?.motivo} />
            </div>
          </div>
        </section>

        {/* ── Insumos retirados ─────────────────────────────────── */}
        <section className="pr-inv-section">
          <div className="pr-inv-section-hdr">
            <span className="pr-inv-section-title">Insumos retirados</span>
            <span className="pr-inv-section-count">
              {rows.length} renglón{rows.length !== 1 ? "es" : ""}
            </span>
          </div>

          <table className="pr-inv-table" style={{ tableLayout: "fixed" }}>
            <colgroup>
              <col style={{ width: "6%" }} />
              <col style={{ width: "11%" }} />
              <col style={{ width: "35%" }} />
              <col style={{ width: "28%" }} />
              <col style={{ width: "20%" }} />
            </colgroup>
            <thead>
              <tr>
                {COLS.map((c, ci) => (
                  <th key={c} className="pr-inv-th" style={{ textAlign: ci <= 1 ? "center" : ci === COLS.length - 1 ? "right" : "left" }}>{c}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: 20, textAlign: "center", color: "var(--pr-faint)", fontStyle: "italic", fontSize: "7.5pt" }}>
                    Sin insumos en esta salida.
                  </td>
                </tr>
              ) : rows.map((r, i) => (
                <tr key={r.id_movimiento ?? i}>
                  <td className="pr-inv-td" style={{ textAlign: "center", color: "var(--pr-faint)", fontSize: "7pt" }}>
                    {i + 1}
                  </td>
                  <td className="pr-inv-td pr-inv-td-img">
                    {imgSrc(r.imagen_url) ? (
                      <img src={imgSrc(r.imagen_url)} alt="" className="pr-inv-thumb" />
                    ) : (
                      <div className="pr-inv-thumb-placeholder"><span style={{ fontSize: "5pt", color: "var(--pr-faint)" }}>S/F</span></div>
                    )}
                  </td>
                  <td className="pr-inv-td">
                    <div style={{ fontWeight: 700, fontSize: "8pt", color: "var(--pr-ink)", lineHeight: 1.25, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {r.nombre_insumo || "—"}
                    </div>
                    {r.descripcion ? (
                      <div style={{ fontSize: "6.5pt", color: "var(--pr-muted)", lineHeight: 1.3, marginTop: 1, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", wordBreak: "break-word" }}>
                        {r.descripcion}
                      </div>
                    ) : null}
                  </td>
                  <td className="pr-inv-td" style={{ fontSize: "7pt", color: "var(--pr-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {[r.marca, r.modelo].filter(Boolean).join(" · ") || "—"}
                  </td>
                  <td className="pr-inv-td" style={{ fontWeight: 900, fontSize: "9pt", color: "var(--pr-accent)", textAlign: "right", whiteSpace: "nowrap", fontVariantNumeric: "tabular-nums" }}>
                    −{r.cantidad ?? 0}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pie de totales */}
          <div style={{ display: "flex", justifyContent: "space-between", padding: "5px 10px", borderTop: "1px solid var(--pr-border)", background: "var(--pr-light)", fontSize: "6.5pt", fontWeight: 700, color: "var(--pr-muted)" }}>
            <span>
              Total: {rows.length} renglón{rows.length !== 1 ? "es" : ""} · {totalPiezas} pieza{totalPiezas !== 1 ? "s" : ""}
            </span>
          </div>
        </section>

        {/* ── Firmas (se llenan a mano) ─────────────────────────── */}
        <section className="pr-inv-section">
          <div className="pr-inv-section-hdr">
            <span className="pr-inv-section-title">Ruta de la salida</span>
          </div>
          <div style={{ padding: "8px 10px 12px" }}>
            <Campo label="Origen → Destino" value={payload?.destino} />
          </div>
        </section>

        {/* Firmas (se llenan a mano) */}
        <div className="pr-salida-firmas" style={{ display: "flex", justifyContent: "space-around", gap: 24, padding: "0 14px 6px" }}>
          <Firma nombre={payload?.responsable || ""} rol="Quien recibe" />
          <Firma nombre={payload?.registrado_por || ""} rol="Quien entrega" />
        </div>

      </div>

      <PageFooter right={`Salida interna de insumos · Folio ${folio} · ${fechaGen}`} />

    </div>
  );
}

