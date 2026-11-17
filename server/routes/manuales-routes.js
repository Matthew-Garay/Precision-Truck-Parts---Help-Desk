/**
 * manuales-routes.js
 *
 * Rutas del módulo de manuales técnicos PDF (Express Router).
 * Prefijo registrado en server.js: /api/manuales
 *
 * Solo define rutas y permisos; la lógica vive en
 * controllers/manuales-controller.js.
 *
 * GET    /               - lista todos los manuales (autenticado)
 * POST   /               - sube un PDF + metadatos (solo admin)
 * POST   /batch          - sube hasta 20 PDFs con categoría compartida (solo admin)
 * PUT    /:id            - edita metadatos del manual (solo admin)
 * POST   /:id/reemplazar - reemplaza solo el archivo PDF (solo admin)
 * DELETE /:id            - elimina PDF del disco + registro BD (solo admin)
 *
 * @module server/routes/manuales-routes
 * @requires express
 * @requires ../middlewares/auth-middleware.js
 * @requires ../middlewares/security.js
 * @requires ../controllers/manuales-controller.js
 * @exports router (default)
 */
import { Router } from "express";
import { requireAuth, requireAdmin } from '../middlewares/auth-middleware.js';
import { csrfProtection } from '../middlewares/security.js';
import {
  listarManuales, subirManual, subirManualesLote,
  actualizarManual, reemplazarArchivo, eliminarManual,
} from '../controllers/manuales-controller.js';

const router = Router();
router.use(csrfProtection);
router.use(requireAuth);

router.get("/",                listarManuales);
router.post("/",               requireAdmin, subirManual);
router.post("/batch",          requireAdmin, subirManualesLote);
router.put("/:id",             requireAdmin, actualizarManual);
router.post("/:id/reemplazar", requireAdmin, reemplazarArchivo);
router.delete("/:id",          requireAdmin, eliminarManual);

export default router;
