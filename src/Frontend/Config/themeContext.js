/**
 * themeContext.js
 *
 * Define el contexto de React para el sistema de temas claro/oscuro.
 * Es un archivo JS puro (sin JSX) para evitar problemas con Fast Refresh de Vite
 * cuando el contexto y el proveedor estan en archivos separados.
 *
 * ThemeContext
 *   Contexto de React que expone { dark, toggleDark, T }.
 *   dark       - booleano que indica si el tema oscuro esta activo
 *   toggleDark - funcion para cambiar entre temas
 *   T          - objeto con los tokens del tema activo (LIGHT o DARK de themeTokens.js)
 *
 * useTheme()
 *   Hook que retorna el valor actual del ThemeContext.
 *   Debe usarse dentro de un componente envuelto por ThemeProvider.
 */
import { createContext, useContext } from "react";

export const ThemeContext = createContext(null);
export const useTheme = () => useContext(ThemeContext);
