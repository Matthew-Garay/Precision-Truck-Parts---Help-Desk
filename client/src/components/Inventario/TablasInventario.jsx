/**
 * TablasInventario.jsx
 *
 * Átomos y tablas del Inventario: chips, botones de icono, tarjetas KPI,
 * tabla de insumos y tabla de entradas/salidas.
 *
 * Extraído de pages/Admin/Inventario.jsx para facilitar su mantenimiento.
 */
import { useState } from "react";
import { Package, Eye, Pencil, ArrowDownToLine, ArrowUpFromLine, History, MoreVertical } from "lucide-react";
import { useTheme } from '../../context/theme-context.js';
import { FS } from '../../utils/tipografia.js';
import { colorStock } from '../../utils/stock.js';
import { ORANGE, TEAL } from './inventario-ui.js';
import { fechaCorta, fechaHora } from '../../utils/fechas.js';

export const SLATE   = { 50: "#f8fafc", 100: "#f1f5f9", 200: "#e2e8f0", 300: "#cbd5e1", 400: "#94a3b8", 600: "#475569", 700: "#334155", 900: "#0f172a" };


export const ESTADO_META = {
  Excelente: { color: "#16a34a" },
  Bueno:     { color: "#2563eb" },
  Regular:   { color: "#d97706" },
  Malo:      { color: "#dc2626" },
  Dañado:    { color: "#7f1d1d" },
};


export const CAT_PALETTES = [
  { color: "#7c3aed", bg: "#f5f3ff", border: "#ddd6fe" },
  { color: "#0891b2", bg: "#ecfeff", border: "#a5f3fc" },
  { color: "#0d9488", bg: "#f0fdfa", border: "#99f6e4" },
  { color: "#d97706", bg: "#fffbeb", border: "#fde68a" },
  { color: "#db2777", bg: "#fdf2f8", border: "#fbcfe8" },
  { color: "#059669", bg: "#ecfdf5", border: "#a7f3d0" },
  { color: "#4f46e5", bg: "#eef2ff", border: "#c7d2fe" },
  { color: "#b45309", bg: "#fefce8", border: "#fef08a" },
];

export const catColor = (name = "") => {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xffff;
  return CAT_PALETTES[h % CAT_PALETTES.length];
};


// ── Átomos ────────────────────────────────────────────────────────
export function ChipEstado({ estado, T }) {
  const s = ESTADO_META[estado] ?? { color: "#94a3b8" };
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: "5px", fontSize: FS.secundario, fontWeight: 600, color: s.color }}>
      <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: s.color, flexShrink: 0 }} />
      {estado || "—"}
    </span>
  );
}


export function ChipCategoria({ nombre, T }) {
  const s = catColor(nombre);
  return (
    <span style={{
      display: "inline-block",
      fontSize: FS.etiqueta, fontWeight: 600,
      color: s.color,
      background: `${s.color}14`,
      border: `1px solid ${s.color}30`,
      borderRadius: "4px",
      padding: "2px 7px",
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis",
      maxWidth: "100%",
    }}>
      {nombre || "Sin categoría"}
    </span>
  );
}


export function IconBtn({ onClick, title, children, hoverColor = "#2563eb", hoverBg = "#eff6ff" }) {
  const [h, setH] = useState(false);
  const { T } = useTheme();
  return (
    <button
      onClick={onClick} title={title} aria-label={title}
      onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{
        width: "34px", height: "30px", borderRadius: "6px", border: `1px solid ${h ? "transparent" : T.border}`,
        background: h ? hoverBg : "transparent",
        color: h ? hoverColor : T.textFaint,
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        cursor: "pointer", transition: "all 0.12s", flexShrink: 0, padding: 0,
      }}
    >
      {children}
    </button>
  );
}


// ── KPI Card ─────────────────────────────────────────────────────
export function KpiCard({ label, value, sub, icon: Icon, color, highlight = false, pct }) {
  const { T } = useTheme();
  return (
    <div style={{
      background: T.surface, borderRadius: "6px",
      border: `1px solid ${highlight ? `${color}50` : T.border}`,
      boxShadow: highlight ? `0 0 0 1px ${color}18, ${T.shadowSm}` : T.shadowSm,
      overflow: "hidden", display: "flex", flexDirection: "column",
      transition: "box-shadow 0.2s",
    }}>
      <div style={{ height: "2px", background: `linear-gradient(90deg, ${color}, ${color}88)` }} />
      <div style={{ padding: "7px 10px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "6px" }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: 0, fontSize: FS.etiqueta, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: T.textFaint }}>
            {label}
          </p>
          <p style={{ margin: "2px 0 0", fontSize: FS.subtitulo, fontWeight: 900, lineHeight: 1, color: highlight ? color : T.text, fontVariantNumeric: "tabular-nums" }}>
            {value}
          </p>
          {sub && (
            <p style={{ margin: "2px 0 0", fontSize: FS.etiqueta, color: T.textFaint, fontWeight: 500, lineHeight: 1.3 }}>{sub}</p>
          )}
          {pct !== undefined && (
            <div style={{ marginTop: "4px", height: "2px", borderRadius: "99px", background: T.border, overflow: "hidden" }}>
              <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: "99px", transition: "width 0.6s ease" }} />
            </div>
          )}
        </div>
        <div style={{
          width: "26px", height: "26px", borderRadius: "6px", flexShrink: 0,
          display: "flex", alignItems: "center", justifyContent: "center",
          background: `${color}15`, border: `1px solid ${color}25`,
        }}>
          <Icon size={12} style={{ color }} />
        </div>
      </div>
    </div>
  );
}


// ── Tabla ────────────────────────────────────────────────────────
export const COLS = ["", "Nombre", "Categoría", "Estado", "Stock", "Acciones"];


export function DataTable({ rows, onDetail, onEditar, onEntrada, onSalida, onHistorial, onGestionar }) {
  const [hoverRow, setHoverRow] = useState(null);
  const { T } = useTheme();

  const th = {
    padding: "6px 10px", fontSize: FS.etiqueta, fontWeight: 700,
    textTransform: "uppercase", letterSpacing: "0.07em",
    color: T.textMuted, background: T.surfaceAlt,
    borderBottom: `2px solid ${T.border}`, textAlign: "left",
    whiteSpace: "nowrap", position: "sticky", top: 0, zIndex: 10,
  };

  return (
    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: FS.cuerpo, tableLayout: "fixed", minWidth: "720px" }}>
      <colgroup>
        <col style={{ width: "40px" }} />
        <col style={{ width: "30%" }} />
        <col style={{ width: "16%" }} />
        <col style={{ width: "10%" }} />
        <col style={{ width: "10%" }} />
        <col style={{ width: "244px" }} />
      </colgroup>
      <thead>
        <tr>{COLS.map((c, i) => <th key={i} style={{ ...th, ...(i === COLS.length - 1 ? { textAlign: "right" } : null) }}>{c}</th>)}</tr>
      </thead>
      <tbody>
        {rows.map((row) => {
          const isHover = hoverRow === row.id_insumo;
          const stockColor = colorStock(row.stock);
          const td = {
            padding: "3px 8px",
            borderBottom: `1px solid ${T.border}`,
            background: isHover ? T.surfaceHover : T.surface,
            transition: "background 0.1s",
            verticalAlign: "middle",
            overflow: "hidden",
          };
          return (
            <tr key={row.id_insumo}
              onMouseEnter={() => setHoverRow(row.id_insumo)}
              onMouseLeave={() => setHoverRow(null)}
            >
              {/* Imagen */}
              <td style={{ ...td, padding: "2px 2px 2px 8px" }}>
                {row.imagen_url
                  ? <img src={row.imagen_url} alt="" style={{ width: "22px", height: "22px", borderRadius: "4px", objectFit: "cover", border: `1px solid ${T.border}`, display: "block" }} />
                  : <div style={{ width: "22px", height: "22px", borderRadius: "4px", background: T.surfaceAlt, border: `1px solid ${T.border}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Package size={10} style={{ color: T.textFaint }} />
                    </div>
                }
              </td>
              {/* Nombre — clic: abre el detalle del insumo */}
              <td style={{ ...td }}>
                <div
                  onClick={() => onDetail?.(row)}
                  title={`Ver detalle de ${row.nombre}`}
                  style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer" }}
                >
                  <div style={{ width: "2px", height: "18px", borderRadius: "2px", background: ESTADO_META[row.estado]?.color ?? SLATE[400], flexShrink: 0 }} />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: FS.cuerpo, fontWeight: 700, color: T.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {row.nombre}
                    </div>
                    {(row.marca || row.modelo) && (
                      <div style={{ fontSize: FS.etiqueta, color: T.textFaint, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {[row.marca, row.modelo].filter(Boolean).join(" · ")}
                      </div>
                    )}
                  </div>
                </div>
              </td>
              {/* Categoría */}
              <td style={{ ...td, overflow: "hidden" }}>
                <ChipCategoria nombre={row.nombre_categoria} T={T} />
              </td>
              {/* Estado */}
              <td style={td}>
                <ChipEstado estado={row.estado} T={T} />
              </td>
              {/* Stock */}
              <td style={{ ...td }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <span style={{ fontSize: FS.cuerpo, fontWeight: 700, color: stockColor, fontFamily: "monospace", minWidth: "20px" }}>
                    {row.stock ?? 0}
                  </span>
                  <div style={{ flex: 1, height: "3px", borderRadius: "99px", background: T.border, overflow: "hidden" }}>
                    <div style={{ width: `${Math.min(100, Math.round(((row.stock ?? 0) / 20) * 100))}%`, height: "100%", background: stockColor, borderRadius: "99px" }} />
                  </div>
                </div>
              </td>
              {/* Acciones */}
              <td style={{ ...td }}>
                <div style={{ display: "flex", gap: "4px", flexWrap: "nowrap", alignItems: "center", justifyContent: "flex-end" }}>
                  <IconBtn onClick={() => onEntrada(row)} title="Registrar entrada de material" hoverColor={TEAL.base} hoverBg={TEAL.light}>
                    <ArrowDownToLine size={13} />
                  </IconBtn>
                  {/* Salida manual: mismo lugar que Entrada, con este insumo precargado */}
                  <IconBtn onClick={() => onSalida?.(row)} title="Registrar salida manual de material" hoverColor={ORANGE.base} hoverBg={ORANGE.light}>
                    <ArrowUpFromLine size={13} />
                  </IconBtn>
                  <IconBtn onClick={() => onDetail(row)} title="Ver detalle" hoverColor="#2563eb" hoverBg="#eff6ff">
                    <Eye size={13} />
                  </IconBtn>
                  <IconBtn onClick={() => onEditar?.(row)} title="Editar insumo" hoverColor="#0d9488" hoverBg="#f0fdfa">
                    <Pencil size={13} />
                  </IconBtn>
                  <IconBtn onClick={() => onHistorial(row)} title="Ver entradas de este insumo" hoverColor="#6366f1" hoverBg="#eef2ff">
                    <History size={13} />
                  </IconBtn>
                  {/* Un solo botón: abrirá el panel para Inhabilitar/Habilitar o Eliminar */}
                  <IconBtn onClick={() => onGestionar?.(row)} title="Inhabilitar o eliminar insumo" hoverColor="#dc2626" hoverBg="#fef2f2">
                    <MoreVertical size={13} />
                  </IconBtn>
                </div>
                {Number(row.activo ?? 1) === 0 && (
                  <div style={{ fontSize: FS.etiqueta, fontWeight: 800, color: "#d97706", marginTop: 2 }}>INHABILITADO</div>
                )}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}


// ── Entradas / Salidas de material: tabla de movimientos del inventario ──
export const COLS_ENTRADAS = ["Fecha", "Insumo", "Cantidad", "Stock", "Registró", "Motivo"];


export function EntradasTable({ rows, tipo = "Entrada", onEditar }) {
  const [hoverRow, setHoverRow] = useState(null);
  const { T } = useTheme();
  const esSalida = tipo === "Salida";
  // Solo las entradas se pueden editar (el backend ajusta el stock solo).
  const editable = !esSalida && typeof onEditar === "function";
  const columnas = editable ? [...COLS_ENTRADAS, ""] : COLS_ENTRADAS;

  const th = {
    padding: "6px 10px", fontSize: FS.etiqueta, fontWeight: 700,
    textTransform: "uppercase", letterSpacing: "0.07em",
    color: T.textMuted, background: T.surfaceAlt,
    borderBottom: `2px solid ${T.border}`, textAlign: "left",
    whiteSpace: "nowrap", position: "sticky", top: 0, zIndex: 10,
  };
  const td = {
    padding: "7px 10px", borderBottom: `1px solid ${T.border}`,
    verticalAlign: "middle", color: T.text, overflow: "hidden", textOverflow: "ellipsis",
  };

  /* La hora SI se guarda (columna DATETIME). Antes se recortaba porque el
     formato de 12 h ("30/09/2026, 06:23 p.m.") no cabia en la celda de 130px
     y esta trae overflow:hidden — solo se leia la fecha.
     Ahora: fecha arriba, hora 24h abajo (y title con el valor completo). */
  const toDate = v => {
    if (v instanceof Date) return Number.isNaN(v.getTime()) ? null : v;
    const s = String(v ?? "").trim();
    if (!s) return null;
    // MySQL devuelve "YYYY-MM-DD HH:MM:SS"; la API lo envia como ISO ("...Z")
    const d = new Date(/^\d{4}-\d{2}-\d{2} /.test(s) ? s.replace(" ", "T") : s);
    return Number.isNaN(d.getTime()) ? null : d;
  };

  const fmtFecha = f => {
    const d = toDate(f);
    if (!d) return { dia: f ? String(f) : "—", hora: "", full: "" };
    return {
      dia:  fechaCorta(d),
      hora: d.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit", hour12: false }),
      full: fechaHora(d),
    };
  };

  return (
    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: FS.cuerpo, tableLayout: "fixed", minWidth: "960px" }}>
      <colgroup>
        <col style={{ width: "130px" }} />
        <col style={{ width: "26%" }} />
        <col style={{ width: "92px" }} />
        <col style={{ width: "104px" }} />
        <col style={{ width: "18%" }} />
        <col />
        {editable && <col style={{ width: "56px" }} />}
      </colgroup>
      <thead>
        <tr>{columnas.map((c, i) => <th key={c || `col-${i}`} style={th}>{c}</th>)}</tr>
      </thead>
      <tbody>
        {rows.map((m, idx) => {
          const hover = hoverRow === idx;
          return (
            <tr
              key={m.id_movimiento}
              onMouseEnter={() => setHoverRow(idx)}
              onMouseLeave={() => setHoverRow(null)}
              style={{ background: hover ? (T.isDark ? "rgba(255,255,255,0.03)" : "#f8fafc") : "transparent", transition: "background 0.1s" }}
            >
              <td title={fmtFecha(m.fecha).full} style={{ ...td, fontSize: FS.secundario, color: T.textMuted, whiteSpace: "nowrap", overflow: "visible" }}>
                <div style={{ lineHeight: 1.25 }}>{fmtFecha(m.fecha).dia}</div>
                {fmtFecha(m.fecha).hora && (
                  <div style={{ fontWeight: 800, color: T.text, fontVariantNumeric: "tabular-nums", lineHeight: 1.25 }}>
                    {fmtFecha(m.fecha).hora}
                  </div>
                )}
              </td>
              <td style={td}>
                <div style={{ fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {m.nombre_insumo || "—"}
                </div>
                {(m.marca || m.modelo) && (
                  <div style={{ fontSize: FS.etiqueta, color: T.textFaint, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {[m.marca, m.modelo].filter(Boolean).join(" · ")}
                  </div>
                )}
              </td>
              <td style={{ ...td, fontWeight: 800, fontVariantNumeric: "tabular-nums", color: esSalida ? "#dc2626" : "#16a34a" }}>
                {esSalida ? `-${m.cantidad}` : `+${m.cantidad}`}
              </td>
              <td style={{ ...td, fontSize: FS.secundario, color: T.textMuted, whiteSpace: "nowrap", fontVariantNumeric: "tabular-nums" }}>
                {m.stock_anterior ?? 0} → {m.stock_nuevo ?? 0}
              </td>
              <td style={{ ...td, fontSize: FS.secundario, whiteSpace: "nowrap" }}>
                {m.nombre_empleado || "—"}
              </td>
              <td style={td}>
                <div style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={m.motivo || ""}>
                  {m.motivo || "—"}
                </div>
                {m.folio_solicitud && (
                  <span style={{
                    display: "inline-block", marginTop: "2px", fontSize: FS.etiqueta, fontWeight: 700,
                    color: "#0d9488", background: "rgba(13,148,136,0.10)",
                    border: "1px solid rgba(13,148,136,0.30)", borderRadius: "4px", padding: "1px 6px",
                  }}>
                    {m.folio_solicitud}
                  </span>
                )}
              </td>
              {editable && (
                <td style={{ ...td, textAlign: "center", overflow: "visible" }}>
                  <button type="button" onClick={() => onEditar(m)}
                    title="Editar entrada (el inventario se ajusta solo)" aria-label={`Editar entrada de ${m.nombre_insumo}`}
                    style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: "28px", height: "28px",
                      borderRadius: "6px", border: `1px solid ${T.border}`, background: "transparent", color: "#0d9488", cursor: "pointer" }}>
                    <Pencil size={13} />
                  </button>
                </td>
              )}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
