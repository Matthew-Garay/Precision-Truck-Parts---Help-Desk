/**
 * categoriasController.js
 *
 * Controlador encargado de exponer el catalogo de categorias del sistema.
 *
 * Las categorias son usadas tanto por los tickets de soporte como por los
 * manuales de incidencias y los insumos del inventario para clasificarlos.
 *
 * Funciones exportadas:
 *
 *   getCategorias
 *     Consulta el modelo Categoria y retorna la lista completa de categorias
 *     ordenada por id. En caso de error solo incluye el mensaje de detalle
 *     cuando el entorno no es produccion, para no exponer informacion interna.
 */
import Categoria from "../Models/Categoria.js";

export const getCategorias = async (req, res) => {
  try {
    const { tipo } = req.query;
    const TIPOS_VALIDOS = new Set(["ticket", "insumo", "manual"]);
    const categorias = TIPOS_VALIDOS.has(tipo)
      ? await Categoria.getByTipo(tipo)
      : await Categoria.getAll();
    res.json(categorias);
  } catch (err) {
    const detalle = process.env.NODE_ENV !== "production" ? { detalle: err.message } : {};
    res.status(500).json({ error: "Error al obtener categorías", ...detalle });
  }
};
