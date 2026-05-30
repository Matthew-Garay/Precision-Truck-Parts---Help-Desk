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
import { solicitarRecuperacion, resetPassword } from "../Controllers/resetController.js";

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
router.post("/login",          loginLimiter,      validate(schemaLogin),  login);
router.post("/logout",                            validate(schemaLogout), logout);
router.post("/recuperar",      recuperarLimiter,  solicitarRecuperacion);
router.post("/reset-password", recuperarLimiter,  resetPassword);

// Rutas protegidas
router.use(requireAuth);
router.put("/perfil/:id",          validate(schemaActualizarPerfil), actualizarPerfil);
router.post("/perfil/:id/foto",    uploadFoto.single("foto"), subirFotoEmpleado);
router.get("/accesos/:id",         requireOwnerOrAdmin, getAccesos);
router.get("/departamentos",       getDepartamentos);
router.get("/roles",               getRoles);
router.get("/empleados",           getAllEmpleados);
router.get("/empleados/:id",       getEmpleadoById);

// Solo admin
router.use(requireAdmin);
router.get("/accesos",             getAllAccesos);
router.put("/empleados/:id",       validate(schemaUpdateEmpleadoAdmin), updateEmpleadoAdmin);
router.post("/empleados",          validate(schemaCrearEmpleado),       crearEmpleado);
router.post("/empleados/:id/foto", uploadFoto.single("foto"), subirFotoEmpleado);

export default router;
