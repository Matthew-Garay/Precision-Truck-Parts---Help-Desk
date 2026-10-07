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
      // Ampliar el ENUM de solicitud.estatus SIN perder valores existentes.
      // Antes esta migracion sobrescribia el ENUM con una lista fija que NO
      // incluia 'Aceptado', lo que abortaba con "Data truncated for column
      // 'estatus'" en bases que ya tienen solicitudes aceptadas.
      // Ahora se parte de los valores actuales y solo se agregan los faltantes,
      // conservando el valor por defecto de la columna.
      const [[col]] = await conn.query(
        `SELECT COLUMN_TYPE AS col, COLUMN_DEFAULT AS def FROM information_schema.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE()
           AND TABLE_NAME   = 'solicitud'
           AND COLUMN_NAME  = 'estatus'`
      );
      const actuales = [...col.col.matchAll(/'((?:[^']|'')+)?'/g)].map(m => m[1]);
      const requeridos = ["Pendiente", "En proceso", "Aceptado", "Resuelto", "No Resuelto", "Rechazado"];
      const unidos = [...new Set([...actuales, ...requeridos])];
      const faltan = unidos.filter(v => !actuales.includes(v));
      if (!faltan.length) return;

      const lista = unidos.map(v => `'${v.replace(/'/g, "''")}'`).join(",");
      const def = actuales.includes(col.def) ? col.def : "En proceso";
      await conn.query(
        `ALTER TABLE solicitud
           MODIFY COLUMN estatus ENUM(${lista}) NOT NULL DEFAULT '${def}'`
      );
    },
  },
  {
    id: "011_cantidad_aprobada_solicitud_insumo",
    // Cantidad que el administrador acepta entregar (distinta de la solicitada).
    // NULL = aun no revisada. 0 = negado. Nunca modifica `cantidad`
    // para que la hoja pueda mostrar "solicitado vs aprobado".
    sql: null,
    fallback: async (conn) => {
      const [[{ cnt }]] = await conn.query(
        `SELECT COUNT(*) AS cnt FROM information_schema.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE()
           AND TABLE_NAME   = 'solicitud_insumo'
           AND COLUMN_NAME  = 'cantidad_aprobada'`
      );
      if (cnt === 0)
        await conn.query(`ALTER TABLE solicitud_insumo ADD COLUMN cantidad_aprobada INT NULL DEFAULT NULL AFTER cantidad`);
    },
  },
  {
    id: "012_solicitud_ruta_sucursales",
    // Ruta fisica del material: de que sucursal sale (origen) y a donde llega (destino).
    // La elige el administrador antes de aceptar la solicitud.
    sql: null,
    fallback: async (conn) => {
      const colExiste = async (col) => {
        const [[{ c }]] = await conn.query(
          `SELECT COUNT(*) AS c FROM information_schema.COLUMNS
           WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'solicitud' AND COLUMN_NAME = ?`, [col]
        );
        return c > 0;
      };
      const fkExiste = async (fk) => {
        const [[{ c }]] = await conn.query(
          `SELECT COUNT(*) AS c FROM information_schema.TABLE_CONSTRAINTS
           WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'solicitud' AND CONSTRAINT_NAME = ?`, [fk]
        );
        return c > 0;
      };
      const idxExiste = async (idx) => {
        const [[{ c }]] = await conn.query(
          `SELECT COUNT(*) AS c FROM information_schema.STATISTICS
           WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'solicitud' AND INDEX_NAME = ?`, [idx]
        );
        return c > 0;
      };
      if (!await colExiste("id_sucursal_origen"))
        await conn.query(`ALTER TABLE solicitud ADD COLUMN id_sucursal_origen INT NULL DEFAULT NULL`);
      if (!await colExiste("id_sucursal_destino"))
        await conn.query(`ALTER TABLE solicitud ADD COLUMN id_sucursal_destino INT NULL DEFAULT NULL`);
      if (!await fkExiste("fk_solicitud_sucursal_origen"))
        await conn.query(`ALTER TABLE solicitud ADD CONSTRAINT fk_solicitud_sucursal_origen
                          FOREIGN KEY (id_sucursal_origen) REFERENCES sucursal(id_sucursal) ON DELETE SET NULL`);
      if (!await fkExiste("fk_solicitud_sucursal_destino"))
        await conn.query(`ALTER TABLE solicitud ADD CONSTRAINT fk_solicitud_sucursal_destino
                          FOREIGN KEY (id_sucursal_destino) REFERENCES sucursal(id_sucursal) ON DELETE SET NULL`);
      if (!await idxExiste("idx_solicitud_ruta"))
        await conn.query(`ALTER TABLE solicitud ADD INDEX idx_solicitud_ruta (id_sucursal_origen, id_sucursal_destino)`);
    },
  },
  {
    id: "013_tabla_movimiento_inventario",
    // Entradas de material: toda entrada de material y toda salida por solicitud
    // queda registrada con su stock anterior/nuevo y su ruta de sucursales.
    sql: `CREATE TABLE IF NOT EXISTS movimiento_inventario (
            id_movimiento       INT AUTO_INCREMENT PRIMARY KEY,
            id_insumo           INT NOT NULL,
            tipo                ENUM('Entrada','Salida','Ajuste') NOT NULL,
            cantidad            INT NOT NULL,
            stock_anterior      INT NOT NULL DEFAULT 0,
            stock_nuevo         INT NOT NULL DEFAULT 0,
            id_sucursal_origen  INT NULL,
            id_sucursal_destino INT NULL,
            id_solicitud        INT NULL,
            id_empleado         INT NULL,
            motivo              VARCHAR(500) NULL,
            fecha               DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT fk_mi_insumo     FOREIGN KEY (id_insumo)           REFERENCES insumo(id_insumo)        ON DELETE CASCADE,
            CONSTRAINT fk_mi_solicitud  FOREIGN KEY (id_solicitud)        REFERENCES solicitud(id_solicitud)  ON DELETE SET NULL,
            CONSTRAINT fk_mi_suc_origen FOREIGN KEY (id_sucursal_origen)  REFERENCES sucursal(id_sucursal)    ON DELETE SET NULL,
            CONSTRAINT fk_mi_suc_dest   FOREIGN KEY (id_sucursal_destino) REFERENCES sucursal(id_sucursal)    ON DELETE SET NULL,
            CONSTRAINT fk_mi_empleado   FOREIGN KEY (id_empleado)         REFERENCES empleado(id_empleado)    ON DELETE SET NULL,
            INDEX idx_mi_insumo_fecha (id_insumo, fecha),
            INDEX idx_mi_tipo_fecha   (tipo, fecha),
            INDEX idx_mi_solicitud    (id_solicitud)
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
    fallback: null,
  },
  {
    id: "014_solicitud_fecha_atencion",
    // Fecha/hora en que el admin acepto o rechazo la solicitud (para la hoja impresa).
    sql: null,
    fallback: async (conn) => {
      const [[{ cnt }]] = await conn.query(
        `SELECT COUNT(*) AS cnt FROM information_schema.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE()
           AND TABLE_NAME   = 'solicitud'
           AND COLUMN_NAME  = 'fecha_atencion'`
      );
      if (cnt === 0)
        await conn.query(`ALTER TABLE solicitud ADD COLUMN fecha_atencion DATETIME NULL DEFAULT NULL`);
    },
  },
  // ── Limpieza de tablas y columnas sin uso ──────────────────────────
  // Todas son idempotentes: primero consultan information_schema y solo
  // borran si el objeto existe. Ninguna toca datos que se usen.
  {
    id: "015_quitar_tabla_manual_historial",
    // `manual_historial` se creo en la 008 pero ninguna consulta del sistema la
    // lee ni escribe (0 filas). Se elimina la tabla.
    sql: null,
    fallback: async (conn) => {
      const [[{ cnt }]] = await conn.query(
        `SELECT COUNT(*) AS cnt FROM information_schema.TABLES
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'manual_historial'`
      );
      if (cnt > 0)
        await conn.query(`DROP TABLE IF EXISTS manual_historial`);
    },
  },
  {
    id: "016_quitar_manual_version_subido_por",
    // `version` y `subido_por` quedaron sin uso: el frontend nunca los envia
    // y ninguna consulta los lee (0 filas con valor). Primero se suelta la FK
    // fk_manual_empleado porque depende de subido_por.
    sql: null,
    fallback: async (conn) => {
      const [fks] = await conn.query(
        `SELECT CONSTRAINT_NAME FROM information_schema.KEY_COLUMN_USAGE
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'manual'
           AND COLUMN_NAME = 'subido_por' AND REFERENCED_TABLE_NAME IS NOT NULL`
      );
      for (const fk of fks)
        await conn.query(`ALTER TABLE manual DROP FOREIGN KEY \`${fk.CONSTRAINT_NAME}\``);

      const [cols] = await conn.query(
        `SELECT COLUMN_NAME FROM information_schema.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'manual'
           AND COLUMN_NAME IN ('version', 'subido_por')`
      );
      for (const c of cols)
        await conn.query(`ALTER TABLE manual DROP COLUMN \`${c.COLUMN_NAME}\``);
    },
  },
  {
    id: "017_quitar_insumo_proveedor",
    // `insumo.proveedor` no lo usa ningun modulo: ya se quito del modelo, del
    // controller, del schema Zod y de los formularios. Los valores que se
    // tengan se respaldaron en backups/proveedor_backup_*.sql antes de aplicar.
    sql: null,
    fallback: async (conn) => {
      const [[{ cnt }]] = await conn.query(
        `SELECT COUNT(*) AS cnt FROM information_schema.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'insumo'
           AND COLUMN_NAME = 'proveedor'`
      );
      if (cnt > 0)
        await conn.query(`ALTER TABLE insumo DROP COLUMN proveedor`);
    },
  },
// ── Restauracion de manual_historial y manual.version/subido_por ────
  // Las migraciones 015 y 016 eliminaron estos objetos por estar vacios, pero
  // `manual_historial` forma parte del esquema oficial del proyecto: se
  // vuelve a crear con su definicion original (misma que la 008) y se restituyen
  // `manual.version` / `manual.subido_por` con su FK (mismas que la 006/007).
  // Todas son idempotentes: consultan information_schema antes de tocar algo.
  {
    id: "018_restaurar_manual_historial",
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
    id: "019_restaurar_manual_version_subido_por",
    // Primero las columnas; despues la FK, que depende de `subido_por`.
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

      // FK hacia empleado (idempotente)
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
// ── Limpieza de indices redundantes ───────────────────────────────────
  {
    id: "020_indice_token_revocado_sin_duplicado",
    // `token_revocado` tiene UNIQUE (jti) y ademas un indice no único
    // `idx_jti` sobre la MISMA columna. MySQL usa el UNIQUE para resolver
    // el SELECT ... WHERE jti = ?, asi que `idx_jti` solo ocupa disco y
    // encarece cada INSERT de logout. Se elimina.
    sql: null,
    fallback: async (conn) => {
      const [idx] = await conn.query(
        `SELECT INDEX_NAME FROM information_schema.STATISTICS
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'token_revocado'
           AND INDEX_NAME = 'idx_jti' LIMIT 1`
      );
      if (idx.length)
        await conn.query("ALTER TABLE token_revocado DROP INDEX `idx_jti`");
    },
  },
// ── Fuera token_revocado y manual_historial ─────────────────────────
  // El cierre de sesion deja de depender de una tabla de lista negra: ahora
  // `empleado.token_version` actua como contador de generacion. Al hacer
  // logout se incrementa y todos los JWT emitidos antes dejan de servir.
  // Ventajas sobre la tabla: sobrevive reinicios, sirve con varias instancias
  // y no acumula filas que purgar.
  {
    id: "021_logout_con_token_version",
    sql: `ALTER TABLE empleado
          ADD COLUMN IF NOT EXISTS token_version INT NOT NULL DEFAULT 0`,
    fallback: async (conn) => {
      const [[{ cnt }]] = await conn.query(
        `SELECT COUNT(*) AS cnt FROM information_schema.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'empleado'
           AND COLUMN_NAME = 'token_version'`
      );
      if (cnt === 0)
        await conn.query("ALTER TABLE empleado ADD COLUMN token_version INT NOT NULL DEFAULT 0");
    },
  },
  {
    id: "022_quitar_tabla_token_revocado",
    // Ya no se consulta en ningun lado: el contador `empleado.token_version`
    // reemplaza la lista negra de jti.
    sql: null,
    fallback: async (conn) => {
      const [[{ cnt }]] = await conn.query(
        `SELECT COUNT(*) AS cnt FROM information_schema.TABLES
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'token_revocado'`
      );
      if (cnt > 0)
        await conn.query(`DROP TABLE IF EXISTS token_revocado`);
    },
  },
  {
    id: "023_quitar_tabla_manual_historial",
    // Se.restore en la 018, pero ningun modulo la lee ni la escribe. Se retira.
    sql: null,
    fallback: async (conn) => {
      const [[{ cnt }]] = await conn.query(
        `SELECT COUNT(*) AS cnt FROM information_schema.TABLES
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'manual_historial'`
      );
      if (cnt > 0)
        await conn.query(`DROP TABLE IF EXISTS manual_historial`);
    },
  },
  {
    id: "024_correos_empleados_a_ptp",
    // Motivo: la politica corporativa (validarEmailCorporativo) solo admite
    // los dominios refividrio.com.mx, ptp.com.mx, megapartes.com.mx y
    // ebatruck.com.mx. Los 26 empleados que tenian @precisiontrucks.com
    // eran rechazados por POST /api/auth/recuperar y nunca recibian el codigo
    // de verificacion. Se les cambia el dominio a @ptp.com.mx conservando
    // intacta la parte local, para que el correo de recuperacion por Zoho
    // pueda entregarse.
    //
    // Es idempotente: si no quedan filas con el dominio anterior, no hace nada.
    // Es reversible: basta con restaurar el respaldo previo con restaurar.ps1
    // (no con un UPDATE inverso, porque ese tambien alcanzaria a los correos
    // @ptp.com.mx que ya existian antes de esta migracion).
    sql: null,
    fallback: async (conn) => {
      const DominioViejo = "@precisiontrucks.com";
      const DominioNuevo = "@ptp.com.mx";

      const [[{ pendientes }]] = await conn.query(
        "SELECT COUNT(*) AS pendientes FROM empleado WHERE email LIKE ?",
        [`%${DominioViejo}`]
      );
      if (pendientes === 0) {
        console.log(`     (sin filas con ${DominioViejo}, nada que hacer)`);
        return;
      }

      // El indice uq_email es UNIQUE. Se comprueba que ningun correo de
      // destino este ocupado; si lo estuviera, MySQL abortaria la sentencia
      // completa y la migracion se dejaria sin aplicar en vez de dejar
      // empleados a medias.
      const [[{ choques }]] = await conn.query(
        `SELECT COUNT(*) AS choques
           FROM empleado a
          WHERE a.email LIKE ?
            AND EXISTS (
              SELECT 1 FROM empleado b
               WHERE b.email = CONCAT(SUBSTRING_INDEX(a.email, '@', 1), ?)
            )`,
        [`%${DominioViejo}`, DominioNuevo]
      );
      if (choques > 0) {
        throw new Error(
          `${choques} correo(s) de destino ya existen. No se modifico nada; ` +
          `resuelve el conflicto antes de reintentar.`
        );
      }

      const [resultado] = await conn.query(
        `UPDATE empleado
            SET email = CONCAT(SUBSTRING_INDEX(email, '@', 1), ?)
          WHERE email LIKE ?`,
        [DominioNuevo, `%${DominioViejo}`]
      );

      console.log(
        `     ${resultado.affectedRows} correo(s): ${DominioViejo} → ${DominioNuevo}`
      );
    },
  },
  {
    id: "025_observaciones_por_insumo",
    // Observaciones que Soporte Tecnico o Administradores escriben sobre cada
    // insumo de una solicitud ("este filtro ya se agotó, pide el alternativo").
    // Son distintas de `descripcion`, que es el texto que escribe el solicitante.
    // Se guarda quien las escribio y cuando, para que quede trazabilidad.
    sql: `
      ALTER TABLE solicitud_insumo
        ADD COLUMN IF NOT EXISTS observaciones      TEXT    NULL,
        ADD COLUMN IF NOT EXISTS observaciones_por  INT     NULL,
        ADD COLUMN IF NOT EXISTS observaciones_fecha DATETIME NULL`,
    fallback: async (conn) => {
      const [[{ existe }]] = await conn.query(
        `SELECT COUNT(*) AS existe FROM information_schema.COLUMNS
          WHERE TABLE_SCHEMA = DATABASE()
            AND TABLE_NAME = 'solicitud_insumo'
            AND COLUMN_NAME = 'observaciones'`
      );
      if (existe > 0) return;

      await conn.query(
        `ALTER TABLE solicitud_insumo
           ADD COLUMN observaciones      TEXT    NULL,
           ADD COLUMN observaciones_por  INT     NULL,
           ADD COLUMN observaciones_fecha DATETIME NULL`
      );

      // La FK se agrega aparte: MySQL no admite ADD CONSTRAINT IF NOT EXISTS y
      // falla si ya existe, pero solo se llega aqui con la columna recien creada.
      const [[{ fk }]] = await conn.query(
        `SELECT COUNT(*) AS fk FROM information_schema.TABLE_CONSTRAINTS
          WHERE TABLE_SCHEMA = DATABASE()
            AND TABLE_NAME = 'solicitud_insumo'
            AND CONSTRAINT_NAME = 'fk_solicitud_insumo_obs_por'`
      );
      if (fk === 0)
        await conn.query(
          `ALTER TABLE solicitud_insumo
             ADD CONSTRAINT fk_solicitud_insumo_obs_por
             FOREIGN KEY (observaciones_por) REFERENCES empleado(id_empleado)
             ON DELETE SET NULL`
        );
    },
  },
  {
    id: "026_estado_insumo_danado",
    // Agrega "Dañado" al estado del insumo. MySQL no admite ALTER ... ADD VALUE
    // en un ENUM, asi que hay que redeclarar la columna completa. Se conservan
    // NULL, DEFAULT y la colacion originales para no tocar los datos existentes.
    // El caracter se escribe como \u00f1 para que el valor que llega a MySQL sea
    // exactamente "Dañado" (utf8mb4) sin depender de la codificacion del archivo.
    // CHARACTER SET/COLLATE va justo despues del tipo: MySQL no lo acepta tras
    // DEFAULT NULL.
    sql: `
      ALTER TABLE insumo
        MODIFY COLUMN estado ENUM('Excelente','Bueno','Regular','Malo','Da\u00f1ado')
               CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
               NULL DEFAULT NULL`,
    fallback: async (conn) => {
      const [[{ columna }]] = await conn.query(
        `SELECT COLUMN_TYPE AS columna FROM information_schema.COLUMNS
          WHERE TABLE_SCHEMA = DATABASE()
            AND TABLE_NAME = 'insumo' AND COLUMN_NAME = 'estado'`
      );
      if (String(columna).includes("'Da\u00f1ado'")) return;

      await conn.query(
        `ALTER TABLE insumo
           MODIFY COLUMN estado ENUM('Excelente','Bueno','Regular','Malo','Da\u00f1ado')
                  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
                  NULL DEFAULT NULL`
      );
    },
  },

  {
    id: "027_insumo_activo",
    // Baja lógica de insumos: 1 = activo (default), 0 = inhabilitado.
    // Los inhabilitados se ocultan de Salidas/solicitudes pero se conservan
    // para el historial. El borrado físico sigue existiendo (DELETE) solo
    // cuando no hay movimientos ni solicitudes que lo referencien.
    sql: `ALTER TABLE insumo ADD COLUMN activo TINYINT(1) NOT NULL DEFAULT 1`,
    fallback: async (conn) => {
      const [[{ cnt }]] = await conn.query(
        `SELECT COUNT(*) AS cnt FROM information_schema.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE()
           AND TABLE_NAME   = 'insumo'
           AND COLUMN_NAME  = 'activo'`
      );
      if (cnt === 0)
        await conn.query(`ALTER TABLE insumo ADD COLUMN activo TINYINT(1) NOT NULL DEFAULT 1`);
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
