/**
 * ModalInsumo.jsx — Crear / Editar insumo
 * Mismo sistema visual que ModalDetalleInsumo.
 */
import { useState, useEffect, useRef } from "react";
import { X, Package, Pencil, ImagePlus, XCircle } from "lucide-react";
import { apiFetch, API_ROUTES } from "../../Config/api";
import { useToast } from "../Feedback";

const ORANGE      = "#F47920";
const ESTADO_OPTS = ["Excelente", "Bueno", "Regular", "Malo", "Dañado"];

const INSUMO_VACIO = {
  num_serie: "", nombre: "", descripcion: "", marca: "",
  modelo: "", stock: 0, estado: "Bueno", id_categoria: "", imagen_url: "",
};

function Field({ label, htmlFor, required, children, textFaint }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
      <label htmlFor={htmlFor} style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: textFaint }}>
        {label}{required && <span style={{ color: ORANGE, marginLeft: "2px" }}>*</span>}
      </label>
      {children}
    </div>
  );
}

export default function ModalInsumo({ insumo, categorias, onClose, onSave, T }) {
  const isDark  = T?.isDark ?? false;
  const isEdit  = !!insumo?.id_insumo;
  const toast   = useToast();
  const firstRef = useRef(null);
  const fotoRef  = useRef(null);

  const [form,        setForm]        = useState({ ...INSUMO_VACIO, ...insumo });
  const [saving,      setSaving]      = useState(false);
  const [error,       setError]       = useState("");
  const [fotoFile,    setFotoFile]    = useState(null);
  const [fotoPreview, setFotoPreview] = useState(insumo?.imagen_url || null);

  useEffect(() => { firstRef.current?.focus(); }, []);

  useEffect(() => {
    const fn = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", fn);
    return () => document.removeEventListener("keydown", fn);
  }, [onClose]);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  /* ── Tokens ── */
  const surface    = isDark ? "#161B22" : "#ffffff";
  const surfaceAlt = isDark ? "#1a2030" : "#f8fafc";
  const border     = isDark ? "rgba(255,255,255,0.07)" : "#e8ecf0";
  const borderFocus= "#2563eb";
  const textMain   = T?.text     ?? (isDark ? "#e2e8f0" : "#1a202c");
  const textMuted  = T?.textMuted ?? (isDark ? "#8b949e" : "#64748b");
  const textFaint  = T?.textFaint ?? (isDark ? "rgba(255,255,255,0.30)" : "#a0aec0");
  const inputBg    = isDark ? "rgba(255,255,255,0.04)" : "#f8fafc";

  const inp = {
    background: inputBg,
    border: `1px solid ${border}`,
    borderRadius: "6px",
    padding: "0 10px",
    height: "34px",
    fontSize: "13px",
    color: textMain,
    outline: "none",
    width: "100%",
    boxSizing: "border-box",
    colorScheme: isDark ? "dark" : "light",
    transition: "border-color 0.12s, box-shadow 0.12s",
  };

  const onFocus = e => {
    e.target.style.borderColor = borderFocus;
    e.target.style.boxShadow   = "0 0 0 3px rgba(37,99,235,0.10)";
    e.target.style.background  = isDark ? "rgba(255,255,255,0.07)" : "#fff";
  };
  const onBlur = e => {
    e.target.style.borderColor = border;
    e.target.style.boxShadow   = "none";
    e.target.style.background  = inputBg;
  };

  /* ── Submit ── */
  const handleSubmit = async e => {
    e?.preventDefault();
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
        imagen_url:   form.imagen_url  || null,
      };

      const r    = await apiFetch(url, { method, body: payload });
      const data = await r.json();
      if (!r.ok) return setError(data.error || "Error al guardar.");

      let imagenFinal = data.imagen_url || null;
      if (fotoFile && data.id_insumo) {
        const fd = new FormData();
        fd.append("foto", fotoFile);
        const rf = await apiFetch(API_ROUTES.INSUMO_FOTO(data.id_insumo), { method: "POST", body: fd });
        if (rf.ok) { const df = await rf.json(); imagenFinal = df.imagen_url; }
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
    <div
      role="presentation"
      style={{
        position: "fixed", inset: 0, zIndex: 1000,
        background: isDark ? "rgba(0,0,0,0.55)" : "rgba(15,23,42,0.40)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "16px",
        animation: "miF 0.15s ease",
      }}
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <style>{`
        @keyframes miF { from{opacity:0} to{opacity:1} }
        @keyframes miS { from{opacity:0;transform:translateY(-5px)} to{opacity:1;transform:translateY(0)} }
      `}</style>

      <div
        role="dialog"
        aria-modal="true"
        style={{
          width: "95%", maxWidth: "500px",
          background: surface,
          border: `1px solid ${border}`,
          borderRadius: "10px",
          display: "flex", flexDirection: "column",
          maxHeight: "92vh", overflow: "hidden",
          boxShadow: isDark
            ? "0 16px 40px rgba(0,0,0,0.50), 0 1px 0 rgba(255,255,255,0.04) inset"
            : "0 16px 40px rgba(15,23,42,0.12), 0 1px 3px rgba(15,23,42,0.06)",
          animation: "miS 0.18s ease",
        }}
      >
        {/* Línea acento */}
        <div style={{ height: "2px", flexShrink: 0, background: ORANGE, borderRadius: "10px 10px 0 0" }} />

        {/* ── Header ── */}
        <div style={{
          padding: "14px 18px 12px",
          borderBottom: `1px solid ${border}`,
          display: "flex", alignItems: "flex-start", justifyContent: "space-between",
          gap: "12px", flexShrink: 0,
        }}>
          <div style={{ minWidth: 0, flex: 1 }}>
            <p style={{ margin: 0, fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.09em", color: ORANGE }}>
              {isEdit ? "Editar insumo" : "Nuevo insumo"}
            </p>
            <h2 style={{ margin: "3px 0 0", fontSize: "16px", fontWeight: 700, color: textMain, letterSpacing: "-0.02em", lineHeight: 1.2 }}>
              {isEdit ? insumo.nombre : "Agregar al inventario"}
            </h2>
            <p style={{ margin: "3px 0 0", fontSize: "12px", color: textMuted }}>
              {isEdit ? "Modifica los campos que necesites" : "Completa los datos del nuevo insumo"}
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexShrink: 0, paddingTop: "2px" }}>
            <img
              src={isDark ? "/assets/img/logo blanco.png" : "/assets/img/logo negro.png"}
              alt="Precision Trucks"
              style={{ height: "28px", width: "auto", objectFit: "contain", opacity: isDark ? 0.80 : 0.70 }}
            />
            <button
              onClick={onClose}
              aria-label="Cerrar"
              style={{
                width: "26px", height: "26px",
                display: "flex", alignItems: "center", justifyContent: "center",
                background: "transparent", border: `1px solid ${border}`,
                borderRadius: "6px", cursor: "pointer", color: textFaint,
                transition: "all 0.12s",
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = textMuted; e.currentTarget.style.color = textMain; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = border; e.currentTarget.style.color = textFaint; }}
            >
              <X size={12} strokeWidth={2} />
            </button>
          </div>
        </div>

        {/* ── Body scrollable ── */}
        <div style={{ flex: 1, overflowY: "auto", padding: "16px 18px" }}>
          <form id="form-insumo" onSubmit={handleSubmit} noValidate style={{ display: "flex", flexDirection: "column", gap: "12px" }}>

            {/* Foto */}
            <Field htmlFor="fi-foto" label="Foto del insumo" textFaint={textFaint}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                {/* Preview / placeholder */}
                <div style={{ position: "relative", flexShrink: 0 }}>
                  {fotoPreview ? (
                    <>
                      <img
                        src={fotoPreview}
                        alt="preview"
                        style={{ width: "52px", height: "52px", objectFit: "cover", borderRadius: "7px", border: `1px solid ${border}`, display: "block" }}
                      />
                      <button
                        type="button"
                        onClick={() => { setFotoFile(null); setFotoPreview(null); }}
                        style={{
                          position: "absolute", top: "-5px", right: "-5px",
                          width: "16px", height: "16px", borderRadius: "50%",
                          background: "#dc2626", border: "none", cursor: "pointer",
                          display: "flex", alignItems: "center", justifyContent: "center",
                        }}
                      >
                        <XCircle size={10} color="#fff" />
                      </button>
                    </>
                  ) : (
                    <div style={{
                      width: "52px", height: "52px", borderRadius: "7px", flexShrink: 0,
                      border: `1px dashed ${border}`, display: "flex",
                      alignItems: "center", justifyContent: "center",
                      background: isDark ? "rgba(255,255,255,0.03)" : "#f4f6f8",
                    }}>
                      {isEdit
                        ? <Pencil  size={16} style={{ color: textFaint }} />
                        : <Package size={16} style={{ color: textFaint }} />
                      }
                    </div>
                  )}
                </div>

                <div style={{ flex: 1 }}>
                  <input
                    id="fi-foto" ref={fotoRef} type="file" accept="image/*"
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
                      ...inp, height: "34px", cursor: "pointer",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      gap: "6px", fontSize: "12px", fontWeight: 500, color: textMuted,
                    }}
                  >
                    <ImagePlus size={13} />
                    {fotoPreview ? "Cambiar foto" : "Seleccionar foto"}
                  </button>
                  <p style={{ margin: "4px 0 0", fontSize: "10px", color: textFaint }}>
                    JPG, PNG, WEBP · máx 5 MB
                  </p>
                </div>
              </div>
            </Field>

            {/* Separador */}
            <div style={{ height: "1px", background: border }} />

            {/* Nombre */}
            <Field htmlFor="fi-nombre" label="Nombre" required textFaint={textFaint}>
              <input
                id="fi-nombre" ref={firstRef} type="text"
                value={form.nombre}
                onChange={e => set("nombre", e.target.value)}
                placeholder="Ej. Filtro de aceite WIX 51348"
                style={inp} onFocus={onFocus} onBlur={onBlur}
              />
            </Field>

            {/* Descripción */}
            <Field htmlFor="fi-desc" label="Descripción" textFaint={textFaint}>
              <textarea
                id="fi-desc"
                value={form.descripcion ?? ""}
                onChange={e => set("descripcion", e.target.value)}
                placeholder="Descripción opcional…"
                rows={2}
                style={{ ...inp, height: "auto", padding: "8px 10px", resize: "none", lineHeight: "1.5" }}
                onFocus={onFocus} onBlur={onBlur}
              />
            </Field>

            {/* Marca + Modelo */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              <Field htmlFor="fi-marca" label="Marca" textFaint={textFaint}>
                <input id="fi-marca" type="text" value={form.marca}
                  onChange={e => set("marca", e.target.value)}
                  placeholder="Ej. WIX" style={inp} onFocus={onFocus} onBlur={onBlur} />
              </Field>
              <Field htmlFor="fi-modelo" label="Modelo" textFaint={textFaint}>
                <input id="fi-modelo" type="text" value={form.modelo}
                  onChange={e => set("modelo", e.target.value)}
                  placeholder="Ej. 51348" style={inp} onFocus={onFocus} onBlur={onBlur} />
              </Field>
            </div>

            {/* N.º de serie */}
            <Field htmlFor="fi-serie" label="N.º de serie" textFaint={textFaint}>
              <input id="fi-serie" type="text" value={form.num_serie}
                onChange={e => set("num_serie", e.target.value)}
                placeholder="Ej. SN-00421" style={inp} onFocus={onFocus} onBlur={onBlur} />
            </Field>

            {/* Stock + Categoría */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              <Field htmlFor="fi-stock" label="Stock" required textFaint={textFaint}>
                <input id="fi-stock" type="number" min={0} value={form.stock}
                  onChange={e => set("stock", e.target.value)}
                  style={inp} onFocus={onFocus} onBlur={onBlur} />
              </Field>
              <Field htmlFor="fi-cat" label="Categoría" required textFaint={textFaint}>
                <select id="fi-cat" value={form.id_categoria}
                  onChange={e => set("id_categoria", e.target.value)}
                  style={{ ...inp, cursor: "pointer" }} onFocus={onFocus} onBlur={onBlur}>
                  <option value="">Seleccionar…</option>
                  {categorias.map(c => (
                    <option key={c.id_categoria} value={c.id_categoria}>{c.nombre_categoria}</option>
                  ))}
                </select>
              </Field>
            </div>

            {/* Estado */}
            <Field htmlFor="fi-estado" label="Estado físico" required textFaint={textFaint}>
              <select id="fi-estado" value={form.estado}
                onChange={e => set("estado", e.target.value)}
                style={{ ...inp, cursor: "pointer" }} onFocus={onFocus} onBlur={onBlur}>
                {ESTADO_OPTS.map(o => <option key={o}>{o}</option>)}
              </select>
            </Field>

            {/* Nota: campos vacíos se guardan como N/A automáticamente */}
            <p style={{ margin: 0, fontSize: "10px", color: textFaint, textAlign: "right" }}>
              Los campos vacíos se guardarán como <b>N/A</b>.
            </p>

            {/* Error */}
            {error && (
              <p role="alert" style={{
                margin: 0, padding: "8px 12px", borderRadius: "6px",
                fontSize: "12px", fontWeight: 500, color: "#dc2626",
                background: isDark ? "rgba(220,38,38,0.10)" : "#fef2f2",
                border: `1px solid ${isDark ? "rgba(220,38,38,0.25)" : "#fecaca"}`,
              }}>
                {error}
              </p>
            )}
          </form>
        </div>

        {/* ── Footer ── */}
        <div style={{
          padding: "10px 18px",
          borderTop: `1px solid ${border}`,
          background: surfaceAlt,
          display: "flex", alignItems: "center", justifyContent: "flex-end",
          gap: "8px", flexShrink: 0,
        }}>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            style={{
              padding: "6px 16px", borderRadius: "6px",
              fontSize: "12px", fontWeight: 600,
              background: "transparent", border: `1px solid ${border}`,
              color: textMuted, cursor: "pointer", transition: "all 0.12s",
              opacity: saving ? 0.5 : 1,
            }}
            onMouseEnter={e => { if (!saving) { e.currentTarget.style.borderColor = textMuted; e.currentTarget.style.color = textMain; }}}
            onMouseLeave={e => { e.currentTarget.style.borderColor = border; e.currentTarget.style.color = textMuted; }}
          >
            Cancelar
          </button>
          <button
            type="submit"
            form="form-insumo"
            disabled={saving}
            style={{
              padding: "6px 18px", borderRadius: "6px",
              fontSize: "12px", fontWeight: 700,
              background: saving ? `${ORANGE}99` : ORANGE,
              border: "none", color: "#fff",
              cursor: saving ? "not-allowed" : "pointer",
              transition: "opacity 0.12s",
            }}
            onMouseEnter={e => { if (!saving) e.currentTarget.style.opacity = "0.88"; }}
            onMouseLeave={e => { e.currentTarget.style.opacity = "1"; }}
          >
            {saving ? "Guardando…" : isEdit ? "Guardar cambios" : "Crear insumo"}
          </button>
        </div>
      </div>
    </div>
  );
}
