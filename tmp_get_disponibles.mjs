import pool from "./server/config/db.js";

try {
  const [rows] = await pool.query("SELECT * FROM insumo WHERE stock > 0");
  console.log("Insumnos con stock > 0:", rows.length);
  rows.forEach(i => console.log(" - id:", i.id_insumo, "nombre:", i.nombre, "stock:", i.stock, "categoria:", i.id_categoria));
} catch (err) {
  console.error("Error:", err.message);
} finally {
  await pool.end();
}