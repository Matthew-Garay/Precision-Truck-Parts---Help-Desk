import { useState, useCallback, useEffect, useRef } from "react";
import { apiFetch } from "../Config/api.js";
import { COLORS, RADIUS, BG_IMAGE, BG_OVERLAY, DIAGONAL, INPUT_FOCUS, INPUT_BLUR } from "../Config/DesignSystem";
import { EyeIcon, EyeOffIcon } from "../Components/Icons";

// ── Helpers ───────────────────────────────────────────────────
const emailValido = v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

const fuerzaPassword = p => {
  if (p.length < 6) return null;
  let score = 0;
  if (p.length >= 10)        score++;
  if (/[A-Z]/.test(p))       score++;
  if (/[0-9]/.test(p))       score++;
  if (/[^A-Za-z0-9]/.test(p)) score++;
  if (score <= 1) return { label: "Débil",   color: "#dc2626", bg: "#fee2e2", w: "33%"  };
  if (score <= 2) return { label: "Media",   color: "#ca8a04", bg: "#fef9c3", w: "66%"  };
  return              { label: "Fuerte",  color: "#16a34a", bg: "#dcfce7", w: "100%" };
};

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

  const fuerza = fuerzaPassword(pass1);

  const inp = {
    background: COLORS.silverBg, border: `1px solid ${COLORS.silver}`,
    borderRadius: RADIUS.input, color: COLORS.dark,
    fontSize: "14px", padding: "11px 14px", width: "100%", outline: "none",
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
    if (pass1.length < 8) { setError("Mínimo 8 caracteres"); return; }
    setLoading(true);
    try {
      const res  = await apiFetch("/api/auth/reset-password", { method: "POST", body: { email, codigo, password_nueva: pass1 } });
      const data = await res.json();
      if (!res.ok) {
        if (data.error?.includes("Código") || data.error?.includes("expiró")) { setPaso(2); setCodigo(""); }
        setError(data.error || "Error al restablecer"); return;
      }
      setExito(true);
      sessionStorage.setItem("pwd_actual", pass1);
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
          <button onClick={onCerrar} aria-label="Cerrar modal" className="w-6 h-6 rounded-lg flex items-center justify-center"
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
                <label htmlFor="rec-email" className="block text-[9px] font-bold uppercase tracking-widest mb-1" style={{ color: COLORS.label }}>Correo electrónico</label>
                <input id="rec-email" type="email" required value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="usuario@empresa.com" style={inp} onFocus={INPUT_FOCUS} onBlur={INPUT_BLUR}
                  aria-label="Correo electrónico para recuperación" />
              </div>
              {error && <p role="alert" className="text-[11px] font-semibold px-2 py-1.5 rounded-lg" style={{ background: "#fee2e2", color: "#dc2626" }}>{error}</p>}
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
                onPaste={e => {
                  e.preventDefault();
                  const limpio = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
                  setCodigo(limpio);
                }}
                placeholder="000000"
                aria-label="Código de 6 dígitos"
                style={{ ...inp, fontSize: "22px", fontWeight: 900, letterSpacing: "0.3em", textAlign: "center", padding: "14px" }}
                onFocus={INPUT_FOCUS} onBlur={INPUT_BLUR} />
              {error && <p role="alert" className="text-[11px] font-semibold px-2 py-1.5 rounded-lg" style={{ background: "#fee2e2", color: "#dc2626" }}>{error}</p>}
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
                { id: "rec-p1", label: "Nueva contraseña",    val: pass1, set: setPass1, show: showP1, toggle: () => setShowP1(v => !v) },
                { id: "rec-p2", label: "Confirmar contraseña", val: pass2, set: setPass2, show: showP2, toggle: () => setShowP2(v => !v) },
              ].map(({ id, label, val, set, show, toggle }) => (
                <div key={id}>
                  <label htmlFor={id} className="block text-[9px] font-bold uppercase tracking-widest mb-1" style={{ color: COLORS.label }}>{label}</label>
                  <div className="relative">
                    <input id={id} type={show ? "text" : "password"} required value={val} onChange={e => set(e.target.value)}
                      placeholder="Mínimo 8 caracteres" style={{ ...inp, paddingRight: "34px" }}
                      onFocus={INPUT_FOCUS} onBlur={INPUT_BLUR}
                      aria-describedby={id === "rec-p1" ? "fuerza-pass" : undefined} />
                    <button type="button" tabIndex={-1} onClick={toggle}
                      aria-label={show ? "Ocultar contraseña" : "Mostrar contraseña"}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2" style={{ color: COLORS.silver }}>
                      {show ? <EyeIcon /> : <EyeOffIcon />}
                    </button>
                  </div>
                  {/* Barra de fortaleza solo en campo nueva contraseña */}
                  {id === "rec-p1" && pass1.length > 0 && (
                    <div id="fuerza-pass" className="mt-1.5 flex flex-col gap-1">
                      <div className="w-full h-1 rounded-full overflow-hidden" style={{ background: COLORS.silverLight }}>
                        <div className="h-full rounded-full transition-all duration-300" style={{ width: fuerza?.w ?? "0%", background: fuerza?.color ?? "transparent" }} />
                      </div>
                      {fuerza && <p className="text-[10px] font-bold text-right" style={{ color: fuerza.color }}>{fuerza.label}</p>}
                    </div>
                  )}
                </div>
              ))}
              {error && <p role="alert" className="text-[11px] font-semibold px-2 py-1.5 rounded-lg" style={{ background: "#fee2e2", color: "#dc2626" }}>{error}</p>}
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
const ESTADOS = [
  "Validando credenciales...",
  "Estableciendo conexión segura...",
  "Cargando módulos...",
  "Iniciando sesión...",
];

function PantallaEntrada() {
  const [estadoIdx, setEstadoIdx] = useState(0);
  const [visible, setVisible]     = useState(true);
  const timerRef = useRef(null);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setEstadoIdx(i => (i + 1) % ESTADOS.length);
        setVisible(true);
      }, 300);
    }, 1400);
    return () => clearInterval(timerRef.current);
  }, []);

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center"
      style={{ background: "#0a0a0a", fontFamily: "'Inter','Segoe UI',sans-serif" }}>

      {/* Luz de fondo con blur */}
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        background: "radial-gradient(ellipse 55% 40% at 50% 50%, rgba(244,121,32,0.09) 0%, transparent 70%)",
        backdropFilter: "blur(0px)",
      }} />

      <div className="relative flex flex-col items-center" style={{ gap: "24px" }}>

        {/* Logo con glow + entrada */}
        <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{
            position: "absolute", inset: "-20px", borderRadius: "50%",
            background: "radial-gradient(circle, rgba(244,121,32,0.16) 0%, transparent 70%)",
            animation: "pulse-glow 2.4s ease-in-out infinite",
          }} />
          <img src="/assets/img/logo.png" alt="Precision Truck Parts"
            style={{
              height: "88px", width: "auto", objectFit: "contain",
              filter: "drop-shadow(0 0 16px rgba(244,121,32,0.40))",
              animation: "logo-enter 0.5s ease-out forwards",
            }} />
        </div>

        {/* Título + subtítulo */}
        <div style={{ textAlign: "center", display: "flex", flexDirection: "column", gap: "8px" }}>
          <p style={{
            color: "#ffffff", fontSize: "17px", fontWeight: 900,
            letterSpacing: "0.10em", textTransform: "uppercase", lineHeight: 1,
            animation: "slide-up 0.5s 0.15s ease-out both",
          }}>Precision Truck Parts</p>

          {/* Estado dinámico con fade */}
          <p style={{
            color: "rgba(255,255,255,0.38)", fontSize: "10px", fontWeight: 500,
            letterSpacing: "0.14em", textTransform: "uppercase",
            animation: "slide-up 0.5s 0.28s ease-out both",
            opacity: visible ? 1 : 0,
            transition: "opacity 0.28s ease",
          }}>{ESTADOS[estadoIdx]}</p>
        </div>

        {/* Barra de progreso líquida */}
        <div style={{
          width: "200px", height: "3px", borderRadius: "99px",
          background: "rgba(255,255,255,0.07)", overflow: "hidden",
          animation: "slide-up 0.5s 0.4s ease-out both",
        }}>
          <div style={{
            height: "100%",
            background: "linear-gradient(90deg, transparent 0%, #ea580c 30%, #f97316 50%, #ea580c 70%, transparent 100%)",
            backgroundSize: "300% 100%",
            animation: "liquid-wave 1.6s linear infinite",
            width: "100%",
          }} />
        </div>
      </div>

      <style>{`
        @keyframes logo-enter   { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        @keyframes slide-up     { from{opacity:0;transform:translateY(8px)}  to{opacity:1;transform:translateY(0)} }
        @keyframes pulse-glow   { 0%,100%{opacity:0.55;transform:scale(1)} 50%{opacity:1;transform:scale(1.10)} }
        @keyframes liquid-wave  { 0%{background-position:200% 0} 100%{background-position:-100% 0} }
      `}</style>
    </div>
  );
}

// ── Login principal ───────────────────────────────────────────
const MAX_INTENTOS = 3;
const BLOQUEO_SEG  = 30;

export default function Login({ onLogin }) {
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

  const emailOk    = emailValido(email);
  const canSubmit  = emailOk && password.length >= 8 && !loading && bloqueado === 0;

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
        }
        return;
      }
      setEntrando(true);
      setIntentos(0);
      sessionStorage.setItem("pwd_actual", password);
      if (navigator.vibrate) navigator.vibrate(50);
      setTimeout(() => { setEntrando(false); onLogin(data.usuario, data.id_acceso, data.token); }, 1500);
    } catch { setError("No se pudo conectar con el servidor"); triggerShake(); }
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
          .login-card-header { padding: 12px 24px !important; }
          .login-card-body   { padding: 12px 24px 16px !important; }
          .login-logo        { height: 28px !important; }
          .login-title-gap   { margin-bottom: 8px !important; }
          .login-form-gap    { gap: 8px !important; }
          .login-input       { padding: 8px 10px 8px 34px !important; font-size: 13px !important; }
          .login-btn         { padding: 9px 16px !important; font-size: 13px !important; }
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
        <div className="fixed inset-0 -z-10" style={{ background: BG_OVERLAY }} />

        {/* Diagonal decorativa */}
        <div className="fixed inset-0 -z-10 hidden lg:block pointer-events-none" style={DIAGONAL.desktop} />
        <div className="fixed inset-0 -z-10 lg:hidden pointer-events-none" style={DIAGONAL.mobile} />

        <div className="min-h-screen flex items-center justify-center px-4 py-6 sm:px-6 lg:justify-end lg:pr-[5vw]">

          <div className={`w-full relative ${shakeCard ? "login-card-shake" : "login-card-wrap"}`}
            style={{
              maxWidth: "400px",
              background: "#FFFFFF",
              borderRadius: "10px",
              boxShadow: "0 20px 60px rgba(0,0,0,0.50), 0 0 0 1px rgba(255,255,255,0.06)",
              overflow: "hidden",
              borderLeft: `3px solid ${COLORS.orange}`,
            }}>

            {/* Cabecera institucional */}
            <div className="login-card-header flex items-center gap-4"
              style={{
                padding: "20px 28px",
                borderBottom: "1px solid #E2E8F0",
                background: "#F8FAFC",
              }}>
              <img src="/assets/img/log.png" alt="Precision Truck Parts"
                className="login-logo object-contain flex-shrink-0"
                style={{ height: "clamp(40px, 8vw, 56px)", maxWidth: "160px" }} />
              <div style={{ borderLeft: "1px solid #E2E8F0", paddingLeft: "16px" }}>
                <p style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "#475569", lineHeight: 1 }}>Sistema Interno</p>
                <p style={{ fontSize: "10px", fontWeight: 400, color: "#94A3B8", marginTop: "3px", lineHeight: 1 }}>HelpDesk · Soporte Técnico</p>
              </div>
            </div>

            {/* Cuerpo del formulario */}
            <div className="login-card-body" style={{ padding: "28px 28px 24px" }}>

              {/* Título */}
              <div className="login-title-gap" style={{ marginBottom: "24px" }}>
                <h1 style={{ color: "#0F172A", fontSize: "20px", fontWeight: 700, lineHeight: 1.2, letterSpacing: "-0.01em" }}>
                  Iniciar sesión
                </h1>
                <p style={{ color: "#64748B", fontSize: "13px", marginTop: "4px", fontWeight: 400 }}>
                  Ingresa tus credenciales corporativas
                </p>
              </div>

              <form onSubmit={handleSubmit} className="login-form-gap flex flex-col" style={{ gap: "18px" }}
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
                      placeholder="usuario@empresa.com"
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
                        fontSize: "14px",
                        padding: "10px 14px 10px 34px",
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
                      Ingresa un correo válido
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
                        fontSize: "14px",
                        padding: "10px 40px 10px 34px",
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
                    fontSize: "14px",
                    padding: "11px 16px",
                    letterSpacing: "0.01em",
                    cursor: canSubmit ? "pointer" : "not-allowed",
                    opacity: canSubmit ? 1 : 0.60,
                    color: canSubmit ? "#fff" : "#94A3B8",
                    marginTop: "4px",
                  }}>
                  {loading ? "Verificando credenciales..." : bloqueado > 0 ? `Acceso bloqueado · ${bloqueado}s` : (
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
              <div style={{ borderTop: "1px solid #E2E8F0", marginTop: "20px", paddingTop: "16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <p className="select-none" style={{ color: "#94A3B8", fontSize: "10px", fontWeight: 400 }}>
                  © 2026 Precision Truck Parts
                </p>

              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
