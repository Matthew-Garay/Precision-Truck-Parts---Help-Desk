/**
 * solicitudesController.js
 *
 * Controlador que gestiona las solicitudes de insumos, el inventario
 * y las operaciones CRUD sobre los insumos del almacen.
 *
 * Funciones exportadas:
 *
 *   getInsumos
 *     Retorna unicamente los insumos que tienen stock mayor a cero.
 *     Se usa en el formulario de nueva solicitud para mostrar solo lo disponible.
 *
 *   getInventario
 *     Retorna todos los insumos sin filtro de stock, incluyendo los agotados.
 *     Se usa en la vista de inventario del administrador.
 *
 *   getInsumosStockBajo
 *     Retorna los insumos con stock igual o menor a 5 con su nivel de alerta.
 *     Usado por el dashboard para mostrar alertas de reabastecimiento.
 *
 *   crearSolicitud
 *     Valida que el empleado solicitante coincide con el del JWT (un usuario
 *     normal no puede crear solicitudes en nombre de otro). Crea la solicitud
 *     en la base de datos y emite el evento "solicitud:nueva" a los admins
 *     por Socket.io para notificacion en tiempo real.
 *
 *   getSolicitudesByEmpleado
 *     Retorna el historial de solicitudes de un empleado. Solo el dueno o
 *     un administrador puede consultar.
 *
 *   getSolicitudById
 *     Retorna el detalle completo de una solicitud con todos sus insumos.
 *     Aplica el mismo control de acceso que getSolicitudesByEmpleado.
 *
 *   getSolicitudesPendientes
 *     Retorna solicitudes que no estan cerradas (ni Resuelto ni No Resuelto),
 *     ordenadas por prioridad (Urgente > Alta > Media > Baja) y luego por fecha.
 *
 *   getAllSolicitudes
 *     Retorna todas las solicitudes paginadas. Solo para administradores.
 *
 *   actualizarEstatusSolicitud
 *     Si el nuevo estatus es "Resuelto", ejecuta una transaccion que descuenta
 *     el stock de los insumos involucrados, verifica si alguno quedo en nivel
 *     critico (stock <= 5) y emite alertas de stock por Socket.io. Para otros
 *     estatus solo actualiza el campo. En ambos casos emite "solicitud:actualizada"
 *     tanto al empleado dueno como a los admins.
 *
 *   crearInsumo
 *     Crea un nuevo insumo en el inventario y retorna el registro completo
 *     con nombre de categoria. Solo para administradores.
 *
 *   actualizarInsumo
 *     Actualiza los campos de un insumo existente. Solo para administradores.
 *
 *   eliminarInsumo
 *     Elimina un insumo verificando primero que no tenga solicitudes activas
 *     pendientes que lo referencien. Si las tiene retorna 409 Conflict.
 *
 *   getReporteSolicitudes
 *     Retorna solicitudes filtradas por rango de fechas con datos agregados
 *     (total de insumos, total de piezas, detalle concatenado) para exportacion.
 */
import Solicitud from "../Models/Solicitud.js";
import Insumo    from "../Models/Insumo.js";
import Empleado  from "../Models/Empleado.js";
import { getIO } from "../Config/socketInstance.js";
import pool      from "../Config/db.js";

const isProd = () => process.env.NODE_ENV === "production";
const errDetalle = (err) => isProd() ? {} : { detalle: err.message };

export const getInsumos = async (req, res) => {
  try {
    res.json(await Insumo.getDisponibles());
  } catch (err) {
    res.status(500).json({ error: "Error al obtener insumos", ...errDetalle(err) });
  }
};

export const getInventario = async (req, res) => {
  try {
    res.json(await Insumo.getAll());
  } catch (err) {
    res.status(500).json({ error: "Error al obtener inventario", ...errDetalle(err) });
  }
};

export const getInsumosStockBajo = async (req, res) => {
  try {
    res.json(await Insumo.getStockBajo());
  } catch (err) {
    res.status(500).json({ error: "Error al obtener alertas de stock", ...errDetalle(err) });
  }
};

export const crearSolicitud = async (req, res) => {
  const { prioridad, id_empleado, insumos } = req.body;
  if (!prioridad || !id_empleado || !Array.isArray(insumos) || insumos.length === 0)
    return res.status(400).json({ error: "Datos incompletos" });
  if (parseInt(id_empleado) !== req.usuario.id_empleado && req.usuario.id_rol !== 1)
    return res.status(403).json({ error: "No puedes crear solicitudes en nombre de otro usuario" });
  for (const item of insumos) {
    if (!item.id_insumo || !item.cantidad || item.cantidad < 1)
      return res.status(400).json({ error: "Cada insumo debe tener id y cantidad válida" });
  }
  try {
    const result = await Solicitud.crear({ prioridad, id_empleado: parseInt(id_empleado), insumos });
    const emp = await Empleado.getResumen(parseInt(id_empleado));
    try {
      getIO().to("admins").emit("solicitud:nueva", {
        id_solicitud:    result.id_solicitud,
        folio_solicitud: result.folio_solicitud,
        id_empleado:     parseInt(id_empleado),
        prioridad,
        total_insumos:   insumos.length,
        nombre_empleado: emp.nombre_empleado,
        departamento:    emp.nombre_departamento,
      });
    } catch (emitErr) { console.error("[emit solicitud:nueva]", emitErr.message); }
    res.status(201).json({ ok: true, ...result });
  } catch (err) {
    const status = err.statusCode === 400 ? 400 : 500;
    res.status(status).json({ error: err.statusCode === 400 ? err.message : "Error al crear solicitud", ...errDetalle(err) });
  }
};

export const getSolicitudesByEmpleado = async (req, res) => {
  try {
    const idParam = parseInt(req.params.id_empleado, 10);
    if (isNaN(idParam)) return res.status(400).json({ error: "ID inválido" });
    if (req.usuario.id_rol !== 1 && req.usuario.id_empleado !== idParam)
      return res.status(403).json({ error: "Acceso no autorizado" });
    const limit  = Math.min(parseInt(req.query.limit) || 50, 200);
    const page   = Math.max(parseInt(req.query.page)  || 1, 1);
    const offset = (page - 1) * limit;
    const { rows, total } = await Solicitud.getByEmpleado(idParam, { limit, offset });
    res.json({ data: rows, total, page, limit, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ error: "Error al obtener solicitudes", ...errDetalle(err) });
  }
};

export const getSolicitudById = async (req, res) => {
  try {
    const idNum = parseInt(req.params.id);
    if (isNaN(idNum)) return res.status(400).json({ error: "ID inválido" });
    const solicitud = await Solicitud.getById(idNum);
    if (!solicitud) return res.status(404).json({ error: "Solicitud no encontrada" });
    const { id_empleado, id_rol } = req.usuario;
    if (id_rol !== 1 && solicitud.id_empleado !== id_empleado)
      return res.status(403).json({ error: "Acceso no autorizado" });
    res.json(solicitud);
  } catch (err) {
    res.status(500).json({ error: "Error al obtener solicitud", ...errDetalle(err) });
  }
};

export const getSolicitudByFolio = async (req, res) => {
  try {
    const folio = req.params.folio?.trim();
    if (!folio) return res.status(400).json({ error: "Folio inválido" });
    const [[row]] = await pool.query(
      "SELECT id_solicitud FROM solicitud WHERE folio_solicitud = ? LIMIT 1", [folio]
    );
    if (!row) return res.status(404).json({ error: "Solicitud no encontrada" });
    const solicitud = await Solicitud.getById(row.id_solicitud);
    if (!solicitud) return res.status(404).json({ error: "Solicitud no encontrada" });
    const { id_empleado, id_rol } = req.usuario;
    if (id_rol !== 1 && solicitud.id_empleado !== id_empleado)
      return res.status(403).json({ error: "Acceso no autorizado" });
    res.json(solicitud);
  } catch (err) {
    res.status(500).json({ error: "Error al obtener solicitud", ...errDetalle(err) });
  }
};

export const getSolicitudesPendientes = async (req, res) => {
  try {
    const limit  = Math.min(parseInt(req.query.limit) || 100, 500);
    const page   = Math.max(parseInt(req.query.page)  || 1, 1);
    const offset = (page - 1) * limit;
    const [rows] = await pool.query(
      `SELECT s.id_solicitud, s.folio_solicitud, s.fecha, s.estatus, s.prioridad,
              CONCAT(e.nombre,' ',e.ap_paterno) AS nombre_empleado,
              d.nombre_departamento,
              COUNT(si.id_solicitud_insumo) AS total_insumos,
              GROUP_CONCAT(i.nombre ORDER BY i.nombre SEPARATOR ', ') AS insumos_nombres
       FROM solicitud s
       JOIN empleado e          ON s.id_empleado     = e.id_empleado
       LEFT JOIN departamento d ON e.id_departamento = d.id_departamento
       JOIN solicitud_insumo si ON s.id_solicitud    = si.id_solicitud
       JOIN insumo i            ON si.id_insumo      = i.id_insumo
       WHERE s.estatus NOT IN ('Resuelto', 'No Resuelto', 'Rechazado')
       GROUP BY s.id_solicitud
       ORDER BY FIELD(s.prioridad,'Urgente','Alta','Media','Baja'), s.fecha ASC
       LIMIT ? OFFSET ?`,
      [limit, offset]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: "Error al obtener solicitudes pendientes", ...errDetalle(err) });
  }
};

export const getAllSolicitudes = async (req, res) => {
  try {
    const limit  = Math.min(parseInt(req.query.limit) || 100, 500);
    const page   = Math.max(parseInt(req.query.page)  || 1, 1);
    const offset = (page - 1) * limit;
    const { rows, total } = await Solicitud.getAll({ limit, offset });
    res.json({ data: rows, total, page, limit, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ error: "Error al obtener solicitudes", ...errDetalle(err) });
  }
};

export const aprobarItemsSolicitud = async (req, res) => {
  const id = parseInt(req.params.id);
  const { items } = req.body;
  if (!Array.isArray(items) || items.length === 0)
    return res.status(400).json({ error: "items requerido" });
  try {
    const [[sol]] = await pool.query(
      "SELECT id_solicitud, estatus FROM solicitud WHERE id_solicitud = ? LIMIT 1", [id]
    );
    if (!sol) return res.status(404).json({ error: "Solicitud no encontrada" });
    if (sol.estatus === "Resuelto" || sol.estatus === "No Resuelto" || sol.estatus === "Rechazado")
      return res.status(409).json({ error: "La solicitud ya está cerrada" });
    await Solicitud.aprobarItems(id, items);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: "Error al actualizar items", ...errDetalle(err) });
  }
};

export const actualizarEstatusSolicitud = async (req, res) => {
  const id     = parseInt(req.params.id);
  const { estatus } = req.body;
  if (!estatus) return res.status(400).json({ error: "Estatus requerido" });
  try {
    if (estatus === "Resuelto") {
      const conn = await pool.getConnection();
      try {
        await conn.beginTransaction();
        const [[sol]] = await conn.query(
          "SELECT id_solicitud FROM solicitud WHERE id_solicitud = ? FOR UPDATE", [id]
        );
        if (!sol) { await conn.rollback(); return res.status(404).json({ error: "Solicitud no encontrada" }); }
        // Solo descontar los ítems aprobados (aprobado = 1, default NULL se trata como aprobado)
        const [detalle] = await conn.query(
          "SELECT id_insumo, cantidad FROM solicitud_insumo WHERE id_solicitud = ? AND (aprobado IS NULL OR aprobado = 1)", [id]
        );
        if (detalle.length > 0) await Insumo.descontarStock(conn, detalle);
        await conn.query("UPDATE solicitud SET estatus = ? WHERE id_solicitud = ?", [estatus, id]);
        await conn.commit();
        // Verificar stock crítico tras descontar
        try {
          const idsInsumos = detalle.map(d => d.id_insumo);
          if (idsInsumos.length > 0) {
            const [criticos] = await pool.query(
              `SELECT i.id_insumo, i.nombre, i.stock FROM insumo i WHERE i.id_insumo IN (?) AND i.stock <= 5`,
              [idsInsumos]
            );
            if (criticos.length > 0) {
              const io = getIO();
              criticos.forEach(ins => {
                io.to("admins").emit("insumo:stock_critico", {
                  id_insumo: ins.id_insumo,
                  nombre:    ins.nombre,
                  stock:     ins.stock,
                  nivel:     ins.stock === 0 ? "agotado" : "bajo",
                });
              });
            }
          }
        } catch {}
      } catch (err) {
        await conn.rollback();
        throw err;
      } finally {
        conn.release();
      }
    } else {
      const ok = await Solicitud.actualizarEstatus(id, estatus);
      if (!ok) return res.status(404).json({ error: "Solicitud no encontrada" });
    }

    const [[sol]] = await pool.query(
      `SELECT s.id_empleado, s.folio_solicitud,
              CONCAT(e.nombre,' ',e.ap_paterno) AS nombre_empleado,
              e.email AS email_empleado,
              d.nombre_departamento,
              GROUP_CONCAT(i.nombre ORDER BY i.nombre SEPARATOR ', ') AS insumos_nombres
       FROM solicitud s
       JOIN empleado e ON s.id_empleado = e.id_empleado
       LEFT JOIN departamento d ON e.id_departamento = d.id_departamento
       LEFT JOIN solicitud_insumo si ON s.id_solicitud = si.id_solicitud
       LEFT JOIN insumo i ON si.id_insumo = i.id_insumo
       WHERE s.id_solicitud = ?
       GROUP BY s.id_solicitud LIMIT 1`,
      [id]
    );
    if (sol) {
      const payload = { id_solicitud: id, folio_solicitud: sol.folio_solicitud, estatus };
      try {
        getIO().to(`empleado_${sol.id_empleado}`).emit("solicitud:actualizada", payload);
        getIO().to("admins").emit("solicitud:actualizada", {
          ...payload,
          nombre_empleado: sol.nombre_empleado,
          departamento:    sol.nombre_departamento,
        });
      } catch (emitErr) { console.error("[emit solicitud:actualizada]", emitErr.message); }

    }
    res.json({ ok: true });
  } catch (err) {
    const status = err.statusCode === 400 ? 400 : 500;
    res.status(status).json({ error: err.statusCode === 400 ? err.message : "Error al actualizar solicitud", ...errDetalle(err) });
  }
};

/** SQL compartido: devuelve un insumo con disponibilidad calculada desde stock */
const SELECT_INSUMO_COMPLETO = `
  SELECT i.id_insumo, i.num_serie, i.nombre, i.descripcion,
         i.marca, i.modelo, i.stock, i.estado,
         i.id_categoria, i.proveedor, i.imagen_url,
         c.nombre_categoria,
         CASE
           WHEN i.stock  = 0 THEN 'Sin stock'
           WHEN i.stock <= 5 THEN 'Stock bajo'
           ELSE 'Disponible'
         END AS disponibilidad
  FROM insumo i
  LEFT JOIN categoria c ON i.id_categoria = c.id_categoria
  WHERE i.id_insumo = ?
  LIMIT 1`;

export const crearInsumo = async (req, res) => {
  try {
    const id = await Insumo.crear(req.body);
    const [rows] = await pool.query(SELECT_INSUMO_COMPLETO, [id]);
    res.status(201).json(rows[0]);
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY")
      return res.status(409).json({ error: "Ya existe un insumo con ese número de serie" });
    res.status(500).json({ error: "Error al crear insumo", ...errDetalle(err) });
  }
};

export const actualizarInsumo = async (req, res) => {
  try {
    const ok = await Insumo.actualizar(parseInt(req.params.id), req.body);
    if (!ok) return res.status(404).json({ error: "Insumo no encontrado" });
    const [rows] = await pool.query(SELECT_INSUMO_COMPLETO, [parseInt(req.params.id)]);
    res.json(rows[0]);
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY")
      return res.status(409).json({ error: "Ya existe un insumo con ese número de serie" });
    res.status(500).json({ error: "Error al actualizar insumo", ...errDetalle(err) });
  }
};

export const getReporteSolicitudes = async (req, res) => {
  try {
    const { fecha_inicio, fecha_fin } = req.query;
    const reFecha = /^\d{4}-\d{2}-\d{2}$/;
    if (!fecha_inicio || !fecha_fin) return res.status(400).json({ error: "fecha_inicio y fecha_fin son requeridos" });
    if (!reFecha.test(fecha_inicio) || !reFecha.test(fecha_fin))
      return res.status(400).json({ error: "Formato de fecha inválido. Use YYYY-MM-DD" });
    if (fecha_inicio > fecha_fin)
      return res.status(400).json({ error: "fecha_inicio no puede ser posterior a fecha_fin" });
    const [rows] = await pool.query(
      `SELECT s.folio_solicitud, s.fecha, s.estatus, s.prioridad,
              CONCAT(e.nombre,' ',e.ap_paterno) AS nombre_empleado,
              d.nombre_departamento,
              COUNT(si.id_solicitud_insumo) AS total_insumos,
              SUM(si.cantidad) AS total_piezas,
              GROUP_CONCAT(CONCAT(i.nombre,' x',si.cantidad) ORDER BY i.nombre SEPARATOR ', ') AS detalle_insumos
       FROM solicitud s
       JOIN empleado e          ON s.id_empleado     = e.id_empleado
       LEFT JOIN departamento d ON e.id_departamento = d.id_departamento
       JOIN solicitud_insumo si ON s.id_solicitud    = si.id_solicitud
       JOIN insumo i            ON si.id_insumo      = i.id_insumo
       WHERE DATE(s.fecha) BETWEEN ? AND ?
       GROUP BY s.id_solicitud
       ORDER BY s.fecha DESC`,
      [fecha_inicio, fecha_fin]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: "Error al generar reporte", ...errDetalle(err) });
  }
};

export const eliminarInsumo = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) AS total FROM solicitud_insumo si
       JOIN solicitud s ON si.id_solicitud = s.id_solicitud
       WHERE si.id_insumo = ? AND s.estatus NOT IN ('Resuelto', 'No Resuelto', 'Rechazado')`,
      [id]
    );
    if (total > 0)
      return res.status(409).json({ error: "No se puede eliminar: el insumo tiene solicitudes activas pendientes" });
    const ok = await Insumo.eliminar(id);
    if (!ok) return res.status(404).json({ error: "Insumo no encontrado" });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: "Error al eliminar insumo", ...errDetalle(err) });
  }
};
