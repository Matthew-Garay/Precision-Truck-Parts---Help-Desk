/**
 * Manual.js
 *
 * Modelo que encapsula todas las operaciones sobre la tabla "manual".
 * Un manual es un archivo PDF tecnico que los administradores suben al sistema
 * y los empleados pueden consultar desde la seccion de manuales.
 *
 * Metodos:
 *
 *   getAll()
 *     Retorna todos los manuales ordenados del mas reciente al mas antiguo.
 *     Incluye el nombre de la categoria con JOIN a la tabla categoria.
 *     Campos retornados: id_manual, nombre, descripcion, fecha_subida,
 *     fecha_cambio, ruta_pdf, id_categoria, nombre_categoria.
 *
 *   crear({ nombre, descripcion, ruta_pdf, id_categoria })
 *     Inserta un nuevo registro de manual en la base de datos.
 *     La ruta_pdf es la ruta relativa al directorio storage (ej. /storage/Manuales/archivo.pdf).
 *     Retorna el id del registro insertado (insertId).
 *
 *   actualizar(id_manual, { nombre, descripcion, id_categoria })
 *     Actualiza los metadatos del manual: nombre, descripcion y categoria.
 *     No modifica el archivo PDF en disco, solo el registro en base de datos.
 *     Retorna true si se actualizo al menos un registro, false si no existe.
 *
 *   getRuta(id_manual)
 *     Retorna solo la ruta_pdf del manual indicado.
 *     Se usa antes de eliminar el manual para saber que archivo borrar del disco.
 *     Retorna null si el manual no existe.
 *
 *   actualizarFechaCambio(id_manual)
 *     Actualiza el campo fecha_cambio al momento actual (NOW()).
 *     Se llama cuando se reemplaza el archivo PDF de un manual existente.
 *
 *   eliminar(id_manual)
 *     Elimina el registro del manual de la base de datos.
 *     No elimina el archivo del disco; eso lo hace el controlador de rutas.
 *     Retorna true si se elimino al menos un registro, false si no existe.
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

  actualizarFechaCambio: async (id_manual) => {
    await pool.query(
      `UPDATE manual SET fecha_cambio = NOW() WHERE id_manual = ?`,
      [id_manual]
    );
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
