/**
 * ConsultaConocimiento.jsx
 *
 * Pantalla de consulta de la base de conocimiento (usuarios y administradores):
 *   - Un solo buscador para artículos de texto y manuales PDF. La búsqueda la
 *     hace el servidor, que también lee el texto DENTRO de los PDF, ignora
 *     acentos y entiende palabras incompletas.
 *   - Filtros por tipo (Todo / Artículos / PDF) y por categoría.
 *   - Sin búsqueda: lista de artículos y cuadrícula de PDF con portada.
 *   - Con búsqueda: resultados por relevancia con el fragmento encontrado
 *     resaltado y, en los PDF, la página (el visor abre en esa página).
 *
 * Props:
 *   T               tokens de tema
 *   onCrearReporte  (opcional) acción "crear reporte" cuando nada sirvió
 *   onEditarArticulo (opcional, admin) abre el editor desde el visor
 *   recarga         (opcional) número que al cambiar vuelve a cargar la lista
 *
 * Endpoints: GET /api/conocimiento, GET /api/conocimiento/buscar
 *
 * @module client/components/Conocimiento/ConsultaConocimiento
 * @exports ConsultaConocimiento (default)
 * @exports DrawerPdf
 * @exports Resaltado
 */
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Download, Eye, X, Clock, FileText, Inbox, Tag, Search, BookOpen, ChevronRight, Send,
} from "lucide-react";
import API, { apiFetch } from '../../services/api-client.js';
import PdfViewer from '../PdfViewer.jsx';
import LogoModal from '../LogoModal.jsx';
import VisorArticulo from './VisorArticulo.jsx';
import { usePdfCover } from '../../hooks/use-pdf-cover.js';
import { useAutoRefresh } from '../../hooks/use-auto-refresh.js';
import { partesResaltadas } from '../../utils/resaltar.js';
import { RADIUS, SLATE } from '../../utils/design-system.js';
import { FS } from '../../utils/tipografia.js';
import { fechaCorta } from '../../utils/fechas.js';

const BRAND = "#F47920";
// SLATE solo define 200-900 sin 100/500/800: se completan aquí.
const S = { ...SLATE, 100: "#F1F5F9", 500: "#64748B", 800: "#1E293B" };
const TIPOS = [
  { id: "todos",    label: "Todo" },
  { id: "articulo", label: "Artículos" },
  { id: "pdf",      label: "Manuales PDF" },
];

/** Texto con las palabras buscadas marcadas. */
export function Resaltado({ texto, q, isDark }) {
  return partesResaltadas(texto, q).map((p, i) => p.marca
    ? <mark key={i} style={{ background: isDark ? "rgba(244,121,32,0.35)" : "rgba(244,121,32,0.22)", color: "inherit", borderRadius: 3, padding: "0 1px" }}>{p.texto}</mark>
    : <span key={i}>{p.texto}</span>);
}

// ── Visor de PDF en panel lateral ─────────────────────────────────
export function DrawerPdf({ manual, T, onClose }) {
  const isDark = T.isDark;
  const pdfUrl = `${API}${manual.url}`;
  useEffect(() => {
    const h = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [onClose]);
  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 300, background: "rgba(0,0,0,0.50)" }} />
      <div role="dialog" aria-modal="true" aria-label={manual.titulo} style={{ position: "fixed", top: 0, right: 0, bottom: 0, zIndex: 301, width: "min(960px,100vw)", display: "flex", flexDirection: "column", background: isDark ? "#0f1117" : "#f8fafc", boxShadow: "-4px 0 32px rgba(0,0,0,0.18)", animation: "kbSlideIn .2s cubic-bezier(.16,1,.3,1)" }}>
        <style>{`@keyframes kbSlideIn{from{transform:translateX(100%)}to{transform:translateX(0)}}`}</style>
        <div style={{ height: 54, padding: "0 16px 0 20px", flexShrink: 0, display: "flex", alignItems: "center", gap: 12, background: "#1e293b" }}>
          <FileText size={15} color="rgba(255,255,255,0.6)" />
          <span style={{ flex: 1, color: "#fff", fontWeight: 600, fontSize: FS.enfasis, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {manual.titulo}{manual.pagina > 1 ? ` · pág. ${manual.pagina}` : ""}
          </span>
          <a href={pdfUrl} download={`${manual.titulo}.pdf`} style={{ height: 30, padding: "0 12px", borderRadius: RADIUS.sm, display: "flex", alignItems: "center", gap: 5, background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.14)", color: "rgba(255,255,255,0.8)", fontSize: FS.cuerpo, fontWeight: 500, textDecoration: "none" }}>
            <Download size={12} /> Descargar
          </a>
          <LogoModal claro alto={18} style={{ marginRight: 4 }} />
          <button type="button" onClick={onClose} aria-label="Cerrar" style={{ width: 30, height: 30, borderRadius: RADIUS.sm, background: "transparent", border: "1px solid rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.6)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <X size={14} />
          </button>
        </div>
        <PdfViewer url={pdfUrl} isDark={isDark} paginaInicial={manual.pagina || 1} />
      </div>
    </>
  );
}

// ── Tarjeta de PDF con portada ────────────────────────────────────
function PdfThumb({ url, isDark }) {
  const ref = useRef(null);
  const { imgSrc, loading } = usePdfCover(url, ref);
  return (
    <div ref={ref} style={{ height: 130, background: isDark ? "#0f1117" : "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, position: "relative", borderBottom: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : S[100]}`, overflow: "hidden" }}>
      {imgSrc ? (
        <img src={imgSrc} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
      ) : loading ? (
        <div style={{ position: "absolute", inset: 0, background: isDark ? "linear-gradient(90deg,#1e2535 25%,#252d42 50%,#1e2535 75%)" : "linear-gradient(90deg,#e2e8f0 25%,#f1f5f9 50%,#e2e8f0 75%)", backgroundSize: "200% 100%", animation: "kbShimmer 1.2s infinite linear" }} />
      ) : (
        <FileText size={28} style={{ color: S[400] }} />
      )}
      <span style={{ position: "absolute", top: 8, right: 8, fontSize: FS.etiqueta, fontWeight: 800, letterSpacing: "0.05em", padding: "2px 6px", borderRadius: 4, background: isDark ? "rgba(244,121,32,0.18)" : "#fff7ed", color: BRAND, border: "1px solid rgba(244,121,32,0.3)" }}>PDF</span>
      <style>{`@keyframes kbShimmer{from{background-position:200% 0}to{background-position:-200% 0}}`}</style>
    </div>
  );
}

function ChipMeta({ icon: Icon, children, isDark, acento }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 3, whiteSpace: "nowrap",
      fontSize: FS.etiqueta, fontWeight: 700, padding: "2px 7px", borderRadius: 99,
      background: acento ? "rgba(244,121,32,0.08)" : (isDark ? "rgba(255,255,255,0.06)" : S[100]),
      color: acento ? BRAND : (isDark ? "rgba(255,255,255,0.45)" : S[500]),
      border: `1px solid ${acento ? "rgba(244,121,32,0.22)" : (isDark ? "rgba(255,255,255,0.10)" : S[200])}`,
    }}>
      {Icon && <Icon size={9} />} {children}
    </span>
  );
}

function CardPdf({ m, T, onVer }) {
  const isDark = T.isDark;
  const pdfUrl = `${API}${m.url}`;
  const [hov, setHov] = useState(false);
  return (
    <div
      role="button" tabIndex={0}
      onClick={() => onVer(m)} onKeyDown={e => { if (e.key === "Enter") onVer(m); }}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ display: "flex", flexDirection: "column", background: isDark ? "#141720" : "#fff", border: `1.5px solid ${hov ? BRAND : (isDark ? "rgba(255,255,255,0.07)" : S[200])}`, borderRadius: 12, overflow: "hidden", boxShadow: hov ? "0 8px 28px rgba(244,121,32,0.13)" : (isDark ? "0 2px 10px rgba(0,0,0,0.3)" : "0 1px 6px rgba(0,0,0,0.06)"), transition: "border-color 0.18s, box-shadow 0.18s", cursor: "pointer" }}
    >
      <PdfThumb url={pdfUrl} isDark={isDark} />
      <div style={{ padding: "12px 14px", flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
        <p style={{ fontSize: FS.cuerpo, fontWeight: 700, lineHeight: 1.4, color: isDark ? "#eef0f2" : S[700], overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", margin: 0 }}>{m.titulo}</p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: "auto" }}>
          {m.nombre_categoria && <ChipMeta icon={Tag} isDark={isDark} acento>{m.nombre_categoria}</ChipMeta>}
          {m.fecha_cambio && <ChipMeta icon={Clock} isDark={isDark}>{fechaCorta(m.fecha_cambio)}</ChipMeta>}
        </div>
      </div>
      <div style={{ padding: "10px 14px", borderTop: `1px solid ${isDark ? "rgba(255,255,255,0.05)" : S[100]}`, display: "flex", gap: 6 }} onClick={e => e.stopPropagation()}>
        <button type="button" onClick={() => onVer(m)} style={{ flex: 1, height: 30, borderRadius: RADIUS.sm, display: "flex", alignItems: "center", justifyContent: "center", gap: 5, background: `linear-gradient(135deg,${BRAND},#d97400)`, color: "#fff", fontSize: FS.secundario, fontWeight: 600, cursor: "pointer", border: "none" }}>
          <Eye size={11} /> Ver
        </button>
        <a href={pdfUrl} download={`${m.titulo}.pdf`} aria-label={`Descargar ${m.titulo}`} style={{ width: 30, height: 30, borderRadius: RADIUS.sm, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", border: `1px solid ${isDark ? "rgba(255,255,255,0.10)" : S[200]}`, color: isDark ? "rgba(255,255,255,0.45)" : S[400] }}>
          <Download size={12} />
        </a>
      </div>
    </div>
  );
}

// ── Fila de artículo o de resultado de búsqueda ───────────────────
function FilaDocumento({ d, q, T, onAbrir }) {
  const isDark = T.isDark;
  const [hov, setHov] = useState(false);
  const esPdf = d.tipo === "pdf";
  const Icon = esPdf ? FileText : BookOpen;
  const texto = q ? d.fragmento : d.resumen;
  return (
    <button
      type="button" onClick={() => onAbrir(d)}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        width: "100%", textAlign: "left", cursor: "pointer", display: "flex", gap: 14, alignItems: "flex-start",
        padding: "14px 16px", borderRadius: 12, background: isDark ? "#141720" : "#fff",
        border: `1.5px solid ${hov ? BRAND : (isDark ? "rgba(255,255,255,0.07)" : S[200])}`,
        boxShadow: hov ? "0 6px 20px rgba(244,121,32,0.10)" : "none", transition: "border-color 0.15s, box-shadow 0.15s",
        fontFamily: "inherit",
      }}
    >
      <span style={{ width: 38, height: 38, flexShrink: 0, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", background: esPdf ? "rgba(220,38,38,0.08)" : "rgba(244,121,32,0.10)", color: esPdf ? "#dc2626" : BRAND }}>
        <Icon size={18} />
      </span>
      <span style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 4 }}>
        <span style={{ fontSize: FS.enfasis, fontWeight: 700, color: isDark ? "#eef0f2" : S[800], lineHeight: 1.35 }}>
          <Resaltado texto={d.titulo} q={q} isDark={isDark} />
        </span>
        {texto && (
          <span style={{ fontSize: FS.cuerpo, color: isDark ? "rgba(255,255,255,0.55)" : S[500], lineHeight: 1.5, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
            <Resaltado texto={texto} q={q} isDark={isDark} />
          </span>
        )}
        <span style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 2 }}>
          <ChipMeta isDark={isDark}>{esPdf ? "Manual PDF" : "Artículo"}</ChipMeta>
          {d.publicado === false && <ChipMeta isDark={isDark} acento>Borrador</ChipMeta>}
          {d.nombre_categoria && <ChipMeta icon={Tag} isDark={isDark} acento>{d.nombre_categoria}</ChipMeta>}
          {esPdf && d.pagina > 0 && <ChipMeta isDark={isDark}>Página {d.pagina}</ChipMeta>}
          {d.fecha_cambio && <ChipMeta icon={Clock} isDark={isDark}>{fechaCorta(d.fecha_cambio)}</ChipMeta>}
        </span>
      </span>
      <ChevronRight size={16} style={{ flexShrink: 0, alignSelf: "center", color: hov ? BRAND : S[400] }} />
    </button>
  );
}

function Encabezado({ titulo, total, isDark }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{ width: 3, height: 14, borderRadius: 99, background: `linear-gradient(180deg,${BRAND},#d97400)` }} />
      <h2 style={{ margin: 0, fontSize: FS.secundario, fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", color: isDark ? "rgba(255,255,255,0.5)" : S[600] }}>{titulo}</h2>
      <span style={{ fontSize: FS.etiqueta, fontWeight: 700, padding: "1px 7px", borderRadius: 99, background: "rgba(244,121,32,0.10)", color: BRAND, border: "1px solid rgba(244,121,32,0.22)" }}>{total}</span>
    </div>
  );
}

function Vacio({ titulo, detalle, isDark, accion }) {
  const borde = isDark ? "rgba(255,255,255,0.07)" : S[200];
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "48px 20px", gap: 12, background: isDark ? "#141720" : "#fff", border: `1px solid ${borde}`, borderRadius: 12, textAlign: "center" }}>
      <div style={{ width: 52, height: 52, borderRadius: 12, background: isDark ? "rgba(255,255,255,0.04)" : "#f1f5f9", border: `1px solid ${borde}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Inbox size={24} style={{ color: isDark ? "rgba(255,255,255,0.25)" : S[400] }} />
      </div>
      <p style={{ fontSize: FS.subtitulo, fontWeight: 700, color: isDark ? "rgba(255,255,255,0.55)" : S[600], margin: 0 }}>{titulo}</p>
      {detalle && <p style={{ fontSize: FS.cuerpo, color: isDark ? "rgba(255,255,255,0.35)" : S[400], margin: 0, maxWidth: 420 }}>{detalle}</p>}
      {accion}
    </div>
  );
}

// ── Componente principal ──────────────────────────────────────────
export default function ConsultaConocimiento({ T, onCrearReporte, onEditarArticulo, recarga = 0 }) {
  const isDark = T.isDark;
  const [items, setItems] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [q, setQ] = useState("");
  const [tipo, setTipo] = useState("todos");
  const [categoria, setCategoria] = useState("");
  const [resultados, setResultados] = useState([]);
  const [buscando, setBuscando] = useState(false);
  const [errorBusqueda, setErrorBusqueda] = useState(false);
  const [articuloAbierto, setArticuloAbierto] = useState(null);
  const [pdfAbierto, setPdfAbierto] = useState(null);
  const peticion = useRef(0);

  const cargar = () => {
    apiFetch("/api/conocimiento")
      .then(r => r.ok ? r.json() : Promise.reject(new Error(String(r.status))))
      .then(d => { setItems(Array.isArray(d) ? d : []); setErrorCarga(false); })
      .catch(() => setErrorCarga(true))
      .finally(() => setCargando(false));
  };
  useAutoRefresh(cargar, 300000);
  useEffect(() => { if (recarga) cargar(); }, [recarga]);

  // La búsqueda espera a que el usuario deje de escribir.
  useEffect(() => {
    const t = setTimeout(() => setQ(busqueda.trim()), 300);
    return () => clearTimeout(t);
  }, [busqueda]);

  useEffect(() => {
    if (!q) { setResultados([]); setBuscando(false); setErrorBusqueda(false); return; }
    const n = ++peticion.current;
    setBuscando(true);
    const params = new URLSearchParams({ q, tipo, limite: "40" });
    if (categoria) params.set("categoria", categoria);
    apiFetch(`/api/conocimiento/buscar?${params}`)
      .then(r => r.ok ? r.json() : Promise.reject(new Error(String(r.status))))
      .then(d => { if (n === peticion.current) { setResultados(d.resultados ?? []); setErrorBusqueda(false); } })
      .catch(() => { if (n === peticion.current) { setResultados([]); setErrorBusqueda(true); } })
      .finally(() => { if (n === peticion.current) setBuscando(false); });
  }, [q, tipo, categoria, recarga]);

  const categorias = useMemo(() => [...new Map(
    items.filter(d => d.nombre_categoria).map(d => [d.id_categoria, { id: d.id_categoria, nombre: d.nombre_categoria }])
  ).values()].sort((a, b) => a.nombre.localeCompare(b.nombre)), [items]);

  const filtrados = items.filter(d => (tipo === "todos" || d.tipo === tipo) && (!categoria || String(d.id_categoria) === categoria));
  const articulos = filtrados.filter(d => d.tipo === "articulo");
  const pdfs = filtrados.filter(d => d.tipo === "pdf");
  const totalArt = items.filter(d => d.tipo === "articulo").length;
  const totalPdf = items.filter(d => d.tipo === "pdf").length;

  const abrir = (d) => d.tipo === "pdf" ? setPdfAbierto(d) : setArticuloAbierto(d.id);
  const hayFiltros = busqueda || categoria || tipo !== "todos";
  const limpiar = () => { setBusqueda(""); setQ(""); setCategoria(""); setTipo("todos"); };
  const borde = isDark ? "rgba(255,255,255,0.07)" : S[200];

  const botonReporte = onCrearReporte && (
    <button type="button" onClick={onCrearReporte} style={{ marginTop: 4, height: 38, padding: "0 18px", borderRadius: RADIUS.sm, border: "none", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 8, background: `linear-gradient(135deg,${BRAND},#d97400)`, color: "#fff", fontSize: FS.cuerpo, fontWeight: 700 }}>
      <Send size={14} /> Crear un reporte a Soporte
    </button>
  );

  const chip = (activo, onClick, texto, key) => (
    <button key={key} type="button" onClick={onClick} aria-pressed={activo} style={{
      padding: "5px 13px", borderRadius: 99, fontSize: FS.secundario, fontWeight: 700, cursor: "pointer", transition: "all 0.15s",
      background: activo ? BRAND : (isDark ? "rgba(255,255,255,0.06)" : "#fff"),
      color: activo ? "#fff" : (isDark ? "rgba(255,255,255,0.6)" : S[500]),
      border: `1.5px solid ${activo ? BRAND : (isDark ? "rgba(255,255,255,0.12)" : S[200])}`,
    }}>{texto}</button>
  );

  return (
    <div style={{ background: T.bg, minHeight: "100%", fontFamily: "'Inter','Segoe UI',sans-serif" }}>
      {/* ── Buscador ─────────────────────────────────────────── */}
      <div style={{ background: isDark ? "linear-gradient(160deg,#0b0e16 0%,#161c2b 100%)" : "linear-gradient(160deg,#f8fafc 0%,#fff4ec 100%)", borderBottom: `1px solid ${borde}`, padding: "32px 16px 28px" }}>
        <div style={{ maxWidth: 700, margin: "0 auto", display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
          <div style={{ textAlign: "center" }}>
            <p style={{ fontSize: FS.etiqueta, fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", color: isDark ? "rgba(255,255,255,0.4)" : S[400], margin: "0 0 6px" }}>Base de conocimiento</p>
            <h1 style={{ fontSize: FS.titulo, fontWeight: 800, color: isDark ? "#fff" : S[900], margin: 0, lineHeight: 1.2 }}>¿En qué podemos ayudarte hoy?</h1>
            <p style={{ fontSize: FS.enfasis, color: isDark ? "rgba(255,255,255,0.45)" : S[500], marginTop: 6 }}>
              {cargando ? "Cargando…" : `${totalArt} ${totalArt === 1 ? "artículo" : "artículos"} · ${totalPdf} ${totalPdf === 1 ? "manual PDF" : "manuales PDF"}`}
            </p>
          </div>

          <div style={{ width: "100%", maxWidth: 560, position: "relative", background: isDark ? "rgba(255,255,255,0.06)" : "#fff", border: `1.5px solid ${busqueda ? BRAND : borde}`, borderRadius: 10, boxShadow: busqueda ? "0 0 0 4px rgba(244,121,32,0.11), 0 4px 20px rgba(0,0,0,0.08)" : "0 4px 20px rgba(0,0,0,0.07)", transition: "all 0.2s" }}>
            <Search size={16} style={{ position: "absolute", left: 15, top: "50%", transform: "translateY(-50%)", color: busqueda ? BRAND : S[400], pointerEvents: "none" }} />
            <input
              type="search" value={busqueda} onChange={e => setBusqueda(e.target.value)}
              placeholder="Describe tu problema: «no imprime», «contraseña del correo»…"
              aria-label="Buscar en la base de conocimiento"
              style={{ width: "100%", background: "transparent", border: "none", outline: "none", padding: "13px 42px 13px 44px", fontSize: FS.subtitulo, color: isDark ? "#fff" : S[700], fontFamily: "inherit" }}
            />
            {busqueda && (
              <button type="button" onClick={() => setBusqueda("")} aria-label="Borrar búsqueda" style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: S[400], display: "flex", padding: 2 }}>
                <X size={14} />
              </button>
            )}
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, justifyContent: "center" }}>
            {TIPOS.map(t => chip(tipo === t.id, () => setTipo(t.id), t.label, t.id))}
          </div>
          {categorias.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, justifyContent: "center" }}>
              {[{ id: "", nombre: "Todas las categorías" }, ...categorias].map(c =>
                chip(categoria === String(c.id), () => setCategoria(categoria === String(c.id) ? "" : String(c.id)), c.nombre, `c${c.id}`))}
            </div>
          )}
        </div>
      </div>

      {/* ── Contenido ────────────────────────────────────────── */}
      <div style={{ maxWidth: 1000, margin: "0 auto", padding: "24px 16px", display: "flex", flexDirection: "column", gap: 24 }}>
        {hayFiltros && (
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: -12 }}>
            <button type="button" onClick={limpiar} style={{ fontSize: FS.secundario, fontWeight: 600, color: isDark ? "rgba(255,255,255,0.45)" : S[500], background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
              <X size={11} /> Limpiar filtros
            </button>
          </div>
        )}

        {cargando ? (
          <div style={{ display: "flex", justifyContent: "center", padding: "60px 0" }}>
            <svg className="animate-spin" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={BRAND} strokeWidth="2.5"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
          </div>
        ) : errorCarga && !items.length ? (
          <Vacio isDark={isDark} titulo="No se pudo cargar la base de conocimiento" detalle="Revisa tu conexión e intenta de nuevo en unos momentos." />
        ) : q ? (
          <section style={{ display: "flex", flexDirection: "column", gap: 12 }} aria-live="polite">
            <Encabezado titulo={buscando ? "Buscando…" : "Resultados"} total={resultados.length} isDark={isDark} />
            {errorBusqueda ? (
              <Vacio isDark={isDark} titulo="No se pudo buscar" detalle="Revisa tu conexión e intenta de nuevo." />
            ) : !buscando && resultados.length === 0 ? (
              <Vacio isDark={isDark} titulo="No encontramos nada sobre eso"
                detalle={`Prueba con otras palabras (por ejemplo, el nombre del equipo o del programa)${onCrearReporte ? " o crea un reporte y Soporte te ayudará." : "."}`}
                accion={botonReporte} />
            ) : (
              resultados.map(d => <FilaDocumento key={`${d.tipo}-${d.id}`} d={d} q={q} T={T} onAbrir={abrir} />)
            )}
          </section>
        ) : (
          <>
            {tipo !== "pdf" && (
              <section style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <Encabezado titulo="Artículos" total={articulos.length} isDark={isDark} />
                {articulos.length === 0
                  ? <Vacio isDark={isDark} titulo="Aún no hay artículos" detalle="Soporte Técnico irá publicando guías paso a paso aquí." />
                  : articulos.map(d => <FilaDocumento key={`a-${d.id}`} d={d} q="" T={T} onAbrir={abrir} />)}
              </section>
            )}
            {tipo !== "articulo" && (
              <section style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <Encabezado titulo="Manuales PDF" total={pdfs.length} isDark={isDark} />
                {pdfs.length === 0
                  ? <Vacio isDark={isDark} titulo="No hay manuales PDF" />
                  : (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(190px, 100%), 1fr))", gap: 16 }}>
                      {pdfs.map(m => <CardPdf key={`p-${m.id}`} m={m} T={T} onVer={setPdfAbierto} />)}
                    </div>
                  )}
              </section>
            )}
          </>
        )}
      </div>

      {articuloAbierto && (
        <VisorArticulo
          id={articuloAbierto} T={T}
          onClose={() => setArticuloAbierto(null)}
          onCrearReporte={onCrearReporte ? () => { setArticuloAbierto(null); onCrearReporte(); } : undefined}
          onEditar={onEditarArticulo ? (a) => { setArticuloAbierto(null); onEditarArticulo(a); } : undefined}
        />
      )}
      {pdfAbierto && <DrawerPdf manual={pdfAbierto} T={T} onClose={() => setPdfAbierto(null)} />}
    </div>
  );
}
