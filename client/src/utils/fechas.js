/**
 * fechas.js — Formato ÚNICO de fechas para todo el sistema.
 *
 * Regla: toda fecha que ve el usuario va como día/mes/año.
 *   fechaCorta("2026-11-17")             → "17/11/2026"
 *   fechaHora("2026-11-17T13:39:47Z")    → "17/11/2026 06:39 a.m." (hora local)
 *   mesAnio("2026-11")                   → "11/2026"
 *   diaMes(fecha)                        → "17/11"
 *   hoyISO()                             → "2026-11-17" (para <input type="date">, en hora LOCAL)
 *
 * No usar toLocaleDateString con month:"long"/"short" ni dateStyle en
 * pantallas o reportes: cada uno sacaba un formato distinto.
 *
 * @module client/utils/fechas
 */

const pad = (n) => String(n).padStart(2, "0");

/**
 * Convierte lo que mande la API a Date.
 *  - "YYYY-MM-DD" se toma como fecha LOCAL (new Date() la tomaría como UTC
 *    y en Hermosillo mostraría el día anterior).
 *  - "YYYY-MM-DD HH:MM:SS" (MySQL) y "YYYY-MM-DDTHH:MM..." (ISO) se respetan.
 * @returns {Date|null}
 */
export function aFecha(v) {
  if (v == null || v === "") return null;
  if (v instanceof Date) return Number.isNaN(v.getTime()) ? null : v;
  const s = String(v).trim();
  const soloFecha = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  const d = soloFecha
    ? new Date(Number(soloFecha[1]), Number(soloFecha[2]) - 1, Number(soloFecha[3]))
    : new Date(/^\d{4}-\d{2}-\d{2} \d/.test(s) ? s.replace(" ", "T") : s);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** "17/11/2026". `vacio` es lo que se muestra si no hay fecha. */
export function fechaCorta(v, vacio = "-") {
  const d = aFecha(v);
  return d ? `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}` : vacio;
}

/** "06:39 p.m." (o "18:39" con h24 = true). */
export function hora(v, { h24 = false, vacio = "" } = {}) {
  const d = aFecha(v);
  if (!d) return vacio;
  return h24
    ? `${pad(d.getHours())}:${pad(d.getMinutes())}`
    : d.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" });
}

/** "17/11/2026 06:39 p.m." */
export function fechaHora(v, { h24 = false, vacio = "-", sep = " " } = {}) {
  const d = aFecha(v);
  return d ? `${fechaCorta(d)}${sep}${hora(d, { h24 })}` : vacio;
}

/** "17/11" (sin año, para listas cortas del mes en curso). */
export function diaMes(v, vacio = "-") {
  const d = aFecha(v);
  return d ? `${pad(d.getDate())}/${pad(d.getMonth() + 1)}` : vacio;
}

/** "11/2026". Acepta "YYYY-MM" (agrupaciones por mes de la API) o una fecha. */
export function mesAnio(v, vacio = "-") {
  const m = String(v ?? "").match(/^(\d{4})-(\d{2})$/);
  if (m) return `${m[2]}/${m[1]}`;
  const d = aFecha(v);
  return d ? `${pad(d.getMonth() + 1)}/${d.getFullYear()}` : vacio;
}

/** "YYYY-MM-DD" de una fecha en hora LOCAL (para inputs type="date" y filtros). */
export function isoLocal(d = new Date()) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Hoy en "YYYY-MM-DD" local (no usar toISOString: es UTC y después de las 5 p.m. da mañana). */
export const hoyISO = () => isoLocal(new Date());
