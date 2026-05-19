import path from "path";

/**
 * Protección CSRF simple basada en header personalizado.
 * El login y logout quedan exentos porque no requieren sesión previa.
 */
const CSRF_EXEMPT = ["/api/auth/login", "/api/auth/logout"];

export function csrfProtection(req, res, next) {
  if (req.method === "GET" || req.method === "HEAD" || req.method === "OPTIONS")
    return next();
  if (CSRF_EXEMPT.some(p => req.path.endsWith(p)))
    return next();
  if (!req.headers["x-requested-with"])
    return res.status(403).json({ error: "Solicitud no permitida (CSRF)" });
  next();
}

/**
 * Valida que una ruta resuelta esté dentro del directorio base.
 * Lanza un error si detecta path traversal.
 */
export function safeResolvePath(baseDir, ...parts) {
  const resolved = path.resolve(baseDir, ...parts);
  if (!resolved.startsWith(path.resolve(baseDir) + path.sep) &&
      resolved !== path.resolve(baseDir))
    throw new Error("Ruta no permitida");
  return resolved;
}
