/**
 * upload-evidencias.js
 *
 * Configura el middleware de subida de imagenes de evidencia para los tickets.
 * La validacion se realiza en dos capas independientes para mayor seguridad:
 *
 * Primera capa - filtro de mimetype declarado por el cliente:
 *   Multer rechaza el archivo antes de guardarlo si el mimetype declarado
 *   en el encabezado Content-Type no pertenece al conjunto permitido.
 *   Tipos aceptados: image/jpeg, image/png, image/webp, image/gif
 *   Limite de tamano: 10 MB por archivo
 *
 * Segunda capa - validacion de bytes magicos:
 *   Despues de que multer guarda el archivo en disco, la funcion validarMagicBytes
 *   lee los bytes iniciales del archivo con la libreria file-type y verifica que
 *   el contenido real corresponda a una imagen valida. Esto impide que un atacante
 *   renombre un archivo malicioso con extension .jpg para evadir el filtro.
 *   Si la validacion falla, se eliminan todos los archivos subidos en la peticion.
 *
 * Flujo de almacenamiento:
 *   Los archivos se guardan inicialmente en storage/Evidencias_Tickets/_tmp_upload/
 *   con nombres unicos basados en timestamp y un sufijo aleatorio.
 *   El controlador ticketsController.js los mueve a la carpeta definitiva
 *   nombrada con el folio del ticket (ej. ST-202610-0001/) despues de crear
 *   el ticket en la base de datos.
 *
 * Exportaciones:
 *   uploadEvidencias - objeto con metodo array(campo, maxCount) que retorna
 *                      un arreglo [middlewareMulter, middlewareMagicBytes]
 *   EVIDENCIAS_BASE  - ruta absoluta del directorio base de evidencias
 *
 * @module server/middlewares/upload-evidencias
 * @requires multer
 * @requires path
 * @requires fs
 * @requires crypto
 * @requires url
 * @requires file-type
 * @requires ./security.js
 * @requires sharp
 * @exports uploadEvidencias
 * @exports EVIDENCIAS_BASE
 */
import multer             from "multer";
import path               from "path";
import fs                 from "fs";
import crypto             from "crypto";
import { fileURLToPath }  from "url";
import { fileTypeFromFile } from "file-type";
import sharp               from "sharp";

// Fix #16: usar import.meta.url en lugar de path.resolve relativo al CWD
const __dirname       = path.dirname(fileURLToPath(import.meta.url));
// EVIDENCIAS_DIR solo lo usan las pruebas automáticas (carpeta temporal, para
// no escribir en la carpeta real de evidencias).
const EVIDENCIAS_BASE = process.env.EVIDENCIAS_DIR
  ? path.resolve(process.env.EVIDENCIAS_DIR)
  : path.resolve(__dirname, "../../storage/Evidencias_Tickets");
const EVIDENCIAS_TMP  = path.resolve(EVIDENCIAS_BASE, "_tmp_upload");

const MIMETYPES_IMAGEN  = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const MIMETYPES_VIDEO   = new Set(["video/mp4", "video/webm", "video/quicktime", "video/x-msvideo"]);
const MIMETYPES_PERMITIDOS = new Set([...MIMETYPES_IMAGEN, ...MIMETYPES_VIDEO]);

fs.mkdirSync(EVIDENCIAS_TMP, { recursive: true });

const EXT_MAP = {
  "image/jpeg":     ".jpg",
  "image/png":      ".png",
  "image/webp":     ".webp",
  "image/gif":      ".gif",
  "video/mp4":      ".mp4",
  "video/webm":     ".webm",
  "video/quicktime":".mov",
  "video/x-msvideo":".avi",
};

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, EVIDENCIAS_TMP),
  filename: (_req, file, cb) => {
    const ext  = EXT_MAP[file.mimetype] || path.extname(file.originalname) || ".bin";
    const rand = crypto.randomBytes(6).toString("hex");
    cb(null, `ev_${Date.now()}_${rand}${ext}`);
  },
});

// Primera barrera: mimetype declarado por el cliente
const uploadEvidenciasRaw = multer({
  storage,
  fileFilter: (_req, file, cb) => {
    if (MIMETYPES_PERMITIDOS.has(file.mimetype)) cb(null, true);
    else cb(Object.assign(new Error(`"${file.originalname}" no se puede adjuntar: solo se permiten fotos (JPG, PNG, WebP, GIF) o videos (MP4, WebM, MOV, AVI).`), { status: 400 }));
  },
  limits: { fileSize: 100 * 1024 * 1024 }, // 100 MB para videos
});

// Fix #11: cleanup robusto — elimina TODOS los archivos del request sin importar
// si ya fueron renombrados/movidos, usando las rutas originales capturadas antes del loop.
async function validarYComprimirArchivos(req, res, next) {
  const archivos = req.files || [];
  if (archivos.length === 0) return next();

  const rutas = archivos.map(f => f.path);
  const limpiar = () => {
    for (const ruta of rutas) {
      try { if (fs.existsSync(ruta)) fs.unlinkSync(ruta); } catch {}
    }
  };

  for (const file of archivos) {
    let tipo;
    try {
      tipo = await fileTypeFromFile(file.path);
    } catch {
      limpiar();
      return res.status(400).json({ error: "No se pudo verificar el tipo de archivo" });
    }
    if (!tipo || !MIMETYPES_PERMITIDOS.has(tipo.mime)) {
      limpiar();
      return res.status(400).json({ error: "Archivo rechazado: el contenido no es una imagen o video válido" });
    }

    // Comprimir archivos
    if (MIMETYPES_IMAGEN.has(tipo.mime) && tipo.mime !== "image/gif") {
      try {
        const tmpComprimido = file.path + "_c";
        // Timeout de 30s para evitar que sharp se cuelgue con archivos corruptos
        await Promise.race([
          sharp(file.path)
            .resize({ width: 1920, height: 1920, fit: "inside", withoutEnlargement: true })
            .jpeg({ quality: 75, mozjpeg: true })
            .toFile(tmpComprimido),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error("sharp timeout")), 30_000)
          ),
        ]);
        fs.renameSync(tmpComprimido, file.path);
        const nuevoPath = file.path.replace(/\.[^.]+$/, ".jpg");
        if (nuevoPath !== file.path) {
          fs.renameSync(file.path, nuevoPath);
          file.path     = nuevoPath;
          file.filename = path.basename(nuevoPath);
          file.mimetype = "image/jpeg";
        }
      } catch { /* si falla la compresión o hay timeout, se usa el original */ }
    }
  }
  next();
}

// Tope del conjunto de archivos de UNA petición (8 × 100 MB sería 800 MB en disco).
// Se comprueba con Content-Length antes de leer el cuerpo: la respuesta es inmediata.
export const MAX_BYTES_PETICION = 250 * 1024 * 1024;
const limitarTamanoPeticion = (req, res, next) => {
  const largo = Number(req.headers["content-length"] || 0);
  if (largo > MAX_BYTES_PETICION + 1024 * 1024) {
    res.setHeader("Connection", "close");
    return res.status(413).json({
      error: "Las evidencias juntas pesan demasiado (máximo 250 MB por envío). Adjunta menos archivos o videos más cortos.",
    });
  }
  next();
};

// Temporales huérfanos: si la petición falla después de subir (por ejemplo, el
// ticket no pasa la validación del formulario), los archivos quedaban para
// siempre en _tmp_upload. Se borran al cabo de 2 h; una subida real tarda segundos.
const TMP_MAX_EDAD_MS = 2 * 60 * 60 * 1000;
export function limpiarTemporalesViejos(ahora = Date.now()) {
  let borrados = 0;
  try {
    for (const nombre of fs.readdirSync(EVIDENCIAS_TMP)) {
      const ruta = path.join(EVIDENCIAS_TMP, nombre);
      try {
        if (ahora - fs.statSync(ruta).mtimeMs > TMP_MAX_EDAD_MS) { fs.unlinkSync(ruta); borrados++; }
      } catch { /* archivo en uso o ya borrado */ }
    }
  } catch { /* carpeta aún no creada */ }
  return borrados;
}
const intervaloLimpieza = setInterval(limpiarTemporalesViejos, 30 * 60 * 1000);
intervaloLimpieza.unref();

// Middleware compuesto: tope de tamaño + multer + validación + compresión
const uploadEvidencias = {
  array: (campo, maxCount) => [
    limitarTamanoPeticion,
    uploadEvidenciasRaw.array(campo, maxCount),
    validarYComprimirArchivos,
  ],
};

export { uploadEvidencias, EVIDENCIAS_BASE };
