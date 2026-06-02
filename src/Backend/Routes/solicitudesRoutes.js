import { Router } from "express";
import rateLimit from "express-rate-limit";
import { csrfProtection } from "../Middlewares/security.js";
import { requireAuth, requireAdmin } from "../Middlewares/authMiddleware.js";
import { validate, schemaCrearSolicitud, schemaActualizarEstatusSolicitud } from "../Middlewares/validate.js";
import {
  getInsumos, getInventario, getInsumosStockBajo, crearSolicitud, getSolicitudesByEmpleado,
  getSolicitudById, getAllSolicitudes, actualizarEstatusSolicitud
} from "../Controllers/solicitudesController.js";

const router = Router();
router.use(csrfProtection);
router.use(requireAuth);

// Rate limit para creación de solicitudes: máx 20 por hora
const solicitudLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Límite de solicitudes alcanzado. Intenta más tarde." },
});

// Middleware: solo el propio empleado o un admin puede ver sus solicitudes
function requireOwnerOrAdmin(req, res, next) {
  const idParam = parseInt(req.params.id_empleado, 10);
  const { id_empleado, id_rol } = req.usuario;
  if (id_rol === 1 || id_empleado === idParam) return next();
  return res.status(403).json({ error: "Acceso no autorizado" });
}

// Rutas de usuario autenticado
router.get("/insumos/stock-bajo", requireAdmin, getInsumosStockBajo);
router.get("/insumos",           getInsumos);
router.get("/empleado/:id_empleado", requireOwnerOrAdmin, getSolicitudesByEmpleado);
router.post("/", solicitudLimiter, validate(schemaCrearSolicitud), crearSolicitud);

// Rutas exclusivas de admin
router.use(requireAdmin);
router.get("/inventario",      getInventario);
router.get("/",                getAllSolicitudes);
router.patch("/:id/estatus",   validate(schemaActualizarEstatusSolicitud), actualizarEstatusSolicitud);
router.get("/:id",             getSolicitudById);

export default router;
