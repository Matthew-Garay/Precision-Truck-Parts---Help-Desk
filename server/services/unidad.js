/**
 * unidad.js — Piezas con número de serie (insumo_unidad, migración 009).
 *
 * Solo aplica a insumos con control_serie = 1. Para ellos el stock es igual al
 * número de piezas en almacén, y este servicio mantiene esa regla en las
 * mismas transacciones que mueven el stock:
 *
 *   activar()          alta inicial: una serie por cada pieza en existencia.
 *   desactivar()       vuelve al control por cantidad (solo si ninguna pieza ha salido).
 *   registrarEntrada() las series que llegan con una entrada.
 *   registrarSalida()  las series elegidas en una salida interna, o (sin series)
 *                      las que llevan más tiempo en almacén (solicitudes aceptadas).
 *   devolverSalida()   al anular una salida, sus piezas regresan al almacén.
 *
 * Los errores de captura se lanzan con statusCode 400/409 y un mensaje claro.
 *
 * @module server/services/unidad
 */
import pool from "../config/db.js";

const err = (statusCode, message) => Object.assign(new Error(message), { statusCode });

/** Limpia y valida una lista de series: sin vacíos ni repetidas. */
export function normalizarSeries(series, cantidadEsperada, nombre = "el insumo") {
  if (!Array.isArray(series)) throw err(400, `Captura el número de serie de cada pieza de ${nombre}`);
  const lista = series.map(s => String(s ?? "").trim()).filter(Boolean);
  if (lista.some(s => s.length > 100)) throw err(400, "Un número de serie no puede pasar de 100 caracteres");
  if (lista.length !== cantidadEsperada)
    throw err(400, `${nombre}: son ${cantidadEsperada} pieza(s) y se capturaron ${lista.length} número(s) de serie`);
  const vistos = new Set();
  for (const s of lista) {
    const k = s.toUpperCase();
    if (vistos.has(k)) throw err(400, `${nombre}: el número de serie ${s} está repetido`);
    vistos.add(k);
  }
  return lista;
}

const Unidad = {
  /** Piezas de un insumo con dónde está cada una (folio de la salida o solicitud). */
  listar: async (id_insumo) => {
    const [rows] = await pool.query(
      `SELECT u.id_unidad, u.num_serie, u.estado, u.en_almacen, u.fecha_alta,
              ms.fecha AS fecha_salida, sa.folio_salida, so.folio_solicitud,
              COALESCE(sd.nombre_sucursal, sa.destino_texto) AS destino
         FROM insumo_unidad u
         LEFT JOIN movimiento_inventario ms ON ms.id_movimiento = u.id_mov_salida
         LEFT JOIN salida_interna sa ON sa.id_salida = ms.id_salida
         LEFT JOIN solicitud so      ON so.id_solicitud = ms.id_solicitud
         LEFT JOIN sucursal sd       ON sd.id_sucursal = ms.id_sucursal_destino
        WHERE u.id_insumo = ?
        ORDER BY u.en_almacen DESC, u.num_serie`,
      [id_insumo]
    );
    return rows;
  },

  activar: async (id_insumo, series) => {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      const [[ins]] = await conn.query(
        "SELECT id_insumo, nombre, stock, control_serie FROM insumo WHERE id_insumo = ? FOR UPDATE", [id_insumo]);
      if (!ins) throw err(404, "Insumo no encontrado");
      if (Number(ins.control_serie) === 1) throw err(409, `"${ins.nombre}" ya se controla pieza por pieza`);
      const lista = normalizarSeries(series, Number(ins.stock) || 0, `"${ins.nombre}"`);
      for (const s of lista)
        await conn.query("INSERT INTO insumo_unidad (id_insumo, num_serie) VALUES (?, ?)", [id_insumo, s]);
      await conn.query("UPDATE insumo SET control_serie = 1 WHERE id_insumo = ?", [id_insumo]);
      await conn.commit();
      return lista.length;
    } catch (e) {
      await conn.rollback();
      if (e.code === "ER_DUP_ENTRY") throw err(409, "Ese número de serie ya está registrado en este insumo");
      throw e;
    } finally { conn.release(); }
  },

  desactivar: async (id_insumo) => {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      const [[ins]] = await conn.query("SELECT nombre, control_serie FROM insumo WHERE id_insumo = ? FOR UPDATE", [id_insumo]);
      if (!ins) throw err(404, "Insumo no encontrado");
      const [[usadas]] = await conn.query(
        "SELECT COUNT(*) n FROM insumo_unidad WHERE id_insumo = ? AND (en_almacen = 0 OR id_mov_entrada IS NOT NULL)", [id_insumo]);
      if (usadas.n > 0)
        throw err(409, `No se puede quitar: ya hay piezas de "${ins.nombre}" con entradas o salidas registradas por número de serie`);
      await conn.query("DELETE FROM insumo_unidad WHERE id_insumo = ?", [id_insumo]);
      await conn.query("UPDATE insumo SET control_serie = 0 WHERE id_insumo = ?", [id_insumo]);
      await conn.commit();
    } catch (e) { await conn.rollback(); throw e; } finally { conn.release(); }
  },

  /** Corregir la serie o el estado de una pieza que está en almacén. */
  actualizar: async (id_insumo, id_unidad, { num_serie, estado }) => {
    const sets = [], vals = [];
    if (num_serie !== undefined) {
      const s = String(num_serie ?? "").trim();
      if (!s || s.length > 100) throw err(400, "Escribe un número de serie válido");
      sets.push("num_serie = ?"); vals.push(s);
    }
    if (estado !== undefined) {
      if (!["Excelente", "Bueno", "Regular", "Malo", "Dañado"].includes(estado)) throw err(400, "Estado inválido");
      sets.push("estado = ?"); vals.push(estado);
    }
    if (!sets.length) throw err(400, "Nada que actualizar");
    try {
      const [r] = await pool.query(
        `UPDATE insumo_unidad SET ${sets.join(", ")} WHERE id_unidad = ? AND id_insumo = ?`, [...vals, id_unidad, id_insumo]);
      if (!r.affectedRows) throw err(404, "Pieza no encontrada");
    } catch (e) {
      if (e.code === "ER_DUP_ENTRY") throw err(409, "Ese número de serie ya está registrado en este insumo");
      throw e;
    }
  },

  /** ¿El insumo se controla por pieza? (dentro de la transacción del llamador) */
  controla: async (conn, id_insumo) => {
    const [[r]] = await conn.query("SELECT control_serie FROM insumo WHERE id_insumo = ?", [id_insumo]);
    return Number(r?.control_serie) === 1;
  },

  /** Piezas que llegan con una entrada. Una serie que ya había salido "regresa". */
  registrarEntrada: async (conn, { id_insumo, nombre, series, cantidad, id_movimiento }) => {
    const lista = normalizarSeries(series, cantidad, `"${nombre}"`);
    for (const s of lista) {
      const [[u]] = await conn.query(
        "SELECT id_unidad, en_almacen FROM insumo_unidad WHERE id_insumo = ? AND num_serie = ? FOR UPDATE", [id_insumo, s]);
      if (u && Number(u.en_almacen) === 1) throw err(409, `La pieza ${s} de "${nombre}" ya está en almacén`);
      if (u) await conn.query(
        "UPDATE insumo_unidad SET en_almacen = 1, id_mov_salida = NULL, id_mov_entrada = ? WHERE id_unidad = ?", [id_movimiento, u.id_unidad]);
      else await conn.query(
        "INSERT INTO insumo_unidad (id_insumo, num_serie, id_mov_entrada) VALUES (?, ?, ?)", [id_insumo, s, id_movimiento]);
    }
    return lista;
  },

  /**
   * Piezas que salen. Con `series`: deben estar en almacén. Sin `series`
   * (solicitud aceptada): las que llevan más tiempo en almacén.
   */
  registrarSalida: async (conn, { id_insumo, nombre, series, cantidad, id_movimiento }) => {
    let ids;
    if (series != null) {
      const lista = normalizarSeries(series, cantidad, `"${nombre}"`);
      const [rows] = await conn.query(
        "SELECT id_unidad, num_serie FROM insumo_unidad WHERE id_insumo = ? AND en_almacen = 1 AND num_serie IN (?) FOR UPDATE",
        [id_insumo, lista]);
      if (rows.length !== lista.length) {
        const hay = new Set(rows.map(r => r.num_serie.toUpperCase()));
        const faltan = lista.filter(s => !hay.has(s.toUpperCase()));
        throw err(409, `"${nombre}": la(s) pieza(s) ${faltan.join(", ")} no están en almacén`);
      }
      ids = rows.map(r => r.id_unidad);
    } else {
      const [rows] = await conn.query(
        `SELECT id_unidad FROM insumo_unidad WHERE id_insumo = ? AND en_almacen = 1
          ORDER BY fecha_alta, id_unidad LIMIT ? FOR UPDATE`, [id_insumo, cantidad]);
      if (rows.length < cantidad) throw err(409, `"${nombre}": no hay ${cantidad} pieza(s) con número de serie en almacén`);
      ids = rows.map(r => r.id_unidad);
    }
    await conn.query("UPDATE insumo_unidad SET en_almacen = 0, id_mov_salida = ? WHERE id_unidad IN (?)", [id_movimiento, ids]);
    const [salieron] = await conn.query("SELECT num_serie FROM insumo_unidad WHERE id_unidad IN (?) ORDER BY num_serie", [ids]);
    return salieron.map(r => r.num_serie);
  },

  /** Al anular una salida: sus piezas regresan al almacén. */
  devolverSalida: async (conn, id_movimiento_salida) => {
    await conn.query(
      "UPDATE insumo_unidad SET en_almacen = 1, id_mov_salida = NULL WHERE id_mov_salida = ?", [id_movimiento_salida]);
  },
};

export default Unidad;
