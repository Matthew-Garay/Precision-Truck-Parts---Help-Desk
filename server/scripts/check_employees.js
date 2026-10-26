// scripts/check_employees.js
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
  const [cols] = await pool.query(
    `SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'empleado' ORDER BY ORDINAL_POSITION`
  );
  console.log("empleado columns:", cols.map(c => c.COLUMN_NAME).join(", "));
  
  const [rows] = await pool.query("SELECT * FROM empleado LIMIT 10");
  console.table(rows);
  pool.end();
}

main().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});