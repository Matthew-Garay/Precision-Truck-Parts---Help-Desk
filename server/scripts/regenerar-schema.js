/**
 * regenerar-schema.js — Reescribe database/schema.sql (solo estructura) desde
 * una base: tablas en orden alfabético y disparadores en bloque DELIMITER.
 * Las pruebas automáticas crean su base desde ese archivo.
 *
 * Uso (normalmente desde la copia de ensayo ya migrada):
 *   node --import ./server/load-env.js server/scripts/regenerar-schema.js precision_ensayo_test "006"
 *   (el segundo argumento es la última migración incluida, para la cabecera)
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import mysql from "mysql2/promise";

const BASE = process.argv[2] || process.env.DB_NAME;
const ULTIMA = process.argv[3] || "?";
const RUTA = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../database/schema.sql");
const hoy = new Date();
const fecha = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, "0")}-${String(hoy.getDate()).padStart(2, "0")}`;

const c = await mysql.createConnection({
  host: process.env.DB_HOST, port: process.env.DB_PORT,
  user: process.env.DB_USER, password: process.env.DB_PASSWORD, database: BASE,
});
try {
  const cabecera = `-- =============================================================================
--  ESQUEMA (solo estructura, sin datos)
--  PrecisionTrucks HelpDesk — regenerado ${fecha} con server/scripts/regenerar-schema.js
--  desde la base con las migraciones hasta la ${ULTIMA} aplicadas.
--  No editar a mano: los cambios van en database/migraciones/NNN_*.sql.
-- =============================================================================

CREATE DATABASE IF NOT EXISTS \`precision_helpdesk\` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE \`precision_helpdesk\`;

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
`;
  const pie = `
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
`;
  const [tablas] = await c.query(
    "SELECT TABLE_NAME t FROM information_schema.TABLES WHERE TABLE_SCHEMA=? AND TABLE_TYPE='BASE TABLE' ORDER BY TABLE_NAME", [BASE]);
  let cuerpo = "";
  for (const { t } of tablas) {
    const [[r]] = await c.query(`SHOW CREATE TABLE \`${t}\``);
    cuerpo += `\nDROP TABLE IF EXISTS \`${t}\`;\n${r["Create Table"].replace(/ AUTO_INCREMENT=\d+/, "")};\n`;
  }
  const [trg] = await c.query("SELECT TRIGGER_NAME n FROM information_schema.TRIGGERS WHERE TRIGGER_SCHEMA=? ORDER BY 1", [BASE]);
  let disparadores = "";
  for (const { n } of trg) {
    const [[r]] = await c.query(`SHOW CREATE TRIGGER \`${n}\``);
    const sql = r["SQL Original Statement"].replace(/CREATE DEFINER=`[^`]+`@`[^`]+` TRIGGER/, "CREATE TRIGGER");
    disparadores += `\nDROP TRIGGER IF EXISTS \`${n}\`;\nDELIMITER //\n${sql}//\nDELIMITER ;\n`;
  }
  // Los disparadores van al FINAL (las pruebas cortan el archivo en el primer DELIMITER).
  fs.writeFileSync(RUTA, cabecera + cuerpo + pie + (disparadores ? "\n-- ── Disparadores ──" + disparadores : ""));
  console.log(`schema.sql: ${tablas.length} tablas, ${trg.length} disparador(es).`);
} finally { await c.end(); }
