/**
 * categoria.js
 *
 * Modelo que encapsula las operaciones sobre la tabla "categoria".
 * Las categorias clasifican los tickets, manuales e insumos del sistema. En
 * que modulos se ofrece cada una vive en la tabla categoria_ambito (un renglon
 * por modulo; migracion 006). La API conserva los campos en_tickets,
 * en_insumos y en_manuales, ahora calculados desde categoria_ambito.
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
 *
 * @module server/services/categoria
 * @requires ../config/db.js
 * @requires ../config/cache.js
 * @exports Categoria (default)
 */
import pool from '../config/db.js';
import { cache } from '../config/cache.js';

const TTL_CATALOGO = 10 * 60 * 1000; // 10 minutos

const AMBITOS = new Set(["ticket", "insumo", "manual"]);

const Categoria = {

  getAll: async () => {
    const hit = cache.get("categoria:all");
    if (hit) return hit;
    const [rows] = await pool.query(
      `SELECT c.id_categoria, c.nombre_categoria,
              MAX(a.ambito = 'ticket') AS en_tickets,
              MAX(a.ambito = 'insumo') AS en_insumos,
              MAX(a.ambito = 'manual') AS en_manuales
         FROM categoria c
         LEFT JOIN categoria_ambito a ON a.id_categoria = c.id_categoria
        GROUP BY c.id_categoria, c.nombre_categoria
        ORDER BY c.id_categoria`
    );
    cache.set("categoria:all", rows, TTL_CATALOGO);
    return rows;
  },

  getByTipo: async (tipo) => {
    if (!AMBITOS.has(tipo)) throw Object.assign(new Error("Tipo de categoria no valido"), { status: 400 });
    const hit = cache.get(`categoria:tipo:${tipo}`);
    if (hit) return hit;
    const [rows] = await pool.query(
      `SELECT c.id_categoria, c.nombre_categoria
         FROM categoria c
         JOIN categoria_ambito a ON a.id_categoria = c.id_categoria AND a.ambito = ?
        ORDER BY c.id_categoria`,
      [tipo]
    );
    cache.set(`categoria:tipo:${tipo}`, rows, TTL_CATALOGO);
    return rows;
  },
};

export default Categoria;
