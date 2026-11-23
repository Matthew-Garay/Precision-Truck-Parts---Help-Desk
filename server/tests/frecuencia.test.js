/**
 * frecuencia.test.js — "Cada cuánto se consume cada insumo" (reporte de consumo).
 * Ejemplo del usuario: Contraloría recibe tóner cada 4 semanas.
 */
import { test, describe, before, after } from "node:test";
import assert from "node:assert/strict";
import { prepararBD, cerrarBD, respuesta, reqAdmin } from "./_bd-prueba.js";

let pool, inv, M;
const llamar = async (fn, req) => { const r = respuesta(); await fn(reqAdmin(req), r); return r; };
const salida = async (fecha, id_insumo, cantidad, id_solicitante = 3) => {
  const r = await llamar(inv.registrarSalidaInsumo, { body: { items: [{ id_insumo, cantidad }], id_solicitante, id_destino: 2, fecha } });
  assert.equal(r.statusCode, 200, JSON.stringify(r.body));
  return r.body.id_salida;
};

describe("frecuencia de consumo", () => {
  before(async () => {
    await prepararBD();
    pool = (await import("../config/db.js")).default;
    inv  = await import("../controllers/inventario-controller.js");
    M    = (await import("../services/movimiento-inventario.js")).default;
    await pool.query("UPDATE insumo SET stock = 100 WHERE id_insumo IN (1, 2)");
    // El empleado 3 es "Asistente de Contraloría"; el puesto pertenece al área Contraloría.
    await pool.query("INSERT INTO area (id_area, nombre_area) VALUES (1, 'Contraloría')");
    await pool.query("INSERT INTO departamento (id_departamento, nombre_departamento, id_area) VALUES (3, 'Asistente de Contraloría', 1)");
    await pool.query("UPDATE empleado SET id_departamento = 3 WHERE id_empleado = 3");
    // Tóner (insumo 1) cada 28 días: 1 pieza, y una vez se entregó en dos partes (05/10 y 06/10).
    for (const f of ["2026-08-10", "2026-09-07", "2026-10-05"]) await salida(`${f}T10:00`, 1, 1);
    await salida("2026-10-06T10:00", 1, 1);
    // Etiqueta (insumo 2): una sola entrega → aún sin frecuencia.
    await salida("2026-10-20T10:00", 2, 5);
  });
  after(cerrarBD);

  test("Contraloría · tóner: cada 28 días (4 semanas), próxima = última + 28", async () => {
    const r = await M.frecuencia({ desde: "2026-01-01", hasta: "2026-11-30", agrupar: "area", hoy: new Date(2026, 10, 19) });
    const t = r.filas.find(x => x.grupo === "Contraloría" && x.id_insumo === 1);
    assert.ok(t, JSON.stringify(r.filas));
    assert.equal(t.cada_dias, 28);
    assert.equal(t.cada_semanas, 4);
    assert.equal(t.entregas, 3, "05/10 y 06/10 cuentan como una sola entrega");
    assert.deepEqual(t.historial.map(h => [h.dia, h.piezas]), [["2026-08-10", 1], ["2026-09-07", 1], ["2026-10-05", 2]]);
    assert.equal(t.ultima, "2026-10-05");
    assert.equal(t.proxima, "2026-11-02");
    assert.equal(t.estado, "atrasado");            // al 19/11 ya pasó el 02/11
    assert.equal(t.confianza, "media");
  });

  test("estado según la fecha: pronto (≤ 7 días) y al día", async () => {
    const pronto = (await M.frecuencia({ desde: "2026-01-01", hasta: "2026-11-30", hoy: new Date(2026, 9, 30) })).filas.find(x => x.id_insumo === 1);
    assert.equal(pronto.estado, "pronto");
    const alDia = (await M.frecuencia({ desde: "2026-01-01", hasta: "2026-11-30", hoy: new Date(2026, 9, 10) })).filas.find(x => x.id_insumo === 1);
    assert.equal(alDia.estado, "al_dia");
  });

  test("con una sola entrega no se inventa frecuencia", async () => {
    const r = await M.frecuencia({ desde: "2026-01-01", hasta: "2026-11-30" });
    const e = r.filas.find(x => x.id_insumo === 2);
    assert.equal(e.cada_dias, null);
    assert.equal(e.estado, null);
    assert.equal(r.sin_frecuencia, 1);
  });

  test("por puesto y por sucursal de destino", async () => {
    const p = await M.frecuencia({ desde: "2026-01-01", hasta: "2026-11-30", agrupar: "puesto" });
    assert.ok(p.filas.some(x => x.grupo === "Asistente de Contraloría" && x.cada_dias === 28));
    const s = await M.frecuencia({ desde: "2026-01-01", hasta: "2026-11-30", agrupar: "sucursal" });
    assert.ok(s.filas.some(x => x.grupo === "Sucursal Norte" && x.cada_dias === 28));
  });

  test("el consumo se agrupa por sucursal (destino de la salida)", async () => {
    const r = await M.consumo({ desde: "2026-01-01", hasta: "2026-11-30" });
    const norte = r.por_sucursal.find(s => s.sucursal === "Sucursal Norte");
    assert.ok(norte, JSON.stringify(r.por_sucursal));
    assert.equal(norte.piezas, 9);                       // 4 tóner + 5 etiquetas
    assert.deepEqual(norte.insumos.map(i => [i.id_insumo, i.piezas]), [[2, 5], [1, 4]]);
    assert.ok(r.detalle.every(d => d.sucursal), "cada renglón del detalle trae su sucursal");
  });

  test("las salidas anuladas no cuentan", async () => {
    const id = await salida("2026-10-19T10:00", 1, 1);
    let t = (await M.frecuencia({ desde: "2026-01-01", hasta: "2026-11-30" })).filas.find(x => x.id_insumo === 1);
    assert.equal(t.entregas, 4);
    await llamar(inv.anularSalida, { params: { id: String(id) }, body: { motivo: "Capturada por error" } });
    t = (await M.frecuencia({ desde: "2026-01-01", hasta: "2026-11-30" })).filas.find(x => x.id_insumo === 1);
    assert.equal(t.entregas, 3);
  });

  test("la ruta valida la agrupación y las fechas", async () => {
    const ok = await llamar(inv.getFrecuenciaConsumo, { query: { agrupar: "area", fecha_inicio: "2026-01-01", fecha_fin: "2026-11-30" } });
    assert.equal(ok.statusCode, 200);
    assert.equal(ok.body.agrupar, "area");
    const mal = await llamar(inv.getFrecuenciaConsumo, { query: { fecha_inicio: "2026-12-01", fecha_fin: "2026-01-01" } });
    assert.equal(mal.statusCode, 400);
  });
});
