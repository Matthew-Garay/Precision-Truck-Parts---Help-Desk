import dotenv from "dotenv";
import { createPool } from "mysql2/promise";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

// Load environment variables
dotenv.config({ path: resolve(dirname(fileURLToPath(import.meta.url)), ".env") });

const pool = createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

async function run() {
  const sql = `
SET SQL_SAFE_UPDATES = 0;

UPDATE movimiento_inventario
SET motivo = REPLACE(motivo, 'Entrega de proveedor de Alejandro Vera', 'Entrega de proveedor de Jose Alejandro Vera Atilano')
WHERE motivo LIKE '%Entrega de proveedor de Alejandro Vera%';

SET SQL_SAFE_UPDATES = 1;
`;

  try {
    const [result] = await pool.query(sql);
    console.log("Update result:", result);
    console.log("Affected rows:", result.affectedRows);
  } catch (err) {
    console.error("Error:", err.message);
  } finally {
    await pool.end();
  }
}

run();