import Categoria from "../Models/Categoria.js";

export const getCategorias = async (req, res) => {
  try {
    const categorias = await Categoria.getAll();
    res.json(categorias);
  } catch (err) {
    res.status(500).json({ error: "Error al obtener categorías", detalle: err.message });
  }
};
