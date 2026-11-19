/**
 * salidas-fecha.test.js — Corregir la fecha de una salida interna desde el sistema.
 *
 * Antes se corregía directo en la base de datos y no quedaba rastro. Ahora:
 * cambia la fecha de la salida y de sus renglones, conserva la hora, queda en
 * el historial (salida_cambio) y respeta las reglas: mismo mes del folio, no
 * futura, no anulada y con motivo.
 */
import { test, describe, before, after } from "node:test";
import assert from "node:assert/strict";
import { prepararBD, cerrarBD, respuesta, reqAdmin } from "./_bd-prueba.js";

let ctrl, pool, Movimiento;
const llamar = async (fn, req) => { const res = respuesta(); await fn(reqAdmin(req), res); return res; };
const corregir = (id, body) => llamar(ctrl.corregirFechaSalida, { params: { id: String(id) }, body });
const fechaSalida = async (id) =>
  (await pool.query("SELECT DATE_FORMAT(fecha,'%Y-%m-%d %H:%i') f FROM salida_interna WHERE id_salida = ?", [id]))[0][0].f;
const fechasMovs = async (id) =>
  (await pool.query("SELECT DATE_FORMAT(fecha,'%Y-%m-%d %H:%i') f FROM movimiento_inventario WHERE id_salida = ? AND tipo='Salida'", [id]))[0].map(r => r.f);

describe("corregir la fecha de una salida", () => {
  before(async () => {
    await prepararBD();
    ctrl       = await import("../controllers/inventario-controller.js");
    pool       = (await import("../config/db.js")).default;
    Movimiento = (await import("../services/movimiento-inventario.js")).default;
  });
  after(cerrarBD);

  let id, folio;

  test("preparación: salida del 11/10/2026 a las 16:00 con dos renglones", async () => {
    const res = await llamar(ctrl.registrarSalidaInsumo, {
      body: { items: [{ id_insumo: 1, cantidad: 2 }, { id_insumo: 2, cantidad: 1 }], id_solicitante: 3, fecha: "2026-10-11T16:00" },
    });
    assert.equal(res.statusCode, 200, JSON.stringify(res.body));
    ({ id_salida: id, folio } = res.body);
    assert.match(folio, /^SAL-202610-/);
  });

  test("sin motivo responde 400 y no cambia", async () => {
    const res = await corregir(id, { fecha: "2026-10-13", motivo: "" });
    assert.equal(res.statusCode, 400);
    assert.equal(await fechaSalida(id), "2026-10-11 16:00");
  });

  test("fecha de otro mes (distinto al folio) responde 400", async () => {
    const res = await corregir(id, { fecha: "2026-09-30", motivo: "Se capturó mal" });
    assert.equal(res.statusCode, 400);
    assert.match(res.body.error, /mes/);
  });

  test("fecha inválida (31/02) responde 400", async () => {
    const res = await corregir(id, { fecha: "2026-02-31", motivo: "Se capturó mal" });
    assert.equal(res.statusCode, 400);
  });

  test("fecha futura responde 400", async () => {
    const res = await corregir(id, { fecha: "2099-10-12", motivo: "Se capturó mal" });
    assert.equal(res.statusCode, 400);
  });

  test("corrige salida y renglones conservando la hora, y queda en el historial", async () => {
    const res = await corregir(id, { fecha: "2026-10-13", motivo: "Se capturó con el día equivocado" });
    assert.equal(res.statusCode, 200, JSON.stringify(res.body));
    assert.equal(res.body.fecha_anterior, "11/10/2026");
    assert.equal(res.body.fecha_nueva, "13/10/2026");
    assert.equal(await fechaSalida(id), "2026-10-13 16:00");
    assert.deepEqual(await fechasMovs(id), ["2026-10-13 16:00", "2026-10-13 16:00"]);

    const hist = await llamar(ctrl.getCambiosSalida, { params: { id: String(id) } });
    assert.equal(hist.statusCode, 200);
    assert.equal(hist.body.length, 1);
    assert.equal(hist.body[0].valor_anterior, "11/10/2026 16:00");
    assert.equal(hist.body[0].valor_nuevo, "13/10/2026 16:00");
    assert.equal(hist.body[0].motivo, "Se capturó con el día equivocado");
    assert.ok(hist.body[0].empleado, "debe decir quién corrigió");
  });

  test("con hora explícita también cambia la hora", async () => {
    const res = await corregir(id, { fecha: "2026-10-13T09:30", motivo: "La hora real fue en la mañana" });
    assert.equal(res.statusCode, 200, JSON.stringify(res.body));
    assert.equal(await fechaSalida(id), "2026-10-13 09:30");
  });

  test("el reporte de consumo usa la fecha corregida", async () => {
    const r = await Movimiento.consumo({ desde: "2026-10-13", hasta: "2026-10-13" });
    assert.equal(r.por_insumo.find(x => x.id_insumo === 1)?.piezas, 2);
    const antes = await Movimiento.consumo({ desde: "2026-10-11", hasta: "2026-10-11" });
    assert.equal(antes.por_insumo.length, 0);
  });

  test("una salida anulada no se puede corregir (409)", async () => {
    const an = await llamar(ctrl.anularSalida, { params: { id: String(id) }, body: { motivo: "Prueba de anulación" } });
    assert.equal(an.statusCode, 200, JSON.stringify(an.body));
    const res = await corregir(id, { fecha: "2026-10-14", motivo: "Se capturó mal" });
    assert.equal(res.statusCode, 409);
  });

  test("salida inexistente responde 404", async () => {
    const res = await corregir(99999, { fecha: "2026-10-14", motivo: "Se capturó mal" });
    assert.equal(res.statusCode, 404);
  });
});
