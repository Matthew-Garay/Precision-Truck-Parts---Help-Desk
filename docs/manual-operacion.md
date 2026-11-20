# Manual de operación — Mesa de ayuda de Soporte Técnico

Para la persona que se queda a cargo del sistema cuando el responsable no está.
No hace falta saber programar: basta con seguir los pasos tal como están escritos.

---

## 1. A quién llamar

Llena esta tabla y mantenla al día.

| Para qué | Nombre | Teléfono / correo |
| --- | --- | --- |
| Responsable del sistema | | |
| Suplente | | |
| Red e internet de la oficina | | |
| Cuenta de correo (Zoho) | | |

Llama al responsable **antes** de restaurar un respaldo o de borrar cualquier cosa.

---

## 2. Dónde está y cómo se usa

- El sistema corre en **esta computadora**, en la carpeta
  `C:\Users\Soporte\Videos\PrecisionTrucks_HelpDesk`.
- Los demás entran desde su navegador con la dirección del sistema (la misma de siempre).
  Si esta computadora se apaga o se suspende, **nadie puede entrar**.
- Deja la computadora encendida, con la sesión de Windows abierta y sin suspensión.

---

## 3. ¿Está funcionando?

Abre el sistema en el navegador de esta computadora e inicia sesión.

- **Entra normal:** todo bien.
- **"No hay conexión con el sistema" o la página no carga:** el sistema está apagado.
  Sigue el paso 4.
- **Sale una franja roja "Sin conexión con el servidor":** igual, sigue el paso 4.

---

## 4. Encender o reiniciar el sistema

**Normalmente no hay que hacer nada:** el sistema se enciende solo (versión rápida, puerto 5173)
cuando se inicia sesión en Windows en esta PC, y si se cae se vuelve a levantar solo en
segundos. No hay ventana negra que cuidar. Lo hace la tarea de Windows **HelpDesk-Sistema**.

**Si aun así no funciona**, reinícialo así:

1. Abre **PowerShell** (menú Inicio → escribe "PowerShell" → Enter).
2. Copia y pega esta línea y presiona Enter:

   ```powershell
   Stop-ScheduledTask HelpDesk-Sistema; Start-ScheduledTask HelpDesk-Sistema
   ```

3. Espera 30–40 segundos y vuelve a probar como en el paso 3.
   Reiniciar la computadora también funciona.

Lo que el sistema va haciendo queda en `logs\servidor-AAAA-MM-DD.log` (y los errores en
`logs\errores-AAAA-MM-DD.log`). Si algo falla, manda ese archivo al responsable.

> Reinicia también así después de que el responsable haga cambios al sistema.
> Si cambió las pantallas, el reinicio las vuelve a preparar solo.

**Si la dirección del sistema cambió:** cuando el router le da otra IP a esta PC, el sistema
se adapta solo al encender (lo anota en `logs\servidor-…log` con la palabra `[red]`), pero los
demás tendrán que entrar con la dirección nueva. Para que no vuelva a pasar, pide que se
**reserve una IP fija para esta PC en el router**.

**Si sale un error al encender:**

| Lo que dice | Qué hacer |
| --- | --- |
| `Variables de entorno faltantes` | Alguien movió o borró el archivo `server\.env`. Llama al responsable. |
| Algo de `MySQL`, `ECONNREFUSED` o `DB` en rojo | La base de datos está apagada. Abre "Servicios" de Windows, busca los que empiezan con **MySQL** (hoy son **MySQL2610** y **MySQL80**) y a cada uno que no diga "En ejecución" dale **Iniciar**. Repite el paso 4. |
| `EADDRINUSE` o "puerto en uso" | Ya hay otra copia encendida. Reinicia la computadora y repite el paso 4. |

---

## 5. Respaldos (copias de seguridad)

### Lo que ya pasa solo

Todos los días a las **23:00** Windows hace una copia de la base de datos y de los
archivos (manuales, fotos, evidencias) en la carpeta `Backups\` del sistema, con nombre
`respaldo_AAAAMMDD_HHMM`. Se guardan las últimas 14.
Si la computadora estaba apagada a esa hora, la copia se hace en cuanto se prenda.

### Copia fuera de esta PC (automática)

Si en la carpeta del sistema existe el archivo `respaldo-externo.txt` con una ruta en la primera
línea (por ejemplo `E:\` para una USB, `\\OTRA-PC\Respaldos` o una carpeta de OneDrive), cada
respaldo diario también se copia ahí (se guardan las últimas 4). Si ese lugar no está disponible
(USB desconectada), el respaldo normal igual se hace y solo queda un aviso.

### Lo que te toca a ti (cada viernes)

Los respaldos están en el **mismo disco** que el sistema: si el disco falla, se pierden los dos.

1. Conecta la USB de respaldos.
2. Abre la carpeta `C:\Users\Soporte\Videos\PrecisionTrucks_HelpDesk\Backups`.
3. Copia a la USB la carpeta `respaldo_…` **más reciente** (la de fecha más nueva).
4. Revisa que dentro haya un archivo `base_datos.sql` que pese varios MB y una carpeta `storage`.
5. Guarda la USB fuera de la oficina o en un lugar distinto a esta computadora.

### Hacer un respaldo en este momento

Antes de algo delicado (actualizar Windows, cambiar de disco, etc.). En PowerShell:

```powershell
cd "C:\Users\Soporte\Videos\PrecisionTrucks_HelpDesk"
npm run respaldar
```

Al final debe decir que el respaldo terminó y en qué carpeta quedó.

### Restaurar un respaldo

**Solo con el responsable al teléfono.** Primero se restaura en una base aparte, sin tocar la real,
para revisar que esté bien:

```powershell
cd "C:\Users\Soporte\Videos\PrecisionTrucks_HelpDesk"
powershell -ExecutionPolicy Bypass -File restaurar.ps1 -Copia Backups\respaldo_AAAAMMDD_HHMM
```

(Cambia `respaldo_AAAAMMDD_HHMM` por el nombre real de la carpeta.)
Reemplazar la base real lleva `-Reemplazar` al final y pide escribir `SI`: eso borra lo que hay
hoy y lo cambia por el respaldo. Nunca lo hagas sin autorización.

---

## 6. Cosas que el sistema ya resuelve solo (no tocar la base de datos)

| Situación | Dónde se hace |
| --- | --- |
| Una salida de insumos se capturó con la **fecha equivocada** | Historial de insumos → botón **Fecha** en la salida. Pide el motivo y queda registrado quién y cuándo la cambió. Solo dentro del mismo mes del folio. |
| Una salida se capturó **mal** (cantidad, insumo o mes equivocado) | Historial de insumos → **Anular** (regresa el stock) y capturarla de nuevo bien. |
| Un empleado se va de la empresa | Personal → desactivar. No se borra para no perder su historial. |
| Alguien olvidó su contraseña | En la pantalla de inicio: "¿Olvidaste tu contraseña?" (le llega un código al correo). |
| Reporte del mes para dirección | Dashboard → **Reporte mensual para dirección** → elegir el mes → Imprimir / Guardar PDF. |

**Seguridad:** la sesión se cierra sola tras **30 minutos sin usar** el sistema (un minuto antes
avisa "¿Sigues ahí?"). Es para que en computadoras compartidas nadie entre con la sesión de otro.

---

## 7. Lo que NO se debe hacer

- No cerrar la ventana negra del sistema (paso 4).
- No borrar ni mover carpetas dentro de `PrecisionTrucks_HelpDesk`, en especial `storage`, `Backups` y `server`.
- No editar el archivo `server\.env` ni compartir su contenido: tiene las contraseñas.
- No cambiar datos directamente en MySQL (Workbench u otro programa): esos cambios no quedan en el historial.
- No restaurar un respaldo con `-Reemplazar` sin autorización.

---

## 8. Dónde ver más detalle (para el responsable)

- Errores del día: carpeta `logs\` (`errores-AAAA-MM-DD.log`).
- Detalle técnico de respaldos, variables y pruebas: `docs/operations.md`.
