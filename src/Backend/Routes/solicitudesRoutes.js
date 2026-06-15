import { Router } from "express";
import rateLimit from "express-rate-limit";
import { csrfProtection } from "../Middlewares/security.js";
import { requireAuth, requireAdmin } from "../Middlewares/authMiddleware.js";
import { validate, schemaCrearSolicitud, schemaActualizarEstatusSolicitud, schemaInsumo } from "../Middlewares/validate.js";
import {
  getInsumos, getInventario, getInsumosStockBajo, crearSolicitud, getSolicitudesByEmpleado,
  getSolicitudById, getAllSolicitudes, getSolicitudesPendientes, actualizarEstatusSolicitud,
  crearInsumo, actualizarInsumo, eliminarInsumo, getReporteSolicitudes
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

// ── Rutas exclusivas de admin ─────────────────────────────────
// IMPORTANTE: registradas ANTES de las rutas dinámicas /:id
// para evitar que Express intercepte "/reporte" o "/" como si fueran un id.
router.get("/reporte",        requireAdmin, getReporteSolicitudes);
router.get("/",               requireAdmin, getAllSolicitudes);
router.post("/insumos",       requireAdmin, validate(schemaInsumo), crearInsumo);
router.put("/insumos/:id",    requireAdmin, validate(schemaInsumo), actualizarInsumo);
router.delete("/insumos/:id", requireAdmin, eliminarInsumo);
router.patch("/:id/estatus",  requireAdmin, validate(schemaActualizarEstatusSolicitud), actualizarEstatusSolicitud);

// ── Rutas de usuario autenticado ──────────────────────────────
// Rutas con paths fijos van antes de /:id para evitar ambigüedad
router.get("/insumos/stock-bajo", getInsumosStockBajo);
router.get("/insumos",            getInsumos);
router.get("/inventario",         getInventario);
router.get("/pendientes",         requireAdmin, getSolicitudesPendientes);
router.get("/empleado/:id_empleado", requireOwnerOrAdmin, getSolicitudesByEmpleado);
router.post("/", solicitudLimiter, validate(schemaCrearSolicitud), crearSolicitud);
router.get("/:id", getSolicitudById);

export default router;
