# PrecisionTrucks HelpDesk

<div align="center">

![PrecisionTrucks HelpDesk](https://img.shields.io/badge/Version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/License-Private-red.svg)
![Node.js](https://img.shields.io/badge/Node.js-18%2B-green.svg)
![React](https://img.shields.io/badge/React-18.3.1-blue.svg)
![MySQL](https://img.shields.io/badge/MySQL-8.0-orange.svg)

**Sistema Integral de Gestión de Soporte Técnico, Inventario y Documentación**

*Plataforma web full-stack para la gestión operativa interna de Precision Truck Parts and Accessories*

[Documentación](#documentación-técnica) • [Instalación](#instalación) • [Características](#características) • [Stack Tecnológico](#stack-tecnológico)

**Autor:** Matthew Ilveneff Garay Pérez

</div>

---

## 📋 Tabla de Contenidos

- [Descripción del Proyecto](#descripción-del-proyecto)
- [Características Principales](#características-principales)
- [Stack Tecnológico](#stack-tecnológico)
- [Arquitectura del Sistema](#arquitectura-del-sistema)
- [Módulos del Sistema](#módulos-del-sistema)
- [Requisitos Previos](#requisitos-previos)
- [Instalación y Configuración](#instalación-y-configuración)
- [Variables de Entorno](#variables-de-entorno)
- [Comandos Disponibles](#comandos-disponibles)
- [Seguridad](#seguridad)
- [Despliegue en Producción](#despliegue-en-producción)
- [Documentación Técnica](#documentación-técnica)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [Contribución](#contribución)
- [Licencia](#licencia)

---

## 📖 Descripción del Proyecto

**PrecisionTrucks HelpDesk** es una aplicación web full-stack de uso interno diseñada para centralizar y optimizar la operación de soporte técnico, gestión de inventario y control documental de Precision Truck Parts and Accessories.

El sistema implementa una arquitectura cliente-servidor moderna con separación de responsabilidades, permitiendo una gestión eficiente de:

- **Incidencias técnicas** mediante un sistema de tickets con acuerdos de nivel de servicio (SLA)
- **Control de inventario** con alertas automáticas de stock crítico
- **Gestión documental** centralizada de manuales técnicos en formato PDF
- **Administración de personal** con roles diferenciados y control de accesos
- **Notificaciones en tiempo real** para una comunicación eficiente entre equipos

### Objetivos del Proyecto

- ✅ Centralizar la gestión de soporte técnico en una plataforma unificada
- ✅ Automatizar procesos de inventario y alertas de reposición
- ✅ Proporcionar acceso rápido a documentación técnica actualizada
- ✅ Garantizar tiempos de respuesta mediante SLA de 48 horas
- ✅ Mantener un registro completo de actividades y accesos
- ✅ Facilitar la generación de reportes para toma de decisiones

---

## 🚀 Características Principales

### Gestión de Tickets de Soporte
- 🎫 **Ciclo completo de incidencias**: Creación, asignación, seguimiento y cierre
- ⏱️ **SLA de 48 horas**: Sistema automático de alertas y cierre por vencimiento
- 📸 **Evidencias fotográficas**: Adjunto de hasta 8 imágenes por ticket
- ⭐ **Sistema de calificación**: Feedback del usuario sobre la atención recibida
- 🔔 **Notificaciones en tiempo real**: Alertas instantáneas a administradores y técnicos

### Control de Inventario
- 📦 **CRUD completo**: Gestión de catálogo de insumos con control de stock
- ⚠️ **Alertas automáticas**: Notificaciones cuando stock ≤ 5 unidades
- 📋 **Solicitudes de reposición**: Flujo de aprobación por administradores
- 📊 **Exportación de reportes**: Generación de PDF y Excel con filtros avanzados
- 🔄 **Movimientos registrados**: Historial completo de entradas y salidas

### Gestión Documental
- 📚 **Biblioteca de manuales**: Almacenamiento y organización de PDFs técnicos
- 👁️ **Vista previa de portadas**: Generación automática de miniaturas
- 🔍 **Búsqueda avanzada**: Filtrado por categoría y título
- 📥 **Descarga directa**: Acceso rápido a documentación actualizada

### Administración de Personal
- 👥 **Gestión de empleados**: CRUD completo con información detallada
- 🔐 **Roles diferenciados**: Administrador y Usuario con permisos específicos
- 🏢 **Organización por sucursales y departamentos**: Estructura jerárquica
- 📸 **Fotos de perfil**: Identificación visual de empleados
- 📊 **Historial de accesos**: Registro de sesiones y actividad

### Seguridad y Rendimiento
- 🔒 **Autenticación JWT**: Tokens seguros con vigencia de 12 horas
- 🛡️ **Protección CSRF**: Validación de solicitudes mutantes
- 🚦 **Rate limiting**: Límites de intentos para prevenir abuso
- 📈 **Optimización de consultas**: Índices y caché para rendimiento
- 🔐 **Hash de contraseñas**: bcrypt con factor de costo 12

---

## 💻 Stack Tecnológico

### Frontend
| Tecnología | Versión | Descripción |
|------------|---------|-------------|
| **React** | 18.3.1 | Biblioteca JavaScript para construir interfaces de usuario |
| **Vite** | 6.3.5 | Build tool y servidor de desarrollo ultrarrápido |
| **Tailwind CSS** | 4.1.7 | Framework de utilidades CSS para diseño rápido |
| **React Router DOM** | 7.15.0 | Enrutamiento declarativo para React |
| **Lucide React** | 1.12.0 | Biblioteca de iconos consistentes y personalizables |
| **Socket.io Client** | 4.8.3 | Cliente WebSocket para comunicación en tiempo real |
| **jsPDF** | 4.2.1 | Generación de documentos PDF en el cliente |
| **ExcelJS** | 4.4.0 | Creación y manipulación de archivos Excel |
| **pdfjs-dist** | 6.0.227 | Visor de PDF con renderizado en canvas |

### Backend
| Tecnología | Versión | Descripción |
|------------|---------|-------------|
| **Node.js** | 18+ | Entorno de ejecución JavaScript del lado del servidor |
| **Express** | 5.2.1 | Framework web minimalista y flexible |
| **Socket.io** | 4.8.3 | Motor WebSocket para comunicación bidireccional |
| **MySQL2** | 3.22.3 | Cliente MySQL con soporte para promesas |
| **jsonwebtoken** | 9.0.3 | Implementación de JWT para autenticación |
| **bcryptjs** | 3.0.3 | Hashing de contraseñas con bcrypt |
| **Zod** | 4.4.3 | Validación de esquemas TypeScript-first |
| **Nodemailer** | 9.0.1 | Envío de correos electrónicos vía SMTP |
| **Multer** | 2.1.1 | Middleware para manejo de multipart/form-data |
| **Sharp** | 0.35.3 | Procesamiento de imágenes de alto rendimiento |

### Base de Datos
| Tecnología | Versión | Descripción |
|------------|---------|-------------|
| **MySQL** | 8.x | Sistema de gestión de bases de datos relacional |
| **InnoDB** | - | Motor de almacenamiento con transacciones ACID |
| **utf8mb4** | - | Conjunto de caracteres con soporte completo Unicode |

### Herramientas de Desarrollo
| Tecnología | Versión | Descripción |
|------------|---------|-------------|
| **npm** | - | Gestor de paquetes de Node.js |
| **Git** | - | Sistema de control de versiones |
| **PM2** | - | Gestor de procesos para producción |

---

## 🏗️ Arquitectura del Sistema

### Patrón de Diseño
El sistema sigue una arquitectura **Cliente-Servidor** con separación clara de responsabilidades:

```
┌─────────────────────────────────────────────────────────────┐
│                     CLIENTE (Browser)                        │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  React SPA (Single Page Application)                 │  │
│  │  - Vistas: Admin / Usuario                           │  │
│  │  - Componentes reutilizables                         │  │
│  │  - Hooks personalizados                              │  │
│  │  - Context API para estado global                    │  │
│  └──────────────────────────────────────────────────────┘  │
│                           │ HTTPS                           │
└───────────────────────────┼─────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────┐
│                    SERVIDOR (Node.js)                        │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Express.js + Socket.io (Puerto 3001)                │  │
│  │                                                        │  │
│  │  ┌────────────────────────────────────────────────┐  │  │
│  │  │  Middlewares (Pipeline de seguridad)           │  │  │
│  │  │  - Helmet (CSP, HSTS, headers defensivos)      │  │  │
│  │  │  - CORS (Control de acceso)                    │  │  │
│  │  │  - Rate Limiting (Protección contra abuso)     │  │  │
│  │  │  - CSRF (Validación de solicitudes mutantes)   │  │  │
│  │  │  - JWT (Autenticación y autorización)          │  │  │
│  │  │  - Zod (Validación de esquemas)                │  │  │
│  │  └────────────────────────────────────────────────┘  │  │
│  │                                                        │  │
│  │  ┌────────────────────────────────────────────────┐  │  │
│  │  │  Routes (Definición de endpoints REST)         │  │  │
│  │  │  - /api/auth (Autenticación)                   │  │  │
│  │  │  - /api/tickets (Gestión de tickets)           │  │  │
│  │  │  - /api/solicitudes (Solicitudes de insumos)   │  │  │
│  │  │  - /api/categorias (Catálogos)                 │  │  │
│  │  │  - /api/manuales (Documentación)               │  │  │
│  │  └────────────────────────────────────────────────┘  │  │
│  │                                                        │  │
│  │  ┌────────────────────────────────────────────────┐  │  │
│  │  │  Controllers (Lógica de negocio)               │  │  │
│  │  │  - Orquestación de operaciones                 │  │  │
│  │  │  - Emisión de eventos Socket.io                │  │  │
│  │  │  - Validación de permisos                      │  │  │
│  │  └────────────────────────────────────────────────┘  │  │
│  │                                                        │  │
│  │  ┌────────────────────────────────────────────────┐  │  │
│  │  │  Models (Capa de persistencia)                 │  │  │
│  │  │  - Queries parametrizadas MySQL2               │  │  │
│  │  │  - Pool de conexiones reutilizable             │  │  │
│  │  │  - Transacciones atómicas                      │  │  │
│  │  └────────────────────────────────────────────────┘  │  │
│  │                                                        │  │
│  │  ┌────────────────────────────────────────────────┐  │  │
│  │  │  Workers (Jobs en segundo plano)               │  │  │
│  │  │  - Alertas SLA (cada 30 min)                   │  │  │
│  │  │  - Cierre automático (cada 1 hora)             │  │  │
│  │  │  - Limpieza de sesiones (cada 1 hora)          │  │  │
│  │  │  - Stock crítico (cada 24 horas)               │  │  │
│  │  │  - Tickets sin atender (cada 1 hora)           │  │  │
│  │  └────────────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────────┘  │
└───────────────────────────┬─────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────┐
│              BASE DE DATOS (MySQL 8.x)                       │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  precision_helpdesk (11 tablas relacionales)        │  │
│  │  - empleado, ticket, insumo, solicitud, manual      │  │
│  │  - comentarios_ticket, movimientos_insumo           │  │
│  │  - solicitud_insumo, historial_acceso               │  │
│  │  - categoria, departamento, rol, sucursal           │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Principios de Diseño

- **Single Responsibility Principle**: Cada capa tiene una única razón para cambiar
- **Open/Closed Principle**: Extensible sin modificar código existente
- **Dependency Inversion**: Dependencias abstraidas mediante interfaces
- **Separation of Concerns**: Frontend y Backend completamente desacoplados
- **Stateless Authentication**: JWT sin estado en servidor
- **Real-time Communication**: Socket.io para actualizaciones instantáneas

---

## 📦 Módulos del Sistema

### 1. Gestión de Tickets de Soporte
**Funcionalidades:**
- Creación de tickets con título, descripción, prioridad y categoría
- Adjunto de evidencias fotográficas (hasta 8 imágenes)
- Asignación de técnicos responsables
- Seguimiento de estatus: Pendiente → En proceso → Resuelto/No Resuelto
- Sistema de calificación de 1-5 estrellas
- Cancelación de tickets por el creador
- Exportación de reportes en PDF y Excel

**SLA y Alertas:**
- Tiempo máximo de resolución: 48 horas
- Alerta de advertencia a las 46.5 horas
- Cierre automático como "No Resuelto" al vencer
- Alerta de tickets sin técnico asignado después de 24 horas

### 2. Control de Inventario
**Funcionalidades:**
- CRUD completo de insumos con metadatos detallados
- Control de stock en tiempo real
- Alertas automáticas cuando stock ≤ 5 unidades
- Solicitudes de reposición por empleados
- Flujo de aprobación por administradores
- Descuento automático de stock al aprobar solicitudes
- Historial de movimientos de entrada y salida
- Exportación de reportes con filtros avanzados

**Validaciones:**
- Prevención de stock negativo
- Bloqueo de eliminación de insumos con solicitudes activas
- Validación de estados físicos y categorías

### 3. Gestión Documental
**Funcionalidades:**
- Subida de manuales técnicos en formato PDF
- Metadatos: título, descripción, categoría
- Generación automática de miniaturas de portada
- Búsqueda y filtrado por categoría
- Vista previa en el navegador
- Descarga directa de archivos
- Gestión completa por administradores

**Seguridad:**
- Validación de tipo MIME
- Protección contra path traversal
- Control de acceso basado en roles

### 4. Administración de Personal
**Funcionalidades:**
- CRUD completo de empleados
- Asignación de roles (Administrador/Usuario)
- Organización por departamentos y sucursales
- Gestión de estatus (Activo/Inactivo)
- Subida y gestión de fotos de perfil
- Historial completo de accesos
- Registro de sesiones con timestamps

**Control de Accesos:**
- Autenticación mediante JWT
- Autorización basada en roles
- Revocación de sesiones (logout forzado)
- Limpieza automática de sesiones huérfanas

### 5. Notificaciones en Tiempo Real
**Eventos Implementados:**
- `ticket:nuevo` → Administradores (nuevo ticket creado)
- `ticket:actualizado` → Usuario propietario (cambio de estatus)
- `ticket:en_atencion` → Usuario propietario (técnico asignado)
- `ticket:calificado` → Administradores (ticket calificado)
- `ticket:confirmado` → Usuario propietario (ticket creado)
- `ticket:cancelado` → Usuario propietario (ticket cancelado)
- `ticket:sla_warning` → Administradores (próximo a vencer)
- `tickets:vencidos` → Administradores (cerrados por SLA)
- `ticket:sin_atender` → Administradores (sin técnico > 24h)
- `solicitud:nueva` → Administradores (nueva solicitud)
- `solicitud:actualizada` → Usuario propietario (cambio de estatus)
- `insumo:stock_critico` → Administradores (stock ≤ 5)

**Implementación:**
- Socket.io con autenticación JWT
- Salas dinámicas por rol y empleado
- Sonidos programáticos para alertas
- Panel de notificaciones persistente

---

## 📋 Requisitos Previos

### Software Requerido
- **Node.js**: Versión 18 o superior
  - [Descargar Node.js](https://nodejs.org/)
- **MySQL**: Versión 8.x
  - [Descargar MySQL](https://dev.mysql.com/downloads/mysql/)
- **npm**: Gestor de paquetes (incluido con Node.js)
- **Git**: Sistema de control de versiones
  - [Descargar Git](https://git-scm.com/downloads)

### Hardware Recomendado
- **CPU**: Procesador de 2 núcleos o superior
- **RAM**: Mínimo 4 GB, recomendado 8 GB
- **Almacenamiento**: Mínimo 10 GB disponibles
- **Red**: Conexión a internet para instalación de dependencias

### Conocimientos Previos
- Fundamentos de JavaScript y React
- Conceptos básicos de bases de datos SQL
- Uso de terminal/consola de comandos
- Gestión de paquetes con npm

---

## 🚀 Instalación y Configuración

### Paso 1: Clonar el Repositorio

```bash
# Clonar el repositorio
git clone https://github.com/Matthew-Garay/Precision-Truck-Parts---Help-Desk.git

# Navegar al directorio del proyecto
cd PrecisionTrucks_HelpDesk
```

### Paso 2: Instalar Dependencias

```bash
# Instalar todas las dependencias del proyecto
npm install
```

Este comando instalará:
- Dependencias de producción (React, Express, MySQL, etc.)
- Dependencias de desarrollo (Vite, herramientas de build)

### Paso 3: Configurar Variables de Entorno

```bash
# Copiar el archivo de ejemplo
cp .env.example .env

# Editar el archivo .env con tu editor favorito
# Windows: notepad .env
# Linux/Mac: nano .env o vim .env
```

Configurar las siguientes variables:

```env
# ── CONFIGURACIÓN DEL SERVIDOR ─────────────────────────────
PORT=3001
NODE_ENV=development

# ── CONFIGURACIÓN DE BASE DE DATOS ─────────────────────────
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=TU_CONTRASENA_MYSQL
DB_NAME=precision_helpdesk
DB_SSL=false

# ── CONFIGURACIÓN DE JWT ───────────────────────────────────
# Generar un secreto de 64 bytes con:
# node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
JWT_SECRET=TU_SECRETO_JWT_DE_64_BYTES_AQUI

# ── CONFIGURACIÓN DE CORREO ELECTRÓNICO (SMTP) ────────────
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu_correo@gmail.com
SMTP_PASS=tu_contraseña_de_aplicación
SMTP_FROM="Precision HelpDesk" <tu_correo@gmail.com>

# ── CONFIGURACIÓN DE FRONTEND Y CORS ───────────────────────
VITE_API_URL=
CORS_ORIGIN=http://localhost:5173
APP_URL=http://localhost:5173

# ── CONFIGURACIÓN DE VITE ──────────────────────────────────
VITE_PORT=5173
VITE_BACKEND_URL=http://localhost:3001
```

### Paso 4: Importar la Base de Datos

```bash
# Crear la base de datos (si no existe)
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS precision_helpdesk CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# Importar el esquema y datos iniciales
mysql -u root -p precision_helpdesk < docs/database.sql
```

### Paso 5: Ejecutar en Modo Desarrollo

```bash
# Iniciar frontend y backend en paralelo
npm run dev:all
```

Esto iniciará:
- **Frontend**: http://localhost:5173 (Vite dev server)
- **Backend**: http://localhost:3001 (Express API)

### Paso 6: Verificar Instalación

```bash
# Verificar que el backend está respondiendo
curl http://localhost:3001/api/ping
```

Respuesta esperada:
```json
{
  "status": "ok",
  "message": "Servidor HelpDesk activo ✅"
}
```

### Credenciales de Acceso por Defecto

| Campo | Valor |
|-------|-------|
| **Email** | `admin@precisiontrucks.com` |
| **Contraseña** | `Admin123.` |

⚠️ **Importante**: Cambiar la contraseña inmediatamente después del primer inicio de sesión desde "Configuración de Perfil".

---

## 🔧 Variables de Entorno

### Variables Obligatorias

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `PORT` | Puerto del servidor Express | `3001` |
| `NODE_ENV` | Entorno de ejecución | `development` / `production` |
| `DB_HOST` | Host de MySQL | `localhost` |
| `DB_PORT` | Puerto de MySQL | `3306` |
| `DB_USER` | Usuario de MySQL | `root` |
| `DB_PASSWORD` | Contraseña de MySQL | `tu_contraseña` |
| `DB_NAME` | Nombre de la base de datos | `precision_helpdesk` |
| `JWT_SECRET` | Secreto para firmar tokens JWT | `64 bytes hex` |

### Variables Opcionales

| Variable | Descripción | Valor por defecto |
|----------|-------------|-------------------|
| `DB_SSL` | Usar SSL para MySQL | `false` |
| `SMTP_HOST` | Host del servidor SMTP | - |
| `SMTP_PORT` | Puerto del servidor SMTP | `587` |
| `SMTP_USER` | Usuario SMTP | - |
| `SMTP_PASS` | Contraseña SMTP | - |
| `SMTP_FROM` | Remitente de correos | - |
| `CORS_ORIGIN` | Orígenes permitidos para CORS | `http://localhost:5173` |
| `APP_URL` | URL base de la aplicación | `http://localhost:5173` |
| `VITE_PORT` | Puerto de Vite dev server | `5173` |
| `VITE_BACKEND_URL` | URL del backend para Vite | `http://localhost:3001` |

### Notas Importantes

- Si `SMTP_USER` no está configurado, los correos se omiten silenciosamente (útil en desarrollo)
- `JWT_SECRET` debe ser una cadena de 64 bytes generada aleatoriamente
- En producción, usar `NODE_ENV=production` y configurar `CORS_ORIGIN` con el dominio real

---

## 🎮 Comandos Disponibles

### Desarrollo

```bash
# Iniciar frontend y backend en paralelo
npm run dev:all

# Iniciar solo el frontend (Vite)
npm run dev

# Iniciar solo el backend (Express)
npm run server
```

### Producción

```bash
# Construir el frontend para producción
npm run build

# Previsualizar el build de producción
npm run preview

# Iniciar servidor en modo producción
npm run server
```

### Utilidades

```bash
# Verificar versión de Node.js
node --version

# Verificar versión de npm
npm --version

# Limpiar caché de npm
npm cache clean --force

# Reinstalar dependencias
rm -rf node_modules package-lock.json
npm install
```

---

## 🔒 Seguridad

### Medidas de Seguridad Implementadas

#### 1. Autenticación y Autorización
- **JWT (JSON Web Tokens)**: Tokens firmados con algoritmo HS256
- **Vigencia de tokens**: 12 horas con opción de renovación
- **Revocación de sesiones**: Registro de tokens revocados en base de datos
- **Autorización basada en roles**: Verificación de permisos por endpoint

#### 2. Protección contra Ataques Comunes
- **CSRF (Cross-Site Request Forgery)**: Validación de header `x-requested-with`
- **XSS (Cross-Site Scripting)**: Sanitización de entradas con DOMPurify
- **SQL Injection**: Queries parametrizadas con mysql2
- **Path Traversal**: Validación de rutas de archivos con `safeResolvePath()`
- **Brute Force**: Rate limiting en endpoints críticos

#### 3. Rate Limiting
| Endpoint | Límite | Período |
|----------|--------|---------|
| `/api/auth/login` | 10 intentos | 15 minutos |
| `/api/auth/recuperar` | 5 intentos | 15 minutos |
| `POST /api/tickets` | 30 tickets | 1 hora |
| `POST /api/solicitudes` | 20 solicitudes | 1 hora |

#### 4. Headers de Seguridad
- **Helmet**: Configuración de headers defensivos HTTP
  - CSP (Content Security Policy)
  - HSTS (HTTP Strict Transport Security)
  - X-Content-Type-Options
  - X-Frame-Options
  - Referrer-Policy

#### 5. Gestión de Contraseñas
- **Hashing con bcrypt**: Factor de costo 12
- **Política de contraseñas**: Mínimo 8 caracteres, mayúscula, número, carácter especial
- **Nunca en texto plano**: Contraseñas hasheadas antes de almacenar
- **Recuperación segura**: Códigos de 6 dígitos con vigencia de 10 minutos

#### 6. Validación de Entradas
- **Zod schemas**: Validación de todos los datos de entrada
- **Tipos de datos estrictos**: Verificación de tipos y formatos
- **Longitudes máximas**: Prevención de ataques de buffer overflow
- **Enumeraciones**: Validación de valores permitidos

#### 7. Protección de Archivos
- **Validación MIME**: Verificación real del tipo de archivo
- **Límites de tamaño**: Máximo 100 MB por archivo
- **Rutas protegidas**: Acceso a `/fotos` requiere JWT válido
- **Archivos bloqueados**: `.json`, `.env`, y otros archivos sensibles

---

## 🚀 Despliegue en Producción

### Opción 1: Railway (Recomendado para inicio rápido)

El proyecto incluye configuración predefinida para Railway:

```bash
# Instalar CLI de Railway
npm install -g @railway/cli

# Login en Railway
railway login

# Inicializar proyecto
railway init

# Desplegar
railway up
```

### Opción 2: VPS Propio con PM2

#### Paso 1: Construir para Producción

```bash
npm run build
```

#### Paso 2: Configurar PM2

```bash
# Instalar PM2 globalmente
npm install -g pm2

# Iniciar aplicación con PM2
pm2 start "npm run server" --name helpdesk

# Guardar configuración
pm2 save

# Configurar inicio automático
pm2 startup
```

#### Paso 3: Configurar Nginx (Opcional)

```nginx
server {
    listen 80;
    server_name tu-dominio.com;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Opción 3: Cloudflare Tunnel (Sin abrir puertos)

Consultar la guía completa en [`docs/DESPLIEGUE.md`](docs/DESPLIEGUE.md) para instrucciones detalladas sobre:

- Registro de dominio en Cloudflare
- Instalación y configuración de cloudflared
- Creación de tunnel seguro
- Configuración de DNS
- Despliegue con PM2

### Variables de Entorno en Producción

```env
NODE_ENV=production
PORT=3001
DB_HOST=tu-host-produccion
DB_PASSWORD=tu-contraseña-producción
JWT_SECRET=tu-secreto-producción
CORS_ORIGIN=https://tu-dominio.com
APP_URL=https://tu-dominio.com
```

---

## 📚 Documentación Técnica

### Documentos Disponibles

| Documento | Descripción |
|-----------|-------------|
| [`docs/ARQUITECTURA.md`](docs/ARQUITECTURA.md) | Diseño arquitectónico, flujos de petición y decisiones técnicas |
| [`docs/DICCIONARIO_DATOS.md`](docs/DICCIONARIO_DATOS.md) | Esquema completo de las 11 tablas MySQL con relaciones |
| [`docs/IEEE830_REQUERIMIENTOS.md`](docs/IEEE830_REQUERIMIENTOS.md) | Requerimientos funcionales y no funcionales (norma IEEE 830) |
| [`docs/PRUEBAS_Y_VALIDACION.md`](docs/PRUEBAS_Y_VALIDACION.md) | Plan de pruebas completo con 46 casos de validación |
| [`docs/DESPLIEGUE.md`](docs/DESPLIEGUE.md) | Guía paso a paso de despliegue en producción |
| [`docs/3.5_DESARROLLO_TECNICO.md`](docs/3.5_DESARROLLO_TECNICO.md) | Desarrollo técnico detallado del sistema |
| [`docs/database.sql`](docs/database.sql) | Script SQL completo para crear la base de datos |
| [`.env.example`](.env.example) | Plantilla de variables de entorno |

### Estructura de la Documentación

```
docs/
├── ARQUITECTURA.md              # Arquitectura de software y patrones de diseño
├── DICCIONARIO_DATOS.md         # Esquema de base de datos
├── IEEE830_REQUERIMIENTOS.md    # Especificación de requerimientos
├── PRUEBAS_Y_VALIDACION.md      # Plan de pruebas y casos de prueba
├── DESPLIEGUE.md                # Guía de despliegue en producción
├── 3.5_DESARROLLO_TECNICO.md   # Desarrollo técnico detallado
├── database.sql                 # Script de inicialización de BD
└── SCRUM_FLUJO.puml             # Diagrama de flujo SCRUM (PlantUML)
```

---

## 📁 Estructura del Proyecto

```
PrecisionTrucks_HelpDesk/
│
├── docs/                                    # Documentación técnica completa
│   ├── ARQUITECTURA.md
│   ├── DICCIONARIO_DATOS.md
│   ├── IEEE830_REQUERIMIENTOS.md
│   ├── PRUEBAS_Y_VALIDACION.md
│   ├── DESPLIEGUE.md
│   ├── 3.5_DESARROLLO_TECNICO.md
│   ├── database.sql
│   └── SCRUM_FLUJO.puml
│
├── public/                                  # Assets estáticos
│   └── assets/img/                          # Logos e imágenes de marca
│
├── storage/                                 # Archivos subidos (NO versionar)
│   ├── Evidencias_Tickets/                  # Imágenes de tickets
│   ├── Fotos de Perfil/                     # Avatares de empleados
│   ├── Insumos/                             # Fotos de inventario
│   ├── Manuales/                            # PDFs de documentación
│   └── _tmp_upload/                         # Archivos temporales
│
├── src/                                     # Código fuente
│   │
│   ├── Backend/                             # Capa servidor (Node.js + Express)
│   │   │
│   │   ├── Config/                          # Infraestructura y conexiones
│   │   │   ├── db.js                        # Pool de conexiones MySQL2
│   │   │   ├── mailer.js                    # Transporter Nodemailer
│   │   │   └── socketInstance.js            # Singleton de Socket.IO
│   │   │
│   │   ├── Controllers/                     # Lógica de negocio
│   │   │   ├── authController.js            # Autenticación y sesiones
│   │   │   ├── categoriasController.js      # Gestión de categorías
│   │   │   ├── resetController.js           # Recuperación de contraseña
│   │   │   ├── solicitudesController.js     # Solicitudes de insumos
│   │   │   └── ticketsController.js         # Gestión de tickets
│   │   │
│   │   ├── Middlewares/                     # Middlewares HTTP
│   │   │   ├── authMiddleware.js            # Verificación JWT
│   │   │   ├── security.js                  # Helmet, CORS, rate-limit
│   │   │   ├── uploadEvidencias.js          # Multer: evidencias
│   │   │   ├── uploadFotos.js               # Multer: fotos de perfil
│   │   │   ├── uploadManuales.js            # Multer: PDFs
│   │   │   └── validate.js                  # Validación Zod
│   │   │
│   │   ├── Models/                          # Capa de persistencia
│   │   │   ├── Categoria.js                 # Queries de categorías
│   │   │   ├── Empleado.js                  # Queries de empleados
│   │   │   ├── Insumo.js                    # Queries de insumos
│   │   │   ├── Manual.js                    # Queries de manuales
│   │   │   ├── Solicitud.js                 # Queries de solicitudes
│   │   │   └── Ticket.js                    # Queries de tickets
│   │   │
│   │   ├── Routes/                          # Definición de endpoints
│   │   │   ├── authRoutes.js                # Rutas de autenticación
│   │   │   ├── categoriasRoutes.js          # Rutas de categorías
│   │   │   ├── solicitudesRoutes.js         # Rutas de solicitudes
│   │   │   └── ticketsRoutes.js             # Rutas de tickets
│   │   │
│   │   ├── Workers/                         # Jobs en segundo plano
│   │   │   ├── alertState.js                # Estado de alertas
│   │   │   └── scheduledJobs.js             # Jobs automáticos
│   │   │
│   │   ├── scripts/                         # Scripts utilitarios
│   │   ├── utils/                           # Funciones auxiliares
│   │   └── server.js                        # Entry point Express + Socket.io
│   │
│   ├── Frontend/                            # Capa cliente (React + Vite)
│   │   │
│   │   ├── Components/                      # Componentes reutilizables
│   │   │   ├── Inventario/                  # Componentes de inventario
│   │   │   ├── CampanaNotificaciones.jsx    # Panel de notificaciones
│   │   │   ├── Card.jsx                     # Tarjeta genérica
│   │   │   ├── ConfiguracionPerfilShared.jsx
│   │   │   ├── DashboardShared.jsx          # Dashboard compartido
│   │   │   ├── ErrorBoundary.jsx            # Captura de errores
│   │   │   ├── ExportarPDFBtn.jsx           # Botón de exportación
│   │   │   ├── Feedback.jsx                 # Estados de carga/error
│   │   │   ├── FiltrosToolbar.jsx           # Barra de filtros
│   │   │   ├── Icons.jsx                    # Export de iconos Lucide
│   │   │   ├── ManualDetailPanel.jsx        # Panel de detalle de manual
│   │   │   ├── ManualTable.jsx              # Tabla de manuales
│   │   │   ├── Modal.jsx                    # Modal genérico
│   │   │   ├── ModalReporte.jsx             # Modal de reportes
│   │   │   ├── PantallaCarga.jsx            # Splash screen
│   │   │   ├── PantallaSalida.jsx           # Pantalla de logout
│   │   │   ├── PerfilShared.jsx             # Perfil compartido
│   │   │   ├── SkeletonTable.jsx            # Placeholder de carga
│   │   │   ├── StockBar.jsx                 # Barra de stock
│   │   │   ├── ThemeToggle.jsx              # Toggle tema claro/oscuro
│   │   │   ├── toastContext.js              # Context de toasts
│   │   │   ├── usePdfCover.js               # Hook de portada PDF
│   │   │   └── useToast.js                  # Hook de toasts
│   │   │
│   │   ├── Config/                          # Configuración global
│   │   │   ├── api.js                       # Cliente Axios
│   │   │   ├── DesignSystem.js              # Tokens de diseño
│   │   │   ├── NotificationService.js       # Servicio de notificaciones
│   │   │   ├── session.js                   # Helpers de sesión
│   │   │   ├── theme.jsx                    # Provider de tema
│   │   │   ├── ThemeContext.jsx             # Context de tema
│   │   │   ├── themeTokens.js               # Variables CSS
│   │   │   ├── useAutoRefresh.js            # Hook de auto-refresh
│   │   │   ├── useSocket.js                 # Hook de Socket.io
│   │   │   └── useTicketNotification.js     # Hook de notificaciones
│   │   │
│   │   ├── Pages/                           # Vistas por rol
│   │   │   ├── Admin/                       # Vistas de administrador
│   │   │   │   ├── Dashboard.jsx
│   │   │   │   ├── Tickets/
│   │   │   │   ├── Inventario/
│   │   │   │   ├── Personal/
│   │   │   │   ├── Reportes/
│   │   │   │   └── Manuales/
│   │   │   ├── Usuario/                     # Vistas de usuario
│   │   │   │   ├── Dashboard.jsx
│   │   │   │   ├── MisTickets/
│   │   │   │   ├── Solicitudes/
│   │   │   │   └── Manuales/
│   │   │   └── login.jsx                    # Página de login
│   │   │
│   │   └── Styles/                          # Estilos globales
│   │       ├── design-system.css            # Variables CSS
│   │       └── login.css                    # Estilos de login
│   │
│   ├── main.jsx                             # Entry point React
│   └── orientation.css                      # Estilos de orientación
│
├── .env.example                             # Plantilla de variables de entorno
├── .gitignore                               # Archivos excluidos de Git
├── index.html                               # Entry point HTML
├── package.json                             # Dependencias y scripts
├── railway.json                             # Configuración Railway
├── vite.config.js                           # Configuración Vite
└── README.md                                # Este archivo
```

---

## 🤝 Contribución

Este es un proyecto privado desarrollado para Precision Truck Parts and Accessories. Las contribuciones externas no están aceptadas en este momento.

### Para el Equipo de Desarrollo

Si eres parte del equipo de desarrollo, sigue estas pautas:

1. **Crea una rama para tu feature**
   ```bash
   git checkout -b feature/tu-feature
   ```

2. **Realiza tus cambios y commitea**
   ```bash
   git add .
   git commit -m "Descripción clara de tus cambios"
   ```

3. **Push a la rama**
   ```bash
   git push origin feature/tu-feature
   ```

4. **Crea un Pull Request** para revisión

### Estándares de Código

- **JavaScript/React**: Seguir las convenciones de Airbnb
- **Comentarios**: Documentar funciones complejas
- **Nombres de variables**: Descriptivos y en camelCase
- **Commits**: Mensajes claros y concisos

---

## 📄 Licencia

Este proyecto es propiedad privada de Precision Truck Parts and Accessories. Todos los derechos reservados.

© 2024 Precision Truck Parts and Accessories. Desarrollado por Matthew Ilveneff Garay Pérez.

---

## 📞 Soporte

Para soporte técnico o preguntas sobre el sistema:

- **Autor**: Matthew Ilveneff Garay Pérez
- **Empresa**: Precision Truck Parts and Accessories
- **Proyecto**: Sistema de Residencias Profesionales

---

## 🙏 Agradecimientos

- **Precision Truck Parts and Accessories** por la oportunidad de desarrollar este proyecto como parte de las Residencias Profesionales
- **Comunidad de código abierto** por las excelentes herramientas y bibliotecas utilizadas

---

<div align="center">

**Desarrollado con ❤️ por Matthew Ilveneff Garay Pérez**

*Proyecto de Residencias Profesionales - Precision Truck Parts and Accessories*

[⬆ Volver al inicio](#precisiontrucks-helpdesk)

</div>