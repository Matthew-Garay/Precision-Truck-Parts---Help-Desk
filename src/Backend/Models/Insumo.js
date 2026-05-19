import pool from "../Config/db.js";

const Insumo = {
  getAll: async () => {
    const [rows] = await pool.query(
      `SELECT i.id_insumo, i.num_serie, i.nombre, i.marca, i.modelo,
              i.stock, i.estado, c.nombre_categoria
       FROM insumo i
       LEFT JOIN categoria c ON i.id_categoria = c.id_categoria
       ORDER BY i.nombre ASC`
    );
    return rows;
  },

  getDisponibles: async () => {
    const [rows] = await pool.query(
      `SELECT i.id_insumo, i.nombre, i.marca, i.modelo, i.stock, i.estado,
              c.nombre_categoria
       FROM insumo i
       LEFT JOIN categoria c ON i.id_categoria = c.id_categoria
       WHERE i.stock > 0
       ORDER BY i.nombre ASC`
    );
    return rows;
  },
};

export default Insumo;
