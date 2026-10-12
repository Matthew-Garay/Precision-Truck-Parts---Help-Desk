# Auditoria, limpieza y reestructuracion arquitectonica

Proyecto: precision_helpdesk (Node.js/Express + React/Vite + MySQL 8.0)
Fecha de la auditoria: 12/10/2026
Metodo: analisis automatico de grafo de importaciones (escaneo de todos los `import`/`require` relativos del arbol `src/` con resolucion de extensiones), conteo de sintaxis, verificacion de dependencias por import real, ejecucion de `node --check` sobre todo el backend y `npm run build` del frontend.

---

## 1. Reporte de auditoria y depuracion

### 1.1 Archivos eliminados (ejecutado y verificado)

Ejecucion realizada en esta revision. Ninguna eliminacion altera comportamiento: todos los archivos borrados carecian de importadores en el grafo de dependencias o eran residuos de desarrollo.

| Archivo | Lineas | Motivo |
|---|---|---|
| `src/Frontend/Pages/Usuario/VistaInsumos.jsx` | 351 | Nunca importado por ningun archivo. Sustituido por `Admin/Inventario.jsx` y `Admin/HistorialInsumos.jsx`. |
| `src/Frontend/Pages/Usuario/HistorialInsumos.jsx` | 366 | Nunca importado. El dashboard de usuario no lo monta; solo `Admin/Dashboard.jsx` usa la version de administrador. |
| `src/Frontend/Components/ManualTable.jsx` | 329 | Nunca importado por ningun archivo. |
| `src/Frontend/Components/ManualDetailPanel.jsx` | 242 | Unico importador era `ManualTable.jsx` (tambien huerfano). Subarbol completo muerto. |
| `src/Frontend/Components/StockBar.jsx` | 40 | Nunca importado. |
| `src/Frontend/Components/ThemeToggle.jsx` | 66 | Nunca importado. El tema lo gestiona `Config/ThemeContext.jsx` + `Config/themeTokens.js`. |
| `src/Frontend/Components/fix_salida.py` | 16 | Script de Python suelto dentro de componentes React; sin relacion con el build. |
| `check_undef.mjs`, `check-backend-syntax.mjs`, `zod_test.mjs`, `tmp_check_foto.mjs`, `tmp_check_foto2.mjs`, `tmp_check_foto3.mjs`, `tmp_solicitudes.mjs` | ~150 total | Scripts de prueba/diagnostico abandonados en la raiz. `check_undef.mjs` ademas depende de `@babel/parser`, que no esta en `package.json` (script inservible). |
| `database.db` | 0 | Artefacto SQLite vacio; el sistema usa MySQL. |
| `build_out.txt`, `build.log`, `dev_all.log` | ~80 | Artefactos de build/log sueltos en la raiz (ya cubiertos por `*.log` en `.gitignore`). |
| `src/Backend/scripts/check_utf8_result.txt` | 8 | Salida temporal del verificador UTF-16 de la sesion anterior. |
| `docs/MYSQL Database/database.sql` | 5 | Contenido corrupto: texto de error de `mysqldump` ("no se reconoce como un comando...") codificado en UTF-16. El volcado valido es `database.utf8.sql`. |

Verificacion posterior a las eliminaciones:
- Grafo de importaciones: 0 rotas; 0 huerfanos nuevos (solo quedan sin importar las entradas legitimas: `src/Backend/server.js`, `scripts/probar-correo.js`, `scripts/generarPortadasExistentes.js`).
- `node --check` sobre los 48 archivos `.js` del backend: 0 errores de sintaxis.
- `npm run build` (Vite): build exitoso en 12.14 s.

### 1.2 Dependencias eliminadas de `package.json` (ejecutado)

Todas verificadas sin ningun `import`/`require` en el codigo fuente:

| Paquete | Evidencia |
|---|---|
| `xlsx` | `Admin/Inventario.jsx` exporta con la API de ExcelJS (`wb.xlsx.writeBuffer()`, lineas 449-629), no con SheetJS. Cero importaciones. |
| `xlsx-js-style` | Cero importaciones. |
| `jspdf` | Solo figuraba en el chunk `vendor-pdf` de `vite.config.js` sin importador real. Chunk actualizado a solo `pdfjs-dist`. |
| `jspdf-autotable` | Cero importaciones. |
| `wait-on` | No aparece en ningun script de `package.json` ni en codigo. |

### 1.3 Dependencias que se conservan (falsa alarma verificada)

| Paquete | Uso real |
|---|---|
| `canvas` | `src/Backend/utils/generarPortada.js:9` (render de portadas PDF con pdfjs-dist). |
| `sharp` | `src/Backend/Middlewares/uploadEvidencias.js:39` (recompression de imagenes). |
| `file-type` | 4 middlewares de subida (`uploadEvidencias.js`, `uploadFotos.js`, `uploadInsumos.js`, `uploadManuales.js`) para verificacion magic bytes. |
| `compression`, `cookie-parser` | `server.js:63-64`. |
| `dompurify` | `Pages/Usuario/VistaTicket.jsx:2` (sanitizacion de HTML antes de `dangerouslySetInnerHTML`). |
| `file-saver`, `exceljs` | `Pages/Admin/Inventario.jsx:9-10` (exportes Excel/CSV). |
| `socket.io`, `socket.io-client` | `server.js:61` y `Config/useSocket.js:34` (tiempo real de tickets/solicitudes). |
| `pdfjs-dist` | Frontend (`Config/pdfjs.js`) y backend (`utils/generarPortada.js`). |

### 1.4 Dependencias con vulnerabilidades (pendiente de actualizacion)

`npm audit --omit=dev` reporta 18 vulnerabilidades (1 critica, 11 altas) en dependencias de produccion. Las criticas/altas relevantes:

| Paquete | Severidad | Via |
|---|---|---|
| `proxy-addr` (transitiva de `express`) | critica | spoofing IPv4-mapped-IPv6 |
| `multer` | alta | DoS por nombres de campo; fuga de descriptores |
| `nodemailer` | alta | bypass de `disableFileAccess`; dominios IDN |
| `sharp` | alta | libheif/librsvg |
| `pdfjs-dist` | alta | ejecucion de JS al abrir PDF malicioso |
| `react-router-dom` | alta | modo RSC (afecta solo a RSC; el proyecto no lo usa, pero subir version es recomendable) |
| `socket.io`/`engine.io`/`socket.io-parser` | alta | DoS por memoria/adjuntos |
| `compression` | alta | fuga de memoria en cierre temprano |

Accion recomendada (requiere pruebas de regresion, no se ejecuto para no alterar comportamiento): `npm audit fix` para lo no rompedor y actualizacion mayor de `express`, `multer`, `nodemailer`, `sharp` y `react-router-dom` en una ventana dedicada.

### 1.5 Inconsistencias detectadas (sin ejecutar todavia)

**Backend**

| Inconsistencia | Evidencia |
|---|---|
| Manejo de errores repetido: patron `try/catch` + `res.status(500).json` duplicado en cada handler. | 42 bloques `try` en `solicitudesController.js` (1354 lineas), 29 en `ticketsController.js` (600), 16 en `authController.js` (382). |
| Copia local de `isProd`/`errDetalle` en cada archivo en vez de un helper unico. | `authController.js:70-71`, `solicitudesController.js:75-76`, `zohoController.js:23`, y 5 copias inline en `manualesRoutes.js` (lineas 113, 134, 160, 178). |
| Logica de negocio dentro del archivo de rutas (no hay controlador para manuales). | `manualesRoutes.js:26-181`: handlers GET/POST/PUT/DELETE completos, incluida la persistencia de archivos y el dedupe de nombres. |
| Parseo de ids repetido a mano. | 34 usos de `parseInt(req.params...)` (`authController.js:95,270`, `solicitudesController.js:194,210,331,421,477...`); `toPosId` existe solo en `solicitudesController.js:92`. |
| IP de LAN hardcodeada como fallback de redireccion OAuth. | `zohoController.js:52` usa `http://192.168.31.124:5173` cuando falta `APP_URL`. |
| Herramientas one-shot conviven con el codigo fuente del servidor. | `src/Backend/scripts/db_state.mjs`, `db_fk.mjs`, `db_cleanup.mjs`, `db_cats.mjs`, `db_schema_map.mjs`, CSVs de plantilla y `README_import_empleados.md`. |
| Deriva codigo-base de datos (heredada). | `Empleado.js` y `POST /auth/perfil/:id/foto` siguen referenciando `empleado.foto`, columna eliminada de la BD viva el 12/10/2026 (error 1054 potencial); el docstring de `utils/helpers.js` dice prefijo `SOL` pero el folio real es `SAL`; la tabla `_migraciones` solo existe en el volcado del 01/10. |
| Estado de workers persistido junto al codigo. | `src/Backend/Workers/alert_state.json` y `reset_tokens.json` (correcto que existan; deben vivir fuera de `server/`). |

**Frontend**

| Inconsistencia | Evidencia |
|---|---|
| `console.log` de debug residuales. | `Admin/Dashboard.jsx` (5), `Admin/Personal.jsx` (3), `Usuario/Dashboard.jsx` (2), `Admin/HistorialInsumos.jsx` (2), `Config/useSocket.js:66`, mas 1 cada uno en `NuevoReporte`, `HistorialIncidencias`, `Inventario`, `PdfViewer`, `ErrorBoundary`, `usePdfCover`, `ConfiguracionPerfilShared`. |
| Constantes de inventario duplicadas en 3+ archivos. | `ESTADO_OPTS`/`ESTADO_META` en `Admin/Inventario.jsx:27,35`, `Components/Inventario/ModalInsumo.jsx:11`, `Components/Inventario/ModalDetalleInsumo.jsx:6`. |
| Archivos de tema casi colisionantes por nombre. | `Config/ThemeContext.jsx` (proveedor) y `Config/themeContext.js` (re-export de `useTheme`); `main.jsx:57-58` importa ambos. |
| Custom hooks dispersos fuera de `hooks/`. | `Config/useSocket.js`, `Config/useAutoRefresh.js`, `Config/useTicketNotification.js` conviven con `Components/hooks/useToast.js` y `usePdfCover.js`; el contexto de toasts vive en `Components/context/ToastContext.js`. |
| Mezcla de extensiones TS/JS sin politica declarada. | Modulo de impresion en TS (`Print*.tsx`, `printUtils.ts`) con `tsconfig.json` pero sin `typescript` en devDependencies (Vite transpila sin chequear tipos). |
| Nomenclatura. | `Pages/login.jsx` en minusculas dentro de un arbol PascalCase; carpetas backend en PascalCase y archivos camelCase (`ticketsController.js`) frente al estandar kebab-case. |
| `run_dev.bat` y `vite_run.bat` con ruta absoluta hardcodeada. | `cd /d "D:\Proyecto de Residencias-Matthew Garay\PrecisionTrucks_HelpDesk"`; los scripts npm equivalentes ya existen. |

**Documentacion / repositorio**

| Inconsistencia | Evidencia |
|---|---|
| `README.md` describe la estructura antigua. | `README.md:118-119`. |
| `CHANGELOG.md` referencia una ruta con mayusculas que nunca existio asi en git. | `CHANGELOG.md:8` (`src/Backend/Utils/helpers.js`; la real es `utils`). |
| Carpeta de docs con espacio en el nombre. | `docs/MYSQL Database/`. |
| WIP sin commitear sobre codigos ya documentados. | `git status`: `M Empleado.js`, `M Insumo.js`, `M Solicitud.js`, `M helpers.js`, `M Personal.jsx` (diffs de la sesion de folios `SAL` y `insumo.activo`).

### 1.4 Manejo de errores y variables de entorno

| Hallazgo | Evidencia |
|---|---|
| `try/catch` por handler con `console.error` directo, sin `next(err)`. | `ticketsController.js` (15 bloques), `authController.js:89-91,110-112`, `manualesRoutes.js:40,113-114,134-136,160-162,178-180` |
| `server.js` ya posee middleware global 500 pero nunca recibe errores porque los controladores no propagan. | `server.js:290-300` |
| `isProd`/`errDetalle` duplicados en vez de helper unico. | `authController.js:70-71`, `solicitudesController.js:75-76`, `zohoController.js:23` |
| `JWT_SECRET`, `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` validados al arranque. `APP_URL`, `CORS_ORIGIN`, `SMTP_*` solo con fallback silencioso. | `server.js:8-9,311,330`, `zohoController.js:52` fallback `http://192.168.31.124:5173` |
| `VITE_API_URL` con fallback `""` (mismo origen). Correcto para prod donde Express sirve `dist/`. | `Config/api.js:29`, `server.js:284-288` |

### 1.5 Contratos API y base de datos

| Hallazgo | Evidencia |
|---|---|
| Prefijos REST estables, no se modifican. | `/api/auth`, `/api/categorias`, `/api/tickets`, `/api/solicitudes`, `/api/manuales`, `/api/health`, `/api/ping` en `server.js:251,272-276` |
| Orden de rutas critico en tickets (fijas antes que `/:id_ticket`). | `ticketsRoutes.js:76-107` |
| Deriva codigo-BD: `Empleado.js` y `POST /auth/perfil/:id/foto` referencian `empleado.foto`, columna eliminada el 12/10/2026. Riesgo error 1054. | `authController.js:100-108`, `Models/Empleado.js` |
| Docstring desalineado: `utils/helpers.js:26,37` indica prefijo `SOL`; folio real `SAL`. | `utils/helpers.js:29,37` |
| Tabla `_migraciones` solo existe en volcado `01/10`; `docs/MYSQL Database/database.sql` era texto de error, eliminado; canonico `database.utf8.sql`. | — |

---

## 2. Nueva estructura de directorios profesional

Objetivo: `server/` y `client/` en minusculas, backend en kebab-case, componentes React en PascalCase, hooks/utilidades en kebab-case. Sin carpetas en mayusculas sostenidas. Los contratos REST y el DDL no cambian.

```plaintext
precision_helpdesk/
├── server/                  # Backend Node.js / Express
│   ├── config/              # pool mysql, mailer, sockets, cache, env
│   │   ├── db.js
│   │   ├── mailer.js
│   │   ├── socket-instance.js
│   │   └── cache.js
│   ├── controllers/         # adaptadores req/res delgados
│   │   ├── auth-controller.js
│   │   ├── ticket-controller.js
│   │   ├── solicitud-controller.js
│   │   ├── categoria-controller.js
│   │   ├── manual-controller.js
│   │   └── reset-controller.js
│   ├── middlewares/         # auth, rbac, validacion, uploads, errores
│   │   ├── auth-middleware.js
│   │   ├── validate.js
│   │   ├── security.js
│   │   ├── upload-evidencias.js
│   │   ├── upload-fotos.js
│   │   ├── upload-insumos.js
│   │   ├── upload-manuales.js
│   │   ├── async-handler.js
│   │   └── error-handler.js
│   ├── routes/              # solo mapeo verbo -> middleware -> controller
│   │   ├── auth-routes.js
│   │   ├── ticket-routes.js
│   │   ├── solicitud-routes.js
│   │   ├── categoria-routes.js
│   │   └── manual-routes.js
│   ├── services/            # logica de negocio pura, sin req/res
│   │   ├── auth-service.js
│   │   ├── ticket-service.js
│   │   ├── solicitud-service.js
│   │   ├── insumo-service.js
│   │   ├── manual-service.js
│   │   └── notificacion-service.js
│   ├── models/              # queries mysql por tabla
│   │   ├── empleado.js
│   │   ├── ticket.js
│   │   ├── solicitud.js
│   │   ├── insumo.js
│   │   ├── movimiento-inventario.js
│   │   ├── manual.js
│   │   └── categoria.js
│   ├── workers/             # jobs programados (fuera del request path)
│   │   ├── scheduled-jobs.js
│   │   └── alert-state.js
│   ├── utils/               # folio, archivos, http-error, puertos
│   │   ├── folio-helper.js
│   │   ├── file-storage.js
│   │   ├── http-error.js
│   │   └── generar-portada.js
│   ├── scripts/             # herramientas one-shot, no importadas por server
│   │   ├── probar-correo.js
│   │   ├── generar-portadas-existentes.js
│   │   └── importar-empleados.mjs
│   ├── load-env.js
│   └── server.js
├── client/                  # Frontend React / Vite
│   ├── src/
│   │   ├── assets/          # css global, estaticos
│   │   ├── components/      # PascalCase, un componente por archivo
│   │   │   ├── CampanaNotificaciones.jsx
│   │   │   ├── DashboardShared.jsx
│   │   │   ├── FiltrosToolbar.jsx
│   │   │   ├── ModalReporte.jsx
│   │   │   └── Inventario/
│   │   ├── context/         # AuthContext, ThemeContext, ToastContext
│   │   ├── hooks/           # kebab-case
│   │   │   ├── use-auth.js
│   │   │   ├── use-socket.js
│   │   │   ├── use-toast.js
│   │   │   └── use-pdf-cover.js
│   │   ├── pages/           # vistas por modulo
│   │   ├── services/        # acceso http
│   │   │   └── api-client.js
│   │   └── utils/           # constantes, formateadores
│   └── index.html
├── docs/
│   ├── auditoria-y-reestructuracion.md
│   └── database.utf8.sql
├── .env.example
└── package.json
```
---

## 3. Plan de refactorizacion codigo por codigo

### 3.1 Tabla de renombrado backend (origen -> destino)

Carpetas PascalCase -> minusculas; archivos camelCase -> kebab-case. Endpoints sin cambios.

| Origen actual | Destino |
|---|---|
| `src/Backend/Config/db.js` | `server/config/db.js` |
| `src/Backend/Config/mailer.js` | `server/config/mailer.js` |
| `src/Backend/Config/cache.js` | `server/config/cache.js` |
| `src/Backend/Config/socketInstance.js` | `server/config/socket-instance.js` |
| `src/Backend/Controllers/authController.js` | `server/controllers/auth-controller.js` |
| `src/Backend/Controllers/ticketsController.js` | `server/controllers/ticket-controller.js` |
| `src/Backend/Controllers/solicitudesController.js` | `server/controllers/solicitud-controller.js` |
| `src/Backend/Controllers/categoriasController.js` | `server/controllers/categoria-controller.js` |
| `src/Backend/Controllers/resetController.js` | `server/controllers/reset-controller.js` |
| `src/Backend/Controllers/zohoController.js` | `server/controllers/zoho-controller.js` (o eliminar si Zoho OAuth no esta en uso) |
| `src/Backend/Middlewares/authMiddleware.js` | `server/middlewares/auth-middleware.js` |
| `src/Backend/Middlewares/validate.js` | `server/middlewares/validate.js` (dividir en `auth-schemas.js`, `ticket-schemas.js`, `solicitud-schemas.js`, `insumo-schemas.js`) |
| `src/Backend/Middlewares/security.js` | `server/middlewares/security.js` |
| `src/Backend/Middlewares/uploadEvidencias.js` | `server/middlewares/upload-evidencias.js` |
| `src/Backend/Middlewares/uploadFotos.js` | `server/middlewares/upload-fotos.js` |
| `src/Backend/Middlewares/uploadInsumos.js` | `server/middlewares/upload-insumos.js` |
| `src/Backend/Middlewares/uploadManuales.js` | `server/middlewares/upload-manuales.js` |
| `src/Backend/Routes/authRoutes.js` | `server/routes/auth-routes.js` |
| `src/Backend/Routes/ticketsRoutes.js` | `server/routes/ticket-routes.js` |
| `src/Backend/Routes/solicitudesRoutes.js` | `server/routes/solicitud-routes.js` |
| `src/Backend/Routes/categoriasRoutes.js` | `server/routes/categoria-routes.js` |
| `src/Backend/Routes/manualesRoutes.js` | `server/routes/manual-routes.js` + `server/controllers/manual-controller.js` + `server/services/manual-service.js` |
| `src/Backend/Models/Categoria.js` | `server/models/categoria.js` |
| `src/Backend/Models/Empleado.js` | `server/models/empleado.js` |
| `src/Backend/Models/Ticket.js` | `server/models/ticket.js` |
| `src/Backend/Models/Solicitud.js` | `server/models/solicitud.js` |
| `src/Backend/Models/Insumo.js` | `server/models/insumo.js` |
### 3.2 Tabla de renombrado frontend (origen -> destino)

Un componente por archivo PascalCase; hooks y servicios en kebab-case.

| Origen actual | Destino |
|---|---|
| `src/Frontend/Config/api.js` | `client/src/services/api-client.js` |
| `src/Frontend/Config/session.js` | `client/src/utils/session.js` |
| `src/Frontend/Config/email.js` | `client/src/utils/email.js` |
| `src/Frontend/Config/password.js` | `client/src/utils/password.js` |
| `src/Frontend/Config/salidasHistorial.js` | `client/src/utils/salidas-historial.js` |
| `src/Frontend/Config/NotificationService.js` | `client/src/utils/notification-service.js` |
| `src/Frontend/Config/ThemeContext.jsx` + `Config/themeContext.js` | `client/src/context/theme-context.jsx` (un solo archivo) |
| `src/Frontend/Components/context/ToastContext.js` | `client/src/context/toast-context.jsx` |
| `src/Frontend/Components/hooks/useToast.js` | `client/src/hooks/use-toast.js` |
| `src/Frontend/Components/hooks/usePdfCover.js` | `client/src/hooks/use-pdf-cover.js` |
| `src/Frontend/Config/useSocket.js` | `client/src/hooks/use-socket.js` |
| `src/Frontend/Config/useAutoRefresh.js` | `client/src/hooks/use-auto-refresh.js` |
| `src/Frontend/Config/useTicketNotification.js` | `client/src/hooks/use-ticket-notification.js` |
| `src/Frontend/Config/DesignSystem.js` | `client/src/utils/design-system.js` |
| `src/Frontend/Config/themeTokens.js` | `client/src/utils/theme-tokens.js` |
| `src/Frontend/Config/pdfjs.js` | `client/src/utils/pdf.js` |
| `src/Frontend/Config/printUtils.ts` | `client/src/utils/print-utils.ts` |
| `src/Frontend/Pages/login.jsx` | `client/src/pages/Login.jsx` |
| `src/Frontend/Pages/Admin/*.jsx` | `client/src/pages/admin/*.jsx` (PascalCase) |
| `src/Frontend/Pages/Usuario/*.jsx` | `client/src/pages/usuario/*.jsx` (PascalCase) |
| `src/Frontend/Components/*.jsx`, `Inventario/*.jsx` | `client/src/components/*.jsx` (PascalCase ya correcto) |
| `src/Frontend/Components/Print*.tsx`, `ModalSalidaView.tsx` | `client/src/components/print/*.tsx` |
| `src/Frontend/Styles/*` | `client/src/assets/*` |
| `run_dev.bat`, `vite_run.bat` | eliminar (usar `npm run dev:all`, `npm run dev`) |

### 3.3 Middleware centralizado de errores

Estado actual: cada handler repite `try/catch` con `console.error` directo y nunca llama `next(err)`; el middleware global de `server.js:290-300` queda inactivo.

Destino: clase tipada + wrapper async + handler global.

```js
// server/utils/http-error.js
export class HttpError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    if (details) this.details = details;
  }
}
```

```js
// server/middlewares/async-handler.js
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
```

```js
// server/middlewares/error-handler.js
export function errorHandler(err, _req, res, _next) {
  const status = err.status || err.statusCode || 500;
  const isProd = process.env.NODE_ENV === "production";
  if (status >= 500) console.error("[http]", err);
  res.status(status).json({
    error: isProd && status === 500 ? "Error interno del servidor" : (err.message || "Error interno del servidor"),
  });
}
```

```js
// server/server.js (al final, despues del 404 de /api y del static de dist)
### 3.4 Patron Controller -> Service -> Query (ejemplo cancelarTicket)

Estado actual: `Controllers/ticketsController.js:502-538` ejecuta `pool.query` directo dentro del controlador, formatea respuesta y emite sockets en el mismo bloque.

Destino: modelo solo SQL, servicio con negocio + eventos, controlador solo req/res, ruta solo mapeo.

```js
// server/models/ticket.js (solo SQL)
import pool from "../config/db.js";

export async function findFolioById(idTicket) {
  const [rows] = await pool.query(
    "SELECT folio_ticket, titulo, id_empleado FROM ticket WHERE id_ticket = ? LIMIT 1",
    [idTicket]
  );
  return rows[0] || null;
}
```

```js
// server/services/ticket-service.js (negocio, sin req/res)
import { HttpError } from "../utils/http-error.js";
import * as TicketModel from "../models/ticket.js";

export async function cancelTicket({ idTicket, actorId }, { io, cache }) {
  const result = await TicketModel.cancel(idTicket, actorId);
  if (result.error === "forbidden") throw new HttpError(403, "No puedes cancelar el ticket de otro usuario");
  if (result.error === "not_allowed") throw new HttpError(409, "Solo se pueden cancelar tickets En proceso");
  cache.del("metricas:dashboard");
  const t = await TicketModel.findFolioById(idTicket);
  if (t && io) {
    io.to(`empleado_${t.id_empleado}`).emit("ticket:actualizado", { id_ticket: idTicket, folio_ticket: t.folio_ticket, titulo: t.titulo, estatus: "Cancelado" });
    io.to("admins").emit("ticket:actualizado", { id_ticket: idTicket, folio_ticket: t.folio_ticket, titulo: t.titulo, estatus: "Cancelado", id_actor: actorId });
  }
  return { ok: true };
}
```

```js
// server/controllers/ticket-controller.js (solo req/res)
import { HttpError } from "../utils/http-error.js";
import { asyncHandler } from "../middlewares/async-handler.js";
import * as ticketService from "../services/ticket-service.js";

export const cancelarTicket = asyncHandler(async (req, res) => {
  const idTicket = Number(req.params.id_ticket);
  if (!Number.isInteger(idTicket) || idTicket < 1) throw new HttpError(400, "ID invalido");
  res.json(await ticketService.cancelTicket({ idTicket, actorId: req.usuario?.id_empleado }, req.deps));
### 3.5 Extraccion pendiente: manualesRoutes.js -> controller + service

Unico recurso con logica dentro del archivo de rutas (`manualesRoutes.js:26-181`). Migracion mecanica sin cambio de comportamiento:

1. Mover `procesarArchivo` a `server/services/manual-service.js` como `guardarManual({ file, nombre, descripcion, idCategoria })`.
2. Mover handlers `GET /`, `POST /`, `PUT /:id`, `POST /:id/reemplazar`, `DELETE /:id` a `server/controllers/manual-controller.js` con `asyncHandler`.
3. `server/routes/manual-routes.js` conserva `requireAuth`, `requireAdmin`, `uploadManual.single("archivo")` y delega al controlador.
4. Reemplazar las 5 copias de `const isProd` por `throw new HttpError(...)` al handler central.

### 3.6 Importaciones, exportaciones y variables de entorno

- Estandar ES6 `import`/`export` en `server/` y `client/src` (`package.json` declara `"type": "module"`). Sin mezcla con `require`.
- Conservar extension `.js` explicita en imports relativos Node ESM (`from "../config/db.js"`).
- Tras el renombrado actualizar en cadena: `server.js` (rutas + `config/*` + `workers/*`), cada `routes/*`, cada `controllers/*`, cada `models/*` (`../config/db.js`, `../utils/folio-helper.js`), frontend (`services/api-client.js`, `context/*`, `hooks/*`).
- `.env.example` nuevo y versionado (el `.env` real no se versiona):

```ini
PORT=3001
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173
APP_URL=http://localhost:5173
JWT_SECRET=cambiar_en_produccion
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=precision_helpdesk
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
VITE_API_URL=
```

- Eliminar fallback LAN hardcodeado en `zoho-controller.js:52`; usar `APP_URL` o fallar al arranque si OAuth esta activo.

### 3.7 Validacion de esta revision

- `node --check` backend: 48 archivos, 0 errores.
- `npm run build`: exitoso.
- Grafo de imports: 0 referencias rotas tras eliminaciones.
- `npm audit --omit=dev`: 17 vulnerabilidades (1 low, 10 moderate, 6 high); correcciones requieren cambios mayores en `exceljs`, `multer`, `nodemailer`, `pdfjs-dist`, `socket.io`.

});
```

```js
// server/routes/ticket-routes.js (solo mapeo verbo -> middleware -> controller)
import { Router } from "express";
import { requireAuth } from "../middlewares/auth-middleware.js";
import { csrfProtection } from "../middlewares/security.js";
import { cancelarTicket } from "../controllers/ticket-controller.js";

const router = Router();
router.use(csrfProtection);
router.use(requireAuth);
router.patch("/:id_ticket/cancelar", cancelarTicket);
export default router;
```

`req.deps` (`{ io, cache }`) se inyecta una vez en `server.js` para no importar singletons en servicios.

import { errorHandler } from "./middlewares/error-handler.js";
app.use(errorHandler);
```

Regla: los controladores ya no contienen `try/catch` ni `console.error`; errores esperados se lanzan como `throw new HttpError(404, "Manual no encontrado")`.

| `src/Backend/Models/Manual.js` | `server/models/manual.js` |
| `src/Backend/Models/MovimientoInventario.js` | `server/models/movimiento-inventario.js` |
| `src/Backend/utils/helpers.js` | `server/utils/folio-helper.js` (corregir docstring `SOL` -> `SAL`) |
| `src/Backend/utils/generarPortada.js` | `server/utils/generar-portada.js` |
| `src/Backend/Workers/scheduledJobs.js` | `server/workers/scheduled-jobs.js` |
| `src/Backend/Workers/alertState.js` | `server/workers/alert-state.js` |
| `src/Backend/Workers/*.json` | mover a volumen persistente fuera del codigo versionado |
| `src/Backend/scripts/*` | `server/scripts/` (CSVs a `server/scripts/fixtures/`) |
| `src/Backend/server.js`, `src/Backend/load-env.js` | `server/server.js`, `server/load-env.js` |

