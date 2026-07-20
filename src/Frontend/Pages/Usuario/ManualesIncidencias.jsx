import { useState } from "react";
import PdfViewer from "../../Components/PdfViewer";
import { useNavigate } from "react-router-dom";
import {
  Download, Eye, X, Clock,
  FileText, Inbox, Tag, Search,
  HardDrive, Wifi, Monitor, Cpu, Settings,
} from "lucide-react";
import API, { apiFetch } from "../../Config/api";
import { RADIUS, SLATE } from "../../Config/DesignSystem";
import { usePdfCover } from "../../Components/hooks/usePdfCover";
import { useAutoRefresh } from "../../Config/useAutoRefresh";

const BRAND = "#F47920";

// ── Categorías ────────────────────────────────────────────────────
const CAT_MAP = {
  hardware: { Icon: HardDrive, color: "#ea580c", bg: "rgba(234,88,12,0.08)",  border: "rgba(234,88,12,0.18)" },
  redes:    { Icon: Wifi,      color: "#2563eb", bg: "rgba(37,99,235,0.08)",  border: "rgba(37,99,235,0.18)" },
  software: { Icon: Monitor,   color: "#16a34a", bg: "rgba(22,163,74,0.08)",  border: "rgba(22,163,74,0.18)" },
  sistema:  { Icon: Cpu,       color: "#7c3aed", bg: "rgba(124,58,237,0.08)", border: "rgba(124,58,237,0.18)" },
  default:  { Icon: Settings,  color: BRAND,     bg: "rgba(244,121,32,0.08)", border: "rgba(244,121,32,0.18)" },
};
function getCatKey(nombre = "") {
  const n = nombre.toLowerCase();
  if (n.includes("hardware") || n.includes("pc") || n.includes("equipo")) return "hardware";
  if (n.includes("red")  || n.includes("wifi") || n.includes("internet"))  return "redes";
  if (n.includes("software") || n.includes("aplicac"))                     return "software";
  if (n.includes("sistema")  || n.includes("os"))                          return "sistema";
  return "default";
}

// ── Drawer visor PDF con <iframe> ─────────────────────────────────
function DrawerVisor({ manual, T, onClose }) {
  const isDark = T.isDark;
  const pdfUrl = `${API}${manual.url}`;
  const nombre = manual.nombre;
  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 300, background: "rgba(0,0,0,0.50)" }} />
      <div style={{ position: "fixed", top: 0, right: 0, bottom: 0, zIndex: 301, width: "min(960px,96vw)", display: "flex", flexDirection: "column", background: isDark ? "#0f1117" : "#f8fafc", boxShadow: "-4px 0 32px rgba(0,0,0,0.18)", animation: "slideIn .2s cubic-bezier(.16,1,.3,1)" }}>
        <style>{`@keyframes slideIn{from{transform:translateX(100%)}to{transform:translateX(0)}}`}</style>
        <div style={{ height: 54, padding: "0 20px", flexShrink: 0, display: "flex", alignItems: "center", gap: 12, background: "#1e293b", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          <FileText size={15} color="rgba(255,255,255,0.6)" />
          <span style={{ flex: 1, color: "#fff", fontWeight: 600, fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{nombre}</span>
          <a href={pdfUrl} download={nombre} style={{ height: 30, padding: "0 12px", borderRadius: RADIUS.sm, display: "flex", alignItems: "center", gap: 5, background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.14)", color: "rgba(255,255,255,0.8)", fontSize: 12, fontWeight: 500, textDecoration: "none" }}>
            <Download size={12} /> Descargar
          </a>
          <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: RADIUS.sm, background: "transparent", border: "1px solid rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.5)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <X size={14} />
          </button>
        </div>
        <PdfViewer url={pdfUrl} isDark={isDark} />
      </div>
    </>
  );
}

// ── Miniatura portada PDF ─────────────────────────────────────────
function PdfThumb({ url, isDark }) {
  const { imgSrc, loading, error } = usePdfCover(url);
  const ck  = "default";
  const def = CAT_MAP[ck];
  return (
    <div style={{
      height: 130, background: isDark ? "#0f1117" : "#f1f5f9",
      display: "flex", alignItems: "center", justifyContent: "center",
      flexShrink: 0, position: "relative",
      borderBottom: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : SLATE[100]}`,
      overflow: "hidden",
    }}>
      {imgSrc ? (
        <img src={imgSrc} alt="portada" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
      ) : (
        <div style={{
          width: 72, height: 94, borderRadius: 4,
          background: isDark ? "#1e2535" : "#fff",
          border: `1px solid ${isDark ? "rgba(255,255,255,0.10)" : SLATE[200]}`,
          boxShadow: "0 4px 16px rgba(0,0,0,0.15)",
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6,
        }}>
          <FileText size={18} style={{ color: error ? "#dc2626" : SLATE[400] }} />
          {!loading && <span style={{ fontSize: "7px", fontWeight: 700, color: "#dc2626" }}>PDF</span>}
        </div>
      )}
      <span style={{
        position: "absolute", top: 8, right: 8,
        fontSize: 9, fontWeight: 800, letterSpacing: "0.05em",
        padding: "2px 6px", borderRadius: 4,
        background: isDark ? "rgba(244,121,32,0.18)" : "#fff7ed",
        color: BRAND, border: `1px solid rgba(244,121,32,0.3)`,
      }}>
        PDF
      </span>
    </div>
  );
}

// ── Tarjeta de manual ─────────────────────────────────────────────
function CardManual({ m, T, onVer }) {
  const isDark = T.isDark;
  const pdfUrl = `${API}${m.url}`;
  const fecha  = m.fecha_cambio
    ? new Date(m.fecha_cambio).toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" })
    : null;
  const ck  = getCatKey(m.nombre_categoria);
  const def = CAT_MAP[ck];
  const [hov, setHov] = useState(false);

  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: "flex", flexDirection: "column",
        background: isDark ? "#141720" : "#fff",
        border: `1.5px solid ${hov ? BRAND : (isDark ? "rgba(255,255,255,0.07)" : SLATE[200])}`,
        borderRadius: 12, overflow: "hidden",
        boxShadow: hov
          ? `0 8px 28px rgba(244,121,32,0.13)`
          : (isDark ? "0 2px 10px rgba(0,0,0,0.3)" : "0 1px 6px rgba(0,0,0,0.06)"),
        transition: "border-color 0.18s, box-shadow 0.18s",
        cursor: "pointer",
      }}
      onClick={() => onVer(m)}
    >
      <PdfThumb url={pdfUrl} isDark={isDark} />

      {/* Info */}
      <div style={{ padding: "12px 14px", flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
        <p style={{
          fontSize: 12, fontWeight: 700, lineHeight: 1.4,
          color: isDark ? "#eef0f2" : SLATE[700],
          overflow: "hidden", display: "-webkit-box",
          WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
          margin: 0,
        }}>
          {m.nombre.replace(/\.pdf$/i, "")}
        </p>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: "auto", alignItems: "center" }}>
          {m.nombre_categoria && (
            <span style={{
              display: "inline-flex", alignItems: "center", gap: 3,
              fontSize: 9, fontWeight: 700, padding: "2px 7px", borderRadius: 99,
              background: def.bg, color: def.color, border: `1px solid ${def.border}`,
            }}>
              <Tag size={7} /> {m.nombre_categoria}
            </span>
          )}
          {fecha && (
            <span style={{
              display: "inline-flex", alignItems: "center", gap: 3,
              fontSize: 9, fontWeight: 700, padding: "2px 7px", borderRadius: 99,
              background: isDark ? "rgba(255,255,255,0.06)" : SLATE[100],
              color: isDark ? "rgba(255,255,255,0.38)" : SLATE[400],
              border: `1px solid ${isDark ? "rgba(255,255,255,0.10)" : SLATE[200]}`,
            }}>
              <Clock size={7} /> {fecha}
            </span>
          )}
        </div>
      </div>

      {/* Acciones */}
      <div style={{
        padding: "10px 14px",
        borderTop: `1px solid ${isDark ? "rgba(255,255,255,0.05)" : SLATE[100]}`,
        display: "flex", gap: 6,
      }}
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={() => onVer(m)}
          style={{
            flex: 1, height: 30, borderRadius: RADIUS.sm,
            display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
            background: `linear-gradient(135deg,${BRAND},#d97400)`,
            color: "#fff", fontSize: 11, fontWeight: 600, cursor: "pointer",
            border: "none",
          }}
        >
          <Eye size={11} /> Ver
        </button>
        <a
          href={pdfUrl} download={m.nombre}
          style={{
            width: 30, height: 30, borderRadius: RADIUS.sm, flexShrink: 0,
            display: "flex", alignItems: "center", justifyContent: "center",
            border: `1px solid ${isDark ? "rgba(255,255,255,0.10)" : SLATE[200]}`,
            color: isDark ? "rgba(255,255,255,0.38)" : SLATE[400],
            textDecoration: "none",
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = BRAND; e.currentTarget.style.color = BRAND; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = isDark ? "rgba(255,255,255,0.10)" : SLATE[200]; e.currentTarget.style.color = isDark ? "rgba(255,255,255,0.38)" : SLATE[400]; }}
        >
          <Download size={12} />
        </a>
      </div>
    </div>
  );
}

// ── Componente principal ──────────────────────────────────────────
export default function ManualesIncidencias({ T }) {
  const [manuales,   setManuales]   = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [busqueda,   setBusqueda]   = useState("");
  const [categoria,  setCategoria]  = useState("");
  const [drawer,     setDrawer]     = useState(null);
  const [dragging,   setDragging]   = useState(false);
  const navigate = useNavigate();
  const isDark = T.isDark;

  const cargar = () => {
    apiFetch("/api/manuales")
      .then(r => r.json())
      .then(d => setManuales(Array.isArray(d) ? d : []))
      .catch(() => setManuales([]))
      .finally(() => setLoading(false));
  };

  useAutoRefresh(cargar, 30000);

  const categorias = [...new Map(
    manuales.filter(m => m.nombre_categoria)
      .map(m => [m.id_categoria, { id: m.id_categoria, nombre: m.nombre_categoria }])
  ).values()];

  const limpiarFiltros = () => { setBusqueda(""); setCategoria(""); };

  const filtrados = manuales.filter(m => {
    const q = busqueda.toLowerCase();
    return (!busqueda || m.nombre.toLowerCase().includes(q) ||
      m.nombre_categoria?.toLowerCase().includes(q) ||
      m.descripcion?.toLowerCase().includes(q))
      && (!categoria || String(m.id_categoria) === categoria);
  });

  const surf   = isDark ? "#141720" : "#fff";
  const border = isDark ? "rgba(255,255,255,0.07)" : SLATE[200];

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith("image/"));
    if (!files.length) return;
    const evidencias = files.slice(0, 8).map(file => ({ src: URL.createObjectURL(file), name: file.name, file }));
    navigate("/usuario/nuevo", { state: { evidencias } });
  };

  return (
    <div
      style={{ background: T.bg, minHeight: "100%", fontFamily: "'Inter','Segoe UI',sans-serif" }}
      onDragOver={e => { e.preventDefault(); setDragging(true); }}
      onDragEnter={e => { e.preventDefault(); setDragging(true); }}
      onDragLeave={e => { if (!e.currentTarget.contains(e.relatedTarget)) setDragging(false); }}
      onDrop={handleDrop}
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
          <p style={{ fontSize: 20, fontWeight: 900, color: "#F47920", margin: 0 }}>Suelta las imágenes</p>
          <p style={{ fontSize: 13, color: isDark ? "rgba(255,255,255,0.5)" : "#64748b", margin: 0 }}>Se abrirá Nuevo Reporte con las fotos adjuntas</p>
        </div>
      )}

      {/* ── HERO ─────────────────────────────────────────────── */}
      <div style={{
        background: isDark
          ? "linear-gradient(160deg,#0b0e16 0%,#161c2b 100%)"
          : "linear-gradient(160deg,#f8fafc 0%,#fff4ec 100%)",
        borderBottom: `1px solid ${border}`,
        padding: "36px 24px 32px",
      }}>
        <div style={{ maxWidth: 700, margin: "0 auto", display: "flex", flexDirection: "column", alignItems: "center", gap: 18 }}>

          {/* Branding */}
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <img
              src={isDark ? "/assets/img/logo%20blanco.png" : "/assets/img/logo%20negro.png"}
              alt="Precision Truck Parts"
              style={{ height: 48, objectFit: "contain", flexShrink: 0 }}
            />
            <div style={{ width: 1, height: 40, background: isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.10)", flexShrink: 0 }} />
            <div>
              <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", color: isDark ? "rgba(255,255,255,0.32)" : SLATE[400] }}>
                Precision Truck Parts
              </p>
              <p style={{ fontSize: 13, fontWeight: 700, color: isDark ? "rgba(255,255,255,0.58)" : SLATE[600] }}>
                Centro de Conocimientos
              </p>
            </div>
          </div>

          <div style={{ textAlign: "center" }}>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: isDark ? "#fff" : SLATE[900], margin: 0, lineHeight: 1.2 }}>
              ¿En qué podemos ayudarte hoy?
            </h1>
            <p style={{ fontSize: 13, color: isDark ? "rgba(255,255,255,0.35)" : SLATE[400], marginTop: 6 }}>
              {manuales.length} manuales técnicos disponibles
            </p>
          </div>

          {/* Buscador hero */}
          <div style={{
            width: "100%", maxWidth: 520, position: "relative",
            background: isDark ? "rgba(255,255,255,0.06)" : "#fff",
            border: `1.5px solid ${busqueda ? BRAND : border}`,
            borderRadius: 10,
            boxShadow: busqueda
              ? `0 0 0 4px rgba(244,121,32,0.11), 0 4px 20px rgba(0,0,0,0.08)`
              : "0 4px 20px rgba(0,0,0,0.07)",
            transition: "all 0.2s",
          }}>
            <Search size={16} style={{
              position: "absolute", left: 15, top: "50%", transform: "translateY(-50%)",
              color: busqueda ? BRAND : SLATE[400], pointerEvents: "none",
            }} />
            <input
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              placeholder="Buscar manual..."
              style={{
                width: "100%", background: "transparent", border: "none", outline: "none",
                padding: "13px 42px 13px 44px",
                fontSize: 14, color: isDark ? "#fff" : SLATE[700],
                fontFamily: "'Inter','Segoe UI',sans-serif",
              }}
            />
            {busqueda && (
              <button onClick={() => setBusqueda("")} style={{
                position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
                background: "none", border: "none", cursor: "pointer",
                color: SLATE[400], display: "flex", padding: 2,
              }}>
                <X size={13} />
              </button>
            )}
          </div>

          {/* Chips de categoría */}
          {!loading && categorias.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, justifyContent: "center" }}>
              {[{ id: "", nombre: "Todas" }, ...categorias].map(c => {
                const active = categoria === String(c.id);
                return (
                  <button
                    key={c.id}
                    onClick={() => setCategoria(active ? "" : String(c.id))}
                    style={{
                      padding: "5px 13px", borderRadius: 99, fontSize: 11, fontWeight: 700,
                      cursor: "pointer", transition: "all 0.15s",
                      background: active ? BRAND : (isDark ? "rgba(255,255,255,0.06)" : "#fff"),
                      color: active ? "#fff" : (isDark ? "rgba(255,255,255,0.55)" : SLATE[500]),
                      border: `1.5px solid ${active ? BRAND : (isDark ? "rgba(255,255,255,0.12)" : SLATE[200])}`,
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

        {/* Encabezado resultados */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 3, height: 14, borderRadius: 99, background: `linear-gradient(180deg,${BRAND},#d97400)` }} />
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", color: isDark ? "rgba(255,255,255,0.42)" : SLATE[600] }}>
              {busqueda || categoria ? "Resultados" : "Documentos disponibles"}
            </span>
            <span style={{
              fontSize: 10, fontWeight: 700, padding: "1px 7px", borderRadius: 99,
              background: isDark ? "rgba(244,121,32,0.14)" : "rgba(244,121,32,0.08)",
              color: BRAND, border: "1px solid rgba(244,121,32,0.22)",
            }}>
              {filtrados.length}
            </span>
          </div>
          {(busqueda || categoria) && (
            <button onClick={limpiarFiltros} style={{
              fontSize: 11, fontWeight: 600, color: isDark ? "rgba(255,255,255,0.35)" : SLATE[400],
              background: "none", border: "none", cursor: "pointer",
              display: "flex", alignItems: "center", gap: 4,
            }}>
              <X size={10} /> Limpiar
            </button>
          )}
        </div>

        {/* Grid de tarjetas */}
        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: "60px 0" }}>
            <svg className="animate-spin" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={BRAND} strokeWidth="2.5">
              <path d="M21 12a9 9 0 1 1-6.219-8.56" />
            </svg>
          </div>
        ) : filtrados.length === 0 ? (
          <div style={{
            display: "flex", flexDirection: "column", alignItems: "center",
            padding: "60px 20px", gap: 12,
            background: surf, border: `1px solid ${border}`,
            borderRadius: 12,
          }}>
            <div style={{
              width: 52, height: 52, borderRadius: 12,
              background: isDark ? "rgba(255,255,255,0.04)" : "#f1f5f9",
              border: `1px solid ${border}`,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Inbox size={24} style={{ color: isDark ? "rgba(255,255,255,0.18)" : SLATE[400] }} />
            </div>
            <p style={{ fontSize: 14, fontWeight: 700, color: isDark ? "rgba(255,255,255,0.42)" : SLATE[600], margin: 0 }}>
              {filtros.busqueda || filtros.categoria ? "Sin resultados" : "No hay manuales disponibles"}
            </p>
            <p style={{ fontSize: 12, color: isDark ? "rgba(255,255,255,0.22)" : SLATE[400], textAlign: "center", margin: 0 }}>
              {busqueda ? `No se encontraron coincidencias para "${busqueda}"` : "Pronto habrá contenido disponible aquí"}
            </p>
          </div>
        ) : (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(190px, 1fr))",
            gap: 16,
          }}>
            {filtrados.map((m, i) => (
              <CardManual key={m.id_manual ?? i} m={m} T={T} onVer={setDrawer} />
            ))}
          </div>
        )}
      </div>

      {drawer && <DrawerVisor manual={drawer} T={T} onClose={() => setDrawer(null)} />}
    </div>
  );
}
