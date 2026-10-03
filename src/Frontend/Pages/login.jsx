import { useState, useCallback, useEffect, useLayoutEffect } from "react";
import { apiFetch } from "../Config/api.js";
import { COLORS, RADIUS, BG_IMAGE, BG_OVERLAY, DIAGONAL, INPUT_FOCUS, INPUT_BLUR } from "../Config/DesignSystem";
import { EyeIcon, EyeOffIcon } from "../Components/Icons";
import { emailCorporativoValido } from "../Config/email.js";
import { evaluarPassword, passwordSeguro } from "../Config/password.js";

// ── Helpers ───────────────────────────────────────────────────
// Solo se aceptan correos corporativos de los dominios permitidos
// (refividrio.com.mx, ptp.com.mx, megapartes.com.mx, ebatruck.com.mx).
const emailValido = v => emailCorporativoValido(v) === null;

// ── Modal recuperar contraseña ────────────────────────────────
function ModalRecuperar({ onCerrar }) {
  const [paso, setPaso]       = useState(1);
  const [email, setEmail]     = useState("");
  const [codigo, setCodigo]   = useState("");
  const [pass1, setPass1]     = useState("");
  const [pass2, setPass2]     = useState("");
  const [showP1, setShowP1]   = useState(false);
  const [showP2, setShowP2]   = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  const [exito, setExito]     = useState(false);

  // Política de contraseña corporativa (misma que valida el backend)
  const fuerza = evaluarPassword(pass1);

  const inp = {
    background: COLORS.silverBg, border: `1px solid ${COLORS.silver}`,
    borderRadius: RADIUS.input, color: COLORS.dark,
    fontSize: "14px", padding: "11px 14px", width: "100%", outline: "none",
  };

  const handleEmail = async (e) => {
    e.preventDefault(); setError("");
    // Validación local de la política de dominios antes de llamar al servidor
    const errEmail = emailCorporativoValido(email);
    if (errEmail) { setError(errEmail); return; }
    setLoading(true);
    try {
      const res  = await apiFetch("/api/auth/recuperar", { method: "POST", body: { email } });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Error al enviar"); return; }
      setPaso(2);
    } catch { setError("No se pudo conectar con el servidor"); }
    finally { setLoading(false); }
  };

  const handleCodigo = async (e) => {
    e.preventDefault(); setError(""); setLoading(true);
    try {
      if (codigo.trim().length !== 6) { setError("El código debe tener 6 dígitos"); return; }
      // Fix #15: verificar el código contra el backend antes de avanzar al paso 3
      const res  = await apiFetch("/api/auth/verificar-codigo", { method: "POST", body: { email, codigo } });
      const data = await res.json();
      if (!res.ok) {
        if (data.error?.includes("expir")) { setPaso(1); setCodigo(""); }
        setError(data.error || "Código incorrecto"); return;
      }
      setPaso(3);
    } catch { setError("No se pudo conectar con el servidor"); }
    finally { setLoading(false); }
  };

  const handleReset = async (e) => {
    e.preventDefault(); setError("");
    if (pass1 !== pass2) { setError("Las contraseñas no coinciden"); return; }
    const passErr = passwordSeguro(pass1);
    if (passErr) { setError(`La contraseña debe cumplir: ${passErr.toLowerCase()}`); return; }
    setLoading(true);
    try {
      const res  = await apiFetch("/api/auth/reset-password", { method: "POST", body: { email, codigo, password_nueva: pass1 } });
      const data = await res.json();
      if (!res.ok) {
        if (data.error?.includes("Código") || data.error?.includes("expiró")) { setPaso(2); setCodigo(""); }
        setError(data.error || "Error al restablecer"); return;
      }
      setExito(true);
    } catch { setError("No se pudo conectar con el servidor"); }
    finally { setLoading(false); }
  };

  return (
    <div
      role="presentation"
      style={{
        position: "fixed", inset: 0, zIndex: 1000,
        background: "rgba(0,0,0,0.55)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "16px",
        animation: "dmFade 0.15s ease",
      }}
      onMouseDown={e => { if (e.target === e.currentTarget) onCerrar(); }}
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
          background: "#ffffff",
          border: "1px solid #e8ecf0",
          borderRadius: "10px",
          display: "flex", flexDirection: "column",
          maxHeight: "90vh", overflow: "hidden",
          boxShadow: "0 16px 40px rgba(15,23,42,0.12), 0 1px 3px rgba(15,23,42,0.06)",
          animation: "dmSlide 0.18s ease",
        }}
      >
        {/* Línea acento naranja */}
        <div style={{ height: "2px", flexShrink: 0, background: "#F47920", borderRadius: "10px 10px 0 0" }} />

        {/* Header */}
        <div style={{
          padding: "14px 18px 12px",
          background: "#ffffff",
          borderBottom: "1px solid #e8ecf0",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          gap: "12px", flexShrink: 0,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <p style={{ margin: 0, fontSize: "0.85rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.09em", color: "#F47920" }}>
              Recuperar contraseña
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexShrink: 0 }}>
            <img src="/assets/img/logo negro.png" alt="Precision Trucks"
              style={{ height: "28px", width: "auto", objectFit: "contain", opacity: 0.70 }} />
            <button
              onClick={onCerrar}
              aria-label="Cerrar"
              style={{
                width: "26px", height: "26px",
                display: "flex", alignItems: "center", justifyContent: "center",
                background: "transparent", border: "1px solid #e8ecf0",
                borderRadius: "6px", cursor: "pointer", color: "#a0aec0", transition: "all 0.12s",
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "#64748b"; e.currentTarget.style.color = "#1a202c"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "#e8ecf0"; e.currentTarget.style.color = "#a0aec0"; }}
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
            </button>
          </div>
        </div>

        {/* Indicador de pasos */}
        {!exito && (
          <div style={{ padding: "12px 18px 0", display: "flex", alignItems: "center" }}>
            {[1,2,3].map(n => (
              <div key={n} style={{ display: "flex", alignItems: "center", flex: 1 }}>
                <div style={{
                  width: "20px", height: "20px", borderRadius: "50%",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "9px", fontWeight: 900, flexShrink: 0,
                  background: paso >= n ? "#F47920" : "#f1f5f9",
                  color: paso >= n ? "#fff" : "#a0aec0",
                }}>{n}</div>
                {n < 3 && <div style={{ flex: 1, height: "1px", margin: "0 4px", background: paso > n ? "#F47920" : "#e8ecf0" }} />}
              </div>
            ))}
          </div>
        )}

        {/* Body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "16px 18px" }}>
          {exito ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px", padding: "8px 0" }}>
              <div style={{ width: "44px", height: "44px", borderRadius: "50%", background: "#dcfce7", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                  <path d="M5 13l4 4L19 7" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <p style={{ margin: 0, fontSize: "1.05rem", fontWeight: 700, color: "#1a202c", textAlign: "center" }}>¡Contraseña actualizada!</p>
              <p style={{ margin: 0, fontSize: "0.9rem", color: "#64748b", textAlign: "center" }}>Ya puedes iniciar sesión.</p>
            </div>
          ) : paso === 1 ? (
            <form onSubmit={handleEmail} style={{ display: "flex", flexDirection: "column", gap: 0 }}>
              <p style={{ margin: "0 0 10px", fontSize: "0.9rem", color: "#64748b" }}>Ingresa tu correo y te enviaremos un código.</p>
              <div style={{ display: "grid", gridTemplateColumns: "14px 100px 1fr", alignItems: "center", gap: "10px", padding: "8px 0", borderBottom: "1px solid #f1f5f9" }}>
                <svg width="13" height="13" viewBox="0 0 16 16" fill="none" style={{ marginTop: "1px" }}>
                  <rect x="1" y="3" width="14" height="10" rx="2" stroke="#c0c9d6" strokeWidth="1.5"/>
                  <path d="M1 5.5l7 4.5 7-4.5" stroke="#c0c9d6" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                <span style={{ fontSize: "0.9rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: "#a0aec0" }}>Correo</span>
                <input type="email" required value={email} onChange={e => { setEmail(e.target.value); setError(""); }}
                  placeholder="usuario@dominio.com.mx"
                  style={{ ...inp, fontSize: "14px" }}
                  onFocus={e => e.target.style.borderColor = "#F47920"}
                  onBlur={e => e.target.style.borderColor = COLORS.silver} />
              </div>
              {error && (
                <div role="alert" style={{ marginTop: "10px", padding: "7px 10px", borderRadius: "7px", fontSize: "11px", fontWeight: 600, display: "flex", alignItems: "center", gap: "6px", background: "#fee2e2", color: "#dc2626", border: "1px solid rgba(220,38,38,0.3)" }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                  {error}
                </div>
              )}
            </form>
          ) : paso === 2 ? (
            <form onSubmit={handleCodigo} style={{ display: "flex", flexDirection: "column", gap: 0 }}>
              <p style={{ margin: "0 0 10px", fontSize: "0.9rem", color: "#64748b" }}>
                Revisa <strong style={{ color: "#1a202c" }}>{email}</strong> e ingresa el código de 6 dígitos.
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "14px 120px 1fr", alignItems: "baseline", gap: "10px", padding: "8px 0", borderBottom: "1px solid #f1f5f9" }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#c0c9d6" strokeWidth="2" style={{ marginTop: "1px" }}>
                  <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
                <span style={{ fontSize: "0.9rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: "#a0aec0" }}>Código</span>
                <input type="text" required inputMode="numeric" maxLength={6} value={codigo}
                  onChange={e => { setCodigo(e.target.value.replace(/\D/g, "").slice(0, 6)); setError(""); }}
                  onPaste={e => { e.preventDefault(); setCodigo(e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6)); }}
                  placeholder="000000"
                  aria-label="Código de 6 dígitos"
                  style={{ ...inp, fontSize: "20px", fontWeight: 900, letterSpacing: "0.3em", textAlign: "center" }}
                  onFocus={e => e.target.style.borderColor = "#F47920"}
                  onBlur={e => e.target.style.borderColor = COLORS.silver} />
              </div>
              {error && (
                <div role="alert" style={{ marginTop: "10px", padding: "7px 10px", borderRadius: "7px", fontSize: "11px", fontWeight: 600, display: "flex", alignItems: "center", gap: "6px", background: "#fee2e2", color: "#dc2626", border: "1px solid rgba(220,38,38,0.3)" }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                  {error}
                </div>
              )}
            </form>
          ) : (
            <form onSubmit={handleReset} style={{ display: "flex", flexDirection: "column", gap: "0" }}>
              <p style={{ color: COLORS.textMuted, fontSize: "11px", marginBottom: "10px" }}>Elige una nueva contraseña.</p>

              {/* Nueva contraseña */}
              <div style={{ display: "grid", gridTemplateColumns: "14px 110px 1fr", alignItems: "center", gap: "8px", padding: "8px 0", borderBottom: "1px solid #f1f5f9" }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#c0c9d6" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                <span style={{ fontSize: "0.82rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: "#a0aec0" }}>Nueva</span>
                <div style={{ position: "relative" }}>
                  <input id="rec-p1" type={showP1 ? "text" : "password"} required value={pass1}
                    onChange={e => setPass1(e.target.value)}
                    placeholder="Mínimo 8 caracteres"
                    aria-describedby="fuerza-pass"
                    className="[&::-ms-reveal]:hidden [&::-ms-clear]:hidden"
                    style={{ ...inp, paddingRight: "34px" }}
                    onFocus={INPUT_FOCUS} onBlur={INPUT_BLUR} />
                  <button type="button" tabIndex={-1} onClick={e => { e.stopPropagation(); setShowP1(v => !v); }}
                    aria-label={showP1 ? "Ocultar" : "Mostrar"}
                    style={{ position: "absolute", right: "8px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: COLORS.silver, padding: 0 }}>
                    {showP1 ? <EyeIcon /> : <EyeOffIcon />}
                  </button>
                </div>
              </div>

              {/* Barra de fortaleza + reglas de la política */}
              {pass1.length > 0 && (
                <div id="fuerza-pass" style={{ padding: "6px 0 8px", borderBottom: "1px solid #f1f5f9" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "5px" }}>
                    <div style={{ flex: 1, height: "4px", borderRadius: "99px", overflow: "hidden", background: COLORS.silverLight }}>
                      <div style={{ height: "100%", borderRadius: "99px", transition: "all 0.3s", width: `${fuerza.pct}%`, background: fuerza.color }} />
                    </div>
                    <span style={{ fontSize: "10px", fontWeight: 700, textAlign: "right", color: fuerza.color }}>{fuerza.etiqueta}</span>
                  </div>
                  <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2px 8px" }}>
                    {fuerza.reglas.map(r => (
                      <li key={r.id} style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "10px", color: r.ok ? "#16a34a" : "#9ca3af" }}>
                        {r.ok
                          ? <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                          : <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="6" y1="6" x2="18" y2="18"/><line x1="18" y1="6" x2="6" y2="18"/></svg>}
                        {r.texto}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Confirmar contraseña */}
              <div style={{ display: "grid", gridTemplateColumns: "14px 110px 1fr", alignItems: "center", gap: "8px", padding: "8px 0", borderBottom: "1px solid #f1f5f9" }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#c0c9d6" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
                <span style={{ fontSize: "0.82rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: "#a0aec0" }}>Confirmar</span>
                <div style={{ position: "relative" }}>
                  <input id="rec-p2" type={showP2 ? "text" : "password"} required value={pass2}
                    onChange={e => setPass2(e.target.value)}
                    placeholder="Mínimo 8 caracteres"
                    className="[&::-ms-reveal]:hidden [&::-ms-clear]:hidden"
                    style={{ ...inp, paddingRight: "34px" }}
                    onFocus={INPUT_FOCUS} onBlur={INPUT_BLUR} />
                  <button type="button" tabIndex={-1} onClick={e => { e.stopPropagation(); setShowP2(v => !v); }}
                    aria-label={showP2 ? "Ocultar" : "Mostrar"}
                    style={{ position: "absolute", right: "8px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: COLORS.silver, padding: 0 }}>
                    {showP2 ? <EyeIcon /> : <EyeOffIcon />}
                  </button>
                </div>
              </div>

              {error && (
                <div role="alert" style={{ marginTop: "10px", padding: "7px 10px", borderRadius: "7px", fontSize: "11px", fontWeight: 600, display: "flex", alignItems: "center", gap: "6px", background: "#fee2e2", color: "#dc2626", border: "1px solid rgba(220,38,38,0.3)" }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                  {error}
                </div>
              )}
            </form>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: "10px 18px",
          borderTop: "1px solid #e8ecf0",
          background: "#f8fafc",
          display: "flex",
          justifyContent: exito ? "center" : paso === 2 ? "space-between" : "flex-end",
          alignItems: "center",
          gap: "8px",
          flexShrink: 0,
        }}>
          {exito ? (
            <button
              onClick={onCerrar}
              style={{ padding: "6px 18px", borderRadius: "6px", fontSize: "1rem", fontWeight: 600, background: `linear-gradient(135deg,${COLORS.orange},${COLORS.orangeDark})`, border: "none", color: "#fff", cursor: "pointer", boxShadow: "0 2px 10px rgba(244,121,32,0.35)" }}
              onMouseEnter={e => e.currentTarget.style.filter = "brightness(1.1)"}
              onMouseLeave={e => e.currentTarget.style.filter = ""}>
              Ir al inicio de sesión
            </button>
          ) : (
            <>
              {paso === 2 && (
                <button type="button" onClick={() => { setPaso(1); setError(""); setCodigo(""); }}
                  style={{ padding: "6px 14px", borderRadius: "6px", fontSize: "0.9rem", fontWeight: 600, background: "transparent", border: "1px solid #e8ecf0", color: "#64748b", cursor: "pointer", transition: "all 0.12s" }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = "#64748b"; e.currentTarget.style.color = "#1a202c"; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = "#e8ecf0"; e.currentTarget.style.color = "#64748b"; }}>
                  Cambiar correo
                </button>
              )}
              <button
                onClick={paso === 1 ? handleEmail : paso === 2 ? handleCodigo : handleReset}
                disabled={loading || (paso === 2 && codigo.length !== 6)}
                style={{ padding: "6px 18px", borderRadius: "6px", fontSize: "1rem", fontWeight: 600, background: `linear-gradient(135deg,${COLORS.orange},${COLORS.orangeDark})`, border: "none", color: "#fff", cursor: (loading || (paso === 2 && codigo.length !== 6)) ? "not-allowed" : "pointer", opacity: (loading || (paso === 2 && codigo.length !== 6)) ? 0.6 : 1, boxShadow: "0 2px 10px rgba(244,121,32,0.35)", transition: "all 0.12s" }}
                onMouseEnter={e => { if (!loading) e.currentTarget.style.filter = "brightness(1.1)"; }}
                onMouseLeave={e => e.currentTarget.style.filter = ""}>
                {loading ? "Cargando..."
                  : paso === 1 ? "Enviar código"
                  : paso === 2 ? "Verificar código"
                  : "Guardar contraseña"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Pantalla de entrada (post-login) ─────────────────────────
function PantallaEntrada() {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center"
      style={{ background: "#0a0a0a", fontFamily: "'Inter','Segoe UI',sans-serif", zIndex: 9999 }}>

      <div className="absolute inset-0 pointer-events-none"
        style={{ background: "radial-gradient(ellipse 60% 50% at 50% 50%, rgba(244,121,32,0.08) 0%, transparent 70%)" }} />

      <div className="relative flex flex-col items-center gap-5">
        <div className="relative flex items-center justify-center">
          <div className="absolute rounded-full"
            style={{
              inset: "-18px",
              background: "radial-gradient(circle, rgba(244,121,32,0.15) 0%, transparent 70%)",
              animation: "pulse-glow 2s ease-in-out infinite",
            }} />
          <img src="/assets/img/logo.png" alt="Precision Truck Parts"
            className="h-[90px] w-auto object-contain"
            style={{ filter: "drop-shadow(0 0 18px rgba(244,121,32,0.40))", animation: "fade-in 0.5s ease-out forwards" }} />
        </div>

        <div className="text-center flex flex-col gap-1">
          <p className="text-white text-lg font-black uppercase tracking-widest leading-none"
            style={{ animation: "slide-up 0.5s 0.15s ease-out both" }}>
            Precision Truck Parts, Parts and Accesories, S.A de C.V.
          </p>
          <p className="text-[11px] font-medium uppercase tracking-widest"
            style={{ color: "rgba(255,255,255,0.35)", animation: "slide-up 0.5s 0.28s ease-out both" }}>
            Bienvenido · Cargando sistema...
          </p>
        </div>

        <div className="w-[180px] h-[3px] rounded-full overflow-hidden"
          style={{ background: "rgba(255,255,255,0.08)", animation: "slide-up 0.5s 0.38s ease-out both" }}>
          <div className="h-full rounded-full"
            style={{
              background: "linear-gradient(90deg, #F47920, #ffb347, #F47920)",
              backgroundSize: "200% 100%",
              animation: "progress 1.5s ease-in-out forwards, shimmer 1.5s 0.3s linear infinite",
            }} />
        </div>

        <div className="w-8 h-8 rounded-full border-[2.5px]"
          style={{
            borderColor: "rgba(244,121,32,0.2)",
            borderTopColor: "#F47920",
            animation: "spin 0.8s linear infinite, slide-up 0.5s 0.45s ease-out both",
          }} />
      </div>

      <style>{`
        @keyframes spin        { to { transform: rotate(360deg); } }
        @keyframes progress    { 0%{width:0%} 100%{width:100%} }
        @keyframes shimmer     { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
        @keyframes pulse-glow  { 0%,100%{opacity:0.5;transform:scale(1)} 50%{opacity:1;transform:scale(1.12)} }
        @keyframes fade-in     { from{opacity:0;transform:scale(0.92)} to{opacity:1;transform:scale(1)} }
        @keyframes slide-up    { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
      `}</style>
    </div>
  );
}

// ── Login principal ───────────────────────────────────────────
const MAX_INTENTOS = 3;
const BLOQUEO_SEG  = 30;

export default function Login({ onLogin }) {
  // Forzar tema claro mientras el login está montado
  useLayoutEffect(() => {
    document.documentElement.setAttribute("data-theme", "light");
  }, []);
  const [email, setEmail]           = useState("");
  const [password, setPassword]     = useState("");
  const [showPwd, setShowPwd]       = useState(false);
  const [error, setError]           = useState("");
  const [inactivo, setInactivo]     = useState(false);
  const [loading, setLoading]       = useState(false);
  const [entrando, setEntrando]     = useState(false);
  const [modalRec, setModalRec]     = useState(false);
  const [emailTouched, setEmailTouched] = useState(false);
  const [intentos, setIntentos]     = useState(0);
  // Fix #14: persistir bloqueo en sessionStorage para que sobreviva recargas de página
  const [bloqueado, setBloqueado]   = useState(() => {
    const fin = parseInt(sessionStorage.getItem("login_bloqueo_fin") || "0");
    const restante = Math.ceil((fin - Date.now()) / 1000);
    return restante > 0 ? restante : 0;
  });
  const [shakeCard, setShakeCard]   = useState(false);
  const [cooldown,  setCooldown]    = useState(0);

  const emailOk    = emailValido(email);
  const canSubmit  = emailOk && password.length >= 8 && !loading && bloqueado === 0 && cooldown === 0;

  const iniciarBloqueo = useCallback(() => {
    const fin = Date.now() + BLOQUEO_SEG * 1000;
    sessionStorage.setItem("login_bloqueo_fin", String(fin));
    setBloqueado(BLOQUEO_SEG);
    const interval = setInterval(() => {
      setBloqueado(s => {
        if (s <= 1) {
          clearInterval(interval);
          sessionStorage.removeItem("login_bloqueo_fin");
          return 0;
        }
        return s - 1;
      });
    }, 1000);
  }, []);

  const triggerShake = useCallback(() => {
    setShakeCard(true);
    setTimeout(() => setShakeCard(false), 600);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    setError(""); setInactivo(false); setLoading(true);
    try {
      const res  = await apiFetch("/api/auth/login", { method: "POST", body: { email, password } });
      const data = await res.json();
      if (!res.ok) {
        // Limpiar contraseña tras error
        setPassword("");
        triggerShake();
        if (res.status === 403) { setInactivo(true); return; }
        const nuevosIntentos = intentos + 1;
        setIntentos(nuevosIntentos);
        if (nuevosIntentos >= MAX_INTENTOS) {
          iniciarBloqueo();
          setIntentos(0);
          setError(`Demasiados intentos. Espera ${BLOQUEO_SEG} segundos.`);
        } else {
          setError(data.error || "Credenciales incorrectas");
          // Cooldown progresivo: 2s, 4s, 8s...
          const secs = Math.min(2 ** nuevosIntentos, 16);
          setCooldown(secs);
          const iv = setInterval(() => setCooldown(s => { if (s <= 1) { clearInterval(iv); return 0; } return s - 1; }), 1000);
        }
        return;
      }
      setEntrando(true);
      setIntentos(0);
      sessionStorage.setItem("_pwd", password);
      if (navigator.vibrate) navigator.vibrate(50);
      setTimeout(() => { setEntrando(false); onLogin(data.usuario, data.id_acceso, data.token); }, 1500);
    } catch {
      setError("No se pudo conectar con el servidor"); triggerShake();
      const secs = Math.min(2 ** (intentos + 1), 16);
      setCooldown(secs);
      const iv = setInterval(() => setCooldown(s => { if (s <= 1) { clearInterval(iv); return 0; } return s - 1; }), 1000);
    }
    finally { setLoading(false); }
  };

  if (entrando) return <PantallaEntrada />;

  const inputEmailBorder = emailTouched
    ? (emailOk ? "#16a34a" : "#ef4444")
    : COLORS.silver;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        @media (max-height: 500px) and (orientation: landscape) {
          .login-card-header { padding: 8px 16px !important; }
          .login-card-body   { padding: 8px 16px 12px !important; }
          .login-logo        { height: 22px !important; }
          .login-title-gap   { margin-bottom: 6px !important; }
          .login-form-gap    { gap: 6px !important; }
          .login-input       { padding: 6px 8px 6px 28px !important; font-size: 12px !important; }
          .login-btn         { padding: 7px 14px !important; font-size: 12px !important; }
          .login-forgot      { margin-top: 0 !important; }
        }
        @media (max-width: 480px) {
          .login-card-header { padding: 14px 18px !important; }
          .login-card-body   { padding: 20px 18px 18px !important; }
          .login-title-gap   { margin-bottom: 18px !important; }
          .login-form-gap    { gap: 14px !important; }
          .login-logo        { height: 30px !important; }
          .login-input       { padding: 12px 12px 12px 34px !important; font-size: 15px !important; }
          .login-btn         { padding: 13px 16px !important; font-size: 14px !important; }
          .login-forgot      { margin-top: 0 !important; }
        }
        @keyframes fade-in-card  { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        @keyframes shake-card    { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-6px)} 40%{transform:translateX(6px)} 60%{transform:translateX(-4px)} 80%{transform:translateX(4px)} }
        .login-card-wrap  { animation: fade-in-card 0.4s ease-out both; }
        .login-card-shake { animation: shake-card 0.5s ease-out both; }
      `}</style>

      <div className="fixed inset-0 overflow-y-auto overflow-x-hidden"
        style={{ fontFamily: "'Inter','Segoe UI',sans-serif" }}>

        {modalRec && <ModalRecuperar onCerrar={() => setModalRec(false)} />}

        {/* Fondo */}
        <div className="fixed inset-0 -z-10" style={BG_IMAGE} />
        <div className="fixed inset-0 -z-10" style={{ background: "rgba(10,10,10,0.48)" }} />

        <div className="min-h-screen flex items-center justify-center px-4 py-6 sm:px-6 lg:justify-end lg:pr-[5vw]">

          <div className={`w-full relative ${shakeCard ? "login-card-shake" : "login-card-wrap"}`}
            style={{
              maxWidth: "min(370px, 92vw)",
              background: "linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)",
              borderRadius: "16px",
              boxShadow: "0 24px 64px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.08)",
              overflow: "hidden",
              borderLeft: `3px solid ${COLORS.orange}`,
            }}>

            {/* Cabecera institucional */}
            <div className="login-card-header flex items-center gap-3"
              style={{
                padding: "16px 24px",
                borderBottom: "1px solid #E2E8F0",
                background: "#F8FAFC",
              }}>
              <img src="/assets/img/log.png" alt="Precision Truck Parts"
                className="login-logo object-contain flex-shrink-0"
                style={{ height: "clamp(32px, 6vw, 44px)", maxWidth: "140px" }} />
              <div style={{ borderLeft: "1px solid #E2E8F0", paddingLeft: "12px" }}>
                <p style={{ fontSize: "10px", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "#475569", lineHeight: 1 }}>Sistema Interno</p>
                <p style={{ fontSize: "9px", fontWeight: 400, color: "#94A3B8", marginTop: "3px", lineHeight: 1 }}>HelpDesk · Soporte Técnico</p>
              </div>
            </div>

            {/* Cuerpo del formulario */}
            <div className="login-card-body" style={{ padding: "24px 24px 20px" }}>

              {/* Título */}
              <div className="login-title-gap" style={{ marginBottom: "20px" }}>
                <h1 style={{ color: "#0F172A", fontSize: "18px", fontWeight: 700, lineHeight: 1.2, letterSpacing: "-0.02em" }}>
                  Iniciar sesión
                </h1>
                <p style={{ color: "#64748B", fontSize: "12px", marginTop: "4px", fontWeight: 400, letterSpacing: "0.01em" }}>
                  Ingresa tus credenciales corporativas
                </p>
              </div>

              <form onSubmit={handleSubmit} className="login-form-gap flex flex-col" style={{ gap: "14px" }}
                aria-label="Formulario de inicio de sesión">

                {/* Email */}
                <div>
                  <label htmlFor="login-email" className="block"
                    style={{ color: "#475569", fontSize: "11px", fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: "6px" }}>
                    Correo electrónico
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                      style={{ color: emailTouched && emailOk ? "#16a34a" : COLORS.silver }}>
                      <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
                        <rect x="1" y="3" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                        <path d="M1 5.5l7 4.5 7-4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                      </svg>
                    </span>
                    <input
                      id="login-email"
                      type="email"
                      placeholder="usuario@dominio.com.mx"
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); setError(""); }}
                      onBlur={() => setEmailTouched(true)}
                      required
                      autoComplete="email"
                      aria-label="Correo electrónico"
                      aria-describedby={emailTouched && !emailOk ? "email-error" : undefined}
                      aria-invalid={emailTouched && !emailOk}
                      onFocus={INPUT_FOCUS}
                      className="login-input w-full focus:outline-none transition-shadow"
                      style={{
                        background: "#F8FAFC",
                        border: `1px solid ${inputEmailBorder}`,
                        borderRadius: "4px",
                        color: "#0F172A",
                        fontSize: "13px",
                        padding: "8px 12px 8px 30px",
                        transition: "border-color .2s",
                      }}
                    />
                    {/* Ícono check / error en tiempo real */}
                    {emailTouched && (
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                        {emailOk
                          ? <svg width="13" height="13" viewBox="0 0 14 14" fill="none"><path d="M2 7l3.5 3.5 6.5-7" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                          : <svg width="13" height="13" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="6" stroke="#ef4444" strokeWidth="1.5"/><path d="M7 4v3.5M7 9.5v.5" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round"/></svg>
                        }
                      </span>
                    )}
                  </div>
                  {emailTouched && !emailOk && email.length > 0 && (
                    <p id="email-error" role="alert" style={{ color: "#ef4444", fontSize: "11px", marginTop: "4px" }}>
                      {emailCorporativoValido(email)}
                    </p>
                  )}
                </div>

                {/* Contraseña */}
                <div>
                  <label htmlFor="login-password" className="block"
                    style={{ color: "#475569", fontSize: "11px", fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: "6px" }}>
                    Contraseña
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: COLORS.silver }}>
                      <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
                        <rect x="4" y="7" width="8" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
                        <path d="M5.5 7V5a2.5 2.5 0 015 0v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                      </svg>
                    </span>
                    <input
                      id="login-password"
                      type={showPwd ? "text" : "password"}
                      placeholder="••••••••••"
                      value={password}
                      onChange={(e) => { setPassword(e.target.value); setError(""); }}
                      required
                      autoComplete="current-password"
                      aria-label="Contraseña"
                      aria-describedby="pwd-hint"
                      onFocus={INPUT_FOCUS} onBlur={INPUT_BLUR}
                      className="login-input w-full focus:outline-none transition-shadow [&::-ms-reveal]:hidden [&::-ms-clear]:hidden"
                      style={{
                        background: "#F8FAFC",
                        border: "1px solid #CBD5E1",
                        borderRadius: "4px",
                        color: "#0F172A",
                        fontSize: "13px",
                        padding: "8px 36px 8px 30px",
                      }}
                    />
                    <button
                      type="button" tabIndex={-1}
                      onClick={() => setShowPwd(v => !v)}
                      aria-label={showPwd ? "Ocultar contraseña" : "Mostrar contraseña"}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 transition-colors"
                      style={{ color: COLORS.silver }}
                      onMouseEnter={e => e.currentTarget.style.color = COLORS.orange}
                      onMouseLeave={e => e.currentTarget.style.color = COLORS.silver}>
                      {showPwd ? <EyeIcon /> : <EyeOffIcon />}
                    </button>
                  </div>
                  <p id="pwd-hint" style={{ color: "#9ca3af", fontSize: "11px", marginTop: "4px", textAlign: "right" }}>
                    Mínimo 8 caracteres
                  </p>
                </div>

                {/* Olvidé contraseña */}
                <div className="login-forgot flex justify-between items-center" style={{ marginTop: "-6px" }}>
                  <span style={{ fontSize: "11px", color: "#94A3B8" }}>
                    {MAX_INTENTOS - intentos < MAX_INTENTOS && intentos > 0 && intentos < MAX_INTENTOS && !error
                      ? `${MAX_INTENTOS - intentos} intento${MAX_INTENTOS - intentos !== 1 ? "s" : ""} restante${MAX_INTENTOS - intentos !== 1 ? "s" : ""}`
                      : ""}
                  </span>
                  <button type="button" onClick={() => setModalRec(true)}
                    className="hover:underline"
                    style={{ color: COLORS.orange, fontSize: "12px", fontWeight: 500 }}>
                    ¿Olvidaste tu contraseña?
                  </button>
                </div>

                {/* Error */}
                {error && (
                  <div key={error} role="alert"
                    className="rounded-lg px-2.5 py-1.5 text-[11px] font-semibold flex items-center gap-1.5"
                    style={{ background: "#fee2e2", color: "#dc2626", border: "1px solid #fca5a5" }}>
                    <svg width="12" height="12" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                      <circle cx="7" cy="7" r="6" stroke="#dc2626" strokeWidth="1.5"/>
                      <path d="M7 4v3.5M7 9.5v.5" stroke="#dc2626" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                    {error}
                    {/* Contador de bloqueo */}
                    {bloqueado > 0 && (
                      <span className="ml-auto font-black tabular-nums" style={{ color: "#dc2626" }}>
                        {bloqueado}s
                      </span>
                    )}
                  </div>
                )}

                {/* Cuenta inactiva */}
                {inactivo && (
                  <div role="alert" className="rounded-lg px-2.5 py-2 flex flex-col gap-0.5"
                    style={{ background: "#fefce8", border: "1px solid #fde047" }}>
                    <p className="text-[11px] font-black" style={{ color: "#854d0e" }}>Cuenta desactivada</p>
                    <p className="text-[10px]" style={{ color: "#a16207" }}>
                      Contacta al administrador para reactivarla.
                    </p>
                  </div>
                )}

                {/* Botón */}
                <button
                  type="submit"
                  disabled={!canSubmit}
                  aria-busy={loading}
                  className="login-btn w-full font-semibold tracking-wide text-white transition-all"
                  style={{
                    background: canSubmit ? COLORS.orange : "#CBD5E1",
                    borderRadius: "4px",
                    boxShadow: canSubmit ? `0 2px 8px rgba(244,121,32,0.35)` : "none",
                    fontSize: "13px",
                    padding: "9px 16px",
                    letterSpacing: "0.01em",
                    cursor: canSubmit ? "pointer" : "not-allowed",
                    opacity: canSubmit ? 1 : 0.60,
                    color: canSubmit ? "#fff" : "#94A3B8",
                    marginTop: "4px",
                  }}>
                  {loading ? "Verificando credenciales..." : bloqueado > 0 ? `Acceso bloqueado · ${bloqueado}s` : cooldown > 0 ? `Espera ${cooldown}s antes de reintentar` : (
                    <span className="flex items-center justify-center gap-2">
                      Iniciar sesión
                      <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                        <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </span>
                  )}
                </button>
              </form>

              {/* Divider + Footer */}
              <div style={{ borderTop: "1px solid #E2E8F0", marginTop: "16px", paddingTop: "12px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <p className="select-none" style={{ color: "#94A3B8", fontSize: "10px", fontWeight: 400 }}>
                  © 2026 Precision Truck Parts, Parts and Accesories, S.A de C.V.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
