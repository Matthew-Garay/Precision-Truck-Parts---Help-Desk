import multer            from "multer";
import path              from "path";
import fs                from "fs";
import crypto            from "crypto";
import { fileURLToPath } from "url";
import { fileTypeFromFile } from "file-type";
import { safeResolvePath }  from "./security.js";

const __dirname   = path.dirname(fileURLToPath(import.meta.url));
const INSUMOS_DIR = path.resolve(__dirname, "../../../storage/Insumos");

const isImage = (mime) => mime?.startsWith("image/");

fs.mkdirSync(INSUMOS_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, INSUMOS_DIR),
  filename: (req, file, cb) => {
    const idSeguro = parseInt(req.params.id, 10);
    if (isNaN(idSeguro) || idSeguro <= 0) return cb(new Error("ID de insumo inválido"));
    const extMap = { "image/png": ".png", "image/webp": ".webp", "image/gif": ".gif", "image/avif": ".avif", "image/svg+xml": ".svg" };
    const ext  = extMap[file.mimetype] ?? ".jpg";
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
    if (isImage(file.mimetype)) cb(null, true);
    else cb(Object.assign(new Error("Solo se permiten imágenes JPEG, PNG o WebP"), { status: 400 }));
  },
  limits: { fileSize: 5 * 1024 * 1024 },
});

function multerSingle(campo) {
  return (req, res, next) => uploadRaw.single(campo)(req, res, (err) => {
    if (!err) return next();
    if (err.code === "LIMIT_FILE_SIZE") return res.status(400).json({ error: "El archivo supera el límite de 5 MB" });
    return res.status(err.status || 400).json({ error: err.message || "Error al subir archivo" });
  });
}

async function validarMagicBytes(req, res, next) {
  if (!req.file) return next();
  let tipo;
  try { tipo = await fileTypeFromFile(req.file.path); } catch {
    await fs.promises.unlink(req.file.path).catch(() => {});
    return res.status(400).json({ error: "No se pudo verificar el tipo de archivo" });
  }
  if (!tipo || !isImage(tipo.mime)) {
    await fs.promises.unlink(req.file.path).catch(() => {});
    return res.status(400).json({ error: "Archivo rechazado: contenido no válido" });
  }
  next();
}

export const uploadInsumo = {
  single: (campo) => [multerSingle(campo), validarMagicBytes],
};

export { INSUMOS_DIR };
