/**
 * inventario-controller.js
 *
 * Movimientos físicos del inventario: entradas, edición de entradas, salidas
 * internas (SAL-…), anulación de salidas, kardex y reporte de consumo.
 * Cada operación que cambia stock lo hace en transacción junto con su
 * movimiento en `movimiento_inventario`.
 *
 * @module server/controllers/inventario-controller
 * @exports registrarEntradaInsumo
 * @exports editarEntrada
 * @exports registrarSalidaInsumo
 * @exports getMovimientosInventario
 * @exports getSalidasMiSucursal
 * @exports getMovimientosInsumo
 */
import Insumo    from '../services/insumo.js';
import MovimientoInventario from '../services/movimiento-inventario.js';
import { getIO } from '../config/socket-instance.js';
import pool      from '../config/db.js';
import { generarFolio } from '../utils/helpers.js';
import { errDetalle, toPosId } from './comun.js';
import Unidad from '../services/unidad.js';

const errorDeCaptura = (err) => [400, 404, 409].includes(err?.statusCode) ? err.statusCode : null;

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

  const { cantidad, motivo, fecha } = req.body;
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
        "SELECT id_insumo, nombre, stock, control_serie FROM insumo WHERE id_insumo = ? FOR UPDATE", [id_insumo]
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

      // Insumo controlado por pieza: cada pieza que entra trae su número de serie.
      let series = null;
      if (Number(ins.control_serie) === 1)
        series = await Unidad.registrarEntrada(conn, { id_insumo, nombre: ins.nombre, series: req.body.series, cantidad, id_movimiento });

      await conn.commit();
      resultado = { id_movimiento, id_insumo, nombre_insumo: ins.nombre, imagen_url: ins.imagen_url || null, stock_anterior, stock_nuevo, ...(series ? { series } : {}) };
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
    if (errorDeCaptura(err)) return res.status(err.statusCode).json({ error: err.message });
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
        "SELECT id_movimiento, id_insumo, tipo, cantidad, stock_anterior, stock_nuevo, id_salida FROM movimiento_inventario WHERE id_movimiento = ? FOR UPDATE",
        [id]
      );
      if (!mov) { await conn.rollback(); return res.status(404).json({ error: "Movimiento no encontrado" }); }
      if (mov.tipo !== "Entrada") {
        await conn.rollback();
        return res.status(409).json({ error: "Solo se pueden editar entradas. Las salidas se corrigen con una entrada o un ajuste." });
      }
      if (await Unidad.controla(conn, mov.id_insumo)) {
        await conn.rollback();
        return res.status(409).json({ error: "Este insumo se controla por número de serie: la entrada no se puede editar. Registra una salida o una entrada nueva con las series correctas." });
      }
      // Una entrada ligada a una salida es la DEVOLUCIÓN automática de una
      // salida anulada: editarla descuadraría la anulación.
      if (mov.id_salida != null) {
        await conn.rollback();
        return res.status(409).json({ error: "Esta entrada es la devolución de una salida anulada y no se puede editar." });
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
    ? items.map(r => ({ id_insumo: parseInt(r.id_insumo, 10), cantidad: parseInt(r.cantidad, 10), series: Array.isArray(r.series) ? r.series : null }))
    : [{ id_insumo: parseInt(id_insumo, 10), cantidad: parseInt(cantidad, 10), series: Array.isArray(req.body.series) ? req.body.series : null }];

  if (renglones.some(r => !Number.isFinite(r.id_insumo) || r.id_insumo <= 0 || !Number.isFinite(r.cantidad) || r.cantidad <= 0))
    return res.status(400).json({ error: "Cada renglón debe traer insumo y cantidad válidos" });

  // Un mismo insumo puede repetirse en la hoja: se consolidan cantidades
  const consolidado = new Map();
  const seriesPorInsumo = new Map();   // insumos por pieza: series elegidas
  for (const r of renglones) {
    consolidado.set(r.id_insumo, (consolidado.get(r.id_insumo) || 0) + r.cantidad);
    if (r.series) seriesPorInsumo.set(r.id_insumo, [...(seriesPorInsumo.get(r.id_insumo) || []), ...r.series]);
  }
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
        // Insumo controlado por pieza: se elige qué número de serie sale.
        let series = null;
        if (await Unidad.controla(conn, idIns)) {
          if (!seriesPorInsumo.has(idIns))
            throw Object.assign(new Error(`Elige qué número(s) de serie de "${ins.nombre}" salen`), { statusCode: 400 });
          series = await Unidad.registrarSalida(conn, { id_insumo: idIns, nombre: ins.nombre, series: seriesPorInsumo.get(idIns), cantidad: cant, id_movimiento });
        }
        movs.push({ id_movimiento, id_insumo: idIns, nombre_insumo: ins.nombre, descripcion: ins.descripcion ?? null, marca: ins.marca ?? null, modelo: ins.modelo ?? null, imagen_url: ins.imagen_url ?? null, cantidad: cant, stock_anterior, stock_nuevo, ...(series ? { series } : {}) });
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
    if (errorDeCaptura(err)) return res.status(err.statusCode).json({ error: err.message });
    console.error("[salidas] Error al registrar salida de insumos:", err);
    res.status(500).json({ error: "Error al registrar la salida de insumos", ...errDetalle(err) });
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
 * anularSalida
 * POST /api/solicitudes/salidas/:id/anular   (solo admin)
 * Body: { motivo }  (obligatorio, 5–500 caracteres)
 *
 * Anula una SALIDA INTERNA registrada por error. No borra nada:
 *   1. Regresa al stock cada renglón de la salida con un movimiento tipo
 *      'Entrada' ligado a la misma salida (id_salida), así el kardex cuadra.
 *   2. Marca la cabecera como 'Anulada' con motivo, fecha y quién la anuló.
 * Todo en una transacción. Una salida ya anulada responde 409.
 * Para "corregir" una salida: se anula y se captura de nuevo bien.
 */
export const anularSalida = async (req, res) => {
  const id = toPosId(req.params.id);
  const motivo = String(req.body?.motivo ?? "").trim();
  if (!id) return res.status(400).json({ error: "Salida inválida" });
  if (motivo.length < 5)
    return res.status(400).json({ error: "Escribe el motivo de la anulación (mínimo 5 caracteres)" });
  if (motivo.length > 500)
    return res.status(400).json({ error: "El motivo no puede pasar de 500 caracteres" });
  const idAdmin = req.usuario?.id_empleado ?? null;

  let resultado;
  try {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      const [[sal]] = await conn.query(
        `SELECT s.id_salida, s.folio_salida, s.fecha, IF(a.id_salida IS NULL, 'Activa', 'Anulada') AS estatus
           FROM salida_interna s LEFT JOIN salida_anulacion a ON a.id_salida = s.id_salida
          WHERE s.id_salida = ? FOR UPDATE`, [id]
      );
      if (!sal) { await conn.rollback(); return res.status(404).json({ error: "Salida no encontrada" }); }
      if (sal.estatus === "Anulada") {
        await conn.rollback();
        return res.status(409).json({ error: `La salida ${sal.folio_salida} ya estaba anulada` });
      }

      const [renglones] = await conn.query(
        `SELECT id_movimiento, id_insumo, cantidad, id_sucursal_origen, id_sucursal_destino
           FROM movimiento_inventario
          WHERE id_salida = ? AND tipo = 'Salida'
          ORDER BY id_insumo, id_movimiento`,
        [id]
      );

      const devueltos = [];
      for (const r of renglones) {
        // Bloqueo en orden de id_insumo (ORDER BY) para no cruzarse con otras
        // transacciones de stock y evitar interbloqueos.
        const [[ins]] = await conn.query(
          "SELECT id_insumo, nombre, stock FROM insumo WHERE id_insumo = ? FOR UPDATE", [r.id_insumo]
        );
        if (!ins) continue; // el FK RESTRICT impide borrar insumos con movimientos
        const stock_anterior = Number(ins.stock) || 0;
        const stock_nuevo    = stock_anterior + Number(r.cantidad);
        await conn.query("UPDATE insumo SET stock = ? WHERE id_insumo = ?", [stock_nuevo, r.id_insumo]);
        await MovimientoInventario.registrar(conn, {
          id_insumo: r.id_insumo,
          tipo: "Entrada",
          cantidad: r.cantidad,
          stock_anterior,
          stock_nuevo,
          // El material regresa: la ruta va al revés que la salida.
          id_sucursal_origen:  r.id_sucursal_destino,
          id_sucursal_destino: r.id_sucursal_origen,
          id_salida:   id,
          id_empleado: idAdmin,
          motivo: `Anulación de ${sal.folio_salida}: ${motivo}`.slice(0, 500),
        });
        await Unidad.devolverSalida(conn, r.id_movimiento);   // piezas con serie regresan al almacén
        devueltos.push({ id_insumo: r.id_insumo, nombre: ins.nombre, imagen_url: ins.imagen_url || null, cantidad: r.cantidad, stock_nuevo });
      }

      // La anulación vive en salida_anulacion (migración 007): existir = anulada.
      await conn.query(
        "INSERT INTO salida_anulacion (id_salida, motivo, id_anulo) VALUES (?, ?, ?)",
        [id, motivo, idAdmin]
      );
      await conn.commit();
      resultado = { folio: sal.folio_salida, id_salida: id, devueltos };
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  } catch (err) {
    // Dos anulaciones al mismo tiempo: la segunda choca con la PK de salida_anulacion.
    if (err?.code === "ER_DUP_ENTRY") return res.status(409).json({ error: "La salida ya estaba anulada" });
    console.error("[salidas] Error al anular salida:", err);
    return res.status(500).json({ error: "Error al anular la salida", ...errDetalle(err) });
  }

  Insumo.limpiarCache();
  try { getIO().to("admins").emit("inventario:movimiento", { tipo: "Anulacion", ...resultado }); } catch { /* sin socket */ }
  res.json({ ok: true, ...resultado });
};

/**
 * corregirFechaSalida
 * PUT /api/solicitudes/salidas/:id/fecha   (solo admin)
 * Body: { fecha: "AAAA-MM-DD" | "AAAA-MM-DDTHH:MM", motivo }
 *
 * Corrige la fecha física de una salida interna capturada mal, sin tocar la
 * base de datos a mano. Cambia la fecha de la cabecera y de sus renglones de
 * inventario (para que el historial y el reporte de consumo cuadren) y deja
 * el cambio en `salida_cambio` con valor anterior/nuevo, motivo y quién.
 *
 * Reglas:
 *   - La salida no debe estar anulada (409).
 *   - La nueva fecha no puede ser futura.
 *   - Debe quedar en el MISMO mes del folio (SAL-AAAAMM-…): el consecutivo es
 *     por mes. Para cambiar de mes se anula y se captura de nuevo.
 *   - Si solo se manda el día, se conserva la hora original.
 */
export const corregirFechaSalida = async (req, res) => {
  const id = toPosId(req.params.id);
  const motivo = String(req.body?.motivo ?? "").trim();
  const f = String(req.body?.fecha ?? "").trim();
  if (!id) return res.status(400).json({ error: "Salida inválida" });
  const m = f.match(/^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2}))?$/);
  if (!m) return res.status(400).json({ error: "Escribe una fecha válida" });
  if (motivo.length < 5)
    return res.status(400).json({ error: "Escribe el motivo de la corrección (mínimo 5 caracteres)" });
  if (motivo.length > 500)
    return res.status(400).json({ error: "El motivo no puede pasar de 500 caracteres" });
  const [, Y, M, D, hh, mm] = m;
  const prueba = new Date(Number(Y), Number(M) - 1, Number(D));
  if (prueba.getMonth() !== Number(M) - 1 || prueba.getDate() !== Number(D))
    return res.status(400).json({ error: "Escribe una fecha válida" });
  const idAdmin = req.usuario?.id_empleado ?? null;
  const pad2 = (n) => String(n).padStart(2, "0");
  const dmy = (d) => `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}/${d.getFullYear()}`;

  let resultado;
  try {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      const [[sal]] = await conn.query(
        `SELECT s.id_salida, s.folio_salida, s.fecha, IF(a.id_salida IS NULL, 'Activa', 'Anulada') AS estatus
           FROM salida_interna s LEFT JOIN salida_anulacion a ON a.id_salida = s.id_salida
          WHERE s.id_salida = ? FOR UPDATE`, [id]
      );
      if (!sal) { await conn.rollback(); return res.status(404).json({ error: "Salida no encontrada" }); }
      if (sal.estatus === "Anulada") {
        await conn.rollback();
        return res.status(409).json({ error: `La salida ${sal.folio_salida} está anulada; no se puede corregir` });
      }
      const fol = String(sal.folio_salida).match(/^SAL-(\d{4})(\d{2})-/);
      if (fol && (fol[1] !== Y || fol[2] !== M)) {
        await conn.rollback();
        return res.status(400).json({
          error: `El folio ${sal.folio_salida} es del mes ${fol[2]}/${fol[1]}: la fecha debe quedar en ese mes. ` +
                   "Si la salida fue en otro mes, anúlala y captúrala de nuevo.",
        });
      }
      const antes = new Date(sal.fecha);
      const nueva = new Date(Number(Y), Number(M) - 1, Number(D),
        hh != null ? Number(hh) : antes.getHours(),
        mm != null ? Number(mm) : antes.getMinutes(),
        hh != null ? 0 : antes.getSeconds());
      if (nueva.getTime() > Date.now()) {
        await conn.rollback();
        return res.status(400).json({ error: "La fecha no puede ser futura" });
      }
      if (nueva.getTime() === antes.getTime()) {
        await conn.rollback();
        return res.status(400).json({ error: "La fecha es la misma que ya tiene la salida" });
      }
      const fechaMySQL = `${nueva.getFullYear()}-${pad2(nueva.getMonth() + 1)}-${pad2(nueva.getDate())} ` +
                       `${pad2(nueva.getHours())}:${pad2(nueva.getMinutes())}:${pad2(nueva.getSeconds())}`;
      await conn.query("UPDATE salida_interna SET fecha = ? WHERE id_salida = ?", [fechaMySQL, id]);
      const [mov] = await conn.query(
        "UPDATE movimiento_inventario SET fecha = ? WHERE id_salida = ? AND tipo = 'Salida'", [fechaMySQL, id]
      );
      const hora = (d) => `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
      await conn.query(
        `INSERT INTO salida_cambio (id_salida, campo, valor_anterior, valor_nuevo, motivo, id_empleado)
         VALUES (?, 'fecha', ?, ?, ?, ?)`,
        [id, `${dmy(antes)} ${hora(antes)}`, `${dmy(nueva)} ${hora(nueva)}`, motivo, idAdmin]
      );
      await conn.commit();
      resultado = { folio: sal.folio_salida, id_salida: id, fecha_anterior: dmy(antes), fecha_nueva: dmy(nueva), renglones: mov.affectedRows };
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  } catch (err) {
    console.error("[salidas] Error al corregir fecha:", err);
    return res.status(500).json({ error: "Error al corregir la fecha de la salida", ...errDetalle(err) });
  }
  try { getIO().to("admins").emit("inventario:movimiento", { tipo: "Fecha corregida", ...resultado }); } catch { /* sin socket */ }
  res.json({ ok: true, ...resultado });
};

/**
 * getCambiosSalida
 * GET /api/solicitudes/salidas/:id/cambios   (solo admin)
 * Historial de correcciones de una salida (más reciente primero).
 */
export const getCambiosSalida = async (req, res) => {
  const id = toPosId(req.params.id);
  if (!id) return res.status(400).json({ error: "Salida inválida" });
  try {
    const [rows] = await pool.query(
      `SELECT c.id_cambio, c.campo, c.valor_anterior, c.valor_nuevo, c.motivo, c.fecha,
               TRIM(CONCAT_WS(' ', e.nombre, e.ap_paterno, e.ap_materno)) AS empleado
          FROM salida_cambio c
          LEFT JOIN empleado e ON e.id_empleado = c.id_empleado
         WHERE c.id_salida = ?
         ORDER BY c.fecha DESC, c.id_cambio DESC`,
      [id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: "Error al obtener el historial de la salida", ...errDetalle(err) });
  }
};

/**
 * getReporteConsumo
 * GET /api/solicitudes/consumo?fecha_inicio=AAAA-MM-DD&fecha_fin=AAAA-MM-DD   (solo admin)
 *
 * Qué insumos se usan más, por área y por mes, para planear compras. Cuenta
 * todo material que SALIÓ del inventario (salidas internas activas y
 * solicitudes aceptadas); las salidas anuladas no cuentan.
 * Por defecto: los últimos 6 meses completos más el mes en curso.
 */
/**
 * getFrecuenciaConsumo
 * GET /api/solicitudes/consumo/frecuencia?agrupar=area|puesto|sucursal&fecha_inicio&fecha_fin  (admin)
 * Cada cuánto se entrega cada insumo a cada área. Por defecto: último año.
 */
export const getFrecuenciaConsumo = async (req, res) => {
  const reFecha = /^\d{4}-\d{2}-\d{2}$/;
  const hoy = new Date();
  const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const desde = reFecha.test(String(req.query.fecha_inicio ?? "")) ? req.query.fecha_inicio : iso(new Date(hoy.getFullYear() - 1, hoy.getMonth(), hoy.getDate()));
  const hasta = reFecha.test(String(req.query.fecha_fin ?? "")) ? req.query.fecha_fin : iso(hoy);
  if (desde > hasta) return res.status(400).json({ error: "La fecha inicial no puede ser mayor que la final" });
  const agrupar = ["area", "puesto", "sucursal"].includes(req.query.agrupar) ? req.query.agrupar : "sucursal";
  try {
    res.json({ desde, hasta, ...(await MovimientoInventario.frecuencia({ desde, hasta, agrupar })) });
  } catch (err) {
    res.status(err.statusCode === 400 ? 400 : 500).json({ error: err.statusCode === 400 ? err.message : "Error al calcular la frecuencia de consumo", ...errDetalle(err) });
  }
};

export const getReporteConsumo = async (req, res) => {
  const reFecha = /^\d{4}-\d{2}-\d{2}$/;
  const hoy = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  const iso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const desde = reFecha.test(String(req.query.fecha_inicio ?? ""))
    ? req.query.fecha_inicio : iso(new Date(hoy.getFullYear(), hoy.getMonth() - 6, 1));
  const hasta = reFecha.test(String(req.query.fecha_fin ?? "")) ? req.query.fecha_fin : iso(hoy);
  if (desde > hasta) return res.status(400).json({ error: "La fecha inicial no puede ser mayor que la final" });
  try {
    res.json({ desde, hasta, ...(await MovimientoInventario.consumo({ desde, hasta })) });
  } catch (err) {
    console.error("[consumo] Error al generar el reporte de consumo:", err);
    res.status(500).json({ error: "Error al generar el reporte de consumo", ...errDetalle(err) });
  }
};
