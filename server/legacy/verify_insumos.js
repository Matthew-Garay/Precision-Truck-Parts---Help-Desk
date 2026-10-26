// scripts/verify_insumos.js
// Verifica los insumos existentes y la columna visible_publico
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
    `SELECT id_insumo, nombre, marca, stock, visible_publico, activo
     FROM insumo
     ORDER BY nombre
     LIMIT 10`
  );

  console.log("Insumos existentes:\n");
  for (const r of rows) {
    console.log(
      ` - ${r.id_insumo} | ${r.nombre} | ${r.marca} | stock: ${r.stock} | visible_publico: ${r.visible_publico} | activo: ${r.activo}`
    );
  }

  // Verificar que la consulta con visible_publico funciona
  const [rows2] = await pool.query(
    `SELECT COUNT(*) AS total,
            SUM(CASE WHEN visible_publico = 1 THEN 1 ELSE 0 END) AS visibles,
            SUM(CASE WHEN visible_publico = 0 THEN 1 ELSE 0 END) AS ocultos
     FROM insumo`
  );
  console.log("\nResumen de visibilidad:");
  console.log(` - Total: ${rows2[0].total}`);
  console.log(` - Visibles al público: ${rows2[0].visibles}`);
  console.log(` - Ocultos: ${rows2[0].ocultos}`);
}

main().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});
