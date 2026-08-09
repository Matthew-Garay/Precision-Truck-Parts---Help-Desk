# Precision Truck Parts - HelpDesk

**Sistema integral de gestion de tickets de soporte tecnico, solicitudes de insumos, control de inventario, acceso a manuales tecnicos y seguimiento de incidencias para Precision Truck Parts, Parts and Accesories, S.A de C.V.**

---

## Descripcion del Sistema

Precision Truck Parts - HelpDesk es una plataforma empresarial integral desarrollada para la gestion eficiente de soporte tecnico, control de inventario, administracion de manuales tecnicos y seguimiento de incidencias. El sistema permite a los empleados reportar problemas tecnicos, solicitar insumos, consultar manuales de procedimientos y acceder a historiales de acceso, todo en un entorno seguro y centralizado.

### Funcionalidades Principales

**Gestion de Tickets de Soporte**
- Creacion, edicion y eliminacion de tickets de soporte tecnico
- Asignacion de tickets a tecnicos especializados
- Seguimiento en tiempo real con notificaciones via Socket.io
- Sistema de comentarios y carga de evidencias (imagenes y videos)
- Estados de ticket: En proceso, Resuelto, No Resuelto, Cancelado
- Sistema de prioridades: Baja, Media, Alta, Urgente
- Calificacion del servicio con escala de 1 a 5 estrellas
- Cierre automatico de tickets vencidos (SLA de 48 horas)
- Alertas automaticas de SLA y tickets sin atender

**Gestion de Manuales Tecnicos**
- Subida y administracion de manuales PDF
- Visor de PDF integrado con navegacion por paginas
- Generacion automatica de portadas en miniatura
- Busqueda y filtrado por categorias
- Descarga de manuales
- Subida masiva de manuales (hasta 20 archivos simultaneamente)
- Vista en grid y lista para mejor navegacion

**Gestion de Insumos e Inventario**
- Catalogo completo de insumos disponibles
- Sistema de solicitudes de insumos por empleados
- Aprobacion individual de items por administradores
- Control de stock con descuento automatico
- Alertas de stock critico (agotado y bajo)
- Historial completo de solicitudes
- Generacion de reportes en PDF y Excel

**Gestion de Empleados y Accesos**
- Registro y administracion de empleados
- Asignacion de roles: Administrador y Usuario
- Control de acceso basado en roles (RBAC)
- Perfiles de usuario personalizables con foto
- Historial completo de accesos al sistema
- Recuperacion de contrasena por correo electronico
- Sesiones seguras con JWT (12 horas de vigencia)

**Reportes y Estadisticas**
- Reportes de tickets por periodo
- Estadisticas de actividad y rendimiento
- Graficos de desempeno por tecnico
- Exportacion de datos a Excel y PDF
- Paginas de impresion dedicadas
- Filtros avanzados por fecha, categoria y tecnico

**Seguridad**
- Autenticacion con JWT (12 horas de vigencia)
- Encriptacion de contrasenas con bcryptjs (12 rounds)
- Configuracion CORS restrictiva
- Rate limiting para prevenir ataques de fuerza bruta
- Validacion de datos con Zod
- Headers de seguridad HTTP con Helmet
- Proteccion CSRF en formularios
- Proteccion contra path traversal
- Revocacion de tokens al cerrar sesion
- Registro de historial de accesos

---

## Requisitos

### Minimos
- **Node.js**: v18.0.0 o superior
- **npm**: v9.0.0 o superior
- **MySQL**: v8.0 o superior
- **Git**: v2.0 o superior

### Recomendados
- **Visual Studio Code**: Editor de codigo
- **Postman**: Para pruebas de API
- **MySQL Workbench**: Gestor de base de datos

---

## Tabla de Contenidos

- [Caracteristicas](#caracteristicas)
- [Requisitos](#requisitos)
- [Instalacion](#instalacion)
- [Configuracion](#configuracion)
- [Uso](#uso)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [Documentacion](#documentacion)
- [API](#api)
- [Solucion de Problemas](#solucion-de-problemas)
- [Contribuir](#contribuir)
- [Licencia](#licencia)

---

## Caracteristicas

### Gestion de Tickets
- Crear, editar y eliminar tickets de soporte
- Asignar tickets a tecnicos
- Seguimiento en tiempo real con Socket.io
- Comentarios y evidencias adjuntas
- Estados: En proceso, Resuelto, No Resuelto, Cancelado
- Prioridades: Baja, Media, Alta, Urgente
- Calificacion del servicio (1 a 5 estrellas)
- Cierre automatico de tickets vencidos (SLA de 48 horas)
- Alertas de SLA y tickets sin atender

### Gestion de Manuales
- Subir y gestionar manuales PDF
- Visor de PDF integrado
- Generacion automatica de portadas
- Busqueda y filtrado por categoria
- Descarga de manuales
- Subida masiva de manuales (hasta 20 archivos)

### Gestion de Insumos
- Catalogo de insumos disponibles
- Solicitudes de insumos
- Aprobacion individual de items
- Control de stock con descuento automatico
- Alertas de stock critico
- Historial de solicitudes

### Gestion de Empleados
- Crear y gestionar empleados
- Asignar roles (Admin, Usuario)
- Control de acceso basado en roles (RBAC)
- Perfiles de usuario personalizables
- Historial de accesos al sistema
- Recuperacion de contrasena por correo

### Reportes y Estadisticas
- Reportes de tickets por periodo
- Estadisticas de actividad
- Graficos de desempeno por tecnico
- Exportacion a Excel y PDF
- Paginas de impresion dedicadas

### Seguridad
- Autenticacion con JWT (12 horas de vigencia)
- Encriptacion de contrasenas (bcryptjs, 12 rounds)
- CORS configurado
- Rate limiting
- Validacion de datos con Zod
- Headers de seguridad (Helmet)
- Proteccion CSRF
- Proteccion contra path traversal
- Revocacion de tokens al cerrar sesion

---

## Requisitos

### Minimos
- **Node.js**: v18.0.0 o superior
- **npm**: v9.0.0 o superior
- **MySQL**: v8.0 o superior
- **Git**: v2.0 o superior

### Recomendados
- **Visual Studio Code**: Editor de codigo
- **Postman**: Para pruebas de API
- **MySQL Workbench**: Gestor de base de datos

---

## Instalacion

### 1. Clonar el Repositorio

```bash
git clone https://github.com/Matthew-Garay/Precision-Truck-Parts---Help-Desk.git
cd PrecisionTrucks_HelpDesk
```

### 2. Instalar Dependencias

```bash
npm install
```

### 3. Configurar Variables de Entorno

```bash
# Copiar archivo de ejemplo
cp .env.example .env

# Editar .env con tus valores
nano .env
```

**Variables necesarias:**

```env
# Servidor
PORT=3001
NODE_ENV=development

# Base de datos
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=tu_contrasena
DB_NAME=precision_helpdesk

# JWT
JWT_SECRET=tu_secreto_de_64_caracteres_aleatorios

# Email (Gmail)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu_correo@gmail.com
SMTP_PASS=xxxx xxxx xxxx xxxx

# Frontend
CORS_ORIGIN=http://localhost:5173
APP_URL=http://localhost:5173
```

### 4. Crear Base de Datos

```bash
# Opcion 1: Usando MySQL CLI
mysql -u root -p < docs/database.sql

# Opcion 2: Usando MySQL Workbench
# Abrir docs/database.sql y ejecutar
```

### 5. Iniciar la Aplicacion

```bash
# Desarrollo (Frontend + Backend)
npm run dev:all

# O en terminales separadas:
# Terminal 1 - Frontend
npm run dev

# Terminal 2 - Backend
npm run server
```

**URLs de acceso:**
- Frontend: http://localhost:5173
- Backend API: http://localhost:3001

---

## Configuracion

### Configuracion de Email (Gmail)

1. Habilitar "Contrasenas de aplicacion":
 - Ir a https://myaccount.google.com/security
 - Activar "Verificacion en dos pasos"
 - Generar "Contrasena de aplicacion"
 - Copiar contrasena en `.env` como `SMTP_PASS`

### Configuracion de Base de Datos

```bash
# Crear base de datos
mysql -u root -p
CREATE DATABASE precision_helpdesk;
USE precision_helpdesk;
SOURCE docs/database.sql;
```

### Configuracion de Almacenamiento

Las carpetas de almacenamiento deben tener permisos correctos:

```bash
# Linux/Mac
chmod 755 storage/
chmod 755 storage/Manuales/
chmod 755 storage/Evidencias_Tickets/
chmod 755 storage/Fotos\ de\ Perfil/
chmod 755 storage/Insumos/
chmod 755 storage/Portadas/

# Windows (ejecutar como administrador)
icacls "storage" /grant:r "%USERNAME%:F" /t
```

---

## Uso

### Acceso Inicial

1. **URL**: http://localhost:5173
2. **Usuario**: admin@precisiontrucks.com
3. **Contrasena**: Admin123!@#

### Crear Primer Ticket

1. Iniciar sesion
2. Ir a **Nuevo Reporte**
3. Completar formulario:
 - Titulo: Descripcion breve
 - Descripcion: Detalles del problema
 - Categoria: Seleccionar categoria
 - Prioridad: Seleccionar prioridad
 - Evidencias: Adjuntar archivos (opcional, maximo 8)
4. Hacer clic en **Crear Ticket**

### Subir Manual PDF

1. Ir a **Manuales de Incidencias** (solo admin)
2. Hacer clic en **Subir Manual**
3. Seleccionar archivo PDF
4. Completar informacion:
 - Nombre del manual
 - Descripcion
 - Categoria
5. Hacer clic en **Subir**

---

## Estructura del Proyecto

```
PrecisionTrucks_HelpDesk/
|-- docs/ Documentacion tecnica
| |-- README.md Indice de documentacion
| |-- DOCUMENTACION_PROFESIONAL.md Documentacion profesional integral
| |-- ESTRUCTURA_PROYECTO.md Estructura de carpetas
| |-- DOCUMENTACION_INTERNA.md Guia de documentacion
| |-- Arquitectura.md Diagrama de arquitectura
| |-- database.sql Script de BD
| `-- GUIAS_USUARIO/ Guias para usuarios
| |-- README.md Indice de guias
| |-- Admin_Manual.md Manual del administrador
| `-- Usuario_Manual.md Manual del usuario
|
|-- src/ Codigo fuente
| |-- Backend/ Servidor Node.js/Express
| | |-- server.js Punto de entrada
| | |-- Config/ Configuracion
| | |-- Models/ Modelos de datos
| | |-- Controllers/ Logica de negocio
| | |-- Routes/ Rutas API
| | |-- Middlewares/ Middlewares
| | |-- Workers/ Tareas programadas
| | `-- utils/ Funciones auxiliares
| |
| `-- Frontend/ Aplicacion React
| |-- Components/ Componentes React
| |-- Pages/ Paginas principales
| |-- Config/ Configuracion del cliente
| `-- Styles/ Estilos CSS
|
|-- public/ Archivos estaticos
| `-- assets/ Imagenes y recursos
|
|-- storage/ Almacenamiento de archivos
| |-- Manuales/ PDFs de manuales
| |-- Evidencias_Tickets/ Imagenes de tickets
| |-- Fotos de Perfil/ Fotos de empleados
| |-- Insumos/ Imagenes de insumos
| `-- Portadas/ Portadas de PDFs
|
|-- package.json Dependencias
|-- .env.example Variables de entorno
|-- vite.config.js Configuracion de Vite
`-- README.md Este archivo
```

**Para mas detalles**: Ver [ESTRUCTURA_PROYECTO.md](docs/ESTRUCTURA_PROYECTO.md)

---

## Documentacion

### Documentacion Tecnica

| Documento | Descripcion |
|-----------|-------------|
| [DOCUMENTACION_PROFESIONAL.md](docs/DOCUMENTACION_PROFESIONAL.md) | Documentacion profesional integral del sistema |
| [Arquitectura.md](docs/Arquitectura.md) | Diagrama y descripcion de arquitectura |
| [3.5_DesarrolloTecnico.md](docs/3.5_DesarrolloTecnico.md) | Stack tecnologico y decisiones tecnicas |
| [Despliegue.md](docs/Despliegue.md) | Guia de despliegue en produccion |
| [DiccionarioDatos.md](docs/DiccionarioDatos.md) | Descripcion de tablas y campos |
| [IEEE830_Requerimientos.md](docs/IEEE830_Requerimientos.md) | Especificacion de requerimientos |
| [PruebasYValidacion.md](docs/PruebasYValidacion.md) | Plan de pruebas |

### Guias de Usuario

| Guia | Descripcion |
|------|-------------|
| [Admin_Manual.md](docs/GUIAS_USUARIO/Admin_Manual.md) | Manual para administradores |
| [Usuario_Manual.md](docs/GUIAS_USUARIO/Usuario_Manual.md) | Manual para usuarios finales |

### Documentacion Interna

| Documento | Descripcion |
|-----------|-------------|
| [ESTRUCTURA_PROYECTO.md](docs/ESTRUCTURA_PROYECTO.md) | Estructura de carpetas y archivos |
| [DOCUMENTACION_INTERNA.md](docs/DOCUMENTACION_INTERNA.md) | Estandares de documentacion de codigo |

---

## API

### Autenticacion

```bash
# Login
POST /api/auth/login
Content-Type: application/json

{
 "email": "usuario@precisiontrucks.com",
 "password": "contrasena"
}

# Respuesta
{
 "token": "eyJhbGciOiJIUzI1NiIs...",
 "usuario": {
 "id_empleado": 1,
 "nombre": "Juan Perez",
 "email": "usuario@precisiontrucks.com",
 "rol": "usuario"
 }
}
```

### Tickets

```bash
# Listar tickets (solo admin)
GET /api/tickets
Authorization: Bearer {token}

# Crear ticket
POST /api/tickets
Authorization: Bearer {token}
Content-Type: application/json

{
 "titulo": "Impresora no funciona",
 "descripcion": "La impresora HP no imprime",
 "prioridad": "Alta",
 "id_categoria": 1
}

# Obtener detalles
GET /api/tickets/:id
Authorization: Bearer {token}

# Actualizar ticket (solo admin)
PATCH /api/tickets/:id
Authorization: Bearer {token}
Content-Type: application/json

{
 "estatus": "Resuelto",
 "comentarios": "Se reinstalo el driver",
 "id_resuelto_por": 2
}
```

### Solicitudes

```bash
# Crear solicitud de insumos
POST /api/solicitudes
Authorization: Bearer {token}
Content-Type: application/json

{
 "prioridad": "Media",
 "id_empleado": 1,
 "insumos": [
 { "id_insumo": 1, "cantidad": 2 }
 ]
}
```

### Manuales

```bash
# Listar manuales
GET /api/manuales
Authorization: Bearer {token}

# Subir manual (solo admin)
POST /api/manuales
Authorization: Bearer {token}
Content-Type: multipart/form-data

archivo: [archivo PDF]
nombre: "Manual de Instalacion"
descripcion: "Guia de instalacion del producto"
id_categoria: 1
```

**Para documentacion completa de API**: Ver [DOCUMENTACION_PROFESIONAL.md](docs/DOCUMENTACION_PROFESIONAL.md#16-documentacion-de-la-api)

---

## Solucion de Problemas

### PDFs no se visualizan

**Problema**: Los manuales no cargan en el visor

**Soluciones**:

1. **Verificar archivos existen**:
 ```bash
 ls -la storage/Manuales/
 ```

2. **Verificar permisos**:
 ```bash
 chmod 644 storage/Manuales/*
 ```

3. **Regenerar portadas**:
 ```bash
 node src/Backend/scripts/generarPortadasExistentes.js
 ```

4. **Limpiar cache del navegador**:
 - Presionar `Ctrl+Shift+Delete`
 - Seleccionar "Todos los tiempos"
 - Hacer clic en "Limpiar datos"

5. **Verificar CORS**:
 - Revisar consola del navegador (F12)
 - Buscar errores de CORS
 - Verificar `.env` CORS_ORIGIN

### Error de conexion a BD

**Problema**: "Cannot connect to database"

**Soluciones**:

1. **Verificar MySQL esta corriendo**:
 ```bash
 # Linux/Mac
 sudo systemctl status mysql

 # Windows
 services.msc (buscar MySQL)
 ```

2. **Verificar credenciales en `.env`**:
 ```env
 DB_HOST=localhost
 DB_PORT=3306
 DB_USER=root
 DB_PASSWORD=tu_contrasena
 ```

3. **Reiniciar servidor**:
 ```bash
 npm run server
 ```

### Emails no se envian

**Problema**: Recuperacion de contrasena no funciona

**Soluciones**:

1. **Para Gmail**:
 - Habilitar "Contrasenas de aplicacion"
 - Usar contrasena de aplicacion en `.env`

2. **Verificar credenciales SMTP**:
 ```env
 SMTP_HOST=smtp.gmail.com
 SMTP_PORT=587
 SMTP_USER=tu_correo@gmail.com
 SMTP_PASS=xxxx xxxx xxxx xxxx
 ```

### Rendimiento lento

**Problema**: El sistema esta lento

**Soluciones**:

1. **Limpiar cache**:
 ```bash
 # En el navegador
 Ctrl+Shift+Delete
 ```

2. **Optimizar BD**:
 ```bash
 mysql -u root -p precision_helpdesk
 OPTIMIZE TABLE ticket;
 OPTIMIZE TABLE solicitud;
 ```

3. **Aumentar memoria Node.js**:
 ```bash
 NODE_OPTIONS=--max-old-space-size=4096 npm run server
 ```

---

## Contribuir

### Pasos para Contribuir

1. **Fork el repositorio**
 ```bash
 git clone https://github.com/tu-usuario/Precision-Truck-Parts---Help-Desk.git
 ```

2. **Crear rama de feature**
 ```bash
 git checkout -b feature/nueva-funcionalidad
 ```

3. **Hacer cambios y commit**
 ```bash
 git add .
 git commit -m "Agregar nueva funcionalidad"
 ```

4. **Push a la rama**
 ```bash
 git push origin feature/nueva-funcionalidad
 ```

5. **Crear Pull Request**
 - Ir a GitHub
 - Hacer clic en "New Pull Request"
 - Describir cambios
 - Esperar revision

### Estandares de Codigo

- Usar ESLint para validar codigo
- Seguir convenciones de nombres
- Documentar funciones con JSDoc
- Escribir tests para nuevas funcionalidades
- Mantener cobertura de tests > 80%

---

## Licencia

Este proyecto esta bajo la licencia MIT. Ver [LICENSE](LICENSE) para mas detalles.

---

## Soporte

### Contacto

- **Email**: soporte@precisiontrucks.com
- **Telefono**: +1-XXX-XXX-XXXX
- **Horario**: Lunes a Viernes, 8:00 AM - 5:00 PM

### Reportar Bugs

1. Ir a [Issues](https://github.com/Matthew-Garay/Precision-Truck-Parts---Help-Desk/issues)
2. Hacer clic en "New Issue"
3. Describir el problema detalladamente
4. Incluir pasos para reproducir
5. Adjuntar capturas de pantalla si es posible

---

## Autores

- **Matthew Garay** - Desarrollador Principal
- **Equipo de PrecisionTrucks** - Contribuidores

---

## Agradecimientos

- [Express.js](https://expressjs.com/) - Framework web
- [React](https://react.dev/) - Libreria de UI
- [MySQL](https://www.mysql.com/) - Base de datos
- [Socket.io](https://socket.io/) - Comunicacion en tiempo real
- [Tailwind CSS](https://tailwindcss.com/) - Framework CSS

---

## Estado del Proyecto

- Version 1.0.0 - Lanzamiento inicial
- En desarrollo activo
- Mejoras continuas

---

**Ultima actualizacion**: Agosto 2026
**Version**: 1.0.0

---

[Ir al Repositorio](https://github.com/Matthew-Garay/Precision-Truck-Parts---Help-Desk)