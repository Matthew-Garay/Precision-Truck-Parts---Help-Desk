# Backend / Config

Módulo de infraestructura compartida. Todos los archivos de esta carpeta son importados por Controllers, Models y Workers; ninguno contiene lógica de negocio propia.

---

## db.js

**Responsabilidad:** Configura y exporta el pool de conexiones MySQL.

**Lógica principal:**
- Crea un `mysql2/promise` pool con límite de 10 conexiones, cola máxima de 50 y timeout de 10 s.
- Fija `timezone: "-06:00"` (Hermosillo) para consistencia de fechas en todas las queries.
- Activa SSL si `DB_HOST !== "localhost"` y `DB_SSL === "true"`.
- Ejecuta una conexión de prueba al importar; si falla, termina el proceso con código 1.

**Relación:** Importado por todos los Models, Controllers que ejecutan queries directas y Workers.

**Entradas:** Variables de entorno `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `DB_SSL`.

**Salidas:** Instancia `pool` (default export) con métodos `query()`, `getConnection()`, `end()`.

---

## mailer.js

**Responsabilidad:** Configura el transporter SMTP y expone la función de envío del código de recuperación de contraseña.

**Lógica principal:**
- Crea un `nodemailer.createTransport` con las variables `SMTP_*`.
- Si `SMTP_USER` no está definido, la función retorna sin enviar (modo silencioso en desarrollo).
- `enviarCodigoRecuperacion({ to, nombre, codigo })`: genera HTML con el logo embebido en base64 (carga lazy), los 6 dígitos del código en celdas individuales y la hora local en zona Hermosillo.
- Usa escritura atómica para el logo (lectura única, resultado cacheado en `LOGO_B64`).

**Relación:** Llamado exclusivamente por `resetController.js`.

**Entradas:** `{ to: string, nombre: string, codigo: string|number }`.

**Salidas:** `Promise<void>` — envía el correo o retorna silenciosamente si SMTP no está configurado.

---

## socketInstance.js

**Responsabilidad:** Implementa el patrón singleton para la instancia de `Socket.io` y resuelve la dependencia circular entre `server.js` y los Controllers.

**Lógica principal:**
- `setIO(ioInstance)`: registra la instancia una sola vez al arrancar el servidor.
- `getIO()`: retorna la instancia registrada; lanza `Error` si se llama antes de `setIO`.

**Relación:** `setIO` es llamado por `server.js`. `getIO` es llamado por `ticketsController.js`, `solicitudesController.js` y `scheduledJobs.js`.

**Entradas / Salidas:** No recibe ni retorna datos de negocio; gestiona únicamente la referencia a `io`.

---

## cache.js

**Responsabilidad:** Caché en memoria con TTL por clave y política de evicción LRU (máx. 500 entradas).

**Lógica principal:**
- `cache.get(key)`: retorna el valor si no expiró; elimina la entrada y retorna `undefined` si expiró.
- `cache.set(key, value, ttlMs)`: guarda con tiempo de vida; reinserta al final del Map para mantener orden LRU.
- `cache.del(key)`: invalida una clave específica.
- `cache.delByPrefix(prefix)`: invalida todas las claves que empiezan con el prefijo dado.

**Relación:** Usado por `Ticket.getMetricas()`, `Ticket.getRendimientoTecnicos()` y `ticketsController.js` para invalidar caché al mutar tickets.

**Entradas:** Clave string + valor cualquiera + TTL en ms (default 60 000).

**Salidas:** Valor cacheado o `undefined`.
