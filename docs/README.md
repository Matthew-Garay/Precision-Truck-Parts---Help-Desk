# Documentación - Precision Truck Parts - HelpDesk

**Índice completo de documentación técnica y guías del proyecto de sistema de gestión de soporte técnico, inventario y manuales empresariales.**

---

## Inicio Rápido

¿Eres nuevo en el proyecto? Comienza aquí:

1. **[README Principal](../README.md)** - Descripción general del proyecto
2. **[Instalación Rápida](../README.md#-instalación)** - Pasos para instalar
3. **[Primeros Pasos](../README.md#-uso)** - Cómo usar la aplicación

---

## Documentación Técnica

### Arquitectura y Diseño

| Documento | Descripción | Audiencia |
|-----------|-------------|-----------|
| **[DOCUMENTACION_PROFESIONAL.md](DOCUMENTACION_PROFESIONAL.md)** | Documentación técnica profesional integral: arquitectura, cliente-servidor, requerimientos, seguridad, API, despliegue, operación | Todos los roles |
| **[Arquitectura.md](Arquitectura.md)** | Diagrama de arquitectura, componentes y flujos de datos | Desarrolladores, Arquitectos |
| **[3.5_DesarrolloTecnico.md](3.5_DesarrolloTecnico.md)** | Stack tecnológico, patrones de diseño y decisiones técnicas | Desarrolladores |
| **[ESTRUCTURA_PROYECTO.md](ESTRUCTURA_PROYECTO.md)** | Estructura de carpetas, archivos y convenciones | Desarrolladores |
| **[DOCUMENTACION_INTERNA.md](DOCUMENTACION_INTERNA.md)** | Estándares de documentación de código | Desarrolladores |

### Base de Datos

| Documento | Descripción | Audiencia |
|-----------|-------------|-----------|
| **[DiccionarioDatos.md](DiccionarioDatos.md)** | Descripción de tablas, campos y relaciones | Desarrolladores, DBAs |
| **[database.sql](database.sql)** | Script SQL para crear la base de datos | DBAs, DevOps |

### Despliegue y Operaciones

| Documento | Descripción | Audiencia |
|-----------|-------------|-----------|
| **[Despliegue.md](Despliegue.md)** | Guía de despliegue en producción (Railway) | DevOps, Administradores |
| **[SOLUCION_PDFS.md](SOLUCION_PDFS.md)** | Solución de problemas con PDFs | Desarrolladores, Soporte |

### Pruebas y Validación

| Documento | Descripción | Audiencia |
|-----------|-------------|-----------|
| **[PruebasYValidacion.md](PruebasYValidacion.md)** | Plan de pruebas y casos de prueba | QA, Desarrolladores |
| **[IEEE830_Requerimientos.md](IEEE830_Requerimientos.md)** | Especificación formal de requerimientos | Analistas, Stakeholders |

### Diagramas

| Documento | Descripción | Audiencia |
|-----------|-------------|-----------|
| **[ScrumFlujo.puml](ScrumFlujo.puml)** | Diagrama de flujo Scrum en PlantUML | Equipo de Proyecto |

---

## Guías de Usuario

### Para Administradores

 **[Admin_Manual.md](GUIAS_USUARIO/Admin_Manual.md)**

Guía completa para administradores del sistema:
- Gestión de usuarios y roles
- Configuración del sistema
- Gestión de manuales y categorías
- Reportes y estadísticas
- Mantenimiento del sistema

### Para Usuarios Finales

 **[Usuario_Manual.md](GUIAS_USUARIO/Usuario_Manual.md)**

Guía para usuarios normales:
- Crear y gestionar tickets
- Consultar manuales
- Solicitar insumos
- Perfil de usuario
- Preguntas frecuentes

### Índice de Guías

 **[GUIAS_USUARIO/README.md](GUIAS_USUARIO/README.md)**

Índice y descripción de todas las guías de usuario.

---

## Búsqueda Rápida por Tema

### Tickets
- [Crear ticket](GUIAS_USUARIO/Usuario_Manual.md#crear-ticket)
- [Asignar ticket](GUIAS_USUARIO/Admin_Manual.md#asignar-tickets)
- [Estados de ticket](GUIAS_USUARIO/Usuario_Manual.md#estados-de-ticket)
- [API de tickets](../README.md#tickets)

### Manuales
- [Subir manual](GUIAS_USUARIO/Admin_Manual.md#subir-manual)
- [Ver manual](GUIAS_USUARIO/Usuario_Manual.md#consultar-manuales)
- [Solución de problemas con PDFs](SOLUCION_PDFS.md)
- [API de manuales](../README.md#manuales)

### Insumos
- [Gestionar insumos](GUIAS_USUARIO/Admin_Manual.md#gestionar-insumos)
- [Solicitar insumo](GUIAS_USUARIO/Usuario_Manual.md#solicitar-insumo)
- [Aprobar solicitudes](GUIAS_USUARIO/Admin_Manual.md#aprobar-solicitudes)

### Usuarios
- [Crear usuario](GUIAS_USUARIO/Admin_Manual.md#crear-usuario)
- [Asignar roles](GUIAS_USUARIO/Admin_Manual.md#asignar-roles)
- [Cambiar contraseña](GUIAS_USUARIO/Usuario_Manual.md#cambiar-contraseña)

### Configuración
- [Variables de entorno](../README.md#configuración)
- [Base de datos](Despliegue.md#configuración-de-base-de-datos)
- [Email](../README.md#configuración-de-email-gmail)
- [CORS](SOLUCION_PDFS.md#solución-4-verificar-configuración-de-cors)

### Solución de Problemas
- [PDFs no se visualizan](SOLUCION_PDFS.md)
- [Error de conexión a BD](../README.md#error-de-conexión-a-bd)
- [Emails no se envían](../README.md#emails-no-se-envían)
- [Rendimiento lento](../README.md#rendimiento-lento)

---

## Documentación para Desarrolladores

### Primeros Pasos

1. **Leer**: [DOCUMENTACION_PROFESIONAL.md](DOCUMENTACION_PROFESIONAL.md)
2. **Entender**: [ESTRUCTURA_PROYECTO.md](ESTRUCTURA_PROYECTO.md)
3. **Aprender**: [Arquitectura.md](Arquitectura.md)
4. **Explorar**: [3.5_DesarrolloTecnico.md](3.5_DesarrolloTecnico.md)
5. **Documentar**: [DOCUMENTACION_INTERNA.md](DOCUMENTACION_INTERNA.md)

### Desarrollo

- **Backend**: [3.5_DesarrolloTecnico.md](3.5_DesarrolloTecnico.md#backend)
- **Frontend**: [3.5_DesarrolloTecnico.md](3.5_DesarrolloTecnico.md#frontend)
- **Base de Datos**: [DiccionarioDatos.md](DiccionarioDatos.md)
- **API**: [../README.md#-api](../README.md#-api)

### Testing

- **Plan de Pruebas**: [PruebasYValidacion.md](PruebasYValidacion.md)
- **Casos de Prueba**: [PruebasYValidacion.md#casos-de-prueba](PruebasYValidacion.md#casos-de-prueba)

### Despliegue

- **Producción**: [Despliegue.md](Despliegue.md)
- **Configuración**: [Despliegue.md#configuración](Despliegue.md#configuración)
- **Monitoreo**: [Despliegue.md#monitoreo](Despliegue.md#monitoreo)

---

## Matriz de Documentación

| Rol | Documentos Principales | Documentos Secundarios |
|-----|------------------------|------------------------|
| **Desarrollador Backend** | Arquitectura, 3.5_DesarrolloTecnico, DiccionarioDatos | ESTRUCTURA_PROYECTO, DOCUMENTACION_INTERNA |
| **Desarrollador Frontend** | Arquitectura, 3.5_DesarrolloTecnico, ESTRUCTURA_PROYECTO | DOCUMENTACION_INTERNA |
| **DevOps/Administrador** | Despliegue, SOLUCION_PDFS | Arquitectura, DiccionarioDatos |
| **QA/Tester** | PruebasYValidacion, IEEE830_Requerimientos | Usuario_Manual, Admin_Manual |
| **Administrador Sistema** | Admin_Manual, SOLUCION_PDFS | Despliegue, DiccionarioDatos |
| **Usuario Final** | Usuario_Manual | GUIAS_USUARIO/README |
| **Analista** | IEEE830_Requerimientos, Arquitectura | DiccionarioDatos, PruebasYValidacion |

---

## Enlaces Útiles

### Repositorio
- **GitHub**: https://github.com/Matthew-Garay/Precision-Truck-Parts---Help-Desk
- **Issues**: https://github.com/Matthew-Garay/Precision-Truck-Parts---Help-Desk/issues
- **Pull Requests**: https://github.com/Matthew-Garay/Precision-Truck-Parts---Help-Desk/pulls

### Tecnologías
- **Node.js**: https://nodejs.org/
- **React**: https://react.dev/
- **Express**: https://expressjs.com/
- **MySQL**: https://www.mysql.com/
- **Socket.io**: https://socket.io/

### Herramientas
- **Postman**: https://www.postman.com/
- **MySQL Workbench**: https://www.mysql.com/products/workbench/
- **Visual Studio Code**: https://code.visualstudio.com/

---

## Convenciones de Documentación

### Formato
- Todos los documentos están en **Markdown**
- Usar **encabezados jerárquicos** (H1, H2, H3)
- Incluir **tabla de contenidos** en documentos largos
- Usar **emojis** para mejorar legibilidad

### Estructura
- **Encabezado**: Título y descripción breve
- **Tabla de Contenidos**: Para documentos > 500 líneas
- **Secciones**: Organizadas lógicamente
- **Ejemplos**: Código y casos de uso
- **Notas**: Información importante

### Actualización
- Actualizar cuando hay cambios significativos
- Incluir fecha de última actualización
- Mantener versión del documento
- Revisar enlaces regularmente

---

## Versiones de Documentación

| Versión | Fecha | Cambios |
|---------|-------|---------|
| **1.0.0** | Agosto 2024 | Documentación inicial completa |
| **1.1.0** | Agosto 2026 | Agregada DOCUMENTACION_PROFESIONAL.md integral |

---

## Soporte y Contacto

### Reportar Problemas
- **Issues en GitHub**: https://github.com/Matthew-Garay/Precision-Truck-Parts---Help-Desk/issues
- **Email**: soporte@precisiontrucks.com

### Contribuir Documentación
1. Fork el repositorio
2. Crear rama: `git checkout -b docs/mejora`
3. Hacer cambios
4. Commit: `git commit -m "Mejorar documentación"`
5. Push: `git push origin docs/mejora`
6. Pull Request

---

## Checklist de Documentación

- [x] README principal actualizado
- [x] Documentación técnica completa
- [x] Guías de usuario disponibles
- [x] Solución de problemas documentada
- [x] Estructura de proyecto clara
- [x] Documentación interna de código
- [x] Índice de documentación
- [x] Enlaces verificados
- [x] Ejemplos de código incluidos
- [x] Versión documentada

---

## Mejoras Futuras

- [ ] Agregar video tutoriales
- [ ] Crear diagrama interactivo
- [ ] Documentación en otros idiomas
- [ ] API documentation con Swagger
- [ ] Guía de contribución
- [ ] Changelog detallado

---

**Última actualización**: Agosto 2024
**Versión**: 1.0.0

---

<div align="center">

**¿No encuentras lo que buscas?**

[Crear Issue en GitHub](https://github.com/Matthew-Garay/Precision-Truck-Parts---Help-Desk/issues/new)

</div>
