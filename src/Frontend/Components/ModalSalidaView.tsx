/**
 * ModalSalidaView.tsx
 *
 * Vista en MODAL del detalle de una SALIDA de insumos (folio SAL-…),
 * en lugar de abrir una ventana emergente aparte (/print/salida). Mismo
 * contenido que la hoja de impresión, pero renderizada dentro del modal
 * del diseño del sistema (tema T, scroll interno, cerrar con X / Escape).
 *
 * Props:
 *   payload  — SalidaPayload (misma forma que PrintSalidaView)
 *   T        — tokens del tema (isDark, text, textMuted, textFaint, border)
 *   onClose  — cierra el modal
 */
import { Package } from "lucide-react";
import Modal from "./Modal";

export interface SalidaRenglon {
  id_movimiento?: number;
  nombre_insumo?: string | null;
  marca?: string | null;
  modelo?: string | null;
  imagen_url?: string | null;
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
  solicitante?: string | null;
  registrado_por?: string | null;
}

const fmtFecha = (f?: string | null) => {
  const s = String(f ?? "").trim();
  if (!s) return "—";
  const d = new Date(/^\d{4}-\d{2}-\d{2} /.test(s) ? s.replace(" ", "T") : s);
  if (Number.isNaN(d.getTime())) return s;
  return d.toLocaleDateString("es-MX", { day: "2-digit", month: "2-digit", year: "numeric" });
};



// /storage/... → URL absoluta con el prefijo del API (igual que ModalSalidaInsumo).
const imgInsumoUrl = (url?: string | null): string | null => {
  if (!url) return null;
  if (url.startsWith("http")) return url;
  const API_URL = (import.meta as any).env?.VITE_API_URL ?? "";
  const rel = url.startsWith("/storage/") ? url : `/storage/${url}`;
  return `${API_URL}${rel.split("/").map(encodeURIComponent).join("/")}`;
};

const ModalSalidaView = ({
  payload,
  T = null,
  onClose,
}: {
  payload: SalidaPayload;
  T?: any;
  onClose: () => void;
}) => {
  const rows = payload?.rows ?? [];
  const totalPiezas = rows.reduce((s, r) => s + (Number(r.cantidad) || 0), 0);
  const totalInsumos = rows.length;
  const folio = payload?.folio || `SAL-${new Date().getFullYear()}`;
  const fecha = payload?.fecha ? fmtFecha(payload.fecha) : "—";
  const destino = payload?.destino || "—";
  const solicitante = payload?.solicitante || "—";
  const responsable = payload?.responsable || "—";
  const motivo = payload?.motivo || "—";
  const registradoPor = payload?.registrado_por || "—";

  const isDark = T?.isDark ?? false;
  const textMain = T?.text ?? (isDark ? "#e2e8f0" : "#1a202c");
  const textMuted = T?.textMuted ?? (isDark ? "#8b949e" : "#64748b");
  const textFaint = T?.textFaint ?? (isDark ? "rgba(255,255,255,0.30)" : "#a0aec0");
  const border = T?.border ?? (isDark ? "rgba(255,255,255,0.07)" : "#e8ecf0");

  return (
    <Modal
      title={`Salida ${folio}`}
      subtitle="Salida interna de insumos"
      icon={<Package size={18} />}
      onClose={onClose}
      T={T}
    >
      <div
        style={{
          padding: "16px 18px 12px",
          display: "grid",
          gridTemplateColumns: "repeat(2, 1fr)",
          gap: 12,
          fontSize: "12px",
        }}
      >
        <div style={{ flexDirection: "column", gap: 2, borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
          <span style={{ color: "rgba(255,255,255,0.35)", fontSize: "9px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.06em" }}>Destino</span>
          <span style={{ color: "rgba(255,255,255,0.85)", fontSize: "11px", fontWeight: 700 }}>{destino}</span>
        </div>
        <div style={{ flexDirection: "column", gap: 2, borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
          <span style={{ color: "rgba(255,255,255,0.35)", fontSize: "9px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.06em" }}>Solicitante</span>
          <span style={{ color: "rgba(255,255,255,0.85)", fontSize: "11px", fontWeight: 700 }}>{solicitante}</span>
        </div>
        <div style={{ flexDirection: "column", gap: 2, borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
          <span style={{ color: "rgba(255,255,255,0.35)", fontSize: "9px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.06em" }}>Responsable</span>
          <span style={{ color: "rgba(255,255,255,0.85)", fontSize: "11px", fontWeight: 700 }}>{responsable}</span>
        </div>
        <div style={{ flexDirection: "column", gap: 2, borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
          <span style={{ color: "rgba(255,255,255,0.35)", fontSize: "9px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.06em" }}>Fecha</span>
          <span style={{ color: "rgba(255,255,255,0.85)", fontSize: "11px", fontWeight: 700 }}>{fecha}</span>
        </div>
        <div style={{ flexDirection: "column", gap: 2, borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
          <span style={{ color: "rgba(255,255,255,0.35)", fontSize: "9px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.06em" }}>Registrado por</span>
          <span style={{ color: "rgba(255,255,255,0.85)", fontSize: "11px", fontWeight: 700 }}>{registradoPor}</span>
        </div>
        <div style={{ flexDirection: "column", gap: 2 }}>
          <span style={{ color: "rgba(255,255,255,0.35)", fontSize: "9px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.06em" }}>Motivo</span>
          <span style={{ color: "rgba(255,255,255,0.85)", fontSize: "11px", fontWeight: 700 }}>{motivo}</span>
        </div>
      </div>


      {/* ── Registros de la salida ────────────────── */}
      <div style={{ padding: "12px 18px", flex: 1, minHeight: 0, overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <span style={{ color: textMuted, fontSize: "11px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.06em" }}>
            Insumos retirados · {totalInsumos} renglón{totalInsumos !== 1 ? "es" : ""}
          </span>
          <span style={{ color: textMain, fontSize: "11px", fontWeight: 800 }}>
            {totalPiezas} pieza{totalPiezas !== 1 ? "s" : ""} en total
          </span>
        </div>

        {rows.length === 0 ? (
          <div style={{ padding: 16, textAlign: "center", color: textMuted, fontSize: "11px", fontStyle: "italic" }}>
            Sin insumos registrados en esta salida.
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }} cellPadding={0} cellSpacing={0}>
            <thead>
              <tr style={{ background: isDark ? "#1a2030" : "#f1f5f9", borderBottom: `1px solid ${border}` }}>
                <th style={{ textAlign: "left", padding: "6px 8px", fontSize: "9px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.06em", color: textMuted }}>Insumo</th>
                <th style={{ textAlign: "center", padding: "6px 8px", fontSize: "9px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.06em", color: textMuted }}>Cant.</th>
                <th style={{ textAlign: "right", padding: "6px 8px", fontSize: "9px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.06em", color: textMuted }}>Stock</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => {
                const img = imgInsumoUrl(r.imagen_url);
                return (
                  <tr key={r.id_movimiento ?? i} style={{ background: i % 2 === 0 ? (isDark ? "#141720" : "#f8fafc") : "transparent", borderBottom: `1px solid ${border}` }}>
                    <td style={{ padding: "6px 8px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ width: 40, height: 40, borderRadius: 6, overflow: "hidden", flexShrink: 0, background: isDark ? "#0f1420" : "#eef2f7", border: `1px solid ${border}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                          {img ? <img src={img} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <Package size={16} style={{ color: textFaint }} />}
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontWeight: 700, color: textMain, fontSize: "11px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.nombre_insumo || "—"}</div>
                          <div style={{ color: textMuted, fontSize: "9px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{[r.marca, r.modelo].filter(Boolean).join(" · ") || "—"}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ textAlign: "center", padding: "6px 8px", fontWeight: 800, color: "rgba(244,121,32,0.9)", fontSize: "11px", whiteSpace: "nowrap", verticalAlign: "middle" }}>−{r.cantidad ?? 0}</td>
                    <td style={{ padding: "6px 8px", fontSize: "10px", color: textMuted, textAlign: "right", whiteSpace: "nowrap", verticalAlign: "middle" }}>{r.stock_anterior ?? 0} → {r.stock_nuevo ?? 0}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>


      {/* ── Firmas ────────────────────────────────── */}
      <div style={{ padding: "12px 18px 16px", borderTop: `1px solid ${border}` }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 16 }}>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 1 }}>
            <div style={{ width: 120, height: 40, borderBottom: `1px solid ${border}` }} />
          </div>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 1 }}>
            <div style={{ width: 120, height: 40, borderBottom: `1px solid ${border}` }} />
            <span style={{ color: textMuted, fontSize: "8px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.06em" }}>Quien recibe</span>
          </div>
        </div>
      </div>

      <div style={{ padding: "10px 18px", borderTop: `1px solid ${border}` }}>
        <button
          type="button"
          onClick={onClose}
          style={{
            padding: "6px 16px", fontSize: "12px", fontWeight: 700,
            color: textMain, background: textMain === "#1a202c" || textMain === "#e2e8f0" ? (isDark ? "#334155" : "#f1f5f9") : (isDark ? "#e2e8f0" : "#1a202c"),
            border: `1px solid ${border}`, borderRadius: "6px", cursor: "pointer",
          }}
        >
          Cerrar
        </button>
      </div>
    </Modal>
  );
};
export default ModalSalidaView;

