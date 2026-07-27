import { useState, useRef, useCallback, memo } from "react";
import PdfViewer from "../../Components/PdfViewer";
import Modal from "../../Components/Modal";
import {
  Upload, X, FileText,
  Trash2, Pencil, Download, Eye, Tag, Clock, AlertTriangle,
  LayoutGrid, List, ChevronUp, ChevronDown,
} from "lucide-react";
import { apiFetch, API_ROUTES } from "../../Config/api";
import API from "../../Config/api";
import { useAutoRefresh } from "../../Config/useAutoRefresh";
import { usePdfCover } from "../../Components/hooks/usePdfCover";
import FiltrosToolbar from "../../Components/FiltrosToolbar";
import { RADIUS, NEUTRAL, SLATE, SEMANTIC } from "../../Config/DesignSystem";

const ORANGE = "#F47920";
const OL     = "rgba(244,121,32,0.10)";
const OB     = "rgba(244,121,32,0.22)";

// ── Modal subir / editar ──────────────────────────────────────────
function ModalForm({ T, categorias, manual, archivo, onClose, onGuardado }) {
  const esEdicion = !!manual;
  const isDark    = T.isDark;
  const border    = isDark ? "rgba(255,255,255,0.07)" : "#e8ecf0";
  const textMain  = T.text     ?? (isDark ? "#e2e8f0" : "#1a202c");
  const textFaint = T.textFaint ?? (isDark ? "rgba(255,255,255,0.30)" : "#a0aec0");
  const inputBg   = isDark ? "rgba(255,255,255,0.04)" : "#f8fafc";

  const [form, setForm] = useState({
    nombre:       manual?.nombre       ?? (archivo?.name?.replace(/\.pdf$/i, "") ?? ""),
    descripcion:  manual?.descripcion  ?? "",
    id_categoria: manual?.id_categoria ?? "",
  });
  const [errores, setErrores] = useState({});
  const [loading, setLoading] = useState(false);

  const set = (k, v) => { setForm(p => ({ ...p, [k]: v })); setErrores(p => ({ ...p, [k]: "" })); };

  const inp = {
    background: inputBg, border: `1px solid ${border}`, borderRadius: "6px",
    padding: "0 10px", height: "34px", fontSize: "13px", color: textMain,
    outline: "none", width: "100%", boxSizing: "border-box",
    transition: "border-color 0.12s, box-shadow 0.12s",
  };
  const onFocus = e => { e.target.style.borderColor = "#2563eb"; e.target.style.boxShadow = "0 0 0 3px rgba(37,99,235,0.10)"; e.target.style.background = isDark ? "rgba(255,255,255,0.07)" : "#fff"; };
  const onBlur  = e => { e.target.style.borderColor = border; e.target.style.boxShadow = "none"; e.target.style.background = inputBg; };

  const handleSubmit = async () => {
    const e2 = {};
    if (!form.nombre.trim()) e2.nombre       = "El nombre es obligatorio";
    if (!form.id_categoria)  e2.id_categoria = "La categoría es obligatoria";
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
        fd.append("archivo", archivo);
        fd.append("nombre", form.nombre.trim());
        fd.append("descripcion", form.descripcion.trim());
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

  const LabelField = ({ label, required, children, error }) => (
    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
      <label style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: textFaint }}>
        {label}{required && <span style={{ color: ORANGE, marginLeft: "2px" }}>*</span>}
      </label>
      {children}
      {error && <span style={{ fontSize: "11px", color: "#dc2626" }}>{error}</span>}
    </div>
  );

  return (
    <Modal
      T={T}
      title={esEdicion ? (manual?.nombre ?? "Editar manual") : "Subir manual"}
      subtitle={esEdicion ? "Editar manual" : "Nuevo manual"}
      onClose={onClose}
      onConfirm={handleSubmit}
      confirmLabel={esEdicion ? "Guardar cambios" : "Subir manual"}
      loading={loading}
      maxWidth="480px"
      closeOnOverlay={!loading}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {!esEdicion && (
          <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", borderRadius: "6px", background: isDark ? "rgba(255,255,255,0.04)" : "#f8fafc", border: `1px solid ${border}` }}>
            <div style={{ width: 36, height: 42, borderRadius: "4px", flexShrink: 0, background: "rgba(220,38,38,0.08)", border: "1.5px solid rgba(220,38,38,0.18)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
              <FileText size={16} style={{ color: "#dc2626" }} />
              <span style={{ fontSize: "7px", fontWeight: 700, color: "#dc2626" }}>PDF</span>
            </div>
            <div style={{ minWidth: 0 }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: textMain, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{archivo.name}</p>
              <p style={{ fontSize: 11, color: T.textMuted ?? "#64748b", margin: 0 }}>
                {archivo.size < 1024 * 1024 ? `${(archivo.size / 1024).toFixed(0)} KB` : `${(archivo.size / 1024 / 1024).toFixed(1)} MB`}
              </p>
            </div>
          </div>
        )}

        <LabelField label="Nombre" required error={errores.nombre}>
          <input
            style={{ ...inp, ...(errores.nombre ? { borderColor: "#dc2626" } : {}) }}
            value={form.nombre}
            onChange={e => set("nombre", e.target.value)}
            onFocus={onFocus} onBlur={onBlur}
            placeholder="Ej. Manual de procedimientos red"
            autoFocus
          />
        </LabelField>

        <LabelField label="Descripción">
          <textarea
            style={{ ...inp, height: "auto", padding: "8px 10px", resize: "none", lineHeight: "1.5" }}
            value={form.descripcion}
            onChange={e => set("descripcion", e.target.value)}
            onFocus={onFocus} onBlur={onBlur}
            placeholder="Breve descripción del contenido..."
            rows={3}
          />
        </LabelField>

        <LabelField label="Categoría" required error={errores.id_categoria}>
          <select
            style={{ ...inp, cursor: "pointer", ...(errores.id_categoria ? { borderColor: "#dc2626" } : {}) }}
            value={form.id_categoria}
            onChange={e => set("id_categoria", e.target.value)}
            onFocus={onFocus} onBlur={onBlur}
          >
            <option value="">Selecciona una categoría...</option>
            {categorias.map(c => <option key={c.id_categoria} value={c.id_categoria}>{c.nombre_categoria}</option>)}
          </select>
        </LabelField>

        {errores.global && (
          <p style={{ margin: 0, padding: "8px 12px", borderRadius: "6px", fontSize: "12px", fontWeight: 500, color: "#dc2626", background: isDark ? "rgba(220,38,38,0.10)" : "#fef2f2", border: `1px solid ${isDark ? "rgba(220,38,38,0.25)" : "#fecaca"}` }}>
            {errores.global}
          </p>
        )}
      </div>
    </Modal>
  );
}

// ── Modal eliminar ────────────────────────────────────────────────
function ModalEliminar({ T, manual, onConfirm, onClose, loading }) {
  const isDark   = T.isDark;
  const warnBg   = isDark ? "rgba(217,119,6,0.12)"  : "#fffbeb";
  const warnBdr  = isDark ? "rgba(217,119,6,0.30)"  : "#fde68a";
  const warnText = isDark ? "rgba(255,255,255,0.75)" : "#334155";
  const itemBg   = isDark ? (T.surfaceAlt ?? "#1C2230") : "#f8fafc";
  const itemBdr  = isDark ? (T.border ?? "rgba(255,255,255,0.08)") : "#e2e8f0";
  const textMain = T.text ?? "#0f172a";
  const textSub  = T.textFaint ?? "#94a3b8";

  return (
    <Modal
      T={T}
      title="Eliminar manual"
      subtitle="Confirmar eliminación"
      icon={<Trash2 size={13} />}
      onClose={onClose}
      onConfirm={onConfirm}
      confirmLabel={loading ? "Eliminando…" : "Eliminar"}
      loading={loading}
      variant="danger"
      maxWidth="400px"
      closeOnOverlay={false}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <div role="alert" style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "12px 14px", borderRadius: "6px", background: warnBg, border: `1px solid ${warnBdr}` }}>
          <AlertTriangle size={16} style={{ color: "#d97706", flexShrink: 0, marginTop: 1 }} />
          <p style={{ margin: 0, fontSize: 13, lineHeight: 1.5, color: warnText }}>
            Esta acción es <strong style={{ color: isDark ? "#fbbf24" : "#0f172a" }}>permanente</strong> y no se puede deshacer.
          </p>
        </div>
        <div style={{ padding: "10px 14px", borderRadius: "6px", background: itemBg, border: `1px solid ${itemBdr}`, display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: "6px", flexShrink: 0, background: isDark ? "rgba(220,38,38,0.15)" : "#fef2f2", border: isDark ? "1px solid rgba(220,38,38,0.3)" : "1px solid #fecaca", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Trash2 size={13} style={{ color: "#dc2626" }} />
          </div>
          <div>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: textMain }}>{manual.nombre}</p>
            {manual.nombre_categoria && (
              <p style={{ margin: "2px 0 0", fontSize: 11, color: textSub }}>{manual.nombre_categoria}</p>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}

// ── Drawer visor PDF ──────────────────────────────────────────────
function DrawerVisor({ url, nombre, T, onClose }) {
  const isDark = T.isDark;
  const mobile = window.innerWidth < 640;
  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 300, background: "rgba(0,0,0,0.50)" }} />
      <div style={{ position: "fixed", top: 0, right: 0, bottom: 0, zIndex: 301, width: mobile ? "100vw" : "min(1200px,98vw)", display: "flex", flexDirection: "column", background: isDark ? "#0f1117" : "#f8fafc", boxShadow: "-4px 0 32px rgba(0,0,0,0.18)", animation: "slideIn .2s cubic-bezier(.16,1,.3,1)" }}>
        <style>{`@keyframes slideIn{from{transform:translateX(100%)}to{transform:translateX(0)}}`}</style>
        <div style={{ height: 54, padding: "0 12px", flexShrink: 0, display: "flex", alignItems: "center", gap: 8, background: "#1e293b", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          <FileText size={15} color="rgba(255,255,255,0.6)" style={{ flexShrink: 0 }} />
          <span style={{ flex: 1, minWidth: 0, color: "#fff", fontWeight: 600, fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{nombre}</span>
          <a href={url} download={nombre} style={{ flexShrink: 0, height: 30, padding: mobile ? "0 8px" : "0 12px", borderRadius: RADIUS.sm, display: "flex", alignItems: "center", gap: 5, background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.14)", color: "rgba(255,255,255,0.8)", fontSize: 12, fontWeight: 500, textDecoration: "none" }}>
            <Download size={12} />{!mobile && " Descargar"}
          </a>
          <button onClick={onClose} style={{ flexShrink: 0, width: 30, height: 30, borderRadius: RADIUS.sm, background: "transparent", border: "1px solid rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.5)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <X size={14} />
          </button>
        </div>
        <PdfViewer url={url} isDark={isDark} />
      </div>
    </>
  );
}

// ── Input oculto para subida directa ─────────────────────────────
function InputSubida({ onFile, inputRef }) {
  const handle = (file) => {
    if (!file) return;
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) return;
    if (file.size > 50 * 1024 * 1024) return;
    onFile(file);
  };
  return (
    <input
      ref={inputRef}
      type="file"
      accept="application/pdf,.pdf"
      style={{ display: "none" }}
      onChange={e => { handle(e.target.files[0]); e.target.value = ""; }}
    />
  );
}

// ── Miniatura portada PDF ─────────────────────────────────────────
function PdfThumb({ url, isDark }) {
  const ref = useRef(null);
  const { imgSrc, loading } = usePdfCover(url, ref);
  return (
    <div ref={ref} style={{ height: 130, background: isDark ? "#0f1117" : "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, position: "relative", borderBottom: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : SLATE[100]}`, overflow: "hidden" }}>
      {imgSrc ? (
        <img src={imgSrc} alt="portada" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
      ) : loading ? (
        <div style={{ position: "absolute", inset: 0, background: isDark ? "linear-gradient(90deg,#1e2535 25%,#252d42 50%,#1e2535 75%)" : "linear-gradient(90deg,#e2e8f0 25%,#f1f5f9 50%,#e2e8f0 75%)", backgroundSize: "200% 100%", animation: "shimmer 1.2s infinite linear" }} />
      ) : (
        <div style={{ width: 72, height: 94, borderRadius: 4, background: isDark ? "#1e2535" : "#fff", border: `1px solid ${isDark ? "rgba(255,255,255,0.10)" : SLATE[200]}`, boxShadow: "0 4px 16px rgba(0,0,0,0.15)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6 }}>
          <FileText size={18} style={{ color: SLATE[400] }} />
          <span style={{ fontSize: "7px", fontWeight: 700, color: "#dc2626" }}>PDF</span>
        </div>
      )}
      <span style={{ position: "absolute", top: 8, right: 8, fontSize: 9, fontWeight: 800, letterSpacing: "0.05em", padding: "2px 6px", borderRadius: 4, background: isDark ? "rgba(244,121,32,0.18)" : "#fff7ed", color: ORANGE, border: "1px solid rgba(244,121,32,0.3)" }}>PDF</span>
      <style>{`@keyframes shimmer{from{background-position:200% 0}to{background-position:-200% 0}}`}</style>
    </div>
  );
}

// ── Miniatura fila (memo para evitar re-render al hover) ─────────
const FilaThumb = memo(function FilaThumb({ pdfUrl, isDark, onClick }) {
  const ref = useRef(null);
  const { imgSrc, loading } = usePdfCover(pdfUrl, ref);
  return (
    <div ref={ref} onClick={onClick} style={{ width: 40, height: 52, flexShrink: 0, borderRadius: 4, overflow: "hidden", background: isDark ? "#0d1117" : "#f1f5f9", border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : SLATE[200]}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", position: "relative" }}>
      {imgSrc ? (
        <img src={imgSrc} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      ) : loading ? (
        <div style={{ position: "absolute", inset: 0, background: isDark ? "linear-gradient(90deg,#1e2535 25%,#252d42 50%,#1e2535 75%)" : "linear-gradient(90deg,#e2e8f0 25%,#f1f5f9 50%,#e2e8f0 75%)", backgroundSize: "200% 100%", animation: "shimmer 1.2s infinite linear" }} />
      ) : (
        <FileText size={14} style={{ color: SLATE[300] }} />
      )}
      <span style={{ position: "absolute", bottom: 0, left: 0, right: 0, fontSize: "5px", fontWeight: 800, textAlign: "center", background: "rgba(220,38,38,0.85)", color: "#fff", padding: "1px 0" }}>PDF</span>
    </div>
  );
});

// ── Tarjeta fila vista lista (Admin) ─────────────────────────────
function CardManualFila({ m, T, onVer, onEditar, onEliminar }) {
  const isDark = T.isDark;
  const pdfUrl = `${API}${m.url}`;
  const fecha = m.fecha_cambio
    ? new Date(m.fecha_cambio).toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" })
    : null;
  const [hov, setHov] = useState(false);

  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 16px", background: hov ? (isDark ? "rgba(255,255,255,0.025)" : "#fafafa") : "transparent", borderBottom: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : SLATE[100]}`, transition: "background 0.12s", cursor: "default" }}
    >
      {/* Miniatura */}
      <FilaThumb pdfUrl={pdfUrl} isDark={isDark} onClick={() => onVer(pdfUrl, m.nombre)} />
      {/* Nombre + categoría — columna flex:1 */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p onClick={() => onVer(pdfUrl, m.nombre)} style={{ fontSize: 13, fontWeight: 600, color: isDark ? "#e2e8f0" : SLATE[800], margin: "0 0 3px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", cursor: "pointer" }}
          onMouseEnter={e => e.currentTarget.style.color = ORANGE}
          onMouseLeave={e => e.currentTarget.style.color = isDark ? "#e2e8f0" : SLATE[800]}>
          {m.nombre.replace(/\.pdf$/i, "")}
        </p>
        {m.nombre_categoria && (
          <span style={{ display: "inline-flex", alignItems: "center", gap: 3, fontSize: 9, fontWeight: 700, padding: "2px 7px", borderRadius: 99, background: OL, color: ORANGE, border: `1px solid ${OB}` }}>
            <Tag size={7} /> {m.nombre_categoria}
          </span>
        )}
      </div>
      {/* Fecha — columna w:130 */}
      <div style={{ width: 130, flexShrink: 0, display: "flex", alignItems: "center", gap: 4 }}>
        {fecha
          ? <span style={{ fontSize: 11, color: isDark ? "rgba(255,255,255,0.40)" : SLATE[500], display: "flex", alignItems: "center", gap: 4 }}><Clock size={10} />{fecha}</span>
          : <span style={{ fontSize: 11, color: isDark ? "rgba(255,255,255,0.18)" : SLATE[300] }}>—</span>
        }
      </div>
      {/* Tamaño — columna w:90 */}
      <div style={{ width: 90, flexShrink: 0 }}>
        {m.tamaño
          ? <span style={{ fontSize: 11, color: isDark ? "rgba(255,255,255,0.40)" : SLATE[500] }}>{m.tamaño}</span>
          : <span style={{ fontSize: 11, color: isDark ? "rgba(255,255,255,0.18)" : SLATE[300] }}>—</span>
        }
      </div>
      {/* Acciones */}
      <div style={{ display: "flex", gap: 5, flexShrink: 0 }} onClick={e => e.stopPropagation()}>
        <button onClick={() => onVer(pdfUrl, m.nombre)} style={{ height: 28, padding: "0 10px", borderRadius: RADIUS.sm, border: "none", background: ORANGE, color: "#fff", fontSize: 11, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}><Eye size={11} /> Ver</button>
        <button onClick={() => onEditar(m)} style={{ width: 28, height: 28, borderRadius: RADIUS.sm, border: `1px solid ${isDark ? "rgba(255,255,255,0.10)" : SLATE[200]}`, background: "transparent", color: isDark ? "rgba(255,255,255,0.45)" : SLATE[400], cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = ORANGE; e.currentTarget.style.color = ORANGE; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = isDark ? "rgba(255,255,255,0.10)" : SLATE[200]; e.currentTarget.style.color = isDark ? "rgba(255,255,255,0.45)" : SLATE[400]; }}>
          <Pencil size={11} />
        </button>
        <button onClick={() => onEliminar(m)} style={{ width: 28, height: 28, borderRadius: RADIUS.sm, border: `1px solid ${isDark ? "rgba(255,255,255,0.10)" : SLATE[200]}`, background: "transparent", color: isDark ? "rgba(255,255,255,0.45)" : SLATE[400], cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = "#dc2626"; e.currentTarget.style.color = "#dc2626"; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = isDark ? "rgba(255,255,255,0.10)" : SLATE[200]; e.currentTarget.style.color = isDark ? "rgba(255,255,255,0.45)" : SLATE[400]; }}>
          <Trash2 size={11} />
        </button>
        <a href={pdfUrl} download={m.nombre} style={{ width: 28, height: 28, borderRadius: RADIUS.sm, border: `1px solid ${isDark ? "rgba(255,255,255,0.10)" : SLATE[200]}`, color: isDark ? "rgba(255,255,255,0.45)" : SLATE[400], textDecoration: "none", display: "flex", alignItems: "center", justifyContent: "center" }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = ORANGE; e.currentTarget.style.color = ORANGE; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = isDark ? "rgba(255,255,255,0.10)" : SLATE[200]; e.currentTarget.style.color = isDark ? "rgba(255,255,255,0.45)" : SLATE[400]; }}>
          <Download size={11} />
        </a>
      </div>
    </div>
  );
}

// ── Tarjeta de manual (Admin) ─────────────────────────────────────
function CardManual({ m, T, onVer, onEditar, onEliminar }) {
  const isDark = T.isDark;
  const pdfUrl = `${API}${m.url}`;
  const fecha  = m.fecha_cambio
    ? new Date(m.fecha_cambio).toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" })
    : null;
  const [hov, setHov] = useState(false);

  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: "flex", flexDirection: "column",
        background: isDark ? "#141720" : "#fff",
        border: `1.5px solid ${hov ? ORANGE : (isDark ? "rgba(255,255,255,0.07)" : SLATE[200])}`,
        borderRadius: 12, overflow: "hidden",
        boxShadow: hov ? "0 8px 28px rgba(244,121,32,0.13)" : (isDark ? "0 2px 10px rgba(0,0,0,0.3)" : "0 1px 6px rgba(0,0,0,0.06)"),
        transition: "border-color 0.18s, box-shadow 0.18s",
        cursor: "pointer",
      }}
      onClick={() => onVer(pdfUrl, m.nombre)}
    >
      <PdfThumb url={pdfUrl} isDark={isDark} />

      <div style={{ padding: "12px 14px", flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
        <p style={{ fontSize: 12, fontWeight: 700, lineHeight: 1.4, color: isDark ? "#eef0f2" : SLATE[700], overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", margin: 0 }}>
          {m.nombre.replace(/\.pdf$/i, "")}
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: "auto", alignItems: "center" }}>
          {m.nombre_categoria && (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 3, fontSize: 9, fontWeight: 700, padding: "2px 7px", borderRadius: 99, background: OL, color: ORANGE, border: `1px solid ${OB}` }}>
              <Tag size={7} /> {m.nombre_categoria}
            </span>
          )}
          {fecha && (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 3, fontSize: 9, fontWeight: 700, padding: "2px 7px", borderRadius: 99, background: isDark ? "rgba(255,255,255,0.06)" : SLATE[100], color: isDark ? "rgba(255,255,255,0.38)" : SLATE[400], border: `1px solid ${isDark ? "rgba(255,255,255,0.10)" : SLATE[200]}` }}>
              <Clock size={7} /> {fecha}
            </span>
          )}
        </div>
      </div>

      {/* Acciones admin */}
      <div
        style={{ padding: "10px 14px", borderTop: `1px solid ${isDark ? "rgba(255,255,255,0.05)" : SLATE[100]}`, display: "flex", gap: 6 }}
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={() => onVer(pdfUrl, m.nombre)}
          style={{ flex: 1, height: 30, borderRadius: RADIUS.sm, display: "flex", alignItems: "center", justifyContent: "center", gap: 5, background: `linear-gradient(135deg,${ORANGE},#d97400)`, color: "#fff", fontSize: 11, fontWeight: 600, cursor: "pointer", border: "none" }}
        >
          <Eye size={11} /> Ver
        </button>
        <button
          onClick={() => onEditar(m)}
          style={{ width: 30, height: 30, borderRadius: RADIUS.sm, display: "flex", alignItems: "center", justifyContent: "center", border: `1px solid ${isDark ? "rgba(255,255,255,0.10)" : SLATE[200]}`, background: "transparent", color: isDark ? "rgba(255,255,255,0.50)" : SLATE[500], cursor: "pointer", flexShrink: 0 }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = ORANGE; e.currentTarget.style.color = ORANGE; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = isDark ? "rgba(255,255,255,0.10)" : SLATE[200]; e.currentTarget.style.color = isDark ? "rgba(255,255,255,0.50)" : SLATE[500]; }}
        >
          <Pencil size={11} />
        </button>
        <button
          onClick={() => onEliminar(m)}
          style={{ width: 30, height: 30, borderRadius: RADIUS.sm, display: "flex", alignItems: "center", justifyContent: "center", border: `1px solid ${isDark ? "rgba(255,255,255,0.10)" : SLATE[200]}`, background: "transparent", color: isDark ? "rgba(255,255,255,0.50)" : SLATE[500], cursor: "pointer", flexShrink: 0 }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = "#dc2626"; e.currentTarget.style.color = "#dc2626"; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = isDark ? "rgba(255,255,255,0.10)" : SLATE[200]; e.currentTarget.style.color = isDark ? "rgba(255,255,255,0.50)" : SLATE[500]; }}
        >
          <Trash2 size={11} />
        </button>
        <a
          href={pdfUrl} download={m.nombre}
          style={{ width: 30, height: 30, borderRadius: RADIUS.sm, display: "flex", alignItems: "center", justifyContent: "center", border: `1px solid ${isDark ? "rgba(255,255,255,0.10)" : SLATE[200]}`, color: isDark ? "rgba(255,255,255,0.50)" : SLATE[500], textDecoration: "none", flexShrink: 0 }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = ORANGE; e.currentTarget.style.color = ORANGE; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = isDark ? "rgba(255,255,255,0.10)" : SLATE[200]; e.currentTarget.style.color = isDark ? "rgba(255,255,255,0.50)" : SLATE[500]; }}
        >
          <Download size={11} />
        </a>
      </div>
    </div>
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
  const [categoria,   setCategoria]   = useState("");
  const [visor,       setVisor]       = useState(null);
  const [archivoSel,  setArchivoSel]  = useState(null);
  const [modalEditar, setModalEditar] = useState(null);
  const [modalElim,   setModalElim]   = useState(null);
  const [loadingElim, setLoadingElim] = useState(false);
  const [toast,       setToast]       = useState(null);
  const [vistaGrid,   setVistaGrid]   = useState(true);
  const [orden,       setOrden]       = useState({ col: "fecha", dir: "desc" });

  const inputSubidaRef = useRef();
  const isDark = T.isDark;
  const border = isDark ? "rgba(255,255,255,0.07)" : SLATE[200];

  const showToast = useCallback((tipo, msg) => {
    setToast({ tipo, msg });
    setTimeout(() => setToast(null), 4000);
  }, []);

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const [rM, rC] = await Promise.all([
        apiFetch(API_ROUTES.MANUALES),
        apiFetch("/api/categorias?tipo=manual"),
      ]);
      const dm = await rM.json(); setManuales(Array.isArray(dm) ? dm : []);
      const dc = await rC.json(); setCategorias(Array.isArray(dc) ? dc : []);
    } catch { setManuales([]); }
    finally { setLoading(false); }
  }, []);

  useAutoRefresh(cargar, 60000);

  const limpiarFiltros = useCallback(() => { setBusqueda(""); setCategoria(""); }, []);

  const cats = [...new Map(
    manuales.filter(m => m.nombre_categoria)
      .map(m => [m.id_categoria, { id: m.id_categoria, nombre: m.nombre_categoria }])
  ).values()];

  const parseTam = (t) => { if (!t) return 0; const n = parseFloat(t); return t.toLowerCase().includes("mb") ? n * 1024 : n; };
  const toggleOrden = (col) => setOrden(p => ({ col, dir: p.col === col && p.dir === "asc" ? "desc" : "asc" }));

  const filtrados = manuales.filter(m => {
    const q = busqueda.toLowerCase();
    return (!busqueda || m.nombre.toLowerCase().includes(q) || m.nombre_categoria?.toLowerCase().includes(q) || m.descripcion?.toLowerCase().includes(q))
      && (!categoria || String(m.id_categoria) === categoria);
  }).sort((a, b) => {
    const d = orden.dir === "asc" ? 1 : -1;
    if (orden.col === "nombre") return d * a.nombre.localeCompare(b.nombre);
    if (orden.col === "tamaño") return d * (parseTam(a.tamaño) - parseTam(b.tamaño));
    return d * (new Date(a.fecha_cambio || 0) - new Date(b.fecha_cambio || 0));
  });

  const handleEliminar = useCallback(async () => {
    setLoadingElim(true);
    try {
      const r = await apiFetch(`/api/manuales/${modalElim.id_manual}`, { method: "DELETE" });
      if (!r.ok) { const d = await r.json(); throw new Error(d.error); }
      setModalElim(null);
      showToast("ok", "Manual eliminado correctamente.");
      await cargar();
    } catch (err) { showToast("error", err.message); }
    finally { setLoadingElim(false); }
  }, [modalElim, cargar, showToast]);

  const handleGuardado = useCallback(async () => {
    const esEdicion = !!modalEditar;
    setArchivoSel(null);
    setModalEditar(null);
    showToast("ok", esEdicion ? "Manual actualizado." : "Manual subido correctamente.");
    await cargar();
  }, [modalEditar, cargar, showToast]);

  const handleFile = useCallback((file) => setArchivoSel(file), []);
  const handleVer  = useCallback((url, nombre) => setVisor({ url, nombre }), []);

  const [dragging, setDragging] = useState(false);
  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
    const file = Array.from(e.dataTransfer.files).find(f => f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf"));
    if (file && file.size <= 50 * 1024 * 1024) setArchivoSel(file);
  }, []);

  return (
    <div
      style={{ background: T.bg, minHeight: "100%", fontFamily: "'Inter','Segoe UI',sans-serif" }}
      onDragOver={e => { e.preventDefault(); setDragging(true); }}
      onDragEnter={e => { e.preventDefault(); setDragging(true); }}
      onDragLeave={e => { if (!e.currentTarget.contains(e.relatedTarget)) setDragging(false); }}
      onDrop={handleDrop}
    >

      {/* Drag & drop overlay */}
      {dragging && (
        <div style={{ position: "fixed", inset: 0, zIndex: 40, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, background: "rgba(244,121,32,0.07)", border: "3px dashed #F47920", pointerEvents: "none" }}>
          <svg width="52" height="52" viewBox="0 0 52 52" fill="none">
            <path d="M26 8v24M14 20l12-12 12 12" stroke="#F47920" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M6 40v3a3 3 0 003 3h34a3 3 0 003-3v-3" stroke="#F47920" strokeWidth="3" strokeLinecap="round"/>
          </svg>
          <p style={{ fontSize: 18, fontWeight: 900, color: "#F47920", margin: 0 }}>Suelta el PDF aquí</p>
          <p style={{ fontSize: 13, color: isDark ? "rgba(255,255,255,0.5)" : "#64748b", margin: 0 }}>Se abrirá el formulario de subida</p>
        </div>
      )}

      {/* Input oculto global */}
      <InputSubida onFile={handleFile} inputRef={inputSubidaRef} />

      {/* ── HERO ─────────────────────────────────────────────── */}
      <div style={{
        background: isDark
          ? "linear-gradient(160deg,#0b0e16 0%,#161c2b 100%)"
          : "linear-gradient(160deg,#f8fafc 0%,#fff4ec 100%)",
        borderBottom: `1px solid ${border}`,
        padding: "36px 24px 32px",
      }}>
        <div style={{ maxWidth: 700, margin: "0 auto", display: "flex", flexDirection: "column", alignItems: "center", gap: 18 }}>

          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <img
              src={isDark ? "/assets/img/logo%20blanco.png" : "/assets/img/logo%20negro.png"}
              alt="Precision Truck Parts"
              style={{ height: 48, objectFit: "contain", flexShrink: 0 }}
            />
            <div style={{ width: 1, height: 40, background: isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.10)", flexShrink: 0 }} />
            <div>
              <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase",
                color: isDark ? "rgba(255,255,255,0.32)" : SLATE[400], margin: 0 }}>
                Precision Truck Parts
              </p>
              <p style={{ fontSize: 13, fontWeight: 700, color: isDark ? "rgba(255,255,255,0.58)" : SLATE[600], margin: 0 }}>
                Centro de Conocimientos
              </p>
            </div>
          </div>

          <div style={{ textAlign: "center" }}>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: isDark ? "#fff" : SLATE[900], margin: 0, lineHeight: 1.2 }}>
              Gestión de Manuales
            </h1>
            <p style={{ fontSize: 13, color: isDark ? "rgba(255,255,255,0.35)" : SLATE[400], marginTop: 6 }}>
              {manuales.length} manuales técnicos · administración completa
            </p>
          </div>

          {/* Botón subir en hero */}
          <button
            onClick={() => inputSubidaRef.current?.click()}
            style={{ height: 38, padding: "0 20px", borderRadius: RADIUS.sm, display: "flex", alignItems: "center", gap: 7, background: ORANGE, border: "none", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", transition: "filter 0.15s", boxShadow: "0 4px 14px rgba(244,121,32,0.35)" }}
            onMouseEnter={e => e.currentTarget.style.filter = "brightness(1.08)"}
            onMouseLeave={e => e.currentTarget.style.filter = "brightness(1)"}
          >
            <Upload size={14} /> Subir manual
          </button>

          {/* Buscador hero */}
          <div style={{
            width: "100%", maxWidth: 520, position: "relative",
            background: isDark ? "rgba(255,255,255,0.06)" : "#fff",
            border: `1.5px solid ${busqueda ? ORANGE : border}`,
            borderRadius: 10,
            boxShadow: busqueda
              ? "0 0 0 4px rgba(244,121,32,0.11), 0 4px 20px rgba(0,0,0,0.08)"
              : "0 4px 20px rgba(0,0,0,0.07)",
            transition: "all 0.2s",
          }}>
            <svg style={{ position: "absolute", left: 15, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={busqueda ? ORANGE : SLATE[400]} strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            <input
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              placeholder="Buscar manual..."
              style={{
                width: "100%", background: "transparent", border: "none", outline: "none",
                padding: "13px 42px 13px 44px",
                fontSize: 14, color: isDark ? "#fff" : SLATE[700],
                fontFamily: "'Inter','Segoe UI',sans-serif",
                boxSizing: "border-box",
              }}
            />
            {busqueda && (
              <button onClick={() => setBusqueda("")} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: SLATE[400], display: "flex", padding: 2 }}>
                <X size={13} />
              </button>
            )}
          </div>

          {/* Chips de categoría */}
          {!loading && cats.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, justifyContent: "center" }}>
              {[{ id: "", nombre: "Todas" }, ...cats].map(c => {
                const active = categoria === String(c.id);
                return (
                  <button
                    key={c.id}
                    onClick={() => setCategoria(active ? "" : String(c.id))}
                    style={{
                      padding: "5px 13px", borderRadius: 99, fontSize: 11, fontWeight: 700,
                      cursor: "pointer", transition: "all 0.15s",
                      background: active ? ORANGE : (isDark ? "rgba(255,255,255,0.06)" : "#fff"),
                      color: active ? "#fff" : (isDark ? "rgba(255,255,255,0.55)" : SLATE[500]),
                      border: `1.5px solid ${active ? ORANGE : (isDark ? "rgba(255,255,255,0.12)" : SLATE[200])}`,
                    }}
                  >
                    {c.nombre}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── CUERPO ───────────────────────────────────────────── */}
      <div style={{ maxWidth: 1000, margin: "0 auto", padding: "24px 20px", display: "flex", flexDirection: "column", gap: 20 }}>

        {/* Toast */}
        {toast && (
          <div style={{ padding: "10px 16px", borderRadius: RADIUS.sm, background: toast.tipo === "ok" ? SEMANTIC.successBg : SEMANTIC.dangerBg, border: `1px solid ${toast.tipo === "ok" ? SEMANTIC.successBdr : SEMANTIC.dangerBdr}`, color: toast.tipo === "ok" ? SEMANTIC.success : SEMANTIC.danger, display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 500 }}>
            {toast.msg}
            <button onClick={() => setToast(null)} style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", color: "inherit" }}><X size={13} /></button>
          </div>
        )}

        {/* Encabezado resultados + botón subir */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 3, height: 14, borderRadius: 99, background: `linear-gradient(180deg,${ORANGE},#d97400)` }} />
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", color: isDark ? "rgba(255,255,255,0.42)" : SLATE[600] }}>
              {busqueda || categoria ? "Resultados" : "Documentos disponibles"}
            </span>
            <span style={{ fontSize: 10, fontWeight: 700, padding: "1px 7px", borderRadius: 99, background: isDark ? "rgba(244,121,32,0.14)" : "rgba(244,121,32,0.08)", color: ORANGE, border: "1px solid rgba(244,121,32,0.22)" }}>
              {filtrados.length}
            </span>
            {(busqueda || categoria) && (
              <button onClick={limpiarFiltros} style={{ fontSize: 11, fontWeight: 600, color: isDark ? "rgba(255,255,255,0.35)" : SLATE[400], background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
                <X size={10} /> Limpiar
              </button>
            )}
          </div>
          {/* Toggle vista */}
          <div style={{ display: "flex", borderRadius: RADIUS.sm, border: `1px solid ${isDark ? "rgba(255,255,255,0.10)" : SLATE[200]}`, overflow: "hidden" }}>
            {[{ Icon: List, val: false }, { Icon: LayoutGrid, val: true }].map(({ Icon, val }) => (
              <button key={String(val)} onClick={() => setVistaGrid(val)}
                style={{ width: 30, height: 30, border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", background: vistaGrid === val ? (isDark ? "rgba(244,121,32,0.18)" : OL) : "transparent", color: vistaGrid === val ? ORANGE : (isDark ? "rgba(255,255,255,0.35)" : SLATE[400]), transition: "all 0.14s" }}>
                <Icon size={13} />
              </button>
            ))}
          </div>
        </div>

        {/* Grid de tarjetas */}
        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: "60px 0" }}>
            <svg className="animate-spin" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={ORANGE} strokeWidth="2.5">
              <path d="M21 12a9 9 0 1 1-6.219-8.56" />
            </svg>
          </div>
        ) : filtrados.length === 0 ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "60px 20px", gap: 12, background: isDark ? "#141720" : "#fff", border: `1px solid ${border}`, borderRadius: 12 }}>
            <div style={{ width: 52, height: 52, borderRadius: 12, background: isDark ? "rgba(255,255,255,0.04)" : "#f1f5f9", border: `1px solid ${border}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <FileText size={24} style={{ color: isDark ? "rgba(255,255,255,0.18)" : SLATE[400] }} />
            </div>
            <p style={{ fontSize: 14, fontWeight: 700, color: isDark ? "rgba(255,255,255,0.42)" : SLATE[600], margin: 0 }}>
              {busqueda || categoria ? "Sin resultados" : "No hay manuales aún"}
            </p>
            <p style={{ fontSize: 12, color: isDark ? "rgba(255,255,255,0.22)" : SLATE[400], textAlign: "center", margin: 0 }}>
              {busqueda || categoria ? "Prueba con otros términos o limpia los filtros." : "Sube el primer manual para que el equipo pueda consultarlo."}
            </p>
            {!busqueda && !categoria && (
              <button
                onClick={() => inputSubidaRef.current?.click()}
                style={{ height: 34, padding: "0 16px", borderRadius: RADIUS.sm, display: "flex", alignItems: "center", gap: 6, background: ORANGE, border: "none", color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
              >
                <Upload size={13} /> Subir primer manual
              </button>
            )}
          </div>
        ) : vistaGrid ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(190px, 1fr))", gap: 16 }}>
            {filtrados.map(m => (
              <CardManual key={m.id_manual} m={m} T={T} onVer={handleVer} onEditar={setModalEditar} onEliminar={setModalElim} />
            ))}
          </div>
        ) : (
          <div style={{ background: isDark ? "#141720" : "#fff", border: `1px solid ${border}`, borderRadius: 12, overflow: "hidden" }}>
            {/* Cabecera ordenamiento */}
            <div style={{ display: "flex", alignItems: "center", padding: "0 16px", borderBottom: `1px solid ${border}`, background: isDark ? "rgba(255,255,255,0.02)" : "#f8fafc", height: 36 }}>
              <div style={{ width: 54, flexShrink: 0 }} />
              {[{ col: "nombre", label: "Nombre", flex: 1 }, { col: "fecha", label: "Fecha", w: 130 }, { col: "tamaño", label: "Tamaño", w: 90 }].map(({ col, label, flex, w }) => {
                const activo = orden.col === col;
                return (
                  <button key={col} onClick={() => toggleOrden(col)}
                    style={{ flex, width: w, flexShrink: w ? 0 : undefined, display: "flex", alignItems: "center", gap: 4, background: "none", border: "none", cursor: "pointer", padding: 0, fontSize: 10, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", color: activo ? ORANGE : (isDark ? "rgba(255,255,255,0.30)" : SLATE[400]), transition: "color 0.14s" }}>
                    {label}
                    {activo ? (orden.dir === "asc" ? <ChevronUp size={11} style={{ color: ORANGE }} /> : <ChevronDown size={11} style={{ color: ORANGE }} />) : <ChevronDown size={11} style={{ opacity: 0.3 }} />}
                  </button>
                );
              })}
              <span style={{ width: 140, flexShrink: 0 }} />
            </div>
            {filtrados.map(m => (
              <CardManualFila key={m.id_manual} m={m} T={T} onVer={handleVer} onEditar={setModalEditar} onEliminar={setModalElim} />
            ))}
          </div>
        )}
      </div>

      {/* Visor PDF */}
      {visor && <DrawerVisor url={visor.url} nombre={visor.nombre} T={T} onClose={() => setVisor(null)} />}

      {/* Modales */}
      {archivoSel  && <ModalForm T={T} categorias={categorias} archivo={archivoSel}  onClose={() => setArchivoSel(null)}  onGuardado={handleGuardado} />}
      {modalEditar && <ModalForm T={T} categorias={categorias} manual={modalEditar}  onClose={() => setModalEditar(null)} onGuardado={handleGuardado} />}
      {modalElim   && <ModalEliminar T={T} manual={modalElim} loading={loadingElim} onConfirm={handleEliminar} onClose={() => setModalElim(null)} />}
    </div>
  );
}
