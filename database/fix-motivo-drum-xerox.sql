-- ============================================================================
-- Actualiza el motivo del movimiento de ENTRADA del insumo
-- "Drum Xerox WorkCentre 3225" (stock inicial +3).
--
-- Uso:  ejecútalo en MySQL Workbench (o mysql CLI) conectado a la BD del
--        sistema. Solo toca la fila del Drum Xerox, nada más.
-- ============================================================================

SET SQL_SAFE_UPDATES = 0;

-- 1) Ver ANTES cómo está la fila (para confirmar que es la correcta)
SELECT m.id_movimiento, i.nombre, m.tipo, m.cantidad,
       m.stock_anterior, m.stock_nuevo, m.motivo, m.fecha
FROM movimiento_inventario m
INNER JOIN insumo i ON m.id_insumo = i.id_insumo
WHERE i.nombre = 'Drum Xerox WorkCentre 3225'
  AND m.tipo = 'Entrada'
  AND m.motivo = 'Stock inicial al crear el insumo';

-- 2) Cambiar el motivo
UPDATE movimiento_inventario m
INNER JOIN insumo i ON m.id_insumo = i.id_insumo
SET m.motivo = 'Entrega de proveedor de Alejandro Vera'
WHERE i.nombre = 'Drum Xerox WorkCentre 3225'
  AND m.tipo = 'Entrada'
  AND m.motivo = 'Entrega de proveedor de Alejandro Vera: 6/10/2026 16:31';

SET SQL_SAFE_UPDATES = 1;

-- 3) Ver DESPUÉS que quedó aplicado
SELECT m.id_movimiento, i.nombre, m.tipo, m.cantidad,
       m.stock_anterior, m.stock_nuevo, m.motivo, m.fecha
FROM movimiento_inventario m
INNER JOIN insumo i ON m.id_insumo = i.id_insumo
WHERE i.nombre = 'Drum Xerox WorkCentre 3225';
