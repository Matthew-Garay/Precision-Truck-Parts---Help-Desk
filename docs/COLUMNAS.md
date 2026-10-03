# Inventario de columnas — `precision_helpdesk`

Generado el 2026-10-01 desde el servidor real.
Tablas: 14

Leyenda: **PK** clave primaria · **FK** llave foránea · **U** único · **M** indexado.
Columna "Uso": si el backend la referencia en alguna consulta.
Columna "Llenado": porcentaje de filas con valor (dato vivo, no estructura).


## `_migraciones`  ·  23 fila(s) ·  2 columna(s)

| # | Columna | Tipo | Nulo | Default | Clave | FK | Índices | Uso | Lleno |
|---|---|---|---|---|---|---|---|---|---|
| 1 | `id` | varchar(100) | no | — | **PK** |  |  | sí | 100% |
| 2 | `ejecutada` | datetime | no | CURRENT_TIMESTAMP |  |  |  | **no** | 100% |

## `categoria`  ·  16 fila(s) ·  5 columna(s)

| # | Columna | Tipo | Nulo | Default | Clave | FK | Índices | Uso | Lleno |
|---|---|---|---|---|---|---|---|---|---|
| 1 | `id_categoria` | int | no | — | **PK** |  |  | sí | 100% |
| 2 | `nombre_categoria` | varchar(100) | no | — |  |  |  | sí | 100% |
| 3 | `en_tickets` | tinyint(1) | no | 0 |  |  |  | sí | 100% |
| 4 | `en_insumos` | tinyint(1) | no | 0 |  |  |  | sí | 100% |
| 5 | `en_manuales` | tinyint(1) | no | 0 |  |  |  | sí | 100% |

## `departamento`  ·  20 fila(s) ·  2 columna(s)

**Índices:** `uq_nombre_departamento` (único) (nombre_departamento)

| # | Columna | Tipo | Nulo | Default | Clave | FK | Índices | Uso | Lleno |
|---|---|---|---|---|---|---|---|---|---|
| 1 | `id_departamento` | int | no | — | **PK** |  |  | sí | 100% |
| 2 | `nombre_departamento` | varchar(100) | no | — | **U** |  | `uq_nombre_departamento` | sí | 100% |

## `empleado`  ·  30 fila(s) ·  13 columna(s)

**Llaves foráneas:** `id_departamento` → `departamento.id_departamento` · `id_rol` → `rol.id_rol` · `id_sucursal` → `sucursal.id_sucursal`

**Índices:** `fk_empleado_depto` (id_departamento) · `fk_empleado_rol` (id_rol) · `fk_empleado_sucursal` (id_sucursal) · `uq_email` (único) (email) · `uq_num_empleado` (único) (num_empleado)

| # | Columna | Tipo | Nulo | Default | Clave | FK | Índices | Uso | Lleno |
|---|---|---|---|---|---|---|---|---|---|
| 1 | `id_empleado` | int | no | — | **PK** |  |  | sí | 100% |
| 2 | `num_empleado` | varchar(20) | no | — | **U** |  | `uq_num_empleado` | sí | 100% |
| 3 | `nombre` | varchar(50) | no | — |  |  |  | sí | 100% |
| 4 | `ap_paterno` | varchar(50) | no | — |  |  |  | sí | 100% |
| 5 | `ap_materno` | varchar(50) | sí | — |  |  |  | sí | 100% |
| 6 | `email` | varchar(100) | no | — | **U** |  | `uq_email` | sí | 100% |
| 7 | `password` | varchar(255) | no | — |  |  |  | sí | 100% |
| 8 | `foto` | varchar(255) | sí | — |  |  |  | sí | 7% |
| 9 | `estatus` | enum('Activo','Inactivo') | no | Activo |  |  |  | sí | 100% |
| 10 | `id_rol` | int | no | — | M | → `rol` | `fk_empleado_rol` | sí | 100% |
| 11 | `id_departamento` | int | no | — | M | → `departamento` | `fk_empleado_depto` | sí | 100% |
| 12 | `id_sucursal` | int | sí | — | M | → `sucursal` | `fk_empleado_sucursal` | sí | 100% |
| 13 | `token_version` | int | no | 0 |  |  |  | sí | 100% |

## `historial_acceso`  ·  78 fila(s) ·  4 columna(s)

**Llaves foráneas:** `id_empleado` → `empleado.id_empleado`

**Índices:** `fk_historial_empleado` (id_empleado)

| # | Columna | Tipo | Nulo | Default | Clave | FK | Índices | Uso | Lleno |
|---|---|---|---|---|---|---|---|---|---|
| 1 | `id_acceso` | int | no | — | **PK** |  |  | sí | 100% |
| 2 | `id_empleado` | int | no | — | M | → `empleado` | `fk_historial_empleado` | sí | 100% |
| 3 | `fecha_entrada` | timestamp | sí | CURRENT_TIMESTAMP |  |  |  | sí | 100% |
| 4 | `fecha_salida` | timestamp | sí | — |  |  |  | sí | 100% |

## `insumo`  ·  57 fila(s) ·  10 columna(s)

**Llaves foráneas:** `id_categoria` → `categoria.id_categoria`

**Índices:** `fk_insumo_categoria` (id_categoria)

| # | Columna | Tipo | Nulo | Default | Clave | FK | Índices | Uso | Lleno |
|---|---|---|---|---|---|---|---|---|---|
| 1 | `id_insumo` | int | no | — | **PK** |  |  | sí | 100% |
| 2 | `num_serie` | varchar(100) | sí | — |  |  |  | sí | 100% |
| 3 | `nombre` | varchar(150) | no | — |  |  |  | sí | 100% |
| 4 | `descripcion` | text | sí | — |  |  |  | sí | 100% |
| 5 | `marca` | varchar(100) | sí | — |  |  |  | sí | 100% |
| 6 | `modelo` | varchar(100) | sí | — |  |  |  | sí | 100% |
| 7 | `stock` | int | no | 0 |  |  |  | sí | 100% |
| 8 | `estado` | enum('Excelente','Bueno','Regular','Malo') | sí | — |  |  |  | sí | 100% |
| 9 | `id_categoria` | int | no | — | M | → `categoria` | `fk_insumo_categoria` | sí | 100% |
| 10 | `imagen_url` | varchar(255) | sí | — |  |  |  | sí | 100% |

## `manual`  ·  5 fila(s) ·  9 columna(s)

**Llaves foráneas:** `id_categoria` → `categoria.id_categoria` · `subido_por` → `empleado.id_empleado`

**Índices:** `fk_manual_empleado` (subido_por) · `idx_manual_categoria` (id_categoria)

| # | Columna | Tipo | Nulo | Default | Clave | FK | Índices | Uso | Lleno |
|---|---|---|---|---|---|---|---|---|---|
| 1 | `id_manual` | int unsigned | no | — | **PK** |  |  | sí | 100% |
| 2 | `nombre` | varchar(150) | no | — |  |  |  | sí | 100% |
| 3 | `descripcion` | text | sí | — |  |  |  | sí | 100% |
| 4 | `version` | varchar(20) | sí | — |  |  |  | sí | 0% |
| 5 | `subido_por` | int | sí | — | M | → `empleado` | `fk_manual_empleado` | **no** | 0% |
| 6 | `fecha_subida` | timestamp | sí | CURRENT_TIMESTAMP |  |  |  | sí | 100% |
| 7 | `fecha_cambio` | timestamp | sí | CURRENT_TIMESTAMP |  |  |  | sí | 100% |
| 8 | `ruta_pdf` | varchar(255) | no | — |  |  |  | sí | 100% |
| 9 | `id_categoria` | int | no | — | M | → `categoria` | `idx_manual_categoria` | sí | 100% |

## `movimiento_inventario`  ·  4 fila(s) ·  12 columna(s)

**Llaves foráneas:** `id_empleado` → `empleado.id_empleado` · `id_insumo` → `insumo.id_insumo` · `id_solicitud` → `solicitud.id_solicitud` · `id_sucursal_destino` → `sucursal.id_sucursal` · `id_sucursal_origen` → `sucursal.id_sucursal`

**Índices:** `fk_mi_empleado` (id_empleado) · `fk_mi_suc_dest` (id_sucursal_destino) · `fk_mi_suc_origen` (id_sucursal_origen) · `idx_mi_insumo_fecha` (id_insumo,fecha) · `idx_mi_solicitud` (id_solicitud) · `idx_mi_tipo_fecha` (tipo,fecha)

| # | Columna | Tipo | Nulo | Default | Clave | FK | Índices | Uso | Lleno |
|---|---|---|---|---|---|---|---|---|---|
| 1 | `id_movimiento` | int | no | — | **PK** |  |  | sí | 100% |
| 2 | `id_insumo` | int | no | — | M | → `insumo` | `idx_mi_insumo_fecha` | sí | 100% |
| 3 | `tipo` | enum('Entrada','Salida','Ajuste') | no | — | M |  | `idx_mi_tipo_fecha` | sí | 100% |
| 4 | `cantidad` | int | no | — |  |  |  | sí | 100% |
| 5 | `stock_anterior` | int | no | 0 |  |  |  | sí | 100% |
| 6 | `stock_nuevo` | int | no | 0 |  |  |  | sí | 100% |
| 7 | `id_sucursal_origen` | int | sí | — | M | → `sucursal` | `fk_mi_suc_origen` | sí | 25% |
| 8 | `id_sucursal_destino` | int | sí | — | M | → `sucursal` | `fk_mi_suc_dest` | sí | 100% |
| 9 | `id_solicitud` | int | sí | — | M | → `solicitud` | `idx_mi_solicitud` | sí | 25% |
| 10 | `id_empleado` | int | sí | — | M | → `empleado` | `fk_mi_empleado` | sí | 100% |
| 11 | `motivo` | varchar(500) | sí | — |  |  |  | sí | 100% |
| 12 | `fecha` | datetime | no | CURRENT_TIMESTAMP |  |  | `idx_mi_insumo_fecha`, `idx_mi_tipo_fecha` | sí | 100% |

## `rol`  ·  2 fila(s) ·  2 columna(s)

**Índices:** `uq_nombre_rol` (único) (nombre_rol)

| # | Columna | Tipo | Nulo | Default | Clave | FK | Índices | Uso | Lleno |
|---|---|---|---|---|---|---|---|---|---|
| 1 | `id_rol` | int | no | — | **PK** |  |  | sí | 100% |
| 2 | `nombre_rol` | varchar(50) | no | — | **U** |  | `uq_nombre_rol` | sí | 100% |

## `solicitud`  ·  34 fila(s) ·  9 columna(s)

**Llaves foráneas:** `id_sucursal_destino` → `sucursal.id_sucursal` · `id_sucursal_origen` → `sucursal.id_sucursal` · `id_empleado` → `empleado.id_empleado`

**Índices:** `fk_sol_empleado` (id_empleado) · `fk_solicitud_sucursal_destino` (id_sucursal_destino) · `idx_solicitud_empleado` (id_empleado) · `idx_solicitud_estatus_fecha` (estatus,fecha) · `idx_solicitud_ruta` (id_sucursal_origen,id_sucursal_destino) · `uq_folio` (único) (folio_solicitud)

| # | Columna | Tipo | Nulo | Default | Clave | FK | Índices | Uso | Lleno |
|---|---|---|---|---|---|---|---|---|---|
| 1 | `id_solicitud` | int | no | — | **PK** |  |  | sí | 100% |
| 2 | `folio_solicitud` | varchar(20) | no | — | **U** |  | `uq_folio` | sí | 100% |
| 3 | `fecha` | timestamp | no | CURRENT_TIMESTAMP |  |  | `idx_solicitud_estatus_fecha` | sí | 100% |
| 4 | `estatus` | enum('En proceso','Aceptado','Rechazado','Pendiente','Resuelto','No Resuelto') | no | En proceso | M |  | `idx_solicitud_estatus_fecha` | sí | 100% |
| 5 | `prioridad` | enum('Baja','Media','Alta','Urgente') | no | Media |  |  |  | sí | 100% |
| 6 | `id_empleado` | int | no | — | M | → `empleado` | `fk_sol_empleado`, `idx_solicitud_empleado` | sí | 100% |
| 7 | `id_sucursal_origen` | int | sí | — | M | → `sucursal` | `idx_solicitud_ruta` | sí | 3% |
| 8 | `id_sucursal_destino` | int | sí | — | M | → `sucursal` | `fk_solicitud_sucursal_destino`, `idx_solicitud_ruta` | sí | 3% |
| 9 | `fecha_atencion` | datetime | sí | — |  |  |  | sí | 3% |

## `solicitud_insumo`  ·  67 fila(s) ·  7 columna(s)

**Llaves foráneas:** `id_insumo` → `insumo.id_insumo` · `id_solicitud` → `solicitud.id_solicitud`

**Índices:** `fk_si_insumo` (id_insumo) · `fk_si_solicitud` (id_solicitud)

| # | Columna | Tipo | Nulo | Default | Clave | FK | Índices | Uso | Lleno |
|---|---|---|---|---|---|---|---|---|---|
| 1 | `id_solicitud_insumo` | int | no | — | **PK** |  |  | sí | 100% |
| 2 | `id_solicitud` | int | no | — | M | → `solicitud` | `fk_si_solicitud` | sí | 100% |
| 3 | `id_insumo` | int | no | — | M | → `insumo` | `fk_si_insumo` | sí | 100% |
| 4 | `descripcion` | text | sí | — |  |  |  | sí | 100% |
| 5 | `cantidad` | int | no | 1 |  |  |  | sí | 100% |
| 6 | `cantidad_aprobada` | int | sí | — |  |  |  | sí | 1% |
| 7 | `aprobado` | tinyint(1) | sí | — |  |  |  | sí | 75% |

## `sucursal`  ·  15 fila(s) ·  2 columna(s)

**Índices:** `uq_nombre_sucursal` (único) (nombre_sucursal)

| # | Columna | Tipo | Nulo | Default | Clave | FK | Índices | Uso | Lleno |
|---|---|---|---|---|---|---|---|---|---|
| 1 | `id_sucursal` | int | no | — | **PK** |  |  | sí | 100% |
| 2 | `nombre_sucursal` | varchar(100) | no | — | **U** |  | `uq_nombre_sucursal` | sí | 100% |

## `ticket`  ·  73 fila(s) ·  13 columna(s)

**Llaves foráneas:** `id_categoria` → `categoria.id_categoria` · `id_empleado` → `empleado.id_empleado` · `id_tecnico` → `empleado.id_empleado`

**Índices:** `fk_ticket_categoria` (id_categoria) · `fk_ticket_empleado` (id_empleado) · `fk_ticket_tecnico` (id_tecnico) · `idx_ticket_empleado_estatus` (id_empleado,estatus) · `idx_ticket_estatus_fecha` (estatus,fecha_subido) · `uq_folio_ticket` (único) (folio_ticket)

| # | Columna | Tipo | Nulo | Default | Clave | FK | Índices | Uso | Lleno |
|---|---|---|---|---|---|---|---|---|---|
| 1 | `id_ticket` | int | no | — | **PK** |  |  | sí | 100% |
| 2 | `folio_ticket` | varchar(20) | no | — | **U** |  | `uq_folio_ticket` | sí | 100% |
| 3 | `titulo` | varchar(150) | no | — |  |  |  | sí | 100% |
| 4 | `descripcion` | text | no | — |  |  |  | sí | 100% |
| 5 | `fecha_subido` | timestamp | sí | CURRENT_TIMESTAMP |  |  | `idx_ticket_estatus_fecha` | sí | 100% |
| 6 | `fecha_resuelto` | timestamp | sí | — |  |  |  | sí | 99% |
| 7 | `estatus` | enum('En proceso','Resuelto','No Resuelto','Cancelado') | no | En proceso | M |  | `idx_ticket_empleado_estatus`, `idx_ticket_estatus_fecha` | sí | 100% |
| 8 | `prioridad` | enum('Baja','Media','Alta','Urgente') | no | Media |  |  |  | sí | 100% |
| 9 | `comentarios` | text | sí | — |  |  |  | sí | 90% |
| 10 | `id_empleado` | int | no | — | M | → `empleado` | `fk_ticket_empleado`, `idx_ticket_empleado_estatus` | sí | 100% |
| 11 | `id_categoria` | int | no | — | M | → `categoria` | `fk_ticket_categoria` | sí | 100% |
| 12 | `id_tecnico` | int | sí | — | M | → `empleado` | `fk_ticket_tecnico` | sí | 90% |
| 13 | `calificacion` | tinyint | sí | — |  |  |  | sí | 89% |

## `ticket_historial`  ·  0 fila(s) ·  7 columna(s)

**Índices:** `idx_th_fecha` (fecha) · `idx_th_ticket` (id_ticket)

| # | Columna | Tipo | Nulo | Default | Clave | FK | Índices | Uso | Lleno |
|---|---|---|---|---|---|---|---|---|---|
| 1 | `id_historial` | int unsigned | no | — | **PK** |  |  | sí | — |
| 2 | `id_ticket` | int unsigned | no | — | M |  | `idx_th_ticket` | sí | — |
| 3 | `id_empleado` | int unsigned | no | — |  |  |  | sí | — |
| 4 | `campo_cambiado` | varchar(60) | no | — |  |  |  | sí | — |
| 5 | `valor_anterior` | text | sí | — |  |  |  | sí | — |
| 6 | `valor_nuevo` | text | sí | — |  |  |  | sí | — |
| 7 | `fecha` | datetime | no | CURRENT_TIMESTAMP | M |  | `idx_th_fecha` | sí | — |

---

**Total de columnas: 97**

### Columnas sin referencia en el backend

- `_migraciones.ejecutada`
- `manual.subido_por`
