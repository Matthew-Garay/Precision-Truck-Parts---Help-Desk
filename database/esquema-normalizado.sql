-- =============================================================================
-- esquema-normalizado.sql — Esquema PROPUESTO (normalizado y auditado)
-- Mesa de ayuda de Soporte Técnico · Precision Truck Parts
--
-- Motor: MySQL 8.0 (InnoDB, utf8mb4_unicode_ci). Notas para PostgreSQL al final.
--
-- ESTE ARCHIVO NO SE APLICA A LA BASE EN PRODUCCIÓN. Es el diseño destino que
-- documenta docs/normalizacion-bd.md. El paso de la base actual a este esquema
-- se hace por fases con migraciones (ver la sección "Plan de migración" del
-- documento). Se puede cargar en una base VACÍA para revisarlo:
--     CREATE DATABASE precision_norm_revision; USE precision_norm_revision;
--     SOURCE database/esquema-normalizado.sql;
--
-- Convenciones:
--   - PK sustituta INT UNSIGNED AUTO_INCREMENT en todas las tablas de entidad;
--     las claves naturales (folio, email, num_empleado…) llevan UNIQUE.
--   - Fechas con hora: DATETIME (la zona horaria la fija la conexión, -06:00).
--   - Texto opcional vacío = NULL (nunca 'N/A').
--   - FK: RESTRICT cuando borrar el padre perdería historia; CASCADE solo en
--     detalle que no tiene sentido sin su cabecera; SET NULL en "quién lo hizo".
--   - Las FK cuyas columnas participan en un CHECK usan ON UPDATE/DELETE RESTRICT:
--     MySQL no permite CHECK sobre columnas con acción referencial. No se pierde
--     nada: las PK sustitutas nunca cambian y los empleados no se borran (baja lógica).
-- =============================================================================

SET NAMES utf8mb4;

-- -----------------------------------------------------------------------------
-- 1. CATÁLOGOS
-- -----------------------------------------------------------------------------

CREATE TABLE rol (
  id_rol      INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'PK',
  nombre_rol  VARCHAR(50)  NOT NULL                COMMENT 'Administrador, Usuario…',
  PRIMARY KEY (id_rol),
  UNIQUE KEY uq_rol_nombre (nombre_rol)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Roles de acceso al sistema';

CREATE TABLE departamento (
  id_departamento      INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'PK',
  nombre_departamento  VARCHAR(100) NOT NULL                COMMENT 'Área de la empresa',
  PRIMARY KEY (id_departamento),
  UNIQUE KEY uq_departamento_nombre (nombre_departamento)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Departamentos (áreas) de la empresa';

CREATE TABLE sucursal (
  id_sucursal      INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'PK',
  nombre_sucursal  VARCHAR(100) NOT NULL                COMMENT 'Nombre de la sucursal o CEDIS',
  PRIMARY KEY (id_sucursal),
  UNIQUE KEY uq_sucursal_nombre (nombre_sucursal)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Sucursales: origen/destino de material y sede de los empleados';

CREATE TABLE categoria (
  id_categoria      INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'PK',
  nombre_categoria  VARCHAR(100) NOT NULL                COMMENT 'Nombre visible de la categoría',
  PRIMARY KEY (id_categoria),
  UNIQUE KEY uq_categoria_nombre (nombre_categoria)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Categorías compartidas por tickets, insumos y manuales';

-- 4FN / 1FN: antes, en_tickets / en_insumos / en_manuales eran columnas
-- repetidas (un hecho multivaluado guardado en columnas). Ahora cada ámbito en
-- que se usa la categoría es un renglón.
CREATE TABLE categoria_ambito (
  id_categoria  INT UNSIGNED NOT NULL                         COMMENT 'FK categoria',
  ambito        ENUM('ticket','insumo','manual') NOT NULL     COMMENT 'Módulo donde la categoría está disponible',
  PRIMARY KEY (id_categoria, ambito),
  KEY idx_ca_ambito (ambito),
  CONSTRAINT fk_ca_categoria FOREIGN KEY (id_categoria) REFERENCES categoria (id_categoria)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='En qué módulos se ofrece cada categoría (N:M categoría–ámbito)';

-- -----------------------------------------------------------------------------
-- 2. PERSONAS Y ACCESO
-- -----------------------------------------------------------------------------

CREATE TABLE empleado (
  id_empleado        INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'PK',
  num_empleado       VARCHAR(20)  NULL                    COMMENT 'Número de nómina (clave natural, opcional)',
  nombre             VARCHAR(50)  NOT NULL                COMMENT 'Nombre(s)',
  ap_paterno         VARCHAR(50)  NOT NULL                COMMENT 'Apellido paterno',
  ap_materno         VARCHAR(50)  NULL                    COMMENT 'Apellido materno',
  email              VARCHAR(100) NOT NULL                COMMENT 'Correo corporativo; usuario de inicio de sesión',
  password           VARCHAR(255) NOT NULL                COMMENT 'Hash bcrypt (nunca texto plano)',
  estatus            ENUM('Activo','Inactivo') NOT NULL DEFAULT 'Activo' COMMENT 'Inactivo = no puede iniciar sesión',
  id_rol             INT UNSIGNED NOT NULL                COMMENT 'FK rol',
  id_departamento    INT UNSIGNED NOT NULL                COMMENT 'FK departamento',
  id_sucursal        INT UNSIGNED NULL                    COMMENT 'FK sucursal (sede)',
  token_version      INT UNSIGNED NOT NULL DEFAULT 0      COMMENT 'Se incrementa para invalidar sesiones abiertas',
  eliminado          TINYINT(1)   NOT NULL DEFAULT 0      COMMENT 'Baja lógica: 1 = no aparece en listas',
  fecha_eliminacion  DATETIME     NULL                    COMMENT 'Cuándo se dio de baja lógica',
  id_elimino         INT UNSIGNED NULL                    COMMENT 'FK empleado: quién lo dio de baja',
  PRIMARY KEY (id_empleado),
  UNIQUE KEY uq_empleado_email (email),
  UNIQUE KEY uq_empleado_num (num_empleado),
  KEY idx_empleado_rol (id_rol),
  KEY idx_empleado_depto (id_departamento),
  KEY idx_empleado_sucursal (id_sucursal),
  KEY idx_empleado_eliminado (eliminado, estatus),
  CONSTRAINT fk_emp_rol      FOREIGN KEY (id_rol)          REFERENCES rol (id_rol)                   ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_emp_depto    FOREIGN KEY (id_departamento) REFERENCES departamento (id_departamento) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_emp_sucursal FOREIGN KEY (id_sucursal)     REFERENCES sucursal (id_sucursal)         ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_emp_elimino  FOREIGN KEY (id_elimino)      REFERENCES empleado (id_empleado)         ON DELETE SET NULL ON UPDATE CASCADE,
  -- Los datos de la baja existen si y solo si el empleado está dado de baja.
  CONSTRAINT chk_emp_baja CHECK ((eliminado = 0 AND fecha_eliminacion IS NULL) OR (eliminado = 1 AND fecha_eliminacion IS NOT NULL))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Empleados que usan el sistema (nunca se borran: baja lógica)';

CREATE TABLE historial_acceso (
  id_acceso      INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'PK',
  id_empleado    INT UNSIGNED NOT NULL                COMMENT 'FK empleado',
  fecha_entrada  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Inicio de sesión',
  fecha_salida   DATETIME     NULL                    COMMENT 'Cierre de sesión (NULL = abierta)',
  PRIMARY KEY (id_acceso),
  -- Un solo índice: (id_empleado, fecha_entrada) ya sirve para la FK.
  KEY idx_acceso_empleado_fecha (id_empleado, fecha_entrada),
  CONSTRAINT fk_acceso_empleado FOREIGN KEY (id_empleado) REFERENCES empleado (id_empleado)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT chk_acceso_fechas CHECK (fecha_salida IS NULL OR fecha_salida >= fecha_entrada)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Bitácora de inicios y cierres de sesión';

-- -----------------------------------------------------------------------------
-- 3. MESA DE AYUDA (TICKETS)
-- -----------------------------------------------------------------------------

CREATE TABLE ticket (
  id_ticket       INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'PK',
  folio_ticket    VARCHAR(20)  NOT NULL                COMMENT 'Folio ST-AAAAMM-NNNN (clave natural)',
  titulo          VARCHAR(150) NOT NULL                COMMENT 'Resumen del problema',
  descripcion     TEXT         NOT NULL                COMMENT 'Descripción del usuario',
  prioridad       ENUM('Baja','Media','Alta','Urgente') NOT NULL DEFAULT 'Media' COMMENT 'Prioridad elegida',
  estatus         ENUM('En proceso','Resuelto','No Resuelto','Cancelado') NOT NULL DEFAULT 'En proceso' COMMENT 'Estado del ticket',
  id_empleado     INT UNSIGNED NOT NULL                COMMENT 'FK empleado: quien levanta el ticket',
  id_categoria    INT UNSIGNED NOT NULL                COMMENT 'FK categoria (ámbito ticket)',
  id_tecnico      INT UNSIGNED NULL                    COMMENT 'FK empleado: técnico asignado',
  comentarios     TEXT         NULL                    COMMENT 'Comentario de cierre del técnico',
  calificacion    TINYINT UNSIGNED NULL                COMMENT '1 a 5, la pone el dueño al cerrar',
  fecha_subido    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Alta del ticket',
  fecha_resuelto  DATETIME     NULL                    COMMENT 'Cierre (Resuelto / No Resuelto)',
  PRIMARY KEY (id_ticket),
  UNIQUE KEY uq_ticket_folio (folio_ticket),
  KEY idx_ticket_estatus_fecha (estatus, fecha_subido),
  KEY idx_ticket_empleado_estatus (id_empleado, estatus),
  KEY idx_ticket_tecnico_estatus (id_tecnico, estatus),
  KEY idx_ticket_categoria_fecha (id_categoria, fecha_subido),   -- indicadores por categoría
  KEY idx_ticket_resuelto (fecha_resuelto),                      -- tiempos y meta por mes
  CONSTRAINT fk_ticket_empleado  FOREIGN KEY (id_empleado)  REFERENCES empleado (id_empleado)   ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_ticket_tecnico   FOREIGN KEY (id_tecnico)   REFERENCES empleado (id_empleado)   ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_ticket_categoria FOREIGN KEY (id_categoria) REFERENCES categoria (id_categoria) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT chk_ticket_calif   CHECK (calificacion IS NULL OR calificacion BETWEEN 1 AND 5),
  CONSTRAINT chk_ticket_cierre  CHECK (fecha_resuelto IS NULL OR fecha_resuelto >= fecha_subido),
  -- Solo un ticket Resuelto se califica.
  CONSTRAINT chk_ticket_calif_estatus CHECK (calificacion IS NULL OR estatus = 'Resuelto')
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Reportes de la mesa de ayuda';

-- 1FN: las evidencias de un ticket hoy viven solo como archivos en disco
-- (storage/evidencias/<folio>/…); la base no sabe cuántas hay ni quién las subió.
CREATE TABLE ticket_evidencia (
  id_evidencia   INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'PK',
  id_ticket      INT UNSIGNED NOT NULL                COMMENT 'FK ticket',
  nombre_archivo VARCHAR(255) NOT NULL                COMMENT 'Nombre del archivo dentro de la carpeta del ticket',
  tipo_mime      VARCHAR(100) NOT NULL                COMMENT 'image/png, video/mp4, application/pdf…',
  tamano_bytes   INT UNSIGNED NOT NULL                COMMENT 'Tamaño del archivo',
  id_subio       INT UNSIGNED NULL                    COMMENT 'FK empleado: quién lo subió',
  fecha_subida   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Cuándo se subió',
  PRIMARY KEY (id_evidencia),
  UNIQUE KEY uq_evidencia_archivo (id_ticket, nombre_archivo),
  KEY idx_evidencia_subio (id_subio),
  CONSTRAINT fk_ev_ticket FOREIGN KEY (id_ticket) REFERENCES ticket (id_ticket)     ON DELETE CASCADE  ON UPDATE CASCADE,
  CONSTRAINT fk_ev_subio  FOREIGN KEY (id_subio)  REFERENCES empleado (id_empleado) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Archivos adjuntos (evidencias) de cada ticket';

CREATE TABLE ticket_historial (
  id_historial    INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'PK',
  id_ticket       INT UNSIGNED NOT NULL                COMMENT 'FK ticket',
  id_empleado     INT UNSIGNED NOT NULL                COMMENT 'FK empleado: quién hizo el cambio',
  campo_cambiado  VARCHAR(60)  NOT NULL                COMMENT 'estatus, prioridad, técnico…',
  valor_anterior  TEXT         NULL                    COMMENT 'Valor antes del cambio (texto de auditoría)',
  valor_nuevo     TEXT         NULL                    COMMENT 'Valor después del cambio',
  fecha           DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Cuándo',
  PRIMARY KEY (id_historial),
  KEY idx_th_ticket_fecha (id_ticket, fecha),
  KEY idx_th_empleado (id_empleado),
  CONSTRAINT fk_th_ticket   FOREIGN KEY (id_ticket)   REFERENCES ticket (id_ticket)     ON DELETE CASCADE  ON UPDATE CASCADE,
  CONSTRAINT fk_th_empleado FOREIGN KEY (id_empleado) REFERENCES empleado (id_empleado) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Auditoría de cambios a tickets';

-- -----------------------------------------------------------------------------
-- 4. MANUALES
-- -----------------------------------------------------------------------------

CREATE TABLE manual (
  id_manual     INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'PK',
  nombre        VARCHAR(150) NOT NULL                COMMENT 'Título del manual',
  descripcion   TEXT         NULL                    COMMENT 'Para qué sirve',
  version       VARCHAR(20)  NULL                    COMMENT 'Versión del documento',
  ruta_pdf      VARCHAR(255) NOT NULL                COMMENT 'Ruta del PDF dentro de storage/',
  id_categoria  INT UNSIGNED NOT NULL                COMMENT 'FK categoria (ámbito manual)',
  subido_por    INT UNSIGNED NULL                    COMMENT 'FK empleado',
  fecha_subida  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Alta',
  fecha_cambio  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Última modificación',
  PRIMARY KEY (id_manual),
  KEY idx_manual_categoria (id_categoria),
  KEY idx_manual_subido_por (subido_por),
  CONSTRAINT fk_manual_categoria FOREIGN KEY (id_categoria) REFERENCES categoria (id_categoria) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_manual_empleado  FOREIGN KEY (subido_por)   REFERENCES empleado (id_empleado)   ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Manuales técnicos en PDF';

-- -----------------------------------------------------------------------------
-- 5. INVENTARIO DE INSUMOS
-- -----------------------------------------------------------------------------

CREATE TABLE insumo (
  id_insumo        INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'PK',
  nombre           VARCHAR(150) NOT NULL                COMMENT 'Nombre del insumo (tipo de artículo)',
  descripcion      TEXT         NULL                    COMMENT 'Detalle libre',
  marca            VARCHAR(100) NULL                    COMMENT 'Marca (NULL si no aplica; nunca N/A)',
  modelo           VARCHAR(100) NULL                    COMMENT 'Modelo (NULL si no aplica)',
  etiqueta         VARCHAR(50)  NULL                    COMMENT 'Etiqueta física del insumo (código o texto impreso)',
  id_categoria     INT UNSIGNED NOT NULL                COMMENT 'FK categoria (ámbito insumo)',
  imagen_url       VARCHAR(255) NULL                    COMMENT 'Foto del insumo',
  stock            INT UNSIGNED NOT NULL DEFAULT 0      COMMENT 'Existencia actual (redundancia controlada: = stock_nuevo del último movimiento)',
  estado           ENUM('Excelente','Bueno','Regular','Malo','Dañado') NULL COMMENT 'Condición general (insumos sin número de serie)',
  activo           TINYINT(1)   NOT NULL DEFAULT 1      COMMENT '0 = inhabilitado: no se puede pedir ni sacar',
  visible_publico  TINYINT(1)   NOT NULL DEFAULT 1      COMMENT '0 = oculto en el catálogo de los usuarios',
  created_at       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Alta',
  updated_at       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Última modificación',
  PRIMARY KEY (id_insumo),
  KEY idx_insumo_categoria (id_categoria),
  KEY idx_insumo_catalogo (activo, visible_publico, stock),
  KEY idx_insumo_etiqueta (etiqueta),
  CONSTRAINT fk_insumo_categoria FOREIGN KEY (id_categoria) REFERENCES categoria (id_categoria)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Catálogo de insumos (un renglón por TIPO de artículo)';

-- 1FN/2FN: el número de serie (y su estado) es de cada PIEZA, no del tipo de
-- artículo. Hoy 14 insumos tienen stock > 1 y un solo num_serie: las demás
-- piezas no tienen dónde registrar el suyo. Tabla opcional, solo para equipos
-- con serie (laptops, impresoras, lectores…).
CREATE TABLE insumo_unidad (
  id_unidad    INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'PK',
  id_insumo    INT UNSIGNED NOT NULL                COMMENT 'FK insumo (tipo de artículo)',
  num_serie    VARCHAR(100) NOT NULL                COMMENT 'Número de serie de esta pieza',
  estado       ENUM('Excelente','Bueno','Regular','Malo','Dañado') NOT NULL DEFAULT 'Bueno' COMMENT 'Condición de esta pieza',
  en_almacen   TINYINT(1)   NOT NULL DEFAULT 1      COMMENT '1 = en inventario, 0 = ya salió',
  id_salida    INT UNSIGNED NULL                    COMMENT 'FK salida_interna con la que salió (si salió)',
  PRIMARY KEY (id_unidad),
  UNIQUE KEY uq_unidad_serie (id_insumo, num_serie),
  KEY idx_unidad_salida (id_salida),
  CONSTRAINT fk_unidad_insumo FOREIGN KEY (id_insumo) REFERENCES insumo (id_insumo) ON DELETE RESTRICT ON UPDATE CASCADE
  -- fk_unidad_salida se agrega después de crear salida_interna (ver abajo).
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Piezas individuales con número de serie';

CREATE TABLE solicitud (
  id_solicitud         INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'PK',
  folio_solicitud      VARCHAR(20)  NOT NULL                COMMENT 'Folio de la solicitud (clave natural)',
  fecha                DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Cuándo se pidió',
  prioridad            ENUM('Baja','Media','Alta','Urgente') NOT NULL DEFAULT 'Media' COMMENT 'Prioridad',
  estatus              ENUM('En proceso','Aceptado','Rechazado') NOT NULL DEFAULT 'En proceso' COMMENT 'Estado',
  id_empleado          INT UNSIGNED NOT NULL                COMMENT 'FK empleado: quien pide',
  id_sucursal_origen   INT UNSIGNED NULL                    COMMENT 'FK sucursal de donde sale el material',
  id_sucursal_destino  INT UNSIGNED NULL                    COMMENT 'FK sucursal a donde llega',
  fecha_atencion       DATETIME     NULL                    COMMENT 'Cuándo se aceptó o rechazó',
  observacion          TEXT         NULL                    COMMENT 'Por qué se pide (obligatoria al crear)',
  observacion_por      INT UNSIGNED NULL                    COMMENT 'FK empleado: quién editó la observación',
  observacion_fecha    DATETIME     NULL                    COMMENT 'Cuándo se editó la observación',
  PRIMARY KEY (id_solicitud),
  UNIQUE KEY uq_solicitud_folio (folio_solicitud),
  -- (id_empleado, fecha) cubre también la FK de id_empleado: se quitan los dos
  -- índices duplicados que hoy existen sobre id_empleado.
  KEY idx_solicitud_empleado_fecha (id_empleado, fecha),
  KEY idx_solicitud_estatus_fecha (estatus, fecha),
  KEY idx_solicitud_ruta (id_sucursal_origen, id_sucursal_destino),
  KEY idx_solicitud_destino (id_sucursal_destino),
  KEY idx_solicitud_obs_por (observacion_por),
  CONSTRAINT fk_sol_empleado   FOREIGN KEY (id_empleado)         REFERENCES empleado (id_empleado) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_sol_origen     FOREIGN KEY (id_sucursal_origen)  REFERENCES sucursal (id_sucursal) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT fk_sol_destino    FOREIGN KEY (id_sucursal_destino) REFERENCES sucursal (id_sucursal) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT fk_sol_obs_por    FOREIGN KEY (observacion_por)     REFERENCES empleado (id_empleado) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT chk_sol_ruta      CHECK (id_sucursal_origen IS NULL OR id_sucursal_destino IS NULL OR id_sucursal_origen <> id_sucursal_destino),
  CONSTRAINT chk_sol_atencion  CHECK ((estatus = 'En proceso') = (fecha_atencion IS NULL))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Solicitudes de insumos (cabecera)';

CREATE TABLE solicitud_insumo (
  id_solicitud_insumo  INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'PK',
  id_solicitud         INT UNSIGNED NOT NULL                COMMENT 'FK solicitud',
  id_insumo            INT UNSIGNED NOT NULL                COMMENT 'FK insumo',
  cantidad             INT UNSIGNED NOT NULL                COMMENT 'Piezas pedidas',
  cantidad_aprobada    INT UNSIGNED NULL                    COMMENT 'NULL = sin decidir · 0 = negado · >0 = aceptado',
  descripcion          TEXT         NULL                    COMMENT 'Nota opcional del renglón',
  -- 3FN: se elimina `aprobado`, que se deducía de cantidad_aprobada
  -- (aprobado = cantidad_aprobada > 0) y podía contradecirla.
  PRIMARY KEY (id_solicitud_insumo),
  UNIQUE KEY uq_si_solicitud_insumo (id_solicitud, id_insumo),
  KEY idx_si_insumo (id_insumo),
  CONSTRAINT fk_si_solicitud FOREIGN KEY (id_solicitud) REFERENCES solicitud (id_solicitud) ON DELETE CASCADE  ON UPDATE CASCADE,
  CONSTRAINT fk_si_insumo    FOREIGN KEY (id_insumo)    REFERENCES insumo (id_insumo)       ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT chk_si_cantidad CHECK (cantidad > 0),
  CONSTRAINT chk_si_aprobada CHECK (cantidad_aprobada IS NULL OR cantidad_aprobada <= cantidad)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Renglones (insumos) de cada solicitud';

CREATE TABLE salida_interna (
  id_salida            INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'PK',
  folio_salida         VARCHAR(20)  NOT NULL                COMMENT 'Folio SAL-AAAAMM-NNNN (clave natural)',
  fecha                DATETIME     NOT NULL                COMMENT 'Fecha y hora física de la salida',
  prioridad            ENUM('Baja','Media','Alta','Urgente') NOT NULL DEFAULT 'Media' COMMENT 'Prioridad',
  id_sucursal_origen   INT UNSIGNED NULL                    COMMENT 'FK sucursal de donde sale',
  id_sucursal_destino  INT UNSIGNED NULL                    COMMENT 'FK sucursal destino (si está registrada)',
  destino_texto        VARCHAR(200) NULL                    COMMENT 'Destino libre (solo si no es sucursal registrada)',
  id_solicitante       INT UNSIGNED NULL                    COMMENT 'FK empleado: quién se lleva el material',
  solicitante_texto    VARCHAR(200) NULL                    COMMENT 'Solo si no es empleado registrado',
  id_responsable       INT UNSIGNED NULL                    COMMENT 'FK empleado: quién recibe en destino',
  responsable_texto    VARCHAR(200) NULL                    COMMENT 'Solo si no es empleado registrado',
  justificacion        TEXT         NULL                    COMMENT 'Para qué es el material',
  id_registro          INT UNSIGNED NULL                    COMMENT 'FK empleado: quién capturó',
  fecha_registro       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Cuándo se capturó',
  PRIMARY KEY (id_salida),
  UNIQUE KEY uq_salida_folio (folio_salida),
  KEY idx_salida_fecha (fecha),
  KEY idx_salida_solicitante (id_solicitante),
  KEY idx_salida_origen (id_sucursal_origen),
  KEY idx_salida_destino_fecha (id_sucursal_destino, fecha),      -- consumo por sucursal
  KEY idx_salida_responsable (id_responsable),
  KEY idx_salida_registro (id_registro),
  CONSTRAINT fk_sal_origen      FOREIGN KEY (id_sucursal_origen)  REFERENCES sucursal (id_sucursal) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT fk_sal_destino     FOREIGN KEY (id_sucursal_destino) REFERENCES sucursal (id_sucursal) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT fk_sal_solicitante FOREIGN KEY (id_solicitante)      REFERENCES empleado (id_empleado) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT fk_sal_responsable FOREIGN KEY (id_responsable)      REFERENCES empleado (id_empleado) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT fk_sal_registro    FOREIGN KEY (id_registro)         REFERENCES empleado (id_empleado) ON DELETE SET NULL ON UPDATE CASCADE,
  -- Arcos exclusivos: o se eligió de la lista, o se escribió a mano; nunca ambos.
  CONSTRAINT chk_sal_destino     CHECK (id_sucursal_destino IS NULL OR destino_texto IS NULL),
  CONSTRAINT chk_sal_solicitante CHECK (id_solicitante IS NULL OR solicitante_texto IS NULL),
  CONSTRAINT chk_sal_responsable CHECK (id_responsable IS NULL OR responsable_texto IS NULL),
  CONSTRAINT chk_sal_ruta        CHECK (id_sucursal_origen IS NULL OR id_sucursal_destino IS NULL OR id_sucursal_origen <> id_sucursal_destino)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Salidas internas de material (cabecera)';

-- 3FN: estatus/motivo/fecha/id_anulo dependían de que la salida estuviera
-- anulada (4 columnas casi siempre NULL). La anulación es un hecho aparte,
-- 1:0..1 con la salida: existe el renglón = la salida está anulada.
CREATE TABLE salida_anulacion (
  id_salida   INT UNSIGNED NOT NULL                COMMENT 'PK y FK salida_interna',
  motivo      VARCHAR(500) NOT NULL                COMMENT 'Por qué se anuló',
  id_anulo    INT UNSIGNED NULL                    COMMENT 'FK empleado: quién anuló',
  fecha       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Cuándo se anuló',
  PRIMARY KEY (id_salida),
  KEY idx_anul_empleado (id_anulo),
  CONSTRAINT fk_anul_salida   FOREIGN KEY (id_salida) REFERENCES salida_interna (id_salida) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_anul_empleado FOREIGN KEY (id_anulo)  REFERENCES empleado (id_empleado)     ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT chk_anul_motivo  CHECK (CHAR_LENGTH(motivo) >= 5)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Anulación de una salida interna (si existe, la salida está anulada)';

CREATE TABLE salida_cambio (
  id_cambio       INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'PK',
  id_salida       INT UNSIGNED NOT NULL                COMMENT 'FK salida_interna',
  campo           VARCHAR(40)  NOT NULL                COMMENT 'Campo corregido (p. ej. fecha)',
  valor_anterior  VARCHAR(255) NULL                    COMMENT 'Valor antes (texto de auditoría)',
  valor_nuevo     VARCHAR(255) NULL                    COMMENT 'Valor después',
  motivo          VARCHAR(500) NOT NULL                COMMENT 'Por qué se corrigió',
  id_empleado     INT UNSIGNED NULL                    COMMENT 'FK empleado: quién corrigió',
  fecha           DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Cuándo',
  PRIMARY KEY (id_cambio),
  KEY idx_sc_salida_fecha (id_salida, fecha),
  KEY idx_sc_empleado (id_empleado),
  CONSTRAINT fk_sc_salida   FOREIGN KEY (id_salida)   REFERENCES salida_interna (id_salida) ON DELETE CASCADE  ON UPDATE CASCADE,
  CONSTRAINT fk_sc_empleado FOREIGN KEY (id_empleado) REFERENCES empleado (id_empleado)     ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Auditoría de correcciones a salidas internas';

ALTER TABLE insumo_unidad
  ADD CONSTRAINT fk_unidad_salida FOREIGN KEY (id_salida) REFERENCES salida_interna (id_salida)
    ON DELETE SET NULL ON UPDATE CASCADE;

-- Kardex: libro de movimientos (solo se agrega; no se borra).
-- Redundancia CONTROLADA y documentada:
--   * stock_anterior / stock_nuevo: foto del stock en ese momento (permite
--     auditar sin recalcular todo el historial). La regla aritmética se exige
--     con chk_mi_aritmetica.
--   * fecha e id_sucursal_* de los renglones de una salida o solicitud repiten
--     los de su cabecera (dependencia transitiva id_salida → fecha). Se
--     conservan porque las ENTRADAS no tienen cabecera y el reporte de consumo
--     filtra por estas columnas sin JOIN; la coherencia la garantiza el
--     disparador trg_salida_sincroniza_kardex.
CREATE TABLE movimiento_inventario (
  id_movimiento        INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'PK',
  id_insumo            INT UNSIGNED NOT NULL                COMMENT 'FK insumo',
  tipo                 ENUM('Entrada','Salida','Ajuste') NOT NULL COMMENT 'Sentido del movimiento',
  cantidad             INT UNSIGNED NOT NULL                COMMENT 'Piezas (siempre positiva; el sentido lo da tipo)',
  stock_anterior       INT UNSIGNED NOT NULL                COMMENT 'Stock antes del movimiento',
  stock_nuevo          INT UNSIGNED NOT NULL                COMMENT 'Stock después del movimiento',
  id_sucursal_origen   INT UNSIGNED NULL                    COMMENT 'FK sucursal origen',
  id_sucursal_destino  INT UNSIGNED NULL                    COMMENT 'FK sucursal destino',
  id_solicitud         INT UNSIGNED NULL                    COMMENT 'FK solicitud que lo originó',
  id_salida            INT UNSIGNED NULL                    COMMENT 'FK salida_interna que lo originó',
  id_empleado          INT UNSIGNED NULL                    COMMENT 'FK empleado: quién lo registró',
  motivo               VARCHAR(500) NULL                    COMMENT 'Motivo libre (entradas y ajustes)',
  fecha                DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Fecha física del movimiento',
  fecha_registro       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Cuándo se capturó',
  PRIMARY KEY (id_movimiento),
  KEY idx_mi_insumo_fecha (id_insumo, fecha),
  KEY idx_mi_tipo_fecha (tipo, fecha),
  KEY idx_mi_destino_fecha (id_sucursal_destino, fecha),         -- consumo por sucursal
  KEY idx_mi_origen (id_sucursal_origen),
  KEY idx_mi_solicitud (id_solicitud),
  KEY idx_mi_salida (id_salida),
  KEY idx_mi_empleado (id_empleado),
  CONSTRAINT fk_mi_insumo    FOREIGN KEY (id_insumo)           REFERENCES insumo (id_insumo)         ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_mi_origen    FOREIGN KEY (id_sucursal_origen)  REFERENCES sucursal (id_sucursal)     ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_mi_destino   FOREIGN KEY (id_sucursal_destino) REFERENCES sucursal (id_sucursal)     ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_mi_solicitud FOREIGN KEY (id_solicitud)        REFERENCES solicitud (id_solicitud)   ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT fk_mi_salida    FOREIGN KEY (id_salida)           REFERENCES salida_interna (id_salida) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT fk_mi_empleado  FOREIGN KEY (id_empleado)         REFERENCES empleado (id_empleado)     ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT chk_mi_cantidad CHECK (cantidad > 0),
  -- Un movimiento viene de una solicitud, de una salida interna, o de ninguna (entrada/ajuste); nunca de ambas.
  CONSTRAINT chk_mi_origen_doc CHECK (id_solicitud IS NULL OR id_salida IS NULL),
  CONSTRAINT chk_mi_aritmetica CHECK (
       (tipo = 'Entrada' AND stock_nuevo = stock_anterior + cantidad)
    OR (tipo = 'Salida'  AND stock_nuevo = stock_anterior - cantidad)
    OR (tipo = 'Ajuste')
  )
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Kardex: cada entrada, salida o ajuste de inventario';

-- Mantiene la redundancia controlada: si se corrige la fecha o la ruta de una
-- salida, sus renglones de SALIDA en el kardex cambian igual (antes había que
-- acordarse de actualizar las dos tablas).
DELIMITER //
CREATE TRIGGER trg_salida_sincroniza_kardex
AFTER UPDATE ON salida_interna
FOR EACH ROW
BEGIN
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

-- Vista de compatibilidad: devuelve las salidas con su estatus como hoy
-- (Activa/Anulada) para que el código existente no cambie de golpe.
CREATE VIEW v_salida_interna AS
SELECT s.*,
       IF(a.id_salida IS NULL, 'Activa', 'Anulada') AS estatus,
       a.motivo AS motivo_anulacion,
       a.fecha  AS fecha_anulacion,
       a.id_anulo
  FROM salida_interna s
  LEFT JOIN salida_anulacion a ON a.id_salida = s.id_salida;

-- =============================================================================
-- Notas para PostgreSQL (si algún día se migra):
--   - INT UNSIGNED → INTEGER con CHECK (col >= 0); AUTO_INCREMENT → GENERATED ALWAYS AS IDENTITY.
--   - ENUM(...) → TEXT con CHECK (col IN (...)) o CREATE TYPE ... AS ENUM.
--   - TINYINT(1) → BOOLEAN; DATETIME → TIMESTAMP (o TIMESTAMPTZ).
--   - COMMENT '…' → COMMENT ON TABLE / COMMENT ON COLUMN.
--   - ON UPDATE CURRENT_TIMESTAMP → disparador BEFORE UPDATE.
--   - El disparador se escribe como FUNCTION … RETURNS trigger + CREATE TRIGGER.
-- =============================================================================
