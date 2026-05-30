import multer from "multer";
import path   from "path";
import fs     from "fs";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Directorio completamente estatico \u2014 no proviene de input del cliente
const FOTOS_DIR = path.resolve(__dirname, "../../../storage/Fotos de Perfil");
const FOTOS_REL = "Fotos de Perfil";

// Mimetypes permitidos exactos
const FOTO_MIMETYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

// Crear directorio si no existe al arrancar
fs.mkdirSync(FOTOS_DIR, { recursive: true });

const storage = multer.diskStorage({
  // destination es una ruta estatica pre-creada \u2014 no usa input del request
  destination: (_req, _file, cb) => {
    cb(null, FOTOS_DIR);
  },
  filename: (req, _file, cb) => {
    const idSeguro = parseInt(req.params.id, 10);
    if (isNaN(idSeguro) || idSeguro <= 0) return cb(new Error("ID de empleado invalido"));
    // Nombre completamente generado por el servidor — nunca usa input del cliente
    const nombreSeguro = `emp_${idSeguro}_${Date.now()}${Math.random().toString(36).slice(2,6)}.jpg`;
    if (/[^a-zA-Z0-9._-]/.test(nombreSeguro)) return cb(new Error("Nombre de archivo invalido"));
    cb(null, nombreSeguro);
  },
});

export const uploadFoto = multer({
  storage,
  fileFilter: (_req, file, cb) => {
    if (FOTO_MIMETYPES.has(file.mimetype)) cb(null, true);
    else cb(new Error("Solo se permiten imagenes JPEG, PNG o WebP"));
  },
  limits: { fileSize: 5 * 1024 * 1024 },
});

export { FOTOS_DIR, FOTOS_REL };
