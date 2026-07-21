/**
 * Insumo.js
 *
 * Columnas reales de la tabla `insumo` en precisión_helpdesk:
 *   id_insumo, num_serie, nombre, descripcion, marca, modelo,
 *   stock, estado, id_categoria, proveedor, imagen_url
 *
 * DISPONIBILIDAD — campo calculado (NO almacenado):
 *   Se deriva del stock con CASE WHEN en cada SELECT:
 *     stock = 0   → "Sin stock"
 *     stock <= 5  → "Stock bajo"
 *     stock > 5   → "Disponible"
 */
import pool from "../Config/db.js";

const DISPONIBILIDAD_EXPR = `CASE
    WHEN i.stock  = 0 THEN 'Sin stock'
    WHEN i.stock <= 5 THEN 'Stock bajo'
    ELSE 'Disponible'
  END AS disponibilidad`;

const Insumo = {

  getAll: async () => {
    const [rows] = await pool.query(
      `SELECT i.id_insumo, i.num_serie, i.nombre, i.descripcion,
              i.marca, i.modelo, i.stock, i.estado,
              i.id_categoria, i.proveedor, i.imagen_url,
              c.nombre_categoria,
              ${DISPONIBILIDAD_EXPR}
       FROM insumo i
       LEFT JOIN categoria c ON i.id_categoria = c.id_categoria
       ORDER BY i.nombre ASC`
    );
    return rows;
  },

  getDisponibles: async () => {
    const [rows] = await pool.query(
      `SELECT i.id_insumo, i.nombre, i.descripcion, i.marca, i.modelo,
              i.stock, i.estado, i.id_categoria, i.proveedor, i.imagen_url,
              c.nombre_categoria,
              ${DISPONIBILIDAD_EXPR}
       FROM insumo i
       LEFT JOIN categoria c ON i.id_categoria = c.id_categoria
       WHERE i.stock > 0
       ORDER BY i.nombre ASC`
    );
    return rows;
  },

  crear: async ({ num_serie, nombre, descripcion, marca, modelo, stock, estado, id_categoria, proveedor, imagen_url }) => {
    const [r] = await pool.query(
      `INSERT INTO insumo
         (num_serie, nombre, descripcion, marca, modelo, stock, estado, id_categoria, proveedor, imagen_url)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        num_serie   || null,
        nombre,
        descripcion || null,
        marca       || null,
        modelo      || null,
        stock,
        estado,
        id_categoria,
        proveedor   || null,
        imagen_url  || null,
      ]
    );
    return r.insertId;
  },

  actualizar: async (id, { num_serie, nombre, descripcion, marca, modelo, stock, estado, id_categoria, proveedor, imagen_url }) => {
    const [r] = await pool.query(
      `UPDATE insumo
          SET num_serie=?, nombre=?, descripcion=?, marca=?, modelo=?,
              stock=?, estado=?, id_categoria=?, proveedor=?, imagen_url=?
        WHERE id_insumo=?`,
      [
        num_serie   || null,
        nombre,
        descripcion || null,
        marca       || null,
        modelo      || null,
        stock,
        estado,
        id_categoria,
        proveedor   || null,
        imagen_url  || null,
        id,
      ]
    );
    return r.affectedRows > 0;
  },

  getStockBajo: async (umbral = 2) => {
    const [rows] = await pool.query(
      `SELECT i.id_insumo, i.nombre, i.marca, i.modelo, i.stock, i.imagen_url,
              c.nombre_categoria,
              CASE WHEN i.stock = 0 THEN 'agotado' ELSE 'bajo' END AS nivel_alerta
       FROM insumo i
       LEFT JOIN categoria c ON i.id_categoria = c.id_categoria
       WHERE i.stock <= ?
       ORDER BY i.stock ASC, i.nombre ASC
       LIMIT 50`,
      [umbral]
    );
    return rows;
  },

  descontarStock: async (conn, insumos) => {
    for (const { id_insumo, cantidad } of insumos) {
      const [[row]] = await conn.query(
        "SELECT stock FROM insumo WHERE id_insumo = ? FOR UPDATE", [id_insumo]
      );
      if (!row || row.stock < cantidad) {
        const err = new Error(`Stock insuficiente para insumo id ${id_insumo}`);
        err.statusCode = 400;
        throw err;
      }
      await conn.query(
        "UPDATE insumo SET stock = stock - ? WHERE id_insumo = ?", [cantidad, id_insumo]
      );
    }
  },

  eliminar: async (id) => {
    const [r] = await pool.query("DELETE FROM insumo WHERE id_insumo=?", [id]);
    return r.affectedRows > 0;
  },
};

export default Insumo;
