import { useState, useEffect } from "react";
import { X, Package, Hash, Layers, Tag, AlignLeft, BarChart2, ZoomIn } from "lucide-react";

const ORANGE = "var(--color-primary)";

const ESTADO_META = {
  Excelente: { color: "#16a34a", bg: "rgba(22,163,74,0.08)",  border: "rgba(22,163,74,0.20)" },
  Bueno:       { color: "#16a34a", bg: "rgba(22,163,74,0.08)",  border: "rgba(22,163,74,0.20)" },
  Regular:   { color: "#d97706", bg: "rgba(217,119,6,0.08)",  border: "rgba(217,119,6,0.20)" },
  Malo:      { color: "#dc2626", bg: "rgba(220,38,38,0.08)",  border: "rgba(220,38,38,0.20)" },
  Dañado:    { color: "#7f1d1d", bg: "rgba(127,29,29,0.08)",  border: "rgba(127,29,29,0.20)" },
};
const DISP_META = {
  Disponible:   { color: "#16a34a", bg: "rgba(22,163,74,0.08)",  border: "rgba(22,163,74,0.20)" },
  "Stock bajo": { color: "#d97706", bg: "rgba(217,119,6,0.08)",  border: "rgba(217,119,6,0.20)" },
  "Sin stock":  { color: "#dc2626", bg: "rgba(220,38,38,0.08)",  border: "rgba(220,38,38,0.20)" },
};

function Badge({ value, map }) {
  const s = map[value] ?? { color: "#94a3b8", bg: "rgba(148,163,184,0.08)", border: "rgba(148,163,184,0.20)" };
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: "4px",
      padding: "14px 16px", borderRadius: "99px",
      fontSize: "14px", fontWeight: 500,
      background: s.bg, color: s.color, border: `1px solid ${s.border}`,
    }}>
      <span style={{ width: "4px", height: "4px", borderRadius: "50%", background: s.color, flexShrink: 0 }} />
      {value}
    </span>
  );
}

function DataRow({ icon: Icon, label, value, T, multiline = false, highlight }) {
  if (!value && value !== 0) return null;
  const isDark = T?.isDark;
  return (
    <div style={{
      display: "grid", gridTemplateColumns: "14px 108px 1fr",
      alignItems: multiline ? "flex-start" : "baseline", gap: "10px",
      padding: "8px 0",
      borderBottom: `1px solid ${isDark ? "rgba(255,255,255,0.05)" : "#f1f5f9"}`,
    }}>
      <Icon size={12} style={{ color: isDark ? "rgba(255,255,255,0.22)" : "#c0c9d6", marginTop: multiline ? "2px" : "1px" }} />
      <span style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: isDark ? "rgba(255,255,255,0.30)" : "#a0aec0", paddingTop: multiline ? "1px" : 0 }}>
        {label}
      </span>
      <span style={{ fontSize: "13px", color: highlight ?? (T?.text ?? "#1a202c"), fontWeight: highlight ? 700 : 500, lineHeight: multiline ? "1.55" : "inherit" }}>
        {value}
      </span>
    </div>
  );
}

function SpecCard({ icon: Icon, label, value, isDark, mono = false }) {
  if (!value && value !== 0) return null;
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: "9px",
      padding: "10px 12px", borderRadius: "8px",
      background: isDark ? "rgba(255,255,255,0.02)" : "#f8fafc",
      border: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "#e8ecf0"}`,
      minWidth: 0,
    }}>
      <div style={{
        width: "28px", height: "28px", borderRadius: "7px", flexShrink: 0,
        background: isDark ? "rgba(244,121,32,0.12)" : "rgba(244,121,32,0.09)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <Icon size={13} style={{ color: ORANGE }} />
      </div>
      <div style={{ minWidth: 0, flex: 1 }}>
        <p style={{
          margin: 0, fontSize: "14px", fontWeight: 600, textTransform: "uppercase",
          letterSpacing: "0.08em", color: isDark ? "rgba(255,255,255,0.30)" : "#a0aec0",
        }}>
          {label}
        </p>
        <p style={{
          margin: "2px 0 0",
          fontSize: mono ? "11px" : "13px", fontWeight: 600,
          fontFamily: mono ? "'JetBrains Mono','Courier New',monospace" : "inherit",
          color: isDark ? "#e2e8f0" : "#1a202c",
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        }}>
          {value}
        </p>
      </div>
    </div>
  );
}

export default function ModalDetalleInsumo({ insumo, onClose, T, ocultarStock = false }) {
  const [imgError, setImgError] = useState(false);
  const [ampliar, setAmpliar] = useState(false);   // imagen en grande
  const isDark = T?.isDark ?? false;

  useEffect(() => { if (imgError) setAmpliar(false); }, [imgError]);

  // Escape cierra primero la imagen ampliada y despues el modal
  useEffect(() => {
    const fn = (e) => {
      if (e.key !== "Escape") return;
      if (ampliar) setAmpliar(false);
      else onClose();
    };
    document.addEventListener("keydown", fn);
    return () => document.removeEventListener("keydown", fn);
  }, [ampliar, onClose]);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  if (!insumo) return null;

  const imgSrc     = insumo.imagen_url && !imgError ? insumo.imagen_url : null;

  const surface    = isDark ? "#161B22" : "#ffffff";
  const surfaceAlt = isDark ? "#1a2030" : "#f8fafc";
  const border     = isDark ? "rgba(255,255,255,0.07)" : "#e8ecf0";
  const textMain   = T?.text    ?? (isDark ? "#e2e8f0" : "#1a202c");
  const textMuted  = T?.textMuted ?? (isDark ? "#8b949e" : "#64748b");
  const textFaint  = T?.textFaint ?? (isDark ? "rgba(255,255,255,0.25)" : "#a0aec0");

  // Color del stock según nivel (mismo criterio que la tabla de inventario)
  const stockVal   = insumo.stock ?? 0;
  const stockColor = stockVal === 0 ? "#dc2626" : stockVal <= 3 ? "#d97706" : "#16a34a";

  return (
    <div
      role="presentation"
      style={{
        position: "fixed", inset: 0, zIndex: 1000,
        background: isDark ? "rgba(0,0,0,0.55)" : "rgba(15,23,42,0.40)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "16px",
        animation: "dmFade 0.15s ease",
      }}
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <style>{`
        @keyframes dmFade   { from{opacity:0} to{opacity:1} }
        @keyframes dmSlide  { from{opacity:0;transform:translateY(-5px)} to{opacity:1;transform:translateY(0)} }
      `}</style>

      <div
        role="dialog"
        aria-modal="true"
        style={{
          width: "95%", maxWidth: "560px",
          background: surface,
          border: `1px solid ${border}`,
          borderRadius: "10px",
          display: "flex", flexDirection: "column",
          maxHeight: "90vh", overflow: "hidden",
          boxShadow: isDark
            ? "0 16px 40px rgba(0,0,0,0.50), 0 1px 0 rgba(255,255,255,0.04) inset"
            : "0 16px 40px rgba(15,23,42,0.12), 0 1px 3px rgba(15,23,42,0.06)",
          animation: "dmSlide 0.18s ease",
        }}
      >
        {/* Línea acento naranja */}
        <div style={{ height: "2px", flexShrink: 0, background: ORANGE, borderRadius: "10px 10px 0 0" }} />

        {/* Header */}
        <div style={{
          padding: "14px 18px 12px",
          background: surface,
          borderBottom: `1px solid ${border}`,
          display: "flex", alignItems: "flex-start", justifyContent: "space-between",
          gap: "12px", flexShrink: 0,
        }}>
          <div style={{ minWidth: 0, flex: 1 }}>
            <p style={{ margin: 0, fontSize: "0.85rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.09em", color: ORANGE }}>
              Insumo
            </p>
            <h2 style={{ margin: "3px 0 0", fontSize: "16px", fontWeight: 700, color: textMain, letterSpacing: "-0.02em", lineHeight: 1.2 }}>
              {insumo.nombre}
            </h2>
            {(insumo.marca || insumo.modelo) && (
              <p style={{ margin: "4px 0 0", fontSize: "12px", color: textMuted, fontWeight: 400 }}>
                {[insumo.marca, insumo.modelo].filter(Boolean).join(" · ")}
              </p>
            )}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexShrink: 0, paddingTop: "2px" }}>
            {/* Logo adaptativo al tema */}
            <img
              src={isDark ? "/assets/img/logo blanco.png" : "/assets/img/logo negro.png"}
              alt="Precision Trucks"
              style={{ height: "28px", width: "auto", objectFit: "contain", opacity: isDark ? 0.80 : 0.70 }}
            />
            <button
              onClick={onClose}
              aria-label="Cerrar"
              style={{
                width: "26px", height: "26px",
                display: "flex", alignItems: "center", justifyContent: "center",
                background: "transparent",
                border: `1px solid ${border}`,
                borderRadius: "6px", cursor: "pointer",
                color: textFaint,
                transition: "all 0.12s",
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = textMuted; e.currentTarget.style.color = textMain; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = border; e.currentTarget.style.color = textFaint; }}
            >
              <X size={12} strokeWidth={2} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: "auto" }}>

          {/* Imagen — clic para verla en grande */}
          {imgSrc ? (
            <div style={{ position: "relative" }}>
              <button
                type="button"
                onClick={() => setAmpliar(true)}
                title="Ver imagen en grande"
                aria-label={`Ampliar imagen de ${insumo.nombre}`}
                style={{
                  display: "block", width: "100%", height: "180px", padding: 0, border: "none",
                  background: isDark ? "#1a2030" : "#f4f6f8",
                  borderBottom: `1px solid ${border}`,
                  overflow: "hidden", cursor: "zoom-in",
                }}>
                <img
                  src={imgSrc}
                  alt={insumo.nombre}
                  onError={() => setImgError(true)}
                  style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }}
                />
              </button>
              {/* Pista visual de que se puede ampliar */}
              <span style={{
                position: "absolute", right: 8, bottom: 8,
                display: "inline-flex", alignItems: "center", gap: 4,
                padding: "3px 8px", borderRadius: "99px",
                fontSize: 10, fontWeight: 700,
                background: isDark ? "rgba(0,0,0,0.55)" : "rgba(255,255,255,0.85)",
                color: isDark ? "rgba(255,255,255,0.8)" : "#475569",
                border: `1px solid ${border}`, pointerEvents: "none",
              }}>
                <ZoomIn size={11} /> Ampliar
              </span>
            </div>
          ) : (
            <div style={{
              width: "100%", height: "60px",
              background: isDark ? "#1a2030" : "#f4f6f8",
              borderBottom: `1px solid ${border}`,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Package size={20} style={{ color: isDark ? "rgba(255,255,255,0.08)" : "#d1d5db" }} />
            </div>
          )}

          <div style={{ padding: "16px 18px", display: "flex", flexDirection: "column", gap: "16px" }}>

            {/* Badges: estado / disponibilidad / categoría */}
            <div style={{ display: "flex", gap: "5px", flexWrap: "wrap" }}>
              {insumo.estado && <Badge value={insumo.estado} map={ESTADO_META} />}
              {!ocultarStock && insumo.disponibilidad && <Badge value={insumo.disponibilidad} map={DISP_META} />}
              {insumo.nombre_categoria && (
                <span style={{
                  display: "inline-flex", alignItems: "center", gap: "4px",
                  padding: "2px 9px", borderRadius: "99px", fontSize: "0.95rem", fontWeight: 600,
                  background: isDark ? "rgba(244,121,32,0.10)" : "rgba(244,121,32,0.08)",
                  color: ORANGE, border: `1px solid rgba(244,121,32,0.22)`,
                }}>
                  <Tag size={9} />{insumo.nombre_categoria}
                </span>
              )}
            </div>

            {/* Stock destacado (solo admin / cuando aplica) */}
            {!ocultarStock && insumo.stock != null && (
              <div style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "12px 14px", borderRadius: "10px",
                background: stockColor === "#dc2626"
                  ? (isDark ? "rgba(220,38,38,0.08)" : "#fef2f2")
                  : stockColor === "#d97706"
                    ? (isDark ? "rgba(217,119,6,0.08)" : "#fffbeb")
                    : (isDark ? "rgba(22,163,74,0.08)" : "#f0fdf4"),
                border: `1px solid ${stockColor === "#dc2626"
                  ? "rgba(220,38,38,0.25)"
                  : stockColor === "#d97706"
                    ? "rgba(217,119,6,0.25)"
                    : "rgba(22,163,74,0.25)"}`,
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <BarChart2 size={16} style={{ color: stockColor }} />
                  <span style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: textMuted }}>
                    Stock disponible
                  </span>
                </div>
                <span style={{ fontSize: "22px", fontWeight: 800, color: stockColor, fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>
                  {insumo.stock}
                  <span style={{ fontSize: "11px", fontWeight: 600, marginLeft: "3px", color: textMuted }}>
                    unid.
                  </span>
                </span>
              </div>
            )}

            {/* Especificaciones (tarjetas) */}
            {(insumo.marca || insumo.modelo || insumo.num_serie) && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                <SpecCard icon={Layers} label="Marca"        value={insumo.marca}    isDark={isDark} />
                <SpecCard icon={Layers} label="Modelo"       value={insumo.modelo}   isDark={isDark} />
                <SpecCard icon={Hash}   label="N.º de serie" value={insumo.num_serie} isDark={isDark} mono />
              </div>
            )}

            {/* ── Descripción ── */}
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "5px", marginBottom: "6px" }}>
                <AlignLeft size={12} style={{ color: ORANGE }} />
                <span style={{ fontSize: "10px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", color: textMuted }}>
                  Descripción
                </span>
              </div>
              {insumo.descripcion?.trim() ? (
                <p style={{
                  margin: 0, fontSize: "13px", lineHeight: "1.65",
                  color: isDark ? "#cbd5e1" : "#475569",
                  whiteSpace: "pre-wrap", wordBreak: "break-word",
                  padding: "12px 14px", borderRadius: "8px",
                  background: isDark ? "rgba(255,255,255,0.02)" : "#f8fafc",
                  border: `1px solid ${border}`,
                  borderLeft: `3px solid ${ORANGE}`,
                }}>
                  {insumo.descripcion.trim()}
                </p>
              ) : (
                <p style={{
                  margin: 0, fontSize: "12px", fontStyle: "italic",
                  color: textFaint, padding: "12px 14px", borderRadius: "8px",
                  background: isDark ? "rgba(255,255,255,0.015)" : "#fafbfc",
                  border: `1px dashed ${border}`,
                }}>
                  Sin descripción registrada
                </p>
              )}
            </div>
          </div>
        </div>

        {/* ── Footer ── */}
        <div style={{
          padding: "10px 18px",
          borderTop: `1px solid ${border}`,
          background: surfaceAlt,
          display: "flex", justifyContent: "flex-end",
          flexShrink: 0,
        }}>
          <button
            onClick={onClose}
            style={{
              padding: "14px 24px", borderRadius: "6px",
              fontSize: "14px", fontWeight: 600,
              background: "transparent",
              border: `1px solid ${border}`,
              color: textMuted, cursor: "pointer", transition: "all 0.12s",
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = textMuted; e.currentTarget.style.color = textMain; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = border; e.currentTarget.style.color = textMuted; }}
          >
            Cerrar
          </button>
        </div>
      </div>

      {/* ── Imagen en grande ── */}
      {ampliar && imgSrc && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Imagen de ${insumo.nombre} en grande`}
          onMouseDown={(e) => { if (e.target === e.currentTarget) setAmpliar(false); }}
          style={{
            position: "fixed", inset: 0, zIndex: 1100,
            background: "rgba(0,0,0,0.88)",
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: "24px", cursor: "zoom-out", animation: "dmFade 0.15s ease",
          }}
        >
          <img
            src={imgSrc}
            alt={insumo.nombre}
            onClick={() => setAmpliar(false)}
            style={{
              maxWidth: "100%", maxHeight: "100%",
              objectFit: "contain",
              borderRadius: "8px",
              boxShadow: "0 20px 60px rgba(0,0,0,0.55)",
            }}
          />
          <button
            type="button"
            onClick={() => setAmpliar(false)}
            aria-label="Cerrar imagen"
            title="Cerrar (Esc)"
            style={{
              position: "absolute", top: 16, right: 16,
              width: "34px", height: "34px",
              display: "flex", alignItems: "center", justifyContent: "center",
              background: "rgba(255,255,255,0.12)",
              border: "1px solid rgba(255,255,255,0.25)",
              borderRadius: "8px", cursor: "pointer", color: "#fff",
              transition: "background 0.12s",
            }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.22)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.12)"; }}
          >
            <X size={16} strokeWidth={2} />
          </button>
          <p style={{
            position: "absolute", bottom: 16, left: 0, right: 0,
            margin: 0, textAlign: "center",
            fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.75)",
            pointerEvents: "none",
          }}>
            {insumo.nombre} · clic o Esc para cerrar
          </p>
        </div>
      )}
    </div>
  );
}
