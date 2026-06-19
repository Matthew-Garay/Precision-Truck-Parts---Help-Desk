/**
 * security.js
 *
 * Expone dos utilidades de seguridad reutilizables en todo el backend.
 *
 * csrfProtection
 *   Middleware de proteccion CSRF basado en encabezado personalizado.
 *   Verifica que las peticiones de mutacion (POST, PUT, PATCH, DELETE) incluyan
 *   el encabezado "x-requested-with". Los navegadores no incluyen encabezados
 *   personalizados en peticiones cross-origin sin una preflight CORS exitosa,
 *   lo que hace que un sitio malicioso no pueda enviar peticiones silenciosas.
 *
 *   Rutas exentas (no requieren sesion previa ni encabezado):
 *     /login, /logout, /recuperar, /verificar-codigo, /reset-password
 *
 *   La comparacion es por ruta exacta (req.path relativo al router montado)
 *   y no por sufijo, para evitar bypass con rutas como /api/admin/login.
 *
 * safeResolvePath
 *   Resuelve una ruta de archivo a partir de un directorio base y partes
 *   adicionales, y verifica que el resultado quede estrictamente dentro del
 *   directorio base. Previene ataques de path traversal de la siguiente forma:
 *     1. Rechaza null bytes en cualquiera de las partes de la ruta.
 *     2. Normaliza cada parte con path.normalize para colapsar segmentos ".."
 *        y elimina prefijos de traversal residuales con una expresion regular.
 *     3. Resuelve la ruta final y compara con el directorio base.
 *        Si la ruta resuelta no empieza con el directorio base mas el separador,
 *        lanza un Error con el mensaje "Ruta no permitida".
 */
import path from "path";

/**
 * Protección CSRF simple basada en header personalizado.
 * El login y logout quedan exentos porque no requieren sesión previa.
 * sendBeacon (cierre de pestaña) tampoco puede enviar headers - se exime /logout.
 */
// Rutas completamente exentas de CSRF (sin sesion previa posible)
// Se compara la ruta exacta, no con endsWith, para evitar bypass
const CSRF_EXEMPT_EXACT = new Set(["/login", "/logout", "/recuperar", "/verificar-codigo", "/reset-password"]);

export function csrfProtection(req, res, next) {
  if (req.method === "GET" || req.method === "HEAD" || req.method === "OPTIONS")
    return next();
  // Comparar ruta exacta (req.path es relativo al router montado)
  if (CSRF_EXEMPT_EXACT.has(req.path))
    return next();
  if (!req.headers["x-requested-with"])
    return res.status(403).json({ error: "Solicitud no permitida (CSRF)" });
  next();
}

/**
 * Valida que una ruta resuelta esté dentro del directorio base.
 * Usa path.normalize para neutralizar secuencias como ../ antes de comparar.
 * Lanza un error si detecta path traversal.
 */
export function safeResolvePath(baseDir, ...parts) {
  const base = path.resolve(baseDir);
  const safeParts = parts.map(p => {
    const s = String(p);
    // Rechazar null bytes
    if (s.includes("\0")) throw new Error("Ruta no permitida: null byte detectado");
    // Eliminar secuencias de traversal
    return path.normalize(s).replace(/^(\.\.[/\\])+/, "");
  });
  const resolved = path.resolve(base, ...safeParts);
  if (resolved !== base && !resolved.startsWith(base + path.sep))
    throw new Error("Ruta no permitida");
  return resolved;
}
