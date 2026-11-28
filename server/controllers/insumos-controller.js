/**
 * insumos-controller.js
 *
 * Catálogo de insumos: listado (con stock oculto para el rol Usuario), alta,
 * edición, foto, baja lógica, visibilidad y alertas de stock bajo.
 * Rutas en routes/solicitudes-routes.js bajo /api/solicitudes/insumos…
 *
 * @module server/controllers/insumos-controller
 * @exports getInsumos
 * @exports getInventario
 * @exports getInsumosStockBajo
 * @exports crearInsumo
 * @exports actualizarInsumo
 * @exports subirFotoInsumo
 * @exports eliminarInsumo
 * @exports cambiarActivoInsumo
 * @exports cambiarVisiblePublico
 * @exports getInsumosForUser
 */
import Insumo    from '../services/insumo.js';
import MovimientoInventario from '../services/movimiento-inventario.js';
import { getIO } from '../config/socket-instance.js';
import pool      from '../config/db.js';
import path      from "path";
import fs        from "fs";
import { INSUMOS_DIR } from '../middlewares/upload-insumos.js';
import { SQL_DISPONIBILIDAD } from '../utils/stock.js';
import { errDetalle, esAdmin, sinStockLista } from './comun.js';
import { rutaMiniatura } from '../utils/imagenes.js';
import Unidad from '../services/unidad.js';

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

/** SQL compartido: devuelve un insumo con disponibilidad calculada desde stock */
const SELECT_INSUMO_COMPLETO = `
  SELECT i.id_insumo, i.num_serie, i.etiqueta, i.control_serie, i.nombre, i.descripcion,
         i.marca, i.modelo, i.stock, i.estado,
         i.id_categoria, i.imagen_url, i.activo, i.visible_publico,
         c.nombre_categoria,
         ${SQL_DISPONIBILIDAD("i")} AS disponibilidad
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
        "SELECT id_insumo, stock, control_serie FROM insumo WHERE id_insumo = ? FOR UPDATE", [id]
      );
      if (!prev) {
        await conn.rollback();
        return res.status(404).json({ error: "Insumo no encontrado" });
      }
      // Por pieza: el stock solo cambia con entradas (con series) y salidas (eligiendo series).
      if (Number(prev.control_serie) === 1 && req.body.stock != null && Number(req.body.stock) !== Number(prev.stock)) {
        await conn.rollback();
        return res.status(409).json({ error: "Este insumo se controla por número de serie: el stock cambia con Entradas y Salidas, no editándolo." });
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
        // Control de concurrencia: el formulario manda el stock que vio al abrirse
        // (stock_original). Si desde entonces hubo una entrada o salida, guardar
        // sobrescribiría ese movimiento con un número viejo. Se rechaza y se pide recargar.
        if (stockNuevo !== stockAnterior) {
          const visto = req.body.stock_original;
          if (visto === undefined || visto === null || Number(visto) !== stockAnterior) {
            await conn.rollback();
            return res.status(409).json({
              error: `El stock de este insumo cambió mientras editabas (ahora hay ${stockAnterior}). Recarga la pantalla antes de corregirlo.`,
              stock_actual: stockAnterior,
            });
          }
        }
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
        await fs.promises.unlink(rutaMiniatura(anterior)).catch(() => {});
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

// ── Piezas con número de serie (fase 4, services/unidad.js) ──────────────────
const responderErrorUnidad = (res, err, texto) =>
  [400, 404, 409].includes(err?.statusCode)
    ? res.status(err.statusCode).json({ error: err.message })
    : res.status(500).json({ error: texto, ...errDetalle(err) });

/** GET /api/solicitudes/insumos/:id/unidades (admin) — piezas y dónde está cada una. */
export const getUnidadesInsumo = async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (!Number.isFinite(id) || id <= 0) return res.status(400).json({ error: "ID de insumo inválido" });
  try { res.json(await Unidad.listar(id)); }
  catch (err) { responderErrorUnidad(res, err, "Error al obtener las piezas"); }
};

/** POST /api/solicitudes/insumos/:id/unidades/activar (admin) — body { series: [...] } (una por pieza en stock). */
export const activarControlSerie = async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (!Number.isFinite(id) || id <= 0) return res.status(400).json({ error: "ID de insumo inválido" });
  try {
    const n = await Unidad.activar(id, req.body?.series);
    Insumo.limpiarCache();
    res.json({ ok: true, piezas: n });
  } catch (err) { responderErrorUnidad(res, err, "Error al activar el control por pieza"); }
};

/** POST /api/solicitudes/insumos/:id/unidades/desactivar (admin) — solo si ninguna pieza se ha movido. */
export const desactivarControlSerie = async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (!Number.isFinite(id) || id <= 0) return res.status(400).json({ error: "ID de insumo inválido" });
  try {
    await Unidad.desactivar(id);
    Insumo.limpiarCache();
    res.json({ ok: true });
  } catch (err) { responderErrorUnidad(res, err, "Error al quitar el control por pieza"); }
};

/** PATCH /api/solicitudes/insumos/:id/unidades/:idUnidad (admin) — corregir serie o estado. */
export const actualizarUnidad = async (req, res) => {
  const id = parseInt(req.params.id, 10), idU = parseInt(req.params.idUnidad, 10);
  if (!(id > 0) || !(idU > 0)) return res.status(400).json({ error: "Datos inválidos" });
  try {
    await Unidad.actualizar(id, idU, { num_serie: req.body?.num_serie, estado: req.body?.estado });
    res.json({ ok: true });
  } catch (err) { responderErrorUnidad(res, err, "Error al actualizar la pieza"); }
};
