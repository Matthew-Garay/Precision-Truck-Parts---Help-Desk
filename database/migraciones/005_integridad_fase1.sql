-- 005_integridad_fase1.sql
-- Fase 1 de docs/normalizacion-bd.md: reglas de integridad, índices y el
-- disparador que mantiene el kardex igual a su salida. NO cambia datos ni la
-- forma de las tablas que usa la aplicación (los datos ya cumplían todo).
--
--   1. FK de columnas que entran en un CHECK → RESTRICT (MySQL no admite CHECK
--      sobre columnas con acción referencial; las PK nunca cambian y los
--      empleados no se borran, así que no se pierde nada).
--   2. Reglas CHECK y UNIQUE.
--   3. Índices: se agregan los de reportes e indicadores y se quitan los duplicados.
--   4. Disparador trg_salida_sincroniza_kardex.
--
-- Aplicar UNA vez (con el cliente mysql, que entiende DELIMITER):
--   mysql -u root -p precision_helpdesk < database/migraciones/005_integridad_fase1.sql

-- ── 1. Claves foráneas a RESTRICT ───────────────────────────────────────────
ALTER TABLE solicitud
  DROP FOREIGN KEY fk_solicitud_sucursal_origen,
  DROP FOREIGN KEY fk_solicitud_sucursal_destino;
ALTER TABLE solicitud
  ADD CONSTRAINT fk_solicitud_sucursal_origen  FOREIGN KEY (id_sucursal_origen)  REFERENCES sucursal (id_sucursal) ON DELETE RESTRICT ON UPDATE RESTRICT,
  ADD CONSTRAINT fk_solicitud_sucursal_destino FOREIGN KEY (id_sucursal_destino) REFERENCES sucursal (id_sucursal) ON DELETE RESTRICT ON UPDATE RESTRICT;

ALTER TABLE salida_interna
  DROP FOREIGN KEY fk_sal_suc_origen,
  DROP FOREIGN KEY fk_sal_suc_destino,
  DROP FOREIGN KEY fk_sal_solicitante,
  DROP FOREIGN KEY fk_sal_responsable;
ALTER TABLE salida_interna
  ADD CONSTRAINT fk_sal_suc_origen  FOREIGN KEY (id_sucursal_origen)  REFERENCES sucursal (id_sucursal) ON DELETE RESTRICT ON UPDATE RESTRICT,
  ADD CONSTRAINT fk_sal_suc_destino FOREIGN KEY (id_sucursal_destino) REFERENCES sucursal (id_sucursal) ON DELETE RESTRICT ON UPDATE RESTRICT,
  ADD CONSTRAINT fk_sal_solicitante FOREIGN KEY (id_solicitante)      REFERENCES empleado (id_empleado) ON DELETE RESTRICT ON UPDATE RESTRICT,
  ADD CONSTRAINT fk_sal_responsable FOREIGN KEY (id_responsable)      REFERENCES empleado (id_empleado) ON DELETE RESTRICT ON UPDATE RESTRICT;

ALTER TABLE movimiento_inventario
  DROP FOREIGN KEY fk_mi_solicitud,
  DROP FOREIGN KEY fk_mi_salida;
ALTER TABLE movimiento_inventario
  ADD CONSTRAINT fk_mi_solicitud FOREIGN KEY (id_solicitud) REFERENCES solicitud (id_solicitud)      ON DELETE RESTRICT ON UPDATE RESTRICT,
  ADD CONSTRAINT fk_mi_salida    FOREIGN KEY (id_salida)    REFERENCES salida_interna (id_salida)  ON DELETE RESTRICT ON UPDATE RESTRICT;

-- ── 2. Reglas CHECK y UNIQUE ─────────────────────────────────────────────────
ALTER TABLE ticket
  ADD CONSTRAINT chk_ticket_calif         CHECK (calificacion IS NULL OR calificacion BETWEEN 1 AND 5),
  ADD CONSTRAINT chk_ticket_calif_estatus CHECK (calificacion IS NULL OR estatus = 'Resuelto'),
  ADD CONSTRAINT chk_ticket_cierre        CHECK (fecha_resuelto IS NULL OR fecha_resuelto >= fecha_subido);

ALTER TABLE solicitud
  ADD CONSTRAINT chk_sol_ruta     CHECK (id_sucursal_origen IS NULL OR id_sucursal_destino IS NULL OR id_sucursal_origen <> id_sucursal_destino),
  ADD CONSTRAINT chk_sol_atencion CHECK ((estatus = 'En proceso') = (fecha_atencion IS NULL));

ALTER TABLE solicitud_insumo
  ADD UNIQUE KEY uq_si_solicitud_insumo (id_solicitud, id_insumo),
  ADD CONSTRAINT chk_si_cantidad CHECK (cantidad > 0),
  ADD CONSTRAINT chk_si_aprobada CHECK (cantidad_aprobada IS NULL OR (cantidad_aprobada >= 0 AND cantidad_aprobada <= cantidad));
-- El UNIQUE (id_solicitud, id_insumo) ya sirve a la FK de id_solicitud.
ALTER TABLE solicitud_insumo DROP KEY fk_si_solicitud;

ALTER TABLE salida_interna
  ADD CONSTRAINT chk_sal_destino     CHECK (id_sucursal_destino IS NULL OR destino_texto IS NULL),
  ADD CONSTRAINT chk_sal_solicitante CHECK (id_solicitante IS NULL OR solicitante_texto IS NULL),
  ADD CONSTRAINT chk_sal_responsable CHECK (id_responsable IS NULL OR responsable_texto IS NULL),
  ADD CONSTRAINT chk_sal_ruta        CHECK (id_sucursal_origen IS NULL OR id_sucursal_destino IS NULL OR id_sucursal_origen <> id_sucursal_destino);

ALTER TABLE movimiento_inventario
  ADD CONSTRAINT chk_mi_cantidad   CHECK (cantidad > 0),
  ADD CONSTRAINT chk_mi_origen_doc CHECK (id_solicitud IS NULL OR id_salida IS NULL),
  ADD CONSTRAINT chk_mi_aritmetica CHECK (
       (tipo = 'Entrada' AND stock_nuevo = stock_anterior + cantidad)
    OR (tipo = 'Salida'  AND stock_nuevo = stock_anterior - cantidad)
    OR (tipo = 'Ajuste'));

ALTER TABLE empleado
  ADD CONSTRAINT chk_emp_baja CHECK ((eliminado = 0 AND fecha_eliminacion IS NULL) OR (eliminado = 1 AND fecha_eliminacion IS NOT NULL));

ALTER TABLE historial_acceso
  ADD CONSTRAINT chk_acceso_fechas CHECK (fecha_salida IS NULL OR fecha_entrada IS NULL OR fecha_salida >= fecha_entrada);

ALTER TABLE categoria
  ADD UNIQUE KEY uq_nombre_categoria (nombre_categoria);

-- ── 3. Índices ───────────────────────────────────────────────────────────────
-- Indicadores mensuales (tiempo de resolución y tickets por categoría).
ALTER TABLE ticket
  ADD KEY idx_ticket_resuelto (fecha_resuelto),
  ADD KEY idx_ticket_categoria_fecha (id_categoria, fecha_subido);
ALTER TABLE ticket DROP KEY fk_ticket_categoria;

-- Consumo por sucursal destino.
ALTER TABLE movimiento_inventario ADD KEY idx_mi_destino_fecha (id_sucursal_destino, fecha);
ALTER TABLE movimiento_inventario DROP KEY fk_mi_suc_dest;
ALTER TABLE salida_interna ADD KEY idx_salida_destino_fecha (id_sucursal_destino, fecha);
ALTER TABLE salida_interna DROP KEY fk_sal_suc_destino;

-- Duplicados: (id_empleado, fecha) y (id_empleado, fecha_entrada) ya cubren la FK.
ALTER TABLE solicitud DROP KEY fk_sol_empleado, DROP KEY idx_solicitud_empleado;
ALTER TABLE historial_acceso DROP KEY fk_historial_empleado;

-- ── 4. Disparador ────────────────────────────────────────────────────────────
-- Si se corrige la fecha o la ruta de una salida, sus renglones de SALIDA en el
-- kardex cambian igual (fecha y sucursales están repetidas a propósito ahí).
DROP TRIGGER IF EXISTS trg_salida_sincroniza_kardex;
DELIMITER //
CREATE TRIGGER trg_salida_sincroniza_kardex
AFTER UPDATE ON salida_interna
FOR EACH ROW
BEGIN
  IF NOT (NEW.fecha <=> OLD.fecha)
     OR NOT (NEW.id_sucursal_origen <=> OLD.id_sucursal_origen)
     OR NOT (NEW.id_sucursal_destino <=> OLD.id_sucursal_destino) THEN
    UPDATE movimiento_inventario
       SET fecha = NEW.fecha,
           id_sucursal_origen = NEW.id_sucursal_origen,
           id_sucursal_destino = NEW.id_sucursal_destino
     WHERE id_salida = NEW.id_salida AND tipo = 'Salida';
  END IF;
END//
DELIMITER ;
