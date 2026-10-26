// scripts/check_categoria_schema.js
import mysql from "mysql2/promise";

const pool = mysql.createPool({
  host: "localhost",
  port: 3306,
  user: "root",
  password: "@PrecisionTrucks123.",
  database: "precision_helpdesk",
  charset: "utf8mb4",
});

async function main() {
  const [rows] = await pool.query(
    `SELECT COLUMN_NAME, COLUMN_TYPE FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = 'precision_helpdesk' AND TABLE_NAME = 'categoria'
     ORDER BY ORDINAL_POSITION`
  );
  console.log("Campos de categoria:");
  for (const r of rows) {
    console.log(`- ${r.COLUMN_NAME} | ${r.COLUMN_TYPE}`);
  }
  // Check data
  const [data] = await pool.query("SELECT * FROM categoria LIMIT 5");
  console.log("\nDatos de categoria (muestra):");
  console.table(data);
  // Check insumo data
  const [insumos] = await pool.query("SELECT * FROM insumo LIMIT 10");
  console.log("\nDatos de insumo (muestra):");
  console.table(insumos);
  pool.end();
}

main().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});