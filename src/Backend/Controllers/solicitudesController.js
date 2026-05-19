import Solicitud from "../Models/Solicitud.js";
import Insumo    from "../Models/Insumo.js";

export const getInsumos = async (req, res) => {
  try {
    const insumos = await Insumo.getDisponibles();
    res.json(insumos);
  } catch (err) {
    res.status(500).json({ error: "Error al obtener insumos", detalle: err.message });
  }
};

export const getInventario = async (req, res) => {
  try {
    const insumos = await Insumo.getAll();
    res.json(insumos);
  } catch (err) {
    res.status(500).json({ error: "Error al obtener inventario", detalle: err.message });
  }
};

export const crearSolicitud = async (req, res) => {
  const { prioridad, id_empleado, insumos } = req.body;
  if (!prioridad || !id_empleado || !Array.isArray(insumos) || insumos.length === 0)
    return res.status(400).json({ error: "Datos incompletos" });
  for (const item of insumos) {
    if (!item.id_insumo || !item.cantidad || item.cantidad < 1)
      return res.status(400).json({ error: "Cada insumo debe tener id y cantidad válida" });
  }
  try {
    const result = await Solicitud.crear({ prioridad, id_empleado: parseInt(id_empleado), insumos });
    res.status(201).json({ ok: true, ...result });
  } catch (err) {
    res.status(500).json({ error: "Error al crear solicitud", detalle: err.message });
  }
};

export const getSolicitudesByEmpleado = async (req, res) => {
  try {
    const { id_empleado } = req.params;
    const solicitudes = await Solicitud.getByEmpleado(parseInt(id_empleado));
    res.json(solicitudes);
  } catch (err) {
    res.status(500).json({ error: "Error al obtener solicitudes", detalle: err.message });
  }
};

export const getSolicitudById = async (req, res) => {
  try {
    const { id } = req.params;
    const solicitud = await Solicitud.getById(parseInt(id));
    if (!solicitud) return res.status(404).json({ error: "Solicitud no encontrada" });
    res.json(solicitud);
  } catch (err) {
    res.status(500).json({ error: "Error al obtener solicitud", detalle: err.message });
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
    res.status(500).json({ error: "Error al obtener solicitudes", detalle: err.message });
  }
};

export const actualizarEstatusSolicitud = async (req, res) => {
  const { id } = req.params;
  const { estatus } = req.body;
  if (!estatus) return res.status(400).json({ error: "Estatus requerido" });
  try {
    const ok = await Solicitud.actualizarEstatus(parseInt(id), estatus);
    if (!ok) return res.status(404).json({ error: "Solicitud no encontrada" });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
