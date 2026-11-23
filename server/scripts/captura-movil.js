/* global document, window, getComputedStyle -- el código dentro de page.evaluate() corre en el navegador */
/**
 * captura-movil.js — Revisa el sistema en TAMAÑO DE TELÉFONO (390×844, táctil)
 * y deja capturas de cada pantalla, del menú, de la campana y de un aviso
 * emergente. Reporta lo que se sale de la pantalla a lo ancho (lo que obliga a
 * desplazarse de lado o queda cortado).
 *
 * Se corre con datos de ejemplo:  PRUEBA_SCRIPT=server/scripts/captura-movil.js npm run test:navegador -- <carpeta>
 */
import fs from "fs";
import path from "path";
import os from "os";
import jwt from "jsonwebtoken";
import mysql from "mysql2/promise";
import puppeteer from "puppeteer-core";

const BASE = (process.argv[2] || "http://127.0.0.1:5192").replace(/\/+$/, "");
const CAPTURAS = process.argv[3] || path.join(os.tmpdir(), "helpdesk-movil");
fs.mkdirSync(CAPTURAS, { recursive: true });
const ejecutable = ["C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe", "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"].find(p => fs.existsSync(p));
const MOVIL = { width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true };

const c = await mysql.createConnection({ host: process.env.DB_HOST, port: process.env.DB_PORT, user: process.env.DB_USER, password: process.env.DB_PASSWORD, database: process.env.DB_NAME });
const SQL = `SELECT e.id_empleado, e.nombre, e.ap_paterno, e.email, e.id_rol, e.token_version, d.nombre_departamento AS departamento,
                    e.id_departamento, e.id_sucursal, s.nombre_sucursal FROM empleado e
               LEFT JOIN departamento d ON d.id_departamento = e.id_departamento LEFT JOIN sucursal s ON s.id_sucursal = e.id_sucursal
              WHERE e.estatus = 'Activo' AND e.eliminado = 0 AND e.id_rol %s 1 ORDER BY e.id_empleado LIMIT 1`;
const [[admin]] = await c.query(SQL.replace("%s", "="));
const [[usuario]] = await c.query(SQL.replace("%s", "<>"));
await c.end();
const sesion = (e, rol) => ({
  token: jwt.sign({ id_empleado: e.id_empleado, id_rol: e.id_rol, ver: e.token_version }, process.env.JWT_SECRET, { expiresIn: "10m" }),
  usuario: { ...e, rol, sucursal: e.nombre_sucursal, token_version: undefined },
});
const ADMIN = sesion(admin, "admin"), USU = sesion(usuario, "usuario");
const NOTIFS = (id) => [
  { id: "a1", tipo: "ticket:nuevo", ts: Date.now() - 60000, data: { id_ticket: 1, folio_ticket: "ST-202611-0001", titulo: "La impresora de caja no imprime y marca error de papel", prioridad: "Alta", nombre_empleado: "Usuario Tres", departamento: "Almacén", _esAdmin: true } },
  { id: "a2", tipo: "solicitud:nueva", ts: Date.now() - 3600000, data: { id_solicitud: 1, folio_solicitud: "SOL-202611-0001", nombre_empleado: "Usuario Tres", prioridad: "Media", total_insumos: 2 } },
  { id: "a3", tipo: "insumo:stock_critico", ts: Date.now() - 7200000, data: { id_insumo: 1, nombre: "Tóner prueba 85A compatible con HP LaserJet", stock: 0, nivel: "agotado" } },
  { id: "a4", tipo: "ticket:actualizado", ts: Date.now() - 86400000, data: { id_ticket: 1, folio_ticket: "ST-202611-0001", titulo: "La impresora de caja no imprime", estatus: "Resuelto" } },
].map(n => ({ ...n, _para: id }));

const navegador = await puppeteer.launch({ executablePath: ejecutable, headless: true, args: ["--no-first-run"] });
const esperar = (ms) => new Promise(r => setTimeout(r, ms));
const reporte = [];

async function abrir(s, ruta) {
  const page = await navegador.newPage();
  await page.emulate({ viewport: MOVIL, userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1" });
  await page.goto(`${BASE}/login`, { waitUntil: "domcontentloaded" });
  if (s) await page.evaluate((x, notifs) => {
    localStorage.setItem("_tk", x.token);
    localStorage.setItem("usuario", JSON.stringify(x.usuario));
    localStorage.setItem("_ultima_actividad", String(Date.now()));
    localStorage.setItem(`ptp_notif_${x.usuario.id_empleado}`, JSON.stringify(notifs));
  }, s, NOTIFS(s.usuario.id_empleado));
  await page.goto(BASE + ruta, { waitUntil: "networkidle2", timeout: 30000 });
  await esperar(900);
  return page;
}
/** Elementos visibles que se salen de la pantalla a lo ancho. */
const desbordes = (page) => page.evaluate(() => {
  const ancho = window.innerWidth, fuera = [];
  for (const el of document.querySelectorAll("body *")) {
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) continue;
    const st = getComputedStyle(el);
    if (st.visibility === "hidden" || st.display === "none") continue;
    // Contenido dentro de un contenedor con scroll horizontal propio (tablas) es intencional;
    // pero si el contenedor lo OCULTA (overflow hidden/clip), queda cortado y se reporta.
    let p = el.parentElement, conScroll = false, cortado = false;
    while (p && p !== document.body) {
      const o = getComputedStyle(p).overflowX;
      if (o === "auto" || o === "scroll") { conScroll = true; break; }
      if (o === "hidden" || o === "clip") { const rp = p.getBoundingClientRect(); if (r.right > rp.right + 2 && r.left < rp.right && el.children.length === 0 && (el.innerText || "").trim()) cortado = true; break; }
      p = p.parentElement;
    }
    if (cortado || (!conScroll && (r.right > ancho + 2 || r.left < -2))) {
      const txt = (el.innerText || el.getAttribute("aria-label") || el.tagName).trim().replace(/\s+/g, " ").slice(0, 50);
      fuera.push(`${el.tagName.toLowerCase()} [${Math.round(r.left)}→${Math.round(r.right)}px] ${txt}`);
    }
  }
  return { paginaMasAncha: document.documentElement.scrollWidth > ancho + 2, scrollWidth: document.documentElement.scrollWidth, fuera: fuera.slice(0, 8) };
});
async function capturar(nombre, page, completa = true) {
  const base = path.join(CAPTURAS, nombre.replace(/[^\w-]+/g, "_"));
  await page.screenshot({ path: base + ".png" });
  const d = await desbordes(page);
  if (completa) {
    // La app se desplaza dentro de su propio contenedor (no la ventana): se
    // recorre por tramos para ver lo que queda abajo.
    for (let i = 1; i <= 5; i++) {
      const avanzo = await page.evaluate(() => {
        const cands = [...document.querySelectorAll("main, div")].filter(el => {
          const o = getComputedStyle(el).overflowY; return (o === "auto" || o === "scroll") && el.scrollHeight > el.clientHeight + 20 && el.clientHeight > 300;
        }).sort((a, b) => b.clientHeight - a.clientHeight);
        const el = cands[0]; if (!el) return false;
        const antes = el.scrollTop; el.scrollTop += el.clientHeight - 80; return el.scrollTop > antes;
      });
      if (!avanzo) break;
      await esperar(250);
      await page.screenshot({ path: `${base}-${i + 1}.png` });
      const d2 = await desbordes(page);
      d.fuera.push(...d2.fuera.filter(f => !d.fuera.includes(f)));
    }
  }
  reporte.push({ nombre, ...d });
}

const PANTALLAS = [
  [ADMIN, "admin-dashboard", "/admin/dashboard"], [ADMIN, "admin-historial", "/admin/historial"], [ADMIN, "admin-insumos", "/admin/insumos"],
  [ADMIN, "admin-inventario", "/admin/inventario"], [ADMIN, "admin-rendimiento", "/admin/rendimiento"], [ADMIN, "admin-personal", "/admin/personal"],
  [ADMIN, "admin-manuales", "/admin/manuales"], [ADMIN, "admin-configuracion", "/admin/configuracion"],
  [USU, "usuario-dashboard", "/usuario/dashboard"], [USU, "usuario-nuevo", "/usuario/nuevo"], [USU, "usuario-historial", "/usuario/historial"],
  [USU, "usuario-solicitar", "/usuario/solicitar"], [USU, "usuario-manuales", "/usuario/manuales"], [USU, "usuario-configuracion", "/usuario/configuracion"],
  [null, "login", "/login"],
];
for (const [s, n, r] of PANTALLAS) { const p = await abrir(s, r); await capturar(n, p); await p.close(); }

// Menú lateral abierto
{ const p = await abrir(ADMIN, "/admin/dashboard");
  await p.evaluate(() => { const b = [...document.querySelectorAll("button")].find(x => x.querySelector("svg.lucide-menu")); b?.click(); });
  await esperar(700); await capturar("admin-menu-abierto", p, false); await p.close(); }
// Campana de notificaciones abierta
for (const [s, n, r] of [[ADMIN, "admin-campana", "/admin/dashboard"], [USU, "usuario-campana", "/usuario/dashboard"]]) {
  const p = await abrir(s, r);
  await p.evaluate(() => { const b = [...document.querySelectorAll("button")].find(x => x.querySelector("svg.lucide-bell, .lucide-bell") || /notific/i.test(x.title || x.getAttribute("aria-label") || "")); b?.click(); });
  await esperar(800); await capturar(n, p, false); await p.close();
}
// Aviso emergente: el usuario levanta un ticket mientras el admin tiene el tablero abierto
{ const pa = await abrir(ADMIN, "/admin/dashboard");
  const pu = await abrir(USU, "/usuario/dashboard");
  await pu.evaluate(async (tk) => {
    const fd = new FormData();
    fd.append("titulo", "El monitor de recepción parpadea y se apaga solo"); fd.append("descripcion", "Desde ayer el monitor parpadea.");
    fd.append("prioridad", "Urgente"); fd.append("id_categoria", "1");
    await fetch("/api/tickets", { method: "POST", body: fd, headers: { Authorization: `Bearer ${tk}`, "X-Requested-With": "XMLHttpRequest" } });
  }, USU.token);
  await esperar(1800); await capturar("admin-aviso-emergente", pa, false);
  await esperar(300); await capturar("usuario-aviso-emergente", pu, false);
  await pa.close(); await pu.close(); }
// Vista de ticket y de solicitud
if (process.env.PRUEBA_TICKET) {
  const p = await abrir(USU, "/usuario/dashboard");
  await p.evaluate((f) => { [...document.querySelectorAll("body *")].find(x => x.children.length === 0 && (x.textContent || "").includes(f))?.click(); }, process.env.PRUEBA_TICKET);
  await esperar(1500); await capturar("usuario-vista-ticket", p); await p.close();
}
if (process.env.PRUEBA_SOLICITUD) {
  const p = await abrir(ADMIN, "/admin/dashboard");
  await p.evaluate((f) => { [...document.querySelectorAll("body *")].find(x => x.children.length === 0 && (x.textContent || "").includes(f))?.click(); }, process.env.PRUEBA_SOLICITUD);
  await esperar(1500); await capturar("admin-vista-solicitud", p); await p.close();
}

await navegador.close();
for (const r of reporte) {
  const mal = r.paginaMasAncha || r.fuera.length;
  console.log(`${mal ? "✖" : "✔"} ${r.nombre}${r.paginaMasAncha ? ` — la página mide ${r.scrollWidth}px (pantalla 390)` : ""}`);
  for (const f of r.fuera) console.log(`     · se sale: ${f}`);
}
console.log(`\nCapturas en ${CAPTURAS}`);
