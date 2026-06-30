import { useState, useRef } from "react";
import { Upload, FileText, X, Check, Loader2, BookOpen, ChevronRight } from "lucide-react";
import { apiFetch } from "../../Config/api";

// ── Zona Drag & Drop ──────────────────────────────────────────────
function ZonaDrop({ archivo, onFile, onRemove }) {
  const [drag, setDrag] = useState(false);
  const inputRef = useRef();

  const validar = (file) => {
    if (!file) return;
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      return mostrarAviso("Solo se permiten archivos PDF.");
    }
    if (file.size > 50 * 1024 * 1024) {
      return mostrarAviso("El archivo supera el límite de 50 MB.");
    }
    onFile(file);
  };

  const mostrarAviso = (msg) => {
    const el = document.createElement("div");
    el.className = "sm-toast-aviso";
    el.textContent = msg;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 4000);
  };

  if (archivo) {
    const kb =
      archivo.size < 1024 * 1024
        ? `${(archivo.size / 1024).toFixed(0)} KB`
        : `${(archivo.size / 1024 / 1024).toFixed(1)} MB`;

    return (
      <div className="sm-file-preview">
        <div className="sm-file-preview__thumb" aria-hidden="true">
          <FileText size={18} />
          <span className="sm-file-preview__thumb-label">PDF</span>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p className="sm-file-preview__name">{archivo.name}</p>
          <p className="sm-file-preview__meta">✓ Listo para subir · {kb}</p>
        </div>
        <button
          type="button"
          onClick={onRemove}
          aria-label="Quitar archivo"
          className="sm-file-preview__remove"
        >
          <X size={12} />
        </button>
      </div>
    );
  }

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label="Área para arrastrar o seleccionar un archivo PDF"
      className={`sm-dropzone${drag ? " is-dragging" : ""}`}
      onClick={() => inputRef.current?.click()}
      onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
      onDragEnter={(e) => { e.preventDefault(); setDrag(true); }}
      onDragLeave={() => setDrag(false)}
      onDrop={(e) => { e.preventDefault(); setDrag(false); validar(e.dataTransfer.files[0]); }}
    >
      <div className="sm-dropzone__icon" aria-hidden="true">
        <Upload size={22} />
      </div>
      <div>
        <p className="sm-dropzone__label">
          {drag ? "Suelta el PDF aquí" : "Arrastra tu archivo aquí o haz clic para explorar"}
        </p>
        <p className="sm-dropzone__hint">Solo archivos PDF · Máximo 50 MB</p>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf,.pdf"
        aria-hidden="true"
        tabIndex={-1}
        style={{ display: "none" }}
        onChange={(e) => { validar(e.target.files[0]); e.target.value = ""; }}
      />
    </div>
  );
}

// ── Label de campo ────────────────────────────────────────────────
function FieldLabel({ htmlFor, children, required }) {
  return (
    <label htmlFor={htmlFor} className="form-field-label">
      {children}
      {required && <span aria-hidden="true" className="sm-required-asterisk"> *</span>}
    </label>
  );
}

// ── Error inline ──────────────────────────────────────────────────
function FieldError({ id, msg }) {
  if (!msg) return null;
  return <p id={id} role="alert" className="form-field-error">{msg}</p>;
}

// ════════════════════════════════════════════════════════════════
//  COMPONENTE PRINCIPAL — SubirManual
// ════════════════════════════════════════════════════════════════
export default function SubirManual({ categorias = [], onGuardado, onCancelar }) {
  const [form, setForm]     = useState({ nombre: "", descripcion: "", id_categoria: "" });
  const [archivo, setArchivo] = useState(null);
  const [errores, setErrores] = useState({});
  const [loading, setLoading] = useState(false);
  const [exito, setExito]     = useState(false);

  const set = (k, v) => {
    setForm((p) => ({ ...p, [k]: v }));
    setErrores((p) => ({ ...p, [k]: "" }));
  };

  const validar = () => {
    const e = {};
    if (!form.nombre.trim()) e.nombre       = "El nombre del manual es obligatorio.";
    if (!form.id_categoria)  e.id_categoria = "Debes seleccionar una categoría.";
    if (!archivo)            e.archivo      = "Debes adjuntar un archivo PDF.";
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validar();
    if (Object.keys(errs).length) { setErrores(errs); return; }

    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("archivo",      archivo);
      fd.append("nombre",       form.nombre.trim());
      fd.append("descripcion",  form.descripcion.trim());
      fd.append("id_categoria", form.id_categoria);

      const r    = await apiFetch("/api/manuales", { method: "POST", body: fd });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "Error al subir el manual.");

      setExito(true);
      setTimeout(() => onGuardado?.(data), 1600);
    } catch (err) {
      setErrores((p) => ({ ...p, global: err.message }));
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setForm({ nombre: "", descripcion: "", id_categoria: "" });
    setArchivo(null);
    setErrores({});
    setExito(false);
  };

  // ── Estado de éxito ──────────────────────────────────────────
  if (exito) {
    return (
      <div className="sm-success">
        <div className="card sm-success__card">
          <div className="sm-success__icon" aria-hidden="true">
            <Check size={28} />
          </div>
          <div>
            <p className="sm-success__title">Manual subido correctamente</p>
            <p className="sm-success__sub">El documento ya está disponible para los usuarios.</p>
          </div>
        </div>
      </div>
    );
  }

  // ── Render principal ─────────────────────────────────────────
  return (
    <section aria-label="Formulario para subir un nuevo manual" className="sm-section">

      {/* Breadcrumb */}
      <nav aria-label="Miga de pan" className="sm-breadcrumb">
        <button type="button" onClick={onCancelar} className="sm-breadcrumb__link">
          Gestión de Manuales
        </button>
        <span className="sm-breadcrumb__sep" aria-hidden="true">
          <ChevronRight size={12} />
        </span>
        <span className="sm-breadcrumb__current" aria-current="page">Nuevo Manual</span>
      </nav>

      {/* Card principal */}
      <article className="card">

        {/* Encabezado — limpio, sin fondo oscuro */}
        <header className="sm-card-header">
          <div className="sm-card-header__icon" aria-hidden="true">
            <BookOpen size={16} />
          </div>
          <div>
            <h1 className="sm-card-header__title">Nuevo Manual</h1>
            <p className="sm-card-header__sub">Completa los campos y adjunta el archivo PDF.</p>
          </div>
        </header>

        {/* Cuerpo del formulario */}
        <form
          id="form-subir-manual"
          onSubmit={handleSubmit}
          noValidate
          className="sm-form"
        >
          {/* Nombre */}
          <div className="form-field">
            <FieldLabel htmlFor="sm-nombre" required>Nombre del Manual</FieldLabel>
            <input
              id="sm-nombre"
              type="text"
              value={form.nombre}
              onChange={(e) => set("nombre", e.target.value)}
              placeholder="Ej. Manual de procedimientos de red interna"
              aria-required="true"
              aria-describedby={errores.nombre ? "sm-nombre-err" : undefined}
              className={`input-base${errores.nombre ? " is-error" : ""}`}
            />
            <FieldError id="sm-nombre-err" msg={errores.nombre} />
          </div>

          {/* Categoría */}
          <div className="form-field">
            <FieldLabel htmlFor="sm-categoria" required>Categoría</FieldLabel>
            <select
              id="sm-categoria"
              value={form.id_categoria}
              onChange={(e) => set("id_categoria", e.target.value)}
              aria-required="true"
              aria-describedby={errores.id_categoria ? "sm-cat-err" : undefined}
              className={`input-base${errores.id_categoria ? " is-error" : ""}`}
            >
              <option value="">Selecciona una categoría...</option>
              {categorias.map((c) => (
                <option key={c.id_categoria} value={c.id_categoria}>
                  {c.nombre_categoria}
                </option>
              ))}
            </select>
            <FieldError id="sm-cat-err" msg={errores.id_categoria} />
          </div>

          {/* Descripción */}
          <div className="form-field">
            <FieldLabel htmlFor="sm-desc">
              Descripción{" "}
              <span className="sm-optional-tag">(opcional)</span>
            </FieldLabel>
            <textarea
              id="sm-desc"
              value={form.descripcion}
              onChange={(e) => set("descripcion", e.target.value)}
              placeholder="Breve descripción del contenido del manual..."
              rows={3}
              className="input-base"
              style={{ height: "auto", padding: "10px 12px", resize: "vertical", fontFamily: "inherit", lineHeight: 1.55 }}
            />
          </div>

          {/* Archivo PDF */}
          <div className="form-field">
            <FieldLabel required>Archivo PDF</FieldLabel>
            <ZonaDrop
              archivo={archivo}
              onFile={(f) => { setArchivo(f); setErrores((p) => ({ ...p, archivo: "" })); }}
              onRemove={() => setArchivo(null)}
            />
            <FieldError id="sm-archivo-err" msg={errores.archivo} />
          </div>

          {/* Error global */}
          {errores.global && (
            <div role="alert" className="sm-alert-error">
              <X size={14} aria-hidden="true" style={{ flexShrink: 0 }} />
              {errores.global}
            </div>
          )}

          {/* Nota campos obligatorios */}
          <p className="sm-required-note">
            <span aria-hidden="true">*</span> Campos obligatorios
          </p>
        </form>

        {/* Footer de acciones */}
        <footer className="sm-footer">
          <button
            type="button"
            onClick={onCancelar ?? handleReset}
            disabled={loading}
            className="btn-ghost"
          >
            Cancelar
          </button>

          <button
            type="submit"
            form="form-subir-manual"
            disabled={loading}
            aria-busy={loading}
            className="btn-orange"
          >
            {loading ? (
              <>
                <Loader2 size={14} className="animate-spin" aria-hidden="true" />
                Subiendo...
              </>
            ) : (
              <>
                <Upload size={14} aria-hidden="true" />
                Subir Manual
              </>
            )}
          </button>
        </footer>
      </article>
    </section>
  );
}
