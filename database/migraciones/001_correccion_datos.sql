-- =============================================================================
--  001_correccion_datos.sql  —  PrecisionTrucks HelpDesk
-- =============================================================================
--  Corrige los datos dañados detectados al analizar Dump20261114.sql.
--
--  ANTES DE CORRERLO:
--    1. Detén el backend (npm run all) y despliega el código ya corregido
--       (movimiento-inventario.js ya NO suma stock dos veces).
--    2. Haz un respaldo:  npm run respaldar
--    3. Ejecuta:  mysql -u root -p precision_helpdesk < database/migraciones/001_correccion_datos.sql
--
--  Cada ajuste de stock SOLO se aplica si el stock actual es exactamente el que
--  tenía el dump del 14-nov. Si alguien movió ese insumo después, se omite y
--  aparece en el reporte "OMITIDOS" para revisarlo a mano. Todos los ajustes
--  dejan su movimiento en el kardex: no se borra ni reescribe historial.
-- =============================================================================

SET NAMES utf8mb4;
-- MySQL Workbench trae "safe updates" activo y rechaza los UPDATE/DELETE cuyo
-- WHERE no usa una llave (Error 1175). Se desactiva solo en esta sesión y se
-- restaura al final.
SET @old_safe_updates := @@SQL_SAFE_UPDATES;
SET SQL_SAFE_UPDATES = 0;
SET @admin := 1;   -- id_empleado que firma los ajustes (Matthew Garay, admin)

START TRANSACTION;

-- ─────────────────────────────────────────────────────────────────────────────
-- 1 y 2. STOCK DUPLICADO / CADENA ROTA + CONTEO FÍSICO (cambios.txt)
-- ─────────────────────────────────────────────────────────────────────────────
DROP TEMPORARY TABLE IF EXISTS _ajuste;
CREATE TEMPORARY TABLE _ajuste (
  fase            TINYINT      NOT NULL,
  id_insumo       INT          NOT NULL,
  stock_actual    INT          NOT NULL,   -- stock esperado en BD antes del ajuste
  stock_correcto  INT          NOT NULL,
  motivo          VARCHAR(500) NOT NULL,
  PRIMARY KEY (fase, id_insumo)
);

INSERT INTO _ajuste VALUES
 -- Fase 1: entradas contadas dos veces por el bug del commit 27cc552
 (1,   1,  7, 4, 'Corrección: entrada del 13-nov contada dos veces por error del sistema (stock real 4)'),
 (1,   2,  8, 4, 'Corrección: entrada del 13-nov contada dos veces por error del sistema (stock real 4)'),
 (1,  18,  7, 4, 'Corrección: entrada del 13-nov contada dos veces por error del sistema (stock real 4)'),
 (1,  52,  9, 5, 'Corrección: entrada del 13-nov contada dos veces por error del sistema (stock real 5)'),
 (1,  63, 11, 6, 'Corrección: entrada del 13-nov contada dos veces por error del sistema (stock real 6)'),
 (1, 189,  6, 3, 'Corrección: stock inicial del 13-nov contado dos veces por error del sistema (stock real 3)'),
 (1, 178, 13, 7, 'Corrección: entrada del 05-nov contada dos veces por error del sistema (stock real 7)'),
 -- Fase 1: stock que no coincide con su último movimiento
 (1, 173,  1, 0, 'Corrección: la salida SAL-202610-0019 (envío a CEDIS Guadalajara) no se reflejó en el stock'),
 -- Fase 2: conteo físico (cambios.txt). OJO: "Elite Magenta" es el ID 30, no
 -- el 20 que dice cambios.txt (el 20 es Tinta Epson Amarillo T544); el ID 30
 -- ya tiene 1, así que no requiere ajuste.
 (2, 178,  7, 6, 'Ajuste por conteo físico'),
 (2,  68,  4, 2, 'Ajuste por conteo físico'),
 (2,  27,  1, 0, 'Ajuste por conteo físico'),
 (2,  28,  1, 0, 'Ajuste por conteo físico'),
 (2,  29,  1, 0, 'Ajuste por conteo físico'),
 (2, 179,  1, 2, 'Ajuste por conteo físico'),
 (2, 182,  0, 1, 'Ajuste por conteo físico');

-- Reporte previo: ajustes que se van a OMITIR porque el stock ya cambió
SELECT 'OMITIDOS (revisar a mano)' AS aviso, a.fase, a.id_insumo, i.nombre,
       i.stock AS stock_hoy, a.stock_actual AS stock_esperado, a.stock_correcto
  FROM _ajuste a JOIN insumo i USING (id_insumo)
 WHERE a.fase = 1 AND i.stock <> a.stock_actual;

-- Fase 1 ------------------------------------------------------------------
-- Convención del sistema: disminución = 'Ajuste', aumento = 'Entrada'.
INSERT INTO movimiento_inventario (id_insumo, tipo, cantidad, stock_anterior, stock_nuevo, id_empleado, motivo)
SELECT a.id_insumo, IF(a.stock_correcto < i.stock, 'Ajuste', 'Entrada'),
       ABS(i.stock - a.stock_correcto), i.stock, a.stock_correcto, @admin, a.motivo
  FROM _ajuste a JOIN insumo i USING (id_insumo)
 WHERE a.fase = 1 AND i.stock = a.stock_actual;

UPDATE insumo i JOIN _ajuste a USING (id_insumo)
   SET i.stock = a.stock_correcto
 WHERE a.fase = 1 AND i.stock = a.stock_actual;

-- Fase 2 ------------------------------------------------------------------
SELECT 'OMITIDOS conteo físico (revisar a mano)' AS aviso, a.id_insumo, i.nombre,
       i.stock AS stock_hoy, a.stock_actual AS stock_esperado, a.stock_correcto
  FROM _ajuste a JOIN insumo i USING (id_insumo)
 WHERE a.fase = 2 AND i.stock <> a.stock_actual;

INSERT INTO movimiento_inventario (id_insumo, tipo, cantidad, stock_anterior, stock_nuevo, id_empleado, motivo)
SELECT a.id_insumo, IF(a.stock_correcto < i.stock, 'Ajuste', 'Entrada'),
       ABS(i.stock - a.stock_correcto), i.stock, a.stock_correcto, @admin, a.motivo
  FROM _ajuste a JOIN insumo i USING (id_insumo)
 WHERE a.fase = 2 AND i.stock = a.stock_actual;

UPDATE insumo i JOIN _ajuste a USING (id_insumo)
   SET i.stock = a.stock_correcto
 WHERE a.fase = 2 AND i.stock = a.stock_actual;

-- Verificación: todo insumo con movimientos debe coincidir con su último stock_nuevo
SELECT 'DESCUADRE RESTANTE' AS aviso, i.id_insumo, i.nombre, i.stock, m.stock_nuevo AS ultimo_mov
  FROM insumo i
  JOIN movimiento_inventario m
    ON m.id_movimiento = (SELECT MAX(id_movimiento) FROM movimiento_inventario WHERE id_insumo = i.id_insumo)
 WHERE i.stock <> m.stock_nuevo;

-- ─────────────────────────────────────────────────────────────────────────────
-- 6. CALIDAD DE DATOS EN `insumo`
-- ─────────────────────────────────────────────────────────────────────────────
-- Registro de prueba "cosa ficticia": sin movimientos ni solicitudes -> se borra
DELETE FROM insumo
 WHERE id_insumo = 71 AND nombre = 'cosa ficticia'
   AND NOT EXISTS (SELECT 1 FROM movimiento_inventario WHERE id_insumo = 71)
   AND NOT EXISTS (SELECT 1 FROM solicitud_insumo     WHERE id_insumo = 71);

-- Equipos dañados: siguen en inventario pero no se ofrecen en el catálogo
UPDATE insumo SET visible_publico = 0 WHERE estado = 'Dañado';

-- Descripciones equivocadas
UPDATE insumo SET descripcion = 'Unidad de tambor (Drum) para impresora láser Xerox WorkCentre 3225; transfiere el tóner al papel.'
 WHERE id_insumo = 118;
UPDATE insumo SET descripcion = 'Cable de video DVI Manhattan, color negro.'                   WHERE id_insumo = 77;
UPDATE insumo SET descripcion = 'Cable de video DVI, color negro.'                             WHERE id_insumo = 78;
UPDATE insumo SET descripcion = 'Impresora térmica de tickets/recibos para punto de venta.'    WHERE id_insumo = 121;
UPDATE insumo SET descripcion = 'Unidad de estado sólido 240GB, formato 2.5 pulgadas SATA'      WHERE id_insumo = 6;
UPDATE insumo SET descripcion = 'Cable HDMI - VGA Manhattan, color negro'                       WHERE id_insumo = 74;
UPDATE insumo SET modelo = 'N/A'   WHERE id_insumo = 3 AND modelo = 'CF217A';   -- aire comprimido con modelo de tóner
-- Medidas de etiquetas: son milímetros, no centímetros
UPDATE insumo SET descripcion = 'Rollo de etiquetas adhesivas de color blanco. 85 x 25 mm.'                              WHERE id_insumo = 53;
UPDATE insumo SET descripcion = 'Etiquetas de material Tyvek de alta resistencia. 100 x 60 mm.'                          WHERE id_insumo = 54;
UPDATE insumo SET descripcion = 'Rollo de etiqueta 85 x 25 mm amarilla. Impresoras compatibles: GC420T, ZD420T'          WHERE id_insumo = 55;
UPDATE insumo SET descripcion = 'Rollo de etiquetas 102 x 63 mm amarilla. Impresoras compatibles: GC420T, ZD420T'        WHERE id_insumo = 56;
UPDATE insumo SET descripcion = 'Rollo de etiqueta 85 x 25 mm azul'                                                       WHERE id_insumo = 57;

-- Categorías
UPDATE insumo SET id_categoria = 9  WHERE id_insumo IN (53, 54, 55, 56, 57, 119);  -- Etiquetas
UPDATE insumo SET id_categoria = 10 WHERE id_insumo = 70;                          -- Ribbon -> Consumibles de impresión
UPDATE insumo SET id_categoria = 14 WHERE id_insumo = 40;                          -- Adaptador Ethernet -> Redes

-- Valor uniforme para "sin dato": 'N/A' (es lo que el formulario guarda)
UPDATE insumo SET num_serie = 'N/A' WHERE num_serie IS NULL OR TRIM(num_serie) IN ('', 'NA');
UPDATE insumo SET marca     = 'N/A' WHERE marca     IS NULL OR TRIM(marca)     IN ('', 'NA');
UPDATE insumo SET modelo    = 'N/A' WHERE modelo    IS NULL OR TRIM(modelo)    IN ('', 'NA');

-- ─────────────────────────────────────────────────────────────────────────────
-- 7. EMPLEADOS
-- ─────────────────────────────────────────────────────────────────────────────
-- 100, 101 y 102 compartían la MISMA contraseña (la por defecto). Se reemplaza
-- por un hash aleatorio que nadie conoce y se cierran sus sesiones. Pueden
-- entrar con "Iniciar sesión con Zoho" o con "¿Olvidaste tu contraseña?".
UPDATE empleado SET password = '$2b$12$5jT2VUlrGePMwXsIc6YOQOEhx9BbY9cIhCM4JnSw8H76xD.PxJOYq', token_version = token_version + 1 WHERE id_empleado = 100;
UPDATE empleado SET password = '$2b$12$YeRY79NELmOwY.BugI2DMOYMt7/hJz2aeox2DzZnD3ISGmjrna3dK', token_version = token_version + 1 WHERE id_empleado = 101;
UPDATE empleado SET password = '$2b$12$WIkHmE961ykzCa4U3ZVF9e7blahL1gqiyQr8Fxxd8Mu0W0I3kcTcy', token_version = token_version + 1 WHERE id_empleado = 102;

-- Salida SAL-202610-0024: número de empleado incorrecto (EMP-1003 -> 6261)
UPDATE movimiento_inventario
   SET motivo = REPLACE(motivo, 'NumEmp: EMP-1003', 'NumEmp: 6261')
 WHERE motivo LIKE '[SAL-202610-0024]%' AND motivo LIKE '%NumEmp: EMP-1003%';

COMMIT;

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. ESQUEMA  (DDL: MySQL hace commit implícito en cada ALTER)
-- ─────────────────────────────────────────────────────────────────────────────
-- 4a. El kardex no debe borrarse al eliminar un insumo
ALTER TABLE movimiento_inventario DROP FOREIGN KEY fk_mi_insumo;
ALTER TABLE movimiento_inventario
  ADD CONSTRAINT fk_mi_insumo FOREIGN KEY (id_insumo) REFERENCES insumo (id_insumo)
  ON DELETE RESTRICT ON UPDATE CASCADE;

-- 4b. Misma collation que el resto de tablas (evita "Illegal mix of collations")
ALTER TABLE movimiento_inventario CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 4c. ticket_historial: tipos compatibles con ticket/empleado + llaves foráneas
DELETE th FROM ticket_historial th LEFT JOIN ticket t ON t.id_ticket = th.id_ticket WHERE t.id_ticket IS NULL;
ALTER TABLE ticket_historial
  CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  MODIFY id_ticket   INT NOT NULL,
  MODIFY id_empleado INT NOT NULL;
ALTER TABLE ticket_historial
  ADD CONSTRAINT fk_th_ticket   FOREIGN KEY (id_ticket)   REFERENCES ticket   (id_ticket)   ON DELETE CASCADE  ON UPDATE CASCADE,
  ADD CONSTRAINT fk_th_empleado FOREIGN KEY (id_empleado) REFERENCES empleado (id_empleado) ON DELETE RESTRICT ON UPDATE CASCADE;

-- 4d. solicitud.observacion_por -> empleado
UPDATE solicitud s LEFT JOIN empleado e ON e.id_empleado = s.observacion_por
   SET s.observacion_por = NULL
 WHERE s.observacion_por IS NOT NULL AND e.id_empleado IS NULL;
ALTER TABLE solicitud
  ADD CONSTRAINT fk_solicitud_observacion_por FOREIGN KEY (observacion_por)
  REFERENCES empleado (id_empleado) ON DELETE SET NULL ON UPDATE CASCADE;

-- 4e. Estatus de solicitud: solo los que usa el sistema
UPDATE solicitud SET estatus = 'Aceptado'   WHERE estatus = 'Resuelto';
UPDATE solicitud SET estatus = 'Rechazado'  WHERE estatus = 'No Resuelto';
UPDATE solicitud SET estatus = 'En proceso' WHERE estatus = 'Pendiente';
ALTER TABLE solicitud
  MODIFY estatus ENUM('En proceso','Aceptado','Rechazado')
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'En proceso';

SET SQL_SAFE_UPDATES = @old_safe_updates;

SELECT 'Corrección 2026-11-15 aplicada' AS resultado;
