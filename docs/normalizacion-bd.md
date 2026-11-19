# Normalización y auditoría de la base de datos

**Sistema:** Mesa de ayuda de Soporte Técnico — `precision_helpdesk` (MySQL 8.0.46, InnoDB, utf8mb4)
**Fecha:** 18/11/2026
**Esquema propuesto:** [`database/esquema-normalizado.sql`](../database/esquema-normalizado.sql)
**Estado:** fases 0 a 3 **aplicadas** a producción (18 y 19/11/2026; migraciones 004 a 007). La fase 4 es opcional.

---

## 1. Resumen

La base actual está **bien diseñada en lo esencial**:

- Todas las tablas tienen clave primaria sustituta.
- Las claves naturales tienen `UNIQUE`: folios, correo y número de empleado.
- Hay claves foráneas en todas las relaciones.

Los datos reales revisados el 18/11/2026 están **consistentes**:

- El stock de cada insumo coincide con su último movimiento.
- La fecha y la ruta de cada renglón del kardex coinciden con su salida.
- No hay renglones repetidos en solicitudes.

Los hallazgos son de **diseño**: reglas que hoy solo cuida el código y que la base no impide.

| # | Hallazgo | Forma normal | Evidencia en datos reales | Severidad |
|---|---|---|---|---|
| H1 | `categoria.en_tickets / en_insumos / en_manuales`: un hecho multivaluado guardado en columnas | 1FN / 4FN | 9 de 16 categorías están en varios módulos | Media |
| H2 | `insumo.num_serie` y `estado` describen una pieza, pero `insumo` es un tipo de artículo con `stock` | 1FN / 2FN | 14 insumos con stock > 1 y un solo número de serie | Media |
| H3 | Evidencias de tickets solo en disco, sin tabla | 1FN | La base no sabe cuántas evidencias tiene un ticket ni quién las subió | Media |
| H4 | `movimiento_inventario.fecha`, `id_sucursal_origen` e `id_sucursal_destino` repiten los de su salida o solicitud | 3FN / BCNF | 0 incoherencias hoy; al corregir la fecha de SAL-202611-0013 hubo que cambiar las dos tablas | Alta (riesgo) |
| H5 | `solicitud_insumo.aprobado` se deduce de `cantidad_aprobada` | 3FN | 0 incoherencias | Baja |
| H6 | `salida_interna.estatus`, `motivo_anulacion`, `fecha_anulacion` e `id_anulo` dependen de que la salida esté anulada | 3FN (dependencia condicional) | 0 salidas anuladas: 4 columnas en NULL en todos los renglones | Baja |
| H7 | Texto `'N/A'` guardado en lugar de NULL | Calidad (dominio) | `num_serie` 89, `modelo` 55, `marca` 20, `descripcion` 7 | Media |
| H8 | Faltan reglas en la base: cantidades > 0, calificación 1–5, origen ≠ destino, aritmética del kardex, insumo único por solicitud | Integridad | 0 violaciones hoy (solo las cuida el código) | Media |
| H9 | Índices duplicados | Rendimiento | `solicitud(id_empleado)` ×2 más `(id_empleado, fecha)`; `historial_acceso(id_empleado)` más `(id_empleado, fecha_entrada)` | Baja |
| H10 | Tipos mezclados: `int` / `int unsigned`, `timestamp` / `datetime` | Consistencia | `manual` y `ticket_historial` usan unsigned; las fechas de tickets usan timestamp | Baja |

---

## 2. Proceso de normalización

### 2.1 Primera Forma Normal (1FN)

**Regla:** valores atómicos, sin grupos repetidos y con clave primaria.

| Tabla | Situación actual | Transformación |
|---|---|---|
| Todas | Tienen PK sustituta y columnas atómicas | Sin cambio |
| `empleado` | El nombre ya viene separado en `nombre`, `ap_paterno` y `ap_materno` (atómico) | Sin cambio |
| `categoria` | **Grupo repetido en columnas**: `en_tickets`, `en_insumos`, `en_manuales`. Un módulo nuevo obligaría a agregar otra columna. | Nueva tabla **`categoria_ambito(id_categoria, ambito)`** con PK compuesta; se quitan las 3 columnas (H1) |
| `insumo` | `num_serie` y `estado` son de **una** pieza, pero el renglón representa N piezas (`stock`). Las demás piezas no tienen dónde guardar su serie: es un grupo repetido implícito. | Nueva tabla **`insumo_unidad(id_unidad, id_insumo, num_serie, estado, …)`**, opcional, solo para equipos con serie (H2) |
| `ticket` | La lista de evidencias de un ticket existe solo como archivos en una carpeta | Nueva tabla **`ticket_evidencia`**, un renglón por archivo (H3) |
| `movimiento_inventario.motivo` | Versiones antiguas concatenaban folio, destino y solicitante en un texto. Hoy esos datos ya viven en `salida_interna`. | Sin cambio (0 renglones con el formato viejo) |

### 2.2 Segunda Forma Normal (2FN)

**Regla:** cumplir 1FN y que ningún atributo dependa solo de una parte de una clave compuesta.

- Todas las tablas actuales usan una **PK de una sola columna**, así que no puede haber dependencias parciales respecto de la PK.
- Se revisaron también las **claves candidatas compuestas**:
  - `solicitud_insumo` tiene la candidata natural `(id_solicitud, id_insumo)`. `cantidad`, `cantidad_aprobada` y `descripcion` dependen de **ambas** columnas, no de una sola. Cumple 2FN.
  - Hoy esa candidata no está declarada: se agrega `UNIQUE (id_solicitud, id_insumo)` (H8).
  - `categoria_ambito` (nueva): toda la clave es la PK. Cumple 2FN.
  - `insumo` frente a pieza: `num_serie` depende de la pieza, no del insumo. Esto ya se corrige en 1FN con `insumo_unidad`.

### 2.3 Tercera Forma Normal (3FN)

**Regla:** cumplir 2FN y que ningún atributo no clave dependa de otro atributo no clave (sin dependencias transitivas).

| Dependencia transitiva | Dónde | Decisión |
|---|---|---|
| `id_movimiento → id_salida → fecha, id_sucursal_origen, id_sucursal_destino` | `movimiento_inventario` | **Redundancia controlada** (ver 2.5). Se conserva porque las entradas no tienen cabecera y el reporte de consumo filtra por estas columnas sin JOIN. Se agrega el disparador **`trg_salida_sincroniza_kardex`**: si cambia la fecha o la ruta de la salida, sus renglones cambian solos (H4). |
| `id_solicitud_insumo → cantidad_aprobada → aprobado` | `solicitud_insumo` | **Se elimina `aprobado`.** Se lee como: NULL = sin decidir, 0 = negado, > 0 = aceptado (H5). |
| `id_salida → estatus → {motivo_anulacion, fecha_anulacion, id_anulo}` | `salida_interna` | **Se separa en `salida_anulacion`** (relación 1:0..1). Si existe el renglón, la salida está anulada. La vista `v_salida_interna` devuelve `estatus` como hoy para no romper el código (H6). |
| `id_empleado → eliminado → {fecha_eliminacion, id_elimino}` | `empleado` | Se conserva: son solo dos columnas y la baja lógica se consulta en cada listado. Se agrega **`chk_emp_baja`** para que no haya fecha de baja sin baja, ni al revés. |
| `id_insumo → stock` (derivable de la suma de movimientos) | `insumo` | **Redundancia controlada**: se lee en cada pantalla y es la fila que se bloquea (`FOR UPDATE`) para que dos salidas no descuenten a la vez. Las pruebas automáticas verifican que coincida con el kardex. |
| `stock_nuevo = stock_anterior ± cantidad` | `movimiento_inventario` | Foto del stock en cada movimiento (libro contable). Se conserva y se agrega **`chk_mi_aritmetica`**: la base rechaza un renglón cuyas cuentas no cuadren. |

### 2.4 Boyce-Codd (BCNF), 4FN y 5FN

**BCNF** pide que todo determinante sea superclave. Determinantes encontrados:

| Tabla | Determinantes | ¿Es superclave? |
|---|---|---|
| `ticket` | `id_ticket`, `folio_ticket` | Sí (PK y UNIQUE) |
| `solicitud` | `id_solicitud`, `folio_solicitud` | Sí |
| `salida_interna` | `id_salida`, `folio_salida` | Sí |
| `empleado` | `id_empleado`, `email`, `num_empleado` | Sí |
| `solicitud_insumo` | `id_solicitud_insumo`, `(id_solicitud, id_insumo)` | Sí, con el nuevo UNIQUE |
| `movimiento_inventario` | `id_salida → fecha, ruta` | **No.** Es la redundancia controlada de 3FN, protegida con el disparador |
| Catálogos | `nombre_*` | Sí; se agrega el UNIQUE que faltaba en `categoria.nombre_categoria` |

**4FN:**

- La única dependencia multivaluada independiente era categoría ↠ módulos. Se resolvió con `categoria_ambito`.
- Ninguna otra tabla mezcla dos hechos multivaluados independientes.

**5FN:**

- No hay dependencias de reunión.
- Todas las relaciones N:M son binarias (`solicitud_insumo`, `categoria_ambito`).
- No existe ninguna relación ternaria que se pueda descomponer.

### 2.5 Redundancias que se conservan a propósito

Normalizar todo tendría un costo. Estas tres redundancias se quedan, documentadas y protegidas:

| Dato redundante | Por qué se conserva | Qué la protege |
|---|---|---|
| `insumo.stock` | Lectura rápida y bloqueo de fila contra salidas simultáneas | Transacciones con `FOR UPDATE` y prueba `verificarKardex` |
| `movimiento_inventario.stock_anterior` y `stock_nuevo` | Auditoría sin recalcular todo el historial | `chk_mi_aritmetica` |
| `movimiento_inventario.fecha` y `id_sucursal_*` en renglones de salidas y solicitudes | Las entradas no tienen cabecera; el reporte de consumo no necesita JOIN | `trg_salida_sincroniza_kardex` |

---

## 3. Esquema final

El DDL completo, con comentario en cada tabla y columna, está en
[`database/esquema-normalizado.sql`](../database/esquema-normalizado.sql).

**Tablas:**

- **Catálogos:** `rol`, `departamento`, `sucursal`, `categoria` y **`categoria_ambito`** (nueva).
- **Personas:** `empleado`, `historial_acceso`.
- **Mesa de ayuda:** `ticket`, **`ticket_evidencia`** (nueva), `ticket_historial`.
- **Manuales:** `manual`.
- **Inventario:** `insumo`, **`insumo_unidad`** (nueva, opcional), `solicitud`, `solicitud_insumo`, `salida_interna`, **`salida_anulacion`** (nueva), `salida_cambio`, `movimiento_inventario`.
- **Disparador:** `trg_salida_sincroniza_kardex`.
- **Vista:** `v_salida_interna`, para compatibilidad con el código actual.

**Integridad referencial:**

| Regla | Dónde | Por qué |
|---|---|---|
| `RESTRICT` | Empleado → tickets y solicitudes; insumo → movimientos; categoría → todo; salida y solicitud → kardex | Borrar el padre perdería historia |
| `CASCADE` | Renglones de solicitud, evidencias, historial de ticket, correcciones de salida, ámbitos de categoría | Detalle que no tiene sentido sin su cabecera |
| `SET NULL` | Columnas de "quién lo hizo": `id_registro`, `observacion_por`, `subido_por`, `id_elimino`… | El registro sigue valiendo aunque falte el autor |

Las FK cuyas columnas también están en un `CHECK` usan `RESTRICT`, porque MySQL no admite un `CHECK` sobre columnas con acción referencial. No se pierde nada: las PK nunca cambian y los empleados no se borran (baja lógica).

**Reglas `CHECK` nuevas:**

- calificación de 1 a 5, y solo en tickets Resueltos;
- cierre del ticket posterior a su alta;
- cantidades mayores que 0, y lo aprobado no mayor que lo pedido;
- origen distinto de destino;
- sucursal o empleado elegido de la lista **o** escrito a mano, nunca ambos;
- un movimiento viene de una solicitud o de una salida, nunca de las dos;
- aritmética del kardex;
- coherencia de la baja lógica del empleado;
- la salida de sesión no puede ser anterior a la entrada.

**Validación:**

- El esquema se cargó en una base temporal de MySQL 8 y se borró al terminar.
- Cada regla rechazó su caso inválido, el disparador sincronizó la fecha y la vista devolvió el estatus.
- Los datos reales actuales cumplen **todas** las reglas nuevas (0 violaciones). La migración no necesita corregir datos, salvo convertir `'N/A'` a NULL.

### 3.1 Estrategia de índices

| Consulta frecuente | Índice |
|---|---|
| Tickets por estatus y fecha (tablero, listados) | `ticket(estatus, fecha_subido)` (ya existe) |
| Mis tickets / tickets del técnico | `ticket(id_empleado, estatus)`, `ticket(id_tecnico, estatus)` (ya existen) |
| Indicadores: tiempo de resolución por mes | **nuevo** `ticket(fecha_resuelto)` |
| Indicadores: tickets por categoría y mes | **nuevo** `ticket(id_categoria, fecha_subido)` |
| Kardex de un insumo | `movimiento_inventario(id_insumo, fecha)` (ya existe) |
| Reporte de consumo por sucursal | **nuevo** `movimiento_inventario(id_sucursal_destino, fecha)` |
| Salidas por sucursal destino | **nuevo** `salida_interna(id_sucursal_destino, fecha)` |
| Solicitudes del empleado | `solicitud(id_empleado, fecha)`; **se quitan** los dos índices sueltos de `id_empleado` |
| Accesos del empleado | `historial_acceso(id_empleado, fecha_entrada)`; **se quita** el índice suelto |
| Búsqueda por etiqueta | `insumo(etiqueta)` (**aplicado**) |

---

## 4. Plan de migración

Cada fase lleva su propia migración en `database/migraciones/`, se prueba primero sobre una copia restaurada (`restaurar.ps1` sin `-Reemplazar`) y va acompañada de pruebas automáticas.

| Fase | Contenido | Impacto en la app | Riesgo |
|---|---|---|---|
| **0 (aplicada)** | `insumo.etiqueta` con índice (migración 004) | Ya integrada | — |
| **1 (aplicada 18/11/2026)** | Agregar los CHECK y UNIQUE nuevos; agregar y quitar índices; agregar el disparador (migración 005) | Ninguno: los datos ya cumplían. Solo se agregó un aviso claro si una solicitud trae el mismo insumo dos veces | Bajo |
| **2 (aplicada 18/11/2026)** | `'N/A'` → NULL (171 valores); `solicitud_insumo.aprobado` pasa a columna **calculada** desde `cantidad_aprobada` (ya no se guarda aparte); `categoria_ambito` sustituye las 3 banderas (31 renglones); `ticket_evidencia` registra cada archivo (migración 006) | Validación (`textoOpcional`: vacío = NULL y lo no enviado no se toca), escritura de aprobación, consultas de categorías (la API conserva `en_*`), servicio `evidencia.js` | Medio |
| **3 (aplicada 19/11/2026)** | `salida_anulacion` (1:0..1, PK = salida: no se anula dos veces) y vista `v_salida_interna` con el estatus; tipos unificados con la mayoría del esquema: `manual.id_manual` e `ticket_historial.id_historial` a `int`, y las 7 fechas `timestamp` a `datetime` (misma hora: la zona de la base y del sistema es la misma). Se eligió `int` con signo, como las otras 16 tablas, en lugar de pasar todo a `unsigned`: no exige rehacer ~40 claves foráneas (migración 007) | La anulación escribe en la tabla nueva; las lecturas usan la vista | Medio |
| **4 (opcional)** | `insumo_unidad` para equipos con número de serie | Pantallas nuevas: alta de piezas y elección de serie al sacar | Alto (es una función nueva) |

Pendiente solo la **fase 4** (opcional): decidir si se necesita controlar laptops e impresoras pieza por pieza.

---

## 5. Notas para PostgreSQL

El DDL está escrito para MySQL 8, que es el motor en uso. Para pasarlo a PostgreSQL:

- `INT UNSIGNED` → `INTEGER` con `CHECK (col >= 0)`.
- `AUTO_INCREMENT` → `GENERATED ALWAYS AS IDENTITY`.
- `ENUM` → `CHECK (col IN (…))` o `CREATE TYPE`.
- `TINYINT(1)` → `BOOLEAN`.
- `COMMENT` → `COMMENT ON`.
- `ON UPDATE CURRENT_TIMESTAMP` y el disparador → funciones `plpgsql`.
