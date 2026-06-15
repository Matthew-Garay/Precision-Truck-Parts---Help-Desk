import { Trash2, AlertTriangle } from "lucide-react";
import Modal from "../Modal";

export default function ModalEliminar({ insumo, loading = false, onClose, onConfirm, T }) {
  const isDark   = T?.isDark ?? false;
  const warnBg   = isDark ? "rgba(217,119,6,0.12)"  : "#fffbeb";
  const warnBdr  = isDark ? "rgba(217,119,6,0.30)"  : "#fde68a";
  const itemBg   = isDark ? (T?.surfaceAlt ?? "#1C2230") : "#f8fafc";
  const itemBdr  = isDark ? (T?.border ?? "rgba(255,255,255,0.08)") : "#e2e8f0";
  const textMain = T?.text     ?? "#0f172a";
  const textSub  = T?.textFaint ?? "#94a3b8";
  const warnText = isDark ? "rgba(255,255,255,0.75)" : "#334155";
  const warnStrong = isDark ? "#fbbf24" : "#0f172a";

  return (
    <Modal
      T={T}
      title="Eliminar insumo"
      icon={<Trash2 size={13} style={{ color: "#fca5a5" }} />}
      confirmLabel={loading ? "Eliminando…" : "Eliminar"}
      onConfirm={onConfirm}
      onClose={onClose}
      loading={loading}
      maxWidth="380px"
      danger
    >
      {/* Advertencia */}
      <div style={{
        display: "flex", alignItems: "flex-start", gap: "12px",
        padding: "12px 14px", borderRadius: "6px",
        background: warnBg, border: `1px solid ${warnBdr}`,
      }}>
        <AlertTriangle size={16} style={{ color: "#d97706", flexShrink: 0, marginTop: "1px" }} />
        <p style={{ margin: 0, fontSize: "13px", lineHeight: "1.5", color: warnText }}>
          Esta acción es <strong style={{ color: warnStrong }}>permanente</strong> y no se puede deshacer.
        </p>
      </div>

      {/* Insumo objetivo */}
      <div style={{
        padding: "10px 14px", borderRadius: "6px",
        background: itemBg, border: `1px solid ${itemBdr}`,
        display: "flex", alignItems: "center", gap: "10px",
      }}>
        <div style={{
          width: "32px", height: "32px", borderRadius: "6px",
          background: isDark ? "rgba(220,38,38,0.15)" : "#fef2f2",
          border: isDark ? "1px solid rgba(220,38,38,0.3)" : "1px solid #fecaca",
          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        }}>
          <Trash2 size={13} style={{ color: "#dc2626" }} />
        </div>
        <div>
          <p style={{ margin: 0, fontSize: "13px", fontWeight: 700, color: textMain }}>
            {insumo?.nombre ?? "—"}
          </p>
          {(insumo?.marca || insumo?.modelo) && (
            <p style={{ margin: 0, fontSize: "11px", color: textSub, marginTop: "2px" }}>
              {[insumo.marca, insumo.modelo].filter(Boolean).join(" · ")}
            </p>
          )}
        </div>
      </div>
    </Modal>
  );
}
