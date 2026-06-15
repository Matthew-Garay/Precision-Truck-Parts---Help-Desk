import { Router }    from "express";
import rateLimit     from "express-rate-limit";
import { csrfProtection } from "../Middlewares/security.js";
import { requireAuth, requireAdmin } from "../Middlewares/authMiddleware.js";
import { validate, schemaLogin, schemaLogout, schemaActualizarPerfil, schemaCrearEmpleado, schemaUpdateEmpleadoAdmin } from "../Middlewares/validate.js";
import {
  login, logout, actualizarPerfil, getAccesos, getAllAccesos,
  getAllEmpleados, getEmpleadoById, getDepartamentos, getRoles, updateEmpleadoAdmin, crearEmpleado,
  subirFotoEmpleado, uploadFoto
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

// Rutas públicas
router.post("/login",            loginLimiter,     validate(schemaLogin), login);
router.post("/recuperar",        recuperarLimiter, solicitarRecuperacion);
router.post("/verificar-codigo", recuperarLimiter, verificarCodigo);
router.post("/reset-password",   recuperarLimiter, resetPassword);
// logout es público intencionalmente: sendBeacon (cierre de pestaña) no puede
// enviar headers de Authorization. El riesgo es bajo — solo cierra una sesión
// de historial_acceso por id_acceso, no modifica datos críticos.
router.post("/logout", validate(schemaLogout), logout);

// Rutas protegidas
router.use(requireAuth);
router.put("/perfil/:id",          validate(schemaActualizarPerfil), actualizarPerfil);
router.post("/perfil/:id/foto",    ...uploadFoto.single("foto"), subirFotoEmpleado);
router.get("/accesos/:id",         requireOwnerOrAdmin, getAccesos);
router.get("/departamentos",       getDepartamentos);
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
