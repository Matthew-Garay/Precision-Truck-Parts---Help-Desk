import { useState, useEffect } from "react";
import { X, FileDown, Calendar, User } from "lucide-react";

const ORANGE = "#F47920";

function Field({ icon: Icon, label, children, T }) {
  const isDark = T?.isDark;
  return (
    <div style={{
      display: "grid", gridTemplateColumns: "14px 108px 1fr",
      alignItems: "center", gap: "10px",
      padding: "10px 0",
      borderBottom: `1px solid ${isDark ? "rgba(255,255,255,0.05)" : "#f1f5f9"}`,
    }}>
      <Icon size={12} style={{ color: isDark ? "rgba(255,255,255,0.22)" : "#c0c9d6" }} />
      <span style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase",
        letterSpacing: "0.06em", color: isDark ? "rgba(255,255,255,0.30)" : "#a0aec0" }}>
        {label}
      </span>
      {children}
    </div>
  );
}

export default function ModalReporte({ T, admins = [], onClose, onGenerar, generando = false, titulo = "Incidencias" }) {
  const hoy          = new Date().toISOString().slice(0, 10);
  const primerDiaMes = hoy.slice(0, 8) + "01";
  const [params, setParams] = useState({ fecha_inicio: primerDiaMes, fecha_fin: hoy, id_tecnico: "todos" });
  const set    = (k, v) => setParams(p => ({ ...p, [k]: v }));
  const valido = params.fecha_inicio && params.fecha_fin && params.fecha_inicio <= params.fecha_fin;

  const isDark     = T?.isDark ?? false;
  const surface    = isDark ? "#161B22" : "#ffffff";
  const surfaceAlt = isDark ? "#1a2030" : "#f8fafc";
  const border     = isDark ? "rgba(255,255,255,0.07)" : "#e8ecf0";
  const textMain   = T?.text      ?? (isDark ? "#e2e8f0" : "#1a202c");
  const textMuted  = T?.textMuted ?? (isDark ? "#8b949e" : "#64748b");
  const textFaint  = T?.textFaint ?? (isDark ? "rgba(255,255,255,0.25)" : "#a0aec0");

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

  const inpSt = {
    background:  isDark ? "rgba(255,255,255,0.05)" : "#f8fafc",
    border:      `1px solid ${border}`,
    color:       textMain,
    outline:     "none",
    borderRadius: "6px",
    padding:     "6px 10px",
    fontSize:    "13px",
    width:       "100%",
    transition:  "border-color 0.15s",
    colorScheme: isDark ? "dark" : "light",
  };

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
        @keyframes dmFade  { from{opacity:0} to{opacity:1} }
        @keyframes dmSlide { from{opacity:0;transform:translateY(-5px)} to{opacity:1;transform:translateY(0)} }
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
            <p style={{ margin: 0, fontSize: "10px", fontWeight: 700, textTransform: "uppercase",
              letterSpacing: "0.09em", color: ORANGE }}>
              {titulo}
            </p>
            <h2 style={{ margin: "3px 0 0", fontSize: "16px", fontWeight: 700, color: textMain,
              letterSpacing: "-0.02em", lineHeight: 1.2 }}>
              Generar Reporte
            </h2>
            <p style={{ margin: "4px 0 0", fontSize: "12px", color: textMuted, fontWeight: 400 }}>
              Define el rango y los parámetros
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
                background: "transparent",
                border: `1px solid ${border}`,
                borderRadius: "6px", cursor: "pointer",
                color: textFaint, transition: "all 0.12s",
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = textMuted; e.currentTarget.style.color = textMain; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = border;    e.currentTarget.style.color = textFaint; }}
            >
              <X size={12} strokeWidth={2} />
            </button>
          </div>
        </div>

        {/* ── Body ── */}
        <div style={{ flex: 1, overflowY: "auto", padding: "4px 18px 8px" }}>

          <Field icon={Calendar} label="Fecha inicio" T={T}>
            <input
              type="date"
              value={params.fecha_inicio}
              onChange={e => set("fecha_inicio", e.target.value)}
              style={inpSt}
              onFocus={e => { e.target.style.borderColor = ORANGE; }}
              onBlur={e  => { e.target.style.borderColor = border; }}
            />
          </Field>

          <Field icon={Calendar} label="Fecha fin" T={T}>
            <input
              type="date"
              value={params.fecha_fin}
              onChange={e => set("fecha_fin", e.target.value)}
              style={inpSt}
              onFocus={e => { e.target.style.borderColor = ORANGE; }}
              onBlur={e  => { e.target.style.borderColor = border; }}
            />
          </Field>

          {admins.length > 0 && (
            <Field icon={User} label="Técnico" T={T}>
              <select
                value={params.id_tecnico}
                onChange={e => set("id_tecnico", e.target.value)}
                style={{ ...inpSt, cursor: "pointer" }}
                onFocus={e => { e.target.style.borderColor = ORANGE; }}
                onBlur={e  => { e.target.style.borderColor = border; }}
              >
                <option value="todos">Todos los técnicos</option>
                {admins.map(a => (
                  <option key={a.id_empleado} value={a.id_empleado}>{a.nombre_completo}</option>
                ))}
              </select>
            </Field>
          )}

          {!valido && params.fecha_inicio && params.fecha_fin && (
            <p style={{ margin: "10px 0 0", fontSize: "11px", color: "#dc2626", fontWeight: 600 }}>
              La fecha de inicio no puede ser mayor a la fecha fin.
            </p>
          )}
        </div>

        {/* ── Footer ── */}
        <div style={{
          padding: "10px 18px",
          borderTop: `1px solid ${border}`,
          background: surfaceAlt,
          display: "flex", justifyContent: "flex-end", gap: "8px",
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
            onMouseLeave={e => { e.currentTarget.style.borderColor = border;    e.currentTarget.style.color = textMuted; }}
          >
            Cancelar
          </button>
          <button
            onClick={() => valido && !generando && onGenerar(params)}
            disabled={!valido || generando}
            style={{
              padding: "6px 16px", borderRadius: "6px",
              fontSize: "12px", fontWeight: 700,
              background: valido && !generando ? ORANGE : isDark ? "rgba(255,255,255,0.06)" : "#e2e8f0",
              color: valido && !generando ? "#fff" : textFaint,
              border: "none", cursor: valido && !generando ? "pointer" : "not-allowed",
              display: "flex", alignItems: "center", gap: "6px",
              transition: "filter 0.12s",
            }}
            onMouseEnter={e => { if (valido && !generando) e.currentTarget.style.filter = "brightness(1.08)"; }}
            onMouseLeave={e => { e.currentTarget.style.filter = "none"; }}
          >
            <FileDown size={12} strokeWidth={2.5} />
            {generando ? "Generando…" : "Generar Reporte"}
          </button>
        </div>
      </div>
    </div>
  );
}
