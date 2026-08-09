# Guía de Despliegue — Precision Truck Parts, Parts and Accesories, S.A de C.V. HelpDesk

Cómo exponer la app al público usando **tu propia PC como servidor** +
**Cloudflare Tunnel** + **dominio propio registrado en Cloudflare**.

> **Resultado final:** `https://tudominio.com` accesible desde cualquier lugar,
> con HTTPS automático, sin abrir puertos en el router y sin pagar hosting.

---

## Requisitos

| Requisito | Costo | Enlace |
|-----------|-------|--------|
| Cuenta Cloudflare | Gratis | https://cloudflare.com |
| Dominio propio (ej. `.com`) | ~$10 USD/año | https://cloudflare.com/products/registrar |
| Node.js 18+ instalado | Gratis | https://nodejs.org |
| MySQL 8 instalado | Gratis | https://dev.mysql.com/downloads |
| cloudflared (ya descargado) | Gratis | `C:\Users\CONTRALORIA 01\ngrok-bin\` |

---

## Paso 1 — Registrar un dominio en Cloudflare

1. Inicia sesión en [dash.cloudflare.com](https://dash.cloudflare.com)
2. En el menú izquierdo ve a **Domain Registration -> Register Domains**
3. Busca el nombre que quieras, ej: `precisiontrucks-helpdesk.com`
4. Selecciónalo y completa el pago (~$10 USD/año)
5. El dominio queda automáticamente en Cloudflare con DNS gestionado por ellos

> No necesitas configurar nameservers — al registrar en Cloudflare ya están apuntando a Cloudflare.

---

## Paso 2 — Instalar cloudflared correctamente

El archivo ya está descargado en tu PC. Cópialo a una carpeta permanente:

```powershell
# Abre PowerShell como Administrador
New-Item -ItemType Directory -Path "C:\cloudflared" -Force
Copy-Item "C:\Users\CONTRALORIA 01\cloudflared-new.exe" "C:\cloudflared\cloudflared.exe"
```

Agrega `C:\cloudflared` al PATH del sistema:

1. Presiona `Windows + R` -> escribe `sysdm.cpl` -> Enter
2. Ve a **Opciones avanzadas -> Variables de entorno**
3. En **Variables del sistema** busca `Path` -> clic en **Editar**
4. Clic en **Nuevo** -> escribe `C:\cloudflared`
5. Acepta todo y cierra

Verifica en una terminal nueva:
```powershell
cloudflared --version
```

---

## Paso 3 — Autenticar cloudflared con tu cuenta Cloudflare

```powershell
cloudflared tunnel login
```

Se abrirá el navegador -> inicia sesión en Cloudflare -> selecciona tu dominio -> autoriza.

Esto guarda el certificado en:
```
C:\Users\CONTRALORIA 01\.cloudflared\cert.pem
```

---

## Paso 4 — Crear el tunnel

```powershell
cloudflared tunnel create precisiontrucks
```

Anota el **ID del tunnel** que aparece, ejemplo:
```
Created tunnel precisiontrucks with id xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

---

## Paso 5 — Configurar el archivo config.yml

Edita el archivo `C:\Users\CONTRALORIA 01\.cloudflared\config.yml`:

```yaml
tunnel: TU_TUNNEL_ID_AQUI
credentials-file: C:\Users\CONTRALORIA 01\.cloudflared\TU_TUNNEL_ID_AQUI.json

ingress:
 - hostname: tudominio.com
 service: http://localhost:3001
 - hostname: www.tudominio.com
 service: http://localhost:3001
 - service: http_status:404
```

> Reemplaza `TU_TUNNEL_ID_AQUI` con el ID del paso anterior y `tudominio.com` con tu dominio real.

---

## Paso 6 — Crear el registro DNS en Cloudflare

```powershell
cloudflared tunnel route dns TU_TUNNEL_ID_AQUI tudominio.com
cloudflared tunnel route dns TU_TUNNEL_ID_AQUI www.tudominio.com
```

Esto crea automáticamente un registro CNAME en el DNS de Cloudflare apuntando al tunnel.

Verifica en [dash.cloudflare.com](https://dash.cloudflare.com) -> tu dominio -> **DNS -> Records**:
```
tudominio.com CNAME TU_TUNNEL_ID.cfargotunnel.com Proxied
```

---

## Paso 7 — Configurar el .env para producción

Edita el archivo `.env` en la raíz del proyecto:

```env
PORT=3001
NODE_ENV=production

DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=TU_PASSWORD_MYSQL
DB_NAME=precision_helpdesk
DB_SSL=false

JWT_SECRET=TU_JWT_SECRET_DE_64_BYTES

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu@gmail.com
SMTP_PASS=xxxx xxxx xxxx xxxx
SMTP_FROM="Precision Truck Parts HelpDesk" <tu@gmail.com>

VITE_API_URL=
CORS_ORIGIN=https://tudominio.com
APP_URL=https://tudominio.com
```

---

## Paso 8 — Generar el build de producción

```bash
cd "C:\Users\CONTRALORIA 01\Music\Proyecto de Residencias-Matthew Garay\PrecisionTrucks_HelpDesk"
npm run build
```

Esto genera la carpeta `dist/` con el frontend compilado. El servidor Express la sirve automáticamente en producción.

---

## Paso 9 — Iniciar el servidor con PM2

PM2 mantiene el servidor corriendo siempre, incluso si se cierra la terminal o se reinicia la PC.

```powershell
# Instalar PM2 globalmente
npm install -g pm2

# Ir a la carpeta del proyecto
cd "C:\Users\CONTRALORIA 01\Music\Proyecto de Residencias-Matthew Garay\PrecisionTrucks_HelpDesk"

# Iniciar el servidor
pm2 start "npm run server" --name helpdesk

# Guardar la configuración
pm2 save

# Configurar para que arranque con Windows
pm2 startup
```

Comandos útiles de PM2:

```powershell
pm2 status # ver estado
pm2 logs helpdesk # ver logs en tiempo real
pm2 restart helpdesk # reiniciar
pm2 stop helpdesk # detener
```

---

## Paso 10 — Instalar cloudflared como servicio de Windows

Para que el tunnel arranque automáticamente con Windows:

```powershell
# Abre PowerShell como Administrador
cloudflared service install
```

Verifica que el servicio esté corriendo:
```powershell
Get-Service cloudflared
```

Debe mostrar `Status: Running`.

---

## Paso 11 — Verificar que todo funciona

```powershell
# 1. Verificar el servidor
Invoke-WebRequest -Uri "http://localhost:3001/api/ping"

# 2. Verificar desde internet
Invoke-WebRequest -Uri "https://tudominio.com/api/ping"
```

Ambos deben responder:
```json
{ "status": "ok", "message": "Servidor HelpDesk activo " }
```

Abre en el navegador:
```
https://tudominio.com
```

---

## Flujo completo

```
Usuario en cualquier lugar

 https://tudominio.com

 Cloudflare (SSL + DDoS)

 Cloudflare Tunnel (cifrado)

 Tu PC -> Node.js :3001

 Sirve dist/ (React) + /api/* (Express) + MySQL
```

---

## Solución de problemas

| Problema | Causa | Solución |
|----------|-------|----------|
| `DNS_PROBE_FINISHED_NXDOMAIN` | DNS no propagado | Espera 5-10 min |
| `502 Bad Gateway` | Servidor Node no está corriendo | Ejecuta `pm2 restart helpdesk` |
| `tunnel not found` | config.yml con ID incorrecto | Verifica el ID con `cloudflared tunnel list` |
| La URL no carga | Tunnel no está corriendo | Verifica con `Get-Service cloudflared` |
| Cambios no se ven | Build desactualizado | Ejecuta `npm run build` y reinicia |

---

## Mantenimiento

Cada vez que hagas cambios al código:

```bash
# 1. Generar nuevo build
npm run build

# 2. Reiniciar el servidor
pm2 restart helpdesk
```

El tunnel de Cloudflare no necesita reiniciarse.

---

## Opción temporal — ngrok (sin dominio)

Si aún no tienes dominio, puedes usar ngrok temporalmente:

```powershell
# Terminal 1 — servidor
npm run server

# Terminal 2 — tunnel temporal
& "C:\Users\CONTRALORIA 01\ngrok-bin\ngrok.exe" http 3001
```

La URL cambia cada vez que reinicias ngrok. Comparte la URL que aparece en `Forwarding`.

> ngrok gratis no tiene URL fija. Para URL permanente necesitas el dominio propio con Cloudflare.
