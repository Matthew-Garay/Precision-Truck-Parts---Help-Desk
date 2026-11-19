/**
 * tickets-routes.js
 *
 * Define todas las rutas del prefijo /api/tickets.
 * Aplica csrfProtection y requireAuth a todo el router.
 *
 * IMPORTANTE: Las rutas con paths fijos (/metricas, /admins, /reporte)
 * se declaran ANTES de las rutas dinamicas (/:id_ticket) para que Express
 * no las interprete como si el segmento fuera un id de ticket.
 *
 * Rutas exclusivas de administrador (requireAdmin):
 *
 *   GET   /metricas             - estadisticas del dashboard (promedio horas, por departamento, tendencia)
 *   GET   /admins               - lista de empleados con rol admin activos
 *   GET   /reporte              - tickets filtrados por fechas y tecnico para exportar
 *   GET   /                     - listado paginado de todos los tickets
 *   PATCH /:id_ticket           - actualizar estatus, comentarios y tecnico de un ticket
 *
 * Rutas accesibles por el dueno del ticket o un administrador:
 *
 *   GET    /:id_ticket                     - detalle completo del ticket
 *   GET    /empleado/:id_empleado          - tickets de un empleado especifico
 *   GET    /:id_ticket/imagenes            - lista de nombres de imagenes de evidencia
 *   POST   /:id_ticket/imagenes            - agregar imagenes de evidencia (max 8 archivos)
 *   DELETE /:id_ticket/imagenes/:nombre    - eliminar una imagen de evidencia por nombre
 *   PATCH  /:id_ticket/calificar           - calificar un ticket resuelto (1-5 estrellas)
 *   PUT    /:id_ticket/editar              - editar campos del ticket mientras este En proceso
 *   POST   /                               - crear nuevo ticket con evidencias opcionales
 *                                            Rate limit: 30 por hora por IP
 *
 * @module server/routes/tickets-routes
 * @requires express
 * @requires express-rate-limit
 * @requires ../middlewares/auth-middleware.js
 * @requires ../middlewares/security.js
 * @requires ../middlewares/validate.js
 * @requires ../controllers/tickets-controller.js
 * @requires ../middlewares/upload-evidencias.js
 * @exports router (default)
 */
import { Router }      from "express";
import rateLimit       from "express-rate-limit";
import { requireAuth, requireAdmin, requireOwnerOrAdmin } from '../middlewares/auth-middleware.js';
import { csrfProtection } from '../middlewares/security.js';
import { validate, validateQuery, schemaCrearTicket, schemaActualizarTicket, schemaCalificarTicket, schemaEditarTicket, schemaFiltrosTickets } from '../middlewares/validate.js';
import { crearTicket, getTicketsByEmpleado, getImagenesTicket, agregarImagenesTicket, eliminarImagenTicket, getAllTickets, actualizarTicket, calificarTicket, editarTicketUsuario, getMetricas, getAdmins, getReporte, getTicketById, getTicketByFolio, cancelarTicket, getRendimientoTecnicos, getHistorialTicket, getIndicadoresMensuales } from '../controllers/tickets-controller.js';
import { uploadEvidencias } from '../middlewares/upload-evidencias.js';

const router = Router();
router.use(csrfProtection);
router.use(requireAuth);

// Rate limit para creacion de tickets: max 30 por hora
const ticketLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Limite de tickets alcanzado. Intenta mas tarde." },
});

// ── Rutas exclusivas de admin ─────────────────────────────────
// IMPORTANTE: registradas ANTES de las rutas dinámicas /:id_ticket
// para evitar que Express intercepte "/metricas", "/admins", etc.
// como si fueran un id_ticket.
router.get("/metricas",    requireAdmin, getMetricas);
router.get("/admins",     requireAdmin, getAdmins);
router.get("/reporte",    requireAdmin, getReporte);
router.get("/rendimiento", requireAdmin, getRendimientoTecnicos);
router.get("/indicadores", requireAdmin, getIndicadoresMensuales);
router.get("/",           requireAdmin, validateQuery(schemaFiltrosTickets), getAllTickets);
router.patch("/:id_ticket", requireAdmin, validate(schemaActualizarTicket), actualizarTicket);

// ── Rutas con paths fijos — deben ir ANTES de /:id_ticket ────
router.get("/folio/:folio", getTicketByFolio);  // PrintTicketPage / Puppeteer
router.get("/empleado/:id_empleado", requireOwnerOrAdmin(), getTicketsByEmpleado);
router.post("/", ticketLimiter, ...uploadEvidencias.array("evidencias", 8), validate(schemaCrearTicket), crearTicket);

// ── Sub-rutas de un ticket — deben ir ANTES de /:id_ticket ───
router.get("/:id_ticket/imagenes",                        getImagenesTicket);
router.get("/:id_ticket/historial",                       getHistorialTicket);
router.post("/:id_ticket/imagenes", ...uploadEvidencias.array("evidencias", 8), agregarImagenesTicket);
router.delete("/:id_ticket/imagenes/:nombre",              eliminarImagenTicket);
router.patch("/:id_ticket/calificar", validate(schemaCalificarTicket), calificarTicket);
router.patch("/:id_ticket/cancelar", cancelarTicket);
router.put("/:id_ticket/editar",      validate(schemaEditarTicket),    editarTicketUsuario);

// ── Ruta dinámica — debe ir AL FINAL ─────────────────────────
router.get("/:id_ticket", getTicketById);

export default router;
