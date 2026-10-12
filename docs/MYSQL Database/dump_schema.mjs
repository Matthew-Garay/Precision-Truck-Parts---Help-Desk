import pool from "./src/Backend/Config/db.js";

const DB = process.env.DB_NAME;
const out = [];
const log = s => out.push(s);

const [tabs] = await pool.query(
  `SELECT TABLE_NAME, TABLE_ROWS, ENGINE, TABLE_COMMENT
   FROM information_schema.TABLES
   WHERE TABLE_SCHEMA = ? AND TABLE_TYPE = 'BASE TABLE'
   ORDER BY TABLE_NAME`, [DB]);

for (const t of tabs) {
  log("\n==================================================");
  log(`TABLA: ${t.TABLE_NAME}  (engine=${t.ENGINE}, ~rows=${t.TABLE_ROWS})`);
  if (t.TABLE_COMMENT) log(`  comentario: ${t.TABLE_COMMENT}`);

  const [cols] = await pool.query(
    `SELECT COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE, COLUMN_DEFAULT,
            EXTRA, COLUMN_KEY, COLUMN_COMMENT
     FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?
     ORDER BY ORDINAL_POSITION`, [DB, t.TABLE_NAME]);
  log("  -- columnas:");
  for (const c of cols) {
    const parts = [`${c.COLUMN_NAME} ${c.COLUMN_TYPE}`];
    if (c.IS_NULLABLE === "NO") parts.push("NOT NULL");
    if (c.COLUMN_DEFAULT !== null) parts.push(`DEFAULT ${JSON.stringify(c.COLUMN_DEFAULT)}`);
    if (c.EXTRA) parts.push(`EXTRA=${c.EXTRA}`);
    if (c.COLUMN_KEY === "PRI") parts.push("[PK]");
    if (c.COLUMN_KEY === "UNI") parts.push("[UNI]");
    if (c.COLUMN_KEY === "MUL") parts.push("[IDX]");
    log("    " + parts.join(" "));
  }

  const [pk] = await pool.query(
    `SELECT COLUMN_NAME FROM information_schema.KEY_COLUMN_USAGE
     WHERE TABLE_SCHEMA=? AND TABLE_NAME=? AND CONSTRAINT_NAME='PRIMARY'
     ORDER BY ORDINAL_POSITION`, [DB, t.TABLE_NAME]);
  if (pk.length) log("  PRIMARY KEY: (" + pk.map(c=>c.COLUMN_NAME).join(", ") + ")");

  const [fk] = await pool.query(
    `SELECT k.CONSTRAINT_NAME, k.COLUMN_NAME,
            k.REFERENCED_TABLE_NAME, k.REFERENCED_COLUMN_NAME,
            r.DELETE_RULE, r.UPDATE_RULE
     FROM information_schema.KEY_COLUMN_USAGE k
     JOIN information_schema.REFERENTIAL_CONSTRAINTS r
       ON k.CONSTRAINT_SCHEMA=r.CONSTRAINT_SCHEMA AND k.CONSTRAINT_NAME=r.CONSTRAINT_NAME
     WHERE k.TABLE_SCHEMA=? AND k.TABLE_NAME=? AND k.REFERENCED_TABLE_NAME IS NOT NULL`, [DB, t.TABLE_NAME]);
  if (fk.length) {
    log("  -- foreign keys:");
    for (const f of fk)
      log(`    ${f.COLUMN_NAME} -> ${f.REFERENCED_TABLE_NAME}.${f.REFERENCED_COLUMN_NAME}  ON DELETE ${f.DELETE_RULE} ON UPDATE ${f.UPDATE_RULE}`);
  }

  const [idx] = await pool.query(
    `SELECT INDEX_NAME, NON_UNIQUE, GROUP_CONCAT(COLUMN_NAME ORDER BY SEQ_IN_INDEX) cols
     FROM information_schema.STATISTICS
     WHERE TABLE_SCHEMA=? AND TABLE_NAME=?
     GROUP BY INDEX_NAME, NON_UNIQUE ORDER BY INDEX_NAME`, [DB, t.TABLE_NAME]);
  if (idx.length) {
    log("  -- indices:");
    for (const i of idx) log(`    ${i.NON_UNIQUE==0?"UNIQUE":"INDEX"} ${i.INDEX_NAME} (${i.cols})`);
  }

  try {
    const [chk] = await pool.query(
      `SELECT CONSTRAINT_NAME, CHECK_CLAUSE FROM information_schema.CHECK_CONSTRAINTS
       WHERE CONSTRAINT_SCHEMA=? AND CONSTRAINT_NAME IN (
         SELECT CONSTRAINT_NAME FROM information_schema.TABLE_CONSTRAINTS
         WHERE TABLE_SCHEMA=? AND TABLE_NAME=? AND CONSTRAINT_TYPE='CHECK')`, [DB, DB, t.TABLE_NAME]);
    if (chk.length) {
      log("  -- checks:");
      for (const c of chk) log(`    ${c.CONSTRAINT_NAME}: ${c.CHECK_CLAUSE}`);
    }
  } catch {}
}

process.stdout.write(out.join("\n") + "\n");
process.exit(0);
