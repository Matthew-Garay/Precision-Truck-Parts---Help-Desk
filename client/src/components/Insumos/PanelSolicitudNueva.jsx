/**
 * PanelSolicitudNueva.jsx — Panel derecho de "Solicitud de insumos" (escritorio):
 * solicitante, carrito, prioridad, justificación y botón de enviar.
 * Separado de pages/Usuario/SolicitudInsumo.jsx.
 */
import { Package, Ticket, ChevronDown } from 'lucide-react';
import { FS } from '../../utils/tipografia.js';
import { RequestItem } from './CarritoInsumos.jsx';

export const PRIORITY_OPTIONS = [
  { value: "Urgente", label: "Urgente", color: "#dc2626", bg: "rgba(220,38,38,0.10)", border: "rgba(220,38,38,0.30)" },
  { value: "Alta",    label: "Alta",    color: "#ea580c", bg: "rgba(234,88,12,0.10)",  border: "rgba(234,88,12,0.30)"  },
  { value: "Media",   label: "Media",   color: "#d97706", bg: "rgba(217,119,6,0.10)",  border: "rgba(217,119,6,0.30)"  },
  { value: "Baja",    label: "Baja",    color: "#6b7280", bg: "rgba(107,114,128,0.08)",border: "rgba(107,114,128,0.25)"},
];

export default function PanelSolicitudNueva({ T, activePriority, cartEntries, handleChangeQty, handleRemoveSupply, handleSubmitTicket, isSubmitting, isTicketValid, justification, priority, requesterName, setJustification, setPriority, totalItemCount, usuario }) {
  return (
  <div className="hidden md:flex" style={{ width: 300, flexShrink: 0, alignSelf: "flex-start", flexDirection: "column" }}>
    <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10,
        boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
        display: "flex", flexDirection: "column", overflow: "hidden" }}>

      {/* Header panel */}
      <div style={{ padding: "7px 10px", display: "flex", alignItems: "center", justifyContent: "space-between",
          background: T.isDark ? T.surfaceAlt : "#1e3a5f" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <Ticket size={12} style={{ color: "#60a5fa" }} />
          <span style={{ fontSize: FS.etiqueta, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "#fff" }}>Solicitud</span>
        </div>
        {totalItemCount > 0 && (
          <span style={{ fontSize: FS.etiqueta, fontWeight: 800, padding: "1px 6px", borderRadius: 99, background: "var(--color-primary)", color: "#fff" }}>
            {totalItemCount}
          </span>
        )}
      </div>

      {/* Solicitante */}
      <div style={{ padding: "6px 10px", background: T.isDark ? T.surfaceAlt : "#f0f4f8", borderBottom: `1px solid ${T.border}` }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {[
            { label: "Nombre",   value: requesterName },
            { label: "Área",     value: usuario.departamento || "—" },
            { label: "Sucursal", value: usuario.sucursal || "—" },
          ].map(({ label, value }) => (
            <div key={label} style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 4 }}>
              <span style={{ fontSize: FS.etiqueta, color: T.textFaint, flexShrink: 0 }}>{label}</span>
              <span style={{ fontSize: FS.etiqueta, fontWeight: 600, color: T.text, textAlign: "right", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "60%" }}>{value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Carrito */}
      <div style={{ maxHeight: 380, overflowY: "auto" }}>
        {cartEntries.length === 0 ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "16px 8px", gap: 6, color: T.textFaint }}>
            <Package size={18} />
            <span style={{ fontSize: FS.etiqueta, textAlign: "center" }}>Agrega insumos desde la tabla</span>
          </div>
        ) : (
          cartEntries.map(({ supply, quantity, id }) => (
            <RequestItem key={id} supply={supply} quantity={quantity} onRemove={handleRemoveSupply} onChangeQty={handleChangeQty} esUltimo={cartEntries.length <= 1} T={T} />
          ))
        )}
      </div>

      {/* Prioridad + justificación + botón */}
      <div style={{ padding: "8px 10px", display: "flex", flexDirection: "column", gap: 6, flexShrink: 0, borderTop: `1px solid ${T.border}` }}>

        <div style={{ position: "relative" }}>
          <select
            value={priority}
            onChange={e => setPriority(e.target.value)}
            style={{
              width: "100%", height: 28, paddingLeft: 8, paddingRight: 22,
              borderRadius: 6, fontSize: FS.secundario, fontWeight: 600,
              border: `1px solid ${activePriority ? activePriority.border : T.border}`,
              background: activePriority ? activePriority.bg : T.surfaceAlt,
              color: activePriority ? activePriority.color : T.textFaint,
              outline: "none", appearance: "none", cursor: "pointer",
            }}>
            <option value="" disabled>Prioridad…</option>
            {PRIORITY_OPTIONS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
          </select>
          <ChevronDown size={11} style={{ position: "absolute", right: 6, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: activePriority ? activePriority.color : T.textFaint }} />
        </div>

        <textarea
          rows={2}
          value={justification}
          onChange={e => setJustification(e.target.value)}
          placeholder="Observaciones generales…"
          style={{
            width: "100%", padding: "5px 8px", borderRadius: 6, fontSize: FS.secundario,
            border: `1px solid ${justification.trim() ? T.border : "rgba(239,68,68,0.4)"}`,
            background: justification.trim() ? T.surfaceAlt : (T.isDark ? "rgba(239,68,68,0.08)" : "#fff5f5"),
            color: T.text, outline: "none", resize: "none", boxSizing: "border-box",
          }}
          onFocus={e  => { e.target.style.borderColor = "#3b82f6"; e.target.style.background = T.surface; }}
          onBlur={e   => {
            e.target.style.borderColor = justification.trim() ? T.border : "rgba(239,68,68,0.4)";
            e.target.style.background  = justification.trim() ? T.surfaceAlt : (T.isDark ? "rgba(239,68,68,0.08)" : "#fff5f5");
          }}
        />

        {!isTicketValid && (
          <p style={{ fontSize: FS.etiqueta, color: T.textFaint, margin: 0, lineHeight: 1.4 }}>
            {cartEntries.length === 0 ? "Agrega al menos un insumo" : "Escribe las observaciones generales"}
          </p>
        )}

        <button
          onClick={handleSubmitTicket}
          disabled={!isTicketValid || isSubmitting}
          style={{
            width: "100%", height: 32, borderRadius: 6, fontSize: FS.secundario, fontWeight: 700,
            background: isTicketValid ? "#2563eb" : T.surfaceAlt,
            color: isTicketValid ? "#fff" : T.textFaint,
            border: "none", cursor: isTicketValid ? "pointer" : "not-allowed",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
            boxShadow: isTicketValid ? "0 2px 8px rgba(37,99,235,0.25)" : "none",
            opacity: (!isTicketValid || isSubmitting) ? 0.5 : 1,
            transition: "all 0.15s",
          }}
        >
          {isSubmitting
            ? <><svg className="animate-spin" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>Creando…</>
            : <><Ticket size={11} />Crear Solicitud</>
          }
        </button>
      </div>
    </div>
  </div>
  );
}
