-- =============================================================================
--  ESQUEMA (solo estructura, sin datos)
--  PrecisionTrucks HelpDesk — regenerado 2026-11-23 con server/scripts/regenerar-schema.js
--  desde la base con las migraciones hasta la 010 aplicadas.
--  No editar a mano: los cambios van en database/migraciones/NNN_*.sql.
-- =============================================================================

CREATE DATABASE IF NOT EXISTS `precision_helpdesk` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `precision_helpdesk`;

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;

DROP TABLE IF EXISTS `area`;
CREATE TABLE `area` (
  `id_area` int NOT NULL AUTO_INCREMENT COMMENT 'PK',
  `nombre_area` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Área de la empresa (Contraloría, Almacén…)',
  PRIMARY KEY (`id_area`),
  UNIQUE KEY `uq_nombre_area` (`nombre_area`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Áreas de la empresa; agrupan los puestos (tabla departamento)';

DROP TABLE IF EXISTS `articulo_conocimiento`;
CREATE TABLE `articulo_conocimiento` (
  `id_articulo` int NOT NULL AUTO_INCREMENT COMMENT 'PK',
  `titulo` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Título del artículo',
  `resumen` varchar(300) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Una o dos líneas que se muestran en la lista',
  `contenido` mediumtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Cuerpo en Markdown',
  `etiquetas` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Palabras clave separadas por coma',
  `id_categoria` int NOT NULL COMMENT 'FK categoria (ámbito manual)',
  `publicado` tinyint(1) NOT NULL DEFAULT '1' COMMENT '0 = borrador, solo lo ven los administradores',
  `vistas` int unsigned NOT NULL DEFAULT '0' COMMENT 'Veces que lo abrió un usuario',
  `creado_por` int DEFAULT NULL COMMENT 'FK empleado autor',
  `editado_por` int DEFAULT NULL COMMENT 'FK empleado de la última edición',
  `fecha_creacion` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `fecha_cambio` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Última edición del contenido',
  PRIMARY KEY (`id_articulo`),
  KEY `idx_articulo_categoria` (`id_categoria`),
  KEY `idx_articulo_publicado` (`publicado`,`fecha_cambio`),
  KEY `fk_articulo_creado` (`creado_por`),
  KEY `fk_articulo_editado` (`editado_por`),
  CONSTRAINT `fk_articulo_categoria` FOREIGN KEY (`id_categoria`) REFERENCES `categoria` (`id_categoria`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_articulo_creado` FOREIGN KEY (`creado_por`) REFERENCES `empleado` (`id_empleado`) ON DELETE SET NULL,
  CONSTRAINT `fk_articulo_editado` FOREIGN KEY (`editado_por`) REFERENCES `empleado` (`id_empleado`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Artículos de la base de conocimiento';

DROP TABLE IF EXISTS `articulo_voto`;
CREATE TABLE `articulo_voto` (
  `id_articulo` int NOT NULL COMMENT 'FK articulo_conocimiento',
  `id_empleado` int NOT NULL COMMENT 'FK empleado que votó',
  `util` tinyint(1) NOT NULL COMMENT '1 = me sirvió, 0 = no me sirvió',
  `fecha` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_articulo`,`id_empleado`),
  KEY `fk_voto_empleado` (`id_empleado`),
  CONSTRAINT `fk_voto_articulo` FOREIGN KEY (`id_articulo`) REFERENCES `articulo_conocimiento` (`id_articulo`) ON DELETE CASCADE,
  CONSTRAINT `fk_voto_empleado` FOREIGN KEY (`id_empleado`) REFERENCES `empleado` (`id_empleado`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Votos de utilidad de los artículos';

DROP TABLE IF EXISTS `categoria`;
CREATE TABLE `categoria` (
  `id_categoria` int NOT NULL AUTO_INCREMENT,
  `nombre_categoria` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id_categoria`),
  UNIQUE KEY `uq_nombre_categoria` (`nombre_categoria`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `categoria_ambito`;
CREATE TABLE `categoria_ambito` (
  `id_categoria` int NOT NULL COMMENT 'FK categoria',
  `ambito` enum('ticket','insumo','manual') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Módulo donde la categoría está disponible',
  PRIMARY KEY (`id_categoria`,`ambito`),
  KEY `idx_ca_ambito` (`ambito`),
  CONSTRAINT `fk_ca_categoria` FOREIGN KEY (`id_categoria`) REFERENCES `categoria` (`id_categoria`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='En qué módulos se ofrece cada categoría (N:M categoría–ámbito)';

DROP TABLE IF EXISTS `departamento`;
CREATE TABLE `departamento` (
  `id_departamento` int NOT NULL AUTO_INCREMENT,
  `nombre_departamento` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `id_area` int DEFAULT NULL COMMENT 'FK area: área a la que pertenece el puesto',
  PRIMARY KEY (`id_departamento`),
  UNIQUE KEY `uq_nombre_departamento` (`nombre_departamento`),
  KEY `idx_departamento_area` (`id_area`),
  CONSTRAINT `fk_departamento_area` FOREIGN KEY (`id_area`) REFERENCES `area` (`id_area`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `empleado`;
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
  `eliminado` tinyint(1) NOT NULL DEFAULT '0',
  `fecha_eliminacion` datetime DEFAULT NULL,
  `id_elimino` int DEFAULT NULL COMMENT 'Administrador que lo eliminó',
  PRIMARY KEY (`id_empleado`),
  UNIQUE KEY `uq_email` (`email`),
  UNIQUE KEY `uq_num_empleado` (`num_empleado`),
  KEY `fk_empleado_rol` (`id_rol`),
  KEY `fk_empleado_depto` (`id_departamento`),
  KEY `fk_empleado_sucursal` (`id_sucursal`),
  KEY `idx_empleado_eliminado` (`eliminado`),
  KEY `fk_emp_elimino` (`id_elimino`),
  CONSTRAINT `fk_emp_elimino` FOREIGN KEY (`id_elimino`) REFERENCES `empleado` (`id_empleado`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_empleado_depto` FOREIGN KEY (`id_departamento`) REFERENCES `departamento` (`id_departamento`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_empleado_rol` FOREIGN KEY (`id_rol`) REFERENCES `rol` (`id_rol`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_empleado_sucursal` FOREIGN KEY (`id_sucursal`) REFERENCES `sucursal` (`id_sucursal`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `chk_emp_baja` CHECK ((((`eliminado` = 0) and (`fecha_eliminacion` is null)) or ((`eliminado` = 1) and (`fecha_eliminacion` is not null))))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `historial_acceso`;
CREATE TABLE `historial_acceso` (
  `id_acceso` int NOT NULL AUTO_INCREMENT,
  `id_empleado` int NOT NULL,
  `fecha_entrada` datetime DEFAULT CURRENT_TIMESTAMP,
  `fecha_salida` datetime DEFAULT NULL,
  PRIMARY KEY (`id_acceso`),
  KEY `idx_acceso_empleado_fecha` (`id_empleado`,`fecha_entrada`),
  CONSTRAINT `fk_historial_empleado` FOREIGN KEY (`id_empleado`) REFERENCES `empleado` (`id_empleado`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `chk_acceso_fechas` CHECK (((`fecha_salida` is null) or (`fecha_entrada` is null) or (`fecha_salida` >= `fecha_entrada`)))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `insumo`;
CREATE TABLE `insumo` (
  `id_insumo` int NOT NULL AUTO_INCREMENT,
  `num_serie` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `etiqueta` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Etiqueta física del insumo (código o texto impreso)',
  `control_serie` tinyint(1) NOT NULL DEFAULT '0' COMMENT '1 = se controla pieza por pieza con número de serie (insumo_unidad)',
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
  KEY `idx_insumo_etiqueta` (`etiqueta`),
  CONSTRAINT `fk_insumo_categoria` FOREIGN KEY (`id_categoria`) REFERENCES `categoria` (`id_categoria`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `chk_stock` CHECK ((`stock` >= 0))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `insumo_unidad`;
CREATE TABLE `insumo_unidad` (
  `id_unidad` int NOT NULL AUTO_INCREMENT COMMENT 'PK',
  `id_insumo` int NOT NULL COMMENT 'FK insumo (tipo de artículo)',
  `num_serie` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Número de serie de esta pieza',
  `estado` enum('Excelente','Bueno','Regular','Malo','Dañado') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Bueno' COMMENT 'Condición de esta pieza',
  `en_almacen` tinyint(1) NOT NULL DEFAULT '1' COMMENT '1 = en inventario, 0 = ya salió',
  `id_mov_entrada` int DEFAULT NULL COMMENT 'FK movimiento_inventario con el que entró (NULL = alta inicial)',
  `id_mov_salida` int DEFAULT NULL COMMENT 'FK movimiento_inventario con el que salió',
  `fecha_alta` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Cuándo se registró la pieza',
  PRIMARY KEY (`id_unidad`),
  UNIQUE KEY `uq_unidad_serie` (`id_insumo`,`num_serie`),
  KEY `idx_unidad_disponibles` (`id_insumo`,`en_almacen`,`fecha_alta`),
  KEY `idx_unidad_entrada` (`id_mov_entrada`),
  KEY `idx_unidad_salida` (`id_mov_salida`),
  CONSTRAINT `fk_unidad_entrada` FOREIGN KEY (`id_mov_entrada`) REFERENCES `movimiento_inventario` (`id_movimiento`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `fk_unidad_insumo` FOREIGN KEY (`id_insumo`) REFERENCES `insumo` (`id_insumo`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `fk_unidad_salida` FOREIGN KEY (`id_mov_salida`) REFERENCES `movimiento_inventario` (`id_movimiento`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `chk_unidad_almacen` CHECK ((((`en_almacen` = 1) and (`id_mov_salida` is null)) or ((`en_almacen` = 0) and (`id_mov_salida` is not null)))),
  CONSTRAINT `chk_unidad_serie` CHECK ((char_length(trim(`num_serie`)) > 0))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Piezas individuales (con número de serie) de los insumos con control_serie = 1';

DROP TABLE IF EXISTS `manual`;
CREATE TABLE `manual` (
  `id_manual` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `descripcion` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `version` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `subido_por` int DEFAULT NULL,
  `fecha_subida` datetime DEFAULT CURRENT_TIMESTAMP,
  `fecha_cambio` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `ruta_pdf` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `contenido_texto` mediumtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci COMMENT 'Texto del PDF para la búsqueda (páginas separadas por \\f). NULL = pendiente',
  `id_categoria` int NOT NULL,
  PRIMARY KEY (`id_manual`),
  KEY `idx_manual_categoria` (`id_categoria`),
  KEY `fk_manual_empleado` (`subido_por`),
  CONSTRAINT `fk_manual_categoria` FOREIGN KEY (`id_categoria`) REFERENCES `categoria` (`id_categoria`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_manual_empleado` FOREIGN KEY (`subido_por`) REFERENCES `empleado` (`id_empleado`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `movimiento_inventario`;
CREATE TABLE `movimiento_inventario` (
  `id_movimiento` int NOT NULL AUTO_INCREMENT,
  `id_insumo` int NOT NULL,
  `tipo` enum('Entrada','Salida','Ajuste') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `cantidad` int NOT NULL,
  `stock_anterior` int NOT NULL DEFAULT '0',
  `stock_nuevo` int NOT NULL DEFAULT '0',
  `id_sucursal_origen` int DEFAULT NULL,
  `id_sucursal_destino` int DEFAULT NULL,
  `id_solicitud` int DEFAULT NULL,
  `id_salida` int DEFAULT NULL,
  `id_empleado` int DEFAULT NULL,
  `motivo` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `fecha` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `fecha_registro` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_movimiento`),
  KEY `fk_mi_suc_origen` (`id_sucursal_origen`),
  KEY `fk_mi_empleado` (`id_empleado`),
  KEY `idx_mi_insumo_fecha` (`id_insumo`,`fecha`),
  KEY `idx_mi_tipo_fecha` (`tipo`,`fecha`),
  KEY `idx_mi_solicitud` (`id_solicitud`),
  KEY `fk_mi_salida` (`id_salida`),
  KEY `idx_mi_destino_fecha` (`id_sucursal_destino`,`fecha`),
  CONSTRAINT `fk_mi_empleado` FOREIGN KEY (`id_empleado`) REFERENCES `empleado` (`id_empleado`) ON DELETE SET NULL,
  CONSTRAINT `fk_mi_insumo` FOREIGN KEY (`id_insumo`) REFERENCES `insumo` (`id_insumo`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_mi_salida` FOREIGN KEY (`id_salida`) REFERENCES `salida_interna` (`id_salida`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `fk_mi_solicitud` FOREIGN KEY (`id_solicitud`) REFERENCES `solicitud` (`id_solicitud`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `fk_mi_suc_dest` FOREIGN KEY (`id_sucursal_destino`) REFERENCES `sucursal` (`id_sucursal`) ON DELETE SET NULL,
  CONSTRAINT `fk_mi_suc_origen` FOREIGN KEY (`id_sucursal_origen`) REFERENCES `sucursal` (`id_sucursal`) ON DELETE SET NULL,
  CONSTRAINT `chk_mi_aritmetica` CHECK ((((`tipo` = _utf8mb4'Entrada') and (`stock_nuevo` = (`stock_anterior` + `cantidad`))) or ((`tipo` = _utf8mb4'Salida') and (`stock_nuevo` = (`stock_anterior` - `cantidad`))) or (`tipo` = _utf8mb4'Ajuste'))),
  CONSTRAINT `chk_mi_cantidad` CHECK ((`cantidad` > 0)),
  CONSTRAINT `chk_mi_origen_doc` CHECK (((`id_solicitud` is null) or (`id_salida` is null)))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `rol`;
CREATE TABLE `rol` (
  `id_rol` int NOT NULL AUTO_INCREMENT,
  `nombre_rol` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id_rol`),
  UNIQUE KEY `uq_nombre_rol` (`nombre_rol`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `salida_anulacion`;
CREATE TABLE `salida_anulacion` (
  `id_salida` int NOT NULL COMMENT 'PK y FK salida_interna',
  `motivo` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Por qué se anuló',
  `id_anulo` int DEFAULT NULL COMMENT 'FK empleado: quién anuló',
  `fecha` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Cuándo se anuló',
  PRIMARY KEY (`id_salida`),
  KEY `idx_anul_empleado` (`id_anulo`),
  CONSTRAINT `fk_anul_empleado` FOREIGN KEY (`id_anulo`) REFERENCES `empleado` (`id_empleado`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_anul_salida` FOREIGN KEY (`id_salida`) REFERENCES `salida_interna` (`id_salida`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `chk_anul_motivo` CHECK ((char_length(`motivo`) >= 5))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Anulación de una salida interna (si existe, la salida está anulada)';

DROP TABLE IF EXISTS `salida_cambio`;
CREATE TABLE `salida_cambio` (
  `id_cambio` int NOT NULL AUTO_INCREMENT,
  `id_salida` int NOT NULL,
  `campo` varchar(40) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Campo corregido (p. ej. fecha)',
  `valor_anterior` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `valor_nuevo` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `motivo` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `id_empleado` int DEFAULT NULL COMMENT 'Quién hizo la corrección',
  `fecha` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_cambio`),
  KEY `idx_sc_salida` (`id_salida`),
  KEY `fk_sc_empleado` (`id_empleado`),
  CONSTRAINT `fk_sc_empleado` FOREIGN KEY (`id_empleado`) REFERENCES `empleado` (`id_empleado`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_sc_salida` FOREIGN KEY (`id_salida`) REFERENCES `salida_interna` (`id_salida`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Correcciones hechas a salidas internas';

DROP TABLE IF EXISTS `salida_interna`;
CREATE TABLE `salida_interna` (
  `id_salida` int NOT NULL AUTO_INCREMENT,
  `folio_salida` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `fecha` datetime NOT NULL COMMENT 'Fecha y hora física de la salida',
  `prioridad` enum('Baja','Media','Alta','Urgente') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Media',
  `id_sucursal_origen` int DEFAULT NULL,
  `id_sucursal_destino` int DEFAULT NULL,
  `destino_texto` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Solo si el destino no es una sucursal registrada',
  `id_solicitante` int DEFAULT NULL COMMENT 'Quién se lleva el material',
  `solicitante_texto` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Solo si no es un empleado registrado',
  `id_responsable` int DEFAULT NULL COMMENT 'Quién recibe en destino',
  `responsable_texto` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Solo si no es un empleado registrado',
  `justificacion` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `id_registro` int DEFAULT NULL COMMENT 'Empleado que capturó la salida',
  `fecha_registro` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_salida`),
  UNIQUE KEY `uq_folio_salida` (`folio_salida`),
  KEY `idx_salida_fecha` (`fecha`),
  KEY `idx_salida_solicitante` (`id_solicitante`),
  KEY `fk_sal_suc_origen` (`id_sucursal_origen`),
  KEY `fk_sal_responsable` (`id_responsable`),
  KEY `fk_sal_registro` (`id_registro`),
  KEY `idx_salida_destino_fecha` (`id_sucursal_destino`,`fecha`),
  CONSTRAINT `fk_sal_registro` FOREIGN KEY (`id_registro`) REFERENCES `empleado` (`id_empleado`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_sal_responsable` FOREIGN KEY (`id_responsable`) REFERENCES `empleado` (`id_empleado`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `fk_sal_solicitante` FOREIGN KEY (`id_solicitante`) REFERENCES `empleado` (`id_empleado`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `fk_sal_suc_destino` FOREIGN KEY (`id_sucursal_destino`) REFERENCES `sucursal` (`id_sucursal`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `fk_sal_suc_origen` FOREIGN KEY (`id_sucursal_origen`) REFERENCES `sucursal` (`id_sucursal`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `chk_sal_destino` CHECK (((`id_sucursal_destino` is null) or (`destino_texto` is null))),
  CONSTRAINT `chk_sal_responsable` CHECK (((`id_responsable` is null) or (`responsable_texto` is null))),
  CONSTRAINT `chk_sal_ruta` CHECK (((`id_sucursal_origen` is null) or (`id_sucursal_destino` is null) or (`id_sucursal_origen` <> `id_sucursal_destino`))),
  CONSTRAINT `chk_sal_solicitante` CHECK (((`id_solicitante` is null) or (`solicitante_texto` is null)))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Cabecera de las salidas internas (folio SAL-YYYYMM-NNNN)';

DROP TABLE IF EXISTS `solicitud`;
CREATE TABLE `solicitud` (
  `id_solicitud` int NOT NULL AUTO_INCREMENT,
  `folio_solicitud` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `fecha` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
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
  KEY `idx_solicitud_estatus_fecha` (`estatus`,`fecha`),
  KEY `fk_solicitud_sucursal_destino` (`id_sucursal_destino`),
  KEY `idx_solicitud_ruta` (`id_sucursal_origen`,`id_sucursal_destino`),
  KEY `fk_solicitud_observacion_por` (`observacion_por`),
  KEY `idx_solicitud_empleado_fecha` (`id_empleado`,`fecha`),
  CONSTRAINT `fk_sol_empleado` FOREIGN KEY (`id_empleado`) REFERENCES `empleado` (`id_empleado`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_solicitud_observacion_por` FOREIGN KEY (`observacion_por`) REFERENCES `empleado` (`id_empleado`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_solicitud_sucursal_destino` FOREIGN KEY (`id_sucursal_destino`) REFERENCES `sucursal` (`id_sucursal`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `fk_solicitud_sucursal_origen` FOREIGN KEY (`id_sucursal_origen`) REFERENCES `sucursal` (`id_sucursal`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `chk_sol_atencion` CHECK (((`estatus` = _utf8mb4'En proceso') = (`fecha_atencion` is null))),
  CONSTRAINT `chk_sol_ruta` CHECK (((`id_sucursal_origen` is null) or (`id_sucursal_destino` is null) or (`id_sucursal_origen` <> `id_sucursal_destino`)))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `solicitud_insumo`;
CREATE TABLE `solicitud_insumo` (
  `id_solicitud_insumo` int NOT NULL AUTO_INCREMENT,
  `id_solicitud` int NOT NULL,
  `id_insumo` int NOT NULL,
  `descripcion` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `cantidad` int NOT NULL DEFAULT '1',
  `cantidad_aprobada` int DEFAULT NULL,
  `aprobado` tinyint(1) GENERATED ALWAYS AS ((case when (`cantidad_aprobada` is null) then NULL when (`cantidad_aprobada` > 0) then 1 else 0 end)) VIRTUAL COMMENT 'Calculado: NULL sin decidir, 1 aceptado, 0 negado',
  PRIMARY KEY (`id_solicitud_insumo`),
  UNIQUE KEY `uq_si_solicitud_insumo` (`id_solicitud`,`id_insumo`),
  KEY `fk_si_insumo` (`id_insumo`),
  CONSTRAINT `fk_si_insumo` FOREIGN KEY (`id_insumo`) REFERENCES `insumo` (`id_insumo`) ON DELETE RESTRICT,
  CONSTRAINT `fk_si_solicitud` FOREIGN KEY (`id_solicitud`) REFERENCES `solicitud` (`id_solicitud`) ON DELETE CASCADE,
  CONSTRAINT `chk_si_aprobada` CHECK (((`cantidad_aprobada` is null) or ((`cantidad_aprobada` >= 0) and (`cantidad_aprobada` <= `cantidad`)))),
  CONSTRAINT `chk_si_cantidad` CHECK ((`cantidad` > 0))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `sucursal`;
CREATE TABLE `sucursal` (
  `id_sucursal` int NOT NULL AUTO_INCREMENT,
  `nombre_sucursal` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id_sucursal`),
  UNIQUE KEY `uq_nombre_sucursal` (`nombre_sucursal`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `ticket`;
CREATE TABLE `ticket` (
  `id_ticket` int NOT NULL AUTO_INCREMENT,
  `folio_ticket` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `titulo` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `descripcion` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `fecha_subido` datetime DEFAULT CURRENT_TIMESTAMP,
  `fecha_resuelto` datetime DEFAULT NULL,
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
  KEY `fk_ticket_tecnico` (`id_tecnico`),
  KEY `idx_ticket_estatus_fecha` (`estatus`,`fecha_subido`),
  KEY `idx_ticket_empleado_estatus` (`id_empleado`,`estatus`),
  KEY `idx_ticket_tecnico_estatus` (`id_tecnico`,`estatus`),
  KEY `idx_ticket_resuelto` (`fecha_resuelto`),
  KEY `idx_ticket_categoria_fecha` (`id_categoria`,`fecha_subido`),
  CONSTRAINT `fk_ticket_categoria` FOREIGN KEY (`id_categoria`) REFERENCES `categoria` (`id_categoria`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_ticket_empleado` FOREIGN KEY (`id_empleado`) REFERENCES `empleado` (`id_empleado`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_ticket_tecnico` FOREIGN KEY (`id_tecnico`) REFERENCES `empleado` (`id_empleado`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `chk_ticket_calif` CHECK (((`calificacion` is null) or (`calificacion` between 1 and 5))),
  CONSTRAINT `chk_ticket_calif_estatus` CHECK (((`calificacion` is null) or (`estatus` = _utf8mb4'Resuelto'))),
  CONSTRAINT `chk_ticket_cierre` CHECK (((`fecha_resuelto` is null) or (`fecha_resuelto` >= `fecha_subido`)))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `ticket_evidencia`;
CREATE TABLE `ticket_evidencia` (
  `id_evidencia` int NOT NULL AUTO_INCREMENT COMMENT 'PK',
  `id_ticket` int NOT NULL COMMENT 'FK ticket',
  `nombre_archivo` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Nombre dentro de storage/Evidencias_Tickets/<folio>/',
  `tipo_mime` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'image/jpeg, video/mp4…',
  `tamano_bytes` int unsigned DEFAULT NULL COMMENT 'Tamaño del archivo',
  `id_subio` int DEFAULT NULL COMMENT 'FK empleado: quién lo subió',
  `fecha_subida` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Cuándo se subió',
  PRIMARY KEY (`id_evidencia`),
  UNIQUE KEY `uq_evidencia_archivo` (`id_ticket`,`nombre_archivo`),
  KEY `idx_evidencia_subio` (`id_subio`),
  CONSTRAINT `fk_ev_subio` FOREIGN KEY (`id_subio`) REFERENCES `empleado` (`id_empleado`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_ev_ticket` FOREIGN KEY (`id_ticket`) REFERENCES `ticket` (`id_ticket`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Archivos adjuntos (evidencias) de cada ticket';

DROP TABLE IF EXISTS `ticket_historial`;
CREATE TABLE `ticket_historial` (
  `id_historial` int NOT NULL AUTO_INCREMENT,
  `id_ticket` int NOT NULL,
  `id_empleado` int NOT NULL,
  `campo_cambiado` varchar(60) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `valor_anterior` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `valor_nuevo` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `fecha` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_historial`),
  KEY `idx_th_ticket` (`id_ticket`),
  KEY `idx_th_fecha` (`fecha`),
  KEY `fk_th_empleado` (`id_empleado`),
  CONSTRAINT `fk_th_empleado` FOREIGN KEY (`id_empleado`) REFERENCES `empleado` (`id_empleado`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_th_ticket` FOREIGN KEY (`id_ticket`) REFERENCES `ticket` (`id_ticket`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP VIEW IF EXISTS `v_salida_interna`;
CREATE VIEW `v_salida_interna` AS select `s`.`id_salida` AS `id_salida`,`s`.`folio_salida` AS `folio_salida`,`s`.`fecha` AS `fecha`,`s`.`prioridad` AS `prioridad`,`s`.`id_sucursal_origen` AS `id_sucursal_origen`,`s`.`id_sucursal_destino` AS `id_sucursal_destino`,`s`.`destino_texto` AS `destino_texto`,`s`.`id_solicitante` AS `id_solicitante`,`s`.`solicitante_texto` AS `solicitante_texto`,`s`.`id_responsable` AS `id_responsable`,`s`.`responsable_texto` AS `responsable_texto`,`s`.`justificacion` AS `justificacion`,`s`.`id_registro` AS `id_registro`,`s`.`fecha_registro` AS `fecha_registro`,(if((`a`.`id_salida` is null),'Activa','Anulada') collate utf8mb4_unicode_ci) AS `estatus`,`a`.`motivo` AS `motivo_anulacion`,`a`.`fecha` AS `fecha_anulacion`,`a`.`id_anulo` AS `id_anulo` from (`salida_interna` `s` left join `salida_anulacion` `a` on((`a`.`id_salida` = `s`.`id_salida`)));

/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;

-- ── Disparadores ──
DROP TRIGGER IF EXISTS `trg_salida_sincroniza_kardex`;
DELIMITER //
CREATE TRIGGER `trg_salida_sincroniza_kardex` AFTER UPDATE ON `salida_interna` FOR EACH ROW BEGIN
  IF NOT (NEW.fecha <=> OLD.fecha)
     OR NOT (NEW.id_sucursal_origen <=> OLD.id_sucursal_origen)
     OR NOT (NEW.id_sucursal_destino <=> OLD.id_sucursal_destino) THEN
    UPDATE movimiento_inventario
       SET fecha = NEW.fecha,
           id_sucursal_origen = NEW.id_sucursal_origen,
           id_sucursal_destino = NEW.id_sucursal_destino
     WHERE id_salida = NEW.id_salida AND tipo = 'Salida';
  END IF;
END//
DELIMITER ;
