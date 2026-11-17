/**
 * solicitudes-controller.js
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
 *
 * @module server/controllers/solicitudes-controller
 * @requires ../services/solicitud.js
 * @requires ../services/insumo.js
 * @requires ../services/empleado.js
 * @requires ../services/movimiento-inventario.js
 * @requires ../config/socket-instance.js
 * @requires ../config/db.js
 * @requires path
 * @requires fs
 * @requires ../middlewares/upload-insumos.js
 * @requires ../middlewares/auth-middleware.js
 * @requires ../utils/helpers.js
 * @exports getInsumos
 * @exports getInventario
 * @exports getInsumosStockBajo
 * @exports crearSolicitud
 * @exports getSolicitudesByEmpleado
 * @exports getSolicitudById
 * @exports getSolicitudByFolio
 * @exports getSolicitudesPendientes
 * @exports getAllSolicitudes
 * @exports getMetricasSolicitudes
 * @exports aprobarItemsSolicitud
 * @exports guardarObservacionSolicitud
 * @exports actualizarEstatusSolicitud
 * @exports crearInsumo
 * @exports actualizarInsumo
 * @exports getReporteSolicitudes
 * @exports subirFotoInsumo
 * @exports eliminarInsumo
 * @exports cambiarActivoInsumo
 * @exports cambiarVisiblePublico
 * @exports getInsumosForUser
 * @exports registrarEntradaInsumo
 * @exports editarEntrada
 * @exports registrarSalidaInsumo
 * @exports guardarRutaSolicitud
 * @exports getMovimientosInventario
 * @exports getSalidasMiSucursal
 * @exports getMovimientosInsumo
 * @exports getMovimientosSolicitud
 */
import Solicitud from '../services/solicitud.js';
import Insumo    from '../services/insumo.js';
import Empleado  from '../services/empleado.js';
import MovimientoInventario from '../services/movimiento-inventario.js';
import { getIO } from '../config/socket-instance.js';
import pool      from '../config/db.js';
import path      from "path";
import fs        from "fs";
import { INSUMOS_DIR } from '../middlewares/upload-insumos.js';
import { esSoporteOAdmin } from '../middlewares/auth-middleware.js';
import { isProd, generarFolio } from '../utils/helpers.js';

const errDetalle = (err) => isProd() ? {} : {
  detalle: err.message,
  ...(err.sqlMessage ? { sqlMessage: err.sqlMessage } : {}),
  ...(err.errno != null ? { codigo: err.errno } : {}),
  ...(err.sqlState ? { sqlState: err.sqlState } : {}),
};
// ── Stock: dato interno del inventario ─────────────────────────────────────
// El rol Usuario (id_rol !== 1) NO debe ver el stock en ningún momento:
// ni la cifra exacta ni el campo calculado "disponibilidad" (que delata
// rangos: sin stock / stock bajo). El admin (id_rol === 1) sigue recibiendo
// ambos campos con normalidad.
const esAdmin = (req) => req?.usuario?.id_rol === 1;
const sinStock = (obj) => {
  if (!obj || typeof obj !== "object") return obj;
  const { stock, disponibilidad, ...resto } = obj;
  return resto;
};
const sinStockLista = (filas) => (Array.isArray(filas) ? filas.map(sinStock) : filas);

/** Convierte un valor de body/params en id entero positivo o null. */
const toPosId = (v) => {
  const n = parseInt(v, 10);
  return Number.isFinite(n) && n > 0 ? n : null;
};

/** Verifica que dos sucursales existan y sean distintas. Devuelve error o null. */
const validarRutaSucursales = async (conn, id_sucursal_origen, id_sucursal_destino) => {
  const [sucs] = await conn.query(
    "SELECT id_sucursal FROM sucursal WHERE id_sucursal IN (?)",
    [[id_sucursal_origen, id_sucursal_destino]]
  );
  if (sucs.length !== 2) return { campo: null, message: "La sucursal de origen o la de destino no existen" };
  if (id_sucursal_origen === id_sucursal_destino)
    return { campo: "id_sucursal_destino", message: "La sucursal de origen y la de destino deben ser distintas" };
  return null;
};

export const getInsumos = async (req, res) => {
  try {
    const rows = await Insumo.getDisponibles();
    res.json(esAdmin(req) ? rows : sinStockLista(rows));
  } catch (err) {
    res.status(500).json({ error: "Error al obtener insumos", ...errDetalle(err) });
  }
};

export const getInventario = async (req, res) => {
  try {
    // Baja lógica: los insumos inhabilitados solo los lista el admin.
    // /inventario no tiene guard porque el dashboard (SeccionInsumos) lo
    // consume para ambos roles; para Usuario/Soporte se devuelve el catálogo
    // filtrado (mismo criterio que /insumos), ocultando los dados de baja.
    const admin = esAdmin(req);
    const rows = admin ? await Insumo.getAll() : await Insumo.getAll({ soloActivos: true });
    res.json(admin ? rows : sinStockLista(rows));
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
  const { prioridad, id_empleado, insumos, observaciones_generales } = req.body;
  if (!prioridad || !id_empleado || !Array.isArray(insumos) || insumos.length === 0)
    return res.status(400).json({ error: "Datos incompletos" });
  // Las observaciones generales son obligatorias: es el "por qué" de la
  // solicitud. Se guardan a nivel de encabezado (solicitud.observacion) y no
  // se exigen ni se replican por insumo individual.
  if (!String(observaciones_generales ?? "").trim())
    return res.status(400).json({ error: "Las observaciones generales son requeridas" });
  if (parseInt(id_empleado) !== req.usuario.id_empleado && req.usuario.id_rol !== 1)
    return res.status(403).json({ error: "No puedes crear solicitudes en nombre de otro usuario" });
  for (const item of insumos) {
    if (!item.id_insumo || !item.cantidad || item.cantidad < 1)
      return res.status(400).json({ error: "Cada insumo debe tener id y cantidad válida" });
  }
  // Los inhabilitados no se pueden pedir ni en solicitudes ni en salidas.
  // Si la columna `activo` aún no existe (migración 027 pendiente), se omite.
  try {
    const ids = [...new Set(insumos.map(i => parseInt(i.id_insumo, 10)).filter(Number.isFinite))];
    if (ids.length) {
      const [off] = await pool.query(
        `SELECT nombre FROM insumo WHERE id_insumo IN (?) AND activo = 0 LIMIT 1`,
        [ids]
      );
      if (off.length)
        return res.status(409).json({ error: `El insumo "${off[0].nombre}" está inhabilitado` });
    }
  } catch { /* sin columna activo o error: el flujo normal continúa */ }
  try {
    const result = await Solicitud.crear({ prioridad, id_empleado: parseInt(id_empleado), insumos, observaciones_generales: String(observaciones_generales).trim() });
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
    let msg = status === 400 ? err.message : "Error al crear solicitud";
    // El mensaje del modelo incluye "disponible N": esa cifra es stock interno
    // y no se revela al usuario (tampoco vía errDetalle en desarrollo).
    const filtraStock = !esAdmin(req) && /stock insuficiente/i.test(String(err.message));
    if (filtraStock) {
      const m = String(err.message).match(/Stock insuficiente para "(.*?)":/i);
      msg = m
        ? `No hay stock suficiente para "${m[1]}". Reduce la cantidad e intenta de nuevo.`
        : "No hay stock suficiente para uno de los insumos solicitados. Reduce la cantidad e intenta de nuevo.";
    }
    res.status(status).json({ error: msg, ...(filtraStock ? {} : errDetalle(err)) });
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
    // El stock por item es dato interno: no se entrega al rol Usuario.
    if (id_rol !== 1 && Array.isArray(solicitud.detalle))
      solicitud.detalle.forEach(d => delete d.stock);
    // La ruta del material (de que sucursal sale el material y a la que
    // llega) es logistica interna: la ven Administracion y Soporte Tecnico
    // (misma regla que las observaciones). Se elimina de la respuesta para
    // que el resto del personal tampoco la reciba.
    if (!(await esSoporteOAdmin(req.usuario))) {
      delete solicitud.id_sucursal_origen;
      delete solicitud.id_sucursal_destino;
      delete solicitud.nombre_sucursal_origen;
      delete solicitud.nombre_sucursal_destino;
    }
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
    // El stock por item es dato interno: no se entrega al rol Usuario.
    if (id_rol !== 1 && Array.isArray(solicitud.detalle))
      solicitud.detalle.forEach(d => delete d.stock);
    // La ruta del material es logistica interna: la ven Administracion y
    // Soporte Tecnico (misma regla que las observaciones).
    if (!(await esSoporteOAdmin(req.usuario))) {
      delete solicitud.id_sucursal_origen;
      delete solicitud.id_sucursal_destino;
      delete solicitud.nombre_sucursal_origen;
      delete solicitud.nombre_sucursal_destino;
    }
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
    const [[{ total }]] = await pool.query(
      `SELECT COUNT(DISTINCT s.id_solicitud) AS total
       FROM solicitud s
       WHERE s.estatus = 'En proceso'`
    );
    const [rows] = await pool.query(
      `SELECT s.id_solicitud, s.folio_solicitud, s.fecha, s.estatus, s.prioridad,
              CONCAT(e.nombre,' ',e.ap_paterno) AS nombre_empleado,
              d.nombre_departamento,
              COUNT(si.id_solicitud_insumo) AS total_insumos,
              GROUP_CONCAT(i.nombre ORDER BY i.nombre SEPARATOR ', ') AS insumos_nombres
       FROM solicitud s
       JOIN empleado e          ON s.id_empleado     = e.id_empleado
       LEFT JOIN departamento d ON e.id_departamento = d.id_departamento
       LEFT JOIN solicitud_insumo si ON s.id_solicitud = si.id_solicitud
       LEFT JOIN insumo i            ON si.id_insumo   = i.id_insumo
       WHERE s.estatus = 'En proceso'
       GROUP BY s.id_solicitud
       ORDER BY FIELD(s.prioridad,'Urgente','Alta','Media','Baja'), s.fecha ASC
       LIMIT ? OFFSET ?`,
      [limit, offset]
    );
    res.json({ data: rows, total, page, limit, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ error: "Error al obtener solicitudes pendientes", ...errDetalle(err) });
  }
};

export const getAllSolicitudes = async (req, res) => {
  try {
    const limit  = Math.min(parseInt(req.query.limit) || 50, 2000);
    const page   = Math.max(parseInt(req.query.page)  || 1, 1);
    const offset = (page - 1) * limit;
    const { estatus, prioridad, busqueda, empleado, usuario, area, sucursal, fecha_inicio, fecha_fin } = req.query;
    const { rows, total } = await Solicitud.getAll({
      limit, offset,
      estatus:      estatus      || undefined,
      prioridad:    prioridad    || undefined,
      busqueda:     busqueda     || undefined,
      empleado:     empleado || usuario || undefined,
      area:         area         || undefined,
      sucursal:     sucursal     || undefined,
      fecha_inicio: fecha_inicio || undefined,
      fecha_fin:    fecha_fin    || undefined,
    });
    res.json({ data: rows, total, page, limit, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ error: "Error al obtener solicitudes", ...errDetalle(err) });
  }
};

export const getMetricasSolicitudes = async (req, res) => {
  try {
    res.json(await Solicitud.getMetricas());
  } catch (err) {
    res.status(500).json({ error: "Error al obtener métricas", ...errDetalle(err) });
  }
};

export const aprobarItemsSolicitud = async (req, res) => {
  const id = parseInt(req.params.id);
  const { items } = req.body;
  if (!Array.isArray(items) || items.length === 0)
    return res.status(400).json({ error: "items requerido" });
  // Ruta de sucursales (opcional en este paso: el admin puede guardarla antes de aceptar)
  const id_sucursal_origen  = toPosId(req.body.id_sucursal_origen);
  const id_sucursal_destino = toPosId(req.body.id_sucursal_destino);
  try {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      const [[sol]] = await conn.query(
        "SELECT id_solicitud, estatus FROM solicitud WHERE id_solicitud = ? FOR UPDATE", [id]
      );
      if (!sol) { await conn.rollback(); return res.status(404).json({ error: "Solicitud no encontrada" }); }
      if (sol.estatus === "Aceptado" || sol.estatus === "Rechazado") {
        await conn.rollback();
        return res.status(409).json({ error: "La solicitud ya está cerrada" });
      }

      if (id_sucursal_origen && id_sucursal_destino) {
        const errRuta = await validarRutaSucursales(conn, id_sucursal_origen, id_sucursal_destino);
        if (errRuta) { await conn.rollback(); return res.status(400).json({ error: errRuta.message }); }
        await conn.query(
          `UPDATE solicitud SET id_sucursal_origen = ?, id_sucursal_destino = ? WHERE id_solicitud = ?`,
          [id_sucursal_origen, id_sucursal_destino, id]
        );
      }

      // Cantidades solicitadas reales para no aceptar más de lo pedido
      const ids = items.map(it => parseInt(it.id_solicitud_insumo, 10));
      const [filas] = await conn.query(
        `SELECT id_solicitud_insumo, cantidad FROM solicitud_insumo
          WHERE id_solicitud = ? AND id_solicitud_insumo IN (?)`,
        [id, ids]
      );
      const solicitada = new Map(filas.map(f => [f.id_solicitud_insumo, f.cantidad]));

      const normalizados = items
        .filter(it => solicitada.has(parseInt(it.id_solicitud_insumo, 10)))
        .map(it => {
          const aprovado = (it.aprobado === 1 || it.aprobado === true) ? 1 : 0;
          const pedida   = solicitada.get(parseInt(it.id_solicitud_insumo, 10));
          const pedidaAdm = it.cantidad ?? it.cantidad_aprobada;
          let   aceptada  = null;
          if (aprovado === 1) {
            const v = pedidaAdm == null ? pedida : parseInt(pedidaAdm, 10);
            aceptada = Math.max(1, Math.min(Number.isFinite(v) ? v : pedida, pedida));
          }
          return {
            id_solicitud_insumo: parseInt(it.id_solicitud_insumo, 10),
            aprovado,
            cantidad_aprobada: aceptada,
          };
        });

      for (const it of normalizados) {
        await conn.query(
          `UPDATE solicitud_insumo
              SET aprobado = ?, cantidad_aprobada = COALESCE(?, cantidad_aprobada)
            WHERE id_solicitud_insumo = ? AND id_solicitud = ?`,
          [it.aprovado, it.cantidad_aprobada, it.id_solicitud_insumo, id]
        );
      }
      await conn.commit();
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: "Error al actualizar items", ...errDetalle(err) });
  }
};


/**
 * guardarObservacionSolicitud
 *
 * Registra o borra la observacion unica que Soporte Tecnico o Administracion
 * escriben sobre una solicitud completa (no por insumo). Es distinta de la
 * justificacion que escribe el solicitante: esta es la respuesta de quien
 * revisa el pedido ("sin stock, se sustituye por equivalente", etc.).
 *
 * Ruta: PATCH /api/solicitudes/:id/observacion
 * Permiso: requireSoporteOAdmin (administradores o depto. Soporte Tecnico).
 */
export const guardarObservacionSolicitud = async (req, res) => {
  const id    = parseInt(req.params.id, 10);
  const texto = String(req.body.observacion ?? "").trim();
  const autor = req.usuario.id_empleado;

  if (!Number.isInteger(id))
    return res.status(400).json({ error: "Identificador inválido" });

  try {
    const [[sol]] = await pool.query(
      "SELECT id_solicitud FROM solicitud WHERE id_solicitud = ? LIMIT 1",
      [id]
    );
    if (!sol)
      return res.status(404).json({ error: "Solicitud no encontrada" });

    // Texto vacio = borrar. Se limpian tambien autor y fecha para no dejar
    // rastro de quien escribio algo que ya no existe.
    if (texto) {
      await pool.query(
        `UPDATE solicitud
            SET observacion = ?, observacion_por = ?, observacion_fecha = NOW()
          WHERE id_solicitud = ?`,
        [texto, autor, id]
      );
    } else {
      await pool.query(
        `UPDATE solicitud
            SET observacion = NULL, observacion_por = NULL, observacion_fecha = NULL
          WHERE id_solicitud = ?`,
        [id]
      );
    }

    const [[emp]] = await pool.query(
      "SELECT nombre, ap_paterno FROM empleado WHERE id_empleado = ? LIMIT 1", [autor]
    );
    res.json({
      ok: true,
      observacion: texto || null,
      observacion_por: texto ? autor : null,
      observacion_fecha: texto ? new Date() : null,
      observacion_autor: texto
        ? `${emp?.nombre ?? ""} ${emp?.ap_paterno ?? ""}`.trim()
        : "",
    });
  } catch (err) {
    res.status(500).json({ error: "Error al guardar la observación", ...errDetalle(err) });
  }
};

export const actualizarEstatusSolicitud = async (req, res) => {
  const id          = parseInt(req.params.id);
  const { estatus } = req.body;
  if (!estatus) return res.status(400).json({ error: "Estatus requerido" });

  // Ruta del material elegida por el administrador: de que sucursal sale
  // (origen) y a que sucursal llega (destino). Obligatoria para aceptar.
  const id_sucursal_origen  = toPosId(req.body.id_sucursal_origen);
  const id_sucursal_destino = toPosId(req.body.id_sucursal_destino);
  const idAdmin             = req.usuario?.id_empleado ?? null;

  try {
    if (estatus === "Aceptado") {
      // items: [{ id_solicitud_insumo, aprobado: 1|0, cantidad: cantidad a aceptar }]
      const itemsBody = Array.isArray(req.body?.items) ? req.body.items : [];
      if (itemsBody.length === 0)
        return res.status(400).json({ error: "Debes indicar el estado de aprobación de cada ítem" });
      if (!id_sucursal_origen || !id_sucursal_destino)
        return res.status(400).json({ error: "Debes elegir la sucursal de origen y la sucursal de destino antes de aceptar la solicitud" });
      if (id_sucursal_origen === id_sucursal_destino)
        return res.status(400).json({ error: "La sucursal de origen y la de destino deben ser distintas" });

      const conn = await pool.getConnection();
      try {
        await conn.beginTransaction();

        const errRuta = await validarRutaSucursales(conn, id_sucursal_origen, id_sucursal_destino);
        if (errRuta) { await conn.rollback(); return res.status(400).json({ error: errRuta.message }); }

        // Bloquear la solicitud
        const [[sol]] = await conn.query(
          "SELECT id_solicitud, folio_solicitud, estatus FROM solicitud WHERE id_solicitud = ? FOR UPDATE", [id]
        );
        if (!sol) { await conn.rollback(); return res.status(404).json({ error: "Solicitud no encontrada" }); }
        if (sol.estatus === "Aceptado" || sol.estatus === "Rechazado") {
          await conn.rollback();
          return res.status(409).json({ error: "La solicitud ya está cerrada" });
        }

        // 1. Leer TODOS los ítems reales de la solicitud (cantidad pedida y nombre)
        const [filas] = await conn.query(
          `SELECT si.id_solicitud_insumo, si.id_insumo, si.cantidad,
                  IFNULL(i.nombre, '[Insumo eliminado]') AS nombre_insumo
             FROM solicitud_insumo si
             LEFT JOIN insumo i ON si.id_insumo = i.id_insumo
            WHERE si.id_solicitud = ?`,
          [id]
        );
        const mapaItems = new Map(filas.map(f => [f.id_solicitud_insumo, f]));

        // Un ítem repetido en el body descontaba el stock dos veces: se
        // conserva solo la última decisión por id_solicitud_insumo.
        const itemsUnicos = [...new Map(
          itemsBody.map(it => [parseInt(it.id_solicitud_insumo, 10), it])
        ).values()];

        // Todos los renglones deben tener decisión; si falta alguno quedaba
        // con aprobado = NULL en una solicitud ya cerrada.
        const sinDecidir = filas.filter(f => !itemsUnicos.some(it => parseInt(it.id_solicitud_insumo, 10) === f.id_solicitud_insumo));
        if (sinDecidir.length > 0) {
          await conn.rollback();
          return res.status(400).json({
            error: `Falta aprobar o negar: ${sinDecidir.map(f => `"${f.nombre_insumo}"`).join(", ")}`,
          });
        }

        // 2. Resolver qué se acepta de cada ítem. La cantidad aceptada nunca
        //    puede exceder la cantidad solicitada ni ser menor a 1.
        const resueltos = [];
        for (const it of itemsUnicos) {
          const fila = mapaItems.get(parseInt(it.id_solicitud_insumo, 10));
          if (!fila) {
            await conn.rollback();
            return res.status(400).json({ error: `El ítem ${it.id_solicitud_insumo} no pertenece a esta solicitud` });
          }
          const aprovado   = (it.aprobado === 1 || it.aprobado === true) ? 1 : 0;
          const pedida     = fila.cantidad;
          const cantAdmin  = it.cantidad ?? it.cantidad_aprobada;
          let   aceptada   = 0;
          if (aprovado === 1) {
            const v = cantAdmin == null ? pedida : parseInt(cantAdmin, 10);
            aceptada = Number.isFinite(v) && v >= 1 ? Math.min(v, pedida) : pedida;
          }
          resueltos.push({
            id_solicitud_insumo: fila.id_solicitud_insumo,
            id_insumo:           fila.id_insumo,
            nombre_insumo:       fila.nombre_insumo,
            aprovado,
            cantidad_aprobada:   aceptada,
          });
        }

        // Aceptar sin aprobar nada dejaba una solicitud "Aceptada" sin entrega.
        if (!resueltos.some(r => r.aprovado === 1 && r.cantidad_aprobada > 0)) {
          await conn.rollback();
          return res.status(400).json({
            error: "No aprobaste ningún insumo. Si no se entregará nada, rechaza la solicitud.",
          });
        }

        // 3. Guardar aprobado / cantidad aceptada de TODOS los ítems
        for (const r of resueltos) {
          await conn.query(
            `UPDATE solicitud_insumo SET aprobado = ?, cantidad_aprobada = ?
              WHERE id_solicitud_insumo = ? AND id_solicitud = ?`,
            [r.aprovado, r.cantidad_aprobada, r.id_solicitud_insumo, id]
          );
        }

        // 4. Guardar la ruta de sucursales elegida por el administrador
        await conn.query(
          `UPDATE solicitud SET id_sucursal_origen = ?, id_sucursal_destino = ? WHERE id_solicitud = ?`,
          [id_sucursal_origen, id_sucursal_destino, id]
        );

        // 5. Descontar stock y registrar el movimiento SOLO de lo realmente aceptado
        const aDescontar = resueltos.filter(r => r.aprovado === 1 && r.cantidad_aprobada > 0);
        for (const r of aDescontar) {
          const [[inv]] = await conn.query(
            "SELECT stock, activo FROM insumo WHERE id_insumo = ? FOR UPDATE", [r.id_insumo]
          );
          if (!inv) {
            await conn.rollback();
            return res.status(400).json({ error: `"${r.nombre_insumo}" ya no existe en el inventario` });
          }
          if (Number(inv.activo) === 0) {
            await conn.rollback();
            return res.status(409).json({ error: `"${r.nombre_insumo}" está inhabilitado; niégalo o habilítalo antes de aceptar` });
          }
          if (inv.stock < r.cantidad_aprobada) {
            await conn.rollback();
            return res.status(400).json({
              error: `Stock insuficiente para "${r.nombre_insumo}": disponible ${inv.stock}, aceptado ${r.cantidad_aprobada}`,
            });
          }
          const stock_nuevo = inv.stock - r.cantidad_aprobada;
          await conn.query("UPDATE insumo SET stock = ? WHERE id_insumo = ?", [stock_nuevo, r.id_insumo]);
          await MovimientoInventario.registrar(conn, {
            id_insumo:          r.id_insumo,
            tipo:               "Salida",
            cantidad:           r.cantidad_aprobada,
            stock_anterior:     inv.stock,
            stock_nuevo,
            id_sucursal_origen,
            id_sucursal_destino,
            id_solicitud:       id,
            id_empleado:        idAdmin,
            // Sin motivo: el folio ya está en la solicitud ligada (id_solicitud);
            // al leer se muestra "Entrega de material por solicitud SOL-…".
            motivo:             null,
          });
        }

        // 6. Cerrar la solicitud y sellar la fecha de atención
        await conn.query(
          "UPDATE solicitud SET estatus = 'Aceptado', fecha_atencion = NOW() WHERE id_solicitud = ?", [id]
        );
        await conn.commit();
        Insumo.limpiarCache();

        // 7. Alertas de stock crítico + avisar el movimiento (fuera de la transacción)
        if (aDescontar.length > 0) {
          try {
            const idsInsumos = [...new Set(aDescontar.map(r => r.id_insumo))];
            const [rows] = await pool.query(
              `SELECT i.id_insumo, i.nombre, i.stock, i.imagen_url
               FROM insumo i WHERE i.id_insumo IN (?) AND i.stock <= 2`,
              [idsInsumos]
            );
            const io = getIO();
            rows.forEach(ins => io.to("admins").emit("insumo:stock_critico", {
              id_insumo: ins.id_insumo, nombre: ins.nombre, stock: ins.stock,
              nivel: ins.stock === 0 ? "agotado" : "bajo", imagen_url: ins.imagen_url || null,
            }));
            io.to("admins").emit("inventario:movimiento", {
              tipo: "Salida", id_solicitud: id, folio_solicitud: sol.folio_solicitud,
              movimientos: aDescontar.length,
              id_sucursal_origen, id_sucursal_destino,
            });
          } catch {}
        }
      } catch (err) {
        await conn.rollback();
        throw err;
      } finally {
        conn.release();
      }
    } else {
      const [[sol]] = await pool.query(
        "SELECT estatus FROM solicitud WHERE id_solicitud = ? LIMIT 1", [id]
      );
      if (!sol) return res.status(404).json({ error: "Solicitud no encontrada" });
      if (sol.estatus === "Aceptado" || sol.estatus === "Rechazado")
        return res.status(409).json({ error: "La solicitud ya está cerrada" });

      // La ruta de sucursales tambien puede guardarse/ajustarse mientras
      // la solicitud sigue abierta (boton "Guardar seleccion").
      if (id_sucursal_origen || id_sucursal_destino) {
        if (!id_sucursal_origen || !id_sucursal_destino)
          return res.status(400).json({ error: "Debes indicar la sucursal de origen y la de destino" });
        const errRuta = await validarRutaSucursales(pool, id_sucursal_origen, id_sucursal_destino);
        if (errRuta) return res.status(400).json({ error: errRuta.message });
        await Solicitud.actualizarRuta(id, { id_sucursal_origen, id_sucursal_destino });
      }
      const cambiado = await Solicitud.actualizarEstatus(id, estatus);
      if (!cambiado)
        return res.status(409).json({ error: "La solicitud ya está cerrada" });
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
         i.id_categoria, i.imagen_url, i.activo, i.visible_publico,
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

/**
 * crearInsumo
 * POST /api/solicitudes/insumos   (solo admin)
 *
 * Crea el insumo y, si trae stock inicial > 0, deja el movimiento tipo
 * "Entrada" en `movimiento_inventario` en la MISMA transaccion,
 * para que la base siempre guarde el ingreso de material.
 */
export const crearInsumo = async (req, res) => {
  const idAdmin = req.usuario?.id_empleado ?? null;
  const conn = await pool.getConnection();
  let id = null;
  let stockInicial = 0;
  try {
    try {
      await conn.beginTransaction();
      id = await Insumo.crear(req.body, conn);

      // El stock inicial del insumo es una ENTRADA de material.
      stockInicial = Math.max(parseInt(req.body.stock, 10) || 0, 0);
      if (stockInicial > 0) {
        await MovimientoInventario.registrar(conn, {
          id_insumo: id,
          tipo:          "Entrada",
          cantidad:      stockInicial,
          stock_anterior: 0,
          stock_nuevo:   stockInicial,
          id_empleado:   idAdmin,
          // Antes estaba fijo "Entrega de proveedor de Jose Alejandro Vera
          // Atilano" para TODO insumo nuevo, aunque viniera de una sucursal.
          motivo:        String(req.body.motivo ?? "").trim() || "Stock inicial al ingresar el insumo",
        });
      }
      await conn.commit();
    } catch (err) {
      await conn.rollback();
      throw err;
    }

    const [rows] = await pool.query(SELECT_INSUMO_COMPLETO, [id]);
    if (stockInicial > 0) {
      try {
        getIO().to("admins").emit("inventario:movimiento", {
          tipo: "Entrada", id_insumo: id, nombre_insumo: rows[0]?.nombre,
          stock_anterior: 0, stock_nuevo: stockInicial,
          id_sucursal_origen: null, id_sucursal_destino: null,
        });
      } catch {}
    }
    res.status(201).json(rows[0]);
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY")
      return res.status(409).json({ error: "Ya existe un insumo con ese número de serie" });
    res.status(500).json({ error: "Error al crear insumo", ...errDetalle(err) });
  } finally {
    conn.release();
  }
};

/**
 * actualizarInsumo
 * PUT /api/solicitudes/insumos/:id   (solo admin)
 *
 * Actualiza el insumo y deja el movimiento de stock en la MISMA
 * transaccion: aumento -> "Entrada", disminucion -> "Ajuste". Si el stock no
 * cambia no se escribe movimiento.
 */
export const actualizarInsumo = async (req, res) => {
  const id = parseInt(req.params.id);
  const idAdmin = req.usuario?.id_empleado ?? null;
  const conn = await pool.getConnection();
  let mov = null;
  try {
    try {
      await conn.beginTransaction();
      const [[prev]] = await conn.query(
        "SELECT id_insumo, stock FROM insumo WHERE id_insumo = ? FOR UPDATE", [id]
      );
      if (!prev) {
        await conn.rollback();
        return res.status(404).json({ error: "Insumo no encontrado" });
      }
      const ok = await Insumo.actualizar(id, req.body, conn);
      if (!ok) {
        await conn.rollback();
        return res.status(404).json({ error: "Insumo no encontrado" });
      }

      const stockAnterior = prev.stock ?? 0;
      let stockNuevo = null;
      if (req.body.stock !== undefined) {
        stockNuevo = Math.max(parseInt(req.body.stock, 10) || 0, 0);
        if (stockNuevo !== stockAnterior) {
        mov = stockNuevo > stockAnterior
          ? { tipo: "Entrada", cantidad: stockNuevo - stockAnterior, motivo: "Aumento de stock al editar el insumo" }
          : { tipo: "Ajuste",  cantidad: stockAnterior - stockNuevo, motivo: "Disminución de stock al editar el insumo" };
        mov.id_movimiento = await MovimientoInventario.registrar(conn, {
          id_insumo:      id,
          tipo:           mov.tipo,
          cantidad:       mov.cantidad,
          stock_anterior: stockAnterior,
          stock_nuevo:    stockNuevo,
          id_empleado:    idAdmin,
          motivo:         mov.motivo,
        });
        }
      }
      await conn.commit();
    } catch (err) {
      await conn.rollback();
      throw err;
    }

    const [rows] = await pool.query(SELECT_INSUMO_COMPLETO, [id]);
    if (mov) {
      try {
        getIO().to("admins").emit("inventario:movimiento", {
          ...mov, id_insumo: id, nombre_insumo: rows[0]?.nombre,
          id_sucursal_origen: null, id_sucursal_destino: null,
        });
      } catch {}
    }
    res.json(rows[0]);
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY")
      return res.status(409).json({ error: "Ya existe un insumo con ese número de serie" });
    res.status(500).json({ error: "Error al actualizar insumo", ...errDetalle(err) });
  } finally {
    conn.release();
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
      `SELECT s.id_solicitud, s.folio_solicitud, s.fecha, s.estatus, s.prioridad,
              TRIM(CONCAT(e.nombre,' ',e.ap_paterno,' ',IFNULL(e.ap_materno,''))) AS nombre_empleado,
              d.nombre_departamento,
              su.nombre_sucursal,
              so.nombre_sucursal AS nombre_sucursal_origen,
              sd.nombre_sucursal AS nombre_sucursal_destino,
              COUNT(si.id_solicitud_insumo) AS total_insumos,
              SUM(si.cantidad) AS total_piezas,
              GROUP_CONCAT(CONCAT(i.nombre,' x',si.cantidad) ORDER BY i.nombre SEPARATOR ', ') AS detalle_insumos,
              GROUP_CONCAT(CONCAT(i.nombre,'|',si.cantidad,'|',IFNULL(si.aprobado,1),'|',IFNULL(i.imagen_url,'')) ORDER BY i.nombre SEPARATOR ';;') AS items_detalle
       FROM solicitud s
       JOIN empleado e          ON s.id_empleado     = e.id_empleado
       LEFT JOIN departamento d ON e.id_departamento = d.id_departamento
       LEFT JOIN sucursal su    ON e.id_sucursal     = su.id_sucursal
       LEFT JOIN sucursal so    ON s.id_sucursal_origen  = so.id_sucursal
       LEFT JOIN sucursal sd    ON s.id_sucursal_destino = sd.id_sucursal
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

export const subirFotoInsumo = async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (!req.file) return res.status(400).json({ error: "No se recibió ninguna imagen" });
  try {
    const [[insumo]] = await pool.query("SELECT imagen_url FROM insumo WHERE id_insumo = ? LIMIT 1", [id]);
    if (!insumo) {
      await fs.promises.unlink(req.file.path).catch(() => {});
      return res.status(404).json({ error: "Insumo no encontrado" });
    }
    // Eliminar la foto anterior SOLO si ningún otro insumo la usa: varios
    // insumos pueden compartir la misma imagen (p. ej. los 4 colores de un
    // tóner) y borrarla les quitaría la foto a todos.
    if (insumo.imagen_url) {
      const [[{ otros }]] = await pool.query(
        "SELECT COUNT(*) AS otros FROM insumo WHERE imagen_url = ? AND id_insumo <> ?",
        [insumo.imagen_url, id]
      );
      if (Number(otros) === 0) {
        const anterior = path.join(INSUMOS_DIR, path.basename(insumo.imagen_url));
        await fs.promises.unlink(anterior).catch(() => {});
      }
    }
    const imagen_url = `/storage/Insumos/${req.file.filename}`;
    await pool.query("UPDATE insumo SET imagen_url = ? WHERE id_insumo = ?", [imagen_url, id]);
    res.json({ ok: true, imagen_url });
  } catch (err) {
    await fs.promises.unlink(req.file.path).catch(() => {});
    res.status(500).json({ error: "Error al guardar la imagen", ...errDetalle(err) });
  }
};

export const eliminarInsumo = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) AS total FROM solicitud_insumo si
       JOIN solicitud s ON si.id_solicitud = s.id_solicitud
       WHERE si.id_insumo = ? AND s.estatus = 'En proceso'`,
      [id]
    );
    if (total > 0)
      return res.status(409).json({ error: "No se puede eliminar: el insumo tiene solicitudes activas pendientes" });
    // Ni movimientos de kardex: borrarlo rompería el historial de entradas/salidas.
    const [[{ movs }]] = await pool.query(
      `SELECT COUNT(*) AS movs FROM movimiento_inventario WHERE id_insumo = ?`,
      [id]
    );
    if (movs > 0)
      return res.status(409).json({ error: "No se puede eliminar: el insumo tiene movimientos registrados. Inhabilítalo en su lugar." });
    const ok = await Insumo.eliminar(id);
    if (!ok) return res.status(404).json({ error: "Insumo no encontrado" });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: "Error al eliminar insumo", ...errDetalle(err) });
  }
};

/**
 * cambiarActivoInsumo
 * PATCH /api/solicitudes/insumos/:id/activo   (solo admin)
 *
 * Baja lógica: { activo: true|false } (también acepta 1/0).
 * Inhabilitar (false) oculta el insumo de Salidas y solicitudes sin borrar
 * el historial. Habilitar (true) lo devuelve a los listados operativos.
 */
export const cambiarActivoInsumo = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!Number.isFinite(id) || id <= 0)
      return res.status(400).json({ error: "ID de insumo inválido" });
    let { activo } = req.body ?? {};
    if (activo === 1 || activo === "1" || activo === "true") activo = true;
    if (activo === 0 || activo === "0" || activo === "false") activo = false;
    if (typeof activo !== "boolean")
      return res.status(422).json({ error: "Datos inválidos", errores: [{ campo: "activo", mensaje: "Debe ser verdadero o falso" }] });
    const ok = await Insumo.cambiarActivo(id, activo);
    if (!ok) return res.status(404).json({ error: "Insumo no encontrado" });
    try {
      getIO().to("admins").emit("inventario:movimiento", { tipo: activo ? "Insumo habilitado" : "Insumo inhabilitado", id_insumo: id });
    } catch {}
    res.json({ ok: true, id_insumo: id, activo });
  } catch (err) {
    res.status(500).json({ error: "Error al cambiar el estado del insumo", ...errDetalle(err) });
  }
};

/** cambiarVisiblePublico
 * PATCH /api/solicitudes/insumos/:id/visible-publico   (solo admin)
 *
 * Control de visibilidad pública:
 *   visible_publico = 1 → el insumo se muestra en el catalogo público
 *                          (inventario, reportes, búsquedas sin restricción)
 *   visible_publico = 0 → el insumo se OCULTA del catalogo público
 *                          (se conserva en el historial y en los movimientos)
 * Por defecto, todos los insumos son visibles (1).
 */
export const cambiarVisiblePublico = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!Number.isFinite(id) || id <= 0)
      return res.status(400).json({ error: "ID de insumo inválido" });
    let { visible } = req.body ?? {};
    if (visible === 1 || visible === "1" || visible === "true") visible = true;
    if (visible === 0 || visible === "0" || visible === "false") visible = false;
    if (typeof visible !== "boolean")
      return res.status(422).json({ error: "Datos inválidos", errores: [{ campo: "visible", mensaje: "Debe ser verdadero o falso" }] });
    const ok = await Insumo.cambiarVisiblePublico(id, visible);
    if (!ok) return res.status(404).json({ error: "Insumo no encontrado" });
    try {
      getIO().to("admins").emit("inventario:movimiento", { tipo: visible ? "Insumo visible público" : "Insumo oculto público", id_insumo: id });
    } catch {}
    res.json({ ok: true, id_insumo: id, visible });
  } catch (err) {
    res.status(500).json({ error: "Error al cambiar la visibilidad pública", ...errDetalle(err) });
  }
};

/** getInsumosForUser
 * GET /api/solicitudes/inventario/for-user   (solo admin o Soporte Tecnico)
 *
 * Retorna los insumos visibles para el rol Usuario: con stock > 0 y no
 * inhabilitados. El `stock` y `disponibilidad` (que delata rangos de stock)
 * no se entregan al usuario normal; solo a administradores y Soporte.
 */
export const getInsumosForUser = async (req, res) => {
  try {
    const rows = await Insumo.getForUser();
    if (req.usuario?.id_rol === 1) return res.json(rows);
    const sinStock = (obj) => {
      if (!obj || typeof obj !== "object") return obj;
      const { stock, disponibilidad, ...resto } = obj;
      return resto;
    };
    return res.json(Array.isArray(rows) ? rows.map(sinStock) : rows);
  } catch (err) {
    res.status(500).json({ error: "Error al obtener el inventario para el usuario", ...errDetalle(err) });
  }
};


/**
 * registrarEntradaInsumo
 * POST /api/solicitudes/insumos/:id/entrada   (solo admin)
 *
 * Registra la ENTRADA fisica de material a un insumo: aumenta el stock y
 * deja el movimiento en `movimiento_inventario`. La entrada NO maneja ruta
 * de sucursales (esa se define en la solicitud, ver guardarRutaSolicitud);
 * solo cantidad, motivo y quien la registro.
 */
export const registrarEntradaInsumo = async (req, res) => {
  const id_insumo = parseInt(req.params.id);
  if (!Number.isFinite(id_insumo) || id_insumo <= 0)
    return res.status(400).json({ error: "ID de insumo inválido" });

  const { cantidad, motivo, id_solicitud, fecha } = req.body;
  const idAdmin = req.usuario?.id_empleado ?? null;

  // Fecha manual opcional (YYYY-MM-DD o con hora). Si no se envía, la columna
  // usa CURRENT_TIMESTAMP (hora del servidor).
  const f = String(fecha ?? "").trim();
  const soloFecha = (f.match(/^\d{4}-\d{2}-\d{2}/) || [])[0] || "";
  const tieneHora = /[T ]\d{2}:\d{2}/.test(f);
  const base = /^\d{4}-\d{2}-\d{2}$/.test(soloFecha)
    ? new Date(tieneHora ? f.replace(" ", "T") : `${soloFecha}T12:00:00`)
    : new Date();
  const pad2 = (n) => String(n).padStart(2, "0");
  const fechaMySQL = f
    ? `${pad2(base.getFullYear())}-${pad2(base.getMonth() + 1)}-${pad2(base.getDate())} ${pad2(base.getHours())}:${pad2(base.getMinutes())}:${pad2(base.getSeconds())}`
    : null;

  try {
    const conn = await pool.getConnection();
    let resultado = null;
    try {
      await conn.beginTransaction();

      const [[ins]] = await conn.query(
        "SELECT id_insumo, nombre, stock FROM insumo WHERE id_insumo = ? FOR UPDATE", [id_insumo]
      );
      if (!ins) {
        await conn.rollback();
        return res.status(404).json({ error: "Insumo no encontrado" });
      }

      const stock_anterior = ins.stock ?? 0;
      const stock_nuevo    = stock_anterior + cantidad;
      await conn.query("UPDATE insumo SET stock = ? WHERE id_insumo = ?", [stock_nuevo, id_insumo]);

      const id_movimiento = await MovimientoInventario.registrar(conn, {
        id_insumo,
        tipo:   "Entrada",
        cantidad,
        stock_anterior,
        stock_nuevo,
        id_empleado: idAdmin,
        motivo:      motivo || "Entrada de material al inventario",
        fecha: fechaMySQL,
      });

      await conn.commit();
      resultado = { id_movimiento, id_insumo, nombre_insumo: ins.nombre, stock_anterior, stock_nuevo };
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }

    Insumo.limpiarCache();
    try {
      getIO().to("admins").emit("inventario:movimiento", { tipo: "Entrada", ...resultado });
    } catch {}

    res.json({ ok: true, ...resultado });
  } catch (err) {
    res.status(500).json({ error: "Error al registrar la entrada de material", ...errDetalle(err) });
  }
};

/**
 * editarEntrada
 * PUT /api/solicitudes/movimientos/:id   (solo admin)
 *
 * Corrige una ENTRADA ya registrada (cantidad, motivo y/o fecha) y ajusta el
 * inventario automáticamente, en una sola transacción:
 *   diferencia = cantidad nueva − cantidad anterior
 *   - la entrada queda con stock_nuevo + diferencia;
 *   - todos los movimientos POSTERIORES del mismo insumo recorren su
 *     stock_anterior / stock_nuevo en la misma diferencia (el kardex sigue
 *     encadenado: cada movimiento empieza donde terminó el anterior);
 *   - insumo.stock se ajusta en la misma diferencia.
 * Si reducir la entrada dejaría el stock negativo en algún punto (porque ya
 * salieron esas unidades), responde 409 y no cambia nada.
 */
export const editarEntrada = async (req, res) => {
  const id = toPosId(req.params.id);
  if (!id) return res.status(400).json({ error: "ID de movimiento inválido" });
  const cantidadNueva = parseInt(req.body.cantidad, 10);
  if (!Number.isFinite(cantidadNueva) || cantidadNueva < 1)
    return res.status(400).json({ error: "La cantidad debe ser al menos 1" });
  const motivo = req.body.motivo === undefined ? undefined : (String(req.body.motivo ?? "").trim() || null);

  // Fecha manual opcional (mismo formato que al registrar la entrada).
  const f = String(req.body.fecha ?? "").trim();
  let fechaMySQL = null;
  if (f) {
    const soloFecha = (f.match(/^\d{4}-\d{2}-\d{2}/) || [])[0];
    const tieneHora = /[T ]\d{2}:\d{2}/.test(f);
    const d = new Date(tieneHora ? f.replace(" ", "T") : `${soloFecha}T12:00:00`);
    if (Number.isNaN(d.getTime())) return res.status(400).json({ error: "Fecha inválida" });
    const p = (n) => String(n).padStart(2, "0");
    fechaMySQL = `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
  }

  let resultado = null;
  try {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      const [[mov]] = await conn.query(
        "SELECT id_movimiento, id_insumo, tipo, cantidad, stock_anterior, stock_nuevo FROM movimiento_inventario WHERE id_movimiento = ? FOR UPDATE",
        [id]
      );
      if (!mov) { await conn.rollback(); return res.status(404).json({ error: "Movimiento no encontrado" }); }
      if (mov.tipo !== "Entrada") {
        await conn.rollback();
        return res.status(409).json({ error: "Solo se pueden editar entradas. Las salidas se corrigen con una entrada o un ajuste." });
      }
      const [[ins]] = await conn.query(
        "SELECT id_insumo, nombre, stock FROM insumo WHERE id_insumo = ? FOR UPDATE", [mov.id_insumo]
      );
      const delta = cantidadNueva - mov.cantidad;

      if (delta < 0) {
        // El punto más bajo del kardex a partir de esta entrada no puede quedar negativo.
        const [[min]] = await conn.query(
          `SELECT LEAST(MIN(stock_nuevo), MIN(IF(id_movimiento > ?, stock_anterior, stock_nuevo))) AS minimo
             FROM movimiento_inventario WHERE id_insumo = ? AND id_movimiento >= ?`,
          [id, mov.id_insumo, id]
        );
        const minimo = Math.min(Number(min?.minimo ?? 0), Number(ins.stock));
        if (minimo + delta < 0) {
          await conn.rollback();
          return res.status(409).json({
            error: `No se puede bajar la entrada a ${cantidadNueva}: de "${ins.nombre}" ya salieron unidades y el inventario quedaría negativo (mínimo permitido: ${mov.cantidad - minimo}).`,
          });
        }
      }

      await conn.query(
        `UPDATE movimiento_inventario
            SET cantidad = ?, stock_nuevo = stock_nuevo + ?
                ${motivo !== undefined ? ", motivo = ?" : ""}
                ${fechaMySQL ? ", fecha = ?" : ""}
          WHERE id_movimiento = ?`,
        [cantidadNueva, delta, ...(motivo !== undefined ? [motivo] : []), ...(fechaMySQL ? [fechaMySQL] : []), id]
      );
      if (delta !== 0) {
        await conn.query(
          `UPDATE movimiento_inventario
              SET stock_anterior = stock_anterior + ?, stock_nuevo = stock_nuevo + ?
            WHERE id_insumo = ? AND id_movimiento > ?`,
          [delta, delta, mov.id_insumo, id]
        );
        await conn.query("UPDATE insumo SET stock = stock + ? WHERE id_insumo = ?", [delta, mov.id_insumo]);
      }
      await conn.commit();
      resultado = {
        id_movimiento: id, id_insumo: mov.id_insumo, nombre_insumo: ins.nombre,
        cantidad_anterior: mov.cantidad, cantidad: cantidadNueva, diferencia: delta,
        stock_anterior: ins.stock, stock_nuevo: ins.stock + delta,
      };
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
    Insumo.limpiarCache();
    try { getIO().to("admins").emit("inventario:movimiento", { tipo: "Entrada editada", ...resultado }); } catch {}
    res.json({ ok: true, ...resultado });
  } catch (err) {
    res.status(500).json({ error: "Error al editar la entrada", ...errDetalle(err) });
  }
};

/**
 * registrarSalidaInsumo
 * POST /api/solicitudes/salidas   (solo admin)
 *
 * Registra una SALIDA INTERNA manual de insumos (uso interno, sin solicitud):
 * descuenta stock en transacción y deja un movimiento tipo 'Salida' por cada
 * renglón en `movimiento_inventario`. Todo lo que el admin escribe en la hoja
 * (destino, responsable, motivo libre) viaja dentro del campo `motivo`
 * estructurado, sin migración de BD:
 *   "[SAL-202610-001] Uso interno · Destino: Taller · Recibe: Juan · <motivo>"
 *
 * Acepta un renglón ({ id_insumo, cantidad }) o varios ({ items: [...] }).
 * Falla con 409 si algún renglón pide más stock del disponible; en ese caso
 * NO descuenta nada (rollback total).
 */
export const registrarSalidaInsumo = async (req, res) => {
  const { id_insumo, cantidad, items, destino, responsable, motivo, fecha, solicitante,
    id_destino, id_responsable, id_solicitante, id_sucursal_origen, id_sucursal_destino,
    justificacion, prioridad } = req.body;
  const renglones = Array.isArray(items) && items.length > 0
    ? items.map(r => ({ id_insumo: parseInt(r.id_insumo, 10), cantidad: parseInt(r.cantidad, 10) }))
    : [{ id_insumo: parseInt(id_insumo, 10), cantidad: parseInt(cantidad, 10) }];

  if (renglones.some(r => !Number.isFinite(r.id_insumo) || r.id_insumo <= 0 || !Number.isFinite(r.cantidad) || r.cantidad <= 0))
    return res.status(400).json({ error: "Cada renglón debe traer insumo y cantidad válidos" });

  // Un mismo insumo puede repetirse en la hoja: se consolidan cantidades
  const consolidado = new Map();
  for (const r of renglones)
    consolidado.set(r.id_insumo, (consolidado.get(r.id_insumo) || 0) + r.cantidad);
  const lista = [...consolidado.entries()].map(([id_insumo, cantidad]) => ({ id_insumo, cantidad }));

  const idAdmin = req.usuario?.id_empleado ?? null;

  // Validar que el empleado autenticado exista en la tabla empleado.
  // Si no existe, el INSERT en movimiento_inventario fallaría con FK violation (500);
  // mejor devolver un 403 claro antes de tocar la BD.
  if (!Number.isFinite(parseInt(idAdmin, 10)) || idAdmin <= 0) {
    return res.status(403).json({ error: "Usuario autenticado sin id_empleado válido" });
  }
  const [[empExiste]] = await pool.query(
    "SELECT id_empleado FROM empleado WHERE id_empleado = ? LIMIT 1",
    [idAdmin]
  );
  if (!empExiste) {
    return res.status(403).json({
      error: `El empleado autenticado (id_empleado=${idAdmin}) no está registrado en la tabla empleado`,
    });
  }

  // Validar sucursales de origen/destino si se envían: FK violation daría 500;
  // mejor devolver 403 claro antes de tocar la BD.
  const idSucOrigenRaw  = id_sucursal_origen  != null ? parseInt(id_sucursal_origen, 10)  : null;
  const idSucDestinoRaw = id_sucursal_destino != null ? parseInt(id_sucursal_destino, 10) : null;

  if (idSucOrigenRaw != null && (!Number.isFinite(idSucOrigenRaw) || idSucOrigenRaw <= 0)) {
    return res.status(400).json({ error: "Sucursal de origen inválida" });
  }
  if (idSucDestinoRaw != null && (!Number.isFinite(idSucDestinoRaw) || idSucDestinoRaw <= 0)) {
    return res.status(400).json({ error: "Sucursal de destino inválida" });
  }

  if (idSucOrigenRaw != null) {
    const [[sucOrigen]] = await pool.query(
      "SELECT id_sucursal FROM sucursal WHERE id_sucursal = ? LIMIT 1",
      [idSucOrigenRaw]
    );
    if (!sucOrigen) {
      return res.status(403).json({
        error: `La sucursal de origen (id_sucursal=${idSucOrigenRaw}) no está registrada en la tabla sucursal`,
      });
    }
  }

  if (idSucDestinoRaw != null) {
    const [[sucDestino]] = await pool.query(
      "SELECT id_sucursal FROM sucursal WHERE id_sucursal = ? LIMIT 1",
      [idSucDestinoRaw]
    );
    if (!sucDestino) {
      return res.status(403).json({
        error: `La sucursal de destino (id_sucursal=${idSucDestinoRaw}) no está registrada en la tabla sucursal`,
      });
    }
  }

  try {
    const conn = await pool.getConnection();
    let resultado = null;
    try {
      await conn.beginTransaction();

      // FECHA MANUAL del formato: es la fecha y hora reales del movimiento
      // físico que el usuario escribe en la hoja (no la del servidor). El
      // folio usa esa misma fecha para que hoja y consecutivo coincidan.
      // Acepta "YYYY-MM-DD" (hojas viejas) o "YYYY-MM-DDTHH:MM" (formato nuevo).
      const f = String(fecha ?? "").trim();
      const soloFecha = (f.match(/^\d{4}-\d{2}-\d{2}/) || [])[0] || "";
      const tieneHora = /[T ]\d{2}:\d{2}/.test(f);
      const base = /^\d{4}-\d{2}-\d{2}$/.test(soloFecha)
        ? new Date(tieneHora ? f.replace(" ", "T") : `${soloFecha}T12:00:00`)
        : new Date();
      // Fecha para MySQL (YYYY-MM-DD HH:MM:SS). Si no se envió, queda null y
      // la columna `fecha` usa CURRENT_TIMESTAMP (hora del servidor).
      const pad2 = (n) => String(n).padStart(2, "0");
      const fechaMySQL = f
        ? `${pad2(base.getFullYear())}-${pad2(base.getMonth() + 1)}-${pad2(base.getDate())} ${pad2(base.getHours())}:${pad2(base.getMinutes())}:${pad2(base.getSeconds())}`
        : null;
      // ── Cabecera de la salida (tabla salida_interna) ──────────────────
      // Antes todo (folio, ruta, prioridad, solicitante, puesto, justificación)
      // se concatenaba en el texto de `motivo` de CADA renglón. Ahora vive en
      // columnas propias de una sola fila de cabecera, y los movimientos solo
      // la referencian por id_salida. Puesto, sucursal y número de empleado del
      // solicitante NO se copian: se obtienen por JOIN desde `empleado`.
      //
      // Folio por MES de la fecha física: SAL-YYYYMM-NNNN.
      const folio = await generarFolio(conn, "salida_interna", "folio_salida", "SAL", base);

      const idSucOrigen     = toPosId(id_sucursal_origen);
      const idSucDestino    = toPosId(id_destino ?? id_sucursal_destino);
      const idSolicitante   = toPosId(id_solicitante);
      const idResponsable   = toPosId(id_responsable);
      // Texto libre solo cuando no se eligió un empleado/sucursal de la lista.
      const solicitanteTxt  = idSolicitante ? null : (String(solicitante ?? "").trim() || null);
      const responsableTxt  = idResponsable ? null : (String(responsable ?? "").trim() || null);
      const destinoTxt      = idSucDestino  ? null : (String(destino ?? "").trim() || null);
      const justTxt         = (String(justificacion ?? "").trim() || String(motivo ?? "").trim() || null);
      const PRIORIDADES     = ["Baja", "Media", "Alta", "Urgente"];
      const prioTxt         = PRIORIDADES.includes(String(prioridad ?? "").trim()) ? String(prioridad).trim() : "Media";

      const [cab] = await conn.query(
        `INSERT INTO salida_interna
           (folio_salida, fecha, prioridad, id_sucursal_origen, id_sucursal_destino, destino_texto,
            id_solicitante, solicitante_texto, id_responsable, responsable_texto, justificacion, id_registro)
         VALUES (?, COALESCE(?, NOW()), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [folio, fechaMySQL, prioTxt, idSucOrigen, idSucDestino, destinoTxt,
         idSolicitante, solicitanteTxt, idResponsable, responsableTxt,
         justTxt, idAdmin]
      );
      const idSalida = cab.insertId;
      const movs = [];
      for (const { id_insumo: idIns, cantidad: cant } of lista) {
        // `activo` puede no existir si aún no se corre la migración 027:
        // en ese caso se asume activo y la baja lógica simplemente no aplica.
        let ins;
        try {
          [[ins]] = await conn.query(
            "SELECT id_insumo, nombre, descripcion, marca, modelo, stock, activo, imagen_url FROM insumo WHERE id_insumo = ? FOR UPDATE", [idIns]
          );
        } catch {
          [[ins]] = await conn.query(
            "SELECT id_insumo, nombre, descripcion, marca, modelo, stock, imagen_url FROM insumo WHERE id_insumo = ? FOR UPDATE", [idIns]
          );
        }
        if (!ins) {
          await conn.rollback();
          return res.status(404).json({ error: `Insumo ${idIns} no encontrado` });
        }
        if (Number(ins.activo) === 0) {
          await conn.rollback();
          return res.status(409).json({ error: `El insumo "${ins.nombre}" está inhabilitado` });
        }
        const stock_anterior = ins.stock ?? 0;
        if (stock_anterior < cant) {
          await conn.rollback();
          return res.status(409).json({
            error: `Stock insuficiente en "${ins.nombre}": hay ${stock_anterior}, piden ${cant}`,
          });
        }
        const stock_nuevo = stock_anterior - cant;
        await conn.query("UPDATE insumo SET stock = ? WHERE id_insumo = ?", [stock_nuevo, idIns]);
        const id_movimiento = await MovimientoInventario.registrar(conn, {
          id_insumo: idIns,
          tipo:   "Salida",
          cantidad: cant,
          stock_anterior,
          stock_nuevo,
          id_empleado: idAdmin,
          id_sucursal_origen:  idSucOrigen,
          id_sucursal_destino: idSucDestino,
          id_salida:   idSalida,
          motivo:      null,        // los datos de la salida están en salida_interna
          fecha: fechaMySQL,
        });
        movs.push({ id_movimiento, id_insumo: idIns, nombre_insumo: ins.nombre, descripcion: ins.descripcion ?? null, marca: ins.marca ?? null, modelo: ins.modelo ?? null, imagen_url: ins.imagen_url ?? null, cantidad: cant, stock_anterior, stock_nuevo });
      }

      await conn.commit();
      resultado = { folio, id_salida: idSalida, total_renglones: movs.length, movimientos: movs };
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }

    Insumo.limpiarCache();
    try {
      getIO().to("admins").emit("inventario:movimiento", { tipo: "Salida", ...resultado });
    } catch {}

    res.json({ ok: true, ...resultado });
  } catch (err) {
    // Log obligatorio: sin esto el error 500 es invisible en la consola del
    // servidor y solo aparece en el body de la respuesta (DevTools → Response).
    console.error("[salidas] Error al registrar salida de insumos:", err);
    res.status(500).json({ error: "Error al registrar la salida de insumos", ...errDetalle(err) });
  }
};

/**
 * guardarRutaSolicitud
 * PATCH /api/solicitudes/:id/ruta   (solo admin)
 *
 * Guarda la RUTA DEL MATERIAL (de que sucursal sale y a cual llega) sin
 * tocar el estatus ni la aprobacion de los items. Solo se permite mientras la
 * solicitud esta ABIERTA: es el paso previo a aceptar, y es la ruta que
 * despues se imprime en la hoja.
 */
export const guardarRutaSolicitud = async (req, res) => {
  const id = parseInt(req.params.id);
  if (!Number.isFinite(id) || id <= 0) return res.status(400).json({ error: "ID de solicitud inválido" });

  const id_sucursal_origen  = toPosId(req.body.id_sucursal_origen);
  const id_sucursal_destino = toPosId(req.body.id_sucursal_destino);
  if (!id_sucursal_origen || !id_sucursal_destino)
    return res.status(400).json({ error: "Selecciona la sucursal de origen y la de destino" });

  try {
    const [[sol]] = await pool.query(
      "SELECT estatus FROM solicitud WHERE id_solicitud = ? LIMIT 1", [id]
    );
    if (!sol) return res.status(404).json({ error: "Solicitud no encontrada" });
    // La ruta se elige ANTES de aceptar: una vez cerrada queda fijada y solo
    // se puede imprimir en la hoja, no editar.
    if (sol.estatus === "Aceptado" || sol.estatus === "Rechazado")
      return res.status(409).json({ error: "La solicitud ya está cerrada: la ruta quedó autorizada al aceptar y ya no se puede cambiar" });

    const errRuta = await validarRutaSucursales(pool, id_sucursal_origen, id_sucursal_destino);
    if (errRuta) return res.status(400).json({ error: errRuta.message });

    await Solicitud.actualizarRuta(id, { id_sucursal_origen, id_sucursal_destino });

    // Nombres resueltos para refrescar la tarjeta de ruta sin recargar todo
    const [[row]] = await pool.query(
      `SELECT so.nombre_sucursal AS nombre_sucursal_origen,
              sd.nombre_sucursal AS nombre_sucursal_destino
         FROM solicitud s
         LEFT JOIN sucursal so ON s.id_sucursal_origen  = so.id_sucursal
         LEFT JOIN sucursal sd ON s.id_sucursal_destino = sd.id_sucursal
        WHERE s.id_solicitud = ? LIMIT 1`, [id]
    );
    res.json({
      ok: true,
      id_sucursal_origen,
      id_sucursal_destino,
      nombre_sucursal_origen:  row?.nombre_sucursal_origen  ?? null,
      nombre_sucursal_destino: row?.nombre_sucursal_destino ?? null,
    });
  } catch (err) {
    res.status(500).json({ error: "Error al guardar la ruta del material", ...errDetalle(err) });
  }
};

/**
 * getMovimientosInventario
 * GET /api/solicitudes/movimientos   (solo admin)
 *
 * Movimientos de inventario con filtros:
 *   ?tipo=Entrada|Salida|Ajuste &id_insumo= &id_sucursal= &folio=
 *   &q=TEXTO (nombre/marca/modelo del insumo, motivo o folio)
 *   &fecha_inicio=YYYY-MM-DD &fecha_fin=YYYY-MM-DD &page= &limit=
 */
export const getMovimientosInventario = async (req, res) => {
  const q = req.query ?? {};
  // Validación: tipo es obligatorio para esta ruta de listado
  if (!q.tipo || !["Entrada", "Salida", "Ajuste"].includes(q.tipo)) {
    return res.status(400).json({ error: "Parámetro 'tipo' es requerido y debe ser Entrada, Salida o Ajuste" });
  }
  
  const esFecha = v => /^\d{4}-\d{2}-\d{2}$/.test(v ?? "");
  try {
    const { rows, total } = await MovimientoInventario.listar({
      page:         Math.max(parseInt(q.page)  || 1, 1),
      limit:        Math.min(Math.max(parseInt(q.limit) || 50, 1), 500),
      tipo:         q.tipo,
      id_insumo:    q.id_insumo ? toPosId(q.id_insumo) : undefined,
      id_sucursal:  q.id_sucursal ? toPosId(q.id_sucursal) : undefined,
      q:            q.q && q.q.trim() ? q.q.trim().slice(0, 100) : undefined,
      folio:        q.folio && q.folio.trim() ? q.folio.trim() : undefined,
      fecha_inicio: q.fecha_inicio && esFecha(q.fecha_inicio) ? q.fecha_inicio : undefined,
      fecha_fin:    q.fecha_fin    && esFecha(q.fecha_fin)    ? q.fecha_fin    : undefined,
    });
    res.json({ rows, total });
  } catch (err) {
    console.error("[movimientos] Error al listar:", err.message);
    res.status(500).json({ error: "Error al obtener los movimientos de inventario", ...errDetalle(err) });
  }
};

/**
 * getSalidasMiSucursal
 * GET /api/solicitudes/movimientos/mis-salidas   (cualquier rol autenticado)
 *
 * Salidas de material destinadas A LA SUCURSAL del usuario que hace la
 * petición (se resuelve desde su token / empleado, nunca se acepta un id por
 * query para que nadie pueda ver salidas de otra sucursal).
 *
 * Así el Historial de Insumos del rol Usuario (Sucursal) puede mostrar las
 * mismas salidas que ve Administración, filtradas por su sucursal.
 */
export const getSalidasMiSucursal = async (req, res) => {
  try {
    const u = req.usuario ?? {};
    let id_sucursal = toPosId(u.id_sucursal);
    if (!id_sucursal && u.id_empleado) {
      const [[emp]] = await pool.query(
        "SELECT id_sucursal FROM empleado WHERE id_empleado = ? LIMIT 1",
        [u.id_empleado]
      );
      id_sucursal = toPosId(emp?.id_sucursal);
    }
    if (!id_sucursal) return res.json({ rows: [], total: 0 });

    const q = req.query ?? {};
    const { rows, total } = await MovimientoInventario.listar({
      page:  Math.max(parseInt(q.page) || 1, 1),
      limit: Math.min(Math.max(parseInt(q.limit) || 100, 1), 500),
      tipo:  "Salida",
      id_sucursal_relacionada: id_sucursal,
      q: typeof q.q === "string" && q.q.trim() ? q.q.trim().slice(0, 100) : undefined,
    });
    res.json({ rows, total });
  } catch (err) {
    res.status(500).json({ error: "Error al obtener las salidas de la sucursal", ...errDetalle(err) });
  }
};

/**
 * getMovimientosInsumo
 * GET /api/solicitudes/insumos/:id/movimientos
 *
 * Ultimos movimientos de un insumo concreto.
 */
export const getMovimientosInsumo = async (req, res) => {
  const id = parseInt(req.params.id);
  if (!Number.isFinite(id) || id <= 0) return res.status(400).json({ error: "ID inválido" });
  const limite = Math.min(Math.max(parseInt(req.query.limite) || 30, 1), 200);
  try {
    res.json(await MovimientoInventario.porInsumo(id, limite));
  } catch (err) {
    res.status(500).json({ error: "Error al obtener los movimientos del insumo", ...errDetalle(err) });
  }
};

/**
 * getMovimientosSolicitud
 * GET /api/solicitudes/:id/movimientos
 *
 * Salidas de material generadas por una solicitud aceptada (para la hoja
 * de entrega y para que el usuario vea de donde salio su material).
 */
export const getMovimientosSolicitud = async (req, res) => {
  const id = parseInt(req.params.id);
  if (!Number.isFinite(id) || id <= 0) return res.status(400).json({ error: "ID inválido" });
  try {
    res.json(await MovimientoInventario.porSolicitud(id));
  } catch (err) {
    res.status(500).json({ error: "Error al obtener los movimientos de la solicitud", ...errDetalle(err) });
  }
};

