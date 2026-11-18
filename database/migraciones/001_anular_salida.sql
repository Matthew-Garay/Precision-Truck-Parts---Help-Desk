-- 001_anular_salida.sql
-- Permite ANULAR una salida interna (SAL-…) registrada por error.
--
-- La salida no se borra: queda marcada como 'Anulada' con quién, cuándo y por
-- qué. El stock se regresa con un movimiento de tipo 'Entrada' por cada
-- renglón, ligado a la misma salida (id_salida), así el kardex sigue cuadrando.
--
-- Aplicar UNA vez:  mysql -u root -p precision_helpdesk < database/migraciones/001_anular_salida.sql

ALTER TABLE `salida_interna`
  ADD COLUMN `estatus` enum('Activa','Anulada') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Activa' AFTER `justificacion`,
  ADD COLUMN `motivo_anulacion` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL AFTER `estatus`,
  ADD COLUMN `fecha_anulacion` datetime DEFAULT NULL AFTER `motivo_anulacion`,
  ADD COLUMN `id_anulo` int DEFAULT NULL COMMENT 'Empleado que anuló la salida' AFTER `fecha_anulacion`,
  ADD KEY `fk_sal_anulo` (`id_anulo`),
  ADD CONSTRAINT `fk_sal_anulo` FOREIGN KEY (`id_anulo`) REFERENCES `empleado` (`id_empleado`) ON DELETE SET NULL ON UPDATE CASCADE;
