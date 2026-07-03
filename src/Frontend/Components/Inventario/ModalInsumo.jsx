/**
 * ModalInsumo.jsx — Crear / Editar insumo
 *
 * Campos que maneja (coinciden exactamente con la tabla `insumo`):
 *   num_serie, nombre, descripcion, marca, modelo,
 *   stock, estado, id_categoria, proveedor, imagen_url
 *
 * Campo NO incluido: disponibilidad — es calculado por el backend
 * desde el stock (CASE WHEN), no se almacena en BD.
 *
 * Props:
 *   insumo     — objeto del insumo (con id_insumo = edición, sin id = creación)
 *   categorias — [{ id_categoria, nombre_categoria }]
 *   onClose    — cerrar modal
 *   onSave     — function(insumoGuardado, esEdicion)
 *   T          — tokens del tema activo
 */
import { useState, useEffect, useRef } from "react";
import { Package, Pencil, ImagePlus, X as XIcon } from "lucide-react";
import { apiFetch, API_ROUTES } from "../../Config/api";
import { useToast } from "../Feedback";
import Modal from "../Modal";
import { RADIUS, SLATE, NEUTRAL } from "../../Config/DesignSystem";

const ORANGE      = "#F47920";
const ACCENT_BLUE = "#2563eb";
const ESTADO_OPTS = ["Excelente", "Bueno", "Regular", "Malo"];

const INSUMO_VACIO = {
  num_serie:   "",
  nombre:      "",
  descripcion: "",
  marca:       "",
  modelo:      "",
  stock:       0,
  estado:      "Bueno",
  id_categoria: "",
  proveedor:   "",
  imagen_url:  "",
};

export default function ModalInsumo({ insumo, categorias, onClose, onSave, T }) {
  const isDark   = T?.isDark ?? false;
  const isEdit   = !!insumo?.id_insumo;
  const toast    = useToast();
  const firstRef = useRef(null);

  const [form,      setForm]      = useState({ ...INSUMO_VACIO, ...insumo });
  const [saving,    setSaving]    = useState(false);
  const [error,     setError]     = useState("");
  const [fotoFile,  setFotoFile]  = useState(null);
  const [fotoPreview, setFotoPreview] = useState(insumo?.imagen_url || null);
  const fotoRef = useRef(null);

  useEffect(() => { firstRef.current?.focus(); }, []);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  /* ── Estilos de campo ── */
  const borderColor = isDark ? "rgba(255,255,255,0.12)" : "#cbd5e1";
  const inp = {
    background:  isDark ? "rgba(255,255,255,0.05)" : NEUTRAL.slate50,
    border:      `1px solid ${borderColor}`,
    borderRadius: RADIUS.sm,
    padding:     "0 10px",
    height:      "36px",
    fontSize:    "13px",
    color:       T?.text ?? SLATE[700],
    outline:     "none",
    width:       "100%",
    boxSizing:   "border-box",
    transition:  "border-color 0.15s, box-shadow 0.15s, background 0.15s",
    colorScheme: isDark ? "dark" : "light",
  };
  const onFocusI = e => {
    e.target.style.borderColor = ACCENT_BLUE;
    e.target.style.boxShadow   = "0 0 0 3px rgba(37,99,235,0.12)";
    e.target.style.background  = isDark ? "rgba(255,255,255,0.08)" : "#fff";
  };
  const onBlurI = e => {
    e.target.style.borderColor = borderColor;
    e.target.style.boxShadow   = "none";
    e.target.style.background  = isDark ? "rgba(255,255,255,0.05)" : NEUTRAL.slate50;
  };

  const labelColor = isDark ? "rgba(255,255,255,0.5)" : SLATE[600];
  const divider    = isDark ? "rgba(255,255,255,0.08)" : "#e2e8f0";
  const cancelBg   = isDark ? "rgba(255,255,255,0.05)" : NEUTRAL.slate50;
  const cancelHov  = isDark ? "rgba(255,255,255,0.09)" : NEUTRAL.slate100;

  const Field = ({ label, htmlFor, children }) => (
    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
      <label
        htmlFor={htmlFor}
        style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase",
          letterSpacing: "0.06em", color: labelColor }}
      >
        {label}
      </label>
      {children}
    </div>
  );

  /* ── Submit — solo envía campos que existen en la tabla ── */
  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.nombre.trim()) return setError("El nombre es requerido.");
    if (!form.id_categoria)  return setError("Selecciona una categoría.");
    if (form.stock < 0)      return setError("El stock no puede ser negativo.");

    setSaving(true);
    setError("");
    try {
      const method = isEdit ? "PUT" : "POST";
      const url    = isEdit
        ? `/api/solicitudes/insumos/${insumo.id_insumo}`
        : `/api/solicitudes/insumos`;

      const payload = {
        num_serie:    form.num_serie   || "",
        nombre:       form.nombre.trim(),
        descripcion:  form.descripcion || null,
        marca:        form.marca       || "",
        modelo:       form.modelo      || "",
        stock:        Number(form.stock),
        estado:       form.estado,
        id_categoria: Number(form.id_categoria),
        proveedor:    form.proveedor   || null,
        imagen_url:   form.imagen_url  || null,
      };

      const r    = await apiFetch(url, { method, body: payload });
      const data = await r.json();
      if (!r.ok) return setError(data.error || "Error al guardar.");

      // Subir foto si se seleccionó una
      let imagenFinal = data.imagen_url || null;
      if (fotoFile && data.id_insumo) {
        const fd = new FormData();
        fd.append("foto", fotoFile);
        const rf = await apiFetch(API_ROUTES.INSUMO_FOTO(data.id_insumo), {
          method: "POST",
          body: fd,
        });
        if (rf.ok) {
          const df = await rf.json();
          imagenFinal = df.imagen_url;
        }
      }

      toast.success(isEdit ? "Insumo actualizado" : "Insumo creado");
      onSave({ ...data, imagen_url: imagenFinal }, isEdit);
    } catch {
      setError("Error de conexión. Intenta de nuevo.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      T={T}
      title={isEdit ? "Editar insumo" : "Nuevo insumo"}
      subtitle={isEdit ? `Modificando: ${insumo.nombre}` : "Completa los campos del nuevo insumo"}
      icon={isEdit
        ? <Pencil  size={13} aria-hidden="true" style={{ color: "#93c5fd" }} />
        : <Package size={13} aria-hidden="true" style={{ color: "#5eead4" }} />
      }
      onClose={onClose}
      loading={saving}
      maxWidth="520px"
    >
      <form
        id="form-insumo"
        onSubmit={handleSubmit}
        noValidate
        aria-label={isEdit ? "Formulario editar insumo" : "Formulario nuevo insumo"}
        style={{ display: "flex", flexDirection: "column", gap: "10px" }}
      >
        {/* Foto del insumo */}
        <Field htmlFor="fi-foto" label="Foto del insumo">
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            {fotoPreview ? (
              <div style={{ position: "relative", flexShrink: 0 }}>
                <img
                  src={fotoPreview.startsWith("blob:") ? fotoPreview : fotoPreview}
                  alt="preview"
                  style={{ width: "52px", height: "52px", objectFit: "cover", borderRadius: "6px",
                    border: `1px solid ${borderColor}` }}
                />
                <button
                  type="button"
                  onClick={() => { setFotoFile(null); setFotoPreview(null); }}
                  style={{
                    position: "absolute", top: "-6px", right: "-6px",
                    width: "16px", height: "16px", borderRadius: "50%",
                    background: "#dc2626", border: "none", cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}
                >
                  <XIcon size={9} color="#fff" />
                </button>
              </div>
            ) : (
              <div style={{
                width: "52px", height: "52px", borderRadius: "6px", flexShrink: 0,
                border: `1px dashed ${borderColor}`, display: "flex",
                alignItems: "center", justifyContent: "center",
                background: isDark ? "rgba(255,255,255,0.03)" : "#f8fafc",
              }}>
                <ImagePlus size={18} style={{ color: labelColor }} />
              </div>
            )}
            <div style={{ flex: 1 }}>
              <input
                id="fi-foto"
                ref={fotoRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                style={{ display: "none" }}
                onChange={e => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  setFotoFile(file);
                  setFotoPreview(URL.createObjectURL(file));
                }}
              />
              <button
                type="button"
                onClick={() => fotoRef.current?.click()}
                style={{
                  ...inp, height: "32px", cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  gap: "6px", fontSize: "12px", fontWeight: 500,
                }}
              >
                <ImagePlus size={13} /> {fotoPreview ? "Cambiar foto" : "Seleccionar foto"}
              </button>
              <p style={{ margin: "3px 0 0", fontSize: "10px", color: labelColor }}>
                JPEG, PNG o WebP · máx 5 MB
              </p>
            </div>
          </div>
        </Field>

        {/* Nombre */}
        <Field htmlFor="fi-nombre" label="Nombre del insumo *">
          <input
            id="fi-nombre"
            ref={firstRef}
            type="text"
            value={form.nombre}
            onChange={e => set("nombre", e.target.value)}
            placeholder="Ej. Filtro de aceite WIX 51348"
            aria-required="true"
            style={inp}
            onFocus={onFocusI}
            onBlur={onBlurI}
          />
        </Field>

        {/* Descripción */}
        <Field htmlFor="fi-desc" label="Descripción">
          <textarea
            id="fi-desc"
            value={form.descripcion ?? ""}
            onChange={e => set("descripcion", e.target.value)}
            placeholder="Descripción opcional del insumo…"
            rows={2}
            style={{ ...inp, height: "auto", padding: "6px 10px", resize: "none" }}
            onFocus={onFocusI}
            onBlur={onBlurI}
          />
        </Field>

        {/* Marca + Modelo */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
          <Field htmlFor="fi-marca" label="Marca">
            <input id="fi-marca" type="text" value={form.marca}
              onChange={e => set("marca", e.target.value)}
              placeholder="Ej. WIX" style={inp} onFocus={onFocusI} onBlur={onBlurI} />
          </Field>
          <Field htmlFor="fi-modelo" label="Modelo">
            <input id="fi-modelo" type="text" value={form.modelo}
              onChange={e => set("modelo", e.target.value)}
              placeholder="Ej. 51348" style={inp} onFocus={onFocusI} onBlur={onBlurI} />
          </Field>
        </div>

        {/* Num. serie + Proveedor */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
          <Field htmlFor="fi-serie" label="Número de serie">
            <input id="fi-serie" type="text" value={form.num_serie}
              onChange={e => set("num_serie", e.target.value)}
              placeholder="Ej. SN-00421" style={inp} onFocus={onFocusI} onBlur={onBlurI} />
          </Field>
          <Field htmlFor="fi-prov" label="Proveedor">
            <input id="fi-prov" type="text" value={form.proveedor ?? ""}
              onChange={e => set("proveedor", e.target.value)}
              placeholder="Ej. Autopartes García" style={inp} onFocus={onFocusI} onBlur={onBlurI} />
          </Field>
        </div>

        {/* Stock + Categoría */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
          <Field htmlFor="fi-stock" label="Stock *">
            <input id="fi-stock" type="number" min={0} value={form.stock}
              onChange={e => set("stock", e.target.value)}
              aria-required="true" style={inp} onFocus={onFocusI} onBlur={onBlurI} />
          </Field>
          <Field htmlFor="fi-cat" label="Categoría *">
            <select id="fi-cat" value={form.id_categoria}
              onChange={e => set("id_categoria", e.target.value)}
              aria-required="true"
              style={{ ...inp, cursor: "pointer" }} onFocus={onFocusI} onBlur={onBlurI}>
              <option value="">Seleccionar…</option>
              {categorias.map(c => (
                <option key={c.id_categoria} value={c.id_categoria}>{c.nombre_categoria}</option>
              ))}
            </select>
          </Field>
        </div>

        {/* Estado */}
        <Field htmlFor="fi-estado" label="Estado *">
          <select id="fi-estado" value={form.estado}
            onChange={e => set("estado", e.target.value)}
            aria-required="true"
            style={{ ...inp, cursor: "pointer" }} onFocus={onFocusI} onBlur={onBlurI}>
            {ESTADO_OPTS.map(o => <option key={o}>{o}</option>)}
          </select>
        </Field>

        {/* Error inline */}
        {error && (
          <p
            role="alert"
            style={{
              margin: 0, padding: "8px 12px", borderRadius: "4px",
              fontSize: "12px", fontWeight: 500, color: "#dc2626",
              background: isDark ? "rgba(220,38,38,0.12)" : "#fef2f2",
              border:     isDark ? "1px solid rgba(220,38,38,0.3)" : "1px solid #fecaca",
            }}
          >
            {error}
          </p>
        )}

        {/* Footer */}
        <div style={{ display: "flex", gap: "8px", paddingTop: "10px", borderTop: `1px solid ${divider}` }}>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cancelar y cerrar"
            style={{
              flex: 1, height: "36px", borderRadius: RADIUS.sm,
              border: `1px solid ${divider}`, background: cancelBg,
              color: T?.textMuted ?? SLATE[600], fontSize: "13px", fontWeight: 500,
              cursor: "pointer", transition: "background 0.12s",
            }}
            onMouseEnter={e => { e.currentTarget.style.background = cancelHov; }}
            onMouseLeave={e => { e.currentTarget.style.background = cancelBg; }}
          >
            Cancelar
          </button>

          <button
            type="submit"
            disabled={saving}
            aria-busy={saving}
            aria-label={saving ? "Guardando insumo" : (isEdit ? "Guardar cambios" : "Crear insumo")}
            style={{
              flex: 1, height: "36px", borderRadius: RADIUS.sm, border: "none",
              background: ORANGE, color: "#fff", fontSize: "13px", fontWeight: 600,
              cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1,
              display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
              transition: "opacity 0.15s, filter 0.15s",
            }}
            onMouseEnter={e => { if (!saving) e.currentTarget.style.filter = "brightness(0.9)"; }}
            onMouseLeave={e => { e.currentTarget.style.filter = "none"; }}
          >
            {saving ? (
              <>
                <span
                  aria-hidden="true"
                  style={{
                    width: "12px", height: "12px", flexShrink: 0,
                    border: "2px solid rgba(255,255,255,0.35)", borderTopColor: "#fff",
                    borderRadius: "50%", animation: "spin 0.7s linear infinite",
                  }}
                />
                Guardando…
              </>
            ) : isEdit ? "Guardar cambios" : "Crear insumo"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
