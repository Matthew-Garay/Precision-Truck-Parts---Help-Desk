/**
 * Insumo Service - PrecisionTrucks HelpDesk
 * Gestiona las operaciones relacionadas con los insumos.
 */

import pool from "../config/db.js";
import { cache } from "../config/cache.js";

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
      `SELECT i.id_insumo, i.num_serie, i.nombre, i.descripcion, i.marca, i.modelo, i.stock, i.estado, i.id_categoria AS categoria_id, i.imagen_url, i.activo, i.visible_publico, c.nombre_categoria AS nombre_categoria FROM insumo i LEFT JOIN categoria c ON i.id_categoria = c.id_categoria ${whereSql} ORDER BY i.nombre ASC`
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
      `SELECT i.id_insumo, i.num_serie, i.nombre, i.descripcion, i.marca, i.modelo, i.stock, i.estado, i.id_categoria AS categoria_id, i.imagen_url, i.activo, i.visible_publico, c.nombre_categoria AS nombre_categoria FROM insumo i LEFT JOIN categoria c ON i.id_categoria = c.id_categoria WHERE ${whereClauses.join(" AND ")} ORDER BY i.nombre ASC`
    );
    const result = rows || [];
    cache.set(cacheKey, result, TTL_INSUMOS);
    return result;
  },

  crear: async (data) => {
    const { nombre, id_categoria, descripcion, stock, activo, visible_publico, estado } = data;
    const [result] = await pool.query(
      "INSERT INTO insumo (nombre, id_categoria, descripcion, stock, activo, visible_publico, estado, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())",
      [nombre, id_categoria, descripcion, stock, activo !== undefined ? activo : 1, visible_publico !== undefined ? visible_publico : 1, estado !== undefined ? estado : 'Excelente']
    );
    cache.delByPrefix("insumo:");
    return result.insertId;
  },

  actualizar: async (id, data, conn = null) => {
    const camposPermitidos = [
      'num_serie', 'nombre', 'descripcion', 'marca', 'modelo',
      'stock', 'estado', 'id_categoria', 'imagen_url', 'visible_publico', 'activo'
    ];
    const sets = [];
    const values = [];
    for (const campo of camposPermitidos) {
      if (data[campo] !== undefined && data[campo] !== null) {
        sets.push(`\`${campo}\` = ?`);
        values.push(data[campo]);
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
};

export default Insumo;
