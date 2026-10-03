import { useState, useEffect, useRef } from "react";
import { useAutoRefresh } from "../../Config/useAutoRefresh";
import {
  Package, AlertTriangle, BarChart3,
  Inbox, Plus, Pencil, RefreshCw, Layers, Eye,
  CheckCircle2, Activity, Download, FileSpreadsheet, FileText,
  ArrowDownToLine, History,
} from "lucide-react";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

import { apiFetch }      from "../../Config/api";
import FiltrosToolbar    from "../../Components/FiltrosToolbar";
import { useToast }      from "../../Components/Feedback";
import ModalInsumo       from "../../Components/Inventario/ModalInsumo";
import ModalDetalleInsumo   from "../../Components/Inventario/ModalDetalleInsumo";
import ModalEntradaInsumo   from "../../Components/Inventario/ModalEntradaInsumo";
import { useTheme }      from "../../Config/themeContext.js";

// ── Paleta ────────────────────────────────────────────────────────
const TEAL    = { base: "#0d9488", light: "#f0fdfa", border: "#99f6e4", muted: "rgba(13,148,136,0.12)" };
const ORANGE  = { base: "#F97316", light: "#fff7ed", border: "#fed7aa", muted: "rgba(249,115,22,0.12)" };
const SLATE   = { 50: "#f8fafc", 100: "#f1f5f9", 200: "#e2e8f0", 300: "#cbd5e1", 400: "#94a3b8", 600: "#475569", 700: "#334155", 900: "#0f172a" };

const ESTADO_META = {
  Excelente: { color: "#16a34a" },
  Bueno:     { color: "#2563eb" },
  Regular:   { color: "#d97706" },
  Malo:      { color: "#dc2626" },
};

const ESTADO_OPTS = ["Excelente", "Bueno", "Regular", "Malo"];

const CAT_PALETTES = [
  { color: "#7c3aed", bg: "#f5f3ff", border: "#ddd6fe" },
  { color: "#0891b2", bg: "#ecfeff", border: "#a5f3fc" },
  { color: "#0d9488", bg: "#f0fdfa", border: "#99f6e4" },
  { color: "#d97706", bg: "#fffbeb", border: "#fde68a" },
  { color: "#db2777", bg: "#fdf2f8", border: "#fbcfe8" },
  { color: "#059669", bg: "#ecfdf5", border: "#a7f3d0" },
  { color: "#4f46e5", bg: "#eef2ff", border: "#c7d2fe" },
  { color: "#b45309", bg: "#fefce8", border: "#fef08a" },
];
const catColor = (name = "") => {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xffff;
  return CAT_PALETTES[h % CAT_PALETTES.length];
};

// ── Átomos ────────────────────────────────────────────────────────
function ChipEstado({ estado, T }) {
  const s = ESTADO_META[estado] ?? { color: "#94a3b8" };
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: "5px", fontSize: "11px", fontWeight: 600, color: s.color }}>
      <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: s.color, flexShrink: 0 }} />
      {estado || "—"}
    </span>
  );
}

function ChipCategoria({ nombre, T }) {
  const s = catColor(nombre);
  return (
    <span style={{
      display: "inline-block",
      fontSize: "10px", fontWeight: 600,
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

function IconBtn({ onClick, title, children, hoverColor = "#2563eb", hoverBg = "#eff6ff" }) {
  const [h, setH] = useState(false);
  const { T } = useTheme();
  return (
    <button
      onClick={onClick} title={title}
      onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{
        width: "28px", height: "28px", borderRadius: "4px", border: `1px solid ${h ? "transparent" : T.border}`,
        background: h ? hoverBg : "transparent",
        color: h ? hoverColor : T.textFaint,
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        cursor: "pointer", transition: "all 0.12s", flexShrink: 0,
      }}
    >
      {children}
    </button>
  );
}

// ── KPI Card ─────────────────────────────────────────────────────
function KpiCard({ label, value, sub, icon: Icon, color, highlight = false, pct }) {
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
          <p style={{ margin: 0, fontSize: "9px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: T.textFaint }}>
            {label}
          </p>
          <p style={{ margin: "2px 0 0", fontSize: "16px", fontWeight: 900, lineHeight: 1, color: highlight ? color : T.text, fontVariantNumeric: "tabular-nums" }}>
            {value}
          </p>
          {sub && (
            <p style={{ margin: "2px 0 0", fontSize: "9px", color: T.textFaint, fontWeight: 500, lineHeight: 1.3 }}>{sub}</p>
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
const COLS = ["", "Nombre", "Categoría", "Estado", "Stock", "Acciones"];

function DataTable({ rows, onEdit, onDetail, onEntrada, onHistorial }) {
  const [hoverRow, setHoverRow] = useState(null);
  const { T } = useTheme();

  const th = {
    padding: "6px 10px", fontSize: "10px", fontWeight: 700,
    textTransform: "uppercase", letterSpacing: "0.07em",
    color: T.textMuted, background: T.surfaceAlt,
    borderBottom: `2px solid ${T.border}`, textAlign: "left",
    whiteSpace: "nowrap", position: "sticky", top: 0, zIndex: 10,
  };

  return (
    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px", tableLayout: "fixed", minWidth: "520px" }}>
      <colgroup>
        <col style={{ width: "44px" }} />
        <col style={{ width: "38%" }} />
        <col style={{ width: "22%" }} />
        <col style={{ width: "14%" }} />
        <col style={{ width: "16%" }} />
        <col style={{ width: "132px" }} />
      </colgroup>
      <thead>
        <tr>{COLS.map(c => <th key={c} style={th}>{c}</th>)}</tr>
      </thead>
      <tbody>
        {rows.map((row) => {
          const isHover = hoverRow === row.id_insumo;
          const stockColor = (row.stock ?? 0) === 0 ? "#dc2626" : (row.stock ?? 0) <= 3 ? "#d97706" : "#16a34a";
          const td = {
            padding: "5px 10px",
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
              <td style={{ ...td, padding: "4px 4px 4px 10px" }}>
                {row.imagen_url
                  ? <img src={row.imagen_url} alt="" style={{ width: "26px", height: "26px", borderRadius: "4px", objectFit: "cover", border: `1px solid ${T.border}`, display: "block" }} />
                  : <div style={{ width: "26px", height: "26px", borderRadius: "4px", background: T.surfaceAlt, border: `1px solid ${T.border}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Package size={11} style={{ color: T.textFaint }} />
                    </div>
                }
              </td>
              {/* Nombre */}
              <td style={{ ...td }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <div style={{ width: "2px", height: "20px", borderRadius: "2px", background: ESTADO_META[row.estado]?.color ?? SLATE[400], flexShrink: 0 }} />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: "13px", fontWeight: 700, color: T.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {row.nombre}
                    </div>
                    {(row.marca || row.modelo) && (
                      <div style={{ fontSize: "10px", color: T.textFaint, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
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
                  <span style={{ fontSize: "12px", fontWeight: 700, color: stockColor, fontFamily: "monospace", minWidth: "20px" }}>
                    {row.stock ?? 0}
                  </span>
                  <div style={{ flex: 1, height: "3px", borderRadius: "99px", background: T.border, overflow: "hidden" }}>
                    <div style={{ width: `${Math.min(100, Math.round(((row.stock ?? 0) / 20) * 100))}%`, height: "100%", background: stockColor, borderRadius: "99px" }} />
                  </div>
                </div>
              </td>
              {/* Acciones */}
              <td style={{ ...td }}>
                <div style={{ display: "flex", gap: "3px" }}>
                  <IconBtn onClick={() => onEntrada(row)} title="Registrar entrada de material" hoverColor={TEAL.base} hoverBg={TEAL.light}>
                    <ArrowDownToLine size={12} />
                  </IconBtn>
                  <IconBtn onClick={() => onEdit(row)} title="Editar" hoverColor={ORANGE.base} hoverBg={ORANGE.light}>
                    <Pencil size={12} />
                  </IconBtn>
                  <IconBtn onClick={() => onDetail(row)} title="Ver detalle" hoverColor="#2563eb" hoverBg="#eff6ff">
                    <Eye size={12} />
                  </IconBtn>
                  <IconBtn onClick={() => onHistorial(row)} title="Ver entradas de este insumo" hoverColor="#6366f1" hoverBg="#eef2ff">
                    <History size={12} />
                  </IconBtn>
                </div>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

// ── Entradas de material: tabla de ingresos al inventario ──────────
const COLS_ENTRADAS = ["Fecha", "Insumo", "Cantidad", "Stock", "Registró", "Motivo"];

function EntradasTable({ rows }) {
  const [hoverRow, setHoverRow] = useState(null);
  const { T } = useTheme();

  const th = {
    padding: "6px 10px", fontSize: "10px", fontWeight: 700,
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
      dia:  d.toLocaleDateString("es-MX", { day: "2-digit", month: "2-digit", year: "numeric" }),
      hora: d.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit", hour12: false }),
      full: d.toLocaleString("es-MX", { dateStyle: "medium", timeStyle: "short" }),
    };
  };

  return (
    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px", tableLayout: "fixed", minWidth: "960px" }}>
      <colgroup>
        <col style={{ width: "130px" }} />
        <col style={{ width: "26%" }} />
        <col style={{ width: "92px" }} />
        <col style={{ width: "104px" }} />
        <col style={{ width: "18%" }} />
        <col />
      </colgroup>
      <thead>
        <tr>{COLS_ENTRADAS.map(c => <th key={c} style={th}>{c}</th>)}</tr>
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
              <td title={fmtFecha(m.fecha).full} style={{ ...td, fontSize: "11px", color: T.textMuted, whiteSpace: "nowrap", overflow: "visible" }}>
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
                  <div style={{ fontSize: "10px", color: T.textFaint, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {[m.marca, m.modelo].filter(Boolean).join(" · ")}
                  </div>
                )}
              </td>
              <td style={{ ...td, fontWeight: 800, fontVariantNumeric: "tabular-nums", color: "#16a34a" }}>
                +{m.cantidad}
              </td>
              <td style={{ ...td, fontSize: "11px", color: T.textMuted, whiteSpace: "nowrap", fontVariantNumeric: "tabular-nums" }}>
                {m.stock_anterior ?? 0} → {m.stock_nuevo ?? 0}
              </td>
              <td style={{ ...td, fontSize: "11px", whiteSpace: "nowrap" }}>
                {m.nombre_empleado || "—"}
              </td>
              <td style={td}>
                <div style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={m.motivo || ""}>
                  {m.motivo || "—"}
                </div>
                {m.folio_solicitud && (
                  <span style={{
                    display: "inline-block", marginTop: "2px", fontSize: "9px", fontWeight: 700,
                    color: "#0d9488", background: "rgba(13,148,136,0.10)",
                    border: "1px solid rgba(13,148,136,0.30)", borderRadius: "4px", padding: "1px 6px",
                  }}>
                    {m.folio_solicitud}
                  </span>
                )}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

const PAGE_SIZES = [10, 15, 25, 50];
const PAGE_SIZE  = 15;

// ── Helpers ───────────────────────────────────────────────────────
async function urlToBase64(url) {
  try {
    const res = await fetch(url);
    const blob = await res.blob();
    return await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch { return null; }
}

async function toJpegBase64(dataUrl) {
  return new Promise(resolve => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth || 80;
      canvas.height = img.naturalHeight || 80;
      canvas.getContext("2d").drawImage(img, 0, 0);
      resolve(canvas.toDataURL("image/jpeg", 0.85));
    };
    img.onerror = () => resolve(null);
    img.src = dataUrl;
  });
}

// ── Helpers imagen con fondo blanco (para PNG con transparencia) ──
async function toPngBase64White(dataUrl, w, h) {
  return new Promise(resolve => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width  = w || img.naturalWidth  || 200;
      canvas.height = h || img.naturalHeight || 200;
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      // escalar manteniendo aspecto
      const scale = Math.min(canvas.width / img.naturalWidth, canvas.height / img.naturalHeight);
      const dx = (canvas.width  - img.naturalWidth  * scale) / 2;
      const dy = (canvas.height - img.naturalHeight * scale) / 2;
      ctx.drawImage(img, dx, dy, img.naturalWidth * scale, img.naturalHeight * scale);
      resolve(canvas.toDataURL("image/png"));
    };
    img.onerror = () => resolve(null);
    img.src = dataUrl;
  });
}

// ── Exportar Excel ────────────────────────────────────────────────
async function exportarExcel(datos) {
  const wb = new ExcelJS.Workbook();
  wb.creator = "PrecisionTrucks HelpDesk";
  wb.created = new Date();

  const ws = wb.addWorksheet("Inventario", { views: [{ state: "frozen", ySplit: 5 }] });

  const NAVY   = "FF0F172A";
  const TEAL_X = "FF0D9488";
  const WHITE  = "FFFFFFFF";
  const GRAY50 = "FFF8FAFC";
  const GRAY100= "FFF1F5F9";
  const GRAY600= "FF475569";
  const BORDER_COLOR = { argb: "FFE2E8F0" };
  const bThin  = { style: "thin",   color: BORDER_COLOR };
  const bMed   = { style: "medium", color: { argb: NAVY } };
  const borderAll  = { top: bThin, bottom: bThin, left: bThin, right: bThin };
  const borderTop  = { top: bMed,  bottom: bThin, left: bThin, right: bThin };

  const fecha = new Date().toLocaleDateString("es-MX", { year: "numeric", month: "long", day: "numeric" });
  const ahora = new Date();
  const ts    = `${ahora.getFullYear()}-${String(ahora.getMonth()+1).padStart(2,"0")}-${String(ahora.getDate()).padStart(2,"0")}_${String(ahora.getHours()).padStart(2,"0")}-${String(ahora.getMinutes()).padStart(2,"0")}`;

  // ── Anchos de columna ─────────────────────────────────────────
  ws.columns = [
    { width: 12 }, // A: Imagen
    { width: 32 }, // B: Nombre
    { width: 16 }, // C: Marca
    { width: 16 }, // D: Modelo
    { width: 18 }, // E: N° Serie
    { width: 20 }, // F: Categoría
    { width: 14 }, // G: Estado
    { width: 16 }, // H: Disponibilidad
    { width: 10 }, // I: Stock
    { width: 42 }, // J: Descripción
  ];

  // ── Fila 1: barra de color corporativo ───────────────────────
  ws.getRow(1).height = 6;
  ws.mergeCells("A1:J1");
  ws.getCell("A1").fill = { type: "pattern", pattern: "solid", fgColor: { argb: TEAL_X } };

  // ── Fila 2: logo + título ─────────────────────────────────────
  ws.getRow(2).height = 56;
  ws.mergeCells("A2:F2");
  const titleCell = ws.getCell("A2");
  titleCell.value = "Inventario de Insumos";
  titleCell.font  = { name: "Calibri", size: 22, bold: true, color: { argb: NAVY } };
  titleCell.alignment = { vertical: "middle", horizontal: "left", indent: 1 };
  titleCell.fill  = { type: "pattern", pattern: "solid", fgColor: { argb: WHITE } };

  ws.mergeCells("G2:J2");
  ws.getCell("G2").fill = { type: "pattern", pattern: "solid", fgColor: { argb: WHITE } };
  try {
    const logoRaw = await urlToBase64("/assets/img/log.png");
    if (logoRaw) {
      const logoPng = await toPngBase64White(logoRaw, 220, 52);
      if (logoPng) {
        const logoId = wb.addImage({ base64: logoPng.split(",")[1], extension: "png" });
        ws.addImage(logoId, { tl: { col: 6.1, row: 1.1 }, br: { col: 9.9, row: 1.95 }, editAs: "oneCell" });
      }
    }
  } catch { /* logo no disponible */ }

  // ── Fila 3: empresa + fecha ───────────────────────────────────
  ws.getRow(3).height = 14;
  ws.mergeCells("A3:F3");
  const empCell = ws.getCell("A3");
  empCell.value = "Precision Truck Parts, Parts and Accesories, S.A de C.V.  ·  Departamento de Soporte Técnico";
  empCell.font  = { name: "Calibri", size: 9, italic: true, color: { argb: GRAY600 } };
  empCell.alignment = { vertical: "middle", horizontal: "left", indent: 1 };
  empCell.fill  = { type: "pattern", pattern: "solid", fgColor: { argb: WHITE } };

  // Folio en G3
  const folioDoc = `INV-${ahora.getFullYear()}${String(ahora.getMonth()+1).padStart(2,"0")}-${String(ahora.getDate()).padStart(2,"0")}`;
  ws.mergeCells("G3:J3");
  const fechaCell = ws.getCell("G3");
  fechaCell.value = `Folio: ${folioDoc}   ·   Generado: ${fecha}`;
  fechaCell.font  = { name: "Calibri", size: 8, color: { argb: GRAY600 } };
  fechaCell.alignment = { vertical: "middle", horizontal: "right" };
  fechaCell.fill  = { type: "pattern", pattern: "solid", fgColor: { argb: WHITE } };

  // ── Fila 4: línea divisoria navy ──────────────────────────────
  ws.getRow(4).height = 4;
  ws.mergeCells("A4:J4");
  ws.getCell("A4").fill = { type: "pattern", pattern: "solid", fgColor: { argb: TEAL_X } };

  // ── Fila 5: encabezados ───────────────────────────────────────
  const headers = ["Imagen", "Nombre", "Marca", "Modelo", "N° Serie", "Categoría", "Estado", "Disponibilidad", "Stock", "Descripción"];
  const headerRow = ws.addRow(headers); // fila 5
  headerRow.height = 22;
  headerRow.eachCell((cell, colNum) => {
    cell.font      = { name: "Calibri", size: 9, bold: true, color: { argb: WHITE } };
    cell.fill      = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1E293B" } };
    cell.alignment = { vertical: "middle", horizontal: colNum === 1 ? "center" : colNum === 10 ? "left" : "center", wrapText: false };
    cell.border    = { top: bThin, bottom: { style: "medium", color: { argb: TEAL_X } }, left: bThin, right: bThin };
  });

  // ── Filas de datos ────────────────────────────────────────────
  const IMG_ROW_H = 52;
  const IMG_SIZE  = 38;

  const ESTADO_COLORS = { Excelente: "FF15803D", Bueno: "FF2563EB", Regular: "FFA16207", Malo: "FFB91C1C" };

  for (let idx = 0; idx < datos.length; idx++) {
    const i      = datos[idx];
    const rowNum = idx + 6; // filas 1-5 ya usadas
    const isAlt  = idx % 2 === 1;
    const bgArgb = isAlt ? GRAY50 : WHITE;

    const row = ws.addRow([
      "",                          // A: imagen (vacío, se pone como imagen)
      i.nombre || "",              // B
      i.marca || "",               // C
      i.modelo || "",              // D
      i.num_serie || "",           // E
      i.nombre_categoria || "",    // F
      i.estado || "",              // G
      i.disponibilidad || "",      // H
      i.stock ?? 0,                // I
      i.descripcion || "",         // J
    ]);
    row.height = IMG_ROW_H;

    row.eachCell({ includeEmpty: true }, (cell, colNum) => {
      cell.fill      = { type: "pattern", pattern: "solid", fgColor: { argb: bgArgb } };
      cell.font      = { name: "Calibri", size: 10, color: { argb: NAVY } };
      cell.alignment = { vertical: "middle", horizontal: colNum === 10 ? "left" : "center", wrapText: colNum === 10 };
      cell.border    = borderAll;
    });

    // Stock: negrita + color según nivel
    const stockVal = i.stock ?? 0;
    const stockArgb = stockVal === 0 ? "FFB91C1C" : stockVal <= 5 ? "FFD97706" : "FF15803D";
    const stockCell = row.getCell(9);
    stockCell.font = { name: "Calibri", size: 11, bold: true, color: { argb: stockArgb } };

    // Estado: color según valor
    const estadoCell = row.getCell(7);
    const estadoArgb = ESTADO_COLORS[i.estado] ?? GRAY600;
    estadoCell.font = { name: "Calibri", size: 10, bold: true, color: { argb: estadoArgb } };

    // Imagen del insumo
    if (i.imagen_url) {
      try {
        const raw = await urlToBase64(i.imagen_url);
        if (raw) {
          const jpeg = await toJpegBase64(raw);
          if (jpeg) {
            const imgId = wb.addImage({ base64: jpeg.split(",")[1], extension: "jpeg" });
            ws.addImage(imgId, {
              tl: { col: 0, row: rowNum - 1, nativeColOff: 90720, nativeRowOff: 90720 },
              ext: { width: IMG_SIZE, height: IMG_SIZE },
              editAs: "oneCell",
            });
          }
        }
      } catch { /* imagen no disponible */ }
    }
  }

  // ── Fila de totales ───────────────────────────────────────────
  const totalStock = datos.reduce((s, i) => s + (i.stock ?? 0), 0);
  const totalRow = ws.addRow([
    "", `Total: ${datos.length} registros`, "", "", "", "", "", "", totalStock, "",
  ]);
  totalRow.height = 20;
  totalRow.eachCell({ includeEmpty: true }, (cell, colNum) => {
    cell.fill      = { type: "pattern", pattern: "solid", fgColor: { argb: GRAY100 } };
    cell.font      = { name: "Calibri", size: 9, bold: true, color: { argb: "FF374151" } };
    cell.alignment = { vertical: "middle", horizontal: colNum === 10 ? "left" : "center" };
    cell.border    = borderTop;
  });
  totalRow.getCell(9).font = { name: "Calibri", size: 10, bold: true, color: { argb: TEAL_X } };

  // ── AutoFilter ────────────────────────────────────────────────
  ws.autoFilter = { from: "A5", to: `J${5 + datos.length}` };

  const buf = await wb.xlsx.writeBuffer();
  saveAs(
    new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }),
    `Inventario_${ts}.xlsx`
  );
}

// Abre la vista previa de impresión en una pestaña nueva (avisa si está bloqueada)
function abrirImpresion(url) {
  const win = window.open(url, "_blank", "width=1200,height=800");
  if (!win) {
    const aviso = document.createElement("div");
    aviso.style.cssText = "position:fixed;top:16px;left:50%;transform:translateX(-50%);z-index:9999;background:#1D1D1B;color:#fff;padding:12px 20px;border-radius:10px;font-size:13px;font-weight:700;border-left:4px solid #0d9488;box-shadow:0 4px 20px rgba(0,0,0,0.4);";
    aviso.textContent = "El navegador bloqueó la ventana emergente. Permite las ventanas emergentes e intenta de nuevo.";
    document.body.appendChild(aviso);
    setTimeout(() => aviso.remove(), 5000);
  }
}

// Hoja de la pestaña Insumos: payload { rows, filtros }
function exportarPDF(datos, filtrosAplicados = []) {
  sessionStorage.setItem("print_inventario_datos", JSON.stringify({ rows: datos, filtros: filtrosAplicados }));
  abrirImpresion("/print/inventario");
}

function BtnExportar({ datos, T, vista = "insumos", filtros = [], onPdf }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const fn = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);
  const isDark = T?.isDark;
  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: "inline-flex", alignItems: "center", gap: "5px",
          padding: "7px 12px", borderRadius: "6px",
          border: `1px solid ${isDark ? "rgba(13,148,136,0.4)" : "#0d9488"}`,
          background: "transparent",
          color: "#0d9488", fontSize: "11px", fontWeight: 600, cursor: "pointer",
        }}
      >
        <Download size={12} /> Exportar
      </button>
      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 4px)", right: 0, zIndex: 50,
          background: isDark ? "#1C2230" : "#fff",
          border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "#e2e8f0"}`,
          borderRadius: "6px",
          boxShadow: "0 4px 16px rgba(0,0,0,0.14)", minWidth: "148px", overflow: "hidden",
        }}>
          {(vista === "entradas"
            ? [{ label: "Hoja PDF / Imprimir", icon: FileText, color: "#dc2626", fn: () => { onPdf?.(); setOpen(false); } }]
            : [
                { label: "Excel (.xlsx)", icon: FileSpreadsheet, color: "#16a34a", fn: () => { exportarExcel(datos).catch(console.error); setOpen(false); } },
                { label: "PDF (.pdf)",    icon: FileText,        color: "#dc2626", fn: () => { exportarPDF(datos, filtros); setOpen(false); } },
              ]
          ).map(({ label, icon: Icon, color, fn }) => (
            <button key={label} onClick={fn}
              style={{
                width: "100%", display: "flex", alignItems: "center", gap: "8px",
                padding: "8px 12px", background: "transparent", border: "none",
                fontSize: "12px", fontWeight: 500,
                color: isDark ? "#e2e8f0" : "#334155",
                cursor: "pointer", textAlign: "left",
              }}
              onMouseEnter={e => e.currentTarget.style.background = isDark ? "rgba(255,255,255,0.05)" : "#f8fafc"}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}
            >
              <Icon size={13} style={{ color }} />{label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Página principal ──────────────────────────────────────────────
export default function Inventario() {
  const [insumos,    setInsumos]    = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [syncing,    setSyncing]    = useState(false);
  const [filtros,    setFiltros]    = useState({ busqueda: "", estado: "Todos", categoria: "Todos", stock: "Todos" });
  const [pagina,     setPagina]     = useState(1);
  const [pageSize,   setPageSize]   = useState(PAGE_SIZE);
  const [modal,      setModal]      = useState(null);
  const [detalle,    setDetalle]    = useState(null);
  const [entrada,    setEntrada]    = useState(null);
  // ── Vista "Entradas" (entradas de material) ──
  const [vista,      setVista]      = useState("insumos");
  const [movs,       setMovs]       = useState([]);
  const [movTotal,   setMovTotal]   = useState(0);
  const [movLoading, setMovLoading] = useState(false);
  const [movPagina,  setMovPagina]  = useState(1);
  const [movPageSize, setMovPageSize] = useState(PAGE_SIZE);
  const [movFiltros, setMovFiltros] = useState({ q: "", fecha_inicio: "", fecha_fin: "", id_insumo: "" });
  const [movInsumo,  setMovInsumo]  = useState(null); // nombre del insumo activo en el chip de filtro
  const prevRef = useRef(null);
  const toast   = useToast();

  const cargarInventario = (esPrimera = false) => {
    if (!esPrimera) setSyncing(true);
    apiFetch("/api/solicitudes/inventario")
      .then(r => r.json())
      .then(d => {
        const lista = Array.isArray(d) ? d : [];
        setInsumos(prev => {
          if (prevRef.current) {
            const prevIds  = new Set(prevRef.current.map(i => i.id_insumo));
            const nuevos   = lista.filter(i => !prevIds.has(i.id_insumo));
            const agotados = lista.filter(i => {
              const ant = prevRef.current.find(p => p.id_insumo === i.id_insumo);
              return ant && ant.stock > 0 && i.stock === 0;
            });
            if (nuevos.length)   toast.info(`${nuevos.length} insumo(s) nuevo(s)`);
            if (agotados.length) toast.warning(`${agotados.length} insumo(s) agotado(s)`);
          }
          prevRef.current = lista;
          return JSON.stringify(prev) === JSON.stringify(lista) ? prev : lista;
        });
      })
      .catch(() => {})
      .finally(() => { setLoading(false); setSyncing(false); });
  };

  // Entradas de material — GET /api/solicitudes/movimientos (admin)
  const cargarEntradas = () => {
    setMovLoading(true);
    const p = new URLSearchParams({
      page:  String(movPagina),
      limit: String(movPageSize),
      tipo:  "Entrada",
    });
    if (movFiltros.q?.trim())    p.set("q", movFiltros.q.trim());
    if (movFiltros.fecha_inicio) p.set("fecha_inicio", movFiltros.fecha_inicio);
    if (movFiltros.fecha_fin)    p.set("fecha_fin", movFiltros.fecha_fin);
    if (movFiltros.id_insumo)    p.set("id_insumo", String(movFiltros.id_insumo));
    apiFetch(`/api/solicitudes/movimientos?${p.toString()}`)
      .then(r => r.json())
      .then(d => {
        setMovs(Array.isArray(d?.rows) ? d.rows : []);
        setMovTotal(Number(d?.total) || 0);
      })
      .catch(() => {})
      .finally(() => setMovLoading(false));
  };

  useEffect(() => {
    cargarInventario(true);
    apiFetch("/api/categorias?tipo=insumo").then(r => r.json()).then(d => setCategorias(Array.isArray(d) ? d : [])).catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Cargar las entradas al entrar a la pestaña Entradas o al cambiar filtros/página
  useEffect(() => {
    if (vista !== "entradas") return;
    cargarEntradas();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vista, movPagina, movPageSize, movFiltros]);

  useAutoRefresh(() => {
    if (vista === "entradas") cargarEntradas();
    else cargarInventario(false);
  }, 30000);

  const handleSave = (data, isEdit) => {
    setInsumos(prev => isEdit ? prev.map(i => i.id_insumo === data.id_insumo ? data : i) : [...prev, data]);
    setModal(null);
  };

  // Ver las entradas de un insumo puntual → pestaña Entradas con filtro id_insumo
  const verEntradasInsumo = (row) => {
    setMovFiltros({ q: "", fecha_inicio: "", fecha_fin: "", id_insumo: row.id_insumo });
    setMovInsumo(row.nombre);
    setMovPagina(1);
    setVista("entradas");
  };
  const limpiarInsumo = () => {
    setMovFiltros(p => ({ ...p, id_insumo: "" }));
    setMovInsumo(null);
    setMovPagina(1);
  };

  // Etiquetas de los filtros activos de la pestaña Insumos (para la hoja impresa)
  const etiquetasInsumos = [];
  if (filtros.busqueda?.trim())                            etiquetasInsumos.push(`Búsqueda: "${filtros.busqueda.trim()}"`);
  if (filtros.estado && filtros.estado !== "Todos")        etiquetasInsumos.push(`Estado: ${filtros.estado}`);
  if (filtros.categoria && filtros.categoria !== "Todos")  etiquetasInsumos.push(`Categoría: ${filtros.categoria}`);
  if (filtros.stock && filtros.stock !== "Todos")          etiquetasInsumos.push(`Stock: ${filtros.stock}`);

  // Hoja de la pestaña Entradas: trae TODAS las entradas con los filtros actuales.
  // El backend limita a 500 registros por petición → se pagina en bloques de 500.
  const exportarEntradasPDF = async () => {
    try {
      const BLOQUE = 500;
      const MAX    = 20000; // tope de seguridad
      let rows = [], total = 0, page = 1, chunk = [];
      do {
        const p = new URLSearchParams({ page: String(page), limit: String(BLOQUE), tipo: "Entrada" });
        if (movFiltros.q?.trim())    p.set("q", movFiltros.q.trim());
        if (movFiltros.fecha_inicio) p.set("fecha_inicio", movFiltros.fecha_inicio);
        if (movFiltros.fecha_fin)    p.set("fecha_fin", movFiltros.fecha_fin);
        if (movFiltros.id_insumo)    p.set("id_insumo", String(movFiltros.id_insumo));
        const r = await apiFetch(`/api/solicitudes/movimientos?${p.toString()}`);
        const d = await r.json();
        chunk = Array.isArray(d?.rows) ? d.rows : [];
        rows  = rows.concat(chunk);
        total = Number(d?.total) || rows.length;
        page += 1;
      } while (chunk.length === BLOQUE && rows.length < total && rows.length < MAX);

      const etiquetas = [];
      if (movFiltros.q?.trim())                            etiquetas.push(`Búsqueda: "${movFiltros.q.trim()}"`);
      if (movFiltros.fecha_inicio || movFiltros.fecha_fin) etiquetas.push(`Periodo: ${movFiltros.fecha_inicio || "…"} al ${movFiltros.fecha_fin || "…"}`);
      if (movInsumo)                                       etiquetas.push(`Insumo: ${movInsumo}`);

      sessionStorage.setItem("print_entradas_datos", JSON.stringify({ rows, filtros: etiquetas, total }));
      abrirImpresion("/print/entradas");
    } catch {
      toast.error("No se pudo generar la hoja de entradas");
    }
  };

  const catOpts      = ["Todos", ...Array.from(new Set(insumos.map(i => i.nombre_categoria).filter(Boolean)))];
  const camposFiltro = [
    { key: "busqueda",  label: "Búsqueda Rápida", type: "search", placeholder: "Nombre, marca, modelo…" },
    { key: "estado",    label: "Estado",           type: "select", opts: ["Todos", ...ESTADO_OPTS] },
    { key: "categoria", label: "Categoría",        type: "select", opts: catOpts },
    { key: "stock",     label: "Stock",            type: "select", opts: ["Todos", "Con stock", "Sin stock"] },
  ];

  // Filtros de la pestaña "Entradas"
  const camposFiltroE = [
    { key: "q",            label: "Búsqueda", type: "search", placeholder: "Insumo, motivo, folio…", debounce: 300 },
    { key: "fecha_inicio", label: "Desde",    type: "date" },
    { key: "fecha_fin",    label: "Hasta",    type: "date" },
  ];

  const filtrados = insumos.filter(i => {
    const q = filtros.busqueda?.toLowerCase();
    if (q && !i.nombre?.toLowerCase().includes(q) && !i.marca?.toLowerCase().includes(q) &&
        !i.modelo?.toLowerCase().includes(q) && !i.num_serie?.toLowerCase().includes(q)) return false;
    if (filtros.estado    !== "Todos" && i.estado           !== filtros.estado)    return false;
    if (filtros.categoria !== "Todos" && i.nombre_categoria !== filtros.categoria) return false;
    if (filtros.stock === "Con stock" && !(i.stock > 0))  return false;
    if (filtros.stock === "Sin stock" &&   i.stock > 0)   return false;
    return true;
  });

  const hayFiltros    = filtros.busqueda || filtros.estado !== "Todos" || filtros.categoria !== "Todos" || filtros.stock !== "Todos";
  const totalPaginas  = Math.max(1, Math.ceil(filtrados.length / pageSize));
  const paginaActual  = Math.min(pagina, totalPaginas);
  const filasPagina   = filtrados.slice((paginaActual - 1) * pageSize, paginaActual * pageSize);
  const irPagina      = p => { if (p >= 1 && p <= totalPaginas) setPagina(p); };
  const totalStock     = insumos.reduce((s, i) => s + (i.stock || 0), 0);
  const categoriasCnt  = new Set(insumos.map(i => i.id_categoria).filter(Boolean)).size;
  const stockBajo      = insumos.filter(i => (i.stock ?? 0) > 0 && (i.stock ?? 0) <= 3).length;
  const sinStock       = insumos.filter(i => (i.stock ?? 0) === 0).length;
  const criticos       = stockBajo + sinStock;
  const estadoBueno    = insumos.filter(i => i.estado === "Excelente" || i.estado === "Bueno").length;
  const estadoMalo     = insumos.filter(i => i.estado === "Malo" || i.estado === "Regular").length;
  const tasaSalud      = insumos.length > 0 ? Math.round((estadoBueno / insumos.length) * 100) : 0;

  // Entradas: paginación del servidor
  const movTotalPaginas = Math.max(1, Math.ceil(movTotal / movPageSize));
  const movPaginaActual = Math.min(movPagina, movTotalPaginas);

  const { T } = useTheme();

  return (
    <div style={{ background: T.bg, height: "100%", display: "flex", flexDirection: "column", fontFamily: "'Inter','Segoe UI',system-ui,sans-serif", overflow: "hidden" }}>
      <div style={{ maxWidth: "1400px", width: "100%", margin: "0 auto", padding: "12px 16px", display: "flex", flexDirection: "column", gap: "10px", flex: 1, minHeight: 0 }}>

        {/* ── Page Header ───────────────────────────────────────── */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px", flexWrap: "wrap" }}>
          {/* Tabs: Insumos / Entradas */}
          <div style={{ display: "flex", gap: "4px" }}>
            {[
              { id: "insumos",  label: "Insumos",  Icon: Package },
              { id: "entradas", label: "Entradas", Icon: ArrowDownToLine },
            ].map(({ id, label, Icon }) => {
              const activa = vista === id;
              return (
                <button
                  key={id}
                  onClick={() => setVista(id)}
                  style={{
                    display: "inline-flex", alignItems: "center", gap: "5px",
                    padding: "7px 14px", borderRadius: "6px", cursor: "pointer",
                    fontSize: "11px", fontWeight: 700, transition: "all 0.15s",
                    border: `1px solid ${activa ? TEAL.base : T.border}`,
                    background: activa ? (T.isDark ? "rgba(13,148,136,0.18)" : TEAL.light) : "transparent",
                    color: activa ? TEAL.base : T.textMuted,
                  }}
                >
                  <Icon size={13} /> {label}
                </button>
              );
            })}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            {syncing && <RefreshCw size={11} style={{ color: TEAL.base, animation: "spin 1s linear infinite" }} />}
            {vista === "insumos" && <BtnExportar datos={filtrados} filtros={etiquetasInsumos} T={T} />}
            {vista === "entradas" && <BtnExportar vista="entradas" onPdf={exportarEntradasPDF} T={T} />}
            {vista === "insumos" && (
              <button
                onClick={() => setModal({})}
                style={{
                  display: "inline-flex", alignItems: "center", gap: "6px",
                  padding: "8px 14px", borderRadius: "6px", border: "none",
                  background: TEAL.base, color: "#fff",
                  fontSize: "11px", fontWeight: 600, cursor: "pointer",
                  transition: "opacity 0.15s",
                }}
                onMouseEnter={e => e.currentTarget.style.opacity = "0.88"}
                onMouseLeave={e => e.currentTarget.style.opacity = "1"}
              >
                <Plus size={14} /> Nuevo insumo
              </button>
            )}
          </div>
        </div>

        {/* ── KPIs (solo pestaña Insumos) ──────────────────────── */}
        {vista === "insumos" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "6px" }}>
          <KpiCard
            label="Total Registrados" value={insumos.length}
            sub={`${categoriasCnt} categoría${categoriasCnt !== 1 ? "s" : ""} · ${insumos.filter(i => i.stock > 0).length} con existencia`}
            icon={Package} color={TEAL.base}
            pct={insumos.length > 0 ? Math.round((insumos.filter(i => i.stock > 0).length / insumos.length) * 100) : 0}
          />
          <KpiCard
            label="Piezas en Stock" value={totalStock}
            sub={`Promedio ${insumos.length > 0 ? (totalStock / insumos.length).toFixed(1) : 0} uds. por insumo`}
            icon={BarChart3} color="#2563eb"
          />
          <KpiCard
            label="Críticos" value={criticos}
            sub={`${stockBajo} stock bajo · ${sinStock} agotado${sinStock !== 1 ? "s" : ""}`}
            icon={AlertTriangle} color={ORANGE.base} highlight={criticos > 0}
            pct={insumos.length > 0 ? Math.round((criticos / insumos.length) * 100) : 0}
          />
          <KpiCard
            label="Salud del Catálogo" value={`${tasaSalud}%`}
            sub={estadoMalo > 0 ? `${estadoMalo} en estado deficiente` : "Todo en buen estado"}
            icon={tasaSalud >= 70 ? CheckCircle2 : Activity}
            color={tasaSalud >= 70 ? "#16a34a" : tasaSalud >= 40 ? "#d97706" : "#dc2626"}
            highlight={tasaSalud < 70} pct={tasaSalud}
          />
        </div>
        )}

        {/* ── Filtros ───────────────────────────────────────────── */}
        {vista === "insumos" ? (
          <FiltrosToolbar
            campos={camposFiltro}
            valores={filtros}
            onChange={(k, v) => { setFiltros(p => ({ ...p, [k]: v })); setPagina(1); }}
            onLimpiar={() => { setFiltros({ busqueda: "", estado: "Todos", categoria: "Todos", stock: "Todos" }); setPagina(1); }}
            T={T}
          />
        ) : (
          <FiltrosToolbar
            campos={camposFiltroE}
            valores={movFiltros}
            onChange={(k, v) => { setMovFiltros(p => ({ ...p, [k]: v })); setMovPagina(1); }}
            onLimpiar={() => { setMovFiltros({ q: "", fecha_inicio: "", fecha_fin: "", id_insumo: "" }); setMovInsumo(null); setMovPagina(1); }}
            loading={movLoading}
            T={T}
          />
        )}

        {/* ── Tabla principal ───────────────────────────────────── */}
        <div style={{ background: T.surface, borderRadius: "8px", border: `1px solid ${T.border}`, boxShadow: T.shadowSm, overflow: "hidden", display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>

          {/* Toolbar de tabla */}
          <div style={{
            padding: "7px 12px", background: T.surfaceAlt, borderBottom: `1px solid ${T.border}`,
            display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px", flexWrap: "wrap",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Layers size={14} style={{ color: TEAL.base }} />
              <span style={{ fontSize: "11px", fontWeight: 700, color: T.text }}>
                {vista === "insumos" ? "Catálogo de Insumos" : "Entradas de material"}
              </span>
              <span style={{
                fontSize: "11px", fontWeight: 600, padding: "2px 8px", borderRadius: "99px",
                background: T.isDark ? "rgba(13,148,136,0.18)" : "#f0fdfa",
                color: "#0d9488",
                border: T.isDark ? "1px solid rgba(13,148,136,0.35)" : "1px solid #99f6e4",
              }}>
                {vista === "insumos"
                  ? `${filtrados.length} registro${filtrados.length !== 1 ? "s" : ""}`
                  : `${movTotal} entrada${movTotal !== 1 ? "s" : ""}`}
              </span>
              {vista === "entradas" && movInsumo && (
                <button onClick={limpiarInsumo} title="Quitar filtro por insumo"
                  style={{ display: "inline-flex", alignItems: "center", gap: "5px", fontSize: "11px", fontWeight: 700, padding: "2px 8px", borderRadius: "99px", cursor: "pointer", background: T.isDark ? "rgba(37,99,235,0.18)" : "#eff6ff", color: "#2563eb", border: T.isDark ? "1px solid rgba(37,99,235,0.40)" : "1px solid #bfdbfe" }}>
                  <Package size={10} />
                  {movInsumo}
                  <span style={{ fontSize: "11px", fontWeight: 800, lineHeight: 1 }}>✕</span>
                </button>
              )}
            </div>

          </div>

          {/* Contenido */}
          <div style={{ flex: 1, minHeight: 0, overflowY: "auto", overflowX: "auto" }}>
            {vista === "entradas" ? (
              movLoading && movs.length === 0 ? (
                <div style={{ display: "flex", justifyContent: "center", padding: "64px 0" }}>
                  <RefreshCw size={24} style={{ color: TEAL.base, animation: "spin 1s linear infinite" }} />
                </div>
              ) : movs.length === 0 ? (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "64px 24px", gap: "10px" }}>
                  <div style={{ width: "52px", height: "52px", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", background: T.surfaceAlt, border: `1px solid ${T.border}` }}>
                    <Inbox size={24} style={{ color: T.textFaint }} />
                  </div>
                  <p style={{ margin: 0, fontSize: "13px", fontWeight: 600, color: T.textMuted }}>
                    {movInsumo ? `Sin entradas de "${movInsumo}" — ajusta los filtros` : "Sin entradas registradas — ajusta los filtros"}
                  </p>
                </div>
              ) : (
                <EntradasTable rows={movs} />
              )
            ) : loading ? (
              <div style={{ display: "flex", justifyContent: "center", padding: "64px 0" }}>
                <RefreshCw size={24} style={{ color: TEAL.base, animation: "spin 1s linear infinite" }} />
              </div>
            ) : filtrados.length === 0 ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "64px 24px", gap: "10px" }}>
                <div style={{ width: "52px", height: "52px", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", background: T.surfaceAlt, border: `1px solid ${T.border}` }}>
                  <Inbox size={24} style={{ color: T.textFaint }} />
                </div>
                <p style={{ margin: 0, fontSize: "13px", fontWeight: 600, color: T.textMuted }}>
                  {hayFiltros ? "Sin resultados — ajusta los filtros" : "No hay insumos registrados"}
                </p>
              </div>
            ) : (
              <DataTable rows={filasPagina} onEdit={setModal} onDetail={setDetalle} onEntrada={setEntrada} onHistorial={verEntradasInsumo} />
            )}
          </div>
          {/* Paginación — siempre visible, dentro del card */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 12px", borderTop: `1px solid ${T.border}`, background: T.bg, flexShrink: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <button
                disabled={vista === "insumos" ? paginaActual <= 1 : movPaginaActual <= 1}
                onClick={() => vista === "insumos" ? irPagina(paginaActual - 1) : setMovPagina(movPaginaActual - 1)}
                style={{ padding: "4px 10px", borderRadius: "6px", fontSize: "11px", fontWeight: 700, cursor: (vista === "insumos" ? paginaActual <= 1 : movPaginaActual <= 1) ? "not-allowed" : "pointer", border: `1px solid ${T.border}`, background: T.surfaceAlt, color: T.textMuted, opacity: (vista === "insumos" ? paginaActual <= 1 : movPaginaActual <= 1) ? 0.4 : 1 }}>
                Anterior
              </button>
              <button
                disabled={vista === "insumos" ? paginaActual >= totalPaginas : movPaginaActual >= movTotalPaginas}
                onClick={() => vista === "insumos" ? irPagina(paginaActual + 1) : setMovPagina(movPaginaActual + 1)}
                style={{ padding: "4px 10px", borderRadius: "6px", fontSize: "11px", fontWeight: 700, cursor: (vista === "insumos" ? paginaActual >= totalPaginas : movPaginaActual >= movTotalPaginas) ? "not-allowed" : "pointer", border: `1px solid ${T.border}`, background: T.surfaceAlt, color: T.textMuted, opacity: (vista === "insumos" ? paginaActual >= totalPaginas : movPaginaActual >= movTotalPaginas) ? 0.4 : 1 }}>
                Siguiente
              </button>
              <span style={{ fontSize: "11px", marginLeft: "6px", color: T.textMuted }}>
                {vista === "insumos"
                  ? `Página ${paginaActual} de ${totalPaginas}`
                  : `Página ${movPaginaActual} de ${movTotalPaginas}`}
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <label style={{ fontSize: "10px", color: T.textMuted }}>Mostrar</label>
              <select
                value={vista === "insumos" ? pageSize : movPageSize}
                onChange={e => {
                  if (vista === "insumos") { setPageSize(parseInt(e.target.value, 10)); setPagina(1); }
                  else { setMovPageSize(parseInt(e.target.value, 10)); setMovPagina(1); }
                }}
                style={{ padding: "4px", borderRadius: "6px", border: `1px solid ${T.border}`, background: T.surface, color: T.text, fontSize: "11px" }}>
                {PAGE_SIZES.map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
          </div>
        </div>

      </div>

      <style>{`@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>

      {detalle && (
        <ModalDetalleInsumo insumo={detalle} onClose={() => setDetalle(null)} T={T} />
      )}
      {modal !== null && (
        <ModalInsumo insumo={modal} categorias={categorias}
          onClose={() => setModal(null)} onSave={handleSave} T={T} />
      )}
      {entrada !== null && (
        <ModalEntradaInsumo insumo={entrada}
          onClose={() => setEntrada(null)}
          onSaved={() => { setEntrada(null); cargarInventario(false); cargarEntradas(); }}
          T={T} />
      )}

    </div>
  );
}
