// scripts/fix_insumo_marca.js (ES module)
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
    `SELECT id_insumo, nombre, marca, descripcion
     FROM insumo
     WHERE marca LIKE '%HP%' OR marca LIKE '%hp%'
     ORDER BY id_insumo`
  );

  console.log(`Total insumos con 'HP' en marca: ${rows.length}\n`);

  for (const row of rows) {
    console.log(`- ${row.id_insumo} | ${row.nombre} | ${row.marca}`);
  }

  const [updateResult] = await pool.query(
    `UPDATE insumo
     SET marca = 'Hewlett Packard'
     WHERE marca LIKE '%HP%' OR marca LIKE '%hp%'`,
    []
  );

  console.log(`\nActualizados: ${updateResult.affectedRows} filas.`);
}

main().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});

