import { useState } from "react";
import { apiFetch } from "../Config/api.js";
import { COLORS, RADIUS, BG_IMAGE, BG_OVERLAY, DIAGONAL, INPUT_FOCUS, INPUT_BLUR } from "../Config/DesignSystem";
import { EyeIcon, EyeOffIcon } from "../Components/Icons";

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

  const inp = {
    background: COLORS.silverBg, border: `1px solid ${COLORS.silver}`,
    borderRadius: RADIUS.input, color: COLORS.dark,
    fontSize: "13px", padding: "8px 11px", width: "100%", outline: "none",
  };

  const handleEmail = async (e) => {
    e.preventDefault(); setError(""); setLoading(true);
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
      setPaso(3);
    } finally { setLoading(false); }
  };

  const handleReset = async (e) => {
    e.preventDefault(); setError("");
    if (pass1 !== pass2) { setError("Las contraseñas no coinciden"); return; }
    if (pass1.length < 6) { setError("Mínimo 6 caracteres"); return; }
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3"
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onCerrar(); }}>

      <div className="w-full rounded-2xl overflow-hidden"
        style={{ maxWidth: "320px", background: COLORS.whiteCard, boxShadow: "0 24px 60px rgba(0,0,0,0.45)", borderTop: `3px solid ${COLORS.orange}` }}>

        {/* Header */}
        <div className="px-4 py-3 flex items-center justify-between"
          style={{ borderBottom: `1px solid ${COLORS.silverLight}`, background: "linear-gradient(180deg,rgba(244,121,32,0.05),transparent)" }}>
          <div className="flex items-center gap-2">
            <span className="w-1 h-4 rounded-full" style={{ background: `linear-gradient(180deg,${COLORS.orange},${COLORS.orangeDark})` }} />
            <p className="font-black text-xs" style={{ color: COLORS.dark }}>Recuperar contraseña</p>
          </div>
          <button onClick={onCerrar} className="w-6 h-6 rounded-lg flex items-center justify-center"
            style={{ background: COLORS.silverLight, color: COLORS.label }}>
            <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
              <path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* Pasos */}
        {!exito && (
          <div className="flex items-center px-4 pt-3">
            {[1,2,3].map((n) => (
              <div key={n} className="flex items-center flex-1">
                <div className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black flex-shrink-0"
                  style={{ background: paso >= n ? COLORS.orange : COLORS.silverLight, color: paso >= n ? "#fff" : COLORS.label }}>
                  {n}
                </div>
                {n < 3 && <div className="flex-1 h-px mx-1" style={{ background: paso > n ? COLORS.orange : COLORS.silverLight }} />}
              </div>
            ))}
          </div>
        )}

        <div className="px-4 py-4">
          {exito ? (
            <div className="flex flex-col items-center gap-3">
              <div className="w-11 h-11 rounded-full flex items-center justify-center" style={{ background: "#dcfce7" }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                  <path d="M5 13l4 4L19 7" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <p className="font-black text-sm text-center" style={{ color: COLORS.dark }}>¡Contraseña actualizada!</p>
              <p className="text-xs text-center" style={{ color: COLORS.textMuted }}>Ya puedes iniciar sesión.</p>
              <button onClick={onCerrar} className="w-full font-bold text-white text-xs py-2 rounded-lg transition-all hover:brightness-110"
                style={{ background: `linear-gradient(135deg,${COLORS.orange},${COLORS.orangeDark})` }}>
                Ir al inicio de sesión
              </button>
            </div>
          ) : paso === 1 ? (
            <form onSubmit={handleEmail} className="flex flex-col gap-3">
              <p className="text-[11px]" style={{ color: COLORS.textMuted }}>Ingresa tu correo y te enviaremos un código.</p>
              <div>
                <label className="block text-[9px] font-bold uppercase tracking-widest mb-1" style={{ color: COLORS.label }}>Correo electrónico</label>
                <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="usuario@empresa.com" style={inp} onFocus={INPUT_FOCUS} onBlur={INPUT_BLUR} />
              </div>
              {error && <p className="text-[11px] font-semibold px-2 py-1.5 rounded-lg" style={{ background: "#fee2e2", color: "#dc2626" }}>{error}</p>}
              <button type="submit" disabled={loading} className="w-full font-bold text-white text-xs py-2 rounded-lg transition-all hover:brightness-110 disabled:opacity-60"
                style={{ background: `linear-gradient(135deg,${COLORS.orange},${COLORS.orangeDark})` }}>
                {loading ? "Enviando..." : "Enviar código"}
              </button>
            </form>
          ) : paso === 2 ? (
            <form onSubmit={handleCodigo} className="flex flex-col gap-3">
              <p className="text-[11px]" style={{ color: COLORS.textMuted }}>
                Revisa <strong style={{ color: COLORS.dark }}>{email}</strong> e ingresa el código de 6 dígitos.
              </p>
              <input type="text" required inputMode="numeric" maxLength={6} value={codigo}
                onChange={e => setCodigo(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="000000"
                style={{ ...inp, fontSize: "20px", fontWeight: 900, letterSpacing: "0.3em", textAlign: "center" }}
                onFocus={INPUT_FOCUS} onBlur={INPUT_BLUR} />
              {error && <p className="text-[11px] font-semibold px-2 py-1.5 rounded-lg" style={{ background: "#fee2e2", color: "#dc2626" }}>{error}</p>}
              <button type="submit" disabled={loading || codigo.length !== 6}
                className="w-full font-bold text-white text-xs py-2 rounded-lg transition-all hover:brightness-110 disabled:opacity-60"
                style={{ background: `linear-gradient(135deg,${COLORS.orange},${COLORS.orangeDark})` }}>
                Verificar código
              </button>
              <button type="button" onClick={() => { setPaso(1); setError(""); setCodigo(""); }}
                className="text-[11px] font-semibold text-center w-full" style={{ color: COLORS.label }}>
                Cambiar correo
              </button>
            </form>
          ) : (
            <form onSubmit={handleReset} className="flex flex-col gap-3">
              <p className="text-[11px]" style={{ color: COLORS.textMuted }}>Elige una nueva contraseña.</p>
              {[
                { label: "Nueva contraseña",    val: pass1, set: setPass1, show: showP1, toggle: () => setShowP1(v => !v) },
                { label: "Confirmar contraseña", val: pass2, set: setPass2, show: showP2, toggle: () => setShowP2(v => !v) },
              ].map(({ label, val, set, show, toggle }) => (
                <div key={label}>
                  <label className="block text-[9px] font-bold uppercase tracking-widest mb-1" style={{ color: COLORS.label }}>{label}</label>
                  <div className="relative">
                    <input type={show ? "text" : "password"} required value={val} onChange={e => set(e.target.value)}
                      placeholder="Mínimo 6 caracteres" style={{ ...inp, paddingRight: "34px" }} onFocus={INPUT_FOCUS} onBlur={INPUT_BLUR} />
                    <button type="button" tabIndex={-1} onClick={toggle}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2" style={{ color: COLORS.silver }}>
                      {show ? <EyeIcon /> : <EyeOffIcon />}
                    </button>
                  </div>
                </div>
              ))}
              {error && <p className="text-[11px] font-semibold px-2 py-1.5 rounded-lg" style={{ background: "#fee2e2", color: "#dc2626" }}>{error}</p>}
              <button type="submit" disabled={loading}
                className="w-full font-bold text-white text-xs py-2 rounded-lg transition-all hover:brightness-110 disabled:opacity-60"
                style={{ background: `linear-gradient(135deg,${COLORS.orange},${COLORS.orangeDark})` }}>
                {loading ? "Guardando..." : "Guardar contraseña"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Pantalla de entrada ───────────────────────────────────────
function PantallaEntrada() {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center gap-4"
      style={{ background: "#000000", fontFamily: "'Inter','Segoe UI',sans-serif" }}>
      <img src="/assets/img/logo.png" alt="PTP" className="h-14 object-contain drop-shadow-2xl" />
      <div className="w-12 h-px rounded-full" style={{ background: "linear-gradient(90deg, transparent, #F47920, transparent)" }} />
      <div className="flex flex-col items-center gap-0.5">
        <p className="text-white text-sm font-black tracking-widest uppercase">Bienvenido</p>
        <p className="text-white/40 text-[11px]">Cargando tu panel...</p>
      </div>
      <div className="w-36 h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.1)" }}>
        <div className="h-full rounded-full" style={{ background: "linear-gradient(90deg, #F47920, #ffb347)", animation: "progress 1.5s ease-in-out forwards" }} />
      </div>
      <div className="flex gap-1.5">
        {[0,1,2].map(i => (
          <div key={i} className="w-2 h-2 rounded-full" style={{ background: "#F47920", animation: `bounce 0.9s ease-in-out ${i * 0.2}s infinite` }} />
        ))}
      </div>
      <style>{`
        @keyframes bounce  { 0%,100%{transform:translateY(0);opacity:0.3} 50%{transform:translateY(-8px);opacity:1} }
        @keyframes progress{ 0%{width:0%} 100%{width:100%} }
      `}</style>
    </div>
  );
}

// ── Login principal ───────────────────────────────────────────
export default function Login({ onLogin }) {
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd]   = useState(false);
  const [error, setError]       = useState("");
  const [inactivo, setInactivo] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [entrando, setEntrando] = useState(false);
  const [modalRec, setModalRec] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); setInactivo(false); setLoading(true);
    try {
      const res  = await apiFetch("/api/auth/login", { method: "POST", body: { email, password } });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 403) { setInactivo(true); return; }
        setError(data.error || "Error al iniciar sesión"); return;
      }
      setEntrando(true);
      setTimeout(() => { setEntrando(false); onLogin(data.usuario, data.id_acceso, data.token); }, 1500);
    } catch { setError("No se pudo conectar con el servidor"); }
    finally { setLoading(false); }
  };

  if (entrando) return <PantallaEntrada />;

  return (
    <>
      {/* Estilos para landscape móvil */}
      <style>{`
        @media (max-height: 500px) and (orientation: landscape) {
          .login-card-header { padding: 8px 14px !important; }
          .login-card-body   { padding: 8px 14px 10px !important; }
          .login-logo        { height: 32px !important; }
          .login-divider     { display: none !important; }
          .login-title-gap   { margin-bottom: 6px !important; }
          .login-form-gap    { gap: 6px !important; }
          .login-input       { padding: 6px 10px !important; font-size: 12px !important; }
          .login-btn         { padding: 7px 12px !important; font-size: 12px !important; }
          .login-forgot      { margin-top: -2px !important; }
        }
      `}</style>

      <div className="fixed inset-0 overflow-y-auto overflow-x-hidden"
        style={{ fontFamily: "'Inter','Segoe UI',sans-serif" }}>

        {modalRec && <ModalRecuperar onCerrar={() => setModalRec(false)} />}

        {/* Fondo */}
        <div className="fixed inset-0 -z-10" style={BG_IMAGE} />
        <div className="fixed inset-0 -z-10" style={{ background: BG_OVERLAY }} />

        {/* Diagonal decorativa */}
        <div className="fixed inset-0 -z-10 hidden lg:block pointer-events-none" style={DIAGONAL.desktop} />
        <div className="fixed inset-0 -z-10 lg:hidden pointer-events-none" style={DIAGONAL.mobile} />

        {/* Logo marca — esquina inferior derecha */}
        <div className="fixed bottom-8 right-3 z-40 pointer-events-none select-none hidden sm:block">
          <img src="/assets/img/log .png" alt="Precision Truck Parts"
            className="object-contain drop-shadow-lg"
            style={{ height: "clamp(28px, 4vw, 44px)" }} />
        </div>

        {/*
          Contenedor principal:
          - Móvil vertical  → centrado, padding pequeño
          - Móvil horizontal → scroll, padding mínimo
          - Desktop         → alineado a la derecha
        */}
        <div className="
          min-h-screen flex items-center justify-center
          px-3 py-4
          sm:px-6
          lg:justify-end lg:pr-[4vw]
        ">
          {/* Tarjeta */}
          <div
            className="w-full relative"
            style={{
              maxWidth: "clamp(300px, 90vw, 420px)",
              background: COLORS.whiteCard,
              borderRadius: "16px",
              boxShadow: "0 20px 60px rgba(29,29,27,0.40), 0 0 0 1px rgba(244,121,32,0.10)",
              overflow: "hidden",
              borderTop: `4px solid ${COLORS.orange}`,
            }}>

            {/* Cabecera con logo */}
            <div
              className="login-card-header flex flex-col items-center relative"
              style={{
                padding: "28px 24px 20px",
                borderBottom: `1px solid ${COLORS.silverLight}`,
                background: "linear-gradient(180deg, rgba(244,121,32,0.05) 0%, transparent 100%)",
              }}>
              {/* Líneas decorativas laterales */}
              <span className="absolute left-0 top-3 bottom-3 w-[3px] rounded-r-full"
                style={{ background: `linear-gradient(180deg, transparent, ${COLORS.orange}, transparent)` }} />
              <span className="absolute right-0 top-3 bottom-3 w-[3px] rounded-l-full"
                style={{ background: `linear-gradient(180deg, transparent, ${COLORS.orange}, transparent)` }} />

              <img
                src="/assets/img/logo 1.png"
                alt="Precision Truck Parts"
                className="login-logo object-contain"
                style={{ height: "clamp(56px, 12vw, 88px)", maxWidth: "220px" }}
              />
              <span
                className="login-divider block rounded-full mt-3"
                style={{
                  background: `linear-gradient(90deg, transparent, ${COLORS.orange}, transparent)`,
                  width: "60px", height: "2px",
                }} />
            </div>

            {/* Cuerpo del formulario */}
            <div
              className="login-card-body"
              style={{ padding: "24px 28px 28px" }}>

              {/* Título */}
              <div className="login-title-gap" style={{ marginBottom: "20px" }}>
                <div className="flex items-center gap-2">
                  <span className="w-1 h-5 rounded-full flex-shrink-0"
                    style={{ background: `linear-gradient(180deg, ${COLORS.orange}, ${COLORS.orangeDark})` }} />
                  <h1 className="font-black tracking-tight" style={{ color: COLORS.dark, fontSize: "20px" }}>
                    Bienvenido
                  </h1>
                </div>
                <p style={{ color: "#6b7280", fontSize: "13px", marginTop: "4px", paddingLeft: "14px" }}>
                  Inicia sesión para continuar
                </p>
              </div>

              <form
                onSubmit={handleSubmit}
                className="login-form-gap flex flex-col"
                style={{ gap: "16px" }}>

                {/* Email */}
                <div>
                  <label className="block font-bold uppercase"
                    style={{ color: COLORS.label, fontSize: "11px", letterSpacing: "0.12em", marginBottom: "6px" }}>
                    Correo electrónico
                  </label>
                  <input
                    type="email"
                    placeholder="usuario@empresa.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                    onFocus={INPUT_FOCUS} onBlur={INPUT_BLUR}
                    className="login-input w-full focus:outline-none transition-shadow"
                    style={{
                      background: COLORS.silverBg,
                      border: `1px solid ${COLORS.silver}`,
                      borderRadius: RADIUS.input,
                      color: COLORS.dark,
                      fontSize: "14px",
                      padding: "11px 14px",
                    }}
                  />
                </div>

                {/* Contraseña */}
                <div>
                  <label className="block font-bold uppercase"
                    style={{ color: COLORS.label, fontSize: "11px", letterSpacing: "0.12em", marginBottom: "6px" }}>
                    Contraseña
                  </label>
                  <div className="relative">
                    <input
                      type={showPwd ? "text" : "password"}
                      placeholder="••••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      autoComplete="current-password"
                      onFocus={INPUT_FOCUS} onBlur={INPUT_BLUR}
                      className="login-input w-full focus:outline-none transition-shadow [&::-ms-reveal]:hidden [&::-ms-clear]:hidden"
                      style={{
                        background: COLORS.silverBg,
                        border: `1px solid ${COLORS.silver}`,
                        borderRadius: RADIUS.input,
                        color: COLORS.dark,
                        fontSize: "14px",
                        padding: "11px 40px 11px 14px",
                      }}
                    />
                    <button
                      type="button" tabIndex={-1}
                      onClick={() => setShowPwd(v => !v)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 transition-colors"
                      style={{ color: COLORS.silver }}
                      onMouseEnter={e => e.currentTarget.style.color = COLORS.orange}
                      onMouseLeave={e => e.currentTarget.style.color = COLORS.silver}>
                      {showPwd ? <EyeIcon /> : <EyeOffIcon />}
                    </button>
                  </div>
                </div>

                {/* Olvidé contraseña */}
                <div className="login-forgot flex justify-end" style={{ marginTop: "-4px" }}>
                  <button
                    type="button"
                    onClick={() => setModalRec(true)}
                    className="font-semibold hover:underline"
                    style={{ color: COLORS.orange, fontSize: "10px" }}>
                    ¿Olvidaste tu contraseña?
                  </button>
                </div>

                {/* Error */}
                {error && (
                  <div className="rounded-lg px-2.5 py-1.5 text-[11px] font-semibold"
                    style={{ background: "#fee2e2", color: "#dc2626", border: "1px solid #fca5a5" }}>
                    {error}
                  </div>
                )}

                {/* Cuenta inactiva */}
                {inactivo && (
                  <div className="rounded-lg px-2.5 py-2 flex flex-col gap-0.5"
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
                  disabled={loading}
                  className="login-btn w-full font-bold tracking-wide text-white hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-60"
                  style={{
                    background: `linear-gradient(135deg, ${COLORS.orange}, ${COLORS.orangeDark})`,
                    borderRadius: RADIUS.button,
                    boxShadow: "0 3px 14px rgba(244,121,32,0.45)",
                    fontSize: "15px",
                    padding: "13px 16px",
                    letterSpacing: "0.02em",
                  }}>
                  {loading ? "Verificando..." : "Iniciar sesión"}
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <p className="fixed bottom-2 right-3 z-40 text-right pointer-events-none select-none"
          style={{ color: "rgba(255,255,255,0.45)", fontSize: "9px", letterSpacing: "0.06em" }}>
          © 2026 Precision Truck Parts. Todos los derechos reservados.
        </p>
      </div>
    </>
  );
}
