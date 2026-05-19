import { Router }      from "express";
import multer          from "multer";
import path            from "path";
import fs              from "fs";
import { csrfProtection, safeResolvePath } from "../Middlewares/security.js";
import { crearTicket, getTicketsByEmpleado, getImagenesTicket, getAllTickets, actualizarTicket, calificarTicket, editarTicketUsuario } from "../Controllers/ticketsController.js";

const router = Router();
router.use(csrfProtection);

const EVIDENCIAS_BASE = path.resolve("storage", "Evidencias_Tickets");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    try {
      const tmp = safeResolvePath(EVIDENCIAS_BASE, "_tmp_upload");
      fs.mkdirSync(tmp, { recursive: true });
      cb(null, tmp);
    } catch {
      cb(new Error("Ruta de destino no permitida"));
    }
  },
  // Nombre generado 100% por el servidor — no usa originalname del cliente
  filename: (req, file, cb) => {
    const ext = file.mimetype === "image/png"  ? ".png"
              : file.mimetype === "image/webp" ? ".webp"
              : file.mimetype === "image/gif"  ? ".gif"
              : ".jpg";
    cb(null, `${Date.now()}_${Math.random().toString(36).slice(2, 8)}${ext}`);
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) cb(null, true);
    else cb(new Error("Solo se permiten imágenes"));
  },
  limits: { fileSize: 10 * 1024 * 1024 },
});

router.get("/", getAllTickets);
router.get("/empleado/:id_empleado", getTicketsByEmpleado);
router.get("/:id_ticket/imagenes",   getImagenesTicket);

router.patch("/:id_ticket/calificar", calificarTicket);
router.put("/:id_ticket/editar", editarTicketUsuario);
router.patch("/:id_ticket", actualizarTicket);

router.post("/", (req, res, next) => {
  upload.array("evidencias", 8)(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message });
    next();
  });
}, crearTicket);

export default router;
