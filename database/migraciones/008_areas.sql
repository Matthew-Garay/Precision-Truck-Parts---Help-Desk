-- 008_areas.sql
-- Áreas de la empresa. La tabla `departamento` en realidad guarda PUESTOS
-- (Contralor, Asistente de Contraloría, Vendedor B2B…). Para reportes por área
-- ("Contraloría usa tóner cada 4 semanas") cada puesto se asigna a un área.
--
-- La asignación inicial es una PROPUESTA hecha por nombre del puesto; se puede
-- corregir con:  UPDATE departamento SET id_area = (SELECT id_area FROM area WHERE nombre_area = '…')
--                 WHERE nombre_departamento = '…';
-- Un puesto sin área aparece en los reportes como su propio nombre.
--
-- Aplicar UNA vez:  npm run migrar -- database/migraciones/008_areas.sql

CREATE TABLE area (
  id_area      int NOT NULL AUTO_INCREMENT              COMMENT 'PK',
  nombre_area  varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Área de la empresa (Contraloría, Almacén…)',
  PRIMARY KEY (id_area),
  UNIQUE KEY uq_nombre_area (nombre_area)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Áreas de la empresa; agrupan los puestos (tabla departamento)';

ALTER TABLE departamento
  ADD COLUMN id_area int DEFAULT NULL COMMENT 'FK area: área a la que pertenece el puesto',
  ADD KEY idx_departamento_area (id_area),
  ADD CONSTRAINT fk_departamento_area FOREIGN KEY (id_area) REFERENCES area (id_area)
    ON DELETE SET NULL ON UPDATE CASCADE;

INSERT INTO area (nombre_area) VALUES
  ('Contraloría'), ('Finanzas y Cobranza'), ('Ventas B2B'), ('Ventas B2C y Tiendas'),
  ('Almacén y Distribución'), ('Transporte y Logística'), ('Recursos Humanos'),
  ('Seguridad'), ('Producción'), ('Compras'), ('Diseño y Marketing'),
  ('Tecnologías de la Información'), ('Dirección'), ('Jurídico'), ('Servicios Generales');

-- Asignación propuesta (por nombre exacto del puesto).
UPDATE departamento d JOIN area a ON a.nombre_area = CASE d.nombre_departamento
    WHEN 'Contralor'                        THEN 'Contraloría'
    WHEN 'Contralor Externo'                THEN 'Contraloría'
    WHEN 'Asistente de Contraloría'         THEN 'Contraloría'
    WHEN 'Director de Contraloría'          THEN 'Contraloría'
    WHEN 'Jefe de Finanzas'                 THEN 'Finanzas y Cobranza'
    WHEN 'Facturación'                      THEN 'Finanzas y Cobranza'
    WHEN 'Asistente de Crédito y Cobranza'  THEN 'Finanzas y Cobranza'
    WHEN 'Analista de Mesa de Control'      THEN 'Finanzas y Cobranza'
    WHEN 'Vendedor B2B'                     THEN 'Ventas B2B'
    WHEN 'Gerente Comercial B2B'            THEN 'Ventas B2B'
    WHEN 'Vendedor B2C'                     THEN 'Ventas B2C y Tiendas'
    WHEN 'Gerente Comercial B2C'            THEN 'Ventas B2C y Tiendas'
    WHEN 'Jefe de Tienda'                   THEN 'Ventas B2C y Tiendas'
    WHEN 'Ejecutivo de E-commerce'          THEN 'Ventas B2C y Tiendas'
    WHEN 'Auxiliar de Almacén'              THEN 'Almacén y Distribución'
    WHEN 'Almacenista'                      THEN 'Almacén y Distribución'
    WHEN 'Jefe de Almacén'                  THEN 'Almacén y Distribución'
    WHEN 'Encargado de Almacén'             THEN 'Almacén y Distribución'
    WHEN 'Jefe de Centro de Distribución'   THEN 'Almacén y Distribución'
    WHEN 'Chofer Repartidor'                THEN 'Transporte y Logística'
    WHEN 'Jefe de Transporte'               THEN 'Transporte y Logística'
    WHEN 'Analista de Tráfico'              THEN 'Transporte y Logística'
    WHEN 'Auxiliar de Recursos Humanos'     THEN 'Recursos Humanos'
    WHEN 'Analista de Recursos Humanos'     THEN 'Recursos Humanos'
    WHEN 'Gerente de Recursos Humanos'      THEN 'Recursos Humanos'
    WHEN 'Auxiliar de Nómina'               THEN 'Recursos Humanos'
    WHEN 'Vigilante'                        THEN 'Seguridad'
    WHEN 'Monitorista CCTV'                 THEN 'Seguridad'
    WHEN 'Jefe de Seguridad Patrimonial'    THEN 'Seguridad'
    WHEN 'Director de Producción'           THEN 'Producción'
    WHEN 'Supervisor de Producción'         THEN 'Producción'
    WHEN 'Ingeniero en Procesos'            THEN 'Producción'
    WHEN 'Técnico en Mantenimiento'         THEN 'Producción'
    WHEN 'Coordinador de Liberación de Moldes' THEN 'Producción'
    WHEN 'Comprador'                        THEN 'Compras'
    WHEN 'Planeador de la Demanda'          THEN 'Compras'
    WHEN 'Diseñador Gráfico'                THEN 'Diseño y Marketing'
    WHEN 'Líder de Diseño Gráfico'          THEN 'Diseño y Marketing'
    WHEN 'Community Manager'                THEN 'Diseño y Marketing'
    WHEN 'Soporte Técnico'                  THEN 'Tecnologías de la Información'
    WHEN 'Auxiliar de Soporte Técnico'      THEN 'Tecnologías de la Información'
    WHEN 'Gerente de ERP y Base de Datos'   THEN 'Tecnologías de la Información'
    WHEN 'Director de TI'                   THEN 'Tecnologías de la Información'
    WHEN 'Director General'                 THEN 'Dirección'
    WHEN 'Director Comercial'               THEN 'Dirección'
    WHEN 'Director Estratégico'             THEN 'Dirección'
    WHEN 'Asistente de Dirección'           THEN 'Dirección'
    WHEN 'Asistente Administrativo'         THEN 'Dirección'
    WHEN 'Administrador Legal Corporativo'  THEN 'Jurídico'
    WHEN 'Asesor Jurídico'                  THEN 'Jurídico'
    WHEN 'Intendente'                       THEN 'Servicios Generales'
  END
SET d.id_area = a.id_area;
