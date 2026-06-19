/**
 * Categoria.js
 *
 * Modelo que representa la tabla `categoria` de la base de datos.
 * Las categorias son usadas para clasificar tickets, manuales e insumos.
 *
 * Metodos:
 *
 *   getAll()
 *     Retorna todas las categorias ordenadas por id_categoria de forma ascendente.
 *     Incluye id_categoria y nombre_categoria.
 */
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
