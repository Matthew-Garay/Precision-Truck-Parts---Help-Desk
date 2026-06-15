import Ticket   from "../Models/Ticket.js";
import Empleado from "../Models/Empleado.js";
import { getIO } from "../Config/socketInstance.js";
import path     from "path";
import fs       from "fs";
import { safeResolvePath } from "../Middlewares/security.js";
import { EVIDENCIAS_BASE } from "../Middlewares/uploadEvidencias.js";
import pool from "../Config/db.js";
import { enviarNotificacionTicket } from "../Config/mailer.js";

export const getTicketById = async (req, res) => {
  try {
    const id_ticket = parseInt(req.params.id_ticket);
    if (isNaN(id_ticket)) return res.status(400).json({ error: "ID inválido" });
    const ticket = await Ticket.getById(id_ticket);
    if (!ticket) return res.status(404).json({ error: "Ticket no encontrado" });
    // Solo el dueño o un admin puede verlo
    const { id_rol, id_empleado } = req.usuario;
    if (id_rol !== 1 && ticket.id_empleado !== id_empleado)
      return res.status(403).json({ error: "Acceso no autorizado" });
    res.json(ticket);
  } catch (err) {
    console.error("[getTicketById]", err.message);
    res.status(500).json({ error: "Error al obtener ticket" });
  }
};

export const crearTicket = async (req, res) => {
  try {
    const titulo       = req.body?.titulo;
    const descripcion  = req.body?.descripcion;
    const prioridad    = req.body?.prioridad;
    const id_categoria = req.body?.id_categoria;
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

    const emp = await Empleado.getResumen(parseInt(id_empleado));

    res.status(201).json({ ok: true, ...ticket, imagenes: archivos.length });
    // Notificar al propio usuario: confirmación de recibo
    try {
      getIO().to(`empleado_${parseInt(id_empleado)}`).emit("ticket:confirmado", {
        id_ticket:    ticket.id_ticket,
        folio_ticket: ticket.folio_ticket,
        titulo,
        prioridad,
      });
    } catch {}
    try {
      getIO().to("admins").emit("ticket:nuevo", {
        id_ticket:       ticket.id_ticket,
        folio_ticket:    ticket.folio_ticket,
        titulo,
        prioridad,
        id_empleado:     parseInt(id_empleado),
        nombre_empleado: emp.nombre_empleado,
        departamento:    emp.nombre_departamento,
      });
    } catch (emitErr) { console.error("[emit ticket:nuevo]", emitErr.message); }
  } catch (err) {
    console.error("[crearTicket]", err.message);
    res.status(500).json({ error: "Error al crear el ticket" });
  }
};

export const getImagenesTicket = async (req, res) => {
  try {
    const { id_ticket } = req.params;
    const idTicket = parseInt(id_ticket);
    if (isNaN(idTicket)) return res.json([]);
    const ticket = await Ticket.getFolioById(idTicket);
    if (!ticket) return res.json([]);

    const { id_rol, id_empleado } = req.usuario;
    if (id_rol !== 1) {
      const [ownerRows] = await pool.query(
        "SELECT id_empleado FROM ticket WHERE id_ticket = ? LIMIT 1", [idTicket]
      );
      if (!ownerRows[0] || ownerRows[0].id_empleado !== id_empleado)
        return res.status(403).json({ error: "Acceso no autorizado" });
    }

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
    const idParam = parseInt(req.params.id_empleado, 10);
    if (isNaN(idParam)) return res.status(400).json({ error: "ID inválido" });
    if (req.usuario.id_rol !== 1 && req.usuario.id_empleado !== idParam)
      return res.status(403).json({ error: "Acceso no autorizado" });
    const tickets = await Ticket.getByEmpleado(idParam);
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

    const [rows] = await pool.query(
      `SELECT t.id_empleado, t.titulo, t.folio_ticket,
              CONCAT(e.nombre,' ',e.ap_paterno) AS nombre_empleado,
              e.email AS email_empleado,
              CONCAT(tec.nombre,' ',tec.ap_paterno) AS nombre_tecnico
       FROM ticket t
       JOIN empleado e ON t.id_empleado = e.id_empleado
       LEFT JOIN empleado tec ON tec.id_empleado = t.id_tecnico
       WHERE t.id_ticket = ? LIMIT 1`,
      [id_ticket]
    );
    const t = rows[0];
    if (t) {
      try {
        const io = getIO();
        const payload = {
          id_ticket,
          folio_ticket:   t.folio_ticket,
          titulo:         t.titulo,
          estatus,
          fecha_resuelto: updated.fecha_resuelto ?? null,
          resuelto_por:   updated.resuelto_por   ?? null,
          nombre_tecnico: t.nombre_tecnico        ?? null,
        };
        if (estatus === "Resuelto" || estatus === "No Resuelto") {
          // Notificar al empleado dueño y a los admins
          io.to(`empleado_${t.id_empleado}`).emit("ticket:actualizado", payload);
          io.to("admins").emit("ticket:actualizado", payload);
          // Envío de correo desactivado
        } else if (estatus === "En proceso" || comentarios) {
          const adminId     = id_resuelto_por || req.usuario?.id_empleado;
          const nombreAdmin = await Empleado.getNombre(adminId);
          const payloadAtencion = {
            id_ticket,
            folio_ticket:   t.folio_ticket,
            titulo:         t.titulo,
            nombre_tecnico: nombreAdmin,
            estatus,
          };
          io.to(`empleado_${t.id_empleado}`).emit("ticket:en_atencion", payloadAtencion);
          // También notificar a admins para que recarguen su dashboard
          io.to("admins").emit("ticket:actualizado", { ...payload, nombre_tecnico: nombreAdmin });
        }
      } catch (emitErr) { console.error("[emit ticket:actualizado]", emitErr.message); }
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
    const ticketRow = await Ticket.getFolioById(id_ticket);
    if (!ticketRow) return res.status(404).json({ error: "Ticket no encontrado" });
    const [ownerRows] = await pool.query(
      "SELECT id_empleado FROM ticket WHERE id_ticket = ? LIMIT 1", [id_ticket]
    );
    if (!ownerRows[0] || ownerRows[0].id_empleado !== req.usuario.id_empleado)
      return res.status(403).json({ error: "No puedes calificar el ticket de otro usuario" });
    const ok = await Ticket.guardarCalificacion(id_ticket, calificacion);
    if (ok === null) return res.status(404).json({ error: "Ticket no encontrado" });
    if (!ok) return res.status(404).json({ error: "Ticket no encontrado" });

    const emp = await Empleado.getResumen(ownerRows[0].id_empleado);
    try {
      getIO().to("admins").emit("ticket:calificado", {
        id_ticket,
        folio_ticket:    ticketRow.folio_ticket,
        nombre_empleado: emp.nombre_empleado,
        calificacion,
      });
    } catch (emitErr) { console.error("[emit ticket:calificado]", emitErr.message); }

    res.json({ ok: true });
  } catch (err) {
    console.error("[calificarTicket]", err.message);
    const status = err.status === 409 ? 409 : err.status === 400 ? 400 : 500;
    res.status(status).json({ error: err.status ? err.message : "Error al guardar calificación" });
  }
};

export const editarTicketUsuario = async (req, res) => {
  try {
    const id_ticket = parseInt(req.params.id_ticket);
    if (isNaN(id_ticket)) return res.status(400).json({ error: "ID inválido" });
    const { titulo, descripcion, prioridad, id_categoria, estatus, comentarios } = req.body;
    if (!titulo || !descripcion || !prioridad || !id_categoria)
      return res.status(400).json({ error: "Todos los campos son requeridos" });
    const [ownerRows] = await pool.query(
      "SELECT id_empleado FROM ticket WHERE id_ticket = ? LIMIT 1", [id_ticket]
    );
    if (!ownerRows[0]) return res.status(404).json({ error: "Ticket no encontrado" });
    if (req.usuario.id_rol !== 1 && ownerRows[0].id_empleado !== req.usuario.id_empleado)
      return res.status(403).json({ error: "No puedes editar el ticket de otro usuario" });
    const ok = await Ticket.editarPorUsuario(id_ticket, {
      titulo, descripcion, prioridad,
      id_categoria: parseInt(id_categoria),
      estatus:      estatus || undefined,
      comentarios:  comentarios !== undefined ? comentarios : undefined,
    });
    if (!ok) return res.status(404).json({ error: "Ticket no encontrado o ya está cerrado" });
    res.json({ ok: true });
  } catch (err) {
    console.error("[editarTicketUsuario]", err.message);
    res.status(500).json({ error: "Error al editar el ticket" });
  }
};

export const agregarImagenesTicket = async (req, res) => {
  try {
    const idTicket = parseInt(req.params.id_ticket);
    if (isNaN(idTicket)) return res.status(400).json({ error: "ID inválido" });
    const ticket = await Ticket.getFolioById(idTicket);
    if (!ticket) return res.status(404).json({ error: "Ticket no encontrado" });
    const { id_rol, id_empleado } = req.usuario;
    if (id_rol !== 1) {
      const [ownerRows] = await pool.query("SELECT id_empleado FROM ticket WHERE id_ticket = ? LIMIT 1", [idTicket]);
      if (!ownerRows[0] || ownerRows[0].id_empleado !== id_empleado)
        return res.status(403).json({ error: "Acceso no autorizado" });
    }
    const archivos = req.files || [];
    if (archivos.length === 0) return res.status(400).json({ error: "No se recibieron imágenes" });
    const destDir = safeResolvePath(EVIDENCIAS_BASE, ticket.folio_ticket);
    fs.mkdirSync(destDir, { recursive: true });
    // Buscar último número existente
    const existentes = fs.existsSync(destDir)
      ? fs.readdirSync(destDir).filter(f => /\.(jpg|jpeg|png|gif|webp)$/i.test(f)).sort()
      : [];
    let contador = existentes.length;
    archivos.forEach(file => {
      contador++;
      const ext = path.extname(file.filename) || path.extname(file.originalname) || ".jpg";
      const newPath = path.join(destDir, `${String(contador).padStart(2, "0")}${ext}`);
      fs.renameSync(file.path, newPath);
    });
    try { const tmp = safeResolvePath(EVIDENCIAS_BASE, "_tmp_upload"); if (fs.readdirSync(tmp).length === 0) fs.rmdirSync(tmp); } catch {}
    res.json({ ok: true, agregadas: archivos.length });
  } catch (err) {
    console.error("[agregarImagenesTicket]", err.message);
    res.status(500).json({ error: "Error al agregar imágenes" });
  }
};

export const eliminarImagenTicket = async (req, res) => {
  try {
    const idTicket = parseInt(req.params.id_ticket);
    const nombre   = req.params.nombre;
    if (isNaN(idTicket) || !nombre) return res.status(400).json({ error: "Datos inválidos" });
    const ticket = await Ticket.getFolioById(idTicket);
    if (!ticket) return res.status(404).json({ error: "Ticket no encontrado" });
    const { id_rol, id_empleado } = req.usuario;
    if (id_rol !== 1) {
      const [ownerRows] = await pool.query("SELECT id_empleado FROM ticket WHERE id_ticket = ? LIMIT 1", [idTicket]);
      if (!ownerRows[0] || ownerRows[0].id_empleado !== id_empleado)
        return res.status(403).json({ error: "Acceso no autorizado" });
    }
    const filePath = safeResolvePath(EVIDENCIAS_BASE, ticket.folio_ticket, nombre);
    if (!fs.existsSync(filePath)) return res.status(404).json({ error: "Imagen no encontrada" });
    fs.unlinkSync(filePath);
    res.json({ ok: true });
  } catch (err) {
    console.error("[eliminarImagenTicket]", err.message);
    res.status(500).json({ error: "Error al eliminar imagen" });
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
