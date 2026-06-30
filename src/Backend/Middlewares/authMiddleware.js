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
import jwt  from "jsonwebtoken";
import pool from "../Config/db.js";

function getSecret() {
  const s = process.env.JWT_SECRET;
  if (!s) throw new Error("JWT_SECRET no definido");
  return s;
}

/**
 * Añade el jti (JWT ID) a la lista de tokens revocados.
 * Se llama desde logout para invalidar el token antes de su expiración.
 */
export async function revocarToken(jti, id_empleado, expiraEn) {
  try {
    await pool.query(
      `INSERT IGNORE INTO token_revocado (jti, id_empleado, expira_en)
       VALUES (?, ?, FROM_UNIXTIME(?))`,
      [jti, id_empleado, expiraEn]
    );
  } catch { /* tabla puede no existir en entornos de test */ }
}

/**
 * Limpia tokens revocados ya expirados (se llama desde scheduledJobs).
 */
export async function limpiarTokensRevocados() {
  try {
    await pool.query(`DELETE FROM token_revocado WHERE expira_en < NOW()`);
  } catch { /* ignorar si tabla no existe */ }
}

export async function requireAuth(req, res, next) {
  const header = req.headers["authorization"];
  if (!header?.startsWith("Bearer "))
    return res.status(401).json({ error: "No autorizado" });
  try {
    const payload = jwt.verify(header.slice(7), getSecret());
    // Verificar si el token fue revocado (logout explícito)
    if (payload.jti) {
      const [[rev]] = await pool.query(
        "SELECT id_revocado FROM token_revocado WHERE jti = ? LIMIT 1",
        [payload.jti]
      ).catch(() => [[null]]);
      if (rev) return res.status(401).json({ error: "Sesión cerrada. Inicia sesión de nuevo." });
    }
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
