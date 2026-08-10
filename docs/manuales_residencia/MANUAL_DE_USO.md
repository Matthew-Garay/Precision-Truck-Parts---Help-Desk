# Manual de uso — HelpDesk PrecisionTrucks

**Para quién es:** empleados y administradores que usan el sistema a diario.
**Última actualización:** Septiembre 2026 · **Versión del manual:** 1.1

---

## 1. Entrar al sistema

1. Abre el navegador y entra a la dirección del sistema.
2. Escribe tu **correo y contraseña** y pulsa **Iniciar Sesión**.
3. Si no recuerdas la contraseña: clic en **"Olvidaste tu contraseña"** → te llega un correo con un código de 6 dígitos → lo escribes → creas una contraseña nueva.

**Nota:** la sesión dura 12 horas; si te saca, vuelve a entrar.

En la pantalla después de entrar tienes el **menú a la izquierda**. Lo que veas depende de tu rol:

| Rol | Para qué sirve |
| --- | --- |
| **Usuario** | Reportar fallas, pedir insumos y consultar manuales |
| **Administrador** | Todo lo del usuario + atender tickets, inventario, personal y subir manuales |

En la parte superior hay una **campana** con las notificaciones (cambios de ticket, aprobaciones, stock crítico) que llegan solas, sin recargar la página. Con tu foto de perfil cierras sesión o cambias tu información.

---

# PANTALLAS DEL USUARIO

Estas son las 6 pantallas de tu menú y qué puedes hacer en cada una.

## 2. Dashboard

**Qué muestra:** tus números (tickets por estado, solicitudes) y tus tickets pendientes en tablero kanban.

**Qué puedes hacer:** ver de un vistazo dónde está cada cosa sin entrar a listas. Nada más.

## 3. Nuevo Reporte

**Para qué:** reportar una falla de equipo o software.

**Qué puedes hacer en el formulario:**

| Campo | Qué pones |
| --- | --- |
| Título | Descripción corta (ej. "La impresora no imprime") |
| Descripción | Detalle de lo que pasa |
| Categoría | Tipo de problema |
| Prioridad | Baja / Media / Alta / Urgente |
| Evidencias | Fotos o videos (opcional, pero recomendado) |

**Prioridades y tiempos de respuesta:**

| Prioridad | Úsala cuando | Respuesta |
| --- | --- | --- |
| Baja | No te detiene | 3–5 días |
| Media | Problema moderado | 1–2 días |
| Alta | Afecta tu trabajo | 4–8 horas |
| Urgente | No puedes trabajar | 2–4 horas |

**Después de crear el ticket:** se ve en tu historial. Va cambiando de estado: *En proceso* → *Resuelto* y ahí puedes **calificar del 1 al 5**. Ojo: si no se resuelve en 48 horas, el sistema lo cierra solo como *No Resuelto*.

## 4. Historial de Incidencias

**Para qué:** ver todos tus tickets y darles seguimiento.

**Qué puedes hacer:** abrir un ticket para ver su estado, comentarios y evidencias; agregar comentarios o información extra; calificar cuando está resuelto.

## 5. Gestión de Insumos

**Para qué:** pedir material de trabajo.

**Qué puedes hacer:** elegir un insumo + cantidad, escribir la justificación y enviar la solicitud.

**Estados de tu solicitud:**

| Estado | Qué significa |
| --- | --- |
| Pendiente | Esperando aprobación |
| Aprobada | Puedes recogerlo |
| Rechazada | No fue aprobado (contacta al admin) |
| Entregada | Ya lo recibiste |

## 6. Manuales de Incidencias

**Para qué:** consultar manuales técnicos en PDF.

**Qué puedes hacer:** buscar por categoría o buscador, ver el manual en línea (visor con paginado) y descargarlo. Dentro del PDF usa `Ctrl+F` para buscar texto.

## 7. Configuración

**Para qué:** tu perfil.

**Qué puedes hacer:** editar tus datos, cambiar contraseña, cambiar foto de perfil y ver tu historial de accesos (cuándo entraste/saliste). Si ves un acceso que no reconoces, avisa al administrador.

---

# PANTALLAS DEL ADMINISTRADOR

Tienes todo el menú del usuario más estas 7 pantallas. Lo que cada una te deja hacer:

## 8. Dashboard

**Qué muestra:** métricas generales del sistema: tickets por estado, solicitudes, alertas de stock y datos del equipo.

**Qué puedes hacer:** detectar problemas antes de que te los reporten (tickets atascados, stock bajo).

## 9. Historial de Incidencias

**Para qué:** atender TODOS los tickets de la empresa.

**Qué puedes hacer en un ticket:**

| Acción | Cómo |
| --- | --- |
| Asignar técnico | Seleccionar responsable |
| Cambiar estado | En proceso / Resuelto / No Resuelto / Cancelado |
| Comentar | Escribir mensajes al usuario (los ve al instante) |
| Ver evidencias | Revisar fotos/videos antes de resolver |

**Guía de estados:** *En proceso* = ya se trabaja · *Resuelto* = solucionado · *No Resuelto* = no se pudo · *Cancelado* = inválido o duplicado.

## 10. Historial de Insumos

**Para qué:** aprobar o rechazar las solicitudes de material.

**Qué puedes hacer:** abrir una solicitud y **aprobar o rechazar cada insumo por separado** (puedes aprobar 2 de 3 artículos). El stock se descuenta solo al aprobar. Con stock ≤ 5 el sistema marca alerta.

## 11. Inventario

**Para qué:** control de material.

| Acción | Cómo |
| --- | --- |
| Crear insumo | Botón "Nuevo Insumo" + formulario |
| Editar | Abrir el insumo y guardar |
| Actualizar stock | Poner la cantidad real y actualizar |
| Eliminar | Confirmar (cuidado, no se deshace) |
| Reporte | Exportar a PDF o Excel |

## 12. Rendimiento Técnicos

**Para qué:** ver el desempeño del equipo.

**Qué muestra:** tickets atendidos/resueltos, tiempo promedio, cumplimiento de SLA y calificaciones por técnico. **Extra:** exportar el reporte.

## 13. Personal

**Para qué:** administrar las cuentas de empleados.

| Acción | Cómo |
| --- | --- |
| Crear empleado | "Nuevo Empleado" → nombre, correo, rol |
| Cambiar rol | Editar → cambiar rol (Administrador/Usuario) |
| Desactivar | El empleado ya no entra, se conserva su historial |
| Resetear contraseña | Le llega un correo al empleado |

**Cuidado:** el rol Administrador da acceso total; úsalo solo con quien lo necesite.

## 14. Manuales de Incidencias

**Para qué:** igual que el usuario (ver/descargar manuales), **más** los botones de administración:

- **Subir Manual:** seleccionar PDF, poner nombre + categoría + versión.
- **Subida masiva:** hasta 20 PDFs a la vez.
- **Organizar:** crear categorías, eliminar o reemplazar manuales obsoletos.

---

## 15. Resumen rápido (dónde hago cada cosa)

| Lo que quiero hacer | Pantalla | Rol |
| --- | --- | --- |
| Reportar una falla | Nuevo Reporte | Usuario |
| Ver mis tickets | Historial de Incidencias | Usuario |
| Pedir material | Gestión de Insumos | Usuario |
| Atender tickets de todos | Historial de Incidencias | Admin |
| Aprobar material | Historial de Insumos | Admin |
| Actualizar inventario | Inventario | Admin |
| Revisar desempeño | Rendimiento Técnicos | Admin |
| Crear/desactivar cuentas | Personal | Admin |
| Ver o subir manuales | Manuales de Incidencias | Ambos |
| Cambiar contraseña/foto | Configuración | Ambos |

## 16. Imágenes sugeridas

| # | Captura | Sección |
| --- | --- | --- |
| 1 | Pantalla de inicio de sesión | 1 |
| 2 | Menú lateral de usuario | — |
| 3 | Menú lateral de administrador | — |
| 4 | Formulario "Nuevo Reporte" | 3 |
| 5 | Ticket con comentarios y evidencias | 4 o 9 |
| 6 | Solicitud de insumo con botón de aprobar | 10 |
| 7 | Inventario con stock crítico en rojo | 11 |
| 8 | Formulario "Nuevo Empleado" | 13 |
| 9 | Visor de PDF con un manual abierto | 6 o 14 |

Guárdalas en `docs/manuales_residencia/imagenes/` (PNG, ~1280 px, < 500 KB). Se insertan así:

```markdown
![Nuevo Reporte](imagenes/uso_04_nuevo_reporte.png)
```

---

**Fin del manual.** ¿Algo no funciona en el sistema? Eso no es uso, es mantenimiento: revisa `MANUAL_DE_MANTENIMIENTO.md` en esta misma carpeta.