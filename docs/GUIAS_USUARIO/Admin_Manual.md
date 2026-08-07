# ‍ Manual del Administrador - PrecisionTrucks HelpDesk

**Guía completa para administradores del sistema.**

---

## Tabla de Contenidos

1. [Acceso Administrativo](#acceso-administrativo)
2. [Panel de Control](#panel-de-control)
3. [Gestión de Empleados](#gestión-de-empleados)
4. [Gestión de Manuales](#gestión-de-manuales)
5. [Gestión de Categorías](#gestión-de-categorías)
6. [Gestión de Insumos](#gestión-de-insumos)
7. [Reportes y Estadísticas](#reportes-y-estadísticas)
8. [Configuración del Sistema](#configuración-del-sistema)
9. [Auditoría y Logs](#auditoría-y-logs)
10. [Solución de Problemas](#solución-de-problemas)

---

## Acceso Administrativo

### Requisitos
- Rol: **Administrador**
- Acceso a: `https://helpdesk.precisiontrucks.com/admin`

### Verificar tu Rol
1. Haz clic en tu perfil (arriba a la derecha)
2. Verifica que diga "Administrador"
3. Si no ves opciones de admin, contacta al superadmin

---

## Panel de Control

### Elementos del Dashboard Administrativo

**Resumen General:**
- Total de tickets (abiertos, resueltos, cerrados)
- Total de empleados activos
- Solicitudes pendientes
- Manuales en el sistema

**Gráficos:**
- Tickets por estado
- Tickets por categoría
- Actividad por día
- Empleados más activos

**Alertas:**
- Tickets críticos sin asignar
- Solicitudes pendientes de aprobación
- Errores del sistema
- Espacio en disco bajo

---

## Gestión de Empleados

### Listar Empleados

1. Ve a **Administración > Empleados**
2. Visualiza tabla con:
 - Nombre
 - Email
 - Rol
 - Estado (Activo/Inactivo)
 - Última actividad

### Crear Nuevo Empleado

1. Haz clic en **Nuevo Empleado**
2. Completa el formulario:
 - **Nombre Completo**: Nombre y apellido
 - **Email**: Email corporativo único
 - **Rol**: Selecciona rol (Admin, Técnico, Usuario)
 - **Departamento**: Área de trabajo
 - **Teléfono**: Número de contacto

3. Haz clic en **Crear**
4. El sistema enviará credenciales por email

### Editar Empleado

1. Haz clic en el empleado
2. Modifica los campos necesarios
3. Haz clic en **Guardar**

### Cambiar Rol de Empleado

1. Abre el empleado
2. Ve a **Rol**
3. Selecciona nuevo rol:
 - **Admin**: Acceso completo
 - **Técnico**: Resuelve tickets
 - **Usuario**: Crea tickets

4. Haz clic en **Guardar**

### Desactivar Empleado

1. Abre el empleado
2. Haz clic en **Desactivar**
3. Confirma la acción
4. El empleado no podrá acceder al sistema

### Reactivar Empleado

1. Ve a **Empleados > Inactivos**
2. Selecciona el empleado
3. Haz clic en **Reactivar**

### Resetear Contraseña

1. Abre el empleado
2. Haz clic en **Resetear Contraseña**
3. Se enviará un email con instrucciones
4. El empleado deberá crear una nueva contraseña

---

## Gestión de Manuales

### Subir Manual PDF

1. Ve a **Administración > Manuales**
2. Haz clic en **Subir Manual**
3. Completa:
 - **Archivo PDF**: Selecciona el archivo
 - **Nombre**: Nombre del manual
 - **Descripción**: Descripción breve
 - **Categoría**: Categoría del manual
 - **Versión**: Número de versión (ej: 1.0)

4. Haz clic en **Subir**
5. El sistema generará automáticamente la portada

### Editar Manual

1. Ve a **Manuales**
2. Haz clic en el manual
3. Modifica:
 - Nombre
 - Descripción
 - Categoría
 - Versión

4. Haz clic en **Guardar**

### Eliminar Manual

1. Abre el manual
2. Haz clic en **Eliminar**
3. Confirma la acción
4. El manual se eliminará permanentemente

### Regenerar Portadas

Si las portadas no se generaron correctamente:

1. Ve a **Administración > Herramientas**
2. Haz clic en **Regenerar Portadas**
3. Selecciona los manuales
4. Haz clic en **Regenerar**
5. Espera a que se complete

### Descargar Manual

1. Abre el manual
2. Haz clic en **Descargar**
3. Se guardará en tu carpeta de descargas

---

## Gestión de Categorías

### Crear Categoría

1. Ve a **Administración > Categorías**
2. Haz clic en **Nueva Categoría**
3. Ingresa:
 - **Nombre**: Nombre de la categoría
 - **Descripción**: Descripción breve
 - **Icono**: Selecciona un icono

4. Haz clic en **Crear**

### Editar Categoría

1. Haz clic en la categoría
2. Modifica los campos
3. Haz clic en **Guardar**

### Eliminar Categoría

1. Abre la categoría
2. Haz clic en **Eliminar**
3. Confirma la acción

**Nota**: No puedes eliminar categorías que tengan manuales o insumos asociados.

---

## Gestión de Insumos

### Crear Insumo

1. Ve a **Administración > Insumos**
2. Haz clic en **Nuevo Insumo**
3. Completa:
 - **Nombre**: Nombre del insumo
 - **Código**: Código único
 - **Descripción**: Descripción detallada
 - **Categoría**: Categoría del insumo
 - **Stock**: Cantidad disponible
 - **Precio Unitario**: Costo
 - **Imagen**: Foto del insumo

4. Haz clic en **Crear**

### Editar Insumo

1. Abre el insumo
2. Modifica los campos
3. Haz clic en **Guardar**

### Actualizar Stock

1. Abre el insumo
2. Ve a **Stock**
3. Ingresa la nueva cantidad
4. Haz clic en **Actualizar**

### Eliminar Insumo

1. Abre el insumo
2. Haz clic en **Eliminar**
3. Confirma la acción

---

## Reportes y Estadísticas

### Generar Reporte de Tickets

1. Ve a **Reportes > Tickets**
2. Selecciona:
 - **Rango de Fechas**: Desde y hasta
 - **Estado**: Todos, Abiertos, Resueltos, etc.
 - **Categoría**: Filtrar por categoría
 - **Técnico**: Filtrar por técnico

3. Haz clic en **Generar**
4. Descarga en Excel o PDF

### Reporte de Solicitudes

1. Ve a **Reportes > Solicitudes**
2. Selecciona filtros
3. Haz clic en **Generar**
4. Descarga el reporte

### Estadísticas de Actividad

1. Ve a **Reportes > Estadísticas**
2. Visualiza:
 - Tickets por mes
 - Empleados más activos
 - Categorías más usadas
 - Tiempo promedio de resolución

### Exportar Datos

1. Ve a **Administración > Exportar**
2. Selecciona qué exportar:
 - Empleados
 - Tickets
 - Solicitudes
 - Manuales

3. Selecciona formato (Excel, CSV, JSON)
4. Haz clic en **Exportar**

---

## Configuración del Sistema

### Configuración General

1. Ve a **Administración > Configuración**
2. Modifica:
 - **Nombre de la Empresa**: PrecisionTrucks
 - **Email de Soporte**: soporte@precisiontrucks.com
 - **Teléfono**: +1-XXX-XXX-XXXX
 - **Dirección**: Ubicación de la empresa

3. Haz clic en **Guardar**

### Configuración de Email

1. Ve a **Configuración > Email**
2. Verifica:
 - **SMTP Host**: smtp.gmail.com
 - **SMTP Port**: 587
 - **Email**: tu_correo@gmail.com
 - **Contraseña**: Contraseña de aplicación

3. Haz clic en **Probar Conexión**
4. Si es exitoso, haz clic en **Guardar**

### Configuración de Seguridad

1. Ve a **Configuración > Seguridad**
2. Configura:
 - **Expiración de Sesión**: Horas (24)
 - **Intentos de Login**: Máximo (5)
 - **Bloqueo Temporal**: Minutos (15)
 - **Requerir HTTPS**: Sí/No

3. Haz clic en **Guardar**

### Configuración de Almacenamiento

1. Ve a **Configuración > Almacenamiento**
2. Verifica:
 - **Ruta de Manuales**: storage/Manuales/
 - **Ruta de Evidencias**: storage/Evidencias_Tickets/
 - **Ruta de Fotos**: storage/Fotos de Perfil/
 - **Tamaño Máximo de Archivo**: 50 MB

3. Haz clic en **Guardar**

---

## Auditoría y Logs

### Ver Logs de Actividad

1. Ve a **Administración > Auditoría**
2. Visualiza:
 - Usuario que realizó la acción
 - Tipo de acción
 - Fecha y hora
 - Detalles

### Filtrar Logs

1. Usa los filtros:
 - **Usuario**: Selecciona empleado
 - **Tipo**: Login, Crear, Editar, Eliminar
 - **Fecha**: Rango de fechas
 - **Recurso**: Tickets, Manuales, etc.

2. Haz clic en **Filtrar**

### Exportar Logs

1. Selecciona los logs
2. Haz clic en **Exportar**
3. Elige formato (Excel, CSV, PDF)
4. Descarga el archivo

### Limpiar Logs Antiguos

1. Ve a **Administración > Mantenimiento**
2. Haz clic en **Limpiar Logs**
3. Selecciona: Logs más antiguos de X días
4. Haz clic en **Limpiar**

---

## Solución de Problemas

### PDFs no se visualizan

**Problema**: Los manuales no cargan en el visor

**Soluciones**:
1. Verifica que los archivos existan en `storage/Manuales/`
2. Comprueba permisos: `chmod 644 storage/Manuales/*`
3. Regenera portadas desde **Herramientas > Regenerar Portadas**
4. Limpia caché del navegador
5. Verifica CORS en configuración

### Error de conexión a BD

**Problema**: "Cannot connect to database"

**Soluciones**:
1. Verifica que MySQL esté corriendo
2. Comprueba credenciales en `.env`
3. Reinicia el servidor
4. Revisa logs del servidor

### Emails no se envían

**Problema**: Recuperación de contraseña no funciona

**Soluciones**:
1. Verifica credenciales SMTP
2. Para Gmail: habilita "Contraseñas de aplicación"
3. Comprueba puerto SMTP (587)
4. Revisa logs del servidor

### Espacio en disco bajo

**Problema**: "Disk space low"

**Soluciones**:
1. Ve a **Administración > Almacenamiento**
2. Visualiza uso de espacio
3. Elimina archivos antiguos
4. Comprime manuales si es necesario

### Rendimiento lento

**Problema**: El sistema está lento

**Soluciones**:
1. Limpia caché: **Herramientas > Limpiar Caché**
2. Optimiza BD: **Herramientas > Optimizar BD**
3. Revisa logs de errores
4. Contacta a soporte técnico

---

## Soporte Técnico

Para problemas que no puedas resolver:

- **Email**: soporte@precisiontrucks.com
- **Teléfono**: +1-XXX-XXX-XXXX
- **Horario**: Lunes a Viernes, 8:00 AM - 5:00 PM

---

**Última actualización**: Agosto 2024
**Versión**: 1.0.0
