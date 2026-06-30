# PrecisionTrucks HelpDesk

Sistema de gestión de tickets de soporte técnico, solicitudes de insumos, inventario y documentación para **Precision Truck Parts & Accessories**.

---

## Stack tecnológico

| Capa       | Tecnología                                      |
|------------|-------------------------------------------------|
| Frontend   | React 18, Vite 6, Tailwind CSS 4                |
| Backend    | Node.js + Express 5, Socket.io 4                |
| Base de datos | MySQL 8 (InnoDB, utf8mb4)                    |
| Auth       | JWT (jsonwebtoken), bcryptjs                    |
| Email      | Nodemailer (SMTP)                               |
| Uploads    | Multer 2                                        |
| Validación | Zod 4                                           |

---

## Requisitos previos

- Node.js 18+
- MySQL 8.x
- npm

---

## Instalación

```bash
# 1. Clonar el repositorio
git clone <url-del-repo>
cd PrecisionTrucks_HelpDesk

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .env.example .env
# Editar .env con los valores reales
```

---

## Base de datos

```bash
# Importar el esquema completo (tablas + datos iniciales)
mysql -u root -p < database.sql
```

Crea la base `precision_helpdesk` con un administrador por defecto:

| Campo | Valor                     |
|-------|---------------------------|
| Email | admin@precisiontrucks.com |
| Clave | `Admin123.`               |

> Cambia la contraseña desde **Configuración de Perfil** después del primer login.

---

## Variables de entorno

```env
# Servidor
PORT=3001
NODE_ENV=development

# MySQL
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=TU_CONTRASEÑA
DB_NAME=precision_helpdesk
DB_SSL=false

# JWT — genera con: node -e "require('crypto').randomBytes(64).toString('hex')|console.log"
JWT_SECRET=CAMBIA_ESTO_POR_UN_SECRETO_LARGO

# SMTP (Gmail con contraseña de aplicación)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu@gmail.com
SMTP_PASS=xxxx xxxx xxxx xxxx
SMTP_FROM="Precision HelpDesk" <tu@gmail.com>

# Frontend
VITE_API_URL=
CORS_ORIGIN=http://localhost:5173
APP_URL=http://localhost:5173
```

Si `SMTP_USER` no está configurado, los correos se omiten silenciosamente (útil en desarrollo).

---

## Comandos de desarrollo

```bash
# Frontend (Vite) + Backend (Express) en paralelo
npm run dev:all

# Solo frontend  → http://localhost:5173
npm run dev

# Solo backend   → http://localhost:3001
npm run server
```

Verificar que el servidor está activo:
```
GET http://localhost:3001/api/ping
→ { "status": "ok", "message": "Servidor HelpDesk activo ✅" }
```

---

## Build de producción

```bash
npm run build
# Archivos estáticos generados en dist/
# El archivo public/.htaccess configura SPA routing en Apache
```

---

## Estructura del proyecto

```
PrecisionTrucks_HelpDesk/
├── docs/
│   └── ARQUITECTURA.md          ← Diseño, flujos y decisiones técnicas
├── public/
│   ├── assets/img/              ← Logos e imágenes de marca
│   └── .htaccess                ← SPA routing para Apache
├── storage/                     ← Archivos subidos (NO versionar contenido)
│   ├── Evidencias_Tickets/      ← Imágenes adjuntas a tickets (por folio)
│   ├── Fotos de Perfil/         ← Avatares de empleados
│   ├── Insumos/                 ← Fotos de insumos del inventario
│   └── Manuales/                ← PDFs del módulo de documentación
├── src/
│   ├── Backend/
│   │   ├── Config/
│   │   │   ├── db.js            ← Pool MySQL2 (promise), timezone -06:00
│   │   │   ├── mailer.js        ← Nodemailer: notificación de ticket + recuperación
│   │   │   └── socketInstance.js← Singleton Socket.io (evita dependencia circular)
│   │   ├── Controllers/
│   │   │   ├── authController.js     ← Login, logout, empleados, perfil, historial
│   │   │   ├── categoriasController.js← Catálogo compartido de categorías
│   │   │   ├── resetController.js    ← Recuperación de contraseña (código 6 dígitos)
│   │   │   ├── solicitudesController.js← CRUD solicitudes + inventario de insumos
│   │   │   └── ticketsController.js  ← Ciclo completo de tickets + métricas
│   │   ├── Middlewares/
│   │   │   ├── authMiddleware.js     ← requireAuth (JWT) + requireAdmin (rol 1)
│   │   │   ├── security.js          ← CSRF por header + safeResolvePath
│   │   │   ├── uploadEvidencias.js  ← Multer: imágenes de tickets (jpg/png/gif/webp)
│   │   │   ├── uploadFotos.js       ← Multer: fotos de perfil
│   │   │   ├── uploadManuales.js    ← Multer: PDFs de manuales
│   │   │   └── validate.js         ← Schemas Zod para todos los endpoints
│   │   ├── Models/
│   │   │   ├── Categoria.js    ← Queries: tabla categoria
│   │   │   ├── Empleado.js     ← Queries: tabla empleado + historial_acceso
│   │   │   ├── Insumo.js       ← Queries: tabla insumo (incluye getStockBajo)
│   │   │   ├── Manual.js       ← Queries: tabla manual
│   │   │   ├── Solicitud.js    ← Queries: solicitud + solicitud_insumo
│   │   │   └── Ticket.js       ← Queries: ticket (incluye cerrarVencidos)
│   │   ├── Routes/
│   │   │   ├── authRoutes.js        ← /api/auth/*
│   │   │   ├── categoriasRoutes.js  ← /api/categorias
│   │   │   ├── manualesRoutes.js    ← /api/manuales
│   │   │   ├── solicitudesRoutes.js ← /api/solicitudes/*
│   │   │   └── ticketsRoutes.js     ← /api/tickets/*
│   │   ├── Workers/
│   │   │   ├── alertState.js        ← Sets persistentes en JSON (anti-duplicado)
│   │   │   ├── alert_state.json     ← Estado en disco (NO versionar)
│   │   │   └── scheduledJobs.js     ← 5 jobs: SLA, vencidos, sesiones, stock, sin atender
│   │   └── server.js               ← Entry point: Express + Socket.io + workers
│   ├── Frontend/
│   │   ├── Components/
│   │   │   ├── context/
│   │   │   │   └── ToastContext.js  ← createContext del sistema de toasts
│   │   │   ├── hooks/
│   │   │   │   ├── usePdfCover.js   ← Hook: miniatura de portada PDF (pdfjs-dist)
│   │   │   │   └── useToast.js      ← Hook: API toast (success/error/warning/info)
│   │   │   ├── Inventario/
│   │   │   │   ├── ModalEliminar.jsx← Modal confirmación de eliminación
│   │   │   │   └── ModalInsumo.jsx  ← Formulario crear/editar insumo
│   │   │   ├── CampanaNotificaciones.jsx ← Panel de notificaciones en tiempo real
│   │   │   ├── Card.jsx             ← Tarjeta de métrica con icono y valor
│   │   │   ├── ConfiguracionPerfilShared.jsx← Formulario cambio contraseña
│   │   │   ├── DashboardShared.jsx  ← Widgets del dashboard (reloj, calendario, etc.)
│   │   │   ├── ErrorBoundary.jsx    ← Captura errores de render en React
│   │   │   ├── ExportarPDFBtn.jsx   ← Botón export PDF con jsPDF
│   │   │   ├── Feedback.jsx         ← Modal, ModalConfirm, ToastProvider, Tooltip, InlineAlert
│   │   │   ├── FiltrosToolbar.jsx   ← Barra de búsqueda y filtros de tabla
│   │   │   ├── Icons.jsx            ← Re-exports centralizados de lucide-react
│   │   │   ├── ManualDetailPanel.jsx← Panel lateral de detalle de manual PDF
│   │   │   ├── ManualTable.jsx      ← Tabla/grid de manuales con portada PDF
│   │   │   ├── Modal.jsx            ← Modal genérico (alias de Feedback.Modal)
│   │   │   ├── ModalReporte.jsx     ← Modal con filtros para exportar reportes
│   │   │   ├── PantallaCarga.jsx    ← Splash screen inicial de la app
│   │   │   ├── PantallaSalida.jsx   ← Pantalla de transición al hacer logout
│   │   │   ├── PerfilShared.jsx     ← Vista de perfil del empleado
│   │   │   ├── SkeletonTable.jsx    ← Placeholder de carga para tablas
│   │   │   ├── StockBar.jsx         ← Barra visual de nivel de stock
│   │   │   └── ThemeToggle.jsx      ← Botón claro/oscuro
│   │   ├── Config/
│   │   │   ├── api.js               ← apiFetch + API_ROUTES + manejo JWT + clearSession
│   │   │   ├── DesignSystem.js      ← Tokens de diseño: colores, tipografía, componentes
│   │   │   ├── NotificationService.js← Sonidos Web Audio API + NOTIFICATION_DISPLAY
│   │   │   ├── session.js           ← Helpers sessionStorage (usuario, id_acceso)
│   │   │   ├── theme.jsx            ← RelojFecha y Calendario para el dashboard
│   │   │   ├── ThemeContext.jsx     ← ThemeProvider: persiste tema en localStorage
│   │   │   ├── themeContext.js      ← createContext + useTheme (sin JSX)
│   │   │   ├── themeTokens.js       ← Tokens LIGHT / DARK (colores por tema)
│   │   │   ├── useAutoRefresh.js    ← Hook: polling pausado al cambiar de pestaña
│   │   │   ├── useSocket.js         ← Hook: conexión Socket.io con JWT
│   │   │   └── useTicketNotification.js← Hook: orquesta notificaciones + historial
│   │   ├── Pages/
│   │   │   ├── Admin/
│   │   │   │   ├── ConfiguracionPerfil.jsx ← Perfil + cambio de contraseña (admin)
│   │   │   │   ├── Dashboard.jsx           ← Shell del dashboard admin con sidebar
│   │   │   │   ├── HistorialIncidencias.jsx← Listado y filtros de todos los tickets
│   │   │   │   ├── HistorialInsumos.jsx    ← Historial de solicitudes de insumos
│   │   │   │   ├── Inventario.jsx          ← CRUD inventario + solicitudes pendientes
│   │   │   │   ├── ManualesIncidencias.jsx ← Módulo de gestión de manuales PDF
│   │   │   │   ├── Personal.jsx            ← CRUD de empleados + historial de accesos
│   │   │   │   ├── RendimientoTecnicos.jsx ← Métricas de resolución por técnico
│   │   │   │   ├── SubirManual.jsx         ← Formulario subida de manual PDF
│   │   │   │   ├── VistaSolicitud.jsx      ← Detalle de solicitud con aprobación de ítems
│   │   │   │   └── VistaTicket.jsx         ← Detalle de ticket con cambio de estatus
│   │   │   ├── Usuario/
│   │   │   │   ├── ConfiguracionPerfil.jsx ← Perfil + cambio de contraseña (usuario)
│   │   │   │   ├── Dashboard.jsx           ← Shell del dashboard usuario con sidebar
│   │   │   │   ├── HistorialIncidencias.jsx← Tickets propios del usuario
│   │   │   │   ├── ManualesIncidencias.jsx ← Consulta de manuales (solo lectura)
│   │   │   │   ├── NuevoReporte.jsx        ← Formulario crear ticket con evidencias
│   │   │   │   ├── SolicitudInsumo.jsx     ← Formulario solicitar insumos
│   │   │   │   ├── VistaInsumos.jsx        ← Catálogo de insumos disponibles
│   │   │   │   ├── VistaSolicitud.jsx      ← Detalle de solicitud propia
│   │   │   │   └── VistaTicket.jsx         ← Detalle de ticket propio + calificación
│   │   │   └── login.jsx                   ← Pantalla pública de autenticación
│   │   └── Styles/
│   │       ├── design-system.css   ← Variables CSS + clases base + skeleton
│   │       └── login.css           ← Estilos de la página de login
│   ├── main.jsx                    ← Entry point React: proveedores + rutas protegidas
│   └── orientation.css             ← Mensaje de rotación para móviles en landscape
├── .env                            ← Variables locales (NO versionar)
├── .env.example                    ← Plantilla segura
├── .gitignore
├── index.html                      ← Entry point HTML de Vite
├── package.json
├── vite.config.js                  ← Vite + proxy /api, /storage, /fotos, /socket.io
└── README.md
```

---

## API REST

Todos los endpoints están bajo `/api/`. Los que requieren autenticación esperan el header:
```
Authorization: Bearer <token>
```

### Autenticación `/api/auth`

| Método | Ruta                    | Acceso    | Descripción                          |
|--------|-------------------------|-----------|--------------------------------------|
| POST   | /login                  | Público   | Login con email + password           |
| POST   | /logout                 | Público   | Cierra registro de sesión            |
| POST   | /recuperar              | Público   | Envía código de recuperación por email|
| POST   | /verificar-codigo       | Público   | Valida el código de 6 dígitos        |
| POST   | /reset-password         | Público   | Establece nueva contraseña           |
| POST   | /refresh-token          | Auth      | Renueva el JWT activo (12h)          |
| GET    | /empleados              | Admin     | Lista todos los empleados            |
| POST   | /empleados              | Admin     | Crea un nuevo empleado               |
| PUT    | /empleados/:id          | Admin     | Edita datos de un empleado           |
| POST   | /empleados/:id/foto     | Admin     | Sube foto de perfil de empleado      |
| GET    | /empleados/:id          | Auth      | Datos de un empleado específico      |
| PUT    | /perfil/:id             | Auth      | Actualiza perfil propio              |
| POST   | /perfil/:id/foto        | Auth      | Sube foto de perfil propia           |
| GET    | /accesos                | Admin     | Historial de accesos global          |
| GET    | /accesos/:id            | Auth/Own  | Historial de accesos propio          |
| GET    | /departamentos          | Auth      | Catálogo de departamentos            |
| GET    | /roles                  | Auth      | Catálogo de roles                    |
| GET    | /sucursales             | Auth      | Catálogo de sucursales               |

### Tickets `/api/tickets`

| Método | Ruta                         | Acceso    | Descripción                         |
|--------|------------------------------|-----------|-------------------------------------|
| GET    | /                            | Admin     | Lista paginada de todos los tickets |
| POST   | /                            | Auth      | Crea ticket (máx 30/hora por IP)    |
| GET    | /metricas                    | Admin     | Estadísticas del dashboard          |
| GET    | /admins                      | Admin     | Lista de administradores activos    |
| GET    | /reporte                     | Admin     | Tickets filtrados para exportar     |
| GET    | /rendimiento                 | Admin     | Métricas de rendimiento por técnico |
| GET    | /empleado/:id_empleado       | Auth/Own  | Tickets de un empleado              |
| GET    | /:id_ticket                  | Auth/Own  | Detalle de un ticket                |
| PATCH  | /:id_ticket                  | Admin     | Actualiza estatus/técnico           |
| PUT    | /:id_ticket/editar           | Auth/Own  | Edita ticket (solo En proceso)      |
| PATCH  | /:id_ticket/calificar        | Auth/Own  | Califica ticket resuelto (1-5)      |
| PATCH  | /:id_ticket/cancelar         | Auth/Own  | Cancela ticket                      |
| GET    | /:id_ticket/imagenes         | Auth      | Lista evidencias del ticket         |
| POST   | /:id_ticket/imagenes         | Auth      | Agrega evidencias (máx 8)           |
| DELETE | /:id_ticket/imagenes/:nombre | Auth      | Elimina una evidencia               |

### Solicitudes de insumos `/api/solicitudes`

| Método | Ruta                    | Acceso    | Descripción                         |
|--------|-------------------------|-----------|-------------------------------------|
| GET    | /                       | Admin     | Lista paginada de solicitudes       |
| POST   | /                       | Auth      | Crea solicitud (máx 20/hora por IP) |
| GET    | /reporte                | Admin     | Solicitudes filtradas para exportar |
| GET    | /pendientes             | Admin     | Solicitudes sin resolver            |
| GET    | /insumos                | Auth      | Insumos con stock > 0               |
| GET    | /insumos/stock-bajo     | Auth      | Insumos con stock ≤ 5               |
| GET    | /inventario             | Auth      | Todos los insumos (sin filtro)      |
| POST   | /insumos                | Admin     | Crea insumo                         |
| PUT    | /insumos/:id            | Admin     | Edita insumo                        |
| DELETE | /insumos/:id            | Admin     | Elimina insumo                      |
| GET    | /empleado/:id_empleado  | Auth/Own  | Solicitudes de un empleado          |
| GET    | /:id                    | Auth      | Detalle de solicitud                |
| PATCH  | /:id/estatus            | Admin     | Cambia estatus (descuenta stock)    |
| PATCH  | /:id/items              | Admin     | Aprueba ítems individuales          |

### Categorías y Manuales

| Método | Ruta              | Acceso | Descripción                    |
|--------|-------------------|--------|--------------------------------|
| GET    | /api/categorias   | Auth   | Lista categorías del sistema   |
| GET    | /api/manuales     | Auth   | Lista manuales disponibles     |
| POST   | /api/manuales     | Admin  | Sube nuevo manual PDF          |
| PUT    | /api/manuales/:id | Admin  | Edita metadatos del manual     |
| DELETE | /api/manuales/:id | Admin  | Elimina PDF + registro         |

---

## Roles y accesos

| Rol           | id_rol | Capacidades                                                        |
|---------------|--------|--------------------------------------------------------------------|
| Administrador | 1      | Gestión completa: tickets, inventario, personal, manuales, reportes |
| Usuario       | 2      | Crear tickets, solicitar insumos, ver historial propio, manuales   |

---

## Eventos Socket.io en tiempo real

El servidor emite eventos a salas específicas (`empleado_{id}` o `admins`):

| Evento                | Sala destino       | Descripción                               |
|-----------------------|--------------------|-------------------------------------------|
| `ticket:nuevo`        | admins             | Nuevo ticket creado por usuario           |
| `solicitud:nueva`     | admins             | Nueva solicitud de insumos               |
| `ticket:calificado`   | admins             | Usuario calificó un ticket resuelto       |
| `tickets:vencidos`    | admins             | Worker cerró tickets por SLA expirado     |
| `ticket:sla_warning`  | admins             | Ticket próximo a superar 48h             |
| `insumo:stock_critico`| admins             | Insumo con stock ≤ 5 unidades            |
| `ticket:sin_atender`  | admins             | Ticket +24h sin técnico asignado         |
| `ticket:actualizado`  | empleado_{id}      | Estatus del ticket cambió                |
| `ticket:en_atencion`  | empleado_{id}      | Técnico tomó el ticket                   |
| `ticket:confirmado`   | empleado_{id}      | Confirmación inmediata de ticket creado  |
| `ticket:cancelado`    | empleado_{id}      | Ticket fue cancelado                     |
| `solicitud:actualizada`| empleado_{id}     | Estatus de solicitud cambió              |

---

## Workers en segundo plano

El servidor arranca 5 jobs automáticos al iniciar (`scheduledJobs.js`):

| Job                  | Intervalo | Función                                           |
|----------------------|-----------|---------------------------------------------------|
| Alertas SLA          | 30 min    | Emite `ticket:sla_warning` para tickets ≥ 46.5h  |
| Cierre automático    | 1 hora    | Cierra como "No Resuelto" tickets ≥ 48h          |
| Sesiones huérfanas   | 1 hora    | Cierra `historial_acceso` sin fecha_salida ≥ 12h |
| Stock crítico        | 1 hora    | Emite `insumo:stock_critico` para stock ≤ 5      |
| Tickets sin atender  | 1 hora    | Emite `ticket:sin_atender` para tickets ≥ 24h sin técnico |

Los Sets de deduplicación persisten en `Workers/alert_state.json` para sobrevivir reinicios del servidor sin reenviar alertas.

---

## Base de datos — Tablas principales

| Tabla              | Descripción                                              |
|--------------------|----------------------------------------------------------|
| `departamento`     | Catálogo de áreas de la empresa                          |
| `rol`              | Roles del sistema (1=Admin, 2=Usuario)                   |
| `categoria`        | Catálogo compartido por tickets, insumos y manuales      |
| `sucursal`         | Catálogo de sucursales                                   |
| `empleado`         | Usuarios del sistema con hash bcrypt (12 rounds)         |
| `historial_acceso` | Registro de logins/logouts (CASCADE al eliminar empleado)|
| `ticket`           | Incidencias técnicas con folio PTP-YYYYMM-NNN            |
| `insumo`           | Inventario de materiales con control de stock            |
| `solicitud`        | Solicitudes de insumos con folio SOL-YYYYMM-NNN          |
| `solicitud_insumo` | Ítems de cada solicitud (tabla de unión)                 |
| `manual`           | Registros de PDFs del módulo de documentación            |

El folio de tickets y solicitudes se genera con bloqueo `FOR UPDATE` para evitar duplicados bajo alta concurrencia.

---

## Seguridad

- **JWT** firmado con `JWT_SECRET` (12h de vigencia, renovable vía `/api/auth/refresh-token`)
- **CSRF**: todas las mutaciones requieren header `x-requested-with: XMLHttpRequest`
- **Rate limiting**: login (10/15min), recuperación (5/15min), tickets (30/hora), solicitudes (20/hora)
- **Helmet**: CSP, HSTS, X-Content-Type, referrer policy
- **Path traversal**: `safeResolvePath()` en todas las operaciones de archivo
- **Bloqueo de archivos sensibles**: `/storage` rechaza `.json` y `.env`
- **Fotos de perfil protegidas**: `/fotos` requiere JWT válido
