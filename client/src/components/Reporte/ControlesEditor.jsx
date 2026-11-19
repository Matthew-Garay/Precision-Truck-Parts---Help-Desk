/**
 * ControlesEditor.jsx — Piezas pequeñas del formulario "Nuevo reporte": botones de la barra del
 * editor, separador, icono de prioridad y globo de ayuda. Separado de pages/Usuario/NuevoReporte.jsx.
 */
import { useState } from "react";

export function AyudaTooltip({ texto, isDark, children }) {
  const [visible, setVisible] = useState(false);
  return (
    <span className="relative inline-flex items-center"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      style={{ cursor: "default" }}>
      {children}
      {visible && (
        <span
          className="absolute z-50 bottom-full left-0 mb-2 w-56 text-[10px] leading-relaxed rounded-xl px-3 py-2 shadow-xl pointer-events-none"
          style={{ background: isDark ? "#1e2330" : "#1e293b", color: "#f1f5f9", border: "1px solid rgba(255,255,255,0.1)", whiteSpace: "normal" }}>
          {texto}
          <span className="absolute top-full left-4 border-4 border-transparent" style={{ borderTopColor: isDark ? "#1e2330" : "#1e293b" }} />
        </span>
      )}
    </span>
  );
}

export function ToolBtn({ children, onClick, title, isDark, T }) {
  return (
    <button type="button" title={title}
      onMouseDown={e => { e.preventDefault(); onClick(); }}
      className="flex items-center justify-center w-7 h-7 rounded-lg transition-all hover:brightness-110 active:scale-95"
      style={{ color: isDark ? "rgba(255,255,255,0.6)" : T.textMuted, background:"transparent" }}
      onMouseEnter={e => { e.currentTarget.style.background = isDark ? "rgba(255,255,255,0.08)" : T.border; e.currentTarget.style.color = isDark ? "#fff" : T.text; }}
      onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = isDark ? "rgba(255,255,255,0.6)" : T.textMuted; }}>
      {children}
    </button>
  );
}

export function Divider({ dividerLine }) {
  return <div className="w-px h-4 mx-0.5" style={{ background: dividerLine }}/>;
}

export function PRIORIDAD_ICON({ nivel, color }) {
  const s = { stroke: color, strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" };
  if (nivel === "Urgente") return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
      <path d="M12 2L12 14" {...s}/>
      <circle cx="12" cy="19" r="1.5" fill={color} stroke="none"/>
      <path d="M5 5l14 14M19 5L5 19" stroke={color} strokeWidth="1.5" strokeLinecap="round" opacity="0.35"/>
    </svg>
  );
  if (nivel === "Alta") return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
      <path d="M12 19V5M6 11l6-6 6 6" {...s}/>
    </svg>
  );
  if (nivel === "Media") return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
      <path d="M5 12h14M5 7h14" {...s}/>
    </svg>
  );
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
      <path d="M12 5v14M18 13l-6 6-6-6" {...s}/>
    </svg>
  );
}
