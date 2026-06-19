/**
 * authMiddleware.js
 *
 * Expone dos middlewares de Express para proteger rutas mediante JWT
 * y restringir el acceso por rol de usuario.
 *
 * requireAuth
 *   Lee el encabezado "Authorization" de la peticion, extrae el token Bearer,
 *   lo verifica con jwt.verify usando la clave JWT_SECRET y adjunta el payload
 *   decodificado en req.usuario para que los controladores puedan usarlo.
 *   Retorna 401 si el encabezado no existe, no tiene el formato correcto,
 *   o el token es invalido o ha expirado.
 *
 * requireAdmin
 *   Verifica que req.usuario.id_rol sea igual a 1 (rol de administrador).
 *   Debe usarse siempre despues de requireAuth en la cadena de middlewares.
 *   Retorna 403 si el usuario autenticado no tiene rol de administrador.
 *
 * La clave secreta se obtiene con getSecret() en tiempo de ejecucion (no al
 * cargar el modulo) para garantizar que dotenv.config() ya se ejecuto y la
 * variable JWT_SECRET esta disponible. Si no esta definida el proceso termina.
 */
import jwt from "jsonwebtoken";

// SECRET se resuelve en tiempo de ejecución (después de dotenv.config())
function getSecret() {
  const s = process.env.JWT_SECRET;
  if (!s) {
    console.error("JWT_SECRET no definido. El servidor no puede arrancar de forma segura.");
    process.exit(1);
  }
  return s;
}

export function requireAuth(req, res, next) {
  const header = req.headers["authorization"];
  if (!header?.startsWith("Bearer "))
    return res.status(401).json({ error: "No autorizado" });
  try {
    req.usuario = jwt.verify(header.slice(7), getSecret());
    next();
  } catch {
    return res.status(401).json({ error: "Token inválido o expirado" });
  }
}

export function requireAdmin(req, res, next) {
  if (req.usuario?.id_rol !== 1)
    return res.status(403).json({ error: "Acceso restringido a administradores" });
  next();
}
