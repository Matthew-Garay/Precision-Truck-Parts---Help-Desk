# liberar-puertos.ps1 — libera 3001 (backend) y 5173 (frontend) antes de `npm run all`.
# Sin esto, un `node` colgado de una corrida anterior deja "Port is already in use"
# y concurrently (-k) mata al otro proceso: parece que "nada arranca".
# NOTA: cada puerto se consulta por separado dentro de try/catch porque
# Get-NetTCPConnection devuelve error nativo (exit 1) cuando NO hay conexiones,
# y eso hacía que npm cancelara `npm run all` sin arrancar nada.
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
