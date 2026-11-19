/**
 * fase2.test.js — Cambios de la fase 2 de normalización (migración 006).
 *
 *   - Texto vacío del insumo = NULL (no 'N/A') y la edición parcial no borra datos.
 *   - Categorías: ámbitos en categoria_ambito; la API conserva en_tickets/en_insumos/en_manuales.
 *   - solicitud_insumo.aprobado es calculado desde cantidad_aprobada.
 *   - Evidencias de tickets registradas en ticket_evidencia; numeración sin pisar archivos.
 */
import { test, describe, before, after } from "node:test";
import assert from "node:assert/strict";
import fs from "fs";
import path from "path";
import { prepararBD, cerrarBD, respuesta, reqAdmin } from "./_bd-prueba.js";

let pool, schemas, insumos, Categoria, solicitudes, tickets, EVIDENCIAS_BASE;
const llamar = async (fn, req) => { const r = respuesta(); await fn(req, r); return r; };
const reqUsuario = (extra = {}, id = 3) => ({ usuario: { id_empleado: id, id_rol: 2 }, params: {}, query: {}, body: {}, headers: {}, files: [], ...extra });

/** Archivo "subido" de prueba en la carpeta temporal de multer. */
function subido(nombre = "foto.jpg") {
  const tmp = path.join(EVIDENCIAS_BASE, "_tmp_upload");
  fs.mkdirSync(tmp, { recursive: true });
  const ruta = path.join(tmp, `${Date.now()}-${Math.random().toString(16).slice(2)}-${nombre}`);
  fs.writeFileSync(ruta, "contenido de prueba");
  return { path: ruta, filename: path.basename(ruta), originalname: nombre, mimetype: "image/jpeg" };
}

describe("fase 2 de normalización", () => {
  before(async () => {
    await prepararBD();
    pool        = (await import("../config/db.js")).default;
    schemas     = await import("../middlewares/validate.js");
    insumos     = await import("../controllers/insumos-controller.js");
    Categoria   = (await import("../services/categoria.js")).default;
    solicitudes = await import("../controllers/solicitudes-controller.js");
    tickets     = await import("../controllers/tickets-controller.js");
    ({ EVIDENCIAS_BASE } = await import("../middlewares/upload-evidencias.js"));
  });
  after(async () => {
    try { fs.rmSync(EVIDENCIAS_BASE, { recursive: true, force: true }); } catch { /* nada */ }
    await cerrarBD();
  });

  // ── Insumos: NULL en vez de 'N/A' ─────────────────────────────────────────
  let idInsumo;
  const fila = async () => (await pool.query("SELECT num_serie, marca, modelo, descripcion, nombre FROM insumo WHERE id_insumo = ?", [idInsumo]))[0][0];

  test("crear insumo sin marca/modelo/serie guarda NULL, no 'N/A'", async () => {
    const body = schemas.schemaInsumo.parse({ nombre: "Cable HDMI", stock: 1, estado: "Bueno", id_categoria: 1, marca: "  " });
    const r = await llamar(insumos.crearInsumo, reqAdmin({ body }));
    assert.ok([200, 201].includes(r.statusCode), JSON.stringify(r.body));
    idInsumo = r.body.id_insumo ?? r.body.insumo?.id_insumo;
    assert.deepEqual(await fila(), { num_serie: null, marca: null, modelo: null, descripcion: null, nombre: "Cable HDMI" });
  });

  test("editar solo el nombre no toca marca ni modelo", async () => {
    await pool.query("UPDATE insumo SET marca = 'Steren', modelo = 'H-2' WHERE id_insumo = ?", [idInsumo]);
    const body = schemas.schemaActualizarInsumo.parse({ nombre: "Cable HDMI 2 m" });
    assert.equal("marca" in body && body.marca !== undefined, false, "la validación no debe inventar la marca");
    const r = await llamar(insumos.actualizarInsumo, reqAdmin({ params: { id: String(idInsumo) }, body }));
    assert.equal(r.statusCode, 200, JSON.stringify(r.body));
    const f = await fila();
    assert.equal(f.marca, "Steren");
    assert.equal(f.modelo, "H-2");
    assert.equal(f.nombre, "Cable HDMI 2 m");
  });

  test("vaciar la marca al editar la deja en NULL", async () => {
    const body = schemas.schemaActualizarInsumo.parse({ marca: "" });
    const r = await llamar(insumos.actualizarInsumo, reqAdmin({ params: { id: String(idInsumo) }, body }));
    assert.equal(r.statusCode, 200, JSON.stringify(r.body));
    assert.equal((await fila()).marca, null);
  });

  // ── Categorías ────────────────────────────────────────────────────────────
  test("categorías: los ámbitos salen de categoria_ambito y la API no cambia", async () => {
    const todas = await Categoria.getAll();
    const c1 = todas.find(c => c.id_categoria === 1);
    assert.equal(Number(c1.en_tickets), 1);
    assert.equal(Number(c1.en_insumos), 1);
    assert.equal(Number(c1.en_manuales), 0);
    assert.deepEqual((await Categoria.getByTipo("insumo")).map(c => c.id_categoria), [1]);
    assert.deepEqual(await Categoria.getByTipo("manual"), []);
    await assert.rejects(() => Categoria.getByTipo("otro"));
  });

  // ── aprobado calculado ────────────────────────────────────────────────────
  test("aprobado se calcula: NULL sin decidir, 1 aceptado, 0 negado", async () => {
    const crear = await llamar(solicitudes.crearSolicitud, reqUsuario({
      body: { prioridad: "Media", id_empleado: 3, observaciones_generales: "Para caja",
              insumos: [{ id_insumo: 1, cantidad: 2 }, { id_insumo: 2, cantidad: 1 }] },
    }));
    assert.equal(crear.statusCode, 201, JSON.stringify(crear.body));
    const id = crear.body.id_solicitud;
    const items = async () => (await pool.query(
      "SELECT id_solicitud_insumo, id_insumo, aprobado, cantidad_aprobada FROM solicitud_insumo WHERE id_solicitud = ? ORDER BY id_insumo", [id]))[0];
    let [a, b] = await items();
    assert.equal(a.aprobado, null);
    assert.equal(b.aprobado, null);

    const r = await llamar(solicitudes.actualizarEstatusSolicitud, reqAdmin({
      params: { id: String(id) },
      body: { estatus: "Aceptado", id_sucursal_origen: 1, id_sucursal_destino: 2,
              items: [{ id_solicitud_insumo: a.id_solicitud_insumo, aprobado: 1, cantidad: 2 },
                      { id_solicitud_insumo: b.id_solicitud_insumo, aprobado: 0, cantidad: 0 }] },
    }));
    assert.equal(r.statusCode, 200, JSON.stringify(r.body));
    [a, b] = await items();
    assert.deepEqual([a.aprobado, a.cantidad_aprobada], [1, 2]);
    assert.deepEqual([b.aprobado, b.cantidad_aprobada], [0, 0]);
    await assert.rejects(() => pool.query("UPDATE solicitud_insumo SET aprobado = 1 WHERE id_solicitud = ?", [id]),
      "aprobado ya no se puede escribir a mano");
  });

  // ── Evidencias ────────────────────────────────────────────────────────────
  let idTicket, folio;
  const enDisco = () => fs.readdirSync(path.join(EVIDENCIAS_BASE, folio)).sort();

  test("crear ticket con evidencias las registra en ticket_evidencia", async () => {
    const r = await llamar(tickets.crearTicket, reqUsuario({
      body: { titulo: "Monitor", descripcion: "No enciende", prioridad: "Alta", id_categoria: "1" },
      files: [subido(), subido(), subido()],
    }));
    assert.equal(r.statusCode, 201, JSON.stringify(r.body));
    ({ id_ticket: idTicket, folio_ticket: folio } = r.body);
    assert.equal(r.body.imagenes, 3);
    const lista = await llamar(tickets.getImagenesTicket, reqUsuario({ params: { id_ticket: String(idTicket) } }));
    assert.deepEqual(lista.body, ["01.jpg", "02.jpg", "03.jpg"]);
    assert.deepEqual(enDisco(), ["01.jpg", "02.jpg", "03.jpg"]);
    const [[ev]] = await pool.query("SELECT tipo_mime, tamano_bytes, id_subio FROM ticket_evidencia WHERE id_ticket = ? AND nombre_archivo = '01.jpg'", [idTicket]);
    assert.deepEqual([ev.tipo_mime, ev.id_subio], ["image/jpeg", 3]);
    assert.ok(ev.tamano_bytes > 0);
  });

  test("borrar la 02 y agregar otra: la nueva es 04 y no pisa la 03", async () => {
    const del = await llamar(tickets.eliminarImagenTicket, reqUsuario({ params: { id_ticket: String(idTicket), nombre: "02.jpg" } }));
    assert.equal(del.statusCode, 200, JSON.stringify(del.body));
    const tercera = fs.readFileSync(path.join(EVIDENCIAS_BASE, folio, "03.jpg"), "utf8");
    const add = await llamar(tickets.agregarImagenesTicket, reqUsuario({ params: { id_ticket: String(idTicket) }, files: [subido()] }));
    assert.equal(add.statusCode, 200, JSON.stringify(add.body));
    assert.deepEqual(enDisco(), ["01.jpg", "03.jpg", "04.jpg"]);
    assert.equal(fs.readFileSync(path.join(EVIDENCIAS_BASE, folio, "03.jpg"), "utf8"), tercera);
    const porFolio = await llamar(tickets.getTicketByFolio, reqUsuario({ params: { folio } }));
    assert.deepEqual(porFolio.body.imagenes, ["01.jpg", "03.jpg", "04.jpg"]);
  });

  test("no se pasa de 8 evidencias y lo rechazado no queda en disco", async () => {
    const extra = Array.from({ length: 6 }, () => subido());
    const r = await llamar(tickets.agregarImagenesTicket, reqUsuario({ params: { id_ticket: String(idTicket) }, files: extra }));
    assert.equal(r.statusCode, 400);
    assert.ok(extra.every(f => !fs.existsSync(f.path)));
    assert.equal((await pool.query("SELECT COUNT(*) n FROM ticket_evidencia WHERE id_ticket = ?", [idTicket]))[0][0].n, 3);
  });

  test("borrar una evidencia que no existe responde 404", async () => {
    const r = await llamar(tickets.eliminarImagenTicket, reqUsuario({ params: { id_ticket: String(idTicket), nombre: "99.jpg" } }));
    assert.equal(r.statusCode, 404);
  });
});
