// scripts/test_insumo_queries.js
import mysql from "mysql2/promise";
import dotenv from "dotenv";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

dotenv.config({
  path: resolve(dirname(fileURLToPath(import.meta.url)), "../.env"),
  quiet: true,
});

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

async function main() {
  console.log("=== Testing getAll() ===");
  try {
    const [rows] = await pool.query(
      `SELECT i.id_insumo AS id, i.num_serie AS codigo, i.nombre, i.descripcion, i.marca, i.modelo, i.stock, i.estado, i.id_categoria AS categoria_id, i.imagen_url, i.activo, i.visible_publico, c.nombre_categoria AS categoria_nombre FROM insumo i LEFT JOIN categoria c ON i.id_categoria = c.id_categoria ORDER BY i.nombre ASC`
    );
    console.log(`getAll() returned ${rows.length} rows`);
    if (rows.length > 0) console.log("First row:", JSON.stringify(rows[0], null, 2));
  } catch (err) {
    console.error("getAll() ERROR:", err.message);
  }

  console.log("\n=== Testing getDisponibles() ===");
  try {
    const [rows] = await pool.query(
      `SELECT i.id_insumo AS id, i.num_serie AS codigo, i.nombre, i.descripcion, i.marca, i.modelo, i.stock, i.estado, i.id_categoria AS categoria_id, i.imagen_url, i.activo, i.visible_publico, c.nombre_categoria AS categoria_nombre FROM insumo i LEFT JOIN categoria c ON i.id_categoria = c.id_categoria WHERE i.stock > 0 AND i.activo = 1 ORDER BY i.nombre ASC`
    );
    console.log(`getDisponibles() returned ${rows.length} rows`);
    if (rows.length > 0) console.log("First row:", JSON.stringify(rows[0], null, 2));
  } catch (err) {
    console.error("getDisponibles() ERROR:", err.message);
  }

  console.log("\n=== Stock distribution ===");
  const [stockDist] = await pool.query(
    `SELECT CASE WHEN stock > 0 THEN 'con stock' ELSE 'sin stock' END as grupo, COUNT(*) as total FROM insumo GROUP BY grupo`
  );
  console.table(stockDist);

  console.log("\n=== Activo distribution ===");
  const [activoDist] = await pool.query(
    `SELECT activo, COUNT(*) as total FROM insumo GROUP BY activo`
  );
  console.table(activoDist);

  pool.end();
}

main().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});