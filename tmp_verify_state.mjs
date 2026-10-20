import pool from "./server/config/db.js";

for (const t of ["empleado", "insumo"]) {
  const [ddl] = await pool.query(`SHOW CREATE TABLE \`${t}\``);
  console.log(`=== DDL ${t} ===`);
  console.log(ddl[0]["Create Table"]);
  console.log();
}

await pool.end();
