@echo off
setlocal EnableExtensions
TITLE BPB - Estado del Servidor

set "ROOT_DIR=%~dp0"
if "%ROOT_DIR:~-1%"=="\" set "ROOT_DIR=%ROOT_DIR:~0,-1%"
set "DASHBOARD_DIR=%ROOT_DIR%\Registro de Control de Producto\Codigos\Dashboard_PO"
set "MAILER_DIR=%ROOT_DIR%\Registro de Actividad\Codigos"
set "DASHBOARD_LOG=%ROOT_DIR%\_runtime_logs\dashboard.log"
set "MAILER_LOG=%ROOT_DIR%\Registro de Actividad\Codigos\logs\activity_mailer.log"
set "MAILER_LOCK=%ROOT_DIR%\Registro de Actividad\Codigos\data\activity_mailer.lock"

:loop
CLS
call :mostrar_estado
call :mostrar_menu
choice /C DMRNOFQ /N
if errorlevel 7 goto :fin
if errorlevel 6 goto :loop
if errorlevel 5 goto :accion_detener_otros
if errorlevel 4 goto :accion_iniciar_mailer
if errorlevel 3 goto :accion_iniciar_dashboard
if errorlevel 2 goto :accion_detener_mailer
if errorlevel 1 goto :accion_detener_dashboard
goto :loop

:accion_detener_dashboard
call :detener_dashboard
goto :loop

:accion_detener_mailer
call :detener_mailer
goto :loop

:accion_iniciar_dashboard
call :iniciar_dashboard
goto :loop

:accion_iniciar_mailer
call :iniciar_mailer
goto :loop

:accion_detener_otros
call :detener_otros
goto :loop


:: -------------------------------------------------------
:mostrar_estado
echo ==========================================================
echo   BPB Oficina Tecnica - Estado del Servidor
echo ==========================================================
echo.
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
    "$dashLog   = [System.IO.Path]::GetFullPath('%DASHBOARD_LOG%');" ^
    "$mailerLog = [System.IO.Path]::GetFullPath('%MAILER_LOG%');" ^
    "$mailerLock = [System.IO.Path]::GetFullPath('%MAILER_LOCK%');" ^
    "$pythonNames = @('python.exe','pythonw.exe');" ^
    "$dashboardPid = $null;" ^
    "$mailerPid = $null;" ^
    "" ^
    "Write-Host '--- PUERTO 8080 (Dashboard) ---' -ForegroundColor Cyan;" ^
    "$port = Get-NetTCPConnection -LocalPort 8080 -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1;" ^
    "if ($port) {" ^
    "    $dashboardPid = $port.OwningProcess;" ^
    "    Write-Host '[OK] Puerto 8080 activo. PID: ' -ForegroundColor Green -NoNewline;" ^
    "    Write-Host $port.OwningProcess;" ^
    "} else {" ^
    "    Write-Host '[DETENIDO] Nadie escucha en puerto 8080.' -ForegroundColor Red;" ^
    "}" ^
    "" ^
    "Write-Host '';" ^
    "Write-Host '--- PROCESOS PYTHON ACTIVOS ---' -ForegroundColor Cyan;" ^
    "if (Test-Path $mailerLock) {" ^
    "    $lockText = (Get-Content $mailerLock -ErrorAction SilentlyContinue | Select-Object -First 1);" ^
    "    if ($lockText -and $lockText.Trim() -match '^\d+$') { $mailerPid = [int]$lockText.Trim() }" ^
    "}" ^
    "$procs = Get-CimInstance Win32_Process | Where-Object { $pythonNames -contains $_.Name } | Select-Object ProcessId, Name, CommandLine, CreationDate, ExecutablePath;" ^
    "if ($procs) {" ^
    "    function Get-ShortText([string]$text, [int]$max = 90) {" ^
    "        if ([string]::IsNullOrWhiteSpace($text)) { return '(sin CommandLine visible)' }" ^
    "        $clean = ($text -replace '\s+', ' ').Trim();" ^
    "        if ($clean.Length -le $max) { return $clean }" ^
    "        return $clean.Substring(0, $max - 3) + '...';" ^
    "    }" ^
    "    foreach ($p in $procs) {" ^
    "        $script = if ($dashboardPid -and $p.ProcessId -eq $dashboardPid) { 'Dashboard (puerto 8080)' }" ^
    "                  elseif ($mailerPid -and $p.ProcessId -eq $mailerPid) { 'Activity Mailer (lock)' }" ^
    "                  elseif ($p.CommandLine -match 'app\.py') { 'Dashboard (app.py)' }" ^
    "                  elseif ($p.CommandLine -match 'activity_mailer\.py') { 'Activity Mailer' }" ^
    "                  else { 'Python (otro)' };" ^
    "        $uptime = if ($p.CreationDate) { $d = (Get-Date) - $p.CreationDate; ('{0}h {1}m' -f [int]$d.TotalHours, $d.Minutes) } else { '?' };" ^
    "        $color = if ($script -eq 'Python (otro)') { 'Yellow' } else { 'Green' };" ^
    "        Write-Host ('[PID {0}] {1,-25} Activo hace: {2}' -f $p.ProcessId, $script, $uptime) -ForegroundColor $color;" ^
    "        Write-Host ('          {0} | {1}' -f $p.Name, (Get-ShortText $p.CommandLine)) -ForegroundColor DarkGray;" ^
    "    }" ^
    "} else {" ^
    "    Write-Host '[NINGUNO] No hay procesos python corriendo.' -ForegroundColor Red;" ^
    "}" ^
    "" ^
    "Write-Host '';" ^
    "Write-Host '--- LOG Dashboard (ultimas 6 lineas) ---' -ForegroundColor Cyan;" ^
    "if (Test-Path $dashLog) {" ^
    "    $lines = Get-Content $dashLog -Tail 6 -ErrorAction SilentlyContinue;" ^
    "    if ($lines) { $lines | ForEach-Object { Write-Host $_ } } else { Write-Host '(log vacio)' -ForegroundColor DarkGray }" ^
    "} else { Write-Host '(archivo no encontrado)' -ForegroundColor DarkGray }" ^
    "" ^
    "Write-Host '';" ^
    "Write-Host '--- LOG Activity Mailer (ultimas 6 lineas) ---' -ForegroundColor Cyan;" ^
    "if (Test-Path $mailerLog) {" ^
    "    $lines = Get-Content $mailerLog -Tail 6 -Encoding UTF8 -ErrorAction SilentlyContinue;" ^
    "    if ($lines) { $lines | ForEach-Object { Write-Host $_ } } else { Write-Host '(log vacio)' -ForegroundColor DarkGray }" ^
    "} else { Write-Host '(archivo no encontrado)' -ForegroundColor DarkGray }"
goto :eof


:: -------------------------------------------------------
:mostrar_menu
echo.
echo ==========================================================
echo   D = Detener Dashboard        R = Relanzar Dashboard
echo   M = Detener Activity Mailer  N = Relanzar Activity Mailer
echo   O = Detener Python (Otros)  F = Refrescar
echo   Q = Salir
echo ==========================================================
goto :eof


:: -------------------------------------------------------
:detener_dashboard
echo.
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
    "$port = Get-NetTCPConnection -LocalPort 8080 -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1;" ^
    "$p = $null;" ^
    "if ($port) { $p = Get-Process -Id $port.OwningProcess -ErrorAction SilentlyContinue | Where-Object { $_.ProcessName -match '^pythonw?$' } | Select-Object -First 1 }" ^
    "if (-not $p) { $p = Get-CimInstance Win32_Process | Where-Object { @('python.exe','pythonw.exe') -contains $_.Name -and $_.CommandLine -match 'app\.py' } | Select-Object -First 1 }" ^
    "if ($p) {" ^
    "    $procPid = if ($p.ProcessId) { $p.ProcessId } else { $p.Id };" ^
    "    $stopError = $null;" ^
    "    try { Stop-Process -Id $procPid -Force -ErrorAction Stop } catch { $stopError = $_.Exception.Message }" ^
    "    Start-Sleep -Milliseconds 400;" ^
    "    $alive = Get-Process -Id $procPid -ErrorAction SilentlyContinue;" ^
    "    if ($alive) {" ^
    "        try { $tk = Start-Process -FilePath 'taskkill.exe' -ArgumentList '/PID', $procPid, '/F' -WindowStyle Hidden -Wait -PassThru -ErrorAction Stop; if (-not $stopError -and $tk.ExitCode -ne 0) { $stopError = 'taskkill devolvio codigo ' + $tk.ExitCode } } catch { if (-not $stopError) { $stopError = $_.Exception.Message } }" ^
    "        Start-Sleep -Milliseconds 400;" ^
    "        $alive = Get-Process -Id $procPid -ErrorAction SilentlyContinue;" ^
    "    }" ^
    "    if ($alive) {" ^
    "        if ($stopError -match 'denied|denegado') {" ^
    "            Write-Host ('[ERROR] No se pudo detener el Dashboard (PID {0}): acceso denegado. Ejecutar estado_servidor.bat como administrador.' -f $procPid) -ForegroundColor Red;" ^
    "        } else {" ^
    "            $detail = if ($stopError) { $stopError } else { 'Sigue activo.' };" ^
    "            Write-Host ('[ERROR] No se pudo detener el Dashboard (PID {0}). {1}' -f $procPid, $detail) -ForegroundColor Red;" ^
    "        }" ^
    "    } else {" ^
    "        Write-Host ('[OK] Dashboard (PID {0}) detenido.' -f $procPid) -ForegroundColor Yellow;" ^
    "    }" ^
    "} else {" ^
    "    Write-Host '[INFO] Dashboard no estaba corriendo.' -ForegroundColor DarkGray;" ^
    "}"
timeout /t 2 /nobreak >nul
goto :eof


:: -------------------------------------------------------
:detener_mailer
echo.
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
    "$lock = [System.IO.Path]::GetFullPath('%MAILER_LOCK%');" ^
    "$lockPid = $null;" ^
    "$p = $null;" ^
    "if (Test-Path $lock) {" ^
    "    $lockText = (Get-Content $lock -ErrorAction SilentlyContinue | Select-Object -First 1);" ^
    "    if ($lockText -and $lockText.Trim() -match '^\d+$') { $lockPid = [int]$lockText.Trim() }" ^
    "}" ^
    "if ($lockPid) { $p = Get-Process -Id $lockPid -ErrorAction SilentlyContinue | Where-Object { $_.ProcessName -match '^pythonw?$' } | Select-Object -First 1 }" ^
    "if (-not $p) { $p = Get-CimInstance Win32_Process | Where-Object { @('python.exe','pythonw.exe') -contains $_.Name -and $_.CommandLine -match 'activity_mailer\.py' } | Select-Object -First 1 }" ^
    "if ($p) {" ^
    "    $procPid = if ($p.ProcessId) { $p.ProcessId } else { $p.Id };" ^
    "    $stopError = $null;" ^
    "    try { Stop-Process -Id $procPid -Force -ErrorAction Stop } catch { $stopError = $_.Exception.Message }" ^
    "    Start-Sleep -Milliseconds 400;" ^
    "    $alive = Get-Process -Id $procPid -ErrorAction SilentlyContinue;" ^
    "    if ($alive) {" ^
    "        try { $tk = Start-Process -FilePath 'taskkill.exe' -ArgumentList '/PID', $procPid, '/F' -WindowStyle Hidden -Wait -PassThru -ErrorAction Stop; if (-not $stopError -and $tk.ExitCode -ne 0) { $stopError = 'taskkill devolvio codigo ' + $tk.ExitCode } } catch { if (-not $stopError) { $stopError = $_.Exception.Message } }" ^
    "        Start-Sleep -Milliseconds 400;" ^
    "        $alive = Get-Process -Id $procPid -ErrorAction SilentlyContinue;" ^
    "    }" ^
    "    if ($alive) {" ^
    "        if ($stopError -match 'denied|denegado') {" ^
    "            Write-Host ('[ERROR] No se pudo detener el Activity Mailer (PID {0}): acceso denegado. Ejecutar estado_servidor.bat como administrador.' -f $procPid) -ForegroundColor Red;" ^
    "        } else {" ^
    "            $detail = if ($stopError) { $stopError } else { 'Sigue activo.' };" ^
    "            Write-Host ('[ERROR] No se pudo detener el Activity Mailer (PID {0}). {1}' -f $procPid, $detail) -ForegroundColor Red;" ^
    "        }" ^
    "    } else {" ^
    "        Write-Host ('[OK] Activity Mailer (PID {0}) detenido.' -f $procPid) -ForegroundColor Yellow;" ^
    "    }" ^
    "} else {" ^
    "    Write-Host '[INFO] Activity Mailer no estaba corriendo.' -ForegroundColor DarkGray;" ^
    "}" ^
    "if (Test-Path $lock) { Remove-Item $lock -Force; Write-Host '[OK] Lock file eliminado.' -ForegroundColor DarkGray }"
timeout /t 2 /nobreak >nul
goto :eof


:: -------------------------------------------------------
:detener_otros
echo.
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
    "$mailerLock = [System.IO.Path]::GetFullPath('%MAILER_LOCK%');" ^
    "$pythonNames = @('python.exe','pythonw.exe');" ^
    "$dashboardPid = $null;" ^
    "$mailerPid = $null;" ^
    "$port = Get-NetTCPConnection -LocalPort 8080 -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1;" ^
    "if ($port) { $dashboardPid = $port.OwningProcess }" ^
    "if (Test-Path $mailerLock) {" ^
    "    $lockText = (Get-Content $mailerLock -ErrorAction SilentlyContinue | Select-Object -First 1);" ^
    "    if ($lockText -and $lockText.Trim() -match '^\d+$') { $mailerPid = [int]$lockText.Trim() }" ^
    "}" ^
    "$others = Get-CimInstance Win32_Process | Where-Object { $pythonNames -contains $_.Name -and $_.ProcessId -ne $dashboardPid -and $_.ProcessId -ne $mailerPid } | Select-Object ProcessId, Name, CommandLine, CreationDate;" ^
    "if (-not $others) { Write-Host '[INFO] No hay Python (otros) para detener.' -ForegroundColor DarkGray; exit 1 }" ^
    "function Get-ShortText([string]$text, [int]$max = 120) {" ^
    "    if ([string]::IsNullOrWhiteSpace($text)) { return '(sin CommandLine visible)' }" ^
    "    $clean = ($text -replace '\s+', ' ').Trim();" ^
    "    if ($clean.Length -le $max) { return $clean }" ^
    "    return $clean.Substring(0, $max - 3) + '...';" ^
    "}" ^
    "Write-Host 'PIDs disponibles para detener:' -ForegroundColor Cyan;" ^
    "$others | ForEach-Object {" ^
    "    $uptime = if ($_.CreationDate) { $d = (Get-Date) - $_.CreationDate; ('{0}h {1}m' -f [int]$d.TotalHours, $d.Minutes) } else { '?' };" ^
    "    Write-Host ('  PID {0,-6} {1,-10} {2}' -f $_.ProcessId, $_.Name, $uptime) -ForegroundColor Yellow;" ^
    "    Write-Host ('           {0}' -f (Get-ShortText $_.CommandLine)) -ForegroundColor DarkGray;" ^
    "}"
if errorlevel 1 (
    timeout /t 2 /nobreak >nul
    goto :eof
)
set "OTHER_PID="
set /p OTHER_PID=PID a detener (Enter cancela): 
if not defined OTHER_PID goto :eof
echo %OTHER_PID%| findstr /R "^[0-9][0-9]*$" >nul
if errorlevel 1 (
    echo [ERROR] PID invalido.
    timeout /t 2 /nobreak >nul
    goto :eof
)
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
    "$targetPid = [int]'%OTHER_PID%';" ^
    "$mailerLock = [System.IO.Path]::GetFullPath('%MAILER_LOCK%');" ^
    "$pythonNames = @('python.exe','pythonw.exe');" ^
    "$dashboardPid = $null;" ^
    "$mailerPid = $null;" ^
    "$port = Get-NetTCPConnection -LocalPort 8080 -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1;" ^
    "if ($port) { $dashboardPid = $port.OwningProcess }" ^
    "if (Test-Path $mailerLock) {" ^
    "    $lockText = (Get-Content $mailerLock -ErrorAction SilentlyContinue | Select-Object -First 1);" ^
    "    if ($lockText -and $lockText.Trim() -match '^\d+$') { $mailerPid = [int]$lockText.Trim() }" ^
    "}" ^
    "$p = Get-CimInstance Win32_Process | Where-Object { $pythonNames -contains $_.Name -and $_.ProcessId -eq $targetPid -and $_.ProcessId -ne $dashboardPid -and $_.ProcessId -ne $mailerPid } | Select-Object -First 1;" ^
    "if ($p) {" ^
    "    $stopError = $null;" ^
    "    try { Stop-Process -Id $targetPid -Force -ErrorAction Stop } catch { $stopError = $_.Exception.Message }" ^
    "    Start-Sleep -Milliseconds 400;" ^
    "    $alive = Get-Process -Id $targetPid -ErrorAction SilentlyContinue;" ^
    "    if ($alive) {" ^
    "        try { $tk = Start-Process -FilePath 'taskkill.exe' -ArgumentList '/PID', $targetPid, '/F' -WindowStyle Hidden -Wait -PassThru -ErrorAction Stop; if (-not $stopError -and $tk.ExitCode -ne 0) { $stopError = 'taskkill devolvio codigo ' + $tk.ExitCode } } catch { if (-not $stopError) { $stopError = $_.Exception.Message } }" ^
    "        Start-Sleep -Milliseconds 400;" ^
    "        $alive = Get-Process -Id $targetPid -ErrorAction SilentlyContinue;" ^
    "    }" ^
    "    if ($alive) {" ^
    "        if ($stopError -match 'denied|denegado') {" ^
    "            Write-Host ('[ERROR] No se pudo detener Python (otro) PID {0}: acceso denegado. Ejecutar estado_servidor.bat como administrador.' -f $targetPid) -ForegroundColor Red;" ^
    "        } else {" ^
    "            $detail = if ($stopError) { $stopError } else { 'Sigue activo.' };" ^
    "            Write-Host ('[ERROR] No se pudo detener Python (otro) PID {0}. {1}' -f $targetPid, $detail) -ForegroundColor Red;" ^
    "        }" ^
    "    } else {" ^
    "        Write-Host ('[OK] Python (otro) PID {0} detenido.' -f $targetPid) -ForegroundColor Yellow;" ^
    "    }" ^
    "} else {" ^
    "    Write-Host '[INFO] Ese PID ya no existe o no pertenece a Python (otro).' -ForegroundColor DarkGray;" ^
    "}"
timeout /t 2 /nobreak >nul
goto :eof


:: -------------------------------------------------------
:iniciar_dashboard
echo.
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
    "$port = Get-NetTCPConnection -LocalPort 8080 -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1;" ^
    "if ($port) {" ^
    "    $owner = Get-Process -Id $port.OwningProcess -ErrorAction SilentlyContinue;" ^
    "    if ($owner -and $owner.ProcessName -match '^pythonw?$') {" ^
    "        Write-Host '[INFO] Dashboard ya esta corriendo. Detenerlo primero con D.' -ForegroundColor DarkGray; exit" ^
    "    }" ^
    "}" ^
    "if ($port) { Write-Host '[INFO] Puerto 8080 ocupado por otro proceso.' -ForegroundColor DarkGray; exit }" ^
    "Write-Host 'Lanzando Dashboard...' -ForegroundColor Yellow;" ^
    "$wd = [System.IO.Path]::GetFullPath('%DASHBOARD_DIR%');" ^
    "$out = [System.IO.Path]::GetFullPath('%DASHBOARD_LOG%');" ^
    "Start-Process -FilePath 'cmd.exe' -WorkingDirectory $wd -ArgumentList '/c call run_dashboard_v2.bat 2>&1' -WindowStyle Hidden -RedirectStandardOutput $out;" ^
    "Start-Sleep -Seconds 8;" ^
    "$ok = Get-NetTCPConnection -LocalPort 8080 -State Listen -ErrorAction SilentlyContinue;" ^
    "if ($ok) { Write-Host '[OK] Dashboard levantado correctamente.' -ForegroundColor Green } else { Write-Host '[ERROR] Dashboard no respondio. Revisar log.' -ForegroundColor Red }"
timeout /t 2 /nobreak >nul
goto :eof


:: -------------------------------------------------------
:iniciar_mailer
echo.
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
    "$lock = [System.IO.Path]::GetFullPath('%MAILER_LOCK%');" ^
    "$lockPid = $null;" ^
    "$p = $null;" ^
    "if (Test-Path $lock) {" ^
    "    $lockText = (Get-Content $lock -ErrorAction SilentlyContinue | Select-Object -First 1);" ^
    "    if ($lockText -and $lockText.Trim() -match '^\d+$') { $lockPid = [int]$lockText.Trim() }" ^
    "}" ^
    "if ($lockPid) { $p = Get-Process -Id $lockPid -ErrorAction SilentlyContinue | Where-Object { $_.ProcessName -match '^pythonw?$' } | Select-Object -First 1 }" ^
    "if (-not $p) { $p = Get-CimInstance Win32_Process | Where-Object { @('python.exe','pythonw.exe') -contains $_.Name -and $_.CommandLine -match 'activity_mailer\.py' } | Select-Object -First 1 }" ^
    "if ($p) { Write-Host '[INFO] Activity Mailer ya esta corriendo. Detenerlo primero con M.' -ForegroundColor DarkGray; exit }" ^
    "if (Test-Path $lock) { Remove-Item $lock -Force; Write-Host '[INFO] Lock huerfano eliminado.' -ForegroundColor DarkGray }" ^
    "Write-Host 'Lanzando Activity Mailer...' -ForegroundColor Yellow;" ^
    "$wd = [System.IO.Path]::GetFullPath('%MAILER_DIR%');" ^
    "$out = [System.IO.Path]::GetFullPath('%MAILER_LOG%');" ^
    "Start-Process -FilePath 'cmd.exe' -WorkingDirectory $wd -ArgumentList '/c call run_activity_mailer.bat 2>&1' -WindowStyle Hidden -RedirectStandardOutput $out;" ^
    "Start-Sleep -Seconds 4;" ^
    "$p2 = $null;" ^
    "if (Test-Path $lock) {" ^
    "    $lockText2 = (Get-Content $lock -ErrorAction SilentlyContinue | Select-Object -First 1);" ^
    "    if ($lockText2 -and $lockText2.Trim() -match '^\d+$') { $p2 = Get-Process -Id ([int]$lockText2.Trim()) -ErrorAction SilentlyContinue | Where-Object { $_.ProcessName -match '^pythonw?$' } | Select-Object -First 1 }" ^
    "}" ^
    "if (-not $p2) { $p2 = Get-CimInstance Win32_Process | Where-Object { @('python.exe','pythonw.exe') -contains $_.Name -and $_.CommandLine -match 'activity_mailer\.py' } | Select-Object -First 1 }" ^
    "if ($p2) { Write-Host '[OK] Activity Mailer levantado correctamente.' -ForegroundColor Green } else { Write-Host '[ERROR] Activity Mailer no inicio. Revisar log.' -ForegroundColor Red }"
timeout /t 2 /nobreak >nul
goto :eof


:: -------------------------------------------------------
:fin
exit /b 0
