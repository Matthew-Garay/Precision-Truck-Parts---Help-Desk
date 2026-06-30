/**
 * manualesRoutes.js
 *
 * Rutas del módulo de manuales técnicos PDF.
 * Prefijo registrado en server.js: /api/manuales
 *
 * GET    /           - lista todos los manuales (autenticado)
 * POST   /           - sube PDF + metadatos (solo admin)
 * PUT    /:id        - edita metadatos del manual (solo admin)
 * DELETE /:id        - elimina PDF del disco + registro BD (solo admin)
 */
import { Router } from "express";
import path       from "path";
import fs         from "fs";
import { requireAuth } from "../Middlewares/authMiddleware.js";
import { csrfProtection } from "../Middlewares/security.js";
import { uploadManual, MANUALES_DIR, nombreManual } from "../Middlewares/uploadManuales.js";
import { safeResolvePath } from "../Middlewares/security.js";
import Manual from "../Models/Manual.js";

const router = Router();
router.use(csrfProtection);
router.use(requireAuth);

// GET — lista todos
router.get("/", async (_req, res) => {
  try {
    const rows = await Manual.getAll();
    res.json(rows.map(m => ({
      ...m,
      url: `/storage/Manuales/${encodeURIComponent(path.basename(m.ruta_pdf))}`,
    })));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST — subir PDF + metadatos (solo admin)
router.post("/", (req, res) => {
  if (req.usuario?.id_rol !== 1) return res.status(403).json({ error: "Solo administradores" });
  uploadManual.single("archivo")(req, res, async (err) => {
    if (err) return res.status(400).json({ error: err.message || "Error al subir archivo" });
    if (!req.file) return res.status(400).json({ error: "No se recibió ningún archivo" });

    const { nombre, descripcion, id_categoria } = req.body;
    if (!nombre?.trim()) {
      await fs.promises.unlink(req.file.path).catch(() => {});
      return res.status(400).json({ error: "El nombre es obligatorio" });
    }
    const idCat = parseInt(id_categoria, 10);
    if (isNaN(idCat) || idCat < 1) {
      await fs.promises.unlink(req.file.path).catch(() => {});
      return res.status(400).json({ error: "La categoría es obligatoria" });
    }

    try {
      const nombreFinal = nombreManual(nombre.trim());
      const base = nombreFinal.replace(/\.pdf$/i, "");
      let rutaFinal = path.join(MANUALES_DIR, nombreFinal);
      let n = 1;
      while (true) {
        try { await fs.promises.access(rutaFinal); rutaFinal = path.join(MANUALES_DIR, `${base}_${n++}.pdf`); }
        catch { break; }
      }
      await fs.promises.rename(req.file.path, rutaFinal);

      const id   = await Manual.crear({ nombre: nombre.trim().slice(0, 150), descripcion: descripcion?.trim() || null, ruta_pdf: rutaFinal, id_categoria: idCat });
      const rows = await Manual.getAll();
      const manual = rows.find(m => m.id_manual === id);
      res.status(201).json({ ok: true, manual: { ...manual, url: `/storage/Manuales/${encodeURIComponent(path.basename(rutaFinal))}` } });
    } catch (e) {
      await fs.promises.unlink(req.file.path).catch(() => {});
      res.status(500).json({ error: e.message });
    }
  });
});

// PUT — editar metadatos (solo admin)
router.put("/:id", async (req, res) => {
  if (req.usuario?.id_rol !== 1) return res.status(403).json({ error: "Solo administradores" });
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json({ error: "ID inválido" });
  const { nombre, descripcion, id_categoria } = req.body;
  if (!nombre?.trim()) return res.status(400).json({ error: "El nombre es obligatorio" });
  const idCat = parseInt(id_categoria, 10);
  if (isNaN(idCat) || idCat < 1) return res.status(400).json({ error: "La categoría es obligatoria" });
  try {
    const ok = await Manual.actualizar(id, { nombre: nombre.trim().slice(0, 150), descripcion: descripcion?.trim() || null, id_categoria: idCat });
    if (!ok) return res.status(404).json({ error: "Manual no encontrado" });
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// DELETE — eliminar PDF + registro BD (solo admin)
router.delete("/:id", async (req, res) => {
  if (req.usuario?.id_rol !== 1) return res.status(403).json({ error: "Solo administradores" });
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json({ error: "ID inválido" });
  try {
    const ruta = await Manual.getRuta(id);
    if (!ruta) return res.status(404).json({ error: "Manual no encontrado" });
    const ok = await Manual.eliminar(id);
    if (!ok) return res.status(404).json({ error: "Manual no encontrado" });
    try { await fs.promises.unlink(safeResolvePath(MANUALES_DIR, path.basename(ruta))); } catch { /* ya no existe */ }
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

export default router;
