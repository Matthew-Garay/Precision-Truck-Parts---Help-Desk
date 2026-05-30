import path from "path";

/**
 * Protección CSRF simple basada en header personalizado.
 * El login y logout quedan exentos porque no requieren sesión previa.
 * sendBeacon (cierre de pestaña) tampoco puede enviar headers - se exime /logout.
 */
// Rutas completamente exentas de CSRF (sin sesion previa posible)
// Se compara la ruta exacta, no con endsWith, para evitar bypass
const CSRF_EXEMPT_EXACT = new Set(["/login", "/logout", "/recuperar", "/reset-password"]);

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
