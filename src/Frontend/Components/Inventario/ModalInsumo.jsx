/**
 * ModalInsumo.jsx
 *
 * Modal de formulario para crear o editar un insumo del inventario.
 * Detecta automaticamente si es modo creacion (insumo sin id_insumo)
 * o edicion (insumo con id_insumo) y ajusta el titulo y el boton.
 *
 * Props:
 *   insumo      - objeto del insumo a editar, o null/undefined para crear uno nuevo.
 *                 Campos esperados: id_insumo, num_serie, nombre, marca, modelo,
 *                 stock, estado, id_categoria
 *   categorias  - arreglo de categorias disponibles { id_categoria, nombre_categoria }
 *   onClose     - funcion llamada al cancelar o cerrar el modal
 *   onSave      - funcion(insumoGuardado, esEdicion) llamada al guardar con exito
 *   T           - tokens del tema activo
 */
import { useState, useEffect, useRef } from "react";
import { Package, Pencil } from "lucide-react";
import { apiFetch } from "../../Config/api";
import { useToast } from "../Feedback";
import Modal from "../Modal";
import { RADIUS } from "../../Config/DesignSystem";

const ORANGE = "#F47920";
const ORANGE_DARK = "#d97400";
const ACCENT = { base: "#2563eb" };
const ESTADO_OPTS  = ["Excelente", "Bueno", "Regular", "Malo"];
const INSUMO_VACIO = { num_serie: "", nombre: "", marca: "", modelo: "", stock: 0, estado: "Bueno", id_categoria: "" };

export default function ModalInsumo({ insumo, categorias, onClose, onSave, T }) {
  const isDark = T?.isDark ?? false;
  const isEdit = !!insumo?.id_insumo;

  const inp = {
    background:  isDark ? "rgba(255,255,255,0.05)" : "#f8fafc",
    border:      `1px solid ${isDark ? "rgba(255,255,255,0.12)" : "#cbd5e1"}`,
    borderRadius:"4px", padding: "0 10px", height: "36px",
    fontSize:    "13px", color: T?.text ?? "#334155",
    outline:     "none", width: "100%", boxSizing: "border-box",
    transition:  "border-color 0.15s, box-shadow 0.15s, background 0.15s",
    colorScheme: isDark ? "dark" : "light",
  };

  const onFocusI = (e) => {
    e.target.style.borderColor = ACCENT.base;
    e.target.style.boxShadow   = "0 0 0 3px rgba(37,99,235,0.12)";
    e.target.style.background  = isDark ? "rgba(255,255,255,0.08)" : "#fff";
  };
  const onBlurI = (e) => {
    e.target.style.borderColor = isDark ? "rgba(255,255,255,0.12)" : "#cbd5e1";
    e.target.style.boxShadow   = "none";
    e.target.style.background  = isDark ? "rgba(255,255,255,0.05)" : "#f8fafc";
  };

  const labelColor  = isDark ? "rgba(255,255,255,0.5)" : "#475569";
  const borderColor = isDark ? "rgba(255,255,255,0.08)" : "#e2e8f0";
  const cancelBg    = isDark ? "rgba(255,255,255,0.05)" : "#f8fafc";
  const cancelHov   = isDark ? "rgba(255,255,255,0.09)" : "#f1f5f9";

  const [form,   setForm]   = useState({ ...INSUMO_VACIO, ...insumo });
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState("");
  const firstInputRef = useRef(null);
  const toast = useToast();

  useEffect(() => { firstInputRef.current?.focus(); }, []);

  const set = (key, val) => setForm(p => ({ ...p, [key]: val }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.nombre.trim()) return setError("El nombre es requerido.");
    if (!form.id_categoria)  return setError("Selecciona una categoría.");
    if (form.stock < 0)      return setError("El stock no puede ser negativo.");
    setSaving(true); setError("");
    try {
      const method = isEdit ? "PUT"  : "POST";
      const url    = isEdit ? `/api/solicitudes/insumos/${insumo.id_insumo}` : `/api/solicitudes/insumos`;
      const r    = await apiFetch(url, { method, body: { ...form, stock: Number(form.stock), id_categoria: Number(form.id_categoria) } });
      const data = await r.json();
      if (!r.ok) return setError(data.error || "Error al guardar.");
      toast.success(isEdit ? "Insumo actualizado" : "Insumo creado");
      onSave(data, isEdit);
    } catch {
      setError("Error de conexión. Intenta de nuevo.");
    } finally {
      setSaving(false);
    }
  };

  const Field = ({ label, children }) => (
    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
      <label style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: labelColor }}>
        {label}
      </label>
      {children}
    </div>
  );

  return (
    <Modal
      T={T}
      title={isEdit ? "Editar insumo" : "Nuevo insumo"}
      subtitle={isEdit ? `Modificando: ${insumo.nombre}` : "Completa los campos del nuevo insumo"}
      icon={isEdit
        ? <Pencil  size={13} style={{ color: "#93c5fd" }} />
        : <Package size={13} style={{ color: "#5eead4" }} />
      }
      onClose={onClose}
      loading={saving}
    >
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>

        <Field label="Nombre del insumo *">
          <input ref={firstInputRef} type="text" value={form.nombre}
            onChange={e => set("nombre", e.target.value)}
            placeholder="Ej. Filtro de aceite WIX 51348"
            style={inp} onFocus={onFocusI} onBlur={onBlurI} />
        </Field>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
          <Field label="Marca">
            <input type="text" value={form.marca} onChange={e => set("marca", e.target.value)}
              placeholder="Ej. WIX" style={inp} onFocus={onFocusI} onBlur={onBlurI} />
          </Field>
          <Field label="Modelo">
            <input type="text" value={form.modelo} onChange={e => set("modelo", e.target.value)}
              placeholder="Ej. 51348" style={inp} onFocus={onFocusI} onBlur={onBlurI} />
          </Field>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
          <Field label="Número de serie">
            <input type="text" value={form.num_serie} onChange={e => set("num_serie", e.target.value)}
              placeholder="Ej. SN-00421" style={inp} onFocus={onFocusI} onBlur={onBlurI} />
          </Field>
          <Field label="Stock *">
            <input type="number" min={0} value={form.stock} onChange={e => set("stock", e.target.value)}
              style={inp} onFocus={onFocusI} onBlur={onBlurI} />
          </Field>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
          <Field label="Estado *">
            <select value={form.estado} onChange={e => set("estado", e.target.value)}
              style={{ ...inp, cursor: "pointer" }} onFocus={onFocusI} onBlur={onBlurI}>
              {ESTADO_OPTS.map(o => <option key={o}>{o}</option>)}
            </select>
          </Field>
          <Field label="Categoría *">
            <select value={form.id_categoria} onChange={e => set("id_categoria", e.target.value)}
              style={{ ...inp, cursor: "pointer" }} onFocus={onFocusI} onBlur={onBlurI}>
              <option value="">Seleccionar…</option>
              {categorias.map(c => (
                <option key={c.id_categoria} value={c.id_categoria}>{c.nombre_categoria}</option>
              ))}
            </select>
          </Field>
        </div>

        {error && (
          <p style={{
            margin: 0, padding: "8px 12px", borderRadius: "4px", fontSize: "12px", fontWeight: 500,
            color: "#dc2626",
            background: isDark ? "rgba(220,38,38,0.12)" : "#fef2f2",
            border: isDark ? "1px solid rgba(220,38,38,0.3)" : "1px solid #fecaca",
          }}>
            {error}
          </p>
        )}

        <div style={{ display: "flex", gap: "8px", paddingTop: "14px", marginTop: "2px", borderTop: `1px solid ${borderColor}` }}>
          <button type="button" onClick={onClose}
            style={{ flex: 1, height: "36px", borderRadius: RADIUS.sm, border: `1px solid ${borderColor}`, background: cancelBg, color: T?.textMuted ?? "#475569", fontSize: "13px", fontWeight: 500, cursor: "pointer", transition: "background 0.12s" }}
            onMouseEnter={e => e.currentTarget.style.background = cancelHov}
            onMouseLeave={e => e.currentTarget.style.background = cancelBg}>
            Cancelar
          </button>
          <button type="submit" disabled={saving}
            style={{ flex: 1, height: "36px", borderRadius: RADIUS.sm, border: "none", background: ORANGE, color: "#fff", fontSize: "13px", fontWeight: 600, cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", transition: "opacity 0.15s, filter 0.15s" }}
            onMouseEnter={e => { if (!saving) e.currentTarget.style.filter = "brightness(0.9)"; }}
            onMouseLeave={e => { e.currentTarget.style.filter = "none"; }}>
            {saving ? (
              <>
                <span style={{ width: "12px", height: "12px", border: "2px solid rgba(255,255,255,0.35)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.7s linear infinite", flexShrink: 0 }} />
                Guardando…
              </>
            ) : isEdit ? "Guardar cambios" : "Crear insumo"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
