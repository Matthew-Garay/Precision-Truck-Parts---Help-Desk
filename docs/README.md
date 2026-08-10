# Documentación — PrecisionTrucks HelpDesk

**Índice de la documentación del sistema. Si no sabes por dónde empezar, ve a la sección "Inicio rápido".**

---

## 🚀 Inicio rápido

| Quiero... | Abro esto |
| --- | --- |
| **Usar el sistema** (usuario o administrador) | [MANUAL_DE_USO.md](manuales_residencia/MANUAL_DE_USO.md) |
| **Darle mantenimiento** (desarrollador/soporte) | [MANUAL_DE_MANTENIMIENTO.md](manuales_residencia/MANUAL_DE_MANTENIMIENTO.md) |
| **Entender cómo está armado** (cliente-servidor + MVC) | [ESTRUCTURA_PROYECTO.md](tecnica/ESTRUCTURA_PROYECTO.md) |
| **Instalar y levantar por primera vez** | [README principal](../README.md) y [DESPLIEGUE.md](operacion/DESPLIEGUE.md) |

Estos dos manuales de la residencia (uso y mantenimiento) son la fuente oficial y reemplazan a los manuales de uso/mantenimiento que existían antes.

---

## 📂 Estructura de la documentación

```
docs/
├── README.md                    ← Este índice
├── database.sql                 ← Script de creación de la base de datos
├── ScrumFlujo.puml              ← Diagrama de flujo Scrum (PlantUML)
│
├── manuales_residencia/         ← Manuales para la residencia (oficiales)
│   ├── MANUAL_DE_USO.md         ← Cómo usar el sistema (usuario y admin)
│   └── MANUAL_DE_MANTENIMIENTO.md ← Mantenimiento para desarrolladores
│
├── tecnica/                     ← Técnica para desarrolladores
│   ├── ARQUITECTURA.md
│   ├── 3.5_DesarrolloTecnico.md
│   ├── DiccionarioDatos.md
│   ├── ESTRUCTURA_PROYECTO.md   ← Mapa de carpetas y qué abre cada cosa
│   ├── DOCUMENTACION_INTERNA.md
│   ├── IEEE830_REQUERIMIENTOS.md
│   └── PruebasYValidacion.md
│
├── operacion/                   ← Operación y despliegue
│   ├── DESPLIEGUE.md
│   └── SOLUCION_PDFS.md
│
└── profesional/                 ← Documentación profesional integral
    └── DOCUMENTACION_PROFESIONAL.md
```

---

## 📚 Índice por categoría

### Manuales de la residencia

| Documento | Descripción | Audiencia |
| --- | --- | --- |
| [MANUAL_DE_USO.md](manuales_residencia/MANUAL_DE_USO.md) | Uso por pantallas: usuario y administrador | Usuarios, Administradores |
| [MANUAL_DE_MANTENIMIENTO.md](manuales_residencia/MANUAL_DE_MANTENIMIENTO.md) | Mantenimiento, respaldos, fallas | Devops, Administradores |

### Técnica (desarrolladores)

| Documento | Descripción | Audiencia |
| --- | --- | --- |
| [ESTRUCTURA_PROYECTO.md](tecnica/ESTRUCTURA_PROYECTO.md) | Mapa de carpetas y arquitectura cliente/servidor MVC | Desarrolladores |
| [ARQUITECTURA.md](tecnica/ARQUITECTURA.md) | Diagramas, componentes y flujos de datos | Desarrolladores, Arquitectos |
| [3.5_DesarrolloTecnico.md](tecnica/3.5_DesarrolloTecnico.md) | Stack tecnológico y decisiones | Desarrolladores |
| [DiccionarioDatos.md](tecnica/DiccionarioDatos.md) | Tablas y campos de la base | Desarrolladores, DBAs |
| [DOCUMENTACION_INTERNA.md](tecnica/DOCUMENTACION_INTERNA.md) | Estándares de documentación de código | Desarrolladores |
| [IEEE830_REQUERIMIENTOS.md](tecnica/IEEE830_REQUERIMIENTOS.md) | Especificación de requerimientos | Analistas |
| [PruebasYValidacion.md](tecnica/PruebasYValidacion.md) | Plan y casos de prueba | QA, Desarrolladores |

### Profesional

| Documento | Descripción | Audiencia |
| --- | --- | --- |
| [DOCUMENTACION_PROFESIONAL.md](profesional/DOCUMENTACION_PROFESIONAL.md) | Documentación integral del proyecto | Todos los roles |

### Operación y despliegue

| Documento | Descripción | Audiencia |
| --- | --- | --- |
| [DESPLIEGUE.md](operacion/DESPLIEGUE.md) | Despliegue en producción | DevOps, Administradores |
| [SOLUCION_PDFS.md](operacion/SOLUCION_PDFS.md) | Solución de problemas con PDFs | Soporte, Desarrolladores |

### Base de datos y diagramas

| Documento | Descripción | Audiencia |
| --- | --- | --- |
| [database.sql](database.sql) | Script SQL de la base de datos | DBAs, DevOps |
| [ScrumFlujo.puml](ScrumFlujo.puml) | Diagrama de flujo Scrum (PlantUML) | Equipo de proyecto |

---

## 🧭 Problemas comunes

| Problema | Dónde buscar |
| --- | --- |
| El sistema no arranca / está lento / se cayó | [MANUAL_DE_MANTENIMIENTO.md](manuales_residencia/MANUAL_DE_MANTENIMIENTO.md#13-fallas-comunes-y-cómo-resolverlas) |
| No sé qué archivo hace qué | [ESTRUCTURA_PROYECTO.md](tecnica/ESTRUCTURA_PROYECTO.md) |
| Un PDF no se visualiza | [SOLUCION_PDFS.md](operacion/SOLUCION_PDFS.md) |
| Cómo desplegar en producción | [DESPLIEGUE.md](operacion/DESPLIEGUE.md) |

---

**Última actualización:** Septiembre 2026 · **Versión:** 2.0 (reorganización de documentación)
