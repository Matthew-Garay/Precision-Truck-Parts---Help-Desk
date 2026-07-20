/**
 * PrintShared.tsx — Componentes base compartidos por todos los PDFs del sistema
 * Todos los layouts de impresión importan desde aquí para garantizar consistencia visual.
 */
import "./print-report.css";

/* ── Tipos ─────────────────────────────────────────────────────── */
export interface BadgeMeta { bg: string; color: string; border: string; icon?: string; }

/* ── Catálogos de colores ───────────────────────────────────────── */
export const PRIO_META: Record<string, BadgeMeta & { label: string }> = {
  Urgente: { label: "URGENTE", bg: "#FEF2F2", color: "#B91C1C", border: "#FCA5A5" },
  Alta:    { label: "ALTA",    bg: "#FFF7ED", color: "#C2410C", border: "#FDBA74" },
  Media:   { label: "MEDIA",   bg: "#FEFCE8", color: "#A16207", border: "#FDE047" },
  Baja:    { label: "BAJA",    bg: "#F0FDF4", color: "#15803D", border: "#86EFAC" },
};

export const ESTATUS_META: Record<string, BadgeMeta> = {
  "Resuelto":    { icon: "✓", bg: "#F0FDF4", color: "#15803D", border: "#86EFAC" },
  "En proceso":  { icon: "◷", bg: "#FFF7ED", color: "#C2410C", border: "#FDBA74" },
  "Pendiente":   { icon: "◷", bg: "#EFF6FF", color: "#1D4ED8", border: "#BFDBFE" },
  "No Resuelto": { icon: "✕", bg: "#FEF2F2", color: "#B91C1C", border: "#FCA5A5" },
  "Rechazado":   { icon: "✕", bg: "#F1F5F9", color: "#475569", border: "#CBD5E1" },
  "Cancelado":   { icon: "✕", bg: "#F1F5F9", color: "#475569", border: "#CBD5E1" },
};

/* ── Helpers de formato ─────────────────────────────────────────── */
export const fmt = {
  fechaCorta: (d: string) =>
    new Date(d).toLocaleDateString("es-MX", { day: "2-digit", month: "2-digit", year: "numeric" }),
  hora: (d: string) =>
    new Date(d).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" }),
  fechaHora: (d: string) => {
    const dt = new Date(d);
    return `${dt.toLocaleDateString("es-MX", { day: "2-digit", month: "2-digit", year: "numeric" })} · ${dt.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })}`;
  },
};

export function nowFechaGen(): string {
  return fmt.fechaHora(new Date().toISOString());
}

/* ── Badge ──────────────────────────────────────────────────────── */
export function Badge({ label, bg, color, border, icon }: BadgeMeta & { label: string }) {
  return (
    <span className="pr-badge" style={{ background: bg, color, border: `1px solid ${border}` }}>
      {icon && <span>{icon}</span>}
      {label}
    </span>
  );
}

/* ── Stars ──────────────────────────────────────────────────────── */
export function Stars({ n, size = 13 }: { n: number; size?: number }) {
  return (
    <span className="pr-stars">
      {[1,2,3,4,5].map(i => (
        <svg key={i} width={size} height={size} viewBox="0 0 24 24"
          fill={i <= n ? "#000000" : "none"}
          stroke={i <= n ? "#000000" : "#aaaaaa"}
          strokeWidth="1.5">
          <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
        </svg>
      ))}
    </span>
  );
}

/* ── PageHeader ─────────────────────────────────────────────────── */
export function PageHeader({ titulo, subtitulo, dept, metaRows }: {
  titulo: string;
  subtitulo?: string;
  dept?: string;
  metaRows: { label: string; value: React.ReactNode; mono?: boolean }[];
}) {
  return (
    <header className="pr-page-header">
      <div className="pr-header-logo">
        <img src="/assets/img/log.png" alt="Precision Truck Parts" className="pr-logo-img" />
      </div>
      <div className="pr-header-center">
        {titulo    && <span className="pr-header-doc">{titulo}</span>}
        <span className="pr-header-company">Precision Truck Parts and Accessories</span>
        {(subtitulo || dept) && (
          <span className="pr-header-dept">{subtitulo ?? dept}</span>
        )}
      </div>
      <div className="pr-header-meta">
        {metaRows.map(({ label, value, mono }) => (
          <div key={label} className="pr-header-meta-row">
            <span className="pr-micro-label">{label}</span>
            {mono
              ? <span className="pr-folio">{value}</span>
              : <span className="pr-header-fecha">{value}</span>
            }
          </div>
        ))}
      </div>
    </header>
  );
}

/* ── PageFooter ─────────────────────────────────────────────────── */
export function PageFooter({ right }: { right: string }) {
  return (
    <footer className="pr-page-footer">
      <span className="pr-footer-center-text">
        Precision Truck Parts and Accessories
      </span>
      <span className="pr-footer-side pr-footer-right-text">{right}</span>
    </footer>
  );
}

/* ── Section ────────────────────────────────────────────────────── */
export function Section({ title, children, noPad }: { title: string; children: React.ReactNode; noPad?: boolean }) {
  return (
    <section className="pr-section">
      <div className="pr-section-hdr">
        <span className="pr-section-title">{title}</span>
      </div>
      <div className={noPad ? undefined : "pr-section-body"}>{children}</div>
    </section>
  );
}

/* ── DataGrid ───────────────────────────────────────────────────── */
export function DataGrid({ items }: {
  items: { label: string; value: React.ReactNode; wide?: boolean; half?: boolean }[];
}) {
  return (
    <div className="pr-data-grid">
      {items.map(({ label, value, wide, half }, i) => (
        <div key={i} className={`pr-data-cell${wide ? " wide" : ""}${half ? " half" : ""}`}>
          <span className="pr-micro-label">{label}</span>
          <span className="pr-data-val">{value || "—"}</span>
        </div>
      ))}
    </div>
  );
}

/* ── KpiStrip ───────────────────────────────────────────────────── */
export function KpiStrip({ items }: { items: { label: string; value: string | number; color: string }[] }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: `repeat(${items.length}, 1fr)`, gap: 5, marginBottom: 8 }}>
      {items.map(({ label, value, color }) => (
        <div key={label} className="pr-data-cell" style={{ borderTop: `2.5px solid ${color}` }}>
          <span className="pr-micro-label">{label}</span>
          <span style={{ fontSize: "13pt", fontWeight: 900, color, lineHeight: 1.1, marginTop: 2, display: "block" }}>{value}</span>
        </div>
      ))}
    </div>
  );
}

/* ── ReporteTable ───────────────────────────────────────────────── */
export function ReporteTable({ headers, rows, colWidths }: {
  headers: string[];
  rows: React.ReactNode[][];
  colWidths?: string[];
}) {
  return (
    <div className="pr-reporte-table-wrap" style={{ flex: 1, display: "flex", flexDirection: "column", marginBottom: 0 }}>
      <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "auto" }}>
        {colWidths && (
          <colgroup>
            {colWidths.map((w, i) => <col key={i} style={{ width: w }} />)}
          </colgroup>
        )}
        <thead>
          <tr style={{ background: "var(--pr-navy)" }}>
            {headers.map(h => (
              <th key={h} style={{
                padding: "4px 6px", textAlign: "left", fontSize: "5pt", fontWeight: 900,
                textTransform: "uppercase", letterSpacing: "0.12em", color: "rgba(255,255,255,0.85)",
                whiteSpace: "nowrap",
              }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={headers.length} style={{ padding: 12, textAlign: "center", color: "var(--pr-faint)", fontSize: "7pt", fontStyle: "italic" }}>
                Sin registros en el período seleccionado.
              </td>
            </tr>
          ) : rows.map((cells, i) => (
            <tr key={i} style={{ background: i % 2 === 0 ? "#fff" : "var(--pr-surface)", borderBottom: "1px solid var(--pr-border)" }}>
              {cells.map((cell, j) => (
                <td key={j} style={{ padding: "3px 6px", verticalAlign: "top", fontSize: "6.5pt", wordBreak: "break-word", overflowWrap: "break-word" }}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ── Firma ──────────────────────────────────────────────────────── */
export function Firma({ nombre, rol }: { nombre: string; rol: string }) {
  return (
    <div className="pr-signature">
      <div className="pr-signature-area" />
      <div className="pr-signature-line" />
      <span className="pr-signature-name">{nombre}</span>
      <span className="pr-signature-role">{rol}</span>
      <span className="pr-signature-role">Precision Truck Parts and Accessories</span>
    </div>
  );
}

/* ── LoadingPrint / ErrorPrint (estados de página) ──────────────── */
export function LoadingPrint() {
  return (
    <div style={{ fontFamily: "'Inter','Segoe UI',sans-serif", padding: 48, display: "flex", alignItems: "center", gap: 14, color: "#6B7280", fontSize: 14 }}>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#E8621A" strokeWidth="2.5" strokeLinecap="round"
        style={{ flexShrink: 0, animation: "pr-spin 0.9s linear infinite" }}>
        <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
      </svg>
      <style>{`@keyframes pr-spin { to { transform: rotate(360deg); } }`}</style>
      Preparando reporte para imprimir…
    </div>
  );
}

export function ErrorPrint({ message }: { message: string }) {
  return (
    <div style={{ fontFamily: "sans-serif", padding: 40, color: "#DC2626", display: "flex", flexDirection: "column", gap: 8 }}>
      <strong style={{ fontSize: 15 }}>No se pudo cargar el reporte</strong>
      <span style={{ fontSize: 13, color: "#6B7280" }}>{message}</span>
      <span style={{ fontSize: 12, color: "#9CA3AF", marginTop: 4 }}>
        Verifica que la sesión siga activa y vuelve a intentarlo.
      </span>
    </div>
  );
}
