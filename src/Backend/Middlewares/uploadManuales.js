import multer            from "multer";
import path              from "path";
import fs                from "fs";
import { fileURLToPath } from "url";
import { safeResolvePath } from "./security.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const MANUALES_DIR = path.resolve(__dirname, "../../../storage/Manuales");

fs.mkdirSync(MANUALES_DIR, { recursive: true });

function nombreManual(nombreOriginal) {
  const año   = new Date().getFullYear();
  const breve = (nombreOriginal || "manual")
    .trim()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9 _-]/g, "")
    .replace(/\s+/g, "_")
    .slice(0, 60);
  return `Manual_${año}_${breve}.pdf`;
}

export { nombreManual };

// Multer guarda con nombre temporal (timestamp); el servidor lo renombra
// tras leer req.body.nombre que llega en los campos de texto del multipart
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, MANUALES_DIR),
  filename: (_req, _file, cb) => {
    const nombre = `manual_tmp_${Date.now()}.pdf`;
    try { safeResolvePath(MANUALES_DIR, nombre); } catch { return cb(new Error("Ruta no permitida")); }
    cb(null, nombre);
  },
});

export const uploadManual = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 },
});
