import Ticket from "../Models/Ticket.js";
import path   from "path";
import fs     from "fs";

export const crearTicket = async (req, res) => {
  try {
    const titulo       = req.body?.titulo;
    const descripcion  = req.body?.descripcion;
    const prioridad    = req.body?.prioridad;
    const id_empleado  = req.body?.id_empleado;
    const id_categoria = req.body?.id_categoria;

    if (!titulo || !descripcion || !prioridad || !id_empleado || !id_categoria)
      return res.status(400).json({ error: "Todos los campos son requeridos" });

    const ticket = await Ticket.crear({
      titulo, descripcion, prioridad,
      id_empleado:  parseInt(id_empleado),
      id_categoria: parseInt(id_categoria),
    });

    const archivos = req.files || [];
    if (archivos.length > 0) {
      const destDir = path.resolve("storage", "Evidencias_Tickets", ticket.folio_ticket);
      fs.mkdirSync(destDir, { recursive: true });
      archivos.forEach((file, i) => {
        const ext     = path.extname(file.originalname);
        const newPath = path.join(destDir, `${String(i + 1).padStart(2, "0")}${ext}`);
        fs.renameSync(file.path, newPath);
      });
      try {
        const tmp = path.resolve("storage", "Evidencias_Tickets", "_tmp_upload");
        if (fs.readdirSync(tmp).length === 0) fs.rmdirSync(tmp);
      } catch {}
    }

    res.status(201).json({ ok: true, ...ticket, imagenes: archivos.length });
  } catch (err) {
    res.status(500).json({ error: "Error al crear el ticket", detalle: err.message });
  }
};

export const getImagenesTicket = async (req, res) => {
  try {
    const { id_ticket } = req.params;
    const ticket = await Ticket.getFolioById(parseInt(id_ticket));
    if (!ticket) return res.json([]);
    const dir = path.resolve("storage", "Evidencias_Tickets", ticket.folio_ticket);
    if (!fs.existsSync(dir)) return res.json([]);
    const archivos = fs.readdirSync(dir)
      .filter(f => /\.(jpg|jpeg|png|gif|webp)$/i.test(f))
      .sort();
    res.json(archivos);
  } catch (err) {
    res.status(500).json({ error: "Error al obtener imágenes", detalle: err.message });
  }
};

export const getTicketsByEmpleado = async (req, res) => {
  try {
    const { id_empleado } = req.params;
    const tickets = await Ticket.getByEmpleado(parseInt(id_empleado));
    res.json(tickets);
  } catch (err) {
    res.status(500).json({ error: "Error al obtener tickets", detalle: err.message });
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
    res.json({ ok: true, estatus: updated.estatus, fecha_resuelto: updated.fecha_resuelto ?? null, resuelto_por: updated.resuelto_por ?? null });
  } catch (err) {
    res.status(500).json({ error: "Error al actualizar el ticket", detalle: err.message });
  }
};

export const calificarTicket = async (req, res) => {
  try {
    const id_ticket    = parseInt(req.params.id_ticket);
    const calificacion = parseInt(req.body?.calificacion);
    if (isNaN(id_ticket) || isNaN(calificacion) || calificacion < 1 || calificacion > 5)
      return res.status(400).json({ error: "Datos inválidos" });
    const ok = await Ticket.guardarCalificacion(id_ticket, calificacion);
    if (!ok) return res.status(404).json({ error: "Ticket no encontrado" });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: "Error al guardar calificación", detalle: err.message });
  }
};

export const editarTicketUsuario = async (req, res) => {
  try {
    const id_ticket = parseInt(req.params.id_ticket);
    if (isNaN(id_ticket)) return res.status(400).json({ error: "ID inválido" });
    const { titulo, descripcion, prioridad, id_categoria } = req.body;
    if (!titulo || !descripcion || !prioridad || !id_categoria)
      return res.status(400).json({ error: "Todos los campos son requeridos" });
    const ok = await Ticket.editarPorUsuario(id_ticket, { titulo, descripcion, prioridad, id_categoria: parseInt(id_categoria) });
    if (!ok) return res.status(404).json({ error: "Ticket no encontrado o ya está cerrado" });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: "Error al editar el ticket", detalle: err.message });
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
    res.status(500).json({ error: "Error al obtener tickets", detalle: err.message });
  }
};
