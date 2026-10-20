# Modelo y estructura de datos

Base de datos: `precision_helpdesk` en MySQL 8.0 (servidor verificado en 8.0.46), motor InnoDB, juego de caracteres utf8mb4, collacion `utf8mb4_unicode_ci` por defecto (`movimiento_inventario` y `ticket_historial` usan `utf8mb4_0900_ai_ci`). Zona horaria fijada por la aplicacion en `-06:00`.

Fuentes de este documento:

- Esquema vivo del servidor (information_schema, verificado el 12/10/2026): 13 tablas.
- `docs/MYSQL Database/database.utf8.sql`: volcado con datos reales del 01/10/2026, usado para los nombres exactos de claves foraneas e indices.
- `docs/MYSQL Database/schema_dump.txt`: mapa de esquema que se genera con `node "docs/MYSQL Database/dump_schema.mjs" > "docs/MYSQL Database/schema_dump.txt"`.

## Normalizacion a Tercera Forma Normal

El modelo esta en 3FN. Justificacion por formulario:

- Primera forma normal: no existen grupos repetitivos ni multivalores en una misma celda. Los insumos de una solicitud viven en `solicitud_insumo` (relacion M:N resuelta con tabla intermedia); cada manual es un registro con una sola ruta PDF.
- Segunda forma normal: no hay claves candidatas compuestas, por lo que no hay dependencias parciales. Los indices compuestos (`idx_ticket_estatus_fecha`, `idx_solicitud_ruta`, `idx_mi_insumo_fecha`) son exclusivamente de acceso, no forman llaves.
- Tercera forma normal: ningun atributo depende transitivamente de la clave primaria. Los nombres de rol, departamento, sucursal y categoria no se almacenan en las filas que los referencian: `empleado` guarda `id_rol`, `id_departamento` e `id_sucursal`; `ticket` e `insumo` guardan `id_categoria`. El catalogo unico (`uq_nombre_rol`, `uq_nombre_departamento`, `uq_nombre_sucursal`) impide duplicados de texto.
- Desviaciones controladas y justificadas:
  - `ticket.folio_ticket` y `solicitud.folio_solicitud` son folios secuenciales generados en la aplicacion (`<PREFIJO>-YYYYMMDD-NNNN`, prefijos PTP y SAL) con bloqueo `FOR UPDATE`; se almacenan con clave UNIQUE porque son el identificador visible en formatos impresos y notificaciones.
  - `movimiento_inventario.stock_anterior` y `stock_nuevo` son hechos inmutables de auditoria (kardex); no son dependientes transitivos porque cada fila es un evento historico, no un estado actual.
  - Los `ENUM` son dominios cerrados validados en la aplicacion (Zod) y reflejados en el esquema; `insumo` ademas tiene `CHECK (stock >= 0)`.
- Integridad referencial: RESTRICT hacia entidades maestras (`rol`, `departamento`, `categoria`, `insumo`), CASCADE donde el detalle no puede existir sin su cabecera (`solicitud_insumo -> solicitud`, `historial_acceso -> empleado`), SET NULL para referencias opcionales (`manual.subido_por`, sucursales de origen/destino en movimientos).

## DDL oficial

Script de creacion del esquema tal como opera en el servidor. Se omiten los valores de `AUTO_INCREMENT` (estado de datos, no de esquema) y las clausulas de charset por columna cuando coinciden con el charset de la tabla.

```sql
-- precision_helpdesk - DDL oficial (MySQL 8.0 / InnoDB / utf8mb4)
-- Extraido del esquema vivo del servidor el 12/10/2026.

CREATE SCHEMA IF NOT EXISTS `precision_helpdesk`
  DEFAULT CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
USE `precision_helpdesk`;

SET FOREIGN_KEY_CHECKS = 0;
SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "-06:00";

CREATE TABLE `rol` (
  `id_rol` int NOT NULL AUTO_INCREMENT,
  `nombre_rol` varchar(50) NOT NULL,
  PRIMARY KEY (`id_rol`),
  UNIQUE KEY `uq_nombre_rol` (`nombre_rol`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `departamento` (
  `id_departamento` int NOT NULL AUTO_INCREMENT,
  `nombre_departamento` varchar(100) NOT NULL,
  PRIMARY KEY (`id_departamento`),
  UNIQUE KEY `uq_nombre_departamento` (`nombre_departamento`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `sucursal` (
  `id_sucursal` int NOT NULL AUTO_INCREMENT,
  `nombre_sucursal` varchar(100) NOT NULL,
  PRIMARY KEY (`id_sucursal`),
  UNIQUE KEY `uq_nombre_sucursal` (`nombre_sucursal`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `categoria` (
  `id_categoria` int NOT NULL AUTO_INCREMENT,
  `nombre_categoria` varchar(100) NOT NULL,
  `en_tickets` tinyint(1) NOT NULL DEFAULT '0',
  `en_insumos` tinyint(1) NOT NULL DEFAULT '0',
  `en_manuales` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id_categoria`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `empleado` (
  `id_empleado` int NOT NULL AUTO_INCREMENT,
  `num_empleado` varchar(20) NULL,
  `nombre` varchar(50) NOT NULL,
  `ap_paterno` varchar(50) NOT NULL,
  `ap_materno` varchar(50) DEFAULT NULL,
  `email` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `estatus` enum('Activo','Inactivo') NOT NULL DEFAULT 'Activo',
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

CREATE TABLE `historial_acceso` (
  `id_acceso` int NOT NULL AUTO_INCREMENT,
  `id_empleado` int NOT NULL,
  `fecha_entrada` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `fecha_salida` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id_acceso`),
  KEY `fk_historial_empleado` (`id_empleado`),
  CONSTRAINT `fk_historial_empleado` FOREIGN KEY (`id_empleado`) REFERENCES `empleado` (`id_empleado`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `insumo` (
  `id_insumo` int NOT NULL AUTO_INCREMENT,
  `num_serie` varchar(100) DEFAULT NULL,
  `nombre` varchar(150) NOT NULL,
  `descripcion` text,
  `marca` varchar(100) DEFAULT NULL,
  `modelo` varchar(100) DEFAULT NULL,
  `stock` int NOT NULL DEFAULT '0',
  `estado` enum('Excelente','Bueno','Regular','Malo','Dañado') DEFAULT NULL,
  `id_categoria` int NOT NULL,
  `imagen_url` varchar(255) DEFAULT NULL,
  `activo` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id_insumo`),
  KEY `fk_insumo_categoria` (`id_categoria`),
  CONSTRAINT `fk_insumo_categoria` FOREIGN KEY (`id_categoria`) REFERENCES `categoria` (`id_categoria`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `chk_stock` CHECK ((`stock` >= 0))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `manual` (
  `id_manual` int unsigned NOT NULL AUTO_INCREMENT,
  `nombre` varchar(150) NOT NULL,
  `descripcion` text,
  `version` varchar(20) DEFAULT NULL,
  `subido_por` int DEFAULT NULL,
  `fecha_subida` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `fecha_cambio` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `ruta_pdf` varchar(255) NOT NULL,
  `id_categoria` int NOT NULL,
  PRIMARY KEY (`id_manual`),
  KEY `idx_manual_categoria` (`id_categoria`),
  KEY `fk_manual_empleado` (`subido_por`),
  CONSTRAINT `fk_manual_categoria` FOREIGN KEY (`id_categoria`) REFERENCES `categoria` (`id_categoria`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_manual_empleado` FOREIGN KEY (`subido_por`) REFERENCES `empleado` (`id_empleado`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `solicitud` (
  `id_solicitud` int NOT NULL AUTO_INCREMENT,
  `folio_solicitud` varchar(20) NOT NULL,
  `fecha` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `estatus` enum('En proceso','Aceptado','Rechazado','Pendiente','Resuelto','No Resuelto') NOT NULL DEFAULT 'En proceso',
  `prioridad` enum('Baja','Media','Alta','Urgente') NOT NULL DEFAULT 'Media',
  `id_empleado` int NOT NULL,
  `id_sucursal_origen` int DEFAULT NULL,
  `id_sucursal_destino` int DEFAULT NULL,
  `fecha_atencion` datetime DEFAULT NULL,
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `solicitud_insumo` (
  `id_solicitud_insumo` int NOT NULL AUTO_INCREMENT,
  `id_solicitud` int NOT NULL,
  `id_insumo` int NOT NULL,
  `descripcion` text,
  `cantidad` int NOT NULL DEFAULT '1',
  `cantidad_aprobada` int DEFAULT NULL,
  `aprobado` tinyint(1) DEFAULT NULL,
  `observaciones` text,
  `observaciones_por` int DEFAULT NULL,
  `observaciones_fecha` datetime DEFAULT NULL,
  PRIMARY KEY (`id_solicitud_insumo`),
  KEY `fk_si_solicitud` (`id_solicitud`),
  KEY `fk_si_insumo` (`id_insumo`),
  KEY `fk_solicitud_insumo_obs_por` (`observaciones_por`),
  CONSTRAINT `fk_si_insumo` FOREIGN KEY (`id_insumo`) REFERENCES `insumo` (`id_insumo`) ON DELETE RESTRICT,
  CONSTRAINT `fk_si_solicitud` FOREIGN KEY (`id_solicitud`) REFERENCES `solicitud` (`id_solicitud`) ON DELETE CASCADE,
  CONSTRAINT `fk_solicitud_insumo_obs_por` FOREIGN KEY (`observaciones_por`) REFERENCES `empleado` (`id_empleado`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `ticket` (
  `id_ticket` int NOT NULL AUTO_INCREMENT,
  `folio_ticket` varchar(20) NOT NULL,
  `titulo` varchar(150) NOT NULL,
  `descripcion` text NOT NULL,
  `fecha_subido` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `fecha_resuelto` timestamp NULL DEFAULT NULL,
  `estatus` enum('En proceso','Resuelto','No Resuelto','Cancelado') NOT NULL DEFAULT 'En proceso',
  `prioridad` enum('Baja','Media','Alta','Urgente') NOT NULL DEFAULT 'Media',
  `comentarios` text,
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

SET FOREIGN_KEY_CHECKS = 1;
```

## Diccionario de datos

Volumen aproximado al 12/10/2026 entre parentesis.

### empleado (99)

| Columna | Tipo | Restriccion | Descripcion |
| --- | --- | --- | --- |
| id_empleado | int | PK, autoincremental | Identificador del usuario |
| num_empleado | varchar(20) | NULL, UNIQUE (`uq_num_empleado`) | Numero de empleado corporativo |
| nombre / ap_paterno / ap_materno | varchar(50) | nombre y ap_paterno NOT NULL | Nombre completo |
| email | varchar(100) | NOT NULL, UNIQUE (`uq_email`) | Correo corporativo; unico y usado como usuario de login |
| password | varchar(255) | NOT NULL | Hash bcrypt (12 rounds); nunca en claro |
| estatus | enum('Activo','Inactivo') | NOT NULL, default 'Activo' | Solo los activos pueden iniciar sesion |
| id_rol | int | FK -> rol | 1 Administrador, 2 Usuario |
| id_departamento | int | FK -> departamento | Departamento corporativo; id 2 habilita permisos de Soporte Tecnico |
| id_sucursal | int | FK -> sucursal, nullable | Ubicacion operativa |
| token_version | int | NOT NULL, default 0 | Generacion vigente de JWT; sube en cada logout |

### ticket (0)

| Columna | Tipo | Restriccion | Descripcion |
| --- | --- | --- | --- |
| id_ticket | int | PK, autoincremental | |
| folio_ticket | varchar(20) | NOT NULL, UNIQUE (`uq_folio_ticket`) | Formato PTP-YYYYMMDD-NNNN, generado en la aplicacion |
| titulo | varchar(150) | NOT NULL | Asunto corto |
| descripcion | text | NOT NULL | Detalle del incidente |
| fecha_subido | timestamp | default CURRENT_TIMESTAMP | Creacion |
| fecha_resuelto | timestamp | nullable | Cierre efectivo |
| estatus | enum('En proceso','Resuelto','No Resuelto','Cancelado') | NOT NULL, default 'En proceso' | Ciclo de vida del ticket |
| prioridad | enum('Baja','Media','Alta','Urgente') | NOT NULL, default 'Media' | Priorizacion |
| comentarios | text | nullable | Observaciones del tecnico/administrador |
| id_empleado | int | FK -> empleado (dueno) | Solicitante |
| id_categoria | int | FK -> categoria | Clasificacion del incidente |
| id_tecnico | int | FK -> empleado, nullable | Tecnico asignado |
| calificacion | tinyint | nullable, 1-5 | Satisfaccion del dueno |

Indices de acceso: `idx_ticket_estatus_fecha (estatus, fecha_subido)`, `idx_ticket_empleado_estatus (id_empleado, estatus)`.

### solicitud (1)

| Columna | Tipo | Restriccion | Descripcion |
| --- | --- | --- | --- |
| id_solicitud | int | PK, autoincremental | |
| folio_solicitud | varchar(20) | NOT NULL, UNIQUE (`uq_folio`) | Formato SAL-YYYYMMDD-NNNN |
| fecha | timestamp | default CURRENT_TIMESTAMP | Creacion |
| estatus | enum('En proceso','Aceptado','Rechazado','Pendiente','Resuelto','No Resuelto') | default 'En proceso' | Flujo de aprobacion y surtido |
| prioridad | enum('Baja','Media','Alta','Urgente') | default 'Media' | |
| id_empleado | int | FK -> empleado | Solicitante |
| id_sucursal_origen | int | FK -> sucursal, nullable | Origen del material |
| id_sucursal_destino | int | FK -> sucursal, nullable | Destino del material |
| fecha_atencion | datetime | nullable | Momento en que se atiende |

La justificacion del pedido no vive aqui: se guarda por item en `solicitud_insumo.descripcion`.

### solicitud_insumo (2)

| Columna | Tipo | Restriccion | Descripcion |
| --- | --- | --- | --- |
| id_solicitud_insumo | int | PK, autoincremental | |
| id_solicitud | int | FK -> solicitud, CASCADE | Cabecera |
| id_insumo | int | FK -> insumo, RESTRICT | Articulo pedido |
| descripcion | text | nullable | Justificacion del item (o justificacion general de la solicitud) |
| cantidad | int | NOT NULL, default 1 | Cantidad pedida |
| cantidad_aprobada | int | nullable | Cantidad aceptada por administracion |
| aprobado | tinyint(1) | nullable | 1 aprobado, 0 rechazado, NULL sin resolver |
| observaciones | text | nullable | Nota de Soporte Tecnico/Administracion sobre el item |
| observaciones_por | int | FK -> empleado, SET NULL | Quien escribio la observacion |
| observaciones_fecha | datetime | nullable | Cuando se escribio |

### insumo (70)

| Columna | Tipo | Restriccion | Descripcion |
| --- | --- | --- | --- |
| id_insumo | int | PK, autoincremental | |
| num_serie | varchar(100) | nullable | Numero de serie del activo |
| nombre | varchar(150) | NOT NULL | Denominacion del insumo/activo |
| descripcion | text | nullable | Detalle |
| marca / modelo | varchar(100) | nullable | Atributos del activo |
| stock | int | NOT NULL, default 0, CHECK `chk_stock` (>= 0) | Unidades disponibles |
| estado | enum('Excelente','Bueno','Regular','Malo','Dañado') | nullable | Estado fisico |
| id_categoria | int | FK -> categoria | Clasificacion ITAM |
| imagen_url | varchar(255) | nullable | Ruta en /storage |
| activo | tinyint(1) | NOT NULL, default 1 | 0 inhabilita el insumo para pedidos y salidas |

### categoria (16)

| Columna | Tipo | Restriccion | Descripcion |
| --- | --- | --- | --- |
| id_categoria | int | PK, autoincremental | |
| nombre_categoria | varchar(100) | NOT NULL | Nombre compartido por tickets, insumos y manuales |
| en_tickets / en_insumos / en_manuales | tinyint(1) | NOT NULL, default 0 | Bandera que define en que modulo aparece la categoria |

### departamento (53) | rol (2) | sucursal (16)

Catalogos de una sola columna de texto, todos con nombre UNIQUE (`uq_nombre_departamento`, `uq_nombre_rol`, `uq_nombre_sucursal`). Valores fijos relevantes: `rol` 1 Administrador y 2 Usuario; `departamento` 1 Tecnologias de la Informacion y 2 Soporte Tecnico; `sucursal` agrupa CEDIS y sucursales de las 16 ubicaciones operativas.

### manual (5)

| Columna | Tipo | Restriccion | Descripcion |
| --- | --- | --- | --- |
| id_manual | int unsigned | PK, autoincremental | |
| nombre | varchar(150) | NOT NULL | Titulo del manual |
| descripcion | text | nullable | Resumen |
| version | varchar(20) | nullable | Version del documento |
| subido_por | int | FK -> empleado, SET NULL | Autor de la carga |
| fecha_subida / fecha_cambio | timestamp | defaults CURRENT_TIMESTAMP | Alta y ultima modificacion (fecha_cambio se actualiza sola) |
| ruta_pdf | varchar(255) | NOT NULL | Ruta relativa /storage/Manuales/... |
| id_categoria | int | FK -> categoria | Clasificacion |

### movimiento_inventario (9) - kardex

| Columna | Tipo | Restriccion | Descripcion |
| --- | --- | --- | --- |
| id_movimiento | int | PK, autoincremental | |
| id_insumo | int | FK -> insumo, CASCADE | Articulo afectado |
| tipo | enum('Entrada','Salida','Ajuste') | NOT NULL | Tipo de movimiento |
| cantidad | int | NOT NULL | Unidades |
| stock_anterior / stock_nuevo | int | NOT NULL, default 0 | Fotografia del stock antes y despues |
| id_sucursal_origen / id_sucursal_destino | int | FK -> sucursal, SET NULL | Ruta del material |
| id_solicitud | int | FK -> solicitud, SET NULL | Solicitud que origino la salida |
| id_empleado | int | FK -> empleado, SET NULL | Quien realizo el movimiento |
| motivo | varchar(500) | nullable | Observacion |
| fecha | datetime | default CURRENT_TIMESTAMP | Momento del movimiento |

### historial_acceso (3) - auditoria de sesiones

| Columna | Tipo | Restriccion | Descripcion |
| --- | --- | --- | --- |
| id_acceso | int | PK, autoincremental | Se entrega al frontend en el login y se usa en el logout |
| id_empleado | int | FK -> empleado, CASCADE | Usuario |
| fecha_entrada | timestamp | default CURRENT_TIMESTAMP | Inicio de sesion (login o callback Zoho) |
| fecha_salida | timestamp | nullable | Cierre de sesion; NULL = sesion abierta |

### ticket_historial (0) - auditoria de cambios de ticket

| Columna | Tipo | Restriccion | Descripcion |
| --- | --- | --- | --- |
| id_historial | int unsigned | PK, autoincremental | |
| id_ticket | int unsigned | IDX (`idx_th_ticket`) | Ticket afectado (sin FK declarada en el servidor) |
| id_empleado | int unsigned | | Actor del cambio |
| campo_cambiado | varchar(60) | NOT NULL | Nombre del campo alterado |
| valor_anterior / valor_nuevo | text | nullable | Antes y despues |
| fecha | datetime | default CURRENT_TIMESTAMP, IDX | Momento del cambio |

## Divergencias conocidas entre codigo y esquema vivo

- `empleado.foto`: la columna fue eliminada del servidor el 12/10/2026 (respaldo previo en `backups/foto_removed_20261012_094005/`). El codigo aun contiene sentencias UPDATE con `foto = COALESCE(?, foto)` en `Models/Empleado.js` (`updateAdmin`) y el endpoint `POST /api/auth/perfil/:id/foto`, que fallarian con error 1054 contra el esquema actual. El login ya no selecciona la columna y funciona con `foto = null`.
- Tabla `_migraciones`: existe en `docs/MYSQL Database/database.utf8.sql` (23 registros) pero no en el servidor vivo; el registro de migraciones no esta en uso.
- `insumo.activo`, `solicitud_insumo.observaciones*` y el valor 'Dañado' del enum de estado fueron agregados despues del volcado del 01/10/2026; este documento refleja el estado vivo posterior.
- El prefijo de folio de solicitudes es `SAL` en el codigo (`Models/Solicitud.js`); el docstring de `utils/helpers.js` menciona `SOL` como ejemplo.


## DBML para dbdiagram.io

```dbml
// precision_helpdesk - esquema DBML
// Derivado del esquema vivo (MySQL 8.0.46, 12/10/2026). Pegar en dbdiagram.io.

Enum estatus_empleado {
  'Activo'
  'Inactivo'
}

Enum estatus_ticket {
  'En proceso'
  'Resuelto'
  'No Resuelto'
  'Cancelado'
}

Enum estatus_solicitud {
  'En proceso'
  'Aceptado'
  'Rechazado'
  'Pendiente'
  'Resuelto'
  'No Resuelto'
}

Enum prioridad {
  'Baja'
  'Media'
  'Alta'
  'Urgente'
}

Enum estado_insumo {
  'Excelente'
  'Bueno'
  'Regular'
  'Malo'
  'Dañado'
}

Enum tipo_movimiento {
  'Entrada'
  'Salida'
  'Ajuste'
}

Table rol {
  id_rol int [pk, increment]
  nombre_rol varchar(50) [not null, unique]
}

Table departamento {
  id_departamento int [pk, increment]
  nombre_departamento varchar(100) [not null, unique]
}

Table sucursal {
  id_sucursal int [pk, increment]
  nombre_sucursal varchar(100) [not null, unique]
}

Table categoria {
  id_categoria int [pk, increment]
  nombre_categoria varchar(100) [not null]
  en_tickets tinyint(1) [not null, default: 0, note: 'Usada en tickets']
  en_insumos tinyint(1) [not null, default: 0, note: 'Usada en insumos']
  en_manuales tinyint(1) [not null, default: 0, note: 'Usada en manuales']
}

Table empleado {
  id_empleado int [pk, increment]
  num_empleado varchar(20) [null, unique]
  nombre varchar(50) [not null]
  ap_paterno varchar(50) [not null]
  ap_materno varchar(50)
  email varchar(100) [not null, unique]
  password varchar(255) [not null, note: 'Hash bcrypt 12 rounds']
  estatus estatus_empleado [not null, default: 'Activo']
  id_rol int [not null]
  id_departamento int [not null]
  id_sucursal int
  token_version int [not null, default: 0, note: 'Generacion vigente de JWT']
}

Table historial_acceso {
  id_acceso int [pk, increment]
  id_empleado int [not null]
  fecha_entrada timestamp [default: `CURRENT_TIMESTAMP`]
  fecha_salida timestamp
}

Table insumo {
  id_insumo int [pk, increment]
  num_serie varchar(100)
  nombre varchar(150) [not null]
  descripcion text
  marca varchar(100)
  modelo varchar(100)
  stock int [not null, default: 0, note: 'CHECK chk_stock: stock >= 0']
  estado estado_insumo
  id_categoria int [not null]
  imagen_url varchar(255)
  activo tinyint(1) [not null, default: 1, note: '0 = inhabilitado']
}

Table manual {
  id_manual int [pk, increment, note: 'int unsigned']
  nombre varchar(150) [not null]
  descripcion text
  version varchar(20)
  subido_por int
  fecha_subida timestamp [default: `CURRENT_TIMESTAMP`]
  fecha_cambio timestamp [default: `CURRENT_TIMESTAMP`]
  ruta_pdf varchar(255) [not null]
  id_categoria int [not null]
}

Table movimiento_inventario {
  id_movimiento int [pk, increment]
  id_insumo int [not null]
  tipo tipo_movimiento [not null]
  cantidad int [not null]
  stock_anterior int [not null, default: 0]
  stock_nuevo int [not null, default: 0]
  id_sucursal_origen int
  id_sucursal_destino int
  id_solicitud int
  id_empleado int
  motivo varchar(500)
  fecha datetime [not null, default: `CURRENT_TIMESTAMP`]

  indexes {
    (id_insumo, fecha) [name: 'idx_mi_insumo_fecha']
    (tipo, fecha) [name: 'idx_mi_tipo_fecha']
  }
}

Table solicitud {
  id_solicitud int [pk, increment]
  folio_solicitud varchar(20) [not null, unique, note: 'Formato SAL-YYYYMMDD-NNNN']
  fecha timestamp [not null, default: `CURRENT_TIMESTAMP`]
  estatus estatus_solicitud [not null, default: 'En proceso']
  prioridad prioridad [not null, default: 'Media']
  id_empleado int [not null]
  id_sucursal_origen int
  id_sucursal_destino int
  fecha_atencion datetime

  indexes {
    (estatus, fecha) [name: 'idx_solicitud_estatus_fecha']
    (id_sucursal_origen, id_sucursal_destino) [name: 'idx_solicitud_ruta']
  }
}

Table solicitud_insumo {
  id_solicitud_insumo int [pk, increment]
  id_solicitud int [not null]
  id_insumo int [not null]
  descripcion text [note: 'Justificacion del item']
  cantidad int [not null, default: 1]
  cantidad_aprobada int
  aprobado tinyint(1)
  observaciones text
  observaciones_por int
  observaciones_fecha datetime
}

Table ticket {
  id_ticket int [pk, increment]
  folio_ticket varchar(20) [not null, unique, note: 'Formato PTP-YYYYMMDD-NNNN']
  titulo varchar(150) [not null]
  descripcion text [not null]
  fecha_subido timestamp [default: `CURRENT_TIMESTAMP`]
  fecha_resuelto timestamp
  estatus estatus_ticket [not null, default: 'En proceso']
  prioridad prioridad [not null, default: 'Media']
  comentarios text
  id_empleado int [not null]
  id_categoria int [not null]
  id_tecnico int
  calificacion tinyint [note: 'Escala 1-5']

  indexes {
    (estatus, fecha_subido) [name: 'idx_ticket_estatus_fecha']
    (id_empleado, estatus) [name: 'idx_ticket_empleado_estatus']
  }
}

Table ticket_historial {
  id_historial int [pk, increment, note: 'int unsigned']
  id_ticket int [not null, note: 'int unsigned']
  id_empleado int [not null, note: 'int unsigned']
  campo_cambiado varchar(60) [not null]
  valor_anterior text
  valor_nuevo text
  fecha datetime [not null, default: `CURRENT_TIMESTAMP`]

  indexes {
    (id_ticket) [name: 'idx_th_ticket']
    (fecha) [name: 'idx_th_fecha']
  }
}

// -- Claves foraneas (nombres identicos al servidor) --

Ref fk_empleado_rol        { empleado.id_rol > rol.id_rol }
Ref fk_empleado_depto      { empleado.id_departamento > departamento.id_departamento }
Ref fk_empleado_sucursal   { empleado.id_sucursal > sucursal.id_sucursal }
Ref fk_historial_empleado  { historial_acceso.id_empleado > empleado.id_empleado [delete: cascade] }
Ref fk_insumo_categoria    { insumo.id_categoria > categoria.id_categoria }
Ref fk_manual_categoria    { manual.id_categoria > categoria.id_categoria }
Ref fk_manual_empleado     { manual.subido_por > empleado.id_empleado [delete: set null] }
Ref fk_mi_insumo           { movimiento_inventario.id_insumo > insumo.id_insumo [delete: cascade] }
Ref fk_mi_suc_origen       { movimiento_inventario.id_sucursal_origen > sucursal.id_sucursal [delete: set null] }
Ref fk_mi_suc_dest         { movimiento_inventario.id_sucursal_destino > sucursal.id_sucursal [delete: set null] }
Ref fk_mi_solicitud        { movimiento_inventario.id_solicitud > solicitud.id_solicitud [delete: set null] }
Ref fk_mi_empleado         { movimiento_inventario.id_empleado > empleado.id_empleado [delete: set null] }
Ref fk_sol_empleado        { solicitud.id_empleado > empleado.id_empleado }
Ref fk_solicitud_sucursal_origen  { solicitud.id_sucursal_origen > sucursal.id_sucursal [delete: set null] }
Ref fk_solicitud_sucursal_destino { solicitud.id_sucursal_destino > sucursal.id_sucursal [delete: set null] }
Ref fk_si_solicitud        { solicitud_insumo.id_solicitud > solicitud.id_solicitud [delete: cascade] }
Ref fk_si_insumo           { solicitud_insumo.id_insumo > insumo.id_insumo }
Ref fk_solicitud_insumo_obs_por { solicitud_insumo.observaciones_por > empleado.id_empleado [delete: set null] }
Ref fk_ticket_empleado     { ticket.id_empleado > empleado.id_empleado }
Ref fk_ticket_categoria    { ticket.id_categoria > categoria.id_categoria }
Ref fk_ticket_tecnico      { ticket.id_tecnico > empleado.id_empleado }
```
