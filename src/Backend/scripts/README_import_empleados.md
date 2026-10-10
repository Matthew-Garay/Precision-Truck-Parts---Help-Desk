# Importar empleados (carga masiva)

Script: `src/Backend/scripts/importar_empleados.mjs`
Plantilla: `src/Backend/scripts/plantilla_empleados.csv`

## ¿Cómo usarlo?

1. Abre `plantilla_empleados.csv` en Excel o Google Sheets.
2. Rellena cada fila con los datos de un empleado.
3. Guarda el archivo como **CSV (UTF-8)** — Windows, elige *CSV (UTF-8)* no *CSV (MS-DOS)*.
4. Copia el archivo a `src/Backend/scripts/` (o dejan el nombre que quieras).
5. Ejecuta en la terminal (desde la raíz del proyecto):

   ```powershell
   node --import ./src/Backend/load-env.js src/Backend/scripts/importar_empleados.mjs src/Backend/scripts/plantilla_empleados.csv
   ```

   Con `--dry-run` solo valida sin insertar:

   ```powershell
   node --import ./src/Backend/load-env.js src/Backend/scripts/importar_empleados.mjs src/Backend/scripts/plantilla_empleados.csv --dry-run
   ```

## Estructura del CSV

| Columna | Requerida | Formatos válidos |
|---|---|---|
| `num_empleado` | Sí | Texto, único, max 20 caracteres. Ej: `EMP001` |
| `nombre` | Sí | Texto del nombre |
| `ap_paterno` | Sí | Apellido paterno |
| `ap_materno` | No | Apellido materno (vacío admite) |
| `email` | Sí | Solo **@ptp.com.mx**, **@refividrio.com.mx**, **@megapartes.com.mx** o **@ebatruck.com.mx** |
| `password` | Sí | Mín 8 caracteres: 1 mayúscula, 1 número, 1 símbolo. Ej: `Ptp2024*` |
| `rol` | Sí | `Administrador` o `Usuario` (también `1`/`2`) |
| `departamento` | Sí | Nombre exacto del catálogo (fuera de la tabla también se acepta su id) |
| `sucursal` | No | Nombre exacto del catálogo. Deja la celda vacía si no tiene sucursal |

> Los campos de texto que se dejen vacíos se tratan como `null`/`""` por el backend.
> La contraseña se hashea con `bcrypt(12)` igual que el controlador `crearEmpleado`.

## Valores válidos — roles

| Id | Valor |
|----|-------|
| 1 | `Administrador` |
| 2 | `Usuario` |

## Valores válidos — departamentos

> El script compara ignorando mayúsculas, acentos y espacios extras (`norm()`). Tanto `Facturacion` como `Facturación` sirven; ¿el catálogo es el de la derecha.

| # | Departamento |
|---|---|
| 1 | Administrador Legal Corporativo |
| 2 | Almacenista |
| 3 | Analista de Recursos Humanos |
| 4 | Analista de Tráfico |
| 5 | Asesor Externo |
| 6 | Asesor Jurídico |
| 7 | Asistente Administrativo |
| 8 | Asistente de Contraloría |
| 9 | Asistente de Crédito y Cobranza |
| 10 | Asistente de Dirección |
| 11 | Auxiliar de Almacén |
| 12 | Auxiliar de Nómina |
| 13 | Auxiliar de Recursos Humanos |
| 14 | Auxiliar de Soporte Técnico |
| 15 | Chofer Repartidor |
| 16 | Comprador |
| 17 | Community Manager |
| 18 | Contralor Externo |
| 19 | Coordinador de Liberación de Moldes |
| 20 | Cuidador Terapéutico |
| 21 | Director Comercial |
| 22 | Director de Contraloría |
| 23 | Director de Producción |
| 24 | Director de TI |
| 25 | Director Estratégico |
| 26 | Director General |
| 27 | Diseñador Gráfico |
| 28 | Ejecutivo de E-commerce |
| 29 | Encargado de Almacén |
| 30 | Externo |
| 31 | Facturación |
| 32 | Gerente Comercial B2B |
| 33 | Gerente Comercial B2C |
| 34 | Gerente de ERP y Base de Datos |
| 35 | Gerente de Recursos Humanos |
| 36 | Ingeniero en Procesos |
| 37 | Intendente |
| 38 | Jefe de Almacén |
| 39 | Jefe de Centro de Distribución |
| 40 | Jefe de Finanzas |
| 41 | Jefe de Seguridad Patrimonial |
| 42 | Jefe de Tienda |
| 43 | Jefe de Transporte |
| 44 | Líder de Diseño Gráfico |
| 45 | Monitorista CCTV |
| 46 | Planeador de la Demanda |
| 47 | Soporte Técnico |
| 48 | Supervisor de Producción |
| 49 | Técnico en Mantenimiento |
| 50 | Vendedor B2B |
| 51 | Vendedor B2C |
| 52 | Vigilante |

## Valores válidos — sucursales

| # | Sucursal |
|---|----------|
| 1 | CEDIS GUADALAJARA |
| 2 | CEDIS HUITZILA |
| 3 | CEDIS MONTERREY |
| 4 | CEDIS PUEBLA |
| 5 | CEDIS TABASCO |
| 6 | PRODUCCION ESBAZA |
| 7 | ROSA DE FRANCIA |
| 8 | SUCURSAL ACAJETE |
| 9 | SUCURSAL MONTERREY |
| 10 | SUCURSAL TECAMAC |
| 11 | SUCURSAL TIZAYUCA |
| 12 | SUCURSAL TOLUCA |
| 13 | SUCURSAL VERACRUZ |
| 14 | SUCURSAL VILLAHERMOSA |
| 15 | TOPACIO |
| 16 | YUCATAN 21 |

## Notas de encoding

- El script lee el CSV como **UTF-8**. Si tus acentos aparecen como `??` o caracteres extraños al importar, el archivo no está en UTF-8: vuelve a guardarlo como *CSV (UTF-8)* o *CSV (UTF-8 con BOM)*.
- Si abres el CSV en Excel, la primera fila puede mostrarse con `###` si la columna es demasiado estrecha; expande la celda o usa la opción *Todo* en el menú *Formato ▸ Ajustar tamaño de columna*.
- Las filas duplicadas (mismo `num_empleado` **o** mismo `email`) van a lanzar error `ER_DUP_ENTRY` y se omiten; revisa la consola y corrige la fila antes de volver a importar.

## Verificación previa

Corre siempre un `--dry-run` primero. El script reportará `✗` por fila en caso de:

- Fila incompleta (falta `num_empleado`, `nombre`, `ap_paterno`, `email` o `password`).
- Correo con dominio no permitido o mal formado.
- Contraseña que no cumple la política (mín 8, 1 mayúscula, 1 número, 1 símbolo).
- `rol`, `departamento` o `sucursal` que no coincidan con el catálogo.

Si todo sale `✓`, cambia a `--dry-run` por la ejecución real.
