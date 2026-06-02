import { Router }      from "express";
import rateLimit       from "express-rate-limit";
import { csrfProtection } from "../Middlewares/security.js";
import { requireAuth, requireAdmin } from "../Middlewares/authMiddleware.js";
import { validate, schemaCrearTicket, schemaActualizarTicket, schemaCalificarTicket, schemaEditarTicket } from "../Middlewares/validate.js";
import { crearTicket, getTicketsByEmpleado, getImagenesTicket, getAllTickets, actualizarTicket, calificarTicket, editarTicketUsuario, getMetricas, getAdmins, getReporte } from "../Controllers/ticketsController.js";

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

// Rutas de usuario autenticado
router.get("/empleado/:id_empleado", requireOwnerOrAdmin, getTicketsByEmpleado);
router.get("/:id_ticket/imagenes",   getImagenesTicket);
router.patch("/:id_ticket/calificar", validate(schemaCalificarTicket),  calificarTicket);
router.put("/:id_ticket/editar",      validate(schemaEditarTicket),     editarTicketUsuario);
router.post("/", ticketLimiter, (req, res, next) => {
  uploadEvidencias.array("evidencias", 8)(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message });
    next();
  });
}, validate(schemaCrearTicket), crearTicket);

// Rutas exclusivas de admin
router.use(requireAdmin);
router.get("/metricas", getMetricas);
router.get("/admins",   getAdmins);
router.get("/reporte",  getReporte);
router.get("/",         getAllTickets);
router.patch("/:id_ticket", validate(schemaActualizarTicket), actualizarTicket);

export default router;
