/**
 * migrate.js
 *
 * Script de migraciones de base de datos.
 * Ejecutar manualmente antes de desplegar una nueva versión:
 *   node src/Backend/scripts/migrate.js
 *
 * Cada migración es idempotente: puede ejecutarse varias veces sin error.
 * Las migraciones se registran en la tabla `_migraciones` para no repetirlas.
 */
import pool   from "../Config/db.js";
import dotenv from "dotenv";
dotenv.config();

const MIGRACIONES = [
  {
    id: "001_aprobado_solicitud_insumo",
    sql: `ALTER TABLE solicitud_insumo
          ADD COLUMN IF NOT EXISTS aprobado TINYINT(1) NULL DEFAULT NULL`,
    fallback: async (conn) => {
      const [[{ cnt }]] = await conn.query(
        `SELECT COUNT(*) AS cnt FROM information_schema.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE()
           AND TABLE_NAME   = 'solicitud_insumo'
           AND COLUMN_NAME  = 'aprobado'`
      );
      if (cnt === 0)
        await conn.query(`ALTER TABLE solicitud_insumo ADD COLUMN aprobado TINYINT(1) NULL DEFAULT NULL`);
    },
  },
  {
    id: "002_indices_ticket",
    sql: `ALTER TABLE ticket
          ADD INDEX IF NOT EXISTS idx_ticket_estatus_fecha (estatus, fecha_subido),
          ADD INDEX IF NOT EXISTS idx_ticket_empleado_estatus (id_empleado, estatus)`,
    fallback: null,
  },
  {
    id: "003_indices_solicitud",
    sql: `ALTER TABLE solicitud
          ADD INDEX IF NOT EXISTS idx_solicitud_estatus_fecha (estatus, fecha),
          ADD INDEX IF NOT EXISTS idx_solicitud_empleado (id_empleado)`,
    fallback: null,
  },
  {
    id: "004_tabla_ticket_historial",
    sql: `CREATE TABLE IF NOT EXISTS ticket_historial (
            id_historial     INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            id_ticket        INT UNSIGNED NOT NULL,
            id_empleado      INT UNSIGNED NOT NULL,
            campo_cambiado   VARCHAR(60)  NOT NULL,
            valor_anterior   TEXT,
            valor_nuevo      TEXT,
            fecha            DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_th_ticket (id_ticket),
            INDEX idx_th_fecha  (fecha)
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
    fallback: null,
  },
  {
    id: "005_tabla_token_revocado",
    sql: `CREATE TABLE IF NOT EXISTS token_revocado (
            id_revocado INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            jti         VARCHAR(36)  NOT NULL UNIQUE,
            id_empleado INT UNSIGNED NOT NULL,
            expira_en   DATETIME     NOT NULL,
            INDEX idx_jti       (jti),
            INDEX idx_expira_en (expira_en)
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
    fallback: null,
  },
];

async function run() {
  const conn = await pool.getConnection();
  try {
    await conn.query(`
      CREATE TABLE IF NOT EXISTS _migraciones (
        id        VARCHAR(100) PRIMARY KEY,
        ejecutada DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    for (const m of MIGRACIONES) {
      const [[existe]] = await conn.query(
        "SELECT id FROM _migraciones WHERE id = ? LIMIT 1", [m.id]
      );
      if (existe) { console.log(`  ⏭  ${m.id} — ya aplicada`); continue; }
      try {
        await conn.query(m.sql);
      } catch (err) {
        if (m.fallback) {
          await m.fallback(conn);
        } else {
          console.warn(`  ⚠  ${m.id} — ${err.message} (ignorado)`);
        }
      }
      await conn.query("INSERT INTO _migraciones (id) VALUES (?)", [m.id]);
      console.log(`  ✅ ${m.id} — aplicada`);
    }
    console.log("\n✅ Migraciones completadas.");
  } finally {
    conn.release();
    await pool.end();
  }
}

run().catch(err => { console.error("❌ Error en migración:", err.message); process.exit(1); });
