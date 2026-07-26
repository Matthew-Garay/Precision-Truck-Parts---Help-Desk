import Ticket   from "../Models/Ticket.js";
import Empleado from "../Models/Empleado.js";
import { getIO } from "../Config/socketInstance.js";
import path     from "path";
import fs       from "fs";
import { safeResolvePath } from "../Middlewares/security.js";
import { EVIDENCIAS_BASE } from "../Middlewares/uploadEvidencias.js";
import pool from "../Config/db.js";
import { cache } from "../Config/cache.js";

export const getHistorialTicket = async (req, res) => {
  try {
    const id_ticket = parseInt(req.params.id_ticket);
    if (isNaN(id_ticket)) return res.status(400).json({ error: "ID inválido" });
    const ticket = await Ticket.getById(id_ticket);
    if (!ticket) return res.status(404).json({ error: "Ticket no encontrado" });
    const { id_rol, id_empleado } = req.usuario;
    if (id_rol !== 1 && ticket.id_empleado !== id_empleado)
      return res.status(403).json({ error: "Acceso no autorizado" });
    // Retornar array vacío si la tabla historial_ticket no existe aún
    try {
      const [rows] = await pool.query(
        `SELECT h.id_historial, h.campo_cambiado, h.valor_anterior, h.valor_nuevo,
                h.fecha_cambio,
                TRIM(CONCAT(e.nombre,' ',e.ap_paterno)) AS nombre_empleado
         FROM historial_ticket h
         JOIN empleado e ON h.id_empleado = e.id_empleado
         WHERE h.id_ticket = ?
         ORDER BY h.fecha_cambio ASC`,
        [id_ticket]
      );
      res.json(rows);
    } catch { res.json([]); }
  } catch (err) {
    console.error("[getHistorialTicket]", err.message);
    res.status(500).json({ error: "Error al obtener historial" });
  }
};

export const getTicketByFolio = async (req, res) => {
  try {
    const folio = req.params.folio?.trim().toUpperCase();
    if (!folio) return res.status(400).json({ error: "Folio inválido" });

    const [rows] = await pool.query(
      `SELECT t.*,
              CONCAT(e.nombre,' ',e.ap_paterno,' ',IFNULL(e.ap_materno,'')) AS nombre_empleado,
              d.nombre_departamento,
              c.nombre_categoria,
              s.nombre_sucursal,
              TRIM(CONCAT(tec.nombre,' ',tec.ap_paterno,IF(tec.ap_materno IS NOT NULL AND tec.ap_materno != '',CONCAT(' ',tec.ap_materno),''))) AS resuelto_por
       FROM ticket t
       JOIN empleado e      ON t.id_empleado    = e.id_empleado
       JOIN departamento d  ON e.id_departamento = d.id_departamento
       JOIN categoria c     ON t.id_categoria   = c.id_categoria
       LEFT JOIN sucursal s  ON e.id_sucursal    = s.id_sucursal
       LEFT JOIN empleado tec ON tec.id_empleado = t.id_tecnico
       WHERE t.folio_ticket = ? LIMIT 1`,
      [folio]
    );
    if (!rows[0]) return res.status(404).json({ error: "Ticket no encontrado" });
    const ticket = rows[0];

    const { id_rol, id_empleado } = req.usuario;
    if (id_rol !== 1 && ticket.id_empleado !== id_empleado)
      return res.status(403).json({ error: "Acceso no autorizado" });

    const dir = safeResolvePath(EVIDENCIAS_BASE, folio);
    let imagenes = [];
    try {
      const archivos = await fs.promises.readdir(dir);
      imagenes = archivos.filter(f => /\.(jpg|jpeg|png|gif|webp|mp4|webm|mov|avi)$/i.test(f)).sort();
    } catch { /* directorio no existe aún */ }

    res.json({ ...ticket, imagenes });
  } catch (err) {
    console.error("[getTicketByFolio]", err.message);
    res.status(500).json({ error: "Error al obtener ticket" });
  }
};

export const getTicketById = async (req, res) => {
  try {
    const id_ticket = parseInt(req.params.id_ticket);
    if (isNaN(id_ticket)) return res.status(400).json({ error: "ID inválido" });
    const ticket = await Ticket.getById(id_ticket);
    if (!ticket) return res.status(404).json({ error: "Ticket no encontrado" });
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

    // Invalidar caché de métricas al crear ticket nuevo
    cache.del("metricas:dashboard");

    const emp = await Empleado.getResumen(parseInt(id_empleado));

    res.status(201).json({ ok: true, ...ticket, imagenes: archivos.length });

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
    let archivos = [];
    try {
      archivos = (await fs.promises.readdir(dir))
        .filter(f => /\.(jpg|jpeg|png|gif|webp|mp4|webm|mov|avi)$/i.test(f))
        .sort();
    } catch { /* directorio no existe aún */ }
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
    const limit    = Math.min(parseInt(req.query.limit) || 50, 200);
    const page      = Math.max(parseInt(req.query.page)  || 1, 1);
    const offset    = (page - 1) * limit;
    const { estatus, prioridad, categoria, q } = req.query;
    const { rows, total } = await Ticket.getByEmpleado(idParam, { limit, offset, estatus, prioridad, categoria, q });
    res.json({ data: rows, total, page, limit, pages: Math.ceil(total / limit) });
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

    let updated;
    try {
      updated = await Ticket.actualizar(id_ticket, { comentarios, estatus, id_resuelto_por });
    } catch (err) {
      if (err.status === 409) return res.status(409).json({ error: err.message });
      throw err;
    }
    if (!updated) return res.status(404).json({ error: "Ticket no encontrado" });

    // Invalidar caché de métricas y rendimiento al cambiar estatus
    cache.del("metricas:dashboard");
    cache.delByPrefix("rendimiento:");

    const [rows] = await pool.query(
      `SELECT t.id_empleado, t.titulo, t.folio_ticket,
              TRIM(CONCAT(e.nombre,' ',e.ap_paterno,IF(e.ap_materno IS NOT NULL AND e.ap_materno != '',CONCAT(' ',e.ap_materno),''))) AS nombre_empleado,
              e.email AS email_empleado,
              TRIM(CONCAT(tec.nombre,' ',tec.ap_paterno,IF(tec.ap_materno IS NOT NULL AND tec.ap_materno != '',CONCAT(' ',tec.ap_materno),''))) AS nombre_tecnico
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
        const actorId = req.usuario?.id_empleado;
        if (estatus === "Resuelto" || estatus === "No Resuelto") {
          io.to(`empleado_${t.id_empleado}`).emit("ticket:actualizado", payload);
          io.to("admins").emit("ticket:actualizado", { ...payload, id_actor: actorId });
        } else if (estatus === "En proceso") {
          const adminId     = id_resuelto_por || actorId;
          const nombreAdmin = await Empleado.getNombre(adminId);
          const payloadAtencion = {
            id_ticket,
            folio_ticket:   t.folio_ticket,
            titulo:         t.titulo,
            nombre_tecnico: nombreAdmin,
            estatus,
            id_actor:       actorId,
          };
          io.to(`empleado_${t.id_empleado}`).emit("ticket:en_atencion", payloadAtencion);
          io.to("admins").emit("ticket:en_atencion", payloadAtencion);
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

    const [ownerRows] = await pool.query(
      "SELECT id_ticket, folio_ticket, id_empleado FROM ticket WHERE id_ticket = ? LIMIT 1", [id_ticket]
    );
    if (!ownerRows[0]) return res.status(404).json({ error: "Ticket no encontrado" });
    if (ownerRows[0].id_empleado !== req.usuario.id_empleado)
      return res.status(403).json({ error: "No puedes calificar el ticket de otro usuario" });

    const ok = await Ticket.guardarCalificacion(id_ticket, calificacion);
    if (ok === null || !ok) return res.status(404).json({ error: "Ticket no encontrado" });

    const emp = await Empleado.getResumen(ownerRows[0].id_empleado);
    try {
      getIO().to("admins").emit("ticket:calificado", {
        id_ticket,
        folio_ticket:    ownerRows[0].folio_ticket,
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
    const ESTATUS_EDITABLES_USUARIO = new Set(["En proceso"]);
    const estatusFinal = estatus && ESTATUS_EDITABLES_USUARIO.has(estatus) ? estatus : undefined;
    const ok = await Ticket.editarPorUsuario(id_ticket, {
      titulo, descripcion, prioridad,
      id_categoria: parseInt(id_categoria),
      estatus:      estatusFinal,
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
    const existentes = fs.existsSync(destDir)
      ? fs.readdirSync(destDir).filter(f => /\.(jpg|jpeg|png|gif|webp|mp4|webm|mov|avi)$/i.test(f)).sort()
      : [];
    if (existentes.length + archivos.length > 8) {
      // Limpiar archivos subidos antes de rechazar
      archivos.forEach(f => { try { fs.unlinkSync(f.path); } catch {} });
      return res.status(400).json({ error: `El ticket ya tiene ${existentes.length} imagen(es). Solo se permiten 8 en total.` });
    }
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

export const cancelarTicket = async (req, res) => {
  try {
    const id_ticket   = parseInt(req.params.id_ticket);
    const id_empleado = req.usuario.id_empleado;
    if (isNaN(id_ticket)) return res.status(400).json({ error: "ID inválido" });
    const result = await Ticket.cancelar(id_ticket, id_empleado);
    if (result.error === "not_found")   return res.status(404).json({ error: "Ticket no encontrado" });
    if (result.error === "forbidden")   return res.status(403).json({ error: "No puedes cancelar el ticket de otro usuario" });
    if (result.error === "not_allowed") return res.status(409).json({ error: "Solo se pueden cancelar tickets En proceso" });

    cache.del("metricas:dashboard");

    try {
      const [rows] = await pool.query(
        "SELECT folio_ticket, titulo, id_empleado FROM ticket WHERE id_ticket = ? LIMIT 1",
        [id_ticket]
      );
      const t = rows[0];
      if (t) {
        const actorId = req.usuario?.id_empleado;
        getIO().to(`empleado_${t.id_empleado}`).emit("ticket:actualizado", {
          id_ticket, folio_ticket: t.folio_ticket, titulo: t.titulo, estatus: "Cancelado",
        });
        getIO().to("admins").emit("ticket:actualizado", {
          id_ticket, folio_ticket: t.folio_ticket, titulo: t.titulo, estatus: "Cancelado", id_actor: actorId,
        });
      }
    } catch {}
    res.json({ ok: true });
  } catch (err) {
    console.error("[cancelarTicket]", err.message);
    res.status(500).json({ error: "Error al cancelar el ticket" });
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
    const { fecha_inicio, fecha_fin, id_tecnico, estatus, prioridad, usuario, area, sucursal, q } = req.query;
    if (!fecha_inicio || !fecha_fin) return res.status(400).json({ error: "fecha_inicio y fecha_fin son requeridos" });
    const rows = await Ticket.getReporte({
      fecha_inicio, fecha_fin,
      id_tecnico: id_tecnico && id_tecnico !== "todos" ? parseInt(id_tecnico) : null,
      estatus, prioridad, usuario, area, sucursal, q,
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

export const getRendimientoTecnicos = async (req, res) => {
  try {
    const { fecha_inicio, fecha_fin } = req.query;
    const rows = await Ticket.getRendimientoTecnicos({ fecha_inicio, fecha_fin });
    res.json(rows);
  } catch (err) {
    console.error("[getRendimientoTecnicos]", err.message);
    res.status(500).json({ error: "Error al obtener rendimiento de técnicos" });
  }
};

export const getAllTickets = async (req, res) => {
  try {
    const q = req.queryValidado ?? req.query;
    const limit  = Math.min(parseInt(q.limit)  || 100, 10000);
    const page   = Math.max(parseInt(q.page)   || 1,   1);
    const offset = (page - 1) * limit;
    const { estatus, prioridad, q: busqueda, fecha_inicio, fecha_fin, tecnico, usuario, area, sucursal } = q;
    const { rows, total } = await Ticket.getAll({ limit, offset, estatus, prioridad, q: busqueda, fecha_inicio, fecha_fin, tecnico, usuario, area, sucursal });
    res.json({ data: rows, total, page, limit, pages: Math.ceil(total / limit) });
  } catch (err) {
    console.error("[getAllTickets]", err.message);
    res.status(500).json({ error: "Error al obtener tickets" });
  }
};
