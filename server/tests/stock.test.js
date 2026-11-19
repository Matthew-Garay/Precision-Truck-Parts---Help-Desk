/**
 * stock.test.js — Pruebas de stock e inventario contra la base de prueba.
 *
 * Cubre: salidas (descuento, consolidación, rollback por stock insuficiente),
 * entradas, anulación de salidas, kardex consistente, stock bajo y el
 * reporte de consumo.
 */
import { test, describe, before, after } from "node:test";
import assert from "node:assert/strict";
import { prepararBD, cerrarBD, respuesta, reqAdmin } from "./_bd-prueba.js";

let ctrl, pool, Insumo, Movimiento;

const stock = async (id) => {
  const [[r]] = await pool.query("SELECT stock FROM insumo WHERE id_insumo = ?", [id]);
  return r.stock;
};
const llamar = async (fn, req) => { const res = respuesta(); await fn(reqAdmin(req), res); return res; };

/** El kardex de cada insumo debe encadenar stock_anterior → stock_nuevo y terminar en insumo.stock. */
async function verificarKardex() {
  const [rotos] = await pool.query(`
    SELECT m.id_movimiento FROM movimiento_inventario m
      JOIN movimiento_inventario p ON p.id_movimiento = (
        SELECT MAX(id_movimiento) FROM movimiento_inventario
         WHERE id_insumo = m.id_insumo AND id_movimiento < m.id_movimiento)
     WHERE m.stock_anterior <> p.stock_nuevo`);
  assert.deepEqual(rotos, [], "la cadena del kardex está rota");
  const [desfasados] = await pool.query(`
    SELECT i.id_insumo FROM insumo i
      JOIN movimiento_inventario m ON m.id_movimiento = (
        SELECT MAX(id_movimiento) FROM movimiento_inventario WHERE id_insumo = i.id_insumo)
     WHERE i.stock <> m.stock_nuevo`);
  assert.deepEqual(desfasados, [], "el stock no coincide con el último movimiento");
}

describe("stock e inventario", () => {
  before(async () => {
    await prepararBD();
    ctrl = await import("../controllers/inventario-controller.js");
    pool = (await import("../config/db.js")).default;
    Insumo = (await import("../services/insumo.js")).default;
    Movimiento = (await import("../services/movimiento-inventario.js")).default;
  });
  after(cerrarBD);

  let idSalida;

  test("una salida descuenta el stock y deja el movimiento correcto", async () => {
    const res = await llamar(ctrl.registrarSalidaInsumo, {
      body: { items: [{ id_insumo: 1, cantidad: 3 }], id_solicitante: 3, fecha: "2026-10-10T10:00" },
    });
    assert.equal(res.statusCode, 200, JSON.stringify(res.body));
    idSalida = res.body.id_salida;
    assert.equal(await stock(1), 7);
    const [[m]] = await pool.query("SELECT * FROM movimiento_inventario WHERE id_salida = ?", [idSalida]);
    assert.equal(m.tipo, "Salida");
    assert.equal(m.stock_anterior, 10);
    assert.equal(m.stock_nuevo, 7);
    assert.equal(m.cantidad, 3);
  });

  test("un mismo insumo repetido en la hoja se consolida en un renglón", async () => {
    const res = await llamar(ctrl.registrarSalidaInsumo, {
      body: { items: [{ id_insumo: 2, cantidad: 1 }, { id_insumo: 2, cantidad: 2 }], fecha: "2026-10-11T10:00" },
    });
    assert.equal(res.statusCode, 200, JSON.stringify(res.body));
    assert.equal(res.body.total_renglones, 1);
    assert.equal(await stock(2), 2);
  });

  test("stock insuficiente: 409 y NO descuenta ningún renglón (rollback total)", async () => {
    const antes1 = await stock(1), antes3 = await stock(3);
    const [[{ n: salidasAntes }]] = await pool.query("SELECT COUNT(*) n FROM salida_interna");
    const res = await llamar(ctrl.registrarSalidaInsumo, {
      body: { items: [{ id_insumo: 1, cantidad: 1 }, { id_insumo: 3, cantidad: 99 }] },
    });
    assert.equal(res.statusCode, 409);
    assert.equal(await stock(1), antes1);
    assert.equal(await stock(3), antes3);
    const [[{ n: salidasDespues }]] = await pool.query("SELECT COUNT(*) n FROM salida_interna");
    assert.equal(salidasDespues, salidasAntes, "no debe quedar cabecera de salida huérfana");
  });

  test("cantidad inválida responde 400", async () => {
    const res = await llamar(ctrl.registrarSalidaInsumo, { body: { items: [{ id_insumo: 1, cantidad: 0 }] } });
    assert.equal(res.statusCode, 400);
  });

  test("una entrada suma al stock", async () => {
    const antes = await stock(3);
    const res = await llamar(ctrl.registrarEntradaInsumo, {
      params: { id: "3" }, body: { cantidad: 4, motivo: "Compra prueba", fecha: "2026-10-12T09:00" },
    });
    assert.ok(res.statusCode < 300, JSON.stringify(res.body));
    assert.equal(await stock(3), antes + 4);
  });

  test("anular una salida regresa el stock y la marca como Anulada", async () => {
    const antes = await stock(1);
    const res = await llamar(ctrl.anularSalida, { params: { id: String(idSalida) }, body: { motivo: "Capturada por error" } });
    assert.equal(res.statusCode, 200, JSON.stringify(res.body));
    assert.equal(await stock(1), antes + 3);
    const [[sal]] = await pool.query("SELECT estatus, motivo_anulacion, id_anulo FROM v_salida_interna WHERE id_salida = ?", [idSalida]);
    assert.equal(sal.estatus, "Anulada");
    assert.equal(sal.motivo_anulacion, "Capturada por error");
    assert.equal(sal.id_anulo, 1);
    const [dev] = await pool.query("SELECT * FROM movimiento_inventario WHERE id_salida = ? AND tipo = 'Entrada'", [idSalida]);
    assert.equal(dev.length, 1);
    assert.equal(dev[0].cantidad, 3);
  });

  test("no se puede anular dos veces la misma salida", async () => {
    const antes = await stock(1);
    const res = await llamar(ctrl.anularSalida, { params: { id: String(idSalida) }, body: { motivo: "Otra vez" } });
    assert.equal(res.statusCode, 409);
    assert.equal(await stock(1), antes);
  });

  test("anular exige motivo", async () => {
    const res = await llamar(ctrl.anularSalida, { params: { id: String(idSalida) }, body: { motivo: "x" } });
    assert.equal(res.statusCode, 400);
  });

  test("la devolución de una anulación no se puede editar", async () => {
    const [[dev]] = await pool.query("SELECT id_movimiento FROM movimiento_inventario WHERE id_salida = ? AND tipo = 'Entrada'", [idSalida]);
    const res = await llamar(ctrl.editarEntrada, { params: { id: String(dev.id_movimiento) }, body: { cantidad: 1 } });
    assert.equal(res.statusCode, 409);
  });

  test("el kardex sigue cuadrando después de todas las operaciones", verificarKardex);

  test("stock bajo: solo insumos con stock <= 1", async () => {
    await pool.query("UPDATE insumo SET stock = 0 WHERE id_insumo = 2");
    Insumo.limpiarCache();
    const bajos = await Insumo.getStockBajo();
    const ids = bajos.map(b => b.id_insumo).sort();
    assert.ok(ids.includes(2), "stock 0 es bajo");
    assert.ok(!ids.includes(1), "stock 10 no es bajo");
    for (const b of bajos) assert.ok(b.stock <= 1);
  });

  test("el reporte de consumo no cuenta las salidas anuladas", async () => {
    const r = await Movimiento.consumo({ desde: "2026-10-01", hasta: "2026-10-31" });
    const toner = r.por_insumo.find(x => x.id_insumo === 1);
    assert.equal(toner, undefined, "la única salida del tóner fue anulada");
    const etiqueta = r.por_insumo.find(x => x.id_insumo === 2);
    assert.equal(etiqueta.piezas, 3);
    assert.equal(r.por_mes.find(m => m.mes === "2026-10").piezas, 3);
  });
});
