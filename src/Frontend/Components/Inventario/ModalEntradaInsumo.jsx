/**
 * ModalEntradaInsumo.jsx — Registrar ENTRADA de material de un insumo
 *
 * Suma stock y deja el movimiento en `movimiento_inventario` via
 * POST /api/solicitudes/insumos/:id/entrada (solo admin).
 * La ruta del material NO se captura aqui: el admin la define sobre la
 * solicitud (tarjeta "Ruta del material" en la vista de solicitud).
 * Mismo sistema visual que ModalInsumo.
 */
import { useState, useEffect, useRef } from "react";
import { X, ArrowDownToLine } from "lucide-react";
import { apiFetch, API_ROUTES } from "../../Config/api";
import { useToast } from "../Feedback";

const TEAL = "#0d9488";

function Field({ label, htmlFor, required, children, textFaint }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
      <label htmlFor={htmlFor} style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: textFaint }}>
        {label}{required && <span style={{ color: "#F47920", marginLeft: "2px" }}>*</span>}
      </label>
      {children}
    </div>
  );
}

export default function ModalEntradaInsumo({ insumo, onClose, onSaved, T }) {
  const isDark  = T?.isDark ?? false;
  const toast   = useToast();
  const firstRef = useRef(null);

  const [cantidad, setCantidad] = useState("");
  const [motivo,   setMotivo]   = useState("");
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState("");

  useEffect(() => { firstRef.current?.focus(); }, []);

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

  /* ── Tokens (mismos de ModalInsumo) ── */
  const surface     = isDark ? "#161B22" : "#ffffff";
  const surfaceAlt  = isDark ? "#1a2030" : "#f8fafc";
  const border      = isDark ? "rgba(255,255,255,0.07)" : "#e8ecf0";
  const borderFocus = "#2563eb";
  const textMain    = T?.text     ?? (isDark ? "#e2e8f0" : "#1a202c");
  const textMuted   = T?.textMuted ?? (isDark ? "#8b949e" : "#64748b");
  const textFaint   = T?.textFaint ?? (isDark ? "rgba(255,255,255,0.30)" : "#a0aec0");
  const inputBg     = isDark ? "rgba(255,255,255,0.04)" : "#f8fafc";

  const inp = {
    background: inputBg,
    border: `1px solid ${border}`,
    borderRadius: "6px",
    padding: "0 10px",
    height: "34px",
    fontSize: "13px",
    color: textMain,
    outline: "none",
    width: "100%",
    boxSizing: "border-box",
    colorScheme: isDark ? "dark" : "light",
    transition: "border-color 0.12s, box-shadow 0.12s",
  };

  const onFocus = e => {
    e.target.style.borderColor = borderFocus;
    e.target.style.boxShadow   = "0 0 0 3px rgba(37,99,235,0.10)";
    e.target.style.background  = isDark ? "rgba(255,255,255,0.07)" : "#fff";
  };
  const onBlur = e => {
    e.target.style.borderColor = border;
    e.target.style.boxShadow   = "none";
    e.target.style.background  = inputBg;
  };

  const stockActual = Number(insumo?.stock) || 0;
  const previsual   = stockActual + (parseInt(cantidad, 10) || 0);

  /* ── Submit ── */
  const handleSubmit = async e => {
    e?.preventDefault();
    const cant = parseInt(cantidad, 10);
    if (!Number.isFinite(cant) || cant < 1) return setError("La cantidad debe ser al menos 1.");
    if (motivo.length > 500)              return setError("El motivo no puede superar los 500 caracteres.");

    setSaving(true);
    setError("");
    try {
      const r = await apiFetch(API_ROUTES.INSUMO_ENTRADA(insumo.id_insumo), {
        method: "POST",
        body: {
          cantidad: cant,
          motivo:   motivo.trim() || null,
        },
      });
      const data = await r.json();
      if (!r.ok) return setError(data.error || "Error al registrar la entrada.");

      toast.success(`Entrada registrada: +${cant} pza. — stock ${data.stock_anterior} → ${data.stock_nuevo}`);
      onSaved(data);
    } catch {
      setError("Error de conexión. Intenta de nuevo.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      role="presentation"
      style={{
        position: "fixed", inset: 0, zIndex: 1000,
        background: isDark ? "rgba(0,0,0,0.55)" : "rgba(15,23,42,0.40)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "16px",
        animation: "meF 0.15s ease",
      }}
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <style>{`
        @keyframes meF { from{opacity:0} to{opacity:1} }
        @keyframes meS { from{opacity:0;transform:translateY(-5px)} to{opacity:1;transform:translateY(0)} }
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
          maxHeight: "92vh", overflow: "hidden",
          boxShadow: isDark
            ? "0 16px 40px rgba(0,0,0,0.50), 0 1px 0 rgba(255,255,255,0.04) inset"
            : "0 16px 40px rgba(15,23,42,0.12), 0 1px 3px rgba(15,23,42,0.06)",
          animation: "meS 0.18s ease",
        }}
      >
        {/* Línea acento */}
        <div style={{ height: "2px", flexShrink: 0, background: TEAL, borderRadius: "10px 10px 0 0" }} />

        {/* ── Header ── */}
        <div style={{
          padding: "14px 18px 12px",
          borderBottom: `1px solid ${border}`,
          display: "flex", alignItems: "flex-start", justifyContent: "space-between",
          gap: "12px", flexShrink: 0,
        }}>
          <div style={{ minWidth: 0, flex: 1 }}>
            <p style={{ margin: 0, fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.09em", color: TEAL }}>
              Entrada de material
            </p>
            <h2 style={{ margin: "3px 0 0", fontSize: "16px", fontWeight: 700, color: textMain, letterSpacing: "-0.02em", lineHeight: 1.2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {insumo?.nombre}
            </h2>
            <p style={{ margin: "3px 0 0", fontSize: "12px", color: textMuted }}>
              Stock actual: <strong style={{ color: textMain }}>{stockActual}</strong> pza. · quedará en <strong style={{ color: "#16a34a" }}>{previsual}</strong>
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexShrink: 0, paddingTop: "2px" }}>
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
                background: "transparent", border: `1px solid ${border}`,
                borderRadius: "6px", cursor: "pointer", color: textFaint,
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
        <div style={{ flex: 1, overflowY: "auto", padding: "16px 18px" }}>
          <form id="form-entrada" onSubmit={handleSubmit} noValidate style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {/* Cantidad */}
            <Field htmlFor="fe-cantidad" label="Cantidad a ingresar" required textFaint={textFaint}>
              <input id="fe-cantidad" ref={firstRef} type="number" min={1} step={1} inputMode="numeric"
                value={cantidad} onChange={e => setCantidad(e.target.value)}
                placeholder="Ej. 25"
                style={inp} onFocus={onFocus} onBlur={onBlur} />
            </Field>

            {/* Motivo / referencia */}
            <Field htmlFor="fe-motivo" label="Motivo / folio de compra" textFaint={textFaint}>
              <input id="fe-motivo" type="text" maxLength={500}
                value={motivo} onChange={e => setMotivo(e.target.value)}
                placeholder="Compra, devolución, donación…"
                style={inp} onFocus={onFocus} onBlur={onBlur} />
            </Field>

            <p style={{ margin: 0, fontSize: "10px", lineHeight: 1.5, color: textFaint }}>
              La ruta del material (de qué sucursal sale y a cuál llega) se define en la
              solicitud del insumo, no al capturar la entrada.
            </p>

            {/* Error */}
            {error && (
              <p role="alert" style={{
                margin: 0, padding: "8px 12px", borderRadius: "6px",
                fontSize: "12px", fontWeight: 500, color: "#dc2626",
                background: isDark ? "rgba(220,38,38,0.10)" : "#fef2f2",
                border: `1px solid ${isDark ? "rgba(220,38,38,0.25)" : "#fecaca"}`,
              }}>
                {error}
              </p>
            )}
          </form>
        </div>

        {/* ── Footer ── */}
        <div style={{
          padding: "10px 18px",
          borderTop: `1px solid ${border}`,
          background: surfaceAlt,
          display: "flex", alignItems: "center", justifyContent: "flex-end",
          gap: "8px", flexShrink: 0,
        }}>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            style={{
              padding: "6px 16px", borderRadius: "6px",
              fontSize: "12px", fontWeight: 600,
              background: "transparent", border: `1px solid ${border}`,
              color: textMuted, cursor: "pointer", transition: "all 0.12s",
              opacity: saving ? 0.5 : 1,
            }}
            onMouseEnter={e => { if (!saving) { e.currentTarget.style.borderColor = textMuted; e.currentTarget.style.color = textMain; }}}
            onMouseLeave={e => { e.currentTarget.style.borderColor = border; e.currentTarget.style.color = textMuted; }}
          >
            Cancelar
          </button>
          <button
            type="submit"
            form="form-entrada"
            disabled={saving}
            style={{
              display: "inline-flex", alignItems: "center", gap: "6px",
              padding: "6px 18px", borderRadius: "6px",
              fontSize: "12px", fontWeight: 700,
              background: saving ? `${TEAL}99` : TEAL,
              border: "none", color: "#fff",
              cursor: saving ? "not-allowed" : "pointer",
              transition: "opacity 0.12s",
            }}
            onMouseEnter={e => { if (!saving) e.currentTarget.style.opacity = "0.88"; }}
            onMouseLeave={e => { e.currentTarget.style.opacity = "1"; }}
          >
            <ArrowDownToLine size={13} />
            {saving ? "Registrando…" : "Registrar entrada"}
          </button>
        </div>
      </div>
    </div>
  );
}
