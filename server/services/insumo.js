/**
 * Insumo.js
 *
 * Modelo que encapsula todas las operaciones sobre la tabla "insumo".
 * Un insumo es un articulo del inventario fisico de la empresa que los
 * empleados pueden solicitar a traves del modulo de solicitudes.
 *
 * Columnas de la tabla insumo:
 *   id_insumo, num_serie, nombre, descripcion, marca, modelo,
 *   stock, estado, id_categoria, imagen_url, activo
 *
 * Baja lógica (`activo`): 1 = visible en Salidas/solicitudes/inventario
 * operativo, 0 = inhabilitado (se oculta de los selectores pero se conserva
 * para el historial). El borrado físico (DELETE) solo se permite cuando el
 * insumo no tiene movimientos ni solicitudes que lo referencien.
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
import pool from '../config/db.js';

// Expresion SQL reutilizable para calcular la disponibilidad de un insumo.
const DISPONIBILIDAD_EXPR = `CASE
    WHEN i.stock  = 0 THEN 'Sin stock'
    WHEN i.stock <= 5 THEN 'Stock bajo'
    ELSE 'Disponible'
  END AS disponibilidad`;

const Insumo = {

  // ¿La columna `activo` (baja lógica) ya existe en la tabla?
  // Si la columna no existe, las consultas siguen
  // funcionando: se asume todo activo (=1).
  _tieneActivo: null,

  _tieneVisiblePublico: null,
  _tieneVisiblePublicoCheck: async () => {
    if (Insumo._tieneVisiblePublico !== null) return Insumo._tieneVisiblePublico;
    try {
      const [[{ cnt }]] = await pool.query(
        `SELECT COUNT(*) AS cnt FROM information_schema.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'insumo' AND COLUMN_NAME = 'visible_publico'`
      );
      Insumo._tieneVisiblePublico = Number(cnt) > 0;
    } catch {
      Insumo._tieneVisiblePublico = false;
    }
    return Insumo._tieneVisiblePublico;
  },

  _tieneActivoCheck: async () => {
    if (Insumo._tieneActivo !== null) return Insumo._tieneActivo;
    try {
      const [[{ cnt }]] = await pool.query(
        `SELECT COUNT(*) AS cnt FROM information_schema.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'insumo' AND COLUMN_NAME = 'activo'`
      );
      Insumo._tieneActivo = Number(cnt) > 0;
    } catch {
      Insumo._tieneActivo = false;
    }
    return Insumo._tieneActivo;
  },

  getAll: async ({ soloActivos = false } = {}) => {
    const tieneActivo = await Insumo._tieneActivoCheck();
    const tieneVisiblePublico = await Insumo._tieneVisiblePublicoCheck();
    const colActivo = tieneActivo ? "i.activo," : "1 AS activo,";
    const colVisible = tieneVisiblePublico ? "i.visible_publico," : "1 AS visible_publico,";
    const whereActivo = tieneActivo && soloActivos ? "WHERE i.activo = 1" : "";
    const [rows] = await pool.query(
      `SELECT i.id_insumo, i.num_serie, i.nombre, i.descripcion,
              i.marca, i.modelo, i.stock, i.estado,
              i.id_categoria, i.imagen_url, ${colActivo} ${colVisible}
              c.nombre_categoria,
              ${DISPONIBILIDAD_EXPR}
       FROM insumo i
       LEFT JOIN categoria c ON i.id_categoria = c.id_categoria
       ${whereActivo}
       ORDER BY i.nombre ASC`
    );
    return rows;
  },

  getDisponibles: async () => {
    const tieneActivo = await Insumo._tieneActivoCheck();
    const tieneVisiblePublico = await Insumo._tieneVisiblePublicoCheck();
    const colActivo = tieneActivo ? "i.activo," : "1 AS activo,";
    const colVisible = tieneVisiblePublico ? "i.visible_publico," : "1 AS visible_publico,";
    const whereActivo = tieneActivo ? "AND i.activo = 1" : "";
    const [rows] = await pool.query(
      `SELECT i.id_insumo, i.nombre, i.descripcion, i.marca, i.modelo,
              i.stock, i.estado, i.id_categoria, i.imagen_url, ${colActivo} ${colVisible}
              c.nombre_categoria,
              ${DISPONIBILIDAD_EXPR}
       FROM insumo i
       LEFT JOIN categoria c ON i.id_categoria = c.id_categoria
       WHERE i.stock > 0
         ${whereActivo}
         ${tieneVisiblePublico ? "AND i.visible_publico = 1" : ""}
       ORDER BY i.nombre ASC`
    );
    return rows;
  },

  // Para el rol Usuario (no admin): solo insumos activos, con stock y
  //     visibles al público. Los inhabilitados y los no públicos se
  //     conservan en el historial pero no se muestran en el catálogo.
  getForUser: async () => {
    const tieneActivo = await Insumo._tieneActivoCheck();
    const tieneVisiblePublico = await Insumo._tieneVisiblePublicoCheck();
    const colActivo = tieneActivo ? "i.activo," : "1 AS activo,";
    const colVisible = tieneVisiblePublico ? "i.visible_publico," : "1 AS visible_publico,";
    const whereActivo = tieneActivo ? "AND i.activo = 1" : "";
    const whereVisible = tieneVisiblePublico ? "AND i.visible_publico = 1" : "";
    const [rows] = await pool.query(
      `SELECT i.id_insumo, i.num_serie, i.nombre, i.descripcion, i.marca, i.modelo,
              i.stock, i.estado, i.imagen_url, ${colActivo} ${colVisible}
              c.nombre_categoria,
              ${DISPONIBILIDAD_EXPR}
       FROM insumo i
       LEFT JOIN categoria c ON i.id_categoria = c.id_categoria
       WHERE i.stock > 0 ${whereActivo} ${whereVisible}
       ORDER BY i.nombre ASC`
    );
    return rows;
  },

  // conn: conexion opcional con transaccion activa (para escribir el movimiento
  //       en la misma transaccion que el alta del insumo).
  crear: async ({ num_serie, nombre, descripcion, marca, modelo, stock, estado, id_categoria, imagen_url, visible_publico }, conn = pool) => {
    const [r] = await conn.query(
      `INSERT INTO insumo
         (num_serie, nombre, descripcion, marca, modelo, stock, estado, id_categoria, imagen_url, visible_publico)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        num_serie      || null,
        nombre,
        descripcion    || null,
        marca          || null,
        modelo         || null,
        stock,
        estado,
        id_categoria,
        imagen_url     || null,
        visible_publico !== undefined ? (visible_publico ? 1 : 0) : 1,
      ]
    );
    return r.insertId;
  },

  actualizar: async (id, { num_serie, nombre, descripcion, marca, modelo, stock, estado, id_categoria, imagen_url, visible_publico }, conn = pool) => {
    // Si imagen_url no viene en el body (undefined), no sobreescribir la foto existente.
    const imgSql  = imagen_url !== undefined ? ", imagen_url=?" : "";
    const imgVals = imagen_url !== undefined ? [imagen_url || null] : [];
    const visSql  = visible_publico !== undefined ? ", visible_publico=?" : "";
    const visVals = visible_publico !== undefined ? [visible_publico ? 1 : 0] : [];
    const [r] = await conn.query(
      `UPDATE insumo
          SET num_serie=?, nombre=?, descripcion=?, marca=?, modelo=?,
              stock=?, estado=?, id_categoria=?${imgSql}${visSql}
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
        ...visVals,
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

  // Cambiar el estado visible (pública) del insumo.
  // visible_publico = 1 → visible al público (reportes, inventario web)
  // visible_publico = 0 → oculto al público (solo visible para admins)
  cambiarVisiblePublico: async (id, visible) => {
    const [r] = await pool.query(
      "UPDATE insumo SET visible_publico = ? WHERE id_insumo = ?",
      [visible ? 1 : 0, id]
    );
    return r.affectedRows > 0;
  },

  // Baja lógica: 1 = activo/visible, 0 = inhabilitado/oculto de selectores.
  // No borra el registro: el historial (solicitudes, movimientos) se conserva.
  cambiarActivo: async (id, activo) => {
    const [r] = await pool.query("UPDATE insumo SET activo = ? WHERE id_insumo = ?", [activo ? 1 : 0, id]);
    return r.affectedRows > 0;
  },
};

export default Insumo;
