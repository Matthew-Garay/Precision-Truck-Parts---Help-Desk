-- =============================================================================
--  005_nombres_empleados.sql  —  PrecisionTrucks HelpDesk
-- =============================================================================
--  Nombres de empleados en formato título (primera letra de cada palabra en
--  mayúscula). Revisión del 2026-11-15 sobre los 103 empleados: el único
--  registro fuera de formato era el capturado todo en MAYÚSCULAS.
--  A partir de ahora el backend normaliza nombre y apellidos al crear/editar
--  (middlewares/validate.js → nombrePropio), así que no vuelve a pasar.
-- =============================================================================

SET NAMES utf8mb4;

UPDATE empleado
   SET nombre = 'Miguel Jovany', ap_paterno = 'Ramos', ap_materno = 'Sandoval'
 WHERE id_empleado = 103 AND BINARY nombre = 'MIGUEL JOVANY' AND BINARY ap_paterno = 'RAMOS';

-- Verificación: empleados con nombre o apellido TODO en mayúsculas (debe salir vacía)
SELECT 'EN MAYÚSCULAS' AS aviso, id_empleado, nombre, ap_paterno, ap_materno
  FROM empleado
 WHERE BINARY nombre = BINARY UPPER(nombre) AND CHAR_LENGTH(nombre) > 2
    OR BINARY ap_paterno = BINARY UPPER(ap_paterno) AND CHAR_LENGTH(ap_paterno) > 2;

SELECT 'Migración 005 aplicada' AS resultado;
