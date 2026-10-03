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
 * El cierre de sesion se resuelve con `empleado.token_version`: cada token
 * lleva dentro la version con la que se expidio (payload `ver`) y, si el
 * empleado ya va en una version mayor, el token se rechaza. No hace falta
 * una tabla de lista negra: sobrevive a reinicios y funciona igual con
 * varias instancias del servidor.
 */
import jwt  from "jsonwebtoken";
import pool from "../Config/db.js";

function getSecret() {
  const s = process.env.JWT_SECRET;
  if (!s) throw new Error("JWT_SECRET no definido");
  return s;
}

/** Version de token vigente de un empleado (0 si la columna aun no existe). */
async function versionDeToken(id_empleado) {
  try {
    const [[row]] = await pool.query(
      "SELECT token_version FROM empleado WHERE id_empleado = ? LIMIT 1",
      [id_empleado]
    );
    return row?.token_version ?? 0;
  } catch {
    return 0;
  }
}

export async function requireAuth(req, res, next) {
  const header = req.headers["authorization"];
  if (!header?.startsWith("Bearer "))
    return res.status(401).json({ error: "No autorizado" });
  try {
    const payload = jwt.verify(header.slice(7), getSecret());

    // Token emitido antes del ultimo cierre de sesion -> invalidado
    const actual = await versionDeToken(payload.id_empleado);
    const emitida = Number(payload.ver ?? 0);
    if (actual > emitida)
      return res.status(401).json({ error: "Sesión cerrada. Inicia sesión de nuevo." });

    req.usuario = payload;
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
