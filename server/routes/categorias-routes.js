/**
 * categoriasRoutes.js
 *
 * Define las rutas del prefijo /api/categorias.
 * Todas las rutas requieren autenticacion JWT (requireAuth).
 *
 * Rutas:
 *
 *   GET /
 *     Retorna el catalogo completo de categorias del sistema.
 *     Las categorias son compartidas por tickets, manuales e insumos.
 */
import { Router } from "express";
import { requireAuth, requireAdmin } from '../middlewares/auth-middleware.js';
import { csrfProtection } from '../middlewares/security.js';
import { getCategorias } from '../controllers/categorias-controller.js';

const router = Router();

router.use(csrfProtection);
router.use(requireAuth);
router.get("/", getCategorias);

export default router;
