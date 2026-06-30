/**
 * solicitudesRoutes.js
 *
 * Define todas las rutas del prefijo /api/solicitudes.
 * Aplica csrfProtection y requireAuth a todo el router.
 *
 * IMPORTANTE: Las rutas con paths fijos (como /reporte, /insumos, /inventario)
 * se declaran ANTES de las rutas dinamicas (/:id) para que Express no las
 * interprete como si el segmento fuera un id numerico.
 *
 * Rutas exclusivas de administrador (requireAdmin):
 *
 *   GET    /reporte              - solicitudes filtradas por rango de fechas para exportar
 *   GET    /                     - listado paginado de todas las solicitudes
 *   POST   /insumos              - crear nuevo insumo en el inventario
 *   PUT    /insumos/:id          - actualizar datos de un insumo
 *   DELETE /insumos/:id          - eliminar un insumo (falla si tiene solicitudes activas)
 *   PATCH  /:id/estatus          - cambiar estatus de una solicitud (descuenta stock si Resuelto)
 *   GET    /pendientes           - solicitudes sin cerrar ordenadas por prioridad
 *
 * Rutas de usuario autenticado:
 *
 *   GET  /insumos/stock-bajo     - insumos con stock <= 5
 *   GET  /insumos                - insumos disponibles (stock > 0)
 *   GET  /inventario             - todos los insumos sin filtro
 *   GET  /empleado/:id_empleado  - historial de solicitudes de un empleado
 *   POST /                       - crear nueva solicitud
 *                                  Rate limit: 20 por hora por IP
 *   GET  /:id                    - detalle de una solicitud especifica
 */
import { Router } from "express";
import rateLimit from "express-rate-limit";
import { csrfProtection } from "../Middlewares/security.js";
import { requireAuth, requireAdmin } from "../Middlewares/authMiddleware.js";
import { validate, schemaCrearSolicitud, schemaActualizarEstatusSolicitud, schemaInsumo } from "../Middlewares/validate.js";
import {
  getInsumos, getInventario, getInsumosStockBajo, crearSolicitud, getSolicitudesByEmpleado,
  getSolicitudById, getSolicitudByFolio, getAllSolicitudes, getSolicitudesPendientes,
  actualizarEstatusSolicitud, aprobarItemsSolicitud, crearInsumo, actualizarInsumo,
  eliminarInsumo, getReporteSolicitudes
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
router.patch("/:id/items",    requireAdmin, aprobarItemsSolicitud);

// ── Rutas de usuario autenticado ──────────────────────────────
// Rutas con paths fijos van antes de /:id para evitar ambigüedad
router.get("/insumos/stock-bajo", getInsumosStockBajo);
router.get("/insumos",            getInsumos);
router.get("/inventario",         getInventario);
router.get("/pendientes",         requireAdmin, getSolicitudesPendientes);
router.get("/empleado/:id_empleado", requireOwnerOrAdmin, getSolicitudesByEmpleado);
router.post("/", solicitudLimiter, validate(schemaCrearSolicitud), crearSolicitud);
router.get("/folio/:folio", getSolicitudByFolio);
router.get("/:id", getSolicitudById);

export default router;
