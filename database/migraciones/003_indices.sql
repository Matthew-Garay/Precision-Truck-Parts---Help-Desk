-- =============================================================================
--  003_indices.sql  —  PrecisionTrucks HelpDesk
-- =============================================================================
--  Índices para las consultas más frecuentes. Solo se agregan los que NO están
--  ya cubiertos por una PRIMARY/UNIQUE KEY o por el índice que MySQL crea para
--  cada llave foránea.
-- =============================================================================

-- Catálogo de insumos para solicitudes: WHERE activo = 1 AND visible_publico = 1 AND stock > 0
ALTER TABLE insumo           ADD INDEX idx_insumo_catalogo (activo, visible_publico, stock);
-- Historial de solicitudes por empleado, más recientes primero
ALTER TABLE solicitud        ADD INDEX idx_solicitud_empleado_fecha (id_empleado, fecha);
-- Rendimiento de técnicos y tickets asignados por estatus
ALTER TABLE ticket           ADD INDEX idx_ticket_tecnico_estatus (id_tecnico, estatus);
-- Bitácora de accesos por empleado y fecha
ALTER TABLE historial_acceso ADD INDEX idx_acceso_empleado_fecha (id_empleado, fecha_entrada);

SELECT 'Migración 003 aplicada' AS resultado;
