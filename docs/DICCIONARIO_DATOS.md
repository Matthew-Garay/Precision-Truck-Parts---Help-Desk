# Diccionario de Datos — PrecisionTrucks HelpDesk

**Base de datos:** `precision_helpdesk`  
**Motor:** MySQL 8.x · InnoDB · utf8mb4_unicode_ci  
**Total de tablas:** 11

---

## Índice de tablas

1. [categoria](#1-categoria)
2. [departamento](#2-departamento)
3. [rol](#3-rol)
4. [sucursal](#4-sucursal)
5. [empleado](#5-empleado)
6. [historial_acceso](#6-historial_acceso)
7. [insumo](#7-insumo)
8. [manual](#8-manual)
9. [solicitud](#9-solicitud)
10. [solicitud_insumo](#10-solicitud_insumo)
11. [ticket](#11-ticket)

---

## 1. `categoria`

Catálogo compartido que clasifica tickets, insumos y manuales. Un mismo registro puede pertenecer a uno o más contextos mediante las banderas booleanas.

| Columna           | Tipo           | Nulo | Default | Descripción                                      |
|-------------------|----------------|------|---------|--------------------------------------------------|
| `id_categoria`    | INT (PK, AI)   | NO   | —       | Identificador único de la categoría              |
| `nombre_categoria`| VARCHAR(100)   | NO   | —       | Nombre descriptivo de la categoría               |
| `en_tickets`      | TINYINT(1)     | NO   | 0       | 1 = disponible para clasificar tickets           |
| `en_insumos`      | TINYINT(1)     | NO   | 0       | 1 = disponible para clasificar insumos           |
| `en_manuales`     | TINYINT(1)     | NO   | 0       | 1 = disponible para clasificar manuales PDF      |

**Índices:** `PRIMARY KEY (id_categoria)`

**Relaciones:** Referenciada por `insumo`, `manual` y `ticket` (ON DELETE RESTRICT).

**Reglas de negocio:**
- Al menos una de las tres banderas (`en_tickets`, `en_insumos`, `en_manuales`) debe estar en 1 para que la categoría sea útil.
- No se puede eliminar una categoría si tiene insumos, manuales o tickets asociados.
- El nombre debe ser único en la práctica (no hay constraint UNIQUE, se controla desde la aplicación).

---

## 2. `departamento`

Catálogo de áreas organizacionales de la empresa. Cada empleado pertenece a un departamento.

| Columna               | Tipo         | Nulo | Default | Descripción                          |
|-----------------------|--------------|------|---------|--------------------------------------|
| `id_departamento`     | INT (PK, AI) | NO   | —       | Identificador único del departamento |
| `nombre_departamento` | VARCHAR(100) | NO   | —       | Nombre del área (único en la tabla)  |

**Índices:** `PRIMARY KEY (id_departamento)`, `UNIQUE (nombre_departamento)`

**Relaciones:** Referenciada por `empleado.id_departamento` (ON DELETE RESTRICT).

**Reglas de negocio:**
- El nombre del departamento es único; no se permiten duplicados.
- No se puede eliminar un departamento si tiene empleados asignados.
- Gestionado exclusivamente por administradores.

---

## 3. `rol`

Catálogo de roles del sistema. Define el nivel de acceso de cada empleado.

| Columna     | Tipo         | Nulo | Default | Descripción                    |
|-------------|--------------|------|---------|--------------------------------|
| `id_rol`    | INT (PK, AI) | NO   | —       | Identificador único del rol    |
| `nombre_rol`| VARCHAR(50)  | NO   | —       | Nombre del rol (único)         |

**Índices:** `PRIMARY KEY (id_rol)`, `UNIQUE (nombre_rol)`

**Valores semilla:**

| id_rol | nombre_rol      | Capacidades                                                        |
|--------|-----------------|--------------------------------------------------------------------|
| 1      | Administrador   | Gestión completa: tickets, inventario, personal, manuales, reportes |
| 2      | Usuario         | Crear tickets, solicitar insumos, ver historial propio, manuales   |

**Reglas de negocio:**
- Solo existen dos roles en el sistema; no se crean roles adicionales desde la UI.
- No se puede eliminar un rol si tiene empleados asignados.
- El rol determina qué rutas de la API son accesibles (middleware `requireAdmin` verifica `id_rol = 1`).

---

## 4. `sucursal`

Catálogo de ubicaciones físicas de la empresa. Asignación opcional por empleado.

| Columna           | Tipo         | Nulo | Default | Descripción                      |
|-------------------|--------------|------|---------|----------------------------------|
| `id_sucursal`     | INT (PK, AI) | NO   | —       | Identificador único de sucursal  |
| `nombre_sucursal` | VARCHAR(100) | NO   | —       | Nombre de la sucursal (único)    |

**Índices:** `PRIMARY KEY (id_sucursal)`, `UNIQUE (nombre_sucursal)`

**Relaciones:** Referenciada por `empleado.id_sucursal` (ON DELETE RESTRICT).

**Reglas de negocio:**
- El nombre de la sucursal es único.
- La asignación de sucursal a un empleado es opcional (`NULL` permitido).
- No se puede eliminar una sucursal si tiene empleados asignados.

---

## 5. `empleado`

Usuarios del sistema. Almacena credenciales, datos personales y referencias a catálogos.

| Columna          | Tipo                        | Nulo | Default  | Descripción                                         |
|------------------|-----------------------------|------|----------|-----------------------------------------------------|
| `id_empleado`    | INT (PK, AI)                | NO   | —        | Identificador único del empleado                    |
| `num_empleado`   | VARCHAR(20)                 | NO   | —        | Número de nómina (único)                            |
| `nombre`         | VARCHAR(50)                 | NO   | —        | Nombre(s) del empleado                              |
| `ap_paterno`     | VARCHAR(50)                 | NO   | —        | Apellido paterno                                    |
| `ap_materno`     | VARCHAR(50)                 | SÍ   | NULL     | Apellido materno (opcional)                         |
| `email`          | VARCHAR(100)                | NO   | —        | Correo electrónico (único, usado para login)        |
| `password`       | VARCHAR(255)                | NO   | —        | Hash bcrypt (12 rounds) de la contraseña            |
| `foto`           | VARCHAR(255)                | SÍ   | NULL     | Nombre de archivo del avatar en `storage/Fotos de Perfil/` |
| `estatus`        | ENUM('Activo','Inactivo')   | NO   | 'Activo' | Estado de la cuenta                                 |
| `id_rol`         | INT (FK → rol)              | NO   | —        | Rol asignado (1=Admin, 2=Usuario)                   |
| `id_departamento`| INT (FK → departamento)     | NO   | —        | Área organizacional del empleado                    |
| `id_sucursal`    | INT (FK → sucursal)         | SÍ   | NULL     | Sucursal asignada (opcional)                        |

**Índices:** `PRIMARY KEY (id_empleado)`, `UNIQUE (email)`, `UNIQUE (num_empleado)`, índices en FK.

**Relaciones:**
- `id_rol` → `rol.id_rol` (RESTRICT / CASCADE)
- `id_departamento` → `departamento.id_departamento` (RESTRICT / CASCADE)
- `id_sucursal` → `sucursal.id_sucursal` (RESTRICT / CASCADE)
- Referenciada por `historial_acceso`, `ticket` (empleado y técnico) y `solicitud`.

**Reglas de negocio:**
- El `email` y `num_empleado` son únicos en todo el sistema.
- La contraseña nunca se almacena en texto plano; siempre se hashea con bcrypt (12 rounds) antes de insertar o actualizar.
- Un empleado con `estatus = 'Inactivo'` no puede iniciar sesión.
- Solo un administrador puede crear, editar o desactivar empleados.
- La foto de perfil se almacena en `storage/Fotos de Perfil/`; la columna guarda solo el nombre del archivo.
- No se elimina físicamente a los empleados; se cambia el estatus a `'Inactivo'` para preservar el historial de tickets y solicitudes.

---

## 6. `historial_acceso`

Registro de cada sesión iniciada y cerrada por un empleado.

| Columna        | Tipo                  | Nulo | Default           | Descripción                                      |
|----------------|-----------------------|------|-------------------|--------------------------------------------------|
| `id_acceso`    | INT (PK, AI)          | NO   | —                 | Identificador único del registro de acceso       |
| `id_empleado`  | INT (FK → empleado)   | NO   | —                 | Empleado que inició sesión                       |
| `fecha_entrada`| TIMESTAMP             | SÍ   | CURRENT_TIMESTAMP | Fecha y hora de login                            |
| `fecha_salida` | TIMESTAMP             | SÍ   | NULL              | Fecha y hora de logout (NULL = sesión activa)    |

**Índices:** `PRIMARY KEY (id_acceso)`, índice en `id_empleado`.

**Relaciones:** `id_empleado` → `empleado.id_empleado` (ON DELETE CASCADE / ON UPDATE CASCADE).

**Reglas de negocio:**
- Se crea un registro en cada login exitoso; `fecha_salida` se actualiza al hacer logout.
- `fecha_salida = NULL` indica sesión activa.
- El worker `scheduledJobs.js` cierra automáticamente sesiones huérfanas (sin `fecha_salida`) con más de 12 horas de antigüedad.
- Al eliminar un empleado, todos sus registros de acceso se eliminan en cascada (ON DELETE CASCADE).
- Los administradores pueden consultar el historial global; los usuarios solo el propio.

---

## 7. `insumo`

Inventario de materiales y equipos disponibles para solicitar.

| Columna       | Tipo                                        | Nulo | Default | Descripción                                              |
|---------------|---------------------------------------------|------|---------|----------------------------------------------------------|
| `id_insumo`   | INT (PK, AI)                                | NO   | —       | Identificador único del insumo                           |
| `num_serie`   | VARCHAR(100)                                | SÍ   | NULL    | Número de serie del artículo (opcional)                  |
| `nombre`      | VARCHAR(150)                                | NO   | —       | Nombre del insumo                                        |
| `descripcion` | TEXT                                        | SÍ   | NULL    | Descripción detallada del insumo                         |
| `marca`       | VARCHAR(100)                                | SÍ   | NULL    | Marca del fabricante                                     |
| `modelo`      | VARCHAR(100)                                | SÍ   | NULL    | Modelo del artículo                                      |
| `stock`       | INT                                         | NO   | 0       | Cantidad disponible en inventario (≥ 0)                  |
| `estado`      | ENUM('Excelente','Bueno','Regular','Malo')  | SÍ   | NULL    | Condición física del insumo                              |
| `id_categoria`| INT (FK → categoria)                        | NO   | —       | Categoría del insumo                                     |
| `proveedor`   | VARCHAR(255)                                | SÍ   | NULL    | Nombre o datos del proveedor                             |
| `imagen_url`  | VARCHAR(255)                                | SÍ   | NULL    | Nombre de archivo de la imagen en `storage/Insumos/`     |

**Índices:** `PRIMARY KEY (id_insumo)`, índice en `id_categoria`.

**Constraints:** `CHECK (stock >= 0)` — el stock nunca puede ser negativo.

**Relaciones:**
- `id_categoria` → `categoria.id_categoria` (RESTRICT / CASCADE)
- Referenciada por `solicitud_insumo.id_insumo` (RESTRICT).

**Reglas de negocio:**
- El stock se descuenta automáticamente al aprobar ítems de una solicitud (`PATCH /solicitudes/:id/items`).
- Si el stock llega a ≤ 5 unidades, el worker emite el evento Socket.io `insumo:stock_critico` a la sala `admins`.
- Solo los administradores pueden crear, editar o eliminar insumos.
- No se puede eliminar un insumo si tiene ítems en solicitudes existentes (RESTRICT).
- La imagen se almacena en `storage/Insumos/`; la columna guarda solo el nombre del archivo.
- El endpoint `GET /solicitudes/insumos` filtra solo insumos con `stock > 0`.

---

## 8. `manual`

Registros de documentos PDF del módulo de gestión documental.

| Columna        | Tipo                    | Nulo | Default                          | Descripción                                          |
|----------------|-------------------------|------|----------------------------------|------------------------------------------------------|
| `id_manual`    | INT UNSIGNED (PK, AI)   | NO   | —                                | Identificador único del manual                       |
| `nombre`       | VARCHAR(150)            | NO   | —                                | Título del manual                                    |
| `descripcion`  | TEXT                    | SÍ   | NULL                             | Descripción o resumen del contenido                  |
| `fecha_subida` | TIMESTAMP               | SÍ   | CURRENT_TIMESTAMP                | Fecha en que se subió el archivo                     |
| `fecha_cambio` | TIMESTAMP               | SÍ   | CURRENT_TIMESTAMP ON UPDATE NOW  | Última modificación de metadatos                     |
| `ruta_pdf`     | VARCHAR(255)            | NO   | —                                | Nombre de archivo del PDF en `storage/Manuales/`     |
| `id_categoria` | INT (FK → categoria)    | NO   | —                                | Categoría del manual                                 |

**Índices:** `PRIMARY KEY (id_manual)`, `INDEX (id_categoria)`.

**Relaciones:** `id_categoria` → `categoria.id_categoria` (RESTRICT / CASCADE).

**Reglas de negocio:**
- Solo los administradores pueden subir, editar o eliminar manuales.
- Al eliminar un manual, el archivo PDF físico en `storage/Manuales/` también se elimina del servidor.
- Todos los empleados autenticados pueden consultar y descargar manuales (solo lectura).
- La ruta del PDF se protege con `safeResolvePath()` para prevenir path traversal.
- `fecha_cambio` se actualiza automáticamente por MySQL al modificar cualquier campo.

---

## 9. `solicitud`

Cabecera de cada solicitud de insumos realizada por un empleado.

| Columna           | Tipo                                        | Nulo | Default           | Descripción                                              |
|-------------------|---------------------------------------------|------|-------------------|----------------------------------------------------------|
| `id_solicitud`    | INT (PK, AI)                                | NO   | —                 | Identificador único de la solicitud                      |
| `folio_solicitud` | VARCHAR(20)                                 | NO   | —                 | Folio único con formato `SOL-YYYYMM-NNN`                 |
| `fecha`           | TIMESTAMP                                   | NO   | CURRENT_TIMESTAMP | Fecha y hora de creación                                 |
| `estatus`         | ENUM('En proceso','Aceptado','Rechazado')   | NO   | 'En proceso'      | Estado actual de la solicitud                            |
| `prioridad`       | ENUM('Baja','Media','Alta','Urgente')        | NO   | 'Media'           | Nivel de urgencia declarado por el solicitante           |
| `id_empleado`     | INT (FK → empleado)                         | NO   | —                 | Empleado que realizó la solicitud                        |

**Índices:** `PRIMARY KEY (id_solicitud)`, `UNIQUE (folio_solicitud)`, índices compuestos en `(estatus, fecha)` y `(id_empleado)`.

**Relaciones:**
- `id_empleado` → `empleado.id_empleado` (RESTRICT / CASCADE)
- Referenciada por `solicitud_insumo.id_solicitud` (CASCADE).

**Reglas de negocio:**
- El folio `SOL-YYYYMM-NNN` se genera con bloqueo `FOR UPDATE` para evitar duplicados bajo concurrencia.
- El estatus solo puede avanzar; no se regresa de `'Aceptado'` o `'Rechazado'` a `'En proceso'`.
- Al cambiar el estatus a `'Aceptado'`, el stock de los insumos aprobados se descuenta automáticamente.
- Rate limiting: máximo 20 solicitudes por hora por IP.
- Los usuarios solo pueden ver sus propias solicitudes; los administradores ven todas.
- Al eliminar una solicitud, sus ítems (`solicitud_insumo`) se eliminan en cascada.

---

## 10. `solicitud_insumo`

Tabla de unión que detalla los ítems (insumos y cantidades) de cada solicitud.

| Columna               | Tipo                  | Nulo | Default | Descripción                                                  |
|-----------------------|-----------------------|------|---------|--------------------------------------------------------------|
| `id_solicitud_insumo` | INT (PK, AI)          | NO   | —       | Identificador único del ítem                                 |
| `id_solicitud`        | INT (FK → solicitud)  | NO   | —       | Solicitud a la que pertenece el ítem                         |
| `id_insumo`           | INT (FK → insumo)     | NO   | —       | Insumo solicitado                                            |
| `descripcion`         | TEXT                  | SÍ   | NULL    | Justificación o nota adicional del ítem                      |
| `cantidad`            | INT                   | NO   | 1       | Cantidad solicitada del insumo                               |
| `aprobado`            | TINYINT(1)            | SÍ   | NULL    | NULL=pendiente · 1=aprobado · 0=rechazado (por ítem)         |

**Índices:** `PRIMARY KEY (id_solicitud_insumo)`, índices en `id_solicitud` e `id_insumo`.

**Relaciones:**
- `id_solicitud` → `solicitud.id_solicitud` (ON DELETE CASCADE)
- `id_insumo` → `insumo.id_insumo` (ON DELETE RESTRICT)

**Reglas de negocio:**
- La aprobación es granular: cada ítem puede aprobarse o rechazarse de forma independiente (`PATCH /solicitudes/:id/items`).
- Al aprobar un ítem (`aprobado = 1`), el `stock` del insumo correspondiente se decrementa en `cantidad`.
- No se puede aprobar un ítem si el stock disponible es menor a la cantidad solicitada.
- No se puede eliminar un insumo si tiene ítems en solicitudes (RESTRICT).
- Al eliminar la solicitud padre, todos sus ítems se eliminan en cascada (CASCADE).

---

## 11. `ticket`

Incidencias técnicas reportadas por los empleados. Núcleo del módulo HelpDesk.

| Columna         | Tipo                                                    | Nulo | Default           | Descripción                                                    |
|-----------------|---------------------------------------------------------|------|-------------------|----------------------------------------------------------------|
| `id_ticket`     | INT (PK, AI)                                            | NO   | —                 | Identificador único del ticket                                 |
| `folio_ticket`  | VARCHAR(20)                                             | NO   | —                 | Folio único con formato `PTP-YYYYMM-NNN`                       |
| `titulo`        | VARCHAR(150)                                            | NO   | —                 | Título breve de la incidencia                                  |
| `descripcion`   | TEXT                                                    | NO   | —                 | Descripción detallada del problema                             |
| `fecha_subido`  | TIMESTAMP                                               | SÍ   | CURRENT_TIMESTAMP | Fecha y hora de creación del ticket                            |
| `fecha_resuelto`| TIMESTAMP                                               | SÍ   | NULL              | Fecha y hora en que se marcó como resuelto                     |
| `estatus`       | ENUM('En proceso','Resuelto','No Resuelto','Cancelado') | NO   | 'En proceso'      | Estado actual del ticket                                       |
| `prioridad`     | ENUM('Baja','Media','Alta','Urgente')                   | NO   | 'Media'           | Nivel de urgencia del ticket                                   |
| `comentarios`   | TEXT                                                    | SÍ   | NULL              | Notas del técnico o administrador sobre la resolución          |
| `id_empleado`   | INT (FK → empleado)                                     | NO   | —                 | Empleado que reportó la incidencia                             |
| `id_categoria`  | INT (FK → categoria)                                    | NO   | —                 | Categoría técnica del ticket                                   |
| `id_tecnico`    | INT (FK → empleado)                                     | SÍ   | NULL              | Administrador/técnico asignado (NULL = sin atender)            |
| `calificacion`  | TINYINT                                                 | SÍ   | NULL              | Calificación del usuario al cierre (1–5 estrellas)             |

**Índices:** `PRIMARY KEY (id_ticket)`, `UNIQUE (folio_ticket)`, índices en `id_empleado`, `id_categoria`, `id_tecnico`.

**Relaciones:**
- `id_empleado` → `empleado.id_empleado` (RESTRICT / CASCADE)
- `id_categoria` → `categoria.id_categoria` (RESTRICT / CASCADE)
- `id_tecnico` → `empleado.id_empleado` (RESTRICT / CASCADE) — autorreferencia a la misma tabla

**Reglas de negocio:**
- El folio `PTP-YYYYMM-NNN` se genera con bloqueo `FOR UPDATE` para garantizar unicidad bajo concurrencia.
- SLA de 48 horas: el worker revisa cada hora y cierra como `'No Resuelto'` los tickets con más de 48h en `'En proceso'`.
- A las 46.5h se emite el evento `ticket:sla_warning` a la sala `admins` como advertencia previa.
- Tickets con más de 24h sin `id_tecnico` asignado emiten el evento `ticket:sin_atender`.
- La calificación (1–5) solo puede registrarse cuando el estatus es `'Resuelto'` y solo por el empleado dueño del ticket.
- Un ticket solo puede editarse mientras su estatus sea `'En proceso'`.
- Rate limiting: máximo 30 tickets por hora por IP.
- Las evidencias (imágenes) se almacenan en `storage/Evidencias_Tickets/{folio_ticket}/` y se gestionan por endpoints separados (máx. 8 por ticket).
- `id_tecnico` y `id_empleado` apuntan a la misma tabla `empleado`; MySQL los distingue por nombre de constraint (`fk_ticket_empleado` y `fk_ticket_tecnico`).

---

## Diagrama de relaciones (resumen)

```
rol ──────────────────────────────────────────────────────────────────┐
departamento ─────────────────────────────────────────────────────────┤
sucursal ─────────────────────────────────────────────────────────────┤
                                                                       ▼
                                                                   empleado
                                                                  /    |    \
                                              historial_acceso ◄─┘    │     └─► ticket (como técnico)
                                                                       │
                                                              solicitud│    ticket
                                                                  │    │      │
                                                       solicitud_insumo│   (evidencias en storage/)
                                                                  │    │
categoria ◄──────────────────────────────────────────────────────┘────┘
    │
    ├──► insumo
    └──► manual
```

---

*Última actualización: generado automáticamente desde `schema.sql`*
