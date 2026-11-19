/**
 * ModalResultadoSolicitud.jsx — Ventana con el resultado al enviar una solicitud de insumos
 * (enviada o con error). Separado de pages/Usuario/SolicitudInsumo.jsx.
 */
import { useEffect } from "react";
import { Package, AlertCircle, CheckCircle2, X } from "lucide-react";
import { FS } from '../../utils/tipografia.js';
import LogoModal from '../LogoModal.jsx';

export function ModalResultado({ resultModal, cartEntries, T, onClose }) {
  const isDark = T?.isDark ?? false;
  const surface    = isDark ? "#161B22" : "#ffffff";
  const surfaceAlt = isDark ? "#1a2030" : "#f8fafc";
  const border     = isDark ? "rgba(255,255,255,0.07)" : "#e8ecf0";

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
          width: "95%", maxWidth: "440px",
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
        {/* Banda acento */}
        <div style={{ height: "2px", flexShrink: 0, background: resultModal.success ? "#16a34a" : "#dc2626", borderRadius: "10px 10px 0 0" }} />

        {/* Header */}
        <div style={{
          padding: "14px 18px 12px",
          borderBottom: `1px solid ${border}`,
          display: "flex", alignItems: "flex-start", justifyContent: "space-between",
          gap: "12px", flexShrink: 0,
        }}>
          <div style={{ minWidth: 0, flex: 1 }}>
            <p style={{ margin: 0, fontSize: FS.etiqueta, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.09em", color: resultModal.success ? "#16a34a" : "#dc2626" }}>
              {resultModal.success ? "Solicitud" : "No se envió"}
            </p>
            <h2 style={{ margin: "3px 0 0", fontSize: FS.subtitulo, fontWeight: 700, color: T.text, letterSpacing: "-0.02em", lineHeight: 1.2 }}>
              {resultModal.success ? "Solicitud creada" : "Tu solicitud no se pudo crear"}
            </h2>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexShrink: 0, paddingTop: "2px" }}>
            <LogoModal />
            <button
              onClick={onClose}
              style={{ width: "26px", height: "26px", display: "flex", alignItems: "center", justifyContent: "center", background: "transparent", border: `1px solid ${border}`, borderRadius: "6px", cursor: "pointer", color: T.textFaint, transition: "all 0.12s" }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = T.textMuted; e.currentTarget.style.color = T.text; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = border; e.currentTarget.style.color = T.textFaint; }}
            >
              <X size={12} strokeWidth={2} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "16px 18px", display: "flex", flexDirection: "column", gap: "14px" }}>
          {resultModal.success ? (
            <>
              {/* Folio + mensaje */}
              <div className="flex items-center gap-3 p-3 rounded-xl"
                style={{ background: isDark ? "rgba(22,163,74,0.10)" : "#f0fdf4", border: "1px solid rgba(22,163,74,0.25)" }}>
                <CheckCircle2 size={20} style={{ color: "#16a34a", flexShrink: 0 }} />
                <div>
                  <p style={{ margin: 0, fontSize: FS.secundario, fontWeight: 700, color: "#16a34a" }}>Registrada correctamente</p>
                  <p style={{ margin: "2px 0 0", fontSize: FS.enfasis, fontWeight: 800, fontFamily: "monospace", color: T.orange }}>#{resultModal.folio}</p>
                </div>
              </div>

              {/* Detalle de insumos */}
              {cartEntries.length > 0 && (
                <div>
                  <p style={{ margin: "0 0 8px", fontSize: FS.etiqueta, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: T.textMuted }}>
                    Insumos solicitados ({cartEntries.length})
                  </p>
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    {cartEntries.map(({ supply, quantity, id }) => (
                      <div key={id} className="flex items-center gap-3 px-3 py-2 rounded-lg"
                        style={{ background: surfaceAlt, border: `1px solid ${border}` }}>
                        {/* Imagen o icono */}
                        <div style={{
                          width: "36px", height: "36px", borderRadius: "8px", flexShrink: 0,
                          background: isDark ? "rgba(255,255,255,0.05)" : "#f1f5f9",
                          border: `1px solid ${border}`,
                          overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center",
                        }}>
                          {supply.imagen_url
                            ? <img src={supply.imagen_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                            : <Package size={14} style={{ color: T.textFaint }} />
                          }
                        </div>
                        {/* Info */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ margin: 0, fontSize: FS.cuerpo, fontWeight: 600, color: T.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {supply.nombre}
                          </p>
                          {(supply.marca || supply.modelo) && (
                            <p style={{ margin: "1px 0 0", fontSize: FS.etiqueta, color: T.textFaint }}>
                              {[supply.marca, supply.modelo].filter(Boolean).join(" · ")}
                            </p>
                          )}
                        </div>
                        {/* Cantidad */}
                        <span style={{
                          flexShrink: 0, fontSize: FS.cuerpo, fontWeight: 800,
                          padding: "2px 10px", borderRadius: "99px",
                          background: isDark ? "rgba(37,99,235,0.15)" : "#eff6ff",
                          color: "#3b82f6", border: "1px solid rgba(59,130,246,0.25)",
                        }}>
                          ×{quantity}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <p style={{ margin: 0, fontSize: FS.secundario, color: T.textFaint, lineHeight: 1.5 }}>
                El equipo revisará tu solicitud y te notificará cuando sea atendida.
              </p>
            </>
          ) : (
            <div className="flex items-start gap-3 p-3 rounded-xl"
              style={{ background: isDark ? "rgba(220,38,38,0.10)" : "#fef2f2", border: "1px solid rgba(220,38,38,0.25)" }}>
              <AlertCircle size={16} style={{ color: "#dc2626", flexShrink: 0, marginTop: "1px" }} />
              <p style={{ margin: 0, fontSize: FS.enfasis, color: T.text, lineHeight: 1.5 }}>{resultModal.message}</p>
            </div>
          )}
        </div>

        {/* Footer */}
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
              padding: "6px 20px", borderRadius: "6px",
              fontSize: FS.cuerpo, fontWeight: 700,
              background: resultModal.success ? "#2563eb" : "transparent",
              border: resultModal.success ? "none" : `1px solid ${border}`,
              color: resultModal.success ? "#fff" : T.textMuted,
              cursor: "pointer", transition: "all 0.12s",
            }}
            onMouseEnter={e => { if (!resultModal.success) { e.currentTarget.style.borderColor = T.textMuted; e.currentTarget.style.color = T.text; } else { e.currentTarget.style.opacity = "0.88"; } }}
            onMouseLeave={e => { e.currentTarget.style.opacity = "1"; if (!resultModal.success) { e.currentTarget.style.borderColor = border; e.currentTarget.style.color = T.textMuted; } }}
          >
            {resultModal.success ? "Ver solicitud" : "Cerrar"}
          </button>
        </div>
      </div>
    </div>
  );
}
