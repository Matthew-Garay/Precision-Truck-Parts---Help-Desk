# Guía de despliegue — Precision Truck Parts · Mesa de Ayuda

Cómo publicar el sistema en internet **gratis**, con un **dominio con HTTPS**,
de forma segura y sin perder datos. Los archivos de apoyo están en
[`deploy/`](../deploy).

---

## 1. Qué necesita el sistema para funcionar

| Pieza | Por qué importa al elegir dónde publicar |
|---|---|
| Node.js 22 (Express + Socket.io) | Debe estar **encendido siempre**: los avisos en tiempo real y las tareas programadas (SLA, tickets vencidos, alertas de stock) no funcionan si el servidor "se duerme". |
| MySQL 8 | La base es MySQL; los servicios gratuitos que solo ofrecen PostgreSQL no sirven sin reescribir el sistema. |
| Disco persistente (`storage/`) | Evidencias de tickets, fotos de insumos y manuales PDF se guardan en disco. Si el disco se borra en cada reinicio, se pierden. |
| Un solo dominio | En producción Express sirve el frontend compilado (`dist/`) y la API (`/api`) desde la misma dirección: sin problemas de CORS. |

## 2. Opción elegida: VM gratuita de Oracle Cloud + DuckDNS

| Opción | ¿Gratis de verdad? | Encendido 24/7 | MySQL | Disco persistente | Veredicto |
|---|---|---|---|---|---|
| **Oracle Cloud "Always Free"** (VM Ubuntu) | Sí, sin fecha de vencimiento | Sí | Sí (en la VM) | Sí (hasta 200 GB) | ✅ **Recomendada** |
| Equipo de la oficina + DuckDNS | Sí | Solo si el equipo no se apaga | Sí | Sí | Alternativa (sección 9) |
| Railway | No: solo crédito de prueba | Sí | Sí | Con volumen | ❌ Ya no es gratis |
| Render (plan free) | Sí | No: se duerme a los 15 min | No (solo PostgreSQL) | No: se borra | ❌ Pierde archivos y avisos |
| Vercel / Netlify | Sí | No (funciones) | No | No | ❌ Solo sirven el frontend |

**Dominio gratis:** [DuckDNS](https://www.duckdns.org) da un subdominio gratuito
(por ejemplo `ptp-helpdesk.duckdns.org`) y **Caddy** obtiene y renueva solo el
certificado HTTPS de Let's Encrypt. Si más adelante la empresa compra un dominio
propio (~$200 MXN/año, p. ej. `mesadeayuda.ptp.com.mx`), solo se cambia en el
`Caddyfile` y en el `.env`.

```
Navegador ──HTTPS──▶ Caddy :443 ──▶ Node (Express + Socket.io) 127.0.0.1:3001 ──▶ MySQL :3306
                    (certificado        ├─ /api/*      API REST
                     automático)        ├─ /storage/*  evidencias, fotos, manuales
                                        └─ /*          frontend compilado (dist/)
```

> **Oracle pide tarjeta** al crear la cuenta solo para verificar identidad; los
> recursos "Always Free" no generan cargos. Elige la región **US West (Phoenix)**
> o **Mexico Central (Querétaro)** si está disponible, por latencia.

---

## 3. Paso a paso

### 3.1 Crear la VM (una sola vez)

1. Crea la cuenta en <https://www.oracle.com/cloud/free/>.
2. **Compute → Instances → Create instance**
   - Imagen: **Ubuntu 24.04**
   - Forma: **VM.Standard.A1.Flex** (Ampere, Always Free) con 1 OCPU y 6 GB de RAM
   - Descarga la llave SSH que te ofrece.
3. **Networking → la red de la VM → Security List → Add Ingress Rules**:
   puertos **80** y **443** desde `0.0.0.0/0`. **No abras el 3001 ni el 3306.**
4. Anota la **IP pública** y resérvala (*Reserved public IP*) para que no cambie.

### 3.2 Dominio gratuito con DuckDNS

1. Entra a <https://www.duckdns.org> con tu cuenta de Google/GitHub.
2. Crea el subdominio (p. ej. `ptp-helpdesk`) y pon la **IP pública** de la VM.
3. Comprueba desde tu equipo: `nslookup ptp-helpdesk.duckdns.org` debe devolver esa IP.

### 3.3 Instalar todo en la VM

```bash
ssh -i llave.key ubuntu@<IP-publica>
git clone https://github.com/<usuario>/<repo>.git /tmp/repo
bash /tmp/repo/deploy/instalar-servidor.sh https://github.com/<usuario>/<repo>.git
```

El script ([`deploy/instalar-servidor.sh`](../deploy/instalar-servidor.sh))
instala Node 22, MySQL 8, Caddy y PM2, abre los puertos 80/443 en el firewall
interno de Ubuntu, clona el proyecto en `/opt/precision-helpdesk`, instala
dependencias y compila el frontend.

> Si el repositorio es **privado** (recomendado), GitHub pedirá usuario y un
> *Personal Access Token* (Settings → Developer settings → Tokens) en lugar de
> la contraseña.

### 3.4 Base de datos

1. Usuario propio de la aplicación (nunca `root`):
   ```bash
   nano deploy/mysql-usuario.sql        # cambia CAMBIA_ESTA_CONTRASEÑA
   sudo mysql < deploy/mysql-usuario.sql
   ```
   Genera la contraseña con `openssl rand -base64 24`.
2. En tu equipo Windows genera un respaldo actual: `npm run respaldar`.
3. Copia el respaldo a la VM e impórtalo:
   ```bash
   # desde tu equipo
   scp -i llave.key backups/respaldo_AAAAMMDD_HHMM/base_datos.sql ubuntu@<IP>:/tmp/
   scp -i llave.key -r backups/respaldo_AAAAMMDD_HHMM/storage ubuntu@<IP>:/tmp/storage
   # en la VM
   sudo mysql precision_helpdesk < /tmp/base_datos.sql
   cp -r /tmp/storage/* /opt/precision-helpdesk/storage/
   rm -rf /tmp/base_datos.sql /tmp/storage
   ```

### 3.5 Configuración (`server/.env`)

```bash
cd /opt/precision-helpdesk
cp server/.env.example server/.env
nano server/.env
chmod 600 server/.env        # solo tu usuario puede leerlo
```

Valores de producción (todas las variables están explicadas en
[`server/.env.example`](../server/.env.example)):

| Variable | Producción |
|---|---|
| `NODE_ENV` | `production` |
| `HOST` | `127.0.0.1` (solo Caddy puede hablar con Node) |
| `APP_URL` / `CORS_ORIGIN` | `https://ptp-helpdesk.duckdns.org` (las dos iguales) |
| `JWT_SECRET` | **Nueva**, de 64+ caracteres (el servidor no arranca con menos de 32) |
| `DB_USER` / `DB_PASSWORD` | `helpdesk_app` y la contraseña del paso 3.4 |
| `SMTP_*` | Cuenta de correo que envía (la variable es `SMTP_PASS`) |
| `ZOHO_REDIRECT_URIS` | `https://ptp-helpdesk.duckdns.org/api/auth/zoho/callback` |

### 3.6 HTTPS, arranque y respaldos

```bash
nano deploy/Caddyfile                      # pon tu dominio en la primera línea
sudo cp deploy/Caddyfile /etc/caddy/Caddyfile
sudo systemctl reload caddy                # obtiene el certificado HTTPS solo

pm2 start deploy/ecosystem.config.cjs      # arranca el backend
pm2 save && pm2 startup                    # y lo vuelve a levantar al reiniciar la VM
                                           # (pm2 startup imprime un comando sudo: ejecútalo)
crontab -e                                 # respaldo diario a las 02:30:
# 30 2 * * * /opt/precision-helpdesk/deploy/respaldar.sh >> /var/log/helpdesk-respaldo.log 2>&1
```

### 3.7 Zoho

En <https://api-console.zoho.com>, en tu aplicación, agrega la URI de
redirección **exactamente** igual a `ZOHO_REDIRECT_URIS`:
`https://ptp-helpdesk.duckdns.org/api/auth/zoho/callback`.
Puedes dejar también las de la red local para seguir probando en la oficina.

---

## 4. Verificación después de publicar

| Prueba | Resultado esperado |
|---|---|
| `curl https://ptp-helpdesk.duckdns.org/api/ping` | `{"status":"ok", …}` |
| `curl -I http://ptp-helpdesk.duckdns.org` | Redirige a `https://` |
| `curl -m 5 http://<IP>:3001/api/ping` desde fuera | **Falla** (Node no está expuesto) |
| Abrir el sitio e iniciar sesión (correo y Zoho) | Entra y muestra el dashboard |
| Crear un ticket con evidencia y abrirla | La imagen carga |
| Admin y usuario en dos navegadores | El aviso del ticket nuevo llega al instante (Socket.io) |
| "¿Olvidaste tu contraseña?" | Llega el correo con el código |
| `pm2 logs helpdesk` | Panel de arranque con MySQL ✅ y sin errores |
| `deploy/respaldar.sh` | Crea `backups/respaldo_…` con la base y `storage` |

## 5. Actualizar a una versión nueva

```bash
cd /opt/precision-helpdesk
./deploy/respaldar.sh            # respaldo antes de actualizar
git pull --ff-only
npm ci
npm run build
pm2 restart helpdesk
pm2 logs helpdesk --lines 30     # confirma que arrancó sin errores
```

Si un cambio necesita modificar la base de datos, aplica el script SQL **primero
en una copia** (`CREATE DATABASE prueba` + importar el respaldo), verifica, y
solo después en `precision_helpdesk`. El usuario `helpdesk_app` no tiene
permisos de esquema: los cambios de estructura se hacen con `sudo mysql`.

## 6. Lista de seguridad de producción

- [ ] Repositorio de GitHub **privado** (ver `docs/security.md`, incidente de credenciales).
- [ ] `JWT_SECRET`, contraseña de MySQL y secretos de Zoho/correo **nuevos**, distintos a los de desarrollo.
- [ ] La app usa `helpdesk_app`, no `root`.
- [ ] `HOST=127.0.0.1` y en Oracle solo están abiertos 22, 80 y 443.
- [ ] `server/.env` con permisos `600`.
- [ ] Respaldo diario programado y **probado** (restaurar en una base de prueba al menos una vez).
- [ ] Acceso SSH solo con llave (Oracle lo trae así por defecto).
- [ ] `sudo apt-get update && sudo apt-get upgrade` una vez al mes; `npm audit --omit=dev` al actualizar.

## 7. Qué ya protege el sistema

| Capa | Protección |
|---|---|
| Transporte | HTTPS con certificado automático y HSTS (Caddy). |
| Sesiones | JWT de 12 h con `token_version`: cerrar sesión invalida el token en API y Socket.io. |
| Contraseñas | bcrypt (12 rondas); bloqueo por intentos en login y recuperación (rate limit). |
| Peticiones | Helmet (CSP, cabeceras), protección CSRF por cabecera, CORS limitado a `APP_URL`, límites de tamaño. |
| Permisos | Admin / Usuario / Soporte Técnico verificados en el servidor en cada ruta; un usuario solo ve sus propios tickets, solicitudes y datos. |
| Datos | Consultas parametrizadas (sin inyección SQL); validación de entradas con Zod. |
| Archivos | Tipos validados por contenido, nombres aleatorios, rutas protegidas contra *path traversal*. |
| Errores | En producción no se muestran detalles internos al usuario. |

## 8. Solución de problemas

| Síntoma | Causa probable | Solución |
|---|---|---|
| El sitio no abre | Puertos 80/443 cerrados | Revisa la *Security List* de Oracle y `sudo iptables -L INPUT -n` |
| Caddy no obtiene el certificado | El dominio no apunta a la IP | `nslookup tu-dominio` y corrige la IP en DuckDNS |
| `[❌ ERROR] Variables de entorno faltantes` | `.env` incompleto | Completa `APP_URL` y `CORS_ORIGIN` |
| `JWT_SECRET debe tener al menos 32 caracteres` | Clave débil | Genera una nueva (comando en `.env.example`) |
| `DB ❌ MySQL sin conexión` | Usuario o contraseña | Prueba `mysql -u helpdesk_app -p precision_helpdesk` |
| Login con Zoho regresa error | URI no registrada | Agrega la URI exacta en la consola de Zoho |
| No llegan correos | Variable mal escrita | Debe ser `SMTP_PASS` (no `SMTP_PASSWORD`) |
| Avisos en tiempo real no llegan | Proxy sin WebSocket | Usa el `Caddyfile` incluido (los soporta sin configuración) |

## 9. Alternativa: publicar desde el equipo de la oficina

Si prefieres no usar la nube, el mismo equipo Windows donde corre hoy puede
publicarse con DuckDNS, a cambio de que **no se apague nunca**:

1. En el router, redirige los puertos **80 y 443** a la IP local del equipo.
   (Algunos proveedores de internet bloquean estos puertos o usan CGNAT; en ese
   caso esta opción no funciona y conviene Oracle.)
2. Instala la app de DuckDNS para Windows para que actualice la IP pública.
3. Instala Caddy para Windows con el mismo `Caddyfile` y ejecútalo como servicio.
4. Arranca el backend en modo producción: `npm run build` y `npm run server`.
5. Programa `respaldar.ps1` en el Programador de tareas (ver `docs/operations.md`).
