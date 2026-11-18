-- 002_empleado_eliminado.sql
-- Borrado LÓGICO de empleados: "Eliminar" en Personal no borra la fila.
-- El empleado deja de aparecer en Personal y en las listas para elegir, pero
-- su registro y todo su historial (tickets, solicitudes, salidas, accesos)
-- se conservan. Se guarda quién lo eliminó y cuándo.
--
-- Aplicar UNA vez:  mysql -u root -p precision_helpdesk < database/migraciones/002_empleado_eliminado.sql

ALTER TABLE `empleado`
  ADD COLUMN `eliminado` tinyint(1) NOT NULL DEFAULT 0,
  ADD COLUMN `fecha_eliminacion` datetime DEFAULT NULL,
  ADD COLUMN `id_elimino` int DEFAULT NULL COMMENT 'Administrador que lo eliminó',
  ADD KEY `idx_empleado_eliminado` (`eliminado`),
  ADD CONSTRAINT `fk_emp_elimino` FOREIGN KEY (`id_elimino`) REFERENCES `empleado` (`id_empleado`) ON DELETE SET NULL ON UPDATE CASCADE;
