/**
 * uploadFotos.js
 *
 * Configura el middleware de subida de fotos de perfil para los empleados.
 * Sigue la misma arquitectura de doble validacion que uploadEvidencias.js
 * pero con reglas especificas para fotos de perfil.
 *
 * Diferencias respecto a uploadEvidencias:
 *   - Los archivos se guardan directamente en storage/Fotos de Perfil/ sin
 *     carpeta temporal intermedia.
 *   - El nombre del archivo se genera de forma determinista y segura con el
 *     patron: emp_{id}_{timestamp}{random}{ext}
 *     Se valida que el id del parametro de ruta sea un entero positivo y que
 *     el nombre resultante solo contenga caracteres alfanumericos, puntos,
 *     guiones y guiones bajos.
 *   - Solo acepta JPEG, PNG y WebP. No acepta GIF.
 *   - El limite de tamano es de 5 MB (la mitad que para evidencias).
 *   - Si la validacion de bytes magicos falla, el archivo guardado en disco
 *     se elimina antes de retornar el error 400.
 *
 * Exportaciones:
 *   uploadFoto  - objeto con metodo single(campo) que retorna un arreglo
 *                 [middlewareMulter, middlewareMagicBytes]
 *   FOTOS_DIR   - ruta absoluta del directorio de fotos de perfil
 *   FOTOS_REL   - nombre relativo de la carpeta (usado para construir la ruta en BD)
 */
import multer             from "multer";
import path               from "path";
import fs                 from "fs";
import crypto             from "crypto";
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
    const rand = crypto.randomBytes(6).toString("hex");
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
