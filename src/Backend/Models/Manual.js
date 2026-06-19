/**
 * Manual.js
 *
 * Modelo que encapsula todas las operaciones sobre la tabla `manual`.
 * Los manuales son documentos PDF que el administrador puede subir al
 * sistema para que los empleados los consulten como guias de incidencias.
 *
 * Metodos:
 *
 *   getAll()
 *     Retorna todos los manuales con nombre de categoria, ordenados del
 *     mas reciente al mas antiguo por fecha de subida.
 *     Incluye la ruta del archivo PDF en disco para que el servidor
 *     construya la URL publica de descarga.
 *
 *   crear(campos)
 *     Inserta un nuevo registro de manual con nombre, descripcion opcional,
 *     ruta del PDF en disco e id de categoria.
 *     Retorna el insertId del nuevo registro.
 *
 *   actualizar(id_manual, campos)
 *     Actualiza el nombre, descripcion y categoria de un manual.
 *     No actualiza la ruta del PDF (para reemplazar el archivo se
 *     debe eliminar y volver a subir).
 *     Retorna true si se afecto al menos un registro.
 *
 *   getRuta(id_manual)
 *     Retorna solo la ruta del archivo PDF almacenada en la base de datos.
 *     Se usa para obtener la ruta antes de eliminar el archivo del disco,
 *     sin necesidad de traer todos los campos del manual.
 *
 *   eliminar(id_manual)
 *     Elimina el registro del manual de la base de datos.
 *     Retorna true si fue eliminado. El servidor se encarga de eliminar
 *     tambien el archivo PDF del disco despues de llamar este metodo.
 */
import pool from "../Config/db.js";

const Manual = {
  getAll: async () => {
    const [rows] = await pool.query(
      `SELECT m.id_manual, m.nombre, m.descripcion, m.fecha_subida,
              m.fecha_cambio, m.ruta_pdf, m.id_categoria, c.nombre_categoria
       FROM manual m
       LEFT JOIN categoria c ON m.id_categoria = c.id_categoria
       ORDER BY m.fecha_subida DESC`
    );
    return rows;
  },

  crear: async ({ nombre, descripcion, ruta_pdf, id_categoria }) => {
    const [result] = await pool.query(
      `INSERT INTO manual (nombre, descripcion, ruta_pdf, id_categoria)
       VALUES (?, ?, ?, ?)`,
      [nombre, descripcion || null, ruta_pdf, id_categoria]
    );
    return result.insertId;
  },

  actualizar: async (id_manual, { nombre, descripcion, id_categoria }) => {
    const [result] = await pool.query(
      `UPDATE manual SET nombre = ?, descripcion = ?, id_categoria = ?
       WHERE id_manual = ?`,
      [nombre, descripcion || null, id_categoria, id_manual]
    );
    return result.affectedRows > 0;
  },

  getRuta: async (id_manual) => {
    const [[row]] = await pool.query(
      `SELECT ruta_pdf FROM manual WHERE id_manual = ? LIMIT 1`,
      [id_manual]
    );
    return row?.ruta_pdf || null;
  },

  eliminar: async (id_manual) => {
    const [result] = await pool.query(
      `DELETE FROM manual WHERE id_manual = ?`,
      [id_manual]
    );
    return result.affectedRows > 0;
  },
};

export default Manual;
