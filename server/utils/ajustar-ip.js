/**
 * ajustar-ip.js — Si la IP de esta PC cambió (el Wi-Fi le asigna otra), el
 * servidor usa la nueva AL ENCENDER, sin tocar el .env.
 *
 * El .env guarda la dirección del sistema (APP_URL, CORS_ORIGIN, Zoho…). Cuando
 * el router le da otra IP a la PC, esas direcciones dejan de existir: los
 * enlaces de los correos y el regreso de Zoho fallan. Aquí, si la IP del .env
 * ya no está en esta PC pero hay otra en la MISMA red (mismos 3 primeros
 * números, p. ej. 192.168.31.x), se reemplaza en memoria y se avisa en la
 * consola. Una IP de otra red (VPN como Radmin 26.x) nunca se toma.
 *
 * Lo definitivo sigue siendo reservar la IP en el router. Zoho además necesita
 * la dirección nueva registrada en su consola.
 *
 * @module server/utils/ajustar-ip
 */
import os from "os";

const VARIABLES = ["APP_URL", "CORS_ORIGIN", "VITE_BACKEND_URL", "ZOHO_REDIRECT_URI", "ZOHO_REDIRECT_URIS"];
const RE_IPV4 = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/;

/** IPv4 de esta PC (sin la de loopback). */
export function ipsLocales(interfaces = os.networkInterfaces()) {
  return Object.values(interfaces).flat().filter(i => i && i.family === "IPv4" && !i.internal).map(i => i.address);
}

/**
 * Decide si hay que cambiar la IP. Devuelve { anterior, nueva } o null.
 * Solo cambia si la IP configurada no está en la PC y hay EXACTAMENTE una IP
 * local en la misma red /24.
 */
export function ipNueva(appUrl, locales) {
  let host;
  try { host = new URL(appUrl).hostname; } catch { return null; }
  if (!RE_IPV4.test(host) || locales.includes(host)) return null;
  const red = host.split(".").slice(0, 3).join(".") + ".";
  const candidatas = locales.filter(ip => ip.startsWith(red));
  return candidatas.length === 1 ? { anterior: host, nueva: candidatas[0] } : null;
}

/** Aplica el cambio a las variables de entorno (solo en memoria). */
export function ajustarIp(env = process.env, locales = ipsLocales()) {
  const cambio = ipNueva(env.APP_URL || env.CORS_ORIGIN || "", locales);
  if (!cambio) return null;
  for (const k of VARIABLES)
    if (env[k]) env[k] = env[k].split(cambio.anterior).join(cambio.nueva);
  return cambio;
}

if (process.env.NODE_ENV !== "test") {
  const cambio = ajustarIp();
  if (cambio) {
    console.warn(`[red] La IP de esta PC cambió: el .env dice ${cambio.anterior} y ahora es ${cambio.nueva}. ` +
      `Se usa ${cambio.nueva} mientras el sistema esté encendido. Para que quede fijo: reserva la IP en el router ` +
      `(o actualiza server/.env) y registra la dirección nueva en la consola de Zoho.`);
  }
}
