-- 007_normalizacion_fase3.sql
-- Fase 3 de docs/normalizacion-bd.md. Requiere el código del mismo commit.
--
--   1. salida_anulacion: la anulación de una salida es un hecho aparte (1:0..1).
--      Antes eran 4 columnas de salida_interna (estatus, motivo_anulacion,
--      fecha_anulacion, id_anulo) casi siempre en NULL y que dependían de
--      `estatus` (3FN). Ahora: si existe el renglón, la salida está anulada.
--      Además una salida ya no se puede anular dos veces (PK = id_salida).
--   2. Vista v_salida_interna: devuelve las salidas con `estatus`,
--      `motivo_anulacion`, `fecha_anulacion` e `id_anulo` como antes, para las
--      consultas de lectura.
--   3. Tipos unificados con el resto del esquema: IDs `int` (con signo) y fechas
--      `datetime`. Solo 2 IDs eran `int unsigned` y 7 fechas `timestamp`; se
--      llevan a lo que usan las demás tablas (no hay FK que apunten a esos IDs).
--      La conversión timestamp → datetime conserva la misma hora: la base y el
--      sistema usan la misma zona (SYSTEM = hora del centro de México).
--
-- Aplicar UNA vez:  npm run migrar -- database/migraciones/007_normalizacion_fase3.sql

-- ── 1. Anulaciones en su propia tabla ────────────────────────────────────────
CREATE TABLE salida_anulacion (
  id_salida  int NOT NULL                          COMMENT 'PK y FK salida_interna',
  motivo     varchar(500) NOT NULL                 COMMENT 'Por qué se anuló',
  id_anulo   int DEFAULT NULL                      COMMENT 'FK empleado: quién anuló',
  fecha      datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Cuándo se anuló',
  PRIMARY KEY (id_salida),
  KEY idx_anul_empleado (id_anulo),
  CONSTRAINT fk_anul_salida   FOREIGN KEY (id_salida) REFERENCES salida_interna (id_salida) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_anul_empleado FOREIGN KEY (id_anulo)  REFERENCES empleado (id_empleado)     ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT chk_anul_motivo  CHECK (CHAR_LENGTH(motivo) >= 5)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Anulación de una salida interna (si existe, la salida está anulada)';

INSERT INTO salida_anulacion (id_salida, motivo, id_anulo, fecha)
  SELECT id_salida,
         IF(CHAR_LENGTH(TRIM(IFNULL(motivo_anulacion, ''))) >= 5, motivo_anulacion, 'Sin motivo registrado'),
         id_anulo, IFNULL(fecha_anulacion, fecha_registro)
    FROM salida_interna
   WHERE estatus = 'Anulada';

ALTER TABLE salida_interna DROP FOREIGN KEY fk_sal_anulo;
ALTER TABLE salida_interna
  DROP KEY fk_sal_anulo,
  DROP COLUMN estatus,
  DROP COLUMN motivo_anulacion,
  DROP COLUMN fecha_anulacion,
  DROP COLUMN id_anulo;

-- ── 2. Vista de lectura con el estatus como antes ────────────────────────────
CREATE OR REPLACE VIEW v_salida_interna AS
SELECT s.*,
       -- COLLATE explícito: así compara igual sin importar la conexión que lo consulte.
       IF(a.id_salida IS NULL, 'Activa', 'Anulada') COLLATE utf8mb4_unicode_ci AS estatus,
       a.motivo   AS motivo_anulacion,
       a.fecha    AS fecha_anulacion,
       a.id_anulo AS id_anulo
  FROM salida_interna s
  LEFT JOIN salida_anulacion a ON a.id_salida = s.id_salida;

-- ── 3. Tipos unificados ──────────────────────────────────────────────────────
ALTER TABLE manual
  MODIFY id_manual    int NOT NULL AUTO_INCREMENT,
  MODIFY fecha_subida datetime NULL DEFAULT CURRENT_TIMESTAMP,
  MODIFY fecha_cambio datetime NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

ALTER TABLE ticket_historial
  MODIFY id_historial int NOT NULL AUTO_INCREMENT;

ALTER TABLE historial_acceso
  MODIFY fecha_entrada datetime NULL DEFAULT CURRENT_TIMESTAMP,
  MODIFY fecha_salida  datetime NULL DEFAULT NULL;

ALTER TABLE solicitud
  MODIFY fecha datetime NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE ticket
  MODIFY fecha_subido   datetime NULL DEFAULT CURRENT_TIMESTAMP,
  MODIFY fecha_resuelto datetime NULL DEFAULT NULL;
