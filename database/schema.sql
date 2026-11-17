-- =============================================================================
--  ESQUEMA (solo estructura, sin datos)
--  PrecisionTrucks HelpDesk — generado 2026-11-15 a partir de Dump20261114.sql
--  con la reestructura del 15-nov-2026 aplicada (corrección, normalización, índices).
--  IDs consecutivos desde 1; salidas internas en la tabla salida_interna.
-- =============================================================================

CREATE DATABASE IF NOT EXISTS `precision_helpdesk` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `precision_helpdesk`;


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;
DROP TABLE IF EXISTS `categoria`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `categoria` (
  `id_categoria` int NOT NULL AUTO_INCREMENT,
  `nombre_categoria` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `en_tickets` tinyint(1) NOT NULL DEFAULT '0',
  `en_insumos` tinyint(1) NOT NULL DEFAULT '0',
  `en_manuales` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id_categoria`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `departamento`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `departamento` (
  `id_departamento` int NOT NULL AUTO_INCREMENT,
  `nombre_departamento` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id_departamento`),
  UNIQUE KEY `uq_nombre_departamento` (`nombre_departamento`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `empleado`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `empleado` (
  `id_empleado` int NOT NULL AUTO_INCREMENT,
  `num_empleado` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `nombre` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `ap_paterno` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `ap_materno` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `password` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `historial_acceso`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `historial_acceso` (
  `id_acceso` int NOT NULL AUTO_INCREMENT,
  `id_empleado` int NOT NULL,
  `fecha_entrada` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `fecha_salida` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id_acceso`),
  KEY `fk_historial_empleado` (`id_empleado`),
  KEY `idx_acceso_empleado_fecha` (`id_empleado`,`fecha_entrada`),
  CONSTRAINT `fk_historial_empleado` FOREIGN KEY (`id_empleado`) REFERENCES `empleado` (`id_empleado`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `insumo`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `insumo` (
  `id_insumo` int NOT NULL AUTO_INCREMENT,
  `num_serie` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `nombre` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `descripcion` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `marca` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `modelo` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `stock` int NOT NULL DEFAULT '0',
  `estado` enum('Excelente','Bueno','Regular','Malo','Dañado') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `id_categoria` int NOT NULL,
  `imagen_url` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `activo` tinyint(1) NOT NULL DEFAULT '1',
  `visible_publico` tinyint(1) NOT NULL DEFAULT '1' COMMENT '1 = visible al público, 0 = oculto',
  PRIMARY KEY (`id_insumo`),
  KEY `fk_insumo_categoria` (`id_categoria`),
  KEY `idx_insumo_catalogo` (`activo`,`visible_publico`,`stock`),
  CONSTRAINT `fk_insumo_categoria` FOREIGN KEY (`id_categoria`) REFERENCES `categoria` (`id_categoria`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `chk_stock` CHECK ((`stock` >= 0))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `manual`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `manual` (
  `id_manual` int unsigned NOT NULL AUTO_INCREMENT,
  `nombre` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `descripcion` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `version` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `movimiento_inventario`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `movimiento_inventario` (
  `id_movimiento` int NOT NULL AUTO_INCREMENT,
  `id_insumo` int NOT NULL,
  `tipo` enum('Entrada','Salida','Ajuste') COLLATE utf8mb4_unicode_ci NOT NULL,
  `cantidad` int NOT NULL,
  `stock_anterior` int NOT NULL DEFAULT '0',
  `stock_nuevo` int NOT NULL DEFAULT '0',
  `id_sucursal_origen` int DEFAULT NULL,
  `id_sucursal_destino` int DEFAULT NULL,
  `id_solicitud` int DEFAULT NULL,
  `id_salida` int DEFAULT NULL,
  `id_empleado` int DEFAULT NULL,
  `motivo` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `fecha` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `fecha_registro` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_movimiento`),
  KEY `fk_mi_suc_origen` (`id_sucursal_origen`),
  KEY `fk_mi_suc_dest` (`id_sucursal_destino`),
  KEY `fk_mi_empleado` (`id_empleado`),
  KEY `idx_mi_insumo_fecha` (`id_insumo`,`fecha`),
  KEY `idx_mi_tipo_fecha` (`tipo`,`fecha`),
  KEY `idx_mi_solicitud` (`id_solicitud`),
  KEY `fk_mi_salida` (`id_salida`),
  CONSTRAINT `fk_mi_empleado` FOREIGN KEY (`id_empleado`) REFERENCES `empleado` (`id_empleado`) ON DELETE SET NULL,
  CONSTRAINT `fk_mi_insumo` FOREIGN KEY (`id_insumo`) REFERENCES `insumo` (`id_insumo`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_mi_salida` FOREIGN KEY (`id_salida`) REFERENCES `salida_interna` (`id_salida`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_mi_solicitud` FOREIGN KEY (`id_solicitud`) REFERENCES `solicitud` (`id_solicitud`) ON DELETE SET NULL,
  CONSTRAINT `fk_mi_suc_dest` FOREIGN KEY (`id_sucursal_destino`) REFERENCES `sucursal` (`id_sucursal`) ON DELETE SET NULL,
  CONSTRAINT `fk_mi_suc_origen` FOREIGN KEY (`id_sucursal_origen`) REFERENCES `sucursal` (`id_sucursal`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `rol`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `rol` (
  `id_rol` int NOT NULL AUTO_INCREMENT,
  `nombre_rol` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id_rol`),
  UNIQUE KEY `uq_nombre_rol` (`nombre_rol`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `salida_interna`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `salida_interna` (
  `id_salida` int NOT NULL AUTO_INCREMENT,
  `folio_salida` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `fecha` datetime NOT NULL COMMENT 'Fecha y hora física de la salida',
  `prioridad` enum('Baja','Media','Alta','Urgente') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Media',
  `id_sucursal_origen` int DEFAULT NULL,
  `id_sucursal_destino` int DEFAULT NULL,
  `destino_texto` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Solo si el destino no es una sucursal registrada',
  `id_solicitante` int DEFAULT NULL COMMENT 'Quién se lleva el material',
  `solicitante_texto` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Solo si no es un empleado registrado',
  `id_responsable` int DEFAULT NULL COMMENT 'Quién recibe en destino',
  `responsable_texto` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Solo si no es un empleado registrado',
  `justificacion` text COLLATE utf8mb4_unicode_ci,
  `id_registro` int DEFAULT NULL COMMENT 'Empleado que capturó la salida',
  `fecha_registro` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_salida`),
  UNIQUE KEY `uq_folio_salida` (`folio_salida`),
  KEY `idx_salida_fecha` (`fecha`),
  KEY `idx_salida_solicitante` (`id_solicitante`),
  KEY `fk_sal_suc_origen` (`id_sucursal_origen`),
  KEY `fk_sal_suc_destino` (`id_sucursal_destino`),
  KEY `fk_sal_responsable` (`id_responsable`),
  KEY `fk_sal_registro` (`id_registro`),
  CONSTRAINT `fk_sal_registro` FOREIGN KEY (`id_registro`) REFERENCES `empleado` (`id_empleado`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_sal_responsable` FOREIGN KEY (`id_responsable`) REFERENCES `empleado` (`id_empleado`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_sal_solicitante` FOREIGN KEY (`id_solicitante`) REFERENCES `empleado` (`id_empleado`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_sal_suc_destino` FOREIGN KEY (`id_sucursal_destino`) REFERENCES `sucursal` (`id_sucursal`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_sal_suc_origen` FOREIGN KEY (`id_sucursal_origen`) REFERENCES `sucursal` (`id_sucursal`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Cabecera de las salidas internas (folio SAL-YYYYMM-NNNN)';
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `solicitud`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `solicitud` (
  `id_solicitud` int NOT NULL AUTO_INCREMENT,
  `folio_solicitud` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `fecha` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `estatus` enum('En proceso','Aceptado','Rechazado') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'En proceso',
  `prioridad` enum('Baja','Media','Alta','Urgente') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Media',
  `id_empleado` int NOT NULL,
  `id_sucursal_origen` int DEFAULT NULL,
  `id_sucursal_destino` int DEFAULT NULL,
  `fecha_atencion` datetime DEFAULT NULL,
  `observacion` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `observacion_por` int DEFAULT NULL,
  `observacion_fecha` datetime DEFAULT NULL,
  PRIMARY KEY (`id_solicitud`),
  UNIQUE KEY `uq_folio` (`folio_solicitud`),
  KEY `fk_sol_empleado` (`id_empleado`),
  KEY `idx_solicitud_estatus_fecha` (`estatus`,`fecha`),
  KEY `idx_solicitud_empleado` (`id_empleado`),
  KEY `fk_solicitud_sucursal_destino` (`id_sucursal_destino`),
  KEY `idx_solicitud_ruta` (`id_sucursal_origen`,`id_sucursal_destino`),
  KEY `fk_solicitud_observacion_por` (`observacion_por`),
  KEY `idx_solicitud_empleado_fecha` (`id_empleado`,`fecha`),
  CONSTRAINT `fk_sol_empleado` FOREIGN KEY (`id_empleado`) REFERENCES `empleado` (`id_empleado`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_solicitud_observacion_por` FOREIGN KEY (`observacion_por`) REFERENCES `empleado` (`id_empleado`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_solicitud_sucursal_destino` FOREIGN KEY (`id_sucursal_destino`) REFERENCES `sucursal` (`id_sucursal`) ON DELETE SET NULL,
  CONSTRAINT `fk_solicitud_sucursal_origen` FOREIGN KEY (`id_sucursal_origen`) REFERENCES `sucursal` (`id_sucursal`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `solicitud_insumo`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `sucursal`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sucursal` (
  `id_sucursal` int NOT NULL AUTO_INCREMENT,
  `nombre_sucursal` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id_sucursal`),
  UNIQUE KEY `uq_nombre_sucursal` (`nombre_sucursal`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `ticket`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
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
  KEY `idx_ticket_tecnico_estatus` (`id_tecnico`,`estatus`),
  CONSTRAINT `fk_ticket_categoria` FOREIGN KEY (`id_categoria`) REFERENCES `categoria` (`id_categoria`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_ticket_empleado` FOREIGN KEY (`id_empleado`) REFERENCES `empleado` (`id_empleado`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_ticket_tecnico` FOREIGN KEY (`id_tecnico`) REFERENCES `empleado` (`id_empleado`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `ticket_historial`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ticket_historial` (
  `id_historial` int unsigned NOT NULL AUTO_INCREMENT,
  `id_ticket` int NOT NULL,
  `id_empleado` int NOT NULL,
  `campo_cambiado` varchar(60) COLLATE utf8mb4_unicode_ci NOT NULL,
  `valor_anterior` text COLLATE utf8mb4_unicode_ci,
  `valor_nuevo` text COLLATE utf8mb4_unicode_ci,
  `fecha` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_historial`),
  KEY `idx_th_ticket` (`id_ticket`),
  KEY `idx_th_fecha` (`fecha`),
  KEY `fk_th_empleado` (`id_empleado`),
  CONSTRAINT `fk_th_empleado` FOREIGN KEY (`id_empleado`) REFERENCES `empleado` (`id_empleado`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_th_ticket` FOREIGN KEY (`id_ticket`) REFERENCES `ticket` (`id_ticket`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

