import { useState, useEffect, useCallback, useRef } from "react";
import { Plus, Minus, Trash2, Package, AlertCircle, CheckCircle2, Search, Tag, Ticket, ChevronDown, Clock, XCircle, X, History, Inbox, Eye } from "lucide-react";
import { apiFetch, API_ROUTES } from "../../Config/api";
import { useCardStyles } from "../../Components/Card";
import ModalDetalleInsumo from "../../Components/Inventario/ModalDetalleInsumo";
import FiltrosToolbar from "../../Components/FiltrosToolbar";
import VistaSolicitud from "./VistaSolicitud";
import { useAutoRefresh } from "../../Config/useAutoRefresh";
import {
  agruparSalidas, coincideFiltrosSalida, abrirHojaSalida,
  traerSalidasMiSucursal, traerSolicitudesEmpleado,
} from "../../Config/salidasHistorial";
import ModalSalidaView from "../../Components/ModalSalidaView";

const PRIORITY_OPTIONS = [
  { value: "Urgente", label: "Urgente", color: "#dc2626", bg: "rgba(220,38,38,0.10)", border: "rgba(220,38,38,0.30)" },
  { value: "Alta",    label: "Alta",    color: "#ea580c", bg: "rgba(234,88,12,0.10)",  border: "rgba(234,88,12,0.30)"  },
  { value: "Media",   label: "Media",   color: "#d97706", bg: "rgba(217,119,6,0.10)",  border: "rgba(217,119,6,0.30)"  },
  { value: "Baja",    label: "Baja",    color: "#6b7280", bg: "rgba(107,114,128,0.08)",border: "rgba(107,114,128,0.25)"},
];

function SupplyRow({ supply, isAdded, onAdd, animatingId, T, onDetail }) {
  const isAnimating = animatingId === supply.id_insumo;

  return (
    <tr style={{
      borderBottom: `1px solid ${T.border}`,
      background: isAdded ? (T.isDark ? "rgba(37,99,235,0.08)" : "rgba(37,99,235,0.04)") : "transparent",
      transition: "background 0.15s",
    }}
      onMouseEnter={e => { if (!isAdded) e.currentTarget.style.background = T.surfaceHover; }}
      onMouseLeave={e => { e.currentTarget.style.background = isAdded ? (T.isDark ? "rgba(37,99,235,0.08)" : "rgba(37,99,235,0.04)") : "transparent"; }}
    >
      <td className="px-2 py-1.5">
        <div style={{ width: 32, height: 32, borderRadius: 6, overflow: "hidden",
            background: T.isDark ? "rgba(255,255,255,0.05)" : "#f1f5f9",
            border: `1px solid ${T.border}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          {supply.imagen_url
            ? <img src={supply.imagen_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            : <Package size={12} style={{ color: T.textFaint }} />}
        </div>
      </td>
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

      <td className="px-3 py-1.5 pr-col-categoria">
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

      <td className="px-3 py-1.5">
        {isAdded ? (
          <button onClick={() => onAdd(supply.id_insumo)}
            className="px-2.5 py-1 rounded text-[10px] font-bold transition-colors"
            style={{ background: T.isDark ? "rgba(37,99,235,0.15)" : "#eff6ff", color: "#3b82f6", border: "1px solid rgba(59,130,246,0.3)" }}>
            + Agregar otro
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

function RequestItem({ supply, quantity, onRemove, onChangeQty, esUltimo = false, T }) {
  const [localVal, setLocalVal] = useState(String(quantity));
  const editing = useRef(false);

  // Solo sincronizar desde afuera cuando el usuario NO está escribiendo (botones +/-)
  useEffect(() => {
    if (!editing.current) setLocalVal(String(quantity));
  }, [quantity]);

  const commit = () => {
    editing.current = false;
    // Mínimo 1 pieza: si se escribe 0 o algo inválido, vuelve a la cantidad actual.
    const n = parseInt(localVal, 10);
    if (!isNaN(n) && n >= 1) onChangeQty(supply.id_insumo, n);
    else setLocalVal(String(quantity));
  };

  return (
    <div className="flex items-center gap-2 py-2 px-3 last:border-0 animate-slide-in"
      style={{ borderBottom: `1px solid ${T.border}` }}>
      <div className="w-7 h-7 rounded flex items-center justify-center flex-shrink-0"
        style={{ background: T.isDark ? "rgba(37,99,235,0.15)" : "#eff6ff", border: "1px solid rgba(59,130,246,0.2)", overflow: "hidden" }}>
        {supply.imagen_url
          ? <img src={supply.imagen_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          : <Package size={12} style={{ color: "#3b82f6" }} />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-semibold truncate leading-tight" style={{ color: T.text }}>{supply.nombre}</p>
        <p className="text-[9px] font-mono" style={{ color: T.textFaint }}>
          #{String(supply.id_insumo).padStart(4, "0")}
        </p>
      </div>
      {/* Controles de cantidad — siempre entre 1 y el máximo (el stock lo valida el backend) */}
      <div className="flex items-center gap-1 flex-shrink-0">
        <button onClick={() => onChangeQty(supply.id_insumo, quantity - 1)}
          disabled={quantity <= 1}
          title={quantity <= 1 ? "Debe quedar al menos 1 pieza" : "Quitar una pieza"}
          className="w-5 h-5 rounded flex items-center justify-center transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          style={{ background: T.isDark ? "rgba(255,255,255,0.06)" : T.surfaceAlt, border: `1px solid ${T.border}`, color: T.textMuted }}>
          <Minus size={9} />
        </button>
        <input
          type="text"
          inputMode="numeric"
          value={localVal}
          onChange={e => { editing.current = true; setLocalVal(e.target.value.replace(/[^0-9]/g, "")); }}
          onBlur={commit}
          onKeyDown={e => { if (e.key === "Enter") e.target.blur(); }}
          className="text-[11px] font-black text-center rounded outline-none"
          style={{ width: "28px", background: T.surfaceAlt, border: `1px solid ${T.border}`, color: T.text, padding: "1px 2px" }}
        />
        <button onClick={() => onChangeQty(supply.id_insumo, quantity + 1)}
          title="Agregar una pieza"
          className="w-5 h-5 rounded flex items-center justify-center transition-colors"
          style={{ background: T.isDark ? "rgba(37,99,235,0.15)" : "#eff6ff", border: "1px solid rgba(59,130,246,0.3)", color: "#3b82f6" }}>
          <Plus size={9} />
        </button>
      </div>
      <button onClick={() => onRemove(supply.id_insumo)}
        disabled={esUltimo}
        title={esUltimo ? "Debe quedar al menos un insumo en la solicitud" : "Quitar de la solicitud"}
        className="w-6 h-6 rounded flex items-center justify-center flex-shrink-0 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        style={{ background: T.isDark ? "rgba(239,68,68,0.12)" : "#fef2f2", border: "1px solid rgba(239,68,68,0.2)", color: "#f87171" }}
        onMouseEnter={e => { if (esUltimo) return; e.currentTarget.style.background = T.isDark ? "rgba(239,68,68,0.25)" : "#fee2e2"; e.currentTarget.style.color = "#dc2626"; }}
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
  // (filtro y orden por stock eliminados: el rol Usuario no ve el stock)
  const [isLoading,       setIsLoading]       = useState(true);
  const [isSubmitting,    setIsSubmitting]    = useState(false);
  const [resultModal,     setResultModal]     = useState(null);
  const [animatingId,     setAnimatingId]     = useState(null);
  const [tab,             setTab]             = useState("nueva");
  const [drawerOpen,      setDrawerOpen]      = useState(false);

  /* ── Estilos del panel móvil ──────────────────────────────────────
     En celular el alto util cambia cuando aparece/desaparece la barra
     del navegador: `vh` deja el drawer mas alto que la pantalla y
     esconde los controles. `dvh` (altura dinamica) lo corrige; el
     `@supports` mantiene el comportamiento en navegadores viejos. */
  const estilosMovil = `
    @keyframes prFade  { from{opacity:0} to{opacity:1} }
    @keyframes prSheet { from{transform:translateY(100%)} to{transform:translateY(0)} }
    .pr-drawer { max-height: 88vh; }
    @supports (max-height: 88dvh) { .pr-drawer { max-height: 88dvh; } }
    .pr-drawer-scroll { -webkit-overflow-scrolling: touch; overscroll-behavior: contain; }
    /* La barra flotante tapa la ultima fila del catalogo */
    @media (max-width: 1023px) { .pr-catalogo-scroll { padding-bottom: 84px; } }
    @media (max-width: 400px)  { .pr-col-categoria { display: none; } }
  `;

  /* Con el drawer abierto la pagina de fondo no debe seguir desplazandose */
  useEffect(() => {
    if (!drawerOpen) return;
    const previo = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previo; };
  }, [drawerOpen]);
  const [insumoDetalle,   setInsumoDetalle]   = useState(null);
  const [solicitudes,     setSolicitudes]     = useState([]);
  const [solPage,         setSolPage]         = useState(1);
  const [solPages,        setSolPages]        = useState(1);
  const [solLimit,        setSolLimit]        = useState(25);
  const [solTotal,        setSolTotal]        = useState(0);
  const [filtrosSol,      setFiltrosSol]      = useState({ busqueda: "", estatus: "Todos", prioridad: "Todos" });
  const [cargandoSol,     setCargandoSol]     = useState(false);
  const [solicitudVer,    setSolicitudVer]    = useState(null);
  const [modalSalida,     setModalSalida]     = useState(null);

  // Abre el modal de la salida cuando este panel (u otro) emita el evento
  // "abrir-salida" (emitido por abrirHojaSalida en salidasHistorial.js,
  // que ya no abre ventanas emergentes).
  useEffect(() => {
    const onAbrirSalida = (e) => {
      setModalSalida(e.detail);
    };
    window.addEventListener("abrir-salida", onAbrirSalida);
    return () => window.removeEventListener("abrir-salida", onAbrirSalida);
  }, []);

  const cerrarModalSalida = () => setModalSalida(null);
  const [statsGlobal, setStatsGlobal] = useState(() => ({
    total: 0, enProceso: 0, aceptados: 0, rechazados: 0,
    totalPiezas: 0,
    prioridades: { Urgente: 0, Alta: 0, Media: 0, Baja: 0 },
    topInsumos: [],
    actividadMes: Array.from({ length: 6 }, (_, i) => {
      const d = new Date(new Date().getFullYear(), new Date().getMonth() - (5 - i), 1);
      return { mes: d.toLocaleDateString("es-MX", { month: "short" }), count: 0 };
    }),
  }));
  const filtrosSolRef = useRef(filtrosSol);
  filtrosSolRef.current = filtrosSol;

  const requesterName = [usuario.nombre, usuario.ap_paterno, usuario.ap_materno]
    .filter(Boolean).join(" ") || "—";

  useEffect(() => {
    apiFetch(API_ROUTES.INSUMOS)
      .then(r => { if (!r.ok) throw new Error(); return r.json(); })
      .then(data => setSupplies(Array.isArray(data) ? data : []))
      .catch(() => setSupplies([]))
      .finally(() => setIsLoading(false));
  }, []);



  const categories = ["Todos", ...Array.from(new Set(
    supplies.map(s => s.nombre_categoria).filter(Boolean)
  ))];

  const filteredSupplies = supplies
    .filter(s => {
      if (categoryFilter !== "Todos" && s.nombre_categoria !== categoryFilter) return false;
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return s.nombre?.toLowerCase().includes(q) || s.marca?.toLowerCase().includes(q) || s.modelo?.toLowerCase().includes(q);
    });
  const hayFiltrosInsumos = searchQuery || categoryFilter !== "Todos";
  const limpiarFiltrosInsumos = () => { setSearchQuery(""); setCategoryFilter("Todos"); };

  const handleAddSupply = useCallback((supplyId) => {
    const supply = supplies.find(s => s.id_insumo === supplyId);
    if (!supply) return;
    setRequestCart(prev => {
      const current = prev[supplyId] || 0;
      return { ...prev, [supplyId]: current + 1 };
    });
    setAnimatingId(supplyId);
    setTimeout(() => setAnimatingId(null), 400);
  }, [supplies]);

  const handleRemoveSupply = useCallback((supplyId) => {
    setRequestCart(prev => {
      // Regla del carrito: siempre debe quedar al menos un insumo.
      const restantes = Object.keys(prev).filter(k => Number(k) !== Number(supplyId));
      if (restantes.length === 0) return prev;
      const u = { ...prev };
      delete u[supplyId];
      return u;
    });
  }, []);

  const handleChangeQty = useCallback((supplyId, newQty) => {
    // Se puede subir o bajar la cantidad, pero nunca por debajo de 1:
    // antes al bajar de 1 el insumo se quitaba del carrito y la solicitud
    // se quedaba sin nada que enviar.
    const n = Math.max(1, parseInt(newQty, 10) || 1);
    setRequestCart(prev => ({ ...prev, [supplyId]: n }));
  }, [supplies]);

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
      // Justificación GENERAL: es el campo que valida el backend (descripcion
      // de la solicitud). Sin este campo el POST se rechaza aunque el usuario
      // haya escrito la justificación.
      descripcion: justification.trim(),
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
        // Si es error de stock, refrescar catálogo y quitar del carrito los
        // insumos que ya no aparecen (agotados). El cliente ya no conoce el
        // stock: la cantidad exacta la revalida el backend al enviar.
        if (res.status === 400 && errorMsg.toLowerCase().includes("stock")) {
          try {
            const r = await apiFetch(API_ROUTES.INSUMOS);
            if (r.ok) {
              const fresh = await r.json();
              if (Array.isArray(fresh)) {
                setSupplies(fresh);
                setRequestCart(prev => {
                  const next = { ...prev };
                  for (const id of Object.keys(next)) {
                    if (!fresh.some(s => s.id_insumo === parseInt(id))) delete next[id];
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

  const PCOLOR_SOL        = { Urgente: "#dc2626", Alta: "#ea580c", Media: "#ca8a04", Baja: "#16a34a" };
  const ESTATUS_COLOR_SOL = { "En proceso": "#d97706", Aceptado: "#16a34a", Rechazado: "#dc2626", Entregado: "#0d9488" };
  const ESTATUS_BG_SOL    = { "En proceso": T.isDark ? "rgba(217,119,6,0.13)" : "#fef3c7", Aceptado: T.isDark ? "rgba(22,163,74,0.13)" : "#dcfce7", Rechazado: T.isDark ? "rgba(220,38,38,0.13)" : "#fee2e2", Entregado: T.isDark ? "rgba(13,148,136,0.13)" : "#ccfbf1" };
  const fmtSol = d => d ? new Date(d).toLocaleDateString("es-MX", { day: "2-digit", month: "2-digit", year: "numeric" }) : "-";
  const camposFiltroSol = [
    { key: "busqueda",  label: "Búsqueda Rápida", type: "search", placeholder: "Folio...", debounce: 300 },
    { key: "estatus",   label: "Estatus",         type: "select", opts: ["Todos", "En proceso", "Aceptado", "Rechazado"] },
    { key: "prioridad", label: "Prioridad",        type: "select", opts: ["Todos", "Urgente", "Alta", "Media", "Baja"] },
  ];

  // La lista mezcla mis solicitudes (SOL-) y las salidas manuales hechas a
  // MI sucursal (SAL-): se traen completas y se paginan en cliente para
  // ordenarlas juntas por fecha. Los filtros de estatus/prioridad/búsqueda
  // NO los aplica el endpoint de empleado, así que se aplican aquí.
  const cargarSolicitudes = useCallback((f = filtrosSolRef.current, p = 1, l = 25) => {
    if (!usuario?.id_empleado) return;
    setCargandoSol(true);
    Promise.all([
      traerSolicitudesEmpleado(usuario.id_empleado).catch(() => []),
      traerSalidasMiSucursal().catch(() => []),
    ])
      .then(([sols, movs]) => {
        const q = String(f.busqueda || "").trim().toLowerCase();
        const filtradas = sols.filter(s => {
          if (q) {
            const heno = [s.folio_solicitud, s.insumos_nombres, s.nombre_empleado]
              .filter(Boolean).join(" ").toLowerCase();
            if (!heno.includes(q)) return false;
          }
          if (f.estatus   && f.estatus   !== "Todos" && s.estatus   !== f.estatus)   return false;
          if (f.prioridad && f.prioridad !== "Todos" && s.prioridad !== f.prioridad) return false;
          return true;
        });
        const salidas = agruparSalidas(movs).filter(g => coincideFiltrosSalida(g, f));
        const combo = [...filtradas, ...salidas]
          .sort((a, b) => new Date(b.fecha || 0) - new Date(a.fecha || 0));
        const total = combo.length;
        const ini = (p - 1) * l;
        setSolicitudes(combo.slice(ini, ini + l));
        setSolTotal(total);
        setSolPages(Math.max(1, Math.ceil(total / l)));
      })
      .catch(() => {})
      .finally(() => setCargandoSol(false));
  }, [usuario?.id_empleado]); // eslint-disable-line

  // Stats globales (sin filtro) — carga una vez al abrir el tab
  useEffect(() => {
    if (tab !== "historial" || !usuario?.id_empleado) return;
    apiFetch(`/api/solicitudes/empleado/${usuario.id_empleado}?limit=2000&page=1`)
      .then(r => r.json())
      .then(d => {
        const lista = Array.isArray(d?.data) ? d.data : Array.isArray(d) ? d : [];
        // Prioridades
        const prioridades = { Urgente: 0, Alta: 0, Media: 0, Baja: 0 };
        lista.forEach(s => { if (prioridades[s.prioridad] !== undefined) prioridades[s.prioridad]++; });
        // Total piezas
        const totalPiezas = lista.reduce((sum, s) => sum + (parseInt(s.total_piezas) || 0), 0);
        // Top insumos (de insumos_nombres concatenados)
        const conteoInsumos = {};
        lista.forEach(s => {
          if (!s.insumos_nombres) return;
          s.insumos_nombres.split(",").forEach(n => {
            const nombre = n.trim();
            if (nombre) conteoInsumos[nombre] = (conteoInsumos[nombre] || 0) + 1;
          });
        });
        const topInsumos = Object.entries(conteoInsumos).sort((a, b) => b[1] - a[1]).slice(0, 4);
        // Actividad últimos 6 meses
        const ahora = new Date();
        const actividadMes = Array.from({ length: 6 }, (_, i) => {
          const d = new Date(ahora.getFullYear(), ahora.getMonth() - (5 - i), 1);
          const mes = d.toLocaleDateString("es-MX", { month: "short" });
          const count = lista.filter(s => {
            const f = new Date(s.fecha);
            return f.getMonth() === d.getMonth() && f.getFullYear() === d.getFullYear();
          }).length;
          return { mes, count };
        });
        setStatsGlobal({
          total: lista.length, enProceso: lista.filter(s => s.estatus === "En proceso").length,
          aceptados: lista.filter(s => s.estatus === "Aceptado").length,
          rechazados: lista.filter(s => s.estatus === "Rechazado").length,
          totalPiezas, prioridades, topInsumos, actividadMes,
        });
      })
      .catch(() => {});
  }, [tab, usuario?.id_empleado]); // eslint-disable-line

  const filtrosSolStr = JSON.stringify(filtrosSol);
  useEffect(() => {
    if (tab === "historial") cargarSolicitudes(filtrosSol, solPage, solLimit);
  }, [tab, filtrosSolStr, solPage, solLimit]); // eslint-disable-line

  useAutoRefresh(() => { if (tab === "historial") cargarSolicitudes(filtrosSolRef.current, solPage, solLimit); }, 30000, [solPage, solLimit]);

  const hayFiltrosSol = filtrosSol.busqueda || filtrosSol.estatus !== "Todos" || filtrosSol.prioridad !== "Todos";
  const { total: totalSol, enProceso: pendientesSol, aceptados: aceptadosSol, rechazados: rechazadosSol, totalPiezas, prioridades, topInsumos, actividadMes } = statsGlobal;
  const tasaSol      = (aceptadosSol + rechazadosSol) > 0 ? Math.round(aceptadosSol / (aceptadosSol + rechazadosSol) * 100) : 0;
  const tasaColorSol = tasaSol >= 75 ? "#16a34a" : tasaSol >= 50 ? "#ca8a04" : "#dc2626";
  const maxActMes    = Math.max(...(actividadMes.map(m => m.count)), 1);

  const { card, hdr } = useCardStyles(T);

  if (solicitudVer) return (
    <VistaSolicitud T={T} id_solicitud={solicitudVer.id_solicitud} onBack={() => { setSolicitudVer(null); cargarSolicitudes(filtrosSolRef.current, solPage, solLimit); }} />
  );

  return (
    <div style={{ background: T.bg, height: "100%", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", padding: "12px 16px", gap: "10px", maxWidth: "1400px", width: "100%", margin: "0 auto", boxSizing: "border-box" }}>

        {/* Pesta\u00f1as */}
        <div className="flex gap-1 rounded-xl p-1 w-fit flex-shrink-0"
          style={{ background: T.surface, border: `1px solid ${T.border}`, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
          {[
            { id: "nueva",     label: "Nueva Solicitud", icon: Plus    },
            { id: "historial", label: "Mis Solicitudes",  icon: History },
          ].map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setTab(id)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all"
              style={{ background: tab === id ? "#2563eb" : "transparent", color: tab === id ? "#fff" : T.textMuted }}>
              <Icon size={13} />{label}
            </button>
          ))}
        </div>

        {tab === "historial" && (
          <div className="flex flex-col gap-1.5 flex-1 min-h-0" style={{ overflowY: "auto", overflowX: "hidden" }}>

            {/* ── MÉTRICAS ── */}
            <div className="grid grid-cols-12 gap-1.5" style={{ flexShrink: 0 }}>

              {/* Tasa de aceptación — card grande */}
              <div className="col-span-6 sm:col-span-6 lg:col-span-3 rounded-xl overflow-hidden relative" style={card}>
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
                  style={{ background: `radial-gradient(circle at 80% 20%, ${tasaColorSol}, transparent 60%)` }} />
                <div className="h-0.5" style={{ background: `linear-gradient(90deg,${tasaColorSol},${tasaColorSol}33)` }} />
                <div className="p-2 sm:p-3 flex flex-col gap-1 sm:gap-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <div className="w-1 h-2.5 rounded-full" style={{ background: tasaColorSol }} />
                      <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: T.textMuted }}>Tasa Aceptación</p>
                    </div>
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                      style={{ background: `${tasaColorSol}15`, color: tasaColorSol, border: `1px solid ${tasaColorSol}30` }}>
                      {tasaSol >= 75 ? "Excelente" : tasaSol >= 50 ? "Regular" : "Bajo"}
                    </span>
                  </div>
                  <div className="flex items-end gap-2">
                    <span className="text-2xl font-black leading-none" style={{ color: tasaColorSol }}>{tasaSol}%</span>
                    <div className="flex flex-col gap-1 mb-0.5 flex-1">
                      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: T.border }}>
                        <div className="h-full rounded-full transition-all duration-1000"
                          style={{ width: `${tasaSol}%`, background: `linear-gradient(90deg,${tasaColorSol},${tasaColorSol}88)`, boxShadow: `0 0 6px ${tasaColorSol}55` }} />
                      </div>
                    </div>
                  </div>
                  <div className="pt-1 flex items-center justify-between" style={{ borderTop: `1px solid ${T.border}` }}>
                    <span className="text-[10px]" style={{ color: T.textFaint }}>Piezas totales</span>
                    <span className="text-[10px] font-black" style={{ color: tasaColorSol }}>{totalPiezas} pza.</span>
                  </div>
                </div>
              </div>

              {/* KPIs numéricos */}
              <div className="col-span-6 sm:col-span-6 lg:col-span-3 grid grid-cols-2 gap-1.5">
                {[
                  { label: "Total",      val: totalSol,      color: T.orange,  sub: `${pendientesSol} activas` },
                  { label: "En Proceso", val: pendientesSol, color: "#d97706", sub: `${Math.round(pendientesSol / Math.max(totalSol,1) * 100)}% del total` },
                  { label: "Aceptadas",  val: aceptadosSol,  color: "#16a34a", sub: `${tasaSol}% tasa` },
                  { label: "Rechazadas", val: rechazadosSol, color: "#dc2626", sub: `${Math.round(rechazadosSol / Math.max(totalSol,1) * 100)}% del total` },
                ].map(({ label, val, color, sub }) => (
                  <div key={label} className="rounded-lg p-1.5 sm:p-2 flex flex-col gap-0.5 sm:gap-1 relative overflow-hidden" style={card}>
                    <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: `linear-gradient(90deg,${color},${color}33)` }} />
                    <p className="text-[9px] font-black uppercase tracking-wider leading-tight" style={{ color: T.textMuted }}>{label}</p>
                    <span className="text-xl font-black leading-none" style={{ color }}>{val}</span>
                    <div className="h-1 rounded-full overflow-hidden" style={{ background: T.border }}>
                      <div className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${totalSol > 0 ? Math.round(val / totalSol * 100) : 0}%`, background: color, boxShadow: `0 0 4px ${color}44` }} />
                    </div>
                    <span className="text-[10px] font-semibold" style={{ color }}>{sub}</span>
                  </div>
                ))}
              </div>

              {/* Por Prioridad */}
              <div className="col-span-12 sm:col-span-6 lg:col-span-3 rounded-xl overflow-hidden" style={{ ...card, flexShrink: 0 }}>
                <div className="px-3 py-2 flex items-center gap-1.5" style={hdr}>
                  <div className="w-1 h-3 rounded-full" style={{ background: T.orange }} />
                  <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: T.textMuted }}>Por Prioridad</p>
                </div>
                <div className="p-3 flex flex-col gap-2">
                  {[{ l: "Urgente", c: "#dc2626" }, { l: "Alta", c: "#ea580c" }, { l: "Media", c: "#ca8a04" }, { l: "Baja", c: "#16a34a" }].map(({ l, c }) => {
                    const n   = prioridades[l] || 0;
                    const pct = totalSol > 0 ? Math.round(n / totalSol * 100) : 0;
                    return (
                      <div key={l} className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: c, boxShadow: `0 0 4px ${c}88` }} />
                        <span className="text-[11px] font-semibold w-14 flex-shrink-0" style={{ color: T.text }}>{l}</span>
                        <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: T.isDark ? "rgba(255,255,255,0.06)" : `${c}15` }}>
                          <div className="h-full rounded-full transition-all duration-700"
                            style={{ width: `${pct > 0 ? Math.max(pct, 5) : 0}%`, background: c, boxShadow: `0 0 4px ${c}55` }} />
                        </div>
                        <span className="text-[11px] font-black w-5 text-right flex-shrink-0" style={{ color: c }}>{n}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Top insumos + actividad mensual */}
              <div className="col-span-12 sm:col-span-6 lg:col-span-3 rounded-xl overflow-hidden" style={{ ...card, flexShrink: 0 }}>
                <div className="px-3 py-2 flex items-center gap-1.5" style={hdr}>
                  <div className="w-1 h-3 rounded-full" style={{ background: T.orange }} />
                  <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: T.textMuted }}>Insumos Frecuentes</p>
                </div>
                <div className="p-3 flex flex-col gap-2">
                  {topInsumos.length === 0
                    ? <p className="text-[9px]" style={{ color: T.textFaint }}>Sin datos</p>
                    : topInsumos.map(([nombre, n], idx) => {
                        const colors = [T.orange, "#3b82f6", "#8b5cf6", "#16a34a"];
                        const maxN   = topInsumos[0][1];
                        return (
                          <div key={nombre} className="flex items-center gap-2">
                            <span className="text-[10px] font-black w-3 flex-shrink-0 text-center" style={{ color: colors[idx] }}>#{idx + 1}</span>
                            <span className="text-[11px] font-semibold flex-1 truncate" style={{ color: T.text }} title={nombre}>{nombre}</span>
                            <div className="w-12 h-2 rounded-full overflow-hidden flex-shrink-0" style={{ background: T.border }}>
                              <div className="h-full rounded-full transition-all duration-700"
                                style={{ width: `${Math.round(n / maxN * 100)}%`, background: colors[idx], boxShadow: `0 0 4px ${colors[idx]}55` }} />
                            </div>
                            <span className="text-[11px] font-black w-4 text-right flex-shrink-0" style={{ color: colors[idx] }}>{n}</span>
                          </div>
                        );
                      })
                  }
                </div>
                {/* Mini gráfica actividad mensual */}
                <div className="px-3 pb-3">
                  <p className="text-[9px] font-black uppercase tracking-widest mb-1.5" style={{ color: T.textFaint }}>Actividad últimos 6 meses</p>
                  <div className="flex items-end gap-1" style={{ height: 28 }}>
                    {actividadMes.map(({ mes, count }) => (
                      <div key={mes} className="flex flex-col items-center gap-0.5 flex-1">
                        <div className="w-full rounded-sm transition-all duration-700"
                          style={{ height: `${count > 0 ? Math.max(Math.round(count / maxActMes * 22), 3) : 2}px`, background: count > 0 ? T.orange : T.border }} />
                        <span className="text-[8px]" style={{ color: T.textFaint }}>{mes}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

            </div>

            {/* Filtros */}
            <div style={{ flexShrink: 0 }}>
              <FiltrosToolbar
                campos={camposFiltroSol}
                valores={filtrosSol}
                onChange={(k, v) => { setFiltrosSol(p => ({ ...p, [k]: v })); setSolPage(1); }}
                onLimpiar={() => { setFiltrosSol({ busqueda: "", estatus: "Todos", prioridad: "Todos" }); setSolPage(1); }}
                T={T}
              />
            </div>

            {/* Tabla */}
            <div className="rounded-xl overflow-hidden flex flex-col" style={{ ...card, flex: "1 1 0", minHeight: "320px" }}>
              <div className="flex items-center justify-between px-4 py-3 flex-shrink-0" style={hdr}>
                <div className="flex items-center gap-1.5">
                  <div className="w-0.5 h-3.5 rounded-full" style={{ background: T.orange }} />
                  <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: T.textMuted }}>Mis Solicitudes</p>
                </div>
                <div className="flex items-center gap-2">
                  {cargandoSol && (
                    <svg className="animate-spin" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={T.orange} strokeWidth="2.5"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                  )}
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded-full" style={{ background: T.bg, color: T.textMuted, border: `1px solid ${T.border}` }}>
                    {solTotal} resultado{solTotal !== 1 ? "s" : ""}
                  </span>
                </div>
              </div>

              {/* Cards móvil */}
              <div className="flex flex-col gap-2 p-2 lg:hidden" style={{ overflowY: "auto", flex: "1 1 0", minHeight: 0 }}>
                {solicitudes.length === 0
                  ? <div className="flex flex-col items-center justify-center py-8 gap-2">
                      <Inbox size={20} style={{ color: T.textFaint }} />
                      <p className="text-xs font-bold" style={{ color: T.textMuted }}>{hayFiltrosSol ? "Sin resultados" : "No hay solicitudes"}</p>
                    </div>
                  : solicitudes.map(s => (
                    <div key={s.id_solicitud ?? s.id_salida}
                      className="rounded-xl p-3 flex flex-col gap-2 cursor-pointer active:scale-[0.98] transition-all"
                      style={{ background: T.isDark ? "rgba(255,255,255,0.04)" : T.surfaceAlt, border: `1px solid ${T.border}` }}
                      onClick={() => (s.es_salida ? abrirHojaSalida(s) : setSolicitudVer(s))}>
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-[11px] font-black" style={{ color: s.es_salida ? "#0d9488" : T.orange }}>{s.folio_solicitud}</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold"
                          style={{ background: ESTATUS_BG_SOL[s.estatus], color: ESTATUS_COLOR_SOL[s.estatus] }}>
                          {s.estatus}
                        </span>
                      </div>
                      <p className="text-[11px]" style={{ color: T.textMuted }}>
                        {s.insumos_nombres ? s.insumos_nombres.split(",").slice(0,2).join(", ") + (s.insumos_nombres.split(",").length > 2 ? "…" : "") : "—"}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1 text-[11px] font-bold">
                          <span className="w-2 h-2 rounded-full" style={{ background: PCOLOR_SOL[s.prioridad] || "#94a3b8" }} />
                          <span style={{ color: PCOLOR_SOL[s.prioridad] || T.textMuted }}>{s.prioridad}</span>
                        </span>
                        <span className="text-[11px]" style={{ color: T.textFaint }}>{fmtSol(s.fecha)}</span>
                      </div>
                    </div>
                  ))
                }
              </div>

              {/* Tabla desktop */}
              <div className="hidden lg:flex lg:flex-col" style={{ overflowY: "auto", flex: "1 1 0", minHeight: 0 }}>
                <table className="w-full border-collapse" style={{ minWidth: "640px" }}>
                  <thead className="sticky top-0 z-10">
                    <tr style={{ background: T.isDark ? "rgba(255,255,255,0.03)" : T.surfaceAlt }}>
                      {["Folio", "Insumos", "Piezas", "Prioridad", "Estatus", "Fecha", ""].map((col, i) => (
                        <th key={i} className="text-left px-3 py-2 text-[9px] font-black uppercase tracking-widest whitespace-nowrap"
                          style={{ color: T.textMuted, borderBottom: `1px solid ${T.border}` }}>
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {solicitudes.length === 0
                      ? <tr><td colSpan={7}>
                          <div className="flex flex-col items-center justify-center py-12 gap-2">
                            <Inbox size={22} style={{ color: T.textFaint }} />
                            <p className="text-xs font-bold" style={{ color: T.textMuted }}>{hayFiltrosSol ? "Sin resultados" : "No hay solicitudes registradas"}</p>
                          </div>
                        </td></tr>
                      : solicitudes.map((s, i) => {
                          const bgRow = i % 2 === 0 ? (T.isDark ? "#141720" : T.surface) : (T.isDark ? "#1c2030" : T.surfaceAlt);
                          return (
                            <tr key={s.id_solicitud ?? s.id_salida} className="cursor-pointer transition-colors"
                              style={{ background: bgRow, borderBottom: `1px solid ${T.border}` }}
                              onMouseEnter={e => e.currentTarget.style.background = T.isDark ? "rgba(244,121,32,0.05)" : "rgba(244,121,32,0.03)"}
                              onMouseLeave={e => e.currentTarget.style.background = bgRow}
                              onClick={() => (s.es_salida ? abrirHojaSalida(s) : setSolicitudVer(s))}>
                              <td className="px-3 py-2 font-mono text-[10px] font-bold" style={{ color: s.es_salida ? "#0d9488" : T.orange }}>{s.folio_solicitud}</td>
                              <td className="px-3 py-2 text-[11px]" style={{ maxWidth: 220 }}>
                                <span className="block truncate" style={{ color: T.text }}>
                                  {s.insumos_nombres || "—"}
                                </span>
                              </td>
                              <td className="px-3 py-2 text-[11px] font-bold" style={{ color: T.textMuted }}>{s.total_piezas ?? "—"}</td>
                              <td className="px-3 py-2">
                                <span className="flex items-center gap-1 text-[11px] font-bold">
                                  <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: PCOLOR_SOL[s.prioridad] || "#94a3b8" }} />
                                  <span style={{ color: PCOLOR_SOL[s.prioridad] || T.textMuted }}>{s.prioridad}</span>
                                </span>
                              </td>
                              <td className="px-3 py-2">
                                <span className="px-2 py-0.5 rounded-full text-[9px] font-bold"
                                  style={{ background: ESTATUS_BG_SOL[s.estatus], color: ESTATUS_COLOR_SOL[s.estatus] }}>
                                  {s.estatus}
                                </span>
                              </td>
                              <td className="px-3 py-2 text-[11px] whitespace-nowrap" style={{ color: T.textMuted }}>{fmtSol(s.fecha)}</td>
                              <td className="px-3 py-2">
                                <button onClick={e => { e.stopPropagation(); if (s.es_salida) abrirHojaSalida(s); else setSolicitudVer(s); }}
                                  className="flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-lg transition-all hover:brightness-110 active:scale-95"
                                  style={{ color: T.orange, background: "rgba(244,121,32,0.08)", border: "1px solid rgba(244,121,32,0.2)" }}>
                                  <Eye size={10} /> {s.es_salida ? "Hoja" : "Ver"}
                                </button>
                              </td>
                            </tr>
                          );
                        })
                    }
                  </tbody>
                </table>
              </div>

              {/* Paginación */}
              <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2" style={{ borderTop: `1px solid ${T.border}`, background: T.bg, flexShrink: 0 }}>
                <div className="flex items-center gap-2">
                  <button disabled={solPage <= 1 || cargandoSol} onClick={() => setSolPage(p => Math.max(1, p - 1))}
                    className="px-2 py-1 rounded border text-xs" style={{ borderColor: T.border, background: T.surfaceAlt, color: T.text }}>Anterior</button>
                  <button disabled={solPage >= solPages || cargandoSol} onClick={() => setSolPage(p => Math.min(solPages, p + 1))}
                    className="px-2 py-1 rounded border text-xs" style={{ borderColor: T.border, background: T.surfaceAlt, color: T.text }}>Siguiente</button>
                  <span className="text-[11px]" style={{ color: T.textMuted }}>Página {solPage} de {solPages}</span>
                </div>
                <div className="flex items-center gap-2">
                  <label style={{ color: T.textMuted, fontSize: 10 }}>Mostrar</label>
                  <select value={solLimit} onChange={e => { setSolLimit(parseInt(e.target.value, 10)); setSolPage(1); }}
                    style={{ padding: "4px", borderRadius: 6, border: `1px solid ${T.border}`, background: T.surface, color: T.text }}>
                    {[10, 25, 50, 100].map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
              </div>
            </div>

          </div>
        )}

        {tab === "nueva" && (
          <div style={{ display: "flex", gap: 10, flex: 1, minHeight: 0, overflow: "hidden" }}>

          {/* Columna izquierda */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10, flex: 1, minWidth: 0, minHeight: 0, overflow: "hidden" }}>
            <>
              {/* Barra de filtros */}
              <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10,
                  padding: "10px 12px", display: "flex", flexDirection: "column", gap: 8, flexShrink: 0 }}>

                {/* Fila 1: búsqueda + estado + ordenar + limpiar */}
                <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
                  {/* Búsqueda */}
                  <div style={{ position: "relative", flex: "1 1 180px", minWidth: 140 }}>
                    <Search size={13} style={{ position: "absolute", left: 9, top: "50%", transform: "translateY(-50%)", color: T.textFaint, pointerEvents: "none" }} />
                    <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                      placeholder="Buscar por nombre, marca o modelo…"
                      style={{ width: "100%", paddingLeft: 28, paddingRight: searchQuery ? 28 : 10, height: 32, borderRadius: 7,
                          fontSize: 12, outline: "none", background: T.surfaceAlt, border: `1px solid ${T.border}`,
                          color: T.text, boxSizing: "border-box" }}
                      onFocus={e => { e.target.style.borderColor = "#3b82f6"; e.target.style.background = T.surface; }}
                      onBlur={e  => { e.target.style.borderColor = T.border;  e.target.style.background = T.surfaceAlt; }}
                    />
                    {searchQuery && (
                      <button onClick={() => setSearchQuery("")}
                        style={{ position: "absolute", right: 7, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: T.textFaint, padding: 0, display: "flex" }}>
                        <X size={11} />
                      </button>
                    )}
                  </div>

                  {/* Limpiar */}
                  {hayFiltrosInsumos && (
                    <button onClick={limpiarFiltrosInsumos}
                      style={{ height: 32, paddingLeft: 10, paddingRight: 10, borderRadius: 7, fontSize: 11, fontWeight: 700,
                          background: T.isDark ? "rgba(239,68,68,0.12)" : "#fef2f2",
                          color: "#ef4444", border: "1px solid rgba(239,68,68,0.3)",
                          cursor: "pointer", display: "flex", alignItems: "center", gap: 4, whiteSpace: "nowrap" }}>
                      <X size={10} /> Limpiar
                    </button>
                  )}

                  <span style={{ fontSize: 11, fontFamily: "monospace", color: T.textFaint, marginLeft: "auto", whiteSpace: "nowrap" }}>
                    {filteredSupplies.length} resultado{filteredSupplies.length !== 1 ? "s" : ""}
                  </span>
                </div>

                {/* Fila 2: chips de categoría */}
                <div style={{ display: "flex", flexWrap: "wrap", gap: 5, alignItems: "center" }}>
                  {categories.map(cat => (
                    <button key={cat} onClick={() => setCategoryFilter(cat)}
                      style={{ padding: "2px 9px", borderRadius: 6, fontSize: 11, fontWeight: 600,
                          background: categoryFilter === cat ? "#2563eb" : T.surfaceAlt,
                          color:      categoryFilter === cat ? "#fff"    : T.textMuted,
                          border:     categoryFilter === cat ? "1px solid #2563eb" : `1px solid ${T.border}`,
                          cursor: "pointer", whiteSpace: "nowrap" }}>
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tabla de insumos */}
              <div className="pr-catalogo-scroll" style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, overflow: "hidden", display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
                <div style={{ overflowX: "auto", overflowY: "auto", flex: 1, minHeight: 0, WebkitOverflowScrolling: "touch" }}>
                  <table className="w-full text-left border-collapse" style={{ minWidth: "360px" }}>
                    <thead>
                      <tr style={{ background: T.surfaceAlt, position: "sticky", top: 0, zIndex: 10 }}>
                        {["Img", "Insumo", "Categoría", "Acción"].map((col, i) => (
                          <th key={i} className={col === "Categoría" ? "pr-col-categoria" : undefined}
                            style={{ padding: "8px 10px", fontSize: 10, fontWeight: 700, textTransform: "uppercase",
                              letterSpacing: "0.06em", whiteSpace: "nowrap", color: T.textMuted,
                              borderBottom: `1px solid ${T.border}` }}>
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {isLoading ? (
                        <tr><td colSpan={4} style={{ padding: "64px 0", textAlign: "center" }}>
                          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, color: T.textFaint }}>
                            <svg className="animate-spin" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
                            <span style={{ fontSize: 12 }}>Cargando insumos…</span>
                          </div>
                        </td></tr>
                      ) : filteredSupplies.length === 0 ? (
                        <tr><td colSpan={4} style={{ padding: "64px 0", textAlign: "center" }}>
                          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, color: T.textFaint }}>
                            <Package size={28} />
                            <span style={{ fontSize: 13, fontWeight: 600 }}>Sin resultados</span>
                          </div>
                        </td></tr>
                      ) : (
                        filteredSupplies.map(supply => (
                          <SupplyRow key={supply.id_insumo} supply={supply}
                            isAdded={!!requestCart[supply.id_insumo]}
                            onAdd={handleAddSupply} animatingId={animatingId}
                            onDetail={setInsumoDetalle} T={T} />
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
              </>
          </div>

          {/* Columna derecha — panel solicitud, oculto en móvil (<768px) */}
          <div className="hidden md:flex" style={{ width: 300, flexShrink: 0, alignSelf: "flex-start", flexDirection: "column" }}>
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10,
                boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
                display: "flex", flexDirection: "column", overflow: "hidden" }}>

              {/* Header panel */}
              <div style={{ padding: "7px 10px", display: "flex", alignItems: "center", justifyContent: "space-between",
                  background: T.isDark ? T.surfaceAlt : "#1e3a5f" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <Ticket size={12} style={{ color: "#60a5fa" }} />
                  <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "#fff" }}>Solicitud</span>
                </div>
                {totalItemCount > 0 && (
                  <span style={{ fontSize: 9, fontWeight: 800, padding: "1px 6px", borderRadius: 99, background: "#2563eb", color: "#fff" }}>
                    {totalItemCount}
                  </span>
                )}
              </div>

              {/* Solicitante */}
              <div style={{ padding: "6px 10px", background: T.isDark ? T.surfaceAlt : "#f0f4f8", borderBottom: `1px solid ${T.border}` }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  {[
                    { label: "Nombre",   value: requesterName },
                    { label: "Área",     value: usuario.departamento || "—" },
                    { label: "Sucursal", value: usuario.sucursal || "—" },
                  ].map(({ label, value }) => (
                    <div key={label} style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 4 }}>
                      <span style={{ fontSize: 9, color: T.textFaint, flexShrink: 0 }}>{label}</span>
                      <span style={{ fontSize: 10, fontWeight: 600, color: T.text, textAlign: "right", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "60%" }}>{value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Carrito */}
              <div style={{ maxHeight: 380, overflowY: "auto" }}>
                {cartEntries.length === 0 ? (
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "16px 8px", gap: 6, color: T.textFaint }}>
                    <Package size={18} />
                    <span style={{ fontSize: 10, textAlign: "center" }}>Agrega insumos desde la tabla</span>
                  </div>
                ) : (
                  cartEntries.map(({ supply, quantity, id }) => (
                    <RequestItem key={id} supply={supply} quantity={quantity} onRemove={handleRemoveSupply} onChangeQty={handleChangeQty} esUltimo={cartEntries.length <= 1} T={T} />
                  ))
                )}
              </div>

              {/* Prioridad + justificación + botón */}
              <div style={{ padding: "8px 10px", display: "flex", flexDirection: "column", gap: 6, flexShrink: 0, borderTop: `1px solid ${T.border}` }}>

                <div style={{ position: "relative" }}>
                  <select
                    value={priority}
                    onChange={e => setPriority(e.target.value)}
                    style={{
                      width: "100%", height: 28, paddingLeft: 8, paddingRight: 22,
                      borderRadius: 6, fontSize: 11, fontWeight: 600,
                      border: `1px solid ${activePriority ? activePriority.border : T.border}`,
                      background: activePriority ? activePriority.bg : T.surfaceAlt,
                      color: activePriority ? activePriority.color : T.textFaint,
                      outline: "none", appearance: "none", cursor: "pointer",
                    }}>
                    <option value="" disabled>Prioridad…</option>
                    {PRIORITY_OPTIONS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                  </select>
                  <ChevronDown size={11} style={{ position: "absolute", right: 6, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: activePriority ? activePriority.color : T.textFaint }} />
                </div>

                <textarea
                  rows={2}
                  value={justification}
                  onChange={e => setJustification(e.target.value)}
                  placeholder="Justificación…"
                  style={{
                    width: "100%", padding: "5px 8px", borderRadius: 6, fontSize: 11,
                    border: `1px solid ${justification.trim() ? T.border : "rgba(239,68,68,0.4)"}`,
                    background: justification.trim() ? T.surfaceAlt : (T.isDark ? "rgba(239,68,68,0.08)" : "#fff5f5"),
                    color: T.text, outline: "none", resize: "none", boxSizing: "border-box",
                  }}
                  onFocus={e  => { e.target.style.borderColor = "#3b82f6"; e.target.style.background = T.surface; }}
                  onBlur={e   => {
                    e.target.style.borderColor = justification.trim() ? T.border : "rgba(239,68,68,0.4)";
                    e.target.style.background  = justification.trim() ? T.surfaceAlt : (T.isDark ? "rgba(239,68,68,0.08)" : "#fff5f5");
                  }}
                />

                {!isTicketValid && (
                  <p style={{ fontSize: 9, color: T.textFaint, margin: 0, lineHeight: 1.4 }}>
                    {cartEntries.length === 0 ? "Agrega al menos un insumo" : "Escribe la justificación"}
                  </p>
                )}

                <button
                  onClick={handleSubmitTicket}
                  disabled={!isTicketValid || isSubmitting}
                  style={{
                    width: "100%", height: 32, borderRadius: 6, fontSize: 11, fontWeight: 700,
                    background: isTicketValid ? "#2563eb" : T.surfaceAlt,
                    color: isTicketValid ? "#fff" : T.textFaint,
                    border: "none", cursor: isTicketValid ? "pointer" : "not-allowed",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
                    boxShadow: isTicketValid ? "0 2px 8px rgba(37,99,235,0.25)" : "none",
                    opacity: (!isTicketValid || isSubmitting) ? 0.5 : 1,
                    transition: "all 0.15s",
                  }}
                >
                  {isSubmitting
                    ? <><svg className="animate-spin" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>Creando…</>
                    : <><Ticket size={11} />Crear Solicitud</>
                  }
                </button>
              </div>
            </div>
          </div>
          </div>
        )}
      </div>

      {/* ── Drawer móvil — panel solicitud ─────────────────────── */}
      <style>{estilosMovil}</style>
      <div className="lg:hidden">
          {/* Barra flotante inferior */}
          <div
            onClick={() => setDrawerOpen(true)}
            style={{
              position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 50,
              background: T.isDark ? "#1e3a5f" : "#1e3a5f",
              borderTop: "2px solid rgba(96,165,250,0.3)",
              padding: "10px 16px",
              paddingBottom: "calc(10px + env(safe-area-inset-bottom))",
              display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8,
              cursor: "pointer",
              boxShadow: "0 -4px 20px rgba(0,0,0,0.25)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
              <Ticket size={16} style={{ color: "#60a5fa", flexShrink: 0 }} />
              <span style={{ fontSize: 13, fontWeight: 700, color: "#fff", whiteSpace: "nowrap" }}>
                {totalItemCount > 0 ? "Tu solicitud" : "Agrega insumos"}
              </span>
              {totalItemCount > 0 && (
                <span style={{ fontSize: 11, fontWeight: 800, padding: "1px 8px", borderRadius: 99, background: "#2563eb", color: "#fff", flexShrink: 0 }}>
                  {totalItemCount} pza.
                </span>
              )}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
              {cartEntries.length > 0 && (
                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", whiteSpace: "nowrap" }}>
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
                style={{ position: "fixed", inset: 0, zIndex: 51, background: "rgba(0,0,0,0.45)", animation: "prFade 0.18s ease" }}
              />
              <div
                className="pr-drawer"
                role="dialog"
                aria-modal="true"
                aria-label="Solicitud en proceso"
                style={{
                  position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 52,
                  background: T.surface,
                  borderRadius: "16px 16px 0 0",
                  border: `1px solid ${T.border}`,
                  boxShadow: "0 -8px 32px rgba(0,0,0,0.3)",
                  display: "flex", flexDirection: "column",
                  overflow: "hidden",
                  animation: "prSheet 0.22s cubic-bezier(0.32, 0.72, 0, 1)",
                }}
              >
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
                <div className="pr-drawer-scroll" style={{ overflowY: "auto", flex: 1, minHeight: 0, overscrollBehavior: "contain" }}>
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
                        <RequestItem key={id} supply={supply} quantity={quantity} onRemove={handleRemoveSupply} onChangeQty={handleChangeQty} esUltimo={cartEntries.length <= 1} T={T} />
                      ))
                    )}
                  </div>

                  {/* Prioridad + justificación + botón */}
                  <div style={{ padding: "12px 16px", paddingBottom: "calc(16px + env(safe-area-inset-bottom))", display: "flex", flexDirection: "column", gap: 12, borderTop: `1px solid ${T.border}`, background: T.surface }}>
                    <div>
                      <label style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: T.textMuted, display: "block", marginBottom: 6 }}>Prioridad</label>
                      <div style={{ position: "relative" }}>
                        <select
                          value={priority}
                          onChange={e => setPriority(e.target.value)}
                          style={{
                            width: "100%", height: 40, paddingLeft: 12, paddingRight: 32,
                            borderRadius: 8, fontSize: 13, fontWeight: 600, boxSizing: "border-box",
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

      {/* Modal resultado */}
      {resultModal && (
        <ModalResultado
          resultModal={resultModal}
          cartEntries={resultModal.success ? resultModal._cartSnapshot : []}
          T={T}
          onClose={() => { if (resultModal.success && resultModal.id_solicitud) setSolicitudVer({ id_solicitud: resultModal.id_solicitud }); setResultModal(null); }}
        />
      )}

      {modalSalida && (
        <ModalSalidaView
          payload={modalSalida}
          T={T}
          onClose={() => setModalSalida(null)}
        />
      )}
      {insumoDetalle && (
        <ModalDetalleInsumo insumo={insumoDetalle} onClose={() => setInsumoDetalle(null)} T={T} />
      )}
    </div>
  );
}

