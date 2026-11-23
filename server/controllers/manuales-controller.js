/**
 * manuales-controller.js
 *
 * Controlador del módulo de manuales técnicos en PDF. Orquesta la subida de
 * archivos (multer, vía middlewares/upload-manuales.js), su ubicación final
 * en storage/Manuales y el registro en la tabla `manual` (services/manual.js).
 * Antes esta lógica vivía dentro de routes/manuales-routes.js.
 *
 * Exporta:
 *   listarManuales      GET    /api/manuales               (autenticado)
 *   subirManual         POST   /api/manuales               (admin, campo "archivo")
 *   subirManualesLote   POST   /api/manuales/batch         (admin, campo "archivos", máx. 20)
 *   actualizarManual    PUT    /api/manuales/:id           (admin, solo metadatos)
 *   reemplazarArchivo   POST   /api/manuales/:id/reemplazar (admin, solo el PDF)
 *   eliminarManual      DELETE /api/manuales/:id           (admin, PDF + registro)
 *
 * Los nombres de archivo se resuelven siempre con safeResolvePath para evitar
 * path traversal, y cualquier archivo temporal se borra si la operación falla.
 *
 * @module server/controllers/manuales-controller
 * @requires path
 * @requires fs
 * @requires ../middlewares/security.js
 * @requires ../middlewares/upload-manuales.js
 * @requires ../services/manual.js
 * @requires ../services/conocimiento.js
 * @requires ../utils/helpers.js
 * @exports listarManuales
 * @exports subirManual
 * @exports subirManualesLote
 * @exports actualizarManual
 * @exports reemplazarArchivo
 * @exports eliminarManual
 */
import path from "path";
import fs   from "fs";
import { safeResolvePath } from '../middlewares/security.js';
import { uploadManual, MANUALES_DIR, nombreManual } from '../middlewares/upload-manuales.js';
import Manual from '../services/manual.js';
import Conocimiento from '../services/conocimiento.js';
import { isProd } from '../utils/helpers.js';

const urlPublica = (archivo) => `/storage/Manuales/${encodeURIComponent(path.basename(archivo))}`;
const borrarTemporal = (p) => fs.promises.unlink(p).catch(() => {});

/**
 * Base de conocimiento: extrae en segundo plano el texto de los PDF nuevos o
 * reemplazados para que el buscador encuentre lo que dicen por dentro. No se
 * espera: la respuesta al administrador sale de inmediato.
 */
function indexarEnSegundoPlano() {
  Conocimiento.indexarPendientes(MANUALES_DIR)
    .catch(e => console.warn("[conocimiento] No se pudo extraer el texto del PDF:", e.message));
}

/** Tamaño legible del PDF en disco (null si el archivo no existe). */
async function tamanoArchivo(rutaPdf) {
  try {
    const stat = await fs.promises.stat(path.join(MANUALES_DIR, path.basename(rutaPdf)));
    const kb = stat.size / 1024;
    return kb >= 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${Math.round(kb)} KB`;
  } catch {
    return null;
  }
}

/**
 * Mueve el archivo temporal a su nombre definitivo (agregando _1, _2… si ya
 * existe) y crea el registro en BD. Devuelve { id, rutaFinal }.
 */
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
  const id = await Manual.crear({
    nombre:       nombre.trim().slice(0, 150),
    descripcion:  descripcion?.trim() || null,
    ruta_pdf:     `/storage/Manuales/${path.basename(rutaFinal)}`,
    id_categoria: idCat,
  });
  return { id, rutaFinal };
}

export const listarManuales = async (_req, res) => {
  try {
    const rows = await Manual.getAll();
    const result = await Promise.all(rows.map(async m => ({
      ...m,
      url:    `/storage/Manuales/${path.basename(m.ruta_pdf)}`,
      tamaño: await tamanoArchivo(m.ruta_pdf),
    })));
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: isProd() ? "Error al obtener los manuales" : err.message });
  }
};

export const subirManual = (req, res) => {
  uploadManual.single("archivo")(req, res, async (err) => {
    if (err) return res.status(err.status || 400).json({ error: err.message || "Error al subir archivo" });
    if (!req.file) return res.status(400).json({ error: "No se recibió ningún archivo" });

    const { nombre, descripcion, id_categoria } = req.body;
    if (!nombre?.trim()) {
      await borrarTemporal(req.file.path);
      return res.status(400).json({ error: "El nombre es obligatorio" });
    }
    const idCat = parseInt(id_categoria, 10);
    if (isNaN(idCat) || idCat < 1) {
      await borrarTemporal(req.file.path);
      return res.status(400).json({ error: "La categoría es obligatoria" });
    }

    try {
      const { rutaFinal, id } = await procesarArchivo(req.file, nombre, descripcion, idCat);
      const manual = (await Manual.getAll()).find(m => m.id_manual === id);
      indexarEnSegundoPlano();
      res.status(201).json({ ok: true, manual: { ...manual, url: urlPublica(rutaFinal) } });
    } catch (e) {
      await borrarTemporal(req.file.path);
      res.status(500).json({ error: isProd() ? "Error al procesar el archivo" : e.message });
    }
  });
};

export const subirManualesLote = (req, res) => {
  uploadManual.array("archivos", 20)(req, res, async (err) => {
    if (err) return res.status(err.status || 400).json({ error: err.message || "Error al subir archivos" });
    if (!req.files?.length) return res.status(400).json({ error: "No se recibieron archivos" });

    const idCat = parseInt(req.body.id_categoria, 10);
    if (isNaN(idCat) || idCat < 1) {
      await Promise.all(req.files.map(f => borrarTemporal(f.path)));
      return res.status(400).json({ error: "La categoría es obligatoria" });
    }
    const descripcion = req.body.descripcion || null;
    let nombres;
    try { nombres = JSON.parse(req.body.nombres); }
    catch { nombres = req.files.map(f => f.originalname.replace(/\.pdf$/i, "")); }

    const resultados = [];
    for (let i = 0; i < req.files.length; i++) {
      const file   = req.files[i];
      const nombre = (nombres[i] || file.originalname.replace(/\.pdf$/i, "")).trim();
      try {
        const { id, rutaFinal } = await procesarArchivo(file, nombre, descripcion, idCat);
        resultados.push({ ok: true, nombre, id, url: urlPublica(rutaFinal) });
      } catch (e) {
        await borrarTemporal(file.path);
        resultados.push({ ok: false, nombre, error: isProd() ? "Error al procesar" : e.message });
      }
    }
    if (resultados.some(r => r.ok)) indexarEnSegundoPlano();
    res.status(207).json({ resultados });
  });
};

export const actualizarManual = async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json({ error: "ID inválido" });
  const { nombre, descripcion, id_categoria } = req.body;
  if (!nombre?.trim()) return res.status(400).json({ error: "El nombre es obligatorio" });
  const idCat = parseInt(id_categoria, 10);
  if (isNaN(idCat) || idCat < 1) return res.status(400).json({ error: "La categoría es obligatoria" });
  try {
    const ok = await Manual.actualizar(id, {
      nombre: nombre.trim().slice(0, 150), descripcion: descripcion?.trim() || null, id_categoria: idCat,
    });
    if (!ok) return res.status(404).json({ error: "Manual no encontrado" });
    Conocimiento.invalidarIndice();
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: isProd() ? "Error interno" : e.message });
  }
};

export const reemplazarArchivo = (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json({ error: "ID inválido" });
  uploadManual.single("archivo")(req, res, async (err) => {
    if (err) return res.status(err.status || 400).json({ error: err.message || "Error al subir archivo" });
    if (!req.file) return res.status(400).json({ error: "No se recibió ningún archivo" });
    try {
      const rutaAnterior = await Manual.getRuta(id);
      if (!rutaAnterior) {
        await borrarTemporal(req.file.path);
        return res.status(404).json({ error: "Manual no encontrado" });
      }
      const nombreBase = path.basename(rutaAnterior);
      const rutaFinal  = safeResolvePath(MANUALES_DIR, nombreBase);
      await fs.promises.unlink(rutaFinal).catch(() => {});
      await fs.promises.rename(req.file.path, rutaFinal);
      await Manual.actualizarFechaCambio(id);
      await Conocimiento.marcarManualPendiente(id);
      indexarEnSegundoPlano();
      res.json({ ok: true, url: urlPublica(nombreBase) });
    } catch (e) {
      await borrarTemporal(req.file.path);
      res.status(500).json({ error: isProd() ? "Error interno" : e.message });
    }
  });
};

export const eliminarManual = async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json({ error: "ID inválido" });
  try {
    const ruta = await Manual.getRuta(id);
    if (!ruta) return res.status(404).json({ error: "Manual no encontrado" });
    const ok = await Manual.eliminar(id);
    if (!ok) return res.status(404).json({ error: "Manual no encontrado" });
    Conocimiento.invalidarIndice();
    try { await fs.promises.unlink(safeResolvePath(MANUALES_DIR, path.basename(ruta))); } catch { /* ya no existe */ }
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: isProd() ? "Error interno" : e.message });
  }
};
