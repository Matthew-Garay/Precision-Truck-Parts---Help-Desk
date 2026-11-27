/**
 * evidencia.js — Evidencias (archivos adjuntos) de los tickets.
 *
 * Los archivos viven en storage/Evidencias_Tickets/<folio>/NN.ext y la tabla
 * ticket_evidencia (migración 006) es el registro oficial: cuántos hay, de qué
 * tipo, cuánto pesan y quién los subió. Antes la única fuente era leer la
 * carpeta, y la base no sabía nada de ellos.
 *
 * guardar()  mueve los archivos recién subidos (multer) a la carpeta del ticket
 *            con el siguiente número libre y los registra.
 * listar()   nombres de las evidencias del ticket, en orden.
 * eliminar() borra el registro y el archivo.
 *
 * @module server/services/evidencia
 */
import fs   from "fs";
import path from "path";
import pool from "../config/db.js";
import { safeResolvePath } from "../middlewares/security.js";
import { EVIDENCIAS_BASE } from "../middlewares/upload-evidencias.js";
import { crearPoster } from "../utils/video.js";

export const MAX_EVIDENCIAS = 8;
const RE_EVIDENCIA = /\.(jpg|jpeg|png|gif|webp|mp4|webm|mov|avi)$/i;

const Evidencia = {
  listar: async (id_ticket) => {
    const [rows] = await pool.query(
      "SELECT nombre_archivo FROM ticket_evidencia WHERE id_ticket = ? ORDER BY nombre_archivo", [id_ticket]
    );
    return rows.map(r => r.nombre_archivo);
  },

  contar: async (id_ticket) => {
    const [[r]] = await pool.query("SELECT COUNT(*) AS n FROM ticket_evidencia WHERE id_ticket = ?", [id_ticket]);
    return Number(r.n) || 0;
  },

  /**
   * Mueve los archivos subidos a la carpeta del ticket y los registra.
   * El número de cada archivo es el SIGUIENTE al mayor que ya existe (no el
   * conteo): si se borró la 02 de 01..03, la nueva es 04 y no pisa la 03.
   */
  guardar: async ({ id_ticket, folio, archivos, id_subio }) => {
    if (!archivos?.length) return [];
    const destDir = safeResolvePath(EVIDENCIAS_BASE, folio);
    fs.mkdirSync(destDir, { recursive: true });
    const enDisco = fs.readdirSync(destDir).filter(f => RE_EVIDENCIA.test(f));
    const enBase  = await Evidencia.listar(id_ticket);
    let mayor = Math.max(0, ...[...enDisco, ...enBase].map(f => parseInt(f, 10) || 0));
    const nuevos = [];
    for (const file of archivos) {
      mayor++;
      const ext = path.extname(file.filename || "") || path.extname(file.originalname || "") || ".jpg";
      const nombre = `${String(mayor).padStart(2, "0")}${ext.toLowerCase()}`;
      const destino = path.join(destDir, nombre);
      fs.renameSync(file.path, destino);
      // Miniatura de los videos: un fotograma en <carpeta>/min/NN.jpg para la lista.
      if (file.mimetype?.startsWith("video/")) {
        await crearPoster(destino, path.join(destDir, "min", `${path.parse(nombre).name}.jpg`)).catch(() => {});
      }
      let tamano = null;
      try { tamano = fs.statSync(destino).size; } catch { /* sin tamaño */ }
      await pool.query(
        `INSERT INTO ticket_evidencia (id_ticket, nombre_archivo, tipo_mime, tamano_bytes, id_subio)
         VALUES (?, ?, ?, ?, ?)`,
        [id_ticket, nombre, file.mimetype || null, tamano, id_subio ?? null]
      );
      nuevos.push(nombre);
    }
    try {
      const tmp = safeResolvePath(EVIDENCIAS_BASE, "_tmp_upload");
      if (fs.readdirSync(tmp).length === 0) fs.rmdirSync(tmp);
    } catch { /* sin carpeta temporal */ }
    return nuevos;
  },

  /** true si existía (en la base o en disco) y se borró. */
  eliminar: async ({ id_ticket, folio, nombre }) => {
    const filePath = safeResolvePath(EVIDENCIAS_BASE, folio, nombre);
    const [r] = await pool.query(
      "DELETE FROM ticket_evidencia WHERE id_ticket = ? AND nombre_archivo = ?", [id_ticket, nombre]
    );
    const enDisco = fs.existsSync(filePath);
    if (enDisco) fs.unlinkSync(filePath);
    // Su miniatura de video (si la tiene) también se borra
    const poster = safeResolvePath(EVIDENCIAS_BASE, folio, "min", `${path.parse(nombre).name}.jpg`);
    try { if (fs.existsSync(poster)) fs.unlinkSync(poster); } catch { /* sin miniatura */ }
    return r.affectedRows > 0 || enDisco;
  },
};

export default Evidencia;
