
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
