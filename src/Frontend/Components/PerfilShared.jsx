/**
 * PerfilShared.jsx
 *
 * Utilidades compartidas entre las vistas de perfil del administrador
 * y del usuario. Centraliza logica reutilizable para evitar duplicacion.
 *
 * Exportaciones:
 *
 * EyeBtn
 *   Boton de ojo para alternar la visibilidad de un campo de contrasena.
 *   Recibe show (boolean), onToggle (funcion) y textFaint (color).
 *
 * usePerfilStyles(T, isDark)
 *   Hook que retorna un objeto con estilos inline precalculados para
 *   los bloques card, hdr (header de seccion) e inp (input de formulario)
 *   adaptados al tema activo.
 *
 * generarPDFAccesos({ accesos, usuario, mesFiltro, anioFiltro })
 *   Genera y abre una nueva ventana con el reporte HTML del historial
 *   de accesos formateado para impresion. Incluye KPIs de sesiones,
 *   duracion promedio y duracion maxima. Si el navegador bloquea la
 *   ventana emergente muestra un aviso temporal en pantalla.
 */

// -- EyeBtn ----------------------------------------------------
export function EyeBtn({ show, onToggle, textFaint }) {
  return (
    <button type="button" onClick={onToggle}
      className="absolute right-3 top-1/2 -translate-y-1/2"
      style={{ color: textFaint, background: "none", border: "none", cursor: "pointer", padding: 0 }}>
      {show
        ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
        : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
      }
    </button>
  );
}

// -- Estilos compartidos ---------------------------------------
export function usePerfilStyles(T, isDark) {
  return {
    card: {
      background: isDark ? "#141720" : T.surface,
      border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : T.border}`,
      boxShadow: isDark ? "0 4px 20px rgba(0,0,0,0.4)" : "0 1px 6px rgba(0,0,0,0.06)",
    },
    hdr: {
      borderBottom: `1px solid ${isDark ? "rgba(255,255,255,0.07)" : T.border}`,
      background: isDark ? "rgba(255,255,255,0.03)" : T.surfaceAlt,
    },
    inp: {
      background: isDark ? "rgba(255,255,255,0.05)" : T.surfaceAlt,
      border: `1px solid ${T.border}`,
      color: T.text,
      borderRadius: "8px",
      padding: "8px 12px",
      fontSize: "14px",
      lineHeight: "1.35",
      fontFamily: "inherit",
      fontWeight: 500,
      outline: "none",
      width: "100%",
      transition: "border-color 0.15s",
    },
  };
}

// -- Generador de PDF de accesos -------------------------------
export function generarPDFAccesos({ usuario, fechaInicio, fechaFin }) {
  const token = sessionStorage.getItem("_tk");
  const params = new URLSearchParams();
  if (token)      params.set("token", token);
  if (fechaInicio) params.set("desde", fechaInicio);
  if (fechaFin)    params.set("hasta", fechaFin);

  const url = `/print/historial/${usuario.id_empleado}?${params.toString()}`;
  const win = window.open(url, "_blank", "width=1200,height=800");
  if (!win) {
    const aviso = document.createElement("div");
    aviso.style.cssText = "position:fixed;top:16px;left:50%;transform:translateX(-50%);z-index:9999;background:#1D1D1B;color:#fff;padding:12px 20px;border-radius:10px;font-size:13px;font-weight:700;border-left:4px solid #F47920;box-shadow:0 4px 20px rgba(0,0,0,0.4);";
    aviso.textContent = "El navegador bloqueó la ventana emergente. Permite las ventanas emergentes e intenta de nuevo.";
    document.body.appendChild(aviso);
    setTimeout(() => aviso.remove(), 5000);
  }
}
