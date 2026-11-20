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
 *     critico (stock <= STOCK_BAJO) y emite alertas de stock por Socket.io. Para otros
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
 *
 * NOTA: las funciones de catálogo de insumos viven en insumos-controller.js
 * y las de movimientos (entradas, salidas, kardex) en inventario-controller.js.
 */
import Solicitud from '../services/solicitud.js';
import Insumo    from '../services/insumo.js';
import Empleado  from '../services/empleado.js';
import MovimientoInventario from '../services/movimiento-inventario.js';
import { getIO } from '../config/socket-instance.js';
import pool      from '../config/db.js';
import { esSoporteOAdmin } from '../middlewares/auth-middleware.js';
import { STOCK_BAJO } from '../utils/stock.js';
import { errDetalle, esAdmin, toPosId, validarRutaSucursales } from './comun.js';
import Unidad from '../services/unidad.js';

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
  // Un insumo va una sola vez por solicitud (la base lo exige con UNIQUE):
  // si viene repetido se avisa en vez de fallar con error del sistema.
  const vistos = new Set();
  for (const item of insumos) {
    const k = parseInt(item.id_insumo, 10);
    if (vistos.has(k))
      return res.status(400).json({ error: "Un insumo está repetido en la solicitud: junta las cantidades en un solo renglón" });
    vistos.add(k);
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
              SET cantidad_aprobada = ?
            WHERE id_solicitud_insumo = ? AND id_solicitud = ?`,
          [it.aprovado === 1 ? it.cantidad_aprobada : 0, it.id_solicitud_insumo, id]
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
            `UPDATE solicitud_insumo SET cantidad_aprobada = ?
              WHERE id_solicitud_insumo = ? AND id_solicitud = ?`,
            [r.aprovado === 1 ? r.cantidad_aprobada : 0, r.id_solicitud_insumo, id]
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
          const id_movimiento = await MovimientoInventario.registrar(conn, {
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
          // Insumo por pieza: salen las piezas con más tiempo en almacén (queda registrada la serie).
          if (await Unidad.controla(conn, r.id_insumo))
            await Unidad.registrarSalida(conn, { id_insumo: r.id_insumo, nombre: r.nombre_insumo, series: null, cantidad: r.cantidad_aprobada, id_movimiento });
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
               FROM insumo i WHERE i.id_insumo IN (?) AND i.stock <= ?`,
              [idsInsumos, STOCK_BAJO]
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
    const status = [400, 409].includes(err.statusCode) ? err.statusCode : 500;
    res.status(status).json({ error: status !== 500 ? err.message : "Error al actualizar solicitud", ...errDetalle(err) });
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
