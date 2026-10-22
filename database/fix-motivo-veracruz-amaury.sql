-- ============================================================================
-- Actualiza el motivo del movimiento de inventario "Traída de Veracruz por Amaury"
-- para incluir el nombre completo: "Traída de Veracruz por Amaury Marcelo Vázquez Montes"
-- ============================================================================

SET SQL_SAFE_UPDATES = 0;

-- 1) Ver ANTES cómo está la fila
SELECT m.id_movimiento, i.nombre AS insumo, m.tipo, m.cantidad,
       m.stock_anterior, m.stock_nuevo, m.motivo, m.fecha, e.nombre AS empleado_nombre
FROM movimiento_inventario m
INNER JOIN insumo i ON m.id_insumo = i.id_insumo
INNER JOIN empleado e ON m.id_empleado = e.id_empleado
WHERE m.motivo = 'Traída de Veracruz por Amaury';

-- 2) Cambiar el motivo
UPDATE movimiento_inventario m
SET m.motivo = 'Traída de Veracruz por Amaury Marcelo Vázquez Montes'
WHERE m.motivo = 'Traída de Veracruz por Amaury';

-- 3) Ver DESPUÉS que quedó aplicado
SELECT m.id_movimiento, i.nombre AS insumo, m.tipo, m.cantidad,
       m.stock_anterior, m.stock_nuevo, m.motivo, m.fecha, e.nombre AS empleado_nombre
FROM movimiento_inventario m
INNER JOIN insumo i ON m.id_insumo = i.id_insumo
INNER JOIN empleado e ON m.id_empleado = e.id_empleado
WHERE m.motivo = 'Traída de Veracruz por Amaury Marcelo Vázquez Montes';

SET SQL_SAFE_UPDATES = 1;