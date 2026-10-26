# Precision Truck Parts — HelpDesk

Sistema web de gestion de tickets de soporte tecnico, solicitudes de insumos y control de inventario para Precision Truck Parts, Parts and Accesories, S.A. de C.V.

Los usuarios pueden iniciar sesion con su cuenta corporativa a traves de Zoho si el administrador lo habilita.

[![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=white)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-6-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-5-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![MySQL](https://img.shields.io/badge/MySQL-8-4479A1?style=for-the-badge&logo=mysql&logoColor=white)](https://www.mysql.com/)
[![Socket.io](https://img.shields.io/badge/Socket.io-010101?style=for-the-badge&logo=socket.io&logoColor=white)](https://socket.io/)

## Descripcion

Sistema integral de tickets de soporte tecnico, solicitudes de insumos y control de inventario. Los empleados reportan fallas de computo y piden insumos; el area de soporte los atiende desde un solo lugar; y la administracion consulta inventario, manuales tecnicos e historial de todo lo que ha ocurrido, en tiempo real con notificaciones automaticas.

Esta dirigido al personal interno de la empresa (empleados y administradores de TI).

## Caracteristicas

| Categoria | Detalle |
|-----------|---------|
| Roles | Usuario (crea tickets, adjunta evidencias, consulta manuales, solicita insumos) y Administrador (atiende tickets, aprueba solicitudes, controla stock, da de alta empleados y categorias). |
| Tickets | Estados: En proceso, Resuelto, No Resuelto y Cancelado. Prioridades: Baja, Media, Alta y Urgente. Calificacion de 1 a 5 estrellas al cerrar. |
| Auto-cierre | Cierre automatico a las 48 horas con alertas cuando un ticket esta por vencer. |
| Manuales | PDF con portada en miniatura, orden por categoria, busqueda y descarga. |
| Inventario | Control de entradas y salidas de insumos con historial de movimientos (kardex). |
| Tiempo real | Notificaciones automaticas con Socket.io. |
| Seguridad | Contraseñas con bcrypt, sesiones JWT de 12 horas, validacion con Zod, Helmet y rate limiting. |
| Seguridad corporativa | Acceso con Zoho (OAuth server-based) para emparejar empleados y asignar roles. |

## Tecnologias utilizadas

| Capa | Tecnologia | Version |
|------|------------|---------|
| Frontend | React | 18 |
| Herramienta de compilacion | Vite | 6 |
| Estilos | TailwindCSS | 4 |
| Ruteo | React Router | 7 |
| Backend | Node.js + Express | 5 |
| Base de datos | MySQL | 8 |
| Tiempo real | Socket.io | — |
| Autenticacion | JWT + bcryptjs | — |

## Instalacion

```bash
git clone https://github.com/Matthew-Garay/Precision-Truck-Parts---Help-Desk.git
cd PrecisionTrucks_HelpDesk
npm install
```

El proyecto usa npm workspaces. `npm install` en la raiz instala las dependencias de `server/` y `client/` en un solo `node_modules/`.

### Variables de entorno

Copia los archivos de ejemplo y rellenalos:

```bash
cp server/.env.example server/.env
cp client/.env.example client/.env
```

**server/.env**

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

**client/.env**

```env
# Vacío en desarrollo: usa el proxy de Vite (evita CORS)
VITE_API_URL=
VITE_PORT=5173
VITE_BACKEND_URL=http://localhost:3001
```

### Base de datos

```sql
mysql -u root -p < database/schema.sql
```

### Arranque

**Opcion 1: todo junto**

```bash
npm run dev:all
```

**Opcion 2: dos terminales**

```bash
# Terminal 1: frontend en http://localhost:5173
npm run dev

# Terminal 2: API en http://localhost:3001
npm run server
```

## Credenciales de primer arranque

| Campo | Valor |
|-------|-------|
| URL | http://localhost:5173 |
| Usuario | admin@precisiontrucks.com |

## Solucion de problemas

| Problema | Solucion |
|----------|----------|
| Los PDF no cargan en el visor | Verifica `storage/Manuales/` y regenera portadas con `node --import ./server/load-env.js server/scripts/generar-portadas-existentes.js`. Limpia la caché del navegador. |
| No conecta con la BD | Comprueba que MySQL esté corriendo y que las credenciales de `.env` coincidan. |
| No llegan los correos | Suele ser la contraseña de Gmail normal en lugar de la de aplicación. Revisa `SMTP_*`. |
| Va lento | Ejecuta `OPTIMIZE TABLE ticket;` y `OPTIMIZE TABLE solicitud;` en MySQL. |

<details>
<summary>Flujo de inicio de sesion con Zoho SSO</summary>

Si el administrador habilita la autenticación corporativa con Zoho, los usuarios pueden iniciar sesión desde el mismo login usando el botón Iniciar sesión con Zoho.

1. El botón consulta `GET /api/auth/zoho/login`, genera un `state` antifalsificación y redirige al consentimiento de Zoho con `openid email profile`.
2. Zoho redirige al callback `GET /api/auth/zoho/callback`.
3. El backend valida el `state` y el `id_token`, empata el correo con un empleado activo y emite el mismo JWT de 12 horas que el login normal.
4. El frontend (`/login/zoho`) consume el fragmento de la URL y guarda token, `id_acceso` y usuario sin dejar el JWT en la barra de direcciones.

**Requisitos del backend**

```env
ZOHO_CLIENT_ID=[SECURITY_DATA]
ZOHO_CLIENT_SECRET=PEGAR_AQUI_EL_CLIENT_SECRET
ZOHO_ACCOUNTS_URL=https://accounts.zoho.com
ZOHO_REDIRECT_URI=http://192.168.x.x:3001/api/auth/zoho/callback
ZOHO_SCOPES=openid,email,profile
```

**Ubicación de los archivos**

| Componente | Ruta |
|------------|------|
| Botón de login | `client/src/pages/Login.jsx` |
| Pantalla callback | `client/src/pages/ZohoCallbackPage.jsx` |
| Controlador servidor | `server/controllers/zoho-controller.js` |

</details>

## Despliegue en produccion

Para publicar el sistema en internet (dominio, variables de entorno, volumen de archivos, endurecimiento de seguridad y restricción de acceso a correos corporativos) consulta la guía completa: `docs/despliegue.md`.

Resumen: el proyecto es un monolito full-stack listo para Railway (región California, la más cercana a México). El backend sirve el frontend compilado y la API bajo un mismo dominio. El acceso ya está limitado a correos corporativos mediante `validarEmailCorporativo`.

## Estructura del proyecto

```text
PrecisionTrucks_HelpDesk/
├── client/
│   ├── public/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── context/
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── utils/
│   │   └── main.jsx
│   ├── .env
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
├── server/
│   ├── config/
│   ├── controllers/
│   ├── middlewares/
│   ├── routes/
│   ├── services/
│   ├── utils/
│   ├── workers/
│   ├── scripts/
│   ├── .env
│   ├── load-env.js
│   ├── server.js
│   └── package.json
├── database/
│   ├── schema.sql
│   └── dump-schema.mjs
├── docs/
├── storage/
├── scripts/
├── dist/
├── respaldar.ps1
├── restaurar.ps1
├── package.json
├── railway.json
└── README.md
```

## Desarrollo

Flujo habitual: fork → rama `feature/...` → commit descriptivo → pull request. El código se valida con ESLint y se documenta con JSDoc. Reporta errores en [Issues](https://github.com/Matthew-Garay/Precision-Truck-Parts---Help-Desk/issues).

## Licencia

Proyecto de uso interno empresarial; documentación y código sujetos a los términos del proyecto.

## Autor

**Matthew Ilveneff Garay Pérez** — desarrollo principal  
Contacto: matthew.garay@refividrio.com.mx · matthew.garay@ptp.com.mx
| Contraseña | Admin123!@# (cambiar antes de produccion) |

Un ticket se crea desde Nuevo Reporte: titulo, descripcion, categoria, prioridad y hasta 8 evidencias. Los manuales se suben desde Manuales de Incidencias (solo administrador).

<details>
<summary>Logica de permisos de Inventario</summary>

La tabla `insumo` tiene la columna `activo` (dentro de `database/schema.sql`). El administrador (o Soporte Tecnico) puede ocultar un insumo para los usuarios sin eliminarlo: los insumos inhabilitados (`activo = 0`) desaparecen de los listados de solicitud y de las Salidas internas, pero se conservan en el historial, en los movimientos de kardex y siguen editables por admin/Soporte.

| Rol | Visibilidad de insumos | Stock visible |
|-----|------------------------|---------------|
| Administrador / Soporte Tecnico | Todo el inventario, con opcion de Inhabilitar / Mostrar para todos | Stock exacto |
| Usuario | Solo insumos con `stock > 0` y `activo = 1` | Solo "Sin stock", "Stock bajo" o "Disponible" |

Para ocultar un insumo desde el panel de Inventario (pestana Insumos), se utiliza el menu de opciones de cada fila y se elige Inhabilitar. Mostrar para todos lo devuelve al listado.

</details>

## API (resumen)

Todas las rutas requieren el token en la cabecera `Authorization: Bearer {token}`, salvo el login.

| Metodo | Endpoint | Descripcion |
|--------|----------|-------------|
| POST | /api/auth/login | Autenticacion de usuario |
| POST | /api/auth/logout | Cerrar sesion |
| GET | /api/tickets | Listar tickets (solo admin) |
| POST | /api/tickets | Crear ticket |
| PATCH | /api/tickets/:id | Cambiar estado / resolver (solo admin) |
| GET | /api/solicitudes | Listar solicitudes de insumos |
| POST | /api/solicitudes | Crear solicitud de insumos |
| GET | /api/manuales | Listar manuales |
| POST | /api/manuales | Subir manual (solo admin, multipart) |
| Validacion | Zod | — |
| Seguridad | Helmet, express-rate-limit | — |
| Archivos / PDF | Multer, pdfjs-dist, canvas, sharp | — |
| Reportes | exceljs | — |

## Requisitos previos

| Requisito | Version minima |
|-----------|----------------|
| Node.js | 18 |
| npm | 9 |
| MySQL | 8 |