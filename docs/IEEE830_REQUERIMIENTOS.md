# Análisis de Requerimientos — Norma IEEE 830
## Precision Truck Parts, Parts and Accesories, S.A de C.V. HelpDesk

**Versión:** 1.0
**Sistema:** Precision Truck Parts, Parts and Accesories, S.A de C.V. HelpDesk
**Empresa:** Precision Truck Parts, Parts and Accesories, S.A de C.V.

---

## Requerimientos No Funcionales

---

### RNF-01

| Campo | Detalle |
|-------------------------------|---------|
| **Identificación** | RNF-01 |
| **Nombre** | Seguridad de contraseñas |
| **Características** | Las contraseñas deben almacenarse de forma segura usando hashing irreversible. Nunca se guardan en texto plano ni se devuelven en ninguna respuesta de la API. |
| **Descripción** | Las contraseñas se hashean con bcrypt usando 12 rounds antes de almacenarse en la tabla `empleado`. El campo `password` nunca se incluye en las respuestas JSON de ningún endpoint. Al cambiar la contraseña se requiere verificar la contraseña actual antes de generar el nuevo hash. |
| **Prioridad** | Alta |

---

### RNF-02

| Campo | Detalle |
|-------------------------------|---------|
| **Identificación** | RNF-02 |
| **Nombre** | Protección CSRF |
| **Características** | Todas las peticiones de mutación HTTP deben protegerse contra ataques de falsificación de solicitudes entre sitios. |
| **Descripción** | Todas las peticiones POST, PUT, PATCH y DELETE deben incluir el header `x-requested-with: XMLHttpRequest`. Las rutas públicas `/login`, `/logout`, `/recuperar`, `/verificar-codigo` y `/reset-password` están exentas. Si el header no está presente, el servidor responde con HTTP 403. |
| **Prioridad** | Alta |

---

### RNF-03

| Campo | Detalle |
|-------------------------------|---------|
| **Identificación** | RNF-03 |
| **Nombre** | Limitación de intentos (Rate Limiting) |
| **Características** | El sistema debe limitar la cantidad de peticiones por IP para prevenir abuso, fuerza bruta y denegación de servicio. |
| **Descripción** | Se aplican límites por IP: 10 intentos de login cada 15 minutos, 5 de recuperación de contraseña cada 15 minutos, 30 tickets por hora y 20 solicitudes de insumos por hora. Superado el límite, el servidor responde con HTTP 429. |
| **Prioridad** | Alta |

---

### RNF-04

| Campo | Detalle |
|-------------------------------|---------|
| **Identificación** | RNF-04 |
| **Nombre** | Protección de rutas de archivos (Path Traversal) |
| **Características** | El acceso a archivos del servidor debe restringirse estrictamente al directorio autorizado para cada tipo de recurso. |
| **Descripción** | La función `safeResolvePath()` valida que toda ruta de archivo resuelta quede dentro del directorio base autorizado. Rechaza null bytes y secuencias `../`. Los archivos `.json` y `.env` dentro de `/storage` son bloqueados. El acceso a fotos de perfil requiere JWT válido. |
| **Prioridad** | Alta |

---

### RNF-05

| Campo | Detalle |
|-------------------------------|---------|
| **Identificación** | RNF-05 |
| **Nombre** | Tiempo de respuesta de la API |
| **Características** | Las respuestas de la API deben ser ágiles para garantizar una experiencia de usuario fluida. |
| **Descripción** | Las respuestas de endpoints de listado y detalle deben completarse en menos de 2 segundos bajo carga normal. Los endpoints de métricas del dashboard utilizan caché en memoria para reducir consultas repetidas a la base de datos. Las consultas de reportes usan índices compuestos en las tablas `ticket` y `solicitud`. |
| **Prioridad** | Media |

---

### RNF-06

| Campo | Detalle |
|-------------------------------|---------|
| **Identificación** | RNF-06 |
| **Nombre** | Disponibilidad del sistema |
| **Características** | El sistema debe estar disponible de forma continua durante el horario laboral de la empresa. |
| **Descripción** | El servidor Node.js debe mantenerse activo durante el horario laboral (lunes a viernes, 8:00–18:00). Los workers de fondo utilizan `.unref()` para no bloquear el cierre limpio del proceso ante señales de terminación. El sistema no depende de servicios externos para su operación principal; el correo SMTP se omite silenciosamente si no está configurado. |
| **Prioridad** | Alta |

---

### RNF-07

| Campo | Detalle |
|-------------------------------|---------|
| **Identificación** | RNF-07 |
| **Nombre** | Compatibilidad de navegadores |
| **Características** | La interfaz debe funcionar correctamente en los navegadores modernos más utilizados por los empleados. |
| **Descripción** | La interfaz React debe funcionar correctamente en Chrome, Firefox, Edge y Safari en sus versiones actuales. El diseño es responsive para pantallas de escritorio y tablet. En dispositivos móviles en orientación horizontal se muestra un mensaje de rotación. |
| **Prioridad** | Media |

---

### RNF-08

| Campo | Detalle |
|-------------------------------|---------|
| **Identificación** | RNF-08 |
| **Nombre** | Cifrado y gestión de tokens JWT |
| **Características** | La identidad del usuario debe transmitirse de forma segura entre cliente y servidor mediante tokens firmados. |
| **Descripción** | La identidad del usuario se transmite mediante JWT firmado con `JWT_SECRET` usando el algoritmo HS256. El token tiene vigencia de 12 horas y puede renovarse mediante `POST /api/auth/refresh-token`. Los tokens revocados (logout) se registran en base de datos hasta su fecha de expiración y son rechazados en peticiones posteriores. |
| **Prioridad** | Alta |

---

### RNF-09

| Campo | Detalle |
|-------------------------------|---------|
| **Identificación** | RNF-09 |
| **Nombre** | Notificaciones en tiempo real (Socket.io) |
| **Características** | Los cambios de estado relevantes deben reflejarse en la interfaz de todos los usuarios afectados sin necesidad de recargar la página. |
| **Descripción** | El servidor emite eventos en tiempo real mediante Socket.io a salas específicas (`admins`, `empleado_{id}`). El cliente se suscribe al conectarse con JWT válido. Los eventos cubren: nuevos tickets, cambios de estatus, alertas SLA, stock crítico, solicitudes y tickets sin atender. El cliente reproduce sonidos de notificación mediante Web Audio API. |
| **Prioridad** | Alta |

---

### RNF-10

| Campo | Detalle |
|-------------------------------|---------|
| **Identificación** | RNF-10 |
| **Nombre** | Integridad y concurrencia en base de datos |
| **Características** | La base de datos debe soportar operaciones concurrentes sin generar duplicados en folios ni inconsistencias en el stock. |
| **Descripción** | La generación de folios `PTP-YYYYMM-NNN` y `SOL-YYYYMM-NNN` usa bloqueo `FOR UPDATE` en MySQL para garantizar unicidad bajo alta concurrencia. El descuento de stock al aprobar solicitudes se ejecuta dentro de una transacción atómica con `BEGIN / COMMIT / ROLLBACK`. La base de datos usa motor InnoDB con soporte completo de transacciones ACID. |
| **Prioridad** | Alta |

---

### RNF-11

| Campo | Detalle |
|-------------------------------|---------|
| **Identificación** | RNF-11 |
| **Nombre** | Soporte y restricción de archivos adjuntos |
| **Características** | El sistema debe permitir adjuntar archivos con restricciones de tipo MIME y tamaño según el contexto de uso. |
| **Descripción** | Las evidencias de tickets aceptan jpg, png, gif y webp con un máximo de 8 archivos por ticket. Los manuales aceptan únicamente PDF. Las fotos de perfil e imágenes de insumos aceptan formatos de imagen comunes. Multer gestiona cada tipo con middlewares independientes (`uploadEvidencias`, `uploadFotos`, `uploadManuales`, `uploadInsumos`). |
| **Prioridad** | Media |

---

### RNF-12

| Campo | Detalle |
|-------------------------------|---------|
| **Identificación** | RNF-12 |
| **Nombre** | Tema visual (claro/oscuro) |
| **Características** | La interfaz debe adaptarse a las preferencias visuales del usuario y persistir la selección entre sesiones. |
| **Descripción** | El sistema ofrece modo claro y oscuro persistido en `localStorage`. Los tokens de diseño se definen en `themeTokens.js` y se aplican mediante variables CSS. El cambio de tema es inmediato sin recargar la página. El componente `ThemeToggle` permite alternar entre modos desde cualquier pantalla. |
| **Prioridad** | Baja |

---

### RNF-13

| Campo | Detalle |
|-------------------------------|---------|
| **Identificación** | RNF-13 |
| **Nombre** | Exportación de reportes en PDF |
| **Características** | El sistema debe permitir exportar datos filtrados en formato PDF para su uso en informes y auditorías. |
| **Descripción** | Los administradores pueden exportar tickets y solicitudes filtrados por rango de fechas, técnico, estatus, área y sucursal en formato PDF generado en el cliente mediante jsPDF. El botón de exportación está disponible en los módulos de historial de incidencias e historial de insumos. |
| **Prioridad** | Media |

---

### RNF-14

| Campo | Detalle |
|-------------------------------|---------|
| **Identificación** | RNF-14 |
| **Nombre** | Purga automática de sesiones y tokens |
| **Características** | Las sesiones inactivas y los tokens revocados deben eliminarse automáticamente para liberar recursos y mantener la seguridad. |
| **Descripción** | Un worker ejecutado cada hora cierra registros de `historial_acceso` con más de 12 horas sin `fecha_salida`. El historial con más de 90 días de antigüedad se elimina automáticamente. Los tokens JWT revocados se limpian de la tabla de revocación una vez que su fecha de expiración ha pasado. |
| **Prioridad** | Media |

---

### RNF-15

| Campo | Detalle |
|-------------------------------|---------|
| **Identificación** | RNF-15 |
| **Nombre** | Validación de entradas con esquemas Zod |
| **Características** | Todos los datos de entrada enviados por el cliente deben validarse antes de ser procesados por los controladores. |
| **Descripción** | Todos los cuerpos de petición se validan con schemas Zod en el middleware `validate.js` antes de llegar al controlador. Los errores de validación retornan HTTP 400 con detalle del campo inválido. En producción, los mensajes de error internos no se exponen al cliente. |
| **Prioridad** | Alta |

---

### RNF-16

| Campo | Detalle |
|-------------------------------|---------|
| **Identificación** | RNF-16 |
| **Nombre** | Expiración y renovación de sesión |
| **Características** | Las sesiones activas deben tener una duración máxima definida para reducir el riesgo de tokens comprometidos. |
| **Descripción** | El JWT expira a las 12 horas de su emisión. El frontend puede renovarlo mediante `POST /api/auth/refresh-token` antes del vencimiento. Al hacer logout, el token se revoca inmediatamente en base de datos y es rechazado en cualquier petición posterior aunque no haya expirado. |
| **Prioridad** | Alta |

---

## Requerimientos Funcionales

---

### RF-01

| Campo | Detalle |
|-----------------------------------|---------|
| **Identificación** | RF-01 |
| **Nombre** | Autenticación de usuarios |
| **Características** | Garantizar que solo los empleados registrados y activos puedan acceder al sistema mediante sus credenciales personales. |
| **Descripción** | El sistema debe permitir a los empleados iniciar sesión con su correo electrónico y contraseña, verificando que el usuario exista y se encuentre activo, y cerrando la sesión automáticamente tras 12 horas. Al autenticarse correctamente, el sistema registra la entrada en `historial_acceso`, cierra sesiones huérfanas previas y retorna un JWT junto con los datos del usuario. |
| **Requerimiento NO funcional** | RNF-01, RNF-02, RNF-08, RNF-16 |
| **Prioridad** | Alta |

---

### RF-02

| Campo | Detalle |
|-----------------------------------|---------|
| **Identificación** | RF-02 |
| **Nombre** | Recuperación de contraseña |
| **Características** | Permitir a un empleado recuperar el acceso a su cuenta cuando olvida su contraseña, mediante un código de verificación enviado por correo electrónico. |
| **Descripción** | El sistema debe enviar un código numérico de 6 dígitos al correo del empleado registrado. El empleado debe ingresar el código para verificarlo y luego establecer una nueva contraseña. El código tiene vigencia limitada y el proceso está sujeto a un máximo de 5 intentos por cada 15 minutos. Si el SMTP no está configurado, el flujo se omite silenciosamente en desarrollo. |
| **Requerimiento NO funcional** | RNF-01, RNF-03, RNF-15, RNF-16 |
| **Prioridad** | Alta |

---

### RF-03

| Campo | Detalle |
|-----------------------------------|---------|
| **Identificación** | RF-03 |
| **Nombre** | Gestión de empleados |
| **Características** | Permitir al administrador crear, editar, activar o desactivar empleados y asignarles rol, departamento y sucursal. |
| **Descripción** | El administrador puede crear empleados con número de nómina, nombre, apellidos, correo, contraseña inicial, rol, departamento y sucursal opcional. Puede editar cualquier campo y cambiar el estatus a Inactivo sin eliminar físicamente al empleado, preservando el historial de tickets y solicitudes. También puede subir o reemplazar la foto de perfil de cualquier empleado. |
| **Requerimiento NO funcional** | RNF-01, RNF-08, RNF-15 |
| **Prioridad** | Alta |

---

### RF-04

| Campo | Detalle |
|-----------------------------------|---------|
| **Identificación** | RF-04 |
| **Nombre** | Gestión de perfil propio |
| **Características** | Permitir a cualquier empleado autenticado actualizar sus datos personales y cambiar su contraseña de forma segura. |
| **Descripción** | El empleado puede actualizar su nombre, apellidos y correo electrónico. Para cambiar la contraseña debe proporcionar la contraseña actual correcta. El sistema verifica que el `id` del parámetro de ruta coincida con el `id_empleado` del JWT, impidiendo que un usuario modifique el perfil de otro. El empleado también puede subir o reemplazar su propia foto de perfil. |
| **Requerimiento NO funcional** | RNF-01, RNF-08, RNF-15 |
| **Prioridad** | Media |

---

### RF-05

| Campo | Detalle |
|-----------------------------------|---------|
| **Identificación** | RF-05 |
| **Nombre** | Creación de tickets de soporte |
| **Características** | Permitir a cualquier empleado autenticado reportar una incidencia técnica con título, descripción, prioridad, categoría y evidencias fotográficas opcionales. |
| **Descripción** | El empleado completa un formulario con título, descripción, prioridad (Baja / Media / Alta / Urgente), categoría y hasta 8 imágenes de evidencia. El sistema genera un folio único `PTP-YYYYMM-NNN`, confirma la creación al empleado mediante el evento Socket.io `ticket:confirmado` y alerta a los administradores con el evento `ticket:nuevo`. El límite es de 30 tickets por hora por IP. |
| **Requerimiento NO funcional** | RNF-02, RNF-03, RNF-05, RNF-10, RNF-11, RNF-15 |
| **Prioridad** | Alta |

---

### RF-06

| Campo | Detalle |
|-----------------------------------|---------|
| **Identificación** | RF-06 |
| **Nombre** | Gestión de tickets (Administrador) |
| **Características** | Permitir al administrador gestionar el ciclo de vida completo de los tickets: asignar técnico, cambiar estatus y agregar comentarios de resolución. |
| **Descripción** | El administrador puede cambiar el estatus del ticket (En proceso -> Resuelto / No Resuelto), asignar un técnico responsable y agregar comentarios de resolución. Los cambios se notifican en tiempo real al empleado dueño mediante `ticket:actualizado` o `ticket:en_atencion`. Los tickets sin resolver en 48 horas se cierran automáticamente como "No Resuelto" por el worker de cierre automático. A las 46.5 horas se emite una advertencia `ticket:sla_warning` a los administradores. |
| **Requerimiento NO funcional** | RNF-02, RNF-05, RNF-08, RNF-09 |
| **Prioridad** | Alta |

---

### RF-07

| Campo | Detalle |
|-----------------------------------|---------|
| **Identificación** | RF-07 |
| **Nombre** | Historial de tickets |
| **Características** | Permitir a los empleados consultar el historial de sus propios tickets; los administradores pueden ver y filtrar todos los tickets del sistema. |
| **Descripción** | Los empleados ven sus propios tickets con filtros por estatus, prioridad y categoría. Los administradores ven todos los tickets del sistema con filtros adicionales por técnico, área, sucursal y rango de fechas. Ambas vistas son paginadas. Un empleado puede editar su ticket mientras esté en estatus "En proceso" y puede cancelarlo en cualquier momento antes de que sea cerrado. |
| **Requerimiento NO funcional** | RNF-05, RNF-08, RNF-10 |
| **Prioridad** | Media |

---

### RF-08

| Campo | Detalle |
|-----------------------------------|---------|
| **Identificación** | RF-08 |
| **Nombre** | Calificación de tickets |
| **Características** | Permitir al empleado dueño de un ticket calificar la atención recibida una vez que el ticket esté en estatus Resuelto. |
| **Descripción** | El empleado puede asignar una calificación de 1 a 5 estrellas a un ticket en estatus Resuelto. Solo el dueño del ticket puede calificar; la calificación no puede modificarse una vez registrada. El evento `ticket:calificado` se emite a los administradores con el folio, el nombre del empleado y la calificación otorgada. |
| **Requerimiento NO funcional** | RNF-02, RNF-08, RNF-15 |
| **Prioridad** | Media |

---

### RF-09

| Campo | Detalle |
|-----------------------------------|---------|
| **Identificación** | RF-09 |
| **Nombre** | Creación de solicitudes de insumos |
| **Características** | Permitir a cualquier empleado autenticado solicitar insumos del inventario especificando los artículos, cantidades y prioridad. |
| **Descripción** | El empleado selecciona uno o más insumos disponibles (stock > 0), especifica la cantidad de cada uno, agrega una justificación opcional y define la prioridad. El sistema genera un folio `SOL-YYYYMM-NNN` y notifica a los administradores en tiempo real mediante el evento `solicitud:nueva`. Un empleado no puede crear solicitudes en nombre de otro. El límite es de 20 solicitudes por hora por IP. |
| **Requerimiento NO funcional** | RNF-02, RNF-03, RNF-05, RNF-10, RNF-15 |
| **Prioridad** | Alta |

---

### RF-10

| Campo | Detalle |
|-----------------------------------|---------|
| **Identificación** | RF-10 |
| **Nombre** | Gestión de solicitudes de insumos (Administrador) |
| **Características** | Permitir al administrador revisar, aprobar o rechazar solicitudes de insumos de forma global o ítem por ítem, descontando el stock automáticamente al aprobar. |
| **Descripción** | El administrador puede aprobar o rechazar la solicitud completa o ítem por ítem. Al aprobar, el stock de los insumos aprobados se descuenta automáticamente dentro de una transacción atómica. Si algún insumo queda con stock ≤ 5 tras el descuento, se emite el evento `insumo:stock_critico` a los administradores. El estatus de la solicitud se notifica en tiempo real al empleado dueño mediante `solicitud:actualizada`. |
| **Requerimiento NO funcional** | RNF-02, RNF-05, RNF-08, RNF-09, RNF-10 |
| **Prioridad** | Alta |

---

### RF-11

| Campo | Detalle |
|-----------------------------------|---------|
| **Identificación** | RF-11 |
| **Nombre** | Gestión de inventario de insumos |
| **Características** | Permitir al administrador gestionar el catálogo completo de insumos con control de stock y alertas automáticas de reabastecimiento. |
| **Descripción** | El administrador puede crear insumos con nombre, descripción, marca, modelo, número de serie, stock inicial, estado físico, categoría, proveedor e imagen. Puede editar todos los campos y eliminar insumos que no tengan solicitudes activas pendientes (HTTP 409 si las tiene). El sistema emite alertas automáticas cuando el stock de un insumo llega a ≤ 5 unidades, tanto al aprobar solicitudes como mediante el worker de stock crítico que se ejecuta cada hora. |
| **Requerimiento NO funcional** | RNF-02, RNF-04, RNF-05, RNF-09, RNF-11 |
| **Prioridad** | Alta |

---

### RF-12

| Campo | Detalle |
|-----------------------------------|---------|
| **Identificación** | RF-12 |
| **Nombre** | Gestión de manuales PDF |
| **Características** | Permitir al administrador subir, editar y eliminar manuales PDF; todos los empleados autenticados pueden consultarlos y descargarlos. |
| **Descripción** | El administrador sube PDFs con título, descripción y categoría. Puede editar los metadatos y eliminar el manual, lo que también borra el archivo físico del servidor. Todos los empleados autenticados pueden listar, buscar y descargar los manuales disponibles (solo lectura). La portada del PDF se genera como miniatura en el frontend mediante `pdfjs-dist`. La ruta del archivo se protege con `safeResolvePath()`. |
| **Requerimiento NO funcional** | RNF-02, RNF-04, RNF-05, RNF-08, RNF-11 |
| **Prioridad** | Media |

---

### RF-13

| Campo | Detalle |
|-----------------------------------|---------|
| **Identificación** | RF-13 |
| **Nombre** | Notificaciones en tiempo real |
| **Características** | Notificar en tiempo real a administradores y empleados sobre eventos relevantes del sistema sin necesidad de recargar la página. |
| **Descripción** | El servidor emite eventos Socket.io a salas específicas: la sala `admins` recibe alertas de nuevos tickets, nuevas solicitudes, advertencias SLA, stock crítico y tickets sin atender más de 24 horas; la sala `empleado_{id}` recibe actualizaciones de sus propios tickets y solicitudes. El cliente reproduce sonidos de notificación mediante Web Audio API y muestra un panel de historial de notificaciones con la campana de notificaciones. |
| **Requerimiento NO funcional** | RNF-08, RNF-09, RNF-16 |
| **Prioridad** | Alta |

---

### RF-14

| Campo | Detalle |
|-----------------------------------|---------|
| **Identificación** | RF-14 |
| **Nombre** | Reportes y métricas del dashboard |
| **Características** | Proporcionar al administrador métricas del sistema en tiempo real y la capacidad de exportar reportes filtrados de tickets y solicitudes. |
| **Descripción** | El dashboard del administrador muestra métricas: total de tickets por estatus, tickets resueltos, tiempo promedio de resolución y calificación promedio. El módulo de rendimiento muestra métricas por técnico en un rango de fechas. Los reportes de tickets y solicitudes se exportan en PDF con filtros por fecha, técnico, estatus, área y sucursal. Los datos de métricas se cachean en memoria para reducir la carga sobre la base de datos. |
| **Requerimiento NO funcional** | RNF-05, RNF-08, RNF-13 |
| **Prioridad** | Media |

---

### RF-15

| Campo | Detalle |
|-----------------------------------|---------|
| **Identificación** | RF-15 |
| **Nombre** | Historial de accesos |
| **Características** | Permitir auditar los accesos al sistema registrando cada inicio y cierre de sesión de los empleados. |
| **Descripción** | Cada login exitoso registra una entrada en `historial_acceso` con fecha y hora de entrada. El logout registra la fecha de salida. El administrador puede consultar el historial global paginado de todos los empleados; cada empleado puede consultar únicamente el suyo. Las sesiones huérfanas (sin logout registrado) se cierran automáticamente tras 12 horas mediante el worker de limpieza. El historial con más de 90 días se elimina automáticamente. |
| **Requerimiento NO funcional** | RNF-08, RNF-14, RNF-16 |
| **Prioridad** | Baja |

---

*Documento generado conforme a la norma IEEE 830 — Especificación de Requerimientos de Software.*
