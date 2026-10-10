/**
 * MovimientoInventario.js
 *
 * Modelo de las entradas de material (tabla `movimiento_inventario`).
 *
 * Cada fila es una entrada o salida de material Physico:
 *   tipo            'Entrada' (compra/reposicion), 'Salida' (entregada por una
 *                   solicitud aceptada) o 'Ajuste' (correccion manual).
 *   cantidad        unidades movidas, siempre positivas.
 *   stock_anterior  stock del insumo antes del movimiento.
 *   stock_nuevo     stock del insumo despues del movimiento.
 *   id_sucursal_origen / id_sucursal_destino
 *                   ruta del material: de donde sale y a donde llega.
 *   id_solicitud    solicitud que origino la salida (NULL en entradas libres).
 *   id_empleado     quien registro el movimiento.
 *   motivo          texto libre (folio de compra, observacion, etc.).
 *
 * Metodos:
 *
 *   registrar(conn, datos)
 *     Inserta un movimiento. Recibe la conexion con transaccion activa para que
 *     el descuento/aumento de stock y su movimiento queden en la misma transaccion.
 *
 *   porInsumo(id_insumo, limite)
 *     Ultimos movimientos de un insumo, mas recientes primero.
 *
 *   porSolicitud(id_solicitud)
 *     Movimientos generados por una solicitud (para la hoja impresa).
 *
 *   listar({ page, limit, tipo, id_insumo, id_sucursal, q, fecha_inicio, fecha_fin })
 *     Listado paginado con filtros, con nombres de insumo, sucursales,
 *     empleado y folio resueltos por JOIN. `q` busca por texto libre en
 *     nombre/marca/modelo del insumo, motivo o folio. Devuelve { rows, total }.
 *
 *   resumen()
 *     Totales del dia/mes para el dashboard de inventario.
 */
import pool from "../Config/db.js";

const SELECT_JOIN = `
  SELECT m.id_movimiento, m.tipo, m.cantidad, m.stock_anterior, m.stock_nuevo,
         m.id_sucursal_origen, m.id_sucursal_destino, m.id_solicitud,
         m.id_empleado, m.motivo, m.fecha,
         m.id_insumo,
         i.nombre AS nombre_insumo, i.descripcion, i.marca, i.modelo, i.imagen_url,
         so.nombre_sucursal AS nombre_sucursal_origen,
         sd.nombre_sucursal AS nombre_sucursal_destino,
         s.folio_solicitud,
         TRIM(CONCAT(IFNULL(e.nombre,''), ' ', IFNULL(e.ap_paterno,''), ' ', IFNULL(e.ap_materno,''))) AS nombre_empleado
  FROM movimiento_inventario m
  LEFT JOIN insumo    i  ON m.id_insumo           = i.id_insumo
  LEFT JOIN sucursal  so ON m.id_sucursal_origen  = so.id_sucursal
  LEFT JOIN sucursal  sd ON m.id_sucursal_destino = sd.id_sucursal
  LEFT JOIN solicitud s  ON m.id_solicitud        = s.id_solicitud
  LEFT JOIN empleado  e  ON m.id_empleado         = e.id_empleado`;

const MovimientoInventario = {

  registrar: async (conn, {
    id_insumo, tipo, cantidad, stock_anterior, stock_nuevo,
    id_sucursal_origen = null, id_sucursal_destino = null,
    id_solicitud = null, id_empleado = null, motivo = null,
  }) => {
    const [r] = await conn.query(
      `INSERT INTO movimiento_inventario
         (id_insumo, tipo, cantidad, stock_anterior, stock_nuevo,
          id_sucursal_origen, id_sucursal_destino, id_solicitud, id_empleado, motivo)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id_insumo, tipo, Math.abs(cantidad), stock_anterior ?? 0, stock_nuevo ?? 0,
        id_sucursal_origen, id_sucursal_destino, id_solicitud, id_empleado, motivo || null,
      ]
    );
    return r.insertId;
  },

  porInsumo: async (id_insumo, limite = 30) => {
    const [rows] = await pool.query(
      `${SELECT_JOIN}
       WHERE m.id_insumo = ?
       ORDER BY m.fecha DESC, m.id_movimiento DESC
       LIMIT ?`,
      [id_insumo, limite]
    );
    return rows;
  },

  porSolicitud: async (id_solicitud) => {
    const [rows] = await pool.query(
      `${SELECT_JOIN}
       WHERE m.id_solicitud = ?
       ORDER BY i.nombre ASC`,
      [id_solicitud]
    );
    return rows;
  },

  listar: async ({
    page = 1, limit = 50, tipo, id_insumo, id_sucursal, id_sucursal_destino,
    manuales, folio, q, fecha_inicio, fecha_fin,
  } = {}) => {
    const where = [];
    const params = [];
    if (tipo)         { where.push("m.tipo = ?");                          params.push(tipo); }
    if (id_insumo)    { where.push("m.id_insumo = ?");                     params.push(id_insumo); }
    // Salidas MANUALES (sin solicitud) y/o salidas hacia una sucursal concreta:
    // es lo que usa el historial del rol Usuario ("salidas de mi sucursal").
    if (id_sucursal_destino) { where.push("m.id_sucursal_destino = ?");    params.push(id_sucursal_destino); }
    if (manuales)      { where.push("m.id_solicitud IS NULL"); }
    if (folio)        { where.push("s.folio_solicitud LIKE ?");            params.push(`%${folio}%`); }
    if (q)            { const like = `%${q}%`;
                        where.push(`(i.nombre LIKE ? OR i.marca LIKE ? OR i.modelo LIKE ?
                                     OR m.motivo LIKE ? OR IFNULL(s.folio_solicitud,'') LIKE ?)`);
                        params.push(like, like, like, like, like); }
    if (id_sucursal)  { where.push("(m.id_sucursal_origen = ? OR m.id_sucursal_destino = ?)");
                        params.push(id_sucursal, id_sucursal); }
    if (fecha_inicio) { where.push("DATE(m.fecha) >= ?");                  params.push(fecha_inicio); }
    if (fecha_fin)    { where.push("DATE(m.fecha) <= ?");                  params.push(fecha_fin); }
    const whereSQL = where.length ? `WHERE ${where.join(" AND ")}` : "";

    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) AS total
       FROM movimiento_inventario m
       LEFT JOIN insumo    i  ON m.id_insumo    = i.id_insumo
       LEFT JOIN solicitud s  ON m.id_solicitud = s.id_solicitud
       ${whereSQL}`,
      params
    );
    const [rows] = await pool.query(
      `${SELECT_JOIN}
       ${whereSQL}
       ORDER BY m.fecha DESC, m.id_movimiento DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, (page - 1) * limit]
    );
    return { rows, total };
  },

  resumen: async () => {
    const [[row]] = await pool.query(
      `SELECT
         SUM(DATE(fecha) = CURDATE() AND tipo = 'Entrada') AS entradas_hoy,
         SUM(DATE(fecha) = CURDATE() AND tipo = 'Salida')  AS salidas_hoy,
         SUM(YEAR(fecha)  = YEAR(CURDATE()) AND MONTH(fecha) = MONTH(CURDATE())
             AND tipo = 'Entrada')                         AS entradas_mes,
         SUM(YEAR(fecha)  = YEAR(CURDATE()) AND MONTH(fecha) = MONTH(CURDATE())
             AND tipo = 'Salida')                          AS salidas_mes,
         COUNT(*)                                          AS total_movimientos
       FROM movimiento_inventario`
    );
    return row ?? {};
  },
};

export default MovimientoInventario;
