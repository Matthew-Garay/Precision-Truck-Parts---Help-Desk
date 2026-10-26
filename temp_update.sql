SET SQL_SAFE_UPDATES = 0;

UPDATE movimiento_inventario
SET motivo = REPLACE(motivo, 'Entrega de proveedor de Alejandro Vera', 'Entrega de proveedor de Jose Alejandro Vera Atilano')
WHERE motivo LIKE '%Entrega de proveedor de Alejandro Vera%';

SET SQL_SAFE_UPDATES = 1;