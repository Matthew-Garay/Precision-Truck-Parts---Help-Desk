# Normalización de la Base de Datos — PrecisionTrucks HelpDesk

**Base de datos:** `precision_helpdesk`  
**Motor:** MySQL 8.x · InnoDB  
**Tablas analizadas:** 11

---

## 3.4.2.4.1 Primera Forma Normal (1FN)

Una tabla cumple la **Primera Forma Normal** cuando:

1. Todos los atributos contienen valores **atómicos** (indivisibles).
2. No existen **grupos repetitivos** ni columnas multivaluadas.
3. Cada fila es **única** e identificable mediante una llave primaria.

---

### Análisis por tabla

#### `categoria`

| Columna            | ¿Atómica? | Observación                                      |
|--------------------|-----------|--------------------------------------------------|
| `id_categoria`     | ✅        | Entero único, PK autoincremental                 |
| `nombre_categoria` | ✅        | Cadena simple, un solo valor                     |
| `en_tickets`       | ✅        | Booleano (0/1), valor único                      |
| `en_insumos`       | ✅        | Booleano (0/1), valor único                      |
| `en_manuales`      | ✅        | Booleano (0/1), valor único                      |

**Cumple 1FN.** Las tres banderas booleanas podrían parecer un grupo repetitivo, pero representan contextos distintos e independientes (tickets, insumos, manuales), no una lista de valores del mismo tipo. Cada una es un atributo atómico con semántica propia.

---

#### `departamento`

| Columna               | ¿Atómica? | Observación                        |
|-----------------------|-----------|------------------------------------|
| `id_departamento`     | ✅        | Entero único, PK autoincremental   |
| `nombre_departamento` | ✅        | Cadena simple, un solo valor       |

**Cumple 1FN.** Tabla de catálogo mínima, todos los valores son atómicos.

---

#### `rol`

| Columna      | ¿Atómica? | Observación                      |
|--------------|-----------|----------------------------------|
| `id_rol`     | ✅        | Entero único, PK autoincremental |
| `nombre_rol` | ✅        | Cadena simple, un solo valor     |

**Cumple 1FN.** Tabla de catálogo mínima.

---

#### `sucursal`

| Columna           | ¿Atómica? | Observación                      |
|-------------------|-----------|----------------------------------|
| `id_sucursal`     | ✅        | Entero único, PK autoincremental |
| `nombre_sucursal` | ✅        | Cadena simple, un solo valor     |

**Cumple 1FN.** Tabla de catálogo mínima.

---

#### `empleado`

| Columna           | ¿Atómica? | Observación                                                    |
|-------------------|-----------|----------------------------------------------------------------|
| `id_empleado`     | ✅        | Entero único, PK autoincremental                               |
| `num_empleado`    | ✅        | Código de nómina, valor único e indivisible                    |
| `nombre`          | ✅        | Solo nombre(s), separado de apellidos                          |
| `ap_paterno`      | ✅        | Apellido paterno en columna propia                             |
| `ap_materno`      | ✅        | Apellido materno en columna propia (nullable)                  |
| `email`           | ✅        | Dirección de correo, valor único                               |
| `password`        | ✅        | Hash bcrypt, cadena única                                      |
| `foto`            | ✅        | Nombre de archivo, valor único                                 |
| `estatus`         | ✅        | ENUM con un solo valor por fila                                |
| `id_rol`          | ✅        | FK a `rol`, valor único                                        |
| `id_departamento` | ✅        | FK a `departamento`, valor único                               |
| `id_sucursal`     | ✅        | FK a `sucursal`, valor único (nullable)                        |

**Cumple 1FN.** El nombre completo está correctamente descompuesto en tres columnas atómicas (`nombre`, `ap_paterno`, `ap_materno`), evitando el antipatrón de almacenar "Juan García López" en un solo campo. No hay grupos repetitivos.

---

#### `historial_acceso`

| Columna        | ¿Atómica? | Observación                                  |
|----------------|-----------|----------------------------------------------|
| `id_acceso`    | ✅        | Entero único, PK autoincremental             |
| `id_empleado`  | ✅        | FK a `empleado`, valor único                 |
| `fecha_entrada`| ✅        | Timestamp, valor único por fila              |
| `fecha_salida` | ✅        | Timestamp nullable, valor único por fila     |

**Cumple 1FN.** Cada sesión genera una fila independiente; no se acumulan sesiones en un solo registro.

---

#### `insumo`

| Columna        | ¿Atómica? | Observación                                      |
|----------------|-----------|--------------------------------------------------|
| `id_insumo`    | ✅        | Entero único, PK autoincremental                 |
| `num_serie`    | ✅        | Cadena simple, un solo valor (nullable)          |
| `nombre`       | ✅        | Nombre del artículo, valor único                 |
| `descripcion`  | ✅        | Texto libre, valor único por fila                |
| `marca`        | ✅        | Cadena simple (nullable)                         |
| `modelo`       | ✅        | Cadena simple (nullable)                         |
| `stock`        | ✅        | Entero, valor único                              |
| `estado`       | ✅        | ENUM con un solo valor por fila                  |
| `id_categoria` | ✅        | FK a `categoria`, valor único                    |
| `proveedor`    | ✅        | Cadena simple (nullable)                         |
| `imagen_url`   | ✅        | Nombre de archivo, valor único (nullable)        |

**Cumple 1FN.** Cada insumo tiene una fila única. El stock es un entero simple; los movimientos de inventario se rastrean a través de `solicitud_insumo`, no como un campo multivaluado.

---

#### `manual`

| Columna        | ¿Atómica? | Observación                                  |
|----------------|-----------|----------------------------------------------|
| `id_manual`    | ✅        | Entero único, PK autoincremental             |
| `nombre`       | ✅        | Título del manual, valor único               |
| `descripcion`  | ✅        | Texto libre, valor único por fila            |
| `fecha_subida` | ✅        | Timestamp, valor único                       |
| `fecha_cambio` | ✅        | Timestamp, valor único                       |
| `ruta_pdf`     | ✅        | Nombre de archivo, valor único               |
| `id_categoria` | ✅        | FK a `categoria`, valor único                |

**Cumple 1FN.** Cada manual tiene una fila única con todos los valores atómicos.

---

#### `solicitud`

| Columna           | ¿Atómica? | Observación                                      |
|-------------------|-----------|--------------------------------------------------|
| `id_solicitud`    | ✅        | Entero único, PK autoincremental                 |
| `folio_solicitud` | ✅        | Cadena con formato fijo `SOL-YYYYMM-NNN`         |
| `fecha`           | ✅        | Timestamp, valor único                           |
| `estatus`         | ✅        | ENUM con un solo valor por fila                  |
| `prioridad`       | ✅        | ENUM con un solo valor por fila                  |
| `id_empleado`     | ✅        | FK a `empleado`, valor único                     |

**Cumple 1FN.** Los ítems de la solicitud no se almacenan en esta tabla; se delegan a `solicitud_insumo`, eliminando cualquier grupo repetitivo.

---

#### `solicitud_insumo`

| Columna               | ¿Atómica? | Observación                                      |
|-----------------------|-----------|--------------------------------------------------|
| `id_solicitud_insumo` | ✅        | Entero único, PK autoincremental                 |
| `id_solicitud`        | ✅        | FK a `solicitud`, valor único                    |
| `id_insumo`           | ✅        | FK a `insumo`, valor único                       |
| `descripcion`         | ✅        | Texto libre, valor único por fila                |
| `cantidad`            | ✅        | Entero, valor único                              |
| `aprobado`            | ✅        | TINYINT(1) nullable, valor único por fila        |

**Cumple 1FN.** Esta tabla es precisamente la solución al grupo repetitivo que existiría si los ítems se almacenaran en `solicitud`. Cada ítem ocupa su propia fila.

---

#### `ticket`

| Columna          | ¿Atómica? | Observación                                          |
|------------------|-----------|------------------------------------------------------|
| `id_ticket`      | ✅        | Entero único, PK autoincremental                     |
| `folio_ticket`   | ✅        | Cadena con formato fijo `PTP-YYYYMM-NNN`             |
| `titulo`         | ✅        | Cadena simple, valor único                           |
| `descripcion`    | ✅        | Texto libre, valor único por fila                    |
| `fecha_subido`   | ✅        | Timestamp, valor único                               |
| `fecha_resuelto` | ✅        | Timestamp nullable, valor único                      |
| `estatus`        | ✅        | ENUM con un solo valor por fila                      |
| `prioridad`      | ✅        | ENUM con un solo valor por fila                      |
| `comentarios`    | ✅        | Texto libre, valor único por fila                    |
| `id_empleado`    | ✅        | FK a `empleado`, valor único                         |
| `id_categoria`   | ✅        | FK a `categoria`, valor único                        |
| `id_tecnico`     | ✅        | FK a `empleado`, valor único (nullable)              |
| `calificacion`   | ✅        | TINYINT, valor único (nullable)                      |

**Cumple 1FN.** Las evidencias (imágenes) no se almacenan como lista en esta tabla; se guardan en el sistema de archivos bajo `storage/Evidencias_Tickets/{folio}/`, eliminando cualquier campo multivaluado.

---

### Conclusión 1FN

> **Las 11 tablas de `precision_helpdesk` cumplen la Primera Forma Normal.**  
> Todos los atributos son atómicos, cada tabla tiene llave primaria definida y no existen grupos repetitivos ni columnas multivaluadas.

---

## 3.4.2.4.2 Segunda Forma Normal (2FN)

Una tabla cumple la **Segunda Forma Normal** cuando:

1. Ya cumple la **1FN**.
2. Todos los atributos no clave dependen **completamente** de la llave primaria (no hay dependencias parciales).

> Las dependencias parciales solo son posibles cuando la llave primaria es **compuesta**. Las tablas con PK simple (un solo campo) cumplen 2FN automáticamente si ya cumplen 1FN.

---

### Análisis por tabla

#### Tablas con PK simple — cumplen 2FN automáticamente

Las siguientes tablas tienen PK de un solo atributo (`id_*` autoincremental), por lo que no pueden tener dependencias parciales:

| Tabla              | PK                    | Veredicto |
|--------------------|-----------------------|-----------|
| `categoria`        | `id_categoria`        | ✅ Cumple 2FN |
| `departamento`     | `id_departamento`     | ✅ Cumple 2FN |
| `rol`              | `id_rol`              | ✅ Cumple 2FN |
| `sucursal`         | `id_sucursal`         | ✅ Cumple 2FN |
| `empleado`         | `id_empleado`         | ✅ Cumple 2FN |
| `historial_acceso` | `id_acceso`           | ✅ Cumple 2FN |
| `insumo`           | `id_insumo`           | ✅ Cumple 2FN |
| `manual`           | `id_manual`           | ✅ Cumple 2FN |
| `solicitud`        | `id_solicitud`        | ✅ Cumple 2FN |
| `ticket`           | `id_ticket`           | ✅ Cumple 2FN |

---

#### `solicitud_insumo` — tabla con llave compuesta implícita

Esta es la única tabla donde se debe verificar con mayor cuidado. Aunque su PK formal es `id_solicitud_insumo` (surrogate key simple), su naturaleza es la de una tabla de unión entre `solicitud` e `insumo`. Se analiza si algún atributo depende solo de parte de la relación:

| Atributo      | Depende de `id_solicitud` | Depende de `id_insumo` | Depende de ambos (ítem completo) |
|---------------|---------------------------|------------------------|----------------------------------|
| `descripcion` | ❌                        | ❌                     | ✅ Es la nota del ítem específico |
| `cantidad`    | ❌                        | ❌                     | ✅ Cantidad pedida en esa solicitud |
| `aprobado`    | ❌                        | ❌                     | ✅ Decisión sobre ese ítem en esa solicitud |

Ningún atributo depende únicamente de `id_solicitud` (datos de la cabecera) ni únicamente de `id_insumo` (datos del catálogo). Todos dependen del par solicitud-insumo completo.

**Cumple 2FN.**

---

### Conclusión 2FN

> **Las 11 tablas cumplen la Segunda Forma Normal.**  
> No existen dependencias parciales. Los datos de catálogo (`nombre_departamento`, `nombre_rol`, etc.) están en sus propias tablas y se referencian mediante FK, no duplicados en las tablas que los usan.

---

## 3.4.2.4.3 Tercera Forma Normal (3FN)

Una tabla cumple la **Tercera Forma Normal** cuando:

1. Ya cumple la **2FN**.
2. No existen **dependencias transitivas**: ningún atributo no clave depende de otro atributo no clave.

En otras palabras: cada atributo debe depender **directamente** de la PK, no a través de otro atributo.

---

### Análisis por tabla

#### `categoria`

- `nombre_categoria` → depende directamente de `id_categoria`. ✅
- `en_tickets`, `en_insumos`, `en_manuales` → dependen directamente de `id_categoria`. ✅

**No hay dependencias transitivas. Cumple 3FN.**

---

#### `departamento` y `rol` y `sucursal`

Tablas de dos columnas (PK + nombre). Por definición no pueden tener dependencias transitivas.

**Cumplen 3FN.**

---

#### `empleado`

Posible dependencia transitiva a analizar:

| Atributo          | ¿Depende transitivamente de otro no-clave? | Análisis |
|-------------------|--------------------------------------------|----------|
| `nombre`          | No                                         | Depende directamente de `id_empleado` |
| `ap_paterno`      | No                                         | Depende directamente de `id_empleado` |
| `ap_materno`      | No                                         | Depende directamente de `id_empleado` |
| `email`           | No                                         | Depende directamente de `id_empleado` |
| `password`        | No                                         | Depende directamente de `id_empleado` |
| `foto`            | No                                         | Depende directamente de `id_empleado` |
| `estatus`         | No                                         | Depende directamente de `id_empleado` |
| `id_rol`          | No — es FK, no atributo descriptivo        | El nombre del rol vive en `rol`, no aquí |
| `id_departamento` | No — es FK, no atributo descriptivo        | El nombre del depto vive en `departamento` |
| `id_sucursal`     | No — es FK, no atributo descriptivo        | El nombre de la sucursal vive en `sucursal` |

Caso crítico resuelto: si `nombre_departamento` estuviera en `empleado`, habría una dependencia transitiva `id_empleado → id_departamento → nombre_departamento`. Esto se evitó extrayendo `departamento` a su propia tabla y usando FK.

**No hay dependencias transitivas. Cumple 3FN.**

---

#### `historial_acceso`

| Atributo        | Análisis                                              |
|-----------------|-------------------------------------------------------|
| `id_empleado`   | FK directa, no introduce transitivas                  |
| `fecha_entrada` | Depende directamente de `id_acceso`                   |
| `fecha_salida`  | Depende directamente de `id_acceso`                   |

**No hay dependencias transitivas. Cumple 3FN.**

---

#### `insumo`

| Atributo       | ¿Dependencia transitiva? | Análisis |
|----------------|--------------------------|----------|
| `nombre`       | No                       | Depende de `id_insumo` |
| `descripcion`  | No                       | Depende de `id_insumo` |
| `marca`        | No                       | Depende de `id_insumo` |
| `modelo`       | No                       | Depende de `id_insumo` |
| `stock`        | No                       | Depende de `id_insumo` |
| `estado`       | No                       | Depende de `id_insumo` |
| `id_categoria` | No — es FK               | El nombre de categoría vive en `categoria` |
| `proveedor`    | No                       | Depende de `id_insumo` |
| `imagen_url`   | No                       | Depende de `id_insumo` |
| `num_serie`    | No                       | Depende de `id_insumo` |

Caso a notar: `marca` y `modelo` podrían parecer relacionados entre sí, pero en este dominio un mismo modelo puede tener distintas marcas y viceversa; ambos describen al insumo directamente, no uno al otro.

**No hay dependencias transitivas. Cumple 3FN.**

---

#### `manual`

| Atributo        | Análisis                                              |
|-----------------|-------------------------------------------------------|
| `nombre`        | Depende directamente de `id_manual`                   |
| `descripcion`   | Depende directamente de `id_manual`                   |
| `fecha_subida`  | Depende directamente de `id_manual`                   |
| `fecha_cambio`  | Depende directamente de `id_manual`                   |
| `ruta_pdf`      | Depende directamente de `id_manual`                   |
| `id_categoria`  | FK directa, nombre de categoría vive en `categoria`   |

**No hay dependencias transitivas. Cumple 3FN.**

---

#### `solicitud`

| Atributo           | Análisis                                              |
|--------------------|-------------------------------------------------------|
| `folio_solicitud`  | Depende directamente de `id_solicitud`                |
| `fecha`            | Depende directamente de `id_solicitud`                |
| `estatus`          | Depende directamente de `id_solicitud`                |
| `prioridad`        | Depende directamente de `id_solicitud`                |
| `id_empleado`      | FK directa, datos del empleado viven en `empleado`    |

Caso resuelto: si `nombre` o `departamento` del empleado estuvieran aquí, habría una transitiva `id_solicitud → id_empleado → nombre`. Al usar FK se elimina.

**No hay dependencias transitivas. Cumple 3FN.**

---

#### `solicitud_insumo`

| Atributo      | Análisis                                                        |
|---------------|-----------------------------------------------------------------|
| `id_solicitud`| FK directa a `solicitud`                                        |
| `id_insumo`   | FK directa a `insumo`                                           |
| `descripcion` | Depende del ítem completo (solicitud + insumo), no de otro attr |
| `cantidad`    | Depende del ítem completo, no de otro atributo                  |
| `aprobado`    | Depende del ítem completo, no de otro atributo                  |

Caso resuelto: si `nombre` o `stock` del insumo estuvieran aquí, habría transitiva `id_solicitud_insumo → id_insumo → nombre`. Al usar FK se elimina.

**No hay dependencias transitivas. Cumple 3FN.**

---

#### `ticket`

| Atributo         | ¿Dependencia transitiva? | Análisis |
|------------------|--------------------------|----------|
| `folio_ticket`   | No                       | Depende de `id_ticket` |
| `titulo`         | No                       | Depende de `id_ticket` |
| `descripcion`    | No                       | Depende de `id_ticket` |
| `fecha_subido`   | No                       | Depende de `id_ticket` |
| `fecha_resuelto` | No                       | Depende de `id_ticket` |
| `estatus`        | No                       | Depende de `id_ticket` |
| `prioridad`      | No                       | Depende de `id_ticket` |
| `comentarios`    | No                       | Depende de `id_ticket` |
| `calificacion`   | No                       | Depende de `id_ticket` |
| `id_empleado`    | No — es FK               | Datos del empleado viven en `empleado` |
| `id_categoria`   | No — es FK               | Nombre de categoría vive en `categoria` |
| `id_tecnico`     | No — es FK               | Datos del técnico viven en `empleado`   |

Casos resueltos:
- Si `nombre_empleado` estuviera aquí: `id_ticket → id_empleado → nombre` (transitiva eliminada con FK).
- Si `nombre_categoria` estuviera aquí: `id_ticket → id_categoria → nombre_categoria` (transitiva eliminada con FK).

**No hay dependencias transitivas. Cumple 3FN.**

---

### Conclusión 3FN

> **Las 11 tablas cumplen la Tercera Forma Normal.**  
> Todos los atributos descriptivos dependen directamente de la llave primaria. Las dependencias transitivas fueron eliminadas extrayendo los catálogos (`rol`, `departamento`, `sucursal`, `categoria`) a tablas independientes y referenciándolos mediante llaves foráneas.

---

## Resumen General de Normalización

| Tabla              | 1FN | 2FN | 3FN |
|--------------------|-----|-----|-----|
| `categoria`        | ✅  | ✅  | ✅  |
| `departamento`     | ✅  | ✅  | ✅  |
| `rol`              | ✅  | ✅  | ✅  |
| `sucursal`         | ✅  | ✅  | ✅  |
| `empleado`         | ✅  | ✅  | ✅  |
| `historial_acceso` | ✅  | ✅  | ✅  |
| `insumo`           | ✅  | ✅  | ✅  |
| `manual`           | ✅  | ✅  | ✅  |
| `solicitud`        | ✅  | ✅  | ✅  |
| `solicitud_insumo` | ✅  | ✅  | ✅  |
| `ticket`           | ✅  | ✅  | ✅  |

> La base de datos `precision_helpdesk` se encuentra **completamente normalizada hasta la Tercera Forma Normal (3FN)** en todas sus tablas.
