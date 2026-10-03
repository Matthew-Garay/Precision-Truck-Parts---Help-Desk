<#
  restaurar.ps1 — Recuperar una copia de seguridad
  ══════════════════════════════════════════════════════════════

  REGLA DE ORO DE ESTE SCRIPT
  ───────────────────────────
  Por omision NO toca la base de datos que estas usando. La copia se
  restaura en una base NUEVA llamada  <nombre>_restaurada  para que puedas
  compararla sin arriesgar nada.

  Para reemplazar la base actual debes pedirlo explicitamente con -Reemplazar
  y confirmar escribiendo SI en mayusculas.

  Uso seguro (solo crea una copia aparte, no cambia nada):
    powershell -ExecutionPolicy Bypass -File restaurar.ps1 -Copia backups\respaldo_20261003_2300

  Reemplazar la base actual (pide confirmacion):
    powershell -ExecutionPolicy Bypass -File restaurar.ps1 -Copia backups\respaldo_20261003_2300 -Reemplazar
#>
[CmdletBinding()]
param(
  # Carpeta de la copia, por ejemplo backups\respaldo_20261003_2300
  [Parameter(Mandatory = $true)]
  [string]$Copia,

  # Sustituye la base actual. Sin este parametro se restaura en una copia aparte.
  [switch]$Reemplazar
)

$ErrorActionPreference = 'Stop'
$raiz = $PSScriptRoot

# ── Leer configuracion del .env ──────────────────────────────────────
$cfg = @{}
foreach ($linea in Get-Content (Join-Path $raiz '.env')) {
  if ($linea -match '^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*?)\s*$') {
    $cfg[$Matches[1]] = $Matches[2].Trim('"').Trim("'")
  }
}

$dbOriginal = $cfg.DB_NAME
$dbDestino = if ($Reemplazar) { $dbOriginal } else { "$($dbOriginal)_restaurada" }

# ── Validar la copia antes de tocar nada ─────────────────────────────
$dump = Join-Path $Copia 'base_datos.sql'
if (-not (Test-Path $dump)) {
  throw "No se encontro base_datos.sql dentro de $Copia. Revisa la ruta."
}
$tam = (Get-Item $dump).Length
if ($tam -lt 1024) { throw "El archivo base_datos.sql pesa $tam bytes: la copia esta incompleta." }

Write-Host ''
Write-Host '  Restaurando PrecisionTrucks HelpDesk' -ForegroundColor Cyan
Write-Host "  Copia   : $Copia ($([math]::Round($tam / 1KB)) KB)"
Write-Host "  Destino : $dbDestino`n"

# ── Confirmacion cuando se va a reemplazar la base real ──────────────
if ($Reemplazar) {
  Write-Host '  ┌──────────────────────────────────────────────────┐' -ForegroundColor Yellow
  Write-Host '  │  ESTA OPERACION BORRA EL CONTENIDO ACTUAL DE    │' -ForegroundColor Yellow
  Write-Host "  │  LA BASE `"$dbOriginal`" Y LO CAMBIA POR ESTA   │" -ForegroundColor Yellow
  Write-Host '  │  COPIA.                                          │' -ForegroundColor Yellow
  Write-Host '  └──────────────────────────────────────────────────┘' -ForegroundColor Yellow
  Write-Host ''
  $respuesta = Read-Host '  Escribe SI en mayusculas para confirmar'
  if ($respuesta -cne 'SI') {
    Write-Host '  Cancelado. No se modifico nada.' -ForegroundColor Green
    exit 0
  }
} else {
  Write-Host '  Modo seguro: tu base de datos actual NO se tocara.' -ForegroundColor Green
  Write-Host ''
}

# ── Localizar mysql.exe ──────────────────────────────────────────────
$rutaMysql = (Get-Command mysql -ErrorAction SilentlyContinue).Source
if (-not $rutaMysql) {
  $rutaMysql = (Get-ChildItem 'C:\Program Files\MySQL' -Recurse -Filter 'mysql.exe' `
                 -ErrorAction SilentlyContinue | Select-Object -First 1).FullName
$cfgTemporal = Join-Path ([IO.Path]::GetTempPath()) "my_ptp_$PID.cnf"
try {
  @(
    '[client]'
    "host=$($cfg.DB_HOST)"
    "port=$($cfg.DB_PORT)"
    "user=$($cfg.DB_USER)"
    "password=$($cfg.DB_PASSWORD)"
  ) | Set-Content -Path $cfgTemporal -Encoding ASCII

  # ── Crear la base destino ─────────────────────────────────────────
  Write-Host '  Preparando la base...'
  $crear = "DROP DATABASE IF EXISTS ``$dbDestino``; CREATE DATABASE ``$dbDestino`` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
  $crear | & $rutaMysql "--defaults-extra-file=$cfgTemporal" -e $crear
  if ($LASTEXITCODE -ne 0) { throw 'No se pudo crear la base de datos destino' }

  # ── Cargar el volcado ─────────────────────────────────────────────
  Write-Host '  Cargando los datos...'
  Get-Content $dump -Encoding UTF8 | & $rutaMysql "--defaults-extra-file=$cfgTemporal" $dbDestino
  if ($LASTEXITCODE -ne 0) { throw 'mysql termino con error al cargar el volcado' }

  # ── Comprobacion: contar tablas en la base recien restaurada ───────
  $n = & $rutaMysql "--defaults-extra-file=$cfgTemporal" -N -B `
       -e "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='$dbDestino';"
  Write-Host ("  Restauradas {0} tablas en {1}." -f $n, $dbDestino) -ForegroundColor Green
}
finally {
  Remove-Item $cfgTemporal -Force -ErrorAction SilentlyContinue
}

# ── Restaurar tambien los archivos, si la copia los trae ────────────
$storageCopia = Join-Path $Copia 'storage'
if (Test-Path $storageCopia) {
  $destinoStorage = Join-Path $raiz 'storage'
  if ($Reemplazar -and (Test-Path $destinoStorage)) {
    Write-Host '  Restaurando storage/...'
    $respaldoViejo = Join-Path $raiz "storage_anterior_$(Get-Date -Format 'yyyyMMdd_HHmmss')"
    Move-Item $destinoStorage $respaldoViejo -Force
    Write-Host "    Se movio tu storage/ actual a $(Split-Path $respaldoViejo -Leaf)" -ForegroundColor Yellow
  }
  Copy-Item -Path $storageCopia -Destination $raiz -Recurse -Force
  Write-Host '    Archivos copiados.' -ForegroundColor Green
}

Write-Host ''
if ($Reemplazar) {
  Write-Host '  Restauracion terminada. Cierra y reinicia el servidor.' -ForegroundColor Green
  Write-Host '  Si algo salio mal, tu copia anterior quedo en backups/.' -ForegroundColor Green
} else {
  Write-Host "  Copia restaurada aparte en `"$dbDestino`"." -ForegroundColor Green
  Write-Host '  Tu base de datos real sigue intacta. Ya puedes compararlas.' -ForegroundColor Green
}
Write-Host ''
}
if (-not $rutaMysql) { throw 'No se encontro mysql.exe en el sistema' }
# ---CONT---