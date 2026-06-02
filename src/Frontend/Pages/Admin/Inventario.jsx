import { useState, useEffect, useRef } from "react";
import { Package, AlertTriangle, CheckCircle2, XCircle, Inbox, Tag, Hash } from "lucide-react";
import { apiFetch } from "../../Config/api";
import FiltrosToolbar from "../../Components/FiltrosToolbar";
import { useToast } from "../../Components/Feedback";

const ESTADO_OPTS = ["Todos", "Excelente", "Bueno", "Regular", "Malo"];
const ESTADO_META = {
  "Excelente": { color: "#16a34a", bg: "rgba(22,163,74,0.12)",   border: "rgba(22,163,74,0.3)",   dot: "#16a34a" },
  "Bueno":     { color: "#3b82f6", bg: "rgba(59,130,246,0.12)",  border: "rgba(59,130,246,0.3)",  dot: "#3b82f6" },
  "Regular":   { color: "#ca8a04", bg: "rgba(202,138,4,0.12)",   border: "rgba(202,138,4,0.3)",   dot: "#ca8a04" },
  "Malo":      { color: "#dc2626", bg: "rgba(220,38,38,0.12)",   border: "rgba(220,38,38,0.3)",   dot: "#dc2626" },
};

function BadgeEstado({ estado }) {
  const s = ESTADO_META[estado] || { color: "#94a3b8", bg: "rgba(148,163,184,0.12)", border: "rgba(148,163,184,0.3)" };
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold whitespace-nowrap"
      style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}` }}>
      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: s.color }} />
      {estado || "-"}
    </span>
  );
}

function TarjetaInsumo({ i, T, isDark }) {
  const stockColor = i.stock === 0 ? "#dc2626" : i.stock <= 3 ? "#ca8a04" : "#16a34a";
  const stockBg    = i.stock === 0
    ? (isDark ? "rgba(220,38,38,0.12)" : "#fef2f2")
    : i.stock <= 3
      ? (isDark ? "rgba(202,138,4,0.12)" : "#fefce8")
      : (isDark ? "rgba(22,163,74,0.12)" : "#f0fdf4");

  return (
    <div
      className="rounded-2xl overflow-hidden flex flex-col transition-all duration-200 hover:translate-y-[-2px] hover:shadow-lg"
      style={{
        background: isDark ? "#141720" : T.surface,
        border: `1px solid ${isDark ? "rgba(255,255,255,0.07)" : T.border}`,
        boxShadow: isDark ? "0 2px 12px rgba(0,0,0,0.3)" : "0 1px 6px rgba(0,0,0,0.06)",
      }}>

      {/* Barra superior de color según estado */}
      <div style={{
        height: "3px",
        background: ESTADO_META[i.estado]
          ? `linear-gradient(90deg, ${ESTADO_META[i.estado].color}, ${ESTADO_META[i.estado].color}88)`
          : (isDark ? "rgba(255,255,255,0.08)" : "#e2e8f0"),
      }} />

      <div className="p-4 flex flex-col gap-3 flex-1">

        {/* Icono + nombre */}
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: isDark ? "rgba(244,121,32,0.12)" : "#fff7ed", border: "1px solid rgba(244,121,32,0.2)" }}>
            <Package size={18} style={{ color: T.orange }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-bold leading-tight truncate" style={{ color: T.text }}>{i.nombre}</p>
            <p className="text-[11px] mt-0.5 truncate" style={{ color: T.textMuted }}>
              {[i.marca, i.modelo].filter(Boolean).join(" · ") || "Sin marca"}
            </p>
          </div>
          <BadgeEstado estado={i.estado} />
        </div>

        {/* Separador */}
        <div style={{ height: "1px", background: isDark ? "rgba(255,255,255,0.05)" : T.border }} />

        {/* Detalles */}
        <div className="flex flex-col gap-2">

          {/* Categoría */}
          <div className="flex items-center gap-2">
            <Tag size={10} style={{ color: T.textFaint, flexShrink: 0 }} />
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full truncate"
              style={{ background: isDark ? "rgba(255,255,255,0.05)" : T.surfaceAlt, color: T.textMuted, border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : T.border}` }}>
              {i.nombre_categoria || "Sin categoría"}
            </span>
          </div>

          {/* N° Serie */}
          {i.num_serie && (
            <div className="flex items-center gap-2">
              <Hash size={10} style={{ color: T.textFaint, flexShrink: 0 }} />
              <span className="text-[10px] font-mono" style={{ color: T.textFaint }}>
                {i.num_serie}
              </span>
            </div>
          )}
        </div>

        {/* Stock */}
        <div className="mt-auto pt-2" style={{ borderTop: `1px solid ${isDark ? "rgba(255,255,255,0.05)" : T.border}` }}>
          <div className="flex items-center justify-between px-3 py-2 rounded-xl"
            style={{ background: stockBg }}>
            <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: stockColor }}>
              {i.stock === 0 ? "Agotado" : i.stock <= 3 ? "Stock bajo" : "En stock"}
            </span>
            <span className="text-[22px] font-black leading-none" style={{ color: stockColor }}>
              {i.stock ?? "-"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Inventario({ T }) {
  const isDark = T.isDark;
  const [insumos,      setInsumos]      = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [filtros,      setFiltros]      = useState({ busqueda:"", estado:"Todos", categoria:"Todos", stock:"Todos" });
  const prevInsumosRef = useRef(null);
  const toast = useToast();

  useEffect(() => {
    const cargar = () =>
      apiFetch(`/api/solicitudes/inventario`)
        .then(r => r.json())
        .then(d => {
          const lista = Array.isArray(d) ? d : [];
          setInsumos(prev => {
            if (prevInsumosRef.current !== null) {
              const prevIds = new Set(prevInsumosRef.current.map(i => i.id_insumo));
              const nuevos  = lista.filter(i => !prevIds.has(i.id_insumo));
              const agotados = lista.filter(i => {
                const ant = prevInsumosRef.current.find(p => p.id_insumo === i.id_insumo);
                return ant && ant.stock > 0 && i.stock === 0;
              });
              if (nuevos.length)   toast.info(`${nuevos.length} insumo${nuevos.length > 1 ? "s" : ""} nuevo${nuevos.length > 1 ? "s" : ""} en inventario`, { title: "Inventario actualizado" });
              if (agotados.length) toast.warning(`${agotados.length} insumo${agotados.length > 1 ? "s" : ""} agotado${agotados.length > 1 ? "s" : ""}`, { title: "Stock agotado" });
            }
            prevInsumosRef.current = lista;
            return lista;
          });
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    cargar();
    const id = setInterval(cargar, 30000);
    return () => clearInterval(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const categorias = ["Todos", ...Array.from(new Set(insumos.map(i => i.nombre_categoria).filter(Boolean)))];

  const camposFiltro = [
    { key:"busqueda",  label:"Búsqueda Rápida", type:"search",  placeholder:"Nombre, marca, modelo..." },
    { key:"estado",    label:"Estado",           type:"select",  opts:["Todos","Excelente","Bueno","Regular","Malo"] },
    { key:"categoria", label:"Categoría",         type:"select",  opts:categorias },
    { key:"stock",     label:"Stock",             type:"select",  opts:["Todos","Con stock","Sin stock"] },
  ];

  const filtrados = insumos.filter(i => {
    if (filtros.busqueda) {
      const q = filtros.busqueda.toLowerCase();
      if (!i.nombre?.toLowerCase().includes(q) && !i.marca?.toLowerCase().includes(q) &&
          !i.modelo?.toLowerCase().includes(q) && !i.num_serie?.toLowerCase().includes(q)) return false;
    }
    if (filtros.estado    !== "Todos" && i.estado !== filtros.estado)                  return false;
    if (filtros.categoria !== "Todos" && i.nombre_categoria !== filtros.categoria)     return false;
    if (filtros.stock === "Con stock" && !(i.stock > 0))                               return false;
    if (filtros.stock === "Sin stock" && i.stock > 0)                                  return false;
    return true;
  });

  const hayFiltros = filtros.busqueda || filtros.estado !== "Todos" || filtros.categoria !== "Todos" || filtros.stock !== "Todos";
  const limpiar = () => setFiltros({ busqueda:"", estado:"Todos", categoria:"Todos", stock:"Todos" });

  const totalItems    = insumos.length;
  const totalStock    = insumos.reduce((s, i) => s + (i.stock || 0), 0);
  const estadoMalo    = insumos.filter(i => i.estado === "Malo").length;
  const estadoRegular = insumos.filter(i => i.estado === "Regular").length;

  const card = {
    background: isDark ? "#141720" : T.surface,
    border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : T.border}`,
    boxShadow: isDark ? "0 4px 20px rgba(0,0,0,0.3)" : "0 1px 4px rgba(0,0,0,0.05)",
  };
  const hdr = {
    background: isDark ? "rgba(255,255,255,0.03)" : T.surfaceAlt,
    borderBottom: `1px solid ${isDark ? "rgba(255,255,255,0.07)" : T.border}`,
  };
  const selStyle = {
    background: isDark ? "rgba(255,255,255,0.05)" : T.surfaceAlt,
    border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : T.border}`,
    color: T.text, borderRadius: "8px", padding: "5px 10px",
    fontSize: "11px", outline: "none", cursor: "pointer",
    colorScheme: isDark ? "dark" : "light",
  };

  return (
    <div className="overflow-y-auto" style={{ background: T.bg }}>
      <div className="max-w-[1400px] mx-auto px-4 py-5 flex flex-col gap-4">

        {/* -- KPIs -- */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Total insumos",   val: totalItems,    color: "#3b82f6", bgL: "#eff6ff", bgD: "#0f1f3d", icon: Package      },
            { label: "Piezas en stock", val: totalStock,    color: "#16a34a", bgL: "#f0fdf4", bgD: "#071a0e", icon: CheckCircle2 },
            { label: "Malo",            val: estadoMalo,    color: "#dc2626", bgL: "#fef2f2", bgD: "#2d0a0a", icon: XCircle      },
            { label: "Regular",         val: estadoRegular, color: "#ca8a04", bgL: "#fefce8", bgD: "#1f1a00", icon: AlertTriangle },
          ].map(({ label, val, color, bgL, bgD, icon: Icon }) => (
            <div key={label} className="rounded-xl px-4 py-3 flex items-center gap-3"
              style={{ background: isDark ? bgD : bgL, border: `1px solid ${isDark ? "rgba(255,255,255,0.07)" : T.border}` }}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: `${color}20` }}>
                <Icon size={16} style={{ color }} />
              </div>
              <div>
                <p className="text-[9px] font-bold uppercase tracking-wider" style={{ color: isDark ? "rgba(255,255,255,0.4)" : T.textMuted }}>{label}</p>
                <p className="text-2xl font-black leading-none mt-0.5" style={{ color }}>{val}</p>
              </div>
            </div>
          ))}
        </div>

        {/* -- FILTROS -- */}
        <FiltrosToolbar campos={camposFiltro} valores={filtros} onChange={(k,v) => setFiltros(p=>({...p,[k]:v}))} onLimpiar={limpiar} T={T} />

        {/* -- GRID DE TARJETAS -- */}
        <div className="rounded-xl overflow-hidden" style={card}>
          <div className="px-4 py-2.5 flex items-center justify-between" style={hdr}>
            <div className="flex items-center gap-2">
              <div className="w-0.5 h-3.5 rounded-full" style={{ background: T.orange }} />
              <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: T.textMuted }}>Catálogo de Insumos</p>
            </div>
            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full"
              style={{ background: T.bg, color: T.textMuted, border: `1px solid ${T.border}` }}>
              {filtrados.length} resultado{filtrados.length !== 1 ? "s" : ""}
            </span>
          </div>

          <div className="p-4">
            {loading ? (
              <div className="flex justify-center py-16">
                <svg className="animate-spin" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={T.orange} strokeWidth="2">
                  <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                </svg>
              </div>
            ) : filtrados.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
                  style={{ background: isDark ? "rgba(255,255,255,0.04)" : T.surfaceAlt, border: `1px solid ${T.border}` }}>
                  <Inbox size={24} style={{ color: T.textFaint }} />
                </div>
                <p className="text-sm font-bold" style={{ color: T.textMuted }}>
                  {hayFiltros ? "Sin resultados - ajusta los filtros" : "No hay insumos registrados"}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                {filtrados.map(i => (
                  <TarjetaInsumo key={i.id_insumo} i={i} T={T} isDark={isDark} />
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
