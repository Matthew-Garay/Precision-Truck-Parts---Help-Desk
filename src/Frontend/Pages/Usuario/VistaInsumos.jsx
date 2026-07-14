import { useState, useEffect } from "react";
import { Package, AlertTriangle, CheckCircle2, XCircle, Inbox, Tag, Hash, LayoutGrid, List } from "lucide-react";
import { apiFetch } from "../../Config/api";
import API_BASE from "../../Config/api";
import FiltrosToolbar from "../../Components/FiltrosToolbar";
import { useCardStyles } from "../../Components/Card";
import StockBar from "../../Components/StockBar";
import { useTheme } from "../../Config/themeContext.js";
import ModalDetalleInsumo from "../../Components/Inventario/ModalDetalleInsumo";

const ESTADO_OPTS = ["Excelente", "Bueno", "Regular", "Malo"];
const ESTADO_META = {
  "Excelente": { color: "#16a34a", bg: "rgba(22,163,74,0.12)",   border: "rgba(22,163,74,0.3)"   },
  "Bueno":     { color: "#3b82f6", bg: "rgba(59,130,246,0.12)",  border: "rgba(59,130,246,0.3)"  },
  "Regular":   { color: "#ca8a04", bg: "rgba(202,138,4,0.12)",   border: "rgba(202,138,4,0.3)"   },
  "Malo":      { color: "#dc2626", bg: "rgba(220,38,38,0.12)",   border: "rgba(220,38,38,0.3)"   },
};

function BadgeEstado({ estado }) {
  const s = ESTADO_META[estado] || { color: "#94a3b8", bg: "rgba(148,163,184,0.12)", border: "rgba(148,163,184,0.3)" };
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: "4px",
      padding: "2px 8px", borderRadius: "99px",
      fontSize: "11px", fontWeight: 600, whiteSpace: "nowrap",
      background: s.bg, color: s.color, border: `1px solid ${s.border}`,
    }}>
      <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: s.color, flexShrink: 0 }} />
      {estado || "—"}
    </span>
  );
}

function ToggleView({ view, onChange }) {
  const { T } = useTheme();
  const isDark = T.isDark;
  const btn = (v, Icon, title) => {
    const active = view === v;
    return (
      <button onClick={() => onChange(v)} title={title} style={{
        display: "flex", alignItems: "center", justifyContent: "center",
        width: "26px", height: "26px", borderRadius: "5px", border: "none",
        cursor: "pointer", transition: "background 0.15s",
        background: active ? (isDark ? "rgba(244,121,32,0.2)" : "rgba(244,121,32,0.12)") : "transparent",
        color: active ? T.orange : T.textFaint,
      }}>
        <Icon size={13} />
      </button>
    );
  };
  return (
    <div style={{
      display: "flex", gap: "2px", padding: "2px", borderRadius: "6px",
      background: isDark ? "rgba(255,255,255,0.05)" : T.surfaceAlt,
      border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : T.border}`,
    }}>
      {btn("cards", LayoutGrid, "Vista tarjetas")}
      {btn("table", List, "Vista tabla")}
    </div>
  );
}

// ── Tarjeta ────────────────────────────────────────────────────
function TarjetaInsumo({ i, onClick }) {
  const { T } = useTheme();
  const isDark = T.isDark;
  const [hover, setHover] = useState(false);
  const [imgError, setImgError] = useState(false);
  const estadoMeta = ESTADO_META[i.estado] || { color: "#94a3b8" };
  const imgSrc = i.imagen_url && !imgError ? `${API_BASE}${i.imagen_url}` : null;

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: isDark ? "#141720" : T.surface,
        border: `1px solid ${hover ? estadoMeta.color + "70" : (isDark ? "rgba(255,255,255,0.08)" : T.border)}`,
        borderRadius: "8px",
        boxShadow: hover
          ? (isDark ? "0 4px 14px rgba(0,0,0,0.4)" : "0 3px 12px rgba(0,0,0,0.09)")
          : (isDark ? "0 1px 3px rgba(0,0,0,0.25)" : "none"),
        transition: "border-color 0.15s, box-shadow 0.15s",
        overflow: "hidden", display: "flex", flexDirection: "column",
        cursor: "pointer",
      }}
    >
      <div style={{ height: "2px", background: estadoMeta.color, flexShrink: 0 }} />
      {imgSrc ? (
        <div style={{ width: "100%", height: "90px", overflow: "hidden", flexShrink: 0, background: isDark ? "rgba(255,255,255,0.03)" : T.surfaceAlt }}>
          <img src={imgSrc} alt={i.nombre} onError={() => setImgError(true)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        </div>
      ) : null}
      <div style={{ padding: "14px", display: "flex", flexDirection: "column", gap: "10px", flex: 1 }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: "8px" }}>
          {!imgSrc && (
            <div style={{ width: "30px", height: "30px", borderRadius: "6px", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: isDark ? "rgba(244,121,32,0.10)" : "#fff7ed", border: "1px solid rgba(244,121,32,0.20)" }}>
              <Package size={14} style={{ color: T.orange }} />
            </div>
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ margin: 0, fontSize: "13px", fontWeight: 700, color: T.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", lineHeight: "1.3" }}>{i.nombre}</p>
            <p style={{ margin: 0, fontSize: "11px", color: T.textMuted, marginTop: "2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {[i.marca, i.modelo].filter(Boolean).join(" · ") || <em style={{ opacity: 0.5 }}>Sin marca</em>}
            </p>
          </div>
          <BadgeEstado estado={i.estado} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
            <Tag size={10} style={{ color: T.textFaint, flexShrink: 0 }} />
            <span style={{ fontSize: "11px", fontWeight: 600, color: T.textMuted, background: isDark ? "rgba(255,255,255,0.05)" : T.surfaceAlt, border: `1px solid ${isDark ? "rgba(255,255,255,0.07)" : T.border}`, borderRadius: "3px", padding: "1px 6px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {i.nombre_categoria || "Sin categoría"}
            </span>
          </div>
          {i.num_serie && (
            <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
              <Hash size={10} style={{ color: T.textFaint, flexShrink: 0 }} />
              <span style={{ fontSize: "11px", fontFamily: "monospace", color: T.textFaint }}>{i.num_serie}</span>
            </div>
          )}
        </div>
        <div style={{ borderTop: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : T.border}`, paddingTop: "7px" }}>
          <span style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: T.textFaint, display: "block", marginBottom: "5px" }}>Stock</span>
          <StockBar stock={i.stock ?? 0} isDark={isDark} />
        </div>
      </div>
    </div>
  );
}

// ── Tabla ──────────────────────────────────────────────────────
function TablaInsumos({ filtrados, onSelect }) {
  const { T } = useTheme();
  const isDark = T.isDark;
  const [hoverRow, setHoverRow] = useState(null);

  const thBase = {
    padding: "8px 10px", fontSize: "10px", fontWeight: 700,
    textTransform: "uppercase", letterSpacing: "0.07em",
    color: T.textFaint, textAlign: "left", whiteSpace: "nowrap",
    borderBottom: `2px solid ${isDark ? "rgba(255,255,255,0.08)" : T.border}`,
    background: isDark ? "rgba(255,255,255,0.03)" : T.surfaceAlt,
  };

  const tdBase = {
    padding: "7px 10px",
    verticalAlign: "middle",
    overflow: "hidden",
    whiteSpace: "nowrap",
    textOverflow: "ellipsis",
  };

  return (
    <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed" }}>
      <colgroup>
        <col style={{ width: "22%" }} />
        <col style={{ width: "17%" }} />
        <col style={{ width: "19%" }} />
        <col style={{ width: "17%" }} />
        <col style={{ width: "13%" }} />
        <col style={{ width: "12%" }} />
      </colgroup>
      <thead>
        <tr>
          <th style={thBase}>Insumo</th>
          <th style={thBase}>Categoría</th>
          <th style={thBase}>Marca / Modelo</th>
          <th style={thBase}>N° Serie</th>
          <th style={{ ...thBase, textAlign: "center" }}>Estado</th>
          <th style={thBase}>Stock</th>
        </tr>
      </thead>
      <tbody>
        {filtrados.map((i, idx) => {
          const isHover = hoverRow === i.id_insumo;
          const rowBg = isHover
            ? (isDark ? "rgba(255,255,255,0.04)" : "#f1f5f9")
            : (idx % 2 === 0 ? "transparent" : (isDark ? "rgba(255,255,255,0.015)" : "rgba(0,0,0,0.012)"));
          const borderB = `1px solid ${isDark ? "rgba(255,255,255,0.05)" : T.border}`;

          return (
            <tr key={i.id_insumo}
              onClick={() => onSelect(i)}
              onMouseEnter={() => setHoverRow(i.id_insumo)}
              onMouseLeave={() => setHoverRow(null)}
              style={{ cursor: "pointer", background: rowBg, transition: "background 0.1s" }}
            >
              {/* Insumo */}
              <td style={{ ...tdBase, borderBottom: borderB }}>
                <div style={{ display: "flex", alignItems: "center", gap: "7px", overflow: "hidden" }}>
                  {i.imagen_url
                    ? <img src={`${API_BASE}${i.imagen_url}`} alt={i.nombre} onError={e => { e.target.style.display = "none"; }} style={{ width: "24px", height: "24px", borderRadius: "4px", objectFit: "cover", flexShrink: 0 }} />
                    : <div style={{ width: "3px", height: "18px", borderRadius: "2px", flexShrink: 0, background: ESTADO_META[i.estado]?.color || "#94a3b8" }} />
                  }
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: "12px", fontWeight: 600, color: T.text }}>
                    {i.nombre}
                  </span>
                </div>
              </td>
              {/* Categoría */}
              <td style={{ ...tdBase, borderBottom: borderB }}>
                <span style={{
                  display: "inline-block", maxWidth: "100%",
                  fontSize: "11px", fontWeight: 600, color: T.textMuted,
                  background: isDark ? "rgba(255,255,255,0.05)" : T.surfaceAlt,
                  border: `1px solid ${isDark ? "rgba(255,255,255,0.07)" : T.border}`,
                  borderRadius: "3px", padding: "2px 6px",
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  verticalAlign: "middle",
                }}>
                  {i.nombre_categoria || "—"}
                </span>
              </td>
              {/* Marca / Modelo */}
              <td style={{ ...tdBase, borderBottom: borderB, fontSize: "12px", color: T.textMuted }}>
                {[i.marca, i.modelo].filter(Boolean).join(" / ") || <span style={{ fontStyle: "italic", color: T.textFaint }}>—</span>}
              </td>
              {/* N° Serie */}
              <td style={{ ...tdBase, borderBottom: borderB, fontFamily: "monospace", fontSize: "11px", color: T.textFaint }}>
                {i.num_serie || "—"}
              </td>
              {/* Estado */}
              <td style={{ ...tdBase, borderBottom: borderB, textAlign: "center", overflow: "visible" }}>
                <BadgeEstado estado={i.estado} />
              </td>
              {/* Stock */}
              <td style={{ ...tdBase, borderBottom: borderB, overflow: "visible" }}>
                <StockBar stock={i.stock ?? 0} isDark={isDark} />
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

// ── Principal ──────────────────────────────────────────────────
export default function VistaInsumos({ T }) {
  const isDark = T.isDark;
  const [insumos,    setInsumos]    = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [syncing,    setSyncing]    = useState(false);
  const [ultimaSync, setUltimaSync] = useState(null);
  const [filtros,    setFiltros]    = useState({ busqueda: "", estado: "Todos", categoria: "Todos", stock: "Todos" });
  const [viewMode,   setViewMode]   = useState("cards");
  const [insumoSel,  setInsumoSel]  = useState(null);

  useEffect(() => {
    apiFetch("/api/solicitudes/inventario")
      .then(r => r.json())
      .then(d => { setInsumos(Array.isArray(d) ? d : []); setUltimaSync(new Date()); })
      .catch(() => {})
      .finally(() => setLoading(false));

    const id = setInterval(() => {
      setSyncing(true);
      apiFetch("/api/solicitudes/inventario")
        .then(r => r.json())
        .then(d => { setInsumos(Array.isArray(d) ? d : []); setUltimaSync(new Date()); })
        .catch(() => {})
        .finally(() => setSyncing(false));
    }, 30000);
    return () => clearInterval(id);
  }, []);

  const catOpts = ["Todos", ...Array.from(new Set(insumos.map(i => i.nombre_categoria).filter(Boolean)))];
  const camposFiltro = [
    { key: "busqueda",  label: "Búsqueda",  type: "search", placeholder: "Nombre, marca, modelo..." },
    { key: "estado",    label: "Estado",     type: "select", opts: ["Todos", ...ESTADO_OPTS] },
    { key: "categoria", label: "Categoría",  type: "select", opts: catOpts },
    { key: "stock",     label: "Stock",      type: "select", opts: ["Todos", "Con stock", "Sin stock"] },
  ];

  const filtrados = insumos.filter(i => {
    if (filtros.busqueda) {
      const q = filtros.busqueda.toLowerCase();
      if (!i.nombre?.toLowerCase().includes(q) && !i.marca?.toLowerCase().includes(q) &&
          !i.modelo?.toLowerCase().includes(q) && !i.num_serie?.toLowerCase().includes(q)) return false;
    }
    if (filtros.estado    !== "Todos" && i.estado !== filtros.estado)              return false;
    if (filtros.categoria !== "Todos" && i.nombre_categoria !== filtros.categoria) return false;
    if (filtros.stock === "Con stock" && !(i.stock > 0))                           return false;
    if (filtros.stock === "Sin stock" && i.stock > 0)                              return false;
    return true;
  });

  const hayFiltros = filtros.busqueda || filtros.estado !== "Todos" || filtros.categoria !== "Todos" || filtros.stock !== "Todos";
  const limpiar    = () => setFiltros({ busqueda: "", estado: "Todos", categoria: "Todos", stock: "Todos" });

  const totalStock    = insumos.reduce((s, i) => s + (i.stock || 0), 0);
  const estadoMalo    = insumos.filter(i => i.estado === "Malo").length;
  const estadoRegular = insumos.filter(i => i.estado === "Regular").length;

  const { card, hdr } = useCardStyles(T);

  return (
    <>
      <div style={{
        background: T.bg,
        fontFamily: "'Inter','Segoe UI',system-ui,sans-serif",
        height: "100%", display: "flex", flexDirection: "column", overflow: "hidden",
      }}>
        <div style={{
          flex: 1, minHeight: 0, overflowY: "auto", overflowX: "auto",
          padding: "12px", display: "flex", flexDirection: "column", gap: "10px",
        }}>
          <div style={{ maxWidth: "1400px", width: "100%", margin: "0 auto", display: "flex", flexDirection: "column", gap: "10px" }}>

            {/* KPIs */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { label: "Total insumos",   val: insumos.length, color: "#3b82f6", icon: Package      },
                { label: "Piezas en stock", val: totalStock,     color: "#16a34a", icon: CheckCircle2 },
                { label: "Estado malo",     val: estadoMalo,     color: "#dc2626", icon: XCircle      },
                { label: "Estado regular",  val: estadoRegular,  color: "#ca8a04", icon: AlertTriangle },
              ].map(({ label, val, color, icon: Icon }) => (
                <div key={label} style={{
                  borderRadius: "8px", padding: "8px 12px",
                  display: "flex", alignItems: "center", gap: "9px",
                  background: T.surface,
                  border: `1px solid ${isDark ? "rgba(255,255,255,0.07)" : T.border}`,
                  boxShadow: isDark ? T.shadowSm : "0 1px 2px rgba(0,0,0,0.04)",
                }}>
                  <div style={{ width: "28px", height: "28px", borderRadius: "6px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, background: `${color}18`, border: `1px solid ${color}30` }}>
                    <Icon size={13} style={{ color }} />
                  </div>
                  <div>
                    <p style={{ margin: 0, fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: T.textFaint }}>{label}</p>
                    <p style={{ margin: 0, fontSize: "18px", fontWeight: 800, lineHeight: "1.1", marginTop: "2px", color }}>{val}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Filtros */}
            <FiltrosToolbar
              campos={camposFiltro}
              valores={filtros}
              onChange={(k, v) => setFiltros(p => ({ ...p, [k]: v }))}
              onLimpiar={limpiar}
              T={T}
            />

            {/* Card catálogo */}
            <div style={{ ...card, borderRadius: "10px", overflow: "hidden" }}>

              {/* Header */}
              <div className="px-3 py-2 flex items-center justify-between" style={hdr}>
                <div className="flex items-center gap-2">
                  <div className="w-0.5 h-3 rounded-full" style={{ background: T.orange }} />
                  <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: T.textMuted }}>
                    Catálogo de Insumos
                  </p>
                  {syncing && (
                    <svg className="animate-spin" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={T.orange} strokeWidth="2.5">
                      <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                    </svg>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {ultimaSync && !syncing && (
                    <span className="hidden sm:flex items-center gap-1 text-[9px]" style={{ color: T.textFaint }}>
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#16a34a" }} />
                      {ultimaSync.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  )}
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded-full"
                    style={{ background: T.bg, color: T.textMuted, border: `1px solid ${T.border}` }}>
                    {filtrados.length} resultado{filtrados.length !== 1 ? "s" : ""}
                  </span>
                  <ToggleView view={viewMode} onChange={setViewMode} />
                </div>
              </div>

              {/* Contenido */}
              <div style={{ padding: "10px" }}>
                {loading ? (
                  <div className="flex justify-center py-12">
                    <svg className="animate-spin" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={T.orange} strokeWidth="2">
                      <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                    </svg>
                  </div>
                ) : filtrados.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 gap-2">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center"
                      style={{ background: isDark ? "rgba(255,255,255,0.04)" : T.surfaceAlt, border: `1px solid ${T.border}` }}>
                      <Inbox size={22} style={{ color: T.textFaint }} />
                    </div>
                    <p style={{ fontSize: "13px", fontWeight: 700, color: T.textMuted, margin: 0 }}>
                      {hayFiltros ? "Sin resultados — ajusta los filtros" : "No hay insumos registrados"}
                    </p>
                  </div>
                ) : viewMode === "cards" ? (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "10px" }}>
                    {filtrados.map(i => (
                      <TarjetaInsumo key={i.id_insumo} i={i} onClick={() => setInsumoSel(i)} />
                    ))}
                  </div>
                ) : (
                  <TablaInsumos filtrados={filtrados} onSelect={setInsumoSel} />
                )}
              </div>
            </div>

          </div>
        </div>
      </div>

      {insumoSel && (
        <ModalDetalleInsumo insumo={insumoSel} onClose={() => setInsumoSel(null)} T={T} />
      )}
    </>
  );
}
