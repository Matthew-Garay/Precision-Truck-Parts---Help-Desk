/**
 * Insumo.js
 *
 * Modelo que encapsula todas las operaciones sobre la tabla "insumo".
 * Un insumo es un articulo del inventario fisico de la empresa que los
 * empleados pueden solicitar a traves del modulo de solicitudes.
 *
 * Columnas de la tabla insumo:
 *   id_insumo, num_serie, nombre, descripcion, marca, modelo,
 *   stock, estado, id_categoria, imagen_url
 *
 * Campo calculado "disponibilidad" (no almacenado en BD):
 *   Se deriva del valor de stock en cada consulta SELECT mediante CASE WHEN:
 *     stock = 0   -> "Sin stock"
 *     stock <= 5  -> "Stock bajo"
 *     stock > 5   -> "Disponible"
 *
 * Metodos:
 *
 *   getAll()
 *     Retorna todos los insumos con su categoria y disponibilidad calculada.
 *     Ordenados alfabeticamente por nombre.
 *
 *   getDisponibles()
 *     Retorna solo los insumos con stock mayor a 0.
 *     Se usa en el formulario de nueva solicitud para mostrar solo lo que
 *     el empleado puede pedir.
 *
 *   crear(campos)
 *     Inserta un nuevo insumo en el inventario.
 *     Retorna el id del registro insertado.
 *
 *   actualizar(id, campos)
 *     Actualiza los datos de un insumo existente.
 *     Si imagen_url no viene en los campos, no sobreescribe la foto existente.
 *     Retorna true si se actualizo al menos un registro.
 *
 *   getStockBajo(umbral)
 *     Retorna insumos con stock menor o igual al umbral indicado (default: 2).
 *     Incluye el nivel de alerta: "agotado" si stock es 0, "bajo" si es mayor.
 *     Limitado a 50 resultados ordenados por stock ascendente.
 *
 *   descontarStock(conn, insumos)
 *     Descuenta el stock de cada insumo dentro de una transaccion activa.
 *     Usa FOR UPDATE para bloquear las filas y evitar condiciones de carrera
 *     cuando dos solicitudes se aprueban al mismo tiempo.
 *     Lanza un error con statusCode 400 si el stock es insuficiente.
 *     Parametros:
 *       conn    - conexion con transaccion activa (beginTransaction ya invocado)
 *       insumos - arreglo de { id_insumo, cantidad }
 *
 *   eliminar(id)
 *     Elimina un insumo del inventario.
 *     El controlador verifica antes que no tenga solicitudes activas (409 Conflict).
 *     Retorna true si se elimino al menos un registro.
 */
import pool from "../Config/db.js";

// Expresion SQL reutilizable para calcular la disponibilidad de un insumo.
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
              i.id_categoria, i.imagen_url,
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
              i.stock, i.estado, i.id_categoria, i.imagen_url,
              c.nombre_categoria,
              ${DISPONIBILIDAD_EXPR}
       FROM insumo i
       LEFT JOIN categoria c ON i.id_categoria = c.id_categoria
       WHERE i.stock > 0
       ORDER BY i.nombre ASC`
    );
    return rows;
  },

  // conn: conexion opcional con transaccion activa (para escribir el movimiento
  //       en la misma transaccion que el alta del insumo).
  crear: async ({ num_serie, nombre, descripcion, marca, modelo, stock, estado, id_categoria, imagen_url }, conn = pool) => {
    const [r] = await conn.query(
      `INSERT INTO insumo
         (num_serie, nombre, descripcion, marca, modelo, stock, estado, id_categoria, imagen_url)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        num_serie   || null,
        nombre,
        descripcion || null,
        marca       || null,
        modelo      || null,
        stock,
        estado,
        id_categoria,
        imagen_url  || null,
      ]
    );
    return r.insertId;
  },

  actualizar: async (id, { num_serie, nombre, descripcion, marca, modelo, stock, estado, id_categoria, imagen_url }, conn = pool) => {
    // Si imagen_url no viene en el body (undefined), no sobreescribir la foto existente.
    const imgSql  = imagen_url !== undefined ? ", imagen_url=?" : "";
    const imgVals = imagen_url !== undefined ? [imagen_url || null] : [];
    const [r] = await conn.query(
      `UPDATE insumo
          SET num_serie=?, nombre=?, descripcion=?, marca=?, modelo=?,
              stock=?, estado=?, id_categoria=?${imgSql}
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
        ...imgVals,
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
