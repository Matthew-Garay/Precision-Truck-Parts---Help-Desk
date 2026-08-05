# PrecisionTrucks HelpDesk

Sistema interno de soporte técnico, inventario y documentación para Precision Truck Parts and Accessories.

**Autor:** Matthew Ilveneff Garay Pérez

---

## Tabla de contenidos

1. [Descripción del proyecto](#descripción-del-proyecto)
2. [Módulos del sistema](#módulos-del-sistema)
3. [Stack tecnológico](#stack-tecnológico)
4. [Requisitos previos](#requisitos-previos)
5. [Instalación](#instalación)
6. [Variables de entorno](#variables-de-entorno)
7. [Comandos disponibles](#comandos-disponibles)
8. [Arquitectura](#arquitectura)
9. [Roles del sistema](#roles-del-sistema)
10. [Notificaciones en tiempo real](#notificaciones-en-tiempo-real)
11. [Workers automáticos](#workers-automáticos)
12. [Seguridad](#seguridad)
13. [Despliegue en producción](#despliegue-en-producción)
14. [Documentación técnica](#documentación-técnica)
15. [Estructura del proyecto](#estructura-del-proyecto)

---

## Descripción del proyecto

PrecisionTrucks HelpDesk es una aplicación web full-stack de uso interno que centraliza la operación de soporte técnico y logística de la empresa. El sistema permite gestionar tickets de incidencias, controlar el inventario de insumos, administrar manuales técnicos en formato PDF y coordinar al personal con roles diferenciados.

La aplicación cuenta con notificaciones en tiempo real mediante Socket.io, exportación de reportes en PDF y Excel, y un sistema de alertas automáticas para el cumplimiento de acuerdos de nivel de servicio (SLA) de 48 horas.

---

## Módulos del sistema

| Módulo | Descripción |
|--------|-------------|
| Tickets de soporte | Ciclo completo de gestión de incidencias con SLA de 48 horas, evidencias fotográficas, asignación de técnicos y calificación del usuario |
| Inventario de insumos | CRUD completo con control de stock, alertas críticas, solicitudes de reposición y exportación a PDF/Excel |
| Gestión documental | Biblioteca de manuales técnicos en formato PDF con vista previa de portada y descarga directa |
| Administración de personal | Gestión de empleados, roles, sucursales, departamentos e historial de accesos |
| Notificaciones en tiempo real | Comunicación bidireccional vía Socket.io con sonidos programáticos y panel de notificaciones persistente |
| Reportes exportables | Generación de documentos PDF y Excel desde el dashboard de administrador con diseño corporativo |

---

## Stack tecnológico

| Capa | Tecnología |
|------|-----------|
| Frontend | React 18, Vite 6, Tailwind CSS 4, Lucide React |
| Backend | Node.js, Express 5, Socket.io 4 |
| Base de datos | MySQL 8 (InnoDB, utf8mb4) |
| Autenticación | JWT (jsonwebtoken 9), bcryptjs 3 |
| Validación | Zod 4 |
| Correo electrónico | Nodemailer 9 (SMTP) |
| Subida de archivos | Multer 2, Sharp 0.35 |
| Exportación | jsPDF 4, ExcelJS 4 |
| Visor PDF | pdfjs-dist 6 |

---

## Requisitos previos

- Node.js 18 o superior
- MySQL 8.x
- npm

---

## Instalación

```bash
# 1. Clonar el repositorio
git clone https://github.com/Matthew-Garay/Precision-Truck-Parts---Help-Desk.git
cd PrecisionTrucks_HelpDesk

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .env.example .env
# Editar .env con tus valores reales

# 4. Importar la base de datos
mysql -u root -p < docs/database.sql
```

### Ejecutar en desarrollo

```bash
# Frontend (Vite puerto 5173) y Backend (Express puerto 3001) en paralelo
npm run dev:all
```

Para verificar que el servidor está activo:

```
GET http://localhost:3001/api/ping
Respuesta: { "status": "ok", "message": "Servidor HelpDesk activo" }
```

### Credenciales por defecto

| Campo | Valor |
|-------|-------|
| Email | `admin@precisiontrucks.com` |
| Contraseña | `Admin123.` |

Cambiar la contraseña desde Configuración de Perfil después del primer inicio de sesión.

---

## Variables de entorno

Copiar `.env.example` a `.env` y rellenar los valores:

```env
# Servidor
PORT=3001
NODE_ENV=development

# MySQL
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=TU_CONTRASENA
DB_NAME=precision_helpdesk
DB_SSL=false

# JWT
# Generar con: node -e "require('crypto').randomBytes(64).toString('hex')|console.log()"
JWT_SECRET=CAMBIA_ESTO_POR_UN_SECRETO_DE_64_BYTES

# SMTP (Gmail con contraseña de aplicación)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu_correo@gmail.com
SMTP_PASS=xxxx xxxx xxxx xxxx
SMTP_FROM="Precision HelpDesk" <tu_correo@gmail.com>

# Frontend / CORS
VITE_API_URL=
CORS_ORIGIN=http://localhost:5173
APP_URL=http://localhost:5173

# Vite Dev Server
VITE_PORT=5173
VITE_BACKEND_URL=http://localhost:3001
```

Si `SMTP_USER` no está configurado, los correos se omiten silenciosamente. Esto es útil en desarrollo.

---

## Comandos disponibles

| Comando | Descripción |
|---------|-------------|
| `npm run dev:all` | Frontend y Backend en paralelo (desarrollo) |
| `npm run dev` | Solo frontend en `http://localhost:5173` |
| `npm run server` | Solo backend en `http://localhost:3001` |
| `npm run build` | Build de producción en la carpeta `dist/` |
| `npm run preview` | Vista previa del build de producción |

---

## Arquitectura

```
Browser
  |  HTTPS
  v
Express (server.js)
  |-- Middlewares/   ->  Helmet, CORS, Rate-limit, CSRF, JWT, Zod
  |-- Routes/        ->  Mapeo URL a Controller
  |-- Controllers/   ->  Lógica de negocio + emisión Socket.io
  |-- Models/        ->  Queries parametrizadas MySQL2
  |-- Workers/       ->  5 jobs automáticos (SLA, stock, sesiones)

React SPA (Vite)
  |-- Pages/Admin/   ->  Dashboard, tickets, inventario, personal, reportes
  |-- Pages/Usuario/ ->  Mis tickets, solicitudes, manuales
  |-- Components/    ->  UI reutilizable + hooks + contextos
```

Para el diseño completo con diagramas de flujo y decisiones técnicas, consultar [`docs/ARQUITECTURA.md`](docs/ARQUITECTURA.md).

---

## Roles del sistema

| Rol | id_rol | Capacidades |
|-----|--------|-------------|
| Administrador | 1 | Gestión completa: tickets, inventario, personal, manuales, reportes |
| Usuario | 2 | Crear tickets, solicitar insumos, ver historial propio, consultar manuales |

---

## Notificaciones en tiempo real

El sistema utiliza Socket.io para emitir eventos en tiempo real a los usuarios conectados. Cada socket se autentica con JWT y se une a salas según el rol del empleado.

| Evento | Sala | Descripción |
|--------|------|-------------|
| `ticket:nuevo` | admins | Nuevo ticket creado por un usuario |
| `ticket:actualizado` | empleado_{id} | Cambio de estatus del ticket |
| `ticket:sla_warning` | admins | Ticket próximo a superar las 48 horas |
| `insumo:stock_critico` | admins | Insumo con stock menor o igual a 5 unidades |
| `solicitud:nueva` | admins | Nueva solicitud de insumos creada |
| `ticket:sin_atender` | admins | Ticket con más de 24 horas sin técnico asignado |
| `tickets:vencidos` | admins | Tickets cerrados automáticamente por vencimiento de SLA |
| `ticket:en_atencion` | empleado_{id} | Un técnico tomó el ticket |
| `ticket:calificado` | admins | Un usuario calificó un ticket resuelto |
| `ticket:confirmado` | empleado_{id} | Ticket registrado correctamente |
| `ticket:cancelado` | empleado_{id} | Ticket cancelado |
| `solicitud:actualizada` | empleado_{id} | Cambio de estatus de solicitud de insumos |

---

## Workers automáticos

El servidor arranca 5 jobs en segundo plano al iniciar. Todos usan `.unref()` para no impedir el cierre del proceso.

| Job | Intervalo | Función |
|-----|-----------|---------|
| Alertas SLA | 30 minutos | Emite `ticket:sla_warning` para tickets con 46.5 horas o más abiertos |
| Cierre automático | 1 hora | Cierra como "No Resuelto" los tickets que superan 48 horas |
| Sesiones huérfanas | 1 hora | Cierra registros de `historial_acceso` sin fecha de salida con más de 12 horas |
| Stock crítico | 24 horas | Emite `insumo:stock_critico` para insumos con stock menor o igual a 5 |
| Tickets sin atender | 1 hora | Emite alerta para tickets con más de 24 horas sin técnico asignado |

---

## Seguridad

- **JWT**: algoritmo HS256, 12 horas de vigencia, renovable vía `/api/auth/refresh-token`
- **CSRF**: las mutaciones requieren el header `x-requested-with: XMLHttpRequest`
- **Rate limiting**: login (10 intentos/15 min), recuperación (5 intentos/15 min), tickets (30/hora), solicitudes (20/hora)
- **Helmet**: cabeceras CSP, HSTS, X-Content-Type-Options, referrer policy
- **Path traversal**: función `safeResolvePath()` en todas las operaciones de archivo
- **Fotos de perfil protegidas**: la ruta `/fotos` requiere JWT válido
- **Validación de entrada**: esquemas Zod en todos los endpoints de escritura
- **Hash de contraseñas**: bcrypt con factor de costo 12

---

## Despliegue en producción

```bash
# Construir el frontend
npm run build

# Servir dist/ y /api/* desde el mismo proceso Node
npm run server
```

El repositorio incluye configuración para Railway en el archivo `railway.json`.

Para la guía completa de despliegue con Cloudflare Tunnel, dominio propio y PM2, consultar [`docs/DESPLIEGUE.md`](docs/DESPLIEGUE.md).

---

## Documentación técnica

| Documento | Descripción |
|-----------|-------------|
| [`docs/ARQUITECTURA.md`](docs/ARQUITECTURA.md) | Diseño, flujos de petición y decisiones técnicas |
| [`docs/DICCIONARIO_DATOS.md`](docs/DICCIONARIO_DATOS.md) | Esquema completo de las tablas MySQL |
| [`docs/IEEE830_REQUERIMIENTOS.md`](docs/IEEE830_REQUERIMIENTOS.md) | Requerimientos funcionales y no funcionales (IEEE 830) |
| [`docs/PRUEBAS_Y_VALIDACION.md`](docs/PRUEBAS_Y_VALIDACION.md) | Plan de pruebas y casos de validación |
| [`docs/DESPLIEGUE.md`](docs/DESPLIEGUE.md) | Guía paso a paso de despliegue en producción |
| [`docs/3.5_DESARROLLO_TECNICO.md`](docs/3.5_DESARROLLO_TECNICO.md) | Desarrollo técnico detallado del sistema |
| [`docs/database.sql`](docs/database.sql) | Script SQL para crear la base de datos |
| [`.env.example`](.env.example) | Plantilla de variables de entorno |

---

## Estructura del proyecto

```
PrecisionTrucks_HelpDesk/
|-- docs/                        Documentación técnica completa
|-- public/assets/img/           Logos e imágenes de marca
|-- storage/                     Archivos subidos (no versionar contenido)
|   |-- Evidencias_Tickets/
|   |-- Fotos de Perfil/
|   |-- Insumos/
|   |-- Manuales/
|   |-- Portadas/
|-- src/
|   |-- Backend/
|   |   |-- Config/              Pool de DB, mailer, instancia de Socket.io
|   |   |-- Controllers/         Lógica de negocio
|   |   |-- Middlewares/         Auth, seguridad, uploads, validación
|   |   |-- Models/              Queries MySQL parametrizadas
|   |   |-- Routes/              Definición de endpoints REST
|   |   |-- Workers/             Jobs automáticos (SLA, stock, sesiones)
|   |   |-- server.js            Entry point Express + Socket.io
|   |-- Frontend/
|   |   |-- Components/          UI reutilizable + hooks + contextos
|   |   |-- Config/              API client, tema, notificaciones
|   |   |-- Pages/Admin/         Vistas del administrador
|   |   |-- Pages/Usuario/       Vistas del usuario estándar
|   |-- main.jsx                 Entry point React
|-- .env.example                 Plantilla de variables de entorno
|-- railway.json                 Configuración de despliegue Railway
|-- vite.config.js               Vite + proxy /api, /storage, /socket.io
```

---

**Matthew Ilveneff Garay Pérez**