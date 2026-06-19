/**
 * categoriasRoutes.js
 *
 * Define las rutas del prefijo /api/categorias.
 *
 * Todas las rutas requieren autenticacion JWT (requireAuth).
 *
 * Rutas:
 *
 *   GET /
 *     Retorna el catalogo completo de categorias del sistema.
 *     Las categorias son compartidas por tickets, manuales e insumos.
 */
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
import { requireAuth } from "../Middlewares/authMiddleware.js";
import { getCategorias } from "../Controllers/categoriasController.js";

const router = Router();

router.use(requireAuth);
router.get("/", getCategorias);

export default router;
