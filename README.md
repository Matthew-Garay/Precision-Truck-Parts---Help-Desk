# Precision Truck Parts — HelpDesk (Mesa de ayuda)

<img src="https://upload.wikimedia.org/wikipedia/commons/thumb/4/44/Letter_P.svg/1200px-Letter_P.svg.png" alt="Precision Truck Parts Logo" width="100" style="display: block; margin: 0 auto;">

Sistema web de gestion de tickets de soporte tecnico, solicitudes de insumos y control de inventario para Precision Truck Parts, Parts and Accesories, S.A. de C.V. Los usuarios pueden iniciar sesion con su cuenta corporativa a traves de Zoho si el administrador lo habilita.

### Tecnologias

React Vite TailwindCSS Node.js Express MySQL Socket.io

### Descripcion

Sistema integral de tickets de soporte tecnico, solicitudes de insumos y control de inventario. Los empleados reportan fallas de computo y piden insumos; el area de soporte los atiende desde un solo lugar; y la administracion consulta inventario, manuales tecnicos e historial de todo lo que ha ocurrido, en tiempo real con notificaciones automaticas.

Esta dirigido al personal interno de la empresa (empleados y administradores de TI).

### Caracteristicas

| Categoria | Detalle |
|-----------|---------|
| Roles | Usuario (crea tickets, adjunta evidencias, consulta manuales, solicita insumos) y Administrador (atiende tickets, aprueba solicitudes, controla stock, da de alta empleados y categorias). |
| Tickets | Estados: En proceso, Resuelto, No Resuelto y Cancelado. Prioridades: Baja, Media, Alta y Urgente. Calificacion de 1 a 5 estrellas al cerrar. |
| Auto-cierre | Cierre automatico a las 48 horas con alertas cuando un ticket esta por vencer. |
| Manuales | PDF con portada en miniatura, orden por categoria, busqueda y descarga. |
| Inventario | Control de entradas y salidas de insumos con historial de movimientos (kardex). |
| Tiempo real | Notificaciones automaticas con Socket.io. |
| Seguridad | Contraseñas con bcrypt, sesiones JWT de 12 horas, validacion con Zod, Helmet y rate limiting. |
### Tecnologias utilizadas

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
| Validacion | Zod | — |
| Seguridad | Helmet, express-rate-limit | — |
| Archivos / PDF | Multer, pdfjs-dist, canvas, sharp | — |
| Reportes | exceljs | — |

### Requisitos previos

| Requisito | Version minima |
|-----------|----------------|
| Node.js | 18 |
| npm | 9 |
| MySQL | 8 |

### Instalacion

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

### Credenciales de primer arranque

| Campo | Valor |
|-------|-------|
| URL | http://localhost:5173 |
| Usuario | admin@precisiontrucks.com |
| Contraseña | Admin123!@# (cambiar antes de produccion) |

Un ticket se crea desde Nuevo Reporte: titulo, descripcion, categoria, prioridad y hasta 8 evidencias. Los manuales se suben desde Manuales de Incidencias (solo administrador).

### Solucion de problemas

| Problema | Solucion |
|----------|----------|
| Los PDF no cargan en el visor | Verifica que el archivo exista en `storage/Manuales/`. La portada se genera en el navegador (hook `use-pdf-cover`): limpia la caché del navegador. |
| No conecta con la BD | Comprueba que MySQL esté corriendo y que las credenciales de `.env` coincidan. |
| No llegan los correos | Suele ser la contraseña de Gmail normal en lugar de la de aplicación. Revisa `SMTP_*`. |
| Va lento | Ejecuta `OPTIMIZE TABLE ticket;` y `OPTIMIZE TABLE solicitud;` en MySQL. |

### Logica de permisos de Inventario

La tabla `insumo` tiene la columna `activo` (dentro de `database/schema.sql`). El administrador (o Soporte Tecnico) puede ocultar un insumo para los usuarios sin eliminarlo: los insumos inhabilitados (`activo = 0`) desaparecen de los listados de solicitud y de las Salidas internas, pero se conservan en el historial, en los movimientos de kardex y siguen editables por admin/Soporte.

| Rol | Visibilidad de insumos | Stock visible |
|-----|------------------------|---------------|
| Administrador / Soporte Tecnico | Todo el inventario, con opcion de Inhabilitar / Mostrar para todos | Stock exacto |
| Usuario | Solo insumos con `stock > 0` y `activo = 1` | Solo "Sin stock", "Stock bajo" o "Disponible" |

Para ocultar un insumo desde el panel de Inventario (pestana Insumos), se utiliza el menu de opciones de cada fila y se elige Inhabilitar. Mostrar para todos lo devuelve al listado.

### Flujo de inicio de sesion con Zoho SSO

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