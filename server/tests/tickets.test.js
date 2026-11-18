/**
 * tickets.test.js — Flujo completo de la mesa de ayuda contra la base de prueba.
 *
 * Cubre: crear ticket (folio ST-AAAAMM-NNNN), permisos de dueño/admin,
 * asignar técnico, resolver, no reabrir, historial de cambios, calificar,
 * cancelar, edición del usuario y cierre automático de tickets vencidos.
 */
import { test, describe, before, after } from "node:test";
import assert from "node:assert/strict";
import { prepararBD, cerrarBD, respuesta, reqAdmin } from "./_bd-prueba.js";

let ctrl, pool, Ticket, schemas;

/** Petición como el usuario normal 3 (rol 2). */
const reqUsuario = (extra = {}, id = 3) => ({
  usuario: { id_empleado: id, id_rol: 2 }, params: {}, query: {}, body: {}, headers: {}, files: [], ...extra,
});
const llamar = async (fn, req) => { const res = respuesta(); await fn(req, res); return res; };
const ticket = async (id) => (await pool.query("SELECT * FROM ticket WHERE id_ticket = ?", [id]))[0][0];

const hoy = new Date();
const MES = `${hoy.getFullYear()}${String(hoy.getMonth() + 1).padStart(2, "0")}`;

describe("tickets (mesa de ayuda)", () => {
  before(async () => {
    await prepararBD();
    ctrl    = await import("../controllers/tickets-controller.js");
    pool    = (await import("../config/db.js")).default;
    Ticket  = (await import("../services/ticket.js")).default;
    schemas = await import("../middlewares/validate.js");
  });
  after(cerrarBD);

  let t1, t2;
  const nuevo = (titulo) => llamar(ctrl.crearTicket, reqUsuario({
    body: { titulo, descripcion: "La impresora no enciende", prioridad: "Alta", id_categoria: "1" },
  }));

  // ── Crear ────────────────────────────────────────────────────────────────
  test("crear ticket: 201, folio ST-AAAAMM-0001 y estatus En proceso", async () => {
    const res = await nuevo("Impresora");
    assert.equal(res.statusCode, 201, JSON.stringify(res.body));
    assert.equal(res.body.folio_ticket, `ST-${MES}-0001`);
    t1 = res.body.id_ticket;
    const t = await ticket(t1);
    assert.equal(t.estatus, "En proceso");
    assert.equal(t.id_empleado, 3);
    assert.equal(t.id_tecnico, null);
  });

  test("el segundo ticket del mes lleva el consecutivo 0002", async () => {
    const res = await nuevo("Monitor");
    assert.equal(res.statusCode, 201);
    assert.equal(res.body.folio_ticket, `ST-${MES}-0002`);
    t2 = res.body.id_ticket;
  });

  test("crear ticket sin campos requeridos responde 400", async () => {
    const res = await llamar(ctrl.crearTicket, reqUsuario({ body: { titulo: "x" } }));
    assert.equal(res.statusCode, 400);
  });

  test("validación: prioridad fuera de la lista se rechaza", () => {
    const r = schemas.schemaCrearTicket.safeParse({ titulo: "a", descripcion: "b", prioridad: "Altísima", id_categoria: 1 });
    assert.equal(r.success, false);
  });

  // ── Permisos ─────────────────────────────────────────────────────────────
  test("el dueño ve su ticket; otro usuario recibe 403; el admin sí lo ve", async () => {
    assert.equal((await llamar(ctrl.getTicketById, reqUsuario({ params: { id_ticket: String(t1) } }))).statusCode, 200);
    assert.equal((await llamar(ctrl.getTicketById, reqUsuario({ params: { id_ticket: String(t1) } }, 2))).statusCode, 403);
    assert.equal((await llamar(ctrl.getTicketById, reqAdmin({ params: { id_ticket: String(t1) } }))).statusCode, 200);
  });

  test("un usuario no puede listar los tickets de otro", async () => {
    const res = await llamar(ctrl.getTicketsByEmpleado, reqUsuario({ params: { id_empleado: "3" } }, 2));
    assert.equal(res.statusCode, 403);
    const propio = await llamar(ctrl.getTicketsByEmpleado, reqUsuario({ params: { id_empleado: "3" } }));
    assert.equal(propio.statusCode, 200);
    assert.equal(propio.body.total, 2);
  });

  // ── Asignar y resolver ───────────────────────────────────────────────────
  test("asignar técnico: queda id_tecnico sin cambiar el estatus", async () => {
    const res = await llamar(ctrl.actualizarTicket, reqAdmin({
      params: { id_ticket: String(t1) }, body: { estatus: "En proceso", id_resuelto_por: 2 },
    }));
    assert.equal(res.statusCode, 200, JSON.stringify(res.body));
    const t = await ticket(t1);
    assert.equal(t.id_tecnico, 2);
    assert.equal(t.estatus, "En proceso");
  });

  test("no se puede calificar un ticket que no está resuelto", async () => {
    const res = await llamar(ctrl.calificarTicket, reqUsuario({ params: { id_ticket: String(t1) }, body: { calificacion: 5 } }));
    assert.equal(res.statusCode, 400);
  });

  test("resolver: estatus Resuelto, fecha_resuelto y comentarios guardados", async () => {
    const res = await llamar(ctrl.actualizarTicket, reqAdmin({
      params: { id_ticket: String(t1) }, body: { estatus: "Resuelto", comentarios: "Se cambió el cable", id_resuelto_por: 1 },
    }));
    assert.equal(res.statusCode, 200, JSON.stringify(res.body));
    const t = await ticket(t1);
    assert.equal(t.estatus, "Resuelto");
    assert.ok(t.fecha_resuelto, "debe tener fecha de resolución");
    assert.equal(t.comentarios, "Se cambió el cable");
    assert.equal(t.id_tecnico, 1);
  });

  test("el cambio de estatus queda en el historial con quién lo hizo", async () => {
    const res = await llamar(ctrl.getHistorialTicket, reqAdmin({ params: { id_ticket: String(t1) } }));
    const cambio = res.body.find(h => h.campo_cambiado === "estatus");
    assert.ok(cambio, JSON.stringify(res.body));
    assert.equal(cambio.valor_anterior, "En proceso");
    assert.equal(cambio.valor_nuevo, "Resuelto");
  });

  test("un ticket cerrado no se puede reabrir (409)", async () => {
    const res = await llamar(ctrl.actualizarTicket, reqAdmin({ params: { id_ticket: String(t1) }, body: { estatus: "En proceso" } }));
    assert.equal(res.statusCode, 409);
    assert.equal((await ticket(t1)).estatus, "Resuelto");
  });

  test("el usuario no puede editar un ticket ya cerrado", async () => {
    const res = await llamar(ctrl.editarTicketUsuario, reqUsuario({
      params: { id_ticket: String(t1) },
      body: { titulo: "Nuevo", descripcion: "x", prioridad: "Baja", id_categoria: 1 },
    }));
    assert.equal(res.statusCode, 404);
    assert.equal((await ticket(t1)).titulo, "Impresora");
  });

  // ── Calificar ────────────────────────────────────────────────────────────
  test("solo el dueño puede calificar", async () => {
    const res = await llamar(ctrl.calificarTicket, reqUsuario({ params: { id_ticket: String(t1) }, body: { calificacion: 5 } }, 2));
    assert.equal(res.statusCode, 403);
  });

  test("calificación fuera de 1–5 responde 400", async () => {
    const res = await llamar(ctrl.calificarTicket, reqUsuario({ params: { id_ticket: String(t1) }, body: { calificacion: 6 } }));
    assert.equal(res.statusCode, 400);
  });

  test("el dueño califica una vez; la segunda responde 409", async () => {
    const ok = await llamar(ctrl.calificarTicket, reqUsuario({ params: { id_ticket: String(t1) }, body: { calificacion: 4 } }));
    assert.equal(ok.statusCode, 200, JSON.stringify(ok.body));
    assert.equal((await ticket(t1)).calificacion, 4);
    const otra = await llamar(ctrl.calificarTicket, reqUsuario({ params: { id_ticket: String(t1) }, body: { calificacion: 1 } }));
    assert.equal(otra.statusCode, 409);
    assert.equal((await ticket(t1)).calificacion, 4);
  });

  // ── Editar y cancelar ────────────────────────────────────────────────────
  test("el dueño puede editar su ticket abierto; otro usuario no", async () => {
    const body = { titulo: "Monitor parpadea", descripcion: "Parpadea al encender", prioridad: "Media", id_categoria: 1 };
    const ajeno = await llamar(ctrl.editarTicketUsuario, reqUsuario({ params: { id_ticket: String(t2) }, body }, 2));
    assert.equal(ajeno.statusCode, 403);
    const res = await llamar(ctrl.editarTicketUsuario, reqUsuario({ params: { id_ticket: String(t2) }, body }));
    assert.equal(res.statusCode, 200, JSON.stringify(res.body));
    const t = await ticket(t2);
    assert.equal(t.titulo, "Monitor parpadea");
    assert.equal(t.prioridad, "Media");
  });

  test("cancelar: otro usuario 403, el dueño sí, y no se cancela dos veces", async () => {
    const ajeno = await llamar(ctrl.cancelarTicket, reqUsuario({ params: { id_ticket: String(t2) } }, 2));
    assert.equal(ajeno.statusCode, 403);
    const res = await llamar(ctrl.cancelarTicket, reqUsuario({ params: { id_ticket: String(t2) } }));
    assert.equal(res.statusCode, 200);
    assert.equal((await ticket(t2)).estatus, "Cancelado");
    const otra = await llamar(ctrl.cancelarTicket, reqUsuario({ params: { id_ticket: String(t2) } }));
    assert.equal(otra.statusCode, 409);
  });

  // ── Cierre automático ────────────────────────────────────────────────────
  test("cierre automático: solo tickets sin técnico con más de 2 días", async () => {
    const viejo     = (await nuevo("Viejo sin técnico")).body.id_ticket;
    const asignado  = (await nuevo("Viejo con técnico")).body.id_ticket;
    const reciente  = (await nuevo("Reciente")).body.id_ticket;
    await pool.query("UPDATE ticket SET fecha_subido = DATE_SUB(NOW(), INTERVAL 3 DAY) WHERE id_ticket IN (?, ?)", [viejo, asignado]);
    await pool.query("UPDATE ticket SET id_tecnico = 1 WHERE id_ticket = ?", [asignado]);

    const cerrados = await Ticket.cerrarVencidos();
    assert.deepEqual(cerrados.map(t => t.id_ticket), [viejo]);
    assert.equal((await ticket(viejo)).estatus, "No Resuelto");
    assert.equal((await ticket(asignado)).estatus, "En proceso");
    assert.equal((await ticket(reciente)).estatus, "En proceso");
  });
});
