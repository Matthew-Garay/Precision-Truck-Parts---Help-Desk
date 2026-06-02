import { Router } from "express";
import { requireAuth } from "../Middlewares/authMiddleware.js";
import { getCategorias } from "../Controllers/categoriasController.js";

const router = Router();

router.use(requireAuth);
router.get("/", getCategorias);

export default router;
