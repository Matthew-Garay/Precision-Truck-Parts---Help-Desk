import { PageHeader, PageFooter, PageSize, nowFechaGen } from "./PrintShared";
import "./print-report.css";

interface InsumoRow {
  id_insumo: number;
  nombre: string;
  marca?: string | null;
  modelo?: string | null;
  num_serie?: string | null;
  nombre_categoria?: string | null;
  estado?: string | null;
  disponibilidad?: string | null;
  stock?: number | null;
  descripcion?: string | null;
  imagen_url?: string | null;
}

/* Estado del insumo — escala de grises de la marca.
   Solo "Malo" usa el naranja de la marca como señal de atención. */
const ESTADO_COLOR: Record<string, string> = {
  Excelente: "var(--pr-ink)",
  Bueno:     "var(--pr-muted)",
  Regular:   "var(--pr-faint)",
  Malo:      "var(--pr-accent)",
};

const ESTADO_BG: Record<string, string> = {
  Excelente: "var(--pr-light)",
  Bueno:     "var(--pr-surface)",
  Regular:   "var(--pr-surface)",
  Malo:      "var(--pr-accent-ink)",
};

/* Categorías — una sola tinta con distinta opacidad: la identidad va en
   el peso tipográfico, no en ocho colores */
const CAT_PALETTES = [
  { color: "var(--pr-ink)",  bg: "var(--pr-light)",   border: "var(--pr-border)" },
  { color: "var(--pr-muted)", bg: "var(--pr-surface)", border: "var(--pr-border)" },
  { color: "var(--pr-faint)", bg: "var(--pr-white)",   border: "var(--pr-border)" },
  { color: "var(--pr-accent)", bg: "var(--pr-accent-ink)", border: "var(--pr-accent)" },
];
const catColor = (name = "") => {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xffff;
  return CAT_PALETTES[h % CAT_PALETTES.length];
};

function InsumoThumb({ url }: { url?: string | null }) {
  if (!url) return (
    <div className="pr-inv-thumb-placeholder">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--pr-faint)" strokeWidth="1.5">
        <rect x="3" y="3" width="18" height="18" rx="2"/>
        <circle cx="8.5" cy="8.5" r="1.5"/>
        <polyline points="21 15 16 10 5 21"/>
      </svg>
    </div>
  );
  return <img src={url} alt="" className="pr-inv-thumb" />;
}

export default function PrintInventarioView({ datos, filtros = [] }: { datos: InsumoRow[]; filtros?: string[] }) {
  const now      = new Date();
  const fechaGen = nowFechaGen();
  const folioDoc = `INV-${now.getFullYear()}${String(now.getMonth()+1).padStart(2,"0")}-${String(now.getDate()).padStart(2,"0")}`;

  return (
    <div className="pr-root pr-landscape" data-ready="true">
      <PageSize landscape />

      <PageHeader
        titulo="Reporte de Inventario de Insumos"
        subtitulo="Departamento de Soporte Técnico"
        metaRows={[
          { label: "Folio",     value: folioDoc,     mono: true },
          { label: "Registros", value: datos.length, mono: true },
          { label: "Generado",  value: fechaGen },
        ]}
      />

      <div className="pr-content">

        <section className="pr-inv-section">
          <div className="pr-inv-section-hdr">
            <span className="pr-inv-section-title">Catálogo de Insumos</span>
            <span className="pr-inv-section-count">{datos.length} registro{datos.length !== 1 ? "s" : ""}</span>
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

          {/* Mismas columnas que la pestaña Insumos en pantalla */}
          <table className="pr-inv-table" style={{ tableLayout: "fixed" }}>
            <colgroup>
              <col style={{ width: 56 }} />
              <col style={{ width: "44%" }} />
              <col style={{ width: "20%" }} />
              <col style={{ width: "14%" }} />
              <col style={{ width: "22%" }} />
            </colgroup>
            <thead>
              <tr>
                <th className="pr-inv-th">Imagen</th>
                <th className="pr-inv-th">Nombre</th>
                <th className="pr-inv-th">Categoría</th>
                <th className="pr-inv-th">Estado</th>
                <th className="pr-inv-th">Stock</th>
              </tr>
            </thead>
            <tbody>
              {datos.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: 20, textAlign: "center", color: "var(--pr-faint)", fontStyle: "italic", fontSize: "7.5pt" }}>
                    Sin registros con los filtros actuales.
                  </td>
                </tr>
              ) : datos.map((i) => {
                const estadoColor = ESTADO_COLOR[i.estado ?? ""] ?? "var(--pr-faint)";
                const estadoBgCol = ESTADO_BG[i.estado ?? ""]   ?? "var(--pr-surface)";
                const stockColor  = (i.stock ?? 0) === 0 ? "var(--pr-accent)" : "var(--pr-ink)";
                const cat         = catColor(i.nombre_categoria ?? "");
                const stockPct    = Math.min(100, Math.round(((i.stock ?? 0) / 20) * 100));
                return (
                  <tr key={i.id_insumo}>
                    <td className="pr-inv-td pr-inv-td-img">
                      <InsumoThumb url={i.imagen_url} />
                    </td>
                    {/* Nombre — barra de color de estado + marca · modelo (igual que en pantalla) */}
                    <td className="pr-inv-td">
                      <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                        <div style={{ width: 3, height: 24, borderRadius: 2, background: estadoColor, flexShrink: 0 }} />
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontWeight: 700, fontSize: "8pt", color: "var(--pr-ink)", lineHeight: 1.25, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{i.nombre}</div>
                          {(i.marca || i.modelo) && (
                            <div style={{ fontSize: "6.5pt", color: "var(--pr-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {[i.marca, i.modelo].filter(Boolean).join(" · ")}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    {/* Categoría — chip con el mismo color que en pantalla */}
                    <td className="pr-inv-td">
                      {i.nombre_categoria ? (
                        <span className="pr-badge" style={{ fontSize: "6.5pt", background: cat.bg, color: cat.color, border: `1px solid ${cat.border}`, maxWidth: "100%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {i.nombre_categoria}
                        </span>
                      ) : <span style={{ color: "var(--pr-border)" }}>—</span>}
                    </td>
                    {/* Estado — chip con punto de color */}
                    <td className="pr-inv-td">
                      <span className="pr-badge" style={{ fontSize: "6.5pt", background: estadoBgCol, color: estadoColor, border: `1px solid ${estadoColor}50`, whiteSpace: "nowrap" }}>
                        <span style={{ width: 5, height: 5, borderRadius: "50%", background: estadoColor, flexShrink: 0, display: "inline-block" }} />
                        {i.estado || "—"}
                      </span>
                    </td>
                    {/* Stock — número con color + barra de nivel (igual que en pantalla) */}
                    <td className="pr-inv-td" style={{ padding: "4px 8px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ fontFamily: "monospace", fontSize: "9pt", fontWeight: 900, color: stockColor, minWidth: 20, textAlign: "right" }}>{i.stock ?? 0}</span>
                        <div style={{ flex: 1, height: 4, borderRadius: "99px", background: "var(--pr-border)", overflow: "hidden" }}>
                          <div style={{ width: `${stockPct}%`, height: "100%", background: stockColor, borderRadius: "99px" }} />
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Pie de totales */}
          <div style={{ display: "flex", justifyContent: "space-between", padding: "5px 10px", borderTop: "1px solid var(--pr-border)", background: "var(--pr-light)", fontSize: "6.5pt", fontWeight: 700, color: "var(--pr-muted)" }}>
            <span>Total: {datos.length} registro{datos.length !== 1 ? "s" : ""}</span>
            <span>Stock total: {datos.reduce((s, i) => s + (i.stock ?? 0), 0)} unidades</span>
          </div>
        </section>

      </div>

      <PageFooter right={`Inventario de Insumos · Folio ${folioDoc} · ${fechaGen}`} />

    </div>
  );
}
