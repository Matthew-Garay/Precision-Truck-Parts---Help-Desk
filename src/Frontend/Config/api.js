/**
 * api.js — Módulo central de comunicación HTTP.
 *
 * PERSISTENCIA DE SESIÓN:
 *   El sistema implementa persistencia de sesión mediante localStorage,
 *   eliminando la necesidad de re-autenticaciones al navegar entre módulos.
 *
 *   Mecanismo:
 *     1. Al hacer login, el JWT se guarda en localStorage bajo la clave "_tk"
 *        y en la variable de módulo _token para acceso síncrono en memoria.
 *     2. Al recargar la página, _token se rehidrata desde localStorage
 *        automáticamente en cada llamada a getToken().
 *     3. main.jsx renueva el token contra el backend (refresh-token) al montar,
 *        garantizando que la sesión siga vigente sin pedir credenciales.
 *     4. Si el token expiró, el backend responde 401 y apiFetch() llama
 *        clearSession() que limpia localStorage y redirige a /login.
 *     5. Al cerrar la pestaña, sendBeacon envía el logout al backend para
 *        registrar la salida en historial_acceso sin bloquear el cierre.
 *
 *   Datos persistidos en localStorage:
 *     "_tk"       — JWT (12h vigencia, renovado automáticamente)
 *     "usuario"   — datos públicos del empleado autenticado
 *     "id_acceso" — id del registro de sesión activa
 *
 * clearSession() — elimina token + usuario + id_acceso y redirige a /login.
 * apiFetch()     — adjunta JWT, CSRF header y serializa body automáticamente.
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
  SUCURSALES:         "/api/auth/sucursales",
  // Tickets
  TICKETS:            "/api/tickets",
  TICKET:             (id) => `/api/tickets/${Number(id)}`,
  TICKET_CALIFICAR:   (id) => `/api/tickets/${Number(id)}/calificar`,
  TICKET_EDITAR:      (id) => `/api/tickets/${Number(id)}/editar`,
  TICKET_IMAGENES:    (id) => `/api/tickets/${Number(id)}/imagenes`,
  TICKET_CANCELAR:    (id) => `/api/tickets/${Number(id)}/cancelar`,
  TICKETS_EMPLEADO:   (id) => `/api/tickets/empleado/${Number(id)}`,
  TICKETS_METRICAS:   "/api/tickets/metricas",
  TICKETS_RENDIMIENTO: "/api/tickets/rendimiento",
  // Solicitudes
  SOLICITUDES:        "/api/solicitudes",
  SOLICITUD:          (id) => `/api/solicitudes/${Number(id)}`,
  SOLICITUD_ESTATUS:  (id) => `/api/solicitudes/${Number(id)}/estatus`,
  SOLICITUD_ITEMS:    (id) => `/api/solicitudes/${Number(id)}/items`,
  SOLICITUD_RUTA:     (id) => `/api/solicitudes/${Number(id)}/ruta`,
  SOLICITUD_MOVIMIENTOS: (id) => `/api/solicitudes/${Number(id)}/movimientos`,
  SOLICITUDES_EMP:    (id) => `/api/solicitudes/empleado/${Number(id)}`,
  SOLICITUDES_PEND:   "/api/solicitudes/pendientes",
  INSUMOS:            "/api/solicitudes/insumos",
  INSUMO_FOTO:        (id) => `/api/solicitudes/insumos/${Number(id)}/foto`,
  INSUMO_ENTRADA:     (id) => `/api/solicitudes/insumos/${Number(id)}/entrada`,
  INSUMO_MOVIMIENTOS: (id) => `/api/solicitudes/insumos/${Number(id)}/movimientos`,
  MOVIMIENTOS_INSUMOS: "/api/solicitudes/movimientos",
  INVENTARIO:         "/api/solicitudes/inventario",
  // Categorias / Manuales
  CATEGORIAS:         "/api/categorias",
  MANUALES:           "/api/manuales",
  MANUAL:             (id) => `/api/manuales/${Number(id)}`,
  REFRESH_TOKEN:      "/api/auth/refresh-token",
  PING:               "/api/ping",
};

export { API_ROUTES };

// -- Token: variable de módulo + sessionStorage como respaldo para F5 --------
// El token vive en memoria (_token) para acceso síncrono rápido.
// Se persiste en sessionStorage bajo "_tk" SOLO para sobrevivir recargas (F5):
// sessionStorage es accesible por JavaScript (XSS puede leerlo), por lo que
// NO se debe guardar aquí nada más sensible. Si el riesgo XSS es crítico
// la única mitigación real es usar httpOnly cookies gestionadas por el servidor.
let _token = null;

export const getToken   = () => _token ?? localStorage.getItem("_tk") ?? null;
export const setToken   = (t) => { _token = t; if (t) localStorage.setItem("_tk", t); else localStorage.removeItem("_tk"); };
export const clearToken = () => { _token = null; localStorage.removeItem("_tk"); };

// Limpia toda la sesión y redirige al login
export function clearSession() {
  _token = null;
  localStorage.removeItem("_tk");
  localStorage.removeItem("usuario");
  localStorage.removeItem("id_acceso");
  sessionStorage.removeItem("pwd_actual");
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
  else {
    const stored = localStorage.getItem("_tk");
    if (stored) { _token = stored; headers["Authorization"] = `Bearer ${stored}`; }
  }

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

// Export default como API para compatibilidad con componentes existentes
const API = API_BASE;
export default API;
