import pool from "../Config/db.js";

const Ticket = {
  crear: async ({ titulo, descripcion, prioridad, id_empleado, id_categoria }) => {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      // Bloqueo exclusivo sobre los folios del mes actual para evitar race condition
      const ahora   = new Date();
      const anio    = ahora.getFullYear();
      const mes     = String(ahora.getMonth() + 1).padStart(2, "0");
      const prefijo = `PTP-${anio}${mes}-`;

      const [rows] = await conn.query(
        "SELECT folio_ticket FROM ticket WHERE folio_ticket LIKE ? ORDER BY id_ticket DESC LIMIT 1 FOR UPDATE",
        [`${prefijo}%`]
      );
      const ultimo = rows[0]?.folio_ticket;
      const num    = ultimo ? parseInt(ultimo.split("-")[2]) + 1 : 1;
      const folio_ticket = `${prefijo}${String(num).padStart(3, "0")}`;

      const [result] = await conn.query(
        `INSERT INTO ticket (folio_ticket, titulo, descripcion, estatus, prioridad, id_empleado, id_categoria)
         VALUES (?, ?, ?, 'En proceso', ?, ?, ?)`,
        [folio_ticket, titulo, descripcion, prioridad, id_empleado, id_categoria]
      );

      await conn.commit();
      return { id_ticket: result.insertId, folio_ticket };
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  },

  getFolioById: async (id_ticket) => {
    const [rows] = await pool.query(
      "SELECT folio_ticket FROM ticket WHERE id_ticket = ? LIMIT 1",
      [id_ticket]
    );
    return rows[0] || null;
  },

  getByEmpleado: async (id_empleado) => {
    const [rows] = await pool.query(
      `SELECT t.id_ticket, t.folio_ticket, t.titulo, t.descripcion,
              t.estatus, t.prioridad, t.fecha_subido, t.fecha_resuelto,
              t.comentarios, t.calificacion,
              c.nombre_categoria,
              CONCAT(e.nombre, ' ', e.ap_paterno, ' ', IFNULL(e.ap_materno,'')) AS nombre_empleado,
              dep.nombre_departamento,
              CONCAT(r.nombre, ' ', r.ap_paterno, ' ', IFNULL(r.ap_materno,'')) AS resuelto_por
       FROM ticket t
       LEFT JOIN categoria c   ON t.id_categoria  = c.id_categoria
       LEFT JOIN empleado  e   ON t.id_empleado   = e.id_empleado
       LEFT JOIN empleado  r   ON t.id_tecnico    = r.id_empleado
       LEFT JOIN departamento dep ON e.id_departamento = dep.id_departamento
       WHERE t.id_empleado = ?
       ORDER BY t.fecha_subido DESC`,
      [id_empleado]
    );
    return rows;
  },

  actualizar: async (id_ticket, { comentarios, estatus, id_resuelto_por }) => {
    const ESTATUS_PERMITIDOS = new Set(["En proceso", "Resuelto", "No Resuelto"]);
    if (!ESTATUS_PERMITIDOS.has(estatus)) throw new Error("Estatus no válido");
    const esResuelto = estatus === "Resuelto";
    const params = esResuelto
      ? [comentarios ?? null, estatus, id_resuelto_por ?? null, id_ticket]
      : [comentarios ?? null, estatus, id_ticket];
    const sql = esResuelto
      ? "UPDATE ticket SET comentarios = ?, estatus = ?, fecha_resuelto = NOW(), id_tecnico = ? WHERE id_ticket = ?"
      : "UPDATE ticket SET comentarios = ?, estatus = ? WHERE id_ticket = ?";
    const [result] = await pool.query(sql, params);
    if (result.affectedRows === 0) return null;
    const [rows] = await pool.query(
      `SELECT t.estatus, t.fecha_resuelto,
              IFNULL(CONCAT(e.nombre,' ',e.ap_paterno,' ',IFNULL(e.ap_materno,'')), NULL) AS resuelto_por
       FROM ticket t
       LEFT JOIN empleado e ON t.id_tecnico = e.id_empleado
       WHERE t.id_ticket = ? LIMIT 1`,
      [id_ticket]
    );
    return rows[0] || null;
  },

  editarPorUsuario: async (id_ticket, { titulo, descripcion, prioridad, id_categoria }) => {
    const [result] = await pool.query(
      `UPDATE ticket SET titulo = ?, descripcion = ?, prioridad = ?, id_categoria = ?
       WHERE id_ticket = ? AND estatus != 'Resuelto'`,
      [titulo, descripcion, prioridad, id_categoria, id_ticket]
    );
    return result.affectedRows > 0;
  },

  guardarCalificacion: async (id_ticket, calificacion) => {
    const [result] = await pool.query(
      `UPDATE ticket SET calificacion = ? WHERE id_ticket = ?`,
      [calificacion, id_ticket]
    );
    return result.affectedRows > 0;
  },

  getAll: async ({ limit = 100, offset = 0 } = {}) => {
    const [rows] = await pool.query(
      `SELECT t.id_ticket, t.folio_ticket, t.titulo, t.descripcion,
              t.estatus, t.prioridad, t.fecha_subido, t.fecha_resuelto,
              t.comentarios, t.calificacion,
              c.nombre_categoria,
              CONCAT(e.nombre, ' ', e.ap_paterno, ' ', IFNULL(e.ap_materno,'')) AS nombre_empleado,
              d.nombre_departamento,
              CONCAT(r.nombre, ' ', r.ap_paterno, ' ', IFNULL(r.ap_materno,'')) AS resuelto_por
       FROM ticket t
       LEFT JOIN categoria c ON t.id_categoria = c.id_categoria
       LEFT JOIN empleado  e ON t.id_empleado  = e.id_empleado
       LEFT JOIN departamento d ON e.id_departamento = d.id_departamento
       LEFT JOIN empleado  r ON t.id_tecnico = r.id_empleado
       ORDER BY t.fecha_subido DESC
       LIMIT ? OFFSET ?`,
      [limit, offset]
    );
    const [[{ total }]] = await pool.query("SELECT COUNT(*) AS total FROM ticket");
    return { rows, total };
  },
};

export default Ticket;
