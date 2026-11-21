# liberar-puertos.ps1 — libera 3001 (backend) y 5173 (frontend) antes de `npm run all`.
# Sin esto, un `node` colgado de una corrida anterior deja "Port is already in use"
# y concurrently (-k) mata al otro proceso: parece que "nada arranca".
# NOTA: cada puerto se consulta por separado dentro de try/catch porque
# Get-NetTCPConnection devuelve error nativo (exit 1) cuando NO hay conexiones,
# y eso hacía que npm cancelara `npm run all` sin arrancar nada.
# Si el sistema ya está encendido en modo PRODUCCIÓN (tarea HelpDesk-Sistema),
# `npm run all` no debe quitarle el puerto 5173: los usuarios se quedarían en el
# modo desarrollo (lento) y Zoho recibiría otra dirección. Se avisa y se cancela.
# (iniciar-sistema.ps1 llama este script con -Produccion para liberar lo suyo.)
param([switch]$Produccion)
if (-not $Produccion) {
  try {
    $tarea = Get-ScheduledTask -TaskName 'HelpDesk-Sistema' -ErrorAction Stop
    if ($tarea.State -eq 'Running') {
      Write-Host ''
      Write-Host '  El sistema YA está encendido en modo producción (se enciende solo al iniciar sesión).' -ForegroundColor Yellow
      Write-Host '  No hace falta "npm run all": es solo para programar.' -ForegroundColor Yellow
      Write-Host '  Si de verdad necesitas el modo desarrollo, primero apaga el de producción:' -ForegroundColor Yellow
      Write-Host '      Stop-ScheduledTask HelpDesk-Sistema' -ForegroundColor Yellow
      Write-Host ''
      exit 1
    }
  } catch {}
}
$puertos = @(3001, 5173)
$pids = @()
foreach ($p in $puertos) {
  try {
    $cx = Get-NetTCPConnection -LocalPort $p -ErrorAction Stop
    if ($cx) { $pids += $cx.OwningProcess }
  } catch {}
}
$pids = $pids | Select-Object -Unique
if ($pids) {
  foreach ($pidProc in $pids) {
    try { Stop-Process -Id $pidProc -Force -ErrorAction Stop } catch {}
  }
  Start-Sleep -Seconds 2
}
exit 0
