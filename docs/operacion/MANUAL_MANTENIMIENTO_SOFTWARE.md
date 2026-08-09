# Manual de Mantenimiento de Software

**Sistema:** Precision Truck Parts HelpDesk
**Version:** 1.0 | **Fecha:** Agosto 2026

---

## 1. Proposito del Manual

Guia practica para mantener el sistema HelpDesk funcionando correctamente: respaldos, rutinas, fallas comunes y actualizaciones.

---

## 2. Arquitectura del Sistema

```
Usuario (Navegador)
      |
      v
Cloudflare Tunnel (HTTPS/SSL)
      |
      v
Node.js + Express (Puerto 3001) ---> MySQL 8 (precision_helpdesk)
      |
      |-- Socket.IO (notificaciones en tiempo real)
      |-- Workers (tareas automaticas)
      +-- storage/ (archivos: manuales, evidencias, fotos)
```

**IMAGEN SUGERIDA:** Diagrama de arquitectura creado en draw.io mostrando este flujo.

---

## 3. Rutinas de Mantenimiento

| Frecuencia  | Tarea                | Comando                                                                                     |
| ----------- | -------------------- | ------------------------------------------------------------------------------------------- |
| **Diario**  | Respaldo de BD       | `mysqldump -u root -p precision_helpdesk > backup_$(date +%F).sql`                          |
| **Diario**  | Revisar errores      | `pm2 logs helpdesk --err --lines 50`                                                        |
| **Semanal** | Respaldo `storage/`  | Copiar carpeta `storage/` a USB/nube                                                        |
| **Semanal** | Verificar espacio    | `Get-PSDrive C`                                                                             |
| **Mensual** | Optimizar BD         | `mysql -u root -p precision_helpdesk -e "OPTIMIZE TABLE ticket; OPTIMIZE TABLE solicitud;"` |
| **Mensual** | Limpiar temporales   | Borrar `storage/Evidencias_Tickets/_tmp_upload/`                                            |
| **Mensual** | Probar respaldo      | Restaurar en entorno de prueba                                                              |
| **Anual**   | Cambiar `JWT_SECRET` | Actualizar `.env` y reiniciar con `pm2 restart helpdesk`                                    |

**IMAGENES SUGERIDAS:**

- Captura de `mysqldump` ejecutandose en terminal
- Captura de `pm2 logs` mostrando logs
- Captura de MySQL Workbench con las tablas

---

## 4. Fallas Comunes y Soluciones

| Problema               | Causa                       | Solucion                                |
| ---------------------- | --------------------------- | --------------------------------------- |
| **No carga la pagina** | Servidor caido              | `pm2 restart helpdesk`                  |
| **502 Bad Gateway**    | Node no corriendo           | `pm2 restart helpdesk`                  |
| **Error de BD**        | MySQL detenido o `.env` mal | Iniciar MySQL o corregir `.env`         |
| **No llegan correos**  | SMTP mal configurado        | Revisar `SMTP_*` en `.env`              |
| **PDF no carga**       | Portadas/cache/CORS         | Regenerar portadas + limpiar cache      |
| **Sistema lento**      | BD fragmentada              | `OPTIMIZE TABLE` + reiniciar            |
| **Sin alertas**        | Worker caido                | `pm2 restart helpdesk`                  |
| **Cambios no se ven**  | Build viejo                 | `npm run build && pm2 restart helpdesk` |

**IMAGENES SUGERIDAS:**

- Captura de `pm2 status` mostrando proceso "online"
- Captura de `services.msc` con MySQL en "Running"
- Captura del error 502 en navegador

---

## 5. Tareas Automaticas (Workers)

| Worker            | Frecuencia  | Funcion                                 |
| ----------------- | ----------- | --------------------------------------- |
| Alertas SLA       | Cada 30 min | Avisa tickets a punto de vencer (46.5h) |
| Cierre de tickets | Cada hora   | Cierra tickets >48h como "No Resuelto"  |
| Limpieza sesiones | Cada hora   | Cierra sesiones huerfanas >12h          |
| Stock critico     | Cada 24h    | Alerta insumos con stock <= 5           |
| Sin atender       | Cada hora   | Alerta tickets sin tecnico >24h         |

**IMAGEN SUGERIDA:** Diagrama de flujo de los 5 workers con sus frecuencias.

---

## 6. Actualizar el Sistema

```bash
git pull origin main          # 1. Obtener cambios
npm install                  # 2. Instalar dependencias
node --import ./src/Backend/load-env.js src/Backend/scripts/migrate.js  # 3. Migraciones BD (SIEMPRE)
npm run build                # 4. Compilar frontend
pm2 restart helpdesk         # 5. Reiniciar servidor
```

**IMAGEN SUGERIDA:** Captura de terminal con los 5 comandos ejecutados correctamente.

---

## 7. Respaldos (Backups)

| Que respaldar               | Frecuencia | Retencion          |
| --------------------------- | ---------- | ------------------ |
| Base de datos (`mysqldump`) | Diaria     | 7 dias             |
| Carpeta `storage/`          | Semanal    | 4 semanas          |
| Codigo (Git)                | Continuo   | Historial completo |

**Regla:** Un respaldo que no se ha probado NO es un respaldo valido. Probar restauracion mensualmente.

**IMAGEN SUGERIDA:** Captura de la carpeta de backups con archivos organizados por fecha.

---

## 8. Seguridad

| Medida                     | Estado |
| -------------------------- | ------ |
| JWT (12h de sesion)        | Activo |
| bcrypt (12 rounds)         | Activo |
| Helmet + CORS + Rate-limit | Activo |
| Validacion de archivos     | Activo |
| Proteccion CSRF            | Activo |

**ADVERTENCIA:** Nunca subir el archivo `.env` al repositorio. Cambiar `JWT_SECRET` invalida todas las sesiones.

---

## 9. Comandos Esenciales

| Comando                               | Funcion                            |
| ------------------------------------- | ---------------------------------- |
| `pm2 status`                          | Ver estado del servidor            |
| `pm2 logs helpdesk`                   | Ver logs en tiempo real            |
| `pm2 restart helpdesk`                | Reiniciar servidor                 |
| `npm run build`                       | Compilar frontend                  |
| `curl http://localhost:3001/api/ping` | Verificar si el servidor esta vivo |
| `Get-Service cloudflared`             | Verificar tunnel activo            |

---

## 10. Resumen de Imagenes para tu Documentacion

| #   | Imagen                                     | Seccion del manual |
| --- | ------------------------------------------ | ------------------ |
| 1   | Diagrama de arquitectura (draw.io)         | Seccion 2          |
| 2   | Captura de `mysqldump` en terminal         | Seccion 3          |
| 3   | Captura de `pm2 logs`                      | Seccion 3          |
| 4   | Captura de MySQL Workbench                 | Seccion 3          |
| 5   | Captura de `pm2 status`                    | Seccion 4          |
| 6   | Captura de `services.msc` (MySQL)          | Seccion 4          |
| 7   | Captura del error 502                      | Seccion 4          |
| 8   | Diagrama de los 5 workers                  | Seccion 5          |
| 9   | Captura de los 5 comandos de actualizacion | Seccion 6          |
| 10  | Captura de carpeta de backups              | Seccion 7          |

**Formato:** PNG, 1280px de ancho, menos de 500 KB, en carpeta `docs/IMAGENES/`

```markdown
![Diagrama de arquitectura](IMAGENES/mantenimiento_01_arquitectura.png)
```

---

**Fin del manual** | Para mas detalles tecnicos ver `docs/tecnica/ARQUITECTURA.md` y `docs/operacion/DESPLIEGUE.md`
