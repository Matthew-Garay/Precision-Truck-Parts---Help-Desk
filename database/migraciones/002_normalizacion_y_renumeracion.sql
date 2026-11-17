-- =============================================================================
--  002_normalizacion_y_renumeracion.sql  —  PrecisionTrucks HelpDesk
-- =============================================================================
--  REQUISITO: haber corrido antes 001_correccion_datos.sql.
--
--  Qué hace:
--   A. Crea `salida_interna`: cabecera normalizada de las salidas internas.
--      Antes folio, ruta, prioridad, solicitante, puesto, sucursal, número de
--      empleado y justificación se concatenaban en el texto de `motivo` de
--      CADA renglón del kardex (violaba la 1FN y repetía datos). Ahora:
--        salida_interna (1 fila por salida)  <──  movimiento_inventario.id_salida
--      Puesto, sucursal y número de empleado del solicitante ya no se copian:
--      se obtienen de `empleado` por JOIN (3FN).
--   B. Migra las salidas existentes leyendo su `motivo` y lo deja en NULL.
--   C. Quita de `motivo` el texto redundante "Entrega de material por
--      solicitud SOL-…" (el folio ya está en la solicitud ligada).
--   D. Agrega `fecha_registro` al kardex: `fecha` = fecha física (puede ser
--      retroactiva), `fecha_registro` = cuándo se capturó.
--   E. RENUMERA todas las tablas para que sus ids empiecen en 1 y sean
--      consecutivos, actualizando todas las referencias, y reinicia los
--      AUTO_INCREMENT.
--   F. Invalida TODAS las sesiones abiertas (los ids de empleado cambian:
--      un token viejo apuntaría a otra persona). Todos deben volver a entrar.
--
--  Si se corre dos veces se detiene en el primer paso (la tabla ya existe).
--
--  DESPUÉS DE CORRERLO: borra server/workers/alert_state.json y
--  server/workers/reset_tokens.json (guardan ids viejos) y reinicia el backend.
-- =============================================================================

SET NAMES utf8mb4;
SET @old_safe_updates := @@SQL_SAFE_UPDATES;
SET SQL_SAFE_UPDATES = 0;

-- ─────────────────────────────────────────────────────────────────────────────
-- A. Tabla salida_interna + columnas nuevas del kardex
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE salida_interna (
  id_salida           INT          NOT NULL AUTO_INCREMENT,
  folio_salida        VARCHAR(20)  NOT NULL,
  fecha               DATETIME     NOT NULL COMMENT 'Fecha y hora física de la salida',
  prioridad           ENUM('Baja','Media','Alta','Urgente') NOT NULL DEFAULT 'Media',
  id_sucursal_origen  INT          DEFAULT NULL,
  id_sucursal_destino INT          DEFAULT NULL,
  destino_texto       VARCHAR(200) DEFAULT NULL COMMENT 'Solo si el destino no es una sucursal registrada',
  id_solicitante      INT          DEFAULT NULL COMMENT 'Quién se lleva el material',
  solicitante_texto   VARCHAR(200) DEFAULT NULL COMMENT 'Solo si no es un empleado registrado',
  id_responsable      INT          DEFAULT NULL COMMENT 'Quién recibe en destino',
  responsable_texto   VARCHAR(200) DEFAULT NULL COMMENT 'Solo si no es un empleado registrado',
  justificacion       TEXT,
  id_registro         INT          DEFAULT NULL COMMENT 'Empleado que capturó la salida',
  fecha_registro      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id_salida),
  UNIQUE KEY uq_folio_salida (folio_salida),
  KEY idx_salida_fecha (fecha),
  KEY idx_salida_solicitante (id_solicitante),
  CONSTRAINT fk_sal_suc_origen  FOREIGN KEY (id_sucursal_origen)  REFERENCES sucursal (id_sucursal) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_sal_suc_destino FOREIGN KEY (id_sucursal_destino) REFERENCES sucursal (id_sucursal) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_sal_solicitante FOREIGN KEY (id_solicitante)      REFERENCES empleado (id_empleado) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_sal_responsable FOREIGN KEY (id_responsable)      REFERENCES empleado (id_empleado) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_sal_registro    FOREIGN KEY (id_registro)         REFERENCES empleado (id_empleado) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Cabecera de las salidas internas (folio SAL-YYYYMM-NNNN)';

ALTER TABLE movimiento_inventario
  ADD COLUMN id_salida      INT      DEFAULT NULL AFTER id_solicitud,
  ADD COLUMN fecha_registro DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP AFTER fecha,
  ADD CONSTRAINT fk_mi_salida FOREIGN KEY (id_salida) REFERENCES salida_interna (id_salida)
      ON DELETE RESTRICT ON UPDATE CASCADE;

-- Para lo ya capturado no se sabe la hora real de captura: se usa la fecha física.
UPDATE movimiento_inventario SET fecha_registro = fecha;

-- ─────────────────────────────────────────────────────────────────────────────
-- B. Migrar las salidas internas que hoy viven en `motivo`
--    Formato: "[SAL-202610-0002] Uso interno · Ruta: A → B · Hora: 12:53 ·
--              Prioridad: Media · Entrega: Nombre · Puesto: … · SucSol: … ·
--              NumEmp: … · Justificación: texto"
-- ─────────────────────────────────────────────────────────────────────────────
DROP TEMPORARY TABLE IF EXISTS _sal;
CREATE TEMPORARY TABLE _sal AS
SELECT m.id_movimiento,
       REGEXP_SUBSTR(m.motivo, 'SAL-[0-9]{6}-[0-9]{3,4}') AS folio,
       m.fecha, m.id_empleado, m.id_sucursal_origen, m.id_sucursal_destino,
       NULLIF(TRIM(IF(LOCATE('Prioridad: ', m.motivo) > 0,
         SUBSTRING_INDEX(SUBSTRING(m.motivo, LOCATE('Prioridad: ', m.motivo) + CHAR_LENGTH('Prioridad: ')), ' · ', 1), '')), '') AS prioridad,
       NULLIF(TRIM(IF(LOCATE('Entrega: ', m.motivo) > 0,
         SUBSTRING_INDEX(SUBSTRING(m.motivo, LOCATE('Entrega: ', m.motivo) + CHAR_LENGTH('Entrega: ')), ' · ', 1), '')), '') AS solicitante,
       NULLIF(TRIM(IF(LOCATE('Recibe: ', m.motivo) > 0,
         SUBSTRING_INDEX(SUBSTRING(m.motivo, LOCATE('Recibe: ', m.motivo) + CHAR_LENGTH('Recibe: ')), ' · ', 1), '')), '') AS responsable,
       NULLIF(TRIM(IF(LOCATE('Destino: ', m.motivo) > 0,
         SUBSTRING_INDEX(SUBSTRING(m.motivo, LOCATE('Destino: ', m.motivo) + CHAR_LENGTH('Destino: ')), ' · ', 1), '')), '') AS destino,
       -- La justificación es el último campo: se toma todo lo que sigue.
       -- Si no trae etiqueta, se toma el texto libre después de "Uso interno".
       NULLIF(TRIM(IF(LOCATE('Justificación: ', m.motivo) > 0,
         SUBSTRING(m.motivo, LOCATE('Justificación: ', m.motivo) + CHAR_LENGTH('Justificación: ')),
         TRIM(LEADING '·' FROM TRIM(SUBSTRING_INDEX(m.motivo, 'Uso interno', -1))))), '') AS justificacion
  FROM movimiento_inventario m
 WHERE m.tipo = 'Salida' AND m.id_solicitud IS NULL AND m.id_salida IS NULL
   AND m.motivo LIKE '[SAL-%';

INSERT INTO salida_interna
  (folio_salida, fecha, prioridad, id_sucursal_origen, id_sucursal_destino, destino_texto,
   solicitante_texto, responsable_texto, justificacion, id_registro, fecha_registro)
SELECT folio,
       MIN(fecha),
       COALESCE(MAX(IF(prioridad IN ('Baja','Media','Alta','Urgente'), prioridad, NULL)), 'Media'),
       MAX(id_sucursal_origen),
       MAX(id_sucursal_destino),
       IF(MAX(id_sucursal_destino) IS NULL, MAX(destino), NULL),
       MAX(solicitante),
       MAX(responsable),
       MAX(justificacion),
       MIN(id_empleado),
       MIN(fecha)
  FROM _sal
 WHERE folio IS NOT NULL
 GROUP BY folio
 ORDER BY MIN(fecha), MIN(id_movimiento);

-- Solicitante / responsable: si el nombre coincide con un empleado, se guarda
-- su id y se borra el texto (puesto, sucursal y número salen de `empleado`).
UPDATE salida_interna s
  JOIN empleado e
    ON REGEXP_REPLACE(TRIM(CONCAT(e.nombre,' ',e.ap_paterno,' ',IFNULL(e.ap_materno,''))), ' +', ' ')
     = REGEXP_REPLACE(TRIM(s.solicitante_texto), ' +', ' ')
   SET s.id_solicitante = e.id_empleado, s.solicitante_texto = NULL
 WHERE s.solicitante_texto IS NOT NULL;

UPDATE salida_interna s
  JOIN empleado e
    ON REGEXP_REPLACE(TRIM(CONCAT(e.nombre,' ',e.ap_paterno,' ',IFNULL(e.ap_materno,''))), ' +', ' ')
     = REGEXP_REPLACE(TRIM(s.responsable_texto), ' +', ' ')
   SET s.id_responsable = e.id_empleado, s.responsable_texto = NULL
 WHERE s.responsable_texto IS NOT NULL;

-- Ligar cada renglón del kardex con su cabecera y vaciar el motivo
UPDATE movimiento_inventario m
  JOIN _sal x            ON x.id_movimiento = m.id_movimiento
  JOIN salida_interna s  ON s.folio_salida  = x.folio
   SET m.id_salida = s.id_salida, m.motivo = NULL;

DROP TEMPORARY TABLE _sal;

-- Salidas que no se pudieron migrar (no deberían existir)
SELECT 'SALIDAS SIN MIGRAR' AS aviso, id_movimiento, motivo
  FROM movimiento_inventario
 WHERE tipo = 'Salida' AND id_solicitud IS NULL AND id_salida IS NULL;

-- ─────────────────────────────────────────────────────────────────────────────
-- C. Motivo redundante de las salidas por solicitud
-- ─────────────────────────────────────────────────────────────────────────────
UPDATE movimiento_inventario
   SET motivo = NULL
 WHERE id_solicitud IS NOT NULL AND motivo LIKE 'Entrega de material por solicitud %';

-- ─────────────────────────────────────────────────────────────────────────────
-- E. RENUMERACIÓN: ids consecutivos desde 1 en todas las tablas
--    Método por tabla:
--      1. tabla temporal  id_viejo -> id_nuevo  (ROW_NUMBER en orden de id)
--      2. se actualizan TODAS las columnas que apuntan a esa tabla
--      3. el id propio se mueve a +1,000,000 y luego al id nuevo (así nunca
--         choca con un id que todavía no se ha movido)
--    Con FOREIGN_KEY_CHECKS = 0 MySQL no dispara los ON UPDATE CASCADE: cada
--    referencia se actualiza explícitamente aquí.
-- ─────────────────────────────────────────────────────────────────────────────
SET FOREIGN_KEY_CHECKS = 0;
START TRANSACTION;

-- rol ------------------------------------------------------------------------
DROP TEMPORARY TABLE IF EXISTS _m;
CREATE TEMPORARY TABLE _m (old_id INT PRIMARY KEY, new_id INT NOT NULL)
  SELECT id_rol AS old_id, ROW_NUMBER() OVER (ORDER BY id_rol) AS new_id FROM rol;
UPDATE empleado t JOIN _m ON t.id_rol = _m.old_id SET t.id_rol = _m.new_id;
UPDATE rol SET id_rol = id_rol + 1000000 ORDER BY id_rol DESC;
UPDATE rol t JOIN _m ON t.id_rol = _m.old_id + 1000000 SET t.id_rol = _m.new_id;

-- departamento ---------------------------------------------------------------
DROP TEMPORARY TABLE IF EXISTS _m;
CREATE TEMPORARY TABLE _m (old_id INT PRIMARY KEY, new_id INT NOT NULL)
  SELECT id_departamento AS old_id, ROW_NUMBER() OVER (ORDER BY id_departamento) AS new_id FROM departamento;
UPDATE empleado t JOIN _m ON t.id_departamento = _m.old_id SET t.id_departamento = _m.new_id;
UPDATE departamento SET id_departamento = id_departamento + 1000000 ORDER BY id_departamento DESC;
UPDATE departamento t JOIN _m ON t.id_departamento = _m.old_id + 1000000 SET t.id_departamento = _m.new_id;

-- sucursal -------------------------------------------------------------------
DROP TEMPORARY TABLE IF EXISTS _m;
CREATE TEMPORARY TABLE _m (old_id INT PRIMARY KEY, new_id INT NOT NULL)
  SELECT id_sucursal AS old_id, ROW_NUMBER() OVER (ORDER BY id_sucursal) AS new_id FROM sucursal;
UPDATE empleado              t JOIN _m ON t.id_sucursal         = _m.old_id SET t.id_sucursal         = _m.new_id;
UPDATE solicitud             t JOIN _m ON t.id_sucursal_origen  = _m.old_id SET t.id_sucursal_origen  = _m.new_id;
UPDATE solicitud             t JOIN _m ON t.id_sucursal_destino = _m.old_id SET t.id_sucursal_destino = _m.new_id;
UPDATE movimiento_inventario t JOIN _m ON t.id_sucursal_origen  = _m.old_id SET t.id_sucursal_origen  = _m.new_id;
UPDATE movimiento_inventario t JOIN _m ON t.id_sucursal_destino = _m.old_id SET t.id_sucursal_destino = _m.new_id;
UPDATE salida_interna        t JOIN _m ON t.id_sucursal_origen  = _m.old_id SET t.id_sucursal_origen  = _m.new_id;
UPDATE salida_interna        t JOIN _m ON t.id_sucursal_destino = _m.old_id SET t.id_sucursal_destino = _m.new_id;
UPDATE sucursal SET id_sucursal = id_sucursal + 1000000 ORDER BY id_sucursal DESC;
UPDATE sucursal t JOIN _m ON t.id_sucursal = _m.old_id + 1000000 SET t.id_sucursal = _m.new_id;

-- categoria ------------------------------------------------------------------
DROP TEMPORARY TABLE IF EXISTS _m;
CREATE TEMPORARY TABLE _m (old_id INT PRIMARY KEY, new_id INT NOT NULL)
  SELECT id_categoria AS old_id, ROW_NUMBER() OVER (ORDER BY id_categoria) AS new_id FROM categoria;
UPDATE insumo t JOIN _m ON t.id_categoria = _m.old_id SET t.id_categoria = _m.new_id;
UPDATE ticket t JOIN _m ON t.id_categoria = _m.old_id SET t.id_categoria = _m.new_id;
UPDATE manual t JOIN _m ON t.id_categoria = _m.old_id SET t.id_categoria = _m.new_id;
UPDATE categoria SET id_categoria = id_categoria + 1000000 ORDER BY id_categoria DESC;
UPDATE categoria t JOIN _m ON t.id_categoria = _m.old_id + 1000000 SET t.id_categoria = _m.new_id;

-- empleado -------------------------------------------------------------------
DROP TEMPORARY TABLE IF EXISTS _m;
CREATE TEMPORARY TABLE _m (old_id INT PRIMARY KEY, new_id INT NOT NULL)
  SELECT id_empleado AS old_id, ROW_NUMBER() OVER (ORDER BY id_empleado) AS new_id FROM empleado;
UPDATE historial_acceso      t JOIN _m ON t.id_empleado     = _m.old_id SET t.id_empleado     = _m.new_id;
UPDATE manual                t JOIN _m ON t.subido_por      = _m.old_id SET t.subido_por      = _m.new_id;
UPDATE movimiento_inventario t JOIN _m ON t.id_empleado     = _m.old_id SET t.id_empleado     = _m.new_id;
UPDATE solicitud             t JOIN _m ON t.id_empleado     = _m.old_id SET t.id_empleado     = _m.new_id;
UPDATE solicitud             t JOIN _m ON t.observacion_por = _m.old_id SET t.observacion_por = _m.new_id;
UPDATE ticket                t JOIN _m ON t.id_empleado     = _m.old_id SET t.id_empleado     = _m.new_id;
UPDATE ticket                t JOIN _m ON t.id_tecnico      = _m.old_id SET t.id_tecnico      = _m.new_id;
UPDATE ticket_historial      t JOIN _m ON t.id_empleado     = _m.old_id SET t.id_empleado     = _m.new_id;
UPDATE salida_interna        t JOIN _m ON t.id_solicitante  = _m.old_id SET t.id_solicitante  = _m.new_id;
UPDATE salida_interna        t JOIN _m ON t.id_responsable  = _m.old_id SET t.id_responsable  = _m.new_id;
UPDATE salida_interna        t JOIN _m ON t.id_registro     = _m.old_id SET t.id_registro     = _m.new_id;
UPDATE empleado SET id_empleado = id_empleado + 1000000 ORDER BY id_empleado DESC;
UPDATE empleado t JOIN _m ON t.id_empleado = _m.old_id + 1000000 SET t.id_empleado = _m.new_id;

-- insumo ---------------------------------------------------------------------
DROP TEMPORARY TABLE IF EXISTS _m;
CREATE TEMPORARY TABLE _m (old_id INT PRIMARY KEY, new_id INT NOT NULL)
  SELECT id_insumo AS old_id, ROW_NUMBER() OVER (ORDER BY id_insumo) AS new_id FROM insumo;
UPDATE movimiento_inventario t JOIN _m ON t.id_insumo = _m.old_id SET t.id_insumo = _m.new_id;
UPDATE solicitud_insumo      t JOIN _m ON t.id_insumo = _m.old_id SET t.id_insumo = _m.new_id;
UPDATE insumo SET id_insumo = id_insumo + 1000000 ORDER BY id_insumo DESC;
UPDATE insumo t JOIN _m ON t.id_insumo = _m.old_id + 1000000 SET t.id_insumo = _m.new_id;

-- solicitud ------------------------------------------------------------------
DROP TEMPORARY TABLE IF EXISTS _m;
CREATE TEMPORARY TABLE _m (old_id INT PRIMARY KEY, new_id INT NOT NULL)
  SELECT id_solicitud AS old_id, ROW_NUMBER() OVER (ORDER BY id_solicitud) AS new_id FROM solicitud;
UPDATE solicitud_insumo      t JOIN _m ON t.id_solicitud = _m.old_id SET t.id_solicitud = _m.new_id;
UPDATE movimiento_inventario t JOIN _m ON t.id_solicitud = _m.old_id SET t.id_solicitud = _m.new_id;
UPDATE solicitud SET id_solicitud = id_solicitud + 1000000 ORDER BY id_solicitud DESC;
UPDATE solicitud t JOIN _m ON t.id_solicitud = _m.old_id + 1000000 SET t.id_solicitud = _m.new_id;

-- solicitud_insumo -----------------------------------------------------------
DROP TEMPORARY TABLE IF EXISTS _m;
CREATE TEMPORARY TABLE _m (old_id INT PRIMARY KEY, new_id INT NOT NULL)
  SELECT id_solicitud_insumo AS old_id, ROW_NUMBER() OVER (ORDER BY id_solicitud_insumo) AS new_id FROM solicitud_insumo;
UPDATE solicitud_insumo SET id_solicitud_insumo = id_solicitud_insumo + 1000000 ORDER BY id_solicitud_insumo DESC;
UPDATE solicitud_insumo t JOIN _m ON t.id_solicitud_insumo = _m.old_id + 1000000 SET t.id_solicitud_insumo = _m.new_id;

-- ticket ---------------------------------------------------------------------
DROP TEMPORARY TABLE IF EXISTS _m;
CREATE TEMPORARY TABLE _m (old_id INT PRIMARY KEY, new_id INT NOT NULL)
  SELECT id_ticket AS old_id, ROW_NUMBER() OVER (ORDER BY id_ticket) AS new_id FROM ticket;
UPDATE ticket_historial t JOIN _m ON t.id_ticket = _m.old_id SET t.id_ticket = _m.new_id;
UPDATE ticket SET id_ticket = id_ticket + 1000000 ORDER BY id_ticket DESC;
UPDATE ticket t JOIN _m ON t.id_ticket = _m.old_id + 1000000 SET t.id_ticket = _m.new_id;

-- ticket_historial -----------------------------------------------------------
DROP TEMPORARY TABLE IF EXISTS _m;
CREATE TEMPORARY TABLE _m (old_id INT PRIMARY KEY, new_id INT NOT NULL)
  SELECT id_historial AS old_id, ROW_NUMBER() OVER (ORDER BY id_historial) AS new_id FROM ticket_historial;
UPDATE ticket_historial SET id_historial = id_historial + 1000000 ORDER BY id_historial DESC;
UPDATE ticket_historial t JOIN _m ON t.id_historial = _m.old_id + 1000000 SET t.id_historial = _m.new_id;

-- salida_interna -------------------------------------------------------------
DROP TEMPORARY TABLE IF EXISTS _m;
CREATE TEMPORARY TABLE _m (old_id INT PRIMARY KEY, new_id INT NOT NULL)
  SELECT id_salida AS old_id, ROW_NUMBER() OVER (ORDER BY id_salida) AS new_id FROM salida_interna;
UPDATE movimiento_inventario t JOIN _m ON t.id_salida = _m.old_id SET t.id_salida = _m.new_id;
UPDATE salida_interna SET id_salida = id_salida + 1000000 ORDER BY id_salida DESC;
UPDATE salida_interna t JOIN _m ON t.id_salida = _m.old_id + 1000000 SET t.id_salida = _m.new_id;

-- movimiento_inventario (orden de captura) -----------------------------------
DROP TEMPORARY TABLE IF EXISTS _m;
CREATE TEMPORARY TABLE _m (old_id INT PRIMARY KEY, new_id INT NOT NULL)
  SELECT id_movimiento AS old_id, ROW_NUMBER() OVER (ORDER BY id_movimiento) AS new_id FROM movimiento_inventario;
UPDATE movimiento_inventario SET id_movimiento = id_movimiento + 1000000 ORDER BY id_movimiento DESC;
UPDATE movimiento_inventario t JOIN _m ON t.id_movimiento = _m.old_id + 1000000 SET t.id_movimiento = _m.new_id;

-- historial_acceso -----------------------------------------------------------
DROP TEMPORARY TABLE IF EXISTS _m;
CREATE TEMPORARY TABLE _m (old_id INT PRIMARY KEY, new_id INT NOT NULL)
  SELECT id_acceso AS old_id, ROW_NUMBER() OVER (ORDER BY id_acceso) AS new_id FROM historial_acceso;
UPDATE historial_acceso SET id_acceso = id_acceso + 1000000 ORDER BY id_acceso DESC;
UPDATE historial_acceso t JOIN _m ON t.id_acceso = _m.old_id + 1000000 SET t.id_acceso = _m.new_id;

-- manual ---------------------------------------------------------------------
DROP TEMPORARY TABLE IF EXISTS _m;
CREATE TEMPORARY TABLE _m (old_id INT PRIMARY KEY, new_id INT NOT NULL)
  SELECT id_manual AS old_id, ROW_NUMBER() OVER (ORDER BY id_manual) AS new_id FROM manual;
UPDATE manual SET id_manual = id_manual + 1000000 ORDER BY id_manual DESC;
UPDATE manual t JOIN _m ON t.id_manual = _m.old_id + 1000000 SET t.id_manual = _m.new_id;

DROP TEMPORARY TABLE IF EXISTS _m;

-- F. Cerrar todas las sesiones: ningún token anterior sigue siendo válido
SET @tv := (SELECT COALESCE(MAX(token_version), 0) + 1 FROM empleado);
UPDATE empleado SET token_version = @tv;

COMMIT;
SET FOREIGN_KEY_CHECKS = 1;

-- Reiniciar contadores: MySQL los ajusta a MAX(id) + 1
ALTER TABLE rol                   AUTO_INCREMENT = 1;
ALTER TABLE departamento          AUTO_INCREMENT = 1;
ALTER TABLE sucursal              AUTO_INCREMENT = 1;
ALTER TABLE categoria             AUTO_INCREMENT = 1;
ALTER TABLE empleado              AUTO_INCREMENT = 1;
ALTER TABLE insumo                AUTO_INCREMENT = 1;
ALTER TABLE solicitud             AUTO_INCREMENT = 1;
ALTER TABLE solicitud_insumo      AUTO_INCREMENT = 1;
ALTER TABLE ticket                AUTO_INCREMENT = 1;
ALTER TABLE ticket_historial      AUTO_INCREMENT = 1;
ALTER TABLE salida_interna        AUTO_INCREMENT = 1;
ALTER TABLE movimiento_inventario AUTO_INCREMENT = 1;
ALTER TABLE historial_acceso      AUTO_INCREMENT = 1;
ALTER TABLE manual                AUTO_INCREMENT = 1;

-- ─────────────────────────────────────────────────────────────────────────────
-- Verificación de integridad: todas deben salir VACÍAS
-- ─────────────────────────────────────────────────────────────────────────────
SELECT 'HUÉRFANO empleado->departamento' AS aviso, e.id_empleado FROM empleado e LEFT JOIN departamento d ON d.id_departamento = e.id_departamento WHERE d.id_departamento IS NULL
UNION ALL SELECT 'HUÉRFANO empleado->rol', e.id_empleado FROM empleado e LEFT JOIN rol r ON r.id_rol = e.id_rol WHERE r.id_rol IS NULL
UNION ALL SELECT 'HUÉRFANO empleado->sucursal', e.id_empleado FROM empleado e LEFT JOIN sucursal s ON s.id_sucursal = e.id_sucursal WHERE e.id_sucursal IS NOT NULL AND s.id_sucursal IS NULL
UNION ALL SELECT 'HUÉRFANO insumo->categoria', i.id_insumo FROM insumo i LEFT JOIN categoria c ON c.id_categoria = i.id_categoria WHERE c.id_categoria IS NULL
UNION ALL SELECT 'HUÉRFANO movimiento->insumo', m.id_movimiento FROM movimiento_inventario m LEFT JOIN insumo i ON i.id_insumo = m.id_insumo WHERE i.id_insumo IS NULL
UNION ALL SELECT 'HUÉRFANO movimiento->empleado', m.id_movimiento FROM movimiento_inventario m LEFT JOIN empleado e ON e.id_empleado = m.id_empleado WHERE m.id_empleado IS NOT NULL AND e.id_empleado IS NULL
UNION ALL SELECT 'HUÉRFANO movimiento->salida', m.id_movimiento FROM movimiento_inventario m LEFT JOIN salida_interna s ON s.id_salida = m.id_salida WHERE m.id_salida IS NOT NULL AND s.id_salida IS NULL
UNION ALL SELECT 'HUÉRFANO historial_acceso->empleado', h.id_acceso FROM historial_acceso h LEFT JOIN empleado e ON e.id_empleado = h.id_empleado WHERE e.id_empleado IS NULL
UNION ALL SELECT 'HUÉRFANO solicitud_insumo->insumo', si.id_solicitud_insumo FROM solicitud_insumo si LEFT JOIN insumo i ON i.id_insumo = si.id_insumo WHERE i.id_insumo IS NULL
UNION ALL SELECT 'DESCUADRE stock', i.id_insumo FROM insumo i
  JOIN movimiento_inventario m ON m.id_movimiento = (SELECT MAX(id_movimiento) FROM movimiento_inventario WHERE id_insumo = i.id_insumo)
 WHERE i.stock <> m.stock_nuevo;

SET SQL_SAFE_UPDATES = @old_safe_updates;

SELECT 'Migración 002 aplicada. Borra alert_state.json y reset_tokens.json y reinicia el backend.' AS resultado;
