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
    sql: null,
    fallback: async (conn) => {
      const [[{ c1 }]] = await conn.query(
        `SELECT COUNT(*) AS c1 FROM information_schema.STATISTICS
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ticket'
           AND INDEX_NAME = 'idx_ticket_estatus_fecha'`
      );
      if (c1 === 0)
        await conn.query(`ALTER TABLE ticket ADD INDEX idx_ticket_estatus_fecha (estatus, fecha_subido)`);
      const [[{ c2 }]] = await conn.query(
        `SELECT COUNT(*) AS c2 FROM information_schema.STATISTICS
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ticket'
           AND INDEX_NAME = 'idx_ticket_empleado_estatus'`
      );
      if (c2 === 0)
        await conn.query(`ALTER TABLE ticket ADD INDEX idx_ticket_empleado_estatus (id_empleado, estatus)`);
    },
  },
  {
    id: "003_indices_solicitud",
    sql: null,
    fallback: async (conn) => {
      const [[{ c1 }]] = await conn.query(
        `SELECT COUNT(*) AS c1 FROM information_schema.STATISTICS
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'solicitud'
           AND INDEX_NAME = 'idx_solicitud_estatus_fecha'`
      );
      if (c1 === 0)
        await conn.query(`ALTER TABLE solicitud ADD INDEX idx_solicitud_estatus_fecha (estatus, fecha)`);
      const [[{ c2 }]] = await conn.query(
        `SELECT COUNT(*) AS c2 FROM information_schema.STATISTICS
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'solicitud'
           AND INDEX_NAME = 'idx_solicitud_empleado'`
      );
      if (c2 === 0)
        await conn.query(`ALTER TABLE solicitud ADD INDEX idx_solicitud_empleado (id_empleado)`);
    },
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
  {
    id: "006_manual_version_subido_por",
    sql: `ALTER TABLE manual
          ADD COLUMN IF NOT EXISTS version    VARCHAR(20) NULL DEFAULT NULL AFTER descripcion,
          ADD COLUMN IF NOT EXISTS subido_por INT         NULL DEFAULT NULL AFTER version`,
    fallback: async (conn) => {
      const [[{ v }]] = await conn.query(
        `SELECT COUNT(*) AS v FROM information_schema.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'manual' AND COLUMN_NAME = 'version'`
      );
      if (v === 0)
        await conn.query(`ALTER TABLE manual ADD COLUMN version VARCHAR(20) NULL DEFAULT NULL AFTER descripcion`);
      const [[{ s }]] = await conn.query(
        `SELECT COUNT(*) AS s FROM information_schema.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'manual' AND COLUMN_NAME = 'subido_por'`
      );
      if (s === 0)
        await conn.query(`ALTER TABLE manual ADD COLUMN subido_por INT NULL DEFAULT NULL AFTER version`);
    },
  },
  {
    id: "007_fk_manual_empleado",
    sql: null,
    fallback: async (conn) => {
      const [[{ cnt }]] = await conn.query(
        `SELECT COUNT(*) AS cnt FROM information_schema.TABLE_CONSTRAINTS
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'manual'
           AND CONSTRAINT_NAME = 'fk_manual_empleado'`
      );
      if (cnt === 0)
        await conn.query(
          `ALTER TABLE manual ADD CONSTRAINT fk_manual_empleado
           FOREIGN KEY (subido_por) REFERENCES empleado(id_empleado) ON DELETE SET NULL`
        );
    },
  },
  {
    id: "008_tabla_manual_historial",
    sql: `CREATE TABLE IF NOT EXISTS manual_historial (
            id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            id_manual   INT UNSIGNED NOT NULL,
            id_empleado INT NULL,
            accion      ENUM('subida','edicion','reemplazo') NOT NULL DEFAULT 'subida',
            detalle     VARCHAR(255) NULL,
            fecha       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT fk_mh_manual   FOREIGN KEY (id_manual)   REFERENCES manual(id_manual)   ON DELETE CASCADE,
            CONSTRAINT fk_mh_empleado FOREIGN KEY (id_empleado) REFERENCES empleado(id_empleado) ON DELETE SET NULL,
            INDEX idx_mh_manual (id_manual)
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
    fallback: null,
  },
  {
    id: "009_descripcion_solicitud_insumo",
    sql: `ALTER TABLE solicitud_insumo
          ADD COLUMN IF NOT EXISTS descripcion TEXT NULL DEFAULT NULL`,
    fallback: async (conn) => {
      const [[{ cnt }]] = await conn.query(
        `SELECT COUNT(*) AS cnt FROM information_schema.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE()
           AND TABLE_NAME   = 'solicitud_insumo'
           AND COLUMN_NAME  = 'descripcion'`
      );
      if (cnt === 0)
        await conn.query(`ALTER TABLE solicitud_insumo ADD COLUMN descripcion TEXT NULL DEFAULT NULL`);
    },
  },
  {
    id: "010_solicitud_estatus_enum",
    sql: null,
    fallback: async (conn) => {
      // Ampliar el ENUM de solicitud.estatus para incluir Pendiente y Rechazado
      const [[{ col }]] = await conn.query(
        `SELECT COLUMN_TYPE AS col FROM information_schema.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE()
           AND TABLE_NAME   = 'solicitud'
           AND COLUMN_NAME  = 'estatus'`
      );
      const necesita = !col.includes("Pendiente") || !col.includes("Rechazado");
      if (necesita)
        await conn.query(
          `ALTER TABLE solicitud
           MODIFY COLUMN estatus
             ENUM('Pendiente','En proceso','Resuelto','No Resuelto','Rechazado')
             NOT NULL DEFAULT 'Pendiente'`
        );
    },
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
        if (m.sql) {
          await conn.query(m.sql);
        } else if (m.fallback) {
          await m.fallback(conn);
        }
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
