/**
 * movimiento-inventario.js
 *
 * Modelo del kardex de inventario (tabla `movimiento_inventario`).
 *
 * Cada fila es un movimiento físico de material:
 *   tipo            'Entrada' (compra/reposición/aumento), 'Salida' (por una
 *                   solicitud aceptada o una salida interna) o 'Ajuste'
 *                   (disminución por corrección o conteo físico).
 *   cantidad        unidades movidas, siempre positivas.
 *   stock_anterior  stock del insumo antes del movimiento.
 *   stock_nuevo     stock del insumo después del movimiento.
 *   id_sucursal_origen / id_sucursal_destino
 *                   ruta del material: de dónde sale y a dónde llega.
 *   id_solicitud    solicitud que originó la salida (SOL-…).
 *   id_salida       salida interna que originó la salida (SAL-…). Folio,
 *                   prioridad, solicitante y justificación viven en
 *                   `salida_interna`, NO en `motivo`.
 *   id_empleado     quién registró el movimiento.
 *   motivo          texto libre solo para entradas y ajustes ("Traído de…").
 *   fecha           fecha física (puede ser retroactiva).
 *   fecha_registro  cuándo se capturó; el kardex se ordena por id (captura).
 *
 * Este modelo NUNCA modifica `insumo.stock`: lo hace cada controlador en la
 * misma transacción, con el valor exacto de stock_nuevo.
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
 *
 * @module server/services/movimiento-inventario
 * @requires ../config/db.js
 * @exports MovimientoInventario (default)
 */
import pool from '../config/db.js';

// Nombre completo normalizado de un alias de `empleado`.
const NOMBRE = (a) =>
  `NULLIF(REGEXP_REPLACE(TRIM(CONCAT(IFNULL(${a}.nombre,''),' ',IFNULL(${a}.ap_paterno,''),' ',IFNULL(${a}.ap_materno,''))), ' +', ' '), '')`;

// FROM compartido por el listado y su COUNT(*): asi los filtros que tocan
// tablas unidas (solicitante de la salida, folio, etc.) funcionan en ambos.
const FROM_JOIN = `
  FROM movimiento_inventario m
  LEFT JOIN insumo         i  ON m.id_insumo           = i.id_insumo
  LEFT JOIN sucursal       so ON m.id_sucursal_origen  = so.id_sucursal
  LEFT JOIN sucursal       sd ON m.id_sucursal_destino = sd.id_sucursal
  LEFT JOIN solicitud      s  ON m.id_solicitud        = s.id_solicitud
  LEFT JOIN salida_interna sa ON m.id_salida           = sa.id_salida
  LEFT JOIN empleado       e  ON m.id_empleado         = e.id_empleado
  LEFT JOIN empleado       es ON sa.id_solicitante     = es.id_empleado
  LEFT JOIN departamento   ds ON es.id_departamento    = ds.id_departamento
  LEFT JOIN sucursal       ss ON es.id_sucursal        = ss.id_sucursal
  LEFT JOIN empleado       er ON sa.id_responsable     = er.id_empleado`;

// Los datos de una salida interna viven en `salida_interna` (normalizado) y
// ya NO dentro de `motivo`. Para no romper pantallas que solo muestran texto,
// `motivo` se compone al leer cuando el movimiento no trae uno propio.
const SELECT_JOIN = `
  SELECT m.id_movimiento, m.tipo, m.cantidad, m.stock_anterior, m.stock_nuevo,
         m.id_sucursal_origen, m.id_sucursal_destino, m.id_solicitud, m.id_salida,
         m.id_empleado, m.fecha, m.fecha_registro,
         COALESCE(m.motivo,
           CASE
             WHEN sa.id_salida IS NOT NULL THEN CONCAT('[', sa.folio_salida, '] Salida interna',
                                                       IFNULL(CONCAT(' · ', sa.justificacion), ''))
             WHEN s.id_solicitud IS NOT NULL THEN CONCAT('Entrega de material por solicitud ', s.folio_solicitud)
           END) AS motivo,
         m.id_insumo,
         i.nombre AS nombre_insumo, i.descripcion, i.marca, i.modelo, i.imagen_url,
         so.nombre_sucursal AS nombre_sucursal_origen,
         sd.nombre_sucursal AS nombre_sucursal_destino,
         s.folio_solicitud,
         ${NOMBRE("e")} AS nombre_empleado,
         -- Datos estructurados de la salida interna
         sa.folio_salida,
         sa.prioridad      AS prioridad_salida,
         sa.justificacion,
         sa.destino_texto,
         sa.id_solicitante,
         COALESCE(${NOMBRE("es")}, sa.solicitante_texto) AS nombre_solicitante,
         ds.nombre_departamento AS puesto_solicitante,
         ss.nombre_sucursal     AS sucursal_solicitante,
         es.num_empleado        AS num_empleado_solicitante,
         sa.id_responsable,
         COALESCE(${NOMBRE("er")}, sa.responsable_texto) AS nombre_responsable
  ${FROM_JOIN}`;

const MovimientoInventario = {

  registrar: async (conn, {
    id_insumo, tipo, cantidad, stock_anterior, stock_nuevo,
    id_sucursal_origen = null, id_sucursal_destino = null,
    id_solicitud = null, id_salida = null, id_empleado = null, motivo = null, fecha = null,
  }) => {
    const columns = [
      "id_insumo", "tipo", "cantidad", "stock_anterior", "stock_nuevo",
      "id_sucursal_origen", "id_sucursal_destino", "id_solicitud", "id_salida", "id_empleado", "motivo"
    ];
    const values = [
      id_insumo, tipo, Math.abs(cantidad), stock_anterior ?? 0, stock_nuevo ?? 0,
      id_sucursal_origen, id_sucursal_destino, id_solicitud, id_salida, id_empleado, motivo || null
    ];
    // fecha solo se incluye cuando se envía explícitamente; si se omite,
    // MySQL aplica el DEFAULT (CURRENT_TIMESTAMP) de la columna NOT NULL.
    if (fecha != null) {
      columns.push("fecha");
      values.push(fecha);
    }
    // IMPORTANTE: este metodo SOLO registra el movimiento (kardex). NUNCA toca
    // `insumo.stock`: cada llamador ya actualiza el stock en su transaccion
    // con el valor exacto de `stock_nuevo`. Sumar aqui otra vez duplicaba
    // cada entrada (bug del commit 27cc552, corregido 2026-11-15).
    const placeholders = columns.map(() => "?").join(", ");
    const [r] = await conn.query(
      `INSERT INTO movimiento_inventario (${columns.join(", ")}) VALUES (${placeholders})`,
      values
    );
    return r.insertId;
  },

  porInsumo: async (id_insumo, limite = 30) => {
    const [rows] = await pool.query(
      `${SELECT_JOIN}
       WHERE m.id_insumo = ?
       -- Kardex en orden de CAPTURA: stock_anterior/stock_nuevo se calculan en
       -- ese orden, asi que ordenar por la fecha manual (que puede ser
       -- retroactiva) mostraria la cadena de existencias rota.
       ORDER BY m.id_movimiento DESC
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
    id_sucursal_relacionada, manuales, folio, q, fecha_inicio, fecha_fin,
  } = {}) => {
    const where = [];
    const params = [];
    if (tipo)         { where.push("m.tipo = ?");                          params.push(tipo); }
    if (id_insumo)    { where.push("m.id_insumo = ?");                     params.push(id_insumo); }
    if (id_sucursal_destino) { where.push("m.id_sucursal_destino = ?");    params.push(id_sucursal_destino); }
    // "Salidas de mi sucursal": las que van a mi sucursal O las que pidió
    // alguien de mi sucursal. Muchas salidas viajan por un punto intermedio
    // (p. ej. Tecámac) y el destino no es la sucursal final del solicitante.
    if (id_sucursal_relacionada) {
      where.push("(m.id_sucursal_destino = ? OR es.id_sucursal = ?)");
      params.push(id_sucursal_relacionada, id_sucursal_relacionada);
    }
    if (manuales)      { where.push("m.id_solicitud IS NULL"); }
    if (folio)        { where.push("(s.folio_solicitud LIKE ? OR sa.folio_salida LIKE ?)");
                        params.push(`%${folio}%`, `%${folio}%`); }
    if (q)            { const like = `%${q}%`;
                        where.push(`(i.nombre LIKE ? OR i.marca LIKE ? OR i.modelo LIKE ?
                                     OR m.motivo LIKE ? OR IFNULL(s.folio_solicitud,'') LIKE ?
                                     OR IFNULL(sa.folio_salida,'') LIKE ? OR IFNULL(sa.justificacion,'') LIKE ?
                                     OR IFNULL(${NOMBRE("es")}, IFNULL(sa.solicitante_texto,'')) LIKE ?)`);
                        params.push(like, like, like, like, like, like, like, like); }
    if (id_sucursal)  { where.push("(m.id_sucursal_origen = ? OR m.id_sucursal_destino = ?)");
                        params.push(id_sucursal, id_sucursal); }
    if (fecha_inicio) { where.push("DATE(m.fecha) >= ?");                  params.push(fecha_inicio); }
    if (fecha_fin)    { where.push("DATE(m.fecha) <= ?");                  params.push(fecha_fin); }
    const whereSQL = where.length ? `WHERE ${where.join(" AND ")}` : "";

    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) AS total ${FROM_JOIN} ${whereSQL}`,
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
    // Los limites se calculan en MySQL (zona de la conexion, -06:00). Antes se
    // armaban con toISOString() (UTC) y el "dia" quedaba recorrido 6 horas.
    const [[row]] = await pool.query(
      `SELECT
          COALESCE(SUM(DATE(fecha) = CURDATE() AND tipo = 'Entrada'), 0) AS entradas_hoy,
          COALESCE(SUM(DATE(fecha) = CURDATE() AND tipo = 'Salida'),  0) AS salidas_hoy,
          COALESCE(SUM(fecha >= DATE_FORMAT(CURDATE(), '%Y-%m-01') AND fecha < DATE_FORMAT(CURDATE(), '%Y-%m-01') + INTERVAL 1 MONTH AND tipo = 'Entrada'), 0) AS entradas_mes,
          COALESCE(SUM(fecha >= DATE_FORMAT(CURDATE(), '%Y-%m-01') AND fecha < DATE_FORMAT(CURDATE(), '%Y-%m-01') + INTERVAL 1 MONTH AND tipo = 'Salida'),  0) AS salidas_mes,
          COUNT(*) AS total_movimientos
        FROM movimiento_inventario`
    );
    return row ?? {};
  },
};

export default MovimientoInventario;
