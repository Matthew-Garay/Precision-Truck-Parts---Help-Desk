-- 003_salida_cambios.sql
-- Historial de correcciones a una salida interna (SAL-…).
--
-- Antes, corregir la fecha de una salida capturada mal se hacía directo en la
-- base de datos y no quedaba rastro. Ahora el administrador la corrige desde
-- el sistema (Inventario → historial de salidas → "Corregir fecha") y cada
-- cambio queda aquí: qué campo, valor anterior y nuevo, motivo, quién y cuándo.
--
-- Aplicar UNA vez:  mysql -u root -p precision_helpdesk < database/migraciones/003_salida_cambios.sql

CREATE TABLE IF NOT EXISTS `salida_cambio` (
  `id_cambio` int NOT NULL AUTO_INCREMENT,
  `id_salida` int NOT NULL,
  `campo` varchar(40) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Campo corregido (p. ej. fecha)',
  `valor_anterior` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `valor_nuevo` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `motivo` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `id_empleado` int DEFAULT NULL COMMENT 'Quién hizo la corrección',
  `fecha` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_cambio`),
  KEY `idx_sc_salida` (`id_salida`),
  KEY `fk_sc_empleado` (`id_empleado`),
  CONSTRAINT `fk_sc_salida` FOREIGN KEY (`id_salida`) REFERENCES `salida_interna` (`id_salida`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_sc_empleado` FOREIGN KEY (`id_empleado`) REFERENCES `empleado` (`id_empleado`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Correcciones hechas a salidas internas';
