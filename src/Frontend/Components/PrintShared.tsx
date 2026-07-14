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
          fill={i <= n ? "#F59E0B" : "none"}
          stroke={i <= n ? "#D97706" : "#CBD5E1"}
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
        <span className="pr-header-company">PRECISION TRUCK PARTS &amp; ACCESSORIES</span>
        {titulo    && <span className="pr-header-doc">{titulo}</span>}
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
      <div className="pr-footer-logo-wrap">
        <img src="/assets/img/log.png" alt="" className="pr-footer-logo" />
      </div>
      <span className="pr-footer-center-text">
        Precision Truck Parts &amp; Accessories — Sistema de Soporte Técnico HelpDesk
      </span>
      <span className="pr-footer-right-text">{right}</span>
    </footer>
  );
}

/* ── Section ────────────────────────────────────────────────────── */
export function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="pr-section">
      <div className="pr-section-hdr">
        <span className="pr-section-title">{title}</span>
      </div>
      <div className="pr-section-body">{children}</div>
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
export function ReporteTable({ headers, rows }: { headers: string[]; rows: React.ReactNode[][] }) {
  return (
    <div className="pr-section" style={{ marginBottom: 8 }}>
      <div className="pr-section-hdr">
        <span className="pr-section-title">Detalle</span>
      </div>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ background: "var(--pr-surface)" }}>
            {headers.map(h => (
              <th key={h} style={{
                padding: "5px 8px", textAlign: "left", fontSize: "5.5pt", fontWeight: 900,
                textTransform: "uppercase", letterSpacing: "0.15em", color: "var(--pr-faint)",
                borderBottom: "1px solid var(--pr-border)", whiteSpace: "nowrap",
              }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={headers.length} style={{ padding: 16, textAlign: "center", color: "var(--pr-faint)", fontSize: "8pt", fontStyle: "italic" }}>
                Sin registros en el período seleccionado.
              </td>
            </tr>
          ) : rows.map((cells, i) => (
            <tr key={i} style={{ background: i % 2 === 0 ? "#fff" : "var(--pr-surface)", borderBottom: "1px solid var(--pr-border)" }}>
              {cells.map((cell, j) => (
                <td key={j} style={{ padding: "5px 8px", verticalAlign: "middle" }}>{cell}</td>
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
      <span className="pr-signature-role">Precision Truck Parts &amp; Accessories</span>
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
