/** areas.test.js — Asignar puestos a áreas desde Personal. */
import { test, describe, before, after } from "node:test";
import assert from "node:assert/strict";
import { prepararBD, cerrarBD, respuesta, reqAdmin } from "./_bd-prueba.js";

let auth, pool;
const llamar = async (fn, req) => { const r = respuesta(); await fn(reqAdmin(req), r); return r; };

describe("áreas de los puestos", () => {
  before(async () => {
    await prepararBD();
    auth = await import("../controllers/auth-controller.js");
    pool = (await import("../config/db.js")).default;
  });
  after(cerrarBD);

  let idArea;
  test("crear un área; no se repite el nombre", async () => {
    let r = await llamar(auth.crearArea, { body: { nombre_area: "  Contraloría  " } });
    assert.equal(r.statusCode, 201, JSON.stringify(r.body));
    idArea = r.body.id_area;
    assert.equal(r.body.nombre_area, "Contraloría");
    r = await llamar(auth.crearArea, { body: { nombre_area: "Contraloría" } });
    assert.equal(r.statusCode, 409);
    r = await llamar(auth.crearArea, { body: { nombre_area: "x" } });
    assert.equal(r.statusCode, 400);
  });

  test("asignar y quitar el área de un puesto; los puestos la muestran", async () => {
    let r = await llamar(auth.asignarAreaPuesto, { params: { id: "1" }, body: { id_area: idArea } });
    assert.equal(r.statusCode, 200, JSON.stringify(r.body));
    const deps = await llamar(auth.getDepartamentos, {});
    assert.equal(deps.body.find(d => d.id_departamento === 1).nombre_area, "Contraloría");
    const areas = await llamar(auth.getAreas, {});
    assert.equal(areas.body.find(a => a.id_area === idArea).puestos, 1);
    r = await llamar(auth.asignarAreaPuesto, { params: { id: "1" }, body: { id_area: null } });
    assert.equal(r.statusCode, 200);
    assert.equal((await pool.query("SELECT id_area FROM departamento WHERE id_departamento = 1"))[0][0].id_area, null);
  });

  test("área o puesto inexistente", async () => {
    assert.equal((await llamar(auth.asignarAreaPuesto, { params: { id: "1" }, body: { id_area: 999 } })).statusCode, 400);
    assert.equal((await llamar(auth.asignarAreaPuesto, { params: { id: "999" }, body: { id_area: idArea } })).statusCode, 404);
  });
});
