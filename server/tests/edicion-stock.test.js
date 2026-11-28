/**
 * edicion-stock.test.js — Editar un insumo no puede pisar entradas o salidas.
 *
 * El formulario manda el stock que vio al abrirse (stock_original). Si desde
 * entonces cambió, el guardado se rechaza (409) en vez de sobrescribirlo.
 */
import { test, describe, before, after } from "node:test";
import assert from "node:assert/strict";
import { prepararBD, cerrarBD, respuesta, reqAdmin } from "./_bd-prueba.js";

let ctrlInv, ctrlIns, pool, schemas;
const ID = 3;
const stock = async () => (await pool.query("SELECT stock FROM insumo WHERE id_insumo = ?", [ID]))[0][0].stock;
const movs = async () => (await pool.query("SELECT COUNT(*) n FROM movimiento_inventario WHERE id_insumo = ?", [ID]))[0][0].n;
const llamar = async (fn, req) => { const r = respuesta(); await fn(reqAdmin(req), r); return r; };
const editar = (body) => llamar(ctrlIns.actualizarInsumo, {
  params: { id: String(ID) }, body: schemas.schemaActualizarInsumo.parse(body),
});

describe("editar insumo y stock", () => {
  before(async () => {
    await prepararBD();
    ctrlInv = await import("../controllers/inventario-controller.js");
    ctrlIns = await import("../controllers/insumos-controller.js");
    pool    = (await import("../config/db.js")).default;
    schemas = await import("../middlewares/validate.js");
  });
  after(cerrarBD);

  test("una entrada cambia el stock", async () => {
    const antes = await stock();
    const r = await llamar(ctrlInv.registrarEntradaInsumo, {
      params: { id: String(ID) }, body: { cantidad: 4, motivo: "Compra prueba", fecha: "2026-10-12T09:00" },
    });
    assert.ok(r.statusCode < 300, JSON.stringify(r.body));
    assert.equal(await stock(), antes + 4);
  });

  test("guardar con el stock de antes de la entrada se rechaza y no pisa nada", async () => {
    const viejo = await stock() - 4;      // lo que el formulario vio antes de la entrada
    const actual = await stock();
    const m = await movs();
    const r = await editar({ nombre: "Editado", stock: viejo, stock_original: viejo });
    assert.equal(r.statusCode, 409, JSON.stringify(r.body));
    assert.equal(r.body.stock_actual, actual);
    assert.equal(await stock(), actual, "el stock no debe cambiar");
    assert.equal(await movs(), m, "no debe registrar movimientos");
  });

  test("editar solo datos (sin stock) no toca el stock ni genera movimientos", async () => {
    const actual = await stock();
    const m = await movs();
    const r = await editar({ nombre: "Editado sin stock" });
    assert.equal(r.statusCode, 200, JSON.stringify(r.body));
    assert.equal(await stock(), actual);
    assert.equal(await movs(), m);
  });

  test("sin stock_original no se puede cambiar el stock", async () => {
    const actual = await stock();
    const r = await editar({ stock: actual + 1 });
    assert.equal(r.statusCode, 409, JSON.stringify(r.body));
    assert.equal(await stock(), actual);
  });

  test("corrección con el stock visto al abrir sí se guarda y queda en el kárdex", async () => {
    const visto = await stock();
    const r = await editar({ stock: visto + 2, stock_original: visto });
    assert.equal(r.statusCode, 200, JSON.stringify(r.body));
    assert.equal(await stock(), visto + 2);
    const [[ult]] = await pool.query(
      "SELECT stock_anterior, stock_nuevo FROM movimiento_inventario WHERE id_insumo = ? ORDER BY id_movimiento DESC LIMIT 1", [ID]);
    assert.equal(Number(ult.stock_anterior), visto);
    assert.equal(Number(ult.stock_nuevo), visto + 2);
  });
});
