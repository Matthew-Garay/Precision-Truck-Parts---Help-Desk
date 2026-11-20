# instalar-arranque.ps1 — Registra la tarea de Windows "HelpDesk-Sistema" para
# que la mesa de ayuda se encienda SOLA (modo producción) al iniciar sesión en
# esta PC, y se vuelva a levantar si se cae. No requiere ser administrador.
#
#   powershell -ExecutionPolicy Bypass -File scripts\instalar-arranque.ps1
#   powershell -ExecutionPolicy Bypass -File scripts\instalar-arranque.ps1 -Quitar
param([switch]$Quitar)
$nombre = 'HelpDesk-Sistema'
if ($Quitar) {
  Unregister-ScheduledTask -TaskName $nombre -Confirm:$false -ErrorAction SilentlyContinue
  Write-Host "Tarea $nombre quitada. El sistema ya no se encenderá solo."
  return
}
$script = Join-Path $PSScriptRoot 'iniciar-sistema.ps1'
$accion = New-ScheduledTaskAction -Execute 'powershell.exe' `
  -Argument "-NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -File `"$script`"" `
  -WorkingDirectory (Split-Path -Parent $PSScriptRoot)
$disparo = New-ScheduledTaskTrigger -AtLogOn -User "$env:USERDOMAIN\$env:USERNAME"
$ajustes = New-ScheduledTaskSettingsSet -StartWhenAvailable -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries `
  -ExecutionTimeLimit ([TimeSpan]::Zero) -RestartCount 999 -RestartInterval (New-TimeSpan -Minutes 1) -MultipleInstances IgnoreNew
Register-ScheduledTask -TaskName $nombre -Action $accion -Trigger $disparo -Settings $ajustes `
  -Description 'Enciende la mesa de ayuda (modo producción, puerto 5173) al iniciar sesión y la vuelve a levantar si se cae.' -Force | Out-Null
Write-Host "Tarea $nombre registrada: el sistema se encenderá solo al iniciar sesión."
