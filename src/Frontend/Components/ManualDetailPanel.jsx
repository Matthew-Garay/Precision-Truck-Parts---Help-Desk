/**
 * ManualDetailPanel.jsx
 *
 * Panel lateral deslizable (drawer) que muestra el detalle completo
 * de un manual de incidencias seleccionado en la tabla.
 *
 * Se abre desde el lado derecho con animacion CSS. Incluye:
 *   - Portada del PDF generada con usePdfCover (miniatura de la primera pagina)
 *     con fondo difuminado del mismo PDF para rellenar el espacio.
 *   - Titulo, badge de categoria y metadatos (descripcion, fecha, tamano).
 *   - Boton primario para abrir el visor PDF en linea.
 *   - Enlace de descarga directa del PDF.
 *
 * Props:
 *   T        - tokens del tema activo
 *   manual   - objeto del manual seleccionado con nombre, descripcion,
 *              nombre_categoria, fecha_cambio
 *   pdfUrl   - URL completa del archivo PDF para previsualizar y descargar
 *   onClose  - funcion llamada al cerrar el panel o hacer clic en el overlay
 *   onVerPdf - funcion llamada al hacer clic en el boton "Ver PDF"
 */
import { useState } from "react";
import { X, Eye, Download, Tag, Calendar, HardDrive, FileText, AlignLeft } from "lucide-react";
import { usePdfCover } from "./usePdfCover";
import { NEUTRAL, SLATE, SEMANTIC, RADIUS } from "../Config/DesignSystem";

const ORANGE       = "#F47920";
const ORANGE_DARK  = "#d97400";
const ORANGE_LIGHT = "rgba(244,121,32,0.08)";
const ORANGE_BORDER = "rgba(244,121,32,0.22)";

// ── Fila de metadato ─────────────────────────────────────────────
function MetaRow({ icon: Icon, label, value, isDark }) {
  if (!value) return null;
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "8px 0", borderBottom: `1px solid ${isDark ? "rgba(255,255,255,0.05)" : SLATE[200]}` }}>
      <div style={{
        width: 28, height: 28, borderRadius: 6, flexShrink: 0,
        background: isDark ? "rgba(255,255,255,0.05)" : NEUTRAL.slate100,
        border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : SLATE[200]}`,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <Icon size={13} style={{ color: isDark ? "rgba(255,255,255,0.40)" : SLATE[400] }} />
      </div>
      <div style={{ minWidth: 0 }}>
        <p style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: isDark ? "rgba(255,255,255,0.30)" : SLATE[400], margin: 0 }}>
          {label}
        </p>
        <p style={{ fontSize: "12px", fontWeight: 500, color: isDark ? "rgba(255,255,255,0.75)" : SLATE[700], margin: "2px 0 0", wordBreak: "break-word" }}>
          {value}
        </p>
      </div>
    </div>
  );
}

// ── Portada PDF del panel ────────────────────────────────────────
function PanelCover({ url, isDark }) {
  const { imgSrc, loading } = usePdfCover(url);

  return (
    <div style={{
      width: "100%", height: 180, flexShrink: 0,
      background: isDark ? "#0d1117" : "#f1f5f9",
      display: "flex", alignItems: "center", justifyContent: "center",
      position: "relative", overflow: "hidden",
      borderBottom: `1px solid ${isDark ? "rgba(255,255,255,0.07)" : SLATE[200]}`,
    }}>
      {imgSrc ? (
        <>
          {/* Versión borrosa de fondo para rellenar */}
          <img src={imgSrc} alt="" aria-hidden style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", filter: "blur(12px) brightness(0.6)", transform: "scale(1.1)" }} />
          {/* Miniatura centrada con sombra */}
          <img src={imgSrc} alt="portada" style={{ position: "relative", height: "148px", width: "auto", maxWidth: "80%", objectFit: "contain", borderRadius: 4, boxShadow: "0 8px 32px rgba(0,0,0,0.40)" }} />
        </>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
          {loading
            ? <svg className="animate-spin" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={isDark ? "rgba(255,255,255,0.25)" : SLATE[300]} strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
            : <FileText size={32} style={{ color: isDark ? "rgba(255,255,255,0.12)" : SLATE[300] }} />
          }
          {!loading && <span style={{ fontSize: "9px", fontWeight: 800, letterSpacing: "0.07em", color: isDark ? "rgba(255,255,255,0.25)" : SLATE[300] }}>SIN VISTA PREVIA</span>}
        </div>
      )}

      {/* Badge PDF */}
      <span style={{
        position: "absolute", top: 10, right: 10,
        fontSize: "8px", fontWeight: 800, letterSpacing: "0.06em",
        padding: "2px 7px", borderRadius: 4,
        background: "rgba(220,38,38,0.85)", color: "#fff",
        backdropFilter: "blur(4px)",
      }}>
        PDF
      </span>
    </div>
  );
}

// ── Panel principal ──────────────────────────────────────────────
export default function ManualDetailPanel({ T, manual, pdfUrl, onClose, onVerPdf }) {
  const isDark = T.isDark;

  const fecha = manual?.fecha_cambio
    ? new Date(manual.fecha_cambio).toLocaleDateString("es-MX", { day: "2-digit", month: "long", year: "numeric" })
    : null;

  return (
    <>
      {/* Overlay semitransparente */}
      <div
        onClick={onClose}
        style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,0.25)", backdropFilter: "blur(1px)" }}
      />

      {/* Drawer */}
      <div style={{
        position: "fixed", top: 0, right: 0, bottom: 0, zIndex: 201,
        width: "min(400px, 92vw)",
        display: "flex", flexDirection: "column",
        background: isDark ? "#0f1117" : "#fff",
        boxShadow: "-8px 0 48px rgba(0,0,0,0.22)",
        animation: "drawerIn 0.22s cubic-bezier(0.16,1,0.3,1)",
      }}>
        <style>{`@keyframes drawerIn{from{transform:translateX(100%)}to{transform:translateX(0)}}`}</style>

        {/* ── Cabecera del drawer ────────────────────────────── */}
        <div style={{
          height: 52, padding: "0 16px", flexShrink: 0,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          borderBottom: `1px solid ${isDark ? "rgba(255,255,255,0.07)" : SLATE[200]}`,
          background: isDark ? "#141720" : NEUTRAL.white,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{
              width: 6, height: 6, borderRadius: "50%",
              background: `linear-gradient(135deg,${ORANGE},${ORANGE_DARK})`,
              boxShadow: `0 0 6px ${ORANGE}`,
            }} />
            <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", color: isDark ? "rgba(255,255,255,0.50)" : SLATE[500] }}>
              Detalle del manual
            </span>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 30, height: 30, borderRadius: 6,
              border: `1px solid ${isDark ? "rgba(255,255,255,0.10)" : SLATE[200]}`,
              background: "transparent",
              color: isDark ? "rgba(255,255,255,0.40)" : SLATE[400],
              cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
              transition: "all 0.15s",
            }}
            onMouseEnter={e => { e.currentTarget.style.background = isDark ? "rgba(255,255,255,0.07)" : NEUTRAL.slate100; e.currentTarget.style.color = isDark ? "#fff" : SLATE[700]; }}
            onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = isDark ? "rgba(255,255,255,0.40)" : SLATE[400]; }}
          >
            <X size={14} />
          </button>
        </div>

        {/* ── Cuerpo scrolleable ────────────────────────────── */}
        <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column" }}>

          {/* Portada */}
          <PanelCover url={pdfUrl} isDark={isDark} />

          {/* Título + categoría */}
          <div style={{ padding: "16px 20px 12px", borderBottom: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : SLATE[200]}` }}>
            <h2 style={{
              fontSize: 15, fontWeight: 700, margin: 0, lineHeight: 1.35,
              color: isDark ? "#eef0f2" : SLATE[900],
              letterSpacing: "-0.01em",
            }}>
              {manual.nombre}
            </h2>
            {manual.nombre_categoria && (
              <span style={{
                display: "inline-flex", alignItems: "center", gap: 4,
                marginTop: 8, fontSize: "10px", fontWeight: 700,
                padding: "3px 9px", borderRadius: "99px",
                background: ORANGE_LIGHT, color: ORANGE, border: `1px solid ${ORANGE_BORDER}`,
              }}>
                <Tag size={8} /> {manual.nombre_categoria}
              </span>
            )}
          </div>

          {/* Metadatos */}
          <div style={{ padding: "4px 20px 12px" }}>
            <MetaRow icon={AlignLeft}  label="Descripción"    value={manual.descripcion || "Sin descripción"} isDark={isDark} />
            <MetaRow icon={Tag}        label="Categoría"      value={manual.nombre_categoria} isDark={isDark} />
            <MetaRow icon={Calendar}   label="Fecha de carga" value={fecha} isDark={isDark} />
            <MetaRow icon={HardDrive}  label="Tamaño"         value={manual.tamaño} isDark={isDark} />
          </div>
        </div>

        {/* ── Footer con CTAs ───────────────────────────────── */}
        <div style={{
          padding: "12px 16px",
          borderTop: `1px solid ${isDark ? "rgba(255,255,255,0.07)" : SLATE[200]}`,
          background: isDark ? "#141720" : NEUTRAL.white,
          display: "flex", gap: 8, flexShrink: 0,
        }}>
          {/* Ver PDF — CTA primario naranja */}
          <button
            onClick={onVerPdf}
            style={{
              flex: 1, height: 38, borderRadius: 8,
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              background: `linear-gradient(135deg,${ORANGE},${ORANGE_DARK})`,
              color: "#fff", fontSize: 12, fontWeight: 700, border: "none", cursor: "pointer",
              boxShadow: `0 2px 10px rgba(244,121,32,0.28)`,
              transition: "filter 0.15s, box-shadow 0.15s",
            }}
            onMouseEnter={e => { e.currentTarget.style.filter = "brightness(1.08)"; e.currentTarget.style.boxShadow = `0 4px 16px rgba(244,121,32,0.38)`; }}
            onMouseLeave={e => { e.currentTarget.style.filter = "brightness(1)"; e.currentTarget.style.boxShadow = `0 2px 10px rgba(244,121,32,0.28)`; }}
          >
            <Eye size={14} /> Ver PDF
          </button>

          {/* Descargar — CTA secundario */}
          <a
            href={pdfUrl} download={manual.nombre}
            style={{
              flex: 1, height: 38, borderRadius: 8,
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              background: "transparent",
              border: `1.5px solid ${isDark ? "rgba(255,255,255,0.12)" : SLATE[200]}`,
              color: isDark ? "rgba(255,255,255,0.65)" : SLATE[600],
              fontSize: 12, fontWeight: 600, textDecoration: "none",
              transition: "all 0.15s",
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = ORANGE; e.currentTarget.style.color = ORANGE; e.currentTarget.style.background = ORANGE_LIGHT; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = isDark ? "rgba(255,255,255,0.12)" : SLATE[200]; e.currentTarget.style.color = isDark ? "rgba(255,255,255,0.65)" : SLATE[600]; e.currentTarget.style.background = "transparent"; }}
          >
            <Download size={14} /> Descargar
          </a>
        </div>
      </div>
    </>
  );
}
