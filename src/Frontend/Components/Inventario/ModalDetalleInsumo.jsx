import { useState, useEffect } from "react";
import { X, Package, Hash, Layers, Truck, Tag, AlignLeft, BarChart2 } from "lucide-react";

const ORANGE = "#F47920";

const ESTADO_META = {
  Excelente: { color: "#16a34a", bg: "rgba(22,163,74,0.08)",  border: "rgba(22,163,74,0.20)" },
  Bueno:     { color: "#2563eb", bg: "rgba(37,99,235,0.08)",  border: "rgba(37,99,235,0.20)" },
  Regular:   { color: "#d97706", bg: "rgba(217,119,6,0.08)",  border: "rgba(217,119,6,0.20)" },
  Malo:      { color: "#dc2626", bg: "rgba(220,38,38,0.08)",  border: "rgba(220,38,38,0.20)" },
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
      padding: "2px 9px", borderRadius: "99px",
      fontSize: "11px", fontWeight: 600,
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

export default function ModalDetalleInsumo({ insumo, onClose, T, ocultarStock = false }) {
  const [imgError, setImgError] = useState(false);
  const isDark = T?.isDark ?? false;

  useEffect(() => {
    const fn = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", fn);
    return () => document.removeEventListener("keydown", fn);
  }, [onClose]);

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
          width: "95%", maxWidth: "460px",
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

        {/* ── Header ── */}
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

        {/* ── Body ── */}
        <div style={{ flex: 1, overflowY: "auto" }}>

          {/* Imagen */}
          {imgSrc ? (
            <div style={{
              width: "100%", height: "180px",
              background: isDark ? "#1a2030" : "#f4f6f8",
              borderBottom: `1px solid ${border}`,
              overflow: "hidden",
            }}>
              <img
                src={imgSrc}
                alt={insumo.nombre}
                onError={() => setImgError(true)}
                style={{ width: "100%", height: "100%", objectFit: "contain" }}
              />
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

          <div style={{ padding: "16px 18px" }}>

            {/* Badges + stock */}
            <div style={{
              display: "flex", alignItems: "center",
              justifyContent: "space-between", gap: "8px",
              flexWrap: "wrap", marginBottom: "16px",
            }}>
              <div style={{ display: "flex", gap: "5px", flexWrap: "wrap" }}>
                {insumo.estado         && <Badge value={insumo.estado}         map={ESTADO_META} />}
                {!ocultarStock && insumo.disponibilidad && <Badge value={insumo.disponibilidad} map={DISP_META}   />}
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


            </div>

            {/* Datos */}
            <DataRow icon={Package}   label="Nombre"       value={insumo.nombre}                 T={T} />
            <DataRow icon={Layers}    label="Marca"        value={insumo.marca}                  T={T} />
            <DataRow icon={Layers}    label="Modelo"       value={insumo.modelo}                 T={T} />
            <DataRow icon={Hash}      label="N.º de serie" value={insumo.num_serie}               T={T} />
            <DataRow icon={Truck}     label="Proveedor"    value={insumo.proveedor}               T={T} />
            {!ocultarStock && (
              <DataRow
                icon={BarChart2}
                label="Stock"
                value={insumo.stock != null ? `${insumo.stock} unidad${insumo.stock !== 1 ? "es" : ""}` : null}
                T={T}
                highlight={
                  insumo.stock === 0 ? "#dc2626"
                  : insumo.stock < 5 ? "#d97706"
                  : "#16a34a"
                }
              />
            )}
            <DataRow icon={AlignLeft} label="Descripción"  value={insumo.descripcion?.trim() || null} T={T} multiline />
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
              padding: "6px 16px", borderRadius: "6px",
              fontSize: "12px", fontWeight: 600,
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
    </div>
  );
}
