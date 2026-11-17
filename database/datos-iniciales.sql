-- =============================================================================
--  datos-iniciales.sql — Catálogos mínimos para una instalación NUEVA
-- =============================================================================
--  Úsalo solo si empiezas con una base vacía (después de schema.sql).
--  Si vas a restaurar un respaldo existente (base_datos.sql), NO lo necesitas.
--
--    mysql -u root -p < database/schema.sql
--    mysql -u root -p precision_helpdesk < database/datos-iniciales.sql
-- =============================================================================

USE precision_helpdesk;
SET NAMES utf8mb4;

-- Roles: el sistema asume 1 = Administrador y 2 = Usuario
INSERT IGNORE INTO rol (id_rol, nombre_rol) VALUES (1, 'Administrador'), (2, 'Usuario');

-- "Soporte Técnico" debe existir con ESTE nombre exacto: le da permisos de
-- observaciones y ruta del material (auth-middleware.js, NOMBRE_DEPARTAMENTO_SOPORTE)
INSERT IGNORE INTO departamento (nombre_departamento) VALUES ('Soporte Técnico'), ('Administración');

INSERT IGNORE INTO sucursal (nombre_sucursal) VALUES ('Matriz');

-- Categorías: en_tickets / en_insumos / en_manuales indican dónde aparece cada una.
-- Solo se insertan si la tabla está vacía (no tiene nombre único y se duplicarían).
INSERT INTO categoria (nombre_categoria, en_tickets, en_insumos, en_manuales)
SELECT * FROM (
  SELECT 'Mantenimiento' AS nombre, 1 AS t, 1 AS i, 1 AS m
  UNION ALL SELECT 'Hardware', 1, 1, 1
  UNION ALL SELECT 'Software', 1, 1, 1
  UNION ALL SELECT 'Redes', 1, 0, 1
  UNION ALL SELECT 'Impresoras', 1, 1, 1
  UNION ALL SELECT 'Correo Electrónico', 1, 0, 1
  UNION ALL SELECT 'Accesos y Seguridad', 1, 0, 1
  UNION ALL SELECT 'Infraestructura', 1, 1, 1
  UNION ALL SELECT 'Etiquetas', 0, 1, 0
  UNION ALL SELECT 'Consumibles de Impresión', 0, 1, 0
  UNION ALL SELECT 'Herramientas', 0, 1, 0
  UNION ALL SELECT 'Adquisición/Préstamo de Equipo', 0, 1, 0
  UNION ALL SELECT 'Accesorios de Energía', 0, 1, 0
  UNION ALL SELECT 'Infraestructura de Conectividad y Redes', 0, 1, 0
  UNION ALL SELECT 'Herramientas de Diagnóstico y Mantenimiento', 0, 1, 0
  UNION ALL SELECT 'Otro', 1, 1, 1
) AS c
WHERE NOT EXISTS (SELECT 1 FROM categoria);

-- -----------------------------------------------------------------------------
--  Primer administrador
-- -----------------------------------------------------------------------------
--  1. Genera el hash de su contraseña (desde la raíz del proyecto):
--       node -e "console.log(require('bcryptjs').hashSync('TuContraseñaSegura!2026', 12))"
--  2. Pega el hash abajo, cambia nombre y correo, quita los "-- " y ejecuta.
--     El correo debe ser corporativo (dominio permitido por el sistema).
--
-- INSERT INTO empleado (num_empleado, nombre, ap_paterno, ap_materno, email, password, estatus, id_rol, id_departamento, id_sucursal)
-- SELECT '0001', 'Nombre', 'Apellido', 'Apellido', 'admin@ptp.com.mx', '<PEGA_AQUI_EL_HASH>', 'Activo', 1,
--        (SELECT id_departamento FROM departamento WHERE nombre_departamento = 'Soporte Técnico'),
--        (SELECT id_sucursal FROM sucursal WHERE nombre_sucursal = 'Matriz');
