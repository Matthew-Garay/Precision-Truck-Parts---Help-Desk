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
