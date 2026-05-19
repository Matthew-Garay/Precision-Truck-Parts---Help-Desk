import { Router }    from "express";
import rateLimit     from "express-rate-limit";
import { csrfProtection } from "../Middlewares/security.js";
import {
  login, logout, actualizarPerfil, getAccesos, getAllAccesos,
  getAllEmpleados, getEmpleadoById, getDepartamentos, getRoles, updateEmpleadoAdmin, crearEmpleado,
  subirFotoEmpleado, uploadFoto
} from "../Controllers/authController.js";

const router = Router();
router.use(csrfProtection);

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Demasiados intentos de inicio de sesión. Intenta de nuevo en 15 minutos." },
});

router.post("/login", loginLimiter, login);
router.post("/logout",             logout);
router.put("/perfil/:id",          actualizarPerfil);
router.get("/accesos/:id",         getAccesos);
router.get("/accesos",             getAllAccesos);
router.get("/empleados",           getAllEmpleados);
router.get("/empleados/:id",       getEmpleadoById);
router.get("/departamentos",       getDepartamentos);
router.get("/roles",               getRoles);
router.put("/empleados/:id",       updateEmpleadoAdmin);
router.post("/empleados",          crearEmpleado);
router.post("/perfil/:id/foto",    uploadFoto.single("foto"), subirFotoEmpleado);
router.post("/empleados/:id/foto", uploadFoto.single("foto"), subirFotoEmpleado);

export default router;
