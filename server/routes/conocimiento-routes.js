/**
 * conocimiento-routes.js
 *
 * Rutas de la base de conocimiento (Express Router).
 * Prefijo registrado en server.js: /api/conocimiento
 *
 * Solo define rutas, permisos y validación; la lógica vive en
 * controllers/conocimiento-controller.js.
 *
 * GET    /                    - artículos y PDF visibles (?tipo=&categoria=)
 * GET    /buscar              - búsqueda en títulos, etiquetas y contenido (?q=&tipo=&categoria=&limite=)
 * GET    /articulos           - todos los artículos con borradores y votos (solo admin)
 * GET    /articulos/:id       - artículo completo (borradores solo admin)
 * POST   /articulos           - crea un artículo (solo admin)
 * PUT    /articulos/:id       - edita un artículo (solo admin)
 * DELETE /articulos/:id       - elimina un artículo (solo admin)
 * POST   /articulos/:id/voto  - "¿te sirvió?" {util: boolean} (autenticado)
 * POST   /imagenes            - sube una imagen para un artículo (solo admin, campo "imagen")
 *
 * @module server/routes/conocimiento-routes
 * @exports router (default)
 */
import { Router } from "express";
import { requireAuth, requireAdmin } from '../middlewares/auth-middleware.js';
import { csrfProtection } from '../middlewares/security.js';
import {
  validate, validateQuery,
  schemaArticulo, schemaVotoArticulo, schemaBuscarConocimiento,
} from '../middlewares/validate.js';
import { uploadImagenConocimiento } from '../middlewares/upload-conocimiento.js';
import {
  listarConocimiento, buscarConocimiento, listarArticulos, obtenerArticulo,
  crearArticulo, actualizarArticulo, eliminarArticulo, votarArticulo, subirImagen,
} from '../controllers/conocimiento-controller.js';

const router = Router();
router.use(csrfProtection);
router.use(requireAuth);

router.get("/",                    validateQuery(schemaBuscarConocimiento), listarConocimiento);
router.get("/buscar",              validateQuery(schemaBuscarConocimiento), buscarConocimiento);
router.get("/articulos",           requireAdmin, listarArticulos);
router.get("/articulos/:id",       obtenerArticulo);
router.post("/articulos",          requireAdmin, validate(schemaArticulo), crearArticulo);
router.put("/articulos/:id",       requireAdmin, validate(schemaArticulo), actualizarArticulo);
router.delete("/articulos/:id",    requireAdmin, eliminarArticulo);
router.post("/articulos/:id/voto", validate(schemaVotoArticulo), votarArticulo);
router.post("/imagenes",           requireAdmin, ...uploadImagenConocimiento, subirImagen);

export default router;
