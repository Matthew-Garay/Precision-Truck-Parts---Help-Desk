/**
 * conocimiento.js
 *
 * Acceso a datos de la base de conocimiento:
 *   - Artículos de texto (tabla articulo_conocimiento) y sus votos (articulo_voto).
 *   - Texto extraído de los manuales PDF (columna manual.contenido_texto).
 *   - Índice en memoria con todos los documentos ya preparados para el buscador
 *     (se arma una vez y se invalida en cada alta, edición o baja).
 *   - Cola de extracción de texto de los PDF (uno a la vez, en segundo plano).
 *
 * @module server/services/conocimiento
 * @requires path
 * @requires ../config/db.js
 * @requires ../config/cache.js
 * @requires ../utils/busqueda-conocimiento.js
 * @requires ../utils/texto-pdf.js
 * @exports Conocimiento (default)
 */
import path from "path";
import pool from '../config/db.js';
import { cache } from '../config/cache.js';
import { prepararDocumento } from '../utils/busqueda-conocimiento.js';
import { extraerTextoPdf } from '../utils/texto-pdf.js';

const CLAVE_INDICE = "conocimiento:indice";
const TTL_INDICE = 10 * 60 * 1000;

const invalidar = () => { cache.del(CLAVE_INDICE); cache.del("manual:all"); };

/** Campos de la lista (sin el cuerpo, que puede ser grande). */
const SELECT_ARTICULO = `
  SELECT a.id_articulo, a.titulo, a.resumen, a.etiquetas, a.id_categoria,
         c.nombre_categoria, a.publicado, a.vistas, a.fecha_creacion, a.fecha_cambio,
         a.creado_por, a.editado_por,
         TRIM(CONCAT_WS(' ', ec.nombre, ec.ap_paterno)) AS autor,
         TRIM(CONCAT_WS(' ', ee.nombre, ee.ap_paterno)) AS editor,
         (SELECT COUNT(*) FROM articulo_voto v WHERE v.id_articulo = a.id_articulo AND v.util = 1) AS votos_util,
         (SELECT COUNT(*) FROM articulo_voto v WHERE v.id_articulo = a.id_articulo AND v.util = 0) AS votos_no_util
  FROM articulo_conocimiento a
  LEFT JOIN categoria c ON c.id_categoria = a.id_categoria
  LEFT JOIN empleado ec ON ec.id_empleado = a.creado_por
  LEFT JOIN empleado ee ON ee.id_empleado = a.editado_por`;

const aBool = (r) => r && ({ ...r, publicado: !!r.publicado, votos_util: Number(r.votos_util), votos_no_util: Number(r.votos_no_util) });

// ── Cola de extracción de texto de PDF ─────────────────────────────
let MANUALES_DIR = null;
let corriendo = false;
let pendienteOtraVez = false;

const Conocimiento = {

  // ── Artículos ────────────────────────────────────────────────────

  listarArticulos: async ({ incluirBorradores = false } = {}) => {
    const [rows] = await pool.query(
      `${SELECT_ARTICULO} ${incluirBorradores ? "" : "WHERE a.publicado = 1"} ORDER BY a.fecha_cambio DESC`
    );
    return rows.map(aBool);
  },

  /** Artículo completo. `idEmpleado` agrega el voto que ya dio ese empleado. */
  getArticulo: async (id, idEmpleado = null) => {
    const [[row]] = await pool.query(
      `SELECT x.*, art.contenido,
              (SELECT util FROM articulo_voto v WHERE v.id_articulo = x.id_articulo AND v.id_empleado = ?) AS mi_voto
       FROM (${SELECT_ARTICULO} WHERE a.id_articulo = ?) x
       JOIN articulo_conocimiento art ON art.id_articulo = x.id_articulo`,
      [idEmpleado, id]
    );
    if (!row) return null;
    return { ...aBool(row), mi_voto: row.mi_voto === null ? null : !!row.mi_voto };
  },

  crearArticulo: async ({ titulo, resumen, contenido, etiquetas, id_categoria, publicado }, idEmpleado) => {
    const [r] = await pool.query(
      `INSERT INTO articulo_conocimiento
         (titulo, resumen, contenido, etiquetas, id_categoria, publicado, creado_por, editado_por)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [titulo, resumen ?? null, contenido, etiquetas ?? null, id_categoria, publicado ? 1 : 0, idEmpleado, idEmpleado]
    );
    invalidar();
    return r.insertId;
  },

  actualizarArticulo: async (id, { titulo, resumen, contenido, etiquetas, id_categoria, publicado }, idEmpleado) => {
    const [r] = await pool.query(
      `UPDATE articulo_conocimiento
       SET titulo = ?, resumen = ?, contenido = ?, etiquetas = ?, id_categoria = ?,
           publicado = ?, editado_por = ?, fecha_cambio = NOW()
       WHERE id_articulo = ?`,
      [titulo, resumen ?? null, contenido, etiquetas ?? null, id_categoria, publicado ? 1 : 0, idEmpleado, id]
    );
    invalidar();
    return r.affectedRows > 0;
  },

  eliminarArticulo: async (id) => {
    const [r] = await pool.query(`DELETE FROM articulo_conocimiento WHERE id_articulo = ?`, [id]);
    invalidar();
    return r.affectedRows > 0;
  },

  sumarVista: async (id) => {
    await pool.query(`UPDATE articulo_conocimiento SET vistas = vistas + 1 WHERE id_articulo = ?`, [id]);
  },

  /** Registra (o cambia) el voto del empleado y devuelve los totales. */
  votar: async (id, idEmpleado, util) => {
    await pool.query(
      `INSERT INTO articulo_voto (id_articulo, id_empleado, util) VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE util = VALUES(util), fecha = NOW()`,
      [id, idEmpleado, util ? 1 : 0]
    );
    const [[t]] = await pool.query(
      `SELECT COALESCE(SUM(util = 1), 0) AS votos_util, COALESCE(SUM(util = 0), 0) AS votos_no_util
       FROM articulo_voto WHERE id_articulo = ?`,
      [id]
    );
    return { votos_util: Number(t.votos_util), votos_no_util: Number(t.votos_no_util), mi_voto: !!util };
  },

  // ── Índice del buscador ──────────────────────────────────────────

  /**
   * Todos los documentos (artículos publicados y borradores + PDF) preparados
   * para buscar. El controlador filtra los borradores según el rol.
   */
  indice: async () => {
    const hit = cache.get(CLAVE_INDICE);
    if (hit) return hit;
    const [arts] = await pool.query(
      `SELECT a.id_articulo AS id, a.titulo, a.resumen, a.etiquetas, a.contenido AS cuerpo,
              a.id_categoria, c.nombre_categoria, a.publicado, a.vistas, a.fecha_cambio
       FROM articulo_conocimiento a LEFT JOIN categoria c ON c.id_categoria = a.id_categoria`
    );
    const [pdfs] = await pool.query(
      `SELECT m.id_manual AS id, m.nombre AS titulo, m.descripcion AS resumen, m.contenido_texto AS cuerpo,
              m.ruta_pdf, m.id_categoria, c.nombre_categoria, m.fecha_cambio
       FROM manual m LEFT JOIN categoria c ON c.id_categoria = m.id_categoria`
    );
    const docs = [
      ...arts.map(a => prepararDocumento({ ...a, tipo: "articulo", publicado: !!a.publicado, etiquetas: a.etiquetas ?? "" })),
      ...pdfs.map(p => prepararDocumento({
        ...p, tipo: "pdf", publicado: true, etiquetas: "",
        titulo: String(p.titulo).replace(/\.pdf$/i, ""),
        url: `/storage/Manuales/${encodeURIComponent(path.basename(p.ruta_pdf))}`,
        texto_indexado: p.cuerpo === null ? "pendiente" : (p.cuerpo === "" ? "sin_texto" : "si"),
      })),
    ];
    cache.set(CLAVE_INDICE, docs, TTL_INDICE);
    return docs;
  },

  invalidarIndice: invalidar,

  // ── Texto de los PDF ─────────────────────────────────────────────

  /** Marca un manual para volver a extraer su texto (al reemplazar el PDF). */
  marcarManualPendiente: async (idManual) => {
    await pool.query(
      `UPDATE manual SET contenido_texto = NULL, fecha_cambio = fecha_cambio WHERE id_manual = ?`,
      [idManual]
    );
    invalidar();
  },

  /**
   * Extrae el texto de todos los manuales pendientes, uno a la vez. Si se
   * llama mientras ya está corriendo, vuelve a revisar al terminar.
   * @param {string} dir  carpeta storage/Manuales
   * @returns {Promise<number>} cuántos manuales se procesaron
   */
  indexarPendientes: async (dir = MANUALES_DIR) => {
    MANUALES_DIR = dir ?? MANUALES_DIR;
    if (!MANUALES_DIR) return 0;
    if (corriendo) { pendienteOtraVez = true; return 0; }
    corriendo = true;
    let hechos = 0;
    try {
      do {
        pendienteOtraVez = false;
        const [rows] = await pool.query(
          `SELECT id_manual, ruta_pdf FROM manual WHERE contenido_texto IS NULL ORDER BY id_manual`
        );
        for (const { id_manual, ruta_pdf } of rows) {
          let texto = "";
          try {
            texto = await extraerTextoPdf(path.join(MANUALES_DIR, path.basename(ruta_pdf)));
          } catch (e) {
            // PDF dañado o inexistente: se guarda vacío para no reintentar sin fin.
            console.warn(`[conocimiento] No se pudo leer el PDF del manual ${id_manual}: ${e.message}`);
          }
          // fecha_cambio = fecha_cambio: indexar no cuenta como modificar el manual.
          await pool.query(
            `UPDATE manual SET contenido_texto = ?, fecha_cambio = fecha_cambio WHERE id_manual = ? AND contenido_texto IS NULL`,
            [texto, id_manual]
          );
          hechos++;
        }
        if (rows.length) invalidar();
      } while (pendienteOtraVez);
    } finally {
      corriendo = false;
    }
    return hechos;
  },
};

export default Conocimiento;
