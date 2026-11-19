/**
 * copiar-base.js — Copia la base del .env (estructura, datos y disparadores) a
 * otra base, para ENSAYAR una migración con los datos reales sin tocarlos.
 *
 * Uso:
 *   node --import ./server/load-env.js server/scripts/copiar-base.js precision_ensayo_test
 *   node --import ./server/load-env.js server/scripts/copiar-base.js precision_ensayo_test --borrar
 *
 * Por seguridad el nombre destino debe terminar en "_test".
 */
import mysql from "mysql2/promise";

const ORIG = process.env.DB_NAME;
const COPIA = process.argv[2];
if (!COPIA || !/_test$/.test(COPIA) || COPIA === ORIG) {
  console.error("Indica una base destino que termine en _test (distinta de la real).");
  process.exit(1);
}
const limpiarVista = (sql) => sql
  .replace(/ALGORITHM=\w+ /, "")
  .replace(/DEFINER=`[^`]+`@`[^`]+` /, "")
  .replace(/SQL SECURITY DEFINER /, "");

const c = await mysql.createConnection({
  host: process.env.DB_HOST, port: process.env.DB_PORT,
  user: process.env.DB_USER, password: process.env.DB_PASSWORD, multipleStatements: true,
});
try {
  await c.query(`DROP DATABASE IF EXISTS \`${COPIA}\``);
  if (process.argv.includes("--borrar")) { console.log(`Base ${COPIA} borrada.`); process.exit(0); }
  await c.query(`CREATE DATABASE \`${COPIA}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
  const [tablas] = await c.query(
    "SELECT TABLE_NAME t FROM information_schema.TABLES WHERE TABLE_SCHEMA=? AND TABLE_TYPE='BASE TABLE'", [ORIG]);
  await c.query("SET FOREIGN_KEY_CHECKS=0");
  await c.query(`USE \`${COPIA}\``);
  for (const { t } of tablas) {
    const [[r]] = await c.query(`SHOW CREATE TABLE \`${ORIG}\`.\`${t}\``);
    await c.query(r["Create Table"]);
    // Columnas calculadas (GENERATED) no se copian: se recalculan solas.
    const [cols] = await c.query(
      "SELECT COLUMN_NAME n FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=? AND TABLE_NAME=? AND EXTRA NOT IN ('VIRTUAL GENERATED','STORED GENERATED') ORDER BY ORDINAL_POSITION",
      [ORIG, t]);
    const lista = cols.map(x => `\`${x.n}\``).join(",");
    await c.query(`INSERT INTO \`${t}\` (${lista}) SELECT ${lista} FROM \`${ORIG}\`.\`${t}\``);
  }
  const [vistas] = await c.query("SELECT TABLE_NAME t FROM information_schema.VIEWS WHERE TABLE_SCHEMA=?", [ORIG]);
  for (const { t } of vistas) {
    const [[r]] = await c.query(`SHOW CREATE VIEW \`${ORIG}\`.\`${t}\``);
    // La definición trae el nombre de la base original: se cambia por la copia.
    await c.query(limpiarVista(r["Create View"]).split(`\`${ORIG}\`.`).join(""));
  }
  const [trg] = await c.query("SELECT TRIGGER_NAME n FROM information_schema.TRIGGERS WHERE TRIGGER_SCHEMA=?", [ORIG]);
  for (const { n } of trg) {
    const [[r]] = await c.query(`SHOW CREATE TRIGGER \`${ORIG}\`.\`${n}\``);
    await c.query(r["SQL Original Statement"].replace(/CREATE DEFINER=`[^`]+`@`[^`]+` TRIGGER/, "CREATE TRIGGER"));
  }
  await c.query("SET FOREIGN_KEY_CHECKS=1");
  console.log(`Copia ${ORIG} → ${COPIA}: ${tablas.length} tablas, ${vistas.length} vista(s), ${trg.length} disparador(es).`);
} finally { await c.end(); }
