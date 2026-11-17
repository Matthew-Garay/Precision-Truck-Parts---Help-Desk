# Seguridad y auditoria

## Contrasenas: bcrypt

- Libreria: `bcryptjs`. Coste fijo de 12 rounds para todas las operaciones sobre contrasenas:
  - `POST /api/auth/login`: `bcrypt.compare(password, hash)`.
  - `PUT /api/auth/perfil/:id` (cambio con contrasena actual): `bcrypt.hash(password_nueva, 12)`.
  - `POST /api/auth/empleados`: hash con 12 rounds antes de insertar.
  - Recuperacion de contrasena: `bcrypt.hash(password_nueva, 12)`.
- El hash vive unicamente en `empleado.password` (varchar 255); ninguna consulta expone la columna en respuestas (`findById` no la selecciona).
- Politica de contrasena (Zod, `validate.js`): minimo 8 caracteres, al menos una mayuscula, un numero y un caracter especial.
- Recuperacion por correo: codigo de 6 digitos generado con `crypto.randomInt`, hasheado con bcrypt (10 rounds), expira en 10 minutos, maximo de intentos; el token de reset tambien tiene caducidad.

## Politica de correo corporativo

`validarEmailCorporativo` aplica una lista blanca de dominios por igualdad exacta: `refividrio.com.mx`, `ptp.com.mx`, `megapartes.com.mx`, `ebatruck.com.mx`. Ademas valida longitud RFC 5321/5322, solo ASCII imprimible (bloquea homografos Unicode), unico `@`, parte local en formato dot-atom y etiquetas RFC 1123; se rechazan subdominios y dominios parecidos. Se aplica en login, registro, edicion de perfil y edicion de empleado; el login responde el mismo mensaje generico de credenciales invalidas para no revelar si el correo existe.

## JWT

- Firma con `JWT_SECRET` (secreto de entorno, minimo 64 bytes aleatorios recomendados). Payload minimo: `id_empleado`, `id_rol`, `ver` (`token_version`). Expiracion 12 horas.
- Revocacion sin lista negra: el logout incrementa `empleado.token_version`; `requireAuth` compara `ver` con la version vigente en base de datos y rechaza tokens antiguos. Sobrevive a reinicios y sirve para varias instancias.
- El mismo token autentica la API (cabecera Authorization) y el handshake de Socket.io (`socket.handshake.auth.token`).
- `POST /api/auth/refresh-token` emite un token nuevo sin exigir la contrasena, siempre que el empleado siga activo.
- Login con Zoho (OIDC server-based): el `state` viaja en cookie httpOnly, el callback solo empareja correos ya existentes y activos; sin auto-altas.

## Autorizacion

Middlewares en `server/middlewares/auth-middleware.js`:

- `requireAuth`: exige Bearer valido; `401` si falta, es invalido o esta revocado.
- `requireAdmin`: exige `id_rol === 1`; `403` en caso contrario.
- `requireSoporteOAdmin`: rol 1 o departamento **"Soporte Técnico" identificado por nombre** (no por id, que cambia si la tabla se renumera); la consulta se hace por petición para que un cambio de departamento surta efecto inmediato.
- `requireOwnerOrAdmin(param)` (fábrica única en `auth-middleware.js`) y verificaciones de propiedad en controladores: dueño del ticket/solicitud/perfil o admin. Aplica también a `GET /api/auth/empleados/:id` (antes cualquier usuario podía consultar a cualquier empleado). Ante error de autorizacion en base de datos se responde `false` (nunca se concede permiso por fallo).

La matriz completa de capacidades esta en [architecture.md](architecture.md).

## Proteccion de la API

- CSRF: middleware `csrfProtection` exige la cabecera `x-requested-with` en toda mutacion. Comparacion por ruta exacta (no por sufijo) para evitar bypass; exentas las rutas sin sesion previa: `/login`, `/logout`, `/recuperar`, `/verificar-codigo`, `/reset-password`.
- Rate limiting con `express-rate-limit` (ver tabla en [api-routes.md](api-routes.md)): login 10/15 min, recuperacion 5/15 min, logout 30/15 min, Zoho 20/15 min, tickets 30/hora, solicitudes 20/hora. En produccion se configura `trust proxy = 1` para contar la IP real detras del proxy.
- Cabeceras: `helmet` con CSP detallada (defaultSrc self, objectSrc none, frameAncestors self, connectSrc limitado al host de la API y las URLs de APP_URL/CORS_ORIGIN con ws/wss), `Referrer-Policy: strict-origin-when-cross-origin` y CORP `cross-origin` para que el visor de PDF lea `/storage`. `X-Content-Type-Options: nosniff` en PDFs.
- CORS: un unico origen configurado en `CORS_ORIGIN` con `credentials: true`; en desarrollo el proxy de Vite evita CORS por completo.
- Cuerpos: `express.json` y `urlencoded` con limite de 2 MB.
- Errores: el handler global responde JSON; en produccion un 500 nunca expone el mensaje interno (`"Error interno del servidor"`), y los controladores usan `errDetalle` que solo agrega `detalle` fuera de produccion.

## Validacion de entradas y SQL Injection

- Todas las consultas a MySQL usan parametros marcados (`?`) de `mysql2`; no hay concatenacion de valores de usuario en el SQL. Ejemplo del patron unico del proyecto: `pool.query("SELECT ... WHERE email = ? LIMIT 1", [email])`.
- Los identificadores que si se construyen dinamicamente (tabla y columna del folio en `utils/helpers.js`) provienen exclusivamente de constantes del codigo, nunca del request.
- Cuerpos y query strings se validan con esquemas Zod (`Middlewares/validate.js`); los enteros se convierten con coerción y se rechazan no numericos. Fallos: `422` con el detalle campo a campo.
- Los parametros numericos de ruta se pasan por `parseInt` y se verifica `isNaN` antes de tocar la base de datos.
- Folios generados bajo concurrencia: `SELECT ... FOR UPDATE` dentro de la transaccion que crea el ticket o la solicitud, evitando duplicados sin bloquear tablas completas.
- Transacciones en operaciones multiples (aprobacion de solicitud + descuento de stock + movimientos de inventario) con rollback ante cualquier fallo.

## Manejo seguro de archivos

- Subidas con `multer` y doble validacion en todos los modulos (evidencias, fotos de perfil, fotos de insumos, manuales):
  1. Filtro de mimetype declarado por el cliente en `fileFilter`.
  2. Validacion de bytes magicos del archivo ya guardado con la libreria `file-type`; si no coincide, se elimina del disco y se responde `400`.
- Limites y tipos permitidos:

| Modulo | Tipos | Tamano maximo |
| --- | --- | --- |
| Evidencias de tickets | jpeg, png, webp, gif, mp4, webm, quicktime, avi | 100 MB por archivo, maximo 8 archivos |
| Fotos de perfil | jpeg, png, webp | 5 MB |
| Fotos de insumos | jpeg, png, webp, gif, avif | 5 MB |
| Manuales | application/pdf | 50 MB |

- Nombres de archivo generados por el servidor (timestamp, id y `crypto.randomBytes`); nunca se conserva el nombre original como ruta.
- Path traversal: `safeResolvePath` rechaza null bytes, normaliza cada parte de la ruta y exige que la ruta resuelta quede dentro del directorio base; se usa en la eliminacion de manuales, fotos y evidencias.
- `/storage` bloquea el acceso a `.json` y `.env`; `/fotos` exige JWT; los PDFs se sirven con `Content-Type` y `nosniff` correctos.

## Auditoria de accesos: historial_acceso

Registro de cada sesion iniciada, pensado como evidencia ante auditorias de control interno (objetivo especifico IV del proyecto):

1. `POST /api/auth/login` (y el callback de Zoho) cierra las sesiones abiertas anteriores del usuario (`cerrarSesionesHuerfanas`) y llama a `Empleado.registrarEntrada`, que inserta en `historial_acceso` con `fecha_entrada = NOW()`.
2. El `id_acceso` devuelto se guarda en el frontend y se envia en `POST /api/auth/logout`; el controlador verifica que el registro pertenezca al empleado (comparando contra el JWT si viene) y actualiza `fecha_salida = NOW()`. La ruta es publica porque `navigator.sendBeacon` no puede enviar cabeceras.
3. Worker horario: cierra los registros con mas de 12 horas sin `fecha_salida` (sesiones cuyo navegador murio sin logout).
4. Lectura: `GET /api/auth/accesos/:id` (propietario o admin) y `GET /api/auth/accesos` (solo admin), paginadas por `fecha_entrada` descendente.
5. Borrado: `ON DELETE CASCADE` respecto a `empleado`; eliminar un empleado elimina su historial.

Columnas registradas: `id_acceso`, `id_empleado`, `fecha_entrada`, `fecha_salida`. La duracion de la sesion se calcula al consultar.

## Auditoria de cambios de ticket: ticket_historial

Cada modificacion de campo relevante de un ticket (estatus, tecnico, comentarios, calificacion) inserta una fila con `id_ticket`, `id_empleado` (actor), `campo_cambiado`, `valor_anterior`, `valor_nuevo` y `fecha`. Se consulta desde `GET /api/tickets/:id_ticket/historial`. Tiene llaves foráneas a `ticket` (ON DELETE CASCADE) y a `empleado`; el índice `idx_th_ticket` soporta la consulta por ticket y `idx_th_fecha` los rangos por fecha.

## Inventario como evidencia

`movimiento_inventario` guarda el kardex inmutable de cada entrada, salida o ajuste: cantidad, `stock_anterior`, `stock_nuevo`, origen, destino, solicitud asociada, empleado responsable, motivo y fecha. Ninguna operación del sistema modifica `insumo.stock` sin dejar su fila de movimiento en la misma transacción, y en cada insumo se cumple **stock = entradas − salidas − ajustes**.

Las **entradas** se pueden corregir (`PUT /api/solicitudes/movimientos/:id`, solo admin): la diferencia se aplica al stock y a todos los movimientos posteriores del insumo en la misma transacción, y se rechaza (409) si dejaría el inventario negativo. Las salidas no se editan: se corrigen con una entrada o un ajuste.

## Producción

La guía completa está en [despliegue.md](despliegue.md). Medidas propias del entorno publicado:

- **HTTPS obligatorio** con Caddy (certificado automático y HSTS). Node escucha solo en `127.0.0.1` (`HOST`), así que el puerto 3001 no es accesible desde internet.
- **Usuario de MySQL con permisos mínimos** (`deploy/mysql-usuario.sql`): solo SELECT/INSERT/UPDATE/DELETE sobre `precision_helpdesk`; nunca `root`.
- **`JWT_SECRET` de 32+ caracteres**: el servidor se niega a arrancar en producción con una clave más corta.
- **Pool de MySQL acotado** (`DB_POOL_SIZE`, 20 por defecto) para no agotar las conexiones del servidor.
- **Socket.io solo con el protocolo actual** (se quitó `allowEIO3`).
- **Respaldo diario** con `deploy/respaldar.sh` (credenciales fuera de la línea de comandos, 14 días de retención, permisos solo para el dueño).

### Riesgos aceptados y cómo se mitigan

| Riesgo | Situación | Mitigación |
|---|---|---|
| Archivos de `/storage` sin sesión | Evidencias, fotos y manuales se sirven sin login (las etiquetas `<img>` y el visor de PDF no pueden enviar el token). | Los nombres de evidencias llevan 12 caracteres aleatorios: no se pueden adivinar ni listar. No subir como evidencia información confidencial (contraseñas, datos bancarios). |
| `nodemailer` (aviso alto) | La falla está en `resolveContent()`, que el sistema no usa. | Revisar al actualizar a la versión mayor 10. |
| `exceljs` → `uuid` (aviso moderado) | Solo afecta llamadas con *buffer* propio que el sistema no hace. | Sin arreglo compatible; revisar en cada `npm audit`. |

## Incidente: credenciales y datos personales en el historial de GitHub (16/11/2026)

**Qué pasó.** El repositorio de GitHub es **público** y su historial contiene:

1. La **contraseña del usuario `root` de MySQL**, dentro de scripts de prueba (`check-db*.js`) guardados por *checkpoints* automáticos de Cline (4 commits publicados).
2. **Datos personales de empleados**: `Dump20261109.sql`, `personal.csv`, `insumos.csv` y `movimientos.csv` (nombres, correos corporativos y hashes bcrypt de contraseñas).

Los archivos ya no están en la versión actual, pero **siguen en el historial** y cualquiera puede verlos.

**Qué hacer (en este orden):**

1. **Hacer privado el repositorio**: GitHub → Settings → *Danger Zone* → *Change visibility* → Private.
2. **Cambiar la contraseña de `root` de MySQL** y dejar de usar `root` en la aplicación (`deploy/mysql-usuario.sql`).
3. **Pedir a los empleados que cambien su contraseña**: los hashes bcrypt son lentos de romper, pero las contraseñas débiles caen. Quien entre con Zoho no se ve afectado.
4. **Limpiar el historial** con [`git filter-repo`](https://github.com/newren/git-filter-repo) eliminando esos archivos y forzar el `push`. Es irreversible y obliga a volver a clonar en cada equipo: hacerlo con un respaldo del repositorio.
5. Borrar las referencias locales de Cline: `git for-each-ref --format="%(refname)" refs/cline | xargs -n1 git update-ref -d`.

**Prevención:** `server/.env`, `backups/`, `*.sql` y `*.csv` de la raíz están en `.gitignore`; no guardar credenciales en scripts de prueba; revisar `git status` antes de cada commit.

