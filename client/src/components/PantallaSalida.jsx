/**
 * PantallaSalida.jsx
 *
 * Pantalla de transicion animada que se muestra durante el proceso de
 * cierre de sesion antes de redirigir al login.
 *
 * Se renderiza sobre toda la interfaz (posicion fixed, z-index 9999)
 * reemplazando el contenido del dashboard. Dura aproximadamente 1.2 segundos,
 * que es el tiempo que main.jsx espera antes de llamar a clearSession()
 * y navegar a /login.
 *
 * Elementos visuales:
 *   - Fondo negro con un degradado radial naranja sutil en el centro.
 *   - Logo de la empresa con efecto de brillo y animacion de entrada.
 *   - Nombre de la empresa y mensaje de despedida con animacion de entrada.
 *   - Barra de progreso que llena de izquierda a derecha en 1.2 segundos
 *     con un efecto shimmer de brillo que recorre la barra.
 *   - Spinner de carga circular naranja.
 *
 * No recibe props. Todas las animaciones son CSS puro definidas en
 * un bloque de style inline dentro del componente.
 */
export default function PantallaSalida() {
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
            Cerrando sesión · Hasta pronto
          </p>
        </div>

        <div className="w-[180px] h-[3px] rounded-full overflow-hidden"
          style={{ background: "rgba(255,255,255,0.08)", animation: "slide-up 0.5s 0.38s ease-out both" }}>
          <div className="h-full rounded-full"
            style={{
              background: "linear-gradient(90deg, #F47920, #ffb347, #F47920)",
              backgroundSize: "200% 100%",
              animation: "progress 1.2s ease-in-out forwards, shimmer 1.2s 0.3s linear infinite",
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
