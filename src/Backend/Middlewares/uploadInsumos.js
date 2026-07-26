/**
 * uploadInsumos.js
 *
 * Configura el middleware de subida de imagenes para los insumos del inventario.
 * Sigue la misma arquitectura de doble validacion que uploadEvidencias.js
 * pero con reglas especificas para imagenes de productos.
 *
 * Flujo de almacenamiento:
 *   1. Multer guarda el archivo en storage/Insumos/ con un nombre unico basado
 *      en el id del insumo, timestamp y bytes aleatorios.
 *   2. Un segundo middleware valida los bytes magicos del archivo ya guardado
 *      usando la libreria file-type para confirmar que el contenido real
 *      corresponde a una imagen valida. Si falla, elimina el archivo del disco.
 *
 * Tipos de imagen aceptados: JPEG, PNG, WebP, GIF, AVIF.
 * Limite de tamano: 5 MB por archivo.
 *
 * Seguridad:
 *   - El nombre del archivo se genera de forma determinista con el id del insumo
 *     validado como entero positivo, evitando nombres arbitrarios del cliente.
 *   - Se verifica que la ruta destino quede dentro de INSUMOS_DIR usando
 *     safeResolvePath para prevenir ataques de path traversal.
 *   - La doble validacion (mimetype declarado + bytes magicos reales) impide
 *     que un archivo malicioso renombrado con extension .jpg sea aceptado.
 *
 * Exportaciones:
 *   uploadInsumo - objeto con metodo single(campo) que retorna un arreglo
 *                  [middlewareMulter, middlewareMagicBytes]
 *   INSUMOS_DIR  - ruta absoluta del directorio de imagenes de insumos
 */
import multer            from "multer";
import path              from "path";
import fs                from "fs";
import crypto            from "crypto";
import { fileURLToPath } from "url";
import { fileTypeFromFile } from "file-type";
import { safeResolvePath }  from "./security.js";

const __dirname   = path.dirname(fileURLToPath(import.meta.url));
const INSUMOS_DIR = path.resolve(__dirname, "../../../storage/Insumos");

const INSUMOS_MIMETYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"]);

// Verifica si un mimetype corresponde a una imagen permitida.
const isImage = (mime) => INSUMOS_MIMETYPES.has(mime);

fs.mkdirSync(INSUMOS_DIR, { recursive: true });

// Configuracion de almacenamiento de Multer.
// El nombre del archivo incluye el id del insumo, timestamp y bytes aleatorios
// para garantizar unicidad y evitar colisiones bajo concurrencia.
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, INSUMOS_DIR),
  filename: (req, file, cb) => {
    const idSeguro = parseInt(req.params.id, 10);
    if (isNaN(idSeguro) || idSeguro <= 0) return cb(new Error("ID de insumo invalido"));
    const extMap = { "image/png": ".png", "image/webp": ".webp", "image/gif": ".gif", "image/avif": ".avif" };
    const ext  = extMap[file.mimetype] ?? ".jpg";
    const rand = crypto.randomBytes(6).toString("hex");
    const nombre = `insumo_${idSeguro}_${Date.now()}${rand}${ext}`;
    if (/[^a-zA-Z0-9._-]/.test(nombre)) return cb(new Error("Nombre de archivo invalido"));
    try { safeResolvePath(INSUMOS_DIR, nombre); } catch { return cb(new Error("Ruta no permitida")); }
    cb(null, nombre);
  },
});

// Primera barrera: rechaza el archivo si el mimetype declarado por el cliente no esta permitido.
// Tambien maneja el error de tamano maximo con un mensaje claro.
function multerSingle(campo) {
  return (req, res, next) => uploadRaw.single(campo)(req, res, (err) => {
    if (!err) return next();
    if (err.code === "LIMIT_FILE_SIZE") return res.status(400).json({ error: "El archivo supera el limite de 5 MB" });
    return res.status(err.status || 400).json({ error: err.message || "Error al subir archivo" });
  });
}

const uploadRaw = multer({
  storage,
  fileFilter: (_req, file, cb) => {
    if (isImage(file.mimetype)) cb(null, true);
    else cb(Object.assign(new Error("Solo se permiten imagenes JPEG, PNG o WebP"), { status: 400 }));
  },
  limits: { fileSize: 5 * 1024 * 1024 },
});

/**
 * Segunda barrera: valida los bytes magicos del archivo ya guardado en disco.
 * Si el contenido real no corresponde a una imagen valida, elimina el archivo
 * y retorna un error 400 al cliente.
 */
async function validarMagicBytes(req, res, next) {
  if (!req.file) return next();
  let tipo;
  try { tipo = await fileTypeFromFile(req.file.path); } catch {
    await fs.promises.unlink(req.file.path).catch(() => {});
    return res.status(400).json({ error: "No se pudo verificar el tipo de archivo" });
  }
  if (!tipo || !isImage(tipo.mime)) {
    await fs.promises.unlink(req.file.path).catch(() => {});
    return res.status(400).json({ error: "Archivo rechazado: contenido no valido" });
  }
  next();
}

/**
 * Middleware compuesto para subida de imagen de insumo.
 * Uso en rutas: router.post("/insumos/:id/foto", ...uploadInsumo.single("foto"), handler)
 */
export const uploadInsumo = {
  single: (campo) => [multerSingle(campo), validarMagicBytes],
};

export { INSUMOS_DIR };
