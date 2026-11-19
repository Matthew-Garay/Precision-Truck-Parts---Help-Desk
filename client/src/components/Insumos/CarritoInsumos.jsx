/**
 * CarritoInsumos.jsx — Renglones del catálogo y del carrito de "Solicitud de insumos".
 *   SupplyRow    insumo del catálogo con botón Agregar
 *   RequestItem  insumo ya en el carrito (cantidad y quitar)
 * Separado de pages/Usuario/SolicitudInsumo.jsx para que la pantalla sea más fácil de mantener.
 */
import { useState, useEffect, useRef } from "react";
import { Plus, Minus, Trash2, Package, Tag } from "lucide-react";

export function SupplyRow({ supply, isAdded, onAdd, animatingId, T, onDetail }) {
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
          <span className="text-[9px] font-mono select-all" style={{ color: T.textFaint }}>
            #{String(supply.id_insumo).padStart(4, "0")}
          </span>
          <button
            onClick={() => onDetail(supply)}
            className="text-[10px] font-semibold leading-tight text-left hover:underline"
            style={{ color: T.text, background: "none", border: "none", padding: 0, cursor: "pointer" }}
          >
            {supply.nombre}
          </button>
          {(supply.marca || supply.modelo) && (
            <span className="text-[9px]" style={{ color: T.textFaint }}>
              {[supply.marca, supply.modelo].filter(Boolean).join(" · ")}
            </span>
          )}
        </div>
      </td>

      <td className="px-3 py-1.5 pr-col-categoria">
        {supply.nombre_categoria ? (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-semibold"
            style={{ background: T.surfaceAlt, color: T.textMuted, border: `1px solid ${T.border}` }}>
            <Tag size={8} />
            {supply.nombre_categoria}
          </span>
        ) : (
          <span className="text-[9px]" style={{ color: T.textFaint }}>—</span>
        )}
      </td>

      <td className="px-3 py-1.5">
        {isAdded ? (
          <button onClick={() => onAdd(supply.id_insumo)}
            className="px-2.5 py-1 rounded text-[9px] font-bold transition-colors"
            style={{ background: T.isDark ? "rgba(37,99,235,0.15)" : "#eff6ff", color: "#3b82f6", border: "1px solid rgba(59,130,246,0.3)" }}>
            + Agregar otro
          </button>
        ) : (
          <button onClick={() => onAdd(supply.id_insumo)}
            className={`px-2.5 py-1 rounded text-[9px] font-bold transition-all active:scale-95 ${isAnimating ? "animate-slide-out" : ""}`}
            style={{ background: "#2563eb", color: "#fff", border: "none" }}>
            <span className="flex items-center gap-1"><Plus size={11} /> Agregar</span>
          </button>
        )}
      </td>
    </tr>
  );
}

export function RequestItem({ supply, quantity, onRemove, onChangeQty, esUltimo = false, T }) {
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
        <p className="text-[10px] font-semibold truncate leading-tight" style={{ color: T.text }}>{supply.nombre}</p>
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
          className="text-[10px] font-black text-center rounded outline-none"
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
