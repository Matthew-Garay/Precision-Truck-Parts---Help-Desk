CREATE SCHEMA IF NOT EXISTS `precision_helpdesk`
  DEFAULT CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
USE `precision_helpdesk`;

SET FOREIGN_KEY_CHECKS=0;
SET SQL_MODE="NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+00:00";

DROP TABLE IF EXISTS `categoria`;
CREATE TABLE `categoria` (
  `id_categoria` int NOT NULL AUTO_INCREMENT,
  `nombre_categoria` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `en_tickets` tinyint(1) NOT NULL DEFAULT '0',
  `en_insumos` tinyint(1) NOT NULL DEFAULT '0',
  `en_manuales` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id_categoria`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `departamento`;
CREATE TABLE `departamento` (
  `id_departamento` int NOT NULL AUTO_INCREMENT,
  `nombre_departamento` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id_departamento`),
  UNIQUE KEY `uq_nombre_departamento` (`nombre_departamento`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `rol`;
CREATE TABLE `rol` (
  `id_rol` int NOT NULL AUTO_INCREMENT,
  `nombre_rol` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id_rol`),
  UNIQUE KEY `uq_nombre_rol` (`nombre_rol`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `sucursal`;
CREATE TABLE `sucursal` (
  `id_sucursal` int NOT NULL AUTO_INCREMENT,
  `nombre_sucursal` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id_sucursal`),
  UNIQUE KEY `uq_nombre_sucursal` (`nombre_sucursal`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `empleado`;
CREATE TABLE `empleado` (
  `id_empleado` int NOT NULL AUTO_INCREMENT,
  `num_empleado` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `nombre` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `ap_paterno` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `ap_materno` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `foto` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `estatus` enum('Activo','Inactivo') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Activo',
  `id_rol` int NOT NULL,
  `id_departamento` int NOT NULL,
  `id_sucursal` int DEFAULT NULL,
  PRIMARY KEY (`id_empleado`),
  UNIQUE KEY `uq_email` (`email`),
  UNIQUE KEY `uq_num_empleado` (`num_empleado`),
  KEY `fk_empleado_rol` (`id_rol`),
  KEY `fk_empleado_depto` (`id_departamento`),
  KEY `fk_empleado_sucursal` (`id_sucursal`),
  CONSTRAINT `fk_empleado_depto` FOREIGN KEY (`id_departamento`) REFERENCES `departamento` (`id_departamento`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_empleado_rol` FOREIGN KEY (`id_rol`) REFERENCES `rol` (`id_rol`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_empleado_sucursal` FOREIGN KEY (`id_sucursal`) REFERENCES `sucursal` (`id_sucursal`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `historial_acceso`;
CREATE TABLE `historial_acceso` (
  `id_acceso` int NOT NULL AUTO_INCREMENT,
  `id_empleado` int NOT NULL,
  `fecha_entrada` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `fecha_salida` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id_acceso`),
  KEY `fk_historial_empleado` (`id_empleado`),
  CONSTRAINT `fk_historial_empleado` FOREIGN KEY (`id_empleado`) REFERENCES `empleado` (`id_empleado`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `insumo`;
CREATE TABLE `insumo` (
  `id_insumo` int NOT NULL AUTO_INCREMENT,
  `num_serie` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `nombre` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `descripcion` text COLLATE utf8mb4_unicode_ci,
  `marca` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `modelo` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `stock` int NOT NULL DEFAULT '0',
  `estado` enum('Excelente','Bueno','Regular','Malo') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `id_categoria` int NOT NULL,
  `proveedor` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `imagen_url` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id_insumo`),
  KEY `fk_insumo_categoria` (`id_categoria`),
  CONSTRAINT `fk_insumo_categoria` FOREIGN KEY (`id_categoria`) REFERENCES `categoria` (`id_categoria`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `chk_stock` CHECK ((`stock` >= 0))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `manual`;
CREATE TABLE `manual` (
  `id_manual` int unsigned NOT NULL AUTO_INCREMENT,
  `nombre` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `descripcion` text COLLATE utf8mb4_unicode_ci,
  `fecha_subida` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `fecha_cambio` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `ruta_pdf` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `id_categoria` int NOT NULL,
  PRIMARY KEY (`id_manual`),
  KEY `idx_manual_categoria` (`id_categoria`),
  CONSTRAINT `fk_manual_categoria` FOREIGN KEY (`id_categoria`) REFERENCES `categoria` (`id_categoria`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `solicitud`;
CREATE TABLE `solicitud` (
  `id_solicitud` int NOT NULL AUTO_INCREMENT,
  `folio_solicitud` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `fecha` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `estatus` enum('En proceso','Aceptado','Rechazado') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'En proceso',
  `prioridad` enum('Baja','Media','Alta','Urgente') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Media',
  `id_empleado` int NOT NULL,
  PRIMARY KEY (`id_solicitud`),
  UNIQUE KEY `uq_folio` (`folio_solicitud`),
  KEY `fk_sol_empleado` (`id_empleado`),
  KEY `idx_solicitud_estatus_fecha` (`estatus`,`fecha`),
  KEY `idx_solicitud_empleado` (`id_empleado`),
  CONSTRAINT `fk_sol_empleado` FOREIGN KEY (`id_empleado`) REFERENCES `empleado` (`id_empleado`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `solicitud_insumo`;
CREATE TABLE `solicitud_insumo` (
  `id_solicitud_insumo` int NOT NULL AUTO_INCREMENT,
  `id_solicitud` int NOT NULL,
  `id_insumo` int NOT NULL,
  `descripcion` text COLLATE utf8mb4_unicode_ci,
  `cantidad` int NOT NULL DEFAULT '1',
  `aprobado` tinyint(1) DEFAULT NULL,
  PRIMARY KEY (`id_solicitud_insumo`),
  KEY `fk_si_solicitud` (`id_solicitud`),
  KEY `fk_si_insumo` (`id_insumo`),
  CONSTRAINT `fk_si_insumo` FOREIGN KEY (`id_insumo`) REFERENCES `insumo` (`id_insumo`) ON DELETE RESTRICT,
  CONSTRAINT `fk_si_solicitud` FOREIGN KEY (`id_solicitud`) REFERENCES `solicitud` (`id_solicitud`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `ticket`;
CREATE TABLE `ticket` (
  `id_ticket` int NOT NULL AUTO_INCREMENT,
  `folio_ticket` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `titulo` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `descripcion` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `fecha_subido` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `fecha_resuelto` timestamp NULL DEFAULT NULL,
  `estatus` enum('En proceso','Resuelto','No Resuelto','Cancelado') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'En proceso',
  `prioridad` enum('Baja','Media','Alta','Urgente') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Media',
  `comentarios` text COLLATE utf8mb4_unicode_ci,
  `id_empleado` int NOT NULL,
  `id_categoria` int NOT NULL,
  `id_tecnico` int DEFAULT NULL,
  `calificacion` tinyint DEFAULT NULL,
  PRIMARY KEY (`id_ticket`),
  UNIQUE KEY `uq_folio_ticket` (`folio_ticket`),
  KEY `fk_ticket_empleado` (`id_empleado`),
  KEY `fk_ticket_categoria` (`id_categoria`),
  KEY `fk_ticket_tecnico` (`id_tecnico`),
  CONSTRAINT `fk_ticket_categoria` FOREIGN KEY (`id_categoria`) REFERENCES `categoria` (`id_categoria`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_ticket_empleado` FOREIGN KEY (`id_empleado`) REFERENCES `empleado` (`id_empleado`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_ticket_tecnico` FOREIGN KEY (`id_tecnico`) REFERENCES `empleado` (`id_empleado`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `token_revocado`;
CREATE TABLE `token_revocado` (
  `id_revocado` int NOT NULL AUTO_INCREMENT,
  `jti` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `id_empleado` int NOT NULL,
  `expira_en` timestamp NOT NULL,
  PRIMARY KEY (`id_revocado`),
  UNIQUE KEY `uq_jti` (`jti`),
  KEY `idx_expira_en` (`expira_en`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS=1;
