import { useState, useEffect, useCallback, useRef } from "react";
import { Plus, Minus, Trash2, Package, AlertCircle, CheckCircle2, Search, Tag, Ticket, ChevronDown, Clock, Loader2, XCircle, Eye, Inbox, History, X } from "lucide-react";
import { apiFetch, API_ROUTES } from "../../Config/api";
import StockBar from "../../Components/StockBar";
import VistaSolicitud from "./VistaSolicitud";
import VistaInsumos from "./VistaInsumos";
import FiltrosToolbar from "../../Components/FiltrosToolbar";
import { useCardStyles } from "../../Components/Card";
import Modal from "../../Components/Modal";
import ModalDetalleInsumo from "../../Components/Inventario/ModalDetalleInsumo";

const PRIORITY_OPTIONS = [
  { value: "Urgente", label: "Urgente", color: "#dc2626", bg: "rgba(220,38,38,0.10)", border: "rgba(220,38,38,0.30)" },
  { value: "Alta",    label: "Alta",    color: "#ea580c", bg: "rgba(234,88,12,0.10)",  border: "rgba(234,88,12,0.30)"  },
  { value: "Media",   label: "Media",   color: "#d97706", bg: "rgba(217,119,6,0.10)",  border: "rgba(217,119,6,0.30)"  },
  { value: "Baja",    label: "Baja",    color: "#6b7280", bg: "rgba(107,114,128,0.08)",border: "rgba(107,114,128,0.25)"},
];

const STATUS_BADGE = {
  Disponible: { label: "Disponible", bg: "#f0fdf4", color: "#16a34a", border: "#bbf7d0" },
  Bajo:       { label: "Stock Bajo", bg: "#fffbeb", color: "#d97706", border: "#fde68a" },
  Agotado:    { label: "Agotado",    bg: "#fef2f2", color: "#dc2626", border: "#fecaca" },
};

function getStockStatus(stock) {
  if (stock === 0) return "Agotado";
  if (stock < 5)  return "Bajo";
  return "Disponible";
}

function SupplyRow({ supply, isAdded, onAdd, animatingId, T, cartQty, onDetail }) {
  const status      = getStockStatus(supply.stock);
  const badge       = STATUS_BADGE[status];
  const isExhausted = supply.stock === 0;
  const isAnimating = animatingId === supply.id_insumo;
  const atMax       = cartQty >= supply.stock;

  return (
    <tr style={{
      borderBottom: `1px solid ${T.border}`,
      background: isAdded ? (T.isDark ? "rgba(37,99,235,0.08)" : "rgba(37,99,235,0.04)") : "transparent",
      transition: "background 0.15s",
    }}
      onMouseEnter={e => { if (!isAdded) e.currentTarget.style.background = T.surfaceHover; }}
      onMouseLeave={e => { e.currentTarget.style.background = isAdded ? (T.isDark ? "rgba(37,99,235,0.08)" : "rgba(37,99,235,0.04)") : "transparent"; }}
    >
      <td className="px-3 py-1.5">
        <div className="flex flex-col gap-0">
          <span className="text-[10px] font-mono select-all" style={{ color: T.textFaint }}>
            #{String(supply.id_insumo).padStart(4, "0")}
          </span>
          <button
            onClick={() => onDetail(supply)}
            className="text-[11px] font-semibold leading-tight text-left hover:underline"
            style={{ color: T.text, background: "none", border: "none", padding: 0, cursor: "pointer" }}
          >
            {supply.nombre}
          </button>
          {(supply.marca || supply.modelo) && (
            <span className="text-[10px]" style={{ color: T.textFaint }}>
              {[supply.marca, supply.modelo].filter(Boolean).join(" · ")}
            </span>
          )}
        </div>
      </td>

      <td className="px-3 py-1.5">
        {supply.nombre_categoria ? (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold"
            style={{ background: T.surfaceAlt, color: T.textMuted, border: `1px solid ${T.border}` }}>
            <Tag size={8} />
            {supply.nombre_categoria}
          </span>
        ) : (
          <span className="text-[10px]" style={{ color: T.textFaint }}>—</span>
        )}
      </td>

      <td className="px-3 py-1.5 w-32">
        <StockBar stock={supply.stock} maxStock={100} />
      </td>

      <td className="px-3 py-1.5">
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold border"
          style={{ background: badge.bg, color: badge.color, borderColor: badge.border }}>
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: badge.color }} />
          {badge.label}
        </span>
      </td>

      <td className="px-3 py-1.5">
        {isExhausted ? (
          <button disabled className="px-2.5 py-1 rounded text-[10px] font-bold cursor-not-allowed"
            style={{ background: T.surfaceAlt, color: T.textFaint, border: `1px solid ${T.border}`, opacity: 0.6 }}>
            Agotado
          </button>
        ) : isAdded ? (
          <button onClick={() => !atMax && onAdd(supply.id_insumo)}
            disabled={atMax}
            className="px-2.5 py-1 rounded text-[10px] font-bold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: T.isDark ? "rgba(37,99,235,0.15)" : "#eff6ff", color: "#3b82f6", border: "1px solid rgba(59,130,246,0.3)" }}>
            {atMax ? `Máx (${supply.stock})` : "+ Agregar otro"}
          </button>
        ) : (
          <button onClick={() => onAdd(supply.id_insumo)}
            className={`px-2.5 py-1 rounded text-[10px] font-bold transition-all active:scale-95 ${isAnimating ? "animate-slide-out" : ""}`}
            style={{ background: "#2563eb", color: "#fff", border: "none" }}>
            <span className="flex items-center gap-1"><Plus size={11} /> Agregar</span>
          </button>
        )}
      </td>
    </tr>
  );
}

function RequestItem({ supply, quantity, onRemove, onChangeQty, T }) {
  const [localVal, setLocalVal] = useState(String(quantity));
  const editing = useRef(false);

  // Solo sincronizar desde afuera cuando el usuario NO está escribiendo (botones +/-)
  useEffect(() => {
    if (!editing.current) setLocalVal(String(quantity));
  }, [quantity]);

  const commit = () => {
    editing.current = false;
    const n = parseInt(localVal, 10);
    if (!isNaN(n) && n >= 1) onChangeQty(supply.id_insumo, n);
    else setLocalVal(String(quantity));
  };

  return (
    <div className="flex items-center gap-2 py-2 px-3 last:border-0 animate-slide-in"
      style={{ borderBottom: `1px solid ${T.border}` }}>
      <div className="w-7 h-7 rounded flex items-center justify-center flex-shrink-0"
        style={{ background: T.isDark ? "rgba(37,99,235,0.15)" : "#eff6ff", border: "1px solid rgba(59,130,246,0.2)" }}>
        <Package size={12} style={{ color: "#3b82f6" }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-semibold truncate leading-tight" style={{ color: T.text }}>{supply.nombre}</p>
        <p className="text-[9px] font-mono" style={{ color: T.textFaint }}>
          #{String(supply.id_insumo).padStart(4, "0")} · stock: {supply.stock}
        </p>
      </div>
      {/* Controles de cantidad */}
      <div className="flex items-center gap-1 flex-shrink-0">
        <button onClick={() => onChangeQty(supply.id_insumo, quantity - 1)}
          className="w-5 h-5 rounded flex items-center justify-center transition-colors"
          style={{ background: T.isDark ? "rgba(255,255,255,0.06)" : T.surfaceAlt, border: `1px solid ${T.border}`, color: T.textMuted }}>
          <Minus size={9} />
        </button>
        <input
          type="text"
          inputMode="numeric"
          value={localVal}
          onChange={e => { editing.current = true; setLocalVal(e.target.value); }}
          onBlur={commit}
          onKeyDown={e => { if (e.key === "Enter") e.target.blur(); }}
          className="text-[11px] font-black text-center rounded outline-none"
          style={{ width: "28px", background: T.surfaceAlt, border: `1px solid ${T.border}`, color: T.text, padding: "1px 2px" }}
        />
        <button onClick={() => onChangeQty(supply.id_insumo, quantity + 1)}
          disabled={quantity >= supply.stock}
          className="w-5 h-5 rounded flex items-center justify-center transition-colors disabled:opacity-30"
          style={{ background: T.isDark ? "rgba(37,99,235,0.15)" : "#eff6ff", border: "1px solid rgba(59,130,246,0.3)", color: "#3b82f6" }}>
          <Plus size={9} />
        </button>
      </div>
      <button onClick={() => onRemove(supply.id_insumo)}
        className="w-6 h-6 rounded flex items-center justify-center flex-shrink-0 transition-colors"
        style={{ background: T.isDark ? "rgba(239,68,68,0.12)" : "#fef2f2", border: "1px solid rgba(239,68,68,0.2)", color: "#f87171" }}
        onMouseEnter={e => { e.currentTarget.style.background = T.isDark ? "rgba(239,68,68,0.25)" : "#fee2e2"; e.currentTarget.style.color = "#dc2626"; }}
        onMouseLeave={e => { e.currentTarget.style.background = T.isDark ? "rgba(239,68,68,0.12)" : "#fef2f2"; e.currentTarget.style.color = "#f87171"; }}>
        <Trash2 size={10} />
      </button>
    </div>
  );
}

const ESTATUS_META = {
  "En proceso":  { color: "#d97706", bg: "rgba(217,119,6,0.12)",  border: "rgba(217,119,6,0.3)",  icon: Clock        },
  "Aceptado":    { color: "#16a34a", bg: "rgba(22,163,74,0.12)",  border: "rgba(22,163,74,0.3)",  icon: CheckCircle2 },
  "Rechazado":   { color: "#dc2626", bg: "rgba(220,38,38,0.12)",  border: "rgba(220,38,38,0.3)",  icon: XCircle      },
};

function BadgeEstatus({ estatus }) {
  const s = ESTATUS_META[estatus] || ESTATUS_META["Pendiente"];
  const Icon = s.icon;
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold"
      style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}` }}>
      <Icon size={9} className={estatus === "En proceso" ? "animate-spin" : ""} />
      {estatus || "Pendiente"}
    </span>
  );
}

function ModalResultado({ resultModal, cartEntries, T, onClose }) {
  const isDark = T?.isDark ?? false;
  const surface    = isDark ? "#161B22" : "#ffffff";
  const surfaceAlt = isDark ? "#1a2030" : "#f8fafc";
  const border     = isDark ? "rgba(255,255,255,0.07)" : "#e8ecf0";

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

  return (
    <div
      role="presentation"
      style={{
        position: "fixed", inset: 0, zIndex: 1000,
        background: isDark ? "rgba(0,0,0,0.55)" : "rgba(15,23,42,0.40)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "16px",
        animation: "dmFade 0.15s ease",
      }}
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <style>{`
        @keyframes dmFade  { from{opacity:0} to{opacity:1} }
        @keyframes dmSlide { from{opacity:0;transform:translateY(-5px)} to{opacity:1;transform:translateY(0)} }
      `}</style>
      <div
        role="dialog"
        aria-modal="true"
        style={{
          width: "95%", maxWidth: "440px",
          background: surface,
          border: `1px solid ${border}`,
          borderRadius: "10px",
          display: "flex", flexDirection: "column",
          maxHeight: "90vh", overflow: "hidden",
          boxShadow: isDark
            ? "0 16px 40px rgba(0,0,0,0.50), 0 1px 0 rgba(255,255,255,0.04) inset"
            : "0 16px 40px rgba(15,23,42,0.12), 0 1px 3px rgba(15,23,42,0.06)",
          animation: "dmSlide 0.18s ease",
        }}
      >
        {/* Banda acento */}
        <div style={{ height: "2px", flexShrink: 0, background: resultModal.success ? "#16a34a" : "#dc2626", borderRadius: "10px 10px 0 0" }} />

        {/* Header */}
        <div style={{
          padding: "14px 18px 12px",
          borderBottom: `1px solid ${border}`,
          display: "flex", alignItems: "flex-start", justifyContent: "space-between",
          gap: "12px", flexShrink: 0,
        }}>
          <div style={{ minWidth: 0, flex: 1 }}>
            <p style={{ margin: 0, fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.09em", color: resultModal.success ? "#16a34a" : "#dc2626" }}>
              {resultModal.success ? "Solicitud" : "Error"}
            </p>
            <h2 style={{ margin: "3px 0 0", fontSize: "16px", fontWeight: 700, color: T.text, letterSpacing: "-0.02em", lineHeight: 1.2 }}>
              {resultModal.success ? "Solicitud creada" : "Error al crear"}
            </h2>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexShrink: 0, paddingTop: "2px" }}>
            <img
              src={isDark ? "/assets/img/logo blanco.png" : "/assets/img/logo negro.png"}
              alt="Precision Trucks"
              style={{ height: "28px", width: "auto", objectFit: "contain", opacity: isDark ? 0.80 : 0.70 }}
            />
            <button
              onClick={onClose}
              style={{ width: "26px", height: "26px", display: "flex", alignItems: "center", justifyContent: "center", background: "transparent", border: `1px solid ${border}`, borderRadius: "6px", cursor: "pointer", color: T.textFaint, transition: "all 0.12s" }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = T.textMuted; e.currentTarget.style.color = T.text; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = border; e.currentTarget.style.color = T.textFaint; }}
            >
              <X size={12} strokeWidth={2} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "16px 18px", display: "flex", flexDirection: "column", gap: "14px" }}>
          {resultModal.success ? (
            <>
              {/* Folio + mensaje */}
              <div className="flex items-center gap-3 p-3 rounded-xl"
                style={{ background: isDark ? "rgba(22,163,74,0.10)" : "#f0fdf4", border: "1px solid rgba(22,163,74,0.25)" }}>
                <CheckCircle2 size={20} style={{ color: "#16a34a", flexShrink: 0 }} />
                <div>
                  <p style={{ margin: 0, fontSize: "11px", fontWeight: 700, color: "#16a34a" }}>Registrada correctamente</p>
                  <p style={{ margin: "2px 0 0", fontSize: "13px", fontWeight: 800, fontFamily: "monospace", color: T.orange }}>#{resultModal.folio}</p>
                </div>
              </div>

              {/* Detalle de insumos */}
              {cartEntries.length > 0 && (
                <div>
                  <p style={{ margin: "0 0 8px", fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: T.textMuted }}>
                    Insumos solicitados ({cartEntries.length})
                  </p>
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    {cartEntries.map(({ supply, quantity, id }) => (
                      <div key={id} className="flex items-center gap-3 px-3 py-2 rounded-lg"
                        style={{ background: surfaceAlt, border: `1px solid ${border}` }}>
                        {/* Imagen o icono */}
                        <div style={{
                          width: "36px", height: "36px", borderRadius: "8px", flexShrink: 0,
                          background: isDark ? "rgba(255,255,255,0.05)" : "#f1f5f9",
                          border: `1px solid ${border}`,
                          overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center",
                        }}>
                          {supply.imagen_url
                            ? <img src={supply.imagen_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                            : <Package size={14} style={{ color: T.textFaint }} />
                          }
                        </div>
                        {/* Info */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ margin: 0, fontSize: "12px", fontWeight: 600, color: T.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {supply.nombre}
                          </p>
                          {(supply.marca || supply.modelo) && (
                            <p style={{ margin: "1px 0 0", fontSize: "10px", color: T.textFaint }}>
                              {[supply.marca, supply.modelo].filter(Boolean).join(" · ")}
                            </p>
                          )}
                        </div>
                        {/* Cantidad */}
                        <span style={{
                          flexShrink: 0, fontSize: "12px", fontWeight: 800,
                          padding: "2px 10px", borderRadius: "99px",
                          background: isDark ? "rgba(37,99,235,0.15)" : "#eff6ff",
                          color: "#3b82f6", border: "1px solid rgba(59,130,246,0.25)",
                        }}>
                          ×{quantity}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <p style={{ margin: 0, fontSize: "11px", color: T.textFaint, lineHeight: 1.5 }}>
                El equipo revisará tu solicitud y te notificará cuando sea atendida.
              </p>
            </>
          ) : (
            <div className="flex items-start gap-3 p-3 rounded-xl"
              style={{ background: isDark ? "rgba(220,38,38,0.10)" : "#fef2f2", border: "1px solid rgba(220,38,38,0.25)" }}>
              <AlertCircle size={16} style={{ color: "#dc2626", flexShrink: 0, marginTop: "1px" }} />
              <p style={{ margin: 0, fontSize: "13px", color: T.text, lineHeight: 1.5 }}>{resultModal.message}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: "10px 18px",
          borderTop: `1px solid ${border}`,
          background: surfaceAlt,
          display: "flex", justifyContent: "flex-end",
          flexShrink: 0,
        }}>
          <button
            onClick={onClose}
            style={{
              padding: "6px 20px", borderRadius: "6px",
              fontSize: "12px", fontWeight: 700,
              background: resultModal.success ? "#2563eb" : "transparent",
              border: resultModal.success ? "none" : `1px solid ${border}`,
              color: resultModal.success ? "#fff" : T.textMuted,
              cursor: "pointer", transition: "all 0.12s",
            }}
            onMouseEnter={e => { if (!resultModal.success) { e.currentTarget.style.borderColor = T.textMuted; e.currentTarget.style.color = T.text; } else { e.currentTarget.style.opacity = "0.88"; } }}
            onMouseLeave={e => { e.currentTarget.style.opacity = "1"; if (!resultModal.success) { e.currentTarget.style.borderColor = border; e.currentTarget.style.color = T.textMuted; } }}
          >
            {resultModal.success ? "Ver solicitud" : "Cerrar"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function SolicitudInsumo({ usuario = {}, T, initialTab }) {
  const [supplies,        setSupplies]        = useState([]);
  const [requestCart,     setRequestCart]     = useState({});
  const [priority,        setPriority]        = useState("");
  const [justification,   setJustification]   = useState("");
  const [searchQuery,     setSearchQuery]     = useState("");
  const [categoryFilter,  setCategoryFilter]  = useState("Todos");
  const [isLoading,       setIsLoading]       = useState(true);
  const [isSubmitting,    setIsSubmitting]    = useState(false);
  const [resultModal,     setResultModal]     = useState(null);
  const [animatingId,     setAnimatingId]     = useState(null);
  const [tab,             setTab]             = useState(initialTab || "nueva");
  const [drawerOpen,      setDrawerOpen]      = useState(false);
  // eslint-disable-next-line no-unused-vars
  const [solicitudes,     setSolicitudes]     = useState([]);
  const [loadingSols,     setLoadingSols]     = useState(false);
  const [solicitudVer,    setSolicitudVer]    = useState(null);
  const [insumoDetalle,   setInsumoDetalle]   = useState(null);
  const [filtrosSol,      setFiltrosSol]      = useState({ busqueda: "", estatus: "Todos", prioridad: "Todos" });
  const [paginaSol,       setPaginaSol]       = useState(1);
  const LIMIT_SOL = 50;

  useEffect(() => { if (initialTab) setTab(initialTab); }, [initialTab]);

  const requesterName = [usuario.nombre, usuario.ap_paterno, usuario.ap_materno]
    .filter(Boolean).join(" ") || "—";

  useEffect(() => {
    apiFetch(API_ROUTES.INSUMOS)
      .then(r => { if (!r.ok) throw new Error(); return r.json(); })
      .then(data => setSupplies(Array.isArray(data) ? data : []))
      .catch(() => setSupplies([]))
      .finally(() => setIsLoading(false));
  }, []);

  const cargarSolicitudes = useCallback(() => {
    if (!usuario?.id_empleado) return;
    setLoadingSols(true);
    apiFetch(API_ROUTES.SOLICITUDES_EMP(usuario.id_empleado))
      .then(r => r.json())
      .then(d => setSolicitudes(Array.isArray(d?.data) ? d.data : Array.isArray(d) ? d : []))
      .catch(() => {})
      .finally(() => setLoadingSols(false));
  }, [usuario?.id_empleado]);

  useEffect(() => { if (tab === "historial") cargarSolicitudes(); }, [tab, cargarSolicitudes]);

  const camposFiltroSol = [
    { key: "busqueda",  label: "Búsqueda Rápida", type: "search",  placeholder: "Folio..." },
    { key: "estatus",   label: "Estatus",          type: "select",  opts: ["Todos", "En proceso", "Aceptado", "Rechazado"] },
    { key: "prioridad", label: "Prioridad",         type: "select",  opts: ["Todos", "Urgente", "Alta", "Media", "Baja"] },
  ];
  const limpiarFiltrosSol = () => { setFiltrosSol({ busqueda: "", estatus: "Todos", prioridad: "Todos" }); setPaginaSol(1); };
  const hayFiltrosSol = filtrosSol.busqueda || filtrosSol.estatus !== "Todos" || filtrosSol.prioridad !== "Todos";
  const handleFiltroSolChange = (k, v) => { setFiltrosSol(p => ({ ...p, [k]: v })); setPaginaSol(1); };

  const filtradosSol = solicitudes.filter(s => {
    if (filtrosSol.busqueda && !s.folio_solicitud?.toLowerCase().includes(filtrosSol.busqueda.toLowerCase())) return false;
    if (filtrosSol.estatus   !== "Todos" && s.estatus   !== filtrosSol.estatus)   return false;
    if (filtrosSol.prioridad !== "Todos" && s.prioridad !== filtrosSol.prioridad) return false;
    return true;
  });
  const totalPaginasSol = Math.max(1, Math.ceil(filtradosSol.length / LIMIT_SOL));
  const paginadosSol    = filtradosSol.slice((paginaSol - 1) * LIMIT_SOL, paginaSol * LIMIT_SOL);
  const irPaginaSol     = p => { if (p >= 1 && p <= totalPaginasSol) setPaginaSol(p); };
  const fmtSol          = d => d ? new Date(d).toLocaleDateString("es-MX", { day: "2-digit", month: "2-digit", year: "numeric" }) : "-";

  const categories = ["Todos", ...Array.from(new Set(
    supplies.map(s => s.nombre_categoria).filter(Boolean)
  ))];

  const filteredSupplies = supplies.filter(s => {
    if (categoryFilter !== "Todos" && s.nombre_categoria !== categoryFilter) return false;
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return s.nombre?.toLowerCase().includes(q) || s.marca?.toLowerCase().includes(q);
  });

  const handleAddSupply = useCallback((supplyId) => {
    const supply = supplies.find(s => s.id_insumo === supplyId);
    if (!supply) return;
    setRequestCart(prev => {
      const current = prev[supplyId] || 0;
      if (current >= supply.stock) return prev; // no exceder stock
      return { ...prev, [supplyId]: current + 1 };
    });
    setAnimatingId(supplyId);
    setTimeout(() => setAnimatingId(null), 400);
  }, [supplies]);

  const handleRemoveSupply = useCallback((supplyId) => {
    setRequestCart(prev => { const u = { ...prev }; delete u[supplyId]; return u; });
  }, []);

  const handleChangeQty = useCallback((supplyId, newQty) => {
    if (newQty < 1) { handleRemoveSupply(supplyId); return; }
    const supply = supplies.find(s => s.id_insumo === supplyId);
    if (!supply) return;
    const clamped = Math.min(newQty, supply.stock);
    setRequestCart(prev => ({ ...prev, [supplyId]: clamped }));
  }, [supplies, handleRemoveSupply]);

  const cartEntries = Object.entries(requestCart)
    .map(([id, qty]) => ({ supply: supplies.find(s => s.id_insumo === parseInt(id)), quantity: qty, id }))
    .filter(e => e.supply);

  const totalItemCount = Object.values(requestCart).reduce((sum, n) => sum + n, 0);
  const isTicketValid  = cartEntries.length > 0 && justification.trim().length > 0;

  const handleSubmitTicket = async () => {
    if (!isTicketValid || !usuario?.id_empleado) return;
    const payload = {
      prioridad:   priority || "Media",
      id_empleado: parseInt(usuario.id_empleado, 10),
      insumos:     Object.entries(requestCart).map(([id, qty]) => ({
        id_insumo:   parseInt(id, 10),
        cantidad:    parseInt(qty, 10),
        descripcion: justification.trim() || null,
      })),
    };
    setIsSubmitting(true);
    try {
      const res  = await apiFetch(API_ROUTES.SOLICITUDES, { method: "POST", body: payload });
      const data = await res.json();
      if (!res.ok) {
        const errorMsg = data.errores ? data.errores.map(e => e.mensaje).join(", ") : (data.error || "Error al crear el ticket");
        // Si es error de stock, refrescar catálogo y corregir carrito
        if (res.status === 400 && errorMsg.toLowerCase().includes("stock")) {
          try {
            const r = await apiFetch(API_ROUTES.INSUMOS);
            if (r.ok) {
              const fresh = await r.json();
              if (Array.isArray(fresh)) {
                setSupplies(fresh);
                // Ajustar cantidades del carrito al stock real
                setRequestCart(prev => {
                  const next = { ...prev };
                  for (const [id, qty] of Object.entries(next)) {
                    const ins = fresh.find(s => s.id_insumo === parseInt(id));
                    if (!ins || ins.stock === 0) delete next[id];
                    else if (qty > ins.stock) next[id] = ins.stock;
                  }
                  return next;
                });
              }
            }
          } catch {}
        }
        setResultModal({ success: false, message: errorMsg });
        return;
      }
      setResultModal({ success: true, folio: data.folio_solicitud, id_solicitud: data.id_solicitud, _cartSnapshot: cartEntries.map(e => ({ ...e })) });
      setRequestCart({});
      setPriority("");
      setJustification("");
    } catch {
      setResultModal({ success: false, message: "No se pudo conectar con el servidor" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const activePriority = PRIORITY_OPTIONS.find(p => p.value === priority);
  const { card: cardSol, hdr: hdrSol } = useCardStyles(T);

  if (solicitudVer) return (
    <VistaSolicitud T={T} id_solicitud={solicitudVer.id_solicitud} onBack={() => setSolicitudVer(null)} />
  );

  return (
    <div style={{ background: T.bg }}>
      <div style={{ maxWidth: "1400px", width: "100%", margin: "0 auto", padding: "12px 16px", display: "flex", flexDirection: "column", gap: "10px" }}>

        {/* Pestañas */}
        <div className="flex gap-1 rounded-xl p-1 w-fit"
          style={{ background: T.surface, border: `1px solid ${T.border}`, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
          {[
            { id: "nueva",     label: "Nueva Solicitud",  icon: Plus    },
            { id: "historial", label: "Mis Solicitudes",   icon: History },
          ].map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setTab(id)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all"
              style={{
                background: tab === id ? "#2563eb" : "transparent",
                color:      tab === id ? "#fff"    : T.textMuted,
              }}>
              <Icon size={13} />{label}
            </button>
          ))}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "12px", flex: 1, minHeight: 0 }}
          className="lg:flex-row lg:items-start">

          {/* Columna izquierda */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12, flex: 1, minWidth: 0, paddingBottom: tab === "nueva" ? 80 : 0 }}>

            {/* Historial */}
            {tab === "historial" && (
              <div className="flex flex-col gap-2">
                <FiltrosToolbar campos={camposFiltroSol} valores={filtrosSol} onChange={handleFiltroSolChange} onLimpiar={limpiarFiltrosSol} T={T} />

                <div className="rounded-xl overflow-hidden flex flex-col" style={{ ...cardSol, flex: "1 1 0", minHeight: "300px" }}>
                  <div className="flex items-center justify-between px-4 py-3 flex-shrink-0" style={hdrSol}>
                    <div className="flex items-center gap-1.5">
                      <div className="w-0.5 h-3.5 rounded-full" style={{ background: T.orange }} />
                      <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: T.textMuted }}>Mis Solicitudes</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {loadingSols && (
                        <svg className="animate-spin" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={T.orange} strokeWidth="2.5"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                      )}
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded-full"
                        style={{ background: T.bg, color: T.textMuted, border: `1px solid ${T.border}` }}>
                        {filtradosSol.length} resultado{filtradosSol.length !== 1 ? "s" : ""}{totalPaginasSol > 1 ? ` · pág. ${paginaSol}/${totalPaginasSol}` : ""}
                      </span>
                    </div>
                  </div>

                  {/* Móvil */}
                  <div className="flex flex-col gap-2 p-3 sm:hidden" style={{ overflowY: "auto", flex: "1 1 0", minHeight: 0 }}>
                    {paginadosSol.length === 0
                      ? <div className="flex flex-col items-center justify-center py-8 gap-2">
                          <Inbox size={20} style={{ color: T.textFaint }} />
                          <p className="text-xs font-bold" style={{ color: T.textMuted }}>{hayFiltrosSol ? "Sin resultados" : "Sin solicitudes"}</p>
                        </div>
                      : paginadosSol.map(sol => {
                          const m = ESTATUS_META[sol.estatus] || ESTATUS_META["Pendiente"];
                          return (
                            <div key={sol.id_solicitud}
                              className="rounded-xl p-3 flex flex-col gap-2 active:scale-[0.98] transition-all cursor-pointer"
                              style={{ background: T.isDark ? "rgba(255,255,255,0.04)" : T.surfaceAlt, border: `1px solid ${T.border}` }}
                              onClick={() => setSolicitudVer(sol)}>
                              <div className="flex items-center justify-between gap-2">
                                <span className="font-mono text-[11px] font-black" style={{ color: T.orange }}>{sol.folio_solicitud}</span>
                                <BadgeEstatus estatus={sol.estatus} />
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-[11px] font-bold" style={{ color: ESTATUS_META[sol.prioridad]?.color || T.textMuted }}>{sol.prioridad || "—"}</span>
                                <span className="text-[11px]" style={{ color: T.textFaint }}>{fmtSol(sol.fecha)}</span>
                              </div>
                            </div>
                          );
                        })
                    }
                  </div>

                  {/* Desktop */}
                  <div className="hidden sm:block" style={{ overflowX: "auto", overflowY: "auto", flex: "1 1 0", minHeight: 0 }}>
                    <table className="w-full border-collapse" style={{ minWidth: "500px" }}>
                      <thead className="sticky top-0 z-10">
                        <tr style={{ background: T.isDark ? "rgba(255,255,255,0.03)" : T.surfaceAlt }}>
                          {["Folio", "Prioridad", "Estatus", "Sucursal", "Fecha", ""].map((col, i) => (
                            <th key={i} className="text-left px-3 py-2 text-[9px] font-black uppercase tracking-widest whitespace-nowrap"
                              style={{ color: T.textMuted, borderBottom: `1px solid ${T.border}` }}>
                              {col}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {paginadosSol.length === 0
                          ? <tr><td colSpan={5}>
                              <div className="flex flex-col items-center justify-center py-12 gap-2">
                                <Inbox size={22} style={{ color: T.textFaint }} />
                                <p className="text-xs font-bold" style={{ color: T.textMuted }}>{hayFiltrosSol ? "Sin resultados" : "Sin solicitudes registradas"}</p>
                              </div>
                            </td></tr>
                          : paginadosSol.map((sol, i) => {
                              const bgRow = i % 2 === 0 ? (T.isDark ? "#141720" : T.surface) : (T.isDark ? "#1c2030" : T.surfaceAlt);
                              const m = ESTATUS_META[sol.estatus] || ESTATUS_META["Pendiente"];
                              const PCOLOR = { Urgente: "#dc2626", Alta: "#ea580c", Media: "#ca8a04", Baja: "#16a34a" };
                              return (
                                <tr key={sol.id_solicitud} className="cursor-pointer transition-colors"
                                  style={{ background: bgRow, borderBottom: `1px solid ${T.border}` }}
                                  onMouseEnter={e => e.currentTarget.style.background = T.isDark ? "rgba(244,121,32,0.05)" : "rgba(244,121,32,0.03)"}
                                  onMouseLeave={e => e.currentTarget.style.background = bgRow}
                                  onClick={() => setSolicitudVer(sol)}>
                                  <td className="px-3 py-2 font-mono text-[10px] font-bold" style={{ color: T.orange }}>{sol.folio_solicitud}</td>
                                  <td className="px-3 py-2">
                                    <span className="flex items-center gap-1 text-[11px] font-bold">
                                      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: PCOLOR[sol.prioridad] || "#94a3b8" }} />
                                      <span style={{ color: PCOLOR[sol.prioridad] || T.textMuted }}>{sol.prioridad || "—"}</span>
                                    </span>
                                  </td>
                                  <td className="px-3 py-2">
                                    <BadgeEstatus estatus={sol.estatus} />
                                  </td>
                                  <td className="px-3 py-2 text-[11px] whitespace-nowrap" style={{ color: T.textMuted }}>{sol.nombre_sucursal || "—"}</td>
                                  <td className="px-3 py-2 text-[11px] whitespace-nowrap" style={{ color: T.textMuted }}>{fmtSol(sol.fecha)}</td>
                                  <td className="px-3 py-2">
                                    <button onClick={e => { e.stopPropagation(); setSolicitudVer(sol); }}
                                      className="flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-lg transition-all hover:brightness-110 active:scale-95"
                                      style={{ color: T.orange, background: "rgba(244,121,32,0.08)", border: "1px solid rgba(244,121,32,0.2)" }}>
                                      <Eye size={10} /> Ver
                                    </button>
                                  </td>
                                </tr>
                              );
                            })
                        }
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Paginación */}
                {totalPaginasSol > 1 && (
                  <div className="flex items-center justify-center gap-2 py-2">
                    <button onClick={() => irPaginaSol(1)} disabled={paginaSol === 1}
                      className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-all hover:brightness-110 disabled:opacity-30"
                      style={{ background: T.isDark ? "rgba(255,255,255,0.06)" : T.surfaceAlt, color: T.textMuted, border: `1px solid ${T.border}` }}>«</button>
                    <button onClick={() => irPaginaSol(paginaSol - 1)} disabled={paginaSol === 1}
                      className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-all hover:brightness-110 disabled:opacity-30"
                      style={{ background: T.isDark ? "rgba(255,255,255,0.06)" : T.surfaceAlt, color: T.textMuted, border: `1px solid ${T.border}` }}>‹ Anterior</button>
                    {Array.from({ length: Math.min(5, totalPaginasSol) }, (_, i) => {
                      const start = Math.max(1, Math.min(paginaSol - 2, totalPaginasSol - 4));
                      const p = start + i;
                      if (p > totalPaginasSol) return null;
                      return (
                        <button key={p} onClick={() => irPaginaSol(p)}
                          className="w-8 h-8 rounded-lg text-[11px] font-bold transition-all hover:brightness-110"
                          style={{ background: p === paginaSol ? T.orange : (T.isDark ? "rgba(255,255,255,0.06)" : T.surfaceAlt), color: p === paginaSol ? "#fff" : T.textMuted, border: `1px solid ${p === paginaSol ? T.orange : T.border}` }}>
                          {p}
                        </button>
                      );
                    })}
                    <button onClick={() => irPaginaSol(paginaSol + 1)} disabled={paginaSol === totalPaginasSol}
                      className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-all hover:brightness-110 disabled:opacity-30"
                      style={{ background: T.isDark ? "rgba(255,255,255,0.06)" : T.surfaceAlt, color: T.textMuted, border: `1px solid ${T.border}` }}>Siguiente ›</button>
                    <button onClick={() => irPaginaSol(totalPaginasSol)} disabled={paginaSol === totalPaginasSol}
                      className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-all hover:brightness-110 disabled:opacity-30"
                      style={{ background: T.isDark ? "rgba(255,255,255,0.06)" : T.surfaceAlt, color: T.textMuted, border: `1px solid ${T.border}` }}>»</button>
                  </div>
                )}
              </div>
            )}

            {/* Tab catálogo */}
            {false && (
              <VistaInsumos T={T} />
            )}

            {/* Tab nueva */}
            {tab === "nueva" && (<>
              {/* Barra búsqueda + categorías */}
              <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: "10px 12px", display: "flex", flexDirection: "column", gap: 8 }}>
                {/* Búsqueda */}
                <div style={{ position: "relative" }}>
                  <Search size={13} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: T.textFaint, pointerEvents: "none" }} />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Buscar insumo por nombre o marca…"
                    style={{ width: "100%", paddingLeft: 32, paddingRight: 12, height: 36, borderRadius: 8, fontSize: 12, outline: "none", background: T.surfaceAlt, border: `1px solid ${T.border}`, color: T.text, boxSizing: "border-box" }}
                    onFocus={e => { e.target.style.borderColor = "#3b82f6"; e.target.style.background = T.surface; }}
                    onBlur={e  => { e.target.style.borderColor = T.border;  e.target.style.background = T.surfaceAlt; }}
                  />
                </div>
                {/* Categorías + contador */}
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
                  {categories.map(cat => (
                    <button key={cat} onClick={() => setCategoryFilter(cat)}
                      style={{
                        padding: "3px 10px", borderRadius: 6, fontSize: 11, fontWeight: 600,
                        background: categoryFilter === cat ? "#2563eb" : T.surfaceAlt,
                        color:      categoryFilter === cat ? "#fff"    : T.textMuted,
                        border:     categoryFilter === cat ? "1px solid #2563eb" : `1px solid ${T.border}`,
                        cursor: "pointer", whiteSpace: "nowrap",
                      }}>
                      {cat}
                    </button>
                  ))}
                  <span style={{ fontSize: 11, fontFamily: "monospace", color: T.textFaint, marginLeft: "auto", whiteSpace: "nowrap" }}>
                    {filteredSupplies.length} resultado{filteredSupplies.length !== 1 ? "s" : ""}
                  </span>
                </div>
              </div>

              {/* Vista móvil — cards (< sm) */}
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }} className="sm:hidden">
                {isLoading ? (
                  <div style={{ display: "flex", justifyContent: "center", padding: "40px 0" }}>
                    <svg className="animate-spin" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={T.orange} strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
                  </div>
                ) : filteredSupplies.length === 0 ? (
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "40px 0", gap: 8, color: T.textFaint }}>
                    <Package size={26} />
                    <span style={{ fontSize: 12, fontWeight: 600 }}>Sin resultados</span>
                  </div>
                ) : filteredSupplies.map(supply => {
                  const isAdded = !!requestCart[supply.id_insumo];
                  const atMax   = (requestCart[supply.id_insumo] || 0) >= supply.stock;
                  const badge   = STATUS_BADGE[supply.stock === 0 ? "Agotado" : supply.stock < 5 ? "Bajo" : "Disponible"];
                  return (
                    <div key={supply.id_insumo}
                      style={{
                        background: T.surface,
                        border: `1px solid ${isAdded ? "rgba(37,99,235,0.4)" : T.border}`,
                        borderRadius: 10, padding: 12,
                        display: "flex", flexDirection: "column", gap: 8,
                      }}>
                      {/* Fila superior: nombre + badge */}
                      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: 2, flex: 1, minWidth: 0 }}>
                          <button onClick={() => setInsumoDetalle(supply)}
                            style={{ fontSize: 12, fontWeight: 700, textAlign: "left", color: T.text, background: "none", border: "none", padding: 0, cursor: "pointer", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {supply.nombre}
                          </button>
                          {(supply.marca || supply.modelo) && (
                            <span style={{ fontSize: 10, color: T.textFaint }}>{[supply.marca, supply.modelo].filter(Boolean).join(" · ")}</span>
                          )}
                        </div>
                        <span style={{ flexShrink: 0, fontSize: 10, fontWeight: 600, padding: "2px 6px", borderRadius: 4, background: badge.bg, color: badge.color, border: `1px solid ${badge.border}` }}>
                          {badge.label}
                        </span>
                      </div>
                      {/* Fila inferior: stock + acción */}
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                        <div style={{ flex: 1 }}><StockBar stock={supply.stock} maxStock={100} /></div>
                        {supply.stock === 0 ? (
                          <span style={{ fontSize: 10, fontWeight: 700, padding: "4px 8px", borderRadius: 6, background: T.surfaceAlt, color: T.textFaint, border: `1px solid ${T.border}`, flexShrink: 0 }}>Agotado</span>
                        ) : isAdded ? (
                          <button onClick={() => !atMax && handleAddSupply(supply.id_insumo)} disabled={atMax}
                            style={{ fontSize: 10, fontWeight: 700, padding: "4px 10px", borderRadius: 6, flexShrink: 0, background: T.isDark ? "rgba(37,99,235,0.15)" : "#eff6ff", color: "#3b82f6", border: "1px solid rgba(59,130,246,0.3)", cursor: atMax ? "not-allowed" : "pointer", opacity: atMax ? 0.4 : 1 }}>
                            {atMax ? `Máx (${supply.stock})` : "+ Otro"}
                          </button>
                        ) : (
                          <button onClick={() => handleAddSupply(supply.id_insumo)}
                            style={{ fontSize: 10, fontWeight: 700, padding: "4px 10px", borderRadius: 6, flexShrink: 0, background: "#2563eb", color: "#fff", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
                            <Plus size={10} /> Agregar
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Vista desktop — tabla (>= sm) */}
              <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, overflow: "hidden", flexDirection: "column", maxHeight: "clamp(300px, 60vh, calc(100vh - 280px))" }} className="hidden sm:flex">
                <div style={{ overflowX: "auto", overflowY: "auto", flex: 1 }}>
                  <table className="w-full text-left border-collapse" style={{ minWidth: "520px" }}>
                    <thead>
                      <tr style={{ background: T.surfaceAlt, position: "sticky", top: 0, zIndex: 10 }}>
                        {["ID / Nombre", "Categoría", "Stock Actual", "Estado", "Acción"].map(col => (
                          <th key={col} style={{ padding: "8px 12px", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", whiteSpace: "nowrap", color: T.textMuted, borderBottom: `1px solid ${T.border}` }}>
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {isLoading ? (
                        <tr><td colSpan={5} style={{ padding: "64px 0", textAlign: "center" }}>
                          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, color: T.textFaint }}>
                            <svg className="animate-spin" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
                            <span style={{ fontSize: 12 }}>Cargando insumos…</span>
                          </div>
                        </td></tr>
                      ) : filteredSupplies.length === 0 ? (
                        <tr><td colSpan={5} style={{ padding: "64px 0", textAlign: "center" }}>
                          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, color: T.textFaint }}>
                            <Package size={28} />
                            <span style={{ fontSize: 13, fontWeight: 600 }}>Sin resultados</span>
                            <span style={{ fontSize: 11 }}>Intenta con otro filtro o búsqueda</span>
                          </div>
                        </td></tr>
                      ) : (
                        filteredSupplies.map(supply => (
                          <SupplyRow
                            key={supply.id_insumo}
                            supply={supply}
                            isAdded={!!requestCart[supply.id_insumo]}
                            onAdd={handleAddSupply}
                            animatingId={animatingId}
                            cartQty={requestCart[supply.id_insumo] || 0}
                            onDetail={setInsumoDetalle}
                            T={T}
                          />
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>)}
          </div>

          {/* Columna derecha — panel (solo desktop) */}
          <div className="hidden lg:block lg:sticky lg:top-4" style={{ width: "300px", flexShrink: 0 }}>
            <div className="rounded-xl overflow-hidden"
              style={{ background: T.surface, border: `1px solid ${T.border}`, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>

              {/* Header panel */}
              <div className="px-4 py-3 flex items-center justify-between"
                style={{ background: T.isDark ? T.surfaceAlt : "#1e3a5f" }}>
                <div className="flex items-center gap-2">
                  <Ticket size={14} style={{ color: "#60a5fa" }} />
                  <span className="text-[12px] font-bold uppercase tracking-wider" style={{ color: "#fff" }}>
                    Solicitud en Proceso
                  </span>
                </div>
                {totalItemCount > 0 && (
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full"
                    style={{ background: "#2563eb", color: "#fff" }}>
                    {totalItemCount}
                  </span>
                )}
              </div>

              {/* Solicitante */}
              <div className="px-4 py-3" style={{ background: T.isDark ? T.surfaceAlt : "#f0f4f8", borderBottom: `1px solid ${T.border}` }}>
                <p className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: T.textFaint }}>Solicitante</p>
                <div className="flex flex-col gap-1.5">
                  {[
                    { label: "Nombre",   value: requesterName },
                    { label: "Área",     value: usuario.departamento || "—" },
                    { label: "Sucursal", value: usuario.sucursal || "—" },
                    { label: "Fecha",    value: new Date().toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" }) },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex items-baseline justify-between gap-2">
                      <span className="text-[10px] flex-shrink-0" style={{ color: T.textFaint }}>{label}</span>
                      <span className="text-[11px] font-semibold text-right truncate" style={{ color: T.text }}>{value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Carrito */}
              <div className="flex flex-col" style={{ minHeight: "80px" }}>
                {cartEntries.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 px-4 gap-2" style={{ color: T.textFaint }}>
                    <Package size={24} />
                    <span className="text-[11px] text-center">Agrega insumos desde la tabla</span>
                  </div>
                ) : (
                  cartEntries.map(({ supply, quantity, id }) => (
                    <RequestItem key={id} supply={supply} quantity={quantity} onRemove={handleRemoveSupply} onChangeQty={handleChangeQty} T={T} />
                  ))
                )}
              </div>

              {/* Prioridad + justificación + botón */}
              <div className="px-4 py-4 flex flex-col gap-3" style={{ borderTop: `1px solid ${T.border}` }}>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider block mb-1.5" style={{ color: T.textMuted }}>
                    Prioridad
                  </label>
                  <div className="relative">
                    <select
                      value={priority}
                      onChange={e => setPriority(e.target.value)}
                      className="w-full h-9 pl-3 pr-8 rounded-lg text-[12px] font-semibold border outline-none appearance-none cursor-pointer transition-colors"
                      style={{
                        background:  activePriority ? activePriority.bg    : T.surfaceAlt,
                        color:       activePriority ? activePriority.color  : T.textFaint,
                        borderColor: activePriority ? activePriority.border : T.border,
                      }
                      }>
                      <option value="" disabled>Seleccionar prioridad…</option>
                      {PRIORITY_OPTIONS.map(p => (
                        <option key={p.value} value={p.value}>{p.label}</option>
                      ))}
                    </select>
                    <ChevronDown size={13}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
                      style={{ color: activePriority ? activePriority.color : T.textFaint }} />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider block mb-1.5" style={{ color: T.textMuted }}>
                    Justificación / Motivo <span style={{ color: "#ef4444" }}>*</span>
                  </label>
                  <textarea
                    rows={3}
                    value={justification}
                    onChange={e => setJustification(e.target.value)}
                    placeholder="Describe el motivo de esta solicitud…"
                    className="w-full px-3 py-2 rounded-lg text-[12px] outline-none resize-none transition-colors"
                    style={{
                      background:  justification.trim() ? T.surfaceAlt : (T.isDark ? "rgba(239,68,68,0.08)" : "#fff5f5"),
                      borderColor: justification.trim() ? T.border      : "rgba(239,68,68,0.4)",
                      border:      `1px solid ${justification.trim() ? T.border : "rgba(239,68,68,0.4)"}`,
                      color:       T.text,
                    }}
                    onFocus={e  => { e.target.style.borderColor = "#3b82f6"; e.target.style.background = T.surface; }}
                    onBlur={e   => {
                      e.target.style.borderColor = justification.trim() ? T.border : "rgba(239,68,68,0.4)";
                      e.target.style.background  = justification.trim() ? T.surfaceAlt : (T.isDark ? "rgba(239,68,68,0.08)" : "#fff5f5");
                    }}
                  />
                </div>

                {!isTicketValid && (
                  <div className="flex items-start gap-1.5 px-2.5 py-2 rounded-lg"
                    style={{ background: T.surfaceAlt, border: `1px solid ${T.border}` }}>
                    <AlertCircle size={11} className="mt-0.5 flex-shrink-0" style={{ color: T.textFaint }} />
                    <span className="text-[10px] leading-snug" style={{ color: T.textFaint }}>
                      {cartEntries.length === 0
                        ? "Agrega al menos un insumo a la solicitud"
                        : "Escribe la justificación del reporte"}
                    </span>
                  </div>
                )}

                <button
                  onClick={handleSubmitTicket}
                  disabled={!isTicketValid || isSubmitting}
                  className="w-full h-10 rounded-lg text-[13px] font-bold text-white flex items-center justify-center gap-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{
                    background: isTicketValid ? "#2563eb" : T.surfaceAlt,
                    color:      isTicketValid ? "#fff"    : T.textFaint,
                    boxShadow:  isTicketValid ? "0 4px 14px rgba(37,99,235,0.30)" : "none",
                  }}
                >
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                      </svg>
                      Creando…
                    </>
                  ) : (
                    <>
                      <Ticket size={14} />
                      Crear Solicitud de Insumo
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Drawer móvil — panel solicitud ─────────────────────── */}
      {tab === "nueva" && (
        <div className="lg:hidden">
          {/* Barra flotante inferior */}
          <div
            onClick={() => setDrawerOpen(true)}
            style={{
              position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 50,
              background: T.isDark ? "#1e3a5f" : "#1e3a5f",
              borderTop: "2px solid rgba(96,165,250,0.3)",
              padding: "10px 16px",
              display: "flex", alignItems: "center", justifyContent: "space-between",
              cursor: "pointer",
              boxShadow: "0 -4px 20px rgba(0,0,0,0.25)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Ticket size={16} style={{ color: "#60a5fa" }} />
              <span style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>Solicitud en Proceso</span>
              {totalItemCount > 0 && (
                <span style={{ fontSize: 11, fontWeight: 800, padding: "1px 8px", borderRadius: 99, background: "#2563eb", color: "#fff" }}>
                  {totalItemCount}
                </span>
              )}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {cartEntries.length > 0 && (
                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.6)" }}>
                  {cartEntries.length} insumo{cartEntries.length !== 1 ? "s" : ""}
                </span>
              )}
              <ChevronDown size={16} style={{ color: "rgba(255,255,255,0.6)", transform: drawerOpen ? "rotate(0deg)" : "rotate(180deg)", transition: "transform 0.2s" }} />
            </div>
          </div>

          {/* Overlay + Drawer */}
          {drawerOpen && (
            <>
              <div
                onClick={() => setDrawerOpen(false)}
                style={{ position: "fixed", inset: 0, zIndex: 51, background: "rgba(0,0,0,0.45)" }}
              />
              <div style={{
                position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 52,
                background: T.surface,
                borderRadius: "16px 16px 0 0",
                border: `1px solid ${T.border}`,
                boxShadow: "0 -8px 32px rgba(0,0,0,0.3)",
                maxHeight: "85vh",
                display: "flex", flexDirection: "column",
                overflow: "hidden",
              }}>
                {/* Handle */}
                <div style={{ display: "flex", justifyContent: "center", padding: "10px 0 4px" }}>
                  <div style={{ width: 36, height: 4, borderRadius: 99, background: T.isDark ? "rgba(255,255,255,0.15)" : "#cbd5e1" }} />
                </div>

                {/* Header drawer */}
                <div style={{
                  padding: "8px 16px 12px",
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  borderBottom: `1px solid ${T.border}`,
                  flexShrink: 0,
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Ticket size={14} style={{ color: "#60a5fa" }} />
                    <span style={{ fontSize: 13, fontWeight: 700, color: T.text }}>Solicitud en Proceso</span>
                    {totalItemCount > 0 && (
                      <span style={{ fontSize: 10, fontWeight: 800, padding: "1px 8px", borderRadius: 99, background: "#2563eb", color: "#fff" }}>
                        {totalItemCount}
                      </span>
                    )}
                  </div>
                  <button onClick={() => setDrawerOpen(false)}
                    style={{ width: 28, height: 28, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", background: T.surfaceAlt, border: `1px solid ${T.border}`, cursor: "pointer", color: T.textMuted }}>
                    <X size={13} />
                  </button>
                </div>

                {/* Contenido scrollable */}
                <div style={{ overflowY: "auto", flex: 1 }}>
                  {/* Solicitante */}
                  <div style={{ padding: "12px 16px", background: T.isDark ? T.surfaceAlt : "#f0f4f8", borderBottom: `1px solid ${T.border}` }}>
                    <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: T.textFaint, marginBottom: 8 }}>Solicitante</p>
                    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                      {[
                        { label: "Nombre",   value: requesterName },
                        { label: "Área",     value: usuario.departamento || "—" },
                        { label: "Sucursal", value: usuario.sucursal || "—" },
                      ].map(({ label, value }) => (
                        <div key={label} style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                          <span style={{ fontSize: 10, color: T.textFaint }}>{label}</span>
                          <span style={{ fontSize: 11, fontWeight: 600, color: T.text, textAlign: "right" }}>{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Carrito */}
                  <div style={{ minHeight: 60 }}>
                    {cartEntries.length === 0 ? (
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px 16px", gap: 8, color: T.textFaint }}>
                        <Package size={22} />
                        <span style={{ fontSize: 12 }}>Agrega insumos desde el catálogo</span>
                      </div>
                    ) : (
                      cartEntries.map(({ supply, quantity, id }) => (
                        <RequestItem key={id} supply={supply} quantity={quantity} onRemove={handleRemoveSupply} onChangeQty={handleChangeQty} T={T} />
                      ))
                    )}
                  </div>

                  {/* Prioridad + justificación + botón */}
                  <div style={{ padding: "12px 16px", display: "flex", flexDirection: "column", gap: 12, borderTop: `1px solid ${T.border}` }}>
                    <div>
                      <label style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: T.textMuted, display: "block", marginBottom: 6 }}>Prioridad</label>
                      <div style={{ position: "relative" }}>
                        <select
                          value={priority}
                          onChange={e => setPriority(e.target.value)}
                          style={{
                            width: "100%", height: 40, paddingLeft: 12, paddingRight: 32,
                            borderRadius: 8, fontSize: 13, fontWeight: 600,
                            border: `1px solid ${activePriority ? activePriority.border : T.border}`,
                            background: activePriority ? activePriority.bg : T.surfaceAlt,
                            color: activePriority ? activePriority.color : T.textFaint,
                            outline: "none", appearance: "none", cursor: "pointer",
                          }}
                        >
                          <option value="" disabled>Seleccionar prioridad…</option>
                          {PRIORITY_OPTIONS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                        </select>
                        <ChevronDown size={13} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: activePriority ? activePriority.color : T.textFaint }} />
                      </div>
                    </div>

                    <div>
                      <label style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: T.textMuted, display: "block", marginBottom: 6 }}>
                        Justificación <span style={{ color: "#ef4444" }}>*</span>
                      </label>
                      <textarea
                        rows={3}
                        value={justification}
                        onChange={e => setJustification(e.target.value)}
                        placeholder="Describe el motivo de esta solicitud…"
                        style={{
                          width: "100%", padding: "8px 12px", borderRadius: 8, fontSize: 13,
                          border: `1px solid ${justification.trim() ? T.border : "rgba(239,68,68,0.4)"}`,
                          background: justification.trim() ? T.surfaceAlt : (T.isDark ? "rgba(239,68,68,0.08)" : "#fff5f5"),
                          color: T.text, outline: "none", resize: "none", boxSizing: "border-box",
                        }}
                      />
                    </div>

                    {!isTicketValid && (
                      <div style={{ display: "flex", alignItems: "flex-start", gap: 6, padding: "8px 10px", borderRadius: 8, background: T.surfaceAlt, border: `1px solid ${T.border}` }}>
                        <AlertCircle size={11} style={{ color: T.textFaint, marginTop: 1, flexShrink: 0 }} />
                        <span style={{ fontSize: 10, color: T.textFaint, lineHeight: 1.4 }}>
                          {cartEntries.length === 0 ? "Agrega al menos un insumo" : "Escribe la justificación"}
                        </span>
                      </div>
                    )}

                    <button
                      onClick={handleSubmitTicket}
                      disabled={!isTicketValid || isSubmitting}
                      style={{
                        width: "100%", height: 44, borderRadius: 10, fontSize: 14, fontWeight: 700,
                        background: isTicketValid ? "#2563eb" : T.surfaceAlt,
                        color: isTicketValid ? "#fff" : T.textFaint,
                        border: "none", cursor: isTicketValid ? "pointer" : "not-allowed",
                        display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                        boxShadow: isTicketValid ? "0 4px 14px rgba(37,99,235,0.30)" : "none",
                        opacity: (!isTicketValid || isSubmitting) ? 0.5 : 1,
                        marginBottom: 8,
                      }}
                    >
                      {isSubmitting
                        ? <><svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>Creando…</>
                        : <><Ticket size={15} />Crear Solicitud de Insumo</>
                      }
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Modal resultado */}
      {resultModal && (
        <ModalResultado
          resultModal={resultModal}
          cartEntries={resultModal.success ? resultModal._cartSnapshot : []}
          T={T}
          onClose={() => { if (resultModal.success && resultModal.id_solicitud) setSolicitudVer({ id_solicitud: resultModal.id_solicitud }); setResultModal(null); }}
        />
      )}

      {insumoDetalle && (
        <ModalDetalleInsumo insumo={insumoDetalle} onClose={() => setInsumoDetalle(null)} T={T} />
      )}
    </div>
  );
}

