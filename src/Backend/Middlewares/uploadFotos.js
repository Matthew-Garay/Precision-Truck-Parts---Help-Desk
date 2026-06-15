import multer             from "multer";
import path               from "path";
import fs                 from "fs";
import { fileURLToPath }  from "url";
import { fileTypeFromFile } from "file-type";
import { safeResolvePath }  from "./security.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const FOTOS_BASE = path.resolve(__dirname, "../../../storage");
const FOTOS_DIR  = path.resolve(FOTOS_BASE, "Fotos de Perfil");
const FOTOS_REL  = "Fotos de Perfil";

const FOTO_MIMETYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

fs.mkdirSync(FOTOS_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, FOTOS_DIR),
  filename: (req, file, cb) => {
    const idSeguro = parseInt(req.params.id, 10);
    if (isNaN(idSeguro) || idSeguro <= 0) return cb(new Error("ID de empleado invalido"));
    const ext = file.mimetype === "image/png"  ? ".png"
              : file.mimetype === "image/webp" ? ".webp"
              : ".jpg";
    const rand = Math.random().toString(36).replace(/[^a-z0-9]/g, "").slice(0, 6).padStart(6, "0");
    const nombreSeguro = `emp_${idSeguro}_${Date.now()}${rand}${ext}`;
    if (/[^a-zA-Z0-9._-]/.test(nombreSeguro)) return cb(new Error("Nombre de archivo invalido"));
    // Validar que la ruta destino esté dentro de FOTOS_DIR
    try { safeResolvePath(FOTOS_DIR, nombreSeguro); } catch { return cb(new Error("Ruta de archivo no permitida")); }
    cb(null, nombreSeguro);
  },
});

const uploadFotoRaw = multer({
  storage,
  fileFilter: (_req, file, cb) => {
    if (FOTO_MIMETYPES.has(file.mimetype)) cb(null, true);
    else cb(new Error("Solo se permiten imagenes JPEG, PNG o WebP"));
  },
  limits: { fileSize: 5 * 1024 * 1024 },
});

// Segunda barrera: validar magic bytes reales del archivo guardado en disco
async function validarMagicBytesFoto(req, res, next) {
  if (!req.file) return next();
  let tipo;
  try {
    tipo = await fileTypeFromFile(req.file.path);
  } catch {
    await fs.promises.unlink(req.file.path).catch(() => {});
    return res.status(400).json({ error: "No se pudo verificar el tipo de archivo" });
  }
  if (!tipo || !FOTO_MIMETYPES.has(tipo.mime)) {
    await fs.promises.unlink(req.file.path).catch(() => {});
    return res.status(400).json({ error: "Archivo rechazado: el contenido no corresponde a una imagen valida" });
  }
  next();
}

// uploadFoto.single devuelve un array de middlewares [multer, magicBytes]
export const uploadFoto = {
  single: (campo) => [uploadFotoRaw.single(campo), validarMagicBytesFoto],
};

export { FOTOS_DIR, FOTOS_REL };
