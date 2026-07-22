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
import { generarFolio } from "../utils/helpers.js";
import { cache } from "../Config/cache.js";

const CACHE_TTL_METRICAS = 2 * 60 * 1000; // 2 minutos
const CACHE_TTL_ADMINS   = 5 * 60 * 1000; // 5 minutos

const Ticket = {
  crear: async ({ titulo, descripcion, prioridad, id_empleado, id_categoria }) => {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      // Delega al helper centralizado con bloqueo FOR UPDATE anti race-condition
      const folio_ticket = await generarFolio(conn, "ticket", "folio_ticket", "PTP");

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
              TRIM(CONCAT(e.nombre, ' ', e.ap_paterno, IF(e.ap_materno IS NOT NULL AND e.ap_materno != '', CONCAT(' ', e.ap_materno), ''))) AS nombre_empleado,
              d.nombre_departamento,
              TRIM(CONCAT(r.nombre, ' ', r.ap_paterno, IF(r.ap_materno IS NOT NULL AND r.ap_materno != '', CONCAT(' ', r.ap_materno), ''))) AS resuelto_por
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

  getByEmpleado: async (id_empleado, { limit = 50, offset = 0, estatus, prioridad, categoria, q } = {}) => {
    const conditions = ["t.id_empleado = ?"];
    const params     = [id_empleado];
    if (estatus)   { conditions.push("t.estatus = ?");           params.push(estatus); }
    if (prioridad) { conditions.push("t.prioridad = ?");         params.push(prioridad); }
    if (categoria) { conditions.push("c.nombre_categoria = ?"); params.push(categoria); }
    if (q)         { conditions.push("(t.folio_ticket LIKE ? OR t.titulo LIKE ?)"); params.push(`%${q}%`, `%${q}%`); }
    const WHERE = `WHERE ${conditions.join(" AND ")}`;
    const BASE_JOINS = `
       FROM ticket t
       LEFT JOIN categoria c      ON t.id_categoria     = c.id_categoria
       LEFT JOIN empleado  e      ON t.id_empleado      = e.id_empleado
       LEFT JOIN empleado  r      ON t.id_tecnico       = r.id_empleado
       LEFT JOIN departamento dep ON e.id_departamento  = dep.id_departamento`;
    const [[{ total }]] = await pool.query(`SELECT COUNT(*) AS total ${BASE_JOINS} ${WHERE}`, params);
    const [rows] = await pool.query(
      `SELECT t.id_ticket, t.folio_ticket, t.titulo, t.descripcion,
              t.estatus, t.prioridad, t.fecha_subido, t.fecha_resuelto,
              t.comentarios, t.calificacion, t.id_categoria,
              c.nombre_categoria,
              TRIM(CONCAT(e.nombre, ' ', e.ap_paterno, IF(e.ap_materno IS NOT NULL AND e.ap_materno != '', CONCAT(' ', e.ap_materno), ''))) AS nombre_empleado,
              dep.nombre_departamento,
              TRIM(CONCAT(r.nombre, ' ', r.ap_paterno, IF(r.ap_materno IS NOT NULL AND r.ap_materno != '', CONCAT(' ', r.ap_materno), ''))) AS resuelto_por
       ${BASE_JOINS} ${WHERE}
       ORDER BY t.fecha_subido DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );
    return { rows, total };
  },

  actualizar: async (id_ticket, { comentarios, estatus, id_resuelto_por }) => {
    const ESTATUS_PERMITIDOS = new Set(["En proceso", "Resuelto", "No Resuelto", "Cancelado"]);
    if (!ESTATUS_PERMITIDOS.has(estatus)) throw new Error("Estatus no válido");

    // Obtener estado actual para validar transiciones y registrar historial
    const [[anterior]] = await pool.query(
      "SELECT estatus FROM ticket WHERE id_ticket = ? LIMIT 1", [id_ticket]
    );
    if (!anterior) return null;

    // Guard: un ticket cerrado no puede reabrirse vía esta ruta
    const CERRADOS = new Set(["Resuelto", "No Resuelto", "Cancelado"]);
    if (CERRADOS.has(anterior.estatus) && !CERRADOS.has(estatus)) {
      const err = new Error("El ticket ya está cerrado y no puede reabrirse");
      err.status = 409;
      throw err;
    }

    const esCerrado = estatus === "Resuelto" || estatus === "No Resuelto" || estatus === "Cancelado";
    const esEnProceso = estatus === "En proceso";
    const params = esCerrado
      ? [comentarios ?? null, estatus, id_resuelto_por ?? null, id_ticket]
      : esEnProceso && id_resuelto_por
        ? [comentarios ?? null, estatus, id_resuelto_por, id_ticket]
        : [comentarios ?? null, estatus, id_ticket];
    const sql = esCerrado
      ? "UPDATE ticket SET comentarios = ?, estatus = ?, fecha_resuelto = NOW(), id_tecnico = ? WHERE id_ticket = ?"
      : esEnProceso && id_resuelto_por
        ? "UPDATE ticket SET comentarios = ?, estatus = ?, id_tecnico = ? WHERE id_ticket = ?"
        : "UPDATE ticket SET comentarios = ?, estatus = ? WHERE id_ticket = ?";

    const [result] = await pool.query(sql, params);
    if (result.affectedRows === 0) return null;

    const [rows] = await pool.query(
      `SELECT t.estatus, t.fecha_resuelto,
              TRIM(CONCAT(e.nombre,' ',e.ap_paterno,IF(e.ap_materno IS NOT NULL AND e.ap_materno != '',CONCAT(' ',e.ap_materno),''))) AS resuelto_por
       FROM ticket t
       LEFT JOIN empleado e ON t.id_tecnico = e.id_empleado
       WHERE t.id_ticket = ? LIMIT 1`,
      [id_ticket]
    );
    return rows[0] || null;
  },

  editarPorUsuario: async (id_ticket, { titulo, descripcion, prioridad, id_categoria, estatus, comentarios }) => {
    // Solo "En proceso" es editable por usuario — nunca "Cancelado" (eso va por cancelar())
    const sets = ["titulo = ?", "descripcion = ?", "prioridad = ?", "id_categoria = ?"];
    const vals = [titulo, descripcion, prioridad, id_categoria];
    if (estatus === "En proceso") {
      sets.push("estatus = ?");
      vals.push(estatus);
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
    // Solo cierra tickets SIN técnico asignado: si ya tiene técnico se le dio
    // seguimiento y el SLA corre desde la asignación, no desde la creación.
    const [tickets] = await pool.query(
      `SELECT t.id_ticket, t.folio_ticket, t.titulo, t.id_empleado,
              CONCAT(e.nombre,' ',e.ap_paterno) AS nombre_empleado,
              e.email AS email_empleado
       FROM ticket t
       JOIN empleado e ON t.id_empleado = e.id_empleado
       WHERE t.estatus = 'En proceso'
       AND t.id_tecnico IS NULL
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
    cache.del("metricas:dashboard");
    return tickets;
  },

  cancelar: async (id_ticket, id_empleado) => {
    // Solo el dueño puede cancelar y solo si está En proceso
    const [[ticket]] = await pool.query(
      `SELECT id_empleado, estatus FROM ticket WHERE id_ticket = ? LIMIT 1`,
      [id_ticket]
    );
    if (!ticket) return { error: "not_found" };
    if (ticket.id_empleado !== id_empleado) return { error: "forbidden" };
    if (ticket.estatus !== "En proceso") return { error: "not_allowed" };
    await pool.query(
      `UPDATE ticket SET estatus = 'Cancelado', fecha_resuelto = NOW() WHERE id_ticket = ?`,
      [id_ticket]
    );
    return { ok: true };
  },

  getTecnicos: async () => {
    const hit = cache.get("ticket:tecnicos");
    if (hit) return hit;
    const [rows] = await pool.query(
      `SELECT e.id_empleado,
              CONCAT(e.nombre,' ',e.ap_paterno,' ',IFNULL(e.ap_materno,'')) AS nombre_completo
       FROM empleado e
       WHERE e.id_rol = 1 AND e.estatus = 'Activo'
       ORDER BY e.nombre ASC`
    );
    cache.set("ticket:tecnicos", rows, CACHE_TTL_ADMINS);
    return rows;
  },

  getMetricas: async () => {
    const CACHE_KEY = "metricas:dashboard";
    const cached = cache.get(CACHE_KEY);
    if (cached) return cached;

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

    const result = { promedio_horas: promedio_horas ?? 0, porDepartamento, tendencia };
    cache.set(CACHE_KEY, result, CACHE_TTL_METRICAS);
    return result;
  },

  getAdmins: async () => {
    const hit = cache.get("ticket:admins");
    if (hit) return hit;
    const [rows] = await pool.query(
      `SELECT e.id_empleado,
              CONCAT(e.nombre,' ',e.ap_paterno,' ',IFNULL(e.ap_materno,'')) AS nombre_completo
       FROM empleado e
       WHERE e.id_rol = 1 AND e.estatus = 'Activo'
       ORDER BY e.nombre ASC`
    );
    cache.set("ticket:admins", rows, CACHE_TTL_ADMINS);
    return rows;
  },

  getReporte: async ({ fecha_inicio, fecha_fin, id_tecnico, estatus, prioridad, usuario, area, sucursal, q }) => {
    const reFecha = /^\d{4}-\d{2}-\d{2}$/;
    if (!reFecha.test(fecha_inicio) || !reFecha.test(fecha_fin))
      throw Object.assign(new Error("Formato de fecha inválido. Use YYYY-MM-DD"), { status: 400 });
    if (fecha_inicio > fecha_fin)
      throw Object.assign(new Error("fecha_inicio no puede ser posterior a fecha_fin"), { status: 400 });
    const idTecnico = id_tecnico ? parseInt(id_tecnico, 10) : null;
    if (id_tecnico && (!Number.isInteger(idTecnico) || idTecnico <= 0))
      throw Object.assign(new Error("id_tecnico debe ser un entero positivo"), { status: 400 });

    const conditions = ["DATE(t.fecha_subido) BETWEEN ? AND ?"];
    const params     = [fecha_inicio, fecha_fin];

    if (idTecnico) { conditions.push("t.id_tecnico = ?");   params.push(idTecnico); }
    if (estatus)   { conditions.push("t.estatus = ?");      params.push(estatus); }
    if (prioridad) { conditions.push("t.prioridad = ?");    params.push(prioridad); }
    if (area)      { conditions.push("dep.nombre_departamento = ?"); params.push(area); }
    if (sucursal)  { conditions.push("s.nombre_sucursal = ?");      params.push(sucursal); }
    if (usuario)   { conditions.push("REGEXP_REPLACE(TRIM(CONCAT(e.nombre,' ',e.ap_paterno,IF(e.ap_materno IS NOT NULL AND e.ap_materno!='',CONCAT(' ',e.ap_materno),''))), ' +', ' ') = ?"); params.push(usuario.replace(/\s+/g, ' ').trim()); }
    if (q)         { conditions.push("(t.folio_ticket LIKE ? OR t.titulo LIKE ?)"); params.push(`%${q}%`, `%${q}%`); }

    const [rows] = await pool.query(
      `SELECT t.folio_ticket, t.titulo, t.estatus, t.prioridad,
              t.fecha_subido, t.fecha_resuelto, t.calificacion,
              c.nombre_categoria,
              CONCAT(e.nombre,' ',e.ap_paterno,' ',IFNULL(e.ap_materno,'')) AS nombre_empleado,
              dep.nombre_departamento,
              s.nombre_sucursal,
              CONCAT(r.nombre,' ',r.ap_paterno,' ',IFNULL(r.ap_materno,'')) AS resuelto_por
       FROM ticket t
       LEFT JOIN categoria c      ON t.id_categoria    = c.id_categoria
       LEFT JOIN empleado  e      ON t.id_empleado     = e.id_empleado
       LEFT JOIN departamento dep ON e.id_departamento = dep.id_departamento
       LEFT JOIN sucursal s       ON e.id_sucursal     = s.id_sucursal
       LEFT JOIN empleado  r      ON t.id_tecnico      = r.id_empleado
       WHERE ${conditions.join(" AND ")}
       ORDER BY t.fecha_subido DESC`,
      params
    );
    return rows;
  },

  getRendimientoTecnicos: async ({ fecha_inicio, fecha_fin } = {}) => {
    const reFecha = /^\d{4}-\d{2}-\d{2}$/;
    const params = [];
    const fechasValidas = fecha_inicio && fecha_fin && reFecha.test(fecha_inicio) && reFecha.test(fecha_fin);
    if (fechasValidas) {
      if (fecha_inicio > fecha_fin)
        throw Object.assign(new Error("fecha_inicio no puede ser posterior a fecha_fin"), { status: 400 });
      params.push(fecha_inicio, fecha_fin);
    }

    const cacheKey = `rendimiento:${fecha_inicio ?? ""}:${fecha_fin ?? ""}`;
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    // Filtramos los tickets con la condición de fechas (si aplica)
    const ticketFilter = fechasValidas
      ? `AND DATE(t.fecha_subido) BETWEEN ? AND ?`
      : ``;

    const [rows] = await pool.query(
      `SELECT
         tec.id_empleado AS id_tecnico,
         CONCAT(tec.nombre,' ',tec.ap_paterno,' ',IFNULL(tec.ap_materno,'')) AS nombre_tecnico,
         COUNT(t.id_ticket) AS total_atendidos,
         COALESCE(SUM(t.estatus = 'Resuelto'), 0) AS resueltos,
         COALESCE(SUM(t.estatus = 'No Resuelto'), 0) AS no_resueltos,
         ROUND(AVG(CASE WHEN t.estatus='Resuelto' AND t.fecha_resuelto IS NOT NULL
           THEN TIMESTAMPDIFF(HOUR, t.fecha_subido, t.fecha_resuelto) END), 1) AS promedio_horas,
         MIN(CASE WHEN t.estatus='Resuelto' AND t.fecha_resuelto IS NOT NULL
           THEN TIMESTAMPDIFF(HOUR, t.fecha_subido, t.fecha_resuelto) END) AS min_horas,
         MAX(CASE WHEN t.estatus='Resuelto' AND t.fecha_resuelto IS NOT NULL
           THEN TIMESTAMPDIFF(HOUR, t.fecha_subido, t.fecha_resuelto) END) AS max_horas,
         ROUND(AVG(CASE WHEN t.calificacion > 0 THEN t.calificacion END), 2) AS calificacion_promedio,
         COUNT(CASE WHEN t.calificacion > 0 THEN 1 END) AS total_calificaciones,
         COALESCE(SUM(t.prioridad IN ('Alta','Urgente') AND t.estatus='Resuelto'), 0) AS alta_prioridad_resueltos,
         (SELECT COUNT(*) FROM ticket ta WHERE ta.id_tecnico = tec.id_empleado AND ta.estatus = 'En proceso') AS en_proceso_activos,
         COALESCE(SUM(t.estatus = 'Cancelado'), 0) AS tickets_cancelados,
         ROUND(
           100.0 * COUNT(CASE WHEN t.calificacion > 0 THEN 1 END) /
           NULLIF(SUM(t.estatus = 'Resuelto'), 0)
         , 1) AS pct_calificados,
         COALESCE(SUM(
           t.estatus = 'Resuelto' AND t.fecha_resuelto IS NOT NULL
           AND TIMESTAMPDIFF(HOUR, t.fecha_subido, t.fecha_resuelto) <= 48
         ), 0) AS resueltos_a_tiempo
       FROM empleado tec
       LEFT JOIN ticket t
         ON t.id_tecnico = tec.id_empleado
         AND (t.estatus IN ('Resuelto','No Resuelto','Cancelado'))
         ${ticketFilter}
       WHERE tec.id_rol = 1 AND tec.estatus = 'Activo'
       GROUP BY tec.id_empleado
       ORDER BY resueltos DESC`,
      params
    );
    cache.set(cacheKey, rows, 2 * 60 * 1000); // 2 minutos
    return rows;
  },

  getAll: async ({ limit = 100, offset = 0, estatus, prioridad, q, fecha_inicio, fecha_fin, tecnico, usuario, area, sucursal } = {}) => {
    const conditions = [];
    const params     = [];

    if (estatus)      { conditions.push("t.estatus = ?");    params.push(estatus); }
    if (prioridad)    { conditions.push("t.prioridad = ?");  params.push(prioridad); }
    if (fecha_inicio) { conditions.push("DATE(t.fecha_subido) >= ?"); params.push(fecha_inicio); }
    if (fecha_fin)    { conditions.push("DATE(t.fecha_subido) <= ?"); params.push(fecha_fin); }
    if (q) {
      conditions.push("(t.folio_ticket LIKE ? OR t.titulo LIKE ?)");
      params.push(`%${q}%`, `%${q}%`);
    }
    if (tecnico)  { conditions.push("REGEXP_REPLACE(TRIM(CONCAT(r.nombre,' ',r.ap_paterno,IF(r.ap_materno IS NOT NULL AND r.ap_materno!='',CONCAT(' ',r.ap_materno),''))), ' +', ' ') = ?"); params.push(tecnico.replace(/\s+/g, ' ').trim()); }
    if (usuario)  { conditions.push("REGEXP_REPLACE(TRIM(CONCAT(e.nombre,' ',e.ap_paterno,IF(e.ap_materno IS NOT NULL AND e.ap_materno!='',CONCAT(' ',e.ap_materno),''))), ' +', ' ') = ?"); params.push(usuario.replace(/\s+/g, ' ').trim()); }
    if (area)     { conditions.push("d.nombre_departamento = ?"); params.push(area); }
    if (sucursal) { conditions.push("s.nombre_sucursal = ?");     params.push(sucursal); }

    const BASE_JOINS = `
       FROM ticket t
       LEFT JOIN categoria c    ON t.id_categoria    = c.id_categoria
       LEFT JOIN empleado  e    ON t.id_empleado     = e.id_empleado
       LEFT JOIN departamento d ON e.id_departamento = d.id_departamento
       LEFT JOIN sucursal s     ON e.id_sucursal     = s.id_sucursal
       LEFT JOIN empleado  r    ON t.id_tecnico      = r.id_empleado`;

    const WHERE = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) AS total ${BASE_JOINS} ${WHERE}`,
      params
    );
    const [rows] = await pool.query(
      `SELECT t.id_ticket, t.folio_ticket, t.titulo, t.descripcion,
              t.estatus, t.prioridad, t.fecha_subido, t.fecha_resuelto,
              t.comentarios, t.calificacion, t.id_tecnico,
              c.nombre_categoria,
              TRIM(CONCAT(e.nombre, ' ', e.ap_paterno, IF(e.ap_materno IS NOT NULL AND e.ap_materno != '', CONCAT(' ', e.ap_materno), ''))) AS nombre_empleado,
              d.nombre_departamento,
              s.nombre_sucursal,
              TRIM(CONCAT(r.nombre, ' ', r.ap_paterno, IF(r.ap_materno IS NOT NULL AND r.ap_materno != '', CONCAT(' ', r.ap_materno), ''))) AS resuelto_por
       ${BASE_JOINS}
       ${WHERE}
       ORDER BY t.fecha_subido DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );
    return { rows, total };
  },
};

export default Ticket;
