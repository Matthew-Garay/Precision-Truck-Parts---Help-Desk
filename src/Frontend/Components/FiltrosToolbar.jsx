/**
 * FiltrosToolbar.jsx
 *
 * Barra horizontal de filtros reutilizable para todas las vistas de tabla
 * del sistema. Soporta campos de busqueda por texto y campos de seleccion.
 *
 * Comportamiento:
 *   - Muestra los campos de filtro en fila con etiquetas en mayusculas.
 *   - Los campos activos (con valor distinto de vacio o "Todos") se resaltan
 *     en naranja corporativo para indicar que hay un filtro aplicado.
 *   - Debajo de los campos muestra tags naranja con los filtros activos.
 *     Cada tag tiene un boton X para eliminar ese filtro individualmente.
 *   - El boton "Limpiar filtros" solo aparece cuando hay al menos un filtro activo.
 *   - El slot children permite agregar botones extra al lado derecho de la barra
 *     (por ejemplo el boton "Generar Reporte").
 *
 * Sub-componentes internos:
 *   SearchField  - input de texto con icono de lupa y boton X para limpiar
 *   SelectField  - select nativo con icono de chevron y resaltado cuando tiene valor
 *   FilterTag    - etiqueta naranja de filtro activo con boton para eliminar
 *
 * Props:
 *   campos    - arreglo de definiciones de campo:
 *               { key, label, type: "search" | "select", opts?, placeholder? }
 *               opts puede ser string[] o { value, label }[]
 *   valores   - objeto { [key]: string } con los valores actuales de cada campo
 *   onChange  - funcion(key, value) llamada cuando cambia un campo
 *   onLimpiar - funcion() llamada al hacer clic en "Limpiar filtros"
 *   T         - tokens del tema activo
 *   children  - slot derecho para botones adicionales
 */
import { useRef } from "react";
import { Search, X, SlidersHorizontal, ChevronDown } from "lucide-react";



// ── helpers ──────────────────────────────────────────────────
function getLabel(campo, valor) {
  if (!valor || valor === "Todos" || valor === "") return null;
  if (campo.type === "search") return `"${valor}"`;
  const opt = campo.opts?.find(o =>
    typeof o === "string" ? o === valor : o.value === valor
  );
  return typeof opt === "string" ? opt : (opt?.label ?? valor);
}

function isActive(campo, valor) {
  return !!valor && valor !== "Todos" && valor !== "";
}

// ── SearchField ───────────────────────────────────────────────
function SearchField({ campo, valor, onChange, T }) {
  const isDark = T.isDark;
  const activo = !!valor;
  const ref = useRef(null);

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:"2px", minWidth:"130px", flex:"1 1 130px", maxWidth:"200px" }}>
      <label style={{ fontSize:"9px", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.07em", color: activo ? T.orange : T.textMuted }}>
        {campo.label}
      </label>
      <div style={{ position:"relative" }}>
        <Search size={10} style={{ position:"absolute", left:"6px", top:"50%", transform:"translateY(-50%)", color: activo ? T.orange : T.textFaint, pointerEvents:"none" }} />
        <input
          ref={ref}
          type="text"
          value={valor || ""}
          onChange={e => onChange(campo.key, e.target.value)}
          placeholder={campo.placeholder || "Buscar..."}
          style={{
            width:"100%", paddingLeft:"22px", paddingRight: valor ? "20px" : "6px",
            paddingTop:"3px", paddingBottom:"3px",
            fontSize:"11px", fontWeight:400,
            background: isDark ? "rgba(255,255,255,0.04)" : "#F9FAFB",
            border:`1px solid ${activo ? T.orange : (isDark ? "rgba(255,255,255,0.12)" : "#D1D5DB")}`,
            borderRadius:"4px", color:T.text, outline:"none",
            transition:"border-color 0.15s",
          }}
          onFocus={e => { e.target.style.borderColor = T.orange; }}
          onBlur={e  => { if (!valor) e.target.style.borderColor = isDark ? "rgba(255,255,255,0.12)" : "#D1D5DB"; }}
        />
        {valor && (
          <button onClick={() => { onChange(campo.key, ""); ref.current?.focus(); }}
            style={{ position:"absolute", right:"5px", top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", padding:0, display:"flex", alignItems:"center" }}>
            <X size={9} style={{ color:T.textMuted }} />
          </button>
        )}
      </div>
    </div>
  );
}

// ── SelectField ───────────────────────────────────────────────
function SelectField({ campo, valor, onChange, T }) {
  const isDark = T.isDark;
  const activo = isActive(campo, valor);

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:"2px", minWidth:"90px", flexShrink:0 }}>
      <label style={{ fontSize:"9px", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.07em", color: activo ? T.orange : T.textMuted }}>
        {campo.label}
      </label>
      <div style={{ position:"relative" }}>
        <select
          value={valor || "Todos"}
          onChange={e => onChange(campo.key, e.target.value)}
          style={{
            appearance:"none", WebkitAppearance:"none",
            width:"100%", paddingLeft:"6px", paddingRight:"18px",
            paddingTop:"3px", paddingBottom:"3px",
            fontSize:"11px", fontWeight: activo ? 600 : 400,
            background: activo
              ? (isDark ? "rgba(244,121,32,0.10)" : "rgba(244,121,32,0.06)")
              : (isDark ? "rgba(255,255,255,0.04)" : "#F9FAFB"),
            border:`1px solid ${activo ? T.orange : (isDark ? "rgba(255,255,255,0.12)" : "#D1D5DB")}`,
            borderRadius:"4px", color: activo ? T.orange : T.text,
            outline:"none", cursor:"pointer",
            colorScheme: isDark ? "dark" : "light",
            transition:"border-color 0.15s, background 0.15s",
          }}>
          {(campo.opts || []).map(o => {
            const v = typeof o === "string" ? o : o.value;
            const l = typeof o === "string" ? o : o.label;
            return <option key={v} value={v}>{l}</option>;
          })}
        </select>
        <ChevronDown size={9} style={{ position:"absolute", right:"5px", top:"50%", transform:"translateY(-50%)", color: activo ? T.orange : T.textFaint, pointerEvents:"none" }} />
      </div>
    </div>
  );
}

// ── FilterTag ─────────────────────────────────────────────────
function FilterTag({ campo, valor, onRemove, T }) {
  const isDark = T.isDark;
  const etiqueta = getLabel(campo, valor);
  if (!etiqueta) return null;
  return (
    <span style={{
      display:"inline-flex", alignItems:"center", gap:"4px",
      padding:"1px 6px 1px 7px", borderRadius:"4px",
      fontSize:"10px", fontWeight:600, whiteSpace:"nowrap",
      background: isDark ? "rgba(244,121,32,0.12)" : "rgba(244,121,32,0.08)",
      border:`1px solid ${isDark ? "rgba(244,121,32,0.3)" : "rgba(244,121,32,0.22)"}`,
      color: T.orange,
    }}>
      <span style={{ color: isDark ? "rgba(255,255,255,0.4)" : "#6B7280", fontWeight:500 }}>{campo.label}:</span>
      {etiqueta}
      <button onClick={() => onRemove(campo.key)}
        style={{ background:"none", border:"none", cursor:"pointer", padding:0, display:"flex", alignItems:"center", marginLeft:"1px" }}>
        <X size={10} strokeWidth={2.5} style={{ color:T.orange }} />
      </button>
    </span>
  );
}

// ── Componente principal ──────────────────────────────────────
export default function FiltrosToolbar({ campos = [], valores = {}, onChange, onLimpiar, T, children }) {
  const isDark = T.isDark;

  const camposActivos = campos.filter(c => isActive(c, valores[c.key]));
  const hayFiltros    = camposActivos.length > 0;

  const handleRemove = (key) => {
    const campo = campos.find(c => c.key === key);
    onChange(key, campo?.type === "search" ? "" : "Todos");
  };

  return (
    <div style={{
      background: isDark ? "rgba(255,255,255,0.02)" : "#F9FAFB",
      border:`1px solid ${isDark ? "rgba(255,255,255,0.07)" : "#E5E7EB"}`,
      borderRadius:"6px", overflow:"hidden",
    }}>

      {/* ── Fila de controles ── */}
      <div style={{
        display:"flex", flexWrap:"wrap", alignItems:"flex-end", gap:"8px",
        padding:"7px 10px",
        borderBottom: hayFiltros ? `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "#E5E7EB"}` : "none",
      }}>

        {/* Icono + label */}
        <div style={{ display:"flex", alignItems:"center", gap:"4px", flexShrink:0, alignSelf:"flex-end", paddingBottom:"5px" }}>
          <SlidersHorizontal size={11} style={{ color:T.orange }} />
          <span style={{ fontSize:"9px", fontWeight:800, textTransform:"uppercase", letterSpacing:"0.1em", color:T.textMuted }}>
            Filtros
          </span>
        </div>

        {/* Divisor */}
        <div style={{ width:"1px", height:"24px", background: isDark ? "rgba(255,255,255,0.07)" : "#E5E7EB", flexShrink:0, alignSelf:"flex-end", marginBottom:"2px" }} />

        {/* Campos */}
        {campos.map(campo =>
          campo.type === "search"
            ? <SearchField key={campo.key} campo={campo} valor={valores[campo.key] || ""} onChange={onChange} T={T} />
            : <SelectField key={campo.key} campo={campo} valor={valores[campo.key] || "Todos"} onChange={onChange} T={T} />
        )}

        {/* Spacer */}
        <div style={{ flex:1, minWidth:"8px" }} />

        {/* Acciones */}
        <div style={{ display:"flex", alignItems:"flex-end", gap:"8px", flexShrink:0, paddingBottom:"1px" }}>

          {hayFiltros && (
            <button onClick={onLimpiar}
              style={{
                background:"none", border:"none", cursor:"pointer",
                fontSize:"11px", fontWeight:600, color:T.textMuted,
                padding:"3px 2px", textDecoration:"underline", textUnderlineOffset:"2px",
                whiteSpace:"nowrap", transition:"color 0.15s",
              }}
              onMouseEnter={e => e.currentTarget.style.color = "#DC2626"}
              onMouseLeave={e => e.currentTarget.style.color = T.textMuted}>
              Limpiar filtros
            </button>
          )}

          {/* Slot para botones extra */}
          {children}
        </div>
      </div>

      {/* ── Tags de filtros activos ── */}
      {hayFiltros && (
        <div style={{
          display:"flex", flexWrap:"wrap", alignItems:"center", gap:"4px",
          padding:"4px 10px",
          background: isDark ? "rgba(244,121,32,0.04)" : "rgba(244,121,32,0.03)",
        }}>
          <span style={{ fontSize:"10px", fontWeight:700, color:T.textFaint, textTransform:"uppercase", letterSpacing:"0.07em", flexShrink:0 }}>
            Activos:
          </span>
          {camposActivos.map(campo => (
            <FilterTag key={campo.key} campo={campo} valor={valores[campo.key]} onRemove={handleRemove} T={T} />
          ))}
        </div>
      )}
    </div>
  );
}
