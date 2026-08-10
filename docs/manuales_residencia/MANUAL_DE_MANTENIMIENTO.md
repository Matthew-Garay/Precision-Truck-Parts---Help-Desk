# Manual de mantenimiento — HelpDesk PrecisionTrucks

**Para quién es:** desarrollador o persona de soporte encargada del mantenimiento del sistema.
**Última actualización:** Septiembre 2026 · **Versión del manual:** 1.1

---

## 1. De qué va este manual

Este manual reúne todo lo necesario para mantener el HelpDesk de PrecisionTrucks operando: cómo está armado, cómo se levanta, qué rutinas de mantenimiento hay que cumplir, cómo se respalda y restaura, cómo se actualiza y qué hacer cuando algo falla. Está pensado para que cualquiera que llegue al proyecto pueda hacerse cargo sin depender de "quien lo hizo".

El sistema, resumido en una frase: una sola aplicación Node.js (Express) que sirve tanto el frontend (React) como las APIs, con MySQL como base de datos y una carpeta en disco (`storage/`) para los archivos que suben los usuarios.

Si eres usuario final del sistema, este manual no es para ti: el manual de uso está en la misma carpeta (`MANUAL_DE_USO.md`).

---

## 2. Arquitectura del sistema

### 2.1 Diagrama de flujo

```
Navegador del usuario
      |
      v
Cloudflare Tunnel (HTTPS/SSL)  ← en producción
      |
      v
Servidor Node.js + Express (puerto 3001)
      |
      |---> Frontend compilado (carpeta dist/)
      |---> APIs REST (/api/*)
      |---> MySQL 8  (base de datos precision_helpdesk)
      |---> Socket.IO  (notificaciones en tiempo real)
      |---> Workers  (tareas automáticas en segundo plano)
      +---> storage/  (evidencias, manuales, fotos, portadas)
```

### 2.2 Componentes

| Componente | Tecnología | Puerto | Ubicación en el código |
| --- | --- | --- | --- |
| Backend (API + servidor HTTP) | Node.js + Express 5 | 3001 | `src/Backend/server.js` |
| Frontend | React 18 + Vite 6 + Tailwind 4 | 5173 (dev) / servido por Express (prod) | `src/Frontend/` |
| Base de datos | MySQL 8 | 3306 | base `precision_helpdesk` |
| Notificaciones en tiempo real | Socket.IO | dentro del puerto 3001 | `src/Backend/Config/socketInstance.js` |
| Tareas programadas | Workers (setInterval) | — | `src/Backend/Workers/scheduledJobs.js` |
| Archivos de usuario | Sistema de archivos | — | `storage/` |
| Correos | Nodemailer (SMTP) | 587 | `src/Backend/Config/mailer.js` |

### 2.3 Características de operación

| Aspecto | Detalle |
| --- | --- |
| Modo desarrollo | Frontend (Vite :5173) y backend (:3001) corren por separado; Vite hace proxy hacia el backend |
| Modo producción | Express sirve el build (`dist/`) y las APIs en un solo proceso |
| Sesiones | JWT con vigencia de 12 horas |
| Contraseñas | Hash con bcrypt (12 rounds) |
| Tope de cuerpo de petición | 2 MB (configurado en `express.json`) |
| Límite de conexiones del servidor | 2000 (keepAliveTimeout 65 s) |

---

## 3. Requisitos y herramientas

| Herramienta | Versión | Función |
| --- | --- | --- |
| Node.js | 18 o superior | Ejecutar backend y build del frontend |
| npm | 9 o superior | Gestión de dependencias |
| MySQL | 8 o superior | Base de datos |
| Git | 2 o superior | Control de versiones |
| PM2 (servidor) | reciente | Mantener el proceso activo y los logs |
| MySQL Workbench (opcional) | — | Inspeccionar/administrar la base |
| Postman o curl (opcional) | — | Probar la API |

---

## 4. Variables de entorno (.env)

La configuración vive en el archivo `.env` (raíz del proyecto). El modelo está en `.env.example`. **El `.env` jamás se sube al repositorio** (está en `.gitignore`).

El servidor valida al arrancar que existan estas variables y **si falta alguna, el proceso termina con error y no arranca**:

| Variable | Requerida | Qué define |
| --- | --- | --- |
| `PORT` | No (default 3001) | Puerto HTTP del servidor |
| `NODE_ENV` | No (default development) | `development` o `production`; en producción Express sirve el frontend |
| `DB_HOST` / `DB_PORT` | Sí | Host y puerto de MySQL |
| `DB_USER` / `DB_PASSWORD` | Sí | Credenciales de la base |
| `DB_NAME` | Sí | Nombre de la base (`precision_helpdesk`) |
| `DB_SSL` | No (default false) | `true` solo si el proveedor de MySQL lo exige |
| `JWT_SECRET` | Sí | Secreto para firmar los tokens de sesión (64 bytes o más) |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` | No | Cuenta de correo para recuperación de contraseñas. Sin esto, los correos quedan desactivados (lo avisa en el arranque) |
| `SMTP_FROM` | No | Remitente visible de los correos |
| `CORS_ORIGIN` | No (default http://localhost:5173) | Origen permitido por CORS |
| `APP_URL` | No | URL pública del sistema (se muestra al arrancar) |
| `VITE_PORT` / `VITE_BACKEND_URL` | No | Puerto y backend para el proxy de Vite en desarrollo |
| `VITE_API_URL` | No | URL explícita del backend; vacío en desarrollo para usar el proxy (evita CORS) |

### Generar un JWT_SECRET nuevo

Para rotar el secreto (por ejemplo en el mantenimiento anual):

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Pegar la salida en `JWT_SECRET` y reiniciar. **Ojo:** esto invalida todas las sesiones activas.

---

## 5. Estructura de carpetas del proyecto

```
PrecisionTrucks_HelpDesk/
├── .env / .env.example        ← Configuración (el real no se versiona)
├── package.json               ← Dependencias y scripts
├── vite.config.js             ← Configuración de Vite
├── index.html                 ← Punto de entrada del frontend
├── dist/                      ← Build de producción (generada, no se edita)
├── storage/                   ← Archivos de usuario (evidencias, manuales, fotos)
├── public/                    ← Archivos estáticos que Vite copia tal cual
├── src/
│   ├── main.jsx               ← Entrada de React (rutas y proveedores)
│   ├── Frontend/
│   │   ├── Pages/             ← Pantallas (Admin/ y Usuario/ por separado)
│   │   ├── Components/        ← Componentes reutilizables
│   │   ├── Config/            ← api.js, session, socket, temas
│   │   └── Styles/            ← CSS del sistema de diseño
│   └── Backend/
│       ├── server.js          ← Punto de entrada del servidor
│       ├── Config/            ← db.js, mailer.js, socketInstance.js, cache.js
│       ├── Middlewares/       ← auth, seguridad, validación, subidas
│       ├── Routes/            ← Definición de rutas por módulo
│       ├── Controllers/       ← Lógica de negocio por módulo
│       ├── Models/            ← Consultas SQL por entidad
│       ├── Workers/           ← Tareas automáticas (scheduledJobs.js)
│       └── scripts/           ← migrate.js, generarPortadasExistentes.js
```

### Scripts disponibles (package.json)

| Script | Comando | Para qué sirve |
| --- | --- | --- |
| `dev` | `npm run dev` | Solo frontend de Vite |
| `server` | `npm run server` | Servidor en modo producción (sirve dist/) |
| `dev:all` | `npm run dev:all` | Backend + frontend juntos para desarrollo |
| `build` | `npm run build` | Compilar el frontend a `dist/` |
| `preview` | `npm run preview` | Previsualizar el build |

---

## 6. Base de datos

### 6.1 Conexión y tablas

La conexión se hace con un **pool de conexiones** (`mysql2/promise`) configurado en `src/Backend/Config/db.js`, usando las variables `DB_*` del `.env`. El script completo de creación está en `docs/database.sql`.

Tablas y su función:

| Tabla | Contiene |
| --- | --- |
| `empleado` | Usuarios del sistema (con su rol y datos) |
| `categoria` | Categorías de incidencias |
| `ticket` | Reportes de soporte (estado, prioridad, técnico, fechas) |
| `ticket_comentario` | Comentarios de cada ticket |
| `insumo` | Inventario de materiales y su stock |
| `solicitud_insumo` | Solicitudes de material y estado de aprobación |
| `manual` | Catálogo de manuales PDF (ruta, categoría, versión) |
| `historial_acceso` | Registro de entradas y salidas de sesión |
| `_migraciones` | Control interno de migraciones aplicadas |

Las más grandes (y las que conviene optimizar periódicamente) son `ticket` y `solicitud_insumo`.

### 6.2 Migraciones

Los cambios de esquema de base de datos se aplican con un script de migraciones que es **idempotente** (se puede correr varias veces sin romper nada). Cada migración queda registrada en la tabla `_migraciones`.

```bash
node --import ./src/Backend/load-env.js src/Backend/scripts/migrate.js
```

**Regla de oro:** después de `git pull`, corre siempre las migraciones *antes* de reiniciar el servidor. Es el error más común cuando "la app se rompió tras actualizar".

### 6.3 Comandos útiles de MySQL

```bash
# Entrar a la consola
mysql -u root -p precision_helpdesk

# Ver las tablas y su tamaño
SHOW TABLES;
SELECT table_name, table_rows FROM information_schema.tables WHERE table_schema='precision_helpdesk';

# Optimizar tablas grandes (reduce fragmentación)
OPTIMIZE TABLE ticket;
OPTIMIZE TABLE solicitud_insumo;
```

---

## 7. Carpeta storage (archivos de usuario)

Todos los archivos que suben los usuarios viven aquí. Se sirven de forma estática desde Express con ruta protegida (las fotos de perfil requieren sesión válida). **Siempre respáldala junto con la base.**

| Subcarpeta | Qué guarda | Regla |
| --- | --- | --- |
| `Evidencias_Tickets/` | Fotos y videos adjuntos a los tickets | No borrar sin respaldo previo; la subcarpeta `_tmp_upload/` sí es temporal y se puede limpiar |
| `Manuales/` | PDFs de la biblioteca de manuales | Se referencian desde la tabla `manual`; borrar un archivo rompe el manual |
| `Fotos de Perfil/` | Imágenes de avatar de usuarios | Solo accesibles con JWT válido |
| `Insumos/` | Fotos de los insumos del inventario | Referenciadas desde `insumo.imagen_url` |
| `Portadas/` | Miniatura/portada generada de cada PDF de manuales | Se regeneran con el script `generarPortadasExistentes.js` |

Si un manual no se ve en el visor, el primer paso es regenerar estas portadas:

```bash
node --import ./src/Backend/load-env.js src/Backend/scripts/generarPortadasExistentes.js
```

---

## 8. Levantar el sistema

### 8.1 En desarrollo (tu máquina)

```bash
npm install
npm run dev:all
```

`dev:all` ejecuta backend (puerto 3001) y frontend de Vite (puerto 5173) a la vez. Entra a `http://localhost:5173`. Si solo necesitas el frontend, usa `npm run dev`.

Antes del primer arranque: copia `.env.example` como `.env` y llena las variables de la sección 4, al menos las de MySQL y `JWT_SECRET`.

### 8.2 En producción (servidor con PM2)

Primera vez:

```bash
npm install
npm run build
pm2 start "npm run server" --name helpdesk
```

Actualizaciones (rutina completa en la sección 11):

```bash
pm2 restart helpdesk
```

### 8.3 PM2, el administrador de procesos

PM2 mantiene el proceso vivo, lo reinicia si se cae y guarda los logs. Comandos básicos:

| Comando | Qué hace |
| --- | --- |
| `pm2 status` | Estado de los procesos ("online" / "errored") |
| `pm2 logs helpdesk` | Logs en tiempo real |
| `pm2 logs helpdesk --err --lines 50` | Últimos 50 errores |
| `pm2 restart helpdesk` | Reiniciar el servidor |
| `pm2 stop helpdesk` / `pm2 start helpdesk` | Detener / iniciar |
| `pm2 save` | Guardar la lista de procesos (para que sobreviva a reinicios del servidor) |
| `pm2 startup` | Generar el script de arranque automático con el sistema |

### 8.4 Verificación de arranque

Cuando el servidor levanta, imprime una línea por componente con su estado (✅/❌): backend, frontend, base de datos, Socket.IO, workers, SMTP y JWT. Es la forma más rápida de confirmar que todo quedó bien antes de avisarle a nadie.

---

## 9. Rutinas de mantenimiento

Estas tareas son la diferencia entre un sistema estable y uno que falla seguido. Programa recordatorios (por ejemplo en el calendario de la oficina) y llévalas a rajatabla:

| Frecuencia | Tarea | Comando / Procedimiento | Por qué importa |
| --- | --- | --- | --- |
| **Diario** | Respaldo de base de datos | `mysqldump -u root -p precision_helpdesk > backup_YYYY-MM-DD.sql` | Sin esto se pierde todo el historial si el disco falla |
| **Diario** | Revisar errores | `pm2 logs helpdesk --err --lines 50` | Detectar problemas antes de que el usuario los reporte |
| **Semanal** | Respaldo de `storage/` | Copiar la carpeta a USB/nube | Respalda evidencias, PDFs y fotos |
| **Semanal** | Verificar espacio en disco | Windows: `Get-PSDrive C` · Linux: `df -h` | Un disco lleno tira el sistema entero |
| **Mensual** | Optimizar tablas grandes | `OPTIMIZE TABLE ticket; OPTIMIZE TABLE solicitud_insumo;` | Evita la lentitud por fragmentación |
| **Mensual** | Limpiar temporales | Borrar contenido de `storage/Evidencias_Tickets/_tmp_upload/` | Es basura de subidas a medio hacer |
| **Mensual** | Probar el respaldo | Restaurarlo en una base local de prueba | **Un respaldo sin probar no es respaldo** |
| **Anual** | Rotar `JWT_SECRET` | Generar secreto nuevo (sección 4) y reiniciar | Higiene de seguridad de sesiones |

### Detalle de la prueba mensual del respaldo

1. Crear una base vacía: `CREATE DATABASE prueba_restauracion;`
2. Restaurar: `mysql -u root -p prueba_restauracion < backup_YYYY-MM-DD.sql`
3. Confirmar que hay datos: `USE prueba_restauracion; SELECT COUNT(*) FROM ticket;`
4. Borrar la base de prueba.

Si el paso 2 falla, ese respaldo sirve para nada: vuelve a generarlo ese mismo día.

---

## 10. Respaldos y restauración

### 10.1 Qué se respalda y con qué frecuencia

| Elemento | Herramienta | Frecuencia | Retención | Dónde guardarlo |
| --- | --- | --- | --- | --- |
| Base de datos | `mysqldump` | Diaria | 7 días | Disco externo / carpeta de backups |
| Carpeta `storage/` | Copia de archivos | Semanal | 4 semanas | USB o nube |
| Código fuente | Git | Continua | Historial completo | GitHub |

### 10.2 Respaldo de la base

```bash
mysqldump -u root -p precision_helpdesk > backup_2026-09-08.sql
```

Recomendaciones:

- Usa el nombre con la fecha (`backup_YYYY-MM-DD.sql`) para ordenar por día y saber cuál es el más reciente.
- Si la base es grande, comprime el archivo: `mysqldump ... | gzip > backup_2026-09-08.sql.gz` (requiere `gzip`, o en Windows comprímelo con WinRAR/7-Zip).
- Borra los respaldos más viejos que la retención (7 días) para no llenar el disco.

### 10.3 Restauración de la base

La restauración funciona al revés del respaldo:

```bash
mysql -u root -p precision_helpdesk < backup_2026-09-08.sql
```

Pasos seguros:

1. Respaldar la base *actual* (por si quieres regresar).
2. Ejecutar la restauración.
3. Verificar datos: `SELECT COUNT(*) FROM ticket;`
4. Reiniciar el servidor: `pm2 restart helpdesk` (la app toma los datos de la base).

### 10.4 Respaldo y restauración de storage

Se copia la carpeta completa. En Windows:

```powershell
Copy-Item storage -Destination "D:\Respaldo\storage_2026-09-08" -Recurse
```

Para restaurar, se devuelve la carpeta a su lugar original (mismo nombre y permisos). No restaures `storage` con la versión equivocada: los PDFs y fotos están referenciados por ruta/nombre desde la base de datos, así que base y storage deben ser de la misma fecha para que cuadren.

---

## 11. Actualización y despliegue

Procedimiento estándar para subir una versión nueva del repositorio (el orden importa):

```bash
git pull origin main                                                    # 1. Bajar los cambios
npm install                                                             # 2. Dependencias nuevas
node --import ./src/Backend/load-env.js src/Backend/scripts/migrate.js  # 3. Migraciones de BD (obligatorio)
npm run build                                                           # 4. Compilar el frontend
pm2 restart helpdesk                                                    # 5. Reiniciar el servidor
```

| Paso | Qué pasa si lo saltas |
| --- | --- |
| Migraciones | La app falla al buscar columnas/tablas nuevas. Es el fallo más común |
| Build | Los usuarios siguen viendo la versión anterior |
| Restart | El proceso viejo sigue en memoria con el código anterior |

Verificación post-despliegue:

1. `curl http://localhost:3001/api/ping` responde.
2. Abrir la aplicación y entrar con una cuenta.
3. Probar una acción que use lo actualizado (un ticket nuevo, subir un manual, etc.).
4. Revisar `pm2 logs helpdesk --err` en busca de errores nuevos.

---

## 12. Monitoreo

### 12.1 Endpoints de salud

| Endpoint | Requiere sesión | Devuelve |
| --- | --- | --- |
| `GET /api/ping` | No | Confirma que el servidor responde (usado por la app para validar arranque) |
| `GET /api/health` | Sí (JWT) | Status general, uptime, memoria usada y estado del pool de MySQL |

Probar desde la terminal:

```bash
curl http://localhost:3001/api/ping
curl -H "Authorization: Bearer TU_TOKEN" http://localhost:3001/api/health
```

### 12.2 Qué revisar de forma preventiva

| Señal | Dónde se ve | Cuándo preocuparse |
| --- | --- | --- |
| Errores en consola | `pm2 logs helpdesk --err` | Errores repetidos de una misma ruta |
| Memoria del proceso | `PM2: pm2 monit` | Crecimiento sostenido sin bajar |
| Conexiones a MySQL | `/api/health` (campo `connections`) | Cola de espera constante (queue > 0) |
| Espacio en disco | `Get-PSDrive C` / `df -h` | Menos del 20% libre |
| Túnel activo (producción) | `Get-Service cloudflared` | Servicio detenido = sitio inaccesible |

### 12.3 Logs

PM2 guarda los logs del proceso. Lo normal es encontrarse warnings de cosas puntuales; lo que debe llamar la atención es un error repetido o un `uncaughtException`.

```bash
pm2 logs helpdesk                    # seguimiento en vivo
pm2 logs helpdesk --err --lines 100  # últimos 100 errores
```

---

## 13. Fallas comunes y cómo resolverlas

| Síntoma | Causa probable | Diagnóstico | Solución |
| --- | --- | --- | --- |
| No carga la página | Servidor caído o reiniciándose | `pm2 status` | `pm2 restart helpdesk` |
| Error 502 Bad Gateway | Node dejó de responder | `pm2 status` muestra "errored" | `pm2 restart helpdesk`; revisar logs |
| Error de conexión a BD | MySQL detenido o `.env` mal | `services.msc` (MySQL) / revisar `DB_*` | Iniciar MySQL o corregir `.env`, reiniciar |
| No llegan correos de recuperación | SMTP mal configurado o Gmail sin contraseña de aplicación | Revisar `SMTP_*` en `.env` | Actualizar credenciales (Gmail: contraseña de aplicación) |
| PDF no se abre / sin portada | Portadas faltantes, caché o CORS | Probar regenerar portadas | `node --import ./src/Backend/load-env.js src/Backend/scripts/generarPortadasExistentes.js` y limpiar caché |
| Sistema muy lento | BD fragmentada o disco casi lleno | `OPTIMIZE TABLE`; revisar disco | Optimizar tablas, liberar espacio, reiniciar |
| No llegan notificaciones | Workers detenidos o conexión Socket.IO caída | Los workers arrancan con el servidor | `pm2 restart helpdesk` |
| Los cambios nuevos no se ven | Build desactualizado | Comparar versión en `dist/` | `npm run build && pm2 restart helpdesk` |
| Detalle de ticket no carga el PDF/evidencia | Archivo movido o borrado en `storage/` | Revisar si existe el archivo | Restaurar el archivo desde el respaldo semanal |
| Alguien no puede entrar | Cuenta desactivada o sesión expirada (12 h) | Revisar en Personal > desactivados | Reactivar cuenta o resetear contraseña |
| App responde 404 en `/api/*` | Ruta no registrada en `server.js` | Revisar las rutas montadas | Verificar que la ruta está importada en `server.js` |

### Flujo general ante cualquier falla

```
1. ¿Está vivo el proceso?     → pm2 status / pm2 restart helpdesk
2. ¿Responde el servidor?     → curl /api/ping
3. ¿Está prendida la BD?      → health / servicios de Windows
4. ¿Qué dicen los logs?       → pm2 logs --err
5. ¿Cambió algo recientemente?→ git log / despliegue anterior
```

Nueve de cada diez veces el problema se resuelve entre los pasos 1 y 2.

---

## 14. Tareas automáticas (workers)

Los workers son jobs en segundo plano que el servidor inicia junto con él (`src/Backend/Workers/scheduledJobs.js`). No son procesos aparte: cuando reinicias el servidor, se reinician todos.

| Worker | Frecuencia | Qué hace |
| --- | --- | --- |
| Alertas SLA | Cada 30 min | Avisa a los administradores cuando un ticket está a punto de vencer (~46.5 horas de los 48 máximos) |
| Cierre de tickets vencidos | Cada hora | Cambia a "No Resuelto" los tickets que pasaron las 48 horas sin resolverse |
| Limpieza de sesiones huérfanas | Cada hora | Cierra en `historial_acceso` las sesiones sin logout registrado y con más de 12 horas |
| Stock crítico | Cada hora | Alerta por insumos con stock ≤ 5 y envía la alerta a los administradores |
| Tickets sin atender | Cada hora | Alerta cuando un ticket lleva más de 24 horas sin técnico asignado |

Si un técnico te dice "no llegó la alerta", la solución casi siempre es reiniciar: `pm2 restart helpdesk`.

**Nota:** como los workers corren dentro del proceso Node, si el servidor se queda dormido (suspensión del equipo) las horas se corren y al despertar se ejecutan tareas atrasadas. En un servidor dedicado eso no pasa.

---

## 15. Seguridad

| Medida | Estado | Detalle |
| --- | --- | --- |
| Sesiones JWT | Activo | Vigencia de 12 horas; al cerrar sesión el token se revoca |
| Contraseñas | Activo | Hash con bcrypt (12 rounds), nunca en texto plano |
| CORS restrictivo | Activo | Solo el origen definido en `CORS_ORIGIN` |
| Rate limiting | Activo | Límite de peticiones para evitar fuerza bruta |
| Headers de seguridad | Activo | Helmet (Content-Security-Policy, etc.) |
| Protección CSRF | Activo | Peticiones de mutación requieren header `x-requested-with` |
| Validación de datos | Activo | Zod en las entradas |
| Validación de archivos subidos | Activo | Tipo y tamaño controlados en los middlewares de subida |
| Protección path traversal | Activo | `safeResolvePath` evita rutas fuera de `storage/` |
| Protección de fotos de perfil | Activo | Requieren JWT válido para descargarse |

### Prácticas de seguridad para el mantenedor

- Nunca subir `.env` al repositorio ni compartirlo (ni en conversaciones).
- No exponer MySQL a internet: debe escuchar solo en localhost o red interna.
- Si se filtra una credencial, rotarla de inmediato (ver sección 4).
- Mantener las dependencias actualizadas: `npm outdated` para revisar, y evaluar `npm audit`.
- Cambiar `JWT_SECRET` fuera de horario laboral por el tema de sesiones activas.

---

## 16. Imágenes sugeridas (dónde irían)

Este manual queda más claro con capturas de los procesos reales. Estas son las que conviene tomar (en Windows con `Win+Shift+S`):

| # | Imagen | Sección donde va |
| --- | --- | --- |
| 1 | Diagrama de arquitectura (draw.io) | 2.1 |
| 2 | Terminal con `npm run dev:all` (backend y frontend activos) | 8.1 |
| 3 | `pm2 status` mostrando "online" | 8.3 |
| 4 | `pm2 logs` con errores de ejemplo | 12.3 |
| 5 | MySQL Workbench con las tablas abiertas | 6.1 |
| 6 | Pantalla de arranque del servidor con los ✅ de cada componente | 8.4 |
| 7 | Carpeta de respaldos ordenada por fecha | 10 |
| 8 | Respuesta de `curl /api/ping` en la terminal | 12.1 |

Guárdalas en `docs/manuales_residencia/imagenes/` en PNG, con ancho de ~1280 px y menos de 500 KB cada una (para no inflar el repositorio). Se insertan con la sintaxis de Markdown:

```markdown
![pm2 status](imagenes/mantenimiento_03_pm2status.png)
```

---

**Fin del manual.** Para profundizar en esquemas de tablas revisa `docs/tecnica/DiccionarioDatos.md`; para el procedimiento de despliegue completo, `docs/operacion/DESPLIEGUE.md`. El manual de uso del sistema está en esta misma carpeta: `MANUAL_DE_USO.md`.