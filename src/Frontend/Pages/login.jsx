import { useState } from "react";
import { COLORS, SHADOWS, RADIUS, BG_IMAGE, BG_OVERLAY, DIAGONAL, INPUT_FOCUS, INPUT_BLUR } from "../Config/DesignSystem";
import { EyeIcon, EyeOffIcon, GoogleIcon } from "../Components/Icons";

export default function Login({ onLogin }) {
  const [email, setEmail]          = useState("");
  const [password, setPassword]    = useState("");
  const [showPassword, setShowPwd] = useState(false);
  const [error, setError]          = useState("");
  const [inactivo, setInactivo]     = useState(false);
  const [loading, setLoading]      = useState(false);
  const [entrando, setEntrando]    = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setInactivo(false);
    setLoading(true);
    try {
      const res  = await fetch("http://localhost:3001/api/auth/login", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 403) { setInactivo(true); return; }
        setError(data.error || "Error al iniciar sesión");
        return;
      }
      setEntrando(true);
      setTimeout(() => {
        setEntrando(false);
        onLogin(data.usuario, data.id_acceso);
      }, 1500);
    } catch {
      setError("No se pudo conectar con el servidor");
    } finally {
      setLoading(false);
    }
  };

  if (entrando) return (
    <div className="fixed inset-0 flex flex-col items-center justify-center gap-6"
      style={{ background: "#000000", fontFamily: "'Inter','Segoe UI',sans-serif" }}>
      <div className="relative flex flex-col items-center gap-6">
        <img src="/assets/img/logo.png" alt="PTP" className="h-20 object-contain drop-shadow-2xl" />
        <div className="w-16 h-0.5 rounded-full" style={{ background: "linear-gradient(90deg, transparent, #F47920, transparent)" }}/>
        <div className="flex flex-col items-center gap-1">
          <p className="text-white text-lg font-black tracking-widest uppercase">Bienvenido</p>
          <p className="text-white/40 text-xs font-medium">Cargando tu panel de control...</p>
        </div>
        <div className="w-48 h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.1)" }}>
          <div className="h-full rounded-full" style={{ background: "linear-gradient(90deg, #F47920, #ffb347)", animation: "progress 1.5s ease-in-out forwards" }}/>
        </div>
        <div className="flex gap-2">
          {[0,1,2].map(i => (
            <div key={i} className="w-2.5 h-2.5 rounded-full" style={{ background: "#F47920", animation: `bounce 0.9s ease-in-out ${i * 0.2}s infinite` }}/>
          ))}
        </div>
      </div>
      <style>{`
        @keyframes bounce { 0%,100%{transform:translateY(0);opacity:0.3} 50%{transform:translateY(-10px);opacity:1} }
        @keyframes progress { 0%{width:0%} 100%{width:100%} }
      `}</style>
    </div>
  );

  return (
    <div className="fixed inset-0 flex items-center justify-center lg:justify-end overflow-y-auto">

      {/* ══ FONDO ══ */}
      <div className="fixed inset-0 -z-10" style={BG_IMAGE} />
      <div className="fixed inset-0 -z-10" style={{ background: BG_OVERLAY }} />

      {/* ══ DIAGONAL NARANJA ══ */}
      <div className="fixed inset-0 -z-10 hidden lg:block pointer-events-none" style={DIAGONAL.desktop} />
      <div className="fixed inset-0 -z-10 lg:hidden pointer-events-none"       style={DIAGONAL.mobile}  />

      {/* ══ LOGO — esquina inferior derecha, sobre el copyright ══ */}
      <div className="fixed bottom-10 right-4 z-50 pointer-events-none select-none sm:bottom-11 sm:right-6 lg:bottom-12 lg:right-8">
        <img src="/assets/img/logo.png" alt="Precision Truck Parts"
          className="object-contain drop-shadow-lg h-8 sm:h-10 lg:h-12" />
      </div>

      {/* ══ COLUMNA TARJETA ══ */}
      <div className="
        relative z-10 flex flex-col items-center justify-center
        w-full min-h-screen px-3 py-4
        sm:px-6 sm:py-6
        md:px-8 md:py-8
        lg:min-h-0 lg:w-[38vw] lg:max-w-[420px] lg:mr-[3vw] lg:py-0
        xl:w-[35vw] xl:max-w-[450px] xl:mr-[4vw]
        2xl:w-[32vw] 2xl:max-w-[470px] 2xl:mr-[6vw]
      ">

        {/* ── TARJETA ── */}
        <div className="w-full max-w-[300px] sm:max-w-[360px] md:max-w-[400px] lg:max-w-full" style={{
          background:   COLORS.whiteCard,
          borderRadius: `clamp(8px, 1.2vw, ${RADIUS.card})`,
          boxShadow:    "0 32px 80px rgba(29,29,27,0.38), 0 4px 20px rgba(29,29,27,0.12), 0 0 0 1px rgba(244,121,32,0.10)",
          overflow:     "hidden",
          borderTop:    `3px solid ${COLORS.orange}`,
        }}>

          {/* Cabecera: logo centrado */}
          <div className="flex flex-col items-center relative" style={{
            padding:      "clamp(14px, 2.5vw, 28px) clamp(16px, 3vw, 28px) clamp(12px, 2vw, 20px)",
            borderBottom: `1px solid ${COLORS.silverLight}`,
            background:   "linear-gradient(180deg, rgba(244,121,32,0.05) 0%, rgba(244,121,32,0.01) 100%)",
          }}>
            {/* Línea naranja decorativa izquierda */}
            <span className="absolute left-0 top-4 bottom-4 w-[3px] rounded-r-full" style={{ background: `linear-gradient(180deg, transparent, ${COLORS.orange}, transparent)` }} />
            {/* Línea naranja decorativa derecha */}
            <span className="absolute right-0 top-4 bottom-4 w-[3px] rounded-l-full" style={{ background: `linear-gradient(180deg, transparent, ${COLORS.orange}, transparent)` }} />
            <img src="/assets/img/logo.png" alt="Precision Truck Parts"
              className="object-contain w-auto"
              style={{ height: "clamp(32px, 5vw, 64px)", maxWidth: "clamp(100px, 14vw, 160px)" }}
            />
            <span className="block rounded-full mt-2" style={{
              background: `linear-gradient(90deg, transparent, ${COLORS.orange}, transparent)`,
              width: "clamp(40px, 5vw, 60px)",
              height: "2px",
            }} />
          </div>

          {/* Cuerpo */}
          <div style={{ padding: "clamp(12px, 2vw, 24px) clamp(16px, 3vw, 28px) clamp(14px, 2.5vw, 28px)" }}>

            {/* Encabezado */}
            <div style={{ marginBottom: "clamp(10px, 1.5vw, 20px)" }}>
              <div className="flex items-center gap-2">
                <span className="w-1 h-5 rounded-full" style={{ background: `linear-gradient(180deg, ${COLORS.orange}, ${COLORS.orangeDark})` }} />
                <h1 className="font-black tracking-tight text-left"
                  style={{ color: COLORS.dark, fontSize: "clamp(14px, 2vw, 21px)" }}>
                  Bienvenido
                </h1>
              </div>
              <p style={{ color: "#6b7280", fontSize: "clamp(9px, 1.1vw, 12px)", marginTop: "4px", paddingLeft: "12px" }}>
                Inicia sesión para continuar
              </p>
            </div>

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "clamp(8px, 1.2vw, 14px)" }}>

              {/* Email */}
              <div>
                <label className="block font-bold uppercase" style={{
                  color: COLORS.label, fontSize: "clamp(8px, 0.9vw, 10px)", letterSpacing: "0.12em", marginBottom: "4px",
                }}>
                  Correo electrónico
                </label>
                <input
                  type="email"
                  placeholder="usuario@refividrio.com.mx"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  onFocus={INPUT_FOCUS} onBlur={INPUT_BLUR}
                  className="w-full focus:outline-none transition-shadow"
                  style={{
                    background:   COLORS.silverBg,
                    border:       `1px solid ${COLORS.silver}`,
                    borderRadius: RADIUS.input,
                    color:        COLORS.dark,
                    fontSize:     "clamp(11px, 1.2vw, 13px)",
                    padding:      "clamp(7px, 1vw, 11px) 12px",
                  }}
                />
              </div>

              {/* Contraseña */}
              <div>
                <label className="block font-bold uppercase" style={{
                  color: COLORS.label, fontSize: "clamp(8px, 0.9vw, 10px)", letterSpacing: "0.12em", marginBottom: "4px",
                }}>
                  Contraseña
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    onFocus={INPUT_FOCUS} onBlur={INPUT_BLUR}
                    className="w-full focus:outline-none transition-shadow [&::-ms-reveal]:hidden [&::-ms-clear]:hidden"
                    style={{
                      background:   COLORS.silverBg,
                      border:       `1px solid ${COLORS.silver}`,
                      borderRadius: RADIUS.input,
                      color:        COLORS.dark,
                      fontSize:     "clamp(11px, 1.2vw, 13px)",
                      padding:      "clamp(7px, 1vw, 11px) 36px clamp(7px, 1vw, 11px) 12px",
                    }}
                  />
                  <button type="button" tabIndex={-1}
                    onClick={() => setShowPwd(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                    style={{ color: COLORS.silver }}
                    onMouseEnter={e => e.currentTarget.style.color = COLORS.orange}
                    onMouseLeave={e => e.currentTarget.style.color = COLORS.silver}
                  >
                    {showPassword ? <EyeIcon /> : <EyeOffIcon />}
                  </button>
                </div>
              </div>

              {/* Olvidé contraseña */}
              <div className="flex justify-end" style={{ marginTop: "-4px" }}>
                <button type="button" className="font-semibold hover:underline"
                  style={{ color: COLORS.orange, fontSize: "clamp(9px, 1vw, 11px)" }}>
                  ¿Olvidaste tu contraseña?
                </button>
              </div>

              {/* Error credenciales */}
              {error && (
                <div className="rounded-lg px-3 py-2 text-xs font-semibold"
                  style={{ background: "#fee2e2", color: "#dc2626", border: "1px solid #fca5a5" }}>
                  {error}
                </div>
              )}

              {/* Cuenta desactivada */}
              {inactivo && (
                <div className="rounded-lg px-3 py-3 flex flex-col gap-1"
                  style={{ background: "#fefce8", border: "1px solid #fde047" }}>
                  <p className="text-xs font-black" style={{ color: "#854d0e" }}>Cuenta desactivada</p>
                  <p className="text-[11px]" style={{ color: "#a16207" }}>
                    Tu cuenta ha sido desactivada. Contacta al administrador para reactivarla.
                  </p>
                </div>
              )}

              {/* Botón Iniciar */}
              <button type="submit" disabled={loading}
                className="w-full font-bold tracking-wide text-white hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-60"
                style={{
                  background:   `linear-gradient(135deg, ${COLORS.orange}, ${COLORS.orangeDark})`,
                  borderRadius: RADIUS.button,
                  boxShadow:    "0 4px 18px rgba(244,121,32,0.50), 0 1px 4px rgba(244,121,32,0.20)",
                  fontSize:     "clamp(11px, 1.2vw, 14px)",
                  padding:      "clamp(10px, 1.2vw, 13px) 16px",
                  letterSpacing: "0.03em",
                }}>
                {loading ? "Verificando..." : "Iniciar sesión"}
              </button>
            </form>

            {/* Divisor */}
            <div className="flex items-center gap-2" style={{ margin: "clamp(8px, 1.2vw, 16px) 0" }}>
              <hr className="flex-1" style={{ borderColor: COLORS.silverLight }} />
              <span className="whitespace-nowrap" style={{ color: COLORS.silver, fontSize: "clamp(8px, 0.9vw, 10px)" }}>
                o continúa con
              </span>
              <hr className="flex-1" style={{ borderColor: COLORS.silverLight }} />
            </div>

            {/* Botón Google */}
            <button type="button"
              className="w-full flex items-center justify-center gap-2 font-semibold transition-all hover:brightness-95"
              style={{
                background:   COLORS.silverBg,
                border:       `1px solid ${COLORS.silver}`,
                borderRadius: RADIUS.button,
                color:        COLORS.dark,
                fontSize:     "clamp(10px, 1.1vw, 13px)",
                padding:      "clamp(7px, 1vw, 11px) 16px",
              }}>
              <GoogleIcon />
              Iniciar sesión con Google
            </button>
          </div>
        </div>

      </div>

      {/* Copyright — fijo abajo a la derecha */}
      <p className="fixed bottom-3 right-4 z-50 text-right pointer-events-none select-none whitespace-nowrap"
        style={{ color: "rgba(255,255,255,0.55)", fontSize: "clamp(7px, 0.75vw, 10px)", letterSpacing: "0.08em" }}>
        © 2026 Precision Truck Parts and Accessories. Todos los derechos reservados.
      </p>
    </div>
  );
}
