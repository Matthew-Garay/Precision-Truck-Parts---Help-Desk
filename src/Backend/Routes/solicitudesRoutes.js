import { Router } from "express";
import { csrfProtection } from "../Middlewares/security.js";
import {
  getInsumos, getInventario, crearSolicitud, getSolicitudesByEmpleado,
  getSolicitudById, getAllSolicitudes, actualizarEstatusSolicitud
} from "../Controllers/solicitudesController.js";

const router = Router();
router.use(csrfProtection);

// Rutas estáticas primero — antes de /:id para evitar que Express las intercepte
router.get("/inventario",               getInventario);
router.get("/insumos",                  getInsumos);
router.get("/",                         getAllSolicitudes);
router.get("/empleado/:id_empleado",    getSolicitudesByEmpleado);
router.post("/",                        crearSolicitud);
router.patch("/:id/estatus",            actualizarEstatusSolicitud);
// Ruta con parámetro genérico al final para no interceptar las anteriores
router.get("/:id",                      getSolicitudById);

export default router;
