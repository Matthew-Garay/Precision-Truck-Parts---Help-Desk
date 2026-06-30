import { useState, useRef } from "react";
import {
  Search, Upload, BookOpen, X, Check, Loader2, FileText,
  Trash2, Pencil, Download, MoreVertical, Eye, Tag, Clock,
} from "lucide-react";
import { apiFetch, API_ROUTES } from "../../Config/api";
import API from "../../Config/api";
import { useAutoRefresh } from "../../Config/useAutoRefresh";
import { usePdfCover } from "../../Components/hooks/usePdfCover";
import {
  FONT, RADIUS, NEUTRAL, SLATE, SEMANTIC,
  BTN_PRIMARY, BTN_GHOST, BTN_DANGER, MODAL,
  INPUT_BASE, INPUT_FOCUS, INPUT_BLUR, FORM_FIELD,
} from "../../Config/DesignSystem";

const ORANGE      = "#F47920";
const ORANGE_DARK = "#d97400";
const OL          = "rgba(244,121,32,0.10)";
const OB          = "rgba(244,121,32,0.22)";

// ── Helpers formulario ────────────────────────────────────────────
const field = (label, children, error) => (
  <div style={FORM_FIELD.wrapper}>
    <label style={{ ...FORM_FIELD.label, color: SLATE[600] }}>{label}</label>
    {children}
    {error && <span style={FORM_FIELD.error}>{error}</span>}
  </div>
);
const inputSt = (T, err) => ({
  ...INPUT_BASE, background: T.surfaceAlt, color: T.text,
  ...(err ? { borderColor: SEMANTIC.danger, boxShadow: "0 0 0 3px rgba(220,38,38,0.10)" } : {}),
});
const textareaSt = (T) => ({
  ...INPUT_BASE, height: "auto", minHeight: "72px",
  padding: "10px 12px", resize: "vertical", fontFamily: "inherit",
  background: T.surfaceAlt, color: T.text,
});

// ── Modal subir / editar ──────────────────────────────────────────
function ModalForm({ T, categorias, manual, archivo, onClose, onGuardado }) {
  const esEdicion = !!manual;
  const [form, setForm] = useState({
    nombre:       manual?.nombre       ?? (archivo?.name?.replace(/\.pdf$/i, "") ?? ""),
    descripcion:  manual?.descripcion  ?? "",
    id_categoria: manual?.id_categoria ?? "",
  });
  const [errores, setErrores] = useState({});
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(false);
  const previewUrl = archivo ? URL.createObjectURL(archivo) : null;
  const isDark = T.isDark;

  const set = (k, v) => { setForm(p => ({ ...p, [k]: v })); setErrores(p => ({ ...p, [k]: "" })); };
  const validar = () => {
    const e = {};
    if (!form.nombre.trim())  e.nombre       = "El nombre es obligatorio";
    if (!form.id_categoria)   e.id_categoria = "La categoría es obligatoria";
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const e2 = validar();
    if (Object.keys(e2).length) { setErrores(e2); return; }
    setLoading(true);
    try {
      let r;
      if (esEdicion) {
        r = await apiFetch(`/api/manuales/${manual.id_manual}`, {
          method: "PUT",
          body: { nombre: form.nombre.trim(), descripcion: form.descripcion.trim(), id_categoria: parseInt(form.id_categoria) },
        });
      } else {
        const fd = new FormData();
        fd.append("archivo",      archivo);
        fd.append("nombre",       form.nombre.trim());
        fd.append("descripcion",  form.descripcion.trim());
        fd.append("id_categoria", form.id_categoria);
        r = await apiFetch("/api/manuales", { method: "POST", body: fd });
      }
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "Error al guardar");
      onGuardado();
    } catch (err) {
      setErrores({ global: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={MODAL.overlay} onClick={onClose}>
      <div
        style={{ ...MODAL.container, maxWidth: preview ? "860px" : "480px", transition: "max-width 0.25s" }}
        onClick={e => e.stopPropagation()}
      >
        <div style={MODAL.header}>
          <span>{esEdicion ? "Editar manual" : "Subir manual"}</span>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {!esEdicion && archivo && (
              <button type="button" onClick={() => setPreview(p => !p)}
                style={{ background: preview ? "rgba(244,121,32,0.25)" : "rgba(255,255,255,0.10)", border: "1px solid rgba(255,255,255,0.20)", color: "#fff", cursor: "pointer", borderRadius: RADIUS.sm, padding: "4px 10px", fontSize: "11px", fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
                {preview ? "Ocultar" : "Ver PDF"}
              </button>
            )}
            <button onClick={onClose} style={{ background: "none", border: "none", color: "#fff", cursor: "pointer" }}><X size={18} /></button>
          </div>
        </div>

        <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", flex: preview ? "0 0 340px" : "1" }}>
            <div style={{ ...MODAL.body, display: "flex", flexDirection: "column", gap: 16 }}>
              {!esEdicion && (
                <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderRadius: RADIUS.sm, background: isDark ? "rgba(255,255,255,0.04)" : NEUTRAL.slate50, border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : SLATE[200]}` }}>
                  <div style={{ width: 36, height: 42, borderRadius: RADIUS.sm, flexShrink: 0, background: "rgba(220,38,38,0.08)", border: "1.5px solid rgba(220,38,38,0.18)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                    <FileText size={16} style={{ color: "#dc2626" }} />
                    <span style={{ fontSize: "7px", fontWeight: 700, color: "#dc2626" }}>PDF</span>
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ ...FONT.body, color: T.text, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{archivo.name}</p>
                    <p style={{ ...FONT.small, color: SLATE[400] }}>
                      {archivo.size < 1024 * 1024 ? `${(archivo.size / 1024).toFixed(0)} KB` : `${(archivo.size / 1024 / 1024).toFixed(1)} MB`}
                    </p>
                  </div>
                </div>
              )}
              {field("Nombre *", (
                <input style={inputSt(T, errores.nombre)} value={form.nombre} onChange={e => set("nombre", e.target.value)} onFocus={INPUT_FOCUS} onBlur={INPUT_BLUR} placeholder="Ej. Manual de procedimientos red" autoFocus />
              ), errores.nombre)}
              {field("Descripción", (
                <textarea style={textareaSt(T)} value={form.descripcion} onChange={e => set("descripcion", e.target.value)} placeholder="Breve descripción del contenido..." rows={3} />
              ))}
              {field("Categoría *", (
                <select style={{ ...inputSt(T, errores.id_categoria), cursor: "pointer" }} value={form.id_categoria} onChange={e => set("id_categoria", e.target.value)}>
                  <option value="">Selecciona una categoría...</option>
                  {categorias.map(c => <option key={c.id_categoria} value={c.id_categoria}>{c.nombre_categoria}</option>)}
                </select>
              ), errores.id_categoria)}
              {errores.global && (
                <div style={{ padding: "10px 14px", borderRadius: RADIUS.sm, background: SEMANTIC.dangerBg, border: `1px solid ${SEMANTIC.dangerBdr}`, color: SEMANTIC.danger, fontSize: 13, fontWeight: 500 }}>
                  {errores.global}
                </div>
              )}
            </div>
            <div style={MODAL.footer}>
              <button type="button" style={BTN_GHOST} onClick={onClose} disabled={loading}>Cancelar</button>
              <button type="submit" style={{ ...BTN_PRIMARY, opacity: loading ? 0.7 : 1, cursor: loading ? "not-allowed" : "pointer" }} disabled={loading}>
                {loading ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                {loading ? (esEdicion ? "Guardando..." : "Subiendo...") : (esEdicion ? "Guardar cambios" : "Subir manual")}
              </button>
            </div>
          </form>

          {preview && previewUrl && (
            <div style={{ flex: 1, borderLeft: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : SLATE[200]}`, display: "flex", flexDirection: "column" }}>
              <div style={{ padding: "8px 14px", background: isDark ? "#0d1117" : NEUTRAL.slate50, borderBottom: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : SLATE[200]}`, fontSize: 11, fontWeight: 600, color: T.textMuted }}>
                Vista previa
              </div>
              <iframe src={`${previewUrl}#toolbar=1&navpanes=0`} title="preview-pdf" style={{ flex: 1, border: "none", minHeight: 400, width: "100%", display: "block" }} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Modal eliminar ────────────────────────────────────────────────
function ModalEliminar({ T, manual, onConfirm, onClose, loading }) {
  return (
    <div style={MODAL.overlay} onClick={onClose}>
      <div style={{ ...MODAL.container, maxWidth: 400 }} onClick={e => e.stopPropagation()}>
        <div style={MODAL.header}>
          <span>Eliminar manual</span>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#fff", cursor: "pointer" }}><X size={18} /></button>
        </div>
        <div style={{ ...MODAL.body, display: "flex", flexDirection: "column", gap: 8 }}>
          <p style={{ ...FONT.body, color: T.text }}>
            ¿Eliminar <strong>{manual.nombre}</strong>? Esta acción no se puede deshacer.
          </p>
        </div>
        <div style={MODAL.footer}>
          <button style={BTN_GHOST} onClick={onClose} disabled={loading}>Cancelar</button>
          <button style={{ ...BTN_DANGER, opacity: loading ? 0.7 : 1, cursor: loading ? "not-allowed" : "pointer" }} onClick={onConfirm} disabled={loading}>
            {loading ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
            {loading ? "Eliminando..." : "Eliminar"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Drawer visor PDF ──────────────────────────────────────────────
function DrawerVisor({ url, nombre, T, onClose }) {
  const isDark = T.isDark;
  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 300, background: "rgba(0,0,0,0.50)" }} />
      <div style={{ position: "fixed", top: 0, right: 0, bottom: 0, zIndex: 301, width: "min(960px,96vw)", display: "flex", flexDirection: "column", background: isDark ? "#0f1117" : "#f8fafc", boxShadow: "-4px 0 32px rgba(0,0,0,0.18)", animation: "slideIn .2s cubic-bezier(.16,1,.3,1)" }}>
        <style>{`@keyframes slideIn{from{transform:translateX(100%)}to{transform:translateX(0)}}`}</style>
        <div style={{ height: 54, padding: "0 20px", flexShrink: 0, display: "flex", alignItems: "center", gap: 12, background: "#1e293b", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          <FileText size={15} color="rgba(255,255,255,0.6)" />
          <span style={{ flex: 1, color: "#fff", fontWeight: 600, fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{nombre}</span>
          <a href={url} download={nombre} style={{ height: 30, padding: "0 12px", borderRadius: RADIUS.sm, display: "flex", alignItems: "center", gap: 5, background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.14)", color: "rgba(255,255,255,0.8)", fontSize: 12, fontWeight: 500, textDecoration: "none" }}>
            <Download size={12} /> Descargar
          </a>
          <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: RADIUS.sm, background: "transparent", border: "1px solid rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.5)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <X size={14} />
          </button>
        </div>
        <iframe src={`${url}#toolbar=1&navpanes=0`} title={nombre} style={{ flex: 1, width: "100%", border: "none", display: "block" }} />
      </div>
    </>
  );
}

// ── Zona drag & drop (modal de subida) ───────────────────────────
function ZonaSubida({ T, onFile }) {
  const [drag, setDrag] = useState(false);
  const inputRef = useRef();
  const isDark = T.isDark;

  const handle = (file) => {
    if (!file) return;
    const aviso = (msg) => {
      const el = document.createElement("div");
      el.style.cssText = "position:fixed;top:20px;left:50%;transform:translateX(-50%);z-index:9999;background:#1e293b;color:#fff;padding:12px 20px;border-radius:6px;font-size:13px;font-weight:600;border-left:3px solid #F47920;box-shadow:0 4px 20px rgba(0,0,0,0.3);";
      el.textContent = msg;
      document.body.appendChild(el);
      setTimeout(() => el.remove(), 4000);
    };
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) return aviso("Solo se permiten archivos PDF.");
    if (file.size > 50 * 1024 * 1024) return aviso("El archivo supera el límite de 50 MB.");
    onFile(file);
  };

  return (
    <div
      onClick={() => inputRef.current.click()}
      onDragOver={e => { e.preventDefault(); setDrag(true); }}
      onDragLeave={() => setDrag(false)}
      onDrop={e => { e.preventDefault(); setDrag(false); handle(e.dataTransfer.files[0]); }}
      style={{
        border: `1.5px dashed ${drag ? ORANGE : isDark ? "rgba(255,255,255,0.15)" : SLATE[300]}`,
        borderRadius: RADIUS.lg, padding: "28px 24px",
        display: "flex", flexDirection: "column", alignItems: "center", gap: 10,
        cursor: "pointer", textAlign: "center",
        background: drag ? "rgba(244,121,32,0.04)" : isDark ? "rgba(255,255,255,0.02)" : NEUTRAL.slate50,
        transition: "all 0.18s",
      }}
    >
      <div style={{ width: 40, height: 40, borderRadius: 8, background: drag ? OL : isDark ? "rgba(255,255,255,0.06)" : NEUTRAL.slate100, display: "flex", alignItems: "center", justifyContent: "center", border: `1px solid ${drag ? OB : isDark ? "rgba(255,255,255,0.10)" : SLATE[200]}`, transition: "all 0.18s" }}>
        <Upload size={17} style={{ color: drag ? ORANGE : SLATE[400] }} />
      </div>
      <div>
        <p style={{ fontSize: 13, fontWeight: 600, color: drag ? ORANGE : T.text, margin: 0 }}>
          {drag ? "Suelta el PDF aquí" : "Arrastra un PDF o haz clic para seleccionar"}
        </p>
        <p style={{ fontSize: 11, color: T.textFaint ?? SLATE[400], margin: "4px 0 0" }}>Solo archivos PDF · Máximo 50 MB</p>
      </div>
      <input ref={inputRef} type="file" accept="application/pdf,.pdf" style={{ display: "none" }} onChange={e => handle(e.target.files[0])} />
    </div>
  );
}

// ── Miniatura portada PDF ─────────────────────────────────────────
function PdfThumb({ url, isDark }) {
  const { imgSrc, loading } = usePdfCover(url);
  return (
    <div style={{ width: 52, height: 68, flexShrink: 0, borderRadius: 4, overflow: "hidden", background: isDark ? "#0d1117" : NEUTRAL.slate100, border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : SLATE[200]}`, display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
      {imgSrc
        ? <img src={imgSrc} alt="portada" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        : loading
          ? <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={SLATE[300]} strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
          : <FileText size={18} style={{ color: SLATE[300] }} />
      }
      <span style={{ position: "absolute", bottom: 0, left: 0, right: 0, fontSize: "6px", fontWeight: 800, textAlign: "center", background: "rgba(220,38,38,0.85)", color: "#fff", padding: "1px 0", letterSpacing: "0.04em" }}>PDF</span>
    </div>
  );
}

// ── Kebab menu ────────────────────────────────────────────────────
function KebabMenu({ T, pdfUrl, nombre, onEditar, onEliminar }) {
  const [open, setOpen] = useState(false);
  const isDark = T.isDark;
  const menuBg = isDark ? "#1e293b" : "#fff";
  const menuBorder = isDark ? "rgba(255,255,255,0.10)" : SLATE[200];
  const itemColor = isDark ? "rgba(255,255,255,0.75)" : SLATE[700];

  const itemSt = { width: "100%", display: "flex", alignItems: "center", gap: 8, padding: "8px 14px", background: "none", border: "none", cursor: "pointer", textAlign: "left", fontSize: 12, fontWeight: 500, color: itemColor };

  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={e => { e.stopPropagation(); setOpen(p => !p); }}
        style={{ width: 28, height: 28, borderRadius: RADIUS.sm, border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : SLATE[200]}`, background: open ? (isDark ? "rgba(255,255,255,0.06)" : NEUTRAL.slate100) : "transparent", color: isDark ? "rgba(255,255,255,0.40)" : SLATE[400], cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.12s" }}
        onMouseEnter={e => { e.currentTarget.style.background = isDark ? "rgba(255,255,255,0.06)" : NEUTRAL.slate100; e.currentTarget.style.color = isDark ? "#fff" : SLATE[700]; }}
        onMouseLeave={e => { if (!open) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = isDark ? "rgba(255,255,255,0.40)" : SLATE[400]; } }}
      >
        <MoreVertical size={13} />
      </button>

      {open && (
        <>
          <div style={{ position: "fixed", inset: 0, zIndex: 40 }} onClick={() => setOpen(false)} />
          <div style={{ position: "absolute", top: "calc(100% + 4px)", right: 0, zIndex: 50, background: menuBg, border: `1px solid ${menuBorder}`, borderRadius: RADIUS.lg, boxShadow: "0 8px 24px rgba(0,0,0,0.14)", minWidth: 160, overflow: "hidden", animation: "kbFade .12s ease" }}>
            <style>{`@keyframes kbFade{from{opacity:0;transform:translateY(-4px)}to{opacity:1;transform:translateY(0)}}`}</style>

            <button style={itemSt}
              onMouseEnter={e => e.currentTarget.style.background = isDark ? "rgba(255,255,255,0.05)" : NEUTRAL.slate50}
              onMouseLeave={e => e.currentTarget.style.background = "none"}
              onClick={() => { setOpen(false); /* onVerPdf */ }}
            >
              <Eye size={13} style={{ color: ORANGE, flexShrink: 0 }} /> Ver PDF
            </button>

            <a href={pdfUrl} download={nombre} onClick={() => setOpen(false)}
              style={{ ...itemSt, textDecoration: "none", borderTop: `1px solid ${menuBorder}` }}
              onMouseEnter={e => e.currentTarget.style.background = isDark ? "rgba(255,255,255,0.05)" : NEUTRAL.slate50}
              onMouseLeave={e => e.currentTarget.style.background = "none"}
            >
              <Download size={13} style={{ color: SLATE[400], flexShrink: 0 }} /> Descargar
            </a>

            <button style={{ ...itemSt, borderTop: `1px solid ${menuBorder}` }}
              onMouseEnter={e => e.currentTarget.style.background = isDark ? "rgba(255,255,255,0.05)" : NEUTRAL.slate50}
              onMouseLeave={e => e.currentTarget.style.background = "none"}
              onClick={() => { setOpen(false); onEditar(); }}
            >
              <Pencil size={13} style={{ color: SLATE[400], flexShrink: 0 }} /> Editar
            </button>

            <button style={{ ...itemSt, color: SEMANTIC.danger, borderTop: `1px solid ${menuBorder}` }}
              onMouseEnter={e => e.currentTarget.style.background = SEMANTIC.dangerBg}
              onMouseLeave={e => e.currentTarget.style.background = "none"}
              onClick={() => { setOpen(false); onEliminar(); }}
            >
              <Trash2 size={13} style={{ flexShrink: 0 }} /> Eliminar
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// ── Tarjeta Enterprise flat ───────────────────────────────────────
function CardManual({ m, T, onVer, onEditar, onEliminar }) {
  const isDark = T.isDark;
  const pdfUrl = `${API}${m.url}`;
  const [hov, setHov] = useState(false);
  const fecha = m.fecha_cambio
    ? new Date(m.fecha_cambio).toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" })
    : null;

  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: "flex", alignItems: "center", gap: 14,
        padding: "14px 16px",
        background: hov ? (isDark ? "rgba(255,255,255,0.025)" : NEUTRAL.slate50) : "transparent",
        borderBottom: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : SLATE[200]}`,
        transition: "background 0.12s",
        cursor: "default",
      }}
    >
      {/* Miniatura */}
      <div onClick={() => onVer(pdfUrl, m.nombre)} style={{ cursor: "pointer", flexShrink: 0 }}>
        <PdfThumb url={pdfUrl} isDark={isDark} />
      </div>

      {/* Metadatos */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          onClick={() => onVer(pdfUrl, m.nombre)}
          style={{ fontSize: 14, fontWeight: 600, color: isDark ? "#e2e8f0" : SLATE[900], margin: "0 0 5px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", cursor: "pointer" }}
          onMouseEnter={e => e.currentTarget.style.color = ORANGE}
          onMouseLeave={e => e.currentTarget.style.color = isDark ? "#e2e8f0" : SLATE[900]}
        >
          {m.nombre.replace(/\.pdf$/i, "")}
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
          {m.nombre_categoria && (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 3, fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 99, background: OL, color: ORANGE, border: `1px solid ${OB}` }}>
              <Tag size={7} /> {m.nombre_categoria}
            </span>
          )}
          {fecha && (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 3, fontSize: 10, color: isDark ? "rgba(255,255,255,0.30)" : SLATE[400] }}>
              <Clock size={9} /> {fecha}
            </span>
          )}
          {m.tamaño && (
            <span style={{ fontSize: 10, color: isDark ? "rgba(255,255,255,0.25)" : SLATE[400] }}>
              {m.tamaño}
            </span>
          )}
        </div>
      </div>

      {/* Kebab */}
      <div style={{ flexShrink: 0 }} onClick={e => e.stopPropagation()}>
        <KebabMenu
          T={T}
          pdfUrl={pdfUrl}
          nombre={m.nombre}
          onEditar={() => onEditar(m)}
          onEliminar={() => onEliminar(m)}
          onVer={() => onVer(pdfUrl, m.nombre)}
        />
      </div>
    </div>
  );
}

// ── Chip filtro ghost ─────────────────────────────────────────────
function ChipFiltro({ label, count, active, onClick, isDark }) {
  return (
    <button onClick={onClick} style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      padding: "5px 12px", borderRadius: 99, cursor: "pointer",
      border: `1px solid ${active ? OB : (isDark ? "rgba(255,255,255,0.10)" : SLATE[200])}`,
      background: active ? OL : "transparent",
      color: active ? ORANGE : (isDark ? "rgba(255,255,255,0.45)" : SLATE[500]),
      fontSize: 12, fontWeight: active ? 700 : 500,
      transition: "all 0.14s",
    }}>
      {label}
      <span style={{ fontSize: 10, fontWeight: 700, padding: "1px 5px", borderRadius: 99, background: active ? ORANGE : (isDark ? "rgba(255,255,255,0.08)" : NEUTRAL.slate100), color: active ? "#fff" : (isDark ? "rgba(255,255,255,0.35)" : SLATE[400]) }}>{count}</span>
    </button>
  );
}

// ════════════════════════════════════════════════════════════════
//  COMPONENTE PRINCIPAL
// ════════════════════════════════════════════════════════════════
export default function ManualesAdmin({ T }) {
  const [manuales,    setManuales]    = useState([]);
  const [categorias,  setCategorias]  = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [busqueda,    setBusqueda]    = useState("");
  const [catFiltro,   setCatFiltro]   = useState("");
  const [visor,       setVisor]       = useState(null);
  const [archivoSel,  setArchivoSel]  = useState(null);
  const [modalEditar, setModalEditar] = useState(null);
  const [modalElim,   setModalElim]   = useState(null);
  const [loadingElim, setLoadingElim] = useState(false);
  const [toast,       setToast]       = useState(null);
  const [showUpload,  setShowUpload]  = useState(false);
  const [dragging,    setDragging]    = useState(false);

  const isDark = T.isDark;
  const surf   = isDark ? "#141720" : NEUTRAL.white;
  const border = isDark ? "rgba(255,255,255,0.07)" : SLATE[200];

  const showToast = (tipo, msg) => { setToast({ tipo, msg }); setTimeout(() => setToast(null), 4000); };

  const cargar = async () => {
    setLoading(true);
    try {
      const [rM, rC] = await Promise.all([apiFetch(API_ROUTES.MANUALES), apiFetch(`/api/categorias?tipo=manual`)]);
      const dm = await rM.json(); setManuales(Array.isArray(dm) ? dm : []);
      const dc = await rC.json(); setCategorias(Array.isArray(dc) ? dc : []);
    } catch { setManuales([]); } finally { setLoading(false); }
  };

  useAutoRefresh(cargar, 30000);

  const filtrados = manuales.filter(m => {
    const q = busqueda.toLowerCase();
    return (!busqueda || m.nombre.toLowerCase().includes(q) || m.nombre_categoria?.toLowerCase().includes(q) || m.descripcion?.toLowerCase().includes(q))
      && (!catFiltro || String(m.id_categoria) === catFiltro);
  });

  const conteosCat     = categorias.map(c => ({ ...c, count: manuales.filter(m => String(m.id_categoria) === String(c.id_categoria)).length }));
  const catSeleccionada = categorias.find(c => String(c.id_categoria) === catFiltro);

  const handleEliminar = async () => {
    setLoadingElim(true);
    try {
      const r = await apiFetch(`/api/manuales/${modalElim.id_manual}`, { method: "DELETE" });
      if (!r.ok) { const d = await r.json(); throw new Error(d.error); }
      setModalElim(null);
      showToast("ok", "Manual eliminado correctamente.");
      await cargar();
    } catch (err) { showToast("error", err.message); }
    finally { setLoadingElim(false); }
  };

  const handleGuardado = async () => {
    setArchivoSel(null); setModalEditar(null); setShowUpload(false);
    showToast("ok", modalEditar ? "Manual actualizado." : "Manual subido correctamente.");
    await cargar();
  };

  const handleFile = (file) => { setShowUpload(false); setArchivoSel(file); };

  return (
    <div
      style={{ overflowY: "auto", background: T.bg, minHeight: "100%", fontFamily: "'Inter','Segoe UI',sans-serif" }}
      onDragOver={e => { e.preventDefault(); setDragging(true); }}
      onDragEnter={e => { e.preventDefault(); setDragging(true); }}
      onDragLeave={e => { if (!e.currentTarget.contains(e.relatedTarget)) setDragging(false); }}
      onDrop={e => { e.preventDefault(); setDragging(false); }}
    >
      {dragging && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 40,
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16,
          background: "rgba(244,121,32,0.07)", border: "3px dashed #F47920",
          pointerEvents: "none",
        }}>
          <svg width="52" height="52" viewBox="0 0 52 52" fill="none">
            <path d="M26 8v24M14 20l12-12 12 12" stroke="#F47920" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M6 40v3a3 3 0 003 3h34a3 3 0 003-3v-3" stroke="#F47920" strokeWidth="3" strokeLinecap="round"/>
          </svg>
          <p style={{ fontSize: 18, fontWeight: 900, color: "#F47920", margin: 0 }}>Suelta las imágenes</p>
          <p style={{ fontSize: 13, color: isDark ? "rgba(255,255,255,0.5)" : "#64748b", margin: 0 }}>Se agregarán a Evidencias fotográficas</p>
        </div>
      )}

      {/* ── HEADER enterprise oscuro ─────────────────────────── */}
      <div style={{ background: isDark ? "#0f1117" : "#1e293b", borderBottom: "1px solid rgba(255,255,255,0.08)", padding: "0 28px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <BookOpen size={18} color="rgba(255,255,255,0.55)" />
            <div>
              <p style={{ fontSize: 14, fontWeight: 700, color: "#fff", margin: 0, letterSpacing: "-0.01em" }}>Gestión de Manuales</p>
              <p style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", margin: 0, fontWeight: 400 }}>
                {manuales.length} documento{manuales.length !== 1 ? "s" : ""} · {categorias.length} categoría{categorias.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>

          {/* Botón flotante subir */}
          <button
            onClick={() => setShowUpload(p => !p)}
            style={{ height: 36, padding: "0 16px", borderRadius: RADIUS.sm, display: "flex", alignItems: "center", gap: 6, background: ORANGE, border: "none", color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer", transition: "filter 0.15s", flexShrink: 0 }}
            onMouseEnter={e => e.currentTarget.style.filter = "brightness(1.08)"}
            onMouseLeave={e => e.currentTarget.style.filter = "brightness(1)"}
          >
            <Upload size={13} /> Subir documento
          </button>
        </div>
      </div>

      {/* ── Panel drag & drop desplegable ────────────────────── */}
      {showUpload && (
        <div style={{ background: isDark ? "#141720" : NEUTRAL.white, borderBottom: `1px solid ${border}`, padding: "20px 28px" }}>
          <div style={{ maxWidth: 1200, margin: "0 auto" }}>
            <ZonaSubida T={T} onFile={handleFile} />
          </div>
        </div>
      )}

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "24px 28px", display: "flex", flexDirection: "column", gap: 20 }}>

        {/* ── Toast ────────────────────────────────────────────── */}
        {toast && (
          <div style={{ padding: "10px 16px", borderRadius: RADIUS.sm, background: toast.tipo === "ok" ? SEMANTIC.successBg : SEMANTIC.dangerBg, border: `1px solid ${toast.tipo === "ok" ? SEMANTIC.successBdr : SEMANTIC.dangerBdr}`, color: toast.tipo === "ok" ? SEMANTIC.success : SEMANTIC.danger, display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 500 }}>
            {toast.tipo === "ok" ? <Check size={15} /> : <X size={15} />}
            {toast.msg}
            <button onClick={() => setToast(null)} style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", color: "inherit" }}><X size={13} /></button>
          </div>
        )}

        {/* ── Barra de control ─────────────────────────────────── */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          {/* Búsqueda borderless */}
          <div style={{ flex: 1, minWidth: 200, position: "relative" }}>
            <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: SLATE[400], pointerEvents: "none" }} />
            <input
              style={{ width: "100%", background: isDark ? "rgba(255,255,255,0.04)" : NEUTRAL.slate50, border: `1px solid ${busqueda ? OB : (isDark ? "rgba(255,255,255,0.08)" : SLATE[200])}`, borderRadius: RADIUS.sm, color: T.text, fontSize: 13, padding: "0 12px 0 34px", height: 36, outline: "none", transition: "border-color 0.15s" }}
              placeholder="Buscar por nombre, categoría..."
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              onFocus={e => { e.target.style.borderColor = ORANGE; e.target.style.background = isDark ? "rgba(255,255,255,0.06)" : NEUTRAL.white; }}
              onBlur={e => { e.target.style.borderColor = busqueda ? OB : (isDark ? "rgba(255,255,255,0.08)" : SLATE[200]); e.target.style.background = isDark ? "rgba(255,255,255,0.04)" : NEUTRAL.slate50; }}
            />
            {busqueda && <button onClick={() => setBusqueda("")} style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: SLATE[400], display: "flex" }}><X size={12} /></button>}
          </div>

          {/* Chips ghost por categoría */}
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
            {catFiltro && (
              <button onClick={() => setCatFiltro("")} style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "4px 10px", borderRadius: 99, fontSize: 11, fontWeight: 600, background: "transparent", border: "none", color: isDark ? "rgba(255,255,255,0.35)" : SLATE[400], cursor: "pointer" }}>
                <X size={9} /> Limpiar
              </button>
            )}
            {conteosCat.filter(c => c.count > 0).map(c => (
              <ChipFiltro
                key={c.id_categoria}
                label={c.nombre_categoria}
                count={c.count}
                active={String(catFiltro) === String(c.id_categoria)}
                onClick={() => setCatFiltro(p => String(p) === String(c.id_categoria) ? "" : String(c.id_categoria))}
                isDark={isDark}
              />
            ))}
          </div>

          {/* Contador */}
          <span style={{ flexShrink: 0, fontSize: 12, fontWeight: 600, color: isDark ? "rgba(255,255,255,0.30)" : SLATE[400], whiteSpace: "nowrap" }}>
            {filtrados.length} / {manuales.length}
          </span>
        </div>

        {/* ── Lista de manuales ─────────────────────────────────── */}
        <div style={{ background: surf, border: `1px solid ${border}`, borderRadius: RADIUS.lg, overflow: "hidden" }}>

          {/* Cabecera de columnas */}
          <div style={{ display: "flex", alignItems: "center", padding: "10px 16px", borderBottom: `1px solid ${border}`, background: isDark ? "rgba(255,255,255,0.02)" : NEUTRAL.slate50 }}>
            <div style={{ width: 52 + 14, flexShrink: 0 }} />
            <span style={{ flex: 1, fontSize: 10, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", color: isDark ? "rgba(255,255,255,0.30)" : SLATE[400] }}>Documento</span>
            <span style={{ width: 28, flexShrink: 0 }} />
          </div>

          {loading ? (
            <div style={{ display: "flex", justifyContent: "center", padding: "56px 0" }}>
              <svg className="animate-spin" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={ORANGE} strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
            </div>
          ) : filtrados.length === 0 ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "56px 20px", gap: 10 }}>
              <FileText size={28} style={{ color: isDark ? "rgba(255,255,255,0.12)" : SLATE[200] }} />
              <span style={{ fontSize: 13, fontWeight: 600, color: isDark ? "rgba(255,255,255,0.25)" : SLATE[400] }}>
                {busqueda || catFiltro ? "Sin resultados" : "No hay manuales"}
              </span>
            </div>
          ) : (
            filtrados.map(m => (
              <CardManual
                key={m.id_manual}
                m={m}
                T={T}
                onVer={(url, nombre) => setVisor({ url, nombre })}
                onEditar={setModalEditar}
                onEliminar={setModalElim}
              />
            ))
          )}
        </div>
      </div>

      {/* ── Visor PDF ────────────────────────────────────────────── */}
      {visor && <DrawerVisor url={visor.url} nombre={visor.nombre} T={T} onClose={() => setVisor(null)} />}

      {/* ── Modales CRUD ─────────────────────────────────────────── */}
      {archivoSel  && <ModalForm T={T} categorias={categorias} archivo={archivoSel}  onClose={() => setArchivoSel(null)}  onGuardado={handleGuardado} />}
      {modalEditar && <ModalForm T={T} categorias={categorias} manual={modalEditar}  onClose={() => setModalEditar(null)} onGuardado={handleGuardado} />}
      {modalElim   && <ModalEliminar T={T} manual={modalElim} loading={loadingElim} onConfirm={handleEliminar} onClose={() => setModalElim(null)} />}
    </div>
  );
}
