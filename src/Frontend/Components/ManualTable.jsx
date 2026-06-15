import { useState } from "react";
import { MoreVertical, Download, Pencil, Trash2, FileText, Tag } from "lucide-react";
import { NEUTRAL, SLATE, SEMANTIC, RADIUS } from "../Config/DesignSystem";

const ORANGE       = "#F47920";
const ORANGE_LIGHT = "rgba(244,121,32,0.08)";
const ORANGE_BORDER = "rgba(244,121,32,0.22)";

// ── Columnas de la tabla ─────────────────────────────────────────
const COLS = [
  { key: "nombre",          label: "Nombre",          w: "auto" },
  { key: "nombre_categoria",label: "Categoría",        w: "140px" },
  { key: "fecha_cambio",    label: "Fecha de carga",   w: "128px" },
  { key: "tamaño",          label: "Tamaño",           w: "88px"  },
  { key: "_acciones",       label: "",                 w: "48px"  },
];

// ── Kebab menu ───────────────────────────────────────────────────
function KebabMenu({ T, pdfUrl, nombre, onEditar, onEliminar }) {
  const [open, setOpen] = useState(false);
  const isDark = T.isDark;

  return (
    <div style={{ position: "relative", display: "flex", justifyContent: "center" }}>
      <button
        onClick={e => { e.stopPropagation(); setOpen(p => !p); }}
        style={{
          width: 28, height: 28, borderRadius: "6px",
          border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : SLATE[200]}`,
          background: open ? (isDark ? "rgba(255,255,255,0.07)" : NEUTRAL.slate100) : "transparent",
          color: isDark ? "rgba(255,255,255,0.40)" : SLATE[400],
          cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
          transition: "all 0.15s",
        }}
        onMouseEnter={e => { e.currentTarget.style.background = isDark ? "rgba(255,255,255,0.07)" : NEUTRAL.slate100; e.currentTarget.style.color = isDark ? "#fff" : SLATE[700]; }}
        onMouseLeave={e => { if (!open) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = isDark ? "rgba(255,255,255,0.40)" : SLATE[400]; } }}
      >
        <MoreVertical size={13} />
      </button>

      {open && (
        <>
          <div style={{ position: "fixed", inset: 0, zIndex: 40 }} onClick={() => setOpen(false)} />
          <div style={{
            position: "absolute", top: "calc(100% + 4px)", right: 0, zIndex: 50,
            background: isDark ? "#1e2535" : "#fff",
            border: `1px solid ${isDark ? "rgba(255,255,255,0.10)" : SLATE[200]}`,
            borderRadius: "8px",
            boxShadow: "0 8px 24px rgba(0,0,0,0.16), 0 2px 8px rgba(0,0,0,0.08)",
            minWidth: "168px", overflow: "hidden",
            animation: "kbFadeIn 0.12s ease",
          }}>
            <style>{`@keyframes kbFadeIn{from{opacity:0;transform:translateY(-4px)}to{opacity:1;transform:translateY(0)}}`}</style>

            {/* Descargar */}
            <a
              href={pdfUrl} download={nombre}
              onClick={() => setOpen(false)}
              style={{
                display: "flex", alignItems: "center", gap: 9,
                padding: "9px 14px", textDecoration: "none",
                fontSize: "12px", fontWeight: 500,
                color: isDark ? "rgba(255,255,255,0.72)" : SLATE[700],
                borderBottom: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : SLATE[200]}`,
                transition: "background 0.1s",
              }}
              onMouseEnter={e => e.currentTarget.style.background = isDark ? "rgba(255,255,255,0.05)" : NEUTRAL.slate50}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}
            >
              <Download size={13} style={{ color: SLATE[400], flexShrink: 0 }} /> Descargar
            </a>

            {/* Editar */}
            <button
              onClick={() => { setOpen(false); onEditar(); }}
              style={{
                width: "100%", display: "flex", alignItems: "center", gap: 9,
                padding: "9px 14px", background: "none", border: "none",
                fontSize: "12px", fontWeight: 500, cursor: "pointer", textAlign: "left",
                color: isDark ? "rgba(255,255,255,0.72)" : SLATE[700],
                borderBottom: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : SLATE[200]}`,
                transition: "background 0.1s",
              }}
              onMouseEnter={e => e.currentTarget.style.background = isDark ? "rgba(255,255,255,0.05)" : NEUTRAL.slate50}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}
            >
              <Pencil size={13} style={{ color: SLATE[400], flexShrink: 0 }} /> Editar
            </button>

            {/* Eliminar */}
            <button
              onClick={() => { setOpen(false); onEliminar(); }}
              style={{
                width: "100%", display: "flex", alignItems: "center", gap: 9,
                padding: "9px 14px", background: "none", border: "none",
                fontSize: "12px", fontWeight: 500, cursor: "pointer", textAlign: "left",
                color: SEMANTIC.danger, transition: "background 0.1s",
              }}
              onMouseEnter={e => e.currentTarget.style.background = SEMANTIC.dangerBg}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}
            >
              <Trash2 size={13} style={{ flexShrink: 0 }} /> Eliminar
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// ── Fila de la tabla ─────────────────────────────────────────────
function FilaManual({ T, manual, pdfUrl, seleccionado, onSeleccionar, onEditar, onEliminar }) {
  const [hov, setHov] = useState(false);
  const isDark = T.isDark;
  const activo = seleccionado;

  const fecha = manual.fecha_cambio
    ? new Date(manual.fecha_cambio).toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" })
    : "—";

  const rowBg = activo
    ? (isDark ? "rgba(244,121,32,0.08)" : "#fff7ed")
    : hov
      ? (isDark ? "rgba(255,255,255,0.03)" : NEUTRAL.slate50)
      : "transparent";

  return (
    <tr
      onClick={onSeleccionar}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: rowBg,
        cursor: "pointer",
        transition: "background 0.12s",
        borderBottom: `1px solid ${isDark ? "rgba(255,255,255,0.05)" : SLATE[200]}`,
        outline: activo ? `2px solid ${ORANGE_BORDER}` : "none",
        outlineOffset: "-2px",
      }}
    >
      {/* Nombre */}
      <td style={{ padding: "10px 16px", verticalAlign: "middle" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {/* Icono PDF */}
          <div style={{
            width: 28, height: 34, borderRadius: 4, flexShrink: 0,
            background: isDark ? "rgba(220,38,38,0.10)" : "#fef2f2",
            border: "1px solid rgba(220,38,38,0.18)",
            display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center", gap: 1,
          }}>
            <FileText size={12} style={{ color: "#dc2626" }} />
            <span style={{ fontSize: "6px", fontWeight: 800, color: "#dc2626", letterSpacing: "0.04em" }}>PDF</span>
          </div>
          <span style={{
            fontSize: "13px", fontWeight: 600,
            color: activo ? ORANGE : (isDark ? "#eef0f2" : SLATE[900]),
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            maxWidth: "280px",
            transition: "color 0.12s",
          }}>
            {manual.nombre}
          </span>
        </div>
      </td>

      {/* Categoría */}
      <td style={{ padding: "10px 16px", verticalAlign: "middle" }}>
        {manual.nombre_categoria ? (
          <span style={{
            display: "inline-flex", alignItems: "center", gap: 4,
            fontSize: "11px", fontWeight: 600, padding: "2px 8px", borderRadius: "99px",
            background: ORANGE_LIGHT, color: ORANGE, border: `1px solid ${ORANGE_BORDER}`,
            whiteSpace: "nowrap",
          }}>
            <Tag size={8} /> {manual.nombre_categoria}
          </span>
        ) : (
          <span style={{ fontSize: "12px", color: isDark ? "rgba(255,255,255,0.22)" : SLATE[400] }}>—</span>
        )}
      </td>

      {/* Fecha */}
      <td style={{ padding: "10px 16px", verticalAlign: "middle" }}>
        <span style={{ fontSize: "12px", color: isDark ? "rgba(255,255,255,0.45)" : SLATE[600], whiteSpace: "nowrap" }}>
          {fecha}
        </span>
      </td>

      {/* Tamaño */}
      <td style={{ padding: "10px 16px", verticalAlign: "middle" }}>
        <span style={{
          fontSize: "11px", fontWeight: 500,
          color: isDark ? "rgba(255,255,255,0.35)" : SLATE[500],
          whiteSpace: "nowrap",
        }}>
          {manual.tamaño || "—"}
        </span>
      </td>

      {/* Acciones — kebab */}
      <td style={{ padding: "10px 12px", verticalAlign: "middle" }} onClick={e => e.stopPropagation()}>
        <KebabMenu
          T={T}
          pdfUrl={pdfUrl}
          nombre={manual.nombre}
          onEditar={onEditar}
          onEliminar={onEliminar}
        />
      </td>
    </tr>
  );
}

// ── DataGrid principal ───────────────────────────────────────────
export default function ManualTable({
  T, manuales, pdfBase,
  manualSeleccionado, onSeleccionar,
  onEditar, onEliminar,
}) {
  const isDark = T.isDark;
  const surf   = isDark ? "#141720" : NEUTRAL.white;
  const border = isDark ? "rgba(255,255,255,0.07)" : SLATE[200];

  return (
    <div style={{
      background: surf,
      border: `1px solid ${border}`,
      borderRadius: "10px",
      overflow: "hidden",
      boxShadow: isDark ? "0 2px 12px rgba(0,0,0,0.25)" : "0 1px 4px rgba(0,0,0,0.05)",
      flex: 1,
      minWidth: 0,
    }}>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed" }}>

          {/* Cabecera */}
          <colgroup>
            <col style={{ width: "auto" }} />
            <col style={{ width: "140px" }} />
            <col style={{ width: "128px" }} />
            <col style={{ width: "88px" }} />
            <col style={{ width: "48px" }} />
          </colgroup>

          <thead>
            <tr style={{ borderBottom: `2px solid ${border}` }}>
              {COLS.map(col => (
                <th
                  key={col.key}
                  style={{
                    padding: "10px 16px",
                    textAlign: col.key === "_acciones" ? "center" : "left",
                    fontSize: "10px", fontWeight: 700,
                    letterSpacing: "0.07em", textTransform: "uppercase",
                    color: isDark ? "rgba(255,255,255,0.35)" : SLATE[500],
                    background: isDark ? "rgba(255,255,255,0.02)" : NEUTRAL.slate50,
                    whiteSpace: "nowrap",
                    userSelect: "none",
                  }}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {manuales.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: "56px 24px", textAlign: "center" }}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                    <FileText size={28} style={{ color: isDark ? "rgba(255,255,255,0.12)" : SLATE[300] }} />
                    <span style={{ fontSize: "13px", fontWeight: 600, color: isDark ? "rgba(255,255,255,0.30)" : SLATE[400] }}>
                      No hay manuales
                    </span>
                  </div>
                </td>
              </tr>
            ) : (
              manuales.map(m => (
                <FilaManual
                  key={m.id_manual}
                  T={T}
                  manual={m}
                  pdfUrl={`${pdfBase}${m.url}`}
                  seleccionado={manualSeleccionado?.id_manual === m.id_manual}
                  onSeleccionar={() => onSeleccionar(m)}
                  onEditar={() => onEditar(m)}
                  onEliminar={() => onEliminar(m)}
                />
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
