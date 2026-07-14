/**
 * FiltrosToolbar.jsx
 *
 * Barra de filtros corporativa reutilizable — Precision Truck Parts HelpDesk.
 * Tokens visuales tomados de DesignSystem.js para consistencia total.
 *
 * Tipos de campo soportados:
 *   "search"   — input de texto con debounce configurable
 *   "select"   — dropdown nativo
 *   "date"     — input de fecha
 *   "checkbox" — toggle booleano inline
 *
 * Props:
 *   campos    {Array}    Definiciones de campo:
 *               { key, label, type, opts?, placeholder?, debounce? }
 *               opts: string[] | { value, label }[]
 *               debounce: ms (solo type="search", default 0 = inmediato)
 *   valores   {Object}   { [key]: string | boolean }
 *   onChange  {Function} (key, value) => void
 *   onLimpiar {Function} () => void
 *   loading   {boolean}  Muestra spinner en la barra (llamada API en curso)
 *   disabled  {boolean}  Deshabilita todos los controles
 *   T         {Object}   Tokens del tema activo
 *   children  {ReactNode} Slot derecho para botones adicionales
 */
import { useRef, useEffect, useState, useCallback } from "react";
import { Search, X, SlidersHorizontal, ChevronDown } from "lucide-react";
import { RADIUS, SLATE } from "../Config/DesignSystem";

// ── Tokens internos ───────────────────────────────────────────────
const R = RADIUS.sm; // "4px"

function borderColor(activo, isDark, orange) {
  if (activo) return orange;
  return isDark ? "rgba(255,255,255,0.12)" : SLATE[300];
}

function inputBg(activo, isDark, orange) {
  if (activo) return isDark ? `rgba(244,121,32,0.10)` : "rgba(244,121,32,0.06)";
  return isDark ? "rgba(255,255,255,0.04)" : "#F9FAFB";
}

const BASE_INPUT = {
  paddingTop: "2px", paddingBottom: "2px",
  fontSize: "10px", borderRadius: R, outline: "none",
  transition: "border-color 0.15s, box-shadow 0.15s, background 0.15s",
};

const LABEL_ST = (activo, orange, textMuted) => ({
  fontSize: "8px", fontWeight: 700, textTransform: "uppercase",
  letterSpacing: "0.07em",
  color: activo ? orange : textMuted,
});

// ── helpers ───────────────────────────────────────────────────────
function getLabel(campo, valor) {
  if (campo.type === "checkbox") return valor ? campo.label : null;
  if (!valor || valor === "Todos" || valor === "") return null;
  if (campo.type === "search" || campo.type === "date") return `"${valor}"`;
  const opt = campo.opts?.find(o =>
    typeof o === "string" ? o === valor : o.value === valor
  );
  return typeof opt === "string" ? opt : (opt?.label ?? valor);
}

function isActive(campo, valor) {
  if (campo.type === "checkbox") return !!valor;
  return !!valor && valor !== "Todos" && valor !== "";
}

// ── SearchField ───────────────────────────────────────────────────
function SearchField({ campo, valor, onChange, disabled, T }) {
  const { isDark, orange, text, textMuted, textFaint } = T;
  const debounceMs = campo.debounce ?? 0;
  // Estado local para debounce: el input es siempre controlado
  const [localVal, setLocalVal] = useState(valor || "");
  const timerRef = useRef(null);

  // Sincroniza si el padre limpia el valor externamente
  useEffect(() => { setLocalVal(valor || ""); }, [valor]);
  useEffect(() => () => clearTimeout(timerRef.current), []);

  const activo = !!localVal;

  const handleChange = useCallback((e) => {
    const v = e.target.value;
    setLocalVal(v);
    if (debounceMs > 0) {
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => onChange(campo.key, v), debounceMs);
    } else {
      onChange(campo.key, v);
    }
  }, [campo.key, debounceMs, onChange]);

  const handleClear = () => {
    setLocalVal("");
    clearTimeout(timerRef.current);
    onChange(campo.key, "");
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1px", minWidth: "110px", flex: "1 1 110px", maxWidth: "170px" }}>
      <label style={LABEL_ST(activo, orange, textMuted)}>{campo.label}</label>
      <div style={{ position: "relative" }}>
        <Search size={9} style={{ position: "absolute", left: "5px", top: "50%", transform: "translateY(-50%)", color: activo ? orange : textFaint, pointerEvents: "none" }} />
        <input
          type="text"
          value={localVal}
          onChange={handleChange}
          placeholder={campo.placeholder || "Buscar..."}
          disabled={disabled}
          style={{
            ...BASE_INPUT,
            width: "100%", paddingLeft: "18px", paddingRight: activo ? "18px" : "5px",
            background: inputBg(activo, isDark, orange),
            border: `1px solid ${borderColor(activo, isDark, orange)}`,
            color: text,
            opacity: disabled ? 0.5 : 1,
            cursor: disabled ? "not-allowed" : "text",
          }}
          onFocus={e => { if (!disabled) { e.target.style.borderColor = orange; e.target.style.boxShadow = `0 0 0 2px ${orange}33`; } }}
          onBlur={e => { e.target.style.boxShadow = "none"; if (!localVal) e.target.style.borderColor = borderColor(false, isDark, orange); }}
        />
        {activo && !disabled && (
          <button
            onClick={handleClear}
            style={{ position: "absolute", right: "5px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex", alignItems: "center" }}
          >
            <X size={9} style={{ color: textMuted }} />
          </button>
        )}
      </div>
    </div>
  );
}

// ── SelectField ───────────────────────────────────────────────────
function SelectField({ campo, valor, onChange, disabled, T }) {
  const { isDark, orange, text, textMuted, textFaint } = T;
  // Normaliza: si el primer opt usa value:"", el valor vacío es el "Todos" de ese campo
  const firstOptVal = campo.opts?.length
    ? (typeof campo.opts[0] === "string" ? campo.opts[0] : campo.opts[0].value)
    : "Todos";
  const currentVal = valor ?? firstOptVal;
  const activo = isActive(campo, currentVal);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1px", minWidth: "75px", flexShrink: 0 }}>
      <label style={LABEL_ST(activo, orange, textMuted)}>{campo.label}</label>
      <div style={{ position: "relative" }}>
        <select
          value={currentVal}
          onChange={e => onChange(campo.key, e.target.value)}
          disabled={disabled}
          style={{
            ...BASE_INPUT,
            appearance: "none", WebkitAppearance: "none",
            width: "100%", paddingLeft: "5px", paddingRight: "15px",
            fontWeight: activo ? 600 : 400,
            background: inputBg(activo, isDark, orange),
            border: `1px solid ${borderColor(activo, isDark, orange)}`,
            color: activo ? orange : text,
            colorScheme: isDark ? "dark" : "light",
            cursor: disabled ? "not-allowed" : "pointer",
            opacity: disabled ? 0.5 : 1,
          }}
          onFocus={e => { if (!disabled) { e.target.style.borderColor = orange; e.target.style.boxShadow = `0 0 0 2px ${orange}33`; } }}
          onBlur={e => { e.target.style.boxShadow = "none"; if (!activo) e.target.style.borderColor = borderColor(false, isDark, orange); }}
        >
          {(campo.opts || []).map(o => {
            const v = typeof o === "string" ? o : o.value;
            const l = typeof o === "string" ? o : o.label;
            return <option key={v} value={v}>{l}</option>;
          })}
        </select>
        <ChevronDown size={9} style={{ position: "absolute", right: "5px", top: "50%", transform: "translateY(-50%)", color: activo ? orange : textFaint, pointerEvents: "none" }} />
      </div>
    </div>
  );
}

// ── DateField ─────────────────────────────────────────────────────
function DateField({ campo, valor, onChange, disabled, T }) {
  const { isDark, orange, text, textMuted } = T;
  const activo = !!valor;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1px", minWidth: "95px", flexShrink: 0 }}>
      <label style={LABEL_ST(activo, orange, textMuted)}>{campo.label}</label>
      <input
        type="date"
        value={valor || ""}
        onChange={e => onChange(campo.key, e.target.value)}
        disabled={disabled}
        style={{
          ...BASE_INPUT,
          paddingLeft: "5px", paddingRight: "5px",
          fontWeight: activo ? 600 : 400,
          background: inputBg(activo, isDark, orange),
          border: `1px solid ${borderColor(activo, isDark, orange)}`,
          color: activo ? orange : text,
          colorScheme: isDark ? "dark" : "light",
          cursor: disabled ? "not-allowed" : "pointer",
          opacity: disabled ? 0.5 : 1,
        }}
        onFocus={e => { if (!disabled) { e.target.style.borderColor = orange; e.target.style.boxShadow = `0 0 0 2px ${orange}33`; } }}
        onBlur={e => { e.target.style.boxShadow = "none"; if (!activo) e.target.style.borderColor = borderColor(false, isDark, orange); }}
      />
    </div>
  );
}

// ── CheckboxField ─────────────────────────────────────────────────
function CheckboxField({ campo, valor, onChange, disabled, T }) {
  const { isDark, orange, text, textMuted } = T;
  const activo = !!valor;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2px", flexShrink: 0 }}>
      {/* Spacer para alinear con otros campos que tienen label arriba */}
      <span style={{ fontSize: "9px", visibility: "hidden", userSelect: "none" }}>_</span>
      <label style={{
        display: "flex", alignItems: "center", gap: "5px",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1,
        paddingTop: "3px", paddingBottom: "3px",
        userSelect: "none",
      }}>
        <span style={{
          width: "14px", height: "14px", borderRadius: "3px", flexShrink: 0,
          border: `1.5px solid ${activo ? orange : (isDark ? "rgba(255,255,255,0.20)" : SLATE[300])}`,
          background: activo ? orange : "transparent",
          display: "flex", alignItems: "center", justifyContent: "center",
          transition: "background 0.15s, border-color 0.15s",
        }}>
          {activo && (
            <svg width="8" height="8" viewBox="0 0 10 10" fill="none">
              <polyline points="1.5,5 4,7.5 8.5,2.5" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </span>
        <input
          type="checkbox"
          checked={!!valor}
          onChange={e => !disabled && onChange(campo.key, e.target.checked)}
          disabled={disabled}
          style={{ position: "absolute", opacity: 0, width: 0, height: 0 }}
        />
        <span style={{ fontSize: "10px", fontWeight: activo ? 600 : 400, color: activo ? orange : text }}>
          {campo.label}
        </span>
      </label>
    </div>
  );
}

// ── FilterTag ─────────────────────────────────────────────────────
function FilterTag({ campo, valor, onRemove, T }) {
  const { isDark, orange } = T;
  const etiqueta = getLabel(campo, valor);
  if (!etiqueta) return null;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: "4px",
      padding: "1px 6px 1px 7px", borderRadius: R,
      fontSize: "10px", fontWeight: 600, whiteSpace: "nowrap",
      background: isDark ? "rgba(244,121,32,0.12)" : "rgba(244,121,32,0.08)",
      border: `1px solid ${isDark ? "rgba(244,121,32,0.3)" : "rgba(244,121,32,0.22)"}`,
      color: orange,
    }}>
      <span style={{ color: isDark ? "rgba(255,255,255,0.4)" : "#6B7280", fontWeight: 500 }}>{campo.label}:</span>
      {etiqueta}
      <button
        onClick={() => onRemove(campo.key)}
        style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex", alignItems: "center", marginLeft: "1px" }}
      >
        <X size={10} strokeWidth={2.5} style={{ color: orange }} />
      </button>
    </span>
  );
}

// ── Spinner ───────────────────────────────────────────────────────
function Spinner({ color }) {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5"
      style={{ animation: "ftb-spin 0.8s linear infinite", flexShrink: 0 }}>
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
      <style>{`@keyframes ftb-spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </svg>
  );
}

// ── Componente principal ──────────────────────────────────────────
export default function FiltrosToolbar({
  campos = [],
  valores = {},
  onChange,
  onLimpiar,
  loading = false,
  disabled = false,
  T,
  children,
}) {
  const { isDark, orange, textMuted, textFaint } = T;

  const camposActivos = campos.filter(c => isActive(c, valores[c.key]));
  const hayFiltros    = camposActivos.length > 0;

  const handleRemove = (key) => {
    const campo = campos.find(c => c.key === key);
    if (!campo) return;
    if (campo.type === "checkbox") onChange(key, false);
    else if (campo.type === "search" || campo.type === "date") onChange(key, "");
    else onChange(key, "Todos");
  };

  const renderField = (campo) => {
    const props = { key: campo.key, campo, valor: valores[campo.key], onChange, disabled: disabled || loading, T };
    switch (campo.type) {
      case "search":   return <SearchField   {...props} />;
      case "date":     return <DateField     {...props} />;
      case "checkbox": return <CheckboxField {...props} />;
      default:         return <SelectField   {...props} />;
    }
  };

  return (
    <div style={{
      background: isDark ? "rgba(255,255,255,0.02)" : "#F9FAFB",
      border: `1px solid ${isDark ? "rgba(255,255,255,0.07)" : "#E5E7EB"}`,
      borderRadius: "6px", overflow: "hidden",
      opacity: disabled ? 0.7 : 1,
      transition: "opacity 0.15s",
    }}>

      {/* ── Fila de controles ── */}
      <div style={{
        display: "flex", flexWrap: "wrap", alignItems: "flex-end", gap: "6px",
        padding: "5px 8px",
        borderBottom: hayFiltros ? `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "#E5E7EB"}` : "none",
      }}>

        {/* Icono + label */}
        <div style={{ display: "flex", alignItems: "center", gap: "3px", flexShrink: 0, alignSelf: "flex-end", paddingBottom: "3px" }}>
          <SlidersHorizontal size={10} style={{ color: orange }} />
          <span style={{ fontSize: "8px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", color: textMuted }}>
            Filtros
          </span>
        </div>

        {/* Divisor */}
        <div style={{ width: "1px", height: "24px", background: isDark ? "rgba(255,255,255,0.07)" : "#E5E7EB", flexShrink: 0, alignSelf: "flex-end", marginBottom: "2px" }} />

        {/* Campos */}
        {campos.map(renderField)}

        {/* Spacer */}
        <div style={{ flex: 1, minWidth: "8px" }} />

        {/* Acciones */}
        <div style={{ display: "flex", alignItems: "flex-end", gap: "8px", flexShrink: 0, paddingBottom: "1px", marginLeft: "auto" }}>

          {/* Spinner de carga */}
          {loading && <Spinner color={orange} />}

          {hayFiltros && !disabled && (
            <button
              onClick={onLimpiar}
              style={{
                background: "none", border: "none", cursor: "pointer",
                fontSize: "10px", fontWeight: 600, color: textMuted,
                padding: "2px 2px", textDecoration: "underline", textUnderlineOffset: "2px",
                whiteSpace: "nowrap", transition: "color 0.15s",
              }}
              onMouseEnter={e => e.currentTarget.style.color = "#DC2626"}
              onMouseLeave={e => e.currentTarget.style.color = textMuted}
            >
              Limpiar filtros
            </button>
          )}

          {/* Slot para botones extra */}
          {children}
        </div>
      </div>

      {/* ── Tags de filtros activos ── */}
    </div>
  );
}
