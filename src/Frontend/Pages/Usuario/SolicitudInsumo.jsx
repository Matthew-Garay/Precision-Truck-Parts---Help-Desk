import { useState, useEffect } from "react";
import { ShoppingCart, Plus, Minus, Trash2, Package, CheckCircle2, X, Search, Tag, AlertCircle } from "lucide-react";
import { apiFetch } from "../../Config/api";

const PRIORIDADES = [
  { val: "Urgente", color: "#dc2626", bg: "rgba(220,38,38,0.12)",  border: "rgba(220,38,38,0.3)"  },
  { val: "Alta",    color: "#ea580c", bg: "rgba(234,88,12,0.12)",  border: "rgba(234,88,12,0.3)"  },
  { val: "Media",   color: "#ca8a04", bg: "rgba(202,138,4,0.12)",  border: "rgba(202,138,4,0.3)"  },
  { val: "Baja",    color: "#16a34a", bg: "rgba(22,163,74,0.12)",  border: "rgba(22,163,74,0.3)"  },
];

function TarjetaInsumo({ ins, cantidad, onAgregar, onQuitar, T, isDark }) {
  const enCarrito = cantidad > 0;
  const stockColor = ins.stock <= 3 ? "#ca8a04" : "#16a34a";

  return (
    <div
      className="rounded-2xl overflow-hidden flex flex-col transition-all duration-200 hover:translate-y-[-2px]"
      style={{
        background: isDark ? "#141720" : T.surface,
        border: `1px solid ${enCarrito ? T.orange : (isDark ? "rgba(255,255,255,0.07)" : T.border)}`,
        boxShadow: enCarrito
          ? `0 0 0 2px rgba(244,121,32,0.2), ${isDark ? "0 4px 16px rgba(0,0,0,0.4)" : "0 4px 16px rgba(244,121,32,0.12)"}`
          : isDark ? "0 2px 10px rgba(0,0,0,0.3)" : "0 1px 4px rgba(0,0,0,0.06)",
      }}>

      {/* Barra top */}
      <div style={{
        height: "3px",
        background: enCarrito
          ? `linear-gradient(90deg, ${T.orange}, #ffb347)`
          : (isDark ? "rgba(255,255,255,0.06)" : "#e2e8f0"),
      }} />

      <div className="p-3.5 flex flex-col gap-3 flex-1">

        {/* Icono + nombre */}
        <div className="flex items-start gap-2.5">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: enCarrito ? "rgba(244,121,32,0.15)" : (isDark ? "rgba(255,255,255,0.05)" : T.surfaceAlt), border: `1px solid ${enCarrito ? "rgba(244,121,32,0.3)" : (isDark ? "rgba(255,255,255,0.08)" : T.border)}` }}>
            <Package size={16} style={{ color: enCarrito ? T.orange : T.textFaint }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[12px] font-bold leading-tight" style={{ color: T.text }}>{ins.nombre}</p>
            {(ins.marca || ins.modelo) && (
              <p className="text-[10px] mt-0.5 truncate" style={{ color: T.textMuted }}>
                {[ins.marca, ins.modelo].filter(Boolean).join(" · ")}
              </p>
            )}
          </div>
        </div>

        {/* Categoría + stock */}
        <div className="flex items-center justify-between gap-2">
          {ins.nombre_categoria && (
            <div className="flex items-center gap-1 min-w-0">
              <Tag size={9} style={{ color: T.textFaint, flexShrink: 0 }} />
              <span className="text-[9px] font-semibold truncate px-1.5 py-0.5 rounded-full"
                style={{ background: isDark ? "rgba(255,255,255,0.05)" : T.surfaceAlt, color: T.textMuted, border: `1px solid ${isDark ? "rgba(255,255,255,0.07)" : T.border}` }}>
                {ins.nombre_categoria}
              </span>
            </div>
          )}
          <span className="text-[10px] font-black flex-shrink-0" style={{ color: stockColor }}>
            {ins.stock} en stock
          </span>
        </div>

        {/* Controles */}
        <div className="mt-auto">
          {enCarrito ? (
            <div className="flex items-center justify-between px-1">
              <button onClick={() => onQuitar(ins.id_insumo)}
                className="w-8 h-8 rounded-xl flex items-center justify-center transition-all hover:brightness-110 active:scale-95"
                style={{ background: isDark ? "rgba(255,255,255,0.07)" : T.surfaceAlt, color: T.textMuted, border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : T.border}` }}>
                <Minus size={12} />
              </button>
              <div className="flex flex-col items-center">
                <span className="text-[18px] font-black leading-none" style={{ color: T.orange }}>{cantidad}</span>
                <span className="text-[8px] font-semibold" style={{ color: T.textFaint }}>en carrito</span>
              </div>
              <button onClick={() => onAgregar(ins.id_insumo)}
                disabled={cantidad >= ins.stock}
                className="w-8 h-8 rounded-xl flex items-center justify-center transition-all hover:brightness-110 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ background: "rgba(244,121,32,0.15)", color: T.orange, border: "1px solid rgba(244,121,32,0.3)" }}>
                <Plus size={12} />
              </button>
            </div>
          ) : (
            <button onClick={() => onAgregar(ins.id_insumo)}
              className="w-full py-2 rounded-xl text-[11px] font-bold transition-all hover:brightness-110 active:scale-95 flex items-center justify-center gap-1.5"
              style={{ background: "rgba(244,121,32,0.1)", color: T.orange, border: "1px solid rgba(244,121,32,0.2)" }}>
              <Plus size={12} /> Agregar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function SolicitudInsumo({ T, usuario = {} }) {
  const isDark = T.isDark;
  const [insumos,   setInsumos]   = useState([]);
  const [carrito,   setCarrito]   = useState({});
  const [prioridad, setPrioridad] = useState("");
  const [loading,   setLoading]   = useState(true);
  const [enviando,  setEnviando]  = useState(false);
  const [modal,     setModal]     = useState(null);
  const [busqueda,  setBusqueda]  = useState("");
  const [catFiltro, setCatFiltro] = useState("Todos");

  useEffect(() => {
    apiFetch(`/api/solicitudes/insumos`)
      .then(r => r.json())
      .then(d => setInsumos(Array.isArray(d) ? d : []))
      .catch(() => setInsumos([]))
      .finally(() => setLoading(false));
  }, []);

  const categorias = ["Todos", ...Array.from(new Set(insumos.map(i => i.nombre_categoria).filter(Boolean)))];

  const filtrados = insumos.filter(i => {
    if (catFiltro !== "Todos" && i.nombre_categoria !== catFiltro) return false;
    if (!busqueda) return true;
    const q = busqueda.toLowerCase();
    return i.nombre?.toLowerCase().includes(q) || i.marca?.toLowerCase().includes(q);
  });

  const agregar = (id) => setCarrito(prev => ({ ...prev, [id]: (prev[id] || 0) + 1 }));
  const quitar  = (id) => setCarrito(prev => {
    const nueva = (prev[id] || 0) - 1;
    if (nueva <= 0) { const c = { ...prev }; delete c[id]; return c; }
    return { ...prev, [id]: nueva };
  });

  const totalItems = Object.values(carrito).reduce((s, n) => s + n, 0);
  const itemsCarrito = Object.entries(carrito).map(([id, cant]) => ({
    ins: insumos.find(i => i.id_insumo === parseInt(id)),
    cant, id,
  })).filter(x => x.ins);

  const enviar = async () => {
    if (!prioridad)             return setModal({ ok: false, msg: "Selecciona una prioridad" });
    if (totalItems === 0)       return setModal({ ok: false, msg: "Agrega al menos un insumo al carrito" });
    if (!usuario?.id_empleado)  return setModal({ ok: false, msg: "No se pudo identificar al usuario" });

    setEnviando(true);
    try {
      const res  = await apiFetch(`/api/solicitudes`, {
        method: "POST",
        body: {
          prioridad,
          id_empleado: usuario.id_empleado,
          insumos: Object.entries(carrito).map(([id_insumo, cantidad]) => ({ id_insumo: parseInt(id_insumo), cantidad })),
        },
      });
      const data = await res.json();
      if (!res.ok) { setModal({ ok: false, msg: data.error || "Error al enviar" }); return; }
      setModal({ ok: true, folio: data.folio_solicitud });
      setCarrito({});
      setPrioridad("");
    } catch {
      setModal({ ok: false, msg: "No se pudo conectar con el servidor" });
    } finally {
      setEnviando(false);
    }
  };

  const card = {
    background: isDark ? "#141720" : T.surface,
    border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : T.border}`,
    boxShadow: isDark ? "0 4px 20px rgba(0,0,0,0.3)" : "0 1px 4px rgba(0,0,0,0.05)",
  };
  const hdr = {
    background: isDark ? "rgba(255,255,255,0.03)" : T.surfaceAlt,
    borderBottom: `1px solid ${isDark ? "rgba(255,255,255,0.07)" : T.border}`,
  };

  return (
    <div className="overflow-y-auto" style={{ background: T.bg }}>
      <div className="max-w-[1300px] mx-auto px-4 py-5 flex flex-col gap-4">

        {/* -- PRIORIDAD -- */}
        <div className="rounded-xl overflow-hidden" style={card}>
          <div className="px-4 py-2.5 flex items-center gap-2" style={hdr}>
            <div className="w-0.5 h-3.5 rounded-full" style={{ background: T.orange }} />
            <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: T.textMuted }}>Prioridad de la solicitud</p>
          </div>
          <div className="px-4 py-3 grid grid-cols-2 sm:grid-cols-4 gap-2">
            {PRIORIDADES.map(p => (
              <button key={p.val} onClick={() => setPrioridad(p.val)}
                className="py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2"
                style={{
                  background:  prioridad === p.val ? p.bg : isDark ? "rgba(255,255,255,0.04)" : "#f8fafc",
                  color:       prioridad === p.val ? p.color : T.textMuted,
                  border:     `1px solid ${prioridad === p.val ? p.border : isDark ? "rgba(255,255,255,0.08)" : T.border}`,
                  boxShadow:   prioridad === p.val ? `0 0 0 3px ${p.border}` : "none",
                }}>
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: prioridad === p.val ? p.color : T.textFaint }} />
                {p.val}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* -- CATÁLOGO -- */}
          <div className="lg:col-span-2 flex flex-col gap-3">

            {/* Buscador + filtro categoría */}
            <div className="rounded-xl overflow-hidden" style={card}>
              <div className="px-4 py-2.5 flex items-center justify-between" style={hdr}>
                <div className="flex items-center gap-2">
                  <div className="w-0.5 h-3.5 rounded-full" style={{ background: T.orange }} />
                  <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: T.textMuted }}>Insumos disponibles</p>
                </div>
                <span className="text-[9px] font-bold px-2 py-0.5 rounded-full"
                  style={{ background: T.bg, color: T.textMuted, border: `1px solid ${T.border}` }}>
                  {filtrados.length} insumo{filtrados.length !== 1 ? "s" : ""}
                </span>
              </div>
              <div className="px-4 py-3 flex flex-wrap gap-2 items-center">
                <div className="relative flex-1" style={{ minWidth: "160px" }}>
                  <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
                    style={{ color: busqueda ? T.orange : T.textFaint }} />
                  <input
                    className="w-full pl-7 pr-3 py-1.5 rounded-lg text-[11px] outline-none"
                    style={{ background: isDark ? "rgba(255,255,255,0.05)" : T.surfaceAlt, border: `1px solid ${busqueda ? T.orange : T.border}`, color: T.text }}
                    placeholder="Buscar por nombre o marca..."
                    value={busqueda} onChange={e => setBusqueda(e.target.value)}
                    onFocus={e => e.target.style.borderColor = T.orange}
                    onBlur={e  => { if (!busqueda) e.target.style.borderColor = T.border; }} />
                </div>
                {/* Chips de categoría */}
                <div className="flex flex-wrap gap-1.5">
                  {categorias.map(c => (
                    <button key={c} onClick={() => setCatFiltro(c)}
                      className="px-2.5 py-1 rounded-full text-[10px] font-bold transition-all"
                      style={{
                        background: catFiltro === c ? T.orange : (isDark ? "rgba(255,255,255,0.05)" : T.surfaceAlt),
                        color:      catFiltro === c ? "#fff" : T.textMuted,
                        border:    `1px solid ${catFiltro === c ? T.orange : (isDark ? "rgba(255,255,255,0.08)" : T.border)}`,
                      }}>
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Grid de tarjetas */}
            {loading ? (
              <div className="flex justify-center py-16">
                <svg className="animate-spin" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={T.orange} strokeWidth="2">
                  <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                </svg>
              </div>
            ) : filtrados.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-14 gap-3 rounded-xl"
                style={{ background: isDark ? "#141720" : T.surface, border: `1px solid ${isDark ? "rgba(255,255,255,0.07)" : T.border}` }}>
                <Package size={28} style={{ color: T.textFaint }} />
                <p className="text-sm font-bold" style={{ color: T.textMuted }}>Sin insumos disponibles</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                {filtrados.map(ins => (
                  <TarjetaInsumo
                    key={ins.id_insumo}
                    ins={ins}
                    cantidad={carrito[ins.id_insumo] || 0}
                    onAgregar={agregar}
                    onQuitar={quitar}
                    T={T}
                    isDark={isDark}
                  />
                ))}
              </div>
            )}
          </div>

          {/* -- CARRITO -- */}
          <div className="rounded-xl overflow-hidden flex flex-col lg:sticky lg:top-4 lg:self-start" style={card}>
            <div className="px-4 py-2.5 flex items-center justify-between" style={hdr}>
              <div className="flex items-center gap-2">
                <ShoppingCart size={13} style={{ color: T.orange }} />
                <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: T.textMuted }}>Carrito</p>
              </div>
              {totalItems > 0 && (
                <span className="text-[9px] font-black px-2 py-0.5 rounded-full"
                  style={{ background: "rgba(244,121,32,0.12)", color: T.orange, border: "1px solid rgba(244,121,32,0.25)" }}>
                  {totalItems} pieza{totalItems !== 1 ? "s" : ""}
                </span>
              )}
            </div>

            <div className="flex flex-col flex-1">
              {itemsCarrito.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 gap-2 px-4">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
                    style={{ background: isDark ? "rgba(255,255,255,0.04)" : T.surfaceAlt, border: `1px solid ${T.border}` }}>
                    <ShoppingCart size={20} style={{ color: T.textFaint }} />
                  </div>
                  <p className="text-xs font-bold text-center" style={{ color: T.textMuted }}>Carrito vacío</p>
                  <p className="text-[11px] text-center" style={{ color: T.textFaint }}>Agrega insumos desde el catálogo</p>
                </div>
              ) : (
                <div className="flex flex-col">
                  {itemsCarrito.map(({ ins, cant, id }) => (
                    <div key={id} className="flex items-center gap-3 px-4 py-3"
                      style={{ borderBottom: `1px solid ${isDark ? "rgba(255,255,255,0.04)" : T.border}` }}>
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ background: "rgba(244,121,32,0.1)", border: "1px solid rgba(244,121,32,0.2)" }}>
                        <Package size={13} style={{ color: T.orange }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-bold truncate" style={{ color: T.text }}>{ins.nombre}</p>
                        <p className="text-[10px] font-semibold" style={{ color: T.orange }}>× {cant}</p>
                      </div>
                      <button onClick={() => setCarrito(prev => { const c = { ...prev }; delete c[id]; return c; })}
                        className="w-6 h-6 rounded-lg flex items-center justify-center transition-all hover:brightness-110 flex-shrink-0"
                        style={{ background: "rgba(220,38,38,0.08)", color: "#dc2626", border: "1px solid rgba(220,38,38,0.2)" }}>
                        <Trash2 size={10} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="px-4 py-3 flex flex-col gap-2"
              style={{ borderTop: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : T.border}` }}>

              {/* Resumen */}
              {itemsCarrito.length > 0 && (
                <div className="flex items-center justify-between px-3 py-2 rounded-xl mb-1"
                  style={{ background: isDark ? "rgba(244,121,32,0.06)" : "#fff7ed", border: "1px solid rgba(244,121,32,0.15)" }}>
                  <span className="text-[10px] font-semibold" style={{ color: T.textMuted }}>{itemsCarrito.length} tipo{itemsCarrito.length !== 1 ? "s" : ""} de insumo</span>
                  <span className="text-[11px] font-black" style={{ color: T.orange }}>{totalItems} piezas</span>
                </div>
              )}

              <button onClick={enviar} disabled={enviando || totalItems === 0 || !prioridad}
                className="w-full py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:brightness-110 active:scale-95 flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ background: `linear-gradient(135deg, ${T.orange}, #d97400)`, boxShadow: "0 4px 14px rgba(244,121,32,0.35)" }}>
                {enviando
                  ? <><svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg> Enviando...</>
                  : <><ShoppingCart size={14} /> Enviar Solicitud</>
                }
              </button>

              {(!prioridad || totalItems === 0) && (
                <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg"
                  style={{ background: isDark ? "rgba(255,255,255,0.03)" : T.surfaceAlt }}>
                  <AlertCircle size={10} style={{ color: T.textFaint, flexShrink: 0 }} />
                  <p className="text-[10px]" style={{ color: T.textFaint }}>
                    {!prioridad ? "Selecciona una prioridad" : "Agrega al menos un insumo"}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal resultado */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ background: "rgba(0,0,0,0.65)" }}
          onClick={() => setModal(null)}>
          <div className="w-full max-w-sm rounded-2xl overflow-hidden"
            style={{ background: isDark ? "#141720" : "#fff", border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : T.border}`, boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}
            onClick={e => e.stopPropagation()}>
            <div className="h-1.5" style={{ background: modal.ok ? "#16a34a" : "#dc2626" }} />
            <div className="p-6 flex flex-col items-center gap-4 text-center">
              <div className="w-14 h-14 rounded-full flex items-center justify-center"
                style={{ background: modal.ok ? (isDark ? "rgba(22,163,74,0.2)" : "#dcfce7") : (isDark ? "rgba(220,38,38,0.2)" : "#fee2e2") }}>
                {modal.ok
                  ? <CheckCircle2 size={28} style={{ color: "#16a34a" }} />
                  : <X size={28} style={{ color: "#dc2626" }} />
                }
              </div>
              <div>
                <p className="text-base font-black" style={{ color: T.text }}>
                  {modal.ok ? "Solicitud enviada" : "Error"}
                </p>
                {modal.ok
                  ? <p className="text-sm mt-1 font-mono font-bold" style={{ color: T.orange }}>#{modal.folio}</p>
                  : <p className="text-sm mt-1" style={{ color: T.textMuted }}>{modal.msg}</p>
                }
              </div>
              <button onClick={() => setModal(null)}
                className="w-full py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:brightness-110"
                style={{ background: modal.ok ? "#16a34a" : "#dc2626" }}>
                {modal.ok ? "Aceptar" : "Cerrar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
