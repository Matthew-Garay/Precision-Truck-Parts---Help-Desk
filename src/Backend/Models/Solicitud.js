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
        "SELECT folio_solicitud FROM solicitud WHERE folio_solicitud LIKE ? ORDER BY id_solicitud DESC LIMIT 1 FOR UPDATE",
        [`${prefijo}%`]
      );
      const ultimo = rows[0]?.folio_solicitud;
      const num    = ultimo ? parseInt(ultimo.split("-")[2]) + 1 : 1;
      const folio  = `${prefijo}${String(num).padStart(3, "0")}`;

      const [result] = await conn.query(
        `INSERT INTO solicitud (folio_solicitud, prioridad, id_empleado) VALUES (?, ?, ?)`,
        [folio, prioridad, id_empleado]
      );
      const id_solicitud = result.insertId;
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
    const [[{ total }]] = await pool.query("SELECT COUNT(*) AS total FROM solicitud");
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
