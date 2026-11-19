/**
 * aplicar-migracion.js — Aplica un archivo de database/migraciones con Node
 * (para equipos sin el cliente `mysql` en el PATH). Entiende DELIMITER, igual
 * que el cliente mysql, para poder crear disparadores.
 *
 * Uso:
 *   node --import ./server/load-env.js server/scripts/aplicar-migracion.js database/migraciones/005_integridad_fase1.sql
 *   ... --base otra_base     (aplica en otra base; útil para ensayar en una copia)
 *
 * Cada sentencia se ejecuta en orden; a la primera falla se detiene y dice cuál fue.
 * Haz un respaldo antes (npm run respaldar).
 */
import fs from "fs";
import mysql from "mysql2/promise";

export function sentencias(sql) {
  const out = [];
  let delim = ";", buf = "";
  for (const linea of sql.split(/\r?\n/)) {
    const m = linea.match(/^\s*DELIMITER\s+(\S+)\s*$/i);
    if (m) { delim = m[1]; continue; }
    if (/^\s*--/.test(linea) && !buf.trim()) continue;
    buf += linea + "\n";
    if (buf.trimEnd().endsWith(delim)) {
      const s = buf.trimEnd().slice(0, -delim.length).trim();
      if (s) out.push(s);
      buf = "";
    }
  }
  if (buf.trim()) out.push(buf.trim());
  return out;
}

if (process.argv[1]?.endsWith("aplicar-migracion.js")) {
  const archivo = process.argv[2];
  const i = process.argv.indexOf("--base");
  const base = i > 0 ? process.argv[i + 1] : process.env.DB_NAME;
  if (!archivo) { console.error("Indica el archivo .sql"); process.exit(1); }
  const lista = sentencias(fs.readFileSync(archivo, "utf8"));
  const c = await mysql.createConnection({
    host: process.env.DB_HOST, port: process.env.DB_PORT,
    user: process.env.DB_USER, password: process.env.DB_PASSWORD, database: base,
  });
  console.log(`Aplicando ${lista.length} sentencias de ${archivo} en ${base}…`);
  try {
    for (const [n, s] of lista.entries()) {
      try { await c.query(s); }
      catch (e) { console.error(`\n✖ Falló la sentencia ${n + 1}:\n${s.slice(0, 300)}\n→ ${e.code}: ${e.sqlMessage || e.message}`); process.exitCode = 1; break; }
    }
    if (!process.exitCode) console.log("✔ Migración aplicada.");
  } finally { await c.end(); }
}
