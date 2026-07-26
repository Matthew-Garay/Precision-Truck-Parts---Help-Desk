/**
 * uploadManuales.js
 *
 * Configura el middleware de subida de archivos PDF para los manuales
 * de incidencias del sistema.
 *
 * Flujo de almacenamiento:
 *   1. Multer guarda el archivo en storage/Manuales/ con un nombre temporal
 *      de la forma manual_tmp_{timestamp}.pdf. Se usa nombre temporal porque
 *      el titulo del manual llega en los campos de texto del mismo multipart
 *      y no esta disponible antes de que multer procese el archivo.
 *   2. El servidor (server.js) lee req.body.nombre despues de que multer termina,
 *      genera el nombre definitivo con nombreManual() y renombra el archivo.
 *      Si ya existe un archivo con ese nombre agrega un sufijo numerico (_1, _2, etc.)
 *
 * Funcion nombreManual(nombreOriginal)
 *   Convierte el titulo del manual en un nombre de archivo seguro:
 *     - Elimina tildes y caracteres diacriticos con normalize("NFD")
 *     - Elimina todo lo que no sea alfanumerico, espacio, guion o guion bajo
 *     - Convierte espacios a guiones bajos
 *     - Limita el titulo a 60 caracteres
 *     - Antepone "Manual_{año}_" como prefijo
 *   Ejemplo: "Mantenimiento de PC" -> "Manual_2026_Mantenimiento_de_PC.pdf"
 *
 * El limite de tamano es de 50 MB para acomodar manuales tecnicos extensos.
 * Se verifica que la ruta del archivo temporal quede dentro del directorio
 * de manuales usando safeResolvePath antes de aceptar la subida.
 *
 * Exportaciones:
 *   uploadManual  - instancia de multer lista para usar con .single("archivo")
 *   MANUALES_DIR  - ruta absoluta del directorio de manuales
 *   nombreManual  - funcion para generar nombres de archivo seguros
 */
import multer            from "multer";
import path              from "path";
import fs                from "fs";
import crypto            from "crypto";
import { fileURLToPath } from "url";
import { fileTypeFromFile } from "file-type";
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

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, MANUALES_DIR),
  filename: (_req, _file, cb) => {
    // Nombre temporal con random para evitar colisiones bajo concurrencia
    const rand  = crypto.randomBytes(8).toString("hex");
    const nombre = `manual_tmp_${Date.now()}_${rand}.pdf`;
    try { safeResolvePath(MANUALES_DIR, nombre); } catch { return cb(new Error("Ruta no permitida")); }
    cb(null, nombre);
  },
});

// Segunda barrera: validar magic bytes reales del archivo PDF
async function validarMagicBytesPDF(req, res, next) {
  const archivos = req.files ? req.files : (req.file ? [req.file] : []);
  if (archivos.length === 0) return next();

  for (const file of archivos) {
    let tipo;
    try { tipo = await fileTypeFromFile(file.path); } catch {
      await fs.promises.unlink(file.path).catch(() => {});
      return res.status(400).json({ error: "No se pudo verificar el tipo de archivo" });
    }
    if (!tipo || tipo.mime !== "application/pdf") {
      // Limpiar todos los archivos del request
      await Promise.all(archivos.map(f => fs.promises.unlink(f.path).catch(() => {})));
      return res.status(400).json({ error: "Archivo rechazado: solo se permiten archivos PDF válidos" });
    }
  }
  next();
}

const uploadManualRaw = multer({
  storage,
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === "application/pdf") cb(null, true);
    else cb(Object.assign(new Error("Solo se permiten archivos PDF"), { status: 400 }));
  },
  limits: { fileSize: 50 * 1024 * 1024 },
});

// Middleware compuesto: multer + validación de magic bytes
export const uploadManual = {
  single: (campo) => (req, res, next) =>
    uploadManualRaw.single(campo)(req, res, async (err) => {
      if (err) return res.status(err.status || 400).json({ error: err.message || "Error al subir archivo" });
      await validarMagicBytesPDF(req, res, next);
    }),
  array: (campo, max) => (req, res, next) =>
    uploadManualRaw.array(campo, max)(req, res, async (err) => {
      if (err) return res.status(err.status || 400).json({ error: err.message || "Error al subir archivos" });
      await validarMagicBytesPDF(req, res, next);
    }),
};
