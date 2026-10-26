// scripts/check_insumo_schema.js
// Verifica la estructura de la tabla insumo
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
    `SELECT COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE, COLUMN_KEY, EXTRA
     FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = 'precision_helpdesk' AND TABLE_NAME = 'insumo'
     ORDER BY ORDINAL_POSITION`
  );

  console.log("Campos de insumo:\n");
  for (const r of rows) {
    console.log(
      `- ${r.COLUMN_NAME} | ${r.COLUMN_TYPE} | nullable: ${r.IS_NULLABLE} | key: ${r.COLUMN_KEY} | ${r.EXTRA}`
    );
  }

  // Verificar si ya existe la columna 'visible_publico' o similar
  const [exists] = await pool.query(
    `SELECT COUNT(*) AS cnt FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = 'precision_helpdesk'
       AND TABLE_NAME = 'insumo'
       AND COLUMN_NAME IN ('visible_publico', 'es_visible', 'publico', 'visible')`
  );
  const count = exists[0].cnt;
  console.log(`\nColumnas de visibilidad existentes: ${count}`);
}

main().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});
