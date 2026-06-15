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

// ── Ruta de ticket individual (admin o dueño) ─────────────────
router.get("/:id_ticket", getTicketById);

// ── Rutas de usuario autenticado ──────────────────────────────
router.get("/empleado/:id_empleado", requireOwnerOrAdmin, getTicketsByEmpleado);
router.get("/:id_ticket/imagenes",                        getImagenesTicket);
router.post("/:id_ticket/imagenes", ...uploadEvidencias.array("evidencias", 8), agregarImagenesTicket);
router.delete("/:id_ticket/imagenes/:nombre",              eliminarImagenTicket);
router.patch("/:id_ticket/calificar", validate(schemaCalificarTicket), calificarTicket);
router.put("/:id_ticket/editar",      validate(schemaEditarTicket),    editarTicketUsuario);
router.post("/", ticketLimiter, ...uploadEvidencias.array("evidencias", 8), validate(schemaCrearTicket), crearTicket);

export default router;
