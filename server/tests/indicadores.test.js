/**
 * indicadores.test.js — Cifras del reporte mensual para dirección.
 * Se arman tickets y salidas con fechas conocidas y se revisan los cálculos:
 * conteo por mes, tiempo promedio, % dentro de la meta de 2 días,
 * calificación, por categoría/sucursal y consumo por sucursal.
 */
import { test, describe, before, after } from "node:test";
import assert from "node:assert/strict";
import { prepararBD, cerrarBD, respuesta, reqAdmin } from "./_bd-prueba.js";

let pool, Indicadores, inv, ctrl;

async function ticket(folio, subido, resuelto, estatus, calificacion = null, empleado = 3) {
  await pool.query(
    `INSERT INTO ticket (folio_ticket, titulo, descripcion, fecha_subido, fecha_resuelto, estatus, prioridad, id_empleado, id_categoria, calificacion)
     VALUES (?, 'x', 'x', ?, ?, ?, 'Media', ?, 1, ?)`, [folio, subido, resuelto, estatus, empleado, calificacion]);
}

describe("indicadores mensuales", () => {
  before(async () => {
    await prepararBD();
    pool        = (await import("../config/db.js")).default;
    Indicadores = (await import("../services/indicadores.js")).default;
    inv         = await import("../controllers/inventario-controller.js");
    ctrl        = await import("../controllers/tickets-controller.js");
    // Octubre: 1 resuelto en 24 h (en meta, calif. 5), 1 resuelto en 72 h (fuera, calif. 3), 1 no resuelto
    await ticket("T-1", "2026-10-05 09:00:00", "2026-10-06 09:00:00", "Resuelto", 5);
    await ticket("T-2", "2026-10-10 09:00:00", "2026-10-13 09:00:00", "Resuelto", 3);
    await ticket("T-3", "2026-10-20 09:00:00", "2026-10-22 09:00:00", "No Resuelto");
    // Septiembre: 1 ticket del empleado 1 (otra sucursal)
    await ticket("T-4", "2026-09-15 09:00:00", "2026-09-15 13:00:00", "Resuelto", null, 1);
    // Salida de octubre hacia la sucursal 2
    const r = respuesta();
    await inv.registrarSalidaInsumo(reqAdmin({ body: { items: [{ id_insumo: 1, cantidad: 4 }], id_solicitante: 3, id_destino: 2, fecha: "2026-10-08T10:00" } }), r);
    assert.equal(r.statusCode, 200, JSON.stringify(r.body));
  });
  after(cerrarBD);

  test("resumen de octubre", async () => {
    const d = await Indicadores.mensual("2026-10");
    assert.equal(d.tendencia.length, 12);
    assert.equal(d.tendencia[11].mes, "2026-10");
    const r = d.resumen;
    assert.equal(r.tickets, 3);
    assert.equal(r.resueltos, 2);
    assert.equal(r.no_resueltos, 1);
    assert.equal(r.horas_promedio, 48);       // (24 + 72) / 2
    assert.equal(r.pct_meta, 50);             // 1 de 2 en ≤ 48 h
    assert.equal(r.calificacion, 4);          // (5 + 3) / 2
    assert.equal(r.piezas, 4);
    assert.equal(r.anterior.mes, "2026-09");
    assert.equal(r.anterior.tickets, 1);
  });

  test("por categoría, sucursal y consumo por sucursal", async () => {
    const d = await Indicadores.mensual("2026-10");
    assert.deepEqual(d.por_categoria, [{ nombre: "Consumibles", tickets: 3 }]);
    assert.deepEqual(d.por_sucursal, [{ nombre: "Sucursal Norte", tickets: 3 }]);
    assert.deepEqual(d.consumo_sucursal, [{ nombre: "Sucursal Norte", piezas: 4 }]);
    assert.equal(d.top_insumos[0].piezas, 4);
  });

  test("un mes sin datos devuelve ceros, no errores", async () => {
    const d = await Indicadores.mensual("2025-01");
    assert.equal(d.resumen.tickets, 0);
    assert.equal(d.resumen.horas_promedio, null);
    assert.deepEqual(d.por_categoria, []);
  });

  test("la ruta valida el mes", async () => {
    const r = respuesta();
    await ctrl.getIndicadoresMensuales(reqAdmin({ query: { mes: "2026-13" } }), r);
    assert.equal(r.statusCode, 400);
    const ok = respuesta();
    await ctrl.getIndicadoresMensuales(reqAdmin({ query: { mes: "2026-10" } }), ok);
    assert.equal(ok.statusCode, 200);
    assert.equal(ok.body.mes, "2026-10");
  });
});
