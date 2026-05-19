import pool from "../Config/db.js";

const Categoria = {
  getAll: async () => {
    const [rows] = await pool.query(
      "SELECT id_categoria, nombre_categoria FROM categoria ORDER BY id_categoria"
    );
    return rows;
  },
};

export default Categoria;
