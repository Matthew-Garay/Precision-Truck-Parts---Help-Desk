/**
 * ControlesSolicitud.jsx — Foto del insumo (o icono) y selector de sucursal usados en la vista
 * de una solicitud. Separado de pages/Usuario/VistaSolicitud.jsx.
 */
import { useState } from "react";
import { Package } from "lucide-react";

export function ImgOrIcon({ src, alt, orange, isDark, onClick }) {
  const [err, setErr] = useState(false);
  return (
    <button
      onClick={onClick}
      title="Ver detalle"
      style={{
        width: "40px", height: "40px", borderRadius: "8px", flexShrink: 0,
        overflow: "hidden", cursor: "pointer", padding: 0, border: "none",
        background: isDark ? "rgba(255,255,255,0.05)" : "#f1f5f9",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}
    >
      {src && !err
        ? <img src={src} alt={alt} onError={() => setErr(true)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        : <Package size={18} style={{ color: orange, opacity: 0.6 }} />}
    </button>
  );
}

// Selector de sucursal para la ruta del material (origen / destino).
// El catalogo trae TODAS las sucursales (incluidos los CEDIS); se separa en
// dos grupos para que el admin ubique rapido el origen/destino del material.
const RE_CEDIS = /CEDIS/i;

export function SelectSucursal({ value, onChange, sucursales, T, isDark }) {
  const cedis = sucursales.filter(s => RE_CEDIS.test(s.nombre_sucursal));
  const otras = sucursales.filter(s => !RE_CEDIS.test(s.nombre_sucursal));
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className="w-full text-[11px] font-semibold rounded-xl px-2.5 py-2 outline-none"
      style={{
        background: isDark ? "rgba(255,255,255,0.06)" : (T?.surfaceAlt ?? "#fff"),
        color: T?.text, border: `1px solid ${T?.border}`,
      }}>
      <option value="">— Selecciona —</option>
      {cedis.length > 0 && (
        <optgroup key="g-cedis" label={`CEDIS (${cedis.length})`}>
          {cedis.map(s => (
            <option key={`c${s.id_sucursal}`} value={s.id_sucursal}>{s.nombre_sucursal}</option>
          ))}
        </optgroup>
      )}
      {otras.length > 0 && (
        <optgroup key="g-suc" label={`SUCURSALES (${otras.length})`}>
          {otras.map(s => (
            <option key={`s${s.id_sucursal}`} value={s.id_sucursal}>{s.nombre_sucursal}</option>
          ))}
        </optgroup>
      )}
    </select>
  );
}
