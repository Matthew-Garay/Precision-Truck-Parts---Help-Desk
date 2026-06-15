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
  MANUAL:             (nombre) => `/api/manuales/${encodeURIComponent(nombre)}`,
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
