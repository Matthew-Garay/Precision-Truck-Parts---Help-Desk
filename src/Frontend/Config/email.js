/**
 * email.js
 *
 * Política de correo corporativo del frontend (espejo de la validación del
 * backend en src/Backend/Middlewares/validate.js — validarEmailCorporativo).
 *
 * IMPORTANTE: esta validación existe solo para UX. La barrera de seguridad
 * real está en el backend (Zod en las rutas + defensa en profundidad en los
 * controllers); cualquier bypass desde el navegador se rechaza allá.
 *
 * Exporta:
 *   DOMINIOS_PERMITIDOS            - lista blanca de dominios (congelada)
 *   mensajeDominiosPermitidos()    - texto estándar con la lista
 *   emailCorporativoValido(valor)  - null si es válido, o mensaje de error
 */
export const DOMINIOS_PERMITIDOS = Object.freeze([
  "refividrio.com.mx",
  "ptp.com.mx",
  "megapartes.com.mx",
  "ebatruck.com.mx",
]);

// dot-atom RFC 5322 para la parte local; etiqueta RFC 1123 para el dominio.
const RE_LOCAL_CORREO      = /^[A-Za-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[A-Za-z0-9!#$%&'*+/=?^_`{|}~-]+)*$/;
const RE_ETIQUETA_DOMINIO  = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;

/** Texto estándar que lista los dominios aceptados. */
export function mensajeDominiosPermitidos() {
  return `Dominio no permitido. Usa un correo corporativo de: ${DOMINIOS_PERMITIDOS.map(d => "@" + d).join(", ")}`;
}

/**
 * emailCorporativoValido(valor)
 *   Retorna null si el correo cumple la política corporativa o un mensaje
 *   de error legible si no. Verifica: requerido, <=254 chars, solo ASCII
 *   imprimible (bloquea homógrafos Unicode), sin espacios, exactamente un
 *   "@", parte local dot-atom <=64, dominio RFC 1123 y pertenencia EXACTA
 *   a la lista blanca (sin subdominios ni dominios parecidos).
 */
export function emailCorporativoValido(valor) {
  if (valor === undefined || valor === null) return "El correo es requerido";
  if (typeof valor !== "string")             return "El correo debe ser una cadena de texto";

  const email = valor.trim();
  if (!email)                         return "El correo es requerido";
  if (email.length > 254)             return "El correo no puede superar 254 caracteres";
  if (!/^[\x20-\x7E]+$/.test(email))  return "El correo contiene caracteres no válidos";
  if (/\s/.test(email))               return "El correo no puede contener espacios";

  const pos = email.indexOf("@");
  if (pos < 1 || pos !== email.lastIndexOf("@")) return "Formato de correo inválido";

  const local   = email.slice(0, pos);
  const dominio = email.slice(pos + 1).toLowerCase();

  if (local.length > 64)            return "La parte local del correo supera los 64 caracteres";
  if (!RE_LOCAL_CORREO.test(local)) return "Formato de correo inválido";
  if (dominio.length > 253)         return "El dominio del correo supera los 253 caracteres";

  const etiquetas = dominio.split(".");
  if (etiquetas.length < 2 || etiquetas.some(e => !RE_ETIQUETA_DOMINIO.test(e)))
    return "Formato de dominio inválido";

  if (!DOMINIOS_PERMITIDOS.includes(dominio)) return mensajeDominiosPermitidos();
  return null;
}
