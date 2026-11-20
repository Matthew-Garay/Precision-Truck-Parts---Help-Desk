/* global document -- el código dentro de page.evaluate() corre en el navegador */
/**
 * prueba-navegador.js — Recorre las pantallas del sistema en un navegador real
 * (Edge o Chrome instalado en la PC) y reporta errores. SOLO LECTURA: navega,
 * abre ventanas y pestañas, pero no guarda nada.
 *
 * Entra como un administrador y como un usuario activos (sesión firmada con el
 * JWT_SECRET del .env, 10 min), visita cada pantalla y revisa:
 *   - errores de JavaScript en la página y errores en la consola;
 *   - que no aparezca la pantalla de "Algo salió mal" (ErrorBoundary);
 *   - textos clave de las funciones nuevas (reporte para dirección, "Cada
 *     cuánto", piezas con número de serie, áreas, cierre por inactividad…).
 * Guarda una captura de cada pantalla en la carpeta indicada.
 *
 * Uso:
 *   node --import ./server/load-env.js server/scripts/prueba-navegador.js http://127.0.0.1:5173 [carpeta-capturas]
 */
import fs from "fs";
import path from "path";
import os from "os";
import jwt from "jsonwebtoken";
import mysql from "mysql2/promise";
import puppeteer from "puppeteer-core";

const BASE = (process.argv[2] || "http://127.0.0.1:5173").replace(/\/+$/, "");
const CAPTURAS = process.argv[3] || path.join(os.tmpdir(), "helpdesk-capturas");
fs.mkdirSync(CAPTURAS, { recursive: true });
const NAVEGADORES = [
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
];
const ejecutable = NAVEGADORES.find(p => fs.existsSync(p));
if (!ejecutable) { console.error("No se encontró Edge ni Chrome."); process.exit(1); }

// ── Sesiones de prueba ───────────────────────────────────────────────────────
const c = await mysql.createConnection({ host: process.env.DB_HOST, port: process.env.DB_PORT, user: process.env.DB_USER, password: process.env.DB_PASSWORD, database: process.env.DB_NAME });
const SQL_EMP = `SELECT e.id_empleado, e.num_empleado, e.nombre, e.ap_paterno, e.ap_materno, e.email, e.id_rol, e.token_version,
                        d.nombre_departamento AS departamento, e.id_departamento, e.id_sucursal, s.nombre_sucursal
                   FROM empleado e LEFT JOIN departamento d ON d.id_departamento = e.id_departamento
                   LEFT JOIN sucursal s ON s.id_sucursal = e.id_sucursal
                  WHERE e.estatus = 'Activo' AND e.eliminado = 0 AND e.id_rol %s 1 ORDER BY e.id_empleado LIMIT 1`;
const [[admin]] = await c.query(SQL_EMP.replace("%s", "="));
const [[usuario]] = await c.query(SQL_EMP.replace("%s", "<>"));
await c.end();
const sesion = (e, rol) => ({
  token: jwt.sign({ id_empleado: e.id_empleado, id_rol: e.id_rol, ver: e.token_version }, process.env.JWT_SECRET, { expiresIn: "10m" }),
  usuario: { id_empleado: e.id_empleado, num_empleado: e.num_empleado, nombre: e.nombre, ap_paterno: e.ap_paterno, ap_materno: e.ap_materno,
             email: e.email, id_rol: e.id_rol, rol, departamento: e.departamento, id_departamento: e.id_departamento,
             id_sucursal: e.id_sucursal, sucursal: e.nombre_sucursal, nombre_sucursal: e.nombre_sucursal },
});

const resultados = [];
const navegador = await puppeteer.launch({ executablePath: ejecutable, headless: true, args: ["--no-first-run", "--window-size=1366,850"], defaultViewport: { width: 1366, height: 850 } });

/** Abre una pestaña con la sesión puesta y junta los errores. */
async function pestana(s) {
  const page = await navegador.newPage();
  const errores = [];
  page.on("pageerror", e => errores.push(`JS: ${e.message.split("\n")[0]}`));
  page.on("console", m => { if (m.type() === "error") errores.push(`consola: ${m.text().slice(0, 160)}`); });
  page.on("response", r => { if ((r.status() >= 500 || r.status() === 429) && r.url().includes("/api/")) errores.push(`HTTP ${r.status()} ${new URL(r.url()).pathname}`); });
  await page.goto(`${BASE}/login`, { waitUntil: "domcontentloaded" });
  if (s) await page.evaluate((x) => {
    localStorage.setItem("_tk", x.token);
    localStorage.setItem("usuario", JSON.stringify(x.usuario));
    localStorage.setItem("_ultima_actividad", String(Date.now()));
  }, s);
  return { page, errores };
}
const esperar = (ms) => new Promise(r => setTimeout(r, ms));
const texto = (page) => page.evaluate(() => document.body.innerText);

async function revisar(nombre, s, ruta, comprobar) {
  const { page, errores } = await pestana(s);
  let ok = true, nota = "";
  try {
    await page.goto(BASE + ruta, { waitUntil: "networkidle2", timeout: 30000 });
    await esperar(800);
    const t = await texto(page);
    if (/Algo salió mal|Ocurrió un error inesperado/i.test(t)) { ok = false; nota = "pantalla de error"; }
    if (comprobar) {
      const r = await comprobar(page, t);
      if (r !== true) { ok = false; nota = r || "comprobación falló"; }
    }
  } catch (e) { ok = false; nota = e.message.split("\n")[0]; }
  const archivo = path.join(CAPTURAS, nombre.replace(/[^\w-]+/g, "_") + ".png");
  try { await page.screenshot({ path: archivo }); } catch { /* sin captura */ }
  // Errores "de ruido" del navegador sin efecto para el usuario.
  const reales = errores.filter(e => !/favicon|DevTools|Download the React DevTools/i.test(e));
  if (reales.length) ok = false;
  resultados.push({ nombre, ok, nota, errores: reales });
  await page.close();
}

const ADMIN = sesion(admin, "admin"), USU = sesion(usuario, "usuario");
// Sin distinguir mayúsculas: varios títulos se muestran en MAYÚSCULAS por estilo (CSS).
const incluye = (t, f) => t.toLowerCase().includes(f.toLowerCase());
const contiene = (...frases) => (_p, t) => frases.every(f => incluye(t, f)) || `no aparece: ${frases.find(f => !incluye(t, f))}`;
/** Clic en el primer botón/enlace cuyo texto incluya `frase`. */
const clic = async (page, frase) => {
  const ok = await page.evaluate((f) => {
    const el = [...document.querySelectorAll("button, a, [role=button]")].find(b => (b.innerText || "").includes(f));
    if (el) { el.click(); return true; }
    return false;
  }, frase);
  await esperar(1200);
  return ok;
};

await revisar("Login", null, "/login", contiene("Iniciar"));
for (const [n, r] of [["Admin - Dashboard", "/admin/dashboard"], ["Admin - Historial de incidencias", "/admin/historial"],
  ["Admin - Historial de insumos", "/admin/insumos"], ["Admin - Inventario", "/admin/inventario"], ["Admin - Rendimiento", "/admin/rendimiento"],
  ["Admin - Personal", "/admin/personal"], ["Admin - Manuales", "/admin/manuales"], ["Admin - Configuracion", "/admin/configuracion"]])
  await revisar(n, ADMIN, r);
await revisar("Admin - Boton reporte para direccion", ADMIN, "/admin/dashboard", contiene("Reporte mensual para dirección"));
await revisar("Reporte para direccion", ADMIN, "/print/indicadores?mes=2026-11", contiene("Indicadores mensuales", "Cifras de los últimos 12 meses"));
await revisar("Reporte de consumo - Cada cuanto", ADMIN, "/admin/insumos", async (page) => {
  if (!await clic(page, "Consumo") && !await clic(page, "consumo")) return "no se encontró el botón del reporte de consumo";
  if (!await clic(page, "Cada cuánto")) return "no se encontró la pestaña Cada cuánto";
  await esperar(1500);
  const t = await texto(page);
  return /Frecuencia|Todavía no hay insumos con 2 o más entregas/.test(t) || "la pestaña no muestra frecuencias";
});
await revisar("Inventario - piezas con serie en el detalle", ADMIN, "/admin/inventario", async (page) => {
  const abierto = await page.evaluate(() => {
    const el = document.querySelector('[title^="Ver detalle de"]');
    if (el) { el.click(); return true; }
    return false;
  });
  if (!abierto) return "no se pudo abrir el detalle de un insumo";
  await esperar(1500);
  const t = await texto(page);
  return incluye(t, "Piezas con número de serie") || "el detalle no muestra la sección de piezas";
});
await revisar("Personal - Areas", ADMIN, "/admin/personal", async (page) => {
  if (!await clic(page, "Áreas")) return "no se encontró el botón Áreas";
  await esperar(1500);
  const t = await texto(page);
  return (incluye(t, "Áreas de los puestos") && incluye(t, "Sin área")) || "la ventana de áreas no cargó";
});

// Pantallas que necesitan un ticket y una solicitud (los pone prueba-navegador-demo.js).
/** Clic en el elemento más interno que contenga `frase` (las tarjetas del tablero son <div> con onClick). */
const clicTexto = async (page, frase) => {
  const ok = await page.evaluate((f) => {
    const el = [...document.querySelectorAll("body *")].find(x => x.children.length === 0 && (x.textContent || "").includes(f));
    if (el) { el.click(); return true; }
    return false;
  }, frase);
  await esperar(1500);
  return ok;
};
if (process.env.PRUEBA_TICKET) {
  await revisar("Vista de ticket (panel lateral)", ADMIN, "/admin/dashboard", async (page) => {
    if (!await clicTexto(page, process.env.PRUEBA_TICKET)) return `no aparece el ticket ${process.env.PRUEBA_TICKET} en el tablero`;
    const t = await texto(page);
    return (incluye(t, "Progreso") && incluye(t, "Exportar reporte") && incluye(t, "Acciones del administrador")) || "la vista del ticket no muestra su panel";
  });
  await revisar("Vista de ticket (usuario)", USU, "/usuario/dashboard", async (page) => {
    if (!await clicTexto(page, process.env.PRUEBA_TICKET)) return "el usuario no ve su ticket en el tablero";
    const t = await texto(page);
    return (incluye(t, "Progreso") && incluye(t, "¿Qué significa esto?")) || "la vista del ticket del usuario no carga";
  });
}
if (process.env.PRUEBA_SOLICITUD) {
  await revisar("Vista de solicitud (panel lateral)", ADMIN, "/admin/dashboard", async (page) => {
    if (!await clicTexto(page, process.env.PRUEBA_SOLICITUD)) return `no aparece la solicitud ${process.env.PRUEBA_SOLICITUD} en el tablero`;
    const t = await texto(page);
    return (incluye(t, "Estado de la solicitud") && incluye(t, "Cambiar estatus")) || "la vista de la solicitud no muestra su panel";
  });
  await revisar("Solicitud de insumos - historial y métricas", USU, "/usuario/solicitar", async (page) => {
    const t0 = await texto(page);
    if (!incluye(t0, "Agrega insumos desde la tabla") && !incluye(t0, "Solicitud")) return "no aparece el panel de la solicitud nueva";
    if (!await clic(page, "Mis Solicitudes")) return "no se encontró la pestaña Mis Solicitudes";
    await esperar(1200);
    const t = await texto(page);
    return (incluye(t, "Por Prioridad") && incluye(t, "Insumos Frecuentes")) || "no aparecen las métricas de solicitudes";
  });
}
for (const [n, r] of [["Usuario - Dashboard", "/usuario/dashboard"], ["Usuario - Nuevo reporte", "/usuario/nuevo"],
  ["Usuario - Historial", "/usuario/historial"], ["Usuario - Solicitar insumos", "/usuario/solicitar"],
  ["Usuario - Manuales", "/usuario/manuales"], ["Usuario - Configuracion", "/usuario/configuracion"]])
  await revisar(n, USU, r);
await revisar("Usuario - inactividad 30 min", USU, "/usuario/dashboard", async (page) => {
  await page.evaluate(() => localStorage.setItem("_ultima_actividad", String(Date.now() - 31 * 60 * 1000)));
  await page.reload({ waitUntil: "networkidle2" });
  await esperar(1000);
  return page.url().includes("/login") || `sigue en ${new URL(page.url()).pathname}`;
});

await navegador.close();
const fallas = resultados.filter(r => !r.ok);
for (const r of resultados) {
  console.log(`${r.ok ? "✔" : "✖"} ${r.nombre}${r.nota ? " — " + r.nota : ""}`);
  for (const e of r.errores.slice(0, 4)) console.log(`     · ${e}`);
}
console.log(`\n${resultados.length - fallas.length} de ${resultados.length} pantallas bien · capturas en ${CAPTURAS}`);
process.exitCode = fallas.length ? 1 : 0;
