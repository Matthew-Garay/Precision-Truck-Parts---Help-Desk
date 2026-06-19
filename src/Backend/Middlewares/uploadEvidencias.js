/**
 * uploadEvidencias.js
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
 *   nombrada con el folio del ticket (ej. PTP-202605-001/) despues de crear
 *   el ticket en la base de datos.
 *
 * Exportaciones:
 *   uploadEvidencias - objeto con metodo array(campo, maxCount) que retorna
 *                      un arreglo [middlewareMulter, middlewareMagicBytes]
 *   EVIDENCIAS_BASE  - ruta absoluta del directorio base de evidencias
 */
import multer             from "multer";
import path               from "path";
import fs                 from "fs";
import { fileURLToPath }  from "url";
import { fileTypeFromFile } from "file-type";
import { safeResolvePath }  from "./security.js";

// Fix #16: usar import.meta.url en lugar de path.resolve relativo al CWD
const __dirname       = path.dirname(fileURLToPath(import.meta.url));
const EVIDENCIAS_BASE = path.resolve(__dirname, "../../../storage/Evidencias_Tickets");
const EVIDENCIAS_TMP  = path.resolve(EVIDENCIAS_BASE, "_tmp_upload");

const MIMETYPES_PERMITIDOS = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

fs.mkdirSync(EVIDENCIAS_TMP, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, EVIDENCIAS_TMP),
  filename: (_req, file, cb) => {
    const ext = file.mimetype === "image/png"  ? ".png"
              : file.mimetype === "image/webp" ? ".webp"
              : file.mimetype === "image/gif"  ? ".gif"
              : ".jpg";
    cb(null, `ev_${Date.now()}_${Math.random().toString(36).slice(2, 8)}${ext}`);
  },
});

// Primera barrera: mimetype declarado por el cliente
const uploadEvidenciasRaw = multer({
  storage,
  fileFilter: (_req, file, cb) => {
    if (MIMETYPES_PERMITIDOS.has(file.mimetype)) cb(null, true);
    else cb(new Error("Solo se permiten imágenes JPEG, PNG, WebP o GIF"));
  },
  limits: { fileSize: 10 * 1024 * 1024 },
});

// Fix #11: cleanup robusto — elimina TODOS los archivos del request sin importar
// si ya fueron renombrados/movidos, usando las rutas originales capturadas antes del loop.
async function validarMagicBytes(req, res, next) {
  const archivos = req.files || [];
  if (archivos.length === 0) return next();

  // Capturar rutas antes de cualquier modificación
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
      return res.status(400).json({ error: "Archivo rechazado: el contenido no corresponde a una imagen válida" });
    }
  }
  next();
}

// Middleware compuesto: multer + magic bytes
const uploadEvidencias = {
  array: (campo, maxCount) => [
    uploadEvidenciasRaw.array(campo, maxCount),
    validarMagicBytes,
  ],
};

export { uploadEvidencias, EVIDENCIAS_BASE };
