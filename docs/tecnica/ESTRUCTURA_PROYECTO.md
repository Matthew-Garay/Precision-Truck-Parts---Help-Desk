# Estructura del Proyecto — PrecisionTrucks HelpDesk

**Este documento es el mapa del código. Si tienes duda de qué archivo es cuál o para qué sirve algo, aquí está la respuesta.**

**Última actualización:** Septiembre 2026 · **Versión:** 2.0 (reorganización)

---

## 1. El proyecto en dos palabras: cliente-servidor + MVC

El sistema está dividido en **dos aplicaciones** que se comunican por HTTP (API REST):

```
┌─────────────────────────── CLIENTE ───────────────────────────┐
│  src/Frontend/  (React en el navegador)                       │
│  Es "la Vista" del patrón MVC: solo dibuja pantallas,          │
│  captura lo que escribe el usuario y llama a la API.          │
└──────────────────────────────┬────────────────────────────────┘
                               │  fetch /axios  (/api/*, con JWT)
                               ▼
┌─────────────────────────── SERVIDOR ──────────────────────────┐
│  src/Backend/  (Node.js + Express)                            │
│  ┌────────────┐  ┌──────────────┐  ┌────────────────────────┐ │
│  │  Routes/   │→ │ Controllers/ │→ │ Models/  (SQL) → MySQL │ │
│  │ (cuál URL) │  │ (qué hace)   │  └────────────────────────┘ │
│  └────────────┘  └──────────────┘                             │
│       = "Controlador" del patrón MVC                          │
└───────────────────────────────────────────────────────────────┘
```

Regla práctica para orientarte en el código:

| Tienes que... | Toca esto |
| --- | --- |
| Cambiar una pantalla o botón | `src/Frontend/Pages` (o `Components`) |
| Cambiar cómo se ve algo / validar un formulario | `src/Frontend/Config` o `Components` |
| Agregar/quitar una URL de la API | `src/Backend/Routes` + `Controllers` |
| Cambiar la lógica de negocio | `src/Backend/Controllers` |
| Cambiar una consulta a la base | `src/Backend/Models` |
| Bloquear/validar algo en cada petición | `src/Backend/Middlewares` |

---

## 2. Árbol general del proyecto

```
PrecisionTrucks_HelpDesk/
├── index.html          ← Punto de entrada de la app (lo abre Vite)
├── package.json        ← Dependencias y scripts (npm run dev:all, build…)
├── vite.config.js      ← Configuración de Vite y proxy hacia el backend
├── railway.json        ← Config de despliegue en Railway
├── .env / .env.example ← Variables de entorno (NUNCA versionar el .env)
├── .gitignore          ← Qué no se sube al repositorio
├── README.md           ← Presentación e instalación
│
├── src/                ← TODO el código fuente
│   ├── main.jsx        ← Entrada de React (rutas, tema, toasts, login)
│   ├── orientation.css
│   ├── Frontend/       ← CLIENTE (Vista)
│   └── Backend/        ← SERVIDOR (Controlador + Modelo)
│
├── public/             ← Archivos estáticos (logos, favicon)
├── storage/            ← Datos en tiempo de ejecución (archivos de usuarios)
├── dist/               ← Build de producción (generado, no se edita)
└── docs/               ← Documentación
```

---

## 3. Servidor — `src/Backend/` (la parte de control)

```
src/Backend/
├── server.js          ← PUNTO DE ENTRADA. Crea Express, monta Rutas,
│                        sirve el frontend en producción y hace health-check.
├── load-env.js        ← Carga el .env antes de que arranque el servidor
│
├── Config/            ← Configuración "global"
│   ├── db.js              ← Pool de conexiones a MySQL
│   ├── mailer.js          ← Envío de correos (SMTP)
│   ├── socketInstance.js  ← Instancia única de Socket.IO (notificaciones)
│   └── cache.js           ← Caché en memoria para métricas/catálogos
│
├── Routes/            ← CUÁL URL responde a qué controlador (router de Express)
│   ├── authRoutes.js        ← /api/auth (login, logout, perfil)
│   ├── ticketsRoutes.js     ← /api/tickets
│   ├── solicitudesRoutes.js ← /api/solicitudes (insumos)
│   ├── categoriasRoutes.js  ← /api/categorias
│   └── manualesRoutes.js    ← /api/manuales
│
├── Controllers/       ← LA LÓGICA (qué hace cada endpoint)
│   ├── authController.js        ← autenticación y empleados
│   ├── ticketsController.js     ← crear/atender/cerrar tickets
│   ├── solicitudesController.js ← solicitudes de insumos y estatus
│   ├── categoriasController.js  ← catálogo de categorías
│   └── resetController.js       ← recuperación de contraseña (código)
│
├── Models/            ← CONSULTAS SQL por entidad
│   ├── Empleado.js, Ticket.js, Solicitud.js
│   ├── Insumo.js, Manual.js, Categoria.js
│
├── Middlewares/       ← Se ejecutan ANTES del controlador (validar/bloquear)
│   ├── authMiddleware.js  ← valida JWT y rol (requireAuth, requireAdmin)
│   ├── security.js        ← CSRF, rate-limit
│   ├── validate.js        ← valida datos de entrada
│   └── upload*.js         ← subida de evidencias/fotos/insumos/manuales
│
├── utils/             ← Funciones auxiliares (portadas, helpers)
├── Workers/           ← Tareas automáticas (SLA, cierres, stock)
│   └── scheduledJobs.js       ← define los jobs programados
├── scripts/           ← Scripts manuales
│   ├── migrate.js              ← migraciones de base de datos (¡correr tras cada pull!)
│   └── generarPortadasExistentes.js ← regenera portadas de PDFs
```

> Los archivos `alert_state.json` y `reset_tokens.json` dentro de `Workers/` son **estado en tiempo de ejecución** (los genera el sistema y están en `.gitignore`, no se editan a mano).

---

## 4. Cliente — `src/Frontend/` (la Vista)

```
src/Frontend/
├── Pages/             ← LAS PANTALLAS (un archivo = una pantalla)
│   ├── login.jsx                     ← pantalla de inicio de sesión
│   ├── Admin/                        ← pantallas exclusivas de administrador
│   │   ├── Dashboard.jsx             ← panel con métricas y menú admin
│   │   ├── HistorialIncidencias.jsx  ← atender tickets (asignar, estados)
│   │   ├── HistorialInsumos.jsx      ← aprobar/rechazar solicitudes
│   │   ├── Inventario.jsx            ← control de stock (con exportar)
│   │   ├── RendimientoTecnicos.jsx   ← estadísticas por técnico
│   │   ├── Personal.jsx              ← crear/desactivar empleados
│   │   └── ManualesIncidencias.jsx   ← biblioteca + subir manuales
│   ├── Usuario/                      ← pantallas de usuario normal
│   │   ├── Dashboard.jsx             ← panel del usuario
│   │   ├── NuevoReporte.jsx          ← crear un ticket
│   │   ├── HistorialIncidencias.jsx  ← mis tickets
│   │   ├── SolicitudInsumo.jsx       ← pedir insumos
│   │   ├── VistaInsumos.jsx / VistaSolicitud.jsx / VistaTicket.jsx ← detalle
│   │   └── ManualesIncidencias.jsx   ← ver/descargar manuales
│   └── Print*.Page.tsx               ← vistas para imprimir/PDF (ticket, solicitud, reporte…)
│
├── Components/        ← Pedazos de interfaz REUTILIZABLES
│   ├── (Card, Modal, StockBar, ProgressTimeline, PdfViewer…)
│   ├── RelojCalendario.jsx        ← reloj y calendario del dashboard
│   ├── CampanaNotificaciones.jsx  ← campana de avisos en tiempo real
│   ├── Inventario/                ← modales del inventario
│   ├── hooks/                     ← custom hooks (useToast, usePdfCover)
│   └── context/                   ← contexto de toasts
│
├── Config/            ← Lógica de infraestructura del frontend
│   ├── api.js            ← llama a la API (adjunta JWT, maneja errores)
│   ├── session.js        ← guarda/lee la sesión (localStorage)
│   ├── themeContext.js / ThemeContext.jsx / themeTokens.js  ← tema claro/oscuro
│   ├── useSocket.js / useTicketNotification.js / useAutoRefresh.js ← notificaciones
│   ├── NotificationService.js  ← silenciar/mostrar notificaciones
│   ├── DesignSystem.js / themeTokens.js  ← colores y sistema de diseño
│   ├── pdfjs.js / printUtils.ts  ← visor de PDF e impresión
│
└── Styles/             ← CSS global (design-system.css, login.css)
```

---

## 5. Carpeta `public/` (archivos estáticos)

Vite copia estos archivos tal cual al build.

```
public/
├── .htaccess          ← reglas de Apache (para servidores Apache)
└── assets/img/        ← logos y favicon del sistema
    ├── logo.png          ← logo principal (login, dashboards, correos)
    ├── logo negro.png    ← logo para fondo claro
    ├── logo blanco.png   ← logo para fondo oscuro
    ├── logo.ico          ← favicon
    ├── log.png           ← logo para impresiones/exportaciones
    └── Fondo Precision Trucks.webp ← fondo de pantalla del login
```

## 6. Carpeta `storage/` (datos en tiempo de ejecución)

Aquí se guardan los archivos que suben los usuarios. **No se sube a Git** (solo sus `.gitkeep` para conservar la estructura). Se debe respaldar junto con la base de datos.

| Carpeta | Qué guarda |
| --- | --- |
| `Evidencias_Tickets/` | Fotos/videos adjuntos a los tickets |
| `Manuales/` | PDFs de la biblioteca de manuales |
| `Fotos de Perfil/` | Avatares de los empleados |
| `Insumos/` | Fotos de los insumos del inventario |
| `Portadas/` | Miniatura generada de cada manual PDF |

## 7. Carpeta `docs/`

| Carpeta | Qué contiene |
| --- | --- |
| `manuales_residencia/` | Manual de uso y de mantenimiento (oficiales) |
| `tecnica/` | Documentación para desarrolladores (incluye este mapa) |
| `operacion/` | Despliegue y solución de problemas en producción |
| `profesional/` | Documentación integral del proyecto |

## 8. Archivos raíz importantes

| Archivo | Para qué |
| --- | --- |
| `package.json` | Scripts (`npm run dev:all` dev, `npm run build` producción) |
| `vite.config.js` | Dev server y proxy `/api` y `/socket.io` hacia el backend |
| `index.html` | HTML que monta la app React |
| `.env` | Variables de entorno (secreto, BD, SMTP) |
| `railway.json` | Cómo se despliega en Railway |

---

## 9. Guía rápida: ¿qué abro para qué?

| Quiero... | Abro |
| --- | --- |
| Arrancar en desarrollo | Terminal: `npm run dev:all` |
| Compilar para producción | Terminal: `npm run build` |
| Cambiar el login | `src/Frontend/Pages/login.jsx` |
| Cambiar el menú del usuario | `src/Frontend/Pages/Usuario/Dashboard.jsx` (arreglo `NAV`) |
| Cambiar el menú del admin | `src/Frontend/Pages/Admin/Dashboard.jsx` (arreglo `NAV`) |
| Crear una pantalla nueva | `src/Frontend/Pages/Usuario/` o `Admin/` + registrarla en `Dashboard.jsx` |
| Añadir un endpoint nuevo | `src/Backend/Routes/…` + método en `Controllers/…` |
| Cambiar una consulta a la BD | `src/Backend/Models/…` |
| Restringir una acción a admin | `src/Backend/Middlewares/authMiddleware.js` (requireAdmin) |
| Cambiar el tema/diseño | `src/Frontend/Config/themeTokens.js` y `DesignSystem.js` |
| Ajustar notificaciones | `src/Frontend/Config/useSocket.js` / `useTicketNotification.js` |
| La app no arranca tras un `git pull` | Correr `migrate.js` (ver manual de mantenimiento) |
| Ver cómo fluye una petición | `Routes` → `Controllers` → `Models` (sección 1) |

---

## 10. Flujo de una petición (ejemplo: crear un ticket)

```
1. Pantalla NuevoReporte.jsx  →  construye el objeto y llama a api.js
2. api.js                     →  POST /api/tickets  (con JWT del usuario)
3. ticketsRoutes.js           →  enruta la URL al controlador
   └─ authMiddleware          →  valida que el token sea válido y el rol correcto
   └─ validate.js             →  valida los datos del formulario
4. ticketsController.js       →  lógica: crea el ticket, envia notificación
   └─ Ticket.js (Modelo)      →  INSERT en la tabla ticket (MySQL)
5. server.js / Socket.IO      →  avisa al admin por notificación en tiempo real
```

Ese mismo patrón (Ruta → Middleware → Controlador → Modelo) se repite en todo el backend.

---

**Fin del mapa.** Para los detalles de arquitectura y base de datos revisa `docs/tecnica/ARQUITECTURA.md` y `docs/tecnica/DiccionarioDatos.md`. Si lo que buscas es usar o mantener el sistema, abre `docs/manuales_residencia/`.


