/**
 * Solicitud.js
 *
 * Modelo que encapsula todas las operaciones sobre las tablas `solicitud`
 * y `solicitud_insumo`. Una solicitud es una peticion de insumos que un
 * empleado crea y un administrador aprueba o rechaza.
 *
 * Metodos:
 *
 *   crear({ prioridad, id_empleado, insumos })
 *     Opera dentro de una transaccion completa con los siguientes pasos:
 *       1. Bloquea con FOR UPDATE los folios del mes actual para evitar
 *          duplicados bajo concurrencia (race condition entre peticiones simultaneas).
 *       2. Calcula el siguiente numero secuencial y genera el folio con el
 *          formato SOL-{anno}{mes}-{numero} (ej. SOL-202605-001).
 *       3. Inserta el registro principal en la tabla solicitud.
 *       4. Verifica que todos los insumos del arreglo existen y tienen
 *          stock suficiente para la cantidad solicitada.
 *       5. Inserta los registros de detalle en solicitud_insumo.
 *       6. Hace commit si todo sale bien, o rollback si cualquier paso falla.
 *     Lanza Error con statusCode 400 si algun insumo no existe o su stock
 *     es insuficiente, para que el controlador retorne 400 en lugar de 500.
 *
 *   getByEmpleado(id_empleado)
 *     Retorna el historial de solicitudes de un empleado con los nombres de
 *     los insumos concatenados, total de piezas y total de items distintos.
 *     Ordenado del mas reciente al mas antiguo.
 *
 *   getById(id_solicitud)
 *     Retorna el encabezado de la solicitud con datos del empleado y departamento,
 *     mas el arreglo de detalle con cada insumo, su cantidad y datos del insumo.
 *     Retorna null si la solicitud no existe.
 *
 *   getAll({ limit, offset })
 *     Retorna todas las solicitudes paginadas usando SQL_CALC_FOUND_ROWS para
 *     obtener el total sin ejecutar una segunda consulta SELECT COUNT(*).
 *
 *   actualizarEstatus(id_solicitud, estatus)
 *     Actualiza el estatus de una solicitud validando que el valor pertenezca
 *     al conjunto de estatus permitidos (En proceso, Resuelto, No Resuelto).
 *     No descuenta stock; eso lo hace el controlador en una transaccion propia.
 *     Retorna true si se afecto al menos un registro.
 */
import pool from "../Config/db.js";
import { generarFolio } from "../utils/helpers.js";

const Solicitud = {
  crear: async ({ prioridad, id_empleado, insumos, descripcion = null }) => {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      // Delega al helper centralizado con bloqueo FOR UPDATE anti race-condition
      const folio = await generarFolio(conn, "solicitud", "folio_solicitud", "SOL");

      const [result] = await conn.query(
        `INSERT INTO solicitud (folio_solicitud, prioridad, id_empleado) VALUES (?, ?, ?)`,
        [folio, prioridad, id_empleado]
      );
      const id_solicitud = result.insertId;
      // Verificar que todos los insumos existen y tienen stock suficiente
      // (la justificación se inserta en el segundo bucle, ya validado todo)
      for (const { id_insumo, cantidad } of insumos) {
        const [[insumo]] = await conn.query(
          "SELECT id_insumo, nombre, stock FROM insumo WHERE id_insumo = ? LIMIT 1 FOR UPDATE",
          [id_insumo]
        );
        if (!insumo) {
          await conn.rollback();
          const err = new Error(`El insumo con id ${id_insumo} no existe`);
          err.statusCode = 400;
          throw err;
        }
        if (insumo.stock < cantidad) {
          await conn.rollback();
          const err = new Error(`Stock insuficiente para "${insumo.nombre}": disponible ${insumo.stock}, solicitado ${cantidad}`);
          err.statusCode = 400;
          throw err;
        }
      }
      for (const { id_insumo, cantidad, descripcion } of insumos) {
        await conn.query(
          `INSERT INTO solicitud_insumo (id_solicitud, id_insumo, cantidad, descripcion) VALUES (?, ?, ?, ?)`,
          [id_solicitud, id_insumo, cantidad, descripcion || null]
        );
      }
      await conn.commit();
      return { id_solicitud, folio_solicitud: folio };
    } catch (err) {
      await conn.rollback();
      // Insertar el detalle CON la justificación por insumo (la del ítem si
      // viene, si no la general de la solicitud). Es lo que se imprime en
      // el formato de insumos, columna "Justificación".
      for (const { id_insumo, cantidad, descripcion: descItem } of insumos) {
        const justLimpia = String(descItem ?? descripcion ?? "").trim() || null;
        await conn.query(
          `INSERT INTO solicitud_insumo (id_solicitud, id_insumo, cantidad, descripcion)
           VALUES (?, ?, ?, ?)`,
          [id_solicitud, id_insumo, cantidad, justLimpia]
        );
      }
      throw err;
    } finally {
      conn.release();
    }
  },

  getByEmpleado: async (id_empleado, { limit = 50, offset = 0 } = {}) => {
    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) AS total FROM solicitud WHERE id_empleado = ?`,
      [id_empleado]
    );
    const [rows] = await pool.query(
      `SELECT s.id_solicitud, s.folio_solicitud, s.fecha, s.estatus, s.prioridad,
              IFNULL(CONCAT(e.nombre,' ',e.ap_paterno),'[Empleado eliminado]') AS nombre_empleado,
              d.nombre_departamento,
              su.nombre_sucursal,
              GROUP_CONCAT(i.nombre ORDER BY i.nombre SEPARATOR ', ') AS insumos_nombres,
              SUM(si.cantidad) AS total_piezas,
              COUNT(si.id_solicitud_insumo) AS total_insumos
       FROM solicitud s
       LEFT JOIN empleado e          ON s.id_empleado    = e.id_empleado
       LEFT JOIN departamento d      ON e.id_departamento = d.id_departamento
       LEFT JOIN sucursal su         ON e.id_sucursal    = su.id_sucursal
       LEFT JOIN solicitud_insumo si ON s.id_solicitud   = si.id_solicitud
       LEFT JOIN insumo i            ON si.id_insumo     = i.id_insumo
       WHERE s.id_empleado = ?
       GROUP BY s.id_solicitud
       ORDER BY s.fecha DESC
       LIMIT ? OFFSET ?`,
      [id_empleado, limit, offset]
    );
    return { rows, total };
  },

  getById: async (id_solicitud) => {
    const [[solicitud]] = await pool.query(
      `SELECT s.id_solicitud, s.folio_solicitud, s.fecha, s.estatus, s.prioridad,
              s.id_empleado, s.fecha_atencion,
              s.id_sucursal_origen, s.id_sucursal_destino,
              so.nombre_sucursal AS nombre_sucursal_origen,
              sd.nombre_sucursal AS nombre_sucursal_destino,
              IFNULL(CONCAT(e.nombre,' ',e.ap_paterno,' ',IFNULL(e.ap_materno,'')),'[Empleado eliminado]') AS nombre_empleado,
              e.id_sucursal AS id_sucursal_empleado,
              d.nombre_departamento,
              su.nombre_sucursal
       FROM solicitud s
       LEFT JOIN empleado e     ON s.id_empleado          = e.id_empleado
       LEFT JOIN departamento d ON e.id_departamento      = d.id_departamento
       LEFT JOIN sucursal su    ON e.id_sucursal          = su.id_sucursal
       LEFT JOIN sucursal so    ON s.id_sucursal_origen   = so.id_sucursal
       LEFT JOIN sucursal sd    ON s.id_sucursal_destino  = sd.id_sucursal
       WHERE s.id_solicitud = ?`,
      [id_solicitud]
    );
    if (!solicitud) return null;
    const [detalle] = await pool.query(
      `SELECT si.id_solicitud_insumo,
              si.cantidad,
              si.cantidad AS cantidad_solicitada,
              si.cantidad_aprobada,
              si.aprobado,
              si.descripcion AS justificacion,
              i.id_insumo, IFNULL(i.nombre,'[Insumo eliminado]') AS nombre,
              i.marca, i.modelo, i.num_serie, IFNULL(i.stock,0) AS stock, i.estado,
              i.imagen_url, i.descripcion, i.id_categoria,
              c.nombre_categoria
       FROM solicitud_insumo si
       LEFT JOIN insumo i ON si.id_insumo = i.id_insumo
       LEFT JOIN categoria c ON i.id_categoria = c.id_categoria
       WHERE si.id_solicitud = ?`,
      [id_solicitud]
    );
    // justificacion = texto que el usuario escribió al crear la solicitud.
    // Se guarda por item (solicitud_insumo.descripcion); el formulario repite el
    // mismo texto en todos los insumos, asi que se exponen ambas vistas:
    //   detalle[].justificacion -> texto de ese item
    //   justificacion           -> texto unico de la solicitud (null si no hay)
    const textosJustificacion = [...new Set(
      detalle.map(d => (d.justificacion ?? "").trim()).filter(Boolean)
    )];
    // cantidad        -> lo que el empleado PIDIO (nunca se modifica)
    // cantidad_aprobada -> lo que el admin ACETO entregar (null = sin revisar)
    // cantidad_a_entregar -> cantidad practica: 0 en items negados, la aprobada
    //                       en items aprobados, la solicitada si aun no se revisa.
    detalle.forEach(d => {
      d.cantidad_a_entregar = d.aprobado === null || d.aprobado === undefined
        ? d.cantidad
        : (d.aprobado === 1 || d.aprobado === true)
          ? (d.cantidad_aprobada ?? d.cantidad)
          : 0;
    });
    return {
      ...solicitud,
      detalle,
      justificacion: textosJustificacion[0] ?? null,
    };
  },

  getAll: async ({ limit = 100, offset = 0, estatus, prioridad, empleado, busqueda, area, sucursal, fecha_inicio, fecha_fin } = {}) => {
    const where = [];
    const params = [];
    if (estatus)              { where.push("s.estatus = ?");                                                                                                params.push(estatus); }
    if (prioridad)            { where.push("s.prioridad = ?");                                                                                              params.push(prioridad); }
    if (empleado || busqueda) { where.push("(CONCAT(IFNULL(e.nombre,''),' ',IFNULL(e.ap_paterno,'')) LIKE ? OR s.folio_solicitud LIKE ?)"); const q = `%${empleado || busqueda}%`; params.push(q, q); }
    if (area)                 { where.push("d.nombre_departamento = ?");                                                                                    params.push(area); }
    if (sucursal)             { where.push("su.nombre_sucursal = ?");                                                                                       params.push(sucursal); }
    if (fecha_inicio) { where.push("DATE(s.fecha) >= ?"); params.push(fecha_inicio); }
    if (fecha_fin)    { where.push("DATE(s.fecha) <= ?"); params.push(fecha_fin); }
    const whereSQL = where.length ? `WHERE ${where.join(" AND ")}` : "";

    const [[{ total }]] = await pool.query(
      `SELECT COUNT(DISTINCT s.id_solicitud) AS total
       FROM solicitud s
       LEFT JOIN empleado e     ON s.id_empleado      = e.id_empleado
       LEFT JOIN departamento d ON e.id_departamento  = d.id_departamento
       LEFT JOIN sucursal su    ON e.id_sucursal      = su.id_sucursal
       ${whereSQL}`,
      params
    );
    const [rows] = await pool.query(
      `SELECT s.id_solicitud, s.folio_solicitud, s.fecha, s.estatus, s.prioridad,
              IFNULL(CONCAT(e.nombre,' ',e.ap_paterno,' ',IFNULL(e.ap_materno,'')),'[Empleado eliminado]') AS nombre_empleado,
              d.nombre_departamento,
              su.nombre_sucursal,
              COUNT(si.id_solicitud_insumo) AS total_insumos,
              SUM(si.cantidad) AS total_piezas,
              COALESCE(SUM(CASE WHEN si.aprobado = 1 THEN COALESCE(si.cantidad_aprobada, si.cantidad, 0) ELSE 0 END), 0) AS total_autorizadas,
              COALESCE(SUM(CASE WHEN si.aprobado = 1 THEN 1 ELSE 0 END), 0) AS insumos_autorizados,
              GROUP_CONCAT(i.nombre ORDER BY i.nombre SEPARATOR ', ') AS insumos_nombres
       FROM solicitud s
       LEFT JOIN empleado e     ON s.id_empleado      = e.id_empleado
       LEFT JOIN departamento d ON e.id_departamento  = d.id_departamento
       LEFT JOIN sucursal su    ON e.id_sucursal      = su.id_sucursal
       LEFT JOIN solicitud_insumo si ON s.id_solicitud     = si.id_solicitud
       LEFT JOIN insumo i            ON si.id_insumo       = i.id_insumo
       ${whereSQL}
       GROUP BY s.id_solicitud
       ORDER BY s.fecha DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );
    return { rows, total };
  },

  getMetricas: async () => {
    const [[row]] = await pool.query(
      `SELECT
         COUNT(*) AS total,
         SUM(estatus = 'En proceso')   AS en_proceso,
         SUM(estatus = 'Aceptado')     AS aceptados,
         SUM(estatus = 'Rechazado')    AS rechazados,
         SUM(prioridad = 'Urgente')    AS p_urgente,
         SUM(prioridad = 'Alta')       AS p_alta,
         SUM(prioridad = 'Media')      AS p_media,
         SUM(prioridad = 'Baja')       AS p_baja
       FROM solicitud`
    );
    return row;
  },

  actualizarEstatus: async (id_solicitud, estatus) => {
    const PERMITIDOS = new Set(["En proceso", "Aceptado", "Rechazado"]);
    if (!PERMITIDOS.has(estatus)) throw new Error("Estatus no válido");
    // Al cerrar la solicitud se sella la fecha de atencion (para la hoja impresa).
    const [result] = await pool.query(
      `UPDATE solicitud
          SET estatus = ?
              ${estatus === "En proceso" ? "" : ", fecha_atencion = NOW()"}
        WHERE id_solicitud = ?`,
      [estatus, id_solicitud]
    );
    return result.affectedRows > 0;
  },

  // Guarda la ruta del material: sucursal de donde sale y a donde va.
  // Ambos ids deben existir en `sucursal`; el controlador valida que sean distintos.
  actualizarRuta: async (id_solicitud, { id_sucursal_origen, id_sucursal_destino }) => {
    const [result] = await pool.query(
      `UPDATE solicitud
          SET id_sucursal_origen  = COALESCE(?, id_sucursal_origen),
              id_sucursal_destino = COALESCE(?, id_sucursal_destino)
        WHERE id_solicitud = ?`,
      [id_sucursal_origen ?? null, id_sucursal_destino ?? null, id_solicitud]
    );
    return result.affectedRows > 0;
  },

  // Actualiza el campo aprobado / cantidad_aprobada de cada ítem de solicitud_insumo
  aprobarItems: async (id_solicitud, items) => {
    // items: [{ id_solicitud_insumo, aprobado: 0|1, cantidad_aprobada: int|null }]
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      for (const { id_solicitud_insumo, aprobado, cantidad_aprobada } of items) {
        const esAprobado = aprobado ? 1 : 0;
        // En items aprobados se guarda la cantidad aceptada (o NULL si no se cambi6).
        // En items negados se registra 0 para que la hoja muestre "0 de N".
        const cantidad = esAprobado === 1 ? (cantidad_aprobada ?? null) : 0;
        await conn.query(
          `UPDATE solicitud_insumo
              SET aprobado = ?, cantidad_aprobada = COALESCE(?, cantidad_aprobada)
            WHERE id_solicitud_insumo = ? AND id_solicitud = ?`,
          [esAprobado, cantidad, id_solicitud_insumo, id_solicitud]
        );
      }
      await conn.commit();
      return true;
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  },
};

export default Solicitud;
