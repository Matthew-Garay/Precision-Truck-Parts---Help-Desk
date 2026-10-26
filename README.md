<div align="center">

# Precision Truck Parts â€” HelpDesk
<img src="client/public/assets/img/logo.png" alt="Precision Truck Parts" width="160">

**Sistema web de gestiÃ³n de tickets de soporte tÃ©cnico, solicitudes de insumos y control de inventario** para Precision Truck Parts, Parts and Accesories, S.A. de C.V.

Los usuarios pueden iniciar sesiÃ³n con su cuenta corporativa a travÃ©s de Zoho si el administrador lo habilita.

[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-6-646CFF?style=flat-square)](https://vitejs.dev/)
[![Express](https://img.shields.io/badge/Express-5-000000?style=flat-square)](https://expressjs.com/)
[![MySQL](https://img.shields.io/badge/MySQL-8-4479A1?style=flat-square)]()
[![Socket.io](https://img.shields.io/badge/Socket.io-Tiempo%20real-010101?style=flat-square)](https://socket.io/)

</div>

---

## DescripciÃ³n

Sistema integral de **tickets de soporte tÃ©cnico, solicitudes de insumos y control de inventario**. Los empleados reportan fallas de cÃ³mputo y piden insumos; el Ã¡rea de soporte los atiende desde un solo lugar; y la administraciÃ³n consulta inventario, manuales tÃ©cnicos e historial de todo lo que ha ocurrido, **en tiempo real** con notificaciones automÃ¡ticas.

EstÃ¡ dirigido al personal interno de la empresa (empleados y administradores de TI).

## CaracterÃ­sticas

- **Dos roles:** *usuario* (crea tickets, adjunta evidencias, consulta manuales, solicita insumos) y *administrador* (atiende tickets, aprueba solicitudes, controla stock, da de alta empleados y categorÃ­as).
- **Tickets con estados:** *En proceso*, *Resuelto*, *No Resuelto* y *Cancelado*, con prioridad Baja/Media/Alta/Urgente y calificaciÃ³n de 1 a 5 estrellas al cerrar.
- **Auto-cierre a las 48 h** con alertas automÃ¡ticas cuando un ticket estÃ¡ por vencer.
- **Manuales en PDF:** portada en miniatura, orden por categorÃ­a, bÃºsqueda y descarga.
- **Inventario** con control de entradas y salidas de insumos.
- **Notificaciones en tiempo real** con Socket.io.
- **Seguridad:** contraseÃ±as con bcrypt, sesiones JWT de 12 h, validaciÃ³n con Zod, Helmet y rate limiting.
- **Seguridad corporativa:** acceso con Zoho (OAuth server-based) para emparejar empleados y asignar roles.

## Inventario: permisos de visibilidad

La tabla `insumo` tiene la columna `activo` (dentro de la `database/schema.sql`).
El administrador (o Soporte Tecnico) puede **ocultar un insumo para los usuarios**
sin eliminarlo: los insumos inhabilitados (`activo = 0`) desaparecen de los
listados de solicitud y de las **Salidas internas**, pero se conservan en el
historial, en los movimientos de kardex y siguen editables por admin/Soporte.

- Los **administradores y Soporte Tecnico** ven todo el inventario, con stock y
  la opciÃ³n de Inhabilitar/Mostrar para todos.
- El **rol Usuario** solo recibe los insumos con `stock > 0` y `activo = 1`; no
  recibe el stock exacto ni la disponibilidad calculada (solo "Sin stock",
  "Stock bajo" o "Disponible").

Para ocultar un insumo desde el panel de Inventario (pestaÃ±a Insumos), se
utiliza el menÃº `â‹®` de cada fila y se elige **Inhabilitar**; **Mostrar para
todos** lo devuelve al listado.

## TecnologÃ­as utilizadas

- **Frontend:** React 18, Vite 6, TailwindCSS 4, React Router 7
- **Backend:** Node.js, Express 5
- **Base de datos:** MySQL 8
- **Tiempo real:** Socket.io
- **Seguridad:** bcryptjs, jsonwebtoken, Zod, Helmet, express-rate-limit
- **Archivos/PDF:** Multer, pdfjs-dist, canvas, sharp
- **Reportes:** exceljs

## Requisitos previos

- **Node.js** (versiÃ³n 14 o superior)s 18 o superior**
- **npm 9 o superior**
- **MySQL 8 o superior**

## InstalaciÃ³n

```bash
git clone https://github.com/Matthew-Garay/Precision-Truck-Parts---Help-Desk.git
cd PrecisionTrucks_HelpDesk
npm install
```

El proyecto usa **npm workspaces**: `npm install` en la raÃ­z instala las dependencias de `server/` y `client/` en un solo `node_modules/`.

Copia los archivos de variables de entorno y rellÃ©nalos:

```bash
cp server/.env.example server/.env
cp client/.env.example client/.env
```

Variables principales de `server/.env`:

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

Variables principales de `client/.env`:

```env
# VacÃ­o en desarrollo: usa el proxy de Vite (evita CORS)
VITE_API_URL=
VITE_PORT=5173
VITE_BACKEND_URL=http://localhost:3001
```

Crea la base de datos con el esquema incluido:

```bash
mysql -u root -p < database/schema.sql
```

Arranca todo (frontend + backend):

```bash
npm run dev:all
```

O en dos terminales: `npm run dev` (frontend en http://localhost:5173) y `npm run server` (API en http://localhost:3001).

### Correo de recuperaciÃ³n de contraseÃ±as

Si usas Gmail, activa la **verificaciÃ³n en dos pasos** y genera una **contraseÃ±a de aplicaciÃ³n**; esa va en `SMTP_PASS` (no la de tu cuenta). Con cualquier otro SMTP solo cambia las lÃ­neas `SMTP_*`.

## Inicio de sesiÃ³n con Zoho

Si el administrador habilita la autenticaciÃ³n corporativa con Zoho, los usuarios pueden iniciar sesiÃ³n desde el mismo login usando el botÃ³n **Iniciar sesiÃ³n con Zoho**.

**Flujo:**
1. El botÃ³n consulta `GET /api/auth/zoho/login`, que genera un `state` antifalsificaciÃ³n y redirige al consentimiento de Zoho con `openid email profile`.
2. Zoho redirige al callback `GET /api/auth/zoho/callback`.
3. El backend valida el `state` y el `id_token`, empata el correo con un empleado activo y emite el mismo JWT de 12 h que el login normal.
4. El frontend (`/login/zoho`) consume el fragmento de la URL y guarda token, `id_acceso` y usuario sin dejar el JWT en la barra de direcciones.

**Requisitos del backend:**
```env
ZOHO_CLIENT_ID=[SECURITY_DATA]
ZOHO_CLIENT_SECRET=PEGAR_AQUI_EL_CLIENT_SECRET
ZOHO_ACCOUNTS_URL=https://accounts.zoho.com
ZOHO_REDIRECT_URI=http://192.168.x.x:3001/api/auth/zoho/callback
ZOHO_SCOPES=openid,email,profile
```

**DÃ³nde verlo:**
- BotÃ³n en `client/src/pages/Login.jsx` (logo `/assets/img/zoho-logo.svg`).
- Pantalla `/login/zoho` (`client/src/pages/ZohoCallbackPage.jsx`).
- Servidor `server/controllers/zoho-controller.js`.

## Despliegue en producciÃ³n

Para publicar el sistema en internet (dominio, variables de entorno, volumen de
archivos, endurecimiento de seguridad y restricciÃ³n de acceso a correos
corporativos) consulta la guÃ­a completa: [docs/despliegue.md](docs/despliegue.md).

Resumen: el proyecto es un monolito full-stack listo para **Railway** (regiÃ³n
California, la mÃ¡s cercana a MÃ©xico). El backend sirve el frontend compilado y
la API bajo un mismo dominio. El acceso ya estÃ¡ limitado a correos corporativos
mediante `validarEmailCorporativo`.

## Uso

**Primer arranque:**
- URL: http://localhost:5173
- Usuario: `admin@precisiontrucks.com`
- ContraseÃ±a: `Admin123!@#` *(cÃ¡mbiala antes de producciÃ³n)*

Un ticket se crea desde **Nuevo Reporte**: tÃ­tulo, descripciÃ³n, categorÃ­a, prioridad y hasta 8 evidencias. Los manuales se suben desde **Manuales de Incidencias** (solo administrador).

## Estructura del proyecto

```
PrecisionTrucks_HelpDesk/
â”œâ”€â”€ client/                  # Frontend React (Vite + Tailwind) â€” paquete npm propio
â”‚   â”œâ”€â”€ public/              # Archivos estÃ¡ticos (assets/img)
â”‚   â”œâ”€â”€ src/
â”‚   â”‚   â”œâ”€â”€ assets/          # CSS importado por main.jsx
â”‚   â”‚   â”œâ”€â”€ components/      # Componentes React reutilizables (PascalCase)
â”‚   â”‚   â”œâ”€â”€ pages/           # Vistas por rol (Admin/, Usuario/, print/)
â”‚   â”‚   â”œâ”€â”€ context/         # ThemeContext y proveedores globales
â”‚   â”‚   â”œâ”€â”€ hooks/           # Custom hooks (useAuth, useSocket, ...)
â”‚   â”‚   â”œâ”€â”€ services/        # api-client.js (axios) y conectores externos
â”‚   â”‚   â”œâ”€â”€ utils/           # Validaciones, formatos y helpers puros
â”‚   â”‚   â””â”€â”€ main.jsx         # Punto de entrada de la SPA
â”‚   â”œâ”€â”€ .env                 # Solo variables VITE_* (no se versiona)
â”‚   â”œâ”€â”€ index.html
â”‚   â”œâ”€â”€ package.json
â”‚   â””â”€â”€ vite.config.js       # outDir ../dist para el contrato de deploy
â”œâ”€â”€ server/                  # Backend Express (paquete npm propio)
â”‚   â”œâ”€â”€ config/              # db.js (pool MySQL), mailer.js, zoho.js, constants.js
â”‚   â”œâ”€â”€ controllers/         # LÃ³gica HTTP por recurso
â”‚   â”œâ”€â”€ middlewares/         # auth, validaciÃ³n, subida y manejo de errores
â”‚   â”œâ”€â”€ routes/              # DefiniciÃ³n de endpoints bajo /api
â”‚   â”œâ”€â”€ services/            # Consultas MySQL y lÃ³gica de negocio (tickets, alertas, ...)
â”‚   â”œâ”€â”€ utils/               # Helpers puros (fechas, JWT, passwords, ...)
â”‚   â”œâ”€â”€ workers/             # Jobs programados (alertas SLA, cierre, limpieza)
â”‚   â”œâ”€â”€ scripts/             # Utilidades one-shot (probar-correo, ...)
â”‚   â”œâ”€â”€ .env                 # Variables del servidor (no se versiona)
â”‚   â”œâ”€â”€ load-env.js          # Carga de variables de entorno (--import)
â”‚   â”œâ”€â”€ server.js            # Punto de entrada: Express + Socket.io
â”‚   â””â”€â”€ package.json
â”œâ”€â”€ database/                # Esquema SQL versionado
â”‚   â”œâ”€â”€ schema.sql           # Esquema MySQL completo (DDL)
â”‚   â””â”€â”€ dump-schema.mjs      # Generador del esquema desde la BD viva
â”œâ”€â”€ docs/                    # DocumentaciÃ³n tÃ©cnica
â”œâ”€â”€ storage/                 # Evidencias, insumos y manuales subidos (regenerable)
â”œâ”€â”€ scripts/                 # Scripts de mantenimiento (liberar-puertos.ps1)
â”œâ”€â”€ dist/                    # Build de producciÃ³n (generado por npm run build)
â”œâ”€â”€ respaldar.ps1            # Copia de seguridad de la BD + storage
â”œâ”€â”€ restaurar.ps1            # RestauraciÃ³n de una copia
â”œâ”€â”€ package.json             # Orquestador de npm workspaces (dev, build, ...)
â”œâ”€â”€ railway.json             # ConfiguraciÃ³n de despliegue
â””â”€â”€ README.md
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

## SoluciÃ³n de problemas

- **Los PDF no cargan en el visor:** verifica `storage/Manuales/` y regenera portadas con `node --import ./server/load-env.js server/scripts/generar-portadas-existentes.js`; si todo estÃ¡ bien, limpia la cachÃ© del navegador.
- **No conecta con la BD:** comprueba que MySQL corra y que las credenciales de `.env` coincidan.
- **No llegan los correos:** suele ser la contraseÃ±a de Gmail normal en lugar de la de aplicaciÃ³n; revisa `SMTP_*`.
- **Va lento:** `OPTIMIZE TABLE ticket;` y `OPTIMIZE TABLE solicitud;`.

## Desarrollo

Flujo habitual: fork â†’ rama `feature/...` â†’ commit descriptivo â†’ pull request. El cÃ³digo se valida con ESLint y se documenta con JSDoc. Reporta errores en [Issues](https://github.com/Matthew-Garay/Precision-Truck-Parts---Help-Desk/issues).

## Licencia

Proyecto de uso interno empresarial; documentaciÃ³n y cÃ³digo sujetos a los tÃ©rminos del proyecto.

## Autor

**Matthew Ilveneff Garay Pérez** — desarrollo principal  Contacto: matthew.garay@refividrio.com.mx · matthew.garay@ptp.com.mx


