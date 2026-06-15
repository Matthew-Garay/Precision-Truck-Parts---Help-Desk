// Helpers de sesión — centralizados aquí, nunca en main.jsx
// NOTA: el token JWT se maneja en api.js (memoria), no aquí

// Solo guardamos los campos mínimos necesarios en sessionStorage;
// datos sensibles como email no se persisten para reducir exposición ante XSS.
const CAMPOS_PUBLICOS = ["id_empleado", "num_empleado", "nombre", "ap_paterno", "ap_materno",
                         "foto", "id_rol", "rol", "departamento", "id_departamento"];

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
