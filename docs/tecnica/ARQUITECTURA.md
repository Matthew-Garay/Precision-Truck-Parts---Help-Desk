# Precision Truck Parts, Parts and Accesories, S.A de C.V. — HelpDesk — Arquitectura de Software

**Versión:** 1.0
**Motor BD:** MySQL 8.x InnoDB — `precision_helpdesk`
**Patrón:** Cliente-Servidor · MVC en Backend · SPA en Frontend

---

## 1. Árbol de Directorios

```
PrecisionTrucks_HelpDesk/ Raíz del monorepo
|
|-- docs/ Documentación técnica
| |-- ARQUITECTURA.md Este archivo
| `-- DICCIONARIO_DATOS.md Esquema de las 11 tablas
|
|-- public/ Assets estáticos servidos por Vite
| |-- assets/img/ Logos e imágenes de marca
| `-- .htaccess SPA routing para Apache (producción)
|
|-- storage/ Archivos subidos por usuarios (NO versionar)
| |-- Evidencias_Tickets/ Imágenes adjuntas a tickets (por folio)
| |-- Fotos de Perfil/ Avatares de empleados
| |-- Insumos/ Fotos de productos de inventario
| `-- Manuales/ PDFs de gestión documental
|
|-- src/
| |
| |-- Backend/ Capa servidor (Node.js + Express)
| | |
| | |-- Config/ Infraestructura y conexiones externas
| | | |-- db.js Pool de conexiones MySQL2 (promise)
| | | |-- mailer.js Transporter Nodemailer (SMTP)
| | | `-- socketInstance.js Singleton de Socket.IO
| | |
| | |-- Controllers/ Lógica de negocio (capa C del MVC)
| | | |-- authController.js Login, logout, sesión activa
| | | |-- categoriasController.js CRUD categorías de tickets/insumos
| | | |-- resetController.js Flujo recuperación de contraseña
| | | |-- solicitudesController.js Gestión de solicitudes de insumos
| | | `-- ticketsController.js Ciclo de vida completo de tickets
| | |
| | |-- Middlewares/ Guardas transversales del pipeline HTTP
| | | |-- authMiddleware.js Verificación y decodificación JWT
| | | |-- security.js Helmet, CORS, rate-limit, CSRF
| | | |-- uploadEvidencias.js Multer: evidencias de tickets
| | | |-- uploadFotos.js Multer: fotos de perfil
| | | |-- uploadManuales.js Multer: PDFs de manuales
| | | `-- validate.js Validación de schemas con Zod
| | |
| | |-- Models/ Abstracción de datos (capa M del MVC)
| | | |-- Categoria.js Queries: tabla categorias
| | | |-- Empleado.js Queries: tabla empleados
| | | |-- Insumo.js Queries: tablas insumos + movimientos
| | | |-- Manual.js Queries: tabla manuales
| | | |-- Solicitud.js Queries: tabla solicitudes_insumos
| | | `-- Ticket.js Queries: tablas tickets + comentarios
| | |
| | |-- Routes/ Definición de endpoints REST
| | | |-- authRoutes.js POST /auth/login, /auth/logout
| | | |-- categoriasRoutes.js GET|POST|PUT|DELETE /categorias
| | | |-- solicitudesRoutes.js CRUD /solicitudes
| | | `-- ticketsRoutes.js CRUD + comentarios /tickets
| | |
| | |-- Workers/ Jobs programados (cron-like)
| | | |-- alertState.js Módulo de estado en memoria
| | | |-- alert_state.json Persistencia de alertas (NO versionar)
| | | `-- scheduledJobs.js SLA, stock crítico, limpieza de sesiones
| | |
| | `-- server.js Entry point: Express app + Socket.IO
| |
| `-- Frontend/ Capa cliente (React 18 + Vite + Tailwind)
| |
| |-- Components/ UI reutilizable (átomos y moléculas)
| | |-- Inventario/ Componentes específicos de inventario
| | |-- CampanaNotificaciones.jsx
| | |-- Card.jsx
| | |-- ConfiguracionPerfilShared.jsx
| | |-- DashboardShared.jsx
| | |-- ErrorBoundary.jsx Captura errores de render en React
| | |-- ExportarPDFBtn.jsx
| | |-- Feedback.jsx Componente de estados (loading/error/empty)
| | |-- FiltrosToolbar.jsx
| | |-- Icons.jsx Barrel export de Lucide icons
| | |-- ManualDetailPanel.jsx
| | |-- ManualTable.jsx
| | |-- Modal.jsx Modal genérico con portal React
| | |-- ModalReporte.jsx
| | |-- PantallaCarga.jsx Splash screen inicial
| | |-- PantallaSalida.jsx Pantalla de logout
| | |-- PerfilShared.jsx
| | |-- SkeletonTable.jsx Placeholder de carga para tablas
| | |-- StockBar.jsx Barra visual de nivel de stock
| | |-- ThemeToggle.jsx
| | |-- toastContext.js Context de notificaciones toast
| | |-- usePdfCover.js Hook: extrae portada de PDF
| | `-- useToast.js Hook: API de toasts
| |
| |-- Config/ Configuración global del cliente
| | |-- api.js Axios instance + interceptores JWT
| | |-- DesignSystem.js Tokens de diseño (colores, tipografía)
| | |-- NotificationService.js Servicio de notificaciones en tiempo real
| | |-- session.js Helpers de sesión (localStorage)
| | |-- themeContext.js Contexto + hook useTheme
| | |-- ThemeContext.jsx Context API del tema
| | |-- themeTokens.js Variables CSS de tokens por tema
| | |-- useAutoRefresh.js Hook: polling automático de datos
| | |-- useSocket.js Hook: conexión Socket.IO
| | `-- useTicketNotification.js Hook: notificaciones de tickets
| |
| |-- Pages/ Vistas por rol (capa V del MVC)
| | |-- Admin/ Dashboard y módulos de administrador
| | |-- Usuario/ Dashboard y módulos de usuario estándar
| | `-- login.jsx Página pública de autenticación
| |
| `-- Styles/ CSS global y utilitarios
| |-- design-system.css Variables CSS + clases base
| `-- login.css Estilos específicos del login
|
|-- .env Variables locales (NO versionar)
|-- .env.example Plantilla segura para el equipo
|-- .gitignore Exclusiones del repositorio
|-- database.sql DDL completo: tablas, triggers, seed
|-- index.html Entry point HTML de Vite
|-- package.json Dependencias y scripts npm
|-- vite.config.js Configuración Vite + proxy API
`-- README.md Guía de instalación y uso
```

---

## 2. Diccionario de Responsabilidades

### Flujo de una petición (Request -> Response)

```
Cliente (Browser)
 | HTTPS Request

server.js -> Registra middlewares globales y monta routers
 |

Middlewares/ -> Pipeline de seguridad transversal
 ---- security.js -> Aplica Helmet headers, valida CORS origin, aplica rate-limit
 ---- authMiddleware-> Verifica firma JWT, extrae payload, rechaza con 401 si inválido
 ---- validate.js -> Parsea el body con Zod schema; rechaza con 400 si inválido
 |

Routes/ -> Mapa de URLs -> Controller functions (solo enrutamiento)
 |

Controllers/ -> Orquesta: llama Models, construye respuesta, emite eventos WS
 |

Models/ -> Ejecuta queries parametrizadas contra el pool MySQL
 |

Config/db.js -> Pool de conexiones reutilizable (mysql2/promise)
 |

MySQL (InnoDB) -> precision_helpdesk
 |
 ---- Response JSON
```

### Por qué esta estructura previene código espagueti

| Principio | Implementación |
|-----------|---------------|
| Single Responsibility | Cada capa tiene UNA razón para cambiar: Models cambia si cambia el esquema BD; Controllers si cambia la lógica de negocio; Routes si cambia la URL |
| Open/Closed | Agregar un nuevo módulo (ej. `reportes`) solo requiere crear `Models/Reporte.js`, `Controllers/reportesController.js` y `Routes/reportesRoutes.js` sin tocar el resto |
| Separación de contextos | Los Middlewares no conocen la BD; los Models no conocen HTTP; los Controllers no construyen HTML |
| Inyección implícita | El pool de DB se importa en Models; el mailer en Controllers que lo necesitan — sin globals mutables |

---

## 3. Módulos Operativos vs. Tablas MySQL

| Módulo | Tablas | Model |
|--------|--------|-------|
| Catálogos | `categorias`, `departamentos` | `Categoria.js` |
| Core | `empleados`, `sesiones` | `Empleado.js` |
| HelpDesk | `tickets`, `comentarios_ticket` | `Ticket.js` |
| Inventario | `insumos`, `movimientos_insumo`, `solicitudes_insumos` | `Insumo.js`, `Solicitud.js` |
| Gestión Documental | `manuales` | `Manual.js` |

---

## 4. Decisiones de Diseño Clave

- **Monorepo con Vite proxy**: En desarrollo, el frontend (`:5173`) hace proxy a la API (`:3001`) evitando CORS y simplificando la configuración de cookies `SameSite`.
- **JWT stateless + tabla sesiones**: El token JWT valida identidad; la tabla `sesiones` permite revocar tokens activos (logout forzado, cambio de contraseña).
- **Socket.IO singleton**: `socketInstance.js` exporta la instancia de IO para que los Controllers puedan emitir eventos en tiempo real sin acoplar Express a Socket.IO.
- **Workers con node-cron**: Los jobs de SLA y stock crítico corren en el mismo proceso Node para simplicidad; en escala se migrarían a una cola (BullMQ/Redis).
- **Multer por tipo de archivo**: Tres middlewares de upload separados permiten configurar destinos, límites de tamaño y filtros MIME independientes por contexto.
