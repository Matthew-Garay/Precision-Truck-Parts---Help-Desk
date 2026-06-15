import Categoria from "../Models/Categoria.js";

export const getCategorias = async (req, res) => {
  try {
    const categorias = await Categoria.getAll();
    res.json(categorias);
  } catch (err) {
    const detalle = process.env.NODE_ENV !== "production" ? { detalle: err.message } : {};
    res.status(500).json({ error: "Error al obtener categorías", ...detalle });
  }
};
