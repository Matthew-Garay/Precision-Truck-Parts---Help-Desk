/**
 * cache-config.mjs
 *
 * Configuración centralizada de TTLs y keys de caché para todos los servicios.
 *
 * Política:
 *   - Catálogos (departamentos, roles, sucursales, categorías): 10 minutos.
 *   - Listados paginados / consultas repetitivas: 2-5 minutos.
 *   - Métricas de dashboard: 2 minutos.
 *   - Datos cambiados por escritura (nombres, inventario, tickets): máximo 1 minuto.
 *
 *   Invalidación: cada servicio que modifica datos deletea las claves
 *   correspondientes (cache.del / cache.delMany / cache.delByPrefix).
 */

// --- Constantes de tiempo (ms) ---
export const TTL = {
  // Catálogos casi estáticos (10 min)
  CATALOGO: 10 * 60 * 1000,
  // Listados de empleados / tickets / movimientos (2 min)
  LISTADO: 2 * 60 * 1000,
  // Métricas y reportes (2 min)
  METRICAS: 2 * 60 * 1000,
  // Datos de usuario y nombres (1 min)
  USUARIO: 1 * 60 * 1000,
  // Nombre completo de un empleado (5 min)
  NOMBRE: 5 * 60 * 1000,
  // Datos de inventario / solicitudes (5 min)
  INVENTARIO: 5 * 60 * 1000,
  // Datos de manuales (5 min)
  MANUALES: 5 * 60 * 1000,
  // Datos de categoría (10 min)
  CATEGORIA: 10 * 60 * 1000,
};

// --- Prefijos de claves de caché ---
export const CACHE_PREFIX = {
  // Todos los empleados
  EMPLEADOS: 'empleados:all',
  // Empleado por id
  EMPLEADO: 'empleado:',
  // Nombre de un empleado por id
  EMPLEADO_NOMBRE: 'empleado:nombre:',
  // Tecnico (solo rol 1 Activo)
  TECNICOS: 'ticket:tecnicos',
  // Admins (solo rol 1 Activo)
  ADMINS: 'ticket:admins',
  // Métricas dashboard
  METRICAS: 'metricas:dashboard',
  // Categoría (todas)
  CATEGORIA_ALL: 'categoria:all',
  // Categoría por tipo
  CATEGORIA_TIPO: 'categoria:tipo:',
  // Manuales (todos)
  MANUAL: 'manual:all',
  // Insumos
  INSUMO_ALL: 'insumo:all:',
  INSUMO_DISPONIBLES: 'insumo:disponibles',
  // Departamentos
  DEPARTAMENTOS: 'cat:departamentos',
  // Roles
  ROLES: 'cat:roles',
  // Sucursales
  SUCURSALES: 'cat:sucursales',
  // Historial de accesos de un empleado
  ACCESOS_EMPLEADO: 'accesos:empleado:',
  // Historial de accesos globales
  ACCESOS_GLOBAL: 'accesos:global',
};

// --- Mapeo de TTL por método de servicio ---
export const TTL_BY_OP = {
  getByEmpleado: TTL.LISTADO,
  getById: TTL.USUARIO,
  findByEmail: TTL.USUARIO,
  getMetricas: TTL.METRICAS,
  getReporte: TTL.LISTADO,
  getAll: TTL.LISTADO,
  getNombre: TTL.NOMBRE,
  getDepartamentos: TTL.CATALOGO,
  getRoles: TTL.CATALOGO,
  getSucursales: TTL.CATALOGO,
  getAccesos: TTL.LISTADO,
  getAllAccesos: TTL.LISTADO,
  listarMovimientos: TTL.LISTADO,
  resumen: TTL.LISTADO,
  porInsumo: TTL.LISTADO,
  porSolicitud: TTL.LISTADO,
};

// --- Función utilitaria para configurar cache.get/cache.set ---
export function applyCacheMiddleware(service) {
  const originalGet = service.get.bind(service);
  const originalSet = service.set.bind(service);
  service.get = (key) => originalGet(key);
  service.set = (key, value, ttlMs) => originalSet(key, value, ttlMs);
  return service;
}
