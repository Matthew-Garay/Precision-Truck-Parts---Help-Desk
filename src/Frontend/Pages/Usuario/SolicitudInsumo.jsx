import { useState, useEffect, useCallback } from "react";
import { Plus, Minus, Trash2, Package, AlertCircle, CheckCircle2, Search, Tag, Ticket, ChevronDown, Clock, Loader2, XCircle, Eye, Inbox, History, LayoutGrid } from "lucide-react";
import { apiFetch, API_ROUTES } from "../../Config/api";
import StockBar from "../../Components/StockBar";
import VistaSolicitud from "./VistaSolicitud";
import VistaInsumos from "./VistaInsumos";
import FiltrosToolbar from "../../Components/FiltrosToolbar";
import { useCardStyles } from "../../Components/Card";
import Modal from "../../Components/Modal";

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

function SupplyRow({ supply, isAdded, onAdd, animatingId, T, cartQty }) {
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
          <span className="text-[11px] font-semibold leading-tight" style={{ color: T.text }}>
            {supply.nombre}
          </span>
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
        <span className="text-[11px] font-black w-5 text-center" style={{ color: T.text }}>{quantity}</span>
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
  "Pendiente":   { color: "#d97706", bg: "rgba(217,119,6,0.12)",  border: "rgba(217,119,6,0.3)",  icon: Clock        },
  "En proceso":  { color: "#3b82f6", bg: "rgba(59,130,246,0.12)", border: "rgba(59,130,246,0.3)", icon: Loader2      },
  "Resuelto":    { color: "#16a34a", bg: "rgba(22,163,74,0.12)",  border: "rgba(22,163,74,0.3)",  icon: CheckCircle2 },
  "No Resuelto": { color: "#dc2626", bg: "rgba(220,38,38,0.12)",  border: "rgba(220,38,38,0.3)",  icon: XCircle      },
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
  // eslint-disable-next-line no-unused-vars
  const [solicitudes,     setSolicitudes]     = useState([]);
  const [loadingSols,     setLoadingSols]     = useState(false);
  const [solicitudVer,    setSolicitudVer]    = useState(null);
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
    { key: "estatus",   label: "Estatus",          type: "select",  opts: ["Todos", "Pendiente", "En proceso", "Resuelto", "No Resuelto", "Rechazado"] },
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
        setResultModal({ success: false, message: errorMsg });
        return;
      }
      setResultModal({ success: true, folio: data.folio_solicitud, id_solicitud: data.id_solicitud });
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
    <div style={{ height: "100%", display: "flex", flexDirection: "column", background: T.bg, overflow: "hidden" }}>
      <div style={{ maxWidth: "1400px", width: "100%", margin: "0 auto", padding: "12px 16px", display: "flex", flexDirection: "column", gap: "10px", flex: 1, minHeight: 0, overflowY: "auto" }}>

        {/* Pestañas */}
        <div className="flex gap-1 rounded-xl p-1 w-fit"
          style={{ background: T.surface, border: `1px solid ${T.border}`, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
          {[
            { id: "nueva",     label: "Nueva Solicitud",  icon: Plus        },
            { id: "historial", label: "Mis Solicitudes",   icon: History     },
            { id: "catalogo",  label: "Catálogo",          icon: LayoutGrid  },
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

        <div className="flex flex-col lg:flex-row gap-3 items-start" style={{ flex: 1, minHeight: 0 }}>

          {/* Columna izquierda */}
          <div className="w-full lg:w-3/4" style={{ display: "flex", flexDirection: "column", gap: "12px", flex: 1, minHeight: 0 }}>

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
                          {["Folio", "Prioridad", "Estatus", "Fecha", ""].map((col, i) => (
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
            {tab === "catalogo" && (
              <VistaInsumos T={T} />
            )}

            {/* Tab nueva */}
            {tab === "nueva" && (<>
              {/* Barra búsqueda y filtros */}
              <div className="rounded-xl px-4 py-3 flex flex-wrap gap-3 items-center"
                style={{ background: T.surface, border: `1px solid ${T.border}`, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
                <div className="relative flex-1" style={{ minWidth: "200px" }}>
                  <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: T.textFaint }} />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Buscar insumo por nombre o marca…"
                    className="w-full pl-8 pr-3 h-9 rounded-lg text-[12px] outline-none transition-colors"
                    style={{ background: T.surfaceAlt, border: `1px solid ${T.border}`, color: T.text }}
                    onFocus={e => { e.target.style.borderColor = "#3b82f6"; e.target.style.background = T.surface; }}
                    onBlur={e  => { e.target.style.borderColor = T.border;  e.target.style.background = T.surfaceAlt; }}
                  />
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {categories.map(cat => (
                    <button key={cat} onClick={() => setCategoryFilter(cat)}
                      className="px-2.5 py-1 rounded text-[11px] font-semibold transition-colors"
                      style={{
                        background:   categoryFilter === cat ? "#2563eb"    : T.surfaceAlt,
                        color:        categoryFilter === cat ? "#fff"        : T.textMuted,
                        border:       categoryFilter === cat ? "1px solid #2563eb" : `1px solid ${T.border}`,
                      }}>
                      {cat}
                    </button>
                  ))}
                </div>

                <span className="text-[11px] font-mono ml-auto" style={{ color: T.textFaint }}>
                  {filteredSupplies.length} resultado{filteredSupplies.length !== 1 ? "s" : ""}
                </span>
              </div>

              {/* Tabla */}
              <div className="rounded-xl overflow-hidden"
                style={{ background: T.surface, border: `1px solid ${T.border}`, boxShadow: "0 1px 3px rgba(0,0,0,0.06)", display: "flex", flexDirection: "column", maxHeight: "clamp(300px, 60vh, calc(100vh - 280px))" }}>
                <div style={{ overflowX: "auto", overflowY: "auto", flex: 1 }}>
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr style={{ background: T.isDark ? T.surfaceAlt : "#1e293b", position: "sticky", top: 0, zIndex: 10 }}>
                        {["ID / Nombre", "Categoría", "Stock Actual", "Estado", "Acción"].map(col => (
                          <th key={col} className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider whitespace-nowrap"
                            style={{ color: T.isDark ? T.textMuted : "#94a3b8" }}>
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {isLoading ? (
                        <tr><td colSpan={5} className="py-16 text-center">
                          <div className="flex flex-col items-center gap-2" style={{ color: T.textFaint }}>
                            <svg className="animate-spin w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
                            <span className="text-[12px]">Cargando insumos…</span>
                          </div>
                        </td></tr>
                      ) : filteredSupplies.length === 0 ? (
                        <tr><td colSpan={5} className="py-16 text-center">
                          <div className="flex flex-col items-center gap-2" style={{ color: T.textFaint }}>
                            <Package size={28} />
                            <span className="text-[13px] font-semibold">Sin resultados</span>
                            <span className="text-[11px]">Intenta con otro filtro o búsqueda</span>
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

          {/* Columna derecha — panel */}
          <div className="w-full lg:w-1/4 lg:sticky lg:top-4 flex flex-col gap-3">
            <div className="rounded-xl overflow-hidden"
              style={{ background: T.surface, border: `1px solid ${T.border}`, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>

              {/* Header panel */}
              <div className="px-4 py-3 flex items-center justify-between"
                style={{ background: T.isDark ? T.surfaceAlt : "#1e293b" }}>
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
              <div className="px-4 py-3" style={{ background: T.surfaceAlt, borderBottom: `1px solid ${T.border}` }}>
                <p className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: T.textFaint }}>Solicitante</p>
                <div className="flex flex-col gap-1.5">
                  {[
                    { label: "Nombre", value: requesterName },
                    { label: "Área",   value: usuario.departamento || "—" },
                    { label: "Fecha",  value: new Date().toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" }) },
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

      {/* Modal resultado */}
      {resultModal && (
        <Modal
          title={resultModal.success ? "Solicitud creada" : "Error al crear"}
          T={T}
          onClose={() => { if (resultModal.success && resultModal.id_solicitud) setSolicitudVer({ id_solicitud: resultModal.id_solicitud }); setResultModal(null); }}
          onConfirm={() => { if (resultModal.success && resultModal.id_solicitud) setSolicitudVer({ id_solicitud: resultModal.id_solicitud }); setResultModal(null); }}
          confirmLabel={resultModal.success ? "Ver solicitud" : "Cerrar"}
          cancelLabel={null}
          maxWidth="360px"
          danger={!resultModal.success}
        >
          {resultModal.success ? (
            <div className="flex flex-col gap-2">
              <span className="text-sm font-mono font-bold" style={{ color: T.orange }}>#{resultModal.folio}</span>
              <p className="text-xs" style={{ color: T.textMuted }}>Solicitud registrada correctamente. El equipo la atenderá a la brevedad.</p>
            </div>
          ) : (
            <p className="text-sm" style={{ color: T.text }}>{resultModal.message}</p>
          )}
        </Modal>
      )}
    </div>
  );
}

