/**
 * authRoutes.js
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
 * Rutas protegidas (requieren JWT valido via requireAuth):
 *
 *   PUT  /perfil/:id          - actualiza perfil del propio empleado
 *   POST /perfil/:id/foto     - sube foto de perfil del propio empleado
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
 *   POST /empleados/:id/foto  - el admin puede cambiar la foto de cualquier empleado
 */
import { Router }    from "express";
import rateLimit     from "express-rate-limit";
import { csrfProtection } from "../Middlewares/security.js";
import { requireAuth, requireAdmin } from "../Middlewares/authMiddleware.js";
import { validate, schemaLogin, schemaLogout, schemaActualizarPerfil, schemaCrearEmpleado, schemaUpdateEmpleadoAdmin } from "../Middlewares/validate.js";
import {
  login, logout, actualizarPerfil, getAccesos, getAllAccesos,
  getAllEmpleados, getEmpleadoById, getDepartamentos, getRoles, getSucursales, updateEmpleadoAdmin, crearEmpleado,
  subirFotoEmpleado, uploadFoto, refreshToken
} from "../Controllers/authController.js";
import { solicitarRecuperacion, verificarCodigo, resetPassword } from "../Controllers/resetController.js";

const router = Router();
router.use(csrfProtection);

// Solo el propio empleado o un admin puede ver sus accesos
function requireOwnerOrAdmin(req, res, next) {
  const idParam = parseInt(req.params.id, 10);
  const { id_empleado, id_rol } = req.usuario;
  if (id_rol === 1 || id_empleado === idParam) return next();
  return res.status(403).json({ error: "Acceso no autorizado" });
}

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Demasiados intentos de inicio de sesión. Intenta de nuevo en 15 minutos." },
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
router.post("/refresh-token", requireAuth, refreshToken);

// Rutas protegidas
router.use(requireAuth);
router.put("/perfil/:id",          validate(schemaActualizarPerfil), actualizarPerfil);
router.post("/perfil/:id/foto",    ...uploadFoto.single("foto"), subirFotoEmpleado);
router.get("/accesos/:id",         requireOwnerOrAdmin, getAccesos);
router.get("/departamentos",       getDepartamentos);
router.get("/sucursales",          getSucursales);
router.get("/roles",               getRoles);
router.get("/empleados/:id",       getEmpleadoById);

// Solo admin
router.use(requireAdmin);
router.get("/accesos",             getAllAccesos);
router.get("/empleados",           getAllEmpleados);
router.put("/empleados/:id",       validate(schemaUpdateEmpleadoAdmin), updateEmpleadoAdmin);
router.post("/empleados",          validate(schemaCrearEmpleado),       crearEmpleado);
router.post("/empleados/:id/foto", ...uploadFoto.single("foto"), subirFotoEmpleado);

export default router;
