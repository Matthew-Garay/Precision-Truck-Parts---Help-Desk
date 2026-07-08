-- Migration: manuales v2 — versión, subido_por, historial
-- Ejecutar una sola vez: mysql -u root -p precision_helpdesk < migration_manuales_v2.sql

ALTER TABLE manual
  ADD COLUMN version VARCHAR(20) NULL DEFAULT NULL AFTER descripcion,
  ADD COLUMN subido_por INT NULL DEFAULT NULL AFTER version,
  ADD CONSTRAINT fk_manual_empleado FOREIGN KEY (subido_por) REFERENCES empleado(id_empleado) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS manual_historial (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  id_manual     INT NOT NULL,
  id_empleado   INT NULL,
  accion        ENUM('subida','edicion','reemplazo') NOT NULL DEFAULT 'subida',
  detalle       VARCHAR(255) NULL,
  fecha         DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_mh_manual   FOREIGN KEY (id_manual)   REFERENCES manual(id_manual)   ON DELETE CASCADE,
  CONSTRAINT fk_mh_empleado FOREIGN KEY (id_empleado) REFERENCES empleado(id_empleado) ON DELETE SET NULL,
  INDEX idx_mh_manual (id_manual)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
