/**
 * prueba-carga.js — Prueba de carga SOLO LECTURA contra el sistema encendido.
 *
 * Simula N usuarios simultáneos abriendo pantallas reales (catálogo, inventario,
 * tablero, tickets, solicitudes, indicadores) durante unos segundos y reporta
 * peticiones por segundo, tiempos (mediana, p95, máximo) y errores.
 * No escribe nada en la base: solo GET. Firma tokens temporales (10 min) con el
 * JWT_SECRET del .env para un administrador y un usuario activos.
 *
 * Uso:
 *   node --import ./server/load-env.js server/scripts/prueba-carga.js http://127.0.0.1:5173 50 15
 *                                                                      (url)      (usuarios) (segundos)
 */
import jwt from "jsonwebtoken";
import mysql from "mysql2/promise";
const base = process.argv[2], usuarios = Number(process.argv[3] || 50), segundos = Number(process.argv[4] || 15);
const c = await mysql.createConnection({ host: process.env.DB_HOST, port: process.env.DB_PORT, user: process.env.DB_USER, password: process.env.DB_PASSWORD, database: process.env.DB_NAME });
const [[adm]] = await c.query("SELECT id_empleado, id_rol, token_version FROM empleado WHERE id_rol = 1 AND estatus='Activo' AND eliminado=0 LIMIT 1");
const [[usu]] = await c.query("SELECT id_empleado, id_rol, token_version FROM empleado WHERE id_rol <> 1 AND estatus='Activo' AND eliminado=0 LIMIT 1");
await c.end();
const tok = (e) => jwt.sign({ id_empleado: e.id_empleado, id_rol: e.id_rol, ver: e.token_version }, process.env.JWT_SECRET, { expiresIn: "10m" });
const tA = tok(adm), tU = tok(usu);
// Mezcla parecida al uso real: catálogo, inventario, tablero, tickets y solicitudes.
const rutas = [
  ["/api/solicitudes/insumos", tU], ["/api/solicitudes/insumos/stock-bajo", tA], ["/api/categorias?tipo=insumo", tU],
  [`/api/tickets/empleado/${usu.id_empleado}`, tU], [`/api/solicitudes/empleado/${usu.id_empleado}`, tU],
  ["/api/solicitudes/inventario", tA], ["/api/tickets/metricas", tA], ["/api/tickets?page=1&limit=25", tA],
  ["/api/solicitudes/movimientos?tipo=Salida&page=1&limit=25", tA], ["/api/tickets/indicadores?mes=2026-11", tA],
];
const lat = []; let ok = 0, err = 0; const codigos = {}; const fin = Date.now() + segundos * 1000;
async function usuario(i) {
  let k = i;
  while (Date.now() < fin) {
    const [ruta, t] = rutas[k++ % rutas.length];
    const t0 = performance.now();
    try {
      const r = await fetch(base + ruta, { headers: { Authorization: `Bearer ${t}`, "accept-encoding": "gzip" } });
      await r.arrayBuffer();
      lat.push(performance.now() - t0);
      r.ok ? ok++ : (err++, codigos[r.status + " " + ruta] = (codigos[r.status + " " + ruta] || 0) + 1);
    } catch (e) { err++; codigos[e.cause?.code || e.message] = (codigos[e.cause?.code || e.message] || 0) + 1; }
  }
}
await Promise.all(Array.from({ length: usuarios }, (_, i) => usuario(i)));
lat.sort((a, b) => a - b);
const p = (q) => Math.round(lat[Math.floor(lat.length * q)] || 0);
console.log(JSON.stringify({ usuarios_simultaneos: usuarios, peticiones_por_seg: Math.round((ok + err) / segundos), ok, errores: err, ms_mediana: p(0.5), ms_p95: p(0.95), ms_max: Math.round(lat.at(-1) || 0) }));
if (err) console.log("detalle errores:", JSON.stringify(codigos));
