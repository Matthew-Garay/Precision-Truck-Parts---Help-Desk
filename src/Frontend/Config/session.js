/**
 * session.js
 *
 * Módulo de persistencia de sesión del usuario autenticado.
 *
 * MECANISMO DE PERSISTENCIA:
 *   Todos los datos de sesión se almacenan en localStorage del navegador,
 *   lo que garantiza que el estado de autenticación se mantenga al:
 *     - Navegar entre los diferentes módulos de la aplicación (tickets,
 *       inventario, manuales, solicitudes, perfil, dashboard)
 *     - Recargar la página (F5 / Ctrl+R)
 *     - Abrir nuevas pestañas del mismo origen
 *     - Cerrar y reabrir el navegador
 *
 *   Claves almacenadas en localStorage:
 *     "_tk"       — JWT firmado (12h de vigencia, se renueva automáticamente
 *                   al montar la app vía POST /api/auth/refresh-token)
 *     "usuario"   — datos públicos del empleado (sin password ni datos sensibles)
 *     "id_acceso" — id del registro en historial_acceso para el logout
 *
 *   Flujo de rehidratación al recargar:
 *     1. api.js lee "_tk" de localStorage y lo carga en memoria (_token)
 *     2. main.jsx llama POST /api/auth/refresh-token con ese token
 *     3. Si el token sigue vigente, el backend devuelve uno nuevo renovado
 *     4. Si expiró (401), apiFetch() llama clearSession() y redirige a /login
 *
 *   Solo se persisten los campos de CAMPOS_PUBLICOS para evitar almacenar
 *   información sensible (password, datos internos) en el navegador.
 */

const CAMPOS_PUBLICOS = ["id_empleado", "num_empleado", "nombre", "ap_paterno", "ap_materno",
                         "foto", "id_rol", "rol", "departamento", "id_departamento",
                         "id_sucursal", "sucursal", "nombre_sucursal"];

function filtrarUsuario(u) {
  if (!u || typeof u !== "object") return null;
  return Object.fromEntries(
    CAMPOS_PUBLICOS.filter(k => k in u).map(k => [k, u[k]])
  );
}

export const getUsuario = () => {
  try {
    const u = JSON.parse(localStorage.getItem("usuario") || "null");
    return u || null;
  } catch { return null; }
};

export const setUsuario    = (u)  => localStorage.setItem("usuario", JSON.stringify(filtrarUsuario(u)));
export const clearUsuario  = ()   => localStorage.removeItem("usuario");
export const getIdAcceso   = ()   => localStorage.getItem("id_acceso");
export const setIdAcceso   = (id) => localStorage.setItem("id_acceso", String(id));
export const clearIdAcceso = ()   => localStorage.removeItem("id_acceso");
