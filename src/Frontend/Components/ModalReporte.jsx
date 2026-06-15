import { useState } from "react";
import { X, FileDown } from "lucide-react";
import { NEUTRAL, SLATE, SEMANTIC, RADIUS, FONT } from "../Config/DesignSystem";

const ORANGE = "#F47920";
const ORANGE_DARK = "#d97400";

export default function ModalReporte({ T, admins = [], onClose, onGenerar, generando = false }) {
  const [params, setParams] = useState({ fecha_inicio: "", fecha_fin: "", id_tecnico: "todos" });
  const set = (key, val) => setParams(p => ({ ...p, [key]: val }));
  const valido = params.fecha_inicio && params.fecha_fin;
  const isDark = T.isDark;

  const border = T.border ?? SLATE[200];
  const surf   = T.surface ?? NEUTRAL.white;
  const surfAlt = T.surfaceAlt ?? NEUTRAL.slate50;

  const inpSt = {
    background: isDark ? "rgba(255,255,255,0.05)" : NEUTRAL.slate50,
    border: `1px solid ${border}`,
    color: T.text,
    outline: "none",
    borderRadius: RADIUS.sm,
    padding: "8px 12px",
    fontSize: "13px",
    width: "100%",
    transition: "border-color 0.15s",
    colorScheme: isDark ? "dark" : "light",
  };

  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: 16, background: "rgba(0,0,0,0.50)", backdropFilter: "blur(2px)" }}
      onClick={onClose}
    >
      <div
        style={{ width: "100%", maxWidth: 400, background: surf, borderRadius: RADIUS.lg, border: `1px solid ${border}`, boxShadow: isDark ? "0 20px 48px rgba(0,0,0,0.55)" : "0 20px 48px rgba(0,0,0,0.14)", overflow: "hidden", display: "flex", flexDirection: "column" }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header — slate-800 estandarizado */}
        <div style={{ padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", background: isDark ? "#0f1117" : "#1e293b", borderBottom: `1px solid ${border}`, flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 30, height: 30, borderRadius: RADIUS.sm, background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <FileDown size={14} color="rgba(255,255,255,0.75)" />
            </div>
            <div>
              <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#fff", letterSpacing: "-0.01em" }}>Generar Reporte</p>
              <p style={{ margin: "2px 0 0", fontSize: 11, color: "rgba(255,255,255,0.40)" }}>Define el rango y los parámetros</p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.14)", borderRadius: RADIUS.sm, padding: 5, color: "rgba(255,255,255,0.55)", cursor: "pointer", display: "flex", transition: "background 0.12s" }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.14)"; e.currentTarget.style.color = "#fff"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.08)"; e.currentTarget.style.color = "rgba(255,255,255,0.55)"; }}>
            <X size={14} />
          </button>
        </div>

        {/* Body — padding 24px estandarizado */}
        <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
          {[
            { key: "fecha_inicio", label: "Fecha inicio", type: "date" },
            { key: "fecha_fin",    label: "Fecha fin",    type: "date" },
          ].map(({ key, label, type }) => (
            <div key={key} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <label style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: T.textMuted ?? SLATE[600] }}>
                {label}
              </label>
              <input type={type} value={params[key]} onChange={e => set(key, e.target.value)} style={inpSt}
                onFocus={e => { e.target.style.borderColor = ORANGE; }}
                onBlur={e => { e.target.style.borderColor = border; }} />
            </div>
          ))}

          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <label style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: T.textMuted ?? SLATE[600] }}>
              Técnico
            </label>
            <select value={params.id_tecnico} onChange={e => set("id_tecnico", e.target.value)}
              style={{ ...inpSt, cursor: "pointer" }}
              onFocus={e => { e.target.style.borderColor = ORANGE; }}
              onBlur={e => { e.target.style.borderColor = border; }}>
              <option value="todos">Todos los técnicos</option>
              {admins.map(a => (
                <option key={a.id_empleado} value={a.id_empleado}>{a.nombre_completo}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Footer estandarizado — ghost izquierda, naranja derecha */}
        <div style={{ padding: "14px 24px", borderTop: `1px solid ${border}`, background: isDark ? "rgba(255,255,255,0.02)" : surfAlt, display: "flex", justifyContent: "flex-end", gap: 8, flexShrink: 0 }}>
          <button onClick={onClose} disabled={generando}
            style={{ height: 36, padding: "0 16px", borderRadius: RADIUS.sm, border: `1px solid ${border}`, background: "transparent", color: T.textMuted ?? SLATE[600], fontSize: 13, fontWeight: 500, cursor: generando ? "not-allowed" : "pointer", opacity: generando ? 0.5 : 1, transition: "background 0.12s" }}
            onMouseEnter={e => { if (!generando) e.currentTarget.style.background = isDark ? "rgba(255,255,255,0.06)" : NEUTRAL.slate100; }}
            onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}>
            Cancelar
          </button>
          <button
            onClick={() => onGenerar(params)}
            disabled={!valido || generando}
            style={{ height: 36, padding: "0 16px", borderRadius: RADIUS.sm, border: "none", background: ORANGE, color: "#fff", fontSize: 13, fontWeight: 600, cursor: (!valido || generando) ? "not-allowed" : "pointer", opacity: (!valido || generando) ? 0.55 : 1, display: "flex", alignItems: "center", gap: 6, transition: "filter 0.15s" }}
            onMouseEnter={e => { if (valido && !generando) e.currentTarget.style.filter = "brightness(0.9)"; }}
            onMouseLeave={e => { e.currentTarget.style.filter = "none"; }}
          >
            {generando ? (
              <>
                <span style={{ width: 12, height: 12, border: "2px solid rgba(255,255,255,0.30)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.7s linear infinite", flexShrink: 0 }} />
                Generando…
              </>
            ) : (
              <><FileDown size={13} /> Generar Reporte</>
            )}
          </button>
        </div>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
