import { Router } from "express";
import { getCategorias } from "../Controllers/categoriasController.js";

const router = Router();

router.get("/", getCategorias);

export default router;
