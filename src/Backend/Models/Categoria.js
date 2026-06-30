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

const COLUMNAS_CATEGORIA = {
  ticket:  "en_tickets",
  insumo:  "en_insumos",
  manual:  "en_manuales",
};

const Categoria = {
  getAll: async () => {
    const [rows] = await pool.query(
      `SELECT id_categoria, nombre_categoria, en_tickets, en_insumos, en_manuales
       FROM categoria ORDER BY id_categoria`
    );
    return rows;
  },

  getByTipo: async (tipo) => {
    const col = COLUMNAS_CATEGORIA[tipo];
    if (!col) throw Object.assign(new Error("Tipo de categoría no válido"), { status: 400 });
    const [rows] = await pool.query(
      `SELECT id_categoria, nombre_categoria FROM categoria WHERE ${col} = 1 ORDER BY id_categoria`
    );
    return rows;
  },
};

export default Categoria;
