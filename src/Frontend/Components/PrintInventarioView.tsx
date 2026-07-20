import { PageHeader, PageFooter, Section, nowFechaGen } from "./PrintShared";
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

const ESTADO_COLOR: Record<string, string> = {
  Excelente: "#15803D",
  Bueno:     "#2563eb",
  Regular:   "#A16207",
  Malo:      "#B91C1C",
};

const ESTADO_BG: Record<string, string> = {
  Excelente: "#f0fdf4",
  Bueno:     "#eff6ff",
  Regular:   "#fffbeb",
  Malo:      "#fef2f2",
};

function InsumoThumb({ url }: { url?: string | null }) {
  if (!url) return (
    <div className="pr-inv-thumb-placeholder">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5">
        <rect x="3" y="3" width="18" height="18" rx="2"/>
        <circle cx="8.5" cy="8.5" r="1.5"/>
        <polyline points="21 15 16 10 5 21"/>
      </svg>
    </div>
  );
  return <img src={url} alt="" className="pr-inv-thumb" />;
}

export default function PrintInventarioView({ datos }: { datos: InsumoRow[] }) {
  const now      = new Date();
  const fechaGen = nowFechaGen();
  const folioDoc = `INV-${now.getFullYear()}${String(now.getMonth()+1).padStart(2,"0")}-${String(now.getDate()).padStart(2,"0")}`;

  return (
    <div className="pr-root pr-landscape" data-ready="true">

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

        {/* Barra de estado — igual que PDF de tickets */}
        <div style={{
          display: "flex", alignItems: "center", flexWrap: "wrap", gap: 8,
          padding: "6px 10px", marginBottom: 10,
          border: "1px solid #cccccc", background: "#f5f5f5",
        }}>
          <span style={{ flex: 1, fontSize: "9pt", fontWeight: "bold", color: "#000" }}>
            Catálogo de Insumos
          </span>
          <span style={{ fontSize: "7.5pt", color: "#444" }}>{datos.length} registros</span>
          <span style={{ fontSize: "7.5pt", color: "#444" }}>Folio: {folioDoc}</span>
        </div>

        <Section title="Catálogo de Insumos" noPad>
          <table className="pr-inv-table">
            <thead>
              <tr style={{ background: "var(--pr-navy)" }}>
                <th className="pr-inv-th" style={{ width: 52 }}>Imagen</th>
                <th className="pr-inv-th" style={{ width: "24%" }}>Nombre</th>
                <th className="pr-inv-th" style={{ width: "11%" }}>Marca / Modelo</th>
                <th className="pr-inv-th" style={{ width: "9%" }}>N° Serie</th>
                <th className="pr-inv-th" style={{ width: "12%" }}>Categoría</th>
                <th className="pr-inv-th" style={{ width: "8%" }}>Estado</th>
                <th className="pr-inv-th" style={{ width: "9%" }}>Disponibilidad</th>
                <th className="pr-inv-th" style={{ width: 48, textAlign: "center" }}>Stock</th>
                <th className="pr-inv-th">Descripción</th>
              </tr>
            </thead>
            <tbody>
              {datos.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ padding: 20, textAlign: "center", color: "var(--pr-faint)", fontStyle: "italic", fontSize: "7pt" }}>
                    Sin registros en el inventario.
                  </td>
                </tr>
              ) : datos.map((i, idx) => {
                const estadoColor = ESTADO_COLOR[i.estado ?? ""] ?? "#94a3b8";
                const estadoBgCol = ESTADO_BG[i.estado ?? ""]   ?? "#f8fafc";
                const stockColor  = (i.stock ?? 0) === 0 ? "#B91C1C" : (i.stock ?? 0) <= 5 ? "#d97706" : "#15803D";
                const stockBg     = (i.stock ?? 0) === 0 ? "#fef2f2" : (i.stock ?? 0) <= 5 ? "#fffbeb" : "#f0fdf4";
                const isAlt       = idx % 2 === 1;
                return (
                  <tr key={i.id_insumo} style={{ background: isAlt ? "var(--pr-surface)" : "#fff", borderBottom: "1px solid var(--pr-border)" }}>
                    <td className="pr-inv-td pr-inv-td-img">
                      <InsumoThumb url={i.imagen_url} />
                    </td>
                    <td className="pr-inv-td">
                      <div style={{ display: "flex", alignItems: "flex-start", gap: 5 }}>
                        <div style={{ width: 3, minHeight: 32, borderRadius: 2, background: estadoColor, flexShrink: 0, marginTop: 2 }} />
                        <div>
                          <div style={{ fontWeight: 700, fontSize: "7pt", color: "var(--pr-ink)", lineHeight: 1.3 }}>{i.nombre}</div>
                          <div style={{ fontSize: "5.5pt", color: "var(--pr-faint)", marginTop: 1, fontFamily: "monospace" }}>#{String(idx + 1).padStart(3, "0")}</div>
                        </div>
                      </div>
                    </td>
                    <td className="pr-inv-td" style={{ fontSize: "6.5pt", color: "var(--pr-muted)" }}>
                      {[i.marca, i.modelo].filter(Boolean).join(" · ") || <span style={{ color: "var(--pr-border)" }}>—</span>}
                    </td>
                    <td className="pr-inv-td" style={{ fontSize: "6pt", fontFamily: "monospace", color: "var(--pr-muted)" }}>
                      {i.num_serie || <span style={{ color: "var(--pr-border)" }}>—</span>}
                    </td>
                    <td className="pr-inv-td">
                      {i.nombre_categoria ? (
                        <span className="pr-badge" style={{ background: "#f0f9ff", color: "#0369a1", border: "1px solid #bae6fd" }}>
                          {i.nombre_categoria}
                        </span>
                      ) : <span style={{ color: "var(--pr-border)" }}>—</span>}
                    </td>
                    <td className="pr-inv-td">
                      <span className="pr-badge" style={{ background: estadoBgCol, color: estadoColor, border: `1px solid ${estadoColor}30` }}>
                        <span style={{ width: 5, height: 5, borderRadius: "50%", background: estadoColor, flexShrink: 0, display: "inline-block" }} />
                        {i.estado || "—"}
                      </span>
                    </td>
                    <td className="pr-inv-td" style={{ fontSize: "6.5pt", color: "var(--pr-muted)" }}>
                      {i.disponibilidad || <span style={{ color: "var(--pr-border)" }}>—</span>}
                    </td>
                    <td className="pr-inv-td" style={{ textAlign: "center", padding: "4px 6px" }}>
                      <span className="pr-badge" style={{
                        background: stockBg, color: stockColor,
                        border: `1px solid ${stockColor}30`,
                        fontFamily: "monospace", fontSize: "8.5pt", fontWeight: 900,
                        minWidth: 28, justifyContent: "center",
                      }}>
                        {i.stock ?? 0}
                      </span>
                    </td>
                    <td className="pr-inv-td" style={{ fontSize: "6pt", color: "var(--pr-muted)", lineHeight: 1.4 }}>
                      {i.descripcion || <span style={{ color: "var(--pr-border)", fontStyle: "italic" }}>Sin descripción</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Section>

      </div>

      <PageFooter right={`Inventario de Insumos · Folio ${folioDoc} · ${fechaGen}`} />

    </div>
  );
}
