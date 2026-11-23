-- 010_base_conocimiento.sql
-- Base de conocimiento: artículos de texto + búsqueda dentro de los PDF.
--
--   manual.contenido_texto   Texto extraído del PDF para el buscador. Las
--                            páginas se separan con el carácter \f (form feed)
--                            para poder decir "página N" en los resultados.
--                            NULL = pendiente de extraer; '' = el PDF no tiene
--                            texto (escaneado) y no se vuelve a intentar.
--   articulo_conocimiento    Artículos escritos en el sistema (Markdown).
--   articulo_voto            "¿Te sirvió?" — un voto por empleado y artículo.
--
-- Las categorías son las mismas de los manuales (categoria_ambito = 'manual').
--
-- Aplicar UNA vez:  npm run migrar -- database/migraciones/010_base_conocimiento.sql

ALTER TABLE manual
  ADD COLUMN contenido_texto mediumtext COLLATE utf8mb4_unicode_ci DEFAULT NULL
    COMMENT 'Texto del PDF para la búsqueda (páginas separadas por \\f). NULL = pendiente' AFTER ruta_pdf;

CREATE TABLE articulo_conocimiento (
  id_articulo     int NOT NULL AUTO_INCREMENT                         COMMENT 'PK',
  titulo          varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL    COMMENT 'Título del artículo',
  resumen         varchar(300) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Una o dos líneas que se muestran en la lista',
  contenido       mediumtext COLLATE utf8mb4_unicode_ci NOT NULL      COMMENT 'Cuerpo en Markdown',
  etiquetas       varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Palabras clave separadas por coma',
  id_categoria    int NOT NULL                                        COMMENT 'FK categoria (ámbito manual)',
  publicado       tinyint(1) NOT NULL DEFAULT 1                       COMMENT '0 = borrador, solo lo ven los administradores',
  vistas          int unsigned NOT NULL DEFAULT 0                     COMMENT 'Veces que lo abrió un usuario',
  creado_por      int DEFAULT NULL                                    COMMENT 'FK empleado autor',
  editado_por     int DEFAULT NULL                                    COMMENT 'FK empleado de la última edición',
  fecha_creacion  datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  -- Sin ON UPDATE: sumar una vista no debe cambiar la fecha de edición.
  fecha_cambio    datetime NOT NULL DEFAULT CURRENT_TIMESTAMP          COMMENT 'Última edición del contenido',
  PRIMARY KEY (id_articulo),
  KEY idx_articulo_categoria (id_categoria),
  KEY idx_articulo_publicado (publicado, fecha_cambio),
  KEY fk_articulo_creado (creado_por),
  KEY fk_articulo_editado (editado_por),
  CONSTRAINT fk_articulo_categoria FOREIGN KEY (id_categoria) REFERENCES categoria (id_categoria) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_articulo_creado    FOREIGN KEY (creado_por)   REFERENCES empleado (id_empleado)   ON DELETE SET NULL,
  CONSTRAINT fk_articulo_editado   FOREIGN KEY (editado_por)  REFERENCES empleado (id_empleado)   ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Artículos de la base de conocimiento';

CREATE TABLE articulo_voto (
  id_articulo  int NOT NULL                          COMMENT 'FK articulo_conocimiento',
  id_empleado  int NOT NULL                          COMMENT 'FK empleado que votó',
  util         tinyint(1) NOT NULL                   COMMENT '1 = me sirvió, 0 = no me sirvió',
  fecha        datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id_articulo, id_empleado),
  KEY fk_voto_empleado (id_empleado),
  CONSTRAINT fk_voto_articulo FOREIGN KEY (id_articulo) REFERENCES articulo_conocimiento (id_articulo) ON DELETE CASCADE,
  CONSTRAINT fk_voto_empleado FOREIGN KEY (id_empleado) REFERENCES empleado (id_empleado) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Votos de utilidad de los artículos';
