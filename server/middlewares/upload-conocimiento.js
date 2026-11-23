/**
 * upload-conocimiento.js
 *
 * Subida de imágenes para los artículos de la base de conocimiento (capturas
 * de pantalla, fotos de equipos). Misma doble validación que upload-insumos.js:
 *   1. multer acepta solo mimetypes de imagen y máximo 5 MB;
 *   2. se revisan los bytes reales del archivo (file-type) y se borra si no es imagen;
 *   3. se comprime (≤ 1600 px) con utils/imagenes.js.
 *
 * Los archivos quedan en storage/Conocimiento con nombre aleatorio y se sirven
 * en /storage/Conocimiento/<archivo>.
 *
 * @module server/middlewares/upload-conocimiento
 * @requires multer
 * @requires file-type
 * @exports CONOCIMIENTO_DIR
 * @exports uploadImagenConocimiento
 */
import multer            from "multer";
import path              from "path";
import fs                from "fs";
import crypto            from "crypto";
import { fileURLToPath } from "url";
import { fileTypeFromFile } from "file-type";
import { safeResolvePath }  from './security.js';
import { optimizar } from "../utils/imagenes.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const CONOCIMIENTO_DIR = path.resolve(__dirname, "../../storage/Conocimiento");
fs.mkdirSync(CONOCIMIENTO_DIR, { recursive: true });

const TIPOS = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const EXT = { "image/png": ".png", "image/webp": ".webp", "image/gif": ".gif", "image/jpeg": ".jpg" };

const uploadRaw = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, CONOCIMIENTO_DIR),
    filename: (_req, file, cb) => {
      const nombre = `kb_${Date.now()}${crypto.randomBytes(6).toString("hex")}${EXT[file.mimetype] ?? ".jpg"}`;
      try { safeResolvePath(CONOCIMIENTO_DIR, nombre); } catch { return cb(new Error("Ruta no permitida")); }
      cb(null, nombre);
    },
  }),
  fileFilter: (_req, file, cb) => {
    if (TIPOS.has(file.mimetype)) cb(null, true);
    else cb(Object.assign(new Error("Solo se permiten imágenes JPG, PNG, WebP o GIF"), { status: 400 }));
  },
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
});

function recibir(campo) {
  return (req, res, next) => uploadRaw.single(campo)(req, res, (err) => {
    if (!err) return next();
    if (err.code === "LIMIT_FILE_SIZE") return res.status(400).json({ error: "La imagen supera el límite de 5 MB" });
    return res.status(err.status || 400).json({ error: err.message || "Error al subir la imagen" });
  });
}

async function validarContenido(req, res, next) {
  if (!req.file) return res.status(400).json({ error: "No se recibió ninguna imagen" });
  let tipo = null;
  try { tipo = await fileTypeFromFile(req.file.path); } catch { /* se trata como inválido */ }
  if (!tipo || !TIPOS.has(tipo.mime)) {
    await fs.promises.unlink(req.file.path).catch(() => {});
    return res.status(400).json({ error: "Archivo rechazado: no es una imagen válida" });
  }
  // GIF se deja tal cual para no perder la animación.
  // 1600 px y no 1200: son capturas de pantalla y el texto debe seguir legible.
  if (tipo.mime !== "image/gif") { try { await optimizar(req.file.path, { ladoMax: 1600 }); } catch { /* queda la original */ } }
  next();
}

/** Uso: router.post("/imagenes", requireAdmin, ...uploadImagenConocimiento, handler) */
export const uploadImagenConocimiento = [recibir("imagen"), validarContenido];
