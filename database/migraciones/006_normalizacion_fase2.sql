-- 006_normalizacion_fase2.sql
-- Fase 2 de docs/normalizacion-bd.md. Requiere el código del mismo commit
-- (validación, insumos, categorías, aprobación de solicitudes y evidencias).
--
--   1. 'N/A' → NULL en insumo (texto vacío = sin dato).
--   2. categoria_ambito sustituye a en_tickets / en_insumos / en_manuales (1FN/4FN).
--   3. solicitud_insumo.aprobado deja de guardarse: pasa a columna CALCULADA a
--      partir de cantidad_aprobada (3FN: ya no puede contradecirla).
--   4. ticket_evidencia: registro en la base de los archivos de cada ticket (1FN).
--
-- Aplicar UNA vez:  npm run migrar -- database/migraciones/006_normalizacion_fase2.sql

-- ── 1. 'N/A' → NULL ──────────────────────────────────────────────────────────
UPDATE insumo SET num_serie   = NULL WHERE TRIM(num_serie)   IN ('N/A', '');
UPDATE insumo SET marca       = NULL WHERE TRIM(marca)       IN ('N/A', '');
UPDATE insumo SET modelo      = NULL WHERE TRIM(modelo)      IN ('N/A', '');
UPDATE insumo SET descripcion = NULL WHERE TRIM(descripcion) IN ('N/A', '');

-- ── 2. Ámbitos de categoría ──────────────────────────────────────────────────
CREATE TABLE categoria_ambito (
  id_categoria  int NOT NULL                              COMMENT 'FK categoria',
  ambito        enum('ticket','insumo','manual') NOT NULL COMMENT 'Módulo donde la categoría está disponible',
  PRIMARY KEY (id_categoria, ambito),
  KEY idx_ca_ambito (ambito),
  CONSTRAINT fk_ca_categoria FOREIGN KEY (id_categoria) REFERENCES categoria (id_categoria)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='En qué módulos se ofrece cada categoría (N:M categoría–ámbito)';

INSERT INTO categoria_ambito (id_categoria, ambito)
  SELECT id_categoria, 'ticket' FROM categoria WHERE en_tickets = 1
  UNION ALL SELECT id_categoria, 'insumo' FROM categoria WHERE en_insumos = 1
  UNION ALL SELECT id_categoria, 'manual' FROM categoria WHERE en_manuales = 1;

ALTER TABLE categoria
  DROP COLUMN en_tickets,
  DROP COLUMN en_insumos,
  DROP COLUMN en_manuales;

-- ── 3. aprobado calculado desde cantidad_aprobada ────────────────────────────
-- NULL = sin decidir · 0 = negado · >0 = aceptado. Antes de quitar la columna
-- se pasa a cantidad_aprobada lo que solo estaba en aprobado.
UPDATE solicitud_insumo SET cantidad_aprobada = 0 WHERE aprobado = 0 AND cantidad_aprobada IS NULL;
UPDATE solicitud_insumo SET cantidad_aprobada = cantidad WHERE aprobado = 1 AND (cantidad_aprobada IS NULL OR cantidad_aprobada = 0);
ALTER TABLE solicitud_insumo DROP COLUMN aprobado;
ALTER TABLE solicitud_insumo
  ADD COLUMN aprobado tinyint(1) GENERATED ALWAYS AS (
    CASE WHEN cantidad_aprobada IS NULL THEN NULL WHEN cantidad_aprobada > 0 THEN 1 ELSE 0 END
  ) VIRTUAL COMMENT 'Calculado: NULL sin decidir, 1 aceptado, 0 negado' AFTER cantidad_aprobada;

-- ── 4. Evidencias de tickets ─────────────────────────────────────────────────
CREATE TABLE ticket_evidencia (
  id_evidencia    int NOT NULL AUTO_INCREMENT            COMMENT 'PK',
  id_ticket       int NOT NULL                           COMMENT 'FK ticket',
  nombre_archivo  varchar(255) NOT NULL                  COMMENT 'Nombre dentro de storage/Evidencias_Tickets/<folio>/',
  tipo_mime       varchar(100) DEFAULT NULL              COMMENT 'image/jpeg, video/mp4…',
  tamano_bytes    int unsigned DEFAULT NULL              COMMENT 'Tamaño del archivo',
  id_subio        int DEFAULT NULL                       COMMENT 'FK empleado: quién lo subió',
  fecha_subida    datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Cuándo se subió',
  PRIMARY KEY (id_evidencia),
  UNIQUE KEY uq_evidencia_archivo (id_ticket, nombre_archivo),
  KEY idx_evidencia_subio (id_subio),
  CONSTRAINT fk_ev_ticket FOREIGN KEY (id_ticket) REFERENCES ticket (id_ticket)     ON DELETE CASCADE  ON UPDATE CASCADE,
  CONSTRAINT fk_ev_subio  FOREIGN KEY (id_subio)  REFERENCES empleado (id_empleado) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Archivos adjuntos (evidencias) de cada ticket';
