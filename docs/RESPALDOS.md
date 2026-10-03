# respaldos: cómo no perder datos

Este documento explica la forma segura de respaldar y recuperar la base de
datos de PrecisionTrucks HelpDesk.

## La idea principal

**Copiar, nunca mover.** Ningún despliegue debería necesitar borrar algo.
Si algo va a cambiar, primero se saca una copia, se aplica el cambio sobre
la copia, se verifica que funciona, y solo entonces se aplica al original.

## Qué contiene una copia

Cada copia guarda dos cosas, porque ninguna basta sola:

| Carpeta | Qué es | Por qué importa |
|---|---|---|
| `base_datos.sql` | Volcado de MySQL | Tickets, solicitudes, empleados, inventario |
| `storage/` | Fotos de perfil, insumos, manuales, evidencias | Archivos que los usuarios subieron |

Si solo guardas la base de datos, las fotos desaparecen. Si solo guardas los
archivos, los registros desaparecen.

## Sacar una copia

```powershell
powershell -ExecutionPolicy Bypass -File respaldar.ps1
```

Genera `backups/respaldo_AAAAMMDD_HHMM/` y conserva las 14 más recientes.
No modifica nada de la base de datos: solo la lee.

## Recuperar una copia

**Modo seguro (recomendado para probar).** Restaura en una base aparte
llamada `precision_helpdesk_restaurada` y no toca la real:

```powershell
powershell -ExecutionPolicy Bypass -File restaurar.ps1 -Copia backups\respaldo_20261003_2300
```

Puedes comparar ambas bases y, si todo está bien, decidir qué hacer.

**Reemplazar la base real.** Requiere el flag `-Reemplazar` y escribir `SI`
en mayúsculas. Antes de reemplazar, el `storage/` actual se renombra a
`storage_anterior_<fecha>` en lugar de borrarse:

```powershell
powershell -ExecutionPolicy Bypass -File restaurar.ps1 -Copia backups\respaldo_20261003_2300 -Reemplazar
```

## Copia automática diaria

Para no depender de la memoria, conviene programarla con el Programador de
tareas de Windows:

1. Abre **Programador de tareas**.
2. Crear tarea básica → nombre `Respaldo PrecisionTrucks HelpDesk`.
3. Elegir **Ejecutar a diario**, a las 23:00.
4. En "Programa": `powershell.exe`
5. En "Agregar argumentos":
   `-ExecutionPolicy Bypass -File "D:\ruta\al\proyecto\respaldar.ps1"`
6. En "Iniciar en": la carpeta del proyecto.

## Una segunda copia fuera de la computadora

Una copia guardada en el mismo disco no te protege si se rompe la
computadora. Copia la carpeta `backups/` una vez por semana a Drive,
OneDrive o un disco externo.

## Al migrar a otro servidor

El orden que evita perder datos:

```
1. Sacar copia            respaldar.ps1
2. Copiar a la nueva máquina (NO mover, COPIAR)
3. Restaurar allá         restaurar.ps1 -Copia ... -Reemplazar
4. Comprobar que abre y tiene los mismos datos
5. Apuntar el dominio nuevo a la máquina nueva
6. Dejar la antigua encendida unos dias como respaldo
7. Solo cuando todo este confirmado, apagar la antigua
```

Nunca borres la base original hasta que la nueva esté verificada.