/**
 * prueba-navegador-demo.js — Recorrido en navegador con DATOS DE EJEMPLO, sin
 * tocar la base real.
 *
 * La base real puede no tener tickets ni solicitudes, y varias pantallas (vista
 * de ticket, vista de solicitud, métricas) solo aparecen con datos. Este script:
 *   1. recrea la base de PRUEBA (precision_helpdesk_test) como las pruebas
 *      automáticas y le agrega un ticket, una solicitud y un área de ejemplo;
 *   2. enciende un servidor aparte (modo producción) en el puerto 5192 contra
 *      esa base;
 *   3. corre server/scripts/prueba-navegador.js contra él (Edge o Chrome);
 *   4. apaga ese servidor.
 *
 * Requiere haber compilado la app (npm run build).
 * Uso:  npm run test:navegador
 */
import { spawn } from "child_process";
import path from "path";
import os from "os";
import { fileURLToPath } from "url";
import { prepararBD, cerrarBD } from "../tests/_bd-prueba.js";

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const PUERTO = process.env.PUERTO_DEMO || "5192";
const BASE = `http://127.0.0.1:${PUERTO}`;
const esperar = (ms) => new Promise(r => setTimeout(r, ms));

// 1. Base de prueba con datos de ejemplo ────────────────────────────────────
await prepararBD();
const pool = (await import("../config/db.js")).default;
const hoy = new Date();
const MES = `${hoy.getFullYear()}${String(hoy.getMonth() + 1).padStart(2, "0")}`;
const FOLIO_TICKET = `ST-${MES}-0001`, FOLIO_SOL = `SOL-${MES}-0001`;
await pool.query(
  `INSERT INTO ticket (folio_ticket, titulo, descripcion, prioridad, estatus, id_empleado, id_categoria, fecha_subido)
   VALUES (?, 'La impresora no imprime', 'Marca error de papel atascado', 'Alta', 'En proceso', 3, 1, NOW())`, [FOLIO_TICKET]);
await pool.query(
  `INSERT INTO solicitud (folio_solicitud, prioridad, estatus, id_empleado, observacion, fecha)
   VALUES (?, 'Media', 'En proceso', 3, 'Tóner para la impresora de caja', NOW())`, [FOLIO_SOL]);
const [[sol]] = await pool.query("SELECT id_solicitud FROM solicitud WHERE folio_solicitud = ?", [FOLIO_SOL]);
await pool.query("INSERT INTO solicitud_insumo (id_solicitud, id_insumo, cantidad) VALUES (?, 1, 2), (?, 2, 1)", [sol.id_solicitud, sol.id_solicitud]);
await pool.query("INSERT INTO area (nombre_area) VALUES ('Contraloría'), ('Almacén y Distribución')");
await cerrarBD();
const DB = process.env.DB_NAME;
console.log(`Base de prueba ${DB} lista: ticket ${FOLIO_TICKET}, solicitud ${FOLIO_SOL}.`);

// 2. Servidor aparte contra la base de prueba ───────────────────────────────
const entorno = {
  ...process.env, NODE_ENV: "production", PORT: PUERTO, HOST: "127.0.0.1", DB_NAME: DB,
  EVIDENCIAS_DIR: path.join(os.tmpdir(), `helpdesk-demo-evidencias-${process.pid}`),
};
const servidor = spawn(process.execPath, ["--import", "./server/load-env.js", "server/server.js"], { cwd: RAIZ, env: entorno, stdio: ["ignore", "pipe", "pipe"] });
let salida = "";
servidor.stdout.on("data", d => { salida += d; });
servidor.stderr.on("data", d => { salida += d; });
let arriba = false;
for (let i = 0; i < 40 && !arriba; i++) {
  await esperar(1000);
  try { arriba = (await fetch(`${BASE}/api/ping`)).ok; } catch { /* aún no */ }
}
if (!arriba) {
  servidor.kill();
  console.error("El servidor de prueba no encendió:\n" + salida.slice(-2000));
  process.exit(1);
}

// 3. Recorrido en navegador ─────────────────────────────────────────────────
const codigo = await new Promise((resolve) => {
  // PRUEBA_SCRIPT permite correr otro recorrido (p. ej. server/scripts/captura-movil.js).
  const script = process.env.PRUEBA_SCRIPT || "server/scripts/prueba-navegador.js";
  const p = spawn(process.execPath, ["--import", "./server/load-env.js", script, BASE, ...process.argv.slice(2)],
    { cwd: RAIZ, env: { ...entorno, NODE_ENV: "development", PORT: "", PRUEBA_TICKET: FOLIO_TICKET, PRUEBA_SOLICITUD: FOLIO_SOL }, stdio: "inherit" });
  p.on("exit", resolve);
});

// 4. Apagar ─────────────────────────────────────────────────────────────────
servidor.kill();
process.exit(codigo ?? 1);
