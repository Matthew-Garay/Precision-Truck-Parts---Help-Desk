# � Guías de Usuario - PrecisionTrucks HelpDesk

**Documentación completa para usuarios del sistema.**

---

## Tabla de Contenidos

- [Guías Disponibles](#guías-disponibles)
- [Seleccionar tu Rol](#seleccionar-tu-rol)
- [Preguntas Frecuentes](#preguntas-frecuentes)
- [Soporte](#soporte)

---

## � Guías Disponibles

### ‍ Para Administradores

 **[Admin_Manual.md](Admin_Manual.md)**

**Contenido**:
- Gestión de usuarios y roles
- Configuración del sistema
- Gestión de manuales y categorías
- Gestión de insumos
- Reportes y estadísticas
- Mantenimiento del sistema
- Solución de problemas

**Tiempo de lectura**: ~30 minutos

**Requisitos**: Acceso de administrador

---

### Para Usuarios Finales

 **[Usuario_Manual.md](Usuario_Manual.md)**

**Contenido**:
- Crear y gestionar tickets
- Consultar manuales
- Solicitar insumos
- Perfil de usuario
- Cambiar contraseña
- Preguntas frecuentes

**Tiempo de lectura**: ~15 minutos

**Requisitos**: Cuenta de usuario

---

## Seleccionar tu Rol

### ¿Eres Administrador?

Si tienes acceso a la sección **Administración**, lee:
1. [Admin_Manual.md](Admin_Manual.md) - Guía completa
2. [../SOLUCION_PDFS.md](../SOLUCION_PDFS.md) - Problemas con PDFs
3. [../Despliegue.md](../Despliegue.md) - Despliegue en producción

### ¿Eres Usuario Normal?

Si solo tienes acceso a **Tickets** y **Manuales**, lee:
1. [Usuario_Manual.md](Usuario_Manual.md) - Guía completa
2. Sección de [Preguntas Frecuentes](#preguntas-frecuentes)

### ¿Eres Técnico?

Si tienes acceso a **Tickets** y **Administración**, lee:
1. [Usuario_Manual.md](Usuario_Manual.md) - Funciones básicas
2. [Admin_Manual.md](Admin_Manual.md) - Funciones avanzadas
3. [../SOLUCION_PDFS.md](../SOLUCION_PDFS.md) - Problemas técnicos

---

## Preguntas Frecuentes

### Acceso y Autenticación

**P: ¿Olvidé mi contraseña?**

R: En la página de login, haz clic en "¿Olvidaste tu contraseña?" e ingresa tu email. Recibirás un enlace para resetearla.

**P: ¿Cómo cambio mi contraseña?**

R: Ve a tu perfil (esquina superior derecha) -> Configuración -> Cambiar contraseña.

**P: ¿Qué hago si no puedo acceder?**

R: Contacta al administrador en soporte@precisiontrucks.com

---

### Tickets

**P: ¿Cómo creo un ticket?**

R: Ve a **Tickets** -> **Nuevo Ticket** -> Completa el formulario -> Haz clic en **Crear**.

**P: ¿Cuál es la diferencia entre prioridades?**

R:
- **Baja**: Problema menor, puede esperar
- **Media**: Problema importante, resolver en 24h
- **Alta**: Problema urgente, resolver en 4h
- **Crítica**: Sistema caído, resolver inmediatamente

**P: ¿Puedo editar un ticket después de crearlo?**

R: Sí, si el ticket está en estado "Abierto". Una vez asignado, solo el técnico puede editarlo.

**P: ¿Cómo agrego evidencias a un ticket?**

R: Al crear o editar un ticket, hay una sección "Evidencias" donde puedes subir imágenes.

---

### Manuales

**P: ¿Cómo busco un manual?**

R: Ve a **Manuales** -> Usa la barra de búsqueda o filtra por categoría.

**P: ¿Puedo descargar un manual?**

R: Sí, abre el manual y haz clic en el botón **Descargar**.

**P: ¿Qué hago si un manual no carga?**

R: Intenta:
1. Recargar la página (F5)
2. Limpiar caché del navegador (Ctrl+Shift+Delete)
3. Contactar al administrador

---

### Insumos

**P: ¿Cómo solicito un insumo?**

R: Ve a **Solicitudes** -> **Nuevo Insumo** -> Selecciona el insumo -> Especifica cantidad -> Haz clic en **Solicitar**.

**P: ¿Cuánto tarda en aprobarse una solicitud?**

R: Normalmente 24-48 horas. El administrador te notificará por email.

**P: ¿Puedo cancelar una solicitud?**

R: Sí, si está en estado "Pendiente". Una vez aprobada, contacta al administrador.

---

### Reportes

**P: ¿Cómo genero un reporte?**

R: Ve a **Reportes** -> Selecciona el tipo -> Elige fechas -> Haz clic en **Generar**.

**P: ¿Puedo exportar un reporte?**

R: Sí, después de generar, haz clic en **Descargar PDF** o **Descargar Excel**.

---

## Soporte

### Contacto

- **Email**: soporte@precisiontrucks.com
- **Teléfono**: +1-XXX-XXX-XXXX
- **Chat**: Disponible en la aplicación (esquina inferior derecha)
- **Horario**: Lunes a Viernes, 8:00 AM - 5:00 PM

### Reportar un Problema

1. Describe el problema claramente
2. Incluye pasos para reproducirlo
3. Adjunta capturas de pantalla
4. Menciona tu navegador y versión
5. Envía a soporte@precisiontrucks.com

### Información Útil para Soporte

Cuando reportes un problema, incluye:
- **Navegador**: Chrome, Firefox, Safari, Edge
- **Sistema Operativo**: Windows, Mac, Linux
- **Versión del Navegador**: Ej: Chrome 120.0
- **URL donde ocurre**: Ej: http://localhost:5173/tickets
- **Pasos para reproducir**: Paso a paso
- **Captura de pantalla**: Del error o problema
- **Consola del navegador**: Errores (F12 -> Console)

---

## � Documentación Relacionada

- **[README Principal](../../README.md)** - Descripción general
- **[Documentación Técnica](../README.md)** - Para desarrolladores
- **[Solución de Problemas](../SOLUCION_PDFS.md)** - Problemas técnicos
- **[Estructura del Proyecto](../ESTRUCTURA_PROYECTO.md)** - Para desarrolladores

---

## Tutoriales Rápidos

### Tutorial 1: Crear tu Primer Ticket (5 min)

1. Inicia sesión
2. Ve a **Tickets**
3. Haz clic en **Nuevo Ticket**
4. Completa:
 - **Título**: Descripción breve del problema
 - **Descripción**: Detalles completos
 - **Categoría**: Selecciona la categoría
 - **Prioridad**: Selecciona la prioridad
5. Haz clic en **Crear Ticket**
6. ¡Listo! Tu ticket ha sido creado

### Tutorial 2: Consultar un Manual (3 min)

1. Ve a **Manuales**
2. Busca por nombre o filtra por categoría
3. Haz clic en el manual que deseas
4. Usa los controles:
 - **Anterior/Siguiente**: Navegar páginas
 - **Zoom**: Aumentar/disminuir tamaño
 - **Descargar**: Guardar en tu computadora

### Tutorial 3: Solicitar un Insumo (5 min)

1. Ve a **Solicitudes**
2. Haz clic en **Nuevo Insumo**
3. Selecciona el insumo del catálogo
4. Especifica la cantidad
5. Agrega comentarios (opcional)
6. Haz clic en **Solicitar**
7. Espera la aprobación del administrador

---

## Checklist de Primeros Pasos

- [ ] He iniciado sesión correctamente
- [ ] He actualizado mi perfil
- [ ] He cambiado mi contraseña
- [ ] He creado mi primer ticket
- [ ] He consultado un manual
- [ ] He solicitado un insumo
- [ ] Conozco cómo contactar a soporte

---

## Información de Contacto

| Departamento | Email | Teléfono | Horario |
|--------------|-------|----------|---------|
| **Soporte General** | soporte@precisiontrucks.com | +1-XXX-XXX-XXXX | Lun-Vie 8AM-5PM |
| **Administrador** | admin@precisiontrucks.com | +1-XXX-XXX-XXXX | Lun-Vie 8AM-5PM |
| **Emergencias** | emergencias@precisiontrucks.com | +1-XXX-XXX-XXXX | 24/7 |

---

**Última actualización**: Agosto 2024
**Versión**: 1.0.0

---

<div align="center">

**¿Necesitas ayuda?**

[Contactar Soporte](mailto:soporte@precisiontrucks.com)

</div>
