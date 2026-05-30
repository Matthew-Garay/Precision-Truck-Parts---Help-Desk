import { useState, useEffect, useRef, useCallback, createContext, useContext } from "react";
import { X, CheckCircle2, AlertTriangle, XCircle, Info, AlertCircle, Loader2 } from "lucide-react";

// ================================================================
//  FEEDBACK SYSTEM — Corporativo / Industrial
//  Reglas: plano, 14px base, border-radius max 4px,
//  sin sombras pesadas, transiciones 150ms ease-in-out
// ================================================================

const CSS = `
@keyframes _fb_fadeIn  { from { opacity:0 } to { opacity:1 } }
@keyframes _fb_slideIn { from { opacity:0; transform:translateY(-6px) } to { opacity:1; transform:translateY(0) } }
@keyframes _fb_toastIn { from { opacity:0; transform:translateX(12px) } to { opacity:1; transform:translateX(0) } }
@keyframes _fb_toastOut{ from { opacity:1; transform:translateX(0)    } to { opacity:0; transform:translateX(12px) } }
@keyframes _fb_spin    { to   { transform:rotate(360deg) } }
._fb_overlay  { animation: _fb_fadeIn  0.15s ease-in-out forwards }
._fb_dialog   { animation: _fb_slideIn 0.15s ease-in-out forwards }
._fb_toastIn  { animation: _fb_toastIn  0.15s ease-in-out forwards }
._fb_toastOut { animation: _fb_toastOut 0.15s ease-in-out forwards }
._fb_spin     { animation: _fb_spin 0.7s linear infinite }
`;

function injectCSS() {
  if (document.getElementById("__fb_css")) return;
  const s = document.createElement("style");
  s.id = "__fb_css";
  s.textContent = CSS;
  document.head.appendChild(s);
}

// ── Tokens internos ─────────────────────────────────────────────
// Se derivan del tema T para no hardcodear colores
function tk(T) {
  const d = T.isDark;
  return {
    // Superficies
    bg:         d ? "#161B22"              : "#FFFFFF",
    bgHeader:   d ? "#1C2230"              : "#F9FAFB",
    bgFooter:   d ? "#1C2230"              : "#F9FAFB",
    // Bordes
    border:     d ? "#21283A"              : "#E5E7EB",
    borderBtn:  d ? "#30363D"              : "#D1D5DB",
    // Texto
    text:       d ? "#E6EDF3"              : "#111827",
    textSub:    d ? "#8B949E"              : "#374151",
    textFaint:  d ? "#484F58"              : "#9CA3AF",
    // Botón ghost hover
    ghostHover: d ? "rgba(255,255,255,0.06)" : "#F3F4F6",
    // Overlay
    overlay:    "rgba(0,0,0,0.45)",
  };
}

// ── Botón base reutilizable ──────────────────────────────────────
function Btn({ label, onClick, disabled, variant = "ghost", color, icon: Icon, T }) {
  const s = tk(T);
  const [hov, setHov] = useState(false);

  const base = {
    display: "inline-flex", alignItems: "center", justifyContent: "center",
    gap: "6px",
    height: "32px", padding: "0 14px",
    fontSize: "13px", fontWeight: 500,
    borderRadius: "4px",
    border: "1px solid transparent",
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.5 : 1,
    transition: "background 0.15s ease-in-out, border-color 0.15s ease-in-out, color 0.15s ease-in-out",
    whiteSpace: "nowrap",
    userSelect: "none",
  };

  const styles = {
    primary: {
      background: hov && !disabled ? shiftBrightness(color || T.orange, -12) : (color || T.orange),
      borderColor: "transparent",
      color: "#FFFFFF",
      fontWeight: 600,
    },
    ghost: {
      background: hov && !disabled ? s.ghostHover : "transparent",
      borderColor: s.borderBtn,
      color: s.textSub,
    },
    danger: {
      background: hov && !disabled ? "#B91C1C" : "#DC2626",
      borderColor: "transparent",
      color: "#FFFFFF",
      fontWeight: 600,
    },
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{ ...base, ...styles[variant] }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
    >
      {Icon && <Icon size={13} />}
      {label}
    </button>
  );
}

function shiftBrightness(hex, amount) {
  // Oscurece un color hex en `amount` unidades por canal
  const n = parseInt(hex.replace("#", ""), 16);
  const r = Math.max(0, Math.min(255, (n >> 16) + amount));
  const g = Math.max(0, Math.min(255, ((n >> 8) & 0xff) + amount));
  const b = Math.max(0, Math.min(255, (n & 0xff) + amount));
  return `rgb(${r},${g},${b})`;
}

// ================================================================
//  MODAL
//  Props: T, open, onClose, onConfirm, title, children,
//         confirmLabel, cancelLabel, danger, loading, dirty,
//         size ("sm"|"md"|"lg"), hideFooter
// ================================================================
export function Modal({
  T, open, onClose, onConfirm,
  title, children,
  confirmLabel = "Confirmar",
  cancelLabel  = "Cancelar",
  danger       = false,
  loading      = false,
  dirty        = false,
  size         = "md",
  hideFooter   = false,
}) {
  injectCSS();
  const [warnDirty, setWarnDirty] = useState(false);
  const s = tk(T);

  const maxW = { sm: "380px", md: "520px", lg: "700px" }[size] ?? "520px";

  // Bloquear scroll del body
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  // Cerrar con Escape
  useEffect(() => {
    if (!open) return;
    const fn = (e) => { if (e.key === "Escape") attemptClose(); };
    document.addEventListener("keydown", fn);
    return () => document.removeEventListener("keydown", fn);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, dirty]);

  if (!open) return null;

  const attemptClose = () => {
    if (dirty) { setWarnDirty(true); return; }
    onClose();
  };

  return (
    <div
      className="_fb_overlay"
      role="presentation"
      style={{
        position: "fixed", inset: 0, zIndex: 1000,
        background: s.overlay,
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "16px",
      }}
      onMouseDown={(e) => { if (e.target === e.currentTarget) attemptClose(); }}
    >
      <div
        className="_fb_dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="_fb_modal_title"
        style={{
          width: "95%", maxWidth: maxW,
          background: s.bg,
          border: `1px solid ${s.border}`,
          borderRadius: "4px",
          display: "flex", flexDirection: "column",
          maxHeight: "88vh",
          overflow: "hidden",
          // Sombra minima — solo para separar del overlay, no decorativa
          boxShadow: "0 2px 8px rgba(0,0,0,0.18)",
        }}
      >
        {/* ── HEADER ─────────────────────────────────────────── */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "0 20px",
          height: "48px",
          borderBottom: `1px solid ${s.border}`,
          background: s.bgHeader,
          flexShrink: 0,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            {/* Acento de color — 2px, sin border-radius */}
            <span style={{
              display: "block", width: "2px", height: "16px",
              background: danger ? "#DC2626" : T.orange,
              borderRadius: 0, flexShrink: 0,
            }} />
            <h2 id="_fb_modal_title" style={{
              margin: 0, fontSize: "14px", fontWeight: 600,
              color: s.text, letterSpacing: "0",
            }}>
              {title}
            </h2>
          </div>

          {/* Botón cerrar — área táctil 44×44 */}
          <button
            onClick={attemptClose}
            aria-label="Cerrar"
            style={{
              width: "44px", height: "44px", marginRight: "-12px",
              display: "flex", alignItems: "center", justifyContent: "center",
              background: "transparent", border: "none",
              cursor: "pointer", borderRadius: "4px",
              color: s.textFaint,
              transition: "background 0.15s ease-in-out, color 0.15s ease-in-out",
            }}
            onMouseEnter={e => { e.currentTarget.style.background = s.ghostHover; e.currentTarget.style.color = s.text; }}
            onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = s.textFaint; }}
          >
            <X size={15} strokeWidth={1.8} />
          </button>
        </div>

        {/* ── BODY ───────────────────────────────────────────── */}
        <div style={{
          padding: "20px",
          overflowY: "auto",
          flex: 1,
          fontSize: "14px",
          lineHeight: "1.55",
          color: s.text,
        }}>
          {children}
        </div>

        {/* ── FOOTER ─────────────────────────────────────────── */}
        {!hideFooter && (
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "flex-end",
            gap: "8px",
            padding: "0 20px",
            height: "52px",
            borderTop: `1px solid ${s.border}`,
            background: s.bgFooter,
            flexShrink: 0,
          }}>
            <Btn
              T={T} label={cancelLabel}
              onClick={attemptClose} disabled={loading}
              variant="ghost"
            />
            {onConfirm && (
              <Btn
                T={T}
                label={loading ? "Procesando..." : confirmLabel}
                onClick={onConfirm}
                disabled={loading}
                variant={danger ? "danger" : "primary"}
                icon={loading ? Loader2 : undefined}
              />
            )}
          </div>
        )}
      </div>

      {/* ── GUARDIA: cambios sin guardar ───────────────────── */}
      {warnDirty && (
        <div
          style={{
            position: "absolute", inset: 0, zIndex: 10,
            background: "rgba(0,0,0,0.30)",
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: "16px",
          }}
        >
          <div
            className="_fb_dialog"
            style={{
              width: "95%", maxWidth: "340px",
              background: s.bg,
              border: `1px solid ${s.border}`,
              borderRadius: "4px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.18)",
            }}
          >
            {/* Header */}
            <div style={{
              display: "flex", alignItems: "center", gap: "8px",
              padding: "0 16px", height: "44px",
              borderBottom: `1px solid ${s.border}`,
              background: s.bgHeader,
            }}>
              <AlertCircle size={14} style={{ color: T.orange, flexShrink: 0 }} />
              <span style={{ fontSize: "13px", fontWeight: 600, color: s.text }}>
                Cambios sin guardar
              </span>
            </div>
            {/* Body */}
            <div style={{ padding: "16px", fontSize: "13px", color: s.textSub, lineHeight: 1.5 }}>
              Si cierras ahora se perderan los cambios realizados. Esta accion no se puede deshacer.
            </div>
            {/* Footer */}
            <div style={{
              display: "flex", justifyContent: "flex-end", gap: "8px",
              padding: "0 16px", height: "48px",
              alignItems: "center",
              borderTop: `1px solid ${s.border}`,
              background: s.bgFooter,
            }}>
              <Btn T={T} label="Seguir editando" onClick={() => setWarnDirty(false)} variant="ghost" />
              <Btn T={T} label="Descartar" onClick={() => { setWarnDirty(false); onClose(); }} variant="danger" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ================================================================
//  MODAL CONFIRM — accion destructiva rapida
//  Props: T, open, onClose, onConfirm, title, message, loading
// ================================================================
export function ModalConfirm({ T, open, onClose, onConfirm, title, message, loading = false }) {
  const s = tk(T);
  return (
    <Modal
      T={T} open={open} onClose={onClose} onConfirm={onConfirm}
      title={title} confirmLabel="Confirmar" cancelLabel="Cancelar"
      danger loading={loading} size="sm"
    >
      <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
        <AlertTriangle size={16} style={{ color: "#DC2626", flexShrink: 0, marginTop: "2px" }} />
        <p style={{ margin: 0, fontSize: "14px", color: s.textSub, lineHeight: 1.55 }}>
          {message}
        </p>
      </div>
    </Modal>
  );
}

// ================================================================
//  TOAST SYSTEM
// ================================================================

const ToastCtx = createContext(null);

// Configuracion semantica de cada tipo
const TOAST_CFG = {
  success: {
    Icon: CheckCircle2,
    accent: "#16A34A",
    bgL: "#F0FDF4", bgD: "#071a0e",
    textL: "#14532D", textD: "#86EFAC",
  },
  error: {
    Icon: XCircle,
    accent: "#DC2626",
    bgL: "#FEF2F2", bgD: "#2d0a0a",
    textL: "#7F1D1D", textD: "#FCA5A5",
  },
  warning: {
    Icon: AlertTriangle,
    accent: "#D97706",
    bgL: "#FFFBEB", bgD: "#1c1200",
    textL: "#78350F", textD: "#FCD34D",
  },
  info: {
    Icon: Info,
    accent: "#2563EB",
    bgL: "#EFF6FF", bgD: "#0f1f3d",
    textL: "#1E3A8A", textD: "#93C5FD",
  },
};

function ToastItem({ toast, onRemove, isDark }) {
  const [out, setOut] = useState(false);
  const timer = useRef(null);

  const dismiss = useCallback(() => {
    setOut(true);
    setTimeout(() => onRemove(toast.id), 150);
  }, [toast.id, onRemove]);

  useEffect(() => {
    if (toast.duration === 0) return;
    timer.current = setTimeout(dismiss, toast.duration ?? 4500);
    return () => clearTimeout(timer.current);
  }, [dismiss, toast.duration]);

  const cfg  = TOAST_CFG[toast.type] ?? TOAST_CFG.info;
  const Icon = cfg.Icon;
  const bg   = isDark ? cfg.bgD : cfg.bgL;
  const tx   = isDark ? cfg.textD : cfg.textL;

  return (
    <div
      className={out ? "_fb_toastOut" : "_fb_toastIn"}
      role="alert"
      aria-live="assertive"
      style={{
        display: "flex", alignItems: "flex-start", gap: "10px",
        padding: "10px 12px",
        background: bg,
        // Borde izquierdo de 3px como indicador de tipo — sin sombra pesada
        borderLeft: `3px solid ${cfg.accent}`,
        border: `1px solid ${cfg.accent}22`,
        borderLeftColor: cfg.accent,
        borderRadius: "4px",
        minWidth: "260px", maxWidth: "340px",
        pointerEvents: "all",
        boxShadow: "0 1px 4px rgba(0,0,0,0.10)",
      }}
      onMouseEnter={() => clearTimeout(timer.current)}
      onMouseLeave={() => {
        if (toast.duration !== 0)
          timer.current = setTimeout(dismiss, 2000);
      }}
    >
      <Icon size={15} style={{ color: cfg.accent, flexShrink: 0, marginTop: "1px" }} />

      <div style={{ flex: 1, minWidth: 0 }}>
        {toast.title && (
          <p style={{
            margin: "0 0 2px 0",
            fontSize: "13px", fontWeight: 600,
            color: tx,
          }}>
            {toast.title}
          </p>
        )}
        <p style={{
          margin: 0,
          fontSize: "13px", fontWeight: 400,
          color: tx,
          lineHeight: 1.45,
          opacity: toast.title ? 0.85 : 1,
        }}>
          {toast.message}
        </p>
      </div>

      {/* Cerrar — area tactil 44×44 */}
      <button
        onClick={dismiss}
        aria-label="Cerrar"
        style={{
          width: "28px", height: "28px",
          margin: "-4px -4px -4px 0",
          display: "flex", alignItems: "center", justifyContent: "center",
          background: "transparent", border: "none",
          cursor: "pointer", borderRadius: "4px",
          color: cfg.accent,
          opacity: 0.5,
          transition: "opacity 0.15s ease-in-out",
          flexShrink: 0,
        }}
        onMouseEnter={e => e.currentTarget.style.opacity = "1"}
        onMouseLeave={e => e.currentTarget.style.opacity = "0.5"}
      >
        <X size={12} strokeWidth={2} />
      </button>
    </div>
  );
}

/**
 * ToastProvider — envuelve el dashboard.
 * Uso: const toast = useToast();
 *      toast.success("Guardado");
 *      toast.error("Error", { title: "Fallo de red" });
 *      toast.warning("Sin conexion", { duration: 0 }); // persistente
 */
export function ToastProvider({ children, T }) {
  injectCSS();
  const [toasts, setToasts] = useState([]);
  const isDark = T?.isDark ?? false;

  const add = useCallback((type, message, opts = {}) => {
    const id = `${Date.now()}_${Math.random().toString(36).slice(2)}`;
    setToasts(p => [...p.slice(-7), { id, type, message, ...opts }]);
    return id;
  }, []);

  const remove = useCallback((id) => setToasts(p => p.filter(t => t.id !== id)), []);

  const api = {
    success: (msg, opts) => add("success", msg, opts),
    error:   (msg, opts) => add("error",   msg, opts),
    warning: (msg, opts) => add("warning", msg, opts),
    info:    (msg, opts) => add("info",    msg, opts),
    dismiss: remove,
  };

  return (
    <ToastCtx.Provider value={api}>
      {children}
      <div
        aria-live="polite"
        style={{
          position: "fixed",
          top: "16px", right: "16px",
          zIndex: 2000,
          display: "flex", flexDirection: "column",
          gap: "6px",
          pointerEvents: "none",
        }}
      >
        {toasts.map(t => (
          <ToastItem key={t.id} toast={t} onRemove={remove} isDark={isDark} />
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastCtx);
  if (!ctx) throw new Error("useToast debe usarse dentro de <ToastProvider>");
  return ctx;
}

// ================================================================
//  TOOLTIP — funcional, sin decoracion
//  Props: T, content, children, position ("top"|"bottom"|"left"|"right"), delay
// ================================================================
export function Tooltip({ T, content, children, position = "top", delay = 350 }) {
  injectCSS();
  const [vis, setVis] = useState(false);
  const timer = useRef(null);
  const isDark = T?.isDark ?? false;

  if (!content) return children;

  const show = () => { timer.current = setTimeout(() => setVis(true), delay); };
  const hide = () => { clearTimeout(timer.current); setVis(false); };

  // Posicionamiento por eje
  const POS = {
    top:    { bottom: "calc(100% + 5px)", left: "50%", transform: "translateX(-50%)" },
    bottom: { top:    "calc(100% + 5px)", left: "50%", transform: "translateX(-50%)" },
    left:   { right:  "calc(100% + 5px)", top:  "50%", transform: "translateY(-50%)" },
    right:  { left:   "calc(100% + 5px)", top:  "50%", transform: "translateY(-50%)" },
  };

  return (
    <span
      style={{ position: "relative", display: "inline-flex" }}
      onMouseEnter={show} onMouseLeave={hide}
      onFocus={show}      onBlur={hide}
    >
      {children}
      {vis && (
        <span
          role="tooltip"
          style={{
            position: "absolute",
            ...POS[position],
            zIndex: 3000,
            // Fondo oscuro fijo — el tooltip siempre contrasta
            background: isDark ? "#21283A" : "#1F2937",
            color: "#F9FAFB",
            fontSize: "12px", fontWeight: 400,
            lineHeight: 1.4,
            padding: "4px 8px",
            borderRadius: "4px",
            whiteSpace: "nowrap",
            maxWidth: "200px",
            pointerEvents: "none",
            // Sombra minima para separar del fondo
            boxShadow: "0 1px 4px rgba(0,0,0,0.25)",
            // Sin animacion de bounce — fade simple
            opacity: 1,
          }}
        >
          {content}
        </span>
      )}
    </span>
  );
}

// ================================================================
//  INLINE ALERT — banner de estado dentro de formularios/secciones
//  Props: T, type ("success"|"error"|"warning"|"info"), message, onClose
// ================================================================
export function InlineAlert({ T, type = "info", message, title, onClose }) {
  const cfg  = TOAST_CFG[type] ?? TOAST_CFG.info;
  const Icon = cfg.Icon;
  const isDark = T?.isDark ?? false;
  const bg   = isDark ? cfg.bgD : cfg.bgL;
  const tx   = isDark ? cfg.textD : cfg.textL;

  return (
    <div
      role="alert"
      style={{
        display: "flex", alignItems: "flex-start", gap: "10px",
        padding: "10px 12px",
        background: bg,
        border: `1px solid ${cfg.accent}22`,
        borderLeft: `3px solid ${cfg.accent}`,
        borderLeftColor: cfg.accent,
        borderRadius: "4px",
        fontSize: "13px",
      }}
    >
      <Icon size={15} style={{ color: cfg.accent, flexShrink: 0, marginTop: "1px" }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        {title && (
          <p style={{ margin: "0 0 2px 0", fontWeight: 600, color: tx }}>{title}</p>
        )}
        <p style={{ margin: 0, color: tx, lineHeight: 1.45, opacity: title ? 0.85 : 1 }}>
          {message}
        </p>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          aria-label="Cerrar"
          style={{
            width: "24px", height: "24px",
            display: "flex", alignItems: "center", justifyContent: "center",
            background: "transparent", border: "none",
            cursor: "pointer", borderRadius: "4px",
            color: cfg.accent, opacity: 0.6,
            transition: "opacity 0.15s ease-in-out",
            flexShrink: 0,
          }}
          onMouseEnter={e => e.currentTarget.style.opacity = "1"}
          onMouseLeave={e => e.currentTarget.style.opacity = "0.6"}
        >
          <X size={12} strokeWidth={2} />
        </button>
      )}
    </div>
  );
}
