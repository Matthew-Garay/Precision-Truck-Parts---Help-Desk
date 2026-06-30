/**
 * session.js
 *
 * Helpers centralizados para leer y escribir los datos de sesion del usuario
 * en sessionStorage. El token JWT se gestiona exclusivamente en api.js.
 *
 * Solo se persisten los campos publicos del perfil del empleado (id, nombre,
 * rol, departamento, foto). Campos sensibles como email o password nunca
 * se almacenan aqui para reducir la exposicion ante ataques XSS.
 *
 * Funciones exportadas:
 *
 *   getUsuario()         - retorna el objeto usuario del sessionStorage o null
 *   setUsuario(u)        - guarda solo los campos publicos del usuario
 *   clearUsuario()       - elimina el usuario del sessionStorage
 *   getIdAcceso()        - retorna el id_acceso de la sesion actual
 *   setIdAcceso(id)      - guarda el id_acceso como string
 *   clearIdAcceso()      - elimina el id_acceso del sessionStorage
 */
// Helpers de sesión — centralizados aquí, nunca en main.jsx
// NOTA: el token JWT se maneja en api.js (memoria), no aquí

// Solo guardamos los campos mínimos necesarios en sessionStorage;
// datos sensibles como email no se persisten para reducir exposición ante XSS.
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
    const u = JSON.parse(sessionStorage.getItem("usuario") || "null");
    return u || null;
  } catch { return null; }
};

export const setUsuario    = (u)  => sessionStorage.setItem("usuario", JSON.stringify(filtrarUsuario(u)));
export const clearUsuario  = ()   => sessionStorage.removeItem("usuario");
export const getIdAcceso   = ()   => sessionStorage.getItem("id_acceso");
export const setIdAcceso   = (id) => sessionStorage.setItem("id_acceso", String(id));
export const clearIdAcceso = ()   => sessionStorage.removeItem("id_acceso");
