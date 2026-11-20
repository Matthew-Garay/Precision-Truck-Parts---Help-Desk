-- 009_insumo_unidad.sql
-- Fase 4 de docs/normalizacion-bd.md: equipos pieza por pieza con número de serie.
--
-- `insumo` es un TIPO de artículo con `stock`; el número de serie es de cada
-- PIEZA. Para los insumos que se controlan por pieza (laptops, impresoras,
-- lectores…) cada pieza es un renglón de insumo_unidad.
--
--   insumo.control_serie = 1  → stock = piezas en almacén; las entradas piden
--                               las series, las salidas internas piden elegir
--                               cuáles salen, y las solicitudes aceptadas toman
--                               las que llevan más tiempo en almacén.
--   insumo.control_serie = 0  → todo funciona como antes (no cambia nada).
--
-- Al aplicar, ningún insumo queda con control por pieza: se activa por insumo
-- desde su detalle, capturando la serie de cada pieza en existencia.
--
-- Aplicar UNA vez:  npm run migrar -- database/migraciones/009_insumo_unidad.sql

ALTER TABLE insumo
  ADD COLUMN control_serie tinyint(1) NOT NULL DEFAULT 0
    COMMENT '1 = se controla pieza por pieza con número de serie (insumo_unidad)' AFTER etiqueta;

CREATE TABLE insumo_unidad (
  id_unidad       int NOT NULL AUTO_INCREMENT                 COMMENT 'PK',
  id_insumo       int NOT NULL                                COMMENT 'FK insumo (tipo de artículo)',
  num_serie       varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Número de serie de esta pieza',
  estado          enum('Excelente','Bueno','Regular','Malo','Dañado') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Bueno' COMMENT 'Condición de esta pieza',
  en_almacen      tinyint(1) NOT NULL DEFAULT 1               COMMENT '1 = en inventario, 0 = ya salió',
  id_mov_entrada  int DEFAULT NULL                            COMMENT 'FK movimiento_inventario con el que entró (NULL = alta inicial)',
  id_mov_salida   int DEFAULT NULL                            COMMENT 'FK movimiento_inventario con el que salió',
  fecha_alta      datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Cuándo se registró la pieza',
  PRIMARY KEY (id_unidad),
  UNIQUE KEY uq_unidad_serie (id_insumo, num_serie),
  KEY idx_unidad_disponibles (id_insumo, en_almacen, fecha_alta),
  KEY idx_unidad_entrada (id_mov_entrada),
  KEY idx_unidad_salida (id_mov_salida),
  CONSTRAINT fk_unidad_insumo  FOREIGN KEY (id_insumo)      REFERENCES insumo (id_insumo)                    ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT fk_unidad_entrada FOREIGN KEY (id_mov_entrada) REFERENCES movimiento_inventario (id_movimiento) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT fk_unidad_salida  FOREIGN KEY (id_mov_salida)  REFERENCES movimiento_inventario (id_movimiento) ON DELETE RESTRICT ON UPDATE RESTRICT,
  -- En almacén ⇔ sin movimiento de salida.
  CONSTRAINT chk_unidad_almacen CHECK ((en_almacen = 1 AND id_mov_salida IS NULL) OR (en_almacen = 0 AND id_mov_salida IS NOT NULL)),
  CONSTRAINT chk_unidad_serie   CHECK (CHAR_LENGTH(TRIM(num_serie)) > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Piezas individuales (con número de serie) de los insumos con control_serie = 1';
