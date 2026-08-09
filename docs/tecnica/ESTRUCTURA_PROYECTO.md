# Estructura del Proyecto - PrecisionTrucks HelpDesk

**Guía completa de la estructura de carpetas y archivos del proyecto.**

---

## Tabla de Contenidos

1. [Estructura General](#estructura-general)
2. [Carpeta src/Backend](#carpeta-srcbackend)
3. [Carpeta src/Frontend](#carpeta-srcfrontend)
4. [Carpeta docs](#carpeta-docs)
5. [Carpeta storage](#carpeta-storage)
6. [Archivos Raíz](#archivos-raíz)
7. [Convenciones de Nombres](#convenciones-de-nombres)
8. [Guía de Navegación](#guía-de-navegación)

---

## Estructura General

```
PrecisionTrucks_HelpDesk/
|
|-- src/ # Código fuente principal
| |-- Backend/ # Servidor Node.js/Express
| | |-- server.js # Punto de entrada del servidor
| | |-- Config/ # Configuración
| | |-- Models/ # Modelos de datos
| | |-- Controllers/ # Controladores (lógica)
| | |-- Routes/ # Rutas de API
| | |-- Middlewares/ # Middlewares
| | |-- Workers/ # Tareas programadas
| | |-- utils/ # Funciones auxiliares
| | `-- scripts/ # Scripts de utilidad
| |
| `-- Frontend/ # Aplicación React
| |-- main.jsx # Punto de entrada
| |-- components/ # Componentes React
| |-- pages/ # Páginas principales
| |-- hooks/ # Custom hooks
| |-- services/ # Servicios API
| |-- context/ # Context API
| |-- styles/ # Estilos CSS
| `-- assets/ # Imágenes y recursos
|
|-- docs/ # Documentación
| |-- README.md # Índice de documentación
| |-- database.sql # Script SQL
| |-- ScrumFlujo.puml # Diagrama Scrum
| |-- profesional/ # Documentación profesional
| | `-- DOCUMENTACION_PROFESIONAL.md
| |-- tecnica/ # Documentación técnica
| | |-- ARQUITECTURA.md # Diagrama de arquitectura
| | |-- 3.5_DesarrolloTecnico.md # Stack tecnológico
| | |-- DiccionarioDatos.md # Descripción de BD
| | |-- ESTRUCTURA_PROYECTO.md # Este archivo
| | |-- DOCUMENTACION_INTERNA.md # Estándares de código
| | |-- IEEE830_REQUERIMIENTOS.md # Especificación
| | `-- PruebasYValidacion.md # Plan de pruebas
| |-- operacion/ # Operación y despliegue
| | |-- DESPLIEGUE.md # Guía de despliegue
| | |-- SOLUCION_PDFS.md # Solución de problemas
| | `-- MANUAL_MANTENIMIENTO_SOFTWARE.md
| `-- guia_usuario/ # Guías para usuarios
| |-- README.md # Índice de guías
| `-- MANUAL_USO_SISTEMA.md # Manual de usuario
|
|-- public/ # Archivos estáticos
| |-- .htaccess # Configuración Apache
| `-- assets/ # Imágenes y recursos
|
|-- storage/ # Almacenamiento de archivos
| |-- Manuales/ # PDFs de manuales
| |-- Portadas/ # Portadas de PDFs
| |-- Evidencias_Tickets/ # Imágenes de tickets
| |-- Fotos de Perfil/ # Fotos de empleados
| `-- Insumos/ # Imágenes de insumos
|
|-- package.json # Dependencias del proyecto
|-- package-lock.json # Lock de dependencias
|-- .env.example # Variables de entorno (ejemplo)
|-- .gitignore # Archivos ignorados por Git
|-- vite.config.js # Configuración de Vite
|-- railway.json # Configuración de Railway
|-- index.html # HTML principal
`-- README.md # README principal
```

---

## Carpeta src/Backend

### Estructura Detallada

```
src/Backend/
|-- server.js # Punto de entrada
|
|-- Config/ # Configuración
| |-- db.js # Conexión a BD
| |-- environment.js # Variables de entorno
| `-- constants.js # Constantes globales
|
|-- Models/ # Modelos de datos
| |-- User.js # Modelo de usuario
| |-- Ticket.js # Modelo de ticket
| |-- Manual.js # Modelo de manual
| |-- Insumo.js # Modelo de insumo
| |-- Solicitud.js # Modelo de solicitud
| `-- Categoria.js # Modelo de categoría
|
|-- Controllers/ # Controladores
| |-- authController.js # Autenticación
| |-- ticketsController.js # Gestión de tickets
| |-- manualesController.js # Gestión de manuales
| |-- insumosController.js # Gestión de insumos
| |-- solicitudesController.js # Gestión de solicitudes
| |-- usuariosController.js # Gestión de usuarios
| |-- reportesController.js # Generación de reportes
| `-- categoriasController.js # Gestión de categorías
|
|-- Routes/ # Rutas de API
| |-- authRoutes.js # Rutas de autenticación
| |-- ticketsRoutes.js # Rutas de tickets
| |-- manualesRoutes.js # Rutas de manuales
| |-- insumosRoutes.js # Rutas de insumos
| |-- solicitudesRoutes.js # Rutas de solicitudes
| |-- usuariosRoutes.js # Rutas de usuarios
| |-- reportesRoutes.js # Rutas de reportes
| `-- categoriasRoutes.js # Rutas de categorías
|
|-- Middlewares/ # Middlewares
| |-- authMiddleware.js # Autenticación JWT
| |-- roleMiddleware.js # Control de roles
| |-- errorHandler.js # Manejo de errores
| |-- security.js # Seguridad (CORS, Helmet)
| |-- uploadManuales.js # Subida de manuales
| |-- uploadEvidencias.js # Subida de evidencias
| `-- validation.js # Validación de datos
|
|-- Workers/ # Tareas programadas
| |-- emailWorker.js # Envío de emails
| |-- reportWorker.js # Generación de reportes
| `-- cleanupWorker.js # Limpieza de archivos
|
|-- utils/ # Funciones auxiliares
| |-- emailService.js # Servicio de email
| |-- pdfService.js # Servicio de PDFs
| |-- imageService.js # Servicio de imágenes
| |-- tokenService.js # Servicio de tokens
| |-- hashService.js # Servicio de hash
| |-- validators.js # Validadores
| `-- helpers.js # Funciones auxiliares
|
`-- scripts/ # Scripts de utilidad
 |-- generarPortadasExistentes.js # Regenerar portadas
 |-- verificarPDFs.js # Verificar integridad
 |-- crearUsuarioAdmin.js # Crear admin
 `-- resetearBD.js # Resetear BD
```

### Descripción de Archivos Backend

| Archivo          | Propósito        | Responsabilidad                                 |
| ---------------- | ---------------- | ----------------------------------------------- |
| **server.js**    | Punto de entrada | Inicializar servidor, cargar middlewares, rutas |
| **Config/db.js** | Conexión BD      | Conectar a MySQL, pool de conexiones            |
| **Models/**      | Modelos          | Definir estructura de datos                     |
| **Controllers/** | Lógica           | Procesar solicitudes, validar datos             |
| **Routes/**      | Rutas            | Mapear URLs a controladores                     |
| **Middlewares/** | Procesamiento    | Autenticación, validación, seguridad            |
| **Workers/**     | Tareas           | Procesos en background                          |
| **utils/**       | Utilidades       | Funciones reutilizables                         |

---

## Carpeta src/Frontend

### Estructura Detallada

```
src/Frontend/
|-- main.jsx # Punto de entrada
|
|-- components/ # Componentes React
| |-- Common/ # Componentes comunes
| | |-- Header.jsx # Encabezado
| | |-- Sidebar.jsx # Barra lateral
| | |-- Footer.jsx # Pie de página
| | |-- Modal.jsx # Modal genérico
| | |-- Button.jsx # Botón genérico
| | `-- Loading.jsx # Indicador de carga
| |
| |-- Tickets/ # Componentes de tickets
| | |-- TicketList.jsx # Lista de tickets
| | |-- TicketForm.jsx # Formulario de ticket
| | |-- TicketDetail.jsx # Detalle de ticket
| | `-- TicketCard.jsx # Tarjeta de ticket
| |
| |-- Manuales/ # Componentes de manuales
| | |-- ManualList.jsx # Lista de manuales
| | |-- ManualViewer.jsx # Visor de PDF
| | |-- ManualUpload.jsx # Subida de manual
| | `-- ManualCard.jsx # Tarjeta de manual
| |
| |-- Insumos/ # Componentes de insumos
| | |-- InsumoList.jsx # Lista de insumos
| | |-- InsumoForm.jsx # Formulario de insumo
| | `-- InsumoCard.jsx # Tarjeta de insumo
| |
| |-- Solicitudes/ # Componentes de solicitudes
| | |-- SolicitudList.jsx # Lista de solicitudes
| | |-- SolicitudForm.jsx # Formulario de solicitud
| | `-- SolicitudCard.jsx # Tarjeta de solicitud
| |
| |-- Admin/ # Componentes de admin
| | |-- UserManagement.jsx # Gestión de usuarios
| | |-- CategoryManagement.jsx # Gestión de categorías
| | |-- ReportGenerator.jsx # Generador de reportes
| | `-- SystemSettings.jsx # Configuración del sistema
| |
| `-- Auth/ # Componentes de autenticación
| |-- Login.jsx # Página de login
| |-- Register.jsx # Página de registro
| `-- ForgotPassword.jsx # Recuperar contraseña
|
|-- pages/ # Páginas principales
| |-- Dashboard.jsx # Panel principal
| |-- TicketsPage.jsx # Página de tickets
| |-- ManualesPage.jsx # Página de manuales
| |-- InsumosPage.jsx # Página de insumos
| |-- SolicitudesPage.jsx # Página de solicitudes
| |-- AdminPage.jsx # Página de administración
| |-- ProfilePage.jsx # Página de perfil
| |-- NotFoundPage.jsx # Página 404
| `-- ErrorPage.jsx # Página de error
|
|-- hooks/ # Custom hooks
| |-- useAuth.js # Hook de autenticación
| |-- useTickets.js # Hook de tickets
| |-- useManuales.js # Hook de manuales
| |-- useInsumos.js # Hook de insumos
| |-- useFetch.js # Hook de fetch genérico
| `-- useForm.js # Hook de formularios
|
|-- services/ # Servicios API
| |-- api.js # Configuración de axios
| |-- authService.js # Servicio de autenticación
| |-- ticketsService.js # Servicio de tickets
| |-- manualesService.js # Servicio de manuales
| |-- insumosService.js # Servicio de insumos
| |-- solicitudesService.js # Servicio de solicitudes
| |-- usuariosService.js # Servicio de usuarios
| `-- reportesService.js # Servicio de reportes
|
|-- context/ # Context API
| |-- AuthContext.jsx # Contexto de autenticación
| |-- TicketsContext.jsx # Contexto de tickets
| `-- NotificationContext.jsx # Contexto de notificaciones
|
|-- styles/ # Estilos CSS
| |-- index.css # Estilos globales
| |-- components.css # Estilos de componentes
| |-- pages.css # Estilos de páginas
| |-- responsive.css # Estilos responsivos
| `-- variables.css # Variables CSS
|
`-- assets/ # Imágenes y recursos
 |-- images/ # Imágenes
 |-- icons/ # Iconos
 `-- fonts/ # Fuentes
```

### Descripción de Archivos Frontend

| Carpeta         | Propósito                 | Contenido                     |
| --------------- | ------------------------- | ----------------------------- |
| **components/** | Componentes reutilizables | Botones, modales, tarjetas    |
| **pages/**      | Páginas principales       | Vistas completas              |
| **hooks/**      | Lógica reutilizable       | Estado, efectos, datos        |
| **services/**   | Comunicación con API      | Llamadas HTTP                 |
| **context/**    | Estado global             | Autenticación, notificaciones |
| **styles/**     | Estilos CSS               | Temas, responsive             |
| **assets/**     | Recursos estáticos        | Imágenes, iconos              |

---

## Carpeta docs

### Estructura Detallada

```
docs/
|-- README.md                    # Índice de documentación
|-- database.sql                 # Script SQL
|-- ScrumFlujo.puml              # Diagrama Scrum
|
|-- profesional/                 # Documentación profesional
| `-- DOCUMENTACION_PROFESIONAL.md
|
|-- tecnica/                     # Documentación técnica
| |-- ARQUITECTURA.md            # Diagrama de arquitectura
| |-- 3.5_DesarrolloTecnico.md   # Stack tecnológico
| |-- DiccionarioDatos.md        # Descripción de BD
| |-- ESTRUCTURA_PROYECTO.md     # Este archivo
| |-- DOCUMENTACION_INTERNA.md   # Estándares de código
| |-- IEEE830_REQUERIMIENTOS.md  # Especificación
| `-- PruebasYValidacion.md      # Plan de pruebas
|
|-- operacion/                   # Operación y despliegue
| |-- DESPLIEGUE.md              # Guía de despliegue
| |-- SOLUCION_PDFS.md           # Solución de problemas
| `-- MANUAL_MANTENIMIENTO_SOFTWARE.md
|
`-- guia_usuario/                # Guías para usuarios
 |-- README.md                   # Índice de guías
 `-- MANUAL_USO_SISTEMA.md       # Manual de usuario
```

### Descripción de Documentos

| Documento                                      | Audiencia             | Contenido                 |
| ---------------------------------------------- | --------------------- | ------------------------- |
| **README.md**                                  | Todos                 | Índice y navegación       |
| **profesional/DOCUMENTACION_PROFESIONAL.md**   | Todos los roles       | Documentación profesional |
| **tecnica/ARQUITECTURA.md**                    | Desarrolladores       | Diagrama y componentes    |
| **tecnica/3.5_DesarrolloTecnico.md**           | Desarrolladores       | Stack y decisiones        |
| **tecnica/ESTRUCTURA_PROYECTO.md**             | Desarrolladores       | Estructura de carpetas    |
| **tecnica/DOCUMENTACION_INTERNA.md**           | Desarrolladores       | Estándares de código      |
| **tecnica/DiccionarioDatos.md**                | DBAs, Desarrolladores | Tablas y campos           |
| **tecnica/IEEE830_REQUERIMIENTOS.md**          | Analistas             | Especificación            |
| **tecnica/PruebasYValidacion.md**              | QA                    | Plan de pruebas           |
| **operacion/DESPLIEGUE.md**                    | DevOps                | Guía de producción        |
| **operacion/SOLUCION_PDFS.md**                 | Soporte               | Problemas con PDFs        |
| **operacion/MANUAL_MANTENIMIENTO_SOFTWARE.md** | DevOps                | Mantenimiento del sistema |
| **guia_usuario/MANUAL_USO_SISTEMA.md**         | Usuarios              | Guía de usuario           |
| **database.sql**                               | DBAs                  | Script SQL                |

---

## Carpeta storage

### Estructura Detallada

```
storage/
|-- Manuales/ # PDFs de manuales
| |-- manual-1.pdf
| |-- manual-2.pdf
| `-- ...
|
|-- Portadas/ # Portadas de PDFs
| |-- manual-1_portada.jpg
| |-- manual-2_portada.jpg
| `-- ...
|
|-- Evidencias_Tickets/ # Imágenes de tickets
| |-- ticket-1/
| | |-- evidencia-1.jpg
| | `-- evidencia-2.jpg
| `-- ...
|
|-- Fotos de Perfil/ # Fotos de empleados
| |-- usuario-1.jpg
| |-- usuario-2.jpg
| `-- ...
|
`-- Insumos/ # Imágenes de insumos
 |-- insumo-1.jpg
 |-- insumo-2.jpg
 `-- ...
```

### Permisos Recomendados

```bash
# Carpetas: 755 (rwxr-xr-x)
chmod 755 storage/
chmod 755 storage/Manuales/
chmod 755 storage/Portadas/
chmod 755 storage/Evidencias_Tickets/
chmod 755 storage/Fotos\ de\ Perfil/
chmod 755 storage/Insumos/

# Archivos: 644 (rw-r--r--)
chmod 644 storage/Manuales/*
chmod 644 storage/Portadas/*
```

---

## Archivos Raíz

### Descripción de Archivos

| Archivo               | Propósito                      |
| --------------------- | ------------------------------ |
| **package.json**      | Dependencias y scripts         |
| **package-lock.json** | Lock de versiones              |
| **.env.example**      | Variables de entorno (ejemplo) |
| **.gitignore**        | Archivos ignorados por Git     |
| **vite.config.js**    | Configuración de Vite          |
| **railway.json**      | Configuración de Railway       |
| **index.html**        | HTML principal                 |
| **README.md**         | Documentación principal        |

### package.json - Scripts Disponibles

```json
{
  "scripts": {
    "dev": "vite",
    "server": "node src/Backend/server.js",
    "dev:all": "concurrently \"npm run dev\" \"npm run server\"",
    "build": "vite build",
    "preview": "vite preview",
    "lint": "eslint src/",
    "test": "jest",
    "test:watch": "jest --watch"
  }
}
```

---

## Convenciones de Nombres

### Carpetas

```
 Correcto:
- src/Backend/
- src/Frontend/
- src/Backend/Controllers/
- src/Frontend/components/

 Incorrecto:
- src/backend/
- src/frontend/
- src/Backend/controllers/
- src/Frontend/Components/
```

### Archivos

```
 Correcto:
- userController.js (camelCase)
- UserModel.js (PascalCase para clases)
- authService.js (camelCase)
- User.jsx (PascalCase para componentes)

 Incorrecto:
- user_controller.js (snake_case)
- usermodel.js (minúsculas)
- AuthService.js (PascalCase para servicios)
- user.jsx (minúsculas para componentes)
```

### Variables y Funciones

```javascript
// Correcto
const userName = "Juan";
function getUserById(id) {}
const isActive = true;

// Incorrecto
const user_name = "Juan";
function get_user_by_id(id) {}
const IsActive = true;
```

### Componentes React

```javascript
// Correcto
function UserProfile() {}
export default UserProfile;

// Incorrecto
function userProfile() {}
function user_profile() {}
```

---

## Guía de Navegación

### Para Agregar una Nueva Funcionalidad

1. **Crear modelo** -> `src/Backend/Models/`
2. **Crear controlador** -> `src/Backend/Controllers/`
3. **Crear rutas** -> `src/Backend/Routes/`
4. **Crear servicio** -> `src/Frontend/services/`
5. **Crear componentes** -> `src/Frontend/components/`
6. **Crear página** -> `src/Frontend/pages/`
7. **Documentar** -> `docs/`

### Para Agregar una Nueva Página

1. Crear componente en `src/Frontend/pages/`
2. Crear componentes en `src/Frontend/components/`
3. Crear servicio en `src/Frontend/services/`
4. Agregar ruta en el router
5. Documentar en `docs/`

### Para Agregar un Nuevo Endpoint API

1. Crear modelo en `src/Backend/Models/`
2. Crear controlador en `src/Backend/Controllers/`
3. Crear rutas en `src/Backend/Routes/`
4. Crear servicio en `src/Frontend/services/`
5. Documentar en `docs/`

---

## Matriz de Responsabilidades

| Carpeta                      | Responsable            | Tipo          |
| ---------------------------- | ---------------------- | ------------- |
| **src/Backend/Config/**      | DevOps                 | Configuración |
| **src/Backend/Models/**      | Desarrollador Backend  | Datos         |
| **src/Backend/Controllers/** | Desarrollador Backend  | Lógica        |
| **src/Backend/Routes/**      | Desarrollador Backend  | API           |
| **src/Backend/Middlewares/** | Desarrollador Backend  | Procesamiento |
| **src/Frontend/components/** | Desarrollador Frontend | UI            |
| **src/Frontend/pages/**      | Desarrollador Frontend | Vistas        |
| **src/Frontend/services/**   | Desarrollador Frontend | API           |
| **docs/**                    | Todos                  | Documentación |
| **storage/**                 | DevOps                 | Archivos      |

---

## Checklist de Estructura

- [x] Carpetas organizadas lógicamente
- [x] Nombres consistentes
- [x] Separación de responsabilidades
- [x] Documentación clara
- [x] Permisos correctos
- [x] Estructura escalable
- [x] Fácil de navegar
- [x] Convenciones definidas

---

**Última actualización**: Agosto 2024
**Versión**: 1.0.0

---

<div align="center">

**¿Preguntas sobre la estructura?**

[Ver Documentación Técnica](README.md)

</div>
