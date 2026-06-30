import { useState, useEffect, useRef } from "react";
import { useAutoRefresh } from "../../Config/useAutoRefresh";
import {
  Package, TrendingDown, Users, BarChart3,
  Inbox, Plus, Pencil, Trash2, RefreshCw, Layers, Eye,
} from "lucide-react";
import { apiFetch }      from "../../Config/api";
import FiltrosToolbar    from "../../Components/FiltrosToolbar";
import { useToast }      from "../../Components/Feedback";
import ModalInsumo       from "../../Components/Inventario/ModalInsumo";
import ModalEliminar     from "../../Components/Inventario/ModalEliminar";
import { useTheme }      from "../../Config/ThemeContext";

// ── Paleta ────────────────────────────────────────────────────────
const TEAL    = { base: "#0d9488", light: "#f0fdfa", border: "#99f6e4", muted: "rgba(13,148,136,0.12)" };
const ORANGE  = { base: "#F97316", light: "#fff7ed", border: "#fed7aa", muted: "rgba(249,115,22,0.12)" };
const SLATE   = { 50: "#f8fafc", 100: "#f1f5f9", 200: "#e2e8f0", 300: "#cbd5e1", 400: "#94a3b8", 600: "#475569", 700: "#334155", 900: "#0f172a" };

const ESTADO_META = {
  Excelente:   { color: "#16a34a", bg: "#f0fdf4", border: "#bbf7d0" },
  Bueno:       { color: "#2563eb", bg: "#eff6ff", border: "#bfdbfe" },
  Regular:     { color: "#d97706", bg: "#fffbeb", border: "#fde68a" },
  Malo:        { color: "#dc2626", bg: "#fef2f2", border: "#fecaca" },
};

const DISPONIBILIDAD_META = {
  Disponible:   { color: "#16a34a", bg: "#f0fdf4", border: "#bbf7d0" },
  "Stock bajo": { color: "#d97706", bg: "#fffbeb", border: "#fde68a" },
  "Sin stock":  { color: "#dc2626", bg: "#fef2f2", border: "#fecaca" },
};

const ESTADO_OPTS = ["Excelente", "Bueno", "Regular", "Malo"];

const CAT_PALETTES = [
  { color: "#7c3aed", bg: "#f5f3ff", border: "#ddd6fe" },
  { color: "#0891b2", bg: "#ecfeff", border: "#a5f3fc" },
  { color: "#0d9488", bg: "#f0fdfa", border: "#99f6e4" },
  { color: "#d97706", bg: "#fffbeb", border: "#fde68a" },
  { color: "#db2777", bg: "#fdf2f8", border: "#fbcfe8" },
  { color: "#059669", bg: "#ecfdf5", border: "#a7f3d0" },
  { color: "#4f46e5", bg: "#eef2ff", border: "#c7d2fe" },
  { color: "#b45309", bg: "#fefce8", border: "#fef08a" },
];
const catColor = (name = "") => {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xffff;
  return CAT_PALETTES[h % CAT_PALETTES.length];
};

// ── Átomos ────────────────────────────────────────────────────────
function BadgeEstado({ estado }) {
  const { T } = useTheme();
  const s = ESTADO_META[estado] ?? { color: "#94a3b8", bg: "#f1f5f9", border: "#e2e8f0" };
  const bg = T.isDark ? `${s.color}1a` : s.bg;
  const border = T.isDark ? `${s.color}40` : s.border;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: "4px",
      padding: "2px 8px", borderRadius: "99px",
      fontSize: "11px", fontWeight: 600, whiteSpace: "nowrap",
      background: bg, color: s.color, border: `1px solid ${border}`,
    }}>
      <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: s.color, flexShrink: 0 }} />
      {estado || "—"}
    </span>
  );
}

function BadgeDisponibilidad({ disponibilidad }) {
  const { T } = useTheme();
  const s = DISPONIBILIDAD_META[disponibilidad] ?? { color: "#94a3b8", bg: "#f1f5f9", border: "#e2e8f0" };
  const bg = T.isDark ? `${s.color}1a` : s.bg;
  const border = T.isDark ? `${s.color}40` : s.border;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: "4px",
      padding: "2px 10px", borderRadius: "9999px",
      fontSize: "11px", fontWeight: 600, whiteSpace: "nowrap",
      background: bg, color: s.color, border: `1px solid ${border}`,
    }}>
      <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: s.color, flexShrink: 0 }} />
      {disponibilidad || "—"}
    </span>
  );
}

function BadgeCategoria({ nombre }) {
  const { T } = useTheme();
  const s = catColor(nombre);
  const bg = T.isDark ? `${s.color}1a` : s.bg;
  const border = T.isDark ? `${s.color}40` : s.border;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center",
      padding: "2px 9px", borderRadius: "99px",
      fontSize: "11px", fontWeight: 600, whiteSpace: "nowrap",
      background: bg, color: s.color, border: `1px solid ${border}`,
    }}>
      {nombre || "Sin categoría"}
    </span>
  );
}

function StockProgress({ stock, max = 20 }) {
  const { T } = useTheme();
  const pct   = max > 0 ? Math.min(100, Math.round((stock / max) * 100)) : 0;
  const color = stock === 0 ? "#6b7280" : stock <= 3 ? "#dc2626" : stock <= 8 ? "#d97706" : "#0d9488";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "8px", minWidth: "110px" }}>
      <div style={{ flex: 1, height: "4px", borderRadius: "99px", background: T.border, overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: "99px", transition: "width 0.4s ease" }} />
      </div>
      <span style={{ fontSize: "11px", fontWeight: 700, color, minWidth: "22px", textAlign: "right", fontFamily: "monospace" }}>
        {stock}
      </span>
    </div>
  );
}

function IconBtn({ onClick, title, children, hoverColor = "#2563eb", hoverBg = "#eff6ff" }) {
  const [h, setH] = useState(false);
  const { T } = useTheme();
  return (
    <button
      onClick={onClick} title={title}
      onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{
        width: "28px", height: "28px", borderRadius: "4px", border: `1px solid ${h ? "transparent" : T.border}`,
        background: h ? hoverBg : "transparent",
        color: h ? hoverColor : T.textFaint,
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        cursor: "pointer", transition: "all 0.12s", flexShrink: 0,
      }}
    >
      {children}
    </button>
  );
}

// ── KPI Card — Enterprise SaaS ────────────────────────────────────
function KpiCard({ label, value, sub, icon: Icon, color, highlight = false }) {
  const { T } = useTheme();
  return (
    <div style={{
      background: T.surface, borderRadius: "8px",
      border: `1px solid ${highlight ? `${color}40` : T.border}`,
      boxShadow: highlight ? `0 0 0 1px ${color}20, ${T.shadowSm}` : T.shadowSm,
      overflow: "hidden", display: "flex", flexDirection: "column",
      transition: "box-shadow 0.2s",
    }}>
      <div style={{ height: "3px", background: color, borderRadius: "8px 8px 0 0" }} />
      <div style={{ padding: "14px 16px", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px" }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: 0, fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em", color: T.textFaint }}>
            {label}
          </p>
          <p style={{ margin: "4px 0 0", fontSize: "16px", fontWeight: 800, lineHeight: 1, color: highlight ? color : T.text }}>
            {value}
          </p>
          {sub && (
            <p style={{ margin: "4px 0 0", fontSize: "11px", color: T.textFaint, fontWeight: 500 }}>{sub}</p>
          )}
        </div>
        <div style={{
          width: "36px", height: "36px", borderRadius: "8px", flexShrink: 0,
          display: "flex", alignItems: "center", justifyContent: "center",
          background: `${color}18`, border: `1px solid ${color}28`,
        }}>
          <Icon size={16} style={{ color }} />
        </div>
      </div>
    </div>
  );
}

// ── Tabla de alta densidad ────────────────────────────────────────
const COLS = ["Nombre del Insumo", "Categoría", "Estado", "Disponibilidad", "Stock", "Nivel de Stock", "Acciones"];

function DataTable({ rows, onEdit, onDelete, onDetail }) {
  const [hoverRow, setHoverRow] = useState(null);
  const { T } = useTheme();

  const th = {
    padding: "7px 12px", fontSize: "10px", fontWeight: 700,
    textTransform: "uppercase", letterSpacing: "0.07em",
    color: T.textMuted, background: T.surfaceAlt,
    borderBottom: `2px solid ${T.border}`, textAlign: "left",
    whiteSpace: "nowrap",
    position: "sticky", top: 0, zIndex: 10,
  };

  return (
    <div>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "11px" }}>
        <thead>
          <tr>{COLS.map(c => <th key={c} style={th}>{c}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const isHover = hoverRow === row.id_insumo;
            const td = {
              padding: "7px 12px",
              borderBottom: `1px solid ${T.border}`,
              background: isHover ? T.surfaceHover : T.surface,
              color: T.textMuted,
              transition: "background 0.1s",
              verticalAlign: "middle",
            };
            const fecha = row.updated_at
              ? new Date(row.updated_at).toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" })
              : row.created_at
                ? new Date(row.created_at).toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" })
                : "—";

            return (
              <tr
                key={row.id_insumo}
                onMouseEnter={() => setHoverRow(row.id_insumo)}
                onMouseLeave={() => setHoverRow(null)}
              >
                {/* Nombre */}
                <td style={{ ...td, fontWeight: 600, color: T.text }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <div style={{ width: "3px", height: "30px", borderRadius: "2px", background: ESTADO_META[row.estado]?.color ?? SLATE[400], flexShrink: 0 }} />
                    <div>
                      <div style={{ whiteSpace: "nowrap" }}>{row.nombre}</div>
                      {(row.marca || row.modelo) && (
                        <div style={{ fontSize: "11px", fontWeight: 400, color: T.textFaint, marginTop: "1px" }}>
                          {[row.marca, row.modelo].filter(Boolean).join(" · ")}
                        </div>
                      )}
                    </div>
                  </div>
                </td>
                {/* Categoría */}
                <td style={td}><BadgeCategoria nombre={row.nombre_categoria} /></td>
                {/* Estado físico */}
                <td style={td}><BadgeEstado estado={row.estado} /></td>
                {/* Disponibilidad */}
                <td style={td}><BadgeDisponibilidad disponibilidad={row.disponibilidad} /></td>
                {/* Stock numérico */}
                <td style={{ ...td, textAlign: "center", fontFamily: "monospace", fontWeight: 700, fontSize: "12px", color: T.textMuted }}>
                  {row.stock ?? 0}
                </td>
                {/* Barra de progreso */}
                <td style={{ ...td, minWidth: "140px" }}>
                  <StockProgress stock={row.stock ?? 0} />
                </td>
                {/* Acciones */}
                <td style={{ ...td, whiteSpace: "nowrap" }}>
                  <div style={{ display: "flex", gap: "4px" }}>
                    <IconBtn onClick={() => onEdit(row)} title="Editar insumo" hoverColor={ORANGE.base} hoverBg={ORANGE.light}>
                      <Pencil size={13} />
                    </IconBtn>
                    <IconBtn onClick={() => onDetail(row)} title="Ver detalles" hoverColor="#2563eb" hoverBg="#eff6ff">
                      <Eye size={13} />
                    </IconBtn>
                    <IconBtn onClick={() => onDelete(row)} title="Eliminar insumo" hoverColor="#dc2626" hoverBg="#fef2f2">
                      <Trash2 size={13} />
                    </IconBtn>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ── Página principal ──────────────────────────────────────────────
// Nota: este componente usa useTheme() internamente para obtener el tema.
// La prop T que pasa el Dashboard es ignorada intencionalmente ya que el
// hook garantiza que siempre tenga el valor más actualizado del contexto.
export default function Inventario() {
  const [insumos,    setInsumos]    = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [syncing,    setSyncing]    = useState(false);
  const [ultimaSync, setUltimaSync] = useState(null);
  const [filtros,    setFiltros]    = useState({ busqueda: "", estado: "Todos", categoria: "Todos", stock: "Todos" });
  const [modal,      setModal]      = useState(null);
  const [confirmDel, setConfirmDel] = useState(null);
  const prevRef = useRef(null);
  const toast   = useToast();

  const cargarInventario = (esPrimera = false) => {
    if (!esPrimera) setSyncing(true);
    apiFetch("/api/solicitudes/inventario")
      .then(r => r.json())
      .then(d => {
        const lista = Array.isArray(d) ? d : [];
        setUltimaSync(new Date());
        setInsumos(prev => {
          if (prevRef.current) {
            const prevIds  = new Set(prevRef.current.map(i => i.id_insumo));
            const nuevos   = lista.filter(i => !prevIds.has(i.id_insumo));
            const agotados = lista.filter(i => {
              const ant = prevRef.current.find(p => p.id_insumo === i.id_insumo);
              return ant && ant.stock > 0 && i.stock === 0;
            });
            if (nuevos.length)   toast.info(`${nuevos.length} insumo(s) nuevo(s)`);
            if (agotados.length) toast.warning(`${agotados.length} insumo(s) agotado(s)`);
          }
          prevRef.current = lista;
          return JSON.stringify(prev) === JSON.stringify(lista) ? prev : lista;
        });
      })
      .catch(() => {})
      .finally(() => { setLoading(false); setSyncing(false); });
  };

  useEffect(() => {
    cargarInventario(true);
    apiFetch("/api/categorias?tipo=insumo").then(r => r.json()).then(d => setCategorias(Array.isArray(d) ? d : [])).catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useAutoRefresh(() => cargarInventario(false), 30000);

  const handleSave = (data, isEdit) => {
    setInsumos(prev => isEdit ? prev.map(i => i.id_insumo === data.id_insumo ? data : i) : [...prev, data]);
    setModal(null);
  };

  const handleDelete = async () => {
    if (!confirmDel) return;
    try {
      const r = await apiFetch(`/api/solicitudes/insumos/${confirmDel.id_insumo}`, { method: "DELETE" });
      if (!r.ok) { toast.error("Error al eliminar"); return; }
      setInsumos(prev => prev.filter(i => i.id_insumo !== confirmDel.id_insumo));
      toast.success("Insumo eliminado");
    } catch { toast.error("Error de conexión"); }
    finally { setConfirmDel(null); }
  };

  const catOpts      = ["Todos", ...Array.from(new Set(insumos.map(i => i.nombre_categoria).filter(Boolean)))];
  const camposFiltro = [
    { key: "busqueda",  label: "Búsqueda Rápida", type: "search", placeholder: "Nombre, marca, modelo…" },
    { key: "estado",    label: "Estado",           type: "select", opts: ["Todos", ...ESTADO_OPTS] },
    { key: "categoria", label: "Categoría",        type: "select", opts: catOpts },
    { key: "stock",     label: "Stock",            type: "select", opts: ["Todos", "Con stock", "Sin stock"] },
  ];

  const filtrados = insumos.filter(i => {
    const q = filtros.busqueda?.toLowerCase();
    if (q && !i.nombre?.toLowerCase().includes(q) && !i.marca?.toLowerCase().includes(q) &&
        !i.modelo?.toLowerCase().includes(q) && !i.num_serie?.toLowerCase().includes(q)) return false;
    if (filtros.estado    !== "Todos" && i.estado           !== filtros.estado)    return false;
    if (filtros.categoria !== "Todos" && i.nombre_categoria !== filtros.categoria) return false;
    if (filtros.stock === "Con stock" && !(i.stock > 0))  return false;
    if (filtros.stock === "Sin stock" &&   i.stock > 0)   return false;
    return true;
  });

  const hayFiltros    = filtros.busqueda || filtros.estado !== "Todos" || filtros.categoria !== "Todos" || filtros.stock !== "Todos";
  const totalStock     = insumos.reduce((s, i) => s + (i.stock || 0), 0);
  const estadoMalo     = insumos.filter(i => i.estado === "Malo").length;
  const estadoRegular  = insumos.filter(i => i.estado === "Regular").length;
  const categoriasCnt  = new Set(insumos.map(i => i.id_categoria).filter(Boolean)).size;
  const activosEnUso   = insumos.filter(i => i.disponibilidad === "Stock bajo" || i.disponibilidad === "Sin stock").length;
  const stockBajo      = insumos.filter(i => (i.stock ?? 0) > 0 && (i.stock ?? 0) <= 3).length;
  const sinStock       = insumos.filter(i => (i.stock ?? 0) === 0).length;

  const { T } = useTheme();

  return (
    <div style={{ background: T.bg, height: "100%", display: "flex", flexDirection: "column", fontFamily: "'Inter','Segoe UI',system-ui,sans-serif", overflow: "hidden" }}>
      <div style={{ maxWidth: "1400px", width: "100%", margin: "0 auto", padding: "20px 16px", display: "flex", flexDirection: "column", gap: "16px", flex: 1, minHeight: 0 }}>

        {/* ── Page Header ───────────────────────────────────────── */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", flexWrap: "wrap" }}>
          <div>
            <h1 style={{ margin: 0, fontSize: "13px", fontWeight: 800, color: T.text, letterSpacing: "-0.02em" }}>
              Inventario de Insumos
            </h1>
            <p style={{ margin: "2px 0 0", fontSize: "11px", color: T.textFaint }}>
              Gestión y control de piezas en almacén
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            {ultimaSync && (
              <span style={{ fontSize: "11px", color: T.textFaint, display: "flex", alignItems: "center", gap: "5px" }}>
                {syncing
                  ? <RefreshCw size={11} style={{ color: TEAL.base, animation: "spin 1s linear infinite" }} />
                  : <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#16a34a" }} />
                }
                {syncing ? "Sincronizando…" : `Actualizado ${ultimaSync.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })}`}
              </span>
            )}
            <button
              onClick={() => setModal({})}
              style={{
                display: "inline-flex", alignItems: "center", gap: "6px",
                padding: "8px 14px", borderRadius: "6px", border: "none",
                background: TEAL.base, color: "#fff",
                fontSize: "11px", fontWeight: 600, cursor: "pointer",
                transition: "opacity 0.15s",
              }}
              onMouseEnter={e => e.currentTarget.style.opacity = "0.88"}
              onMouseLeave={e => e.currentTarget.style.opacity = "1"}
            >
              <Plus size={14} /> Nuevo insumo
            </button>
          </div>
        </div>

        {/* ── KPIs ──────────────────────────────────────────────── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: "12px" }}>
          <KpiCard
            label="Total de Activos" value={insumos.length}
            sub={`${categoriasCnt} categoría${categoriasCnt !== 1 ? "s" : ""}`}
            icon={Package}       color={TEAL.base}
          />
          <KpiCard
            label="Con Stock Bajo / Agotados" value={activosEnUso}
            sub={insumos.length > 0 ? `${Math.round((activosEnUso / insumos.length) * 100)}% del catálogo` : "Sin datos"}
            icon={Users}         color={ORANGE.base}  highlight
          />
          <KpiCard
            label="Stock Bajo"       value={stockBajo}
            sub={sinStock > 0 ? `+${sinStock} sin existencia` : "Revisión recomendada"}
            icon={TrendingDown}   color="#dc2626"      highlight={stockBajo > 0}
          />
          <KpiCard
            label="Piezas en Stock"  value={totalStock}
            sub={`${insumos.filter(i => i.stock > 0).length} con existencia`}
            icon={BarChart3}     color="#16a34a"
          />
        </div>

        {/* ── Filtros ───────────────────────────────────────────── */}
        <FiltrosToolbar
          campos={camposFiltro}
          valores={filtros}
          onChange={(k, v) => setFiltros(p => ({ ...p, [k]: v }))}
          onLimpiar={() => setFiltros({ busqueda: "", estado: "Todos", categoria: "Todos", stock: "Todos" })}
          T={T}
        />

        {/* ── Tabla principal ───────────────────────────────────── */}
        <div style={{ background: T.surface, borderRadius: "8px", border: `1px solid ${T.border}`, boxShadow: T.shadowSm, overflow: "hidden", display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>

          {/* Toolbar de tabla */}
          <div style={{
            padding: "10px 16px", background: T.surfaceAlt, borderBottom: `1px solid ${T.border}`,
            display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", flexWrap: "wrap",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Layers size={14} style={{ color: TEAL.base }} />
              <span style={{ fontSize: "11px", fontWeight: 700, color: T.text }}>Catálogo de Insumos</span>
              <span style={{
                fontSize: "11px", fontWeight: 600, padding: "2px 8px", borderRadius: "99px",
                background: T.isDark ? "rgba(13,148,136,0.18)" : "#f0fdfa",
                color: "#0d9488",
                border: T.isDark ? "1px solid rgba(13,148,136,0.35)" : "1px solid #99f6e4",
              }}>
                {filtrados.length} registro{filtrados.length !== 1 ? "s" : ""}
              </span>
            </div>
            {hayFiltros && (
              <button
                onClick={() => setFiltros({ busqueda: "", estado: "Todos", categoria: "Todos", stock: "Todos" })}
                style={{
                  fontSize: "11px", fontWeight: 600, color: T.textMuted, background: "transparent",
                  border: `1px solid ${T.border}`, borderRadius: "4px", padding: "3px 10px",
                  cursor: "pointer",
                }}
              >
                Limpiar filtros
              </button>
            )}
          </div>

          {/* Contenido */}
          <div style={{ flex: 1, minHeight: 0, overflowY: "auto", overflowX: "auto" }}>
            {loading ? (
              <div style={{ display: "flex", justifyContent: "center", padding: "64px 0" }}>
                <RefreshCw size={24} style={{ color: TEAL.base, animation: "spin 1s linear infinite" }} />
              </div>
            ) : filtrados.length === 0 ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "64px 24px", gap: "10px" }}>
                <div style={{ width: "52px", height: "52px", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", background: T.surfaceAlt, border: `1px solid ${T.border}` }}>
                  <Inbox size={24} style={{ color: T.textFaint }} />
                </div>
                <p style={{ margin: 0, fontSize: "13px", fontWeight: 600, color: T.textMuted }}>
                  {hayFiltros ? "Sin resultados — ajusta los filtros" : "No hay insumos registrados"}
                </p>
              </div>
            ) : (
              <DataTable rows={filtrados} onEdit={setModal} onDelete={setConfirmDel} onDetail={(row) => {
            toast.info(`${row.nombre} · ${row.marca || "—"} ${row.modelo || "—"} · Serie: ${row.num_serie || "—"} · Stock: ${row.stock ?? 0}`);
          }} />
            )}
          </div>
        </div>
      </div>

      <style>{`@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>

      {modal !== null && (
        <ModalInsumo insumo={modal} categorias={categorias}
          onClose={() => setModal(null)} onSave={handleSave} T={T} />
      )}
      {confirmDel && (
        <ModalEliminar
          insumo={confirmDel}
          onClose={() => setConfirmDel(null)}
          onConfirm={handleDelete}
          T={T}
        />
      )}
    </div>
  );
}
