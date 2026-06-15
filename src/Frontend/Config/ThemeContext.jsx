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

