/**
 * Ticket.js
 *
 * Modelo que encapsula todas las operaciones sobre la tabla `ticket`.
 * Un ticket representa un reporte de incidencia tecnica que un empleado
 * crea y un administrador o tecnico atiende y cierra.
 *
 * Metodos:
 *
 *   crear({ titulo, descripcion, prioridad, id_empleado, id_categoria })
 *     Opera dentro de una transaccion. Genera el folio con formato
 *     PTP-{anno}{mes}-{numero} usando FOR UPDATE para evitar folios duplicados
 *     bajo concurrencia. Inserta el ticket con estatus inicial "En proceso".
 *
 *   getFolioById(id_ticket)
 *     Retorna solo el folio_ticket. Se usa cuando se necesita construir rutas
 *     de archivos sin traer todos los campos del ticket.
 *
 *   getById(id_ticket)
 *     Retorna el detalle completo del ticket con datos del empleado dueno,
 *     departamento, categoria y tecnico que lo resolvio (si aplica).
 *
 *   getByEmpleado(id_empleado)
 *     Retorna todos los tickets de un empleado ordenados del mas reciente
 *     al mas antiguo con datos completos incluyendo tecnico y departamento.
 *
 *   actualizar(id_ticket, { comentarios, estatus, id_resuelto_por })
 *     Actualiza estatus y comentarios del ticket. Si el nuevo estatus es
 *     "Resuelto" o "No Resuelto" establece fecha_resuelto = NOW() y guarda
 *     el id del tecnico en id_tecnico. Retorna null si el ticket no existe.
 *     Retorna los campos actualizados (estatus, fecha_resuelto, resuelto_por).
 *
 *   editarPorUsuario(id_ticket, campos)
 *     Permite al empleado editar titulo, descripcion, prioridad y categoria.
 *     Solo funciona si el estatus actual del ticket es "En proceso".
 *     Opcionalmente puede cambiar el estatus y comentarios.
 *
 *   guardarCalificacion(id_ticket, calificacion)
 *     Guarda la calificacion (1-5) del empleado sobre la atencion recibida.
 *     Lanza Error 409 si el ticket ya fue calificado previamente.
 *     Lanza Error 400 si el ticket no esta en estatus "Resuelto".
 *
 *   cerrarVencidos()
 *     Busca todos los tickets en estado "En proceso" que llevan mas de 2 dias
 *     sin fecha de resolucion y los cierra como "No Resuelto".
 *     Retorna el arreglo de tickets cerrados con datos del empleado para que
 *     el worker pueda enviar notificaciones.
 *
 *   getMetricas()
 *     Retorna tres conjuntos de datos para el dashboard administrativo:
 *       - promedio_horas: tiempo promedio de resolucion de tickets resueltos
 *       - porDepartamento: total y resueltos agrupados por departamento
 *       - tendencia: conteo mensual de los ultimos 6 meses desglosado por estatus
 *
 *   getAdmins() / getTecnicos()
 *     Retornan empleados con rol 1 y estatus Activo. Se usan en formularios
 *     para seleccionar al tecnico asignado.
 *
 *   getReporte({ fecha_inicio, fecha_fin, id_tecnico })
 *     Retorna tickets en un rango de fechas con filtro opcional por tecnico.
 *     Valida el formato de las fechas con regex antes de ejecutar la consulta.
 *
 *   getAll({ limit, offset })
 *     Retorna todos los tickets paginados con SQL_CALC_FOUND_ROWS.
 */
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
        "SELECT folio_ticket FROM ticket WHERE folio_ticket LIKE ? ORDER BY CAST(SUBSTRING_INDEX(folio_ticket, '-', -1) AS UNSIGNED) DESC LIMIT 1 FOR UPDATE",
        [`${prefijo}%`]
      );
      const ultimo = rows[0]?.folio_ticket;
      const num    = ultimo ? parseInt(ultimo.split("-").pop(), 10) + 1 : 1;
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

  getById: async (id_ticket) => {
    const [rows] = await pool.query(
      `SELECT t.id_ticket, t.folio_ticket, t.titulo, t.descripcion,
              t.estatus, t.prioridad, t.fecha_subido, t.fecha_resuelto,
              t.comentarios, t.calificacion, t.id_categoria, t.id_empleado,
              c.nombre_categoria,
              CONCAT(e.nombre, ' ', e.ap_paterno, ' ', IFNULL(e.ap_materno,'')) AS nombre_empleado,
              d.nombre_departamento,
              CONCAT(r.nombre, ' ', r.ap_paterno, ' ', IFNULL(r.ap_materno,'')) AS resuelto_por
       FROM ticket t
       LEFT JOIN categoria c ON t.id_categoria = c.id_categoria
       LEFT JOIN empleado  e ON t.id_empleado  = e.id_empleado
       LEFT JOIN departamento d ON e.id_departamento = d.id_departamento
       LEFT JOIN empleado  r ON t.id_tecnico = r.id_empleado
       WHERE t.id_ticket = ? LIMIT 1`,
      [id_ticket]
    );
    return rows[0] || null;
  },

  getByEmpleado: async (id_empleado) => {
    const [rows] = await pool.query(
      `SELECT t.id_ticket, t.folio_ticket, t.titulo, t.descripcion,
              t.estatus, t.prioridad, t.fecha_subido, t.fecha_resuelto,
              t.comentarios, t.calificacion, t.id_categoria,
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
    const esResuelto  = estatus === "Resuelto";
    const esCerrado   = estatus === "Resuelto" || estatus === "No Resuelto";
    const params = esCerrado
      ? [comentarios ?? null, estatus, id_resuelto_por ?? null, id_ticket]
      : [comentarios ?? null, estatus, id_ticket];
    const sql = esCerrado
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

  editarPorUsuario: async (id_ticket, { titulo, descripcion, prioridad, id_categoria, estatus, comentarios }) => {
    const ESTATUS_EDITABLES = new Set(["En proceso", "Resuelto", "No Resuelto"]);
    const sets = ["titulo = ?", "descripcion = ?", "prioridad = ?", "id_categoria = ?"];
    const vals = [titulo, descripcion, prioridad, id_categoria];
    if (estatus && ESTATUS_EDITABLES.has(estatus)) {
      sets.push("estatus = ?");
      vals.push(estatus);
      if (estatus === "Resuelto" || estatus === "No Resuelto") {
        sets.push("fecha_resuelto = NOW()");
      }
    }
    if (comentarios !== undefined) { sets.push("comentarios = ?"); vals.push(comentarios ?? null); }
    vals.push(id_ticket);
    const [result] = await pool.query(
      `UPDATE ticket SET ${sets.join(", ")} WHERE id_ticket = ? AND estatus IN ('En proceso')`,
      vals
    );
    return result.affectedRows > 0;
  },

  guardarCalificacion: async (id_ticket, calificacion) => {
    // Impedir calificar si ya tiene una calificacion previa
    const [[ticket]] = await pool.query(
      `SELECT calificacion, estatus FROM ticket WHERE id_ticket = ? LIMIT 1`,
      [id_ticket]
    );
    if (!ticket) return null;
    if (ticket.calificacion !== null)
      throw Object.assign(new Error("Este ticket ya fue calificado"), { status: 409 });
    if (ticket.estatus !== "Resuelto")
      throw Object.assign(new Error("Solo se pueden calificar tickets resueltos"), { status: 400 });
    const [result] = await pool.query(
      `UPDATE ticket SET calificacion = ? WHERE id_ticket = ?`,
      [calificacion, id_ticket]
    );
    return result.affectedRows > 0;
  },

  cerrarVencidos: async () => {
    const [tickets] = await pool.query(
      `SELECT t.id_ticket, t.folio_ticket, t.titulo, t.id_empleado,
              CONCAT(e.nombre,' ',e.ap_paterno) AS nombre_empleado,
              e.email AS email_empleado
       FROM ticket t
       JOIN empleado e ON t.id_empleado = e.id_empleado
       WHERE t.estatus = 'En proceso'
       AND t.fecha_subido <= DATE_SUB(NOW(), INTERVAL 2 DAY)
       AND t.fecha_resuelto IS NULL`
    );
    if (tickets.length === 0) return [];
    const ids = tickets.map(t => t.id_ticket);
    await pool.query(
      `UPDATE ticket
       SET estatus = 'No Resuelto', fecha_resuelto = NOW()
       WHERE id_ticket IN (?)`,
      [ids]
    );
    return tickets;
  },

  getTecnicos: async () => {
    const [rows] = await pool.query(
      `SELECT e.id_empleado,
              CONCAT(e.nombre,' ',e.ap_paterno,' ',IFNULL(e.ap_materno,'')) AS nombre_completo
       FROM empleado e
       WHERE e.id_rol = 1 AND e.estatus = 'Activo'
       ORDER BY e.nombre ASC`
    );
    return rows;
  },

  getMetricas: async () => {
    // Tiempo promedio de resolución (en horas) de tickets resueltos
    const [[{ promedio_horas }]] = await pool.query(
      `SELECT ROUND(AVG(TIMESTAMPDIFF(HOUR, fecha_subido, fecha_resuelto)), 1) AS promedio_horas
       FROM ticket WHERE estatus = 'Resuelto' AND fecha_resuelto IS NOT NULL`
    );

    // Tickets por departamento
    const [porDepartamento] = await pool.query(
      `SELECT d.nombre_departamento AS departamento,
              COUNT(*) AS total,
              SUM(t.estatus = 'Resuelto') AS resueltos
       FROM ticket t
       LEFT JOIN empleado e ON t.id_empleado = e.id_empleado
       LEFT JOIN departamento d ON e.id_departamento = d.id_departamento
       GROUP BY d.id_departamento, d.nombre_departamento
       ORDER BY total DESC`
    );

    // Tendencia mensual - últimos 6 meses
    const [tendenciaRaw] = await pool.query(
      `SELECT DATE_FORMAT(fecha_subido, '%Y-%m') AS mes,
              COUNT(*) AS total,
              CAST(SUM(estatus = 'Resuelto') AS UNSIGNED) AS resueltos,
              CAST(SUM(estatus = 'No Resuelto') AS UNSIGNED) AS no_resueltos,
              CAST(SUM(estatus = 'En proceso') AS UNSIGNED) AS en_proceso
       FROM ticket
       WHERE fecha_subido >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
       GROUP BY mes
       ORDER BY mes ASC`
    );
    const tendencia = tendenciaRaw.map(r => ({
      mes:         r.mes,
      total:       Number(r.total),
      resueltos:   Number(r.resueltos),
      no_resueltos: Number(r.no_resueltos),
      en_proceso:  Number(r.en_proceso),
    }));

    return { promedio_horas: promedio_horas ?? 0, porDepartamento, tendencia };
  },

  getAdmins: async () => {
    const [rows] = await pool.query(
      `SELECT e.id_empleado,
              CONCAT(e.nombre,' ',e.ap_paterno,' ',IFNULL(e.ap_materno,'')) AS nombre_completo
       FROM empleado e
       WHERE e.id_rol = 1 AND e.estatus = 'Activo'
       ORDER BY e.nombre ASC`
    );
    return rows;
  },

  getReporte: async ({ fecha_inicio, fecha_fin, id_tecnico }) => {
    const reFecha = /^\d{4}-\d{2}-\d{2}$/;
    if (!reFecha.test(fecha_inicio) || !reFecha.test(fecha_fin))
      throw Object.assign(new Error("Formato de fecha inválido. Use YYYY-MM-DD"), { status: 400 });
    const idTecnico = id_tecnico ? parseInt(id_tecnico, 10) : null;
    if (id_tecnico && (!Number.isInteger(idTecnico) || idTecnico <= 0))
      throw Object.assign(new Error("id_tecnico debe ser un entero positivo"), { status: 400 });

    const BASE_SELECT = `
      SELECT t.folio_ticket, t.titulo, t.estatus, t.prioridad,
             t.fecha_subido, t.fecha_resuelto, t.calificacion,
             c.nombre_categoria,
             CONCAT(e.nombre,' ',e.ap_paterno,' ',IFNULL(e.ap_materno,'')) AS nombre_empleado,
             dep.nombre_departamento,
             CONCAT(r.nombre,' ',r.ap_paterno,' ',IFNULL(r.ap_materno,'')) AS resuelto_por
      FROM ticket t
      LEFT JOIN categoria c      ON t.id_categoria    = c.id_categoria
      LEFT JOIN empleado  e      ON t.id_empleado     = e.id_empleado
      LEFT JOIN departamento dep ON e.id_departamento = dep.id_departamento
      LEFT JOIN empleado  r      ON t.id_tecnico      = r.id_empleado`;

    const [rows] = idTecnico
      ? await pool.query(
          `${BASE_SELECT} WHERE DATE(t.fecha_subido) BETWEEN ? AND ? AND t.id_tecnico = ? ORDER BY t.fecha_subido DESC`,
          [fecha_inicio, fecha_fin, idTecnico]
        )
      : await pool.query(
          `${BASE_SELECT} WHERE DATE(t.fecha_subido) BETWEEN ? AND ? ORDER BY t.fecha_subido DESC`,
          [fecha_inicio, fecha_fin]
        );
    return rows;
  },

  getAll: async ({ limit = 100, offset = 0 } = {}) => {
    const [rows] = await pool.query(
      `SELECT t.id_ticket, t.folio_ticket, t.titulo, t.descripcion,
              t.estatus, t.prioridad, t.fecha_subido, t.fecha_resuelto,
              t.comentarios, t.calificacion, t.id_tecnico,
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
    const [[{ total }]] = await pool.query(`SELECT COUNT(*) AS total FROM ticket`);
    return { rows, total };
  },
};

export default Ticket;
