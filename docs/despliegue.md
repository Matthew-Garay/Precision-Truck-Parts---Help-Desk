# Guía de despliegue — Precision Truck Parts HelpDesk

Documento operativo para publicar el sistema en internet con costo cero,
restringido a correos corporativos @ptp, y con endurecimiento básico de seguridad.

## 1. Arquitectura de producción

El proyecto es un monolito full-stack:

- Frontend React + Vite, compilado a la carpeta dist/.
- Backend Express + Socket.io que, en producción, sirve el frontend compilado
  desde dist/ y expone la API bajo /api.
- Base de datos MySQL.
- Archivos subidos (evidencias, insumos, manuales) en la carpeta storage/.
- Un solo dominio sirve frontend y API, por lo que no hay problemas de CORS.

## 2. Opción recomendada: Railway (región California, US-West)

Motivo: el código ya incluye railway.json con build, arranque y healthcheck.
Toda la conexión de México sale a internet por Estados Unidos, y California es
el punto más cercano disponible en Railway (región us-west2), con latencia
aproximada de 40 a 80 ms hacia México. Un servidor dentro de México reduciría
unos 30 ms adicionales, diferencia imperceptible para un helpdesk.

Region no disponible en México: Railway no ofrece región en México. Sus regiones
son California (us-west2), Virginia (us-east4), Amsterdam (europe-west4) y
Singapur (asia-southeast1). Para latencia mínima desde México se elige
California.

Pasos:

1. Subir el repositorio a GitHub como privado.
2. En Railway: New Project, Deploy from GitHub, seleccionar el repositorio.
3. Agregar el plugin MySQL en el mismo proyecto y misma región.
4. En Settings del servicio, fijar Region en us-west2.
5. Cargar las variables de entorno de la sección 4.
6. Crear un Volume y montarlo en la ruta /app/storage para persistir archivos.
7. Generar el dominio público y luego asociar el dominio propio.

## 3. Dominio gratuito

Freenom (.tk, .ml, .ga) dejó de operar en 2023, por lo que ya no es una opción
válida. Alternativas reales sin costo:

- Usar el dominio que Railway entrega al generar el dominio público
  (formato del tipo servicio.up.railway.app). Incluye HTTPS administrado.
- Usar un subdominio propio si ya se controla un dominio, por ejemplo
  helpdesk.midominio.com, apuntando un registro CNAME al host de Railway.
- DuckDNS (algo.duckdns.org) si se requiere un nombre estable sobre IP dinámica.

Nota: un dominio .com.mx propio es de pago y se contrata con un registrador.
No existe una vía gratuita y confiable para un .com.mx.

## 4. Variables de entorno en Railway

Configurar en el panel, nunca en el código:

    NODE_ENV=production
    APP_URL=https://<dominio-publico>
    CORS_ORIGIN=https://<dominio-publico>
    JWT_SECRET=<cadena aleatoria largia, generada con crypto.randomBytes(64)>

    DB_HOST=<host privado del plugin MySQL, variable interna de Railway>
    DB_PORT=3306
    DB_USER=root
    DB_PASSWORD=<contraseña del plugin>
    DB_NAME=precision_helpdesk
    DB_SSL=false

    SMTP_HOST=smtp.zoho.com
    SMTP_PORT=587
    SMTP_USER=<correo corporativo>
    SMTP_PASS=<contraseña de aplicación de Zoho>
    SMTP_FROM="Precision HelpDesk <no-responder@ptp.com.mx>"

    ZOHO_CLIENT_ID=<id de cliente del API Console de Zoho>
    ZOHO_CLIENT_SECRET=<secret del API Console de Zoho>
    ZOHO_ACCOUNTS_URL=https://accounts.zoho.com
    ZOHO_REDIRECT_URI=https://<dominio-publico>/api/auth/zoho/callback
    ZOHO_SCOPES=openid,email,profile

El frontend debe usar llamadas relativas (VITE_API_URL vacio), de modo que
consulta /api en el mismo dominio y evita CORS.

## 5. Importar la base de datos

Ejecutar una sola vez contra el MySQL de Railway:

- Abrir una conexión con DBeaver o TablePlus al host del plugin.
- Ejecutar database/schema.sql.

Después de importar, crear el primer administrador y validar el acceso.

## 6. Persistencia de archivos

Montar un Volume en /app/storage. Si no se monta, los archivos subidos se
pierden en cada despliegue porque el sistema de archivos del contenedor es
efímero. Tamaño inicial sugerido: 10 GB con respaldos automáticos activados.

## 7. Restricción de acceso a correos corporativos

El acceso ya está limitado a correos corporativos mediante la función
validarEmailCorporativo en server/middlewares/validate.js. Esta barrera aplica
tanto al login normal como al login con Zoho. Para admitir solo el dominio
@ptp.com.mx, verificar que la lista blanca de dominios en dicha función
contenga exclusivamente ese dominio y ningún otro.

## 8. Endurecimiento de seguridad

Estado actual verificado:

- Inyección SQL: no existe. Todas las consultas usan consultas parametrizadas
  con el placeholder ? a través del pool de mysql2. No se concatenan datos del
  usuario dentro del SQL. Las pocas expresiones interpoladas en el código
  corresponden a nombres de columna fijos definidos por el programa, nunca a
  entradas del usuario.
- Contraseñas: almacenadas con bcrypt, 12 rounds para cuentas creadas por el
  sistema y 10 para datos semilla.
- Sesiones: JWT con expiración de 12 horas y revocación por token_version.
- Cabeceras: helmet con política de contenido y límites de tamaño en subidas.

Recomendaciones para producción:

- Mantener JWT_SECRET privado y rotarlo si se sospecha filtración.
- Forzar HTTPS (Railway lo entrega por defecto en el dominio).
- No versionar archivos .env ni la carpeta storage/.
- Respaldos automáticos de base de datos y volume activados en Railway.
- Revisar periódicamente el reporte de vulnerabilidades con npm audit.

## 9. Verificación posterior al despliegue

Comprobar en este orden:

1. GET /api/ping responde 200.
2. Inicio de sesión normal con un usuario administrador.
3. Inicio de sesión con Zoho con una cuenta corporativa registrada.
4. Subida de una evidencia a un ticket y verificación de que la imagen persiste.
5. Creación de una solicitud de insumos y su impresión.
6. Apertura del sistema en dos pestañas para validar Socket.io.

## 10. Flujo de cambios sin romper producción

- Desarrollar en local con el script de arranque de los dos servidores.
- Enviar a la rama principal; Railway reconstruye y despliega solo.
- El healthcheck /api/ping evita publicar una versión que no arranca.
- Para cambios de base de datos, versionar un script de migración en
  database/ y ejecutarlo primero en un entorno de prueba.