import multer from "multer";
import path   from "path";
import fs     from "fs";
import { safeResolvePath } from "./security.js";

// Directorio base completamente estatico \u2014 no proviene de input del cliente
const EVIDENCIAS_BASE = path.resolve("storage", "Evidencias_Tickets");
const EVIDENCIAS_TMP  = path.resolve("storage", "Evidencias_Tickets", "_tmp_upload");

// Mimetypes permitidos exactos
const EVIDENCIA_MIMETYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

// Crear directorio tmp si no existe al arrancar
fs.mkdirSync(EVIDENCIAS_TMP, { recursive: true });

const storage = multer.diskStorage({
  // destination es una ruta estatica pre-creada \u2014 no usa input del request
  destination: (_req, _file, cb) => {
    cb(null, EVIDENCIAS_TMP);
  },
  filename: (_req, file, cb) => {
    // Nombre completamente generado por el servidor — nunca usa originalname del cliente
    const ext = file.mimetype === "image/png"  ? ".png"
              : file.mimetype === "image/webp" ? ".webp"
              : file.mimetype === "image/gif"  ? ".gif"
              : ".jpg";
    const nombreSeguro = `ev_${Date.now()}_${Math.random().toString(36).slice(2, 8)}${ext}`;
    cb(null, nombreSeguro);
  },
});

export const uploadEvidencias = multer({
  storage,
  fileFilter: (_req, file, cb) => {
    if (EVIDENCIA_MIMETYPES.has(file.mimetype)) cb(null, true);
    else cb(new Error("Solo se permiten imagenes JPEG, PNG, WebP o GIF"));
  },
  limits: { fileSize: 10 * 1024 * 1024 },
});

export { EVIDENCIAS_BASE, safeResolvePath };
