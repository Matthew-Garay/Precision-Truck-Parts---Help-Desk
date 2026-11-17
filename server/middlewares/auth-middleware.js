/**
 * auth-middleware.js
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
 *
 * @module server/middlewares/auth-middleware
 * @requires jsonwebtoken
 * @requires ../config/db.js
 * @exports requireAuth
 * @exports requireOwnerOrAdmin
 * @exports requireAdmin
 * @exports NOMBRE_DEPARTAMENTO_SOPORTE
 * @exports esSoporteOAdmin
 * @exports requireSoporteOAdmin
 */
import jwt  from "jsonwebtoken";
import pool from '../config/db.js';

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

/**
 * requireOwnerOrAdmin(param)
 *
 * Fabrica de middleware: deja pasar al administrador o al empleado cuyo id
 * coincide con req.params[param]. Antes estaba copiado en auth-routes,
 * solicitudes-routes y tickets-routes.
 *
 *   router.get("/empleado/:id_empleado", requireOwnerOrAdmin(), handler)
 *   router.get("/accesos/:id",           requireOwnerOrAdmin("id"), handler)
 */
export const requireOwnerOrAdmin = (param = "id_empleado") => (req, res, next) => {
  const idParam = parseInt(req.params[param], 10);
  const { id_empleado, id_rol } = req.usuario ?? {};
  if (id_rol === 1 || id_empleado === idParam) return next();
  return res.status(403).json({ error: "Acceso no autorizado" });
};

export function requireAdmin(req, res, next) {
  if (req.usuario?.id_rol !== 1)
    return res.status(403).json({ error: "Acceso restringido a administradores" });
  next();
}

/**
 * Nombre del departamento que comparte permisos extra con los administradores
 * (observaciones y ruta del material). Se identifica por NOMBRE y no por id:
 * el id cambia si la tabla se renumera o se reimporta (antes estaba fijo en 67
 * y se rompia cada vez). La comparacion usa la collation de la tabla
 * (utf8mb4_unicode_ci), que ignora mayusculas y acentos.
 */
export const NOMBRE_DEPARTAMENTO_SOPORTE = "Soporte Técnico";

/**
 * esSoporteOAdmin
 *
 * Devuelve true si el empleado es administrador (rol 1) o pertenece al
 * departamento Soporte Tecnico. Define quien comparte las capacidades que van
 * mas alla de `requireAdmin`: observaciones de insumos y ruta del material.
 *
 * El JWT solo lleva {id_empleado, id_rol, ver}; el departamento NO viaja en el
 * token, asi que se consulta en cada llamada. Es lo correcto: si alguien cambia
 * de departamento, el permiso cambia de inmediato en lugar de esperar a que
 * expire el token. Si la consulta falla se devuelve false: nunca se concede
 * un permiso por error.
 */
export async function esSoporteOAdmin({ id_empleado, id_rol } = {}) {
  if (id_rol === 1) return true;              // admin: no hace falta consultar
  if (!id_empleado) return false;
  try {
    const [[emp]] = await pool.query(
      `SELECT 1 AS ok
         FROM empleado e
         JOIN departamento d ON d.id_departamento = e.id_departamento
        WHERE e.id_empleado = ? AND d.nombre_departamento = ?
        LIMIT 1`,
      [id_empleado, NOMBRE_DEPARTAMENTO_SOPORTE]
    );
    return Boolean(emp?.ok);
  } catch {
    return false;
  }
}

/**
 * requireSoporteOAdmin
 *
 * Deja pasar a los administradores (rol 1) y a los empleados del departamento
 * Soporte Tecnico. Se usa para las observaciones de insumos y para la ruta del
 * material, dos operaciones que no encajan en `requireAdmin` porque las usa
 * tambien el personal de soporte.
 */
export async function requireSoporteOAdmin(req, res, next) {
  if (await esSoporteOAdmin(req.usuario)) return next();
  return res.status(403).json({
    error: "Solo Soporte Técnico o administradores pueden realizar esta acción",
  });
}
