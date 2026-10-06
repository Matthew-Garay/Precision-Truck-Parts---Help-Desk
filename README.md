# Precision Truck Parts - HelpDesk

Sistema de tickets, solicitudes de insumos y control de inventario desarrollado
para Precision Truck Parts, Parts and Accesories, S.A. de C.V. En resumen: los
empleados reportan fallas de computo y piden insumos, el area de soporte los
atiende desde un solo lugar, y la administracion ve inventario, manuales
tecnicos e historial de todo lo que ha pasado.

El sistema tiene dos roles: administrador y usuario. El usuario crea tickets,
adjunta evidencias, consulta manuales y solicita insumos. El administrador
atiende los tickets, aprueba solicitudes, controla el stock y da de alta
empleados y categorias. Los tickets se van cerrando solos a las 48 horas si
nadie los resuelve, y el sistema manda alertas cuando eso esta por pasar.
Sobre la tecnologia: Express con Node.js en el backend, React con Vite en el
frontend, MySQL como base de datos y Socket.io para las notificaciones en
tiempo real. Las contrasenas se guardan con bcrypt, los accesos con JWT de 12
horas, y la validacion de datos esta hecha con Zod.

---

## Requisitos

- Node.js 18 o superior
- MySQL 8 o superior
- npm 9 o superior

---

## Instalacion

```bash
git clone https://github.com/Matthew-Garay/Precision-Truck-Parts---Help-Desk.git
cd PrecisionTrucks_HelpDesk
npm install
```

Copia el archivo de ejemplo de variables de entorno y llenalo con tus datos:

```bash
cp .env.example .env
```

Las variables que hacen falta:

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

Despues crea la base de datos con el esquema que viene en `docs/database.sql`:

```bash
mysql -u root -p < docs/database.sql
```

Y arranca:

```bash
npm run dev:all
```

O en dos terminales (`npm run dev` en una para el frontend y `npm run server`
en otra para el backend). Quedan disponibles el frontend en
http://localhost:5173 y la API en http://localhost:3001.

### Correo para recuperacion de contrasenas

Si usas Gmail, en https://myaccount.google.com/security activa la verificacion
en dos pasos y genera una contrasena de aplicacion; esa es la que va en
`SMTP_PASS`, no la de tu cuenta. Con cualquier otro proveedor SMTP solo cambias
las tres lineas de `SMTP_*`.

---

## Uso

Para el primer arranque:

- URL: http://localhost:5173
- Usuario: admin@precisiontrucks.com
- Contrasena: Admin123!@#

Cambiar esa contrasena antes de ponerlo en produccion.

Un ticket se crea desde **Nuevo Reporte**: titulo, descripcion del problema,
categoria, prioridad y hasta 8 archivos de evidencia (capturas, videos). Los
tickets aparecen con estado *En proceso*, *Resuelto*, *No Resuelto* o
*Cancelado*, y prioridad Baja, Media, Alta o Urgente. Al cerrarlos el usuario
los califica de 1 a 5 estrellas.

Los manuales en PDF se suben desde **Manuales de Incidencias** (solo
administrador). El sistema genera una portada en miniatura de cada uno, los
ordena por categoria y permite buscarlos y descargarlos.

---

## Estructura

```
PrecisionTrucks_HelpDesk/
|-- docs/          documentacion, esquema SQL y manuales
|-- src/Backend/   servidor Express (server.js, Controllers, Models, Routes)
|-- src/Frontend/  aplicacion React (Pages, Components, Config)
|-- public/        archivos estaticos
|-- storage/       PDFs, evidencias y fotos de perfil que suben los usuarios
|-- package.json
`-- .env.example
```

El detalle de cada carpeta esta en
[docs/tecnica/ESTRUCTURA_PROYECTO.md](docs/tecnica/ESTRUCTURA_PROYECTO.md).

---

## Documentacion

Todo lo documental esta en `docs/`, empezando por
[docs/README.md](docs/README.md) que sirve de indice. Lo mas consultado:

| Documento | Para que sirve |
|---|---|
| [ARQUITECTURA.md](docs/tecnica/ARQUITECTURA.md) | Diagrama y descripcion de la arquitectura |
| [DiccionarioDatos.md](docs/tecnica/DiccionarioDatos.md) | Tablas y campos de la base de datos |
| [IEEE830_REQUERIMIENTOS.md](docs/tecnica/IEEE830_REQUERIMIENTOS.md) | Especificacion de requerimientos |
| [DESPLIEGUE.md](docs/operacion/DESPLIEGUE.md) | Guia de despliegue en produccion |
| [MANUAL_DE_USO.md](docs/manuales_residencia/MANUAL_DE_USO.md) | Manual de uso para los empleados |
| [MANUAL_DE_MANTENIMIENTO.md](docs/manuales_residencia/MANUAL_DE_MANTENIMIENTO.md) | Mantenimiento del software |

---

## API

Todas las rutas piden el token de sesion en la cabecera
`Authorization: Bearer {token}`, salvo el login.

```bash
POST /api/auth/login
{"email": "usuario@precisiontrucks.com", "password": "contrasena"}
```

```bash
POST /api/tickets            # crear ticket
GET  /api/tickets            # listar (solo admin)
PATCH /api/tickets/:id       # cambiar estado o resolver (solo admin)

POST /api/solicitudes        # pedir insumos
GET  /api/manuales           # listar manuales
POST /api/manuales           # subir manual (solo admin, multipart)
```

La documentacion completa, con todos los parametros y respuestas, esta en la
seccion 16 de
[DOCUMENTACION_PROFESIONAL.md](docs/profesional/DOCUMENTACION_PROFESIONAL.md).

---

## Solucion de problemas

**Los manuales en PDF no cargan en el visor.** Revisa que los archivos existan
con `ls -la storage/Manuales/`, que tengan permisos de lectura y regenera las
portadas con:

```bash
node src/Backend/scripts/generarPortadasExistentes.js
```

Si todo esta bien, limpia la cache del navegador (`Ctrl+Shift+Delete`); muchas
veces es eso.

**No conecta con la base de datos.** Comprueba que MySQL este corriendo
(`services.msc` en Windows, `systemctl status mysql` en Linux) y que las
credenciales de `.env` coincidan con las reales.

**No llegan los correos de recuperacion de contrasena.** En la mayoria de los
casos es que se puso la contrasena de Gmail en lugar de la contrasena de
aplicacion. El resto: revisa `SMTP_*` en `.env`.

**Va lento.** Primero limpia la cache del navegador. Si sigue lento, optimiza
las tablas mas consultadas:

```sql
OPTIMIZE TABLE ticket;
OPTIMIZE TABLE solicitud;
```

---

## Desarrollo

El flujo es el habitual: fork, rama con `git checkout -b feature/lo-que-seas`,
commit con mensaje descriptivo y pull request. El codigo se valida con ESLint y
las funciones se documentan con JSDoc.

Reportar errores en [Issues](https://github.com/Matthew-Garay/Precision-Truck-Parts---Help-Desk/issues)
con los pasos para reproducirlos y capturas si es posible.

---

## Autor

Matthew Garay - desarrollo principal.

Para mas dudas: soporte@precisiontrucks.com
