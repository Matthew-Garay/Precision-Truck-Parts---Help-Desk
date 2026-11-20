/**
 * eslint.config.js — Revisión automática de código (npm run lint).
 *
 * Detecta errores antes de que lleguen a producción: variables o imports
 * sin definir (p. ej. un componente que usa API_ROUTES sin importarlo),
 * hooks de React mal usados, código inalcanzable, etc.
 *
 *   npm run lint        → revisa server/ y client/src/
 *   npm run lint:fix    → además corrige lo que se pueda corregir solo
 *
 * Las reglas de estilo/limpieza (variables sin usar) son "warn" para no
 * bloquear; los errores reales son "error".
 */
import js from "@eslint/js";
import globals from "globals";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import tsParser from "@typescript-eslint/parser";

const sinUsar = ["warn", {
  args: "none",                 // parámetros de Express (req, res, next) aunque no se usen
  caughtErrors: "none",         // catch (err) {} sin usar err
  varsIgnorePattern: "^_",
  ignoreRestSiblings: true,     // const { a, ...resto } = obj
}];

export default [
  {
    ignores: [
      "**/node_modules/**", "**/dist/**", "client/public/**",
      "storage/**", "Backups/**", "logs/**", "docs/**",
    ],
  },

  js.configs.recommended,

  // ── Servidor (Node, ESM) ──────────────────────────────────────────────────
  {
    files: ["server/**/*.js", "*.js", "client/vite.config.js"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: { ...globals.node },
    },
    rules: {
      "no-unused-vars": sinUsar,
      "no-empty": ["warn", { allowEmptyCatch: true }],
    },
  },

  // ── Cliente (React + Vite) ────────────────────────────────────────────────
  {
    files: ["client/src/**/*.{js,jsx,ts,tsx}", "client/tests/**/*.{js,jsx}"],
    plugins: { react, "react-hooks": reactHooks },
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      parserOptions: { ecmaFeatures: { jsx: true } },
      globals: { ...globals.browser },
    },
    settings: { react: { version: "18" } },
    rules: {
      "no-unused-vars": sinUsar,
      "no-empty": ["warn", { allowEmptyCatch: true }],
      // Marca como "usados" los componentes que solo aparecen en JSX.
      "react/jsx-uses-vars": "error",
      "react/jsx-uses-react": "error",
      // <Componente /> que no existe o no se importó.
      "react/jsx-no-undef": "error",
      "react/jsx-key": "warn",
      "react/no-direct-mutation-state": "error",
      // Hooks: solo en el nivel superior de componentes/hooks.
      "react-hooks/rules-of-hooks": "error",
      // Dependencias de useEffect/useMemo/useCallback (el código ya trae
      // `eslint-disable-next-line` donde la omisión es intencional).
      "react-hooks/exhaustive-deps": "warn",
    },
  },
  // Archivos TypeScript (hojas de impresión .tsx): mismo análisis, con el
  // parser de TypeScript para que entienda tipos e interfaces. Los tipos solo
  // usados en anotaciones los resuelve TS, no "no-undef".
  {
    files: ["client/src/**/*.{ts,tsx}"],
    languageOptions: { parser: tsParser },
    rules: { "no-undef": "off" },
  },
];
