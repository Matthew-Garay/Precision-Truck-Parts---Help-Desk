/**
 * ticketsRoutes.js
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
 */
import { Router }      from "express";
import rateLimit       from "express-rate-limit";
import { csrfProtection } from "../Middlewares/security.js";
import { requireAuth, requireAdmin } from "../Middlewares/authMiddleware.js";
import { validate, schemaCrearTicket, schemaActualizarTicket, schemaCalificarTicket, schemaEditarTicket } from "../Middlewares/validate.js";
import { crearTicket, getTicketsByEmpleado, getImagenesTicket, agregarImagenesTicket, eliminarImagenTicket, getAllTickets, actualizarTicket, calificarTicket, editarTicketUsuario, getMetricas, getAdmins, getReporte, getTicketById } from "../Controllers/ticketsController.js";
import { uploadEvidencias } from "../Middlewares/uploadEvidencias.js";

// Middleware: solo el propio empleado o un admin puede acceder
function requireOwnerOrAdmin(req, res, next) {
  const idParam = parseInt(req.params.id_empleado, 10);
  const { id_empleado, id_rol } = req.usuario;
  if (id_rol === 1 || id_empleado === idParam) return next();
  return res.status(403).json({ error: "Acceso no autorizado" });
}

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
router.get("/metricas", requireAdmin, getMetricas);
router.get("/admins",   requireAdmin, getAdmins);
router.get("/reporte",  requireAdmin, getReporte);
router.get("/",         requireAdmin, getAllTickets);
router.patch("/:id_ticket", requireAdmin, validate(schemaActualizarTicket), actualizarTicket);

// ── Rutas con paths fijos — deben ir ANTES de /:id_ticket ────
router.get("/empleado/:id_empleado", requireOwnerOrAdmin, getTicketsByEmpleado);
router.post("/", ticketLimiter, ...uploadEvidencias.array("evidencias", 8), validate(schemaCrearTicket), crearTicket);

// ── Sub-rutas de un ticket — deben ir ANTES de /:id_ticket ───
router.get("/:id_ticket/imagenes",                        getImagenesTicket);
router.post("/:id_ticket/imagenes", ...uploadEvidencias.array("evidencias", 8), agregarImagenesTicket);
router.delete("/:id_ticket/imagenes/:nombre",              eliminarImagenTicket);
router.patch("/:id_ticket/calificar", validate(schemaCalificarTicket), calificarTicket);
router.put("/:id_ticket/editar",      validate(schemaEditarTicket),    editarTicketUsuario);

// ── Ruta dinámica — debe ir AL FINAL ─────────────────────────
router.get("/:id_ticket", getTicketById);

export default router;
