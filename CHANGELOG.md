# CHANGELOG — PrecisionTrucks HelpDesk

## [2026-10-12] — Folio format & requestor fixes

### Cambios en backend

#### 1. Folio de solicitud: `SOL-YYYYMM-NNN` → `SAL-YYYYMMDD-NNNN`
- **Archivo:** `src/Backend/Utils/helpers.js`
  - `generarFolio()` ahora genera `SAL-20261006-0001` (formato `YYYYMMDD-NNNN`).
  - Secuencia 3 → 4 dígitos (`padStart(4, "0")`).
  - Fecha incluye día `YYYYMMDD` en vez de `YYYYMM`.
  - Se actualizó la documentación JSDoc.

- **Archivo:** `src/Backend/Models/Solicitud.js`
  - Llamada a `generarFolio()` ahora usa prefijo `"SAL"` (anteriormente `"SOL"`).
  - Esto hace que las solicitudes (internas y externas) usen el mismo formato.

#### 2. Tabla `empleado`
- Se eliminó la referencia al campo `e.foto` de los `SELECT` en `findByEmail`, `findById` y `updatePerfil`.
- `updatePerfil` ya no recibe parámetro `foto`.
- Se confirmó que no hay vistas ni triggers que hagan referencia a `foto`.
- Se creó backup de la base de datos antes del cambio.

### Validaciones y control de acceso
- `crearSolicitud` en `solicitudesController.js` valida que el `id_empleado` sea el mismo que el JWT, o que sea admin (rol 1).
- Solo personal del departamento **Soporte Técnico** (`id_departamento = 2`) o administradores pueden ver/editar rutas de material y observaciones de insumos.
- Se mantiene la regla: *solo los de soporte registran las solicitudes internas*.

### Próximos pasos sugeridos
1. Ejecutar `node tmp_solicitudes.mjs` para ver de que empleados salen las solicitudes.
2. Si existe una solicitud con `folio_solicitud = 'SAL-20261006-0001'`, actualizar su `id_empleado` a `4` (Matthew Garay) si corresponde.
3. Verificar el frontend (`src/Frontend/`) para asegurarse de que no espera el formato antiguó `SOL-YYYYMM-NNN`.
