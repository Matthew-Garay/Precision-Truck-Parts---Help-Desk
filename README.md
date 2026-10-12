<div align="center">

# Precision Truck Parts — HelpDesk

**Sistema web de gestión de tickets de soporte técnico, solicitudes de insumos y control de inventario** para Precision Truck Parts, Parts and Accesories, S.A. de C.V.

[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-6-646CFF?style=flat-square)](https://vitejs.dev/)
[![Express](https://img.shields.io/badge/Express-5-000000?style=flat-square)](https://expressjs.com/)
[![MySQL](https://img.shields.io/badge/MySQL-8-4479A1?style=flat-square)]()
[![Socket.io](https://img.shields.io/badge/Socket.io-Tiempo%20real-010101?style=flat-square)](https://socket.io/)

</div>

---

## Descripción

Sistema integral de **tickets de soporte técnico, solicitudes de insumos y control de inventario**. Los empleados reportan fallas de cómputo y piden insumos; el área de soporte los atiende desde un solo lugar; y la administración consulta inventario, manuales técnicos e historial de todo lo que ha ocurrido, **en tiempo real** con notificaciones automáticas.

Está dirigido al personal interno de la empresa (empleados y administradores de TI).

## Características

- **Dos roles:** *usuario* (crea tickets, adjunta evidencias, consulta manuales, solicita insumos) y *administrador* (atiende tickets, aprueba solicitudes, controla stock, da de alta empleados y categorías).
- **Tickets con estados:** *En proceso*, *Resuelto*, *No Resuelto* y *Cancelado*, con prioridad Baja/Media/Alta/Urgente y calificación de 1 a 5 estrellas al cerrar.
- **Auto-cierre a las 48 h** con alertas automáticas cuando un ticket está por vencer.
- **Manuales en PDF:** portada en miniatura, orden por categoría, búsqueda y descarga.
- **Inventario** con control de entradas y salidas de insumos.
- **Notificaciones en tiempo real** con Socket.io.
- **Seguridad:** contraseñas con bcrypt, sesiones JWT de 12 h, validación con Zod, Helmet y rate limiting.

## Tecnologías utilizadas

- **Frontend:** React 18, Vite 6, TailwindCSS 4, React Router 7
- **Backend:** Node.js, Express 5
- **Base de datos:** MySQL 8
- **Tiempo real:** Socket.io
- **Seguridad:** bcryptjs, jsonwebtoken, Zod, Helmet, express-rate-limit
- **Archivos/PDF:** Multer, pdfjs-dist, canvas, sharp, jspdf
- **Reportes:** exceljs, xlsx-js-style

## Requisitos previos

- **Node.js 18 o superior**
- **npm 9 o superior**
- **MySQL 8 o superior**

## Instalación

```bash
git clone https://github.com/Matthew-Garay/Precision-Truck-Parts---Help-Desk.git
cd PrecisionTrucks_HelpDesk
npm install
```

Copia el archivo de variables de entorno y llénalo:

```bash
cp .env.example .env
```

Variables principales:

```env
PORT=3001
NODE_ENV=development

DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=tu_contrasena
DB_NAME=precision_helpdesk

JWT_SECRET=tu_secreto_de_64_caracteres_aleatorios

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu_correo@gmail.com
SMTP_PASS=xxxx xxxx xxxx xxxx

CORS_ORIGIN=http://localhost:5173
APP_URL=http://localhost:5173
```

Crea la base de datos con el esquema incluido:

```bash
mysql -u root -p < docs/database.sql
```

Arranca todo (frontend + backend):

```bash
npm run dev:all
```

O en dos terminales: `npm run dev` (frontend en http://localhost:5173) y `npm run server` (API en http://localhost:3001).

### Correo de recuperación de contraseñas

Si usas Gmail, activa la **verificación en dos pasos** y genera una **contraseña de aplicación**; esa va en `SMTP_PASS` (no la de tu cuenta). Con cualquier otro SMTP solo cambia las líneas `SMTP_*`.

## Uso

**Primer arranque:**
- URL: http://localhost:5173
- Usuario: `admin@precisiontrucks.com`
- Contraseña: `Admin123!@#` *(cámbiala antes de producción)*

Un ticket se crea desde **Nuevo Reporte**: título, descripción, categoría, prioridad y hasta 8 evidencias. Los manuales se suben desde **Manuales de Incidencias** (solo administrador).

## Estructura del proyecto

```
PrecisionTrucks_HelpDesk/
├── docs/          # Scripts SQL de la base de datos (MySQL)
├── src/Backend/   # Servidor Express (server.js, Controllers, Models, Routes)
├── src/Frontend/  # Aplicación React (Pages, Components, Config)
├── public/        # Archivos estáticos
├── storage/       # PDFs, evidencias y fotos de perfil subidas
├── scripts/       # Scripts de mantenimiento (respaldar, migraciones)
├── .env.example
├── package.json
└── README.md
```

## API (resumen)

Todas las rutas piden el token en la cabecera `Authorization: Bearer {token}`, salvo el login.

```bash
POST  /api/auth/login          # {"email": "...", "password": "..."}
POST  /api/tickets             # crear ticket
GET   /api/tickets             # listar (solo admin)
PATCH /api/tickets/:id         # cambiar estado / resolver (solo admin)
POST  /api/solicitudes         # pedir insumos
GET   /api/manuales            # listar manuales
POST  /api/manuales            # subir manual (solo admin, multipart)
```

## Solución de problemas

- **Los PDF no cargan en el visor:** verifica `storage/Manuales/` y regenera portadas con `node src/Backend/scripts/generarPortadasExistentes.js`; si todo está bien, limpia la caché del navegador.
- **No conecta con la BD:** comprueba que MySQL corra y que las credenciales de `.env` coincidan.
- **No llegan los correos:** suele ser la contraseña de Gmail normal en lugar de la de aplicación; revisa `SMTP_*`.
- **Va lento:** `OPTIMIZE TABLE ticket;` y `OPTIMIZE TABLE solicitud;`.

## Desarrollo

Flujo habitual: fork → rama `feature/...` → commit descriptivo → pull request. El código se valida con ESLint y se documenta con JSDoc. Reporta errores en [Issues](https://github.com/Matthew-Garay/Precision-Truck-Parts---Help-Desk/issues).

## Licencia

Proyecto de uso interno empresarial; documentación y código sujetos a los términos del proyecto.

## Autor

**Matthew Garay** — desarrollo principal. Contacto: soporte@precisiontrucks.com

