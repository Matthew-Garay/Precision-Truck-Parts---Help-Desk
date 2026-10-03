<#
  respaldar.ps1 — Copia de seguridad de PrecisionTrucks HelpDesk
  ══════════════════════════════════════════════════════════════

  Guarda DOS cosas, porque ninguna basta sola:
    1. La base de datos  (volcado .sql con mysqldump)
    2. La carpeta storage/ (fotos de perfil, insumos, manuales, evidencias)

  Nunca borra la base de datos actual: solo LEE de ella y escribe en backups/.
  Por eso es seguro ejecutarlo en produccion a cualquier hora.

  Uso:
    powershell -ExecutionPolicy Bypass -File respaldar.ps1
    powershell -ExecutionPolicy Bypass -File respaldar.ps1 -Conservar 30

  Recomendacion: ejecutarlo todos los dias a las 11 de la noche con
  el Programador de tareas de Windows. Ver docs/RESPALDOS.md.
#>
[CmdletBinding()]
param(
  # Carpeta donde se guardan las copias. Si se omite, queda "backups" junto al script.
  [string]$Destino = '',

  # Cuantas copias antiguas conservar antes de borrar las mas viejas.
  [int]$Conservar = 14
)

$ErrorActionPreference = 'Stop'
$raiz = $PSScriptRoot
if (-not $raiz) { $raiz = Split-Path -Parent $MyInvocation.MyCommand.Path }
if (-not $Destino) { $Destino = Join-Path $raiz 'backups' }

# ── Leer configuracion del .env ──────────────────────────────────────
# Se lee desde .env para no dejar usuario ni contrasena escritos aqui.
$archivoEnv = Join-Path $raiz '.env'
if (-not (Test-Path $archivoEnv)) {
  throw "No se encontro el archivo .env en $raiz"
}

$cfg = @{}
foreach ($linea in Get-Content $archivoEnv) {
  if ($linea -match '^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*?)\s*$') {
    $cfg[$Matches[1]] = $Matches[2].Trim('"').Trim("'")
  }
}

foreach ($clave in 'DB_HOST', 'DB_PORT', 'DB_USER', 'DB_PASSWORD', 'DB_NAME') {
  if (-not $cfg.ContainsKey($clave)) { throw "Falta la variable $clave en .env" }
}

# ── Localizar mysqldump.exe ──────────────────────────────────────────
$rutaDump = (Get-Command mysqldump -ErrorAction SilentlyContinue).Source
if (-not $rutaDump) {
  $rutaDump = (Get-ChildItem 'C:\Program Files\MySQL' -Recurse -Filter 'mysqldump.exe' `
                -ErrorAction SilentlyContinue | Select-Object -First 1).FullName
}
if (-not $rutaDump) { throw 'No se encontro mysqldump.exe en el sistema' }

# ── Preparar la carpeta de esta copia ────────────────────────────────
$sello  = Get-Date -Format 'yyyyMMdd_HHmm'
$carpeta = Join-Path $Destino "respaldo_$sello"

if (Test-Path $carpeta) {
  throw "Ya existe la carpeta $carpeta; espera un minuto y vuelve a ejecutar."
}
New-Item -ItemType Directory -Path $carpeta -Force | Out-Null

Write-Host ''
Write-Host '  Respaldando PrecisionTrucks HelpDesk' -ForegroundColor Cyan
Write-Host "  → $carpeta`n"

# ── 1. Volcado de la base de datos ───────────────────────────────────
# La contrasena va en un archivo temporal en vez de en la linea de
# comandos, para que no quede visible en la lista de procesos.
$cfgTemporal = Join-Path ([IO.Path]::GetTempPath()) "my_ptp_$PID.cnf"
try {
  @(
    '[client]'
    "host=$($cfg.DB_HOST)"
    "port=$($cfg.DB_PORT)"
    "user=$($cfg.DB_USER)"
    "password=$($cfg.DB_PASSWORD)"
  ) | Set-Content -Path $cfgTemporal -Encoding ASCII

  $dump = Join-Path $carpeta 'base_datos.sql'

  Write-Host '  [1/2] Volcando la base de datos...'
  & $rutaDump "--defaults-extra-file=$cfgTemporal" `
      --single-transaction --quick --routines --triggers --events `
      --set-gtid-purged=OFF --default-character-set=utf8mb4 `
      --result-file="$dump" $cfg.DB_NAME

  if ($LASTEXITCODE -ne 0) { throw "mysqldump termino con codigo $LASTEXITCODE" }

  # Verificacion: un volcado vacio o corrupto es peor que no tener copia.
  if (-not (Test-Path $dump)) { throw 'mysqldump no genero ningun archivo' }
  $bytes = (Get-Item $dump).Length
  if ($bytes -lt 1024) { throw "El volcado pesa solo $bytes bytes: la base esta vacia o fallo" }

  $tablas = (Select-String -Path $dump -Pattern 'CREATE TABLE' -SimpleMatch |
             Measure-Object).Count
  if ($tablas -lt 1) { throw 'El volcado no contiene ninguna tabla' }

  Write-Host ("        base_datos.sql  {0:N0} KB · {1} tablas" -f ($bytes / 1KB), $tablas) `
             -ForegroundColor Green
}
finally {
  Remove-Item $cfgTemporal -Force -ErrorAction SilentlyContinue
}

# ── 2. Copia de los archivos subidos ────────────────────────────────
Write-Host '  [2/2] Copiando archivos subidos...'
$origenStorage = Join-Path $raiz 'storage'
if (Test-Path $origenStorage) {
  Copy-Item -Path $origenStorage -Destination $carpeta -Recurse -Force
  $archivos = (Get-ChildItem (Join-Path $carpeta 'storage') -Recurse -File |
               Measure-Object).Count
  $tam = ((Get-ChildItem (Join-Path $carpeta 'storage') -Recurse -File |
           Measure-Object Length -Sum).Sum / 1MB)
  Write-Host ("        storage/  {0} archivos · {1:N1} MB" -f $archivos, $tam) `
             -ForegroundColor Green
} else {
  Write-Host '        storage/ no existe todavia, se omite' -ForegroundColor Yellow
}

# ── Nota de como recuperar esta copia ───────────────────────────────
@"
COPIA DE SEGURIDAD
Fecha : $(Get-Date -Format 'dd/MM/yyyy HH:mm:ss')
Base  : $($cfg.DB_NAME)

Para RESTAURAR (deja intacta la base actual):
  powershell -ExecutionPolicy Bypass -File restaurar.ps1 -Copia "$carpeta"

Para reemplazar la base actual por esta copia:
  powershell -ExecutionPolicy Bypass -File restaurar.ps1 -Copia "$carpeta" -Reemplazar
"@ | Set-Content (Join-Path $carpeta 'LEEME.txt') -Encoding UTF8

# ── Limpieza de copias viejas ───────────────────────────────────────
$cortes = Get-ChildItem $Destino -Directory -Filter 'respaldo_*' |
          Sort-Object Name -Descending
if ($cortes.Count -gt $Conservar) {
  $cortes | Select-Object -Skip $Conservar | ForEach-Object {
    Write-Host "  Borrando copia antigua: $($_.Name)"
    Remove-Item $_.FullName -Recurse -Force
  }
}

Write-Host ''
Write-Host '  Copia terminada. Nada se borro de la base de datos.' -ForegroundColor Green
Write-Host ''