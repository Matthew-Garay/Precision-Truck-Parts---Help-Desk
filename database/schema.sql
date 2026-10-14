-- ============================================================
-- PrecisionTrucks HelpDesk  ·  precision_helpdesk
-- Dump generado desde el esquema y los datos reales del servidor
-- 2026-10-01T19:51:12.600Z
-- Tablas: 14
-- ============================================================

CREATE SCHEMA IF NOT EXISTS `precision_helpdesk`
  DEFAULT CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
USE `precision_helpdesk`;

SET FOREIGN_KEY_CHECKS=0;
SET SQL_MODE="NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "-06:00";


-- ---------------------------------------------------------
-- Tabla: _migraciones
-- ---------------------------------------------------------
DROP TABLE IF EXISTS `_migraciones`;
CREATE TABLE `_migraciones` (
  `id` varchar(100) NOT NULL,
  `ejecutada` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 23 registro(s)
INSERT INTO `_migraciones` (`id`,`ejecutada`) VALUES ('001_aprobado_solicitud_insumo', '2026-09-30 15:25:30');
INSERT INTO `_migraciones` (`id`,`ejecutada`) VALUES ('002_indices_ticket', '2026-09-30 15:25:30');
INSERT INTO `_migraciones` (`id`,`ejecutada`) VALUES ('003_indices_solicitud', '2026-09-30 15:25:30');
INSERT INTO `_migraciones` (`id`,`ejecutada`) VALUES ('004_tabla_ticket_historial', '2026-09-30 15:25:30');
INSERT INTO `_migraciones` (`id`,`ejecutada`) VALUES ('005_tabla_token_revocado', '2026-09-30 15:25:30');
INSERT INTO `_migraciones` (`id`,`ejecutada`) VALUES ('006_manual_version_subido_por', '2026-09-30 15:25:30');
INSERT INTO `_migraciones` (`id`,`ejecutada`) VALUES ('007_fk_manual_empleado', '2026-09-30 15:25:30');
INSERT INTO `_migraciones` (`id`,`ejecutada`) VALUES ('008_tabla_manual_historial', '2026-09-30 15:25:30');
INSERT INTO `_migraciones` (`id`,`ejecutada`) VALUES ('009_descripcion_solicitud_insumo', '2026-09-30 15:25:30');
INSERT INTO `_migraciones` (`id`,`ejecutada`) VALUES ('010_solicitud_estatus_enum', '2026-09-30 15:45:25');
INSERT INTO `_migraciones` (`id`,`ejecutada`) VALUES ('011_cantidad_aprobada_solicitud_insumo', '2026-09-30 15:45:25');
INSERT INTO `_migraciones` (`id`,`ejecutada`) VALUES ('012_solicitud_ruta_sucursales', '2026-09-30 15:45:26');
INSERT INTO `_migraciones` (`id`,`ejecutada`) VALUES ('013_tabla_movimiento_inventario', '2026-09-30 15:45:26');
INSERT INTO `_migraciones` (`id`,`ejecutada`) VALUES ('014_solicitud_fecha_atencion', '2026-09-30 15:45:26');
INSERT INTO `_migraciones` (`id`,`ejecutada`) VALUES ('015_quitar_tabla_manual_historial', '2026-10-01 18:47:20');
INSERT INTO `_migraciones` (`id`,`ejecutada`) VALUES ('016_quitar_manual_version_subido_por', '2026-10-01 18:47:20');
INSERT INTO `_migraciones` (`id`,`ejecutada`) VALUES ('017_quitar_insumo_proveedor', '2026-10-01 18:47:20');
INSERT INTO `_migraciones` (`id`,`ejecutada`) VALUES ('018_restaurar_manual_historial', '2026-10-01 19:27:04');
INSERT INTO `_migraciones` (`id`,`ejecutada`) VALUES ('019_restaurar_manual_version_subido_por', '2026-10-01 19:27:04');
INSERT INTO `_migraciones` (`id`,`ejecutada`) VALUES ('020_indice_token_revocado_sin_duplicado', '2026-10-01 19:37:07');
INSERT INTO `_migraciones` (`id`,`ejecutada`) VALUES ('021_logout_con_token_version', '2026-10-01 19:45:29');
INSERT INTO `_migraciones` (`id`,`ejecutada`) VALUES ('022_quitar_tabla_token_revocado', '2026-10-01 19:45:29');
INSERT INTO `_migraciones` (`id`,`ejecutada`) VALUES ('023_quitar_tabla_manual_historial', '2026-10-01 19:45:29');


-- ---------------------------------------------------------
-- Tabla: categoria
-- ---------------------------------------------------------
DROP TABLE IF EXISTS `categoria`;
CREATE TABLE `categoria` (
  `id_categoria` int NOT NULL AUTO_INCREMENT,
  `nombre_categoria` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `en_tickets` tinyint(1) NOT NULL DEFAULT '0',
  `en_insumos` tinyint(1) NOT NULL DEFAULT '0',
  `en_manuales` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id_categoria`)
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 16 registro(s)
INSERT INTO `categoria` (`id_categoria`,`nombre_categoria`,`en_tickets`,`en_insumos`,`en_manuales`) VALUES (1, 'Mantenimiento', 1, 1, 1);
INSERT INTO `categoria` (`id_categoria`,`nombre_categoria`,`en_tickets`,`en_insumos`,`en_manuales`) VALUES (2, 'Hardware', 1, 1, 1);
INSERT INTO `categoria` (`id_categoria`,`nombre_categoria`,`en_tickets`,`en_insumos`,`en_manuales`) VALUES (3, 'Software', 1, 1, 1);
INSERT INTO `categoria` (`id_categoria`,`nombre_categoria`,`en_tickets`,`en_insumos`,`en_manuales`) VALUES (4, 'Redes', 1, 0, 1);
INSERT INTO `categoria` (`id_categoria`,`nombre_categoria`,`en_tickets`,`en_insumos`,`en_manuales`) VALUES (5, 'Impresoras', 1, 1, 1);
INSERT INTO `categoria` (`id_categoria`,`nombre_categoria`,`en_tickets`,`en_insumos`,`en_manuales`) VALUES (6, 'Correo Electrónico', 1, 0, 1);
INSERT INTO `categoria` (`id_categoria`,`nombre_categoria`,`en_tickets`,`en_insumos`,`en_manuales`) VALUES (7, 'Accesos y Seguridad', 1, 0, 1);
INSERT INTO `categoria` (`id_categoria`,`nombre_categoria`,`en_tickets`,`en_insumos`,`en_manuales`) VALUES (8, 'Infraestructura', 1, 1, 1);
INSERT INTO `categoria` (`id_categoria`,`nombre_categoria`,`en_tickets`,`en_insumos`,`en_manuales`) VALUES (9, 'Etiquetas', 0, 1, 0);
INSERT INTO `categoria` (`id_categoria`,`nombre_categoria`,`en_tickets`,`en_insumos`,`en_manuales`) VALUES (10, 'Consumibles de Impresión', 0, 1, 0);
INSERT INTO `categoria` (`id_categoria`,`nombre_categoria`,`en_tickets`,`en_insumos`,`en_manuales`) VALUES (11, 'Herramientas', 0, 1, 0);
INSERT INTO `categoria` (`id_categoria`,`nombre_categoria`,`en_tickets`,`en_insumos`,`en_manuales`) VALUES (12, 'Adquisición/Préstamo de Equipo', 0, 1, 0);
INSERT INTO `categoria` (`id_categoria`,`nombre_categoria`,`en_tickets`,`en_insumos`,`en_manuales`) VALUES (13, 'Accesorios de Energía', 0, 1, 0);
INSERT INTO `categoria` (`id_categoria`,`nombre_categoria`,`en_tickets`,`en_insumos`,`en_manuales`) VALUES (14, 'Infraestructura de Conectividad y Redes', 0, 1, 0);
INSERT INTO `categoria` (`id_categoria`,`nombre_categoria`,`en_tickets`,`en_insumos`,`en_manuales`) VALUES (15, 'Herramientas de Diagnóstico y Mantenimiento', 0, 1, 0);
INSERT INTO `categoria` (`id_categoria`,`nombre_categoria`,`en_tickets`,`en_insumos`,`en_manuales`) VALUES (16, 'Otro', 1, 1, 1);


-- ---------------------------------------------------------
-- Tabla: departamento
-- ---------------------------------------------------------
DROP TABLE IF EXISTS `departamento`;
CREATE TABLE `departamento` (
  `id_departamento` int NOT NULL AUTO_INCREMENT,
  `nombre_departamento` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id_departamento`),
  UNIQUE KEY `uq_nombre_departamento` (`nombre_departamento`)
) ENGINE=InnoDB AUTO_INCREMENT=21 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 20 registro(s)
INSERT INTO `departamento` (`id_departamento`,`nombre_departamento`) VALUES (4, 'Almacén y Logística');
INSERT INTO `departamento` (`id_departamento`,`nombre_departamento`) VALUES (20, 'Capacitación y Desarrollo');
INSERT INTO `departamento` (`id_departamento`,`nombre_departamento`) VALUES (5, 'Compras y Abastecimiento');
INSERT INTO `departamento` (`id_departamento`,`nombre_departamento`) VALUES (7, 'Contabilidad y Finanzas');
INSERT INTO `departamento` (`id_departamento`,`nombre_departamento`) VALUES (13, 'Control de Calidad');
INSERT INTO `departamento` (`id_departamento`,`nombre_departamento`) VALUES (10, 'Dirección General');
INSERT INTO `departamento` (`id_departamento`,`nombre_departamento`) VALUES (14, 'Distribución y Transporte');
INSERT INTO `departamento` (`id_departamento`,`nombre_departamento`) VALUES (15, 'Importaciones y Exportaciones');
INSERT INTO `departamento` (`id_departamento`,`nombre_departamento`) VALUES (16, 'Jurídico y Cumplimiento');
INSERT INTO `departamento` (`id_departamento`,`nombre_departamento`) VALUES (11, 'Marketing y Publicidad');
INSERT INTO `departamento` (`id_departamento`,`nombre_departamento`) VALUES (12, 'Operaciones');
INSERT INTO `departamento` (`id_departamento`,`nombre_departamento`) VALUES (18, 'Planeación Estratégica');
INSERT INTO `departamento` (`id_departamento`,`nombre_departamento`) VALUES (19, 'Postventa y Garantías');
INSERT INTO `departamento` (`id_departamento`,`nombre_departamento`) VALUES (6, 'Recursos Humanos');
INSERT INTO `departamento` (`id_departamento`,`nombre_departamento`) VALUES (17, 'Seguridad e Higiene');
INSERT INTO `departamento` (`id_departamento`,`nombre_departamento`) VALUES (8, 'Servicio al Cliente');
INSERT INTO `departamento` (`id_departamento`,`nombre_departamento`) VALUES (2, 'Soporte Técnico');
INSERT INTO `departamento` (`id_departamento`,`nombre_departamento`) VALUES (9, 'Taller y Mantenimiento');
INSERT INTO `departamento` (`id_departamento`,`nombre_departamento`) VALUES (1, 'Tecnologías de la Información');
INSERT INTO `departamento` (`id_departamento`,`nombre_departamento`) VALUES (3, 'Ventas');


-- ---------------------------------------------------------
-- Tabla: rol
-- ---------------------------------------------------------
DROP TABLE IF EXISTS `rol`;
CREATE TABLE `rol` (
  `id_rol` int NOT NULL AUTO_INCREMENT,
  `nombre_rol` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id_rol`),
  UNIQUE KEY `uq_nombre_rol` (`nombre_rol`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2 registro(s)
INSERT INTO `rol` (`id_rol`,`nombre_rol`) VALUES (1, 'Administrador');
INSERT INTO `rol` (`id_rol`,`nombre_rol`) VALUES (2, 'Usuario');


-- ---------------------------------------------------------
-- Tabla: sucursal
-- ---------------------------------------------------------
DROP TABLE IF EXISTS `sucursal`;
CREATE TABLE `sucursal` (
  `id_sucursal` int NOT NULL AUTO_INCREMENT,
  `nombre_sucursal` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id_sucursal`),
  UNIQUE KEY `uq_nombre_sucursal` (`nombre_sucursal`)
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 15 registro(s)
INSERT INTO `sucursal` (`id_sucursal`,`nombre_sucursal`) VALUES (8, 'CEDIS HUITZILA');
INSERT INTO `sucursal` (`id_sucursal`,`nombre_sucursal`) VALUES (12, 'CEDIS MONTERREY');
INSERT INTO `sucursal` (`id_sucursal`,`nombre_sucursal`) VALUES (1, 'CEDIS PUEBLA');
INSERT INTO `sucursal` (`id_sucursal`,`nombre_sucursal`) VALUES (10, 'CEDIS VERACRUZ');
INSERT INTO `sucursal` (`id_sucursal`,`nombre_sucursal`) VALUES (14, 'CEDIS VILLAHERMOSA');
INSERT INTO `sucursal` (`id_sucursal`,`nombre_sucursal`) VALUES (3, 'ESBAZA');
INSERT INTO `sucursal` (`id_sucursal`,`nombre_sucursal`) VALUES (13, 'SUCURSAL MONTERREY');
INSERT INTO `sucursal` (`id_sucursal`,`nombre_sucursal`) VALUES (7, 'SUCURSAL PUEBLA');
INSERT INTO `sucursal` (`id_sucursal`,`nombre_sucursal`) VALUES (15, 'SUCURSAL TABASCO');
INSERT INTO `sucursal` (`id_sucursal`,`nombre_sucursal`) VALUES (9, 'SUCURSAL TIZAYUCA');
INSERT INTO `sucursal` (`id_sucursal`,`nombre_sucursal`) VALUES (11, 'SUCURSAL VERACRUZ');
INSERT INTO `sucursal` (`id_sucursal`,`nombre_sucursal`) VALUES (2, 'TOPACIO');
INSERT INTO `sucursal` (`id_sucursal`,`nombre_sucursal`) VALUES (6, 'URANIO');
INSERT INTO `sucursal` (`id_sucursal`,`nombre_sucursal`) VALUES (5, 'VENTAS MÉXICO');
INSERT INTO `sucursal` (`id_sucursal`,`nombre_sucursal`) VALUES (4, 'YUCATAN21');


-- ---------------------------------------------------------
-- Tabla: ticket_historial
-- ---------------------------------------------------------
DROP TABLE IF EXISTS `ticket_historial`;
CREATE TABLE `ticket_historial` (
  `id_historial` int unsigned NOT NULL AUTO_INCREMENT,
  `id_ticket` int unsigned NOT NULL,
  `id_empleado` int unsigned NOT NULL,
  `campo_cambiado` varchar(60) NOT NULL,
  `valor_anterior` text,
  `valor_nuevo` text,
  `fecha` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_historial`),
  KEY `idx_th_ticket` (`id_ticket`),
  KEY `idx_th_fecha` (`fecha`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


-- ---------------------------------------------------------
-- Tabla: empleado
-- ---------------------------------------------------------
DROP TABLE IF EXISTS `empleado`;
CREATE TABLE `empleado` (
  `id_empleado` int NOT NULL AUTO_INCREMENT,
  `num_empleado` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `nombre` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `ap_paterno` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `ap_materno` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `password` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `foto` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `estatus` enum('Activo','Inactivo') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Activo',
  `id_rol` int NOT NULL,
  `id_departamento` int NOT NULL,
  `id_sucursal` int DEFAULT NULL,
  `token_version` int NOT NULL DEFAULT '0',
  PRIMARY KEY (`id_empleado`),
  UNIQUE KEY `uq_email` (`email`),
  UNIQUE KEY `uq_num_empleado` (`num_empleado`),
  KEY `fk_empleado_rol` (`id_rol`),
  KEY `fk_empleado_depto` (`id_departamento`),
  KEY `fk_empleado_sucursal` (`id_sucursal`),
  CONSTRAINT `fk_empleado_depto` FOREIGN KEY (`id_departamento`) REFERENCES `departamento` (`id_departamento`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_empleado_rol` FOREIGN KEY (`id_rol`) REFERENCES `rol` (`id_rol`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_empleado_sucursal` FOREIGN KEY (`id_sucursal`) REFERENCES `sucursal` (`id_sucursal`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=31 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 30 registro(s)
INSERT INTO `empleado` (`id_empleado`,`num_empleado`,`nombre`,`ap_paterno`,`ap_materno`,`email`,`password`,`foto`,`estatus`,`id_rol`,`id_departamento`,`id_sucursal`,`token_version`) VALUES (1, 'EMP-1002', 'María Juana', 'López', 'Sánchez', 'm.lopez@precisiontrucks.com', '$2b$10$knAIh3VPv8wF2qoTWj6c/uIrjycPVDdmaaDzlHcQtsNoWcS382P/W', 'Fotos de Perfil/emp_1_1779004013439.jpg', 'Activo', 2, 2, 1, 0);
INSERT INTO `empleado` (`id_empleado`,`num_empleado`,`nombre`,`ap_paterno`,`ap_materno`,`email`,`password`,`foto`,`estatus`,`id_rol`,`id_departamento`,`id_sucursal`,`token_version`) VALUES (2, 'EMP-002', 'Carlos', 'Mendoza', 'Torres', 'c.mendoza@precisiontrucks.com', '$2b$10$Sys/LSBeY.V9Vf97ez0ih.gYkT1rQoQcARmaTswRvZeOU0mwxbgqq', NULL, 'Activo', 2, 2, 1, 0);
INSERT INTO `empleado` (`id_empleado`,`num_empleado`,`nombre`,`ap_paterno`,`ap_materno`,`email`,`password`,`foto`,`estatus`,`id_rol`,`id_departamento`,`id_sucursal`,`token_version`) VALUES (3, 'EMP-003', 'Ana', 'Ramírez', 'Flores', 'a.ramirez@precisiontrucks.com', '$2b$10$Sys/LSBeY.V9Vf97ez0ih.gYkT1rQoQcARmaTswRvZeOU0mwxbgqq', NULL, 'Activo', 2, 1, 1, 0);
INSERT INTO `empleado` (`id_empleado`,`num_empleado`,`nombre`,`ap_paterno`,`ap_materno`,`email`,`password`,`foto`,`estatus`,`id_rol`,`id_departamento`,`id_sucursal`,`token_version`) VALUES (4, 'ADM-001', 'Matthew Ilveneff', 'Garay', 'Pérez', 'matthew.garay@ptp.com.mx', '$2b$12$.iy84SVkFDdE.duT2fcp6OVfbBDvI5rO.FcyAkVZR.t8NzDj.vOji', 'Fotos de Perfil/emp_4_1779004003259.jpg', 'Activo', 1, 2, 4, 0);
INSERT INTO `empleado` (`id_empleado`,`num_empleado`,`nombre`,`ap_paterno`,`ap_materno`,`email`,`password`,`foto`,`estatus`,`id_rol`,`id_departamento`,`id_sucursal`,`token_version`) VALUES (5, 'EMP-005', 'Jorge', 'Hernández', 'Vega', 'j.hernandez@precisiontrucks.com', '$2b$10$Sys/LSBeY.V9Vf97ez0ih.gYkT1rQoQcARmaTswRvZeOU0mwxbgqq', NULL, 'Activo', 2, 9, 1, 0);
INSERT INTO `empleado` (`id_empleado`,`num_empleado`,`nombre`,`ap_paterno`,`ap_materno`,`email`,`password`,`foto`,`estatus`,`id_rol`,`id_departamento`,`id_sucursal`,`token_version`) VALUES (6, 'EMP-006', 'Laura', 'García', 'Morales', 'l.garcia@precisiontrucks.com', '$2b$10$Sys/LSBeY.V9Vf97ez0ih.gYkT1rQoQcARmaTswRvZeOU0mwxbgqq', NULL, 'Activo', 2, 6, 1, 0);
INSERT INTO `empleado` (`id_empleado`,`num_empleado`,`nombre`,`ap_paterno`,`ap_materno`,`email`,`password`,`foto`,`estatus`,`id_rol`,`id_departamento`,`id_sucursal`,`token_version`) VALUES (7, 'EMP-007', 'Roberto', 'Jiménez', 'Castillo', 'r.jimenez@precisiontrucks.com', '$2b$10$Sys/LSBeY.V9Vf97ez0ih.gYkT1rQoQcARmaTswRvZeOU0mwxbgqq', NULL, 'Activo', 2, 7, 1, 0);
INSERT INTO `empleado` (`id_empleado`,`num_empleado`,`nombre`,`ap_paterno`,`ap_materno`,`email`,`password`,`foto`,`estatus`,`id_rol`,`id_departamento`,`id_sucursal`,`token_version`) VALUES (8, 'EMP-008', 'Diana', 'Moreno', 'Ruiz', 'd.moreno@precisiontrucks.com', '$2b$10$Sys/LSBeY.V9Vf97ez0ih.gYkT1rQoQcARmaTswRvZeOU0mwxbgqq', NULL, 'Activo', 2, 8, 1, 0);
INSERT INTO `empleado` (`id_empleado`,`num_empleado`,`nombre`,`ap_paterno`,`ap_materno`,`email`,`password`,`foto`,`estatus`,`id_rol`,`id_departamento`,`id_sucursal`,`token_version`) VALUES (9, 'EMP-009', 'Fernando', 'López', 'Guzmán', 'f.lopez@precisiontrucks.com', '$2b$10$Sys/LSBeY.V9Vf97ez0ih.gYkT1rQoQcARmaTswRvZeOU0mwxbgqq', NULL, 'Activo', 2, 9, 2, 0);
INSERT INTO `empleado` (`id_empleado`,`num_empleado`,`nombre`,`ap_paterno`,`ap_materno`,`email`,`password`,`foto`,`estatus`,`id_rol`,`id_departamento`,`id_sucursal`,`token_version`) VALUES (10, 'EMP-010', 'Alejandra', 'Martínez', 'Reyes', 'al.martinez@refividrio.com.mx', '$2b$12$kKVlOKouQtLvYdVWxh57FOhP6dH0IWQa5lQz.ruZfowYoB8KdQ43e', NULL, 'Activo', 2, 10, 2, 0);
INSERT INTO `empleado` (`id_empleado`,`num_empleado`,`nombre`,`ap_paterno`,`ap_materno`,`email`,`password`,`foto`,`estatus`,`id_rol`,`id_departamento`,`id_sucursal`,`token_version`) VALUES (11, 'EMP-011', 'Miguel', 'González', 'Soto', 'm.gonzalez@precisiontrucks.com', '$2b$10$Sys/LSBeY.V9Vf97ez0ih.gYkT1rQoQcARmaTswRvZeOU0mwxbgqq', NULL, 'Activo', 2, 11, 3, 0);
INSERT INTO `empleado` (`id_empleado`,`num_empleado`,`nombre`,`ap_paterno`,`ap_materno`,`email`,`password`,`foto`,`estatus`,`id_rol`,`id_departamento`,`id_sucursal`,`token_version`) VALUES (12, 'EMP-012', 'Verónica', 'Pérez', 'Navarro', 'v.perez@precisiontrucks.com', '$2b$10$Sys/LSBeY.V9Vf97ez0ih.gYkT1rQoQcARmaTswRvZeOU0mwxbgqq', NULL, 'Activo', 2, 12, 3, 0);
INSERT INTO `empleado` (`id_empleado`,`num_empleado`,`nombre`,`ap_paterno`,`ap_materno`,`email`,`password`,`foto`,`estatus`,`id_rol`,`id_departamento`,`id_sucursal`,`token_version`) VALUES (13, 'EMP-013', 'Ricardo', 'Torres', 'Espinoza', 'r.torres@precisiontrucks.com', '$2b$10$Sys/LSBeY.V9Vf97ez0ih.gYkT1rQoQcARmaTswRvZeOU0mwxbgqq', NULL, 'Activo', 2, 13, 4, 0);
INSERT INTO `empleado` (`id_empleado`,`num_empleado`,`nombre`,`ap_paterno`,`ap_materno`,`email`,`password`,`foto`,`estatus`,`id_rol`,`id_departamento`,`id_sucursal`,`token_version`) VALUES (14, 'EMP-014', 'Gabriela', 'Vargas', 'Mendez', 'g.vargas@precisiontrucks.com', '$2b$10$Sys/LSBeY.V9Vf97ez0ih.gYkT1rQoQcARmaTswRvZeOU0mwxbgqq', NULL, 'Activo', 2, 2, 4, 0);
INSERT INTO `empleado` (`id_empleado`,`num_empleado`,`nombre`,`ap_paterno`,`ap_materno`,`email`,`password`,`foto`,`estatus`,`id_rol`,`id_departamento`,`id_sucursal`,`token_version`) VALUES (15, 'EMP-401', 'Patricia', 'Luna', 'Mejía', 'p.luna@precisiontrucks.com', '$2b$10$Sys/LSBeY.V9Vf97ez0ih.gYkT1rQoQcARmaTswRvZeOU0mwxbgqq', NULL, 'Activo', 2, 6, 5, 0);
INSERT INTO `empleado` (`id_empleado`,`num_empleado`,`nombre`,`ap_paterno`,`ap_materno`,`email`,`password`,`foto`,`estatus`,`id_rol`,`id_departamento`,`id_sucursal`,`token_version`) VALUES (16, 'EMP-402', 'Gerardo', 'Nava', 'Ríos', 'g.nava@precisiontrucks.com', '$2b$10$hkUNj11mEWIxraZW81SBxu06IP.ALNSpucTcrOJF4UBrjRVDGy/oW', NULL, 'Activo', 2, 8, 5, 0);
INSERT INTO `empleado` (`id_empleado`,`num_empleado`,`nombre`,`ap_paterno`,`ap_materno`,`email`,`password`,`foto`,`estatus`,`id_rol`,`id_departamento`,`id_sucursal`,`token_version`) VALUES (17, 'EMP-403', 'Mónica', 'Salazar', 'Cruz', 'm.salazar@precisiontrucks.com', '$2b$10$EIszmBQPpwnq3xwifOmSouE6hAC/99VBmrqeXrp1Q99DPl29sYDjO', NULL, 'Activo', 2, 10, 6, 0);
INSERT INTO `empleado` (`id_empleado`,`num_empleado`,`nombre`,`ap_paterno`,`ap_materno`,`email`,`password`,`foto`,`estatus`,`id_rol`,`id_departamento`,`id_sucursal`,`token_version`) VALUES (18, 'EMP-404', 'Oscar', 'Villalba', 'Sanz', 'o.villalba@precisiontrucks.com', '$2b$10$s3U6TIXC5yhmedYSqD76r.ceFVuy2PJkDlYOAGWrfxYUpvuDRtcIm', NULL, 'Activo', 2, 7, 6, 0);
INSERT INTO `empleado` (`id_empleado`,`num_empleado`,`nombre`,`ap_paterno`,`ap_materno`,`email`,`password`,`foto`,`estatus`,`id_rol`,`id_departamento`,`id_sucursal`,`token_version`) VALUES (19, 'EMP-405', 'Silvia', 'Duarte', 'Peña', 's.duarte@precisiontrucks.com', '$2b$10$Z19663s1ztQ6IS/MnJZEkOi3lc7nS.LmQxrI02YtzTzHrf.LEFiXC', NULL, 'Activo', 2, 11, 7, 0);
INSERT INTO `empleado` (`id_empleado`,`num_empleado`,`nombre`,`ap_paterno`,`ap_materno`,`email`,`password`,`foto`,`estatus`,`id_rol`,`id_departamento`,`id_sucursal`,`token_version`) VALUES (20, '437734764', 'Luis Ángel', 'Guerrero', 'Ramirez', 'rluis.guerrero@refividrio.com.mx', '$2b$12$1OjRm8sweEHEo60ziShBv.VIY9PpHEXqn7.eCS9RF6W6WvEWFnNxi', NULL, 'Activo', 1, 2, 4, 0);
INSERT INTO `empleado` (`id_empleado`,`num_empleado`,`nombre`,`ap_paterno`,`ap_materno`,`email`,`password`,`foto`,`estatus`,`id_rol`,`id_departamento`,`id_sucursal`,`token_version`) VALUES (21, 'EMP-100', 'Amaury Marcelo', 'Vazquez', 'Montes', 'amaury.vazquez@refividrio.com.mx', '$2b$12$RLIJiNT6d2daZrbkrqGnGekl88JeJcKUvyjQfRBSAwHs/aMnqQ5Ea', NULL, 'Activo', 1, 2, 4, 0);
INSERT INTO `empleado` (`id_empleado`,`num_empleado`,`nombre`,`ap_paterno`,`ap_materno`,`email`,`password`,`foto`,`estatus`,`id_rol`,`id_departamento`,`id_sucursal`,`token_version`) VALUES (22, 'EMP-022', 'Héctor', 'Reyes', 'Domínguez', 'h.reyes@precisiontrucks.com', '$2b$10$Sys/LSBeY.V9Vf97ez0ih.gYkT1rQoQcARmaTswRvZeOU0mwxbgqq', NULL, 'Activo', 2, 4, 7, 0);
INSERT INTO `empleado` (`id_empleado`,`num_empleado`,`nombre`,`ap_paterno`,`ap_materno`,`email`,`password`,`foto`,`estatus`,`id_rol`,`id_departamento`,`id_sucursal`,`token_version`) VALUES (23, 'EMP-023', 'Claudia', 'Fuentes', 'Ibarra', 'c.fuentes@precisiontrucks.com', '$2b$10$Sys/LSBeY.V9Vf97ez0ih.gYkT1rQoQcARmaTswRvZeOU0mwxbgqq', NULL, 'Activo', 2, 5, 8, 0);
INSERT INTO `empleado` (`id_empleado`,`num_empleado`,`nombre`,`ap_paterno`,`ap_materno`,`email`,`password`,`foto`,`estatus`,`id_rol`,`id_departamento`,`id_sucursal`,`token_version`) VALUES (24, 'EMP-024', 'Ernesto', 'Castañeda', 'Leal', 'e.castaneda@precisiontrucks.com', '$2b$10$Sys/LSBeY.V9Vf97ez0ih.gYkT1rQoQcARmaTswRvZeOU0mwxbgqq', NULL, 'Activo', 2, 14, 8, 0);
INSERT INTO `empleado` (`id_empleado`,`num_empleado`,`nombre`,`ap_paterno`,`ap_materno`,`email`,`password`,`foto`,`estatus`,`id_rol`,`id_departamento`,`id_sucursal`,`token_version`) VALUES (25, 'EMP-025', 'Norma', 'Aguilar', 'Vidal', 'n.aguilar@precisiontrucks.com', '$2b$10$Sys/LSBeY.V9Vf97ez0ih.gYkT1rQoQcARmaTswRvZeOU0mwxbgqq', NULL, 'Activo', 2, 15, 9, 0);
INSERT INTO `empleado` (`id_empleado`,`num_empleado`,`nombre`,`ap_paterno`,`ap_materno`,`email`,`password`,`foto`,`estatus`,`id_rol`,`id_departamento`,`id_sucursal`,`token_version`) VALUES (26, 'EMP-026', 'Iván', 'Serrano', 'Campos', 'i.serrano@precisiontrucks.com', '$2b$10$Sys/LSBeY.V9Vf97ez0ih.gYkT1rQoQcARmaTswRvZeOU0mwxbgqq', NULL, 'Activo', 2, 16, 9, 0);
INSERT INTO `empleado` (`id_empleado`,`num_empleado`,`nombre`,`ap_paterno`,`ap_materno`,`email`,`password`,`foto`,`estatus`,`id_rol`,`id_departamento`,`id_sucursal`,`token_version`) VALUES (27, 'EMP-027', 'Karla', 'Olvera', 'Bravo', 'k.olvera@precisiontrucks.com', '$2b$10$Sys/LSBeY.V9Vf97ez0ih.gYkT1rQoQcARmaTswRvZeOU0mwxbgqq', NULL, 'Activo', 2, 17, 10, 0);
INSERT INTO `empleado` (`id_empleado`,`num_empleado`,`nombre`,`ap_paterno`,`ap_materno`,`email`,`password`,`foto`,`estatus`,`id_rol`,`id_departamento`,`id_sucursal`,`token_version`) VALUES (28, 'EMP-028', 'Arturo', 'Medina', 'Quiroz', 'a.medina@precisiontrucks.com', '$2b$12$GMacoJYQxE0p3OF7..jSK.iyl8FqFv/KGhx3RLzZxX967U5L37Ydm', NULL, 'Activo', 2, 18, 10, 0);
INSERT INTO `empleado` (`id_empleado`,`num_empleado`,`nombre`,`ap_paterno`,`ap_materno`,`email`,`password`,`foto`,`estatus`,`id_rol`,`id_departamento`,`id_sucursal`,`token_version`) VALUES (29, 'EMP-029', 'Leticia', 'Sandoval', 'Ponce', 'l.sandoval@precisiontrucks.com', '$2b$10$Sys/LSBeY.V9Vf97ez0ih.gYkT1rQoQcARmaTswRvZeOU0mwxbgqq', NULL, 'Activo', 2, 19, 11, 0);
INSERT INTO `empleado` (`id_empleado`,`num_empleado`,`nombre`,`ap_paterno`,`ap_materno`,`email`,`password`,`foto`,`estatus`,`id_rol`,`id_departamento`,`id_sucursal`,`token_version`) VALUES (30, 'EMP-030', 'Benjamín', 'Acosta', 'Trejo', 'b.acosta@precisiontrucks.com', '$2b$10$Sys/LSBeY.V9Vf97ez0ih.gYkT1rQoQcARmaTswRvZeOU0mwxbgqq', NULL, 'Activo', 2, 20, 11, 0);


-- ---------------------------------------------------------
-- Tabla: historial_acceso
-- ---------------------------------------------------------
DROP TABLE IF EXISTS `historial_acceso`;
CREATE TABLE `historial_acceso` (
  `id_acceso` int NOT NULL AUTO_INCREMENT,
  `id_empleado` int NOT NULL,
  `fecha_entrada` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `fecha_salida` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id_acceso`),
  KEY `fk_historial_empleado` (`id_empleado`),
  CONSTRAINT `fk_historial_empleado` FOREIGN KEY (`id_empleado`) REFERENCES `empleado` (`id_empleado`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=359 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 78 registro(s)
INSERT INTO `historial_acceso` (`id_acceso`,`id_empleado`,`fecha_entrada`,`fecha_salida`) VALUES (281, 1, '2026-07-07 05:04:15', '2026-07-07 06:14:00');
INSERT INTO `historial_acceso` (`id_acceso`,`id_empleado`,`fecha_entrada`,`fecha_salida`) VALUES (282, 4, '2026-07-07 05:13:38', '2026-07-07 06:13:37');
INSERT INTO `historial_acceso` (`id_acceso`,`id_empleado`,`fecha_entrada`,`fecha_salida`) VALUES (283, 1, '2026-07-12 08:36:06', '2026-07-12 08:39:28');
INSERT INTO `historial_acceso` (`id_acceso`,`id_empleado`,`fecha_entrada`,`fecha_salida`) VALUES (284, 4, '2026-07-12 08:47:16', '2026-07-12 21:24:30');
INSERT INTO `historial_acceso` (`id_acceso`,`id_empleado`,`fecha_entrada`,`fecha_salida`) VALUES (285, 10, '2026-07-12 09:05:40', '2026-07-12 22:05:21');
INSERT INTO `historial_acceso` (`id_acceso`,`id_empleado`,`fecha_entrada`,`fecha_salida`) VALUES (286, 4, '2026-07-12 21:32:19', '2026-07-12 21:41:24');
INSERT INTO `historial_acceso` (`id_acceso`,`id_empleado`,`fecha_entrada`,`fecha_salida`) VALUES (287, 4, '2026-07-12 21:44:55', '2026-07-12 21:57:03');
INSERT INTO `historial_acceso` (`id_acceso`,`id_empleado`,`fecha_entrada`,`fecha_salida`) VALUES (288, 4, '2026-07-12 22:03:54', '2026-07-12 22:08:26');
INSERT INTO `historial_acceso` (`id_acceso`,`id_empleado`,`fecha_entrada`,`fecha_salida`) VALUES (289, 10, '2026-07-12 22:05:28', '2026-07-13 06:16:33');
INSERT INTO `historial_acceso` (`id_acceso`,`id_empleado`,`fecha_entrada`,`fecha_salida`) VALUES (290, 4, '2026-07-12 22:12:20', '2026-07-12 22:16:02');
INSERT INTO `historial_acceso` (`id_acceso`,`id_empleado`,`fecha_entrada`,`fecha_salida`) VALUES (291, 4, '2026-07-12 22:23:50', '2026-07-12 22:24:21');
INSERT INTO `historial_acceso` (`id_acceso`,`id_empleado`,`fecha_entrada`,`fecha_salida`) VALUES (292, 4, '2026-07-12 22:30:51', '2026-07-12 22:39:17');
INSERT INTO `historial_acceso` (`id_acceso`,`id_empleado`,`fecha_entrada`,`fecha_salida`) VALUES (293, 4, '2026-07-12 22:40:00', '2026-07-12 23:03:00');
INSERT INTO `historial_acceso` (`id_acceso`,`id_empleado`,`fecha_entrada`,`fecha_salida`) VALUES (294, 4, '2026-07-12 23:03:04', '2026-07-13 06:16:29');
INSERT INTO `historial_acceso` (`id_acceso`,`id_empleado`,`fecha_entrada`,`fecha_salida`) VALUES (295, 4, '2026-07-13 03:12:32', '2026-07-13 03:28:58');
INSERT INTO `historial_acceso` (`id_acceso`,`id_empleado`,`fecha_entrada`,`fecha_salida`) VALUES (296, 4, '2026-07-13 20:31:56', '2026-07-14 00:25:37');
INSERT INTO `historial_acceso` (`id_acceso`,`id_empleado`,`fecha_entrada`,`fecha_salida`) VALUES (297, 10, '2026-07-13 20:34:18', '2026-07-13 20:59:33');
INSERT INTO `historial_acceso` (`id_acceso`,`id_empleado`,`fecha_entrada`,`fecha_salida`) VALUES (298, 4, '2026-07-14 16:48:39', '2026-07-14 23:01:02');
INSERT INTO `historial_acceso` (`id_acceso`,`id_empleado`,`fecha_entrada`,`fecha_salida`) VALUES (299, 4, '2026-07-16 19:22:43', '2026-07-16 22:23:48');
INSERT INTO `historial_acceso` (`id_acceso`,`id_empleado`,`fecha_entrada`,`fecha_salida`) VALUES (300, 10, '2026-07-16 19:30:48', '2026-07-16 22:16:42');
INSERT INTO `historial_acceso` (`id_acceso`,`id_empleado`,`fecha_entrada`,`fecha_salida`) VALUES (301, 4, '2026-07-17 15:49:23', '2026-07-17 17:58:54');
INSERT INTO `historial_acceso` (`id_acceso`,`id_empleado`,`fecha_entrada`,`fecha_salida`) VALUES (302, 4, '2026-07-17 17:59:19', '2026-07-17 18:34:47');
INSERT INTO `historial_acceso` (`id_acceso`,`id_empleado`,`fecha_entrada`,`fecha_salida`) VALUES (303, 10, '2026-07-17 18:00:19', '2026-07-17 18:34:59');
INSERT INTO `historial_acceso` (`id_acceso`,`id_empleado`,`fecha_entrada`,`fecha_salida`) VALUES (304, 4, '2026-07-17 18:44:21', '2026-07-17 20:00:20');
INSERT INTO `historial_acceso` (`id_acceso`,`id_empleado`,`fecha_entrada`,`fecha_salida`) VALUES (305, 4, '2026-07-17 18:44:40', '2026-07-17 18:47:00');
INSERT INTO `historial_acceso` (`id_acceso`,`id_empleado`,`fecha_entrada`,`fecha_salida`) VALUES (306, 4, '2026-07-17 18:48:18', '2026-07-17 18:49:15');
INSERT INTO `historial_acceso` (`id_acceso`,`id_empleado`,`fecha_entrada`,`fecha_salida`) VALUES (307, 4, '2026-07-17 18:49:15', '2026-07-17 22:12:53');
INSERT INTO `historial_acceso` (`id_acceso`,`id_empleado`,`fecha_entrada`,`fecha_salida`) VALUES (308, 4, '2026-07-17 21:38:34', '2026-07-17 22:12:07');
INSERT INTO `historial_acceso` (`id_acceso`,`id_empleado`,`fecha_entrada`,`fecha_salida`) VALUES (309, 10, '2026-07-17 22:12:46', '2026-07-17 22:33:21');
INSERT INTO `historial_acceso` (`id_acceso`,`id_empleado`,`fecha_entrada`,`fecha_salida`) VALUES (310, 10, '2026-07-17 22:13:05', '2026-07-17 22:36:34');
INSERT INTO `historial_acceso` (`id_acceso`,`id_empleado`,`fecha_entrada`,`fecha_salida`) VALUES (311, 4, '2026-07-20 21:28:54', '2026-07-20 22:50:06');
INSERT INTO `historial_acceso` (`id_acceso`,`id_empleado`,`fecha_entrada`,`fecha_salida`) VALUES (312, 10, '2026-07-20 21:29:37', '2026-07-20 22:40:22');
INSERT INTO `historial_acceso` (`id_acceso`,`id_empleado`,`fecha_entrada`,`fecha_salida`) VALUES (313, 10, '2026-07-20 22:17:02', '2026-07-20 22:31:47');
INSERT INTO `historial_acceso` (`id_acceso`,`id_empleado`,`fecha_entrada`,`fecha_salida`) VALUES (314, 10, '2026-07-20 22:46:39', '2026-07-21 15:53:11');
INSERT INTO `historial_acceso` (`id_acceso`,`id_empleado`,`fecha_entrada`,`fecha_salida`) VALUES (315, 4, '2026-07-21 15:39:18', '2026-07-21 15:54:06');
INSERT INTO `historial_acceso` (`id_acceso`,`id_empleado`,`fecha_entrada`,`fecha_salida`) VALUES (316, 10, '2026-07-21 15:53:11', '2026-07-21 22:38:59');
INSERT INTO `historial_acceso` (`id_acceso`,`id_empleado`,`fecha_entrada`,`fecha_salida`) VALUES (317, 4, '2026-07-21 15:54:10', '2026-07-21 16:14:55');
INSERT INTO `historial_acceso` (`id_acceso`,`id_empleado`,`fecha_entrada`,`fecha_salida`) VALUES (318, 4, '2026-07-21 19:53:44', '2026-07-21 22:58:25');
INSERT INTO `historial_acceso` (`id_acceso`,`id_empleado`,`fecha_entrada`,`fecha_salida`) VALUES (319, 10, '2026-07-22 18:26:07', '2026-07-22 18:26:43');
INSERT INTO `historial_acceso` (`id_acceso`,`id_empleado`,`fecha_entrada`,`fecha_salida`) VALUES (320, 10, '2026-07-22 21:25:55', '2026-07-22 21:25:58');
INSERT INTO `historial_acceso` (`id_acceso`,`id_empleado`,`fecha_entrada`,`fecha_salida`) VALUES (321, 4, '2026-07-27 20:51:18', '2026-07-27 20:52:01');
INSERT INTO `historial_acceso` (`id_acceso`,`id_empleado`,`fecha_entrada`,`fecha_salida`) VALUES (322, 10, '2026-07-27 20:52:05', '2026-07-27 21:51:38');
INSERT INTO `historial_acceso` (`id_acceso`,`id_empleado`,`fecha_entrada`,`fecha_salida`) VALUES (323, 10, '2026-07-27 21:52:05', '2026-07-28 00:02:26');
INSERT INTO `historial_acceso` (`id_acceso`,`id_empleado`,`fecha_entrada`,`fecha_salida`) VALUES (324, 10, '2026-07-28 00:14:29', '2026-07-28 00:30:08');
INSERT INTO `historial_acceso` (`id_acceso`,`id_empleado`,`fecha_entrada`,`fecha_salida`) VALUES (325, 10, '2026-07-29 19:47:24', '2026-07-29 19:47:51');
INSERT INTO `historial_acceso` (`id_acceso`,`id_empleado`,`fecha_entrada`,`fecha_salida`) VALUES (326, 10, '2026-07-30 18:44:03', '2026-07-30 18:57:58');
INSERT INTO `historial_acceso` (`id_acceso`,`id_empleado`,`fecha_entrada`,`fecha_salida`) VALUES (327, 10, '2026-07-30 18:58:14', '2026-07-30 19:59:58');
INSERT INTO `historial_acceso` (`id_acceso`,`id_empleado`,`fecha_entrada`,`fecha_salida`) VALUES (328, 10, '2026-07-30 19:52:27', '2026-07-30 20:08:52');
INSERT INTO `historial_acceso` (`id_acceso`,`id_empleado`,`fecha_entrada`,`fecha_salida`) VALUES (329, 4, '2026-07-30 20:08:56', '2026-07-30 20:22:26');
INSERT INTO `historial_acceso` (`id_acceso`,`id_empleado`,`fecha_entrada`,`fecha_salida`) VALUES (330, 10, '2026-07-30 20:09:12', '2026-07-30 20:17:22');
INSERT INTO `historial_acceso` (`id_acceso`,`id_empleado`,`fecha_entrada`,`fecha_salida`) VALUES (331, 10, '2026-07-30 20:27:27', '2026-07-30 20:53:39');
INSERT INTO `historial_acceso` (`id_acceso`,`id_empleado`,`fecha_entrada`,`fecha_salida`) VALUES (332, 4, '2026-07-30 20:53:44', '2026-07-30 21:01:40');
INSERT INTO `historial_acceso` (`id_acceso`,`id_empleado`,`fecha_entrada`,`fecha_salida`) VALUES (333, 4, '2026-07-30 21:03:57', '2026-07-30 21:18:54');
INSERT INTO `historial_acceso` (`id_acceso`,`id_empleado`,`fecha_entrada`,`fecha_salida`) VALUES (334, 4, '2026-07-30 22:33:06', '2026-07-30 22:39:59');
INSERT INTO `historial_acceso` (`id_acceso`,`id_empleado`,`fecha_entrada`,`fecha_salida`) VALUES (335, 4, '2026-08-03 20:19:57', '2026-08-03 20:43:25');
INSERT INTO `historial_acceso` (`id_acceso`,`id_empleado`,`fecha_entrada`,`fecha_salida`) VALUES (336, 4, '2026-08-03 20:43:41', '2026-08-03 20:43:58');
INSERT INTO `historial_acceso` (`id_acceso`,`id_empleado`,`fecha_entrada`,`fecha_salida`) VALUES (337, 4, '2026-08-03 20:44:46', '2026-08-03 21:27:20');
INSERT INTO `historial_acceso` (`id_acceso`,`id_empleado`,`fecha_entrada`,`fecha_salida`) VALUES (338, 10, '2026-08-03 20:45:15', '2026-08-03 20:49:32');
INSERT INTO `historial_acceso` (`id_acceso`,`id_empleado`,`fecha_entrada`,`fecha_salida`) VALUES (339, 4, '2026-08-04 18:04:03', '2026-08-04 18:16:14');
INSERT INTO `historial_acceso` (`id_acceso`,`id_empleado`,`fecha_entrada`,`fecha_salida`) VALUES (340, 10, '2026-08-04 18:08:26', '2026-08-04 18:20:57');
INSERT INTO `historial_acceso` (`id_acceso`,`id_empleado`,`fecha_entrada`,`fecha_salida`) VALUES (341, 4, '2026-08-04 18:20:44', '2026-08-04 18:22:00');
INSERT INTO `historial_acceso` (`id_acceso`,`id_empleado`,`fecha_entrada`,`fecha_salida`) VALUES (342, 10, '2026-08-04 18:20:57', '2026-08-04 19:45:15');
INSERT INTO `historial_acceso` (`id_acceso`,`id_empleado`,`fecha_entrada`,`fecha_salida`) VALUES (343, 4, '2026-08-04 19:12:01', '2026-08-04 20:20:22');
INSERT INTO `historial_acceso` (`id_acceso`,`id_empleado`,`fecha_entrada`,`fecha_salida`) VALUES (344, 10, '2026-08-04 19:45:15', '2026-08-04 20:20:22');
INSERT INTO `historial_acceso` (`id_acceso`,`id_empleado`,`fecha_entrada`,`fecha_salida`) VALUES (345, 4, '2026-08-05 15:35:24', '2026-08-05 16:27:10');
INSERT INTO `historial_acceso` (`id_acceso`,`id_empleado`,`fecha_entrada`,`fecha_salida`) VALUES (346, 10, '2026-08-05 15:46:57', '2026-08-05 16:42:45');
INSERT INTO `historial_acceso` (`id_acceso`,`id_empleado`,`fecha_entrada`,`fecha_salida`) VALUES (347, 10, '2026-08-07 17:37:28', '2026-08-07 21:00:54');
INSERT INTO `historial_acceso` (`id_acceso`,`id_empleado`,`fecha_entrada`,`fecha_salida`) VALUES (348, 4, '2026-08-07 21:01:01', '2026-08-07 21:05:31');
INSERT INTO `historial_acceso` (`id_acceso`,`id_empleado`,`fecha_entrada`,`fecha_salida`) VALUES (349, 4, '2026-09-29 21:03:23', '2026-09-29 23:57:24');
INSERT INTO `historial_acceso` (`id_acceso`,`id_empleado`,`fecha_entrada`,`fecha_salida`) VALUES (350, 21, '2026-09-29 21:22:10', '2026-09-29 21:22:34');
INSERT INTO `historial_acceso` (`id_acceso`,`id_empleado`,`fecha_entrada`,`fecha_salida`) VALUES (351, 28, '2026-09-29 21:23:00', '2026-09-29 21:45:25');
INSERT INTO `historial_acceso` (`id_acceso`,`id_empleado`,`fecha_entrada`,`fecha_salida`) VALUES (352, 21, '2026-09-29 21:45:53', '2026-09-29 22:12:19');
INSERT INTO `historial_acceso` (`id_acceso`,`id_empleado`,`fecha_entrada`,`fecha_salida`) VALUES (353, 21, '2026-09-30 15:58:33', '2026-09-30 23:33:15');
INSERT INTO `historial_acceso` (`id_acceso`,`id_empleado`,`fecha_entrada`,`fecha_salida`) VALUES (354, 4, '2026-09-30 15:59:52', '2026-10-01 00:24:49');
INSERT INTO `historial_acceso` (`id_acceso`,`id_empleado`,`fecha_entrada`,`fecha_salida`) VALUES (355, 10, '2026-09-30 22:59:48', '2026-10-01 00:24:49');
INSERT INTO `historial_acceso` (`id_acceso`,`id_empleado`,`fecha_entrada`,`fecha_salida`) VALUES (356, 21, '2026-10-01 15:28:30', '2026-10-01 15:29:02');
INSERT INTO `historial_acceso` (`id_acceso`,`id_empleado`,`fecha_entrada`,`fecha_salida`) VALUES (357, 4, '2026-10-01 15:30:09', '2026-10-01 19:45:21');
INSERT INTO `historial_acceso` (`id_acceso`,`id_empleado`,`fecha_entrada`,`fecha_salida`) VALUES (358, 10, '2026-10-01 15:52:45', '2026-10-01 19:28:28');


-- ---------------------------------------------------------
-- Tabla: insumo
-- ---------------------------------------------------------
DROP TABLE IF EXISTS `insumo`;
CREATE TABLE `insumo` (
  `id_insumo` int NOT NULL AUTO_INCREMENT,
  `num_serie` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `nombre` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `descripcion` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `marca` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `modelo` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `stock` int NOT NULL DEFAULT '0',
  `estado` enum('Excelente','Bueno','Regular','Malo') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `id_categoria` int NOT NULL,
  `imagen_url` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id_insumo`),
  KEY `fk_insumo_categoria` (`id_categoria`),
  CONSTRAINT `fk_insumo_categoria` FOREIGN KEY (`id_categoria`) REFERENCES `categoria` (`id_categoria`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `chk_stock` CHECK ((`stock` >= 0))
) ENGINE=InnoDB AUTO_INCREMENT=59 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 57 registro(s)
INSERT INTO `insumo` (`id_insumo`,`num_serie`,`nombre`,`descripcion`,`marca`,`modelo`,`stock`,`estado`,`id_categoria`,`imagen_url`) VALUES (1, 'N/A', 'Tóner Xerox Magenta C235', 'Cartucho de tóner original color magenta, rendimiento estándar', 'Xerox', 'C235', 4, 'Excelente', 10, '/storage/Insumos/insumo_1_1783902359460d17305334b2c.jpg');
INSERT INTO `insumo` (`id_insumo`,`num_serie`,`nombre`,`descripcion`,`marca`,`modelo`,`stock`,`estado`,`id_categoria`,`imagen_url`) VALUES (2, 'N/A', 'Tóner Xerox Negro C235', 'Cartucho de tóner original color negro, alto rendimiento.', 'Xerox', 'C235', 4, 'Excelente', 10, '/storage/Insumos/insumo_2_178390396694960f484257fc3.jpg');
INSERT INTO `insumo` (`id_insumo`,`num_serie`,`nombre`,`descripcion`,`marca`,`modelo`,`stock`,`estado`,`id_categoria`,`imagen_url`) VALUES (3, 'N/A', 'Removedor de Polvo Naceb Tecnología 660 ml', 'Aire comprimido removedor de polvo marca Naceb Tecnología de 660 ml. Ideal para la limpieza de equipos electrónicos y de oficina.
Dispositivos: Televisores, computadoras, laptops, impresoras, teléfonos, y equipos de audio y video.', 'Naceb Tecnología', 'CF217A', 2, 'Excelente', 1, '/storage/Insumos/insumo_3_17840508222230b2881495245.webp');
INSERT INTO `insumo` (`id_insumo`,`num_serie`,`nombre`,`descripcion`,`marca`,`modelo`,`stock`,`estado`,`id_categoria`,`imagen_url`) VALUES (4, 'N/A', 'Memoria USB Kingston DataTraveler Exodia 64GB (USB 3.2)', 'Unidad de almacenamiento portátil con diseño ergonómico en color negro. Cuenta con interfaz USB 3.2.', 'Kingston', 'N/A', 4, 'Excelente', 2, '/storage/Insumos/insumo_4_1784051642134fda58452fda1.webp');
INSERT INTO `insumo` (`id_insumo`,`num_serie`,`nombre`,`descripcion`,`marca`,`modelo`,`stock`,`estado`,`id_categoria`,`imagen_url`) VALUES (5, 'N/A', 'Memoria MicroSD Kingston Canvas Select Plus 32GB (Clase 10)', 'Tarjeta de almacenamiento optimizada para dispositivos Android con rendimiento nivel A1. Ofrece velocidades de lectura de hasta 100 MB/s.', 'Kingston', 'N/A', 1, 'Excelente', 2, '/storage/Insumos/insumo_5_1784056061970a44cb7dc8ec9.jpg');
INSERT INTO `insumo` (`id_insumo`,`num_serie`,`nombre`,`descripcion`,`marca`,`modelo`,`stock`,`estado`,`id_categoria`,`imagen_url`) VALUES (6, 'SN-WD-99182', 'Unidad de Estado Solido SSD 240GB', 'Unidad de estado sólido formato 250GB, 2.5 pulgadas SATA', 'Western Digital', 'Blue SA510', 10, 'Excelente', 2, '/storage/Insumos/insumo_6_17839064146082a3a8843aa76.webp');
INSERT INTO `insumo` (`id_insumo`,`num_serie`,`nombre`,`descripcion`,`marca`,`modelo`,`stock`,`estado`,`id_categoria`,`imagen_url`) VALUES (7, 'N/A', 'Unidad de estado sólido Stylos M.2 NVMe 512GB (PCIe 3.0)', 'Unidad de estado sólido de alto rendimiento con interfaz M.2. Ofrece velocidades de lectura de hasta 3000 MB/s y escritura de 2500 MB/s, optimizando significativamente la velocidad de respuesta.', 'Stylos', 'N/A', 2, 'Excelente', 2, '/storage/Insumos/insumo_7_1784052597771522d7bdf83d5.jpg');
INSERT INTO `insumo` (`id_insumo`,`num_serie`,`nombre`,`descripcion`,`marca`,`modelo`,`stock`,`estado`,`id_categoria`,`imagen_url`) VALUES (8, 'N/A', 'Kit Teclado y Mouse Inalámbrico DELL', 'conexión RF de 2.4 GHz vía receptor USB. Diseño ergonómico en color negro.', 'DELL', 'KM3322W', 3, 'Excelente', 2, '/storage/Insumos/insumo_8_17840523256220883305cdb53.webp');
INSERT INTO `insumo` (`id_insumo`,`num_serie`,`nombre`,`descripcion`,`marca`,`modelo`,`stock`,`estado`,`id_categoria`,`imagen_url`) VALUES (9, 'N/A', 'Tapete para Mouse (Mousepad) Negro Manhattan', 'Tapete para Mouse (Mousepad) Ergonómico Manhattan, Superficie de Microfibra de Precisión, Almohadilla Descansamuñecas de Gel Traslúcido Suave, Base de Goma Antideslizante, Color Negro.', 'Manhattan', 'N/A', 1, 'Excelente', 16, '/storage/Insumos/insumo_9_178390684314210b5fe8f96fa.webp');
INSERT INTO `insumo` (`id_insumo`,`num_serie`,`nombre`,`descripcion`,`marca`,`modelo`,`stock`,`estado`,`id_categoria`,`imagen_url`) VALUES (10, 'N/A', 'EL TIGRE Toner Compatible con HP Negro', 'Cartucho de tóner color negro de la marca EL TIGRE compatible con impresoras HP LaserJet MFP.
Modelos compatibles: M141A, M141W, M111A, M111W', 'Cartucho Tigre', 'W1500AC-AI', 8, 'Excelente', 10, '/storage/Insumos/insumo_10_17840698416845eddf3d40bb8.jpg');
INSERT INTO `insumo` (`id_insumo`,`num_serie`,`nombre`,`descripcion`,`marca`,`modelo`,`stock`,`estado`,`id_categoria`,`imagen_url`) VALUES (11, 'PTP-ST-0001', 'Adaptador inalámbrico TP-Link Archer T3U AC1300 (USB 3.0) (5 GHz y 2.4 GHz)', 'Adaptador de red banda dual (5 GHz y 2.4 GHz) con velocidades de hasta 867 Mbps y 400 Mbps respectivamente. Su diseño compacto incluye tecnología MU-MIMO para mejorar la eficiencia de la red y compatibilidad con interfaces USB 3.0 para transferencias de alta velocidad.', 'TP-Link', 'Archer T3U AC1300', 2, 'Excelente', 14, '/storage/Insumos/insumo_11_17840558783573e9e715e8da1.jpg');
INSERT INTO `insumo` (`id_insumo`,`num_serie`,`nombre`,`descripcion`,`marca`,`modelo`,`stock`,`estado`,`id_categoria`,`imagen_url`) VALUES (12, 'N/A', 'Unidad de estado sólido interna Western Digital Green 500GB (SATA III)', 'Unidad de estado sólido interna en formato 2.5 pulgadas con capacidad de 500 GB. Ofrece una velocidad de lectura de hasta 545 MB/s.', 'Western Digital', 'N/A', 3, 'Excelente', 2, '/storage/Insumos/insumo_12_1784055132026bf915789e344.webp');
INSERT INTO `insumo` (`id_insumo`,`num_serie`,`nombre`,`descripcion`,`marca`,`modelo`,`stock`,`estado`,`id_categoria`,`imagen_url`) VALUES (13, 'N/A', 'Silimex CompuToallas 30 Piezas', 'Toallitas húmedas para limpieza de superficies de equipos electrónicos y de cómputo. Limpiadoras, protectoras y abrillantadoras de uso externo. Ideales para la limpieza externa de cualquier equipo electrónico. Desintegra grasa, cochambre y polvo', 'Silimex', 'N/A', 1, 'Excelente', 1, '/storage/Insumos/insumo_13_178390664389372dab7b65c44.jpg');
INSERT INTO `insumo` (`id_insumo`,`num_serie`,`nombre`,`descripcion`,`marca`,`modelo`,`stock`,`estado`,`id_categoria`,`imagen_url`) VALUES (14, 'N/A', 'Espuma Limpiadora', 'Espuma limpiadora especialmente diseñada para equipo electrónico, ideal para una limpieza rápida y profunda en todo tipo de superficies plásticas. Su fórmula incluye propiedades antiestáticas que ayudan a repeler el polvo.', 'Perfect Choice', 'Espuma 432ml', 3, 'Excelente', 1, '/storage/Insumos/insumo_14_178390725216462a6954a66fb.avif');
INSERT INTO `insumo` (`id_insumo`,`num_serie`,`nombre`,`descripcion`,`marca`,`modelo`,`stock`,`estado`,`id_categoria`,`imagen_url`) VALUES (15, 'N/A', 'Pasta térmica BRobotix de nitrato de plata', 'Compuesto de alta conductividad en jeringa (1.5g), diseñado para optimizar la transferencia de calor entre el procesador y el disipador.', 'BRobotix', 'N/A', 3, 'Excelente', 1, '/storage/Insumos/insumo_15_178405368004849f5dad720ad.webp');
INSERT INTO `insumo` (`id_insumo`,`num_serie`,`nombre`,`descripcion`,`marca`,`modelo`,`stock`,`estado`,`id_categoria`,`imagen_url`) VALUES (16, 'N/A', 'Kit Teclado y Mouse Inalámbrico HP 235', 'conexión RF de 2.4 GHz vía receptor USB. Diseño ergonómico en color negro.', 'HP', '235', 0, 'Excelente', 2, '/storage/Insumos/insumo_16_17839058172958470fc7a7a2e.avif');
INSERT INTO `insumo` (`id_insumo`,`num_serie`,`nombre`,`descripcion`,`marca`,`modelo`,`stock`,`estado`,`id_categoria`,`imagen_url`) VALUES (17, 'N/A', 'Tóner Xerox Amarillo C235', 'Cartucho de tóner original color amarillo, rendimiento estándar.', 'Xerox', 'C235', 4, 'Excelente', 10, '/storage/Insumos/insumo_17_17839040060080350be93ae7a.jpg');
INSERT INTO `insumo` (`id_insumo`,`num_serie`,`nombre`,`descripcion`,`marca`,`modelo`,`stock`,`estado`,`id_categoria`,`imagen_url`) VALUES (18, 'N/A', 'Tóner Xerox Cian C235', 'Cartucho de tóner original color cian, rendimiento estándar', 'Xerox', 'C235', 4, 'Excelente', 10, '/storage/Insumos/insumo_18_17839041168606403776a3df5.jpg');
INSERT INTO `insumo` (`id_insumo`,`num_serie`,`nombre`,`descripcion`,`marca`,`modelo`,`stock`,`estado`,`id_categoria`,`imagen_url`) VALUES (19, 'N/A', 'Botella de Tinta Epson Negro T544 65ML', 'Botellas de tinta de color negro modelo T544 compatible con impresoras Epson de la línea EcoTank.
Impresoras compatibles: L1110, L1210, L3110, L3210, L3150, L3250, L3260, L5190 y L5290', 'Epson', 'T544', 4, 'Excelente', 10, '/storage/Insumos/insumo_19_1783904560220e6923ece15c6.webp');
INSERT INTO `insumo` (`id_insumo`,`num_serie`,`nombre`,`descripcion`,`marca`,`modelo`,`stock`,`estado`,`id_categoria`,`imagen_url`) VALUES (20, 'N/A', 'Botella de Tinta Epson Amarillo T544 65ML', 'Botella de tinta de color amarillo modelo T544 compatible con impresoras Epson de la línea EcoTank.
Impresoras compatibles: L1110, L1210, L3110, L3210, L3150, L3250, L3260, L5190 y L5290', 'Epson', 'T544', 14, 'Excelente', 10, '/storage/Insumos/insumo_20_1783904886870d37121f43af3.webp');
INSERT INTO `insumo` (`id_insumo`,`num_serie`,`nombre`,`descripcion`,`marca`,`modelo`,`stock`,`estado`,`id_categoria`,`imagen_url`) VALUES (21, 'N/A', 'Botella de Tinta Epson Cian T544 65ML', 'Botella de tinta de color cian modelo T544 compatible con impresoras Epson de la línea EcoTank.
Impresoras compatibles: L1110, L1210, L3110, L3210, L3150, L3250, L3260, L5190 y L5290', 'Epson', 'T544', 11, 'Excelente', 10, '/storage/Insumos/insumo_21_17839054511966bd294647abd.avif');
INSERT INTO `insumo` (`id_insumo`,`num_serie`,`nombre`,`descripcion`,`marca`,`modelo`,`stock`,`estado`,`id_categoria`,`imagen_url`) VALUES (22, 'N/A', 'Botella de Tinta Epson Magenta T544 65ML', 'Botellas de tinta de color magenta modelo T544 compatible con impresoras Epson de la línea EcoTank.
Impresoras compatibles: L1110, L1210, L3110, L3210, L3150, L3250, L3260, L5190 y L5290', 'Epson', 'T544', 14, 'Excelente', 10, '/storage/Insumos/insumo_22_1783905654621bfbd5f360db3.webp');
INSERT INTO `insumo` (`id_insumo`,`num_serie`,`nombre`,`descripcion`,`marca`,`modelo`,`stock`,`estado`,`id_categoria`,`imagen_url`) VALUES (23, 'N/A', 'Botella de Tinta Epson Amarillo T504 70ML', 'Botella de tinta de color amarillo modelo T504 compatible con impresoras Epson de la línea EcoTank.
Impresoras compatibles: L4150, L4160, L4260, L4360, L6161, L6171, L6191, L6270, L6370, L14150', 'Epson', 'T504', 0, 'Excelente', 10, '/storage/Insumos/insumo_23_1783908291037f5357bb0f8a7.jpg');
INSERT INTO `insumo` (`id_insumo`,`num_serie`,`nombre`,`descripcion`,`marca`,`modelo`,`stock`,`estado`,`id_categoria`,`imagen_url`) VALUES (24, 'N/A', 'Botella de Tinta Epson Negro T504 70ML', 'Botella de tinta de color Negro modelo T504 compatible con impresoras Epson de la línea EcoTank.
Impresoras compatibles: L4150, L4160, L4260, L4360, L6161, L6171, L6191, L6270, L6370, L14150', 'Epson', 'T504', 0, 'Excelente', 10, '/storage/Insumos/insumo_24_1783908456835f5d8cf1a4f7e.jpg');
INSERT INTO `insumo` (`id_insumo`,`num_serie`,`nombre`,`descripcion`,`marca`,`modelo`,`stock`,`estado`,`id_categoria`,`imagen_url`) VALUES (25, 'N/A', 'Botella de Tinta Epson Magenta T504 70ML', 'Botella de tinta de color magenta modelo T504 compatible con impresoras Epson de la línea EcoTank.
Impresoras compatibles: L4150, L4160, L4260, L4360, L6161, L6171, L6191, L6270, L6370, L14150', 'Epson', 'T504', 0, 'Excelente', 10, '/storage/Insumos/insumo_25_17839087614146579dc5ee3e6.jpg');
INSERT INTO `insumo` (`id_insumo`,`num_serie`,`nombre`,`descripcion`,`marca`,`modelo`,`stock`,`estado`,`id_categoria`,`imagen_url`) VALUES (26, 'N/A', 'Botella de Tinta Epson Cian T504 70ML', 'Botella de tinta de color cian modelo T504 compatible con impresoras Epson de la línea EcoTank.
Impresoras compatibles: L4150, L4160, L4260, L4360, L6161, L6171, L6191, L6270, L6370, L14150', 'Epson', 'T504', 2, 'Excelente', 10, '/storage/Insumos/insumo_26_17839088765899f28db4dc01f.jpg');
INSERT INTO `insumo` (`id_insumo`,`num_serie`,`nombre`,`descripcion`,`marca`,`modelo`,`stock`,`estado`,`id_categoria`,`imagen_url`) VALUES (27, 'N/A', 'Tóner Genérico Elite Negro Xerox C230, C235', 'Tóner genérico de color negro compatible con impresoras láser Xerox de la serie C230/C235.', 'Elite', 'C230,C235', 1, 'Excelente', 10, '/storage/Insumos/insumo_27_1784049180686871bbb458709.webp');
INSERT INTO `insumo` (`id_insumo`,`num_serie`,`nombre`,`descripcion`,`marca`,`modelo`,`stock`,`estado`,`id_categoria`,`imagen_url`) VALUES (28, 'N/A', 'Tóner Genérico Elite Cian Xerox C230, C235', 'Tóner genérico de color cian compatible con impresoras láser Xerox de la serie C230/C235.', 'Elite', 'C230,C235', 1, 'Excelente', 10, '/storage/Insumos/insumo_28_178404970753386786a246846.webp');
INSERT INTO `insumo` (`id_insumo`,`num_serie`,`nombre`,`descripcion`,`marca`,`modelo`,`stock`,`estado`,`id_categoria`,`imagen_url`) VALUES (29, 'N/A', 'Tóner Genérico Elite Amarillo Xerox C230, C235', 'Tóner genérico de color amarillo compatible con impresoras láser Xerox de la serie C230/C235.', 'Elite', 'C230,C235', 1, 'Excelente', 10, '/storage/Insumos/insumo_29_178404974126014f01c92d325.webp');
INSERT INTO `insumo` (`id_insumo`,`num_serie`,`nombre`,`descripcion`,`marca`,`modelo`,`stock`,`estado`,`id_categoria`,`imagen_url`) VALUES (30, 'N/A', 'Tóner Genérico Elite Magenta Xerox C230, C235', 'Tóner genérico de color magenta compatible con impresoras láser Xerox de la serie C230/C235.', 'Elite', 'C230,C235', 1, 'Excelente', 10, '/storage/Insumos/insumo_30_17840497685194a6528a4347a.webp');
INSERT INTO `insumo` (`id_insumo`,`num_serie`,`nombre`,`descripcion`,`marca`,`modelo`,`stock`,`estado`,`id_categoria`,`imagen_url`) VALUES (31, 'N/A', 'Vorago Toallas Húmedas Desinfectantes 30 piezas', 'Para la limpieza de pantallas LCD y gabinetes de equipo de cómputo. Además de eliminar el polvo, ofrecen protección antiestática.', 'Vorago', 'N/A', 4, 'Bueno', 1, '/storage/Insumos/insumo_31_1784050965496265b9a1ce0ef.jpg');
INSERT INTO `insumo` (`id_insumo`,`num_serie`,`nombre`,`descripcion`,`marca`,`modelo`,`stock`,`estado`,`id_categoria`,`imagen_url`) VALUES (32, 'N/A', 'Memoria USB Dual HIKSEMI 3.2 (128 GB)', 'Memoria USB Dual HIKSEMI 128GB (USB 3.2 / Tipo-C): Unidad de almacenamiento con diseño compacto en cuerpo metálico resistente. Cuenta con interfaz dual (USB-A y Tipo-C) para transferencia rápida de datos, alcanzando velocidades de lectura de hasta 151 MB/s y escritura de 30 MB/s.', 'HIKSEMI', 'N/A', 5, 'Bueno', 2, '/storage/Insumos/insumo_32_1784051371286b3f37cfb3bbd.jpg');
INSERT INTO `insumo` (`id_insumo`,`num_serie`,`nombre`,`descripcion`,`marca`,`modelo`,`stock`,`estado`,`id_categoria`,`imagen_url`) VALUES (33, 'N/A', 'Cargador 1Hora Tipo-C', 'Cargador de 12W con cable integrado de 1 metro y salida de 2.4A.', '1Hora', 'N/A', 2, 'Excelente', 2, '/storage/Insumos/insumo_33_17840541005334bd9d5134382.jpg');
INSERT INTO `insumo` (`id_insumo`,`num_serie`,`nombre`,`descripcion`,`marca`,`modelo`,`stock`,`estado`,`id_categoria`,`imagen_url`) VALUES (34, 'N/A', 'Depósito de mantenimiento Epson T04D1', 'Unidad de mantenimiento reemplazable por el usuario, esencial para recolectar el exceso de tinta durante los ciclos de limpieza. Compatible con diversos modelos de impresoras Epson, incluyendo las series L6270, L6171, L14150 y SureColor F170.', 'Epson', 'T04D1', 1, 'Regular', 10, '/storage/Insumos/insumo_34_178405634053116b0a77cea7e.webp');
INSERT INTO `insumo` (`id_insumo`,`num_serie`,`nombre`,`descripcion`,`marca`,`modelo`,`stock`,`estado`,`id_categoria`,`imagen_url`) VALUES (35, 'N/A', 'Adaptador UGREEN USB-C a Ethernet (Gigabit 1000 Mbps)', 'Adaptador de red de alta velocidad que permite una conexión cableada estable para dispositivos con puerto USB-C. Ofrece velocidades de hasta 1000 Mbps. Cuenta con carcasa de aluminio para un mejor aislamiento térmico y diseño compacto.', 'UGREEN', 'N/A', 3, 'Excelente', 2, '/storage/Insumos/insumo_35_1784056681756967d26ec6c55.jpg');
INSERT INTO `insumo` (`id_insumo`,`num_serie`,`nombre`,`descripcion`,`marca`,`modelo`,`stock`,`estado`,`id_categoria`,`imagen_url`) VALUES (36, 'N/A', 'Memoria RAM Kingston 8GB DDR4 (2666MHz, SODIMM)', 'Módulo de memoria diseñado para laptops, con una frecuencia de 2666 MHz y latencia CL19. Este componente optimiza el rendimiento multitarea y la velocidad de respuesta del sistema.', 'Kingston', 'KCP426SS8/8', 2, 'Bueno', 2, '/storage/Insumos/insumo_36_1784057045266e0a19866dd7f.jpg');
INSERT INTO `insumo` (`id_insumo`,`num_serie`,`nombre`,`descripcion`,`marca`,`modelo`,`stock`,`estado`,`id_categoria`,`imagen_url`) VALUES (37, 'N/A', 'Memoria RAM Kingston 8GB DDR3L (1600MHz, SODIMM)', 'Módulo de memoria de bajo voltaje (1.35V) diseñado específicamente para laptops. Con una frecuencia de 1600 MHz.', 'Kingston', 'KVR16LS11/8WP', 7, 'Bueno', 2, '/storage/Insumos/insumo_37_1784057388509dc27abb8d616.webp');
INSERT INTO `insumo` (`id_insumo`,`num_serie`,`nombre`,`descripcion`,`marca`,`modelo`,`stock`,`estado`,`id_categoria`,`imagen_url`) VALUES (38, 'N/A', 'Carcasa UGREEN M.2 NVMe (USB 3.2 Gen 2)', 'Gabinete de aluminio de alta calidad para unidades SSD M.2 NVMe, diseñado para ofrecer velocidades de transferencia de hasta 10 Gbps. Compatible con SSDs de diversos formatos (2230 a 2280) y capacidades de hasta 8 TB.', 'UGREEN', 'N/A', 2, 'Excelente', 2, '/storage/Insumos/insumo_38_1784057599515284231e44b64.webp');
INSERT INTO `insumo` (`id_insumo`,`num_serie`,`nombre`,`descripcion`,`marca`,`modelo`,`stock`,`estado`,`id_categoria`,`imagen_url`) VALUES (39, 'N/A', 'Batería CMOS Manhattan CR2032 (3V, 2 piezas)', 'Set de dos pilas de litio de alta durabilidad, diseñadas para mantener la configuración de BIOS y el reloj en tiempo real de equipos de cómputo y otros dispositivos electrónicos.', 'Manhattan', 'N/A', 2, 'Excelente', 16, '/storage/Insumos/insumo_39_1784058093398176de1e8c500.jpg');
INSERT INTO `insumo` (`id_insumo`,`num_serie`,`nombre`,`descripcion`,`marca`,`modelo`,`stock`,`estado`,`id_categoria`,`imagen_url`) VALUES (40, 'N/A', 'Adaptador StarTech.com USB-C a Ethernet Gigabit (con Power Delivery)', 'Adaptador de red de alto rendimiento que permite conexiones alámbricas estables de hasta 1000 Mbps. Su diseño compacto incluye funcionalidad de entrega de potencia (Power Delivery).', 'StarTech.com', 'N/A', 2, 'Excelente', 2, '/storage/Insumos/insumo_40_17840582808002aff75b27ab0.jpg');
INSERT INTO `insumo` (`id_insumo`,`num_serie`,`nombre`,`descripcion`,`marca`,`modelo`,`stock`,`estado`,`id_categoria`,`imagen_url`) VALUES (41, 'N/A', 'Botella de Tinta Epson Amarillo 664 70ML', 'Botella de tinta de color amarillo modelo T664 compatible con impresoras Epson de la línea EcoTank.
Es compatible con los modelos: L475, L200, L565, L110, L1300, L455, L310, L575, L220, L850, L375, L495, L365, L121, L395 y L380.', 'Epson', 'T664', 10, 'Bueno', 10, '/storage/Insumos/insumo_41_1784059768166e64f947cf980.png');
INSERT INTO `insumo` (`id_insumo`,`num_serie`,`nombre`,`descripcion`,`marca`,`modelo`,`stock`,`estado`,`id_categoria`,`imagen_url`) VALUES (42, 'N/A', 'Botella de Tinta Epson Cian 664 70ML', 'Botella de tinta de color cian modelo T664 compatible con impresoras Epson de la línea EcoTank.
Es compatible con los modelos L475, L200, L565, L110, L1300, L455, L310, L575, L220, L850, L375, L495, L365, L121, L395 y L380.', 'Epson', 'T664', 2, 'Bueno', 10, '/storage/Insumos/insumo_42_178405975904248a1952ab832.png');
INSERT INTO `insumo` (`id_insumo`,`num_serie`,`nombre`,`descripcion`,`marca`,`modelo`,`stock`,`estado`,`id_categoria`,`imagen_url`) VALUES (43, 'N/A', 'Botella de Tinta Epson Negro 664 70ML', 'Botella de tinta de color negro modelo T664 compatible con impresoras Epson de la línea EcoTank. Es compatible con los modelos L475, L200, L565, L110, L1300, L455, L310, L575, L220, L850, L375, L495, L365, L121, L395 y L380.', 'Epson', 'T664', 1, 'Excelente', 10, '/storage/Insumos/insumo_43_1784059811709204bf6aa1e3b.png');
INSERT INTO `insumo` (`id_insumo`,`num_serie`,`nombre`,`descripcion`,`marca`,`modelo`,`stock`,`estado`,`id_categoria`,`imagen_url`) VALUES (44, 'N/A', 'Botella de Tinta Epson Magenta 664 70ML', 'Botella de tinta de color magenta modelo T664 compatible con impresoras Epson de la línea EcoTank. Es compatible con los modelos L475, L200, L565, L110, L1300, L455, L310, L575, L220, L850, L375, L495, L365, L121, L395 y L380.', 'Epson', 'T664', 2, 'Bueno', 10, '/storage/Insumos/insumo_44_1784060170707fd52f008ad76.png');
INSERT INTO `insumo` (`id_insumo`,`num_serie`,`nombre`,`descripcion`,`marca`,`modelo`,`stock`,`estado`,`id_categoria`,`imagen_url`) VALUES (45, 'N/A', 'Teclado Dell Alámbrico KB216', 'Teclado ergonómico de estilo chiclet cuenta con teclas de acceso directo multimedia, una conexión USB 2.0 mediante un cable de 1.8 metros.', 'DELL', 'KB216T1', 3, 'Excelente', 2, '/storage/Insumos/insumo_45_17840607564364eb025a575dd.webp');
INSERT INTO `insumo` (`id_insumo`,`num_serie`,`nombre`,`descripcion`,`marca`,`modelo`,`stock`,`estado`,`id_categoria`,`imagen_url`) VALUES (46, 'N/A', 'Mouse Dell MS116 Alámbrico (Óptico)', 'Mouse de diseño ergonómico y ambidextro, ideal para un uso cómodo y prolongado en tareas de oficina. Cuenta con un sensor óptico de 1000 DPI.', 'DELL', 'MS116T1', 2, 'Excelente', 2, '/storage/Insumos/insumo_46_17840612462196dc242c7fe2c.webp');
INSERT INTO `insumo` (`id_insumo`,`num_serie`,`nombre`,`descripcion`,`marca`,`modelo`,`stock`,`estado`,`id_categoria`,`imagen_url`) VALUES (47, 'N/A', 'Mouse Inalámbrico Logitech M190', 'Mouse de tamaño completo con diseño ergonómico contorneado, ideal para manos de medianas a grandes. Cuenta con tecnología de seguimiento óptico de 1000 DPI.', 'Logitech', 'M190', 2, 'Excelente', 2, '/storage/Insumos/insumo_47_178406176272915afc30b544c.png');
INSERT INTO `insumo` (`id_insumo`,`num_serie`,`nombre`,`descripcion`,`marca`,`modelo`,`stock`,`estado`,`id_categoria`,`imagen_url`) VALUES (48, 'N/A', 'Tinta Universal Premium Ink (Negro, 127 ml)', 'Botella de tinta de color negro compatible con impresoras Epson de la línea EcoTank.
Es compatible con los modelos: L4150, L4160, L6161, L6171, L6191, L6270, T544 L1110, L3110, L3150, L3210, L5190', 'Premium INK', 'N/A', 6, 'Bueno', 10, '/storage/Insumos/insumo_48_178406308030729f5a1e00d58.jpg');
INSERT INTO `insumo` (`id_insumo`,`num_serie`,`nombre`,`descripcion`,`marca`,`modelo`,`stock`,`estado`,`id_categoria`,`imagen_url`) VALUES (49, 'N/A', 'Tinta Universal Premium Ink (Cian, 127 ml)', 'Botella de tinta de color cian compatible con impresoras Epson de la línea EcoTank.
Es compatible con los modelos: L4150, L4160, L6161, L6171, L6191, L6270, T544 L1110, L3110, L3150, L3210, L5190', 'Premium INK', 'N/A', 4, 'Bueno', 10, '/storage/Insumos/insumo_49_1784063070201936f8c4cabef.jpg');
INSERT INTO `insumo` (`id_insumo`,`num_serie`,`nombre`,`descripcion`,`marca`,`modelo`,`stock`,`estado`,`id_categoria`,`imagen_url`) VALUES (50, 'N/A', 'Tinta Universal Premium Ink (Amarillo, 127 ml)', 'Botella de tinta de color amarillo compatible con impresoras Epson de la línea EcoTank.
Es compatible con los modelos: L4150, L4160, L6161, L6171, L6191, L6270, T544 L1110, L3110, L3150, L3210, L5190', 'Premium INK', 'N/A', 4, 'Bueno', 10, '/storage/Insumos/insumo_50_1784063152479a2ff1687f9c6.jpg');
INSERT INTO `insumo` (`id_insumo`,`num_serie`,`nombre`,`descripcion`,`marca`,`modelo`,`stock`,`estado`,`id_categoria`,`imagen_url`) VALUES (51, 'N/A', 'Tinta Universal Premium Ink (Magenta, 127 ml)', 'Botella de tinta de color magenta compatible con impresoras Epson de la línea EcoTank.
Es compatible con los modelos: L4150, L4160, L6161, L6171, L6191, L6270, T544 L1110, L3110, L3150, L3210, L5190', 'Premium INK', 'N/A', 4, 'Bueno', 10, '/storage/Insumos/insumo_51_1784063206210d7808add58c4.jpg');
INSERT INTO `insumo` (`id_insumo`,`num_serie`,`nombre`,`descripcion`,`marca`,`modelo`,`stock`,`estado`,`id_categoria`,`imagen_url`) VALUES (52, 'N/A', 'EL TIGRE Toner Compatible con HP, Negro', 'Cartucho de tóner color negro modelo de la marca EL TIGRE compatible con impresoras HP LaserJet Pro.
Modelos compatibles: M15W, M15A, M28W, M28A', 'Cartucho Tigre', 'CF248ACOMP-AI', 9, 'Excelente', 10, '/storage/Insumos/insumo_52_17840699629665aed70da318c.jpg');
INSERT INTO `insumo` (`id_insumo`,`num_serie`,`nombre`,`descripcion`,`marca`,`modelo`,`stock`,`estado`,`id_categoria`,`imagen_url`) VALUES (53, 'NA', 'Rollo de etiquetas blancas', '85*25cm', 'NA', 'NA', 62, 'Excelente', 10, '/storage/Insumos/insumo_53_17907876579921b9a42d608d9.jpg');
INSERT INTO `insumo` (`id_insumo`,`num_serie`,`nombre`,`descripcion`,`marca`,`modelo`,`stock`,`estado`,`id_categoria`,`imagen_url`) VALUES (54, 'N/A', 'Rollo de etiquetas blancas Tyvek', '100x60cm', 'NA', 'N/A', 54, 'Bueno', 10, '/storage/Insumos/insumo_54_1790787821099bd218f5a4344.jpg');
INSERT INTO `insumo` (`id_insumo`,`num_serie`,`nombre`,`descripcion`,`marca`,`modelo`,`stock`,`estado`,`id_categoria`,`imagen_url`) VALUES (55, 'R126C00002', 'Etiqueta 85 x 25 Amarilla', 'Rollo de etiqueta 85cm*25cm Amarilla, Impresoras compatibles: GC420T, ZD420T', 'NA', 'N/A', 27, 'Bueno', 10, '/storage/Insumos/insumo_55_179078792084827d11c7eeb7a.jpg');
INSERT INTO `insumo` (`id_insumo`,`num_serie`,`nombre`,`descripcion`,`marca`,`modelo`,`stock`,`estado`,`id_categoria`,`imagen_url`) VALUES (56, 'R126C00001', 'Etiqueta 102 x 63 Amarilla', 'Rollo de etiquetas 102*63 Amarilla, Impresoras compatibles: GC420T, ZD420T', 'N/A', 'N/A', 32, 'Bueno', 10, '/storage/Insumos/insumo_56_1790788088279ca374b3d9de0.jpg');
INSERT INTO `insumo` (`id_insumo`,`num_serie`,`nombre`,`descripcion`,`marca`,`modelo`,`stock`,`estado`,`id_categoria`,`imagen_url`) VALUES (57, 'R126C00003', 'Etiqueta 85 x 25 Azul', 'Rollo de etiqueta 85cm*25cm Azul', 'N/A', 'N/A', 34, 'Bueno', 10, '/storage/Insumos/insumo_57_17907886779617680a8bb0301.jpg');


-- ---------------------------------------------------------
-- Tabla: manual
-- ---------------------------------------------------------
DROP TABLE IF EXISTS `manual`;
CREATE TABLE `manual` (
  `id_manual` int unsigned NOT NULL AUTO_INCREMENT,
  `nombre` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `descripcion` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `version` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `subido_por` int DEFAULT NULL,
  `fecha_subida` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `fecha_cambio` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `ruta_pdf` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `id_categoria` int NOT NULL,
  PRIMARY KEY (`id_manual`),
  KEY `idx_manual_categoria` (`id_categoria`),
  KEY `fk_manual_empleado` (`subido_por`),
  CONSTRAINT `fk_manual_categoria` FOREIGN KEY (`id_categoria`) REFERENCES `categoria` (`id_categoria`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_manual_empleado` FOREIGN KEY (`subido_por`) REFERENCES `empleado` (`id_empleado`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5 registro(s)
INSERT INTO `manual` (`id_manual`,`nombre`,`descripcion`,`version`,`subido_por`,`fecha_subida`,`fecha_cambio`,`ruta_pdf`,`id_categoria`) VALUES (1, 'Guía de solución de problemas', 'Guía técnica para la identificación y resolución de problemas comunes en los equipos y sistemas de Precision Trucks Parts & Accessories.', NULL, NULL, '2026-07-07 05:59:32', '2026-07-07 05:59:32', 'Manuales/Manual_2026_Guia_de_solucion_de_problemas.pdf', 1);
INSERT INTO `manual` (`id_manual`,`nombre`,`descripcion`,`version`,`subido_por`,`fecha_subida`,`fecha_cambio`,`ruta_pdf`,`id_categoria`) VALUES (2, '2020 Scrum Guide Spanish European', 'La Guía Scrum 2020 define el marco de trabajo Scrum. Simplifica el lenguaje, introduce el Objetivo del Producto y enfatiza el empirismo mediante transparencia, inspección y adaptación.', NULL, NULL, '2026-07-07 06:00:42', '2026-07-07 06:00:42', 'Manuales/Manual_2026_2020_Scrum_Guide_Spanish_European.pdf', 16);
INSERT INTO `manual` (`id_manual`,`nombre`,`descripcion`,`version`,`subido_por`,`fecha_subida`,`fecha_cambio`,`ruta_pdf`,`id_categoria`) VALUES (3, 'Manual de soluciones de soporte', 'Guía integral sobre procedimientos, programas y políticas de soporte técnico. Define niveles de gravedad, responsabilidades y gestión de casos para la resolución eficiente de problemas técnicos.', NULL, NULL, '2026-07-07 06:05:05', '2026-07-07 06:05:05', 'Manuales/Manual_2026_Manual_de_soluciones_de_soporte.pdf', 1);
INSERT INTO `manual` (`id_manual`,`nombre`,`descripcion`,`version`,`subido_por`,`fecha_subida`,`fecha_cambio`,`ruta_pdf`,`id_categoria`) VALUES (4, 'Guía como crear una copia de seguridad', 'Las copias de seguridad protegen información valiosa ante fallos, robos o infecciones de virus. Cubre copias completas o parciales, locales y en la nube.', NULL, NULL, '2026-07-07 06:07:30', '2026-07-07 06:07:30', 'Manuales/Manual_2026_Guia_como_crear_una_copia_de_seguridad.pdf', 7);
INSERT INTO `manual` (`id_manual`,`nombre`,`descripcion`,`version`,`subido_por`,`fecha_subida`,`fecha_cambio`,`ruta_pdf`,`id_categoria`) VALUES (5, 'Guía de Seguridad y Privacidad: Comparativa de Navegadores Web', 'Análisis de funciones de seguridad y privacidad en Chrome, Safari, Firefox, Edge y Opera. Examina modo incógnito, bloqueadores de rastreo, antiphishing y actualizaciones automáticas.', NULL, NULL, '2026-07-07 06:11:09', '2026-07-07 06:11:09', 'Manuales/Manual_2026_Guia_de_Seguridad_y_Privacidad_Comparativa_de_Navegadores_We.pdf', 16);


-- ---------------------------------------------------------
-- Tabla: movimiento_inventario
-- ---------------------------------------------------------
DROP TABLE IF EXISTS `movimiento_inventario`;
CREATE TABLE `movimiento_inventario` (
  `id_movimiento` int NOT NULL AUTO_INCREMENT,
  `id_insumo` int NOT NULL,
  `tipo` enum('Entrada','Salida','Ajuste') NOT NULL,
  `cantidad` int NOT NULL,
  `stock_anterior` int NOT NULL DEFAULT '0',
  `stock_nuevo` int NOT NULL DEFAULT '0',
  `id_sucursal_origen` int DEFAULT NULL,
  `id_sucursal_destino` int DEFAULT NULL,
  `id_solicitud` int DEFAULT NULL,
  `id_empleado` int DEFAULT NULL,
  `motivo` varchar(500) DEFAULT NULL,
  `fecha` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_movimiento`),
  KEY `fk_mi_suc_origen` (`id_sucursal_origen`),
  KEY `fk_mi_suc_dest` (`id_sucursal_destino`),
  KEY `fk_mi_empleado` (`id_empleado`),
  KEY `idx_mi_insumo_fecha` (`id_insumo`,`fecha`),
  KEY `idx_mi_tipo_fecha` (`tipo`,`fecha`),
  KEY `idx_mi_solicitud` (`id_solicitud`),
  CONSTRAINT `fk_mi_empleado` FOREIGN KEY (`id_empleado`) REFERENCES `empleado` (`id_empleado`) ON DELETE SET NULL,
  CONSTRAINT `fk_mi_insumo` FOREIGN KEY (`id_insumo`) REFERENCES `insumo` (`id_insumo`) ON DELETE CASCADE,
  CONSTRAINT `fk_mi_solicitud` FOREIGN KEY (`id_solicitud`) REFERENCES `solicitud` (`id_solicitud`) ON DELETE SET NULL,
  CONSTRAINT `fk_mi_suc_dest` FOREIGN KEY (`id_sucursal_destino`) REFERENCES `sucursal` (`id_sucursal`) ON DELETE SET NULL,
  CONSTRAINT `fk_mi_suc_origen` FOREIGN KEY (`id_sucursal_origen`) REFERENCES `sucursal` (`id_sucursal`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 4 registro(s)
INSERT INTO `movimiento_inventario` (`id_movimiento`,`id_insumo`,`tipo`,`cantidad`,`stock_anterior`,`stock_nuevo`,`id_sucursal_origen`,`id_sucursal_destino`,`id_solicitud`,`id_empleado`,`motivo`,`fecha`) VALUES (3, 11, 'Entrada', 1, 0, 1, NULL, 4, NULL, 21, 'Entrada de material al inventario', '2026-09-30 21:24:05');
INSERT INTO `movimiento_inventario` (`id_movimiento`,`id_insumo`,`tipo`,`cantidad`,`stock_anterior`,`stock_nuevo`,`id_sucursal_origen`,`id_sucursal_destino`,`id_solicitud`,`id_empleado`,`motivo`,`fecha`) VALUES (4, 11, 'Entrada', 2, 1, 3, NULL, 4, NULL, 4, 'Entrada de material al inventario', '2026-10-01 00:02:44');
INSERT INTO `movimiento_inventario` (`id_movimiento`,`id_insumo`,`tipo`,`cantidad`,`stock_anterior`,`stock_nuevo`,`id_sucursal_origen`,`id_sucursal_destino`,`id_solicitud`,`id_empleado`,`motivo`,`fecha`) VALUES (5, 26, 'Entrada', 1, 1, 2, NULL, 4, NULL, 4, 'Entrada de material al inventario', '2026-10-01 00:23:37');
INSERT INTO `movimiento_inventario` (`id_movimiento`,`id_insumo`,`tipo`,`cantidad`,`stock_anterior`,`stock_nuevo`,`id_sucursal_origen`,`id_sucursal_destino`,`id_solicitud`,`id_empleado`,`motivo`,`fecha`) VALUES (6, 11, 'Salida', 1, 3, 2, 4, 5, 37, 4, 'Entrega de material por solicitud SOL-202610-001', '2026-10-01 18:14:34');


-- ---------------------------------------------------------
-- Tabla: solicitud
-- ---------------------------------------------------------
DROP TABLE IF EXISTS `solicitud`;
CREATE TABLE `solicitud` (
  `id_solicitud` int NOT NULL AUTO_INCREMENT,
  `folio_solicitud` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `fecha` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `estatus` enum('En proceso','Aceptado','Rechazado','Pendiente','Resuelto','No Resuelto') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'En proceso',
  `prioridad` enum('Baja','Media','Alta','Urgente') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Media',
  `id_empleado` int NOT NULL,
  `id_sucursal_origen` int DEFAULT NULL,
  `id_sucursal_destino` int DEFAULT NULL,
  `fecha_atencion` datetime DEFAULT NULL,
  `observacion` text COLLATE utf8mb4_unicode_ci,
  `observacion_por` int DEFAULT NULL,
  `observacion_fecha` datetime DEFAULT NULL,
  PRIMARY KEY (`id_solicitud`),
  UNIQUE KEY `uq_folio` (`folio_solicitud`),
  KEY `fk_sol_empleado` (`id_empleado`),
  KEY `idx_solicitud_estatus_fecha` (`estatus`,`fecha`),
  KEY `idx_solicitud_empleado` (`id_empleado`),
  KEY `fk_solicitud_sucursal_destino` (`id_sucursal_destino`),
  KEY `idx_solicitud_ruta` (`id_sucursal_origen`,`id_sucursal_destino`),
  CONSTRAINT `fk_sol_empleado` FOREIGN KEY (`id_empleado`) REFERENCES `empleado` (`id_empleado`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_solicitud_sucursal_destino` FOREIGN KEY (`id_sucursal_destino`) REFERENCES `sucursal` (`id_sucursal`) ON DELETE SET NULL,
  CONSTRAINT `fk_solicitud_sucursal_origen` FOREIGN KEY (`id_sucursal_origen`) REFERENCES `sucursal` (`id_sucursal`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=40 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 34 registro(s)
INSERT INTO `solicitud` (`id_solicitud`,`folio_solicitud`,`fecha`,`estatus`,`prioridad`,`id_empleado`,`id_sucursal_origen`,`id_sucursal_destino`,`fecha_atencion`) VALUES (1, 'SOL-202603-001', '2026-03-05 14:30:00', 'Aceptado', 'Media', 15, NULL, NULL, NULL);
INSERT INTO `solicitud` (`id_solicitud`,`folio_solicitud`,`fecha`,`estatus`,`prioridad`,`id_empleado`,`id_sucursal_origen`,`id_sucursal_destino`,`fecha_atencion`) VALUES (2, 'SOL-202603-002', '2026-03-10 09:15:00', 'Aceptado', 'Alta', 16, NULL, NULL, NULL);
INSERT INTO `solicitud` (`id_solicitud`,`folio_solicitud`,`fecha`,`estatus`,`prioridad`,`id_empleado`,`id_sucursal_origen`,`id_sucursal_destino`,`fecha_atencion`) VALUES (3, 'SOL-202603-003', '2026-03-14 11:00:00', 'Aceptado', 'Media', 17, NULL, NULL, NULL);
INSERT INTO `solicitud` (`id_solicitud`,`folio_solicitud`,`fecha`,`estatus`,`prioridad`,`id_empleado`,`id_sucursal_origen`,`id_sucursal_destino`,`fecha_atencion`) VALUES (4, 'SOL-202603-004', '2026-03-18 10:30:00', 'Aceptado', 'Urgente', 18, NULL, NULL, NULL);
INSERT INTO `solicitud` (`id_solicitud`,`folio_solicitud`,`fecha`,`estatus`,`prioridad`,`id_empleado`,`id_sucursal_origen`,`id_sucursal_destino`,`fecha_atencion`) VALUES (5, 'SOL-202603-005', '2026-03-24 15:00:00', 'Rechazado', 'Baja', 19, NULL, NULL, NULL);
INSERT INTO `solicitud` (`id_solicitud`,`folio_solicitud`,`fecha`,`estatus`,`prioridad`,`id_empleado`,`id_sucursal_origen`,`id_sucursal_destino`,`fecha_atencion`) VALUES (6, 'SOL-202604-001', '2026-04-02 09:00:00', 'Aceptado', 'Media', 15, NULL, NULL, NULL);
INSERT INTO `solicitud` (`id_solicitud`,`folio_solicitud`,`fecha`,`estatus`,`prioridad`,`id_empleado`,`id_sucursal_origen`,`id_sucursal_destino`,`fecha_atencion`) VALUES (7, 'SOL-202604-002', '2026-04-08 10:30:00', 'Aceptado', 'Alta', 16, NULL, NULL, NULL);
INSERT INTO `solicitud` (`id_solicitud`,`folio_solicitud`,`fecha`,`estatus`,`prioridad`,`id_empleado`,`id_sucursal_origen`,`id_sucursal_destino`,`fecha_atencion`) VALUES (8, 'SOL-202604-003', '2026-04-10 14:00:00', 'Aceptado', 'Media', 17, NULL, NULL, NULL);
INSERT INTO `solicitud` (`id_solicitud`,`folio_solicitud`,`fecha`,`estatus`,`prioridad`,`id_empleado`,`id_sucursal_origen`,`id_sucursal_destino`,`fecha_atencion`) VALUES (9, 'SOL-202604-004', '2026-04-15 11:30:00', 'Aceptado', 'Baja', 18, NULL, NULL, NULL);
INSERT INTO `solicitud` (`id_solicitud`,`folio_solicitud`,`fecha`,`estatus`,`prioridad`,`id_empleado`,`id_sucursal_origen`,`id_sucursal_destino`,`fecha_atencion`) VALUES (10, 'SOL-202604-005', '2026-04-21 16:00:00', 'Rechazado', 'Media', 19, NULL, NULL, NULL);
INSERT INTO `solicitud` (`id_solicitud`,`folio_solicitud`,`fecha`,`estatus`,`prioridad`,`id_empleado`,`id_sucursal_origen`,`id_sucursal_destino`,`fecha_atencion`) VALUES (11, 'SOL-202605-001', '2026-05-07 09:30:00', 'Aceptado', 'Alta', 15, NULL, NULL, NULL);
INSERT INTO `solicitud` (`id_solicitud`,`folio_solicitud`,`fecha`,`estatus`,`prioridad`,`id_empleado`,`id_sucursal_origen`,`id_sucursal_destino`,`fecha_atencion`) VALUES (12, 'SOL-202605-002', '2026-05-14 10:00:00', 'Aceptado', 'Media', 16, NULL, NULL, NULL);
INSERT INTO `solicitud` (`id_solicitud`,`folio_solicitud`,`fecha`,`estatus`,`prioridad`,`id_empleado`,`id_sucursal_origen`,`id_sucursal_destino`,`fecha_atencion`) VALUES (13, 'SOL-202605-003', '2026-05-20 14:30:00', 'Aceptado', 'Media', 17, NULL, NULL, NULL);
INSERT INTO `solicitud` (`id_solicitud`,`folio_solicitud`,`fecha`,`estatus`,`prioridad`,`id_empleado`,`id_sucursal_origen`,`id_sucursal_destino`,`fecha_atencion`) VALUES (14, 'SOL-202605-004', '2026-05-26 09:00:00', 'Rechazado', 'Baja', 18, NULL, NULL, NULL);
INSERT INTO `solicitud` (`id_solicitud`,`folio_solicitud`,`fecha`,`estatus`,`prioridad`,`id_empleado`,`id_sucursal_origen`,`id_sucursal_destino`,`fecha_atencion`) VALUES (15, 'SOL-202605-005', '2026-05-28 11:00:00', 'Rechazado', 'Alta', 19, NULL, NULL, NULL);
INSERT INTO `solicitud` (`id_solicitud`,`folio_solicitud`,`fecha`,`estatus`,`prioridad`,`id_empleado`,`id_sucursal_origen`,`id_sucursal_destino`,`fecha_atencion`) VALUES (16, 'SOL-202606-001', '2026-06-03 10:00:00', 'Aceptado', 'Media', 15, NULL, NULL, NULL);
INSERT INTO `solicitud` (`id_solicitud`,`folio_solicitud`,`fecha`,`estatus`,`prioridad`,`id_empleado`,`id_sucursal_origen`,`id_sucursal_destino`,`fecha_atencion`) VALUES (17, 'SOL-202606-002', '2026-06-09 09:30:00', 'Aceptado', 'Alta', 16, NULL, NULL, NULL);
INSERT INTO `solicitud` (`id_solicitud`,`folio_solicitud`,`fecha`,`estatus`,`prioridad`,`id_empleado`,`id_sucursal_origen`,`id_sucursal_destino`,`fecha_atencion`) VALUES (18, 'SOL-202606-003', '2026-06-13 14:00:00', 'Aceptado', 'Media', 17, NULL, NULL, NULL);
INSERT INTO `solicitud` (`id_solicitud`,`folio_solicitud`,`fecha`,`estatus`,`prioridad`,`id_empleado`,`id_sucursal_origen`,`id_sucursal_destino`,`fecha_atencion`) VALUES (19, 'SOL-202606-004', '2026-06-17 10:30:00', 'Rechazado', 'Baja', 18, NULL, NULL, NULL);
INSERT INTO `solicitud` (`id_solicitud`,`folio_solicitud`,`fecha`,`estatus`,`prioridad`,`id_empleado`,`id_sucursal_origen`,`id_sucursal_destino`,`fecha_atencion`) VALUES (20, 'SOL-202606-005', '2026-06-20 15:00:00', 'Rechazado', 'Media', 19, NULL, NULL, NULL);
INSERT INTO `solicitud` (`id_solicitud`,`folio_solicitud`,`fecha`,`estatus`,`prioridad`,`id_empleado`,`id_sucursal_origen`,`id_sucursal_destino`,`fecha_atencion`) VALUES (21, 'SOL-202607-001', '2026-07-07 09:00:00', 'Aceptado', 'Alta', 10, NULL, NULL, NULL);
INSERT INTO `solicitud` (`id_solicitud`,`folio_solicitud`,`fecha`,`estatus`,`prioridad`,`id_empleado`,`id_sucursal_origen`,`id_sucursal_destino`,`fecha_atencion`) VALUES (22, 'SOL-202607-002', '2026-07-12 10:30:00', 'Aceptado', 'Media', 10, NULL, NULL, NULL);
INSERT INTO `solicitud` (`id_solicitud`,`folio_solicitud`,`fecha`,`estatus`,`prioridad`,`id_empleado`,`id_sucursal_origen`,`id_sucursal_destino`,`fecha_atencion`) VALUES (23, 'SOL-202607-003', '2026-07-16 14:00:00', 'Rechazado', 'Urgente', 10, NULL, NULL, NULL);
INSERT INTO `solicitud` (`id_solicitud`,`folio_solicitud`,`fecha`,`estatus`,`prioridad`,`id_empleado`,`id_sucursal_origen`,`id_sucursal_destino`,`fecha_atencion`) VALUES (24, 'SOL-202607-004', '2026-07-21 21:01:10', 'Aceptado', 'Media', 10, NULL, NULL, NULL);
INSERT INTO `solicitud` (`id_solicitud`,`folio_solicitud`,`fecha`,`estatus`,`prioridad`,`id_empleado`,`id_sucursal_origen`,`id_sucursal_destino`,`fecha_atencion`) VALUES (25, 'SOL-202607-005', '2026-07-21 21:11:47', 'Aceptado', 'Alta', 10, NULL, NULL, NULL);
INSERT INTO `solicitud` (`id_solicitud`,`folio_solicitud`,`fecha`,`estatus`,`prioridad`,`id_empleado`,`id_sucursal_origen`,`id_sucursal_destino`,`fecha_atencion`) VALUES (26, 'SOL-202607-006', '2026-07-21 21:16:03', 'Aceptado', 'Media', 10, NULL, NULL, NULL);
INSERT INTO `solicitud` (`id_solicitud`,`folio_solicitud`,`fecha`,`estatus`,`prioridad`,`id_empleado`,`id_sucursal_origen`,`id_sucursal_destino`,`fecha_atencion`) VALUES (27, 'SOL-202607-007', '2026-07-21 22:11:05', 'Aceptado', 'Urgente', 10, NULL, NULL, NULL);
INSERT INTO `solicitud` (`id_solicitud`,`folio_solicitud`,`fecha`,`estatus`,`prioridad`,`id_empleado`,`id_sucursal_origen`,`id_sucursal_destino`,`fecha_atencion`) VALUES (28, 'SOL-202607-008', '2026-07-21 22:18:36', 'Aceptado', 'Alta', 10, NULL, NULL, NULL);
INSERT INTO `solicitud` (`id_solicitud`,`folio_solicitud`,`fecha`,`estatus`,`prioridad`,`id_empleado`,`id_sucursal_origen`,`id_sucursal_destino`,`fecha_atencion`) VALUES (29, 'SOL-202607-009', '2026-07-21 22:22:35', 'Aceptado', 'Urgente', 10, NULL, NULL, NULL);
INSERT INTO `solicitud` (`id_solicitud`,`folio_solicitud`,`fecha`,`estatus`,`prioridad`,`id_empleado`,`id_sucursal_origen`,`id_sucursal_destino`,`fecha_atencion`) VALUES (30, 'SOL-202607-010', '2026-07-21 22:30:33', 'Aceptado', 'Alta', 10, NULL, NULL, NULL);
INSERT INTO `solicitud` (`id_solicitud`,`folio_solicitud`,`fecha`,`estatus`,`prioridad`,`id_empleado`,`id_sucursal_origen`,`id_sucursal_destino`,`fecha_atencion`) VALUES (31, 'SOL-202607-011', '2026-07-21 22:34:38', 'Aceptado', 'Media', 10, NULL, NULL, NULL);
INSERT INTO `solicitud` (`id_solicitud`,`folio_solicitud`,`fecha`,`estatus`,`prioridad`,`id_empleado`,`id_sucursal_origen`,`id_sucursal_destino`,`fecha_atencion`) VALUES (32, 'SOL-202608-001', '2026-08-04 20:08:37', 'Aceptado', 'Urgente', 10, NULL, NULL, NULL);
INSERT INTO `solicitud` (`id_solicitud`,`folio_solicitud`,`fecha`,`estatus`,`prioridad`,`id_empleado`,`id_sucursal_origen`,`id_sucursal_destino`,`fecha_atencion`) VALUES (33, 'SOL-202609-001', '2026-09-29 21:23:39', 'Aceptado', 'Urgente', 28, NULL, NULL, NULL);
INSERT INTO `solicitud` (`id_solicitud`,`folio_solicitud`,`fecha`,`estatus`,`prioridad`,`id_empleado`,`id_sucursal_origen`,`id_sucursal_destino`,`fecha_atencion`) VALUES (37, 'SOL-202610-001', '2026-10-01 18:07:48', 'Aceptado', 'Urgente', 10, 4, 5, '2026-10-01 18:14:34');


-- ---------------------------------------------------------
-- Tabla: solicitud_insumo
-- ---------------------------------------------------------
DROP TABLE IF EXISTS `solicitud_insumo`;
CREATE TABLE `solicitud_insumo` (
  `id_solicitud_insumo` int NOT NULL AUTO_INCREMENT,
  `id_solicitud` int NOT NULL,
  `id_insumo` int NOT NULL,
  `descripcion` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `cantidad` int NOT NULL DEFAULT '1',
  `cantidad_aprobada` int DEFAULT NULL,
  `aprobado` tinyint(1) DEFAULT NULL,
  PRIMARY KEY (`id_solicitud_insumo`),
  KEY `fk_si_solicitud` (`id_solicitud`),
  KEY `fk_si_insumo` (`id_insumo`),
  CONSTRAINT `fk_si_insumo` FOREIGN KEY (`id_insumo`) REFERENCES `insumo` (`id_insumo`) ON DELETE RESTRICT,
  CONSTRAINT `fk_si_solicitud` FOREIGN KEY (`id_solicitud`) REFERENCES `solicitud` (`id_solicitud`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=72 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 67 registro(s)
INSERT INTO `solicitud_insumo` (`id_solicitud_insumo`,`id_solicitud`,`id_insumo`,`descripcion`,`cantidad`,`cantidad_aprobada`,`aprobado`) VALUES (1, 1, 13, 'Toallitas para limpieza de equipos del área', 2, NULL, 1);
INSERT INTO `solicitud_insumo` (`id_solicitud_insumo`,`id_solicitud`,`id_insumo`,`descripcion`,`cantidad`,`cantidad_aprobada`,`aprobado`) VALUES (2, 1, 14, 'Espuma limpiadora para monitores', 1, NULL, 1);
INSERT INTO `solicitud_insumo` (`id_solicitud_insumo`,`id_solicitud`,`id_insumo`,`descripcion`,`cantidad`,`cantidad_aprobada`,`aprobado`) VALUES (3, 2, 36, 'Módulo RAM para laptop con fallo de memoria', 1, NULL, 1);
INSERT INTO `solicitud_insumo` (`id_solicitud_insumo`,`id_solicitud`,`id_insumo`,`descripcion`,`cantidad`,`cantidad_aprobada`,`aprobado`) VALUES (4, 2, 6, 'SSD de reemplazo para equipo con disco dañado', 1, NULL, 1);
INSERT INTO `solicitud_insumo` (`id_solicitud_insumo`,`id_solicitud`,`id_insumo`,`descripcion`,`cantidad`,`cantidad_aprobada`,`aprobado`) VALUES (5, 3, 1, 'Tóner magenta para impresora Xerox C235', 2, NULL, 1);
INSERT INTO `solicitud_insumo` (`id_solicitud_insumo`,`id_solicitud`,`id_insumo`,`descripcion`,`cantidad`,`cantidad_aprobada`,`aprobado`) VALUES (6, 3, 17, 'Tóner amarillo para impresora Xerox C235', 2, NULL, 1);
INSERT INTO `solicitud_insumo` (`id_solicitud_insumo`,`id_solicitud`,`id_insumo`,`descripcion`,`cantidad`,`cantidad_aprobada`,`aprobado`) VALUES (7, 4, 34, 'Depósito de mantenimiento para impresora Epson', 1, NULL, 1);
INSERT INTO `solicitud_insumo` (`id_solicitud_insumo`,`id_solicitud`,`id_insumo`,`descripcion`,`cantidad`,`cantidad_aprobada`,`aprobado`) VALUES (8, 4, 19, 'Tinta negra T544 para impresora EcoTank', 2, NULL, 1);
INSERT INTO `solicitud_insumo` (`id_solicitud_insumo`,`id_solicitud`,`id_insumo`,`descripcion`,`cantidad`,`cantidad_aprobada`,`aprobado`) VALUES (9, 5, 9, 'Mousepad ergonómico para estación de trabajo', 1, NULL, 0);
INSERT INTO `solicitud_insumo` (`id_solicitud_insumo`,`id_solicitud`,`id_insumo`,`descripcion`,`cantidad`,`cantidad_aprobada`,`aprobado`) VALUES (10, 6, 45, 'Teclado de reemplazo para equipo de recepción', 1, NULL, 1);
INSERT INTO `solicitud_insumo` (`id_solicitud_insumo`,`id_solicitud`,`id_insumo`,`descripcion`,`cantidad`,`cantidad_aprobada`,`aprobado`) VALUES (11, 6, 46, 'Mouse de reemplazo para equipo de recepción', 1, NULL, 1);
INSERT INTO `solicitud_insumo` (`id_solicitud_insumo`,`id_solicitud`,`id_insumo`,`descripcion`,`cantidad`,`cantidad_aprobada`,`aprobado`) VALUES (12, 7, 37, 'RAM DDR3L para laptop antigua del área', 1, NULL, 1);
INSERT INTO `solicitud_insumo` (`id_solicitud_insumo`,`id_solicitud`,`id_insumo`,`descripcion`,`cantidad`,`cantidad_aprobada`,`aprobado`) VALUES (13, 7, 15, 'Pasta térmica para mantenimiento preventivo', 2, NULL, 1);
INSERT INTO `solicitud_insumo` (`id_solicitud_insumo`,`id_solicitud`,`id_insumo`,`descripcion`,`cantidad`,`cantidad_aprobada`,`aprobado`) VALUES (14, 8, 48, 'Tinta negra universal para impresoras EcoTank', 2, NULL, 1);
INSERT INTO `solicitud_insumo` (`id_solicitud_insumo`,`id_solicitud`,`id_insumo`,`descripcion`,`cantidad`,`cantidad_aprobada`,`aprobado`) VALUES (15, 8, 49, 'Tinta cian universal para impresoras EcoTank', 1, NULL, 1);
INSERT INTO `solicitud_insumo` (`id_solicitud_insumo`,`id_solicitud`,`id_insumo`,`descripcion`,`cantidad`,`cantidad_aprobada`,`aprobado`) VALUES (16, 9, 39, 'Baterías CMOS para equipos con pérdida de hora', 2, NULL, 1);
INSERT INTO `solicitud_insumo` (`id_solicitud_insumo`,`id_solicitud`,`id_insumo`,`descripcion`,`cantidad`,`cantidad_aprobada`,`aprobado`) VALUES (17, 9, 3, 'Removedor de polvo para limpieza de equipos', 1, NULL, 1);
INSERT INTO `solicitud_insumo` (`id_solicitud_insumo`,`id_solicitud`,`id_insumo`,`descripcion`,`cantidad`,`cantidad_aprobada`,`aprobado`) VALUES (18, 10, 32, 'Memoria USB dual para respaldo de archivos', 1, NULL, 0);
INSERT INTO `solicitud_insumo` (`id_solicitud_insumo`,`id_solicitud`,`id_insumo`,`descripcion`,`cantidad`,`cantidad_aprobada`,`aprobado`) VALUES (19, 11, 2, 'Tóner negro Xerox C235 para impresora del área', 2, NULL, 1);
INSERT INTO `solicitud_insumo` (`id_solicitud_insumo`,`id_solicitud`,`id_insumo`,`descripcion`,`cantidad`,`cantidad_aprobada`,`aprobado`) VALUES (20, 11, 18, 'Tóner cian Xerox C235', 1, NULL, 1);
INSERT INTO `solicitud_insumo` (`id_solicitud_insumo`,`id_solicitud`,`id_insumo`,`descripcion`,`cantidad`,`cantidad_aprobada`,`aprobado`) VALUES (21, 12, 20, 'Tinta amarilla T544 para impresora EcoTank', 2, NULL, 1);
INSERT INTO `solicitud_insumo` (`id_solicitud_insumo`,`id_solicitud`,`id_insumo`,`descripcion`,`cantidad`,`cantidad_aprobada`,`aprobado`) VALUES (22, 12, 22, 'Tinta magenta T544 para impresora EcoTank', 2, NULL, 1);
INSERT INTO `solicitud_insumo` (`id_solicitud_insumo`,`id_solicitud`,`id_insumo`,`descripcion`,`cantidad`,`cantidad_aprobada`,`aprobado`) VALUES (23, 13, 31, 'Toallitas desinfectantes para limpieza general', 3, NULL, 1);
INSERT INTO `solicitud_insumo` (`id_solicitud_insumo`,`id_solicitud`,`id_insumo`,`descripcion`,`cantidad`,`cantidad_aprobada`,`aprobado`) VALUES (24, 13, 14, 'Espuma limpiadora antiestática', 1, NULL, 1);
INSERT INTO `solicitud_insumo` (`id_solicitud_insumo`,`id_solicitud`,`id_insumo`,`descripcion`,`cantidad`,`cantidad_aprobada`,`aprobado`) VALUES (25, 14, 5, 'MicroSD para dispositivo móvil corporativo', 1, NULL, 0);
INSERT INTO `solicitud_insumo` (`id_solicitud_insumo`,`id_solicitud`,`id_insumo`,`descripcion`,`cantidad`,`cantidad_aprobada`,`aprobado`) VALUES (26, 15, 52, 'Tóner HP compatible para impresora LaserJet', 2, NULL, NULL);
INSERT INTO `solicitud_insumo` (`id_solicitud_insumo`,`id_solicitud`,`id_insumo`,`descripcion`,`cantidad`,`cantidad_aprobada`,`aprobado`) VALUES (27, 15, 10, 'Tóner HP negro para impresora MFP', 1, NULL, NULL);
INSERT INTO `solicitud_insumo` (`id_solicitud_insumo`,`id_solicitud`,`id_insumo`,`descripcion`,`cantidad`,`cantidad_aprobada`,`aprobado`) VALUES (28, 16, 41, 'Tinta amarilla 664 para impresora EcoTank', 2, NULL, 1);
INSERT INTO `solicitud_insumo` (`id_solicitud_insumo`,`id_solicitud`,`id_insumo`,`descripcion`,`cantidad`,`cantidad_aprobada`,`aprobado`) VALUES (29, 16, 43, 'Tinta negra 664 para impresora EcoTank', 2, NULL, 1);
INSERT INTO `solicitud_insumo` (`id_solicitud_insumo`,`id_solicitud`,`id_insumo`,`descripcion`,`cantidad`,`cantidad_aprobada`,`aprobado`) VALUES (30, 17, 35, 'Adaptador USB-C a Ethernet para laptop sin puerto RJ45', 1, NULL, 1);
INSERT INTO `solicitud_insumo` (`id_solicitud_insumo`,`id_solicitud`,`id_insumo`,`descripcion`,`cantidad`,`cantidad_aprobada`,`aprobado`) VALUES (31, 17, 11, 'Adaptador WiFi USB para equipo sin tarjeta inalámbrica', 1, NULL, 1);
INSERT INTO `solicitud_insumo` (`id_solicitud_insumo`,`id_solicitud`,`id_insumo`,`descripcion`,`cantidad`,`cantidad_aprobada`,`aprobado`) VALUES (32, 18, 44, 'Tinta magenta 664 para impresora EcoTank', 1, NULL, 1);
INSERT INTO `solicitud_insumo` (`id_solicitud_insumo`,`id_solicitud`,`id_insumo`,`descripcion`,`cantidad`,`cantidad_aprobada`,`aprobado`) VALUES (33, 18, 42, 'Tinta cian 664 para impresora EcoTank', 1, NULL, 1);
INSERT INTO `solicitud_insumo` (`id_solicitud_insumo`,`id_solicitud`,`id_insumo`,`descripcion`,`cantidad`,`cantidad_aprobada`,`aprobado`) VALUES (34, 19, 4, 'Memoria USB para transferencia de archivos', 1, NULL, 0);
INSERT INTO `solicitud_insumo` (`id_solicitud_insumo`,`id_solicitud`,`id_insumo`,`descripcion`,`cantidad`,`cantidad_aprobada`,`aprobado`) VALUES (35, 20, 33, 'Cargador Tipo-C para laptop corporativa', 1, NULL, NULL);
INSERT INTO `solicitud_insumo` (`id_solicitud_insumo`,`id_solicitud`,`id_insumo`,`descripcion`,`cantidad`,`cantidad_aprobada`,`aprobado`) VALUES (36, 20, 38, 'Carcasa NVMe para SSD de respaldo externo', 1, NULL, NULL);
INSERT INTO `solicitud_insumo` (`id_solicitud_insumo`,`id_solicitud`,`id_insumo`,`descripcion`,`cantidad`,`cantidad_aprobada`,`aprobado`) VALUES (37, 21, 6, 'SSD 240GB para reemplazo en equipo de producción', 2, NULL, 1);
INSERT INTO `solicitud_insumo` (`id_solicitud_insumo`,`id_solicitud`,`id_insumo`,`descripcion`,`cantidad`,`cantidad_aprobada`,`aprobado`) VALUES (38, 21, 36, 'RAM DDR4 para ampliación de memoria en laptop', 1, NULL, 1);
INSERT INTO `solicitud_insumo` (`id_solicitud_insumo`,`id_solicitud`,`id_insumo`,`descripcion`,`cantidad`,`cantidad_aprobada`,`aprobado`) VALUES (39, 22, 8, 'Kit teclado y mouse inalámbrico DELL para nuevo puesto', 1, NULL, 1);
INSERT INTO `solicitud_insumo` (`id_solicitud_insumo`,`id_solicitud`,`id_insumo`,`descripcion`,`cantidad`,`cantidad_aprobada`,`aprobado`) VALUES (40, 22, 45, 'Teclado alámbrico adicional para área de soporte', 1, NULL, 1);
INSERT INTO `solicitud_insumo` (`id_solicitud_insumo`,`id_solicitud`,`id_insumo`,`descripcion`,`cantidad`,`cantidad_aprobada`,`aprobado`) VALUES (41, 23, 2, 'Tóner negro Xerox C235 urgente para impresora sin tóner', 3, NULL, NULL);
INSERT INTO `solicitud_insumo` (`id_solicitud_insumo`,`id_solicitud`,`id_insumo`,`descripcion`,`cantidad`,`cantidad_aprobada`,`aprobado`) VALUES (42, 23, 1, 'Tóner magenta Xerox C235', 2, NULL, NULL);
INSERT INTO `solicitud_insumo` (`id_solicitud_insumo`,`id_solicitud`,`id_insumo`,`descripcion`,`cantidad`,`cantidad_aprobada`,`aprobado`) VALUES (43, 24, 11, 'Para unas redes d efvor', 1, NULL, NULL);
INSERT INTO `solicitud_insumo` (`id_solicitud_insumo`,`id_solicitud`,`id_insumo`,`descripcion`,`cantidad`,`cantidad_aprobada`,`aprobado`) VALUES (44, 24, 40, 'Para unas redes d efvor', 1, NULL, NULL);
INSERT INTO `solicitud_insumo` (`id_solicitud_insumo`,`id_solicitud`,`id_insumo`,`descripcion`,`cantidad`,`cantidad_aprobada`,`aprobado`) VALUES (45, 25, 11, 'mas redes', 1, NULL, NULL);
INSERT INTO `solicitud_insumo` (`id_solicitud_insumo`,`id_solicitud`,`id_insumo`,`descripcion`,`cantidad`,`cantidad_aprobada`,`aprobado`) VALUES (46, 25, 40, 'mas redes', 1, NULL, NULL);
INSERT INTO `solicitud_insumo` (`id_solicitud_insumo`,`id_solicitud`,`id_insumo`,`descripcion`,`cantidad`,`cantidad_aprobada`,`aprobado`) VALUES (47, 26, 11, 'yas', 1, NULL, NULL);
INSERT INTO `solicitud_insumo` (`id_solicitud_insumo`,`id_solicitud`,`id_insumo`,`descripcion`,`cantidad`,`cantidad_aprobada`,`aprobado`) VALUES (48, 26, 35, 'yas', 1, NULL, NULL);
INSERT INTO `solicitud_insumo` (`id_solicitud_insumo`,`id_solicitud`,`id_insumo`,`descripcion`,`cantidad`,`cantidad_aprobada`,`aprobado`) VALUES (49, 26, 39, 'yas', 1, NULL, NULL);
INSERT INTO `solicitud_insumo` (`id_solicitud_insumo`,`id_solicitud`,`id_insumo`,`descripcion`,`cantidad`,`cantidad_aprobada`,`aprobado`) VALUES (50, 27, 11, 'para ya', 1, NULL, NULL);
INSERT INTO `solicitud_insumo` (`id_solicitud_insumo`,`id_solicitud`,`id_insumo`,`descripcion`,`cantidad`,`cantidad_aprobada`,`aprobado`) VALUES (51, 27, 40, 'para ya', 1, NULL, NULL);
INSERT INTO `solicitud_insumo` (`id_solicitud_insumo`,`id_solicitud`,`id_insumo`,`descripcion`,`cantidad`,`cantidad_aprobada`,`aprobado`) VALUES (52, 28, 11, 'ya', 1, NULL, NULL);
INSERT INTO `solicitud_insumo` (`id_solicitud_insumo`,`id_solicitud`,`id_insumo`,`descripcion`,`cantidad`,`cantidad_aprobada`,`aprobado`) VALUES (53, 28, 40, 'ya', 1, NULL, NULL);
INSERT INTO `solicitud_insumo` (`id_solicitud_insumo`,`id_solicitud`,`id_insumo`,`descripcion`,`cantidad`,`cantidad_aprobada`,`aprobado`) VALUES (54, 29, 11, 'para ya', 2, NULL, 0);
INSERT INTO `solicitud_insumo` (`id_solicitud_insumo`,`id_solicitud`,`id_insumo`,`descripcion`,`cantidad`,`cantidad_aprobada`,`aprobado`) VALUES (55, 29, 40, 'para ya', 1, NULL, 1);
INSERT INTO `solicitud_insumo` (`id_solicitud_insumo`,`id_solicitud`,`id_insumo`,`descripcion`,`cantidad`,`cantidad_aprobada`,`aprobado`) VALUES (56, 30, 11, 'rapido', 1, NULL, 1);
INSERT INTO `solicitud_insumo` (`id_solicitud_insumo`,`id_solicitud`,`id_insumo`,`descripcion`,`cantidad`,`cantidad_aprobada`,`aprobado`) VALUES (57, 30, 40, 'rapido', 2, NULL, 0);
INSERT INTO `solicitud_insumo` (`id_solicitud_insumo`,`id_solicitud`,`id_insumo`,`descripcion`,`cantidad`,`cantidad_aprobada`,`aprobado`) VALUES (58, 31, 39, 'para unas impresaoras y una bios', 2, NULL, 0);
INSERT INTO `solicitud_insumo` (`id_solicitud_insumo`,`id_solicitud`,`id_insumo`,`descripcion`,`cantidad`,`cantidad_aprobada`,`aprobado`) VALUES (59, 31, 41, 'para unas impresaoras y una bios', 1, NULL, 1);
INSERT INTO `solicitud_insumo` (`id_solicitud_insumo`,`id_solicitud`,`id_insumo`,`descripcion`,`cantidad`,`cantidad_aprobada`,`aprobado`) VALUES (60, 31, 42, 'para unas impresaoras y una bios', 1, NULL, 0);
INSERT INTO `solicitud_insumo` (`id_solicitud_insumo`,`id_solicitud`,`id_insumo`,`descripcion`,`cantidad`,`cantidad_aprobada`,`aprobado`) VALUES (61, 32, 41, 'Necesito imprimir facturas', 1, NULL, 1);
INSERT INTO `solicitud_insumo` (`id_solicitud_insumo`,`id_solicitud`,`id_insumo`,`descripcion`,`cantidad`,`cantidad_aprobada`,`aprobado`) VALUES (62, 32, 42, 'Necesito imprimir facturas', 1, NULL, 1);
INSERT INTO `solicitud_insumo` (`id_solicitud_insumo`,`id_solicitud`,`id_insumo`,`descripcion`,`cantidad`,`cantidad_aprobada`,`aprobado`) VALUES (63, 32, 43, 'Necesito imprimir facturas', 1, NULL, 1);
INSERT INTO `solicitud_insumo` (`id_solicitud_insumo`,`id_solicitud`,`id_insumo`,`descripcion`,`cantidad`,`cantidad_aprobada`,`aprobado`) VALUES (64, 32, 44, 'Necesito imprimir facturas', 1, NULL, 1);
INSERT INTO `solicitud_insumo` (`id_solicitud_insumo`,`id_solicitud`,`id_insumo`,`descripcion`,`cantidad`,`cantidad_aprobada`,`aprobado`) VALUES (65, 33, 11, 'envio puebla', 1, NULL, 1);
INSERT INTO `solicitud_insumo` (`id_solicitud_insumo`,`id_solicitud`,`id_insumo`,`descripcion`,`cantidad`,`cantidad_aprobada`,`aprobado`) VALUES (66, 33, 35, 'envio puebla', 1, NULL, 1);
INSERT INTO `solicitud_insumo` (`id_solicitud_insumo`,`id_solicitud`,`id_insumo`,`descripcion`,`cantidad`,`cantidad_aprobada`,`aprobado`) VALUES (69, 37, 11, 'para mi cedis', 1, 1, 1);


-- ---------------------------------------------------------
-- Tabla: ticket
-- ---------------------------------------------------------
DROP TABLE IF EXISTS `ticket`;
CREATE TABLE `ticket` (
  `id_ticket` int NOT NULL AUTO_INCREMENT,
  `folio_ticket` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `titulo` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `descripcion` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `fecha_subido` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `fecha_resuelto` timestamp NULL DEFAULT NULL,
  `estatus` enum('En proceso','Resuelto','No Resuelto','Cancelado') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'En proceso',
  `prioridad` enum('Baja','Media','Alta','Urgente') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Media',
  `comentarios` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `id_empleado` int NOT NULL,
  `id_categoria` int NOT NULL,
  `id_tecnico` int DEFAULT NULL,
  `calificacion` tinyint DEFAULT NULL,
  PRIMARY KEY (`id_ticket`),
  UNIQUE KEY `uq_folio_ticket` (`folio_ticket`),
  KEY `fk_ticket_empleado` (`id_empleado`),
  KEY `fk_ticket_categoria` (`id_categoria`),
  KEY `fk_ticket_tecnico` (`id_tecnico`),
  KEY `idx_ticket_estatus_fecha` (`estatus`,`fecha_subido`),
  KEY `idx_ticket_empleado_estatus` (`id_empleado`,`estatus`),
  CONSTRAINT `fk_ticket_categoria` FOREIGN KEY (`id_categoria`) REFERENCES `categoria` (`id_categoria`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_ticket_empleado` FOREIGN KEY (`id_empleado`) REFERENCES `empleado` (`id_empleado`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_ticket_tecnico` FOREIGN KEY (`id_tecnico`) REFERENCES `empleado` (`id_empleado`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=74 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 73 registro(s)
INSERT INTO `ticket` (`id_ticket`,`folio_ticket`,`titulo`,`descripcion`,`fecha_subido`,`fecha_resuelto`,`estatus`,`prioridad`,`comentarios`,`id_empleado`,`id_categoria`,`id_tecnico`,`calificacion`) VALUES (1, 'PTP-202605-001', 'Mantenimiento de equipo', 'Revisión y mantenimiento general de equipo de cómputo.', '2026-05-06 17:20:54', '2026-05-09 13:02:07', 'Resuelto', 'Media', 'Mantenimiento realizado correctamente.', 1, 1, 4, 1);
INSERT INTO `ticket` (`id_ticket`,`folio_ticket`,`titulo`,`descripcion`,`fecha_subido`,`fecha_resuelto`,`estatus`,`prioridad`,`comentarios`,`id_empleado`,`id_categoria`,`id_tecnico`,`calificacion`) VALUES (2, 'PTP-202605-002', 'Fallo de pantalla', 'La pantalla del equipo dejó de funcionar de manera repentina.', '2026-05-06 17:23:19', '2026-05-09 13:06:37', 'Resuelto', 'Alta', 'Pantalla revisada y reemplazada.', 1, 2, 20, 1);
INSERT INTO `ticket` (`id_ticket`,`folio_ticket`,`titulo`,`descripcion`,`fecha_subido`,`fecha_resuelto`,`estatus`,`prioridad`,`comentarios`,`id_empleado`,`id_categoria`,`id_tecnico`,`calificacion`) VALUES (3, 'PTP-202605-003', 'Fallo de hardware', 'El equipo presentó fallo general de hardware.', '2026-05-06 17:35:28', '2026-05-09 12:19:01', 'Resuelto', 'Urgente', 'Componente defectuoso reemplazado.', 1, 2, 21, 1);
INSERT INTO `ticket` (`id_ticket`,`folio_ticket`,`titulo`,`descripcion`,`fecha_subido`,`fecha_resuelto`,`estatus`,`prioridad`,`comentarios`,`id_empleado`,`id_categoria`,`id_tecnico`,`calificacion`) VALUES (4, 'PTP-202605-004', 'Fallo en laptop durante análisis de datos', 'El equipo falló inesperadamente al ejecutar un análisis de datos, causando pérdida de trabajo.', '2026-05-06 17:40:34', '2026-05-09 12:08:17', 'Resuelto', 'Alta', 'Equipo revisado y estabilizado. Se recomienda guardar el trabajo periódicamente.', 1, 2, 4, 5);
INSERT INTO `ticket` (`id_ticket`,`folio_ticket`,`titulo`,`descripcion`,`fecha_subido`,`fecha_resuelto`,`estatus`,`prioridad`,`comentarios`,`id_empleado`,`id_categoria`,`id_tecnico`,`calificacion`) VALUES (5, 'PTP-202605-005', 'Problema con archivo XML', 'Falla al intentar abrir y procesar un archivo XML.', '2026-05-07 10:27:15', '2026-05-09 11:56:32', 'Resuelto', 'Baja', 'El archivo no era .xml sino .png. Se orientó al usuario sobre la extensión correcta.', 1, 3, 20, 1);
INSERT INTO `ticket` (`id_ticket`,`folio_ticket`,`titulo`,`descripcion`,`fecha_subido`,`fecha_resuelto`,`estatus`,`prioridad`,`comentarios`,`id_empleado`,`id_categoria`,`id_tecnico`,`calificacion`) VALUES (6, 'PTP-202605-006', 'Fallo de red', 'La conexión de red del equipo dejó de funcionar.', '2026-05-07 13:50:52', '2026-05-09 11:42:48', 'Resuelto', 'Media', 'Conexión de red restaurada. Se recomienda no mover el equipo con el cable conectado.', 1, 4, 21, 1);
INSERT INTO `ticket` (`id_ticket`,`folio_ticket`,`titulo`,`descripcion`,`fecha_subido`,`fecha_resuelto`,`estatus`,`prioridad`,`comentarios`,`id_empleado`,`id_categoria`,`id_tecnico`,`calificacion`) VALUES (7, 'PTP-202605-007', 'Impresora sin conexión', 'La impresora se desconectó de la red WiFi y dejó de imprimir.', '2026-05-09 12:12:06', '2026-05-09 12:13:26', 'Resuelto', 'Alta', 'Impresora reconectada a la red WiFi correctamente.', 1, 5, 4, 5);
INSERT INTO `ticket` (`id_ticket`,`folio_ticket`,`titulo`,`descripcion`,`fecha_subido`,`fecha_resuelto`,`estatus`,`prioridad`,`comentarios`,`id_empleado`,`id_categoria`,`id_tecnico`,`calificacion`) VALUES (8, 'PTP-202605-008', 'Fallo de equipo de cómputo', 'El equipo de cómputo presentó fallo y requiere revisión.', '2026-05-09 12:52:19', '2026-05-09 12:53:12', 'Resuelto', 'Media', 'Equipo revisado y problema corregido.', 1, 1, 20, 5);
INSERT INTO `ticket` (`id_ticket`,`folio_ticket`,`titulo`,`descripcion`,`fecha_subido`,`fecha_resuelto`,`estatus`,`prioridad`,`comentarios`,`id_empleado`,`id_categoria`,`id_tecnico`,`calificacion`) VALUES (9, 'PTP-202605-009', 'Fallo en programa de trabajo', 'El programa utilizado para las actividades laborales presentó fallo.', '2026-05-14 12:30:43', '2026-05-14 12:31:10', 'Resuelto', 'Alta', 'Programa revisado y restaurado correctamente.', 1, 2, 21, 5);
INSERT INTO `ticket` (`id_ticket`,`folio_ticket`,`titulo`,`descripcion`,`fecha_subido`,`fecha_resuelto`,`estatus`,`prioridad`,`comentarios`,`id_empleado`,`id_categoria`,`id_tecnico`,`calificacion`) VALUES (10, 'PTP-202605-010', 'Revisión de equipo', 'Revisión general solicitada por el usuario.', '2026-05-18 13:39:46', '2026-05-18 13:42:11', 'Resuelto', 'Baja', 'Revisión completada sin inconvenientes.', 1, 1, 4, 5);
INSERT INTO `ticket` (`id_ticket`,`folio_ticket`,`titulo`,`descripcion`,`fecha_subido`,`fecha_resuelto`,`estatus`,`prioridad`,`comentarios`,`id_empleado`,`id_categoria`,`id_tecnico`,`calificacion`) VALUES (11, 'PTP-202605-011', 'Fallo crítico de equipo', 'El equipo presentó un fallo crítico que impide su uso normal.', '2026-05-26 00:49:07', '2026-05-26 01:00:28', 'Resuelto', 'Urgente', 'Fallo identificado y corregido.', 1, 2, 20, 5);
INSERT INTO `ticket` (`id_ticket`,`folio_ticket`,`titulo`,`descripcion`,`fecha_subido`,`fecha_resuelto`,`estatus`,`prioridad`,`comentarios`,`id_empleado`,`id_categoria`,`id_tecnico`,`calificacion`) VALUES (12, 'PTP-202605-012', 'Problema de mantenimiento sin resolver', 'Reporte de mantenimiento pendiente de atención.', '2026-05-27 21:58:44', '2026-05-30 03:30:35', 'No Resuelto', 'Urgente', NULL, 1, 1, NULL, NULL);
INSERT INTO `ticket` (`id_ticket`,`folio_ticket`,`titulo`,`descripcion`,`fecha_subido`,`fecha_resuelto`,`estatus`,`prioridad`,`comentarios`,`id_empleado`,`id_categoria`,`id_tecnico`,`calificacion`) VALUES (13, 'PTP-202605-013', 'Fallo de hardware en equipo', 'El equipo presentó fallo de hardware que requiere atención.', '2026-05-27 22:19:00', '2026-05-27 23:58:11', 'Resuelto', 'Alta', 'Hardware revisado y reemplazado.', 1, 2, 21, 5);
INSERT INTO `ticket` (`id_ticket`,`folio_ticket`,`titulo`,`descripcion`,`fecha_subido`,`fecha_resuelto`,`estatus`,`prioridad`,`comentarios`,`id_empleado`,`id_categoria`,`id_tecnico`,`calificacion`) VALUES (14, 'PTP-202605-014', 'Fallo de hardware sin resolver', 'El equipo presentó fallo de hardware pendiente de resolución.', '2026-05-27 22:19:16', '2026-05-30 03:30:35', 'No Resuelto', 'Media', NULL, 1, 2, NULL, NULL);
INSERT INTO `ticket` (`id_ticket`,`folio_ticket`,`titulo`,`descripcion`,`fecha_subido`,`fecha_resuelto`,`estatus`,`prioridad`,`comentarios`,`id_empleado`,`id_categoria`,`id_tecnico`,`calificacion`) VALUES (15, 'PTP-202605-015', 'Problema de red sin resolver', 'Fallo en la conexión de red pendiente de atención.', '2026-05-27 22:22:54', '2026-05-30 03:30:35', 'No Resuelto', 'Baja', NULL, 1, 4, NULL, NULL);
INSERT INTO `ticket` (`id_ticket`,`folio_ticket`,`titulo`,`descripcion`,`fecha_subido`,`fecha_resuelto`,`estatus`,`prioridad`,`comentarios`,`id_empleado`,`id_categoria`,`id_tecnico`,`calificacion`) VALUES (16, 'PTP-202605-016', 'Fallo urgente de equipo', 'El equipo presentó un fallo urgente que interrumpe las operaciones.', '2026-05-30 05:34:38', '2026-05-30 06:20:20', 'Resuelto', 'Urgente', 'Problema resuelto correctamente.', 1, 1, 4, 5);
INSERT INTO `ticket` (`id_ticket`,`folio_ticket`,`titulo`,`descripcion`,`fecha_subido`,`fecha_resuelto`,`estatus`,`prioridad`,`comentarios`,`id_empleado`,`id_categoria`,`id_tecnico`,`calificacion`) VALUES (17, 'PTP-202605-017', 'Fallo de equipo de cómputo', 'El equipo presentó fallo y requiere revisión técnica.', '2026-05-30 06:23:16', '2026-05-30 06:24:22', 'Resuelto', 'Alta', 'Equipo revisado y problema corregido.', 1, 1, 20, 5);
INSERT INTO `ticket` (`id_ticket`,`folio_ticket`,`titulo`,`descripcion`,`fecha_subido`,`fecha_resuelto`,`estatus`,`prioridad`,`comentarios`,`id_empleado`,`id_categoria`,`id_tecnico`,`calificacion`) VALUES (18, 'PTP-202606-001', 'Fallo en equipo de trabajo', 'El equipo presentó fallo durante la jornada laboral.', '2026-06-03 00:36:25', '2026-06-03 02:17:32', 'Resuelto', 'Alta', 'Problema identificado y resuelto.', 1, 1, 21, 5);
INSERT INTO `ticket` (`id_ticket`,`folio_ticket`,`titulo`,`descripcion`,`fecha_subido`,`fecha_resuelto`,`estatus`,`prioridad`,`comentarios`,`id_empleado`,`id_categoria`,`id_tecnico`,`calificacion`) VALUES (19, 'PTP-202606-002', 'Fallo de hardware sin resolver', 'El equipo presenta fallo de hardware pendiente de atención.', '2026-06-04 03:43:19', '2026-06-09 01:16:09', 'No Resuelto', 'Alta', NULL, 1, 2, NULL, NULL);
INSERT INTO `ticket` (`id_ticket`,`folio_ticket`,`titulo`,`descripcion`,`fecha_subido`,`fecha_resuelto`,`estatus`,`prioridad`,`comentarios`,`id_empleado`,`id_categoria`,`id_tecnico`,`calificacion`) VALUES (20, 'PTP-202606-003', 'Problema de acceso remoto', 'Se requiere soporte mediante acceso remoto para diagnóstico de equipo.', '2026-06-11 00:32:15', '2026-06-11 22:33:23', 'Resuelto', 'Alta', 'Sesión de soporte remoto completada. Problema resuelto.', 1, 1, 4, 5);
INSERT INTO `ticket` (`id_ticket`,`folio_ticket`,`titulo`,`descripcion`,`fecha_subido`,`fecha_resuelto`,`estatus`,`prioridad`,`comentarios`,`id_empleado`,`id_categoria`,`id_tecnico`,`calificacion`) VALUES (21, 'PTP-202606-004', 'Fallo de hardware en equipo', 'El equipo presentó fallo de hardware que interrumpe el trabajo.', '2026-06-11 22:49:00', '2026-06-11 23:08:22', 'Resuelto', 'Alta', 'Hardware revisado y problema corregido.', 1, 1, 20, 5);
INSERT INTO `ticket` (`id_ticket`,`folio_ticket`,`titulo`,`descripcion`,`fecha_subido`,`fecha_resuelto`,`estatus`,`prioridad`,`comentarios`,`id_empleado`,`id_categoria`,`id_tecnico`,`calificacion`) VALUES (22, 'PTP-202606-005', 'Fallo de equipo', 'El equipo presentó un fallo que requiere atención técnica.', '2026-06-11 23:24:18', '2026-06-11 23:32:16', 'Resuelto', 'Media', 'Problema resuelto.', 1, 1, 21, 5);
INSERT INTO `ticket` (`id_ticket`,`folio_ticket`,`titulo`,`descripcion`,`fecha_subido`,`fecha_resuelto`,`estatus`,`prioridad`,`comentarios`,`id_empleado`,`id_categoria`,`id_tecnico`,`calificacion`) VALUES (23, 'PTP-202606-006', 'Fallo en equipo de cómputo', 'El equipo dejó de funcionar correctamente durante la jornada.', '2026-06-11 23:39:33', '2026-06-11 23:40:12', 'Resuelto', 'Media', 'Equipo revisado y restaurado.', 1, 1, 4, 5);
INSERT INTO `ticket` (`id_ticket`,`folio_ticket`,`titulo`,`descripcion`,`fecha_subido`,`fecha_resuelto`,`estatus`,`prioridad`,`comentarios`,`id_empleado`,`id_categoria`,`id_tecnico`,`calificacion`) VALUES (24, 'PTP-202603-001', 'Equipo no enciende', 'El equipo de escritorio no enciende al presionar el botón de poder.', '2026-03-03 15:15:00', '2026-03-04 16:30:00', 'Resuelto', 'Alta', 'Se reemplazó fuente de poder defectuosa. Equipo operativo.', 15, 2, 20, 5);
INSERT INTO `ticket` (`id_ticket`,`folio_ticket`,`titulo`,`descripcion`,`fecha_subido`,`fecha_resuelto`,`estatus`,`prioridad`,`comentarios`,`id_empleado`,`id_categoria`,`id_tecnico`,`calificacion`) VALUES (25, 'PTP-202603-002', 'Sin acceso a correo', 'No puedo ingresar a mi correo corporativo desde ayer por la mañana.', '2026-03-03 16:02:00', '2026-03-04 15:15:00', 'Resuelto', 'Media', 'Se restableció contraseña y se verificó configuración SMTP.', 16, 6, 21, 4);
INSERT INTO `ticket` (`id_ticket`,`folio_ticket`,`titulo`,`descripcion`,`fecha_subido`,`fecha_resuelto`,`estatus`,`prioridad`,`comentarios`,`id_empleado`,`id_categoria`,`id_tecnico`,`calificacion`) VALUES (26, 'PTP-202603-003', 'Impresora con atascos', 'La impresora del área de marketing presenta atascos de papel constantes.', '2026-03-05 17:30:00', '2026-03-06 14:45:00', 'Resuelto', 'Media', 'Se limpió rodillo de arrastre y se cambió papel a gramaje correcto.', 17, 5, 4, 5);
INSERT INTO `ticket` (`id_ticket`,`folio_ticket`,`titulo`,`descripcion`,`fecha_subido`,`fecha_resuelto`,`estatus`,`prioridad`,`comentarios`,`id_empleado`,`id_categoria`,`id_tecnico`,`calificacion`) VALUES (27, 'PTP-202603-004', 'Equipo extremadamente lento', 'El equipo tarda más de 10 minutos en arrancar y se congela al abrir Excel.', '2026-03-06 20:00:00', '2026-03-09 17:20:00', 'Resuelto', 'Alta', 'Se realizó limpieza de disco, se eliminaron programas de inicio y se amplió RAM.', 18, 1, 20, 5);
INSERT INTO `ticket` (`id_ticket`,`folio_ticket`,`titulo`,`descripcion`,`fecha_subido`,`fecha_resuelto`,`estatus`,`prioridad`,`comentarios`,`id_empleado`,`id_categoria`,`id_tecnico`,`calificacion`) VALUES (28, 'PTP-202603-005', 'Red caída en almacén', 'Ningún equipo del área de almacén tiene acceso a red desde esta mañana.', '2026-03-07 14:30:00', '2026-03-07 17:00:00', 'Resuelto', 'Urgente', 'Se reemplazó switch defectuoso. Red restaurada en todos los equipos.', 19, 4, 21, 5);
INSERT INTO `ticket` (`id_ticket`,`folio_ticket`,`titulo`,`descripcion`,`fecha_subido`,`fecha_resuelto`,`estatus`,`prioridad`,`comentarios`,`id_empleado`,`id_categoria`,`id_tecnico`,`calificacion`) VALUES (29, 'PTP-202603-006', 'Error al instalar software', 'Al intentar instalar el sistema de nómina aparece error de permisos.', '2026-03-10 15:45:00', '2026-03-11 16:00:00', 'Resuelto', 'Media', 'Se otorgaron permisos de administrador local y se completó la instalación.', 15, 3, 4, 4);
INSERT INTO `ticket` (`id_ticket`,`folio_ticket`,`titulo`,`descripcion`,`fecha_subido`,`fecha_resuelto`,`estatus`,`prioridad`,`comentarios`,`id_empleado`,`id_categoria`,`id_tecnico`,`calificacion`) VALUES (30, 'PTP-202603-007', 'Teclado sin respuesta', 'El teclado del equipo de recepción dejó de funcionar sin razón aparente.', '2026-03-10 19:20:00', '2026-03-10 21:00:00', 'Resuelto', 'Baja', 'Se sustituyó teclado por unidad disponible en inventario.', 16, 2, 20, 5);
INSERT INTO `ticket` (`id_ticket`,`folio_ticket`,`titulo`,`descripcion`,`fecha_subido`,`fecha_resuelto`,`estatus`,`prioridad`,`comentarios`,`id_empleado`,`id_categoria`,`id_tecnico`,`calificacion`) VALUES (31, 'PTP-202603-008', 'Monitor con líneas horizontales', 'La pantalla del monitor muestra líneas horizontales intermitentes.', '2026-03-12 16:10:00', '2026-03-13 15:30:00', 'Resuelto', 'Media', 'Se cambió cable VGA por HDMI. Problema resuelto.', 17, 2, 21, 4);
INSERT INTO `ticket` (`id_ticket`,`folio_ticket`,`titulo`,`descripcion`,`fecha_subido`,`fecha_resuelto`,`estatus`,`prioridad`,`comentarios`,`id_empleado`,`id_categoria`,`id_tecnico`,`calificacion`) VALUES (32, 'PTP-202603-009', 'Impresora Zebra sin imprimir', 'La impresora Zebra no imprime etiquetas desde la actualización del driver.', '2026-03-13 20:30:00', '2026-03-14 16:45:00', 'Resuelto', 'Alta', 'Se revirtió la actualización de driver a la versión estable anterior.', 18, 5, 4, 5);
INSERT INTO `ticket` (`id_ticket`,`folio_ticket`,`titulo`,`descripcion`,`fecha_subido`,`fecha_resuelto`,`estatus`,`prioridad`,`comentarios`,`id_empleado`,`id_categoria`,`id_tecnico`,`calificacion`) VALUES (33, 'PTP-202603-010', 'Acceso denegado a carpeta de red', 'El usuario no puede acceder a la carpeta de documentos compartidos en red.', '2026-03-14 15:00:00', '2026-03-16 16:00:00', 'Resuelto', 'Media', 'Se corrigieron permisos de red en el servidor de archivos.', 19, 7, 20, 5);
INSERT INTO `ticket` (`id_ticket`,`folio_ticket`,`titulo`,`descripcion`,`fecha_subido`,`fecha_resuelto`,`estatus`,`prioridad`,`comentarios`,`id_empleado`,`id_categoria`,`id_tecnico`,`calificacion`) VALUES (34, 'PTP-202603-011', 'Equipo con virus detectado', 'El antivirus detectó amenazas en el equipo del área de compras.', '2026-03-17 14:45:00', '2026-03-18 17:30:00', 'Resuelto', 'Urgente', 'Se eliminaron amenazas y se actualizó el antivirus a la versión más reciente.', 15, 3, 21, 5);
INSERT INTO `ticket` (`id_ticket`,`folio_ticket`,`titulo`,`descripcion`,`fecha_subido`,`fecha_resuelto`,`estatus`,`prioridad`,`comentarios`,`id_empleado`,`id_categoria`,`id_tecnico`,`calificacion`) VALUES (35, 'PTP-202603-012', 'Monitor sin imagen', 'El monitor del equipo de logística no muestra imagen aunque está encendido.', '2026-03-18 16:00:00', '2026-03-19 15:00:00', 'Resuelto', 'Media', 'Se reemplazó cable de video. Monitor operativo.', 16, 2, 4, 4);
INSERT INTO `ticket` (`id_ticket`,`folio_ticket`,`titulo`,`descripcion`,`fecha_subido`,`fecha_resuelto`,`estatus`,`prioridad`,`comentarios`,`id_empleado`,`id_categoria`,`id_tecnico`,`calificacion`) VALUES (36, 'PTP-202603-013', 'Sistema de asistencia sin registros', 'El sistema de marcaje no registra entradas desde el lunes.', '2026-03-19 17:15:00', '2026-03-21 18:00:00', 'Resuelto', 'Alta', 'Se corrigió error de sincronización en la base de datos del sistema.', 17, 3, 20, 5);
INSERT INTO `ticket` (`id_ticket`,`folio_ticket`,`titulo`,`descripcion`,`fecha_subido`,`fecha_resuelto`,`estatus`,`prioridad`,`comentarios`,`id_empleado`,`id_categoria`,`id_tecnico`,`calificacion`) VALUES (37, 'PTP-202603-014', 'Sin WiFi en sala de juntas', 'Los equipos portátiles no encuentran la red WiFi de la sala de juntas.', '2026-03-20 21:30:00', '2026-03-21 16:00:00', 'Resuelto', 'Alta', 'Se reinició access point y se actualizó firmware. Señal restaurada.', 18, 4, 21, 5);
INSERT INTO `ticket` (`id_ticket`,`folio_ticket`,`titulo`,`descripcion`,`fecha_subido`,`fecha_resuelto`,`estatus`,`prioridad`,`comentarios`,`id_empleado`,`id_categoria`,`id_tecnico`,`calificacion`) VALUES (38, 'PTP-202603-015', 'Error de actualización Windows', 'La actualización de Windows quedó detenida al 35% y el equipo no responde.', '2026-03-24 16:30:00', '2026-03-25 17:00:00', 'Resuelto', 'Alta', 'Se forzó rollback de actualización y se programó mantenimiento nocturno.', 15, 3, 4, 5);
INSERT INTO `ticket` (`id_ticket`,`folio_ticket`,`titulo`,`descripcion`,`fecha_subido`,`fecha_resuelto`,`estatus`,`prioridad`,`comentarios`,`id_empleado`,`id_categoria`,`id_tecnico`,`calificacion`) VALUES (39, 'PTP-202603-016', 'UPS con alarma y apagado', 'La UPS del servidor emitió alarma sonora y se apagó sola.', '2026-03-25 15:00:00', '2026-03-26 16:30:00', 'Resuelto', 'Urgente', 'Se reemplazó batería de UPS. Sistema de respaldo operativo.', 16, 8, 20, 5);
INSERT INTO `ticket` (`id_ticket`,`folio_ticket`,`titulo`,`descripcion`,`fecha_subido`,`fecha_resuelto`,`estatus`,`prioridad`,`comentarios`,`id_empleado`,`id_categoria`,`id_tecnico`,`calificacion`) VALUES (40, 'PTP-202603-017', 'Impresora no imprime en color', 'La impresora solo imprime en blanco y negro aunque se selecciona color.', '2026-03-26 19:45:00', '2026-03-27 16:00:00', 'Resuelto', 'Baja', 'Se sustituyó cartucho de tóner magenta agotado.', 17, 5, 21, 5);
INSERT INTO `ticket` (`id_ticket`,`folio_ticket`,`titulo`,`descripcion`,`fecha_subido`,`fecha_resuelto`,`estatus`,`prioridad`,`comentarios`,`id_empleado`,`id_categoria`,`id_tecnico`,`calificacion`) VALUES (41, 'PTP-202603-018', 'Disco duro lleno', 'El equipo marca disco lleno y no permite guardar archivos.', '2026-03-27 17:00:00', '2026-03-28 16:00:00', 'Resuelto', 'Media', 'Se liberaron 40 GB eliminando archivos temporales y moviendo backups al servidor.', 18, 1, 4, 4);
INSERT INTO `ticket` (`id_ticket`,`folio_ticket`,`titulo`,`descripcion`,`fecha_subido`,`fecha_resuelto`,`estatus`,`prioridad`,`comentarios`,`id_empleado`,`id_categoria`,`id_tecnico`,`calificacion`) VALUES (42, 'PTP-202603-019', 'Error de login en ERP', 'El sistema ERP no acepta las credenciales del usuario aunque son correctas.', '2026-03-28 15:30:00', NULL, 'No Resuelto', 'Alta', NULL, 19, 7, NULL, NULL);
INSERT INTO `ticket` (`id_ticket`,`folio_ticket`,`titulo`,`descripcion`,`fecha_subido`,`fecha_resuelto`,`estatus`,`prioridad`,`comentarios`,`id_empleado`,`id_categoria`,`id_tecnico`,`calificacion`) VALUES (43, 'PTP-202604-001', 'Pantalla azul frecuente', 'El equipo presenta pantalla azul (BSOD) varias veces al día.', '2026-04-01 15:00:00', '2026-04-02 17:00:00', 'Resuelto', 'Urgente', 'Se actualizaron drivers y se reemplazó módulo de RAM defectuoso.', 15, 2, 20, 5);
INSERT INTO `ticket` (`id_ticket`,`folio_ticket`,`titulo`,`descripcion`,`fecha_subido`,`fecha_resuelto`,`estatus`,`prioridad`,`comentarios`,`id_empleado`,`id_categoria`,`id_tecnico`,`calificacion`) VALUES (44, 'PTP-202604-002', 'Impresora sin tóner', 'La impresora del área de finanzas indica nivel de tóner crítico.', '2026-04-01 16:30:00', '2026-04-01 20:00:00', 'Resuelto', 'Media', 'Se instaló tóner de inventario. Impresora operativa.', 16, 5, 21, 5);
INSERT INTO `ticket` (`id_ticket`,`folio_ticket`,`titulo`,`descripcion`,`fecha_subido`,`fecha_resuelto`,`estatus`,`prioridad`,`comentarios`,`id_empleado`,`id_categoria`,`id_tecnico`,`calificacion`) VALUES (45, 'PTP-202604-003', 'Sistema de facturación sin cargar', 'El sistema de facturación no carga después del mantenimiento del fin de semana.', '2026-04-02 14:15:00', '2026-04-03 15:30:00', 'Resuelto', 'Alta', 'Se corrigió ruta de acceso al servidor de aplicaciones tras cambio de IP.', 17, 3, 4, 4);
INSERT INTO `ticket` (`id_ticket`,`folio_ticket`,`titulo`,`descripcion`,`fecha_subido`,`fecha_resuelto`,`estatus`,`prioridad`,`comentarios`,`id_empleado`,`id_categoria`,`id_tecnico`,`calificacion`) VALUES (46, 'PTP-202604-004', 'Cable de red dañado', 'El cable de red del puesto de trabajo está físicamente dañado.', '2026-04-03 17:00:00', '2026-04-03 19:30:00', 'Resuelto', 'Baja', 'Se sustituyó patch cord por cable Cat6 de 3 m del inventario.', 18, 4, 20, 5);
INSERT INTO `ticket` (`id_ticket`,`folio_ticket`,`titulo`,`descripcion`,`fecha_subido`,`fecha_resuelto`,`estatus`,`prioridad`,`comentarios`,`id_empleado`,`id_categoria`,`id_tecnico`,`calificacion`) VALUES (47, 'PTP-202604-005', 'Equipo no reconoce USB', 'El equipo no detecta ningún dispositivo USB conectado.', '2026-04-04 20:00:00', '2026-04-07 16:00:00', 'Resuelto', 'Media', 'Se actualizó driver de controladores USB y se limpió el puerto.', 19, 2, 21, 5);
INSERT INTO `ticket` (`id_ticket`,`folio_ticket`,`titulo`,`descripcion`,`fecha_subido`,`fecha_resuelto`,`estatus`,`prioridad`,`comentarios`,`id_empleado`,`id_categoria`,`id_tecnico`,`calificacion`) VALUES (48, 'PTP-202604-006', 'Bandeja de correo saturada de spam', 'La bandeja de entrada está siendo saturada por correos spam.', '2026-04-07 15:00:00', '2026-04-08 16:00:00', 'Resuelto', 'Media', 'Se configuró filtro antispam en el servidor de correo.', 15, 6, 4, 4);
INSERT INTO `ticket` (`id_ticket`,`folio_ticket`,`titulo`,`descripcion`,`fecha_subido`,`fecha_resuelto`,`estatus`,`prioridad`,`comentarios`,`id_empleado`,`id_categoria`,`id_tecnico`,`calificacion`) VALUES (49, 'PTP-202604-007', 'No conecta a impresora de red', 'El equipo no puede conectarse a la impresora de red del departamento.', '2026-04-08 16:15:00', '2026-04-09 15:00:00', 'Resuelto', 'Media', 'Se reinstalaron drivers y se verificó IP estática asignada.', 16, 5, 20, 5);
INSERT INTO `ticket` (`id_ticket`,`folio_ticket`,`titulo`,`descripcion`,`fecha_subido`,`fecha_resuelto`,`estatus`,`prioridad`,`comentarios`,`id_empleado`,`id_categoria`,`id_tecnico`,`calificacion`) VALUES (50, 'PTP-202604-008', 'Error en respaldo automático', 'El sistema de respaldo nocturno reporta error desde hace 3 días.', '2026-04-09 14:30:00', '2026-04-11 16:30:00', 'Resuelto', 'Alta', 'Se corrigió script de respaldo y se verificó espacio en disco destino.', 17, 3, 21, 5);
INSERT INTO `ticket` (`id_ticket`,`folio_ticket`,`titulo`,`descripcion`,`fecha_subido`,`fecha_resuelto`,`estatus`,`prioridad`,`comentarios`,`id_empleado`,`id_categoria`,`id_tecnico`,`calificacion`) VALUES (51, 'PTP-202604-009', 'Mouse con doble clic involuntario', 'El mouse registra doble clic al hacer un solo clic.', '2026-04-10 19:00:00', '2026-04-10 21:00:00', 'Resuelto', 'Baja', 'Se sustituyó mouse por unidad nueva del inventario.', 18, 2, 4, 5);
INSERT INTO `ticket` (`id_ticket`,`folio_ticket`,`titulo`,`descripcion`,`fecha_subido`,`fecha_resuelto`,`estatus`,`prioridad`,`comentarios`,`id_empleado`,`id_categoria`,`id_tecnico`,`calificacion`) VALUES (52, 'PTP-202604-010', 'Proyector sin señal', 'El proyector de la sala de capacitación no detecta la señal del laptop.', '2026-04-11 17:30:00', '2026-04-12 15:00:00', 'Resuelto', 'Media', 'Se cambió cable HDMI y se configuró salida de video en el laptop.', 19, 2, 20, 4);
INSERT INTO `ticket` (`id_ticket`,`folio_ticket`,`titulo`,`descripcion`,`fecha_subido`,`fecha_resuelto`,`estatus`,`prioridad`,`comentarios`,`id_empleado`,`id_categoria`,`id_tecnico`,`calificacion`) VALUES (53, 'PTP-202604-011', 'Servidor de archivos inaccesible', 'No se puede acceder a las carpetas del servidor desde ningún equipo.', '2026-04-14 14:00:00', '2026-04-15 18:00:00', 'Resuelto', 'Urgente', 'Se reinició servicio de archivos y se verificó integridad del RAID.', 15, 8, 21, 5);
INSERT INTO `ticket` (`id_ticket`,`folio_ticket`,`titulo`,`descripcion`,`fecha_subido`,`fecha_resuelto`,`estatus`,`prioridad`,`comentarios`,`id_empleado`,`id_categoria`,`id_tecnico`,`calificacion`) VALUES (54, 'PTP-202604-012', 'Licencia de Office vencida', 'Office muestra mensaje de licencia vencida y no permite editar documentos.', '2026-04-15 16:00:00', '2026-04-16 17:00:00', 'Resuelto', 'Alta', 'Se renovó licencia y se reactivó la suite Office.', 16, 3, 4, 5);
INSERT INTO `ticket` (`id_ticket`,`folio_ticket`,`titulo`,`descripcion`,`fecha_subido`,`fecha_resuelto`,`estatus`,`prioridad`,`comentarios`,`id_empleado`,`id_categoria`,`id_tecnico`,`calificacion`) VALUES (55, 'PTP-202604-013', 'Laptop con sobrecalentamiento', 'La laptop se apaga sola después de 30 minutos de uso.', '2026-04-16 19:00:00', '2026-04-17 16:30:00', 'Resuelto', 'Alta', 'Se limpió sistema de ventilación y se aplicó pasta térmica nueva.', 17, 1, 20, 5);
INSERT INTO `ticket` (`id_ticket`,`folio_ticket`,`titulo`,`descripcion`,`fecha_subido`,`fecha_resuelto`,`estatus`,`prioridad`,`comentarios`,`id_empleado`,`id_categoria`,`id_tecnico`,`calificacion`) VALUES (56, 'PTP-202604-014', 'Teclas del teclado pegadas', 'Varias teclas del teclado no responden o quedan presionadas.', '2026-04-17 17:00:00', '2026-04-18 15:00:00', 'Resuelto', 'Baja', 'Se sustituyó teclado. Se recomendó no consumir alimentos cerca del equipo.', 18, 2, 21, 5);
INSERT INTO `ticket` (`id_ticket`,`folio_ticket`,`titulo`,`descripcion`,`fecha_subido`,`fecha_resuelto`,`estatus`,`prioridad`,`comentarios`,`id_empleado`,`id_categoria`,`id_tecnico`,`calificacion`) VALUES (57, 'PTP-202604-015', 'Sin internet en piso 2', 'Los equipos del segundo piso perdieron conexión a internet.', '2026-04-21 14:30:00', '2026-04-21 17:30:00', 'Resuelto', 'Urgente', 'Se identificó fallo en router del piso 2 y se reemplazó por unidad de respaldo.', 19, 4, 4, 5);
INSERT INTO `ticket` (`id_ticket`,`folio_ticket`,`titulo`,`descripcion`,`fecha_subido`,`fecha_resuelto`,`estatus`,`prioridad`,`comentarios`,`id_empleado`,`id_categoria`,`id_tecnico`,`calificacion`) VALUES (58, 'PTP-202607-001', 'Equipo sin arranque tras actualización', 'El equipo no inicia correctamente después de una actualización automática de Windows.', '2026-07-12 22:05:40', '2026-07-12 22:31:03', 'Resuelto', 'Alta', 'Se realizó reparación de inicio desde USB booteable. Sistema restaurado correctamente.', 10, 1, 4, 4);
INSERT INTO `ticket` (`id_ticket`,`folio_ticket`,`titulo`,`descripcion`,`fecha_subido`,`fecha_resuelto`,`estatus`,`prioridad`,`comentarios`,`id_empleado`,`id_categoria`,`id_tecnico`,`calificacion`) VALUES (59, 'PTP-202607-002', 'Pérdida de conexión a red local', 'El equipo perdió conectividad con la red local y no detecta el adaptador de red.', '2026-07-12 22:06:10', '2026-07-12 22:12:39', 'Resuelto', 'Alta', 'Se reinstalaron drivers de red y se verificó configuración de IP. Conexión restaurada.', 10, 4, 20, 4);
INSERT INTO `ticket` (`id_ticket`,`folio_ticket`,`titulo`,`descripcion`,`fecha_subido`,`fecha_resuelto`,`estatus`,`prioridad`,`comentarios`,`id_empleado`,`id_categoria`,`id_tecnico`,`calificacion`) VALUES (60, 'PTP-202607-003', 'Error al abrir archivos de Excel', 'Los archivos de Excel se abren con errores de formato y datos corruptos.', '2026-07-12 22:37:15', '2026-07-13 03:05:47', 'Resuelto', 'Alta', 'Se reparó la instalación de Office y se recuperaron los archivos desde respaldo.', 10, 3, 21, 5);
INSERT INTO `ticket` (`id_ticket`,`folio_ticket`,`titulo`,`descripcion`,`fecha_subido`,`fecha_resuelto`,`estatus`,`prioridad`,`comentarios`,`id_empleado`,`id_categoria`,`id_tecnico`,`calificacion`) VALUES (61, 'PTP-202607-004', 'Impresora no responde a trabajos de impresión', 'La impresora recibe los trabajos pero no imprime y la cola queda bloqueada.', '2026-07-12 23:36:58', '2026-07-13 03:13:15', 'Resuelto', 'Alta', 'Se limpió cola de impresión, se reinició el servicio de spooler y se probó correctamente.', 10, 5, 4, 5);
INSERT INTO `ticket` (`id_ticket`,`folio_ticket`,`titulo`,`descripcion`,`fecha_subido`,`fecha_resuelto`,`estatus`,`prioridad`,`comentarios`,`id_empleado`,`id_categoria`,`id_tecnico`,`calificacion`) VALUES (62, 'PTP-202607-005', 'Pantalla con parpadeo constante', 'El monitor presenta parpadeo intermitente que dificulta el trabajo.', '2026-07-13 01:58:20', '2026-07-13 02:24:19', 'Resuelto', 'Alta', 'Se ajustó tasa de refresco del monitor y se reemplazó cable de video.', 10, 2, 20, 5);
INSERT INTO `ticket` (`id_ticket`,`folio_ticket`,`titulo`,`descripcion`,`fecha_subido`,`fecha_resuelto`,`estatus`,`prioridad`,`comentarios`,`id_empleado`,`id_categoria`,`id_tecnico`,`calificacion`) VALUES (63, 'PTP-202607-006', 'Teclado con caracteres incorrectos', 'El teclado escribe caracteres distintos a los indicados en las teclas.', '2026-07-13 20:34:43', '2026-07-13 20:38:31', 'Resuelto', 'Alta', 'Se corrigió configuración de idioma del teclado en el sistema operativo.', 10, 2, 21, 5);
INSERT INTO `ticket` (`id_ticket`,`folio_ticket`,`titulo`,`descripcion`,`fecha_subido`,`fecha_resuelto`,`estatus`,`prioridad`,`comentarios`,`id_empleado`,`id_categoria`,`id_tecnico`,`calificacion`) VALUES (64, 'PTP-202607-007', 'Impresora sin dirección IP asignada', 'La impresora de red no obtiene dirección IP y no es visible en la red.', '2026-07-16 19:43:32', '2026-07-16 21:38:59', 'Resuelto', 'Alta', 'Se asignó IP estática a la impresora y se actualizó la configuración en los equipos del área.', 10, 5, 4, 5);
INSERT INTO `ticket` (`id_ticket`,`folio_ticket`,`titulo`,`descripcion`,`fecha_subido`,`fecha_resuelto`,`estatus`,`prioridad`,`comentarios`,`id_empleado`,`id_categoria`,`id_tecnico`,`calificacion`) VALUES (65, 'PTP-202607-008', 'Equipo con rendimiento degradado', 'El equipo opera muy lento, con alta utilización de CPU y memoria RAM.', '2026-07-16 22:14:41', '2026-07-16 22:24:30', 'Resuelto', 'Alta', 'Se identificaron procesos maliciosos, se eliminaron y se optimizó el inicio del sistema.', 10, 1, 20, 3);
INSERT INTO `ticket` (`id_ticket`,`folio_ticket`,`titulo`,`descripcion`,`fecha_subido`,`fecha_resuelto`,`estatus`,`prioridad`,`comentarios`,`id_empleado`,`id_categoria`,`id_tecnico`,`calificacion`) VALUES (66, 'PTP-202607-009', 'Fallo en teléfono IP de escritorio', 'El teléfono IP no registra línea y no permite realizar ni recibir llamadas.', '2026-07-17 18:05:05', '2026-07-17 20:00:08', 'Resuelto', 'Alta', 'Se reconfiguró el teléfono IP con los parámetros del servidor de telefonía.', 10, 3, 21, 4);
INSERT INTO `ticket` (`id_ticket`,`folio_ticket`,`titulo`,`descripcion`,`fecha_subido`,`fecha_resuelto`,`estatus`,`prioridad`,`comentarios`,`id_empleado`,`id_categoria`,`id_tecnico`,`calificacion`) VALUES (67, 'PTP-202607-010', 'Error de autenticación en sistema interno', 'El sistema interno rechaza las credenciales del usuario aunque son correctas.', '2026-07-17 22:14:09', '2026-07-20 21:08:31', 'Resuelto', 'Urgente', '', 10, 7, 4, 5);
INSERT INTO `ticket` (`id_ticket`,`folio_ticket`,`titulo`,`descripcion`,`fecha_subido`,`fecha_resuelto`,`estatus`,`prioridad`,`comentarios`,`id_empleado`,`id_categoria`,`id_tecnico`,`calificacion`) VALUES (68, 'PTP-202607-011', 'Equipo sin acceso a carpetas compartidas', 'El equipo no puede acceder a las carpetas compartidas del servidor de archivos.', '2026-07-17 22:14:09', '2026-07-20 21:08:14', 'Resuelto', 'Urgente', '', 10, 4, 4, 5);
INSERT INTO `ticket` (`id_ticket`,`folio_ticket`,`titulo`,`descripcion`,`fecha_subido`,`fecha_resuelto`,`estatus`,`prioridad`,`comentarios`,`id_empleado`,`id_categoria`,`id_tecnico`,`calificacion`) VALUES (69, 'PTP-202607-012', 'Fallo de red', 'Fallo desde que prendí mi computadora ayúdame&nbsp;', '2026-07-30 20:10:14', '2026-07-30 20:11:33', 'Resuelto', 'Alta', 'ya', 10, 4, 4, NULL);
INSERT INTO `ticket` (`id_ticket`,`folio_ticket`,`titulo`,`descripcion`,`fecha_subido`,`fecha_resuelto`,`estatus`,`prioridad`,`comentarios`,`id_empleado`,`id_categoria`,`id_tecnico`,`calificacion`) VALUES (70, 'PTP-202607-013', 'Fallo teclado', 'Fallo en teclado', '2026-07-30 20:14:51', '2026-07-30 20:16:42', 'Resuelto', 'Alta', 'Ya quedo se te cambia el insumo', 10, 2, 4, 5);
INSERT INTO `ticket` (`id_ticket`,`folio_ticket`,`titulo`,`descripcion`,`fecha_subido`,`fecha_resuelto`,`estatus`,`prioridad`,`comentarios`,`id_empleado`,`id_categoria`,`id_tecnico`,`calificacion`) VALUES (71, 'PTP-202608-001', 'Fallo impresora', 'Fallo impresora no quiere prender la uso y uso y nada todo se queda en la bandeja.<hr/><p><strong>Acceso remoto (TeamViewer)</strong></p><p><strong>ID:</strong> 1 630 975 953</p><p><strong>Contraseña:</strong> fv9zxt7u</p>', '2026-08-04 18:16:02', '2026-08-07 18:24:11', 'No Resuelto', 'Media', NULL, 10, 5, NULL, NULL);
INSERT INTO `ticket` (`id_ticket`,`folio_ticket`,`titulo`,`descripcion`,`fecha_subido`,`fecha_resuelto`,`estatus`,`prioridad`,`comentarios`,`id_empleado`,`id_categoria`,`id_tecnico`,`calificacion`) VALUES (72, 'PTP-202608-002', 'gv3rg3', '3b3b', '2026-08-04 18:21:10', '2026-08-07 18:24:11', 'No Resuelto', 'Alta', NULL, 10, 2, NULL, NULL);
INSERT INTO `ticket` (`id_ticket`,`folio_ticket`,`titulo`,`descripcion`,`fecha_subido`,`fecha_resuelto`,`estatus`,`prioridad`,`comentarios`,`id_empleado`,`id_categoria`,`id_tecnico`,`calificacion`) VALUES (73, 'PTP-202608-003', 'Fallo de la impresora de ventas', 'Se desconfigura apaga, e imprime mal, mancha las hojas<hr/><p><strong>Acceso remoto (TeamViewer)</strong></p><p><strong>ID:</strong> 1 630 975 953</p><p><strong>Contraseña:</strong> fv9zxt7u</p>', '2026-08-04 19:55:54', '2026-08-04 20:01:53', 'Resuelto', 'Media', 'Ya quedo funcional completo sin fallas', 10, 5, 4, 5);

SET FOREIGN_KEY_CHECKS=1;
