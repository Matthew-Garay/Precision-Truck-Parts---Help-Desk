/**
 * auth-routes.js
 *
 * Define todas las rutas del prefijo /api/auth.
 * Aplica csrfProtection a todo el router.
 *
 * Rutas publicas (sin autenticacion JWT):
 *
 *   POST /login
 *     Rate limit: 10 intentos por 15 minutos por IP.
 *     Validacion: schemaLogin (email valido, password no vacio).
 *
 *   POST /logout
 *     Publica intencionalmente: sendBeacon (cierre de pestana del navegador)
 *     no puede enviar el encabezado Authorization. El riesgo es bajo porque
 *     solo cierra un registro de historial_acceso por id_acceso, sin
 *     modificar datos criticos.
 *
 *   POST /recuperar
 *   POST /verificar-codigo
 *   POST /reset-password
 *     Rate limit: 5 intentos por 15 minutos por IP.
 *
 *   GET /zoho/login
 *     Inicia el login con Zoho: genera `state` en cookie httpOnly y redirige
 *     al authorization endpoint (scopes openid email profile).
 *     Rate limit: 20 intentos por 15 minutos por IP.
 *
 *   GET /zoho/callback
 *     Zoho redirige aquí con ?code=...&state=.... Valida el state, intercambia
 *     el code por tokens, empata el email con `empleado` (debe existir y estar
 *     activo) y redirige al frontend con el JWT interno. Sin auto-altas.
 *
 * Rutas protegidas (requieren JWT valido via requireAuth):
 *
 *   PUT  /perfil/:id          - actualiza perfil del propio empleado
 *   GET  /accesos/:id         - historial de accesos (dueno o admin)
 *   GET  /departamentos       - catalogo de departamentos
 *   GET  /roles               - catalogo de roles
 *   GET  /empleados/:id       - datos de un empleado especifico
 *
 * Rutas exclusivas de administrador (requireAdmin despues de requireAuth):
 *
 *   GET  /accesos             - historial global de todos los empleados
 *   GET  /empleados           - listado completo de empleados
 *   PUT  /empleados/:id       - edicion de cualquier empleado
 *   POST /empleados           - creacion de nuevo empleado
 *
 * @module server/routes/auth-routes
 * @requires express
 * @requires express-rate-limit
 * @requires ../middlewares/security.js
 * @requires ../middlewares/auth-middleware.js
 * @requires ../middlewares/validate.js
 * @requires ../controllers/auth-controller.js
 * @requires ../controllers/reset-controller.js
 * @requires ../controllers/zoho-controller.js
 * @exports router (default)
 */
import { Router }    from "express";
import rateLimit     from "express-rate-limit";
import { csrfProtection } from '../middlewares/security.js';
import { requireAuth, requireAdmin, requireOwnerOrAdmin } from '../middlewares/auth-middleware.js';
import { validate, schemaLogin, schemaLogout, schemaActualizarPerfil, schemaCrearEmpleado, schemaUpdateEmpleadoAdmin } from '../middlewares/validate.js';
import {
  login, logout, actualizarPerfil, getAccesos, getAllAccesos,
  getAllEmpleados, getEmpleadoById, getDepartamentos, getRoles, getSucursales, updateEmpleadoAdmin, crearEmpleado, eliminarEmpleado,
  refreshToken, getAreas, crearArea, asignarAreaPuesto,
} from '../controllers/auth-controller.js';
import { solicitarRecuperacion, verificarCodigo, resetPassword } from '../controllers/reset-controller.js';
import { zohoLogin, zohoCallback } from '../controllers/zoho-controller.js';

const router = Router();
router.use(csrfProtection);

// Solo el propio empleado o un admin puede ver sus accesos
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Demasiados intentos de inicio de sesion. Intenta de nuevo en 15 minutos." },
});

const recuperarLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Demasiadas solicitudes. Intenta en 15 minutos." },
});

const logoutLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Demasiadas peticiones." },
});

// Rate limit para refresh-token. Ya exige un token válido, así que no hay fuerza
// bruta que frenar: el límite solo evita abusos. Antes era 5 cada 15 min y se
// agotaba abriendo unas cuantas ventanas de impresión.
const refreshTokenLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Demasiados intentos. Intenta en 15 minutos." },
});

// Rutas públicas
router.post("/login",            loginLimiter,     validate(schemaLogin), login);
router.post("/recuperar",        recuperarLimiter, solicitarRecuperacion);
router.post("/verificar-codigo", recuperarLimiter, verificarCodigo);
router.post("/reset-password",   recuperarLimiter, resetPassword);
// logout es público intencionalmente: sendBeacon (cierre de pestaña) no puede
// enviar headers de Authorization. El riesgo es bajo — solo cierra una sesión
// de historial_acceso por id_acceso, no modifica datos críticos.
router.post("/logout", logoutLimiter, validate(schemaLogout), logout);

// Renovar JWT — requiere token válido en Authorization
router.post("/refresh-token", refreshTokenLimiter, requireAuth, refreshToken);

// Login con Zoho (OIDC server-based) — rutas GET públicas:
// Zoho redirige el navegador aquí sin headers; el callback valida `state`
// en cookie httpOnly y emite el JWT interno igual que POST /login.
router.get(
  "/zoho/login",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Demasiados intentos. Intenta en 15 minutos." },
  }),
  zohoLogin
);
router.get("/zoho/callback", zohoCallback);

// Rutas protegidas
router.use(requireAuth);
router.put("/perfil/:id",          validate(schemaActualizarPerfil), actualizarPerfil);
router.get("/accesos/:id",         requireOwnerOrAdmin("id"), getAccesos);
router.get("/departamentos",       getDepartamentos);
router.get("/sucursales",          getSucursales);
router.get("/roles",               getRoles);
// Solo el propio empleado (su perfil) o un administrador: antes cualquier
// usuario autenticado podía consultar los datos de cualquier empleado.
router.get("/empleados/:id",       requireOwnerOrAdmin("id"), getEmpleadoById);

// Solo admin
router.use(requireAdmin);
router.get("/accesos",             getAllAccesos);
router.get("/empleados",           getAllEmpleados);
router.put("/empleados/:id",       validate(schemaUpdateEmpleadoAdmin), updateEmpleadoAdmin);
router.post("/empleados",          validate(schemaCrearEmpleado),       crearEmpleado);
// Borrado lógico: no borra la fila, solo la oculta de Personal
router.delete("/empleados/:id",    eliminarEmpleado);
// Áreas: agrupan los puestos para los reportes por área
router.get("/areas",               getAreas);
router.post("/areas",              crearArea);
router.patch("/departamentos/:id/area", asignarAreaPuesto);

export default router;
