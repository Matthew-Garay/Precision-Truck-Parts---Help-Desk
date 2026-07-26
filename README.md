<div align="center">

# PrecisionTrucks HelpDesk

**Sistema interno de soporte técnico, inventario y documentación para Precision Truck Parts and Accessories.**

[![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933?logo=node.js&logoColor=white)](https://nodejs.org)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)](https://react.dev)
[![MySQL](https://img.shields.io/badge/MySQL-8.x-4479A1?logo=mysql&logoColor=white)](https://mysql.com)
[![Vite](https://img.shields.io/badge/Vite-6-646CFF?logo=vite&logoColor=white)](https://vitejs.dev)
[![Socket.io](https://img.shields.io/badge/Socket.io-4-010101?logo=socket.io)](https://socket.io)
[![License](https://img.shields.io/badge/Licencia-Privada-red)](#)

</div>

---

## ¿Qué es esto?

PrecisionTrucks HelpDesk es una aplicación web full-stack de uso interno que centraliza:

- 🎫 **Tickets de soporte técnico** — ciclo completo con SLA de 48 h, evidencias fotográficas y calificación
- 📦 **Inventario de insumos** — CRUD con control de stock, alertas de stock crítico y solicitudes de reposición
- 📄 **Gestión documental** — biblioteca de manuales PDF con vista previa de portada
- 👥 **Administración de personal** — empleados, roles, sucursales e historial de accesos
- 🔔 **Notificaciones en tiempo real** — Socket.io + Web Audio API sin recargar la página
- 📊 **Reportes exportables** — PDF y Excel desde el dashboard de administrador

---

## Stack tecnológico

| Capa          | Tecnología                       |
| ------------- | -------------------------------- |
| Frontend      | React 18, Vite 6, Tailwind CSS 4 |
| Backend       | Node.js + Express 5, Socket.io 4 |
| Base de datos | MySQL 8 (InnoDB, utf8mb4)        |
| Auth          | JWT (jsonwebtoken 9), bcryptjs 3 |
| Validación    | Zod 4                            |
| Email         | Nodemailer 9 (SMTP)              |
| Uploads       | Multer 2, Sharp 0.35             |
| Exportación   | jsPDF 4, ExcelJS 4               |

---

## Inicio rápido

### Requisitos previos

- Node.js 18+
- MySQL 8.x
- npm

### Instalación

```bash
# 1. Clonar el repositorio
git clone <url-del-repo>
cd PrecisionTrucks_HelpDesk

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .env.example .env
# Editar .env con tus valores reales (ver sección Variables de entorno)

# 4. Importar la base de datos
mysql -u root -p < docs/database.sql
```

### Ejecutar en desarrollo

```bash
# Frontend (Vite :5173) + Backend (Express :3001) en paralelo
npm run dev:all
```

Verifica que el servidor está activo:

```
GET http://localhost:3001/api/ping
→ { "status": "ok", "message": "Servidor HelpDesk activo ✅" }
```

Credenciales del administrador por defecto:

| Campo      | Valor                       |
| ---------- | --------------------------- |
| Email      | `admin@precisiontrucks.com` |
| Contraseña | `Admin123.`                 |

> ⚠️ Cambia la contraseña desde **Configuración de Perfil** después del primer login.

---

## Variables de entorno

Copia `.env.example` a `.env` y rellena los valores:

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

# JWT — genera con: node -e "require('crypto').randomBytes(64).toString('hex')|console.log"
JWT_SECRET=CAMBIA_ESTO_POR_UN_SECRETO_LARGO

# SMTP (Gmail con contraseña de aplicación)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu@gmail.com
SMTP_PASS=xxxx xxxx xxxx xxxx
SMTP_FROM="Precision HelpDesk" <tu@gmail.com>

# Frontend / CORS
VITE_API_URL=
CORS_ORIGIN=http://localhost:5173
APP_URL=http://localhost:5173
```

> Si `SMTP_USER` no está configurado, los correos se omiten silenciosamente (útil en desarrollo).

---

## Comandos disponibles

| Comando           | Descripción                                 |
| ----------------- | ------------------------------------------- |
| `npm run dev:all` | Frontend + Backend en paralelo (desarrollo) |
| `npm run dev`     | Solo frontend → `http://localhost:5173`     |
| `npm run server`  | Solo backend → `http://localhost:3001`      |
| `npm run build`   | Build de producción en `dist/`              |

---

## Arquitectura

```
Browser
  │  HTTPS
  ▼
Express (server.js)
  ├─ Middlewares/   → Helmet, CORS, Rate-limit, CSRF, JWT, Zod
  ├─ Routes/        → Mapeo URL → Controller
  ├─ Controllers/   → Lógica de negocio + emisión Socket.io
  ├─ Models/        → Queries parametrizadas MySQL2
  └─ Workers/       → 5 jobs automáticos (SLA, stock, sesiones…)

React SPA (Vite)
  ├─ Pages/Admin/   → Dashboard, tickets, inventario, personal, reportes
  ├─ Pages/Usuario/ → Mis tickets, solicitudes, manuales
  └─ Components/    → UI reutilizable + hooks + contextos
```

Consulta [`docs/ARQUITECTURA.md`](docs/ARQUITECTURA.md) para el diseño completo con diagramas de flujo y decisiones técnicas.

---

## Roles del sistema

| Rol           | id_rol | Capacidades                                                                |
| ------------- | ------ | -------------------------------------------------------------------------- |
| Administrador | 1      | Gestión completa: tickets, inventario, personal, manuales, reportes        |
| Usuario       | 2      | Crear tickets, solicitar insumos, ver historial propio, consultar manuales |

---

## Eventos Socket.io en tiempo real

| Evento                 | Sala           | Descripción                |
| ---------------------- | -------------- | -------------------------- |
| `ticket:nuevo`         | admins         | Nuevo ticket creado        |
| `ticket:actualizado`   | empleado\_{id} | Cambio de estatus          |
| `ticket:sla_warning`   | admins         | Ticket próximo a 48 h      |
| `insumo:stock_critico` | admins         | Stock ≤ 5 unidades         |
| `solicitud:nueva`      | admins         | Nueva solicitud de insumos |
| `ticket:sin_atender`   | admins         | Ticket +24 h sin técnico   |

---

## Workers automáticos

El servidor arranca 5 jobs al iniciar:

| Job                 | Intervalo | Función                                          |
| ------------------- | --------- | ------------------------------------------------ |
| Alertas SLA         | 30 min    | Emite `ticket:sla_warning` para tickets ≥ 46.5 h |
| Cierre automático   | 1 hora    | Cierra como "No Resuelto" tickets ≥ 48 h         |
| Sesiones huérfanas  | 1 hora    | Cierra `historial_acceso` sin salida ≥ 12 h      |
| Stock crítico       | 1 hora    | Emite `insumo:stock_critico` para stock ≤ 5      |
| Tickets sin atender | 1 hora    | Emite alerta para tickets ≥ 24 h sin técnico     |

---

## Seguridad

- **JWT** HS256, 12 h de vigencia, renovable vía `/api/auth/refresh-token`
- **CSRF**: mutaciones requieren header `x-requested-with: XMLHttpRequest`
- **Rate limiting**: login (10/15 min), recuperación (5/15 min), tickets (30/h), solicitudes (20/h)
- **Helmet**: CSP, HSTS, X-Content-Type, referrer policy
- **Path traversal**: `safeResolvePath()` en todas las operaciones de archivo
- **Fotos de perfil protegidas**: `/fotos` requiere JWT válido

---

## Despliegue en producción

```bash
npm run build
# Sirve dist/ + /api/* desde el mismo proceso Node
npm run server
```

Para exponer la app con HTTPS sin abrir puertos, consulta la guía completa:
📖 [`docs/DESPLIEGUE.md`](docs/DESPLIEGUE.md) — Cloudflare Tunnel + dominio propio + PM2

También incluye configuración para **Railway** (`railway.json` en la raíz).

---

## Documentación

| Documento                                                          | Descripción                                            |
| ------------------------------------------------------------------ | ------------------------------------------------------ |
| [`docs/ARQUITECTURA.md`](docs/ARQUITECTURA.md)                     | Diseño, flujos de petición y decisiones técnicas       |
| [`docs/DICCIONARIO_DATOS.md`](docs/DICCIONARIO_DATOS.md)           | Esquema completo de las 11 tablas MySQL                |
| [`docs/IEEE830_REQUERIMIENTOS.md`](docs/IEEE830_REQUERIMIENTOS.md) | Requerimientos funcionales y no funcionales (IEEE 830) |
| [`docs/PRUEBAS_Y_VALIDACION.md`](docs/PRUEBAS_Y_VALIDACION.md)     | Plan de pruebas y casos de validación                  |
| [`docs/DESPLIEGUE.md`](docs/DESPLIEGUE.md)                         | Guía paso a paso de despliegue en producción           |
| [`docs/3.5_DESARROLLO_TECNICO.md`](docs/3.5_DESARROLLO_TECNICO.md) | Desarrollo técnico detallado del sistema               |
| [`.env.example`](.env.example)                                     | Plantilla de variables de entorno                      |

---

## Estructura del proyecto

```
PrecisionTrucks_HelpDesk/
├── docs/                        ← Documentación técnica completa
├── public/assets/img/           ← Logos e imágenes de marca
├── storage/                     ← Archivos subidos (NO versionar contenido)
│   ├── Evidencias_Tickets/
│   ├── Fotos de Perfil/
│   ├── Insumos/
│   └── Manuales/
├── src/
│   ├── Backend/
│   │   ├── Config/              ← DB pool, mailer, Socket.io singleton
│   │   ├── Controllers/         ← Lógica de negocio
│   │   ├── Middlewares/         ← Auth, seguridad, uploads, validación
│   │   ├── Models/              ← Queries MySQL parametrizadas
│   │   ├── Routes/              ← Definición de endpoints REST
│   │   ├── Workers/             ← Jobs automáticos (SLA, stock, sesiones)
│   │   └── server.js            ← Entry point Express + Socket.io
│   ├── Frontend/
│   │   ├── Components/          ← UI reutilizable + hooks + contextos
│   │   ├── Config/              ← API client, tema, notificaciones
│   │   ├── Pages/Admin/         ← Vistas del administrador
│   │   ├── Pages/Usuario/       ← Vistas del usuario estándar
│   │   └── Styles/              ← CSS global y design system
│   └── main.jsx                 ← Entry point React
├── .env.example                 ← Plantilla de variables de entorno
├── railway.json                 ← Configuración de despliegue Railway
└── vite.config.js               ← Vite + proxy /api, /storage, /socket.io
```

---

<div align="center">

Desarrollado por **Matthew Garay** · Proyecto de Residencias Profesionales  
Precision Truck Parts & Accessories

</div>
