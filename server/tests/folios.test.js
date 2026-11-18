/**
 * folios.test.js — Pruebas de generarFolio (PREFIJO-AAAAMM-NNNN).
 *
 * Parte 1: unitarias con una conexión falsa (no usan MySQL).
 * Parte 2: integración con la base de prueba (salidas internas reales).
 */
import { test, describe, before, after } from "node:test";
import assert from "node:assert/strict";
import { prepararBD, cerrarBD, respuesta, reqAdmin } from "./_bd-prueba.js";
import { generarFolio } from "../utils/helpers.js";

/** Conexión falsa: devuelve `ultimo` como último folio y guarda la consulta. */
const connFalsa = (ultimo) => {
  const c = { sql: "", params: null };
  c.query = async (sql, params) => { c.sql = sql; c.params = params; return [ultimo ? [{ folio: ultimo }] : []]; };
  return c;
};

describe("generarFolio (unitarias)", () => {
  test("el primer folio del mes es 0001", async () => {
    const f = await generarFolio(connFalsa(null), "t", "folio", "SAL", new Date(2026, 9, 5));
    assert.equal(f, "SAL-202610-0001");
  });

  test("continúa el consecutivo del último folio del mes", async () => {
    const f = await generarFolio(connFalsa("SAL-202610-0027"), "t", "folio", "SAL", new Date(2026, 9, 20));
    assert.equal(f, "SAL-202610-0028");
  });

  test("pasa de 0009 a 0010 (orden numérico, no de texto)", async () => {
    const f = await generarFolio(connFalsa("SOL-202611-0009"), "t", "folio", "SOL", new Date(2026, 10, 1));
    assert.equal(f, "SOL-202611-0010");
  });

  test("numera por el mes de la fecha indicada (fecha retroactiva)", async () => {
    const c = connFalsa(null);
    const f = await generarFolio(c, "t", "folio", "SAL", new Date(2026, 0, 31));
    assert.equal(f, "SAL-202601-0001");
    assert.deepEqual(c.params, ["SAL-202601-%"]);
  });

  test("bloquea las filas del mes (FOR UPDATE) para evitar folios duplicados", async () => {
    const c = connFalsa(null);
    await generarFolio(c, "t", "folio", "ST", new Date(2026, 10, 1));
    assert.match(c.sql, /FOR UPDATE/);
    assert.match(c.sql, /CAST\(.*AS UNSIGNED\)/s);
  });

  test("una fecha inválida usa el mes actual", async () => {
    const hoy = new Date();
    const mes = `${hoy.getFullYear()}${String(hoy.getMonth() + 1).padStart(2, "0")}`;
    const f = await generarFolio(connFalsa(null), "t", "folio", "SAL", new Date("no-es-fecha"));
    assert.equal(f, `SAL-${mes}-0001`);
  });
});

describe("folios de salidas internas (integración)", () => {
  let ctrl;
  before(async () => {
    await prepararBD();
    ctrl = await import("../controllers/inventario-controller.js");
  });
  after(cerrarBD);

  const salida = async (fecha) => {
    const res = respuesta();
    await ctrl.registrarSalidaInsumo(reqAdmin({ body: { items: [{ id_insumo: 1, cantidad: 1 }], fecha } }), res);
    assert.equal(res.statusCode, 200, JSON.stringify(res.body));
    return res.body.folio;
  };

  test("dos salidas del mismo mes llevan folios consecutivos", async () => {
    assert.equal(await salida("2026-10-05T10:00"), "SAL-202610-0001");
    assert.equal(await salida("2026-10-06T10:00"), "SAL-202610-0002");
  });

  test("una salida de otro mes reinicia su propio consecutivo", async () => {
    assert.equal(await salida("2026-09-15"), "SAL-202609-0001");
    assert.equal(await salida("2026-10-07T09:00"), "SAL-202610-0003");
  });
});
