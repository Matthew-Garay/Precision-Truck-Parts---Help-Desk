# DOCUMENTACION TECNICA PROFESIONAL COMPLETA

## Sistema de Gestion de Tickets de Soporte Tecnico y Solicitudes de Insumos

### Precision Truck Parts - HelpDesk

---

**Empresa:** Precision Truck Parts, Parts and Accesories, S.A de C.V.
**Version del Sistema:** 1.0.0
**Fecha de Compilacion:** Agosto 2026
**Autor:** Matthew Garay
**Estado:** En desarrollo activo

---

## TABLA DE CONTENIDOS

1. [Introduccion General](#1-introduccion-general)
2. [Arquitectura del Sistema](#2-arquitectura-del-sistema)
3. [Modelo Cliente-Servidor](#3-modelo-cliente-servidor)
4. [Requerimientos del Sistema](#4-requerimientos-del-sistema)
5. [Stack Tecnologico](#5-stack-tecnologico)
6. [Estructura del Proyecto](#6-estructura-del-proyecto)
7. [Base de Datos](#7-base-de-datos)
8. [Modulos Funcionales](#8-modulos-funcionales)
9. [Modelo de Seguridad](#9-modelo-de-seguridad)
10. [Mecanismos de Autenticacion y Autorizacion](#10-mecanismos-de-autenticacion-y-autorizacion)
11. [Comunicacion en Tiempo Real](#11-comunicacion-en-tiempo-real)
12. [Sistema de Notificaciones](#12-sistema-de-notificaciones)
13. [Trabajos Programados en Segundo Plano](#13-trabajos-programados-en-segundo-plano)
14. [Gestion de Archivos y Almacenamiento](#14-gestion-de-archivos-y-almacenamiento)
15. [Generacion de Reportes y Exportaciones](#15-generacion-de-reportes-y-exportaciones)
16. [Documentacion de la API](#16-documentacion-de-la-api)
17. [Variables de Entorno](#17-variables-de-entorno)
18. [Despliegue y Entornos](#18-despliegue-y-entornos)
19. [Pruebas y Validacion](#19-pruebas-y-validacion)
20. [Rendimiento y Optimizacion](#20-rendimiento-y-optimizacion)
21. [Mantenimiento y Operacion](#21-mantenimiento-y-operacion)
22. [Resolucion de Problemas Comunes](#22-resolucion-de-problemas-comunes)
23. [Referencias y Recursos Adicionales](#23-referencias-y-recursos-adicionales)

---

## 1. INTRODUCCION GENERAL

### 1.1 Proposito del Sistema

El sistema PrecisionTrucks HelpDesk es una aplicacion web empresarial disenada para gestionar de manera integral el soporte tecnico interno y la administracion de solicitudes de insumos dentro de la organizacion Precision Truck Parts, Parts and Accesories, S.A de C.V. El sistema centraliza los siguientes procesos criticos:

1. **Gestion de tickets de soporte tecnico:** Permite a los empleados reportar incidencias tecnicas relacionadas con equipos de computo, software, hardware, redes, telefonos y cualquier otro recurso tecnologico de la empresa. Los administradores y tecnicos pueden dar seguimiento, asignar responsables, cambiar estatus, agregar comentarios, adjuntar evidencias y resolver las incidencias dentro de los tiempos de servicio establecidos (SLA).

2. **Solicitud de insumos:** Permite a los empleados solicitar articulos del inventario fisico de la empresa. El administrador revisa, aprueba o rechaza cada insumo individualmente, y al aceptar la solicitud se descuenta el stock del inventario automaticamente. El sistema mantiene un control de niveles minimos de stock y genera alertas de reabastecimiento.

3. **Gestion de manuales tecnicos:** Los administradores pueden subir, editar, reemplazar y eliminar manuales PDF de referencia para resolver incidencias. Los empleados pueden consultar, buscar y visualizar estos manuales directamente desde la aplicacion con un visor PDF integrado.

4. **Administracion de personal:** El administrador puede crear, modificar y desactivar cuentas de empleados, asignar roles y departamentos, y monitorear el historial de accesos al sistema.

5. **Generacion de reportes:** El sistema produce estadisticas de rendimiento por tecnico, metricas de resolucion de tickets, tendencias mensuales, reportes por departamento y exporta informacion a PDF y Excel.

### 1.2 Alcance del Sistema

El sistema cubre las siguientes areas funcionales:

- **Modulo de Autenticacion:** Login, logout, recuperacion de contrasena por correo electronico con codigo de verificacion, renovacion automatica de sesiones.
- **Modulo de Empleados:** Gestion del ciclo de vida completo de las cuentas de empleados.
- **Modulo de Tickets:** Reporte, seguimiento, resolucion, calificacion y cancelacion de incidencias.
- **Modulo de Solicitudes:** Creacion, aprobacion, rechazo y descuento de stock de insumos.
- **Modulo de Inventario:** Gestion del catalogo de insumos con control de existencias.
- **Modulo de Manuales:** Gestion de archivos PDF de referencia tecnica.
- **Modulo de Reportes:** Metricas, estadisticas y exportaciones.
- **Modulo de Notificaciones:** Alertas en tiempo real por Socket.io.

### 1.3 Usuarios del Sistema

El sistema reconoce dos roles principales de usuario:

| Rol                | ID  | Descripcion                                                                                                                   |
| ------------------ | --- | ----------------------------------------------------------------------------------------------------------------------------- |
| Administrador      | 1   | Acceso completo a todos los modulos. Gestiona empleados, tickets, insumos, manuales y reportes.                               |
| Usuario (Empleado) | 2   | Acceso a dashboard personal, creacion de tickets, solicitudes de insumos, consulta de manuales y gestion de su propio perfil. |

---

## 2. ARQUITECTURA DEL SISTEMA

### 2.1 Diagrama de Arquitectura

```
----
| NAVEGADOR WEB (CLIENTE) |
| |
| ---- |
| | FRONTEND REACT + VITE + TAILWIND | |
| | | |
| | Paginas: Login, Dashboard Admin, Dashboard Usuario, | |
| | Nuevo Reporte, Historial, Inventario, Personal, | |
| | Manuales, Configuracion, Paginas de Impresion | |
| | | |
| | Componentes compartidos: Notificaciones, Kanban, PDF Viewer, | |
| | Tablas de Manuales, Filtros, Modales, Componentes de Reporte | |
| | | |
| | Configuracion: api.js, theme.jsx, session.js, socket.js, | |
| | NotificationService.js, printUtils.ts | |
| `------ |
`----------
 |
 HTTPS / REST / WebSockets
 |
----
| SERVIDOR NODE.JS (BACKEND) |
| |
| ---- |
| | EXPRESS.js (Framework HTTP Principal) | |
| | | |
| | Middlewares globales: | |
| | - compression (gzip/brotli) | |
| | - helmet (seguridad HTTP) | |
| | - cors (origenes permitidos) | |
| | - express.json (2MB limite) | |
| | - csrfProtection (header x-requested-with) | |
| | | |
| | Rutas API: | |
| | - /api/auth (login, empleados, recuperacion) | |
| | - /api/categorias (catalogo de categorias) | |
| | - /api/tickets (gestion de incidencias) | |
| | - /api/solicitudes (insumos, inventario) | |
| | - /api/manuales (PDFs tecnicos) | |
| `------ |
| |
| ---- |
| | SOCKET.IO SERVER (WebSockets en tiempo real) | |
| | | |
| | - Autenticacion JWT en handshake | |
| | - Salas: empleado_{id} y admins | |
| | - Eventos: ticket:nuevo, ticket:actualizado, | |
| | solicitud:nueva, solicitud:actualizada, | |
| | insumo:stock_critico, ticket:sla_warning, | |
| | ticket:sin_atender, tickets:vencidos | |
| `------ |
| |
| ---- |
| | WORKERS DE TAREAS PROGRAMADAS | |
| | | |
| | - Alertas SLA (cada 30 minutos) | |
| | - Cierre de tickets vencidos (cada 1 hora) | |
| | - Limpieza de sesiones huerfanas (cada 1 hora) | |
| | - Alertas de stock critico (cada 24 horas) | |
| | - Tickets sin atender en 24h (cada 1 hora) | |
| `------ |
| |
| ---- |
| | SERVICIO DE CORREO (Nodemailer SMTP) | |
| | - Envio de codigos de recuperacion de contrasena | |
| `------ |
`----------
 |
 Protocolo MySQL (mysql2/promise)
 |
----
| BASE DE DATOS MySQL 8.0+ |
| |
| Tablas principales: |
| - empleado, departamento, sucursal, rol |
| - historial_acceso, token_revocado |
| - ticket, historial_ticket, categoria |
| - solicitud, solicitud_insumo, insumo |
| - manual |
`------
```

### 2.2 Principios Arquitectonicos

El sistema sigue los siguientes principios arquitectonicos:

1. **Separacion de responsabilidades:** El codigo se divide en capas claramente diferenciadas: Rutas (definicion de endpoints), Controladores (logica de negocio), Modelos (acceso a datos) y Middlewares (validacion, autenticacion, seguridad). Esta separacion facilita el mantenimiento, la escalabilidad y las pruebas unitarias.

2. **APIs RESTful:** El backend expone una API REST estandar que utiliza metodos HTTP semanticos (GET, POST, PUT, PATCH, DELETE) y codigos de respuesta apropiados (200, 201, 400, 401, 403, 404, 409, 422, 500).

3. **Comunicacion en tiempo real con WebSockets:** Se utiliza Socket.io montado sobre el servidor HTTP nativo para notificaciones instantaneas sin necesidad de recargar la pagina. Cada conexion WebSocket se autentica con JWT.

4. **Arquitectura de un solo proceso:** El sistema ejecuta frontend y backend como un solo proceso Node.js en produccion (Express sirve el build de Vite). En desarrollo se ejecutan como dos procesos separados con Vite Dev Server y el servidor Express.

5. **Almacenamiento de archivos en disco:** Las evidencias de tickets, manuales PDF, fotos de perfil y fotos de insumos se almacenan en el sistema de archivos del servidor bajo el directorio /storage, con rutas servidas estaticamente.

6. **Caché en memoria:** El sistema implementa una capa de cachememoria (cache.js) para metricas del dashboard, listas de admins, catalogos de departamentos y nombres de empleados, reduciendo la carga sobre la base de datos para consultas frecuentes.

---

## 3. MODELO CLIENTE-SERVIDOR

### 3.1 Arquitectura de dos capas

El sistema utiliza una arquitectura clasica de dos capas:

**CAPA DE PRESENTACION (CLIENTE):**
Es la aplicacion React que se ejecuta en el navegador del usuario. Las responsabilidades de esta capa son:

1. Renderizar la interfaz de usuario con componentes reutilizables.
2. Capturar las entradas del usuario via formularios, botones y controles.
3. Validar la informacion en el lado del cliente antes de enviarla al servidor.
4. Comunicarse con el backend mediante peticiones HTTP/REST.
5. Suscribirse a los eventos de Socket.io para recibir notificaciones en tiempo real.
6. Gestionar el estado de la sesion (token JWT en localStorage).
7. Gestionar el tema visual (claro/oscuro) mediante contextos de React.
8. Generar documentos PDF e Excel en el navegador mediante jspdf, autotable y xlsx.

**CAPA DE SERVIDOR (BACKEND):**
Es la aplicacion Node.js/Express que se ejecuta en el servidor. Las responsabilidades de esta capa son:

1. Autenticar a los usuarios y autorizar el acceso a los recursos segun el rol.
2. Procesar las peticiones HTTP y responder con JSON.
3. Implementar la logica de negocio de todos los modulos.
4. Interactuar con la base de datos MySQL mediante consultas parametrizadas.
5. Gestionar la subida, almacenamiento y servido de archivos.
6. Enviar correos electronicos transaccionales (recuperacion de contrasena).
7. Ejecutar tareas programadas en segundo plano (workers).
8. Servir la aplicacion estatica del frontend en produccion.

### 3.2 Flujo de Peticion-HTTP

El ciclo de vida de una peticion HTTP en el sistema es el siguiente:

1. El navegador del cliente envia una peticion HTTP al servidor (GET, POST, PUT, PATCH, DELETE).
2. El middleware de compresion verifica si la respuesta debe comprimirse con gzip o brotli.
3. Helmet establece las cabeceras de seguridad HTTP (Content-Security-Policy, X-Content-Type-Options, Referrer-Policy, etc.).
4. CORS verifica que el origen de la peticion esta en la lista blanca configurada.
5. Express parsea el cuerpo de la peticion si es JSON o urlencoded (limite 2MB).
6. El middleware csrfProtection verifica que las peticiones de mutacion incluyan el encabezado "x-requested-with".
7. El middleware requireAuth verifica el token JWT en el encabezado Authorization.
8. El middleware requireAdmin verifica si el usuario tiene rol de administrador (si aplica).
9. El middleware validate aplica el esquema Zod correspondiente para validar los datos de entrada.
10. El controlador ejecuta la logica de negocio, consulta los modelos y prepara la respuesta.
11. Los modelos ejecutan las consultas SQL parametrizadas contra MySQL.
12. La respuesta JSON se envia de vuelta al cliente con el codigo de estatus HTTP correspondiente.

### 3.3 Flujo de Comunicacion en Tiempo Real (Socket.io)

1. El frontend establece una conexion WebSocket con el servidor al autenticarse.
2. El servidor verifica el JWT en socket.handshake.auth.token.
3. Si el token es valido, el socket se une a la sala "empleado\_{id}".
4. Si el usuario tiene rol de administrador, tambien se une a la sala "admins".
5. Cuando ocurre un evento (nuevo ticket, actualizacion de ticket, nueva solicitud), el servidor emite el evento a las salas correspondientes.
6. El frontend escucha los eventos y actualiza la interfaz en tiempo real.

---

## 4. REQUERIMIENTOS DEL SISTEMA

### 4.1 Requerimientos Funcionales

**RF-01: Autenticacion de Usuarios**

- El sistema debe permitir que los usuarios se autentiquen proporcionando correo electronico y contrasena.
- El sistema debe verificar que el usuario este activo antes de permitir el acceso.
- El sistema debe generar un token JWT con vigencia de 12 horas al autenticarse.
- El sistema debe registrar la fecha de entrada en el historial de accesos.
- El sistema debe permitir el cierre de sesion y registrar la fecha de salida.
- El sistema debe cerrar automaticamente las sesiones huerfanas (más de 12 horas sin salida).

**RF-02: Recuperacion de Contrasena**

- El sistema debe permitir al usuario solicitar un codigo de recuperacion por correo electronico.
- El codigo debe ser de 6 digitos numericos aleatorios.
- El codigo debe expirar despues de 10 minutos.
- El sistema debe limitar a 5 intentos fallidos de verificacion de codigo.
- La nueva contrasena debe cumplir la politica de seguridad corporativa (minimo 8 caracteres, una mayuscula, un numero y un caracter especial).

**RF-03: Gestion de Empleados**

- El administrador debe poder crear empleados con numero de empleado, nombre, apellidos, correo, contrasena, rol, departamento y sucursal.
- El administrador debe poder actualizar cualquier campo de un empleado existente.
- El administrador debe poder cambiar el estatus de un empleado (Activo/Inactivo).
- El sistema debe impedir que un empleado inactivo inicie sesion.
- El sistema nunca debe exponer el campo password en las respuestas de la API.
- El empleado debe poder actualizar su propio perfil, incluyendo foto, nombre, correo y contrasena.
- Para cambiar la contrasena, el sistema debe solicitar la contrasena actual como validacion.

**RF-04: Gestion de Tickets**

- El empleado debe poder crear un ticket especificando titulo, descripcion, prioridad, categoria y evidencias adjuntas (hasta 8 archivos).
- El sistema debe generar un folio unico con formato PTP-AAAAMM-NNN.
- El ticket se crea con estatus "En proceso" por defecto.
- El administrador debe poder listar todos los tickets con filtros por estatus, prioridad, tecnico, usuario, area, sucursal, fechas y busqueda por folio o titulo.
- El empleado debe poder listar unicamente sus propios tickets.
- El administrador debe poder asignar un tecnico y cambiar el estatus del ticket.
- Al resolver un ticket (estatus "Resuelto" o "No Resuelto"), el sistema debe registrar la fecha de resolucion.
- El empleado propietario debe poder calificar el ticket del 1 al 5 solo si el estatus es "Resuelto".
- El empleado debe poder cancelar su propio ticket solo si esta "En proceso".
- El empleado debe poder editar titulo, descripcion, prioridad y categoria de su ticket mientras este "En proceso".
- El sistema debe registrar un historial de cambios en la tabla historial_ticket.
- El sistema debe cerrar automaticamente como "No Resuelto" los tickets que superen 48 horas sin ser atendidos.

**RF-05: Gestion de Solicitudes de Insumos**

- El empleado debe poder crear una solicitud de insumos con prioridad y una lista de 1 a 50 insumos.
- El sistema debe generar un folio unico con formato SOL-AAAAMM-NNN.
- El sistema debe validar que los insumos existen y tienen stock suficiente al momento de crear la solicitud.
- El administrador debe poder revisar las solicitudes pendientes ordenadas por prioridad.
- El administrador debe poder aprobar o rechazar cada item individualmente.
- Al aprobar una solicitud, el sistema debe descontar el stock de los insumos aprobados.
- El sistema debe verificar si algun insumo quedo en nivel critico despues del descuento y emitir alertas.
- El sistema debe impedir eliminar un insumo que tenga solicitudes pendientes activas.

**RF-06: Gestion de Inventario**

- El administrador debe poder crear insumos con numero de serie, nombre, descripcion, marca, modelo, stock, estado, categoria, proveedor e imagen.
- El administrador debe poder actualizar y eliminar insumos.
- El sistema debe calcular la disponibilidad de un insumo segun su stock:
- stock = 0: "Sin stock"
- stock <= 5: "Stock bajo"
- stock > 5: "Disponible"
- El sistema debe alertar cuando el stock de un insumo sea <= 2.

**RF-07: Gestion de Manuales**

- El administrador debe poder subir manuales PDF individuales o en lote (hasta 20 archivos).
- El sistema debe almacenar los PDFs en el directorio /storage/Manuales.
- El administrador debe poder editar los metadatos del manual (nombre, descripcion, categoria).
- El administrador debe poder reemplazar el archivo PDF de un manual existente.
- El administrador debe poder eliminar un manual (registro y archivo).
- El empleado debe poder listar, buscar y visualizar los manuales con un visor PDF integrado.
- El sistema debe mostrar el tamano del archivo en formato legible (KB/MB).

**RF-08: Catálogo de Categorias**

- El sistema debe exponer las categorias disponibles filtradas por tipo de modulo (ticket, insumo, manual).
- Cada categoria debe indicar en que modulos puede usarse mediante banderas booleanas.

**RF-09: Reportes y Estadisticas**

- El sistema debe calcular el tiempo promedio de resolucion de tickets en horas.
- El sistema debe agrupar tickets por departamento.
- El sistema debe generar una tendencia mensual de tickets de los ultimos 6 meses.
- El administrador debe poder generar reportes de tickets filtrados por rango de fechas.
- El administrador debe poder generar reportes de solicitudes filtrados por rango de fechas.
- El sistema debe calcular metricas de rendimiento por tecnico: tickets atendidos, resueltos, tiempo promedio, calificacion promedio, resueltos a tiempo.
- El sistema debe generar paginas de impresion en PDF para tickets, solicitudes, historial, inventario y reportes.

**RF-10: Notificaciones en Tiempo Real**

- El sistema debe notificar al empleado cuando su ticket es creado (confirmacion).
- El sistema debe notificar a los administradores cuando se crea un nuevo ticket.
- El sistema debe notificar al empleado cuando su ticket cambia de estatus.
- El sistema debe notificar al empleado cuando su ticket entra en atencion.
- El sistema debe notificar a los administradores cuando un empleado califica un ticket.
- El sistema debe notificar a los administradores sobre alertas SLA.
- El sistema debe notificar a los administradores cuando hay tickets sin atender en 24 horas.
- El sistema debe notificar a los administradores sobre stock critico.
- El sistema debe notificar al empleado cuando su solicitud cambia de estatus.

**RF-11: Seguridad**

- El sistema debe cifrar las contrasenas con bcrypt (12 rounds).
- El sistema debe firmar los tokens JWT con JWT_SECRET.
- El sistema debe impedir el acceso a rutas sin token valido.
- El sistema debe impedir el acceso de empleados a rutas de administrador.
- El sistema debe proteger contra CSRF mediante el encabezado x-requested-with.
- El sistema debe proteger contra path traversal mediante safeResolvePath.
- El sistema debe validar todos los datos de entrada con esquemas Zod.
- El sistema debe aplicar rate limiting en rutas sensibles (30 tickets por hora por IP).
- El sistema debe bloquear el acceso a archivos .json y .env en /storage.
- El sistema debe manejar la revocacion de tokens al hacer logout.

### 4.2 Requerimientos No Funcionales

**RNF-01: Rendimiento**

- El sistema debe soportar hasta 2000 conexiones TCP simultaneas.
- El sistema debe mantener un pool de hasta 100 conexiones a MySQL.
- Las metricas del dashboard deben cacarse en memoria durante 2 minutos.
- Los catalogos estaticos deben cacarse durante 10 minutos.
- Las respuestas HTTP deben comprimirse con gzip o brotli.
- El keepAliveTimeout del servidor debe ser de 65 segundos.
- El headersTimeout debe ser de 70 segundos.

**RNF-02: Disponibilidad**

- El sistema debe estar disponible 24/7 en produccion.
- El servidor debe apagarse ordenadamente al recibir SIGTERM o SIGINT.
- El cierre debe cerrar el pool de conexiones MySQL antes de salir.
- Los workers no deben bloquear el cierre del proceso (unref).

**RNF-03: Seguridad**

- Las contrasenas deben cifrarse con bcrypt a 12 rounds.
- Los tokens JWT deben expirar despues de 12 horas.
- El sistema debe ocultar detalles de errores en produccion.
- Las consultas SQL deben ser parametrizadas para prevenir inyeccion SQL.
- El sistema debe aplicar Content-Security-Policy.
- El sistema debe bloquear el acceso a archivos sensibles.

**RNF-04: Mantenibilidad**

- El codigo debe seguir convenciones de nombres claras y consistentes.
- Cada archivo debe documentarse con JSDoc.
- La arquitectura debe seguir el patron MVC.
- Los modulos deben tener responsabilidades unicas y bien definidas.

**RNF-05: Usabilidad**

- La interfaz debe ser responsiva (dispositivos moviles, tabletas, escritorio).
- El sistema debe soportar modo claro y oscuro.
- La navegacion debe ser intuitiva con un menu lateral claro.
- Los formularios deben validar los datos antes de enviarlos al servidor.

**RNF-06: Compatibilidad**

- El sistema debe funcionar en navegadores modernos (Chrome 90+, Firefox 90+, Safari 14+, Edge 90+).
- El backend debe ejecutarse en Node.js 18 o superior.
- La base de datos debe ser MySQL 8.0 o superior.

---

## 5. STACK TECNOLOGICO

### 5.1 Tecnologias del Frontend

| Tecnologia       | Version | Proposito                                 |
| ---------------- | ------- | ----------------------------------------- |
| React            | 18.3.1  | Libreria principal de interfaz de usuario |
| React DOM        | 18.3.1  | Integracion de React con el DOM           |
| React Router DOM | 7.15.0  | Enrutamiento del lado del cliente         |
| Vite             | 6.3.5   | Bundler y servidor de desarrollo          |
| Tailwind CSS     | 4.1.7   | Framework de estilos utilitarios          |
| Lucide React     | 1.12.0  | Iconografia vectorial                     |
| Socket.io Client | 4.8.3   | Cliente de WebSockets para tiempo real    |
| pdfjs-dist       | 6.0.227 | Visor de PDF en el navegador              |
| jspdf            | 4.2.1   | Generacion de documentos PDF              |
| jspdf-autotable  | 5.0.8   | Tablas en documentos PDF                  |
| xlsx             | 0.18.5  | Generacion de archivos Excel              |
| xlsx-js-style    | 1.2.0   | Estilos en archivos Excel                 |
| file-saver       | 2.0.5   | Guardado de archivos descargados          |
| dompurify        | 3.4.11  | Sanitizacion de HTML                      |
| react-dom        | 18.3.1  | DOM virtual de React                      |

### 5.2 Tecnologias del Backend

| Tecnologia         | Version | Proposito                               |
| ------------------ | ------- | --------------------------------------- |
| Node.js            | 18+     | Runtime de JavaScript en el servidor    |
| Express            | 5.2.1   | Framework HTTP principal                |
| Socket.io          | 4.8.3   | Servidor de WebSockets                  |
| MySQL2             | 3.22.3  | Driver de conexion a MySQL con promesas |
| JSONWebToken       | 9.0.3   | Generacion y verificacion de tokens JWT |
| BcryptJS           | 3.0.3   | Cifrado de contrasenas                  |
| Nodemailer         | 9.0.1   | Envio de correos electronicos           |
| Multer             | 2.1.1   | Manejo de subida de archivos multipart  |
| Helmet             | 8.2.0   | Cabeceras de seguridad HTTP             |
| CORS               | 2.8.6   | Configuracion de acceso entre origenes  |
| Compression        | 1.8.1   | Compresion gzip/brotli de respuestas    |
| Express Rate Limit | 8.5.2   | Limites de peticiones por IP            |
| Zod                | 4.4.3   | Validacion de esquemas de datos         |
| Sharp              | 0.35.3  | Procesamiento de imagenes               |
| Canvas             | 3.2.3   | Generacion de portadas PDF              |
| ExcelJS            | 4.4.0   | Generacion de Excel avanzada            |
| file-type          | 22.0.1  | Deteccion de tipo de archivo            |
| Dotenv             | 17.4.2  | Gestion de variables de entorno         |

### 5.3 Herramientas de Desarrollo

| Herramienta       | Proposito                                                        |
| ----------------- | ---------------------------------------------------------------- |
| concurrently      | Ejecutar frontend y backend simultaneamente en desarrollo        |
| cross-env         | Variables de entorno multiplataforma                             |
| wait-on           | Esperar a que el backend este listo antes de iniciar el frontend |
| Vite Plugin React | Compilacion rapida de componentes React                          |

### 5.4 Infraestructura

- **Servidor en produccion:** Node.js con NODE_ENV=production
- **Base de datos:** MySQL en Railway (railway.json para despliegue automatizado)
- **Servidor estatico:** Express sirve el build de Vite en produccion
- **Proxy inverso:** Se confia en Nginx o Apache en produccion (trust proxy)

---

## 6. ESTRUCTURA DEL PROYECTO

### 6.1 Estructura de Directorios

```
PrecisionTrucks_HelpDesk/
|-- .env.example Archivo de ejemplo de variables de entorno
|-- .gitignore Exclusiones de control de versiones
|-- index.html Punto de entrada HTML de Vite
|-- package.json Dependencias y scripts del proyecto
|-- package-lock.json Resolucion bloqueada de dependencias
|-- railway.json Configuracion de despliegue en Railway
|-- vite.config.js Configuracion del bundler Vite
|
|-- docs/ Documentacion completa del sistema
| |-- README.md Indice de documentacion
| |-- database.sql Script de base de datos
| |-- ScrumFlujo.puml Diagrama PlantUML del flujo Scrum
| |-- profesional/
| | `-- DOCUMENTACION_PROFESIONAL.md Documentacion profesional completa (este archivo)
| |-- tecnica/
| | |-- ARQUITECTURA.md Diagrama y descripcion de arquitectura
| | |-- 3.5_DesarrolloTecnico.md Stack y decisiones tecnicas
| | |-- DiccionarioDatos.md Descripcion de tablas y campos de BD
| | |-- ESTRUCTURA_PROYECTO.md Detalle de estructura de carpetas
| | |-- DOCUMENTACION_INTERNA.md Estandares de documentacion de codigo
| | |-- IEEE830_Requerimientos.md Especificacion formal de requerimientos
| | `-- PruebasYValidacion.md Plan de pruebas y validacion
| |-- operacion/
| | |-- DESPLIEGUE.md Guia de despliegue en produccion
| | |-- SOLUCION_PDFS.md Soluciones para problemas de PDF
| | `-- MANUAL_MANTENIMIENTO_SOFTWARE.md
| `-- guia_usuario/
| |-- README.md Indice de guias de usuario
| `-- MANUAL_USO_SISTEMA.md Manual de uso del sistema
|
|-- public/
| |-- .htaccess Configuracion Apache para SPA
| `-- assets/ Imagenes publicas (logo, etc.)
|
|-- src/
| |-- main.jsx Punto de entrada de React
| |-- orientation.css Estilos de orientacion global
| |
| |-- Backend/ Codigo del servidor
| | |-- server.js Punto de entrada del servidor Express
| | |-- load-env.js Carga de variables de entorno
| | |
| | |-- Config/
| | | |-- cache.js Capa de cache en memoria
| | | |-- db.js Pool de conexiones MySQL
| | | |-- mailer.js Configuracion SMTP para correos
| | | `-- socketInstance.js Instancia compartida de Socket.io
| | |
| | |-- Controllers/
| | | |-- authController.js Autenticacion y empleados
| | | |-- categoriasController.js Catalogo de categorias
| | | |-- resetController.js Recuperacion de contrasena
| | | |-- solicitudesController.js Solicitudes e inventario
| | | `-- ticketsController.js Gestion de tickets
| | |
| | |-- Middlewares/
| | | |-- authMiddleware.js requireAuth y requireAdmin
| | | |-- security.js CSRF y path traversal
| | | |-- uploadEvidencias.js Subida de evidencias de tickets
| | | |-- uploadFotos.js Subida de fotos de perfil
| | | |-- uploadInsumos.js Subida de fotos de insumos
| | | |-- uploadManuales.js Subida de manuales PDF
| | | `-- validate.js Esquemas Zod y fabrica validate
| | |
| | |-- Models/
| | | |-- Categoria.js Modelo de categorias
| | | |-- Empleado.js Modelo de empleados y accesos
| | | |-- Insumo.js Modelo de insumos e inventario
| | | |-- Manual.js Modelo de manuales PDF
| | | |-- Solicitud.js Modelo de solicitudes de insumos
| | | `-- Ticket.js Modelo de tickets
| | |
| | |-- Routes/
| | | |-- authRoutes.js Rutas de autenticacion y empleados
| | | |-- categoriasRoutes.js Rutas de categorias
| | | |-- manualesRoutes.js Rutas de manuales PDF
| | | |-- solicitudesRoutes.js Rutas de solicitudes e inventario
| | | `-- ticketsRoutes.js Rutas de tickets
| | |
| | |-- Workers/
| | | |-- alert_state.json Estado persistente de alertas
| | | |-- alertState.js Sets persistentes de deduplicacion
| | | |-- reset_tokens.json Tokens de recuperacion en disco
| | | `-- scheduledJobs.js Trabajos programados en segundo plano
| | |
| | |-- scripts/
| | | |-- generatePortadas.js Genera portadas para PDFs existentes
| | | `-- migrate.js Script de migraciones
| | |
| | `-- utils/
| | |-- generarPortada.js Generador de portadas con Canvas
| | `-- helpers.js Utilidades transaccionales (generarFolio)
| |
| `-- Frontend/ Codigo de la interfaz
| |-- Components/
| | |-- CampanaNotificaciones.jsx Campana de notificaciones
| | |-- Card.jsx Tarjeta de contenedor
| | |-- ConfiguracionPerfilShared.jsx Formulario de perfil compartido
| | |-- DashboardShared.jsx Metricas, estadisticas, Kanban
| | |-- ErrorBoundary.jsx Manejo de errores de React
| | |-- Feedback.jsx Feedback visual de acciones
| | |-- FiltrosToolbar.jsx Barra de filtros reutilizable
| | |-- Icons.jsx Iconos personalizados
| | |-- ManualDetailPanel.jsx Panel de detalle de manual
| | |-- ManualTable.jsx Tabla de manuales
| | |-- Modal.jsx Componente de modal
| | |-- ModalReporte.jsx Modal de reportes
| | |-- PantallaSalida.jsx Pantalla de cierre de sesion
| | |-- PdfViewer.jsx Visor de PDF integrado
| | |-- PerfilShared.jsx Perfil compartido
| | |-- ProgressTimeline.jsx Linea de progreso de tickets
| | |-- StockBar.jsx Barra de stock para insumos
| | |-- ThemeToggle.jsx Interruptor de tema claro/oscuro
| | |-- PrintAccesosView.tsx Vista de impresion de accesos
| | |-- PrintHistorialView.tsx Vista de impresion de historial
| | |-- PrintInventarioView.tsx Vista de impresion de inventario
| | |-- PrintReporteListaView.tsx Vista de impresion de lista de reporte
| | |-- PrintReportView.tsx Vista de impresion de reporte
| | |-- PrintShared.tsx Componentes compartidos de impresion
| | |-- PrintSolicitudView.tsx Vista de impresion de solicitud
| | |-- print-report.css Estilos de impresion
| | |-- context/ Contextos de componentes
| | |-- hooks/ Hooks personalizados de componentes
| | `-- Inventario/ Componentes especificos de inventario
| |
| |-- Config/
| | |-- api.js Cliente HTTP centralizado
| | |-- DesignSystem.js Sistema de diseno (fuentes, espaciados)
| | |-- NotificationService.js Servicio de notificaciones
| | |-- pdfjs.js Configuracion de pdfjs-dist
| | |-- printUtils.ts Utilidades de impresion PDF
| | |-- session.js Gestion de sesion frontend
| | |-- theme.jsx Tema base (colores, tokens)
| | |-- themeContext.js Contexto de tema
| | |-- ThemeContext.jsx Contexto de tema alternativo
| | |-- themeTokens.js Tokens de tema para CSS
| | |-- useAutoRefresh.js Hook de auto-refresco periodico
| | |-- useSocket.js Hook de conexion Socket.io
| | `-- useTicketNotification.js Hook de notificaciones de tickets
| |
| |-- Pages/
| | |-- login.jsx Pagina de inicio de sesion
| | |-- PrintHistorialPage.tsx Pagina de impresion de historial
| | |-- PrintInventarioPage.tsx Pagina de impresion de inventario
| | |-- PrintReportePage.tsx Pagina de impresion de reporte
| | |-- PrintSolicitudPage.tsx Pagina de impresion de solicitud
| | |-- PrintTicketPage.tsx Pagina de impresion de ticket
| | |-- Admin/
| | | |-- ConfiguracionPerfil.jsx Configuracion de perfil de admin
| | | |-- Dashboard.jsx Dashboard principal de admin
| | | |-- HistorialIncidencias.jsx Historial de tickets de admin
| | | |-- HistorialInsumos.jsx Historial de solicitudes de admin
| | | |-- Inventario.jsx Gestion de inventario de admin
| | | |-- ManualesIncidencias.jsx Gestion de manuales de admin
| | | |-- Personal.jsx Gestion de empleados
| | | |-- RendimientoTecnicos.jsx Metricas de tecnicos
| | | |-- VistaSolicitud.jsx Detalle de solicitud de admin
| | | `-- VistaTicket.jsx Detalle de ticket de admin
| | `-- Usuario/
| | |-- ConfiguracionPerfil.jsx Configuracion de perfil de usuario
| | |-- Dashboard.jsx Dashboard principal de usuario
| | |-- HistorialIncidencias.jsx Historial de tickets de usuario
| | |-- HistorialInsumos.jsx Historial de solicitudes de usuario
| | |-- ManualesIncidencias.jsx Consulta de manuales de usuario
| | |-- NuevoReporte.jsx Formulario de nuevo ticket
| | |-- SolicitudInsumo.jsx Formulario de solicitud de insumos
| | |-- VistaInsumos.jsx Consulta de insumos de usuario
| | |-- VistaSolicitud.jsx Detalle de solicitud de usuario
| | `-- VistaTicket.jsx Detalle de ticket de usuario
| |
| `-- Styles/
| |-- design-system.css Estilos del sistema de diseno
| `-- login.css Estilos de la pagina de login
|
`-- storage/ Almacenamiento de archivos
 |-- Evidencias_Tickets/ Evidencias adjuntas a tickets
 |-- Fotos de Perfil/ Fotos de perfil de empleados
 |-- Insumos/ Fotos de insumos del inventario
 |-- Manuales/ Archivos PDF de manuales
 `-- Portadas/ Imagenes de portadas generadas para PDFs
```

### 6.2 Scripts del proyecto

| Script  | Comando         | Descripcion                                             |
| ------- | --------------- | ------------------------------------------------------- |
| dev     | npm run dev     | Inicia el servidor de desarrollo de Vite                |
| server  | npm run server  | Inicia el backend Express en modo produccion            |
| dev:all | npm run dev:all | Inicia backend y frontend simultaneamente en desarrollo |
| build   | npm run build   | Compila el frontend para produccion                     |
| preview | npm run preview | Previsualiza el build de produccion                     |

---

## 7. BASE DE DATOS

### 7.1 Diagrama Entidad-Relacion (conceptual)

```
---- ---- ----
| rol | | departamento | | sucursal |
|----| |----| |----|
| id_rol (PK)| | id_dep (PK) | | id_suc (PK) |
| nombre_rol | | nombre_dep | | nombre_suc |
`---------- `---------- `----------
 | | |
 | 1:N | 1:N | 1:N
 | | |
----
| empleado |
|----|
| id_empleado (PK) |
| num_empleado (UK) |
| nombre, ap_paterno, ap_materno |
| email (UK), password, foto |
| estatus (Activo/Inactivo) |
| id_rol (FK), id_departamento (FK), id_sucursal (FK) |
`--------------
 | |
 | 1:N | 1:N
 | |
---- ----
| historial_acceso | | ticket |
|----| |----|
| id_acceso (PK) | | id_ticket (PK) |
| id_empleado (FK) | | folio_ticket (UK) |
| fecha_entrada | | titulo, descripcion |
| fecha_salida | | estatus |
`------ | prioridad |
 | fecha_subido |
 | fecha_resuelto |
 | comentarios |
 | calificacion (1-5) |
 | id_empleado (FK) |
 | id_categoria (FK) |
 | id_tecnico (FK) |
 `----------
 | 1:N
 |
 ----
 | historial_ticket |
 |----|
 | id_historial (PK)|
 | campo_cambiado |
 | valor_anterior |
 | valor_nuevo |
 | fecha_cambio |
 | id_ticket (FK) |
 | id_empleado (FK) |
 `------

---- ----
| solicitud | | solicitud_insumo |
|----| |----|
| id_sol (PK) |<----| id_sol_ins (PK) |
| folio (UK) | 1:N | id_solicitud (FK)|
| fecha | | id_insumo (FK) |
| estatus | | cantidad |
| prioridad | | aprobado (0/1) |
| id_emp (FK) | | descripcion |
`------ `----------
 |
 ----
 | insumo |
 |----|
 | id_insumo (PK) |
 | num_serie (UK) |
 | nombre |
 | stock, estado |
 | id_cat (FK) |
 `------

---- ----
| manual | | categoria |
|----| |----|
| id_manual(PK)| | id_cat (PK) |
| nombre | | nombre_cat |
| descripcion | | en_tickets |
| fecha_subida| | en_insumos |
| fecha_cambio| | en_manuales |
| ruta_pdf | `----------
| id_cat (FK) |<----
`------

----
| token_revocado |
|----|
| id_revocado (PK) |
| jti (UK) |
| id_empleado (FK) |
| expira_en |
`------
```

### 7.2 Tablas de la Base de Datos

#### 7.2.1 Tabla `rol`

| Campo      | Tipo        | Restriccion | Descripcion                             |
| ---------- | ----------- | ----------- | --------------------------------------- |
| id_rol     | INT         | PRIMARY KEY | Identificador unico del rol             |
| nombre_rol | VARCHAR(50) | NOT NULL    | Nombre del rol (Administrador, Usuario) |

#### 7.2.2 Tabla `departamento`

| Campo               | Tipo         | Restriccion | Descripcion                          |
| ------------------- | ------------ | ----------- | ------------------------------------ |
| id_departamento     | INT          | PRIMARY KEY | Identificador unico del departamento |
| nombre_departamento | VARCHAR(100) | NOT NULL    | Nombre del departamento              |

#### 7.2.3 Tabla `sucursal`

| Campo           | Tipo         | Restriccion | Descripcion                        |
| --------------- | ------------ | ----------- | ---------------------------------- |
| id_sucursal     | INT          | PRIMARY KEY | Identificador unico de la sucursal |
| nombre_sucursal | VARCHAR(150) | NOT NULL    | Nombre de la sucursal              |

#### 7.2.4 Tabla `empleado`

| Campo           | Tipo                      | Restriccion                 | Descripcion                        |
| --------------- | ------------------------- | --------------------------- | ---------------------------------- |
| id_empleado     | INT                       | PRIMARY KEY, AUTO_INCREMENT | Identificador unico del empleado   |
| num_empleado    | VARCHAR(20)               | UNIQUE, NOT NULL            | Numero de empleado corporativo     |
| nombre          | VARCHAR(80)               | NOT NULL                    | Nombre del empleado                |
| ap_paterno      | VARCHAR(80)               | NOT NULL                    | Apellido paterno                   |
| ap_materno      | VARCHAR(80)               | NULLABLE                    | Apellido materno                   |
| email           | VARCHAR(150)              | UNIQUE, NOT NULL            | Correo institucional               |
| password        | VARCHAR(255)              | NOT NULL                    | Hash bcrypt de la contrasena       |
| foto            | VARCHAR(255)              | NULLABLE                    | Ruta relativa de la foto de perfil |
| estatus         | ENUM('Activo','Inactivo') | NOT NULL, DEFAULT 'Activo'  | Estado de la cuenta                |
| id_rol          | INT                       | FOREIGN KEY -> rol          | Rol asignado                       |
| id_departamento | INT                       | FOREIGN KEY -> departamento | Departamento asignado              |
| id_sucursal     | INT                       | FOREIGN KEY -> sucursal     | Sucursal asignada                  |

#### 7.2.5 Tabla `historial_acceso`

| Campo         | Tipo     | Restriccion                         | Descripcion              |
| ------------- | -------- | ----------------------------------- | ------------------------ |
| id_acceso     | INT      | PRIMARY KEY, AUTO_INCREMENT         | Identificador del acceso |
| id_empleado   | INT      | FOREIGN KEY -> empleado             | Empleado que accedio     |
| fecha_entrada | DATETIME | NOT NULL, DEFAULT CURRENT_TIMESTAMP | Momento del login        |
| fecha_salida  | DATETIME | NULLABLE                            | Momento del logout       |

#### 7.2.6 Tabla `token_revocado`

| Campo       | Tipo        | Restriccion                 | Descripcion                      |
| ----------- | ----------- | --------------------------- | -------------------------------- |
| id_revocado | INT         | PRIMARY KEY, AUTO_INCREMENT | Identificador del token revocado |
| jti         | VARCHAR(64) | UNIQUE, NOT NULL            | Identificador unico del JWT      |
| id_empleado | INT         | NOT NULL                    | Empleado dueno del token         |
| expira_en   | DATETIME    | NOT NULL                    | Momento de expiracion del token  |

#### 7.2.7 Tabla `categoria`

| Campo            | Tipo         | Restriccion | Descripcion                   |
| ---------------- | ------------ | ----------- | ----------------------------- |
| id_categoria     | INT          | PRIMARY KEY | Identificador de la categoria |
| nombre_categoria | VARCHAR(100) | NOT NULL    | Nombre de la categoria        |
| en_tickets       | TINYINT(1)   | DEFAULT 1   | Habilitada para tickets       |
| en_insumos       | TINYINT(1)   | DEFAULT 1   | Habilitada para insumos       |
| en_manuales      | TINYINT(1)   | DEFAULT 1   | Habilitada para manuales      |

#### 7.2.8 Tabla `ticket`

| Campo          | Tipo                                                    | Restriccion                         | Descripcion                            |
| -------------- | ------------------------------------------------------- | ----------------------------------- | -------------------------------------- |
| id_ticket      | INT                                                     | PRIMARY KEY, AUTO_INCREMENT         | Identificador del ticket               |
| folio_ticket   | VARCHAR(20)                                             | UNIQUE, NOT NULL                    | Folio con formato PTP-AAAAMM-NNN       |
| titulo         | VARCHAR(200)                                            | NOT NULL                            | Titulo descriptivo de la incidencia    |
| descripcion    | TEXT                                                    | NOT NULL                            | Descripcion detallada de la incidencia |
| estatus        | ENUM('En proceso','Resuelto','No Resuelto','Cancelado') | NOT NULL, DEFAULT 'En proceso'      | Estado actual del ticket               |
| prioridad      | ENUM('Urgente','Alta','Media','Baja')                   | NOT NULL                            | Nivel de prioridad                     |
| fecha_subido   | DATETIME                                                | NOT NULL, DEFAULT CURRENT_TIMESTAMP | Fecha de creacion                      |
| fecha_resuelto | DATETIME                                                | NULLABLE                            | Fecha de resolucion                    |
| comentarios    | TEXT                                                    | NULLABLE                            | Comentarios del tecnico                |
| calificacion   | TINYINT                                                 | NULLABLE                            | Calificacion del 1 al 5                |
| id_empleado    | INT                                                     | FOREIGN KEY -> empleado             | Empleado que reporto                   |
| id_categoria   | INT                                                     | FOREIGN KEY -> categoria            | Categoria del ticket                   |
| id_tecnico     | INT                                                     | FOREIGN KEY -> empleado             | Tecnico que atendio/resolvio           |

#### 7.2.9 Tabla `historial_ticket`

| Campo          | Tipo         | Restriccion                         | Descripcion                 |
| -------------- | ------------ | ----------------------------------- | --------------------------- |
| id_historial   | INT          | PRIMARY KEY, AUTO_INCREMENT         | Identificador del cambio    |
| id_ticket      | INT          | FOREIGN KEY -> ticket               | Ticket modificado           |
| id_empleado    | INT          | FOREIGN KEY -> empleado             | Empleado que hizo el cambio |
| campo_cambiado | VARCHAR(50)  | NOT NULL                            | Nombre del campo modificado |
| valor_anterior | VARCHAR(255) | NULLABLE                            | Valor previo                |
| valor_nuevo    | VARCHAR(255) | NULLABLE                            | Valor nuevo                 |
| fecha_cambio   | DATETIME     | NOT NULL, DEFAULT CURRENT_TIMESTAMP | Momento del cambio          |

#### 7.2.10 Tabla `insumo`

| Campo        | Tipo                                       | Restriccion                 | Descripcion                  |
| ------------ | ------------------------------------------ | --------------------------- | ---------------------------- |
| id_insumo    | INT                                        | PRIMARY KEY, AUTO_INCREMENT | Identificador del insumo     |
| num_serie    | VARCHAR(100)                               | UNIQUE, NULLABLE            | Numero de serie del articulo |
| nombre       | VARCHAR(150)                               | NOT NULL                    | Nombre del insumo            |
| descripcion  | VARCHAR(1000)                              | NULLABLE                    | Descripcion del insumo       |
| marca        | VARCHAR(100)                               | NULLABLE                    | Marca del articulo           |
| modelo       | VARCHAR(100)                               | NULLABLE                    | Modelo del articulo          |
| stock        | INT                                        | NOT NULL, DEFAULT 0         | Cantidad disponible          |
| estado       | ENUM('Excelente','Bueno','Regular','Malo') | NOT NULL                    | Condicion fisica             |
| id_categoria | INT                                        | FOREIGN KEY -> categoria    | Categoria del insumo         |
| proveedor    | VARCHAR(255)                               | NULLABLE                    | Proveedor del articulo       |
| imagen_url   | VARCHAR(255)                               | NULLABLE                    | Ruta de la foto del insumo   |

#### 7.2.11 Tabla `solicitud`

| Campo           | Tipo                                      | Restriccion                         | Descripcion                      |
| --------------- | ----------------------------------------- | ----------------------------------- | -------------------------------- |
| id_solicitud    | INT                                       | PRIMARY KEY, AUTO_INCREMENT         | Identificador de la solicitud    |
| folio_solicitud | VARCHAR(20)                               | UNIQUE, NOT NULL                    | Folio con formato SOL-AAAAMM-NNN |
| fecha           | DATETIME                                  | NOT NULL, DEFAULT CURRENT_TIMESTAMP | Fecha de creacion                |
| estatus         | ENUM('En proceso','Aceptado','Rechazado') | NOT NULL, DEFAULT 'En proceso'      | Estado de la solicitud           |
| prioridad       | ENUM('Urgente','Alta','Media','Baja')     | NOT NULL                            | Prioridad de la solicitud        |
| id_empleado     | INT                                       | FOREIGN KEY -> empleado             | Empleado solicitante             |

#### 7.2.12 Tabla `solicitud_insumo`

| Campo               | Tipo          | Restriccion                 | Descripcion                   |
| ------------------- | ------------- | --------------------------- | ----------------------------- |
| id_solicitud_insumo | INT           | PRIMARY KEY, AUTO_INCREMENT | Identificador del detalle     |
| id_solicitud        | INT           | FOREIGN KEY -> solicitud    | Solicitud asociada            |
| id_insumo           | INT           | FOREIGN KEY -> insumo       | Insumo solicitado             |
| cantidad            | INT           | NOT NULL                    | Cantidad solicitada           |
| aprobado            | TINYINT(1)    | NULLABLE                    | Estado de aprobacion del item |
| descripcion         | VARCHAR(1000) | NULLABLE                    | Nota adicional sobre el item  |

#### 7.2.13 Tabla `manual`

| Campo        | Tipo         | Restriccion                         | Descripcion                                      |
| ------------ | ------------ | ----------------------------------- | ------------------------------------------------ |
| id_manual    | INT          | PRIMARY KEY, AUTO_INCREMENT         | Identificador del manual                         |
| nombre       | VARCHAR(150) | NOT NULL                            | Nombre del manual                                |
| descripcion  | TEXT         | NULLABLE                            | Descripcion del manual                           |
| fecha_subida | DATETIME     | NOT NULL, DEFAULT CURRENT_TIMESTAMP | Fecha de subida                                  |
| fecha_cambio | DATETIME     | NULLABLE                            | Fecha de ultima modificacion                     |
| ruta_pdf     | VARCHAR(255) | NOT NULL                            | Ruta del PDF (ej. /storage/Manuales/archivo.pdf) |
| id_categoria | INT          | FOREIGN KEY -> categoria            | Categoria del manual                             |

### 7.3 Reglas de Integridad

1. **Integridad de claves foraneas:** Todas las tablas con relaciones usan claves foraneas con restricciones de integridad.

2. **Unicidad en folios:** Los folios de tickets y solicitudes son unicos para prevenir duplicados bajo concurrencia.

3. **Unicidad en correo electrónico:** El correo del empleado es unico en toda la tabla.

4. **Unicidad en numero de empleado:** El numero de empleado corporativo es unico.

5. **Unicidad en numero de serie:** El numero de serie de los insumos es unico.

6. **Integridad referencial en historial:** Las tablas de historial referencian integridad a sus tablas padre.

---

## 8. MODULOS FUNCIONALES

### 8.1 Modulo de Autenticacion

**Ubicacion:** src/Backend/Controllers/authController.js, src/Backend/Controllers/resetController.js

**Funcionalidades:**

- Login con correo y contrasena.
- Validacion de estatus activo del empleado.
- Generacion de JWT con expiracion de 12 horas.
- Registro de entrada en historial_acceso.
- Cierre de sesiones huerfanas previas.
- Logout con registro de salida.
- Revocacion de tokens JWT al hacer logout.
- Recuperacion de contrasena en 3 pasos:

1.  Solicitud de codigo (6 digitos) por correo.
2.  Verificacion del codigo.
3.  Restablecimiento de contrasena.

- Renovacion automatica de token (refreshToken).

### 8.2 Modulo de Empleados

**Ubicacion:** src/Backend/Controllers/authController.js

**Funcionalidades:**

- Creacion de empleados (solo admin).
- Actualizacion de empleados (solo admin).
- Actualizacion del perfil propio del empleado.
- Subida de foto de perfil.
- Listado de empleados (sin password).
- Obtencion de un empleado por ID.
- Listado de departamentos, roles y sucursales.
- Historial de accesos paginado por empleado o global (solo admin).

### 8.3 Modulo de Tickets

**Ubicacion:** src/Backend/Controllers/ticketsController.js, src/Backend/Models/Ticket.js

**Funcionalidades:**

- Creacion de tickets con evidencias adjuntas (maximo 8 archivos).
- Generacion de folios secuenciales PTP-AAAAMM-NNN.
- Listado de tickets con filtros multiples.
- Listado de tickets por empleado.
- Detalle de ticket por ID o folio.
- Actualizacion de estatus y asignacion de tecnico.
- Edicion de ticket por el usuario propietario.
- Cancelacion de ticket por el propietario.
- Calificacion de ticket (1-5) por el propietario.
- Agregar y eliminar imagenes de evidencia.
- Historial de cambios del ticket.
- Metricas del dashboard.
- Reportes por rango de fechas.
- Rendimiento de tecnicos.
- Listado de admins disponibles.

### 8.4 Modulo de Solicitudes e Inventario

**Ubicacion:** src/Backend/Controllers/solicitudesController.js, src/Backend/Models/Solicitud.js, src/Backend/Models/Insumo.js

**Funcionalidades:**

- Creacion de solicitudes de insumos con validacion de stock.
- Generacion de folios secuenciales SOL-AAAAMM-NNN.
- Listado de solicitudes por empleado.
- Detalle de solicitud.
- Listado de solicitudes pendientes ordenadas por prioridad.
- Listado general de solicitudes con filtros.
- Aprobacion individual de items de una solicitud.
- Aceptacion de solicitud con descuento de stock en transaccion.
- Rechazo de solicitud.
- CRUD completo de insumos.
- Subida de foto de insumo.
- Alerta de stock bajo/critico.
- Reporte de solicitudes por rango de fechas.
- Metricas de solicitudes.

### 8.5 Modulo de Manuales

**Ubicacion:** src/Backend/Routes/manualesRoutes.js, src/Backend/Models/Manual.js

**Funcionalidades:**

- Listado de manuales con tamano de archivo.
- Subida de un manual PDF individual.
- Subida masiva de manuales PDF (hasta 20 archivos).
- Edicion de metadatos de manual.
- Reemplazo de archivo PDF de manual.
- Eliminacion de manual (registro y archivo).
- Generacion automatica de portadas con Canvas.
- Visualizacion con visor PDF integrado.

### 8.6 Modulo de Categorias

**Ubicacion:** src/Backend/Controllers/categoriasController.js, src/Backend/Models/Categoria.js

**Funcionalidades:**

- Listado de todas las categorias.
- Listado filtrado por tipo de modulo (ticket, insumo, manual).

### 8.7 Modulo de Notificaciones

**Ubicacion:** src/Frontend/Components/CampanaNotificaciones.jsx, src/Frontend/Config/useTicketNotification.js, src/Backend/Workers/scheduledJobs.js

**Funcionalidades:**

- Campana de notificaciones con contador.
- Notificaciones en tiempo real via Socket.io.
- Deduplicacion de alertas para evitar spam.
- Alertas de SLA.
- Alertas de tickets sin atender.
- Alertas de stock critico.
- Notificaciones de cambio de estatus.

### 8.8 Modulo de Reportes e Impresion

**Ubicacion:** src/Frontend/Pages/Print*.tsx, src/Frontend/Components/Print*.tsx

**Funcionalidades:**

- Pagina de impresion de ticket.
- Pagina de impresion de solicitud.
- Pagina de impresion de historial de incidencias.
- Pagina de impresion de inventario.
- Pagina de impresion de reporte general.
- Generacion de PDFs con jspdf y autotable.
- Generacion de Excel con xlsx.
- Vistas de impresion optimizadas con CSS.

---

## 9. MODELO DE SEGURIDAD

### 9.1 Autenticacion

El sistema implementa autenticacion basada en tokens JWT (JSON Web Tokens). El flujo de autenticacion es:

1. El usuario envia correo y contrasena al endpoint POST /api/auth/login.
2. El sistema busca al empleado por correo, verifica que este activo.
3. El sistema compara la contrasena ingresada con el hash bcrypt almacenado.
4. Si las credenciales son correctas, se genera un JWT firmado con JWT_SECRET.
5. El JWT incluye id_empleado, id_rol y un identificador unico jti.
6. El token tiene una vigencia de 12 horas.
7. El token se envia al frontend, que lo almacena en localStorage bajo la clave "\_tk".
8. El frontend adjunta el token en el encabezado Authorization: Bearer {token} en cada peticion.
9. El middleware requireAuth verifica el token en cada peticion protegida.

### 9.2 Autorizacion por Rol

El sistema implementa control de acceso basado en roles mediante dos middlewares:

**requireAuth:** Verifica que el token JWT sea valido. Adjunta el payload al objeto req.usuario.

**requireAdmin:** Verifica que req.usuario.id_rol sea igual a 1 (administrador). Retorna 403 si no lo es.

### 9.3 Proteccion CSRF

El sistema implementa proteccion contra Cross-Site Request Forgery mediante el middleware csrfProtection:

1. Las peticiones de mutacion (POST, PUT, PATCH, DELETE) deben incluir el encabezado "x-requested-with: XMLHttpRequest".
2. Los navegadores no incluyen encabezados personalizados en peticiones cross-origin sin una preflight CORS exitosa.
3. Esto impide que un sitio malicioso envie peticiones silenciosas al sistema.
4. Las rutas exentas son: /login, /logout, /recuperar, /verificar-codigo, /reset-password.

### 9.4 Proteccion contra Path Traversal

El sistema implementa safeResolvePath en src/Backend/Middlewares/security.js:

1. Rechaza null bytes en las partes de la ruta.
2. Normaliza las rutas con path.normalize para colapsar segmentos "..".
3. Elimina prefijos de traversal residuales con una expresion regular.
4. Resuelve la ruta final y verifica que quede estrictamente dentro del directorio base.
5. Lanza un Error "Ruta no permitida" si se detecta un intento de traversal.

### 9.5 Proteccion contra Inyeccion SQL

El sistema utiliza exclusivamente consultas parametrizadas preparadas:

- pool.query("SELECT ... WHERE columna = ?", [valor])
- Esto impide que entradas maliciosas se interpreten como parte del SQL.

### 9.6 Validacion de Entrada

El sistema utiliza Zod para validar todos los datos de entrada del servidor:

- schemaLogin valida email y contrasena.
- schemaCrearTicket valida titulo, descripcion, prioridad y categoria.
- schemaActualizarTicket valida estatus y comentarios.
- schemaCalificarTicket valida calificacion 1-5.
- schemaCrearSolicitud valida prioridad, empleado y lista de insumos.
- schemaActualizarEstatusSolicitud valida estatus y items.
- schemaInsumo valida todos los campos del insumo.
- schemaFiltrosTickets valida los parametros de filtrado.

### 9.7 Politica de Contrasenas

La politica de contrasenas corporativa exige:

1. Minimo 8 caracteres.
2. Al menos una letra mayuscula.
3. Al menos un digito numerico.
4. Al menos un caracter especial.

### 9.8 Cifrado de Contrasenas

- Las contrasenas se cifran con bcryptjs a 12 rounds.
- El campo password nunca se incluye en respuestas de API.
- Existe un metodo separado findByIdConPassword que se usa solo para verificar la contrasena actual.

### 9.9 Revocacion de Tokens

- Al hacer logout, el sistema registra el jti del token en la tabla token_revocado.
- requireAuth verifica si el jti del token esta en la tabla de revocados antes de permitir el acceso.
- La tabla token_revocado se limpia periodicamente de tokens expirados.

### 9.10 Cabeceras de Seguridad HTTP

El sistema aplica las siguientes cabeceras de seguridad via Helmet:

| Cabecera                     | Valor                                    |
| ---------------------------- | ---------------------------------------- |
| Content-Security-Policy      | Política estricta con default-src 'self' |
| X-Content-Type-Options       | nosniff                                  |
| Cross-Origin-Resource-Policy | cross-origin (para visor de PDFs)        |
| Referrer-Policy              | strict-origin-when-cross-origin          |
| Cross-Origin-Opener-Policy   | deshabilitada                            |
| Strict-Transport-Security    | HSTS en produccion                       |

### 9.11 Restricciones de Archivos

- El directorio /storage bloquea archivos .json y .env.
- Los PDFs se sirven con Content-Type: application/pdf y X-Content-Type-Options: nosniff.
- Las imagenes se cachean por 7 dias.
- Las fotos de perfil requieren JWT valido para ser accedidas.

### 9.12 Rate Limiting

- Creacion de tickets: maximo 30 por hora por IP.
- Otros endpoints sensibles pueden aplicar limites similares.

### 9.13 Manejo de Errores

- En produccion, los errores 500 ocultan detalles internos.
- Los errores se registran en la consola del servidor.
- Los errores no capturados se manejan con uncaughtException y unhandledRejection.

---

## 10. MECANISMOS DE AUTENTICACION Y AUTORIZACION

### 10.1 Persistencia de Sesion en el Frontend

El sistema implementa persistencia de sesion en el navegador:

1. **En memoria:** El token se mantiene en una variable de modulo (\_token) para acceso sincrono rapido.
2. **localStorage:** El token se guarda bajo la clave "\_tk" para sobrevivir recargas F5.
3. **LocalStorage usuario:** Los datos publicos del empleado se guardan bajo la clave "usuario".
4. **LocalStorage id_acceso:** El id de la sesion activa se guarda para el logout.

### 10.2 Flujo de Renovacion de Sesion

Al montar la aplicacion:

1. main.jsx verifica si existe un token en localStorage.
2. Si existe, llama al endpoint POST /api/auth/refresh-token.
3. El backend verifica el token actual y genera uno nuevo con un jti distinto.
4. El nuevo token se guarda en localStorage.
5. La sesion se mantiene activa sin que el usuario vuelva a escribir credenciales.

### 10.3 Flujo de Logout

1. El usuario hace clic en "Cerrar sesion".
2. El frontend envia el id_acceso al endpoint POST /api/auth/logout.
3. El backend registra la fecha de salida en historial_acceso.
4. El backend revoca el jti del token actual en la tabla token_revocado.
5. El frontend limpia localStorage (token, usuario, id_acceso).
6. El frontend redirige a /login.
7. Al cerrar la pestana, sendBeacon envia el logout para no dejar sesiones huerfanas.

---

## 11. COMUNICACION EN TIEMPO REAL

### 11.1 Configuracion de Socket.io

El servidor crea una instancia de Socket.io montada sobre el servidor HTTP nativo:

```javascript
const io = new Server(httpServer, {
  cors: { origin: CORS_ORIGIN, methods: ["GET", "POST"], credentials: true },
});
```

### 11.2 Autenticacion de Socket.io

Cada conexion WebSocket debe presentar un JWT valido en socket.handshake.auth.token. El middleware de Socket.io verifica el JWT y adjunta el payload al socket.data.usuario.

### 11.3 Salas de Socket.io

| Sala           | Miembros                  | Proposito                                 |
| -------------- | ------------------------- | ----------------------------------------- |
| empleado\_{id} | Cada empleado             | Notificaciones personales                 |
| admins         | Todos los administradores | Notificaciones grupales de administracion |

### 11.4 Eventos de Socket.io

| Evento                | Emisor  | Receptor       | Descripcion                      |
| --------------------- | ------- | -------------- | -------------------------------- |
| ticket:confirmado     | Backend | empleado\_{id} | Confirma la creacion del ticket  |
| ticket:nuevo          | Backend | admins         | Nuevo ticket creado              |
| ticket:en_atencion    | Backend | ambos          | Ticket entrando en atencion      |
| ticket:actualizado    | Backend | ambos          | Ticket cambio de estatus         |
| ticket:calificado     | Backend | admins         | Empleado califico el ticket      |
| ticket:sla_warning    | Backend | admins         | Ticket proximo a vencer SLA      |
| ticket:sin_atender    | Backend | admins         | Ticket sin atender en 24h        |
| tickets:vencidos      | Backend | admins         | Tickets cerrados automaticamente |
| solicitud:nueva       | Backend | admins         | Nueva solicitud creada           |
| solicitud:actualizada | Backend | ambos          | Solicitud cambio de estatus      |
| insumo:stock_critico  | Backend | admins         | Insumo con stock critico         |

---

## 12. SISTEMA DE NOTIFICACIONES

### 12.1 Componentes del Sistema de Notificaciones

1. **CampanaNotificaciones.jsx:** Componente visual que muestra las notificaciones al usuario, con contador de no leidas, opciones de descartar individualmente o en lote, y boton para navegar al detalle.

2. **useTicketNotification.js:** Hook de React que gestiona la suscripcion a eventos de Socket.io, procesa cada evento de acuerdo a su tipo, mantiene la lista de notificaciones en estado local, y llama a la funcion onNavegar para actualizar la interfaz.

3. **NotificationService.js:** Servicio que centraliza la logica de creacion, deduplicacion y descarte de notificaciones.

4. **scheduledJobs.js:** Workers que emiten eventos de alerta programados (SLA, stock, tickets sin atender).

### 12.2 Flujo de Notificacion

1. Ocurre un evento de negocio (nuevo ticket, solicitud, alerta SLA).
2. El backend emite el evento por Socket.io a la sala correspondiente.
3. El frontend recibe el evento a traves del hook useTicketNotification.
4. El hook procesa el evento y lo agrega a la lista de notificaciones.
5. La campana muestra el contador incrementado.
6. El usuario hace clic en la notificacion.
7. El hook llama a onNavegar con el tipo y los datos del evento.
8. La interfaz carga el detalle correspondiente (ticket, solicitud) y actualiza las listas.

### 12.3 Deduplicacion de Alertas

- **Alertas SLA:** El Set slaAlertados evita emitir la misma alerta mas de una vez por ticket.
- **Alertas de stock:** El Set stockAlertados evita repetir alertas del mismo insumo. Se reinicia cada 24 horas.
- **Tickets sin atender:** El Set sinAtenderAlertados evita alertas repetidas. Se limpia cuando el ticket deja de estar pendiente.
- **Stock enviado por conexion:** El Set stockEnviadoHoy evita reenviar alertas de stock al mismo admin el mismo dia.

---

## 13. TRABAJOS PROGRAMADOS EN SEGUNDO PLANO

### 13.1 Workers Registrados

#### 13.1.1 Alertas SLA (cada 30 minutos)

- Busca tickets en estado "En proceso" que llevan mas de 2790 minutos abiertos (46.5 horas).
- Calcula el tiempo restante antes de superar el SLA de 48 horas.
- Emite el evento "ticket:sla_warning" a la sala "admins" con el folio, titulo, prioridad y tiempo restante.
- Usa deduplicacion para no emitir la misma alerta dos veces.

#### 13.1.2 Cierre automatico de tickets vencidos (cada 1 hora)

- Busca tickets "En proceso" sin tecnico asignado que superaron las 48 horas.
- Los cierra automaticamente como "No Resuelto" con fecha de resolucion.
- Notifica al empleado dueno con el evento "ticket:actualizado".
- Notifica a los admins con el evento "tickets:vencidos".
- Se ejecuta DESPUES del worker SLA para que la alerta se emita antes del cierre.

#### 13.1.3 Limpieza de sesiones huerfanas (cada 1 hora)

- Cierra registros de historial_acceso que llevan mas de 12 horas sin fecha de salida.
- Elimina registros de accesos con mas de 90 dias de antiguedad que ya tienen salida.
- Elimina tokens revocados expirados.

#### 13.1.4 Alertas de stock critico (cada 24 horas)

- Busca insumos con 5 o menos unidades en stock.
- Emite el evento "insumo:stock_critico" para cada insumo no alertado.
- Usa deduplicacion por insumo por dia.

#### 13.1.5 Tickets sin atender en 24 horas (cada 1 hora)

- Busca tickets "En proceso" sin tecnico asignado con mas de 24 horas de antiguedad.
- Emite el evento "ticket:sin_atender" a los admins con folio, titulo, prioridad y horas transcurridas.
- Usa deduplicacion por ticket.

### 13.2 Estado Persistente

- El estado de deduplicacion se persiste en archivos JSON dentro de src/Backend/Workers/.
- alert_state.json guarda los Sets de alertas.
- reset_tokens.json guarda los tokens de recuperacion de contrasena.
- Los archivos usan escritura atomica (archivo temporal + rename).

---

## 14. GESTION DE ARCHIVOS Y ALMACENAMIENTO

### 14.1 Directorios de Almacenamiento

| Directorio                  | Contenido                            | Acceso                    |
| --------------------------- | ------------------------------------ | ------------------------- |
| storage/Evidencias_Tickets/ | Imagenes y videos adjuntos a tickets | Publico con restricciones |
| storage/Fotos de Perfil/    | Fotos de perfil de empleados         | Requiere JWT              |
| storage/Insumos/            | Fotos de insumos del inventario      | Publico                   |
| storage/Manuales/           | Archivos PDF de manuales             | Publico con restricciones |
| storage/Portadas/           | Portadas generadas para PDFs         | Interno                   |

### 14.2 Middlewares de Subida

| Middleware          | Uso                   | Limites                                |
| ------------------- | --------------------- | -------------------------------------- |
| uploadEvidencias.js | Evidencias de tickets | 8 archivos, formatos de imagen y video |
| uploadFotos.js      | Fotos de perfil       | 1 archivo de imagen                    |
| uploadInsumos.js    | Fotos de insumos      | 1 archivo de imagen                    |
| uploadManuales.js   | Manuales PDF          | 1 archivo PDF individual o 20 en lote  |

### 14.3 Seguridad de Archivos

1. Los archivos .json y .env estan bloqueados en /storage (403).
2. Los PDFs se sirven con Content-Type correcto y nosniff.
3. Las imagenes se cachean por 7 dias (Cache-Control: public, max-age=604800).
4. Las fotos de perfil requieren autenticacion JWT.
5. safeResolvePath previene path traversal en operaciones de archivo.

---

## 15. GENERACION DE REPORTES Y EXPORTACIONES

### 15.1 Reportes del Sistema

1. **Metricas del Dashboard (GET /api/tickets/metricas):**

- Promedio de horas de resolucion.
- Tickets por departamento (total y resueltos).
- Tendencia mensual de los ultimos 6 meses (total, resueltos, no resueltos, en proceso).

2. **Reporte de Tickets (GET /api/tickets/reporte):**

- Filtros: rango de fechas, tecnico, estatus, prioridad, usuario, area, sucursal, texto.
- Incluye: folio, titulo, estatus, prioridad, fechas, calificacion, categoria, empleado, departamento, sucursal, tecnico.

3. **Reporte de Solicitudes (GET /api/solicitudes/reporte):**

- Filtros: rango de fechas.
- Incluye: folio, fecha, estatus, prioridad, empleado, departamento, sucursal, total insumos, total piezas, detalle de insumos.

4. **Rendimiento de Tecnicos (GET /api/tickets/rendimiento):**

- Tickets atendidos, resueltos, no resueltos, cancelados.
- Promedio, minimo y maximo de horas de resolucion.
- Calificacion promedio y porcentaje de calificados.
- Tickets de alta prioridad resueltos.
- Tickets en proceso activos.
- Porcentaje resueltos a tiempo (<= 48 horas).

### 15.2 Exportaciones

El sistema genera los siguientes documentos:

1. **PDF de ticket:** Muestra el detalle completo de un ticket con folio, estatus, prioridad, fechas, empleado, tecnico, comentarios y calificacion.

2. **PDF de solicitud:** Muestra el detalle de una solicitud con insumos, cantidades, estatus de aprobacion y fichas de cada insumo.

3. **PDF de historial:** Tabla de incidencias filtradas por rango de fechas con datos del ticket.

4. **PDF de inventario:** Listado de insumos con stock, categoria, marca, modelo y disponibilidad.

5. **PDF de reporte:** Tabla de tickets o solicitudes del reporte filtrado.

6. **Excel de reporte:** Exportacion de datos tabulares con xlsx incluyendo estilos.

### 15.3 Tecnologias de Exportacion

- **jspdf:** Generacion de documentos PDF basicos.
- **jspdf-autotable:** Generacion de tablas dentro de PDFs.
- **pdfjs-dist:** Visualizacion de PDFs en el navegador.
- **xlsx / xlsx-js-style:** Generacion de archivos Excel con estilos.
- **file-saver:** Descarga de archivos en el navegador.
- **canvas + sharp:** Generacion de portadas para PDFs.

---

## 16. DOCUMENTACION DE LA API

### 16.1 Rutas de Autenticacion (prefix: /api/auth)

| Metodo | Ruta                | Acceso             | Descripcion                        |
| ------ | ------------------- | ------------------ | ---------------------------------- |
| POST   | /login              | Publico            | Inicia sesion y devuelve JWT       |
| POST   | /logout             | Publico (validado) | Registra la salida y revoca token  |
| POST   | /recuperar          | Publico            | Solicita codigo de recuperacion    |
| POST   | /verificar-codigo   | Publico            | Verifica el codigo de recuperacion |
| POST   | /reset-password     | Publico            | Restablece la contrasena           |
| POST   | /refresh-token      | Autenticado        | Renueva el JWT                     |
| GET    | /empleados          | Admin              | Lista todos los empleados          |
| POST   | /empleados          | Admin              | Crea un empleado                   |
| GET    | /empleados/:id      | Admin              | Obtiene un empleado                |
| PUT    | /empleados/:id      | Admin              | Actualiza un empleado              |
| POST   | /empleados/:id/foto | Admin              | Sube foto de empleado              |
| GET    | /departamentos      | Autenticado        | Lista departamentos                |
| GET    | /roles              | Autenticado        | Lista roles                        |
| GET    | /sucursales         | Autenticado        | Lista sucursales                   |
| GET    | /accesos            | Admin              | Historial de accesos global        |
| GET    | /accesos/:id        | Admin              | Historial de un empleado           |
| PUT    | /perfil/:id         | Dueno              | Actualiza perfil propio            |
| POST   | /perfil/:id/foto    | Dueno              | Sube foto propia                   |

### 16.2 Rutas de Categorias (prefix: /api/categorias)

| Metodo | Ruta | Acceso      | Descripcion                            |
| ------ | ---- | ----------- | -------------------------------------- |
| GET    | /    | Autenticado | Lista categorias (con filtro por tipo) |

### 16.3 Rutas de Tickets (prefix: /api/tickets)

| Metodo | Ruta                         | Acceso        | Descripcion                             |
| ------ | ---------------------------- | ------------- | --------------------------------------- |
| GET    | /                            | Admin         | Lista todos los tickets con filtros     |
| POST   | /                            | Autenticado   | Crea un ticket (rate limit 30/h)        |
| GET    | /metricas                    | Admin         | Metricas del dashboard                  |
| GET    | /admins                      | Admin         | Lista administradores activos           |
| GET    | /reporte                     | Admin         | Reporte por rango de fechas             |
| GET    | /rendimiento                 | Admin         | Rendimiento de tecnicos                 |
| GET    | /folio/:folio                | Autenticado   | Busca ticket por folio                  |
| GET    | /empleado/:id                | Dueno o Admin | Tickets de un empleado                  |
| GET    | /:id_ticket                  | Dueno o Admin | Detalle del ticket                      |
| PATCH  | /:id_ticket                  | Admin         | Actualiza estatus, comentarios, tecnico |
| GET    | /:id_ticket/imagenes         | Dueno o Admin | Lista evidencias                        |
| POST   | /:id_ticket/imagenes         | Dueno o Admin | Agrega evidencias                       |
| DELETE | /:id_ticket/imagenes/:nombre | Dueno o Admin | Elimina evidencia                       |
| GET    | /:id_ticket/historial        | Dueno o Admin | Historial de cambios                    |
| PATCH  | /:id_ticket/calificar        | Dueno         | Califica ticket resuelto                |
| PATCH  | /:id_ticket/cancelar         | Dueno         | Cancela ticket                          |
| PUT    | /:id_ticket/editar           | Dueno         | Edita ticket en proceso                 |

### 16.4 Rutas de Solicitudes (prefix: /api/solicitudes)

| Metodo | Ruta                | Acceso        | Descripcion                         |
| ------ | ------------------- | ------------- | ----------------------------------- |
| GET    | /insumos            | Autenticado   | Lista insumos disponibles           |
| GET    | /inventario         | Admin         | Lista todo el inventario            |
| GET    | /insumos/stock-bajo | Admin         | Insumos con stock bajo              |
| POST   | /insumos            | Admin         | Crea un insumo                      |
| POST   | /insumos/:id/foto   | Admin         | Sube foto de insumo                 |
| PUT    | /insumos/:id        | Admin         | Actualiza un insumo                 |
| DELETE | /insumos/:id        | Admin         | Elimina un insumo                   |
| GET    | /pendientes         | Admin         | Solicitudes pendientes              |
| GET    | /metricas           | Admin         | Metricas de solicitudes             |
| GET    | /reporte            | Admin         | Reporte por rango de fechas         |
| GET    | /empleado/:id       | Dueno o Admin | Solicitudes de un empleado          |
| GET    | /                   | Admin         | Lista todas las solicitudes         |
| POST   | /                   | Autenticado   | Crea una solicitud                  |
| GET    | /:id                | Dueno o Admin | Detalle de solicitud                |
| PATCH  | /:id/estatus        | Admin         | Actualiza estatus y descuenta stock |
| PATCH  | /:id/items          | Admin         | Aprueba items individualmente       |
| GET    | /folio/:folio       | Dueno o Admin | Busca por folio                     |

### 16.5 Rutas de Manuales (prefix: /api/manuales)

| Metodo | Ruta            | Acceso      | Descripcion                |
| ------ | --------------- | ----------- | -------------------------- |
| GET    | /               | Autenticado | Lista todos los manuales   |
| POST   | /               | Admin       | Sube manual PDF individual |
| POST   | /batch          | Admin       | Sube manuales PDF en lote  |
| PUT    | /:id            | Admin       | Actualiza metadatos        |
| POST   | /:id/reemplazar | Admin       | Reemplaza el archivo PDF   |
| DELETE | /:id            | Admin       | Elimina manual y archivo   |

### 16.6 Rutas del Sistema

| Metodo | Ruta        | Acceso      | Descripcion                          |
| ------ | ----------- | ----------- | ------------------------------------ |
| GET    | /api/ping   | Publico     | Verifica que el servidor esta activo |
| GET    | /api/health | Autenticado | Estado de salud del servidor         |

---

## 17. VARIABLES DE ENTORNO

### 17.1 Variables Requeridas

| Variable    | Descripcion                          | Ejemplo                   |
| ----------- | ------------------------------------ | ------------------------- |
| JWT_SECRET  | Clave secreta para firmar tokens JWT | 64+ caracteres aleatorios |
| DB_HOST     | Host del servidor MySQL              | localhost                 |
| DB_USER     | Usuario de base de datos             | root                      |
| DB_PASSWORD | Contrasena de base de datos          | **\*\*\*\***              |
| DB_NAME     | Nombre de la base de datos           | precision_helpdesk        |

### 17.2 Variables Opcionales

| Variable     | Descripcion                      | Valor por Defecto     |
| ------------ | -------------------------------- | --------------------- |
| PORT         | Puerto del servidor backend      | 3001                  |
| CORS_ORIGIN  | Origen permitido para CORS       | http://localhost:5173 |
| APP_URL      | URL publica de la aplicacion     | http://localhost:5173 |
| NODE_ENV     | Entorno de ejecucion             | development           |
| DB_PORT      | Puerto de MySQL                  | 3306                  |
| DB_SSL       | Activa SSL para MySQL            | false                 |
| SMTP_HOST    | Servidor SMTP para correos       | (sin configurar)      |
| SMTP_PORT    | Puerto SMTP                      | 587                   |
| SMTP_USER    | Usuario SMTP                     | (sin configurar)      |
| SMTP_PASS    | Contrasena SMTP                  | (sin configurar)      |
| VITE_API_URL | URL de la API desde el navegador | (vacio = misma URL)   |

### 17.3 Validacion al Arrancar

El servidor valida que las variables requeridas esten definidas antes de arrancar. Si alguna falta, el proceso termina inmediatamente con codigo 1.

---

## 18. DESPLIEGUE Y ENTORNOS

### 18.1 Entorno de Desarrollo

```bash
# Clonar repositorio
git clone https://github.com/Matthew-Garay/Precision-Truck-Parts---Help-Desk.git

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env

# Editar .env
nano .env

# Iniciar backend y frontend simultaneamente
npm run dev:all
```

URLs:

- Frontend: http://localhost:5173
- Backend API: http://localhost:3001

### 18.2 Entorno de Produccion

```bash
# Compilar el frontend
npm run build

# Iniciar el servidor en modo produccion
NODE_ENV=production node --import ./src/Backend/load-env.js src/Backend/server.js
# o
npm run server
```

En produccion:

1. Express sirve el build de Vite (dist/) desde la raiz.
2. Las rutas no-API devuelven index.html para soportar SPA routing.
3. Se confia en el primer proxy inverso (trust proxy = 1).
4. Los errores 500 ocultan detalles internos.
5. Helmet aplica cabeceras de seguridad completas.

### 18.3 Despliegue en Railway

El archivo railway.json configura el despliegue automatizado:

```json
{
  // Configuracion del build:
  // - Compila el frontend con vite build
  // - Ejecuta el backend con NODE_ENV=production
  // - Variables de entorno de base de datos desde el servicio Railway
}
```

### 18.4 Configuracion de .htaccess

El archivo public/.htaccess configura Apache para:

- Redirigir todas las rutas a index.html (SPA routing).
- Establecer cabeceras de cache para archivos estaticos.
- Configurar compresion.

---

## 19. PRUEBAS Y VALIDACION

### 19.1 Niveles de Prueba

1. **Pruebas unitarias:** Cada funcion se prueba de forma aislada para verificar su comportamiento.

2. **Pruebas de integracion:** Se verifican las interacciones entre modulos (controladores, modelos, middleware).

3. **Pruebas de API:** Se prueban todos los endpoints REST con datos validos e invalidos.

4. **Pruebas de seguridad:** Se verifican los mecanismos de autenticacion, autorizacion, CSRF y path traversal.

5. **Pruebas de rendimiento:** Se verifica la capacidad del servidor bajo carga.

### 19.2 Casos de Prueba Criticos

1. Login con credenciales correctas.
2. Login con contrasena incorrecta (401).
3. Login con usuario inactivo (403).
4. Acceso a ruta protegida sin token (401).
5. Acceso a ruta de admin con rol de usuario (403).
6. Creacion de ticket con datos validos.
7. Creacion de ticket con campos faltantes (400).
8. Creacion de ticket con datos invalidos (422).
9. Creacion de solicitud con stock insuficiente (400).
10. Aceptacion de solicitud con descuento de stock correcto.
11. Calificacion de ticket ya calificado (409).
12. Calificacion de ticket no resuelto (400).
13. Cancelacion de ticket no propio (403).
14. Cancelacion de ticket no en proceso (409).
15. Eliminacion de insumo con solicitudes pendientes (409).
16. Recuperacion de contrasena con codigo correcto.
17. Recuperacion de contrasena con codigo incorrecto.
18. Recuperacion de contrasena expirada.
19. Recuperacion de contrasena con maximo de intentos superado.
20. Path traversal en la ruta de archivos.

### 19.3 Documento de Referencia

Para el plan detallado de pruebas ver: docs/tecnica/PruebasYValidacion.md

---

## 20. RENDIMIENTO Y OPTIMIZACION

### 20.1 Optimizaciones del Servidor

1. **Compresion gzip/brotli:** Todas las respuestas HTTP se comprimen con nivel 6 y umbral de 1024 bytes.

2. **Pool de conexiones MySQL:** Se mantienen hasta 100 conexiones simultaneas con cola de espera de 500.

3. **Caché en memoria:** Las consultas frecuentes se cachean para reducir carga en BD:

- Metricas del dashboard: 2 minutos.
- Listas de admins y tecnicos: 5 minutos.
- Catalogos (departamentos, roles, sucursales): 10 minutos.
- Nombres de empleados: 5 minutos.
- Lista de empleados: 2 minutos.

4. **Optimizaciones TCP del servidor HTTP:**

- keepAliveTimeout: 65 segundos.
- headersTimeout: 70 segundos.
- maxConnections: 2000.
- requestTimeout: 120 segundos.
- maxRequestsPerSocket: 1000.

5. **Cache de archivos estaticos:** Los archivos de imagenes y PDF en /storage se cachean por 7 dias.

### 20.2 Optimizaciones del Frontend

1. **Vite bundler:** Compilacion optimizada con tree-shaking y code-splitting.
2. **Tailwind CSS:** Generacion de CSS solo con las clases utilizadas.
3. **React.memo y useCallback:** Se evitan renderizaciones innecesarias.
4. **Actualizacion optimista:** Las listas solo se actualizan si el contenido cambia (JSON.stringify comparison).
5. **Auto-refresco:** Las metricas se actualizan cada 30 segundos.
6. **Socket.io:** Notificaciones sin recargar la pagina.

### 20.3 Optimizaciones de Base de Datos

1. Indices en columnas de busqueda frecuente (folios, estatus, fechas).
2. Consultas parametrizadas con FOR UPDATE para prevenir race conditions.
3. SQL_CALC_FOUND_ROWS para obtener totales sin consultas adicionales.
4. Group By con funciones agregadas para reportes.

---

## 21. MANTENIMIENTO Y OPERACION

### 21.1 Tareas de Mantenimiento

1. **Limpieza de sesiones huerfanas:** Automática cada hora (cierra sesiones de mas de 12 horas).
2. **Limpieza de historial de accesos:** Automática (elimina registros de mas de 90 dias).
3. **Limpieza de tokens revocados:** Automática (elimina tokens expirados).
4. **Backup de base de datos:** Recomendado diario.
5. **Backup de storage:** Recomendado diario.
6. **Monitoreo de espacio en disco:** Las evidencias, manuales y fotos acumulan espacio.

### 21.2 Monitoreo del Sistema

El endpoint GET /api/health (protegido) retorna:

```json
{
  "status": "ok",
  "uptime": 3600,
  "memory_mb": 150,
  "connections": {
    "total": 5,
    "free": 95,
    "queue": 0
  },
  "node_env": "production"
}
```

### 21.3 Cierre Ordenado

El servidor maneja SIGTERM y SIGINT:

1. Cierra el servidor HTTP (no acepta nuevas conexiones).
2. Espera a que las conexiones activas terminen.
3. Cierra el pool de conexiones MySQL.
4. Salida con codigo 0.
5. Timeout de 10 segundos como respaldo (codigo 1).

---

## 22. RESOLUCION DE PROBLEMAS COMUNES

### 22.1 El sistema no arranca

**Sintoma:** El proceso termina inmediatamente al arrancar.

**Causas posibles:**

1. Faltan variables de entorno obligatorias. Verificar: JWT_SECRET, DB_HOST, DB_USER, DB_PASSWORD, DB_NAME.
2. MySQL no esta corriendo. Verificar el servicio MySQL.
3. Credenciales de MySQL incorrectas.
4. El puerto esta ocupado.

**Solucion:**

1. Verificar que todas las variables existan en .env.
2. Iniciar MySQL (services.msc en Windows).
3. Verificar credenciales.
4. Cambiar PORT en .env.

### 22.2 Error de conexion a base de datos

**Sintoma:** El mensaje "MySQL no se pudo conectar" aparece al arrancar.

**Causas posibles:**

1. MySQL fuera de servicio.
2. Host o puerto incorrectos.
3. Usuario sin permisos.
4. Nombre de base de datos incorrecto.

**Solucion:**

1. Verificar servicio MySQL.
2. Verificar DB_HOST y DB_PORT.
3. Verificar el usuario tenga permisos.
4. Crear la base de datos con el nombre correcto.

### 22.3 Los PDFs no se visualizan

**Sintoma:** El visor de PDF esta en blanco o no carga.

**Causas posibles:**

1. Los archivos no existen en storage/Manuales.
2. Problemas de CORS al servir los PDFs.
3. El navegador bloquea el acceso cross-origin.

**Solucion:**

1. Verificar que el PDF exista en el directorio correcto.
2. Verificar Content-Security-Policy (connectSrc debe incluir ws:// y wss:// del host).
3. Regenerar portadas con el script de generacion.
4. Verificar que crossOriginResourcePolicy esta en "cross-origin".

### 22.4 Los correos no se envian

**Sintoma:** La recuperacion de contrasena no envia el correo.

**Causas posibles:**

1. Variables SMTP no configuradas.
2. Credenciales SMTP incorrectas.
3. Gmail requiere contrasena de aplicacion (no contrasena normal).

**Solucion:**

1. Configurar SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS.
2. Para Gmail habilitar "Verificacion en dos pasos" y generar "Contrasena de aplicacion".

### 22.5 El sistema esta lento

**Causas posibles:**

1. La base de datos no tiene indices en las columnas filtradas.
2. Hay muchas consultas sin cache.
3. El servidor tiene poca memoria.

**Solucion:**

1. Agregar indices a las columnas de filtrado (estatus, prioridad, fechas).
2. Revisar las consultas de reportes.
3. Considerar NODE_OPTIONS=--max-old-space-size=4096.

### 22.6 Formato de fechas incorrecto

**Causa:** La zona horaria de MySQL no coincide con la zona local.

**Solucion:** El pool de conexiones ya fija timezone: "-06:00" (Hermosillo, Mexico). Verificar que el sistema operativo de la base de datos use la zona correcta.

---

## 23. REFERENCIAS Y RECURSOS ADICIONALES

### 23.1 Documentacion del Proyecto

| Documento                                     | Descripcion                             |
| --------------------------------------------- | --------------------------------------- |
| docs/README.md                                | Indice general de documentacion         |
| docs/profesional/DOCUMENTACION_PROFESIONAL.md | Documentacion profesional integral      |
| docs/tecnica/ESTRUCTURA_PROYECTO.md           | Estructura de carpetas y archivos       |
| docs/tecnica/ARQUITECTURA.md                  | Diagrama y descripcion de arquitectura  |
| docs/tecnica/3.5_DesarrolloTecnico.md         | Stack tecnologico y decisiones          |
| docs/operacion/DESPLIEGUE.md                  | Guia de despliegue en produccion        |
| docs/tecnica/DiccionarioDatos.md              | Diccionario de datos de la base         |
| docs/tecnica/IEEE830_REQUERIMIENTOS.md        | Especificacion formal de requerimientos |
| docs/tecnica/PruebasYValidacion.md            | Plan de pruebas y validacion            |
| docs/operacion/SOLUCION_PDFS.md               | Soluciones para problemas con PDF       |
| docs/guia_usuario/MANUAL_USO_SISTEMA.md       | Manual de uso del sistema               |
| docs/ScrumFlujo.puml                          | Diagrama PlantUML del flujo Scrum       |

### 23.2 Repositorio

- **URL:** https://github.com/Matthew-Garay/Precision-Truck-Parts---Help-Desk.git

### 23.3 Dependencias de Referencia

| Tecnologia     | Documentacion                       |
| -------------- | ----------------------------------- |
| React          | https://react.dev/                  |
| Express        | https://expressjs.com/              |
| MySQL          | https://dev.mysql.com/doc/          |
| Socket.io      | https://socket.io/docs/             |
| Tailwind CSS   | https://tailwindcss.com/docs/       |
| Zod            | https://zod.dev/                    |
| JSON Web Token | https://jwt.io/                     |
| Nodemailer     | https://nodemailer.com/             |
| Multer         | https://github.com/expressjs/multer |
| Helmet         | https://helmetjs.github.io/         |
| Vite           | https://vite.dev/                   |
| pdf.js         | https://mozilla.github.io/pdf.js/   |
| jsPDF          | https://github.com/parallax/jsPDF   |

---

## FIN DE LA DOCUMENTACION

---

_Documento generado para el proyecto PrecisionTrucks HelpDesk - Precision Truck Parts, Parts and Accesories, S.A de C.V._
_Version 1.0.0 - Este documento constituye la referencia tecnica profesional integral del sistema._
