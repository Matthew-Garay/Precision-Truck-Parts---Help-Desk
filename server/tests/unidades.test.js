/**
 * unidades.test.js — Fase 4: equipos pieza por pieza con número de serie.
 *
 * Insumo 3 ("Ribbon prueba", stock 1 en la semilla) se usa como laptop:
 * activar control, entrada con series, salida eligiendo series, anulación,
 * solicitud aceptada (piezas más antiguas), bloqueos y que un insumo sin
 * control por pieza siga funcionando igual.
 */
import { test, describe, before, after } from "node:test";
import assert from "node:assert/strict";
import { prepararBD, cerrarBD, respuesta, reqAdmin } from "./_bd-prueba.js";

let pool, inv, ins, sol;
const L = 3; // insumo de prueba
const llamar = async (fn, req) => { const r = respuesta(); await fn(reqAdmin(req), r); return r; };
const stock = async (id = L) => (await pool.query("SELECT stock FROM insumo WHERE id_insumo = ?", [id]))[0][0].stock;
const enAlmacen = async () => (await pool.query(
  "SELECT num_serie FROM insumo_unidad WHERE id_insumo = ? AND en_almacen = 1 ORDER BY num_serie", [L]))[0].map(r => r.num_serie);
/** Regla de la fase 4: stock = piezas en almacén. */
const cuadra = async () => assert.equal(await stock(), (await enAlmacen()).length, "stock ≠ piezas en almacén");

describe("piezas con número de serie", () => {
  before(async () => {
    await prepararBD();
    pool = (await import("../config/db.js")).default;
    inv  = await import("../controllers/inventario-controller.js");
    ins  = await import("../controllers/insumos-controller.js");
    sol  = await import("../controllers/solicitudes-controller.js");
    await pool.query("UPDATE insumo SET stock = 2 WHERE id_insumo = ?", [L]);
  });
  after(cerrarBD);

  test("activar pide exactamente una serie por pieza en stock, sin repetidas", async () => {
    let r = await llamar(ins.activarControlSerie, { params: { id: String(L) }, body: { series: ["LAP-001"] } });
    assert.equal(r.statusCode, 400);
    assert.match(r.body.error, /2 pieza/);
    r = await llamar(ins.activarControlSerie, { params: { id: String(L) }, body: { series: ["LAP-001", "lap-001"] } });
    assert.equal(r.statusCode, 400);
    assert.match(r.body.error, /repetido/);
    r = await llamar(ins.activarControlSerie, { params: { id: String(L) }, body: { series: [" LAP-001 ", "LAP-002"] } });
    assert.equal(r.statusCode, 200, JSON.stringify(r.body));
    assert.deepEqual(await enAlmacen(), ["LAP-001", "LAP-002"]);
    await cuadra();
  });

  test("una entrada pide las series de lo que llega", async () => {
    let r = await llamar(inv.registrarEntradaInsumo, { params: { id: String(L) }, body: { cantidad: 2, series: ["LAP-003"] } });
    assert.equal(r.statusCode, 400);
    assert.equal(await stock(), 2, "rechazada no toca el stock");
    r = await llamar(inv.registrarEntradaInsumo, { params: { id: String(L) }, body: { cantidad: 1, series: ["LAP-001"] } });
    assert.equal(r.statusCode, 409, "LAP-001 ya está en almacén");
    r = await llamar(inv.registrarEntradaInsumo, { params: { id: String(L) }, body: { cantidad: 2, series: ["LAP-003", "LAP-004"] } });
    assert.equal(r.statusCode, 200, JSON.stringify(r.body));
    assert.deepEqual(r.body.series, ["LAP-003", "LAP-004"]);
    assert.equal(await stock(), 4);
    await cuadra();
  });

  let idSalida;
  test("una salida interna pide elegir qué series salen", async () => {
    const base = { id_solicitante: 3, id_destino: 2, fecha: "2026-11-10T10:00" };
    let r = await llamar(inv.registrarSalidaInsumo, { body: { ...base, items: [{ id_insumo: L, cantidad: 1 }] } });
    assert.equal(r.statusCode, 400);
    assert.match(r.body.error, /Elige/);
    r = await llamar(inv.registrarSalidaInsumo, { body: { ...base, items: [{ id_insumo: L, cantidad: 1, series: ["NO-EXISTE"] }] } });
    assert.equal(r.statusCode, 409);
    assert.equal(await stock(), 4);
    r = await llamar(inv.registrarSalidaInsumo, { body: { ...base, items: [{ id_insumo: L, cantidad: 2, series: ["LAP-002", "LAP-004"] }] } });
    assert.equal(r.statusCode, 200, JSON.stringify(r.body));
    idSalida = r.body.id_salida;
    assert.deepEqual(r.body.movimientos[0].series, ["LAP-002", "LAP-004"]);
    assert.deepEqual(await enAlmacen(), ["LAP-001", "LAP-003"]);
    await cuadra();
    const [lista] = [(await llamar(ins.getUnidadesInsumo, { params: { id: String(L) } })).body];
    const fuera = lista.find(u => u.num_serie === "LAP-002");
    assert.equal(fuera.en_almacen, 0);
    assert.match(fuera.folio_salida, /^SAL-/);
  });

  test("no se puede sacar una pieza que ya salió", async () => {
    const r = await llamar(inv.registrarSalidaInsumo, {
      body: { id_solicitante: 3, fecha: "2026-11-11T10:00", items: [{ id_insumo: L, cantidad: 1, series: ["LAP-002"] }] } });
    assert.equal(r.statusCode, 409);
  });

  test("anular la salida regresa esas piezas al almacén", async () => {
    const r = await llamar(inv.anularSalida, { params: { id: String(idSalida) }, body: { motivo: "Se capturó mal" } });
    assert.equal(r.statusCode, 200, JSON.stringify(r.body));
    assert.deepEqual(await enAlmacen(), ["LAP-001", "LAP-002", "LAP-003", "LAP-004"]);
    await cuadra();
  });

  test("solicitud aceptada: salen las piezas con más tiempo en almacén", async () => {
    await pool.query("UPDATE insumo_unidad SET fecha_alta = '2026-01-01' WHERE num_serie = 'LAP-003'");
    await pool.query("UPDATE insumo_unidad SET fecha_alta = '2026-02-01' WHERE num_serie = 'LAP-001'");
    const c = respuesta();
    await sol.crearSolicitud({ usuario: { id_empleado: 3, id_rol: 2 }, body: { prioridad: "Media", id_empleado: 3, observaciones_generales: "Laptop nueva", insumos: [{ id_insumo: L, cantidad: 2 }] } }, c);
    assert.equal(c.statusCode, 201, JSON.stringify(c.body));
    const [[it]] = await pool.query("SELECT id_solicitud_insumo FROM solicitud_insumo WHERE id_solicitud = ?", [c.body.id_solicitud]);
    const r = await llamar(sol.actualizarEstatusSolicitud, { params: { id: String(c.body.id_solicitud) },
      body: { estatus: "Aceptado", id_sucursal_origen: 1, id_sucursal_destino: 2, items: [{ id_solicitud_insumo: it.id_solicitud_insumo, aprobado: 1, cantidad: 2 }] } });
    assert.equal(r.statusCode, 200, JSON.stringify(r.body));
    assert.deepEqual(await enAlmacen(), ["LAP-002", "LAP-004"], "salieron LAP-003 y LAP-001 (las más antiguas)");
    await cuadra();
  });

  test("con control por pieza el stock no se edita en el formulario ni se edita la entrada", async () => {
    let r = await llamar(ins.actualizarInsumo, { params: { id: String(L) }, body: { stock: 10 } });
    assert.equal(r.statusCode, 409);
    const [[ent]] = await pool.query("SELECT id_movimiento FROM movimiento_inventario WHERE id_insumo = ? AND tipo = 'Entrada' LIMIT 1", [L]);
    r = await llamar(inv.editarEntrada, { params: { id: String(ent.id_movimiento) }, body: { cantidad: 5 } });
    assert.equal(r.statusCode, 409);
    r = await llamar(ins.actualizarInsumo, { params: { id: String(L) }, body: { nombre: "Laptop prueba" } });
    assert.equal(r.statusCode, 200, "los demás datos sí se editan");
  });

  test("corregir la serie de una pieza; no se puede desactivar si ya hubo movimientos", async () => {
    const [[u]] = await pool.query("SELECT id_unidad FROM insumo_unidad WHERE num_serie = 'LAP-004'");
    let r = await llamar(ins.actualizarUnidad, { params: { id: String(L), idUnidad: String(u.id_unidad) }, body: { num_serie: "LAP-004B", estado: "Regular" } });
    assert.equal(r.statusCode, 200, JSON.stringify(r.body));
    r = await llamar(ins.actualizarUnidad, { params: { id: String(L), idUnidad: String(u.id_unidad) }, body: { num_serie: "LAP-002" } });
    assert.equal(r.statusCode, 409);
    r = await llamar(ins.desactivarControlSerie, { params: { id: String(L) } });
    assert.equal(r.statusCode, 409);
  });

  test("un insumo sin control por pieza funciona igual que antes", async () => {
    const r = await llamar(inv.registrarSalidaInsumo, { body: { id_solicitante: 3, fecha: "2026-11-12T10:00", items: [{ id_insumo: 1, cantidad: 2 }] } });
    assert.equal(r.statusCode, 200, JSON.stringify(r.body));
    assert.equal(r.body.movimientos[0].series, undefined);
    const e = await llamar(inv.registrarEntradaInsumo, { params: { id: "1" }, body: { cantidad: 1 } });
    assert.equal(e.statusCode, 200, JSON.stringify(e.body));
  });

  test("activar y desactivar sin movimientos deja todo como estaba", async () => {
    let r = await llamar(ins.activarControlSerie, { params: { id: "2" }, body: { series: ["E1", "E2", "E3", "E4", "E5"] } });
    assert.equal(r.statusCode, 200, JSON.stringify(r.body));
    r = await llamar(ins.desactivarControlSerie, { params: { id: "2" } });
    assert.equal(r.statusCode, 200, JSON.stringify(r.body));
    const [[x]] = await pool.query("SELECT control_serie, (SELECT COUNT(*) FROM insumo_unidad WHERE id_insumo = 2) n FROM insumo WHERE id_insumo = 2");
    assert.deepEqual([Number(x.control_serie), x.n], [0, 0]);
  });
});
