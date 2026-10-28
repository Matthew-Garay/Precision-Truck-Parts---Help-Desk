import { useState, useEffect, useRef } from "react";
import { X, ArrowDownToLine } from "lucide-react";
import { apiFetch, API_ROUTES } from "../../services/api-client.js";
import { useToast } from "../Feedback.jsx";

const TEAL = "#0d9488";

function Field({ label, htmlFor, children, textFaint }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
      <label
        htmlFor={htmlFor}
        style={{
          fontSize: "10px",
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: "0.07em",
          color: textFaint,
        }}
      >
        {label}
      </label>
      {children}
    </div>
  );
}

export default function ModalEntradaInsumo({ insumo, onClose, onSaved, onStockUpdate, T }) {
  const isDark = T?.isDark ?? false;
  const toast = useToast();
  const firstRef = useRef(null);

  const surface = isDark ? "#161B22" : "#ffffff";
  const surfaceAlt = isDark ? "#1a2030" : "#f8fafc";
  const border = isDark ? "rgba(255,255,255,0.07)" : "#e8ecf0";
  const borderFocus = "var(--color-primary)";
  const textMain = T?.text ?? (isDark ? "#e2e8f0" : "#1a202c");
  const textMuted = T?.textMuted ?? (isDark ? "#8b949e" : "#64748b");
  const textFaint = T?.textFaint ?? (isDark ? "rgba(255,255,255,0.30)" : "#a0aec0");
  const inputBg = isDark ? "rgba(255,255,255,0.04)" : "#f8fafc";

  const stockActual = Number(insumo?.stock) || 0;

  const [cantidad, setCantidad] = useState("2");
  const [motivo, setMotivo] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

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

  const onFocus = (e) => {
    e.target.style.borderColor = borderFocus;
    e.target.style.boxShadow = "0 0 0 3px rgba(37,99,235,0.10)";
    e.target.style.background = isDark ? "rgba(255,255,255,0.07)" : "#fff";
  };
  const onBlur = (e) => {
    e.target.style.borderColor = border;
    e.target.style.boxShadow = "none";
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const res = await apiFetch(API_ROUTES.INSUMO_ENTRADA(insumo?.id_insumo), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id_insumo: insumo?.id_insumo,
          cantidad,
          motivo,
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      toast.success("Entrada registrada");
      onSaved?.();
      onStockUpdate?.();
      onClose();
    } catch (err) {
      setError(err.message);
      toast.error("Error al registrar entrada");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        display: "grid",
        placeItems: "center",
        background: isDark ? "rgba(0,0,0,0.50)" : "rgba(0,0,0,0.45)",
        zIndex: 1000,
      }}
    >
      <div
        style={{
          position: "relative",
          width: "100%",
          maxWidth: "340px",
          margin: "1.5rem",
          background: surface,
          border: `1px solid ${border}`,
          borderRadius: "12px",
          padding: "18px 16px",
          boxShadow: "0 12px 32px rgba(0,0,0,0.08)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "14px",
          }}
        >
          <h3 style={{ margin: 0, fontSize: "14px", fontWeight: 700, color: textMain }}>
            Registrar {insumo?.nombre} en stock
          </h3>
          <button
            type="button"
            onClick={onClose}
            style={{ padding: "4px", borderRadius: "6px", border: `1px solid ${border}`, background: "transparent", cursor: "pointer", color: textMuted }}
          >
            <X size={16} />
          </button>
        </div>

        <p style={{ margin: 0, fontSize: "11px", color: textFaint, marginBottom: "12px" }}>
          Stock actual: <strong style={{ color: textMain }}>{stockActual}</strong>
        </p>

        <form id="form-entrada" onSubmit={onSubmit}>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "12px" }}>
            <Field htmlFor="fe-cantidad" label="Cantidad" textFaint={textFaint}>
              <input
                id="fe-cantidad"
                type="number"
                min="1"
                step="1"
                value={cantidad}
                onChange={(e) => setCantidad(e.target.value)}
                placeholder="Ej. 25"
                style={inp}
                onFocus={onFocus}
                onBlur={onBlur}
              />
            </Field>

            <Field htmlFor="fe-motivo" label="Motivo / folio de compra" textFaint={textFaint}>
              <input
                id="fe-motivo"
                type="text"
                maxLength={500}
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                placeholder="Compra, devolucion, donacion..."
                style={inp}
                onFocus={onFocus}
                onBlur={onBlur}
              />
            </Field>

          </div>

          <p style={{ margin: 0, fontSize: "10px", lineHeight: 1.5, color: textFaint }}>
            La ruta del material (de qué sucursal sale y a qué llega) se define en la
            solicitud del insumo, no al capturar la entrada.
          </p>

          {error && (
            <p role="alert" style={{
              margin: 0,
              padding: "8px 12px",
              borderRadius: "6px",
              fontSize: "12px",
              fontWeight: 500,
              color: "#dc2626",
              background: isDark ? "rgba(220,38,38,0.10)" : "#fef2f2",
              border: `1px solid ${isDark ? "rgba(220,38,38,0.25)" : "#fecaca"}`,
            }}>
              {error}
            </p>
          )}

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "12px" }}>
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              style={{
                padding: "6px 16px",
                borderRadius: "6px",
                fontSize: "12px",
                fontWeight: 600,
                background: "transparent",
                border: `1px solid ${border}`,
                color: textMuted,
                cursor: "pointer",
                opacity: saving ? 0.5 : 1,
              }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              form="form-entrada"
              disabled={saving}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "6px 18px",
                borderRadius: "6px",
                fontSize: "12px",
                fontWeight: 700,
                background: saving ? TEAL + "99" : TEAL,
                border: "none",
                color: "#fff",
                cursor: saving ? "not-allowed" : "pointer",
                transition: "opacity 0.12s",
              }}
            >
              <ArrowDownToLine size={13} />
              {saving ? "Registrando..." : "Registrar entrada"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
