import { Sun, Moon } from "lucide-react";
import { useTheme } from "../Config/ThemeContext";

export default function ThemeToggle() {
  const { dark, toggleDark, T } = useTheme();

  return (
    <button
      onClick={() => toggleDark(!dark)}
      aria-label={dark ? "Cambiar a modo claro" : "Cambiar a modo obscuro"}
      title={dark ? "Modo claro" : "Modo obscuro"}
      style={{
        width: "36px",
        height: "36px",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        background: "transparent",
        border: `1px solid ${T.isDark ? "rgba(255,255,255,0.14)" : T.border}`,
        borderRadius: "4px",
        cursor: "pointer",
        color: T.isDark ? "rgba(255,255,255,0.55)" : T.textMuted,
        transition: "background 0.15s, color 0.15s, border-color 0.15s",
        flexShrink: 0,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = T.isDark
          ? "rgba(255,255,255,0.07)"
          : T.surfaceAlt;
        e.currentTarget.style.color = T.isDark ? "#fff" : T.text;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "transparent";
        e.currentTarget.style.color = T.isDark
          ? "rgba(255,255,255,0.55)"
          : T.textMuted;
      }}
    >
      {dark ? <Sun size={15} strokeWidth={2} /> : <Moon size={15} strokeWidth={2} />}
    </button>
  );
}
