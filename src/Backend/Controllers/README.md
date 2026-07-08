# Backend / Controllers

Capa de lógica de negocio HTTP. Cada controlador recibe `(req, res)`, orquesta llamadas a Models, emite eventos Socket.io y retorna la respuesta JSON. No contienen SQL directo salvo queries de enriquecimiento puntual que no justifican un método de modelo.

---

## authController.js

**Responsabilidad:** Autenticación de usuarios y CRUD completo de empleados.

**Funciones principales:**

| Función | Descripción |
|---------|-------------|
| `login` | Verifica credenciales con bcrypt, cierra sesiones huérfanas, registra entrada en `historial_acceso`, firma JWT con `jti` único |
| `logout` | Registra salida en `historial_acceso`; si viene token, revoca el `jti` en `token_revocado` |
| `refreshToken` | Firma un nuevo JWT con nuevo `jti`; requiere token válido |
| `actualizarPerfil` | Actualiza nombre/email/contraseña del propio empleado; exige contraseña actual para cambiar la nueva |
| `subirFotoEmpleado` | Elimina foto anterior del disco, guarda ruta relativa en BD |
| `crearEmpleado` | Hashea contraseña (bcrypt 12 rounds), inserta empleado con estatus `Activo` |
| `updateEmpleadoAdmin` | Permite al admin actualizar cualquier campo incluyendo rol, departamento y estatus |
| `getAllEmpleados` / `getEmpleadoById` | Consultas de lectura; nunca exponen el campo `password` |
| `getDepartamentos` / `getRoles` / `getSucursales` | Catálogos de referencia |
| `getAccesos` / `getAllAccesos` | Historial de accesos paginado por empleado o global |

**Relación:** Usa `Empleado` (Model), `bcryptjs`, `jsonwebtoken`, `uploadFotos` (Middleware), `safeResolvePath` (security), `revocarToken` (authMiddleware).

**Entradas:** `req.body` validado por Zod (via `validate` middleware), `req.params.id`, `req.usuario` (payload JWT).

**Salidas:** JSON con `{ ok, token, usuario }` en login; `{ ok, empleado }` en mutaciones; arrays en listados.

---

## resetController.js

**Responsabilidad:** Flujo de recuperación de contraseña en tres pasos: solicitud → verificación → restablecimiento.

**Lógica principal:**
- Estado de tokens en un `Map` en memoria, persistido en `Workers/reset_tokens.json` con escritura atómica.
- TTL de 10 minutos, máximo 5 intentos fallidos por token.
- `solicitarRecuperacion`: genera código con `crypto.randomInt`, lo hashea con bcrypt (10 rounds), llama a `enviarCodigoRecuperacion`.
- `verificarCodigo`: compara con `bcrypt.compare`, marca `verificado = true` en el Map.
- `resetPassword`: acepta flujo con o sin verificación previa; aplica política de contraseña (8+ chars, mayúscula, número, símbolo); hashea con bcrypt 12 rounds.
- Limpieza automática de tokens expirados cada 30 minutos.

**Relación:** Usa `Empleado` (Model), `mailer.js` (Config), `bcryptjs`, `crypto`.

**Entradas:** `req.body.email`, `req.body.codigo`, `req.body.password_nueva`.

**Salidas:** `{ ok: true, message }` en éxito; `{ error }` con código HTTP apropiado en fallo.

---

## ticketsController.js

**Responsabilidad:** Ciclo completo de tickets de soporte técnico.

**Funciones principales:**

| Función | Descripción |
|---------|-------------|
| `crearTicket` | Crea ticket, mueve evidencias de `_tmp_upload` a carpeta del folio, invalida caché, emite `ticket:confirmado` y `ticket:nuevo` |
| `actualizarTicket` | Cambia estatus/comentarios/técnico; registra historial de cambios; emite `ticket:en_atencion` o `ticket:actualizado` |
| `calificarTicket` | Guarda calificación 1-5; lanza 409 si ya fue calificado; emite `ticket:calificado` |
| `editarTicketUsuario` | Edita campos solo si estatus es `En proceso` |
| `cancelarTicket` | Solo el dueño puede cancelar; solo si está `En proceso`; emite `ticket:actualizado` |
| `agregarImagenesTicket` / `eliminarImagenTicket` | Gestión de evidencias en disco con `safeResolvePath` |
| `getMetricas` | Delega a `Ticket.getMetricas()` (con caché 2 min) |
| `getReporte` | Tickets filtrados por rango de fechas y técnico opcional |
| `getRendimientoTecnicos` | Métricas de resolución por técnico (con caché 2 min) |
| `getAllTickets` | Listado paginado con filtros de estatus, prioridad, búsqueda y fechas |

**Relación:** Usa `Ticket` y `Empleado` (Models), `getIO` (socketInstance), `cache` (Config), `safeResolvePath` (security), `EVIDENCIAS_BASE` (uploadEvidencias).

**Entradas:** `req.body` validado por Zod, `req.params`, `req.query`, `req.files` (Multer), `req.usuario`.

**Salidas:** JSON con datos del ticket, listas paginadas `{ data, total, page, limit, pages }`, o `{ ok: true }`.

---

## solicitudesController.js

**Responsabilidad:** Gestión de solicitudes de insumos e inventario.

**Funciones principales:**

| Función | Descripción |
|---------|-------------|
| `crearSolicitud` | Valida ownership, crea solicitud con transacción, emite `solicitud:nueva` |
| `actualizarEstatusSolicitud` | Si estatus es `Resuelto`: transacción con `FOR UPDATE` para descontar stock; verifica stock crítico post-descuento; emite `insumo:stock_critico` si aplica |
| `aprobarItemsSolicitud` | Actualiza campo `aprobado` por ítem en `solicitud_insumo` |
| `crearInsumo` / `actualizarInsumo` / `eliminarInsumo` | CRUD de inventario; `eliminarInsumo` verifica que no haya solicitudes activas (409 Conflict) |
| `subirFotoInsumo` | Elimina foto anterior, guarda nueva en `storage/Insumos/` |
| `getInsumos` | Solo insumos con `stock > 0` (para formulario de solicitud) |
| `getInventario` | Todos los insumos sin filtro (para vista admin) |
| `getInsumosStockBajo` | Insumos con `stock ≤ 5` con nivel de alerta calculado |
| `getReporteSolicitudes` | Solicitudes filtradas por rango de fechas con datos agregados |

**Relación:** Usa `Solicitud`, `Insumo`, `Empleado` (Models), `getIO` (socketInstance), `pool` (db), `INSUMOS_DIR` (uploadInsumos).

**Entradas:** `req.body` validado por Zod, `req.params`, `req.query`, `req.file` (Multer), `req.usuario`.

**Salidas:** JSON con datos de solicitud/insumo, listas paginadas, o `{ ok: true }`.

---

## categoriasController.js

**Responsabilidad:** Expone el catálogo de categorías del sistema.

**Lógica principal:**
- `getCategorias`: si `req.query.tipo` es `ticket`, `insumo` o `manual`, filtra por la columna booleana correspondiente (`en_tickets`, `en_insumos`, `en_manuales`). Sin filtro retorna todas.

**Relación:** Usa `Categoria` (Model).

**Entradas:** `req.query.tipo` (opcional).

**Salidas:** Array de `{ id_categoria, nombre_categoria }`.
