# fijar-ip.ps1 — Deja FIJA la IP de esta PC (la que hoy tiene), para que la
# dirección del sistema (http://IP:5173) no cambie cuando el router reparte IPs.
#
#   Clic derecho → "Ejecutar con PowerShell" como ADMINISTRADOR, o:
#   powershell -ExecutionPolicy Bypass -File scripts\fijar-ip.ps1            (fija la IP actual)
#   powershell -ExecutionPolicy Bypass -File scripts\fijar-ip.ps1 -Deshacer  (vuelve a IP automática)
#
# Toma la IP, máscara, puerta de enlace y DNS que la PC tiene AHORA (red 192.168.x).
# Importante: pide también al administrador de la red que RESERVE o EXCLUYA esa IP
# en el router; si no, el router podría dársela a otro equipo y chocarían.
param([switch]$Deshacer)

$admin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $admin) {
  # Se vuelve a abrir pidiendo permisos de administrador (aparece la ventana de Windows).
  $args2 = "-NoProfile -ExecutionPolicy Bypass -File `"$PSCommandPath`"" + ($(if ($Deshacer) { " -Deshacer" } else { "" }))
  Start-Process powershell.exe -Verb RunAs -ArgumentList $args2
  return
}

$c = Get-NetIPConfiguration | Where-Object { $_.IPv4Address.IPAddress -like '192.168.*' -and $_.IPv4DefaultGateway } | Select-Object -First 1
if (-not $c) { Write-Host "No encontré una conexión de red 192.168.x con puerta de enlace." -ForegroundColor Red; Read-Host "Enter para salir"; return }
$alias = $c.InterfaceAlias

if ($Deshacer) {
  Set-NetIPInterface -InterfaceAlias $alias -Dhcp Enabled
  Set-DnsClientServerAddress -InterfaceAlias $alias -ResetServerAddresses
  Remove-NetRoute -InterfaceAlias $alias -DestinationPrefix '0.0.0.0/0' -Confirm:$false -ErrorAction SilentlyContinue
  ipconfig /renew "$alias" | Out-Null
  Write-Host "Listo: '$alias' vuelve a tomar la IP automáticamente (DHCP)." -ForegroundColor Green
  Read-Host "Enter para salir"; return
}

$ip      = $c.IPv4Address.IPAddress
$prefijo = $c.IPv4Address.PrefixLength
$gw      = $c.IPv4DefaultGateway.NextHop
$dns     = ($c.DNSServer | Where-Object AddressFamily -eq 2).ServerAddresses
Write-Host "Se fijará en '$alias':  IP $ip/$prefijo  ·  puerta de enlace $gw  ·  DNS $($dns -join ', ')"

Set-NetIPInterface -InterfaceAlias $alias -Dhcp Disabled
Remove-NetIPAddress -InterfaceAlias $alias -AddressFamily IPv4 -Confirm:$false -ErrorAction SilentlyContinue
Remove-NetRoute -InterfaceAlias $alias -DestinationPrefix '0.0.0.0/0' -Confirm:$false -ErrorAction SilentlyContinue
New-NetIPAddress -InterfaceAlias $alias -IPAddress $ip -PrefixLength $prefijo -DefaultGateway $gw | Out-Null
if ($dns) { Set-DnsClientServerAddress -InterfaceAlias $alias -ServerAddresses $dns }

Start-Sleep -Seconds 3
$ok = Test-Connection -ComputerName $gw -Count 2 -Quiet
if ($ok) { Write-Host "Listo: la IP $ip quedó FIJA y la red responde." -ForegroundColor Green }
else     { Write-Host "La IP quedó fija pero la puerta de enlace no responde. Si no hay internet, ejecuta este script con -Deshacer." -ForegroundColor Yellow }
Read-Host "Enter para salir"
