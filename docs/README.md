# Documentación - Precision Truck Parts HelpDesk

**Índice completo de documentación técnica, operativa y guías de usuario del sistema.**

---

## 📋 Estructura de Documentación

```
docs/
├── README.md                    ← Este índice
├── database.sql                 ← Script de creación de base de datos
├── ScrumFlujo.puml              ← Diagrama de flujo Scrum (PlantUML)
│
├── profesional/                 ← Documentación profesional integral
│   └── DOCUMENTACION_PROFESIONAL.md
│
├── tecnica/                     ← Documentación técnica para desarrolladores
│   ├── ARQUITECTURA.md
│   ├── 3.5_DesarrolloTecnico.md
│   ├── DiccionarioDatos.md
│   ├── ESTRUCTURA_PROYECTO.md
│   ├── DOCUMENTACION_INTERNA.md
│   ├── IEEE830_REQUERIMIENTOS.md
│   └── PruebasYValidacion.md
│
├── operacion/                   ← Documentación de operación y despliegue
│   ├── DESPLIEGUE.md
│   ├── SOLUCION_PDFS.md
│   └── MANUAL_MANTENIMIENTO_SOFTWARE.md
│
└── guia_usuario/                ← Guías para usuarios finales
    ├── README.md
    └── MANUAL_USO_SISTEMA.md
```

---

## 🚀 Inicio Rápido

¿Eres nuevo en el proyecto? Comienza aquí:

1. **[README Principal](../README.md)** — Descripción general del proyecto
2. **[Instalación](../README.md#instalación)** — Pasos para instalar y configurar
3. **[Manual de Uso](guia_usuario/MANUAL_USO_SISTEMA.md)** — Cómo usar la aplicación

---

## 📚 Documentación por Categoría

### Documentación Profesional

| Documento                                                                | Descripción                                                                                                      | Audiencia       |
| ------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------- | --------------- |
| [DOCUMENTACION_PROFESIONAL.md](profesional/DOCUMENTACION_PROFESIONAL.md) | Documentación técnica profesional integral: arquitectura, requerimientos, seguridad, API, despliegue y operación | Todos los roles |

### Documentación Técnica

| Documento                                                      | Descripción                                                 | Audiencia                    |
| -------------------------------------------------------------- | ----------------------------------------------------------- | ---------------------------- |
| [ARQUITECTURA.md](tecnica/ARQUITECTURA.md)                     | Diagrama de arquitectura, componentes y flujos de datos     | Desarrolladores, Arquitectos |
| [3.5_DesarrolloTecnico.md](tecnica/3.5_DesarrolloTecnico.md)   | Stack tecnológico, patrones de diseño y decisiones técnicas | Desarrolladores              |
| [DiccionarioDatos.md](tecnica/DiccionarioDatos.md)             | Descripción de tablas, campos y relaciones de la BD         | Desarrolladores, DBAs        |
| [ESTRUCTURA_PROYECTO.md](tecnica/ESTRUCTURA_PROYECTO.md)       | Estructura de carpetas, archivos y convenciones             | Desarrolladores              |
| [DOCUMENTACION_INTERNA.md](tecnica/DOCUMENTACION_INTERNA.md)   | Estándares de documentación de código                       | Desarrolladores              |
| [IEEE830_REQUERIMIENTOS.md](tecnica/IEEE830_REQUERIMIENTOS.md) | Especificación formal de requerimientos                     | Analistas, Stakeholders      |
| [PruebasYValidacion.md](tecnica/PruebasYValidacion.md)         | Plan de pruebas y casos de prueba                           | QA, Desarrolladores          |

### Operación y Despliegue

| Documento                                                                      | Descripción                                | Audiencia                |
| ------------------------------------------------------------------------------ | ------------------------------------------ | ------------------------ |
| [DESPLIEGUE.md](operacion/DESPLIEGUE.md)                                       | Guía de despliegue en producción (Railway) | DevOps, Administradores  |
| [SOLUCION_PDFS.md](operacion/SOLUCION_PDFS.md)                                 | Solución de problemas con PDFs             | Desarrolladores, Soporte |
| [MANUAL_MANTENIMIENTO_SOFTWARE.md](operacion/MANUAL_MANTENIMIENTO_SOFTWARE.md) | Manual de mantenimiento del software       | DevOps, Administradores  |

### Guías de Usuario

| Documento                                                   | Descripción                            | Audiencia                         |
| ----------------------------------------------------------- | -------------------------------------- | --------------------------------- |
| [MANUAL_USO_SISTEMA.md](guia_usuario/MANUAL_USO_SISTEMA.md) | Manual completo de uso del sistema     | Usuarios finales, Administradores |
| [Guías de Usuario](guia_usuario/README.md)                  | Índice de guías y preguntas frecuentes | Todos los usuarios                |

### Base de Datos y Diagramas

| Documento                          | Descripción                            | Audiencia          |
| ---------------------------------- | -------------------------------------- | ------------------ |
| [database.sql](database.sql)       | Script SQL para crear la base de datos | DBAs, DevOps       |
| [ScrumFlujo.puml](ScrumFlujo.puml) | Diagrama de flujo Scrum en PlantUML    | Equipo de Proyecto |

---

## 🔍 Búsqueda Rápida por Tema

### Tickets

- [Crear ticket](guia_usuario/MANUAL_USO_SISTEMA.md#4-tickets-de-soporte)
- [Gestionar tickets](guia_usuario/MANUAL_USO_SISTEMA.md#admin-gestionar-un-ticket)
- [API de tickets](../README.md#tickets)

### Manuales

- [Subir manual](guia_usuario/MANUAL_USO_SISTEMA.md#7-manuales)
- [Ver manual](guia_usuario/MANUAL_USO_SISTEMA.md#7-manuales)
- [Solución de problemas con PDFs](operacion/SOLUCION_PDFS.md)
- [API de manuales](../README.md#manuales)

### Insumos e Inventario

- [Solicitar insumo](guia_usuario/MANUAL_USO_SISTEMA.md#5-insumos)
- [Aprobar solicitudes](guia_usuario/MANUAL_USO_SISTEMA.md#admin-aprobar)
- [Gestionar inventario](guia_usuario/MANUAL_USO_SISTEMA.md#6-inventario-solo-admin)

### Usuarios y Personal

- [Gestionar personal](guia_usuario/MANUAL_USO_SISTEMA.md#8-personal-solo-admin)
- [Perfil de usuario](guia_usuario/MANUAL_USO_SISTEMA.md#10-perfil)
- [Recuperar contraseña](guia_usuario/MANUAL_USO_SISTEMA.md#2-inicio-de-sesion)

### Configuración y Despliegue

- [Variables de entorno](../README.md#configuración)
- [Base de datos](operacion/DESPLIEGUE.md)
- [Email](../README.md#configuración-de-email-gmail)
- [Despliegue en producción](operacion/DESPLIEGUE.md)

### Solución de Problemas

- [PDFs no se visualizan](operacion/SOLUCION_PDFS.md)
- [Error de conexión a BD](../README.md#error-de-conexión-a-bd)
- [Emails no se envían](../README.md#emails-no-se-envían)
- [Rendimiento lento](../README.md#rendimiento-lento)

---

## 👥 Matriz de Documentación por Rol

| Rol                        | Documentos Principales                                   | Documentos Secundarios                     |
| -------------------------- | -------------------------------------------------------- | ------------------------------------------ |
| **Desarrollador Backend**  | ARQUITECTURA, 3.5_DesarrolloTecnico, DiccionarioDatos    | ESTRUCTURA_PROYECTO, DOCUMENTACION_INTERNA |
| **Desarrollador Frontend** | ARQUITECTURA, 3.5_DesarrolloTecnico, ESTRUCTURA_PROYECTO | DOCUMENTACION_INTERNA                      |
| **DevOps/Administrador**   | DESPLIEGUE, SOLUCION_PDFS, MANUAL_MANTENIMIENTO          | ARQUITECTURA, DiccionarioDatos             |
| **QA/Tester**              | PruebasYValidacion, IEEE830_REQUERIMIENTOS               | MANUAL_USO_SISTEMA                         |
| **Administrador Sistema**  | MANUAL_USO_SISTEMA, SOLUCION_PDFS                        | DESPLIEGUE, DiccionarioDatos               |
| **Usuario Final**          | MANUAL_USO_SISTEMA                                       | guia_usuario/README                        |
| **Analista**               | IEEE830_REQUERIMIENTOS, ARQUITECTURA                     | DiccionarioDatos, PruebasYValidacion       |

---

## 🔗 Enlaces Útiles

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

---

## 📝 Convenciones de Documentación

### Formato

- Todos los documentos están en **Markdown**
- Usar **encabezados jerárquicos** (H1, H2, H3)
- Incluir **tabla de contenidos** en documentos largos

### Estructura

- **Encabezado**: Título y descripción breve
- **Tabla de Contenidos**: Para documentos > 500 líneas
- **Secciones**: Organizadas lógicamente
- **Ejemplos**: Código y casos de uso

### Actualización

- Actualizar cuando hay cambios significativos
- Incluir fecha de última actualización
- Mantener versión del documento
- Revisar enlaces regularmente

---

## 📌 Versiones de Documentación

| Versión   | Fecha       | Cambios                                                                          |
| --------- | ----------- | -------------------------------------------------------------------------------- |
| **1.0.0** | Agosto 2024 | Documentación inicial completa                                                   |
| **1.1.0** | Agosto 2026 | Documentación profesional integral y reorganización de estructura                |
| **1.2.0** | Agosto 2026 | Reorganización en categorías: profesional, técnica, operación y guías de usuario |

---

**Última actualización**: Agosto 2026
**Versión**: 1.2.0

---

<div align="center">

**¿No encuentras lo que buscas?**

[Crear Issue en GitHub](https://github.com/Matthew-Garay/Precision-Truck-Parts---Help-Desk/issues/new)

</div>
