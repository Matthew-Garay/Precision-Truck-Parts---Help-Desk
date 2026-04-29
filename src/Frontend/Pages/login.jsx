import { useState } from "react";
import { COLORS, SHADOWS, RADIUS, BG_IMAGE, BG_OVERLAY, DIAGONAL, INPUT_FOCUS, INPUT_BLUR } from "../Config/DesignSystem";
import { EyeIcon, EyeOffIcon, GoogleIcon } from "../Components/Icons";

export default function Login() {
  const [email, setEmail]          = useState("");
  const [password, setPassword]    = useState("");
  const [showPassword, setShowPwd] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Login:", { email, password });
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center lg:justify-end overflow-y-auto">

      {/* ══ FONDO ══ */}
      <div className="fixed inset-0 -z-10" style={BG_IMAGE} />
      <div className="fixed inset-0 -z-10" style={{ background: BG_OVERLAY }} />

      {/* ══ DIAGONAL NARANJA ══ */}
      <div className="fixed inset-0 -z-10 hidden lg:block pointer-events-none" style={DIAGONAL.desktop} />
      <div className="fixed inset-0 -z-10 lg:hidden pointer-events-none"       style={DIAGONAL.mobile}  />

      {/* ══ LOGO — esquina inferior derecha ══ */}
      <div className="fixed bottom-4 right-4 z-50 pointer-events-none select-none sm:bottom-5 sm:right-6 lg:bottom-7 lg:right-8">
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
          boxShadow:    SHADOWS.card,
          overflow:     "hidden",
        }}>

          {/* Cabecera: logo centrado */}
          <div className="flex flex-col items-center" style={{
            padding:      "clamp(14px, 2.5vw, 28px) clamp(16px, 3vw, 28px) clamp(12px, 2vw, 20px)",
            borderBottom: `1px solid ${COLORS.silverLight}`,
          }}>
            <img src="/assets/img/logo.png" alt="Precision Truck Parts"
              className="object-contain w-auto"
              style={{ height: "clamp(32px, 5vw, 64px)", maxWidth: "clamp(100px, 14vw, 160px)" }}
            />
            <span className="block rounded-full mt-2" style={{
              background: COLORS.orange,
              width: "clamp(24px, 3vw, 36px)",
              height: "2.5px",
            }} />
          </div>

          {/* Cuerpo */}
          <div style={{ padding: "clamp(12px, 2vw, 24px) clamp(16px, 3vw, 28px) clamp(14px, 2.5vw, 28px)" }}>

            {/* Encabezado */}
            <div style={{ marginBottom: "clamp(10px, 1.5vw, 20px)" }}>
              <h1 className="font-black tracking-tight text-left"
                style={{ color: COLORS.dark, fontSize: "clamp(14px, 2vw, 21px)" }}>
                Bienvenido
              </h1>
              <p className="text-center"
                style={{ color: "#6b7280", fontSize: "clamp(9px, 1.1vw, 12px)", marginTop: "4px" }}>
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

              {/* Botón Iniciar */}
              <button type="submit"
                className="w-full font-bold tracking-wide text-white hover:brightness-110 active:scale-[0.98] transition-all"
                style={{
                  background:   `linear-gradient(135deg, ${COLORS.orange}, ${COLORS.orangeDark})`,
                  borderRadius: RADIUS.button,
                  boxShadow:    SHADOWS.button,
                  fontSize:     "clamp(11px, 1.2vw, 14px)",
                  padding:      "clamp(8px, 1vw, 12px) 16px",
                }}>
                Iniciar sesión
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

        {/* Copyright */}
        <p className="text-white/40 text-center uppercase tracking-widest leading-relaxed px-2"
          style={{ fontSize: "clamp(7px, 0.8vw, 10px)", marginTop: "clamp(6px, 1vw, 14px)" }}>
          © 2026 Precision Truck Parts and Accessories. Todos los derechos reservados.
        </p>
      </div>
    </div>
  );
}
