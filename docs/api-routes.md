# Rutas y contrato de API

Prefijo base: `/api`. Todas las respuestas son JSON UTF-8 (`Content-Type: application/json`). Cualquier ruta `/api/*` no registrada responde `404` con JSON, nunca HTML.

## Formato de las respuestas

- Exito con recurso: objeto plano (`GET /api/auth/departamentos` devuelve un arreglo; `GET /api/tickets/:id` un objeto).
- Exito con accion: `{ "ok": true, ... }`.
- Error: `{ "error": "mensaje legible" }`. En desarrollo algunos errores agregan `detalle`; en produccion se omite.
- Validacion (Zod): `422` con `{ "error": "Datos invalidos", "errores": [ { "campo": "titulo", "mensaje": "..." } ] }`.
- Paginacion (listados): `{ "data": [...], "total": N, "page": 1, "limit": 50, "pages": N }`. `limit` se trunca al maximo del endpoint.

## Autenticacion y tokens

- Cabecera obligatoria en rutas protegidas: `Authorization: Bearer <JWT>`.
- Payload del token: `{ id_empleado, id_rol, ver }` (ver = `empleado.token_version`). Expiracion: 12 horas. Firma con `JWT_SECRET`.
- Renovacion: `POST /api/auth/refresh-token` con el token vigente devuelve `{ ok: true, token }` (otros 12 h); rechaza usuarios inactivos.
- Revocacion: el logout incrementa `token_version`; todos los tokens emitidos antes quedan invalidos (`401` "Sesion cerrada").
- Mutaciones (POST, PUT, PATCH, DELETE) deben enviar ademas `x-requested-with: 1` (proteccion CSRF). Exentas: `/login`, `/logout`, `/recuperar`, `/verificar-codigo`, `/reset-password`.
- Cuerpos JSON con `Content-Type: application/json`; los endpoints de archivos usan `multipart/form-data`.

Niveles de acceso usados en las tablas: publico, JWT (autenticado), dueno-o-admin, soporte-o-admin (rol 1 o departamento Soporte Tecnico), admin (rol 1).

## /api/auth

| Metodo | Ruta | Acceso | Descripcion |
| --- | --- | --- | --- |
| POST | /login | publico | Devuelve token, id_acceso y datos del usuario |
| POST | /logout | publico | Cierra el registro de acceso; revoca tokens si envia Authorization |
| POST | /refresh-token | JWT | Renueva el token |
| POST | /recuperar | publico | Envia codigo de recuperacion por correo |
| POST | /verificar-codigo | publico | Valida el codigo de recuperacion |
| POST | /reset-password | publico | Cambia la contrasena con el token de recuperacion |
| GET | /zoho/login | publico | Inicia SSO con Zoho (OIDC) y redirige |
| GET | /zoho/callback | publico | Callback de Zoho; emite el JWT interno |
| PUT | /perfil/:id | dueno | Actualiza perfil propio |
| POST | /perfil/:id/foto | dueno | Sube foto de perfil (ver divergencia en database.md) |
| GET | /accesos/:id | dueno-o-admin | Historial de accesos paginado de un empleado |
| GET | /accesos | admin | Historial de accesos global paginado |
| GET | /departamentos | JWT | Catalogo de departamentos |
| GET | /sucursales | JWT | Catalogo de sucursales |
| GET | /roles | JWT | Catalogo de roles |
| GET | /empleados/:id | JWT | Detalle de un empleado |
| GET | /empleados | admin | Listado completo de empleados |
| POST | /empleados | admin | Crea un empleado |
| PUT | /empleados/:id | admin | Edita cualquier empleado |
| POST | /empleados/:id/foto | admin | Cambia la foto de cualquier empleado |

## /api/categorias

| Metodo | Ruta | Acceso | Descripcion |
| --- | --- | --- | --- |
| GET | / | JWT | Categorias completas con flags en_tickets, en_insumos, en_manuales |

## /api/tickets

| Metodo | Ruta | Acceso | Descripcion |
| --- | --- | --- | --- |
| POST | / | JWT | Crea ticket (multipart con evidencias opcionales) |
| GET | / | admin | Listado con filtros y paginacion |
| GET | /metricas | admin | Metricas del dashboard |
| GET | /rendimiento | admin | Rendimiento por tecnico |
| GET | /reporte | admin | Tickets por rango de fechas para exportar (requiere fecha_inicio y fecha_fin) |
| GET | /admins | admin | Empleados administradores activos (lista de tecnicos) |
| GET | /folio/:folio | JWT | Ticket por folio |
| GET | /empleado/:id_empleado | dueno-o-admin | Tickets de un empleado |
| GET | /:id_ticket | dueno-o-admin | Detalle del ticket |
| PATCH | /:id_ticket | admin | Cambia estatus, comentarios y tecnico |
| PATCH | /:id_ticket/cancelar | dueno-o-admin | Cancela ticket En proceso |
| PATCH | /:id_ticket/calificar | dueno | Calificacion 1-5 |
| PUT | /:id_ticket/editar | dueno-o-admin | Edita titulo, descripcion, prioridad y categoria |
| GET | /:id_ticket/imagenes | dueno-o-admin | Nombres de las evidencias |
| POST | /:id_ticket/imagenes | dueno-o-admin | Agrega evidencias (maximo 8 archivos) |
| DELETE | /:id_ticket/imagenes/:nombre | dueno-o-admin | Elimina una evidencia |
| GET | /:id_ticket/historial | dueno-o-admin | Cambios registrados del ticket |

## /api/solicitudes

| Metodo | Ruta | Acceso | Descripcion |
| --- | --- | --- | --- |
| POST | / | JWT | Crea solicitud con items |
| GET | / | admin | Listado con filtros y paginacion |
| GET | /metricas | admin | Metricas del dashboard de solicitudes |
| GET | /reporte | admin | Solicitudes por rango de fechas para exportar |
| GET | /pendientes | admin | Solicitudes sin cerrar por prioridad |
| POST | /insumos | admin | Crea insumo |
| PUT | /insumos/:id | admin | Actualiza insumo |
| DELETE | /insumos/:id | admin | Elimina insumo (falla con solicitudes activas) |
| PATCH | /insumos/:id/activo | admin | Habilita o inhabilita el insumo |
| POST | /insumos/:id/foto | admin | Sube imagen del insumo |
| POST | /insumos/:id/entrada | admin | Registra ENTRADA (suma stock y movimiento) |
| POST | /salidas | admin | Salida manual (descuenta stock y movimiento) |
| GET | /movimientos | admin | Kardex filtrable |
| GET | /movimientos/mis-salidas | JWT | Salidas de la sucursal del usuario |
| GET | /insumos/:id/movimientos | admin | Movimientos de un insumo |
| GET | /insumos/stock-bajo | admin | Insumos con stock <= 5 |
| GET | /insumos | JWT | Insumos con stock > 0 |
| GET | /inventario | JWT | Todos los insumos |
| GET | /empleado/:id_empleado | dueno-o-admin | Solicitudes de un empleado |
| GET | /folio/:folio | JWT | Solicitud por folio |
| GET | /:id | JWT | Detalle de la solicitud |
| PATCH | /:id/estatus | admin | Acepta/rechaza; puede descontar stock |
| PATCH | /:id/items | admin | Aprueba items y cantidades |
| PATCH | /:id/items/:id_item/observaciones | soporte-o-admin | Observacion sobre un item |
| PATCH | /:id/ruta | soporte-o-admin | Ruta del material (origen y destino) |
| GET | /:id/movimientos | admin | Salidas generadas por la solicitud |

## /api/manuales

| Metodo | Ruta | Acceso | Descripcion |
| --- | --- | --- | --- |
| GET | / | JWT | Lista manuales con URL y tamano |
| POST | / | admin | Sube PDF + metadatos (multipart, campo archivo) |
| PUT | /:id | admin | Editar metadatos |
| POST | /:id/reemplazar | admin | Reemplazar solo el PDF |
| DELETE | /:id | admin | Eliminar PDF y registro |

## Utilidades

| Metodo | Ruta | Acceso | Descripcion |
| --- | --- | --- | --- |
| GET | /api/ping | publico | Liveness; usado como healthcheck (railway.json) |
| GET | /api/health | JWT | Estado del pool de conexiones, memoria y uptime |

## Limites de peticiones (express-rate-limit)

| Ruta | Limite |
| --- | --- |
| POST /api/auth/login | 10 intentos / 15 min por IP |
| /api/auth/recuperar, /verificar-codigo, /reset-password | 5 intentos / 15 min por IP |
| POST /api/auth/logout | 30 peticiones / 15 min por IP |
| GET /api/auth/zoho/login | 20 intentos / 15 min por IP |
| POST /api/tickets | 30 tickets / hora por IP |
| POST /api/solicitudes | 20 solicitudes / hora por IP |

En produccion la IP real se obtiene con `trust proxy = 1` (ver operations.md).

## Entradas y respuestas representativas

### Autenticacion

`POST /api/auth/login`

```json
{
  "email": "usuario@ptp.com.mx",
  "password": "Segura#2026"
}
```

Respuesta `200`:

```json
{
  "ok": true,
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "id_acceso": 359,
  "usuario": {
    "id_empleado": 12,
    "num_empleado": "PTP-0012",
    "nombre": "Ana",
    "ap_paterno": "Garcia",
    "ap_materno": "Lopez",
    "email": "usuario@ptp.com.mx",
    "foto": null,
    "id_rol": 2,
    "rol": "usuario",
    "departamento": "Ventas",
    "id_departamento": 3,
    "id_sucursal": 7,
    "sucursal": "SUCURSAL PUEBLA"
  }
}
```

Errores: `401` credenciales incorrectas o dominio no permitido (mismo mensaje generico), `403` usuario inactivo, `429` limite de intentos.

`POST /api/auth/logout`

```json
{ "id_acceso": 359 }
```

Respuesta: `{ "ok": true }`. El frontend usa `navigator.sendBeacon`, por eso la ruta es publica; si se envia `Authorization` valido, ademas incrementa `token_version`.

`POST /api/auth/refresh-token`: sin cuerpo; requiere `Authorization`. Respuesta: `{ "ok": true, "token": "..." }`.

### Tickets

`POST /api/tickets` (multipart/form-data): campos `titulo`, `descripcion`, `prioridad` (`Urgente|Alta|Media|Baja`), `id_categoria` y hasta 8 archivos en el campo `evidencias`.

Respuesta `201`:

```json
{ "ok": true, "id_ticket": 74, "folio_ticket": "PTP-20261012-0001" }
```

`PATCH /api/tickets/:id_ticket` (admin):

```json
{
  "estatus": "Resuelto",
  "comentarios": "Se cambio el disco duro y se verifico el arranque.",
  "id_resuelto_por": 5
}
```

`estatus` acepta `En proceso`, `Resuelto`, `No Resuelto` o `Cancelado`. El ticket pasa a resuelto con `fecha_resuelto` automatica y notifica por Socket.io al dueno y a admins.

`PATCH /api/tickets/:id_ticket/calificar` (dueno):

```json
{ "calificacion": 5 }
```

`PUT /api/tickets/:id_ticket/editar` (dueno o admin): `titulo`, `descripcion`, `prioridad`, `id_categoria` obligatorios; `estatus` y `comentarios` opcionales (el estatus solo se aplica si es `En proceso`).

`GET /api/tickets/` (admin) - query string: `page`, `limit` (maximo 10000, default 100), `estatus`, `prioridad`, `q` (busqueda), `fecha_inicio`, `fecha_fin`, `tecnico`, `usuario`, `area`, `sucursal`. Respuesta paginada estandar.

`GET /api/tickets/reporte` (admin): requiere `fecha_inicio` y `fecha_fin`; acepta ademas `id_tecnico`, `estatus`, `prioridad`, `usuario`, `area`, `sucursal`, `q`. Devuelve el arreglo completo para exportar.

### Solicitudes e inventario

`POST /api/solicitudes`

```json
{
  "prioridad": "Media",
  "id_empleado": 12,
  "descripcion": "Se requieren teclados para la sucursal Puebla.",
  "insumos": [
    { "id_insumo": 3, "cantidad": 2, "descripcion": "Teclado USB" },
    { "id_insumo": 9, "cantidad": 1 }
  ]
}
```

`descripcion` es la justificacion general (obligatoria, maximo 2000 caracteres); se replica como justificacion de cada item cuando el item no trae la suya. El backend valida que `id_empleado` coincida con el JWT (salvo admin) y que exista stock suficiente. Respuesta `201`: `{ "ok": true, "id_solicitud": 40, "folio_solicitud": "SAL-20261012-0001" }`.

`PATCH /api/solicitudes/:id/estatus` (admin)

```json
{
  "estatus": "Aceptado",
  "id_sucursal_origen": 8,
  "id_sucursal_destino": 7,
  "items": [
    { "id_item": 5, "aprobado": 1, "cantidad_aprobada": 2 }
  ]
}
```

Al pasar a `Resuelto` el backend descuenta el stock en la misma transaccion y registra los movimientos de salida. Errores frecuentes: `409` stock insuficiente (el mensaje oculta cifras a los no admins).

`PATCH /api/solicitudes/:id/items` (admin)

```json
{ "items": [ { "id_item": 5, "aprobado": 1, "cantidad_aprobada": 2 } ] }
```

`PATCH /api/solicitudes/:id/ruta` (soporte-o-admin)

```json
{ "id_sucursal_origen": 8, "id_sucursal_destino": 7 }
```

`PATCH /api/solicitudes/:id/items/:id_item/observaciones` (soporte-o-admin)

```json
{ "observaciones": "Surtido parcial: falta color negro." }
```

`POST /api/solicitudes/insumos` y `PUT /api/solicitudes/insumos/:id` (admin)

```json
{
  "nombre": "Monitor 24 pulgadas",
  "descripcion": "Monitor LED oficina",
  "marca": "Dell",
  "modelo": "P2422H",
  "num_serie": "SN-000123",
  "stock": 10,
  "estado": "Excelente",
  "id_categoria": 4
}
```

`POST /api/solicitudes/insumos/:id/entrada` (admin)

```json
{ "cantidad": 5, "motivo": "Compra local", "id_sucursal_destino": 8 }
```

`POST /api/solicitudes/salidas` (admin)

```json
{ "id_insumo": 3, "cantidad": 1, "motivo": "Asignacion a usuario", "id_sucursal_origen": 8 }
```

### Historial de accesos

`GET /api/auth/accesos?page=1&limit=50` (admin) y `GET /api/auth/accesos/:id?page=1&limit=50` (dueno o admin). `limit` maximo 200.

```json
{
  "data": [
    {
      "id_acceso": 358,
      "id_empleado": 12,
      "fecha_entrada": "2026-10-12T09:00:00.000Z",
      "fecha_salida": "2026-10-12T18:12:00.000Z",
      "nombre_empleado": "Ana Garcia Lopez",
      "email": "usuario@ptp.com.mx",
      "nombre_departamento": "Ventas"
    }
  ],
  "total": 358,
  "page": 1,
  "limit": 50,
  "pages": 8
}
```

La ruta global agrega nombre y departamento; la personal solo `id_acceso`, `fecha_entrada` y `fecha_salida`. El filtro por fechas y tipo (entrada/salida) se aplica en el cliente sobre el listado.

### Manuales y categorias

`POST /api/manuales` (multipart): campo `archivo` (PDF, maximo 50 MB) mas `nombre` (obligatorio), `descripcion` y `id_categoria` (obligatorio). Varias cargas simultaneas responden `207` con un arreglo de resultados por archivo. `PUT /api/manuales/:id` recibe JSON con `nombre`, `descripcion` e `id_categoria`.

`GET /api/categorias` devuelve un arreglo de objetos `{ id_categoria, nombre_categoria, en_tickets, en_insumos, en_manuales }`.
