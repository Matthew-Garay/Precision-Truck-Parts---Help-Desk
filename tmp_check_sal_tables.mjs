import pool from "./server/config/db.js";

try {
  const [tables] = await pool.query("SHOW TABLES LIKE ?", ["%sal%"]);
  console.log("Tablas con 'sal':", tables);
  
  // Check if salida_interna exists and has the folio
  if (tables[0].length > 0) {
    for (const table of tables[0]) {
      const [rows] = await pool.query("SELECT * FROM ?? WHERE folio = ?", [table, "SAL-202609-0001"]);
      console.log(`En tabla ${table}:`, rows.length);
      if (rows[0]) console.log("Datos:", rows[0]);
    }
  }
} catch (err) {
  console.error("Error:", err.message);
} finally {
  await pool.end();
}