import { useState, useRef, useEffect } from "react";
import PdfViewer from "../../Components/PdfViewer";
import {
  Upload, X, FileText,
  Trash2, Pencil, Download, MoreVertical, Eye, Tag, Clock,
  LayoutGrid, List, ChevronUp, ChevronDown,
} from "lucide-react";
import { apiFetch, API_ROUTES } from "../../Config/api";
import API from "../../Config/api";
import { useAutoRefresh } from "../../Config/useAutoRefresh";
import { usePdfCover } from "../../Components/hooks/usePdfCover";
import FiltrosToolbar from "../../Components/FiltrosToolbar";
import {
  RADIUS, NEUTRAL, SLATE, SEMANTIC,
} from "../../Config/DesignSystem";

const ORANGE = "#F47920";
const OL     = "rgba(244,121,32,0.10)";
const OB     = "rgba(244,121,32,0.22)";

const CAT_MAP = {
  hardware: { color: "#ea580c", bg: "rgba(234,88,12,0.08)",  border: "rgba(234,88,12,0.18)" },
  redes:    { color: "#2563eb", bg: "rgba(37,99,235,0.08)",  border: "rgba(37,99,235,0.18)" },
  software: { color: "#16a34a", bg: "rgba(22,163,74,0.08)",  border: "rgba(22,163,74,0.18)" },
  sistema:  { color: "#7c3aed", bg: "rgba(124,58,237,0.08)", border: "rgba(124,58,237,0.18)" },
  default:  { color: ORANGE,    bg: OL,                      border: OB },
};
function getCatKey(nombre = "") {
  const n = nombre.toLowerCase();
  if (n.includes("hardware") || n.includes("pc") || n.includes("equipo")) return "hardware";
  if (n.includes("red")  || n.includes("wifi") || n.includes("internet"))  return "redes";
  if (n.includes("software") || n.includes("aplicac"))                     return "software";
  if (n.includes("sistema")  || n.includes("os"))                          return "sistema";
  return "default";
}

// ── Tokens compartidos para modales ─────────────────────────────
function modalTokens(T) {
  const isDark = T.isDark;
  return {
    isDark,
    surface:    isDark ? "#161B22" : "#ffffff",
    surfaceAlt: isDark ? "#1a2030" : "#f8fafc",
    border:     isDark ? "rgba(255,255,255,0.07)" : "#e8ecf0",
    textMain:   T.text     ?? (isDark ? "#e2e8f0" : "#1a202c"),
    textMuted:  T.textMuted ?? (isDark ? "#8b949e" : "#64748b"),
    textFaint:  T.textFaint ?? (isDark ? "rgba(255,255,255,0.30)" : "#a0aec0"),
    inputBg:    isDark ? "rgba(255,255,255,0.04)" : "#f8fafc",
  };
}

function ModalShell({ T, title, subtitle, onClose, onConfirm, confirmLabel, confirmDanger, loading, children, maxWidth = "480px" }) {
  const { isDark, surface, surfaceAlt, border, textMain, textMuted, textFaint } = modalTokens(T);
  const accentColor = confirmDanger ? "#DC2626" : ORANGE;

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);
  useEffect(() => {
    const fn = (e) => { if (e.key === "Escape" && !loading) onClose(); };
    document.addEventListener("keydown", fn);
    return () => document.removeEventListener("keydown", fn);
  }, [onClose, loading]);

  return (
    <div
      role="presentation"
      style={{ position: "fixed", inset: 0, zIndex: 1000, background: isDark ? "rgba(0,0,0,0.55)" : "rgba(15,23,42,0.40)", display: "flex", alignItems: "center", justifyContent: "center", padding: "16px", animation: "msFade 0.15s ease" }}
      onMouseDown={e => { if (e.target === e.currentTarget && !loading) onClose(); }}
    >
      <style>{`@keyframes msFade{from{opacity:0}to{opacity:1}} @keyframes msSlide{from{opacity:0;transform:translateY(-5px)}to{opacity:1;transform:translateY(0)}}`}</style>
      <div role="dialog" aria-modal="true" style={{ width: "95%", maxWidth, background: surface, border: `1px solid ${border}`, borderRadius: "10px", display: "flex", flexDirection: "column", maxHeight: "90vh", overflow: "hidden", boxShadow: isDark ? "0 16px 40px rgba(0,0,0,0.50), 0 1px 0 rgba(255,255,255,0.04) inset" : "0 16px 40px rgba(15,23,42,0.12), 0 1px 3px rgba(15,23,42,0.06)", animation: "msSlide 0.18s ease" }}>
        {/* Banda acento */}
        <div style={{ height: "2px", flexShrink: 0, background: accentColor, borderRadius: "10px 10px 0 0" }} />
        {/* Header */}
        <div style={{ padding: "14px 18px 12px", borderBottom: `1px solid ${border}`, display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px", flexShrink: 0 }}>
          <div style={{ minWidth: 0, flex: 1 }}>
            <p style={{ margin: 0, fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.09em", color: accentColor }}>{subtitle}</p>
            <h2 style={{ margin: "3px 0 0", fontSize: "16px", fontWeight: 700, color: textMain, letterSpacing: "-0.02em", lineHeight: 1.2 }}>{title}</h2>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexShrink: 0, paddingTop: "2px" }}>
            <img src={isDark ? "/assets/img/logo blanco.png" : "/assets/img/logo negro.png"} alt="Precision Trucks" style={{ height: "28px", objectFit: "contain", opacity: isDark ? 0.80 : 0.70 }} />
            {!loading && (
              <button onClick={onClose} style={{ width: "26px", height: "26px", display: "flex", alignItems: "center", justifyContent: "center", background: "transparent", border: `1px solid ${border}`, borderRadius: "6px", cursor: "pointer", color: textFaint, transition: "all 0.12s" }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = textMuted; e.currentTarget.style.color = textMain; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = border; e.currentTarget.style.color = textFaint; }}>
                <X size={12} strokeWidth={2} />
              </button>
            )}
          </div>
        </div>
        {/* Body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "16px 18px", fontSize: "13px", color: textMain }}>
          {children}
        </div>
        {/* Footer */}
        <div style={{ padding: "10px 18px", borderTop: `1px solid ${border}`, background: surfaceAlt, display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "8px", flexShrink: 0 }}>
          <button onClick={onClose} disabled={loading}
            style={{ padding: "6px 16px", borderRadius: "6px", fontSize: "12px", fontWeight: 600, background: "transparent", border: `1px solid ${border}`, color: textMuted, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.5 : 1, transition: "all 0.12s" }}
            onMouseEnter={e => { if (!loading) { e.currentTarget.style.borderColor = textMuted; e.currentTarget.style.color = textMain; } }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = border; e.currentTarget.style.color = textMuted; }}>
            Cancelar
          </button>
          {onConfirm && (
            <button onClick={onConfirm} disabled={loading}
              style={{ padding: "6px 18px", borderRadius: "6px", fontSize: "12px", fontWeight: 700, background: loading ? `${accentColor}99` : accentColor, border: "none", color: "#fff", cursor: loading ? "not-allowed" : "pointer", display: "inline-flex", alignItems: "center", gap: "6px", transition: "opacity 0.12s" }}
              onMouseEnter={e => { if (!loading) e.currentTarget.style.opacity = "0.88"; }}
              onMouseLeave={e => { e.currentTarget.style.opacity = "1"; }}>
              {loading ? (<><span style={{ display: "inline-block", width: 13, height: 13, border: "2px solid rgba(255,255,255,0.30)", borderTopColor: "#fff", borderRadius: "50%", animation: "_modal_spin 0.65s linear infinite" }} />Procesando…</>) : confirmLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Modal subir / editar ──────────────────────────────────────────
function ModalForm({ T, categorias, manual, archivo, onClose, onGuardado }) {
  const esEdicion = !!manual;
  const { isDark, border, textMain, textMuted, textFaint, inputBg } = modalTokens(T);
  const [form, setForm] = useState({
    nombre:       manual?.nombre       ?? (archivo?.name?.replace(/\.pdf$/i, "") ?? ""),
    descripcion:  manual?.descripcion  ?? "",
    id_categoria: manual?.id_categoria ?? "",
  });
  const [errores, setErrores] = useState({});
  const [loading, setLoading] = useState(false);

  const set = (k, v) => { setForm(p => ({ ...p, [k]: v })); setErrores(p => ({ ...p, [k]: "" })); };

  const inp = { background: inputBg, border: `1px solid ${border}`, borderRadius: "6px", padding: "0 10px", height: "34px", fontSize: "13px", color: textMain, outline: "none", width: "100%", boxSizing: "border-box", transition: "border-color 0.12s, box-shadow 0.12s" };
  const onFocus = e => { e.target.style.borderColor = "#2563eb"; e.target.style.boxShadow = "0 0 0 3px rgba(37,99,235,0.10)"; e.target.style.background = isDark ? "rgba(255,255,255,0.07)" : "#fff"; };
  const onBlur  = e => { e.target.style.borderColor = border; e.target.style.boxShadow = "none"; e.target.style.background = inputBg; };

  const handleSubmit = async () => {
    const e2 = {};
    if (!form.nombre.trim())  e2.nombre       = "El nombre es obligatorio";
    if (!form.id_categoria)   e2.id_categoria = "La categoría es obligatoria";
    if (Object.keys(e2).length) { setErrores(e2); return; }
    setLoading(true);
    try {
      let r;
      if (esEdicion) {
        r = await apiFetch(`/api/manuales/${manual.id_manual}`, { method: "PUT", body: { nombre: form.nombre.trim(), descripcion: form.descripcion.trim(), id_categoria: parseInt(form.id_categoria) } });
      } else {
        const fd = new FormData();
        fd.append("archivo", archivo); fd.append("nombre", form.nombre.trim());
        fd.append("descripcion", form.descripcion.trim()); fd.append("id_categoria", form.id_categoria);
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
    <ModalShell T={T} title={esEdicion ? manual?.nombre ?? "Editar manual" : "Subir manual"} subtitle={esEdicion ? "Editar manual" : "Nuevo manual"} onClose={onClose} onConfirm={handleSubmit} confirmLabel={loading ? (esEdicion ? "Guardando…" : "Subiendo…") : (esEdicion ? "Guardar cambios" : "Subir manual")} loading={loading}>
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {!esEdicion && (
          <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", borderRadius: "6px", background: isDark ? "rgba(255,255,255,0.04)" : "#f8fafc", border: `1px solid ${border}` }}>
            <div style={{ width: 36, height: 42, borderRadius: "4px", flexShrink: 0, background: "rgba(220,38,38,0.08)", border: "1.5px solid rgba(220,38,38,0.18)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
              <FileText size={16} style={{ color: "#dc2626" }} />
              <span style={{ fontSize: "7px", fontWeight: 700, color: "#dc2626" }}>PDF</span>
            </div>
            <div style={{ minWidth: 0 }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: textMain, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{archivo.name}</p>
              <p style={{ fontSize: 11, color: textMuted, margin: 0 }}>{archivo.size < 1024*1024 ? `${(archivo.size/1024).toFixed(0)} KB` : `${(archivo.size/1024/1024).toFixed(1)} MB`}</p>
            </div>
          </div>
        )}
        <LabelField label="Nombre" required error={errores.nombre}>
          <input style={{ ...inp, ...(errores.nombre ? { borderColor: "#dc2626" } : {}) }} value={form.nombre} onChange={e => set("nombre", e.target.value)} onFocus={onFocus} onBlur={onBlur} placeholder="Ej. Manual de procedimientos red" autoFocus />
        </LabelField>
        <LabelField label="Descripción">
          <textarea style={{ ...inp, height: "auto", padding: "8px 10px", resize: "none", lineHeight: "1.5" }} value={form.descripcion} onChange={e => set("descripcion", e.target.value)} onFocus={onFocus} onBlur={onBlur} placeholder="Breve descripción del contenido..." rows={3} />
        </LabelField>
        <LabelField label="Categoría" required error={errores.id_categoria}>
          <select style={{ ...inp, cursor: "pointer", ...(errores.id_categoria ? { borderColor: "#dc2626" } : {}) }} value={form.id_categoria} onChange={e => set("id_categoria", e.target.value)} onFocus={onFocus} onBlur={onBlur}>
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
    </ModalShell>
  );
}

// ── Modal eliminar ────────────────────────────────────────────────
function ModalEliminar({ T, manual, onConfirm, onClose, loading }) {
  const { border, textMain, textMuted } = modalTokens(T);
  return (
    <ModalShell T={T} title="Eliminar manual" subtitle="Confirmar eliminación" onClose={onClose} onConfirm={onConfirm} confirmLabel={loading ? "Eliminando…" : "Eliminar"} confirmDanger loading={loading} maxWidth="400px">
      <p style={{ margin: 0, fontSize: 13, color: textMain }}>
        ¿Eliminar <strong>{manual.nombre}</strong>? Esta acción no se puede deshacer.
      </p>
    </ModalShell>
  );
}

// ── Drawer visor PDF ──────────────────────────────────────────────
function DrawerVisor({ url, nombre, T, onClose }) {
  const isDark = T.isDark;
  const mobile = window.innerWidth < 640;
  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 300, background: "rgba(0,0,0,0.50)" }} />
      <div style={{ position: "fixed", top: 0, right: 0, bottom: 0, zIndex: 301, width: mobile ? "100vw" : "min(960px,96vw)", display: "flex", flexDirection: "column", background: isDark ? "#0f1117" : "#f8fafc", boxShadow: "-4px 0 32px rgba(0,0,0,0.18)", animation: "slideIn .2s cubic-bezier(.16,1,.3,1)" }}>
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

// ── Tarjeta fila (vista lista) ────────────────────────────────────
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
      <div onClick={() => onVer(pdfUrl, m.nombre)} style={{ cursor: "pointer", flexShrink: 0 }}>
        <PdfThumb url={pdfUrl} isDark={isDark} />
      </div>
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
      <div style={{ flexShrink: 0 }} onClick={e => e.stopPropagation()}>
        <KebabMenu T={T} pdfUrl={pdfUrl} nombre={m.nombre}
          onEditar={() => onEditar(m)} onEliminar={() => onEliminar(m)}
          onVer={() => onVer(pdfUrl, m.nombre)}
        />
      </div>
    </div>
  );
}

// ── Tarjeta grid (vista cuadrícula) ──────────────────────────────
function GridCard({ m, T, onVer, onEditar, onEliminar }) {
  const isDark = T.isDark;
  const pdfUrl = `${API}${m.url}`;
  const { imgSrc, loading: coverLoading } = usePdfCover(pdfUrl);
  const [hov, setHov] = useState(false);
  const fecha = m.fecha_cambio
    ? new Date(m.fecha_cambio).toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" })
    : null;

  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        borderRadius: RADIUS.lg,
        border: `1px solid ${hov ? OB : (isDark ? "rgba(255,255,255,0.08)" : SLATE[200])}`,
        background: isDark ? "#141720" : NEUTRAL.white,
        overflow: "hidden",
        display: "flex", flexDirection: "column",
        transition: "box-shadow 0.18s, transform 0.18s, border-color 0.18s",
        boxShadow: hov ? (isDark ? "0 8px 32px rgba(0,0,0,0.45)" : "0 8px 24px rgba(0,0,0,0.12)") : "none",
        transform: hov ? "translateY(-3px)" : "translateY(0)",
        cursor: "default",
        position: "relative",
      }}
    >
      {/* Portada */}
      <div
        onClick={() => onVer(pdfUrl, m.nombre)}
        style={{
          height: 160, position: "relative", overflow: "hidden", cursor: "pointer",
          background: isDark ? "#0d1117" : "#f1f5f9",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}
      >
        {imgSrc ? (
          <>
            <img src={imgSrc} alt="" aria-hidden style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", filter: "blur(10px) brightness(0.55)", transform: "scale(1.1)" }} />
            <img src={imgSrc} alt="portada" style={{ position: "relative", height: "136px", width: "auto", maxWidth: "80%", objectFit: "contain", borderRadius: 3, boxShadow: "0 6px 24px rgba(0,0,0,0.45)" }} />
          </>
        ) : coverLoading ? (
          <svg className="animate-spin" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={SLATE[300]} strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
        ) : (
          <FileText size={36} style={{ color: isDark ? "rgba(255,255,255,0.12)" : SLATE[300] }} />
        )}
        {/* Badge PDF */}
        <span style={{ position: "absolute", top: 8, right: 8, fontSize: "7px", fontWeight: 800, letterSpacing: "0.05em", padding: "2px 6px", borderRadius: 3, background: "rgba(220,38,38,0.85)", color: "#fff" }}>PDF</span>

        {/* Overlay de acciones en hover */}
        {hov && (
          <div
            onClick={e => e.stopPropagation()}
            style={{
              position: "absolute", inset: 0,
              background: "rgba(0,0,0,0.52)",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              animation: "fadeIn .15s ease",
            }}
          >
            <style>{`@keyframes fadeIn{from{opacity:0}to{opacity:1}}`}</style>
            <button onClick={() => onVer(pdfUrl, m.nombre)}
              style={{ height: 32, padding: "0 12px", borderRadius: RADIUS.sm, border: "none", background: ORANGE, color: "#fff", fontSize: 11, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}>
              <Eye size={12} /> Ver
            </button>
            <button onClick={() => onEditar(m)}
              style={{ height: 32, padding: "0 12px", borderRadius: RADIUS.sm, border: "1px solid rgba(255,255,255,0.25)", background: "rgba(255,255,255,0.12)", color: "#fff", fontSize: 11, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}>
              <Pencil size={12} /> Editar
            </button>
            <button onClick={() => onEliminar(m)}
              style={{ height: 32, width: 32, borderRadius: RADIUS.sm, border: "1px solid rgba(255,255,255,0.20)", background: "rgba(220,38,38,0.70)", color: "#fff", fontSize: 11, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Trash2 size={12} />
            </button>
          </div>
        )}
      </div>

      {/* Info pie */}
      <div style={{ padding: "10px 12px 12px", display: "flex", flexDirection: "column", gap: 6, flex: 1 }}>
        <p style={{
          fontSize: 12, fontWeight: 700, margin: 0, lineHeight: 1.35,
          color: isDark ? "#e2e8f0" : SLATE[900],
          display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
        }}>
          {m.nombre.replace(/\.pdf$/i, "")}
        </p>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 4, marginTop: "auto" }}>
          {m.nombre_categoria ? (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 3, fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 99, background: OL, color: ORANGE, border: `1px solid ${OB}`, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "60%" }}>
              <Tag size={7} /> {m.nombre_categoria}
            </span>
          ) : <span />}
          {fecha && (
            <span style={{ fontSize: 9, color: isDark ? "rgba(255,255,255,0.28)" : SLATE[400], whiteSpace: "nowrap" }}>
              {fecha}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Estado vacío accionable ─────────────────────────────────────
function EstadoVacio({ isDark, hayFiltro, onSubir }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "56px 20px", gap: 14 }}>
      <div style={{ width: 56, height: 56, borderRadius: 12, background: isDark ? "rgba(255,255,255,0.04)" : NEUTRAL.slate100, border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : SLATE[200]}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <FileText size={24} style={{ color: isDark ? "rgba(255,255,255,0.18)" : SLATE[300] }} />
      </div>
      <div style={{ textAlign: "center" }}>
        <p style={{ fontSize: 14, fontWeight: 700, color: isDark ? "rgba(255,255,255,0.45)" : SLATE[600], margin: "0 0 4px" }}>
          {hayFiltro ? "Sin resultados" : "No hay manuales aún"}
        </p>
        <p style={{ fontSize: 12, color: isDark ? "rgba(255,255,255,0.22)" : SLATE[400], margin: 0 }}>
          {hayFiltro ? "Prueba con otros términos o limpia los filtros." : "Sube el primer manual para que el equipo pueda consultarlo."}
        </p>
      </div>
      {!hayFiltro && (
        <button
          onClick={onSubir}
          style={{ height: 34, padding: "0 16px", borderRadius: RADIUS.sm, display: "flex", alignItems: "center", gap: 6, background: ORANGE, border: "none", color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer", transition: "filter 0.15s" }}
          onMouseEnter={e => e.currentTarget.style.filter = "brightness(1.08)"}
          onMouseLeave={e => e.currentTarget.style.filter = "brightness(1)"}
        >
          <Upload size={13} /> Subir primer manual
        </button>
      )}
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
  const [filtros,     setFiltros]     = useState({ busqueda: "", categoria: "" });
  const [visor,       setVisor]       = useState(null);
  const [archivoSel,  setArchivoSel]  = useState(null);
  const [modalEditar, setModalEditar] = useState(null);
  const [modalElim,   setModalElim]   = useState(null);
  const [loadingElim, setLoadingElim] = useState(false);
  const [toast,       setToast]       = useState(null);
  const [dragging,    setDragging]    = useState(false);
  const [vistaGrid,   setVistaGrid]   = useState(false);
  const [orden,        setOrden]        = useState({ col: "fecha", dir: "desc" });

  const inputSubidaRef = useRef();
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

  const parseTam = (t) => {
    if (!t) return 0;
    const n = parseFloat(t);
    if (t.toLowerCase().includes("mb")) return n * 1024;
    return n;
  };

  const setFiltro = (key, val) => setFiltros(p => ({ ...p, [key]: val }));
  const limpiarFiltros = () => setFiltros({ busqueda: "", categoria: "" });

  const catOpts = [
    { value: "", label: "Todas" },
    ...categorias.map(c => ({ value: String(c.id_categoria), label: c.nombre_categoria })),
  ];

  const camposFiltro = [
    { key: "busqueda",  label: "Búsqueda",  type: "search", placeholder: "Nombre, categoría...", debounce: 250 },
    { key: "categoria", label: "Categoría", type: "select", opts: catOpts },
  ];

  const filtrados = manuales
    .filter(m => {
      const q = filtros.busqueda.toLowerCase();
      return (!filtros.busqueda || m.nombre.toLowerCase().includes(q) || m.nombre_categoria?.toLowerCase().includes(q) || m.descripcion?.toLowerCase().includes(q))
        && (!filtros.categoria || String(m.id_categoria) === filtros.categoria);
    })
    .sort((a, b) => {
      const d = orden.dir === "asc" ? 1 : -1;
      if (orden.col === "nombre") return d * a.nombre.localeCompare(b.nombre);
      if (orden.col === "tamaño") return d * (parseTam(a.tamaño) - parseTam(b.tamaño));
      // fecha (default)
      return d * (new Date(a.fecha_cambio || 0) - new Date(b.fecha_cambio || 0));
    });

  const toggleOrden = (col) => setOrden(p => ({ col, dir: p.col === col && p.dir === "asc" ? "desc" : "asc" }));



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
    setArchivoSel(null); setModalEditar(null); ;
    showToast("ok", modalEditar ? "Manual actualizado." : "Manual subido correctamente.");
    await cargar();
  };

  const handleFile = (file) => { setArchivoSel(file); };

  return (
    <div
      style={{ background: T.bg, minHeight: "100%", fontFamily: "'Inter','Segoe UI',sans-serif" }}
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

      {/* ── HEADER simple ────────────────────────────────────── */}
      <div style={{ padding: "20px 28px 0", maxWidth: 1200, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ fontSize: 18, fontWeight: 700, color: T.text, margin: 0 }}>Manuales</h1>
          <p style={{ fontSize: 12, color: isDark ? "rgba(255,255,255,0.35)" : SLATE[400], margin: "2px 0 0" }}>
            {manuales.length} documento{manuales.length !== 1 ? "s" : ""}
          </p>
        </div>
        <button
          onClick={() => inputSubidaRef.current.click()}
          style={{ height: 36, padding: "0 16px", borderRadius: RADIUS.sm, display: "flex", alignItems: "center", gap: 6, background: ORANGE, border: "none", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
        >
          <Upload size={14} /> Subir manual
        </button>
        <InputSubida onFile={handleFile} inputRef={inputSubidaRef} />
      </div>



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
        <FiltrosToolbar
          campos={camposFiltro}
          valores={filtros}
          onChange={setFiltro}
          onLimpiar={limpiarFiltros}
          loading={loading}
          T={T}
        >
          {/* Contador + toggle vista */}
          <span style={{ fontSize: 11, fontWeight: 600, color: isDark ? "rgba(255,255,255,0.30)" : SLATE[400], whiteSpace: "nowrap" }}>
            {filtrados.length}/{manuales.length}
          </span>
          <div style={{ display: "flex", borderRadius: RADIUS.sm, border: `1px solid ${isDark ? "rgba(255,255,255,0.10)" : SLATE[200]}`, overflow: "hidden", flexShrink: 0 }}>
            {[{ icon: List, val: false }, { icon: LayoutGrid, val: true }].map(({ icon: Icon, val }) => (
              <button key={String(val)} onClick={() => setVistaGrid(val)}
                style={{
                  width: 28, height: 28, border: "none", cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  background: vistaGrid === val ? (isDark ? "rgba(244,121,32,0.18)" : OL) : "transparent",
                  color: vistaGrid === val ? ORANGE : (isDark ? "rgba(255,255,255,0.35)" : SLATE[400]),
                  transition: "all 0.14s",
                }}
              >
                <Icon size={13} />
              </button>
            ))}
          </div>
        </FiltrosToolbar>

        {/* ── Lista / Grid de manuales ──────────────────────────── */}
        {vistaGrid ? (
          /* ── VISTA GRID ── */
          loading ? (
            <div style={{ display: "flex", justifyContent: "center", padding: "56px 0" }}>
              <svg className="animate-spin" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={ORANGE} strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
            </div>
          ) : filtrados.length === 0 ? (
            <EstadoVacio isDark={isDark} hayFiltro={!!(filtros.busqueda || filtros.categoria)} onSubir={() => { limpiarFiltros(); inputSubidaRef.current?.click(); }} />
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 14 }}>
              {filtrados.map(m => (
                <GridCard
                  key={m.id_manual} m={m} T={T}
                  onVer={(url, nombre) => setVisor({ url, nombre })}
                  onEditar={setModalEditar}
                  onEliminar={setModalElim}
                />
              ))}
            </div>
          )
        ) : (
          /* ── VISTA LISTA ── */
          <div style={{ background: surf, border: `1px solid ${border}`, borderRadius: RADIUS.lg, overflow: "hidden" }}>
            {/* Cabecera con ordenamiento */}
            <div style={{ display: "flex", alignItems: "center", padding: "0 16px", borderBottom: `1px solid ${border}`, background: isDark ? "rgba(255,255,255,0.02)" : NEUTRAL.slate50, height: 38 }}>
              <div style={{ width: 52 + 14, flexShrink: 0 }} />
              {[{ col: "nombre", label: "Nombre", flex: 1 }, { col: "fecha", label: "Fecha", w: 120 }, { col: "tamaño", label: "Tamaño", w: 88 }].map(({ col, label, flex, w }) => {
                const activo = orden.col === col;
                return (
                  <button key={col} onClick={() => toggleOrden(col)}
                    style={{
                      flex, width: w, flexShrink: w ? 0 : undefined,
                      display: "flex", alignItems: "center", gap: 4,
                      background: "none", border: "none", cursor: "pointer", padding: 0,
                      fontSize: 10, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase",
                      color: activo ? ORANGE : (isDark ? "rgba(255,255,255,0.30)" : SLATE[400]),
                      transition: "color 0.14s",
                    }}
                  >
                    {label}
                    {activo
                      ? (orden.dir === "asc" ? <ChevronUp size={11} style={{ color: ORANGE }} /> : <ChevronDown size={11} style={{ color: ORANGE }} />)
                      : <ChevronDown size={11} style={{ opacity: 0.3 }} />
                    }
                  </button>
                );
              })}
              <span style={{ width: 28, flexShrink: 0 }} />
            </div>
            {loading ? (
              <div style={{ display: "flex", justifyContent: "center", padding: "56px 0" }}>
                <svg className="animate-spin" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={ORANGE} strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
              </div>
            ) : filtrados.length === 0 ? (
              <EstadoVacio isDark={isDark} hayFiltro={!!(filtros.busqueda || filtros.categoria)} onSubir={() => { limpiarFiltros(); inputSubidaRef.current?.click(); }} />
            ) : (
              filtrados.map(m => (
                <CardManual
                  key={m.id_manual} m={m} T={T}
                  onVer={(url, nombre) => setVisor({ url, nombre })}
                  onEditar={setModalEditar}
                  onEliminar={setModalElim}
                />
              ))
            )}
          </div>
        )}
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
