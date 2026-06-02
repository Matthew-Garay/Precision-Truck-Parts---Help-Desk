import Solicitud from "../Models/Solicitud.js";
import Insumo    from "../Models/Insumo.js";
import { io }    from "../server.js";
import pool      from "../Config/db.js";

export const getInsumos = async (req, res) => {
  try {
    const insumos = await Insumo.getDisponibles();
    res.json(insumos);
  } catch (err) {
    console.error("[getInsumos]", err.message);
    res.status(500).json({ error: "Error al obtener insumos" });
  }
};

export const getInventario = async (req, res) => {
  try {
    const insumos = await Insumo.getAll();
    res.json(insumos);
  } catch (err) {
    console.error("[getInventario]", err.message);
    res.status(500).json({ error: "Error al obtener inventario" });
  }
};

// Insumos con stock = 0 para alertas del panel derecho
export const getInsumosStockBajo = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT i.id_insumo, i.nombre, i.marca, i.modelo, i.stock, c.nombre_categoria
       FROM insumo i
       LEFT JOIN categoria c ON i.id_categoria = c.id_categoria
       WHERE i.stock = 0
       ORDER BY i.nombre ASC
       LIMIT 20`
    );
    res.json(rows);
  } catch (err) {
    console.error("[getInsumosStockBajo]", err.message);
    res.status(500).json({ error: "Error al obtener alertas de stock" });
  }
};

export const crearSolicitud = async (req, res) => {
  const { prioridad, id_empleado, insumos } = req.body;
  if (!prioridad || !id_empleado || !Array.isArray(insumos) || insumos.length === 0)
    return res.status(400).json({ error: "Datos incompletos" });
  // El empleado solo puede crear solicitudes en su propio nombre
  if (parseInt(id_empleado) !== req.usuario.id_empleado && req.usuario.id_rol !== 1)
    return res.status(403).json({ error: "No puedes crear solicitudes en nombre de otro usuario" });
  for (const item of insumos) {
    if (!item.id_insumo || !item.cantidad || item.cantidad < 1)
      return res.status(400).json({ error: "Cada insumo debe tener id y cantidad válida" });
  }
  try {
    const result = await Solicitud.crear({ prioridad, id_empleado: parseInt(id_empleado), insumos });
    // Obtener nombre y área del empleado
    const [[emp]] = await pool.query(
      `SELECT CONCAT(e.nombre,' ',e.ap_paterno) AS nombre_empleado,
              d.nombre_departamento
       FROM empleado e
       LEFT JOIN departamento d ON e.id_departamento = d.id_departamento
       WHERE e.id_empleado = ? LIMIT 1`,
      [parseInt(id_empleado)]
    );
    // Notificar a todos los admins que llegó una nueva solicitud
    io.to("admins").emit("solicitud:nueva", {
      id_solicitud:    result.id_solicitud,
      folio_solicitud: result.folio_solicitud,
      id_empleado:     parseInt(id_empleado),
      prioridad,
      total_insumos:   insumos.length,
      nombre_empleado: emp?.nombre_empleado || "Usuario",
      departamento:    emp?.nombre_departamento || "Sin área",
    });
    res.status(201).json({ ok: true, ...result });
  } catch (err) {
    console.error("[crearSolicitud]", err.message);
    res.status(500).json({ error: "Error al crear solicitud" });
  }
};

export const getSolicitudesByEmpleado = async (req, res) => {
  try {
    const { id_empleado } = req.params;
    const solicitudes = await Solicitud.getByEmpleado(parseInt(id_empleado));
    res.json(solicitudes);
  } catch (err) {
    console.error("[getSolicitudesByEmpleado]", err.message);
    res.status(500).json({ error: "Error al obtener solicitudes" });
  }
};

export const getSolicitudById = async (req, res) => {
  try {
    const { id } = req.params;
    const solicitud = await Solicitud.getById(parseInt(id));
    if (!solicitud) return res.status(404).json({ error: "Solicitud no encontrada" });
    res.json(solicitud);
  } catch (err) {
    console.error("[getSolicitudById]", err.message);
    res.status(500).json({ error: "Error al obtener solicitud" });
  }
};

export const getAllSolicitudes = async (req, res) => {
  try {
    const limit  = Math.min(parseInt(req.query.limit) || 100, 500);
    const page   = Math.max(parseInt(req.query.page)  || 1, 1);
    const offset = (page - 1) * limit;
    const { rows, total } = await Solicitud.getAll({ limit, offset });
    res.json({ data: rows, total, page, limit, pages: Math.ceil(total / limit) });
  } catch (err) {
    console.error("[getAllSolicitudes]", err.message);
    res.status(500).json({ error: "Error al obtener solicitudes" });
  }
};

export const actualizarEstatusSolicitud = async (req, res) => {
  const { id } = req.params;
  const { estatus } = req.body;
  if (!estatus) return res.status(400).json({ error: "Estatus requerido" });
  try {
    const ok = await Solicitud.actualizarEstatus(parseInt(id), estatus);
    if (!ok) return res.status(404).json({ error: "Solicitud no encontrada" });
    // Notificar al empleado dueño de la solicitud
    const [[sol]] = await pool.query(
      "SELECT id_empleado, folio_solicitud FROM solicitud WHERE id_solicitud = ? LIMIT 1",
      [parseInt(id)]
    );
    if (sol) {
      io.to(`empleado_${sol.id_empleado}`).emit("solicitud:actualizada", {
        id_solicitud:    parseInt(id),
        folio_solicitud: sol.folio_solicitud,
        estatus,
      });
    }
    res.json({ ok: true });
  } catch (err) {
    console.error("[actualizarEstatusSolicitud]", err.message);
    res.status(500).json({ error: "Error al actualizar solicitud" });
  }
};
