// scripts/add_visible_publico.js
// Añade la columna visible_publico a la tabla insumo
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
  // Verificar si ya existe
  const [exists] = await pool.query(
    `SELECT COUNT(*) AS cnt FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = 'precision_helpdesk'
       AND TABLE_NAME = 'insumo'
       AND COLUMN_NAME = 'visible_publico'`
  );
  if (exists[0].cnt > 0) {
    console.log("La columna visible_publico ya existe.");
    return;
  }

  await pool.query(
    `ALTER TABLE insumo
     ADD COLUMN visible_publico TINYINT(1) NOT NULL DEFAULT 1 COMMENT '1 = visible al público, 0 = oculto' AFTER activo`
  );

  console.log("Columna visible_publico añadida exitosamente.");
}

main().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});
