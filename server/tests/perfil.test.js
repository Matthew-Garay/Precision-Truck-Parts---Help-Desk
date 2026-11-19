/**
 * perfil.test.js — Cambio de contraseña desde "Configuración".
 *
 * La contraseña actual la escribe el usuario (ya no se guarda en el navegador)
 * y el servidor la verifica. Equivocarse NO debe responder 401: el cliente
 * trata 401 como sesión vencida y sacaría al usuario del sistema.
 */
import { test, describe, before, after } from "node:test";
import assert from "node:assert/strict";
import bcrypt from "bcryptjs";
import { prepararBD, cerrarBD, respuesta } from "./_bd-prueba.js";

let auth, pool;
const ACTUAL = "Actual#2026";
const NUEVA  = "Nueva#2026x";

const cambiar = async (body) => {
  const res = respuesta();
  await auth.actualizarPerfil({ usuario: { id_empleado: 3, id_rol: 2 }, params: { id: "3" }, body, headers: {} }, res);
  return res;
};
const hashDe3 = async () => (await pool.query("SELECT password FROM empleado WHERE id_empleado = 3"))[0][0].password;

describe("cambio de contraseña en el perfil", () => {
  before(async () => {
    await prepararBD();
    auth = await import("../controllers/auth-controller.js");
    pool = (await import("../config/db.js")).default;
    await pool.query("UPDATE empleado SET password = ? WHERE id_empleado = 3", [await bcrypt.hash(ACTUAL, 4)]);
  });
  after(cerrarBD);

  test("sin contraseña actual: 400 y no cambia", async () => {
    const antes = await hashDe3();
    const res = await cambiar({ password_nueva: NUEVA });
    assert.equal(res.statusCode, 400);
    assert.equal(await hashDe3(), antes);
  });

  test("contraseña actual incorrecta: 400 (no 401, para no cerrar la sesión) y no cambia", async () => {
    const antes = await hashDe3();
    const res = await cambiar({ password_actual: "otra-cosa", password_nueva: NUEVA });
    assert.equal(res.statusCode, 400);
    assert.match(res.body.error, /incorrecta/);
    assert.equal(await hashDe3(), antes);
  });

  test("con la contraseña actual correcta sí cambia", async () => {
    const res = await cambiar({ password_actual: ACTUAL, password_nueva: NUEVA });
    assert.equal(res.statusCode, 200, JSON.stringify(res.body));
    assert.ok(await bcrypt.compare(NUEVA, await hashDe3()));
  });

  // ── Correo: también pide la contraseña actual (con él se inicia sesión) ──
  const correoDe3 = async () => (await pool.query("SELECT email FROM empleado WHERE id_empleado = 3"))[0][0].email.toLowerCase();

  test("guardar el mismo correo (cambiando solo el nombre) no pide contraseña", async () => {
    await pool.query("UPDATE empleado SET email = 'usuario3@ptp.com.mx' WHERE id_empleado = 3");
    const res = await cambiar({ nombre: "Usuario", ap_paterno: "Tres", email: "Usuario3@ptp.com.mx" });
    assert.equal(res.statusCode, 200, JSON.stringify(res.body));
  });

  test("cambiar el correo sin contraseña actual: 400 y no cambia", async () => {
    const res = await cambiar({ email: "otro3@ptp.com.mx" });
    assert.equal(res.statusCode, 400);
    assert.match(res.body.error, /correo/);
    assert.equal(await correoDe3(), "usuario3@ptp.com.mx");
  });

  test("cambiar el correo con contraseña incorrecta: 400 y no cambia", async () => {
    const res = await cambiar({ email: "otro3@ptp.com.mx", password_actual: "mala" });
    assert.equal(res.statusCode, 400);
    assert.equal(await correoDe3(), "usuario3@ptp.com.mx");
  });

  test("cambiar el correo con la contraseña correcta sí cambia", async () => {
    const res = await cambiar({ email: "otro3@ptp.com.mx", password_actual: NUEVA });
    assert.equal(res.statusCode, 200, JSON.stringify(res.body));
    assert.equal(await correoDe3(), "otro3@ptp.com.mx");
  });

  test("nadie puede cambiar el perfil de otro usuario", async () => {
    const res = respuesta();
    await auth.actualizarPerfil({ usuario: { id_empleado: 2, id_rol: 2 }, params: { id: "3" }, body: { nombre: "X" }, headers: {} }, res);
    assert.equal(res.statusCode, 403);
  });
});
