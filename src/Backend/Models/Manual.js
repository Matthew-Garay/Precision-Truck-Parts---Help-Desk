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
