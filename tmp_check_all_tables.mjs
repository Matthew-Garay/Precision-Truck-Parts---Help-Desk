import pool from "./server/config/db.js";

try {
  const [tables] = await pool.query("SHOW TABLES");
  console.log("Todas las tablas:", tables[0]);
  
  // Look for tables related to salida/salida interna
  const salidaTables = tables[0].filter(t => t.includes('salida') || t.includes('sal') || t.includes('solicitud'));
  console.log("Tablas relevantes:", salidaTables);
  
  // Check solicitud table structure
  if (tables[0].includes('solicitud')) {
    const [cols] = await pool.query("DESCRIBE solicitud");
    console.log("Columnas de solicitud:", cols);
  }
  
} catch (err) {
  console.error("Error:", err.message);
} finally {
  await pool.end();
}