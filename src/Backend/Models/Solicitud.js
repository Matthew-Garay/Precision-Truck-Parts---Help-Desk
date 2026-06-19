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

const Solicitud = {
  crear: async ({ prioridad, id_empleado, insumos }) => {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      // Bloqueo exclusivo igual que en Ticket.crear - evita folios duplicados bajo concurrencia
      const ahora   = new Date();
      const anio    = ahora.getFullYear();
      const mes     = String(ahora.getMonth() + 1).padStart(2, "0");
      const prefijo = `SOL-${anio}${mes}-`;

      const [rows] = await conn.query(
        "SELECT folio_solicitud FROM solicitud WHERE folio_solicitud LIKE ? ORDER BY CAST(SUBSTRING_INDEX(folio_solicitud, '-', -1) AS UNSIGNED) DESC LIMIT 1 FOR UPDATE",
        [`${prefijo}%`]
      );
      const ultimo = rows[0]?.folio_solicitud;
      const num    = ultimo ? parseInt(ultimo.split("-").pop(), 10) + 1 : 1;
      const folio  = `${prefijo}${String(num).padStart(3, "0")}`;

      const [result] = await conn.query(
        `INSERT INTO solicitud (folio_solicitud, prioridad, id_empleado) VALUES (?, ?, ?)`,
        [folio, prioridad, id_empleado]
      );
      const id_solicitud = result.insertId;
      // Verificar que todos los insumos existen y tienen stock suficiente
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
      for (const { id_insumo, cantidad } of insumos) {
        await conn.query(
          `INSERT INTO solicitud_insumo (id_solicitud, id_insumo, cantidad) VALUES (?, ?, ?)`,
          [id_solicitud, id_insumo, cantidad]
        );
      }
      await conn.commit();
      return { id_solicitud, folio_solicitud: folio };
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  },

  getByEmpleado: async (id_empleado) => {
    const [rows] = await pool.query(
      `SELECT s.id_solicitud, s.folio_solicitud, s.fecha, s.estatus, s.prioridad,
              GROUP_CONCAT(i.nombre ORDER BY i.nombre SEPARATOR ', ') AS insumos_nombres,
              SUM(si.cantidad) AS total_piezas,
              COUNT(si.id_solicitud_insumo) AS total_insumos
       FROM solicitud s
       JOIN solicitud_insumo si ON s.id_solicitud = si.id_solicitud
       JOIN insumo i            ON si.id_insumo   = i.id_insumo
       WHERE s.id_empleado = ?
       GROUP BY s.id_solicitud
       ORDER BY s.fecha DESC`,
      [id_empleado]
    );
    return rows;
  },

  getById: async (id_solicitud) => {
    const [[solicitud]] = await pool.query(
      `SELECT s.id_solicitud, s.folio_solicitud, s.fecha, s.estatus, s.prioridad,
              s.id_empleado,
              CONCAT(e.nombre,' ',e.ap_paterno,' ',IFNULL(e.ap_materno,'')) AS nombre_empleado,
              d.nombre_departamento
       FROM solicitud s
       JOIN empleado e    ON s.id_empleado    = e.id_empleado
       LEFT JOIN departamento d ON e.id_departamento = d.id_departamento
       WHERE s.id_solicitud = ?`,
      [id_solicitud]
    );
    if (!solicitud) return null;
    const [detalle] = await pool.query(
      `SELECT si.id_solicitud_insumo, si.cantidad,
              i.id_insumo, i.nombre, i.marca, i.modelo, i.num_serie, i.stock, i.estado
       FROM solicitud_insumo si
       JOIN insumo i ON si.id_insumo = i.id_insumo
       WHERE si.id_solicitud = ?`,
      [id_solicitud]
    );
    return { ...solicitud, detalle };
  },

  getAll: async ({ limit = 100, offset = 0 } = {}) => {
    const [rows] = await pool.query(
      `SELECT s.id_solicitud, s.folio_solicitud, s.fecha, s.estatus, s.prioridad,
              CONCAT(e.nombre,' ',e.ap_paterno,' ',IFNULL(e.ap_materno,'')) AS nombre_empleado,
              d.nombre_departamento,
              COUNT(si.id_solicitud_insumo) AS total_insumos,
              SUM(si.cantidad) AS total_piezas
       FROM solicitud s
       JOIN empleado e          ON s.id_empleado      = e.id_empleado
       LEFT JOIN departamento d ON e.id_departamento  = d.id_departamento
       JOIN solicitud_insumo si ON s.id_solicitud     = si.id_solicitud
       GROUP BY s.id_solicitud
       ORDER BY s.fecha DESC
       LIMIT ? OFFSET ?`,
      [limit, offset]
    );
    const [[{ total }]] = await pool.query(`SELECT COUNT(*) AS total FROM solicitud`);
    return { rows, total };
  },

  actualizarEstatus: async (id_solicitud, estatus) => {
    const PERMITIDOS = new Set(["En proceso", "Resuelto", "No Resuelto"]);
    if (!PERMITIDOS.has(estatus)) throw new Error("Estatus no válido");
    const [result] = await pool.query(
      "UPDATE solicitud SET estatus = ? WHERE id_solicitud = ?",
      [estatus, id_solicitud]
    );
    return result.affectedRows > 0;
  },
};

export default Solicitud;
