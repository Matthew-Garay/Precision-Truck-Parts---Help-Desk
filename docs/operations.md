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
| `npm run produccion` | **Uso diario.** Compila el frontend y arranca Express en modo producción en el puerto 5173 (misma URL de siempre): sirve la app optimizada y la API en un solo proceso |
| `npm run iniciar` | Igual que `produccion` pero sin volver a compilar (si `dist/` ya está al día) |
| `npm run all` | Solo para programar: Vite en modo desarrollo (5173) + backend (3001) |
| `npm run build` | Build de produccion en `dist/` |
| `npm run preview` | Preview del build |
| `npm run probar:correo` | Prueba de la configuracion SMTP |
| `npm run respaldar` | Copia de seguridad (ver abajo) |

Despliegue tipico en un solo equipo: `npm run build` una vez y despues `npm run server`; Express sirve `dist/` y resuelve cualquier ruta no-API con `index.html` (SPA). Healthchecks: `GET /api/ping` (publico) y `GET /api/health` (con token, expone pool, memoria y uptime). Existe ademas `railway.json` (Nixpacks: `npm install && npm run build`, arranque `node --import ./server/load-env.js server/server.js`, healthcheck `/api/ping`) por si se usa esa plataforma.

Tras un reinicio del proceso: las alertas de Socket.io deduplicadas se reconstruyen desde `Workers/alertState.js`; no hay estado en memoria que deba persistirse manualmente.

## Rendimiento

Medido el 19/11/2026 en el servidor de la oficina (prueba solo lectura con `server/scripts/prueba-carga.js`):

| | Modo desarrollo (`npm run all`) | Modo producción (`npm run produccion`) |
|---|---|---|
| Primera carga de la app | 119 archivos, 11.4 MB | 6 archivos, 0.13 MB comprimidos |
| Visitas siguientes | se vuelve a pedir todo | solo `index.html` (1.6 KB); lo demás queda en caché del navegador |
| API, 20 usuarios sin pausa | — | 636 pet./s, mediana 25 ms, p95 81 ms, 0 errores |
| API, 200 usuarios sin pausa | — | ≈730 pet./s, mediana 219 ms, 0 errores |

Cada ruta de la API responde sola en 2–9 ms. Un usuario real hace una petición cada varios segundos, así que
la capacidad sobra para los ~100 empleados. Repetir la medición con el sistema encendido:
`node --import ./server/load-env.js server/scripts/prueba-carga.js http://127.0.0.1:5173 50 15`.

Imágenes (19/11/2026, `server/scripts/optimizar-imagenes.js`; originales en `Backups/imagenes_originales_20261119_0946`):

| | Antes | Después |
|---|---|---|
| Fondo del login | 5,233 KB (4268 px) | 328 KB (2560 px, WebP 92) |
| Fotos de insumos (124) | 11.8 MB | 5.9 MB; lado mayor ≤ 1200 px, calidad 90, PNG sin pérdida |
| Fotos que se descargan en el inventario | 11.8 MB (fotos completas a 22 px) | 0.21 MB (miniaturas `storage/Insumos/min/*.webp`, 128 px) |
| Icono de la pestaña / logo | 264 KB / 187 KB | 12 KB / 25 KB |

Calidad: PSNR mediano 44 dB y comparación visual al 100 % sin diferencias. Solo se reemplaza un archivo si
ahorra ≥ 20 %. Las fotos nuevas se comprimen y generan su miniatura al subirlas (`upload-insumos.js`).
Las pantallas consultan cada 2 min (manuales 5 min) y se recargan al momento con cada aviso en vivo.

Qué lo hace rápido: pantallas cargadas bajo demanda (`lazy`), ExcelJS solo al exportar, archivos con hash en
caché un año (`index.html` sin caché), compresión gzip y la versión de sesión en memoria 10 s (se invalida al
cerrar sesión o dar de baja).

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

Ya está programado en el servidor como la tarea **HelpDesk-Respaldo**: diario a las 23:00 y, si la PC estaba
apagada a esa hora, en cuanto vuelva a estar disponible. Las copias quedan en la carpeta `Backups/` del proyecto
(se conservan las últimas 14). Para recrearla en otro equipo (ajusta la ruta):

```powershell
$script = "C:\ruta\al\proyecto\respaldar.ps1"
$accion = New-ScheduledTaskAction -Execute "powershell.exe" -Argument "-NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -File `"$script`""
$ajustes = New-ScheduledTaskSettingsSet -StartWhenAvailable -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries
Register-ScheduledTask -TaskName "HelpDesk-Respaldo" -Action $accion -Trigger (New-ScheduledTaskTrigger -Daily -At "23:00") -Settings $ajustes
```

Ver la última ejecución: `Get-ScheduledTask HelpDesk-Respaldo | Get-ScheduledTaskInfo`.

> Las copias viven en el mismo disco que la base. Para protegerse de una falla del disco, copia
> periódicamente `Backups/` a otro medio (USB, otra PC o la nube).

## Registro de errores

Todo `console.error` / `console.warn` del servidor se guarda además en `logs/errores-AAAA-MM-DD.log`
(un archivo por día, en la raíz del proyecto; se borran solos los de más de 30 días). Ver `server/utils/logger.js`.

Manual para la persona que opera el sistema sin ser programador: [manual-operacion.md](manual-operacion.md).

## Pruebas automáticas

```bash
npm test
```

Corren contra una base **aparte** (`precision_helpdesk_test`), que se borra y recrea desde `database/schema.sql`
en cada corrida; nunca tocan la base real (se niegan a correr si el nombre no termina en `_test`).
Cubren folios, stock (salidas, entradas, rollback, anulación, kardex, stock bajo, consumo), el borrado lógico
de empleados y la mesa de ayuda (crear ticket, permisos, asignar técnico, resolver, no reabrir, historial,
calificar, cancelar, editar y cierre automático de vencidos), solicitudes de insumos, corrección de fecha de salidas,
indicadores mensuales y el cambio de contraseña/correo del perfil. Están en `server/tests/`.

Las del cliente (`client/tests/`, con Vitest y Testing Library) revisan formato de fechas, mensajes de error,
cierre de sesión por inactividad, la línea de avance del ticket y los componentes separados de las pantallas.
`npm test` corre ambas; por separado: `npm run test:server` y `npm run test:client`.

## Revisión de código (ESLint)

```bash
npm run lint        # revisa server/, client/src/ y client/tests/
npm run lint:fix    # corrige solo lo que se puede corregir automáticamente
```

Configuración en `eslint.config.js`. Los **errores** (variables o componentes sin importar, hooks de React
mal llamados) deben quedar en 0 antes de subir cambios; los **avisos** (variables sin usar, dependencias de
`useEffect`) son limpieza pendiente y no bloquean.

## Migraciones

Los cambios de esquema van en `database/migraciones/NNN_descripcion.sql` y se reflejan también en
`database/schema.sql`. Aplicadas: `001_anular_salida.sql`, `002_empleado_eliminado.sql`, `003_salida_cambios.sql` (historial de correcciones de fecha de salidas), `004_insumo_etiqueta.sql` (columna etiqueta del insumo), `005_integridad_fase1.sql` (reglas CHECK/UNIQUE, índices y disparador del kardex), `006_normalizacion_fase2.sql` (`N/A`→NULL, `categoria_ambito`, `aprobado` calculado, `ticket_evidencia`), `007_normalizacion_fase3.sql` (`salida_anulacion` + vista `v_salida_interna`; IDs `int` y fechas `datetime` en todo el esquema), `008_areas.sql` (tabla `area` y `departamento.id_area`: los puestos agrupados en áreas para los reportes; los puestos sin área cuentan como su propio nombre).

Para aplicar una migración sin el cliente `mysql`: `npm run migrar -- database/migraciones/NNN_….sql` (entiende `DELIMITER`;
añade `--base otra_base` para ensayar antes en una copia). Haz `npm run respaldar` antes.

Procedimiento seguro para una migración nueva:

```bash
npm run respaldar
node --import ./server/load-env.js server/scripts/copiar-base.js precision_ensayo_test        # copia con datos reales
npm run migrar -- database/migraciones/NNN_….sql --base precision_ensayo_test                  # ensayo
node --import ./server/load-env.js server/scripts/regenerar-schema.js precision_ensayo_test NNN # schema.sql para las pruebas
npm test                                                                                      # todo en verde
npm run migrar -- database/migraciones/NNN_….sql                                              # base real
node --import ./server/load-env.js server/scripts/copiar-base.js precision_ensayo_test --borrar
``` Propuesta de normalización: [normalizacion-bd.md](normalizacion-bd.md).

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
- Los cambios de esquema se aplican con un script SQL probado antes en una copia de la base; después se regenera `database/schema.sql` con `mysqldump --no-data`.
- `historial_acceso` y `movimiento_inventario` crecen con el uso; ambos admiten poda por fecha una vez exportados los periodos exigidos por auditoria.

## Política de empleados: baja lógica, no borrado físico

El sistema no debe ejecutar `DELETE FROM empleado`. Las claves foráneas del
esquema (`database/schema.sql`) determinan qué ocurre si se borra un empleado:

- `ticket` (como solicitante y como técnico): `ON DELETE RESTRICT`. MySQL
  bloquea el borrado si el empleado tiene tickets. El intento falla con error
  de integridad referencial.
- `solicitud`: `ON DELETE RESTRICT`. Mismo comportamiento, bloquea el borrado.
- `movimiento_inventario`: `ON DELETE SET NULL`. El movimiento de inventario
  queda sin empleado asociado (el kardex muestra autor genérico).
- `historial_acceso`: `ON DELETE CASCADE`. El historial de accesos del empleado
  se elimina por completo.
- `manual` (campo subido_por): `ON DELETE SET NULL`. El manual queda sin autor.
- `ticket_historial`: `ON DELETE CASCADE`. El historial de cambios del ticket
  se elimina.

Conclusión operativa: borrar un empleado con tickets o solicitudes activas es
imposible por restricción de la base de datos, y borrar uno con solo historial
o movimientos provoca pérdida irreversible de esos registros. El procedimiento
correcto es la baja lógica: actualizar `empleado.estatus` a `Inactivo`. Esto
deshabilita el inicio de sesión, conserva tickets, solicitudes, kardex e
historial intactos, y permite reactivar al empleado si regresa.

## Monitoreo operativo

- Logs: el servidor imprime en consola el estado de Backend, Frontend, DB, Socket, Workers, SMTP y JWT al arrancar, y registra `uncaughtException`/`unhandledRejection` sin tumbar el proceso.
- Apagado ordenado: `SIGTERM`/`SIGINT` cierran el servidor HTTP y el pool con un tope de 10 segundos.
- `GET /api/health` devuelve uso de memoria, uptime y estado del pool (total/libres/en cola) para vigilancia externa.
