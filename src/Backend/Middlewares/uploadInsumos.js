import multer            from "multer";
import path              from "path";
import fs                from "fs";
import crypto            from "crypto";
import { fileURLToPath } from "url";
import { fileTypeFromFile } from "file-type";
import { safeResolvePath }  from "./security.js";

const __dirname   = path.dirname(fileURLToPath(import.meta.url));
const INSUMOS_DIR = path.resolve(__dirname, "../../../storage/Insumos");

const MIMETYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

fs.mkdirSync(INSUMOS_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, INSUMOS_DIR),
  filename: (req, file, cb) => {
    const idSeguro = parseInt(req.params.id, 10);
    if (isNaN(idSeguro) || idSeguro <= 0) return cb(new Error("ID de insumo inválido"));
    const ext  = file.mimetype === "image/png" ? ".png" : file.mimetype === "image/webp" ? ".webp" : ".jpg";
    const rand = crypto.randomBytes(6).toString("hex");
    const nombre = `insumo_${idSeguro}_${Date.now()}${rand}${ext}`;
    if (/[^a-zA-Z0-9._-]/.test(nombre)) return cb(new Error("Nombre de archivo inválido"));
    try { safeResolvePath(INSUMOS_DIR, nombre); } catch { return cb(new Error("Ruta no permitida")); }
    cb(null, nombre);
  },
});

const uploadRaw = multer({
  storage,
  fileFilter: (_req, file, cb) => {
    if (MIMETYPES.has(file.mimetype)) cb(null, true);
    else cb(new Error("Solo se permiten imágenes JPEG, PNG o WebP"));
  },
  limits: { fileSize: 5 * 1024 * 1024 },
});

async function validarMagicBytes(req, res, next) {
  if (!req.file) return next();
  let tipo;
  try { tipo = await fileTypeFromFile(req.file.path); } catch {
    await fs.promises.unlink(req.file.path).catch(() => {});
    return res.status(400).json({ error: "No se pudo verificar el tipo de archivo" });
  }
  if (!tipo || !MIMETYPES.has(tipo.mime)) {
    await fs.promises.unlink(req.file.path).catch(() => {});
    return res.status(400).json({ error: "Archivo rechazado: contenido no válido" });
  }
  next();
}

export const uploadInsumo = {
  single: (campo) => [uploadRaw.single(campo), validarMagicBytes],
};

export { INSUMOS_DIR };
