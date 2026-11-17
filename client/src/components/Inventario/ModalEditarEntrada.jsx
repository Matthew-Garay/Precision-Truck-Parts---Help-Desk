/**
 * ModalEditarEntrada.jsx
 *
 * Modal para corregir una ENTRADA de material ya registrada: cantidad, fecha
 * y motivo. Al guardar, el backend ajusta el inventario automáticamente:
 * suma o resta la diferencia al stock del insumo y recorre los movimientos
 * posteriores del kardex para que sigan encadenados.
 *
 * Export default: ModalEditarEntrada
 * Props: movimiento (fila de GET /api/solicitudes/movimientos), onClose,
 *   onSaved(resultado), T (tokens de tema).
 * Endpoint: PUT /api/solicitudes/movimientos/:id (API_ROUTES.MOVIMIENTO) con
 *   { cantidad, motivo, fecha }. Responde 409 si reducir la entrada dejaría el
 *   inventario negativo (las unidades ya salieron).
 *
 * @module client/components/Inventario/ModalEditarEntrada
 * @requires react
 * @requires lucide-react
 * @requires ../../services/api-client.js
 * @requires ../Feedback.jsx
 * @requires ../../utils/tipografia.js
 * @requires ../LogoModal.jsx
 * @exports ModalEditarEntrada (default)
 */
import { useState, useEffect, useRef } from "react";
import { X, Pencil } from "lucide-react";
import { apiFetch, API_ROUTES } from "../../services/api-client.js";
import { useToast } from "../Feedback.jsx";

import { FS } from '../../utils/tipografia.js';
import LogoModal from '../LogoModal.jsx';
const TEAL = "#0d9488";

/** Fecha de la API (ISO o "YYYY-MM-DD HH:MM:SS") → valor de <input type="datetime-local">. */
function aInputLocal(v) {
  const s = String(v ?? "").trim();
  if (!s) return "";
  const d = new Date(/^\d{4}-\d{2}-\d{2} /.test(s) ? s.replace(" ", "T") : s);
  if (Number.isNaN(d.getTime())) return "";
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

export default function ModalEditarEntrada({ movimiento, onClose, onSaved, T }) {
  const isDark = T?.isDark ?? false;
  const toast = useToast();
  const firstRef = useRef(null);

  const surface   = isDark ? "#161B22" : "#ffffff";
  const border    = isDark ? "rgba(255,255,255,0.07)" : "#e8ecf0";
  const textMain  = T?.text ?? (isDark ? "#e2e8f0" : "#1a202c");
  const textMuted = T?.textMuted ?? (isDark ? "#8b949e" : "#64748b");
  const textFaint = T?.textFaint ?? (isDark ? "rgba(255,255,255,0.30)" : "#a0aec0");
  const inputBg   = isDark ? "rgba(255,255,255,0.04)" : "#f8fafc";

  const cantidadOriginal = Number(movimiento?.cantidad) || 0;
  const [cantidad, setCantidad] = useState(String(cantidadOriginal));
  const [fecha, setFecha]       = useState(aInputLocal(movimiento?.fecha));
  const [motivo, setMotivo]     = useState(movimiento?.motivo ?? "");
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState("");

  const nueva = parseInt(cantidad, 10);
  const valida = Number.isFinite(nueva) && nueva >= 1;
  const diferencia = valida ? nueva - cantidadOriginal : 0;

  useEffect(() => { firstRef.current?.focus(); firstRef.current?.select?.(); }, []);
  useEffect(() => {
    const fn = (e) => { if (e.key === "Escape" && !saving) onClose(); };
    document.addEventListener("keydown", fn);
    return () => document.removeEventListener("keydown", fn);
  }, [onClose, saving]);
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  const inp = {
    background: inputBg, border: `1px solid ${border}`, borderRadius: "6px",
    padding: "0 10px", height: "34px", fontSize: FS.enfasis, color: textMain,
    outline: "none", width: "100%", boxSizing: "border-box",
    colorScheme: isDark ? "dark" : "light",
  };
  const lbl = { fontSize: FS.etiqueta, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: textFaint };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!valida) { setError("La cantidad debe ser al menos 1"); return; }
    setSaving(true);
    setError("");
    try {
      const r = await apiFetch(API_ROUTES.MOVIMIENTO(movimiento.id_movimiento), {
        method: "PUT",
        body: { cantidad: nueva, motivo: motivo.trim(), fecha: fecha || null },
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) {
        const det = Array.isArray(d?.errores) ? d.errores.map(x => x.mensaje).join(", ") : "";
        throw new Error(det || d?.error || "No se pudo editar la entrada");
      }
      toast.success?.(
        d.diferencia
          ? `Entrada actualizada. Stock de "${d.nombre_insumo}": ${d.stock_anterior} → ${d.stock_nuevo}`
          : "Entrada actualizada"
      );
      onSaved?.(d);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div role="dialog" aria-modal="true" aria-label="Editar entrada"
      onMouseDown={e => { if (e.target === e.currentTarget && !saving) onClose(); }}
      style={{ position: "fixed", inset: 0, display: "grid", placeItems: "center", background: "rgba(0,0,0,0.45)", zIndex: 1000 }}>
      <div style={{ width: "100%", maxWidth: "380px", margin: "1rem", maxHeight: "90vh", overflowY: "auto", background: surface, border: `1px solid ${border}`,
        borderRadius: "12px", padding: "18px 16px", boxShadow: "0 12px 32px rgba(0,0,0,0.12)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
          <h3 style={{ margin: 0, fontSize: FS.subtitulo, fontWeight: 700, color: textMain, display: "flex", alignItems: "center", gap: "6px" }}>
            <Pencil size={15} color={TEAL} /> Editar entrada
          </h3>
          <LogoModal style={{ marginLeft: "auto", marginRight: 8, alignSelf: "center" }} />
          <button type="button" onClick={onClose} disabled={saving} aria-label="Cerrar"
            style={{ padding: "4px", borderRadius: "6px", border: `1px solid ${border}`, background: "transparent", cursor: "pointer", color: textMuted }}>
            <X size={16} />
          </button>
        </div>

        <p style={{ margin: "0 0 12px", fontSize: FS.cuerpo, color: textMuted }}>
          <strong style={{ color: textMain }}>{movimiento?.nombre_insumo}</strong>
          {(movimiento?.marca || movimiento?.modelo) && <> · {[movimiento.marca, movimiento.modelo].filter(Boolean).join(" · ")}</>}
        </p>

        <form id="form-editar-entrada" onSubmit={onSubmit} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <label htmlFor="ee-cantidad" style={lbl}>Cantidad (registrada: {cantidadOriginal})</label>
            <input id="ee-cantidad" ref={firstRef} type="number" min="1" step="1" value={cantidad}
              onChange={e => setCantidad(e.target.value)} style={inp} />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <label htmlFor="ee-fecha" style={lbl}>Fecha y hora</label>
            <input id="ee-fecha" type="datetime-local" value={fecha} onChange={e => setFecha(e.target.value)} style={inp} />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <label htmlFor="ee-motivo" style={lbl}>Motivo / proveedor</label>
            <input id="ee-motivo" type="text" maxLength={500} value={motivo} onChange={e => setMotivo(e.target.value)}
              placeholder="Compra, traído de sucursal…" style={inp} />
          </div>

          {/* Vista previa del ajuste automático de inventario */}
          <div style={{
            fontSize: FS.cuerpo, padding: "8px 10px", borderRadius: "6px",
            background: diferencia === 0 ? (isDark ? "rgba(255,255,255,0.03)" : "#f8fafc")
                      : diferencia > 0 ? "rgba(22,163,74,0.08)" : "rgba(220,38,38,0.08)",
            color: diferencia === 0 ? textMuted : diferencia > 0 ? "#16a34a" : "#dc2626",
            border: `1px solid ${border}`,
          }}>
            {diferencia === 0
              ? "El inventario no cambia."
              : <>El inventario de este insumo se ajustará automáticamente en <strong>{diferencia > 0 ? `+${diferencia}` : diferencia}</strong> {Math.abs(diferencia) === 1 ? "pieza" : "piezas"}.</>}
          </div>

          {error && (
            <p role="alert" style={{ margin: 0, padding: "8px 12px", borderRadius: "6px", fontSize: FS.cuerpo, color: "#dc2626",
              background: isDark ? "rgba(220,38,38,0.10)" : "#fef2f2", border: `1px solid ${isDark ? "rgba(220,38,38,0.25)" : "#fecaca"}` }}>
              {error}
            </p>
          )}

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
            <button type="button" onClick={onClose} disabled={saving}
              style={{ padding: "6px 16px", borderRadius: "6px", fontSize: FS.cuerpo, fontWeight: 600, background: "transparent",
                border: `1px solid ${border}`, color: textMuted, cursor: "pointer", opacity: saving ? 0.5 : 1 }}>
              Cancelar
            </button>
            <button type="submit" disabled={saving || !valida}
              style={{ padding: "6px 18px", borderRadius: "6px", fontSize: FS.cuerpo, fontWeight: 700, border: "none", color: "#fff",
                background: saving || !valida ? TEAL + "99" : TEAL, cursor: saving || !valida ? "default" : "pointer" }}>
              {saving ? "Guardando…" : "Guardar cambios"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
