# Despliegue y mantenimiento

## Requisitos del servidor

| Componente | Requisito |
| --- | --- |
| Node.js | 24.x (desarrollo probado en 24.15.0); el proyecto es ESM (`"type": "module"`) |
| MySQL | 8.0 (servidor verificado: 8.0.46), motor InnoDB, utf8mb4 |
| npm | version incluida con Node; `npm install` resuelve todas las dependencias |
| Sistema operativo | Windows en el entorno actual (scripts `.ps1` y `.bat`); el backend no usa APIs especificas de Windows y puede correr en Linux |
| Puertos | 3001 backend (`PORT`), 5173 Vite en desarrollo (`VITE_PORT`) |
| Disco | Escritura en `storage/` (manuales, fotos, evidencias) y `backups/`; volumen creciente segun PDFs y videos de evidencia |
| Conexiones | Pool mysql2: `connectionLimit` 100, `queueLimit` 500, `connectTimeout` 30 s, timezone `-06:00`; HTTP: `maxConnections` 2000, `keepAliveTimeout` 65 s, `requestTimeout` 120 s |
| Proxy | Detras de Nginx/Apache se debe activar `NODE_ENV=production` para que Express aplique `trust proxy = 1` (IP real en rate limits) |

El proceso verifica al arrancar las variables criticas y termina con codigo 1 si faltan; igualmente verifica la conexion a MySQL antes de aceptar peticiones (`Config/db.js`).

## Variables de entorno (.env)

Archivo de referencia: `server/.env.example` (variables del servidor) y `client/.env.example` (variables Vite). El backend carga el `.env` con `server/load-env.js` (`node --import ...`), por lo que el archivo funciona desde cualquier directorio de trabajo.

| Variable | Obligatoria | Descripcion |
| --- | --- | --- |
| PORT | no | Puerto del backend (default 3001) |
| NODE_ENV | no | `production` activa trust proxy, sirve `dist/` y oculta detalles de errores |
| DB_HOST, DB_USER, DB_PASSWORD, DB_NAME | si | Conexion MySQL a `precision_helpdesk` |
| DB_PORT | no | Puerto de MySQL (default del driver) |
| DB_SSL | no | `true` activa SSL con verificacion de certificado cuando DB_HOST no es localhost |
| JWT_SECRET | si | Secreto de firma; generar con `node -e "require('crypto').randomBytes(64).toString('hex')"` |
| SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM | no | Nodemailer generico (Zoho, Gmail u Outlook); sin configurar, el sistema arranca sin correos |
| CORS_ORIGIN | no | Unico origen permitido (default `http://localhost:5173`) |
| APP_URL | no | URL publica; alimenta la CSP y los mensajes de arranque |
| VITE_API_URL | no | En produccion vacio si frontend y backend comparten origen |
| VITE_PORT, VITE_BACKEND_URL | no | Desarrollo: puerto de Vite y destino del proxy |
| ZOHO_CLIENT_ID, ZOHO_CLIENT_SECRET, ZOHO_ACCOUNTS_URL, ZOHO_REDIRECT_URI, ZOHO_SCOPES | no | Login SSO con Zoho (OIDC) |

`.env` nunca se sube al repositorio (`.gitignore`).

## Arranque y build

| Comando | Uso |
| --- | --- |
| `npm install` | Dependencias |
| `npm run dev` | Solo Vite (frontend, puerto 5173) |
| `npm run server` | Backend en modo produccion con `.env` |
| `npm run all` | Backend y frontend juntos (concurrently); libera puertos con `preall` |
| `npm run build` | Build de produccion en `dist/` |
| `npm run preview` | Preview del build |
| `npm run probar:correo` | Prueba de la configuracion SMTP |
| `npm run respaldar` | Copia de seguridad (ver abajo) |

Despliegue tipico en un solo equipo: `npm run build` una vez y despues `npm run server`; Express sirve `dist/` y resuelve cualquier ruta no-API con `index.html` (SPA). Healthchecks: `GET /api/ping` (publico) y `GET /api/health` (con token, expone pool, memoria y uptime). Existe ademas `railway.json` (Nixpacks: `npm install && npm run build`, arranque `node --import ./server/load-env.js server/server.js`, healthcheck `/api/ping`) por si se usa esa plataforma.

Tras un reinicio del proceso: las alertas de Socket.io deduplicadas se reconstruyen desde `Workers/alertState.js`; no hay estado en memoria que deba persistirse manualmente.

## Respaldos

El proyecto incluye `respaldar.ps1` (copia) y `restaurar.ps1` (recuperacion). La politica: guardar el volcado de MySQL mas la carpeta `storage/`, sin tocar la base en produccion.

### Copia: respaldar.ps1

```powershell
powershell -ExecutionPolicy Bypass -File respaldar.ps1
powershell -ExecutionPolicy Bypass -File respaldar.ps1 -Conservar 30
```

Parametros: `-Destino` (carpeta destino, default `backups/` junto al script) y `-Conservar` (copias antiguas a conservar, default 14).

Procedimiento:

1. Lee `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD` y `DB_NAME` del `.env`.
2. Ejecuta `mysqldump` con credenciales en un archivo de configuracion temporal (no aparecen en la linea de comandos ni en el listado de procesos): `--single-transaction --quick --routines --triggers --events --set-gtid-purged=OFF --default-character-set=utf8mb4 --result-file=base_datos.sql <DB_NAME>`.
3. Verifica el volcado: existe, pesa al menos 1 KB y contiene sentencias `CREATE TABLE`; cualquier fallo detiene el script.
4. Copia recursivamente `storage/` a la misma carpeta de respaldo.
5. Escribe `LEEME.txt` con la fecha y el comando de restauracion.
6. Borra las copias `respaldo_*` que excedan el numero indicado en `-Conservar`.

El script solo lee de la base; es seguro ejecutarlo con el sistema en marcha (el volcado usa `--single-transaction`, sin bloqueos de escritura en InnoDB).

### Programacion

Recomendacion del propio script: diario a las 23:00 con el Programador de tareas de Windows:

```powershell
schtasks /Create /TN "HelpDesk-Respaldo" /SC DAILY /ST 23:00 /TR "powershell -NoProfile -ExecutionPolicy Bypass -File \"D:\Proyecto de Residencias-Matthew Garay\PrecisionTrucks_HelpDesk\respaldar.ps1\""
```

Verificacion periodica: revisar que la carpeta del dia tenga `base_datos.sql` con tamano creciente y `storage/` completo.

### Restauracion

```powershell
# Segura: crea precision_helpdesk_restaurada sin tocar la base actual
powershell -ExecutionPolicy Bypass -File restaurar.ps1 -Copia backups\respaldo_20261012_2300

# Reemplazo: pide confirmacion escribiendo SI
powershell -ExecutionPolicy Bypass -File restaurar.ps1 -Copia backups\respaldo_20261012_2300 -Reemplazar
```

`restaurar.ps1` valida el volcado antes de importar y por omision restaura en una base aparte (`<nombre>_restaurada`) para comparar sin arriesgar datos.

### Volcado manual equivalente

```powershell
mysqldump --single-transaction --quick --routines --triggers --events `
  --set-gtid-purged=OFF --default-character-set=utf8mb4 `
  --result-file=base_datos.sql precision_helpdesk
```

El usuario de MySQL del `.env` necesita los privilegios `SELECT, LOCK TABLES, TRIGGER, SHOW VIEW, EVENT` ademas de lectura de las tablas.

## Mantenimiento de base de datos

- Los indices relevantes ya existen (ver [database.md](database.md)); antes de agregar indices nuevos medir con `EXPLAIN` sobre las consultas de listados paginados.
- Los enums se amplian con `ALTER TABLE ... MODIFY COLUMN` cuidando conservar el default y la collacion de la tabla.
- El esquema vivo debe regenerarse tras cada cambio: `node database/dump-schema.mjs > database/schema-dump.txt`.
- `historial_acceso` y `movimiento_inventario` crecen con el uso; ambos admiten poda por fecha una vez exportados los periodos exigidos por auditoria.

## Monitoreo operativo

- Logs: el servidor imprime en consola el estado de Backend, Frontend, DB, Socket, Workers, SMTP y JWT al arrancar, y registra `uncaughtException`/`unhandledRejection` sin tumbar el proceso.
- Apagado ordenado: `SIGTERM`/`SIGINT` cierran el servidor HTTP y el pool con un tope de 10 segundos.
- `GET /api/health` devuelve uso de memoria, uptime y estado del pool (total/libres/en cola) para vigilancia externa.
