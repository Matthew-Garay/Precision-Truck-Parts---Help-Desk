/**
 * insumo.js
 *
 * Insumo Service - PrecisionTrucks HelpDesk
 * Gestiona las operaciones relacionadas con los insumos.
 *
 * @module server/services/insumo
 * @requires ../config/db.js
 * @requires ../config/cache.js
 * @exports Insumo (default)
 */

import pool from "../config/db.js";
import { cache } from "../config/cache.js";
import { STOCK_BAJO, SQL_DISPONIBILIDAD } from "../utils/stock.js";

const TTL_INSUMOS = 5 * 60 * 1000;

const Insumo = {
  _tieneActivo: null,
  _tieneVisiblePublico: null,

  _tieneVisiblePublicoCheck: async () => {
    if (Insumo._tieneVisiblePublico !== null) return Insumo._tieneVisiblePublico;
    try {
      const [[{ cnt }]] = await pool.query(
        "SELECT COUNT(*) AS cnt FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'insumo' AND COLUMN_NAME = 'visible_publico'"
      );
      Insumo._tieneVisiblePublico = Number(cnt) > 0;
    } catch {
      Insumo._tieneVisiblePublico = true;
    }
    return Insumo._tieneVisiblePublico;
  },

  _tieneActivoCheck: async () => {
    if (Insumo._tieneActivo !== null) return Insumo._tieneActivo;
    try {
      const [[{ cnt }]] = await pool.query(
        "SELECT COUNT(*) AS cnt FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'insumo' AND COLUMN_NAME = 'activo'"
      );
      Insumo._tieneActivo = Number(cnt) > 0;
    } catch {
      Insumo._tieneActivo = true;
    }
    return Insumo._tieneActivo;
  },

  getAll: async ({ soloActivos = false } = {}) => {
    const cacheKey = `insumo:all:${soloActivos ? 1 : 0}`;
    const cached = cache.get(cacheKey);
    if (cached) return cached;
    const tieneActivo = await Insumo._tieneActivoCheck();
    const tieneVisiblePublico = await Insumo._tieneVisiblePublicoCheck();
    const whereClauses = [];
    if (tieneActivo && soloActivos) whereClauses.push("i.activo = 1");
    if (tieneVisiblePublico) whereClauses.push("i.visible_publico = 1");
    const whereSql = whereClauses.length > 0 ? "WHERE " + whereClauses.join(" AND ") : "";
    const [rows] = await pool.query(
      `SELECT i.id_insumo, i.num_serie, i.etiqueta, i.control_serie, i.nombre, i.descripcion, i.marca, i.modelo, i.stock, i.estado, i.id_categoria AS categoria_id, i.imagen_url, i.activo, i.visible_publico, c.nombre_categoria AS nombre_categoria, ${SQL_DISPONIBILIDAD("i")} AS disponibilidad FROM insumo i LEFT JOIN categoria c ON i.id_categoria = c.id_categoria ${whereSql} ORDER BY i.nombre ASC`
    );
    const result = rows || [];
    cache.set(cacheKey, result, TTL_INSUMOS);
    return result;
  },

  getDisponibles: async () => {
    const cacheKey = "insumo:disponibles";
    const cached = cache.get(cacheKey);
    if (cached) return cached;
    const tieneActivo = await Insumo._tieneActivoCheck();
    const tieneVisiblePublico = await Insumo._tieneVisiblePublicoCheck();
    const whereClauses = ["i.stock > 0"];
    if (tieneActivo) whereClauses.push("i.activo = 1");
    if (tieneVisiblePublico) whereClauses.push("i.visible_publico = 1");
    const [rows] = await pool.query(
      `SELECT i.id_insumo, i.num_serie, i.etiqueta, i.control_serie, i.nombre, i.descripcion, i.marca, i.modelo, i.stock, i.estado, i.id_categoria AS categoria_id, i.imagen_url, i.activo, i.visible_publico, c.nombre_categoria AS nombre_categoria, ${SQL_DISPONIBILIDAD("i")} AS disponibilidad FROM insumo i LEFT JOIN categoria c ON i.id_categoria = c.id_categoria WHERE ${whereClauses.join(" AND ")} ORDER BY i.nombre ASC`
    );
    const result = rows || [];
    cache.set(cacheKey, result, TTL_INSUMOS);
    return result;
  },

  // Insumos activos agotados o con stock bajo (límite único en utils/stock.js).
  getStockBajo: async () => {
    const tieneActivo = await Insumo._tieneActivoCheck();
    const [rows] = await pool.query(
      `SELECT i.id_insumo, i.nombre, i.etiqueta, i.marca, i.modelo, i.stock, i.imagen_url,
              ${SQL_DISPONIBILIDAD("i")} AS disponibilidad
         FROM insumo i
        WHERE i.stock <= ? ${tieneActivo ? "AND i.activo = 1" : ""}
        ORDER BY i.stock ASC, i.nombre ASC`,
      [STOCK_BAJO]
    );
    return rows;
  },

  // `conn` (opcional) permite crear el insumo dentro de la transaccion del
  // llamador; antes se ignoraba y el INSERT quedaba fuera del rollback.
  // Tambien se guardan num_serie, marca, modelo e imagen, que antes se perdian.
  crear: async (data, conn = null) => {
    const { num_serie, nombre, id_categoria, descripcion, marca, modelo, stock,
            imagen_url, activo, visible_publico, estado, etiqueta } = data;
    const db = conn || pool;
    const [result] = await db.query(
      `INSERT INTO insumo (num_serie, etiqueta, nombre, id_categoria, descripcion, marca, modelo, stock,
                           imagen_url, activo, visible_publico, estado, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [num_serie || null, etiqueta || null, nombre, id_categoria, descripcion || null, marca || null, modelo || null,
       stock ?? 0, imagen_url ?? null,
       activo !== undefined ? activo : 1, visible_publico !== undefined ? visible_publico : 1,
       estado !== undefined ? estado : 'Excelente']
    );
    cache.delByPrefix("insumo:");
    return result.insertId;
  },

  actualizar: async (id, data, conn = null) => {
    const camposPermitidos = [
      'nombre', 'stock', 'estado', 'id_categoria', 'imagen_url', 'visible_publico', 'activo'
    ];
    const sets = [];
    const values = [];
    for (const campo of camposPermitidos) {
      if (data[campo] !== undefined && data[campo] !== null) {
        sets.push(`\`${campo}\` = ?`);
        values.push(data[campo]);
      }
    }
    // Texto opcional: se puede BORRAR (vacío → NULL). Si el campo no viene,
    // no se toca. Los demás campos ignoran null.
    for (const campo of ['num_serie', 'etiqueta', 'descripcion', 'marca', 'modelo']) {
      if (data[campo] !== undefined) {
        sets.push(`\`${campo}\` = ?`);
        values.push(data[campo] ? String(data[campo]).trim() || null : null);
      }
    }
    if (sets.length === 0) return false;
    sets.push("`updated_at` = NOW()");
    const query = `UPDATE insumo SET ${sets.join(', ')} WHERE id_insumo = ?`;
    values.push(id);
    const db = conn || pool;
    const [result] = await db.query(query, values);
    cache.delByPrefix("insumo:");
    return result.affectedRows > 0;
  },

  eliminar: async (id) => {
    const [result] = await pool.query("DELETE FROM insumo WHERE id_insumo = ?", [id]);
    cache.delByPrefix("insumo:");
    return result.affectedRows > 0;
  },

  /** Invalida la caché del catálogo: llamar tras cualquier cambio de stock
   *  (entradas, salidas, edición de entradas) para no mostrar stock viejo. */
  limpiarCache: () => cache.delByPrefix("insumo:"),
};

export default Insumo;
