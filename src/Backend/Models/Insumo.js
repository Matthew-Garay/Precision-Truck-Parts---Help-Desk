/**
 * Insumo.js
 *
 * Modelo que encapsula todas las operaciones sobre la tabla `insumo`.
 * Los insumos son los articulos del inventario que los empleados pueden
 * solicitar a traves del sistema de solicitudes.
 *
 * Metodos:
 *
 *   getAll()
 *     Retorna todos los insumos con nombre de categoria, ordenados
 *     alfabeticamente por nombre. Incluye insumos con stock cero.
 *
 *   getDisponibles()
 *     Igual que getAll pero filtra unicamente los insumos con stock > 0.
 *     Se usa en el formulario de nueva solicitud.
 *
 *   crear(campos)
 *     Inserta un nuevo insumo. Los campos opcionales num_serie, marca y modelo
 *     se guardan como NULL si vienen vacios o no se proporcionan.
 *     Retorna el insertId del nuevo registro.
 *
 *   actualizar(id, campos)
 *     Actualiza todos los campos de un insumo existente.
 *     Retorna true si se afecto al menos un registro, false si el id no existe.
 *
 *   getStockBajo(umbral)
 *     Retorna insumos con stock igual o menor al umbral (5 por defecto).
 *     Incluye la columna calculada nivel_alerta con valor "agotado" (stock = 0)
 *     o "bajo" (stock entre 1 y el umbral). Limitado a 50 registros.
 *
 *   descontarStock(conn, insumos)
 *     Funcion transaccional que recibe una conexion de base de datos con una
 *     transaccion ya abierta y un arreglo de { id_insumo, cantidad }.
 *     Para cada insumo hace SELECT ... FOR UPDATE para bloquear el registro
 *     durante la transaccion y verifica que el stock sea suficiente antes de
 *     decrementarlo. Si el stock es insuficiente lanza un Error con statusCode 400.
 *     No hace commit ni rollback, eso lo maneja el llamador.
 *
 *   eliminar(id)
 *     Elimina un insumo por su id.
 *     Retorna true si fue eliminado, false si el id no existia.
 */
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

  crear: async ({ num_serie, nombre, marca, modelo, stock, estado, id_categoria }) => {
    const [r] = await pool.query(
      `INSERT INTO insumo (num_serie, nombre, marca, modelo, stock, estado, id_categoria)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [num_serie || null, nombre, marca || null, modelo || null, stock, estado, id_categoria]
    );
    return r.insertId;
  },

  actualizar: async (id, { num_serie, nombre, marca, modelo, stock, estado, id_categoria }) => {
    const [r] = await pool.query(
      `UPDATE insumo SET num_serie=?, nombre=?, marca=?, modelo=?, stock=?, estado=?, id_categoria=?
       WHERE id_insumo=?`,
      [num_serie || null, nombre, marca || null, modelo || null, stock, estado, id_categoria, id]
    );
    return r.affectedRows > 0;
  },

  getStockBajo: async (umbral = 5) => {
    const [rows] = await pool.query(
      `SELECT i.id_insumo, i.nombre, i.marca, i.modelo, i.stock, c.nombre_categoria,
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

  // Descuenta stock de los insumos de una solicitud aprobada (dentro de una conexión con transacción abierta)
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
