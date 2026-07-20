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
import { requireAuth, requireAdmin } from "../Middlewares/authMiddleware.js";
import { csrfProtection, safeResolvePath } from "../Middlewares/security.js";
import { uploadManual, MANUALES_DIR, nombreManual } from "../Middlewares/uploadManuales.js";
import Manual from "../Models/Manual.js";

const router = Router();
router.use(csrfProtection);
router.use(requireAuth);

// GET — lista todos
router.get("/", async (_req, res) => {
  try {
    const rows = await Manual.getAll();
    const result = await Promise.all(rows.map(async m => {
      let tamaño = null;
      try {
        const absPath = path.join(MANUALES_DIR, path.basename(m.ruta_pdf));
        const stat = await fs.promises.stat(absPath);
        const kb = stat.size / 1024;
        tamaño = kb >= 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${Math.round(kb)} KB`;
      } catch { /* archivo no encontrado */ }
      return { ...m, url: `/storage/Manuales/${encodeURIComponent(path.basename(m.ruta_pdf))}`, tamaño };
    }));
    res.json(result);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Helper: guarda un archivo temporal con nombre definitivo y crea registro BD
async function procesarArchivo(file, nombre, descripcion, idCat) {
  const nombreFinal = nombreManual(nombre.trim());
  const base = nombreFinal.replace(/\.pdf$/i, "");
  let rutaFinal = path.join(MANUALES_DIR, nombreFinal);
  let n = 1;
  while (true) {
    try { await fs.promises.access(rutaFinal); rutaFinal = path.join(MANUALES_DIR, `${base}_${n++}.pdf`); }
    catch { break; }
  }
  await fs.promises.rename(file.path, rutaFinal);
  const rutaRelativa = `/storage/Manuales/${path.basename(rutaFinal)}`;
  const id = await Manual.crear({ nombre: nombre.trim().slice(0, 150), descripcion: descripcion?.trim() || null, ruta_pdf: rutaRelativa, id_categoria: idCat });
  return { id, rutaFinal };
}

// POST — subir PDF + metadatos (solo admin)
router.post("/", requireAdmin, (req, res) => {
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
      const { rutaFinal, id } = await procesarArchivo(req.file, nombre, descripcion, idCat);
      const rows = await Manual.getAll();
      const manual = rows.find(m => m.id_manual === id);
      res.status(201).json({ ok: true, manual: { ...manual, url: `/storage/Manuales/${encodeURIComponent(path.basename(rutaFinal))}` } });
    } catch (e) {
      await fs.promises.unlink(req.file.path).catch(() => {});
      res.status(500).json({ error: e.message });
    }
  });
});

// POST /batch — subir múltiples PDFs con categoría compartida (solo admin)
router.post("/batch", requireAdmin, (req, res) => {
  uploadManual.array("archivos", 20)(req, res, async (err) => {
    if (err) return res.status(400).json({ error: err.message || "Error al subir archivos" });
    if (!req.files?.length) return res.status(400).json({ error: "No se recibieron archivos" });

    const idCat = parseInt(req.body.id_categoria, 10);
    if (isNaN(idCat) || idCat < 1) {
      await Promise.all(req.files.map(f => fs.promises.unlink(f.path).catch(() => {})));
      return res.status(400).json({ error: "La categoría es obligatoria" });
    }
    const descripcion = req.body.descripcion || null;
    // nombres puede ser JSON array o string único
    let nombres;
    try { nombres = JSON.parse(req.body.nombres); } catch { nombres = req.files.map(f => f.originalname.replace(/\.pdf$/i, "")); }

    const resultados = [];
    for (let i = 0; i < req.files.length; i++) {
      const file   = req.files[i];
      const nombre = (nombres[i] || file.originalname.replace(/\.pdf$/i, "")).trim();
      try {
        const { id, rutaFinal } = await procesarArchivo(file, nombre, descripcion, idCat);
        resultados.push({ ok: true, nombre, id, url: `/storage/Manuales/${encodeURIComponent(path.basename(rutaFinal))}` });
      } catch (e) {
        await fs.promises.unlink(file.path).catch(() => {});
        resultados.push({ ok: false, nombre, error: e.message });
      }
    }
    res.status(207).json({ resultados });
  });
});

// PUT — editar metadatos (solo admin)
router.put("/:id", requireAdmin, async (req, res) => {
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

// POST /:id/reemplazar — reemplaza solo el archivo PDF (solo admin)
router.post("/:id/reemplazar", requireAdmin, (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json({ error: "ID inválido" });
  uploadManual.single("archivo")(req, res, async (err) => {
    if (err) return res.status(400).json({ error: err.message || "Error al subir archivo" });
    if (!req.file) return res.status(400).json({ error: "No se recibió ningún archivo" });
    try {
      const rutaAnterior = await Manual.getRuta(id);
      if (!rutaAnterior) {
        await fs.promises.unlink(req.file.path).catch(() => {});
        return res.status(404).json({ error: "Manual no encontrado" });
      }
      // Renombrar al mismo nombre que tenía para mantener la URL
      const nombreBase = path.basename(rutaAnterior);
      const rutaFinal  = safeResolvePath(MANUALES_DIR, nombreBase);
      // Eliminar el anterior y mover el nuevo
      await fs.promises.unlink(safeResolvePath(MANUALES_DIR, nombreBase)).catch(() => {});
      await fs.promises.rename(req.file.path, rutaFinal);
      // Actualizar fecha_cambio usando actualizar con los mismos metadatos
      await Manual.actualizarFechaCambio(id);
      res.json({ ok: true, url: `/storage/Manuales/${encodeURIComponent(nombreBase)}` });
    } catch (e) {
      await fs.promises.unlink(req.file.path).catch(() => {});
      res.status(500).json({ error: e.message });
    }
  });
});

// DELETE — eliminar PDF + registro BD (solo admin)
router.delete("/:id", requireAdmin, async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json({ error: "ID inválido" });
  try {
    const ruta = await Manual.getRuta(id);
    if (!ruta) return res.status(404).json({ error: "Manual no encontrado" });
    const ok = await Manual.eliminar(id);
    if (!ok) return res.status(404).json({ error: "Manual no encontrado" });
    try { await fs.promises.unlink(safeResolvePath(MANUALES_DIR, path.basename(ruta))); } catch { /* ya no existe o ya era relativa */ }
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

export default router;
