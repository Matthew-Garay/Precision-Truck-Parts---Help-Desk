/**
 * ExportarInventario.jsx
 *
 * Exportación del inventario a Excel (con fotos) y a PDF imprimible, y el
 * botón de exportar.
 *
 * Extraído de pages/Admin/Inventario.jsx para facilitar su mantenimiento.
 */
import { useState, useEffect, useRef } from "react";
import { Download, FileSpreadsheet, FileText } from "lucide-react";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import { FS } from '../../utils/tipografia.js';
import { STOCK_BAJO } from '../../utils/stock.js';


// ── Helpers ───────────────────────────────────────────────────────
export async function urlToBase64(url) {
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


export async function toJpegBase64(dataUrl) {
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
export async function toPngBase64White(dataUrl, w, h) {
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
export async function exportarExcel(datos) {
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

  const ESTADO_COLORS = { Excelente: "FF15803D", Bueno: "FF2563EB", Regular: "FFA16207", Malo: "FFB91C1C", "Dañado": "FF7F1D1D" };

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
    const stockArgb = stockVal === 0 ? "FFB91C1C" : stockVal <= STOCK_BAJO ? "FFD97706" : "FF15803D";
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
export function abrirImpresion(url) {
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
export function exportarPDF(datos, filtrosAplicados = []) {
  sessionStorage.setItem("print_inventario_datos", JSON.stringify({ rows: datos, filtros: filtrosAplicados }));
  abrirImpresion("/print/inventario");
}


export function BtnExportar({ datos, T, vista = "insumos", filtros = [], onPdf }) {
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
          color: "#0d9488", fontSize: FS.secundario, fontWeight: 600, cursor: "pointer",
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
                fontSize: FS.cuerpo, fontWeight: 500,
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
