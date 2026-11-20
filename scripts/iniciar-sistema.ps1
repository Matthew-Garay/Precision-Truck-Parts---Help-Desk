# iniciar-sistema.ps1 — Enciende la mesa de ayuda en MODO PRODUCCIÓN.
#
# Lo ejecuta la tarea de Windows "HelpDesk-Sistema" al iniciar sesión en esta PC
# (ver scripts/instalar-arranque.ps1). También se puede correr a mano.
#   1. Libera los puertos 3001/5173 (por si quedó encendido el modo desarrollo).
#   2. Recompila la app solo si hubo cambios desde la última compilación.
#   3. Arranca el servidor en el puerto 5173 (la misma dirección de siempre) y
#      deja lo que imprime en logs\servidor-AAAA-MM-DD.log.
# Si el servidor se cae, este mismo script lo vuelve a encender.
$ErrorActionPreference = 'Stop'
$raiz = Split-Path -Parent $PSScriptRoot
Set-Location $raiz
$logs = Join-Path $raiz 'logs'
New-Item -ItemType Directory -Path $logs -Force | Out-Null
$bitacora = Join-Path $logs ("servidor-{0}.log" -f (Get-Date -Format 'yyyy-MM-dd'))
function Anotar($texto) { "[{0}] {1}" -f (Get-Date -Format 'yyyy-MM-dd HH:mm:ss'), $texto | Add-Content $bitacora -Encoding UTF8 }

Anotar "Iniciando la mesa de ayuda (modo producción)…"
& powershell -NoProfile -ExecutionPolicy Bypass -File (Join-Path $PSScriptRoot 'liberar-puertos.ps1')

# ¿Hay que recompilar? Si dist no existe o algún archivo del cliente es más nuevo.
$index = Join-Path $raiz 'dist\index.html'
$compilar = -not (Test-Path $index)
if (-not $compilar) {
  $hecho = (Get-Item $index).LastWriteTime
  $compilar = [bool](Get-ChildItem (Join-Path $raiz 'client\src'), (Join-Path $raiz 'client\public'), (Join-Path $raiz 'client\index.html') -Recurse -File -ErrorAction SilentlyContinue |
    Where-Object { $_.LastWriteTime -gt $hecho } | Select-Object -First 1)
}
if ($compilar) {
  Anotar "Compilando la aplicación (hubo cambios)…"
  & cmd /c "npm run build >> `"$bitacora`" 2>&1"
  if ($LASTEXITCODE -ne 0) { Anotar "ERROR: la compilación falló (ver arriba). Se usa la versión anterior si existe." }
}

$env:NODE_ENV = 'production'
$env:PORT = '5173'
# Si el servidor se cae, se vuelve a encender (cada vez espera un poco más,
# hasta 1 minuto, para no saturar si algo está mal, p. ej. MySQL apagado).
$espera = 5
while ($true) {
  $inicio = Get-Date
  Anotar "Servidor encendido en el puerto 5173."
  & cmd /c "node --import ./server/load-env.js server/server.js >> `"$bitacora`" 2>&1"
  Anotar "El servidor se detuvo (código $LASTEXITCODE). Se vuelve a encender en $espera s."
  if (((Get-Date) - $inicio).TotalMinutes -gt 5) { $espera = 5 } else { $espera = [Math]::Min(60, $espera * 2) }
  Start-Sleep -Seconds $espera
  $bitacora = Join-Path $logs ("servidor-{0}.log" -f (Get-Date -Format 'yyyy-MM-dd'))
}
