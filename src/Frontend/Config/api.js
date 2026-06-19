/**
 * api.js
 *
 * Modulo central de comunicacion HTTP con el servidor backend.
 * Centraliza en un solo lugar la URL base, todas las rutas de la API,
 * el manejo del token JWT y la funcion de fetch con autenticacion.
 *
 * API_BASE
 *   URL base del servidor tomada de la variable de entorno VITE_API_URL.
 *   Si esta vacia (modo desarrollo con proxy de Vite) se usa string vacio
 *   para que las peticiones vayan al mismo origen.
 *
 * API_ROUTES
 *   Lista blanca de todas las rutas permitidas de la API. Las rutas que
 *   dependen de un id reciben una funcion que acepta el id y retorna el
 *   string con Number(id) aplicado para evitar inyeccion de segmentos.
 *
 * Manejo del token JWT:
 *   El token se guarda en sessionStorage bajo la clave "_tk" para que
 *   sobreviva recargas de pagina (F5) pero se elimine al cerrar la pestana.
 *   Se mantiene ademas en la variable _token en memoria para acceso sincrono.
 *   getToken()   - retorna el token actual o null
 *   setToken(t)  - guarda el token en memoria y sessionStorage
 *   clearToken() - elimina el token de ambos lugares
 *
 * clearSession()
 *   Elimina todos los datos de sesion (token, usuario, id_acceso) y redirige
 *   al login. Se llama automaticamente cuando el servidor retorna 401.
 *
 * apiFetch(endpoint, options)
 *   Wrapper sobre fetch() que:
 *     1. Valida que el endpoint sea un string que empiece con /api/
 *     2. Agrega el encabezado x-requested-with en peticiones de mutacion
 *        (POST, PUT, PATCH, DELETE) para la proteccion CSRF del servidor
 *     3. Serializa automaticamente el body a JSON si es un objeto plano
 *     4. Adjunta el token JWT en el encabezado Authorization si existe
 *     5. Si el servidor responde 401 llama a clearSession() y redirige al login
 */
// Base URL fija desde variable de entorno — nunca proviene de input del usuario
const API_BASE = import.meta.env.VITE_API_URL ?? "";

// Lista blanca de rutas permitidas — el escaner puede verificar que son literales
const API_ROUTES = {
  // Auth
  LOGIN:              "/api/auth/login",
  LOGOUT:             "/api/auth/logout",
  RECUPERAR:          "/api/auth/recuperar",
  VERIFICAR_CODIGO:   "/api/auth/verificar-codigo",
  RESET_PASSWORD:     "/api/auth/reset-password",
  PERFIL:             (id) => `/api/auth/perfil/${Number(id)}`,
  PERFIL_FOTO:        (id) => `/api/auth/perfil/${Number(id)}/foto`,
  EMPLEADOS:          "/api/auth/empleados",
  EMPLEADO:           (id) => `/api/auth/empleados/${Number(id)}`,
  EMPLEADO_FOTO:      (id) => `/api/auth/empleados/${Number(id)}/foto`,
  DEPARTAMENTOS:      "/api/auth/departamentos",
  ROLES:              "/api/auth/roles",
  ACCESOS:            (id) => `/api/auth/accesos/${Number(id)}`,
  ACCESOS_ALL:        "/api/auth/accesos",
  // Tickets
  TICKETS:            "/api/tickets",
  TICKET:             (id) => `/api/tickets/${Number(id)}`,
  TICKET_CALIFICAR:   (id) => `/api/tickets/${Number(id)}/calificar`,
  TICKET_EDITAR:      (id) => `/api/tickets/${Number(id)}/editar`,
  TICKET_IMAGENES:    (id) => `/api/tickets/${Number(id)}/imagenes`,
  TICKETS_EMPLEADO:   (id) => `/api/tickets/empleado/${Number(id)}`,
  TICKETS_METRICAS:   "/api/tickets/metricas",
  // Solicitudes
  SOLICITUDES:        "/api/solicitudes",
  SOLICITUD:          (id) => `/api/solicitudes/${Number(id)}`,
  SOLICITUD_ESTATUS:  (id) => `/api/solicitudes/${Number(id)}/estatus`,
  SOLICITUDES_EMP:    (id) => `/api/solicitudes/empleado/${Number(id)}`,
  SOLICITUDES_PEND:   "/api/solicitudes/pendientes",
  INSUMOS:            "/api/solicitudes/insumos",
  INVENTARIO:         "/api/solicitudes/inventario",
  // Categorias / Manuales
  CATEGORIAS:         "/api/categorias",
  MANUALES:           "/api/manuales",
  MANUAL:             (id) => `/api/manuales/${Number(id)}`,
  REFRESH_TOKEN:      "/api/auth/refresh-token",
  PING:               "/api/ping",
};

export { API_ROUTES };

// -- Token en sessionStorage para sobrevivir recargas ------
// sessionStorage: persiste en recarga (F5) pero se borra al cerrar la pestaña.
// Es aceptable porque el usuario ya autenticó en esta pestaña.
let _token = sessionStorage.getItem("_tk") || null;

export const getToken   = () => _token;
export const setToken   = (t) => { _token = t; sessionStorage.setItem("_tk", t); };
export const clearToken = () => { _token = null; sessionStorage.removeItem("_tk"); };

// Limpia toda la sesión y redirige al login
export function clearSession() {
  _token = null;
  sessionStorage.removeItem("usuario");
  sessionStorage.removeItem("id_acceso");
  sessionStorage.removeItem("_tk");
  window.location.replace("/login");
}

export async function apiFetch(endpoint, options = {}) {
  // endpoint debe ser un string que empiece con /api/ — validacion defensiva
  if (typeof endpoint !== "string" || !endpoint.startsWith("/api/"))
    throw new Error("Endpoint invalido");

  const method  = (options.method || "GET").toUpperCase();
  const headers = { ...(options.headers || {}) };

  if (["POST", "PUT", "PATCH", "DELETE"].includes(method))
    headers["x-requested-with"] = "XMLHttpRequest";

  if (options.body && typeof options.body === "object" && !(options.body instanceof FormData))
    headers["Content-Type"] = "application/json";

  if (_token) headers["Authorization"] = `Bearer ${_token}`;

  // La URL final se construye concatenando la base fija con el endpoint validado
  const url = API_BASE + endpoint;
  const res = await fetch(url, {
    ...options,
    headers,
    body: options.body && typeof options.body === "object" && !(options.body instanceof FormData)
      ? JSON.stringify(options.body)
      : options.body,
  });

  if (res.status === 401) {
    clearSession();
    return res;
  }
  return res;
}

export default API_BASE;
