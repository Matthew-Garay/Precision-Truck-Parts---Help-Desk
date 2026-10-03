# Esquema de base de datos — `precision_helpdesk`

**14 tablas · 97 columnas · 21 llaves foráneas.**
Detalle columna por columna (tipo, nulo, default, clave, FK, índices, uso y %
de llenado con datos reales) en [`docs/COLUMNAS.md`](./COLUMNAS.md).

- Motor: InnoDB · `utf8mb4` / `utf8mb4_unicode_ci`
- Zona horaria de la conexión: `-06:00` (Hermosillo, Sonora)
- Dump completo con datos: `docs/database.utf8.sql` (idéntico a `docs/database.sql`)
- Cambios de estructura: `src/Backend/scripts/migrate.js`
  (`node src/Backend/scripts/migrate.js` — idempotente, se puede repetir)

## Tablas

| Tabla | Filas | Función |
|---|---|---|
| `rol` | 2 | Catálogo de roles (Administrador / Usuario) |
| `departamento` | 20 | Áreas de la empresa |
| `sucursal` | 15 | CEDIS y sucursales; origen/destino del material |
| `categoria` | 16 | Banderas `en_tickets` / `en_insumos` / `en_manuales` |
| `empleado` | 30 | Usuarios; sucursal, departamento, rol y `token_version` |
| `historial_acceso` | 78 | Sesiones: `fecha_entrada` / `fecha_salida` |
| `insumo` | 57 | Catálogo de insumos y su `stock` |
| `manual` | 5 | Manuales PDF |
| `solicitud` | 34 | Solicitudes de insumo; incluye la ruta del material |
| `solicitud_insumo` | 67 | Renglones de cada solicitud |
| `movimiento_inventario` | 4 | **Kardex**: entradas, salidas y ajustes con stock |
| `ticket` | 73 | Incidencias |
| `ticket_historial` | 0 | Auditoría de cambios de cada ticket |
| `_migraciones` | 23 | Registro de migraciones aplicadas |

## Tablas eliminadas

### `token_revocado` — sustituida por `empleado.token_version`

Era la lista negra de JWT: al cerrar sesión se guardaba el `jti` y en **cada petición**
`requireAuth` consultaba si estaba ahí para rechazar el token.

Se eliminó la tabla, pero **no la invalidación de sesión**. Ahora cada token lleva dentro la
generación con la que se expidió (payload `ver`) y `empleado.token_version` es el contador:

| Momento | Qué pasa |
|---|---|
| Login / refresh | el JWT se firma con `ver = empleado.token_version` |
| Logout | `UPDATE empleado SET token_version = token_version + 1` |
| Cada petición | `requireAuth` compara; si la versión del empleado supera la del token, responde 401 |

Ventajas frente a la tabla: sobrevive a reinicios del servidor, funciona igual con varias
instancias, no genera filas que purgar y quita una consulta por logout.

**Consecuencia a conocer:** el logout cierra la sesión en **todos los dispositivos** del
usuario, no solo en el navegador desde el que hizo clic. Para un usuario con una sola
sesión es indistinguible; si alguien usa la misma cuenta en dos equipos a la vez, al cerrar
sesión en uno se desconecta el otro.

### `manual_historial`

Se había restaurado por ser parte del esquema oficial, pero ningún módulo la leía ni la
escribía (0 filas, 0 consultas en todo el backend). Se eliminó con sus dos FK.

## Columnas sin uso en el backend

Solo dos de 97:

- `_migraciones.ejecutada` — la escribe el propio migrador, no la aplicación.
- `manual.subido_por` — reservada, siempre en `NULL`.

`manual.version` sigue en el esquema como columna reservada.

## Correcciones de auditoría aplicadas

1. **`getHistorialTicket` consultaba una tabla inexistente** (`historial_ticket`) y una
   columna inexistente (`fecha_cambio`). El `catch { res.json([]) }` lo ocultaba: el
   historial de cambios de tickets **siempre devolvía lista vacía**. Corregido a
   `ticket_historial` / `fecha`.
2. **Nadie escribía en `ticket_historial`.** Se agregó `Ticket.registrarCambio()`, que deja
   registro de `estatus`, `titulo`, `prioridad` y técnico asignado, con autor y fecha.
3. **Índice duplicado en `token_revocado`** (`UNIQUE jti` + `idx_jti` sobre la misma
   columna). Eliminado.
4. **Dumps de `docs/` regenerados**: antes solo declaraban 11 tablas y `database.sql` estaba
   en UTF-16LE, formato que MySQL no lee sin conversión.

## Notas

- La ruta del material vive en `solicitud.id_sucursal_origen` / `id_sucursal_destino`,
  **no** en las entradas de material. `movimiento_inventario` replica esos ids solo como
  referencia histórica del movimiento.
- Solo 1 de 34 solicitudes tiene ruta capturada; las 33 anteriores son anteriores a que
  existiera el campo, por eso imprimen "Por definir".
- `timezone: "-06:00"` está fijada en `src/Backend/Config/db.js`. Si se cambia, las fechas
  ya guardadas se interpretarán con el desfase nuevo.
- El JWT vive 12 h. La invalidación ya no depende de la expiración, así que cambiar
  `expiresIn` no afecta al cierre de sesión.