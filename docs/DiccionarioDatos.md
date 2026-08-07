# Diccionario de Datos — Precision Truck Parts, Parts and Accesories, S.A de C.V. HelpDesk

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

| Columna | Tipo | Nulo | Default | Descripción |
|-------------------|----------------|------|---------|--------------------------------------------------|
| `id_categoria` | INT (PK, AI) | NO | — | Identificador único de la categoría |
| `nombre_categoria`| VARCHAR(100) | NO | — | Nombre descriptivo de la categoría |
| `en_tickets` | TINYINT(1) | NO | 0 | 1 = disponible para clasificar tickets |
| `en_insumos` | TINYINT(1) | NO | 0 | 1 = disponible para clasificar insumos |
| `en_manuales` | TINYINT(1) | NO | 0 | 1 = disponible para clasificar manuales PDF |

**Índices:** `PRIMARY KEY (id_categoria)`

**Relaciones:** Referenciada por `insumo`, `manual` y `ticket` (ON DELETE RESTRICT).

**Reglas de negocio:**
- Al menos una de las tres banderas (`en_tickets`, `en_insumos`, `en_manuales`) debe estar en 1 para que la categoría sea útil.
- No se puede eliminar una categoría si tiene insumos, manuales o tickets asociados.
- El nombre debe ser único en la práctica (no hay constraint UNIQUE, se controla desde la aplicación).

---

## 2. `departamento`

Catálogo de áreas organizacionales de la empresa. Cada empleado pertenece a un departamento.

| Columna | Tipo | Nulo | Default | Descripción |
|-----------------------|--------------|------|---------|--------------------------------------|
| `id_departamento` | INT (PK, AI) | NO | — | Identificador único del departamento |
| `nombre_departamento` | VARCHAR(100) | NO | — | Nombre del área (único en la tabla) |

**Índices:** `PRIMARY KEY (id_departamento)`, `UNIQUE (nombre_departamento)`

**Relaciones:** Referenciada por `empleado.id_departamento` (ON DELETE RESTRICT).

**Reglas de negocio:**
- El nombre del departamento es único; no se permiten duplicados.
- No se puede eliminar un departamento si tiene empleados asignados.
- Gestionado exclusivamente por administradores.

---

## 3. `rol`

Catálogo de roles del sistema. Define el nivel de acceso de cada empleado.

| Columna | Tipo | Nulo | Default | Descripción |
|-------------|--------------|------|---------|--------------------------------|
| `id_rol` | INT (PK, AI) | NO | — | Identificador único del rol |
| `nombre_rol`| VARCHAR(50) | NO | — | Nombre del rol (único) |

**Índices:** `PRIMARY KEY (id_rol)`, `UNIQUE (nombre_rol)`

**Valores semilla:**

| id_rol | nombre_rol | Capacidades |
|--------|-----------------|--------------------------------------------------------------------|
| 1 | Administrador | Gestión completa: tickets, inventario, personal, manuales, reportes |
| 2 | Usuario | Crear tickets, solicitar insumos, ver historial propio, manuales |

**Reglas de negocio:**
- Solo existen dos roles en el sistema; no se crean roles adicionales desde la UI.
- No se puede eliminar un rol si tiene empleados asignados.
- El rol determina qué rutas de la API son accesibles (middleware `requireAdmin` verifica `id_rol = 1`).

---

## 4. `sucursal`

Catálogo de ubicaciones físicas de la empresa. Asignación opcional por empleado.

| Columna | Tipo | Nulo | Default | Descripción |
|-------------------|--------------|------|---------|----------------------------------|
| `id_sucursal` | INT (PK, AI) | NO | — | Identificador único de sucursal |
| `nombre_sucursal` | VARCHAR(100) | NO | — | Nombre de la sucursal (único) |

**Índices:** `PRIMARY KEY (id_sucursal)`, `UNIQUE (nombre_sucursal)`

**Relaciones:** Referenciada por `empleado.id_sucursal` (ON DELETE RESTRICT).

**Reglas de negocio:**
- El nombre de la sucursal es único.
- La asignación de sucursal a un empleado es opcional (`NULL` permitido).
- No se puede eliminar una sucursal si tiene empleados asignados.

---

## 5. `empleado`

Usuarios del sistema. Almacena credenciales, datos personales y referencias a catálogos.

| Columna | Tipo | Nulo | Default | Descripción |
|------------------|-----------------------------|------|----------|-----------------------------------------------------|
| `id_empleado` | INT (PK, AI) | NO | — | Identificador único del empleado |
| `num_empleado` | VARCHAR(20) | NO | — | Número de nómina (único) |
| `nombre` | VARCHAR(50) | NO | — | Nombre(s) del empleado |
| `ap_paterno` | VARCHAR(50) | NO | — | Apellido paterno |
| `ap_materno` | VARCHAR(50) | SÍ | NULL | Apellido materno (opcional) |
| `email` | VARCHAR(100) | NO | — | Correo electrónico (único, usado para login) |
| `password` | VARCHAR(255) | NO | — | Hash bcrypt (12 rounds) de la contraseña |
| `foto` | VARCHAR(255) | SÍ | NULL | Nombre de archivo del avatar en `storage/Fotos de Perfil/` |
| `estatus` | ENUM('Activo','Inactivo') | NO | 'Activo' | Estado de la cuenta |
| `id_rol` | INT (FK -> rol) | NO | — | Rol asignado (1=Admin, 2=Usuario) |
| `id_departamento`| INT (FK -> departamento) | NO | — | Área organizacional del empleado |
| `id_sucursal` | INT (FK -> sucursal) | SÍ | NULL | Sucursal asignada (opcional) |

**Índices:** `PRIMARY KEY (id_empleado)`, `UNIQUE (email)`, `UNIQUE (num_empleado)`, índices en FK.

**Relaciones:**
- `id_rol` -> `rol.id_rol` (RESTRICT / CASCADE)
- `id_departamento` -> `departamento.id_departamento` (RESTRICT / CASCADE)
- `id_sucursal` -> `sucursal.id_sucursal` (RESTRICT / CASCADE)
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

| Columna | Tipo | Nulo | Default | Descripción |
|----------------|-----------------------|------|-------------------|--------------------------------------------------|
| `id_acceso` | INT (PK, AI) | NO | — | Identificador único del registro de acceso |
| `id_empleado` | INT (FK -> empleado) | NO | — | Empleado que inició sesión |
| `fecha_entrada`| TIMESTAMP | SÍ | CURRENT_TIMESTAMP | Fecha y hora de login |
| `fecha_salida` | TIMESTAMP | SÍ | NULL | Fecha y hora de logout (NULL = sesión activa) |

**Índices:** `PRIMARY KEY (id_acceso)`, índice en `id_empleado`.

**Relaciones:** `id_empleado` -> `empleado.id_empleado` (ON DELETE CASCADE / ON UPDATE CASCADE).

**Reglas de negocio:**
- Se crea un registro en cada login exitoso; `fecha_salida` se actualiza al hacer logout.
- `fecha_salida = NULL` indica sesión activa.
- El worker `scheduledJobs.js` cierra automáticamente sesiones huérfanas (sin `fecha_salida`) con más de 12 horas de antigüedad.
- Al eliminar un empleado, todos sus registros de acceso se eliminan en cascada (ON DELETE CASCADE).
- Los administradores pueden consultar el historial global; los usuarios solo el propio.

---

## 7. `insumo`

Inventario de materiales y equipos disponibles para solicitar.

| Columna | Tipo | Nulo | Default | Descripción |
|---------------|---------------------------------------------|------|---------|----------------------------------------------------------|
| `id_insumo` | INT (PK, AI) | NO | — | Identificador único del insumo |
| `num_serie` | VARCHAR(100) | SÍ | NULL | Número de serie del artículo (opcional) |
| `nombre` | VARCHAR(150) | NO | — | Nombre del insumo |
| `descripcion` | TEXT | SÍ | NULL | Descripción detallada del insumo |
| `marca` | VARCHAR(100) | SÍ | NULL | Marca del fabricante |
| `modelo` | VARCHAR(100) | SÍ | NULL | Modelo del artículo |
| `stock` | INT | NO | 0 | Cantidad disponible en inventario (≥ 0) |
| `estado` | ENUM('Excelente','Bueno','Regular','Malo') | SÍ | NULL | Condición física del insumo |
| `id_categoria`| INT (FK -> categoria) | NO | — | Categoría del insumo |
| `proveedor` | VARCHAR(255) | SÍ | NULL | Nombre o datos del proveedor |
| `imagen_url` | VARCHAR(255) | SÍ | NULL | Nombre de archivo de la imagen en `storage/Insumos/` |

**Índices:** `PRIMARY KEY (id_insumo)`, índice en `id_categoria`.

**Constraints:** `CHECK (stock >= 0)` — el stock nunca puede ser negativo.

**Relaciones:**
- `id_categoria` -> `categoria.id_categoria` (RESTRICT / CASCADE)
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

| Columna | Tipo | Nulo | Default | Descripción |
|----------------|-------------------------|------|----------------------------------|------------------------------------------------------|
| `id_manual` | INT UNSIGNED (PK, AI) | NO | — | Identificador único del manual |
| `nombre` | VARCHAR(150) | NO | — | Título del manual |
| `descripcion` | TEXT | SÍ | NULL | Descripción o resumen del contenido |
| `fecha_subida` | TIMESTAMP | SÍ | CURRENT_TIMESTAMP | Fecha en que se subió el archivo |
| `fecha_cambio` | TIMESTAMP | SÍ | CURRENT_TIMESTAMP ON UPDATE NOW | Última modificación de metadatos |
| `ruta_pdf` | VARCHAR(255) | NO | — | Nombre de archivo del PDF en `storage/Manuales/` |
| `id_categoria` | INT (FK -> categoria) | NO | — | Categoría del manual |

**Índices:** `PRIMARY KEY (id_manual)`, `INDEX (id_categoria)`.

**Relaciones:** `id_categoria` -> `categoria.id_categoria` (RESTRICT / CASCADE).

**Reglas de negocio:**
- Solo los administradores pueden subir, editar o eliminar manuales.
- Al eliminar un manual, el archivo PDF físico en `storage/Manuales/` también se elimina del servidor.
- Todos los empleados autenticados pueden consultar y descargar manuales (solo lectura).
- La ruta del PDF se protege con `safeResolvePath()` para prevenir path traversal.
- `fecha_cambio` se actualiza automáticamente por MySQL al modificar cualquier campo.

---

## 9. `solicitud`

Cabecera de cada solicitud de insumos realizada por un empleado.

| Columna | Tipo | Nulo | Default | Descripción |
|-------------------|---------------------------------------------|------|-------------------|----------------------------------------------------------|
| `id_solicitud` | INT (PK, AI) | NO | — | Identificador único de la solicitud |
| `folio_solicitud` | VARCHAR(20) | NO | — | Folio único con formato `SOL-YYYYMM-NNN` |
| `fecha` | TIMESTAMP | NO | CURRENT_TIMESTAMP | Fecha y hora de creación |
| `estatus` | ENUM('En proceso','Aceptado','Rechazado') | NO | 'En proceso' | Estado actual de la solicitud |
| `prioridad` | ENUM('Baja','Media','Alta','Urgente') | NO | 'Media' | Nivel de urgencia declarado por el solicitante |
| `id_empleado` | INT (FK -> empleado) | NO | — | Empleado que realizó la solicitud |

**Índices:** `PRIMARY KEY (id_solicitud)`, `UNIQUE (folio_solicitud)`, índices compuestos en `(estatus, fecha)` y `(id_empleado)`.

**Relaciones:**
- `id_empleado` -> `empleado.id_empleado` (RESTRICT / CASCADE)
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

| Columna | Tipo | Nulo | Default | Descripción |
|-----------------------|-----------------------|------|---------|--------------------------------------------------------------|
| `id_solicitud_insumo` | INT (PK, AI) | NO | — | Identificador único del ítem |
| `id_solicitud` | INT (FK -> solicitud) | NO | — | Solicitud a la que pertenece el ítem |
| `id_insumo` | INT (FK -> insumo) | NO | — | Insumo solicitado |
| `descripcion` | TEXT | SÍ | NULL | Justificación o nota adicional del ítem |
| `cantidad` | INT | NO | 1 | Cantidad solicitada del insumo |
| `aprobado` | TINYINT(1) | SÍ | NULL | NULL=pendiente · 1=aprobado · 0=rechazado (por ítem) |

**Índices:** `PRIMARY KEY (id_solicitud_insumo)`, índices en `id_solicitud` e `id_insumo`.

**Relaciones:**
- `id_solicitud` -> `solicitud.id_solicitud` (ON DELETE CASCADE)
- `id_insumo` -> `insumo.id_insumo` (ON DELETE RESTRICT)

**Reglas de negocio:**
- La aprobación es granular: cada ítem puede aprobarse o rechazarse de forma independiente (`PATCH /solicitudes/:id/items`).
- Al aprobar un ítem (`aprobado = 1`), el `stock` del insumo correspondiente se decrementa en `cantidad`.
- No se puede aprobar un ítem si el stock disponible es menor a la cantidad solicitada.
- No se puede eliminar un insumo si tiene ítems en solicitudes (RESTRICT).
- Al eliminar la solicitud padre, todos sus ítems se eliminan en cascada (CASCADE).

---

## 11. `ticket`

Incidencias técnicas reportadas por los empleados. Núcleo del módulo HelpDesk.

| Columna | Tipo | Nulo | Default | Descripción |
|-----------------|---------------------------------------------------------|------|-------------------|----------------------------------------------------------------|
| `id_ticket` | INT (PK, AI) | NO | — | Identificador único del ticket |
| `folio_ticket` | VARCHAR(20) | NO | — | Folio único con formato `PTP-YYYYMM-NNN` |
| `titulo` | VARCHAR(150) | NO | — | Título breve de la incidencia |
| `descripcion` | TEXT | NO | — | Descripción detallada del problema |
| `fecha_subido` | TIMESTAMP | SÍ | CURRENT_TIMESTAMP | Fecha y hora de creación del ticket |
| `fecha_resuelto`| TIMESTAMP | SÍ | NULL | Fecha y hora en que se marcó como resuelto |
| `estatus` | ENUM('En proceso','Resuelto','No Resuelto','Cancelado') | NO | 'En proceso' | Estado actual del ticket |
| `prioridad` | ENUM('Baja','Media','Alta','Urgente') | NO | 'Media' | Nivel de urgencia del ticket |
| `comentarios` | TEXT | SÍ | NULL | Notas del técnico o administrador sobre la resolución |
| `id_empleado` | INT (FK -> empleado) | NO | — | Empleado que reportó la incidencia |
| `id_categoria` | INT (FK -> categoria) | NO | — | Categoría técnica del ticket |
| `id_tecnico` | INT (FK -> empleado) | SÍ | NULL | Administrador/técnico asignado (NULL = sin atender) |
| `calificacion` | TINYINT | SÍ | NULL | Calificación del usuario al cierre (1–5 estrellas) |

**Índices:** `PRIMARY KEY (id_ticket)`, `UNIQUE (folio_ticket)`, índices en `id_empleado`, `id_categoria`, `id_tecnico`.

**Relaciones:**
- `id_empleado` -> `empleado.id_empleado` (RESTRICT / CASCADE)
- `id_categoria` -> `categoria.id_categoria` (RESTRICT / CASCADE)
- `id_tecnico` -> `empleado.id_empleado` (RESTRICT / CASCADE) — autorreferencia a la misma tabla

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
rol ----
departamento ----
sucursal ----

 empleado
 / | \
 historial_acceso ---- | ---- ticket (como técnico)
 |
 solicitud| ticket
 | | |
 solicitud_insumo| (evidencias en storage/)
 | |
categoria --------
 |
 |-- insumo
 `-- manual
```

---

## Normalización de la base de datos

La base de datos `precision_helpdesk` fue diseñada siguiendo rigurosamente las tres primeras formas normales del modelo relacional: Primera Forma Normal (1FN), Segunda Forma Normal (2FN) y Tercera Forma Normal (3FN). Estas formas normales constituyen un conjunto de reglas formales cuyo propósito es organizar los datos en tablas relacionales de manera que se eliminen redundancias, se prevengan anomalías de inserción, actualización y eliminación, y se garantice la integridad de la información a lo largo del tiempo. Aplicar estas reglas no es un ejercicio académico: cada decisión de normalización tiene un impacto directo en la consistencia de los datos, en la facilidad de mantenimiento del esquema y en la confiabilidad del sistema ante cambios futuros. A continuación se explica en detalle cómo cada forma normal se aplica al esquema, qué decisiones concretas de diseño la respaldan y por qué esas decisiones son correctas desde el punto de vista relacional.

---

### Primera Forma Normal (1FN) — Atomicidad de los datos

Una tabla se encuentra en Primera Forma Normal cuando satisface tres condiciones de manera simultánea: cada columna contiene únicamente valores atómicos (es decir, indivisibles, que no pueden descomponerse en partes más pequeñas con significado propio dentro del modelo), no existen grupos de columnas repetidas que representen el mismo tipo de dato (por ejemplo, `insumo_1`, `insumo_2`, `insumo_3`), y cada fila puede identificarse de forma única mediante una clave primaria. La violación más común de 1FN ocurre cuando se almacenan listas de valores en una sola celda —como una cadena `"tornillo, cable, foco"`— o cuando se crean columnas numeradas para representar una colección de elementos relacionados, lo que hace imposible consultar, filtrar o actualizar esos elementos de forma individual sin recurrir a manipulación de cadenas.

En el esquema `precision_helpdesk` la 1FN se cumple de manera consistente en todas las tablas. El caso más ilustrativo es la relación entre solicitudes e insumos. Una solicitud de materiales puede incluir varios insumos distintos, cada uno con su propia cantidad y su propio estado de aprobación. Un diseño que violara 1FN podría almacenar todos esos insumos en una columna de texto separada por comas, o crear columnas `id_insumo_1`, `cantidad_1`, `id_insumo_2`, `cantidad_2`, etc. En cambio, el esquema resuelve esta relación con la tabla de unión `solicitud_insumo`, donde cada fila representa exactamente un ítem: un insumo específico dentro de una solicitud específica, con su propia `cantidad` y su propio valor de `aprobado`. Esto garantiza que cada celda de la tabla contiene un único valor atómico y que agregar un nuevo ítem a una solicitud solo requiere insertar una nueva fila, sin modificar la estructura de ninguna columna existente ni parsear cadenas de texto.

De manera similar, las evidencias fotográficas de los tickets no se almacenan como una lista de nombres de archivo en una columna de texto dentro de la tabla `ticket`. Los archivos se guardan físicamente en el sistema de archivos bajo `storage/Evidencias_Tickets/{folio_ticket}/` y se gestionan a través de endpoints REST dedicados (`GET|POST|DELETE /tickets/:id/imagenes`). Esto respeta 1FN porque la tabla `ticket` no contiene ningún campo multivaluado; cada columna describe exactamente un atributo atómico de la incidencia. Si en el futuro se necesitara consultar cuántas evidencias tiene un ticket, o filtrar tickets por tipo de imagen, esa información puede obtenerse directamente del sistema de archivos o de una tabla de metadatos, sin necesidad de parsear ninguna cadena.

El historial de sesiones de los empleados sigue el mismo principio. En lugar de almacenar las fechas de acceso como una lista dentro de la tabla `empleado`, cada sesión ocupa su propia fila en la tabla `historial_acceso`, con su `fecha_entrada` y `fecha_salida` individuales. Así, un empleado con diez sesiones registradas tiene diez filas en `historial_acceso`, no una fila en `empleado` con diez fechas concatenadas. Esto permite consultar, filtrar y agregar el historial de accesos con SQL estándar, sin ningún procesamiento adicional en la capa de aplicación.

Las columnas de tipo `ENUM` utilizadas en `estatus` y `prioridad` —tanto en `ticket` como en `solicitud`— también contribuyen a 1FN al restringir el dominio de valores posibles a un conjunto finito y bien definido. Esto impide que se almacenen valores ambiguos, compuestos o inconsistentes en esas columnas, reforzando la atomicidad a nivel de dominio de datos. Finalmente, todas las tablas del esquema cuentan con una columna `id_*` de tipo `INT AUTO_INCREMENT` declarada como `PRIMARY KEY`, lo que garantiza la identificación única de cada fila de forma independiente al contenido de los demás campos.

---

### Segunda Forma Normal (2FN) — Eliminación de dependencias parciales

Una tabla se encuentra en Segunda Forma Normal cuando ya cumple 1FN y, adicionalmente, todos sus atributos no clave dependen funcionalmente de la clave primaria **completa** y no de una parte de ella. Esta forma normal cobra especial relevancia en tablas cuya clave primaria está compuesta por dos o más columnas: si un atributo depende solo de una de esas columnas y no de la combinación completa, existe una dependencia parcial que viola 2FN y que debe resolverse extrayendo ese atributo a una tabla separada. Las dependencias parciales son problemáticas porque introducen redundancia: el mismo dato aparece repetido en múltiples filas, y una actualización inconsistente de ese dato en solo algunas de ellas produce información contradictoria en la base de datos.

En el esquema `precision_helpdesk` la 2FN se garantiza principalmente a través de dos decisiones de diseño. La primera es el uso exclusivo de claves primarias simples (de una sola columna) en todas las tablas. Al no existir ninguna clave primaria compuesta en el esquema, la posibilidad de dependencias parciales queda eliminada por construcción: si la clave primaria es una sola columna, no hay "parte de la clave" de la que un atributo pueda depender parcialmente. Tablas como `empleado`, `ticket`, `solicitud`, `insumo`, `manual`, `historial_acceso` y todas las tablas catálogo (`rol`, `departamento`, `sucursal`, `categoria`) utilizan un identificador entero autoincremental como única clave primaria, lo que hace que todos sus atributos dependan necesariamente de ese identificador completo.

La segunda decisión, y la más relevante para 2FN, es el diseño de la tabla `solicitud_insumo`. Esta tabla representa la relación muchos-a-muchos entre solicitudes e insumos: una solicitud puede incluir varios insumos, y un mismo insumo puede aparecer en varias solicitudes. Un diseño alternativo podría haber usado una clave primaria compuesta `(id_solicitud, id_insumo)`, lo que habría requerido verificar cuidadosamente que atributos como `cantidad` y `aprobado` dependieran de la combinación completa y no de uno solo de los componentes. En el esquema actual, la tabla `solicitud_insumo` tiene su propia clave primaria simple `id_solicitud_insumo`, y tanto `id_solicitud` como `id_insumo` son claves foráneas. Los atributos `cantidad`, `aprobado` y `descripcion` describen características del ítem concreto —cuántas unidades de ese insumo se pidieron en esa solicitud, si ese ítem fue aprobado o no—, por lo que dependen del ítem completo y no de la solicitud o del insumo por separado. La cantidad solicitada de un tornillo en la solicitud SOL-202501-001 no puede derivarse conociendo solo la solicitud ni solo el insumo; solo tiene sentido en la intersección de ambos, y el diseño lo refleja correctamente.

La separación de los catálogos `rol`, `departamento`, `sucursal` y `categoria` en tablas independientes también contribuye a 2FN. Si los datos de estos catálogos se almacenaran directamente en `empleado` o `ticket` —por ejemplo, guardando `nombre_departamento` como columna de `empleado`—, se generaría redundancia: el mismo nombre de departamento aparecería repetido en cada fila de empleado que pertenezca a ese departamento. Al extraer esos datos a tablas propias y referenciarlos mediante claves foráneas, cada atributo descriptivo de un catálogo existe en un único lugar y depende exclusivamente de la clave primaria de su propia tabla, sin posibilidad de dependencias parciales.

---

### Tercera Forma Normal (3FN) — Eliminación de dependencias transitivas

Una tabla se encuentra en Tercera Forma Normal cuando ya cumple 2FN y, además, ningún atributo no clave depende funcionalmente de otro atributo no clave. Dicho de otra manera, no deben existir dependencias transitivas de la forma `atributo_A -> atributo_B -> clave_primaria`, donde tanto `atributo_A` como `atributo_B` son columnas no clave. Cuando esto ocurre, `atributo_A` no depende directamente de la clave primaria de la tabla, sino que lo hace de forma indirecta a través de `atributo_B`, lo que introduce redundancia y anomalías de actualización: si el valor de `atributo_B` cambia, todos los registros que contengan el valor derivado de `atributo_A` deben actualizarse manualmente, con riesgo real de inconsistencias si alguna fila queda sin actualizar.

En el esquema `precision_helpdesk` la 3FN se cumple de forma sistemática en todas las tablas principales. La tabla `empleado` es el ejemplo más claro. Un empleado tiene asignado un rol, un departamento y opcionalmente una sucursal. En lugar de almacenar directamente los nombres de estos elementos (`nombre_rol`, `nombre_departamento`, `nombre_sucursal`) como columnas de `empleado`, el esquema almacena únicamente las claves foráneas `id_rol`, `id_departamento` e `id_sucursal`. Si se almacenara `nombre_rol` en `empleado`, existiría la dependencia transitiva `nombre_rol -> id_rol -> id_empleado`: el nombre del rol no dependería del empleado en sí, sino del rol que tiene asignado. Esto significaría que si el nombre del rol "Administrador" cambiara a "Administrador del Sistema", habría que actualizar esa cadena en cada fila de `empleado` que tuviera ese rol, con alto riesgo de inconsistencia si alguna fila quedara desactualizada. Al guardar solo `id_rol` y obtener el nombre mediante JOIN, el cambio se realiza en un único registro de la tabla `rol` y se propaga automáticamente a todas las consultas sin ningún riesgo de datos contradictorios.

La tabla `ticket` aplica el mismo principio en dos relaciones distintas. La categoría del ticket se referencia mediante `id_categoria` (FK a `categoria`), sin almacenar `nombre_categoria` dentro del ticket. El técnico asignado se referencia mediante `id_tecnico` (FK a `empleado`), sin almacenar el nombre del técnico en la tabla `ticket`. Si se guardara `nombre_tecnico` en `ticket`, existiría la dependencia transitiva `nombre_tecnico -> id_tecnico -> id_ticket`: el nombre del técnico no es un atributo del ticket, sino del empleado que actúa como técnico. Cualquier cambio en el nombre del empleado —por ejemplo, una corrección ortográfica o un cambio de apellido— requeriría actualizar todos los tickets que ese técnico tenga asignados, con riesgo de inconsistencia entre registros. Con el diseño actual, el nombre se obtiene siempre en tiempo de consulta mediante JOIN, garantizando que la información sea siempre consistente con el registro maestro del empleado.

La tabla `insumo` también cumple 3FN. Los atributos `marca`, `modelo`, `descripcion` y `proveedor` describen directamente al insumo y dependen de `id_insumo` sin pasar por ningún atributo intermedio. Se podría argumentar que `marca` podría extraerse a una tabla propia, pero en este dominio la marca es un atributo descriptivo del insumo sin identidad propia ni atributos adicionales que generen dependencias transitivas. No existe ninguna relación del tipo `precio_por_marca -> marca -> id_insumo`; la marca es simplemente un texto descriptivo que depende directamente del insumo. Mantenerla como columna de `insumo` es correcto desde el punto de vista de 3FN y evita una sobre-normalización innecesaria que complicaría las consultas sin aportar beneficios reales de integridad.

Los folios `PTP-YYYYMM-NNN` (en `ticket`) y `SOL-YYYYMM-NNN` (en `solicitud`) merecen una mención especial. Técnicamente, estos folios contienen información derivada: el año y el mes están implícitos en `fecha_subido` y `fecha` respectivamente, por lo que podría argumentarse que existe una dependencia transitiva `folio -> fecha -> id_ticket`. Sin embargo, esta es una excepción deliberada y justificada por requisitos de negocio: los folios son identificadores de comunicación con el usuario (aparecen en correos, reportes y en la interfaz), deben ser estables e inmutables una vez asignados, y su generación con bloqueo `FOR UPDATE` garantiza unicidad bajo alta concurrencia. Persistirlos como columnas `UNIQUE` es una decisión de diseño consciente que prioriza la trazabilidad y la integridad operativa sobre la pureza formal de 3FN, práctica aceptada y documentada en el diseño de bases de datos relacionales para sistemas de producción.

Finalmente, la tabla `historial_acceso` refuerza 3FN al separar completamente el registro de sesiones de la tabla `empleado`. Si las fechas de acceso se almacenaran como columnas de `empleado` (por ejemplo, `ultima_entrada`, `ultima_salida`), solo se podría conservar la sesión más reciente, perdiendo el historial completo. Pero más importante aún desde el punto de vista de normalización: si se almacenaran múltiples fechas en columnas numeradas (`entrada_1`, `salida_1`, `entrada_2`, `salida_2`…), se violaría 1FN. Al tener `historial_acceso` como tabla independiente, cada sesión es una entidad propia con sus atributos (`fecha_entrada`, `fecha_salida`) dependiendo directamente de `id_acceso`, sin ninguna dependencia transitiva ni grupo repetido, y el historial completo de cualquier empleado puede consultarse con una simple query `WHERE id_empleado = ?`.

---