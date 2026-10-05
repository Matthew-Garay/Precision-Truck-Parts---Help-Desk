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

/**
 * ID del departamento que puede escribir observaciones de insumos.
 * Vive en `departamento` (no en `rol`): el sistema solo tiene Administrador y
 * Usuario, y "Soporte Tecnico" es un departamento. Si se renombra o cambia el
 * id hay que actualizar esta constante.
 */
export const DEPARTAMENTO_SOPORTE = 2;

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
      "SELECT id_departamento FROM empleado WHERE id_empleado = ? LIMIT 1",
      [id_empleado]
    );
    return emp?.id_departamento === DEPARTAMENTO_SOPORTE;
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
