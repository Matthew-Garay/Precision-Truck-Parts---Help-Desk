/**
 * ErrorBoundary.jsx
 *
 * Componente de clase de React que captura errores no manejados en el
 * arbol de componentes hijo y muestra una pantalla de error amigable
 * en lugar de dejar la aplicacion en blanco.
 *
 * Comportamiento:
 *   - Captura cualquier error de renderizado, metodo del ciclo de vida
 *     o constructor que ocurra en los componentes descendientes.
 *   - Muestra el logo de la empresa, un mensaje generico y un boton
 *     para volver al login y reiniciar el estado.
 *   - En modo desarrollo (import.meta.env.DEV) muestra ademas el stack
 *     trace completo del error en un bloque preformateado para facilitar
 *     la depuracion.
 *   - Registra el error y el component stack en la consola con
 *     console.error para que no se pierda la traza en produccion.
 *
 * Debe envolver el componente raiz de la aplicacion en main.jsx
 * para proteger toda la interfaz de usuario.
 */
import { Component } from "react";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  // Fix #8: registrar el error con stack trace completo para no perderlo en producción
  componentDidCatch(error, info) {
    console.error("[ErrorBoundary] Error no manejado:", error);
    console.error("[ErrorBoundary] Component stack:", info?.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center gap-4 px-6"
        style={{ background: "#0b0e14", fontFamily: "'Inter','Segoe UI',sans-serif" }}>
        <img src="/assets/img/logo.png" alt="PTP" style={{ height: "56px", objectFit: "contain" }} />
        <div className="text-center">
          <p className="text-white font-black text-lg">Algo salió mal</p>
          <p className="text-white/40 text-sm mt-1">Ocurrió un error inesperado en la aplicación.</p>
        </div>
        <button
          onClick={() => { this.setState({ error: null }); window.location.href = "/login"; }}
          className="px-6 py-2.5 rounded-xl text-sm font-bold text-white"
          style={{ background: "linear-gradient(135deg, #F47920, #d97400)" }}>
          Volver al inicio
        </button>
        {import.meta.env.DEV && (
          <pre className="text-red-400 text-xs max-w-lg overflow-auto mt-2 p-3 rounded-xl"
            style={{ background: "rgba(220,38,38,0.1)", border: "1px solid rgba(220,38,38,0.2)" }}>
            {this.state.error?.stack || this.state.error?.message}
          </pre>
        )}
      </div>
    );
  }
}
