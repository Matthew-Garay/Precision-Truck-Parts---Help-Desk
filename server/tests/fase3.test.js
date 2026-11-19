/**
 * fase3.test.js — Fase 3 de normalización (migración 007).
 *   - La anulación vive en salida_anulacion; v_salida_interna da el estatus.
 *   - Una salida no se puede anular dos veces, ni aunque lleguen dos a la vez.
 *   - IDs `int` y fechas `datetime` en todo el esquema.
 */
import { test, describe, before, after } from "node:test";
import assert from "node:assert/strict";
import { prepararBD, cerrarBD, respuesta, reqAdmin, DB } from "./_bd-prueba.js";

let pool, inv;
const llamar = async (fn, req) => { const r = respuesta(); await fn(reqAdmin(req), r); return r; };
const vista = async (id) => (await pool.query("SELECT estatus, motivo_anulacion, id_anulo FROM v_salida_interna WHERE id_salida = ?", [id]))[0][0];
const nuevaSalida = async () => (await llamar(inv.registrarSalidaInsumo, {
  body: { items: [{ id_insumo: 2, cantidad: 1 }], id_solicitante: 3, fecha: "2026-11-05T09:00" },
})).body.id_salida;

describe("fase 3 de normalización", () => {
  before(async () => {
    await prepararBD();
    pool = (await import("../config/db.js")).default;
    inv  = await import("../controllers/inventario-controller.js");
  });
  after(cerrarBD);

  test("una salida nueva está Activa y sin datos de anulación", async () => {
    const id = await nuevaSalida();
    assert.deepEqual({ ...(await vista(id)) }, { estatus: "Activa", motivo_anulacion: null, id_anulo: null });
    const [[n]] = await pool.query("SELECT COUNT(*) n FROM salida_anulacion WHERE id_salida = ?", [id]);
    assert.equal(n.n, 0);
  });

  test("anular registra un renglón en salida_anulacion y la vista la muestra Anulada", async () => {
    const id = await nuevaSalida();
    const r = await llamar(inv.anularSalida, { params: { id: String(id) }, body: { motivo: "Se capturó dos veces" } });
    assert.equal(r.statusCode, 200, JSON.stringify(r.body));
    assert.deepEqual({ ...(await vista(id)) }, { estatus: "Anulada", motivo_anulacion: "Se capturó dos veces", id_anulo: 1 });
  });

  test("dos anulaciones al mismo tiempo: una pasa, la otra 409 y el stock regresa una sola vez", async () => {
    const id = await nuevaSalida();
    const [[{ stock: antes }]] = await pool.query("SELECT stock FROM insumo WHERE id_insumo = 2");
    const [a, b] = await Promise.all([
      llamar(inv.anularSalida, { params: { id: String(id) }, body: { motivo: "Prueba simultánea A" } }),
      llamar(inv.anularSalida, { params: { id: String(id) }, body: { motivo: "Prueba simultánea B" } }),
    ]);
    assert.deepEqual([a.statusCode, b.statusCode].sort(), [200, 409]);
    const [[{ stock: despues }]] = await pool.query("SELECT stock FROM insumo WHERE id_insumo = 2");
    assert.equal(despues, antes + 1);
  });

  test("el motivo de anulación debe tener al menos 5 caracteres también en la base", async () => {
    const id = await nuevaSalida();
    await assert.rejects(() => pool.query("INSERT INTO salida_anulacion (id_salida, motivo) VALUES (?, 'x')", [id]));
  });

  test("salida_interna ya no tiene columnas de anulación", async () => {
    const [cols] = await pool.query(
      "SELECT COLUMN_NAME c FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'salida_interna'", [DB]);
    const nombres = cols.map(x => x.c);
    for (const c of ["estatus", "motivo_anulacion", "fecha_anulacion", "id_anulo"]) assert.equal(nombres.includes(c), false, c);
  });

  test("tipos unificados: sin TIMESTAMP ni INT UNSIGNED en llaves", async () => {
    const [ts] = await pool.query(
      "SELECT CONCAT(TABLE_NAME,'.',COLUMN_NAME) c FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = ? AND DATA_TYPE = 'timestamp'", [DB]);
    assert.deepEqual(ts.map(x => x.c), []);
    const [uns] = await pool.query(
      `SELECT CONCAT(TABLE_NAME,'.',COLUMN_NAME) c FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = ? AND COLUMN_TYPE LIKE '%unsigned%' AND COLUMN_KEY IN ('PRI','MUL','UNI')`, [DB]);
    assert.deepEqual(uns.map(x => x.c), []);
  });
});
