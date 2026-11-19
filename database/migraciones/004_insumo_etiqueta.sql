-- 004_insumo_etiqueta.sql
-- Etiqueta del insumo: el texto o código de la etiqueta física que lleva el
-- insumo (p. ej. "INV-0042" o "Anaquel 3"), para identificarlo en el almacén.
-- Opcional; se captura en Inventario → Nuevo/Editar insumo y se puede buscar.
--
-- Aplicar UNA vez:  mysql -u root -p precision_helpdesk < database/migraciones/004_insumo_etiqueta.sql

ALTER TABLE `insumo`
  ADD COLUMN `etiqueta` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL
    COMMENT 'Etiqueta física del insumo (código o texto impreso)' AFTER `num_serie`,
  ADD KEY `idx_insumo_etiqueta` (`etiqueta`);
