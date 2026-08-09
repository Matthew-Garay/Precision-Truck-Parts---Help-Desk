# Pruebas y Validación — Precision Truck Parts, Parts and Accesories, S.A de C.V. HelpDesk

## Herramientas utilizadas

| Tipo de prueba | Herramienta | Instalación |
|---|---|---|
| API REST (backend) | **Postman** | [postman.com/downloads](https://www.postman.com/downloads/) — gratuito |
| Interfaz de usuario | **Manual en navegador** | Chrome / Edge (sin instalación) |
| Base de datos | **MySQL Workbench** | [dev.mysql.com/downloads/workbench](https://dev.mysql.com/downloads/workbench/) |
| Tiempo real (Socket.io) | **Postman WebSocket** | Incluido en Postman |

> No se requiere ningún framework de testing (Jest, Vitest, etc.). Todas las pruebas son funcionales y se ejecutan con el sistema corriendo en modo desarrollo (`npm run dev:all`).

---

## Requisitos previos

1. Sistema corriendo: `npm run dev:all`
2. Base de datos importada: `mysql -u root -p < database.sql`
3. Postman instalado con una colección nueva
4. Variables de entorno en Postman:

| Variable | Valor |
|---|---|
| `base_url` | `http://localhost:3001/api` |
| `token_admin` | *(se llena al hacer login como admin)* |
| `token_usuario` | *(se llena al hacer login como usuario)* |

---

## 1. Pruebas de Autenticación

### PT-AUTH-01 — Login exitoso como administrador

**Herramienta:** Postman

**Pasos:**
1. Crear request `POST {{base_url}}/auth/login`
2. En la pestaña **Headers** agregar:
 - `Content-Type: application/json`
 - `x-requested-with: XMLHttpRequest`
3. En **Body -> raw -> JSON** poner:
```json
{
 "email": "admin@precisiontrucks.com",
 "password": "Admin123."
}
```
4. Clic en **Send**

**Resultado esperado:**
- Status: `200 OK`
- Body contiene `ok: true`, `token`, `id_acceso` y objeto `usuario` con `id_rol: 1`

**Qué valida:** Login correcto, generación de JWT, registro en `historial_acceso`

---

### PT-AUTH-02 — Login con credenciales incorrectas

**Pasos:** Igual que PT-AUTH-01 pero con `"password": "contraseñaWrong"`

**Resultado esperado:**
- Status: `401 Unauthorized`
- Body: `{ "error": "Correo o contraseña incorrectos" }`

**Qué valida:** No se filtra si el correo existe o no (mismo mensaje para ambos casos)

---

### PT-AUTH-03 — Login con usuario inactivo

**Preparación en MySQL Workbench:**
```sql
UPDATE empleado SET estatus = 'Inactivo' WHERE email = 'admin@precisiontrucks.com';
```

**Pasos:** Ejecutar PT-AUTH-01

**Resultado esperado:**
- Status: `403 Forbidden`
- Body: `{ "error": "Usuario inactivo, contacta al administrador" }`

**Limpieza:**
```sql
UPDATE empleado SET estatus = 'Activo' WHERE email = 'admin@precisiontrucks.com';
```

---

### PT-AUTH-04 — Acceso a ruta protegida sin token

**Pasos:**
1. `GET {{base_url}}/auth/empleados`
2. Sin header `Authorization`

**Resultado esperado:**
- Status: `401 Unauthorized`
- Body: `{ "error": "No autorizado" }`

---

### PT-AUTH-05 — Acceso a ruta de admin con token de usuario

**Preparación:** Tener `token_usuario` de un empleado con `id_rol: 2`

**Pasos:**
1. `GET {{base_url}}/auth/empleados`
2. Header: `Authorization: Bearer {{token_usuario}}`
3. Header: `x-requested-with: XMLHttpRequest`

**Resultado esperado:**
- Status: `403 Forbidden`
- Body: `{ "error": "Acceso restringido a administradores" }`

---

### PT-AUTH-06 — Rate limiting en login (10 intentos / 15 min)

**Pasos:**
1. Enviar 11 veces seguidas el request de PT-AUTH-02 (credenciales incorrectas)
2. En el intento 11

**Resultado esperado:**
- Status: `429 Too Many Requests`

**Qué valida:** El rate limiter de `express-rate-limit` está activo

---

### PT-AUTH-07 — Recuperación de contraseña (flujo completo)

**Pasos:**
1. `POST {{base_url}}/auth/recuperar` con `{ "email": "admin@precisiontrucks.com" }`
 - Resultado esperado: `200 OK` con mensaje genérico (aunque SMTP no esté configurado)
2. Revisar en MySQL el código generado (solo en desarrollo):
```sql
-- No hay tabla para esto; el código está en Workers/reset_tokens.json
```
3. `POST {{base_url}}/auth/verificar-codigo` con `{ "email": "...", "codigo": "XXXXXX" }`
 - Resultado esperado: `200 OK`, `{ "ok": true }`
4. `POST {{base_url}}/auth/reset-password` con email, codigo y `password_nueva` válida
 - Resultado esperado: `200 OK`, `{ "ok": true }`
5. Intentar login con la nueva contraseña
 - Resultado esperado: Login exitoso

---

### PT-AUTH-08 — Política de contraseña

**Pasos:** En PT-AUTH-07 paso 4, probar estas contraseñas inválidas:

| Contraseña | Error esperado |
|---|---|
| `abc` | Mínimo 8 caracteres |
| `abcdefgh` | Debe contener al menos una mayúscula |
| `Abcdefgh` | Debe contener al menos un número |
| `Abcdefg1` | Debe contener al menos un carácter especial |
| `Abcdefg1.` | `200 OK` — contraseña válida |

---

## 2. Pruebas de Tickets

### PT-TICK-01 — Crear ticket como usuario

**Pasos:**
1. `POST {{base_url}}/tickets`
2. Headers:
 - `Authorization: Bearer {{token_usuario}}`
 - `x-requested-with: XMLHttpRequest`
3. Body (form-data para soportar archivos):
 - `titulo`: `Computadora no enciende`
 - `descripcion`: `Al presionar el botón de encendido no hay respuesta`
 - `prioridad`: `Alta`
 - `id_categoria`: `1`

**Resultado esperado:**
- Status: `201 Created`
- Body contiene `ok: true`, `folio_ticket` con formato `PTP-YYYYMM-NNN`

**Verificar en BD:**
```sql
SELECT * FROM ticket ORDER BY id_ticket DESC LIMIT 1;
```

---

### PT-TICK-02 — Crear ticket con campos faltantes

**Pasos:** Igual que PT-TICK-01 pero omitir `descripcion`

**Resultado esperado:**
- Status: `422 Unprocessable Entity`
- Body contiene `errores` con el campo `descripcion`

---

### PT-TICK-03 — Crear ticket con descripción mayor a 5000 caracteres

**Pasos:** Igual que PT-TICK-01 pero `descripcion` con 5001 caracteres

**Resultado esperado:**
- Status: `422`
- Error: `"La descripción no puede superar 5000 caracteres"`

---

### PT-TICK-04 — Ver ticket propio como usuario

**Preparación:** Usar el `id_ticket` del ticket creado en PT-TICK-01

**Pasos:**
1. `GET {{base_url}}/tickets/:id_ticket`
2. Header: `Authorization: Bearer {{token_usuario}}`

**Resultado esperado:**
- Status: `200 OK`
- Body contiene todos los campos del ticket

---

### PT-TICK-05 — Ver ticket de otro usuario (acceso denegado)

**Pasos:**
1. Crear un ticket con `token_usuario`
2. Intentar acceder con `token_admin` de otro empleado que no sea admin

**Resultado esperado:**
- Status: `403 Forbidden`

---

### PT-TICK-06 — Actualizar estatus de ticket (admin)

**Pasos:**
1. `PATCH {{base_url}}/tickets/:id_ticket`
2. Header: `Authorization: Bearer {{token_admin}}`
3. Header: `x-requested-with: XMLHttpRequest`
4. Body:
```json
{
 "estatus": "En proceso",
 "id_resuelto_por": 1
}
```

**Resultado esperado:**
- Status: `200 OK`
- Body: `{ "ok": true, "estatus": "En proceso" }`

**Verificar en BD:**
```sql
SELECT estatus, id_tecnico FROM ticket WHERE id_ticket = :id;
```

---

### PT-TICK-07 — Calificar ticket resuelto

**Preparación:** Cambiar el ticket a estatus `Resuelto` con PT-TICK-06

**Pasos:**
1. `PATCH {{base_url}}/tickets/:id_ticket/calificar`
2. Header: `Authorization: Bearer {{token_usuario}}`
3. Body: `{ "calificacion": 5 }`

**Resultado esperado:**
- Status: `200 OK`

**Intentar calificar de nuevo:**
- Status: `409 Conflict` — ya fue calificado

---

### PT-TICK-08 — Cancelar ticket

**Pasos:**
1. Crear un ticket nuevo (PT-TICK-01)
2. `PATCH {{base_url}}/tickets/:id_ticket/cancelar`
3. Header: `Authorization: Bearer {{token_usuario}}`

**Resultado esperado:**
- Status: `200 OK`

**Intentar cancelar un ticket ya Resuelto:**
- Status: `409 Conflict`

---

### PT-TICK-09 — Subir evidencias al crear ticket

**Pasos:** Igual que PT-TICK-01 pero en form-data agregar:
- Clave `evidencias`, tipo **File**, adjuntar una imagen `.jpg`

**Resultado esperado:**
- Status: `201 Created`
- Body: `{ "imagenes": 1 }`
- Verificar que el archivo existe en `storage/Evidencias_Tickets/PTP-YYYYMM-NNN/`

---

### PT-TICK-10 — Intentar subir más de 8 evidencias

**Pasos:** Adjuntar 9 archivos en el campo `evidencias`

**Resultado esperado:**
- Status: `400 Bad Request` — límite de archivos excedido

---

## 3. Pruebas de Solicitudes de Insumos

### PT-SOL-01 — Crear solicitud de insumos

**Pasos:**
1. `POST {{base_url}}/solicitudes`
2. Header: `Authorization: Bearer {{token_usuario}}`
3. Header: `x-requested-with: XMLHttpRequest`
4. Body:
```json
{
 "prioridad": "Media",
 "id_empleado": 2,
 "insumos": [
 { "id_insumo": 1, "cantidad": 2 },
 { "id_insumo": 2, "cantidad": 1 }
 ]
}
```

**Resultado esperado:**
- Status: `201 Created`
- Body contiene `folio_solicitud` con formato `SOL-YYYYMM-NNN`

---

### PT-SOL-02 — Crear solicitud en nombre de otro usuario

**Pasos:** Igual que PT-SOL-01 pero con `id_empleado` de otro empleado diferente al del token

**Resultado esperado:**
- Status: `403 Forbidden`
- Body: `{ "error": "No puedes crear solicitudes en nombre de otro usuario" }`

---

### PT-SOL-03 — Aprobar solicitud y verificar descuento de stock

**Preparación:** Anotar el stock actual del insumo:
```sql
SELECT id_insumo, nombre, stock FROM insumo WHERE id_insumo = 1;
```

**Pasos:**
1. `PATCH {{base_url}}/solicitudes/:id/estatus`
2. Header: `Authorization: Bearer {{token_admin}}`
3. Body:
```json
{
 "estatus": "Aceptado",
 "items": [
 { "id_solicitud_insumo": 1, "aprobado": 1, "cantidad_aprobada": 2 }
 ]
}
```

**Resultado esperado:**
- Status: `200 OK`
- Verificar en BD que el stock disminuyó:
```sql
SELECT stock FROM insumo WHERE id_insumo = 1;
-- Debe ser stock_anterior - 2
```

---

### PT-SOL-04 — Intentar aprobar solicitud ya cerrada

**Pasos:** Repetir PT-SOL-03 sobre la misma solicitud ya aprobada

**Resultado esperado:**
- Status: `409 Conflict`
- Body: `{ "error": "La solicitud ya está cerrada" }`

---

### PT-SOL-05 — Solicitud con insumo sin stock

**Preparación:**
```sql
UPDATE insumo SET stock = 0 WHERE id_insumo = 1;
```

**Pasos:** Intentar crear solicitud con ese insumo (PT-SOL-01)

**Resultado esperado:**
- Status: `400 Bad Request`
- Error indicando que el insumo no tiene stock disponible

**Limpieza:**
```sql
UPDATE insumo SET stock = 10 WHERE id_insumo = 1;
```

---

## 4. Pruebas de Inventario (CRUD)

### PT-INV-01 — Crear insumo

**Pasos:**
1. `POST {{base_url}}/solicitudes/insumos`
2. Header: `Authorization: Bearer {{token_admin}}`
3. Body:
```json
{
 "nombre": "Cable HDMI 2m",
 "descripcion": "Cable HDMI de alta velocidad",
 "marca": "Genérico",
 "modelo": "HDMI-2M",
 "stock": 15,
 "estado": "Excelente",
 "id_categoria": 1
}
```

**Resultado esperado:**
- Status: `201 Created`
- Body contiene el insumo creado con `id_insumo`

---

### PT-INV-02 — Crear insumo con estado inválido

**Pasos:** Igual que PT-INV-01 pero `"estado": "Perfecto"` (no está en el enum)

**Resultado esperado:**
- Status: `422 Unprocessable Entity`

---

### PT-INV-03 — Eliminar insumo con solicitudes activas

**Preparación:** Crear una solicitud que use el insumo y dejarla en estado `En proceso`

**Pasos:**
1. `DELETE {{base_url}}/solicitudes/insumos/:id`
2. Header: `Authorization: Bearer {{token_admin}}`

**Resultado esperado:**
- Status: `409 Conflict`
- Body: `{ "error": "No se puede eliminar: el insumo tiene solicitudes activas pendientes" }`

---

## 5. Pruebas de Seguridad

### PT-SEG-01 — Protección CSRF

**Pasos:**
1. `POST {{base_url}}/auth/login` con credenciales válidas
2. **Sin** el header `x-requested-with`

**Resultado esperado:**
- Status: `403 Forbidden`
- Body: `{ "error": "Solicitud no permitida (CSRF)" }`

> **Nota:** Las rutas `/login`, `/logout`, `/recuperar`, `/verificar-codigo` y `/reset-password` están exentas de CSRF intencionalmente.

---

### PT-SEG-02 — Path traversal en evidencias

**Pasos:**
1. `DELETE {{base_url}}/tickets/1/imagenes/..%2F..%2F.env`
2. Header: `Authorization: Bearer {{token_admin}}`

**Resultado esperado:**
- Status: `400` o `404`
- El archivo `.env` no debe ser eliminado
- Verificar que el archivo sigue existiendo en disco

---

### PT-SEG-03 — Token JWT expirado

**Pasos:**
1. Modificar temporalmente `JWT_SECRET` en `.env` a otro valor
2. Reiniciar el servidor
3. Usar un token generado antes del cambio

**Resultado esperado:**
- Status: `401 Unauthorized`
- Body: `{ "error": "Token inválido o expirado" }`

**Limpieza:** Restaurar el `JWT_SECRET` original

---

### PT-SEG-04 — Token revocado después de logout

**Pasos:**
1. Hacer login y guardar el token
2. Hacer logout: `POST {{base_url}}/auth/logout` con `{ "id_acceso": X }`
3. Intentar usar el mismo token en cualquier ruta protegida

**Resultado esperado:**
- Status: `401 Unauthorized`
- Body: `{ "error": "Sesión cerrada. Inicia sesión de nuevo." }`

---

### PT-SEG-05 — Acceso a archivos `.json` en `/storage`

**Pasos:**
1. Abrir en el navegador: `http://localhost:3001/storage/alert_state.json`

**Resultado esperado:**
- Status: `403 Forbidden` o `404 Not Found`
- El contenido del archivo no debe ser visible

---

## 6. Pruebas de Validación de Esquemas Zod

Estas pruebas verifican que el middleware `validate.js` rechaza datos malformados antes de llegar al controlador.

### PT-ZOD-01 — Email inválido en login

**Body:** `{ "email": "no-es-un-email", "password": "Test123." }`

**Resultado esperado:**
- Status: `422`
- `errores[0].campo`: `"email"`, `errores[0].mensaje`: `"Correo inválido"`

---

### PT-ZOD-02 — Prioridad inválida en ticket

**Body:** `{ "titulo": "Test", "descripcion": "Test", "prioridad": "Extrema", "id_categoria": 1 }`

**Resultado esperado:**
- Status: `422`
- Error en campo `prioridad`

---

### PT-ZOD-03 — Calificación fuera de rango

**Body:** `{ "calificacion": 6 }`

**Resultado esperado:**
- Status: `422`
- Error en campo `calificacion`

---

### PT-ZOD-04 — Solicitud sin insumos

**Body:** `{ "prioridad": "Alta", "id_empleado": 2, "insumos": [] }`

**Resultado esperado:**
- Status: `422`
- Error: `"Debe incluir al menos un insumo"`

---

## 7. Pruebas de Interfaz de Usuario

Estas pruebas se realizan directamente en el navegador en `http://localhost:5173`.

### PT-UI-01 — Login y redirección por rol

| Acción | Resultado esperado |
|---|---|
| Login como admin | Redirige a `/admin/dashboard` |
| Login como usuario | Redirige a `/usuario/dashboard` |
| Acceder a `/admin/dashboard` sin login | Redirige a `/login` |

---

### PT-UI-02 — Crear ticket desde la interfaz

**Pasos:**
1. Login como usuario
2. Ir a **Nuevo Reporte**
3. Llenar todos los campos y adjuntar una imagen
4. Clic en **Enviar**

**Resultado esperado:**
- Toast de confirmación verde con el folio del ticket
- El ticket aparece en **Historial de Incidencias**

---

### PT-UI-03 — Notificación en tiempo real

**Pasos:**
1. Abrir dos pestañas del navegador
2. Pestaña 1: Login como **admin**
3. Pestaña 2: Login como **usuario**
4. En pestaña 2: Crear un ticket nuevo

**Resultado esperado:**
- En pestaña 1 (admin): Aparece notificación en la campana con el nuevo ticket sin recargar la página

---

### PT-UI-04 — Cambio de tema claro/oscuro

**Pasos:**
1. Clic en el botón de tema (sol/luna) en el dashboard
2. Recargar la página

**Resultado esperado:**
- El tema persiste después de recargar (guardado en `localStorage`)

---

### PT-UI-05 — Validación de formulario en el frontend

**Pasos:**
1. Ir a **Nuevo Reporte**
2. Intentar enviar el formulario vacío

**Resultado esperado:**
- Los campos requeridos muestran mensajes de error
- El formulario no se envía

---

### PT-UI-06 — Exportar reporte PDF

**Pasos:**
1. Login como admin
2. Ir a **Historial de Incidencias**
3. Clic en **Exportar PDF**
4. Seleccionar rango de fechas y clic en **Generar**

**Resultado esperado:**
- Se descarga un archivo `.pdf` con los tickets del período seleccionado

---

## 8. Pruebas de Workers en Segundo Plano

Estas pruebas verifican el comportamiento de los jobs automáticos de `scheduledJobs.js`.

### PT-WORK-01 — Cierre automático de tickets vencidos (SLA 48h)

**Preparación en BD:**
```sql
-- Simular un ticket con más de 48 horas
UPDATE ticket
SET fecha_subido = DATE_SUB(NOW(), INTERVAL 49 HOUR)
WHERE id_ticket = :id AND estatus = 'En proceso';
```

**Pasos:**
1. Esperar hasta el próximo ciclo del worker (máx 1 hora) **o** reiniciar el servidor para forzar ejecución inmediata del intervalo en el primer tick

**Resultado esperado:**
```sql
SELECT estatus FROM ticket WHERE id_ticket = :id;
-- Resultado: 'No Resuelto'
```

---

### PT-WORK-02 — Alerta de stock crítico

**Preparación:**
```sql
UPDATE insumo SET stock = 3 WHERE id_insumo = 1;
```

**Pasos:**
1. Abrir el dashboard de admin en el navegador
2. Esperar el ciclo del worker de stock (24h) **o** verificar que la campana de notificaciones muestra la alerta al conectarse

**Resultado esperado:**
- Notificación `insumo:stock_critico` visible en la campana del admin

---

## 9. Pruebas de Base de Datos

### PT-BD-01 — Folio único bajo concurrencia

**Verificar que no existen folios duplicados:**
```sql
SELECT folio_ticket, COUNT(*) AS total
FROM ticket
GROUP BY folio_ticket
HAVING total > 1;
-- Resultado esperado: 0 filas
```

---

### PT-BD-02 — Integridad referencial al eliminar empleado

**Pasos:**
```sql
-- Crear empleado de prueba
INSERT INTO empleado (num_empleado, nombre, ap_paterno, email, password, id_rol, id_departamento, estatus)
VALUES ('TEST-99', 'Prueba', 'Borrar', 'prueba.borrar@test.com', 'hash', 2, 1, 'Activo');

-- Obtener su id
SET @id = LAST_INSERT_ID();

-- Crear un acceso para ese empleado
INSERT INTO historial_acceso (id_empleado, fecha_entrada) VALUES (@id, NOW());

-- Eliminar el empleado
DELETE FROM empleado WHERE id_empleado = @id;

-- Verificar que el historial se eliminó en cascada
SELECT * FROM historial_acceso WHERE id_empleado = @id;
-- Resultado esperado: 0 filas (CASCADE activo)
```

---

### PT-BD-03 — Stock no queda negativo

**Preparación:**
```sql
UPDATE insumo SET stock = 1 WHERE id_insumo = 1;
```

**Pasos:** Crear y aprobar una solicitud de 5 unidades del insumo con stock = 1

**Resultado esperado:**
- Status: `400 Bad Request`
- El stock no debe quedar en valor negativo
- Verificar:
```sql
SELECT stock FROM insumo WHERE id_insumo = 1;
-- Debe seguir siendo 1
```

---

## 10. Resumen de Casos de Prueba

| ID | Módulo | Descripción | Tipo |
|---|---|---|---|
| PT-AUTH-01 | Auth | Login exitoso admin | Funcional |
| PT-AUTH-02 | Auth | Login credenciales incorrectas | Negativo |
| PT-AUTH-03 | Auth | Login usuario inactivo | Negativo |
| PT-AUTH-04 | Auth | Ruta protegida sin token | Seguridad |
| PT-AUTH-05 | Auth | Ruta admin con token usuario | Seguridad |
| PT-AUTH-06 | Auth | Rate limiting login | Seguridad |
| PT-AUTH-07 | Auth | Recuperación contraseña completa | Funcional |
| PT-AUTH-08 | Auth | Política de contraseña | Validación |
| PT-TICK-01 | Tickets | Crear ticket exitoso | Funcional |
| PT-TICK-02 | Tickets | Crear ticket sin campos | Validación |
| PT-TICK-03 | Tickets | Descripción > 5000 chars | Validación |
| PT-TICK-04 | Tickets | Ver ticket propio | Funcional |
| PT-TICK-05 | Tickets | Ver ticket ajeno | Seguridad |
| PT-TICK-06 | Tickets | Actualizar estatus (admin) | Funcional |
| PT-TICK-07 | Tickets | Calificar ticket resuelto | Funcional |
| PT-TICK-08 | Tickets | Cancelar ticket | Funcional |
| PT-TICK-09 | Tickets | Subir evidencias | Funcional |
| PT-TICK-10 | Tickets | Más de 8 evidencias | Validación |
| PT-SOL-01 | Solicitudes | Crear solicitud exitosa | Funcional |
| PT-SOL-02 | Solicitudes | Solicitud en nombre de otro | Seguridad |
| PT-SOL-03 | Solicitudes | Aprobar y descontar stock | Funcional |
| PT-SOL-04 | Solicitudes | Aprobar solicitud cerrada | Negativo |
| PT-SOL-05 | Solicitudes | Insumo sin stock | Negativo |
| PT-INV-01 | Inventario | Crear insumo | Funcional |
| PT-INV-02 | Inventario | Estado inválido | Validación |
| PT-INV-03 | Inventario | Eliminar con solicitudes activas | Negativo |
| PT-SEG-01 | Seguridad | Protección CSRF | Seguridad |
| PT-SEG-02 | Seguridad | Path traversal | Seguridad |
| PT-SEG-03 | Seguridad | Token JWT expirado | Seguridad |
| PT-SEG-04 | Seguridad | Token revocado post-logout | Seguridad |
| PT-SEG-05 | Seguridad | Archivos .json bloqueados | Seguridad |
| PT-ZOD-01 | Validación | Email inválido | Validación |
| PT-ZOD-02 | Validación | Prioridad inválida | Validación |
| PT-ZOD-03 | Validación | Calificación fuera de rango | Validación |
| PT-ZOD-04 | Validación | Solicitud sin insumos | Validación |
| PT-UI-01 | UI | Login y redirección por rol | Funcional |
| PT-UI-02 | UI | Crear ticket desde interfaz | Funcional |
| PT-UI-03 | UI | Notificación en tiempo real | Funcional |
| PT-UI-04 | UI | Persistencia de tema | Funcional |
| PT-UI-05 | UI | Validación frontend | Validación |
| PT-UI-06 | UI | Exportar PDF | Funcional |
| PT-WORK-01 | Workers | Cierre automático SLA 48h | Funcional |
| PT-WORK-02 | Workers | Alerta stock crítico | Funcional |
| PT-BD-01 | BD | Folios únicos | Integridad |
| PT-BD-02 | BD | CASCADE al eliminar empleado | Integridad |
| PT-BD-03 | BD | Stock no negativo | Integridad |

**Total: 46 casos de prueba**
