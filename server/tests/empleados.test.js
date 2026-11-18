/**
 * empleados.test.js — Borrado lógico de empleados.
 *
 * "Eliminar" en Personal no borra la fila: el empleado deja de listarse,
 * queda inactivo y sin sesiones, pero su registro se conserva.
 */
import { test, describe, before, after } from "node:test";
import assert from "node:assert/strict";
import { prepararBD, cerrarBD, respuesta, reqAdmin } from "./_bd-prueba.js";

let auth, pool, Empleado;
const llamar = async (fn, req) => { const res = respuesta(); await fn(reqAdmin(req), res); return res; };

describe("eliminar empleado (borrado lógico)", () => {
  before(async () => {
    await prepararBD();
    auth = await import("../controllers/auth-controller.js");
    pool = (await import("../config/db.js")).default;
    Empleado = (await import("../services/empleado.js")).default;
  });
  after(cerrarBD);

  test("el empleado eliminado ya no aparece en la lista, pero sigue en la base", async () => {
    const res = await llamar(auth.eliminarEmpleado, { params: { id: "3" } });
    assert.equal(res.statusCode, 200, JSON.stringify(res.body));
    const lista = await Empleado.getAll();
    assert.ok(!lista.some(e => e.id_empleado === 3), "no debe listarse");
    const [[fila]] = await pool.query("SELECT eliminado, estatus, id_elimino, token_version FROM empleado WHERE id_empleado = 3");
    assert.ok(fila, "la fila debe seguir existiendo");
    assert.equal(fila.eliminado, 1);
    assert.equal(fila.estatus, "Inactivo");
    assert.equal(fila.id_elimino, 1);
    assert.equal(fila.token_version, 1, "sus sesiones deben quedar invalidadas");
  });

  test("eliminar de nuevo al mismo empleado responde 404", async () => {
    const res = await llamar(auth.eliminarEmpleado, { params: { id: "3" } });
    assert.equal(res.statusCode, 404);
  });

  test("un empleado eliminado no se puede editar ni reactivar", async () => {
    const res = await llamar(auth.updateEmpleadoAdmin, { params: { id: "3" }, body: { estatus: "Activo" } });
    assert.equal(res.statusCode, 404);
    const [[fila]] = await pool.query("SELECT estatus FROM empleado WHERE id_empleado = 3");
    assert.equal(fila.estatus, "Inactivo");
  });

  test("nadie puede eliminarse a sí mismo", async () => {
    const res = await llamar(auth.eliminarEmpleado, { params: { id: "1" } });
    assert.equal(res.statusCode, 409);
  });

  test("no se puede eliminar al último administrador activo", async () => {
    // Quedan dos admins (1 y 2): eliminar al 2 sí se permite...
    const r1 = await llamar(auth.eliminarEmpleado, { params: { id: "2" } });
    assert.equal(r1.statusCode, 200);
    // ...y ahora el admin 1 es el último: otro admin (simulado) no puede borrarlo.
    const res = respuesta();
    await auth.eliminarEmpleado({ usuario: { id_empleado: 99, id_rol: 1 }, params: { id: "1" }, body: {} }, res);
    assert.equal(res.statusCode, 409);
  });

  test("ID inválido responde 400", async () => {
    const res = await llamar(auth.eliminarEmpleado, { params: { id: "abc" } });
    assert.equal(res.statusCode, 400);
  });
});
