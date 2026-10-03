/**
 * password.js
 *
 * Política de contraseña corporativa del frontend (espejo de la validación
 * del backend en src/Backend/Middlewares/validate.js → `passwordPolicy`).
 *
 * IMPORTANTE: igual que email.js, esto es solo UX. La barrera real está en
 * el backend (Zod en las rutas + bcrypt al guardar); este módulo existe para
 * que los tres formularios que cambian contraseñas (recuperación en login,
 * configuración de perfil y Personal del admin)sayquen EXACTAMENTE las
 * mismas reglas, sin duplicar la lista en cada componente.
 *
 * Reglas: mínimo 8 caracteres, 1 mayúscula, 1 número y 1 carácter especial.
 *
 * Exporta:
 *   REGLAS_PASSWORD   - lista de reglas (id + texto) para pintar el checklist
 *   evaluarPassword() - { vacia, reglas, cumple, nivel, etiqueta, color, pct }
 *   passwordSeguro()  - null si cumple, o el mensaje de la primera regla que falla
 */
export const REGLAS_PASSWORD = Object.freeze([
  { id: "largo",    texto: "Mínimo 8 caracteres" },
  { id: "mayus",    texto: "Al menos una mayúscula" },
  { id: "numero",   texto: "Al menos un número" },
  { id: "especial", texto: "Al menos un carácter especial" },
]);

const RE = {
  largo:    (p) => p.length >= 8,
  mayus:    (p) => /[A-Z]/.test(p),
  numero:   (p) => /[0-9]/.test(p),
  especial: (p) => /[^A-Za-z0-9]/.test(p),
};

/* Escala visual: los mismos colores que ya usaba Personal.jsx */
const NIVELES = [
  { etiqueta: "Muy débil", color: "#dc2626", pct: 10 },
  { etiqueta: "Débil",     color: "#dc2626", pct: 30 },
  { etiqueta: "Regular",   color: "#d97706", pct: 55 },
  { etiqueta: "Buena",     color: "#ca8a04", pct: 75 },
  { etiqueta: "Segura",    color: "#16a34a", pct: 100 },
];

/**
 * evaluarPassword(password)
 *   Devuelve el estado de cada regla y el nivel de fortaleza.
 *   Con cadena vacía devuelve `vacia: true` para que la UI no muestre nada.
 */
export function evaluarPassword(password = "") {
  const vacia = password.length === 0;
  const reglas = REGLAS_PASSWORD.map(r => ({ ...r, ok: vacia ? false : RE[r.id](password) }));
  const cumplidas = reglas.filter(r => r.ok).length;
  // El nivel combina reglas cumplidas y longitud: una contraseña larga y
  // variada siempre puntúa más que una que apenas pasa por los mínimos.
  const extra = password.length >= 16 ? 2 : password.length >= 12 ? 1 : 0;
  // Con 0 reglas -> nivel 0 (nunca negativo, siempre hay un nivel que pintar);
  // con las 4 -> nivel 4, subiendo por longitud.
  const nivel = vacia ? 0 : Math.min(4, Math.max(0, cumplidas - 1 + extra));
  return {
    vacia,
    reglas,
    cumplidas,
    cumple: !vacia && cumplidas === REGLAS_PASSWORD.length,
    nivel,
    extra,
    ...(vacia ? { etiqueta: "", color: "", pct: 0 } : NIVELES[nivel]),
  };
}

/**
 * passwordSeguro(password)
 *   null si cumple la política, o el mensaje de la primera regla que falta.
 */
export function passwordSeguro(password = "") {
  if (!password) return null;
  const { reglas } = evaluarPassword(password);
  const falla = reglas.find(r => !r.ok);
  return falla ? falla.texto : null;
}