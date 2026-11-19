/** insumo-etiqueta.test.js — Columna "etiqueta" del insumo: crear, cambiar, borrar y validar. */
import { test, describe, before, after } from "node:test";
import assert from "node:assert/strict";
import { prepararBD, cerrarBD, respuesta, reqAdmin } from "./_bd-prueba.js";

let ctrl, pool, schemas;
const etiqueta = async (id) => (await pool.query("SELECT etiqueta FROM insumo WHERE id_insumo = ?", [id]))[0][0].etiqueta;
const llamar = async (fn, req) => { const r = respuesta(); await fn(reqAdmin(req), r); return r; };

describe("etiqueta del insumo", () => {
  before(async () => {
    await prepararBD();
    ctrl    = await import("../controllers/insumos-controller.js");
    pool    = (await import("../config/db.js")).default;
    schemas = await import("../middlewares/validate.js");
  });
  after(cerrarBD);
  let id;

  test("se guarda al crear y viene en el detalle", async () => {
    const body = schemas.schemaInsumo.parse({ nombre: "Mouse USB", stock: 2, estado: "Bueno", id_categoria: 1, etiqueta: " INV-0042 " });
    const r = await llamar(ctrl.crearInsumo, { body });
    assert.ok([200, 201].includes(r.statusCode), JSON.stringify(r.body));
    id = r.body.id_insumo ?? r.body.insumo?.id_insumo;
    assert.ok(id, JSON.stringify(r.body));
    assert.equal(await etiqueta(id), "INV-0042");
  });

  test("se puede cambiar y borrar al editar", async () => {
    let r = await llamar(ctrl.actualizarInsumo, { params: { id: String(id) }, body: schemas.schemaActualizarInsumo.parse({ etiqueta: "INV-0043" }) });
    assert.equal(r.statusCode, 200, JSON.stringify(r.body));
    assert.equal(await etiqueta(id), "INV-0043");
    r = await llamar(ctrl.actualizarInsumo, { params: { id: String(id) }, body: schemas.schemaActualizarInsumo.parse({ etiqueta: "" }) });
    assert.equal(r.statusCode, 200, JSON.stringify(r.body));
    assert.equal(await etiqueta(id), null);
  });

  test("editar otros datos no borra la etiqueta", async () => {
    await pool.query("UPDATE insumo SET etiqueta = 'INV-0099' WHERE id_insumo = ?", [id]);
    const r = await llamar(ctrl.actualizarInsumo, { params: { id: String(id) }, body: schemas.schemaActualizarInsumo.parse({ nombre: "Mouse USB negro" }) });
    assert.equal(r.statusCode, 200, JSON.stringify(r.body));
    assert.equal(await etiqueta(id), "INV-0099");
  });

  test("más de 50 caracteres se rechaza", () => {
    const v = schemas.schemaInsumo.safeParse({ nombre: "x", stock: 0, estado: "Bueno", id_categoria: 1, etiqueta: "x".repeat(51) });
    assert.equal(v.success, false);
  });
});
