/**
 * ThemeContext.jsx
 *
 * Proveedor del sistema de temas claro/oscuro de la aplicacion.
 * Debe envolver la raiz del arbol de componentes en main.jsx.
 *
 * ThemeProvider
 *   Gestiona el estado del tema activo y lo persiste en localStorage.
 *   Al montar, lee la preferencia guardada y aplica el atributo
 *   data-theme en el elemento html para que el CSS pueda reaccionar.
 *
 *   Sincronizacion entre pestanas:
 *     Escucha el evento "storage" de window para detectar cuando el
 *     usuario cambia el tema en otra pestana del mismo origen y aplica
 *     el cambio en tiempo real sin recargar la pagina.
 *
 *   Valor del contexto expuesto:
 *     dark       - booleano: true si el tema oscuro esta activo
 *     toggleDark - funcion(boolean): cambia el tema y persiste la preferencia
 *     T          - tokens del tema activo (objeto LIGHT o DARK de themeTokens.js)
 *
 * Uso en componentes:
 *   import { useTheme } from "../Config/themeContext.js";
 *   const { T, dark, toggleDark } = useTheme();
 */
import { useState, useEffect } from "react";
import { LIGHT, DARK } from "./themeTokens.js";
import { ThemeContext } from "./themeContext.js";

function applyTheme(isDark) {
  document.documentElement.setAttribute("data-theme", isDark ? "dark" : "light");
}

export function ThemeProvider({ children }) {
  const [dark, setDark] = useState(() => {
    const saved = localStorage.getItem("theme") === "dark";
    applyTheme(saved);
    return saved;
  });

  const toggleDark = (v) => {
    setDark(v);
    localStorage.setItem("theme", v ? "dark" : "light");
    applyTheme(v);
  };

  // Sincronizar entre pestañas
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === "theme") {
        const v = e.newValue === "dark";
        setDark(v);
        applyTheme(v);
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  return (
    <ThemeContext.Provider value={{ dark, toggleDark, T: dark ? DARK : LIGHT }}>
      {children}
    </ThemeContext.Provider>
  );
}

