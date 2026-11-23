/**
 * conocimiento-controller.js
 *
 * Base de conocimiento: artículos de texto + manuales PDF con un solo buscador.
 * Los PDF se siguen subiendo desde /api/manuales; aquí solo se consultan.
 *
 * Exporta:
 *   listarConocimiento   GET    /api/conocimiento                 (autenticado)
 *   buscarConocimiento   GET    /api/conocimiento/buscar?q=       (autenticado)
 *   listarArticulos      GET    /api/conocimiento/articulos       (admin, con borradores y votos)
 *   obtenerArticulo      GET    /api/conocimiento/articulos/:id   (autenticado; borradores solo admin)
 *   crearArticulo        POST   /api/conocimiento/articulos       (admin)
 *   actualizarArticulo   PUT    /api/conocimiento/articulos/:id   (admin)
 *   eliminarArticulo     DELETE /api/conocimiento/articulos/:id   (admin)
 *   votarArticulo        POST   /api/conocimiento/articulos/:id/voto (autenticado)
 *   subirImagen          POST   /api/conocimiento/imagenes        (admin, campo "imagen")
 *
 * Regla de visibilidad: un usuario solo ve artículos publicados; el
 * administrador ve también los borradores (para revisarlos antes de publicar).
 *
 * @module server/controllers/conocimiento-controller
 * @requires ../services/conocimiento.js
 * @requires ../utils/busqueda-conocimiento.js
 * @requires ../utils/helpers.js
 */
import Conocimiento from '../services/conocimiento.js';
import { buscar } from '../utils/busqueda-conocimiento.js';
import { isProd } from '../utils/helpers.js';

const esAdmin = (req) => req.usuario?.id_rol === 1;
const idValido = (v) => { const n = parseInt(v, 10); return Number.isInteger(n) && n > 0 ? n : null; };
const fallo = (res, e, msg) => {
  if (e?.code === "ER_NO_REFERENCED_ROW_2") return res.status(400).json({ error: "La categoría elegida no existe" });
  console.error(`[conocimiento] ${msg}:`, e);
  return res.status(500).json({ error: isProd() ? msg : (e?.message || msg) });
};

/** Quita los campos internos del índice (texto normalizado y cuerpo completo). */
const publico = ({ _n, cuerpo, ...d }) => d;

/** Documentos que el usuario puede ver, con los filtros de tipo y categoría. */
function visibles(docs, req, { tipo = "todos", categoria } = {}) {
  const admin = esAdmin(req);
  return docs.filter(d =>
    (admin || d.publicado) &&
    (tipo === "todos" || d.tipo === tipo) &&
    (!categoria || d.id_categoria === categoria));
}

export const listarConocimiento = async (req, res) => {
  try {
    const { tipo, categoria } = req.queryValidado ?? {};
    const docs = visibles(await Conocimiento.indice(), req, { tipo, categoria })
      .map(publico)
      .sort((a, b) => new Date(b.fecha_cambio) - new Date(a.fecha_cambio));
    res.json(docs);
  } catch (e) { fallo(res, e, "Error al obtener la base de conocimiento"); }
};

export const buscarConocimiento = async (req, res) => {
  try {
    const { q, tipo, categoria, limite } = req.queryValidado ?? {};
    if (!q) return res.json({ q: "", resultados: [] });
    const docs = visibles(await Conocimiento.indice(), req, { tipo, categoria });
    res.json({ q, resultados: buscar(docs, q, { limite }) });
  } catch (e) { fallo(res, e, "Error al buscar"); }
};

export const listarArticulos = async (_req, res) => {
  try { res.json(await Conocimiento.listarArticulos({ incluirBorradores: true })); }
  catch (e) { fallo(res, e, "Error al obtener los artículos"); }
};

export const obtenerArticulo = async (req, res) => {
  const id = idValido(req.params.id);
  if (!id) return res.status(400).json({ error: "ID inválido" });
  try {
    const art = await Conocimiento.getArticulo(id, req.usuario?.id_empleado ?? null);
    // Un borrador "no existe" para quien no es administrador.
    if (!art || (!art.publicado && !esAdmin(req))) return res.status(404).json({ error: "Artículo no encontrado" });
    // Las vistas cuentan lecturas reales: las del administrador (que revisa o edita) no suman.
    if (!esAdmin(req)) { await Conocimiento.sumarVista(id); art.vistas += 1; }
    res.json(art);
  } catch (e) { fallo(res, e, "Error al obtener el artículo"); }
};

export const crearArticulo = async (req, res) => {
  try {
    const id = await Conocimiento.crearArticulo(req.body, req.usuario.id_empleado);
    res.status(201).json({ ok: true, articulo: await Conocimiento.getArticulo(id) });
  } catch (e) { fallo(res, e, "Error al guardar el artículo"); }
};

export const actualizarArticulo = async (req, res) => {
  const id = idValido(req.params.id);
  if (!id) return res.status(400).json({ error: "ID inválido" });
  try {
    const ok = await Conocimiento.actualizarArticulo(id, req.body, req.usuario.id_empleado);
    if (!ok) return res.status(404).json({ error: "Artículo no encontrado" });
    res.json({ ok: true, articulo: await Conocimiento.getArticulo(id) });
  } catch (e) { fallo(res, e, "Error al guardar el artículo"); }
};

export const eliminarArticulo = async (req, res) => {
  const id = idValido(req.params.id);
  if (!id) return res.status(400).json({ error: "ID inválido" });
  try {
    const ok = await Conocimiento.eliminarArticulo(id);
    if (!ok) return res.status(404).json({ error: "Artículo no encontrado" });
    res.json({ ok: true });
  } catch (e) { fallo(res, e, "Error al eliminar el artículo"); }
};

export const votarArticulo = async (req, res) => {
  const id = idValido(req.params.id);
  if (!id) return res.status(400).json({ error: "ID inválido" });
  try {
    const art = await Conocimiento.getArticulo(id);
    if (!art || (!art.publicado && !esAdmin(req))) return res.status(404).json({ error: "Artículo no encontrado" });
    res.json(await Conocimiento.votar(id, req.usuario.id_empleado, req.body.util));
  } catch (e) { fallo(res, e, "Error al registrar tu respuesta"); }
};

export const subirImagen = (req, res) => {
  res.status(201).json({ ok: true, url: `/storage/Conocimiento/${encodeURIComponent(req.file.filename)}` });
};
