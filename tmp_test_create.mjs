import pool from "./server/config/db.js";
import Insumo from "./server/services/insumo.js";

try {
  // Test: try to create an insumo with the data the user provided
  const data = {
    num_serie: "61",
    nombre: "Regulador Smartbitt AVR2200",
    descripcion: "Descripcion opcional...",
    marca: "Smartbitt",
    modelo: "AVR2200",
    stock: 1,
    estado: "Bueno",
    id_categoria: 13, // Accesorios de Energía
    visible_publico: 1,
  };
  
  console.log("Datos a insertar:", JSON.stringify(data, null, 2));
  
  const id = await Insumo.crear(data);
  console.log("Insumo creado con ID:", id);
} catch (err) {
  console.error("ERROR al crear insumo:", err.message);
  if (err.sqlMessage) console.error("sqlMessage:", err.sqlMessage);
  if (err.errno) console.error("errno:", err.errno);
  if (err.sqlState) console.error("sqlState:", err.sqlState);
} finally {
  await pool.end();
}