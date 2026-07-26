/**
 * Categoria.js
 *
 * Modelo que encapsula las operaciones sobre la tabla "categoria".
 * Las categorias son etiquetas que clasifican los tickets, manuales e insumos
 * del sistema. Cada categoria tiene tres banderas booleanas que indican en
 * que modulos puede usarse: en_tickets, en_insumos, en_manuales.
 *
 * Metodos:
 *
 *   getAll()
 *     Retorna todas las categorias del sistema ordenadas por id_categoria.
 *     Incluye las tres banderas booleanas para que el frontend pueda filtrar
 *     segun el modulo en que se necesiten.
 *     Campos retornados: id_categoria, nombre_categoria, en_tickets,
 *     en_insumos, en_manuales.
 *
 *   getByTipo(tipo)
 *     Retorna solo las categorias habilitadas para el tipo indicado.
 *     Parametro tipo: "ticket", "insumo" o "manual".
 *     Lanza un error 400 si el tipo no es uno de los tres valores permitidos.
 *     Se usa en los formularios de creacion para mostrar solo las categorias
 *     relevantes al modulo activo.
 */
import pool from "../Config/db.js";

// Mapa que relaciona el tipo de modulo con la columna booleana correspondiente en BD.
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
    if (!col) throw Object.assign(new Error("Tipo de categoria no valido"), { status: 400 });
    const [rows] = await pool.query(
      `SELECT id_categoria, nombre_categoria FROM categoria WHERE ${col} = 1 ORDER BY id_categoria`
    );
    return rows;
  },
};

export default Categoria;
