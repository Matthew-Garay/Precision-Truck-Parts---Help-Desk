# Manual de Uso del Sistema

**Sistema:** Precision Truck Parts HelpDesk
**Version:** 1.0 | **Fecha:** Agosto 2026

---

## 1. Proposito del Manual

Guia rapida para usar el sistema HelpDesk, tanto para **Usuarios** (crear tickets, solicitar insumos) como para **Administradores** (gestionar tickets, inventario, personal y manuales).

---

## 2. Inicio de Sesion

```
1. Abre https://tudominio.com
2. Ingresa tu EMAIL y CONTRASENA
3. Clic en "Iniciar Sesion"
```

**Recuperar contrasena:** Clic en "Olvidaste tu contrasena" | Ingresa tu email | Usa el codigo de 6 digitos del correo | Crea nueva contrasena.

**Nota:** La sesion expira cada 12 horas.

**IMAGEN SUGERIDA:** Captura de la pantalla de Login.

---

## 3. Menu segun tu Rol

| Usuario                  | Administrador            |
| ------------------------ | ------------------------ |
| Dashboard                | Dashboard                |
| Nuevo Reporte            | Historial de Incidencias |
| Historial de Incidencias | Historial de Insumos     |
| Gestion de Insumos       | Inventario               |
| Manuales de Incidencias  | Rendimiento de Tecnicos  |
| Configuracion            | Personal                 |
|                          | Manuales de Incidencias  |
|                          | Configuracion            |

**IMAGEN SUGERIDA:** Captura del menu lateral de cada rol.

---

## 4. Tickets de Soporte

### Usuario: Crear un ticket

```
Nuevo Reporte -> Titulo + Descripcion + Categoria + Prioridad -> Evidencias (opcional) -> Crear Ticket
```

| Prioridad | Cuando usarla     | Tiempo de respuesta |
| --------- | ----------------- | ------------------- |
| Baja      | Problema menor    | 3-5 dias            |
| Media     | Problema moderado | 1-2 dias            |
| Alta      | Afecta tu trabajo | 4-8 horas           |
| Urgente   | Todo detenido     | 2-4 horas           |

### Estados del ticket

```
En proceso -> En proceso (tecnico asignado) -> Resuelto -> Calificar (1-5 estrellas)
                                                 -> No Resuelto / Cancelado
```

**SLA:** Ticket sin resolver en 48 horas se cierra automaticamente como "No Resuelto".

### Admin: Gestionar un ticket

```
Historial de Incidencias -> Clic en ticket -> Asignar tecnico -> Actualizar estado -> Comentar
```

| Estado      | Cuando usarlo                  |
| ----------- | ------------------------------ |
| En proceso  | Se asigno tecnico y se trabaja |
| Resuelto    | Problema solucionado           |
| No Resuelto | No se pudo resolver            |
| Cancelado   | Ticket invalido                |

**IMAGENES SUGERIDAS:**

- Captura del formulario "Nuevo Reporte"
- Captura de un ticket con comentarios y evidencias

---

## 5. Insumos

### Usuario: Solicitar

```
Gestion de Insumos -> Elegir insumo + cantidad -> Justificacion -> Enviar Solicitud
```

| Estado    | Significado               |
| --------- | ------------------------- |
| Pendiente | Esperando aprobacion      |
| Aprobada  | Puedes recoger el insumo  |
| Rechazada | Contacta al administrador |
| Entregada | Ya recibiste el insumo    |

### Admin: Aprobar

```
Historial de Insumos -> Clic en solicitud -> Aprobar / Rechazar (por cada insumo)
```

**Nota:** El stock se descuenta automaticamente al aprobar. Insumo con stock menor o igual a 5 genera alerta.

**IMAGEN SUGERIDA:** Captura del formulario de solicitud de insumos.

---

## 6. Inventario (Solo Admin)

| Accion           | Como hacerla                                   |
| ---------------- | ---------------------------------------------- |
| Crear insumo     | Nuevo Insumo -> formulario -> Crear            |
| Editar           | Clic en insumo -> Guardar                      |
| Actualizar stock | Clic en insumo -> nueva cantidad -> Actualizar |
| Eliminar         | Eliminar -> confirmar                          |
| Reporte          | Exportar a PDF/Excel                           |

**IMAGEN SUGERIDA:** Captura del inventario con alertas de stock.

---

## 7. Manuales

```
Manuales de Incidencias -> Buscar por categoria -> Clic en manual -> Ver / Descargar
```

**Nota:** Ctrl+F busca texto dentro del PDF. El admin puede subir hasta 20 PDFs a la vez.

### Admin: Subir manual

```
Manuales -> Subir Manual -> Seleccionar PDF -> Nombre + Categoria + Version -> Subir
```

**IMAGEN SUGERIDA:** Captura del visor de PDF con un manual abierto.

---

## 8. Personal (Solo Admin)

| Accion              | Como hacerla                                  |
| ------------------- | --------------------------------------------- |
| Crear empleado      | Nuevo Empleado -> nombre, email, rol -> Crear |
| Cambiar rol         | Editar empleado -> rol -> Guardar             |
| Desactivar          | Desactivar -> confirmar                       |
| Resetear contrasena | Resetear -> se envia correo al empleado       |

| Rol           | Permisos                   |
| ------------- | -------------------------- |
| Administrador | Acceso total               |
| Usuario       | Tickets, insumos, manuales |

**IMAGEN SUGERIDA:** Captura del formulario de nuevo empleado.

---

## 9. Rendimiento de Tecnicos (Solo Admin)

Muestra: Tickets resueltos | Tiempo promedio | Calificaciones por tecnico

**IMAGEN SUGERIDA:** Captura de la tabla de rendimiento.

---

## 10. Perfil

| Accion             | Como hacerla                        |
| ------------------ | ----------------------------------- |
| Editar datos       | Clic en tu foto -> Configuracion    |
| Cambiar contrasena | Configuracion -> Cambiar contrasena |
| Cambiar foto       | Configuracion -> subir foto         |
| Cerrar sesion      | Clic en tu foto -> Cerrar sesion    |

---

## 11. Resumen de Imagenes para tu Documentacion

| #   | Imagen                             | Seccion del manual |
| --- | ---------------------------------- | ------------------ |
| 1   | Pantalla de Login                  | Seccion 2          |
| 2   | Menu lateral de Usuario            | Seccion 3          |
| 3   | Menu lateral de Admin              | Seccion 3          |
| 4   | Formulario "Nuevo Reporte"         | Seccion 4          |
| 5   | Ticket con comentarios             | Seccion 4          |
| 6   | Formulario de solicitud de insumos | Seccion 5          |
| 7   | Inventario con alertas de stock    | Seccion 6          |
| 8   | Visor de PDF                       | Seccion 7          |
| 9   | Formulario de nuevo empleado       | Seccion 4          |
| 10  | Tabla de rendimiento de tecnicos   | Seccion 9          |

**Formato:** PNG, 1280px de ancho, menos de 500 KB, en carpeta `docs/IMAGENES/`

```markdown
![Login del sistema](IMAGENES/uso_01_login.png)
```

---

**Fin del manual** | Para problemas tecnicos ver `docs/operacion/MANUAL_MANTENIMIENTO_SOFTWARE.md`
