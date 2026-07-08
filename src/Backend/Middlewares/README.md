# Backend/Middlewares

Capa de middlewares de Express. Se ejecutan en la cadena de procesamiento de cada petición antes de llegar al controlador. Cubren autenticación, autorización, seguridad, validación y gestión de uploads.

---

## `authMiddleware.js`

### Responsabilidad
Protege rutas mediante verificación de JWT y restricción por rol.

### Lógica de negocio

| Función | Descripción |
|---|---|
| `requireAuth` | Extrae el token del header `Authorization: Bearer <token>`, lo verifica con `jwt.verify`. Consulta la tabla `token_revocado` para detectar tokens invalidados por logout explícito. Adjunta el payload decodificado en `req.usuario`. Retorna 401 si el token es inválido, expirado o revocado. |
| `requireAdmin` | Verifica que `req.usuario.id_rol === 1`. Debe usarse siempre después de `requireAuth`. Retorna 403 si el rol no es administrador. |
| `revocarToken(jti, id_empleado, expiraEn)` | Inserta el `jti` del JWT en `token_revocado` con su fecha de expiración. Llamado desde `authController.logout`. |
| `limpiarTokensRevocados()` | Elimina registros de `token_revocado` cuya `expira_en < NOW()`. Llamado por `scheduledJobs` cada hora. |

### Relación
Tabla `token_revocado` vía `db.js`. Aplicado en todas las rutas protegidas de `authRoutes.js`, `ticketsRoutes.js`, `solicitudesRoutes.js`, `manualesRoutes.js`, `categoriasRoutes.js`.

### Entradas / Salidas
- **Entrada:** `req.headers.authorization`
- **Salida:** `next()` con `req.usuario` poblado si válido; `{ error }` con código 401/403 si no.

---

## `security.js`

### Responsabilidad
Protección CSRF basada en header personalizado y prevención de path traversal en operaciones de archivo.

### Lógica de negocio

| Función | Descripción |
|---|---|
| `csrfProtection` | Verifica la presencia del header `x-requested-with` en métodos mutantes (POST, PUT, PATCH, DELETE). Los navegadores no incluyen headers personalizados en peticiones cross-origin sin preflight CORS exitoso. Rutas exentas por ruta exacta: `/login`, `/logout`, `/recuperar`, `/verificar-codigo`, `/reset-password`. |
| `safeResolvePath(baseDir, ...parts)` | Resuelve una ruta de archivo y verifica que el resultado quede dentro del `baseDir`. Rechaza null bytes, normaliza con `path.normalize` para colapsar `../`, y compara el path resuelto con el directorio base. Lanza `Error("Ruta no permitida")` si detecta traversal. |

### Relación
`csrfProtection` aplicado a nivel de router en todos los archivos de rutas. `safeResolvePath` usado por `ticketsController.js`, `authController.js` y `solicitudesController.js`.

### Entradas / Salidas
- `csrfProtection`: `req.method`, `req.path`, `req.headers["x-requested-with"]` → `next()` o `res.status(403)`
- `safeResolvePath(baseDir, ...parts)` → `string` (ruta absoluta segura) o lanza `Error`

---

## `validate.js`

### Responsabilidad
Fábrica de middlewares de validación basada en schemas Zod. Centraliza la validación y normalización de todos los endpoints.

### Lógica de negocio
- `validate(schema)` — retorna un middleware que aplica `schema.safeParse(req.body)`. Si falla, responde 422 con la lista de errores `{ campo, mensaje }`. Si pasa, reemplaza `req.body` con los datos normalizados por Zod (coerción de tipos, strings recortados, defaults aplicados).
- `passwordPolicy` — refinement Zod compartido: mínimo 8 caracteres, al menos una mayúscula, un número y un carácter especial.

**Schemas exportados:**

| Schema | Endpoint |
|---|---|
| `schemaLogin` | POST /api/auth/login |
| `schemaLogout` | POST /api/auth/logout |
| `schemaActualizarPerfil` | PUT /api/auth/perfil/:id |
| `schemaCrearEmpleado` | POST /api/auth/empleados |
| `schemaUpdateEmpleadoAdmin` | PUT /api/auth/empleados/:id |
| `schemaCrearTicket` | POST /api/tickets |
| `schemaActualizarTicket` | PATCH /api/tickets/:id |
| `schemaCalificarTicket` | PATCH /api/tickets/:id/calificar |
| `schemaEditarTicket` | PUT /api/tickets/:id/editar |
| `schemaCrearSolicitud` | POST /api/solicitudes |
| `schemaActualizarEstatusSolicitud` | PATCH /api/solicitudes/:id/estatus |
| `schemaFiltrosTickets` | GET /api/tickets (query params) |
| `schemaInsumo` | POST/PUT /api/solicitudes/insumos |

### Relación
Usado en `authRoutes.js`, `ticketsRoutes.js`, `solicitudesRoutes.js`.

### Entradas / Salidas
- **Entrada:** `req.body`
- **Salida:** `next()` con `req.body` normalizado, o `res.status(422).json({ error, errores[] })`

---

## `uploadEvidencias.js`

### Responsabilidad
Configura Multer para la subida de imágenes de evidencia de tickets.

### Lógica de negocio
- Almacena temporalmente en `storage/Evidencias_Tickets/_tmp_upload/`.
- Valida tipo MIME por magic bytes con `file-type` y por extensión (jpg, jpeg, png, gif, webp).
- Limita el tamaño a 10 MB por archivo.
- Exporta `EVIDENCIAS_BASE` (ruta absoluta del directorio base) para uso en el controlador.

### Relación
Usado en `ticketsRoutes.js`. El controlador mueve los archivos del directorio temporal al directorio definitivo del folio.

### Entradas / Salidas
- **Entrada:** `req.files` (multipart/form-data, campo `evidencias`)
- **Salida:** Archivos en disco; `req.files` poblado por Multer

---

## `uploadFotos.js`

### Responsabilidad
Configura Multer para la subida de fotos de perfil de empleados.

### Lógica de negocio
- Almacena en `storage/Fotos de Perfil/` con nombre `emp_{id}_{timestamp}.{ext}`.
- Valida tipo MIME (jpg, jpeg, png, webp) y tamaño máximo de 5 MB.
- Usa `sharp` para redimensionar la imagen a 400×400 px antes de guardar.
- Exporta `FOTOS_DIR` y `FOTOS_REL` para que el controlador construya la ruta relativa a guardar en BD.

### Relación
Usado en `authRoutes.js` para rutas de foto de perfil.

### Entradas / Salidas
- **Entrada:** `req.file` (multipart/form-data, campo `foto`)
- **Salida:** Archivo procesado en disco; `req.file` poblado por Multer

---

## `uploadManuales.js`

### Responsabilidad
Configura Multer para la subida de archivos PDF de manuales.

### Lógica de negocio
- Almacena en `storage/Manuales/` con nombre `Manual_{año}_{nombre_sanitizado}.pdf`.
- Valida que el tipo MIME sea `application/pdf` y el tamaño máximo sea 50 MB.

### Relación
Usado en `manualesRoutes.js`.

### Entradas / Salidas
- **Entrada:** `req.file` (multipart/form-data, campo `pdf`)
- **Salida:** Archivo PDF en disco; `req.file` poblado por Multer

---

## `uploadInsumos.js`

### Responsabilidad
Configura Multer para la subida de imágenes de insumos del inventario.

### Lógica de negocio
- Almacena en `storage/Insumos/` con nombre único basado en timestamp.
- Valida tipo MIME (jpg, jpeg, png, webp) y tamaño máximo de 5 MB.
- Exporta `INSUMOS_DIR` para que el controlador gestione la eliminación de imágenes anteriores.

### Relación
Usado en `solicitudesRoutes.js` para la ruta de foto de insumo.

### Entradas / Salidas
- **Entrada:** `req.file` (multipart/form-data, campo `foto`)
- **Salida:** Archivo en disco; `req.file` poblado por Multer
