/* global document -- el código dentro de page.evaluate() corre en el navegador */
/**
 * medir-carga.js — Mide cuánto tarda en abrir cada pantalla (como la vería un
 * usuario): número de peticiones, KB transferidos, tiempo total y las llamadas
 * a la API más lentas. Sirve para comparar modo desarrollo contra producción.
 *
 * Uso:  node --import ./server/load-env.js server/scripts/medir-carga.js http://127.0.0.1:5173
 *  (o con datos de ejemplo: PRUEBA_SCRIPT=server/scripts/medir-carga.js npm run test:navegador)
 */
import fs from "fs";
import jwt from "jsonwebtoken";
import mysql from "mysql2/promise";
import puppeteer from "puppeteer-core";

const BASE = (process.argv[2] || "http://127.0.0.1:5173").replace(/\/+$/, "");
const ejecutable = ["C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe", "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"].find(p => fs.existsSync(p));

const c = await mysql.createConnection({ host: process.env.DB_HOST, port: process.env.DB_PORT, user: process.env.DB_USER, password: process.env.DB_PASSWORD, database: process.env.DB_NAME });
const [[admin]] = await c.query(`SELECT e.id_empleado, e.nombre, e.ap_paterno, e.email, e.id_rol, e.token_version, d.nombre_departamento AS departamento
  FROM empleado e LEFT JOIN departamento d ON d.id_departamento = e.id_departamento
  WHERE e.estatus = 'Activo' AND e.eliminado = 0 AND e.id_rol = 1 ORDER BY e.id_empleado LIMIT 1`);
await c.end();
const token = jwt.sign({ id_empleado: admin.id_empleado, id_rol: admin.id_rol, ver: admin.token_version }, process.env.JWT_SECRET, { expiresIn: "10m" });
const usuario = { ...admin, rol: "admin", token_version: undefined };

const navegador = await puppeteer.launch({ executablePath: ejecutable, headless: true, args: ["--no-first-run"] });
const PANTALLAS = ["/admin/dashboard", "/admin/historial", "/admin/insumos", "/admin/inventario", "/admin/personal"];

// Primera visita (sin caché) y segunda (con caché), como un usuario real.
const page = await navegador.newPage();
await page.goto(`${BASE}/login`, { waitUntil: "domcontentloaded" });
await page.evaluate((t, u) => {
  localStorage.setItem("_tk", t); localStorage.setItem("usuario", JSON.stringify(u));
  localStorage.setItem("_ultima_actividad", String(Date.now()));
}, token, usuario);
const cdp = await page.createCDPSession();
await cdp.send("Network.enable");
await cdp.send("Network.clearBrowserCache");

for (const vuelta of ["sin caché", "con caché"]) {
  for (const ruta of PANTALLAS) {
    let peticiones = 0, bytes = 0;
    const api = new Map();
    const alRecibir = (e) => { bytes += e.encodedDataLength || 0; };
    const alPedir = (r) => { peticiones++; if (r.url().includes("/api/")) api.set(r, Date.now()); };
    const alTerminar = (r) => { if (api.has(r)) api.set(r, Date.now() - api.get(r)); };
    cdp.on("Network.loadingFinished", alRecibir);
    page.on("request", alPedir); page.on("requestfinished", alTerminar);
    const t0 = Date.now();
    await page.goto(BASE + ruta, { waitUntil: "networkidle0", timeout: 60000 });
    const total = Date.now() - t0;
    cdp.off("Network.loadingFinished", alRecibir);
    page.off("request", alPedir); page.off("requestfinished", alTerminar);
    const lentas = [...api.entries()].map(([r, ms]) => [ms, r.url().replace(BASE, "").slice(0, 60)]).sort((a, b) => b[0] - a[0]).slice(0, 3);
    console.log(`${vuelta.padEnd(9)} ${ruta.padEnd(18)} ${String(total).padStart(5)} ms  ${String(peticiones).padStart(4)} peticiones  ${String(Math.round(bytes / 1024)).padStart(6)} KB   API más lenta: ${lentas.map(([ms, u]) => `${u} ${ms}ms`).join(" | ")}`);
  }
}
await navegador.close();
