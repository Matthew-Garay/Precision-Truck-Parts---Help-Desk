import { useState, useEffect, useCallback } from "react";
import { Plus, Trash2, Package, AlertCircle, CheckCircle2, X, Search, Tag, Ticket, ChevronDown, Clock, Loader2, XCircle, ArrowLeft, History } from "lucide-react";
import { apiFetch, API_ROUTES } from "../../Config/api";
import StockBar from "../../Components/StockBar";
import VistaSolicitud from "./VistaSolicitud";

// ── Constantes ──────────────────────────────────────────────────
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

// ── Sub-componente: fila de la tabla ────────────────────────────
function SupplyRow({ supply, isAdded, onAdd, animatingId }) {
  const status   = getStockStatus(supply.stock);
  const badge    = STATUS_BADGE[status];
  const isExhausted = supply.stock === 0;
  const isAnimating = animatingId === supply.id_insumo;

  return (
    <tr
      className={`border-b border-slate-100 transition-colors hover:bg-slate-50 ${isAdded ? "bg-blue-50/40" : ""}`}
    >
      {/* ID / Nombre */}
      <td className="px-3 py-1.5">
        <div className="flex flex-col gap-0">
          <span className="text-[10px] font-mono text-slate-400 select-all">
            #{String(supply.id_insumo).padStart(4, "0")}
          </span>
          <span className="text-[11px] font-semibold text-slate-800 leading-tight">
            {supply.nombre}
          </span>
          {(supply.marca || supply.modelo) && (
            <span className="text-[10px] text-slate-400">
              {[supply.marca, supply.modelo].filter(Boolean).join(" · ")}
            </span>
          )}
        </div>
      </td>

      {/* Categoría */}
      <td className="px-3 py-1.5">
        {supply.nombre_categoria ? (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-500 border border-slate-200">
            <Tag size={8} />
            {supply.nombre_categoria}
          </span>
        ) : (
          <span className="text-slate-300 text-[10px]">—</span>
        )}
      </td>

      {/* Stock con barra */}
      <td className="px-3 py-1.5 w-32">
        <StockBar stock={supply.stock} maxStock={100} />
      </td>

      {/* Estado */}
      <td className="px-3 py-1.5">
        <span
          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold border"
          style={{ background: badge.bg, color: badge.color, borderColor: badge.border }}
        >
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: badge.color }} />
          {badge.label}
        </span>
      </td>

      {/* Acción */}
      <td className="px-3 py-1.5">
        {isExhausted ? (
          <button
            disabled
            className="px-2.5 py-1 rounded text-[10px] font-bold cursor-not-allowed bg-slate-100 text-slate-300 border border-slate-200"
            style={{ filter: "grayscale(1)", opacity: 0.6 }}
          >
            Agotado
          </button>
        ) : isAdded ? (
          <button
            onClick={() => onAdd(supply.id_insumo)}
            className="px-2.5 py-1 rounded text-[10px] font-bold bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-100 transition-colors"
          >
            + Agregar otro
          </button>
        ) : (
          <button
            onClick={() => onAdd(supply.id_insumo)}
            className={`px-2.5 py-1 rounded text-[10px] font-bold bg-blue-600 text-white border-0 hover:bg-blue-700 active:scale-95 transition-all ${isAnimating ? "animate-slide-out" : ""}`}
          >
            <span className="flex items-center gap-1">
              <Plus size={11} /> Agregar
            </span>
          </button>
        )}
      </td>
    </tr>
  );
}

// ── Sub-componente: ítem en el panel lateral ────────────────────
function RequestItem({ supply, quantity, onRemove }) {
  return (
    <div className="flex items-center gap-2 py-2.5 px-3 border-b border-slate-100 last:border-0 animate-slide-in">
      <div className="w-7 h-7 rounded bg-blue-50 border border-blue-100 flex items-center justify-center flex-shrink-0">
        <Package size={12} className="text-blue-500" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[12px] font-semibold text-slate-700 truncate leading-tight">{supply.nombre}</p>
        <p className="text-[10px] font-mono text-slate-400">
          #{String(supply.id_insumo).padStart(4, "0")} · ×{quantity}
        </p>
      </div>
      <button
        onClick={() => onRemove(supply.id_insumo)}
        className="w-6 h-6 rounded flex items-center justify-center bg-red-50 border border-red-100 text-red-400 hover:bg-red-100 hover:text-red-600 transition-colors flex-shrink-0"
      >
        <Trash2 size={10} />
      </button>
    </div>
  );
}

// ── Estatus badge ────────────────────────────────────────────────
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

// ── Componente principal ─────────────────────────────────────────
export default function SolicitudInsumo({ usuario = {}, T }) {
  const [supplies,     setSupplies]     = useState([]);
  const [requestCart,  setRequestCart]  = useState({}); // { id_insumo: quantity }
  const [priority,     setPriority]     = useState("");
  const [justification,setJustification]= useState("");
  const [searchQuery,  setSearchQuery]  = useState("");
  const [categoryFilter,setCategoryFilter]=useState("Todos");
  const [isLoading,    setIsLoading]    = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resultModal,  setResultModal]  = useState(null);
  const [animatingId,    setAnimatingId]    = useState(null);
  const [tab,             setTab]             = useState("nueva"); // "nueva" | "historial"
  const [solicitudes,     setSolicitudes]     = useState([]);
  const [loadingSols,     setLoadingSols]     = useState(false);
  const [solicitudVer,    setSolicitudVer]    = useState(null);

  const requesterName = [usuario.nombre, usuario.ap_paterno, usuario.ap_materno]
    .filter(Boolean).join(" ") || "—";

  // ── Fetch insumos ──────────────────────────────────────────────
  useEffect(() => {
    apiFetch(API_ROUTES.INSUMOS)
      .then(r => { if (!r.ok) throw new Error(); return r.json(); })
      .then(data => setSupplies(Array.isArray(data) ? data : []))
      .catch(() => setSupplies([]))
      .finally(() => setIsLoading(false));
  }, []);

  // ── Fetch solicitudes del usuario ──────────────────────────────
  const cargarSolicitudes = useCallback(() => {
    if (!usuario?.id_empleado) return;
    setLoadingSols(true);
    apiFetch(API_ROUTES.SOLICITUDES_EMP(usuario.id_empleado))
      .then(r => r.json())
      .then(d => setSolicitudes(Array.isArray(d) ? d : []))
      .catch(() => {})
      .finally(() => setLoadingSols(false));
  }, [usuario?.id_empleado]);

  useEffect(() => {
    if (tab === "historial") cargarSolicitudes();
  }, [tab, cargarSolicitudes]);

  // ── Categorías únicas ──────────────────────────────────────────
  const categories = ["Todos", ...Array.from(new Set(
    supplies.map(s => s.nombre_categoria).filter(Boolean)
  ))];

  // ── Filtrado ───────────────────────────────────────────────────
  const filteredSupplies = supplies.filter(s => {
    if (categoryFilter !== "Todos" && s.nombre_categoria !== categoryFilter) return false;
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return s.nombre?.toLowerCase().includes(q) || s.marca?.toLowerCase().includes(q);
  });

  // ── Handlers ───────────────────────────────────────────────────
  const handleAddSupply = useCallback((supplyId) => {
    setAnimatingId(supplyId);
    setTimeout(() => setAnimatingId(null), 400);
    setRequestCart(prev => ({ ...prev, [supplyId]: (prev[supplyId] || 0) + 1 }));
  }, []);

  const handleRemoveSupply = useCallback((supplyId) => {
    setRequestCart(prev => {
      const updated = { ...prev };
      delete updated[supplyId];
      return updated;
    });
  }, []);

  // ── Derived state ──────────────────────────────────────────────
  const cartEntries = Object.entries(requestCart)
    .map(([id, qty]) => ({ supply: supplies.find(s => s.id_insumo === parseInt(id)), quantity: qty, id }))
    .filter(e => e.supply);

  const totalItemCount   = Object.values(requestCart).reduce((sum, n) => sum + n, 0);
  const isTicketValid    = cartEntries.length > 0 && justification.trim().length > 0;

  // ── Envío ──────────────────────────────────────────────────────
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
        const errorMsg = data.errores
          ? data.errores.map(e => e.mensaje).join(", ")
          : (data.error || "Error al crear el ticket");
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

  // ── Vista detalle de solicitud ────────────────────────────────
  if (solicitudVer) return (
    <VistaSolicitud
      T={T || { bg: "#f8fafc", surface: "#fff", border: "#e2e8f0", surfaceAlt: "#f8fafc",
        text: "#1e293b", textMuted: "#64748b", textFaint: "#94a3b8", orange: "#f47920", isDark: false }}
      id_solicitud={solicitudVer.id_solicitud}
      onBack={() => setSolicitudVer(null)}
    />
  );

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", background: "#f8fafc", overflow: "hidden" }}>
      <div style={{ maxWidth: "1400px", width: "100%", margin: "0 auto", padding: "12px 16px", display: "flex", flexDirection: "column", gap: "10px", flex: 1, minHeight: 0, overflowY: "auto" }}>

        {/* ── Pestañas ─────────────────────────────────────────── */}
        <div className="flex gap-1 bg-white border border-slate-200 rounded-xl p-1 w-fit shadow-sm">
          {[
            { id: "nueva",     label: "Nueva Solicitud", icon: Plus    },
            { id: "historial", label: "Mis Solicitudes",  icon: History },
          ].map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setTab(id)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all"
              style={{
                background: tab === id ? "#2563eb" : "transparent",
                color:      tab === id ? "#fff"    : "#64748b",
              }}>
              <Icon size={13} />{label}
            </button>
          ))}
        </div>

        {/* ── Layout principal 75 / 25 ─────────────────────────── */}
        <div className="flex flex-col lg:flex-row gap-3 items-start" style={{ flex: 1, minHeight: 0 }}>

          {/* ════ COLUMNA IZQUIERDA — Data Table (75%) ════════════ */}
          <div className="w-full lg:w-3/4" style={{ display: "flex", flexDirection: "column", gap: "12px", flex: 1, minHeight: 0 }}>

            {/* ── Historial de Mis Solicitudes ─────────────────── */}
            {tab === "historial" && (
              <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                <div className="bg-slate-800 px-4 py-3 flex items-center justify-between">
                  <span className="text-[12px] font-bold text-white uppercase tracking-wider">Mis Solicitudes</span>
                  <button onClick={cargarSolicitudes} className="text-[11px] text-slate-400 hover:text-white transition-colors">↻ Actualizar</button>
                </div>
                {loadingSols ? (
                  <div className="flex justify-center items-center py-16">
                    <svg className="animate-spin w-6 h-6 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                  </div>
                ) : solicitudes.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 gap-2 text-slate-400">
                    <History size={28} />
                    <span className="text-[13px] font-semibold">Sin solicitudes</span>
                    <span className="text-[11px]">Aún no has realizado ninguna solicitud de insumo</span>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {solicitudes.map(sol => (
                      <button
                        key={sol.id_solicitud}
                        onClick={() => setSolicitudVer(sol)}
                        className="w-full flex items-center gap-4 px-4 py-3 hover:bg-slate-50 transition-colors text-left"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[12px] font-bold text-slate-700 font-mono">{sol.folio_solicitud}</span>
                            <BadgeEstatus estatus={sol.estatus} />
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            {new Date(sol.fecha).toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" })}
                            {sol.prioridad && ` · Prioridad: ${sol.prioridad}`}
                          </p>
                        </div>
                        <ArrowLeft size={14} className="text-slate-300 rotate-180 flex-shrink-0" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Barra de búsqueda y filtros (solo en tab nueva) */}
            {tab === "nueva" && (<>
            <div className="bg-white border border-slate-200 rounded-xl px-4 py-3 flex flex-wrap gap-3 items-center shadow-sm">
              <div className="relative flex-1" style={{ minWidth: "200px" }}>
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Buscar insumo por nombre o marca…"
                  className="w-full pl-8 pr-3 h-9 rounded-lg text-[12px] bg-slate-50 border border-slate-200 text-slate-700 outline-none focus:border-blue-500 focus:bg-white transition-colors placeholder:text-slate-400"
                />
              </div>

              {/* Chips de categoría */}
              <div className="flex flex-wrap gap-1.5">
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setCategoryFilter(cat)}
                    className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-colors border ${
                      categoryFilter === cat
                        ? "bg-blue-600 text-white border-blue-600"
                        : "bg-slate-50 text-slate-500 border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <span className="text-[11px] text-slate-400 ml-auto font-mono">
                {filteredSupplies.length} resultado{filteredSupplies.length !== 1 ? "s" : ""}
              </span>
            </div>

            {/* Tabla */}
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm" style={{ overflow: "hidden", display: "flex", flexDirection: "column", maxHeight: "clamp(300px, 60vh, calc(100vh - 280px))" }}>
              <div style={{ overflowX: "auto", overflowY: "auto", flex: 1 }}>
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-800 text-white" style={{ position: "sticky", top: 0, zIndex: 10 }}>
                      {["ID / Nombre", "Categoría", "Stock Actual", "Estado", "Acción"].map(col => (
                        <th key={col} className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-300 whitespace-nowrap">
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {isLoading ? (
                      <tr>
                        <td colSpan={5} className="py-16 text-center">
                          <div className="flex flex-col items-center gap-2 text-slate-400">
                            <svg className="animate-spin w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                            </svg>
                            <span className="text-[12px]">Cargando insumos…</span>
                          </div>
                        </td>
                      </tr>
                    ) : filteredSupplies.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-16 text-center">
                          <div className="flex flex-col items-center gap-2 text-slate-400">
                            <Package size={28} />
                            <span className="text-[13px] font-semibold">Sin resultados</span>
                            <span className="text-[11px]">Intenta con otro filtro o búsqueda</span>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredSupplies.map(supply => (
                        <SupplyRow
                          key={supply.id_insumo}
                          supply={supply}
                          isAdded={!!requestCart[supply.id_insumo]}
                          onAdd={handleAddSupply}
                          animatingId={animatingId}
                        />
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>)}

          </div>

          {/* ════ COLUMNA DERECHA — Panel sticky (25%) ════════════ */}
          <div className="w-full lg:w-1/4 lg:sticky lg:top-4 flex flex-col gap-3">

            {/* Panel principal */}
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">

              {/* Encabezado del panel */}
              <div className="bg-slate-800 px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Ticket size={14} className="text-blue-400" />
                  <span className="text-[12px] font-bold text-white uppercase tracking-wider">
                    Solicitud en Proceso
                  </span>
                </div>
                {totalItemCount > 0 && (
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-blue-600 text-white">
                    {totalItemCount}
                  </span>
                )}
              </div>

              {/* Resumen del solicitante (solo lectura) */}
              <div className="px-4 py-3 bg-slate-50 border-b border-slate-100">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Solicitante</p>
                <div className="flex flex-col gap-1.5">
                  {[
                    { label: "Nombre",  value: requesterName },
                    { label: "Área",    value: usuario.departamento || "—" },
                    { label: "Fecha",   value: new Date().toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" }) },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex items-baseline justify-between gap-2">
                      <span className="text-[10px] text-slate-400 flex-shrink-0">{label}</span>
                      <span className="text-[11px] font-semibold text-slate-700 text-right truncate">{value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Insumos agregados */}
              <div className="flex flex-col" style={{ minHeight: "80px" }}>
                {cartEntries.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 px-4 gap-2 text-slate-300">
                    <Package size={24} />
                    <span className="text-[11px] text-center">Agrega insumos desde la tabla</span>
                  </div>
                ) : (
                  cartEntries.map(({ supply, quantity, id }) => (
                    <RequestItem
                      key={id}
                      supply={supply}
                      quantity={quantity}
                      onRemove={handleRemoveSupply}
                    />
                  ))
                )}
              </div>

              {/* Selector de prioridad + justificación + botón */}
              <div className="px-4 py-4 border-t border-slate-100 flex flex-col gap-3">

                {/* Selector de prioridad */}
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                    Prioridad
                  </label>
                  <div className="relative">
                    <select
                      value={priority}
                      onChange={e => setPriority(e.target.value)}
                      className="w-full h-9 pl-3 pr-8 rounded-lg text-[12px] font-semibold border outline-none appearance-none cursor-pointer transition-colors"
                      style={{
                        background:   activePriority ? activePriority.bg   : "#f8fafc",
                        color:        activePriority ? activePriority.color : "#94a3b8",
                        borderColor:  activePriority ? activePriority.border : "#e2e8f0",
                      }}
                    >
                      <option value="" disabled>Seleccionar prioridad…</option>
                      {PRIORITY_OPTIONS.map(p => (
                        <option key={p.value} value={p.value}>{p.label}</option>
                      ))}
                    </select>
                    <ChevronDown
                      size={13}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
                      style={{ color: activePriority ? activePriority.color : "#94a3b8" }}
                    />
                  </div>
                </div>

                {/* Justificación (obligatoria) */}
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                    Justificación / Motivo <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    rows={3}
                    value={justification}
                    onChange={e => setJustification(e.target.value)}
                    placeholder="Describe el motivo de esta solicitud…"
                    className="w-full px-3 py-2 rounded-lg text-[12px] bg-slate-50 border outline-none resize-none transition-colors placeholder:text-slate-300 text-slate-700"
                    style={{
                      borderColor: justification.trim() ? "#e2e8f0" : "#fca5a5",
                      background:  justification.trim() ? "#f8fafc"  : "#fff5f5",
                    }}
                    onFocus={e  => { e.target.style.borderColor = "#3b82f6"; e.target.style.background = "#fff"; }}
                    onBlur={e   => { e.target.style.borderColor = justification.trim() ? "#e2e8f0" : "#fca5a5"; e.target.style.background = justification.trim() ? "#f8fafc" : "#fff5f5"; }}
                  />
                </div>

                {/* Validación visual */}
                {!isTicketValid && (
                  <div className="flex items-start gap-1.5 px-2.5 py-2 rounded-lg bg-slate-50 border border-slate-200">
                    <AlertCircle size={11} className="text-slate-400 mt-0.5 flex-shrink-0" />
                    <span className="text-[10px] text-slate-400 leading-snug">
                      {cartEntries.length === 0
                        ? "Agrega al menos un insumo a la solicitud"
                        : "Escribe la justificación del reporte"}
                    </span>
                  </div>
                )}

                {/* Botón Crear Ticket — habilitado solo si pasa validación */}
                <button
                  onClick={handleSubmitTicket}
                  disabled={!isTicketValid || isSubmitting}
                  className="w-full h-10 rounded-lg text-[13px] font-bold text-white flex items-center justify-center gap-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{
                    background:  isTicketValid ? "#2563eb" : "#94a3b8",
                    boxShadow:   isTicketValid ? "0 4px 14px rgba(37,99,235,0.30)" : "none",
                  }}
                >
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                        <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                      </svg>
                      Creando…
                    </>
                  ) : (
                    <>
                      <Ticket size={14} />
                      Crear Ticket
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Modal resultado ──────────────────────────────────────── */}
      {resultModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/50"
          onClick={() => { if (resultModal.success && resultModal.id_solicitud) { setSolicitudVer({ id_solicitud: resultModal.id_solicitud }); } setResultModal(null); }}
        >
          <div
            className="w-full max-w-sm bg-white rounded-xl overflow-hidden shadow-2xl border border-slate-200"
            onClick={e => e.stopPropagation()}
          >
            <div className="h-1" style={{ background: resultModal.success ? "#16a34a" : "#dc2626" }} />
            <div className="p-6 flex flex-col items-center gap-4 text-center">
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center"
                style={{ background: resultModal.success ? "#f0fdf4" : "#fef2f2" }}
              >
                {resultModal.success
                  ? <CheckCircle2 size={28} className="text-green-600" />
                  : <X size={28} className="text-red-500" />
                }
              </div>
              <div>
                <p className="text-[15px] font-bold text-slate-800">
                  {resultModal.success ? "Ticket creado exitosamente" : "Error al crear el ticket"}
                </p>
                {resultModal.success ? (
                  <p className="text-[13px] font-mono font-bold text-blue-600 mt-1">
                    #{resultModal.folio}
                  </p>
                ) : (
                  <p className="text-[12px] text-slate-500 mt-1">{resultModal.message}</p>
                )}
              </div>
              <button
                onClick={() => { if (resultModal.success && resultModal.id_solicitud) { setSolicitudVer({ id_solicitud: resultModal.id_solicitud }); } setResultModal(null); }}
                className="w-full h-10 rounded-lg text-[13px] font-bold text-white transition-all hover:brightness-110"
                style={{ background: resultModal.success ? "#16a34a" : "#dc2626" }}
              >
                {resultModal.success ? "Ver solicitud" : "Cerrar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
