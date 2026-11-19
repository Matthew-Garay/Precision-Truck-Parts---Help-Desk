/**
 * solicitudes.test.js — Solicitudes de insumos y su efecto en el inventario.
 *
 * Cubre: crear (validaciones y permisos), que el usuario no vea el stock ni
 * solicitudes ajenas, aceptar con ruta de sucursales (parcial: solo se
 * descuenta lo aceptado), rechazar sin tocar el stock, no reabrir una
 * solicitud cerrada y que lo aceptado cuente en el reporte de consumo.
 */
import { test, describe, before, after } from "node:test";
import assert from "node:assert/strict";
import { prepararBD, cerrarBD, respuesta, reqAdmin } from "./_bd-prueba.js";

let ctrl, pool, Movimiento;

const reqUsuario = (extra = {}, id = 3) => ({
  usuario: { id_empleado: id, id_rol: 2 }, params: {}, query: {}, body: {}, headers: {}, ...extra,
});
const llamar = async (fn, req) => { const res = respuesta(); await fn(req, res); return res; };
const stock = async (id) => (await pool.query("SELECT stock FROM insumo WHERE id_insumo = ?", [id]))[0][0].stock;
const solicitud = async (id) => (await pool.query("SELECT * FROM solicitud WHERE id_solicitud = ?", [id]))[0][0];
const renglones = async (id) => (await pool.query(
  "SELECT id_solicitud_insumo, id_insumo, cantidad FROM solicitud_insumo WHERE id_solicitud = ? ORDER BY id_insumo", [id]))[0];

const nueva = (insumos, extra = {}) => llamar(ctrl.crearSolicitud, reqUsuario({
  body: { prioridad: "Media", id_empleado: 3, insumos, observaciones_generales: "Para la caja 2", ...extra },
}));

describe("solicitudes de insumos", () => {
  before(async () => {
    await prepararBD();
    ctrl       = await import("../controllers/solicitudes-controller.js");
    pool       = (await import("../config/db.js")).default;
    Movimiento = (await import("../services/movimiento-inventario.js")).default;
  });
  after(cerrarBD);

  let s1, s2;

  // ── Crear ────────────────────────────────────────────────────────────────
  test("crear: 201 con folio y queda pendiente, sin descontar stock todavía", async () => {
    const res = await nueva([{ id_insumo: 1, cantidad: 4 }, { id_insumo: 2, cantidad: 2 }]);
    assert.equal(res.statusCode, 201, JSON.stringify(res.body));
    assert.ok(res.body.folio_solicitud, "debe traer folio");
    s1 = res.body.id_solicitud;
    const s = await solicitud(s1);
    assert.notEqual(s.estatus, "Aceptado");
    assert.equal(s.observacion, "Para la caja 2");
    assert.equal(await stock(1), 10, "el stock se descuenta hasta que se acepta");
  });

  test("crear sin observaciones generales responde 400", async () => {
    const res = await nueva([{ id_insumo: 1, cantidad: 1 }], { observaciones_generales: "  " });
    assert.equal(res.statusCode, 400);
  });

  test("crear con cantidad 0 responde 400", async () => {
    const res = await nueva([{ id_insumo: 1, cantidad: 0 }]);
    assert.equal(res.statusCode, 400);
  });

  test("un insumo repetido en la misma solicitud responde 400 (no error del sistema)", async () => {
    const res = await nueva([{ id_insumo: 1, cantidad: 1 }, { id_insumo: 1, cantidad: 2 }]);
    assert.equal(res.statusCode, 400);
    assert.match(res.body.error, /repetido/);
  });

  test("un usuario no puede crear solicitudes a nombre de otro", async () => {
    const res = await llamar(ctrl.crearSolicitud, reqUsuario({
      body: { prioridad: "Media", id_empleado: 3, insumos: [{ id_insumo: 1, cantidad: 1 }], observaciones_generales: "x" },
    }, 2));
    assert.equal(res.statusCode, 403);
  });

  // ── Ver ──────────────────────────────────────────────────────────────────
  test("el dueño ve su solicitud sin el stock interno; otro usuario recibe 403", async () => {
    const propia = await llamar(ctrl.getSolicitudById, reqUsuario({ params: { id: String(s1) } }));
    assert.equal(propia.statusCode, 200, JSON.stringify(propia.body));
    for (const d of propia.body.detalle || []) assert.equal("stock" in d, false, "el usuario no debe ver el stock");
    const ajena = await llamar(ctrl.getSolicitudById, reqUsuario({ params: { id: String(s1) } }, 2));
    assert.equal(ajena.statusCode, 403);
  });

  // ── Aceptar ──────────────────────────────────────────────────────────────
  test("aceptar sin ruta de sucursales responde 400 y no toca el stock", async () => {
    const items = (await renglones(s1)).map(r => ({ id_solicitud_insumo: r.id_solicitud_insumo, aprobado: 1, cantidad: r.cantidad }));
    const res = await llamar(ctrl.actualizarEstatusSolicitud, reqAdmin({ params: { id: String(s1) }, body: { estatus: "Aceptado", items } }));
    assert.equal(res.statusCode, 400);
    assert.equal(await stock(1), 10);
  });

  test("aceptar con la misma sucursal de origen y destino responde 400", async () => {
    const items = (await renglones(s1)).map(r => ({ id_solicitud_insumo: r.id_solicitud_insumo, aprobado: 1, cantidad: r.cantidad }));
    const res = await llamar(ctrl.actualizarEstatusSolicitud, reqAdmin({
      params: { id: String(s1) }, body: { estatus: "Aceptado", items, id_sucursal_origen: 1, id_sucursal_destino: 1 },
    }));
    assert.equal(res.statusCode, 400);
  });

  test("aceptar parcial: solo se descuenta lo aceptado y lo negado no", async () => {
    const [toner, etiqueta] = await renglones(s1);
    const res = await llamar(ctrl.actualizarEstatusSolicitud, reqAdmin({
      params: { id: String(s1) },
      body: {
        estatus: "Aceptado", id_sucursal_origen: 1, id_sucursal_destino: 2,
        items: [
          { id_solicitud_insumo: toner.id_solicitud_insumo, aprobado: 1, cantidad: 3 },   // pidió 4, se aceptan 3
          { id_solicitud_insumo: etiqueta.id_solicitud_insumo, aprobado: 0, cantidad: 0 },
        ],
      },
    }));
    assert.equal(res.statusCode, 200, JSON.stringify(res.body));
    assert.equal((await solicitud(s1)).estatus, "Aceptado");
    assert.equal(await stock(1), 7);
    assert.equal(await stock(2), 5, "lo negado no se descuenta");
    const [movs] = await pool.query("SELECT tipo, cantidad, id_insumo FROM movimiento_inventario WHERE id_solicitud = ?", [s1]);
    assert.deepEqual(movs.map(m => [m.tipo, m.id_insumo, m.cantidad]), [["Salida", 1, 3]]);
  });

  test("una solicitud cerrada no se vuelve a aceptar ni rechazar (409)", async () => {
    const rech = await llamar(ctrl.actualizarEstatusSolicitud, reqAdmin({ params: { id: String(s1) }, body: { estatus: "Rechazado" } }));
    assert.equal(rech.statusCode, 409);
    assert.equal(await stock(1), 7);
  });

  // ── Rechazar ─────────────────────────────────────────────────────────────
  test("rechazar no descuenta nada", async () => {
    s2 = (await nueva([{ id_insumo: 3, cantidad: 1 }])).body.id_solicitud;
    const res = await llamar(ctrl.actualizarEstatusSolicitud, reqAdmin({ params: { id: String(s2) }, body: { estatus: "Rechazado" } }));
    assert.equal(res.statusCode, 200, JSON.stringify(res.body));
    assert.equal((await solicitud(s2)).estatus, "Rechazado");
    assert.equal(await stock(3), 1);
  });

  test("no se puede aceptar más de lo que hay en stock", async () => {
    const s3 = (await nueva([{ id_insumo: 3, cantidad: 1 }])).body.id_solicitud;
    await pool.query("UPDATE insumo SET stock = 0 WHERE id_insumo = 3");
    const [r] = await renglones(s3);
    const res = await llamar(ctrl.actualizarEstatusSolicitud, reqAdmin({
      params: { id: String(s3) },
      body: { estatus: "Aceptado", id_sucursal_origen: 1, id_sucursal_destino: 2,
              items: [{ id_solicitud_insumo: r.id_solicitud_insumo, aprobado: 1, cantidad: 1 }] },
    }));
    assert.equal(res.statusCode, 400);
    assert.match(res.body.error, /Stock insuficiente/);
    assert.notEqual((await solicitud(s3)).estatus, "Aceptado");
    assert.equal(await stock(3), 0);
  });

  // ── Reporte de consumo ───────────────────────────────────────────────────
  test("lo aceptado en una solicitud cuenta en el reporte de consumo", async () => {
    const hoy = new Date();
    const p2 = (n) => String(n).padStart(2, "0");
    const ini = `${hoy.getFullYear()}-${p2(hoy.getMonth() + 1)}-01`;
    const fin = `${hoy.getFullYear()}-${p2(hoy.getMonth() + 1)}-${p2(hoy.getDate())}`;
    const r = await Movimiento.consumo({ desde: ini, hasta: fin });
    const toner = r.por_insumo.find(x => x.id_insumo === 1);
    assert.ok(toner, JSON.stringify(r.por_insumo));
    assert.equal(toner.piezas, 3);
    assert.equal(r.por_insumo.find(x => x.id_insumo === 2), undefined, "lo negado no cuenta");
  });
});
