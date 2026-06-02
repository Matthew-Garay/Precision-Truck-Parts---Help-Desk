import Ticket from "../Models/Ticket.js";
import { io } from "../server.js";
import path   from "path";
import fs     from "fs";
import { safeResolvePath } from "../Middlewares/security.js";
import { enviarNotificacionTicket } from "../Config/mailer.js";
import pool from "../Config/db.js";

const EVIDENCIAS_BASE = path.resolve("storage", "Evidencias_Tickets");

export const crearTicket = async (req, res) => {
  try {
    const titulo       = req.body?.titulo;
    const descripcion  = req.body?.descripcion;
    const prioridad    = req.body?.prioridad;
    const id_categoria = req.body?.id_categoria;
    // Tomar id_empleado del token JWT - nunca del body (evita crear tickets en nombre de otro)
    const id_empleado  = req.usuario?.id_empleado;

    if (!titulo || !descripcion || !prioridad || !id_empleado || !id_categoria)
      return res.status(400).json({ error: "Todos los campos son requeridos" });

    const ticket = await Ticket.crear({
      titulo, descripcion, prioridad,
      id_empleado:  parseInt(id_empleado),
      id_categoria: parseInt(id_categoria),
    });

    const archivos = req.files || [];
    if (archivos.length > 0) {
      const destDir = safeResolvePath(EVIDENCIAS_BASE, ticket.folio_ticket);
      fs.mkdirSync(destDir, { recursive: true });
      archivos.forEach((file, i) => {
        const ext     = path.extname(file.filename);
        const newPath = path.join(destDir, `${String(i + 1).padStart(2, "0")}${ext}`);
        fs.renameSync(file.path, newPath);
      });
      try {
        const tmp = safeResolvePath(EVIDENCIAS_BASE, "_tmp_upload");
        if (fs.readdirSync(tmp).length === 0) fs.rmdirSync(tmp);
      } catch {}
    }

    // Obtener nombre completo y área del empleado para la notificación
    const [[emp]] = await pool.query(
      `SELECT CONCAT(e.nombre,' ',e.ap_paterno) AS nombre_empleado,
              d.nombre_departamento
       FROM empleado e
       LEFT JOIN departamento d ON e.id_departamento = d.id_departamento
       WHERE e.id_empleado = ? LIMIT 1`,
      [parseInt(id_empleado)]
    );

    res.status(201).json({ ok: true, ...ticket, imagenes: archivos.length });
    // Notificar a todos los admins que llegó un ticket nuevo
    io.to("admins").emit("ticket:nuevo", {
      id_ticket:       ticket.id_ticket,
      folio_ticket:    ticket.folio_ticket,
      titulo,
      prioridad,
      id_empleado:     parseInt(id_empleado),
      nombre_empleado: emp?.nombre_empleado || "Usuario",
      departamento:    emp?.nombre_departamento || "Sin área",
    });
  } catch (err) {
    console.error("[crearTicket]", err.message);
    res.status(500).json({ error: "Error al crear el ticket" });
  }
};

export const getImagenesTicket = async (req, res) => {
  try {
    const { id_ticket } = req.params;
    const ticket = await Ticket.getFolioById(parseInt(id_ticket));
    if (!ticket) return res.json([]);
    const dir = safeResolvePath(EVIDENCIAS_BASE, ticket.folio_ticket);
    if (!fs.existsSync(dir)) return res.json([]);
    const archivos = fs.readdirSync(dir)
      .filter(f => /\.(jpg|jpeg|png|gif|webp)$/i.test(f))
      .sort();
    res.json(archivos);
  } catch (err) {
    console.error("[getImagenesTicket]", err.message);
    res.status(500).json({ error: "Error al obtener imágenes" });
  }
};

export const getTicketsByEmpleado = async (req, res) => {
  try {
    const { id_empleado } = req.params;
    const tickets = await Ticket.getByEmpleado(parseInt(id_empleado));
    res.json(tickets);
  } catch (err) {
    console.error("[getTicketsByEmpleado]", err.message);
    res.status(500).json({ error: "Error al obtener tickets" });
  }
};

export const actualizarTicket = async (req, res) => {
  try {
    const id_ticket = parseInt(req.params.id_ticket);
    if (isNaN(id_ticket)) return res.status(400).json({ error: "ID inválido" });
    const estatus         = req.body?.estatus;
    const comentarios     = req.body?.comentarios ?? null;
    const id_resuelto_por = (req.body?.id_resuelto_por !== undefined && req.body?.id_resuelto_por !== null)
      ? parseInt(req.body.id_resuelto_por)
      : null;
    if (!estatus) return res.status(400).json({ error: "El estatus es requerido" });
    const updated = await Ticket.actualizar(id_ticket, { comentarios, estatus, id_resuelto_por });
    if (!updated) return res.status(404).json({ error: "Ticket no encontrado" });

    // Obtener datos del ticket + técnico que lo atiende
    const [rows] = await pool.query(
      `SELECT t.id_empleado, t.titulo, t.folio_ticket,
              e.email, CONCAT(e.nombre,' ',e.ap_paterno) AS nombre_empleado,
              CONCAT(tec.nombre,' ',tec.ap_paterno) AS nombre_tecnico
       FROM ticket t
       JOIN empleado e ON t.id_empleado = e.id_empleado
       LEFT JOIN empleado tec ON tec.id_empleado = ?
       WHERE t.id_ticket = ? LIMIT 1`,
      [id_resuelto_por || req.usuario?.id_empleado, id_ticket]
    );
    const t = rows[0];
    if (t) {
      if (estatus === "Resuelto" || estatus === "No Resuelto") {
        // Notificar al usuario: ticket cerrado, debe calificar
        io.to(`empleado_${t.id_empleado}`).emit("ticket:actualizado", {
          id_ticket,
          folio_ticket:   t.folio_ticket,
          titulo:         t.titulo,
          estatus,
          fecha_resuelto: updated.fecha_resuelto ?? null,
          resuelto_por:   updated.resuelto_por   ?? null,
          nombre_tecnico: t.nombre_tecnico        ?? null,
        });
        enviarNotificacionTicket({
          to: t.email, nombre: t.nombre_empleado,
          folio: t.folio_ticket, titulo: t.titulo,
          estatus, comentario: comentarios || "",
        }).catch(err => console.error("[mailer] ticket:", err.message));
      } else if (estatus === "En proceso") {
        // Admin marcó el ticket como "En proceso" → notificar al usuario que está siendo atendido
        const adminId = id_resuelto_por || req.usuario?.id_empleado;
        const [[adminRow]] = await pool.query(
          `SELECT CONCAT(nombre,' ',ap_paterno) AS nombre_completo FROM empleado WHERE id_empleado = ? LIMIT 1`,
          [adminId]
        );
        io.to(`empleado_${t.id_empleado}`).emit("ticket:en_atencion", {
          id_ticket,
          folio_ticket:   t.folio_ticket,
          titulo:         t.titulo,
          nombre_tecnico: adminRow?.nombre_completo ?? "Soporte técnico",
        });
      } else if (comentarios) {
        // Admin guardó comentario sin cerrar → ticket en atención
        const adminId = id_resuelto_por || req.usuario?.id_empleado;
        const [[adminRow]] = await pool.query(
          `SELECT CONCAT(nombre,' ',ap_paterno) AS nombre_completo FROM empleado WHERE id_empleado = ? LIMIT 1`,
          [adminId]
        );
        io.to(`empleado_${t.id_empleado}`).emit("ticket:en_atencion", {
          id_ticket,
          folio_ticket:   t.folio_ticket,
          titulo:         t.titulo,
          nombre_tecnico: adminRow?.nombre_completo ?? "Soporte técnico",
        });
        const SEP = "\n\u00b7\u00b7\u00b7\n";
        const mensajes = comentarios.split(SEP);
        const ultimoBloque = mensajes[mensajes.length - 1] || "";
        const textoEmail = ultimoBloque.replace(/^\[[^\]]+\]\s*/, "").trim();
        if (textoEmail) {
          enviarNotificacionTicket({
            to: t.email, nombre: t.nombre_empleado,
            folio: t.folio_ticket, titulo: t.titulo,
            estatus: "En atención", comentario: textoEmail,
          }).catch(err => console.error("[mailer] comentario:", err.message));
        }
      }
    }

    res.json({ ok: true, estatus: updated.estatus, fecha_resuelto: updated.fecha_resuelto ?? null, resuelto_por: updated.resuelto_por ?? null });
  } catch (err) {
    console.error("[actualizarTicket]", err.message);
    res.status(500).json({ error: "Error al actualizar el ticket" });
  }
};

export const calificarTicket = async (req, res) => {
  try {
    const id_ticket    = parseInt(req.params.id_ticket);
    const calificacion = parseInt(req.body?.calificacion);
    if (isNaN(id_ticket) || isNaN(calificacion) || calificacion < 1 || calificacion > 5)
      return res.status(400).json({ error: "Datos inválidos" });
    // Verificar que el ticket pertenece al usuario autenticado
    const ticketRow = await Ticket.getFolioById(id_ticket);
    if (!ticketRow) return res.status(404).json({ error: "Ticket no encontrado" });
    const [ownerRows] = await pool.query(
      "SELECT id_empleado FROM ticket WHERE id_ticket = ? LIMIT 1", [id_ticket]
    );
    if (!ownerRows[0] || ownerRows[0].id_empleado !== req.usuario.id_empleado)
      return res.status(403).json({ error: "No puedes calificar el ticket de otro usuario" });
    const ok = await Ticket.guardarCalificacion(id_ticket, calificacion);
    if (!ok) return res.status(404).json({ error: "Ticket no encontrado" });

    // Notificar a todos los admins que el usuario calificó
    const [rows] = await pool.query(
      `SELECT t.folio_ticket, t.titulo, t.id_empleado,
              CONCAT(e.nombre,' ',e.ap_paterno) AS nombre_empleado
       FROM ticket t JOIN empleado e ON t.id_empleado = e.id_empleado
       WHERE t.id_ticket = ? LIMIT 1`,
      [id_ticket]
    );
    if (rows[0]) {
      io.to("admins").emit("ticket:calificado", {
        id_ticket,
        folio_ticket:     rows[0].folio_ticket,
        titulo:           rows[0].titulo,
        nombre_empleado:  rows[0].nombre_empleado,
        calificacion,
      });
    }

    res.json({ ok: true });
  } catch (err) {
    console.error("[calificarTicket]", err.message);
    res.status(500).json({ error: "Error al guardar calificación" });
  }
};

export const editarTicketUsuario = async (req, res) => {
  try {
    const id_ticket = parseInt(req.params.id_ticket);
    if (isNaN(id_ticket)) return res.status(400).json({ error: "ID inválido" });
    const { titulo, descripcion, prioridad, id_categoria } = req.body;
    if (!titulo || !descripcion || !prioridad || !id_categoria)
      return res.status(400).json({ error: "Todos los campos son requeridos" });
    // Verificar ownership — solo el dueño del ticket puede editarlo
    const [ownerRows] = await pool.query(
      "SELECT id_empleado FROM ticket WHERE id_ticket = ? LIMIT 1", [id_ticket]
    );
    if (!ownerRows[0]) return res.status(404).json({ error: "Ticket no encontrado" });
    if (ownerRows[0].id_empleado !== req.usuario.id_empleado)
      return res.status(403).json({ error: "No puedes editar el ticket de otro usuario" });
    const ok = await Ticket.editarPorUsuario(id_ticket, { titulo, descripcion, prioridad, id_categoria: parseInt(id_categoria) });
    if (!ok) return res.status(404).json({ error: "Ticket no encontrado o ya está cerrado" });
    res.json({ ok: true });
  } catch (err) {
    console.error("[editarTicketUsuario]", err.message);
    res.status(500).json({ error: "Error al editar el ticket" });
  }
};

export const getAdmins = async (req, res) => {
  try {
    const rows = await Ticket.getAdmins();
    res.json(rows);
  } catch (err) {
    console.error("[getAdmins]", err.message);
    res.status(500).json({ error: "Error al obtener admins" });
  }
};

export const getReporte = async (req, res) => {
  try {
    const { fecha_inicio, fecha_fin, id_tecnico } = req.query;
    if (!fecha_inicio || !fecha_fin) return res.status(400).json({ error: "fecha_inicio y fecha_fin son requeridos" });
    const rows = await Ticket.getReporte({
      fecha_inicio,
      fecha_fin,
      id_tecnico: id_tecnico && id_tecnico !== "todos" ? parseInt(id_tecnico) : null,
    });
    res.json(rows);
  } catch (err) {
    console.error("[getReporte]", err.message);
    res.status(500).json({ error: "Error al generar reporte" });
  }
};

export const getMetricas = async (req, res) => {
  try {
    const data = await Ticket.getMetricas();
    res.json(data);
  } catch (err) {
    console.error("[getMetricas]", err.message);
    res.status(500).json({ error: "Error al obtener métricas" });
  }
};

export const getAllTickets = async (req, res) => {
  try {
    const limit  = Math.min(parseInt(req.query.limit)  || 100, 500);
    const page   = Math.max(parseInt(req.query.page)   || 1,   1);
    const offset = (page - 1) * limit;
    const { rows, total } = await Ticket.getAll({ limit, offset });
    res.json({ data: rows, total, page, limit, pages: Math.ceil(total / limit) });
  } catch (err) {
    console.error("[getAllTickets]", err.message);
    res.status(500).json({ error: "Error al obtener tickets" });
  }
};
