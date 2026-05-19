/**
 * Script de migración — ejecutar UNA SOLA VEZ
 * Hashea todas las contraseñas en texto plano que aún no tienen formato bcrypt.
 *
 * Uso: node src/Backend/Scripts/migrarPasswordsHash.js
 */

import pool   from "../Config/db.js";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

dotenv.config();

const BCRYPT_PREFIX = "$2b$";

async function migrar() {
  const [empleados] = await pool.query("SELECT id_empleado, password FROM empleado");

  let migrados = 0;
  let omitidos = 0;

  for (const emp of empleados) {
    if (emp.password?.startsWith(BCRYPT_PREFIX)) {
      omitidos++;
      continue;
    }
    const hash = await bcrypt.hash(emp.password, 10);
    await pool.query("UPDATE empleado SET password = ? WHERE id_empleado = ?", [hash, emp.id_empleado]);
    console.log(`✅ Empleado ${emp.id_empleado} migrado`);
    migrados++;
  }

  console.log(`\nMigración completada: ${migrados} migrados, ${omitidos} ya tenían hash.`);
  await pool.end();
}

migrar().catch(err => {
  console.error("❌ Error en migración:", err.message);
  process.exit(1);
});
