@echo off
setlocal EnableExtensions
TITLE BPB - Estado del Servidor

set "ROOT_DIR=%~dp0"
if "%ROOT_DIR:~-1%"=="\" set "ROOT_DIR=%ROOT_DIR:~0,-1%"
set "DASHBOARD_DIR=%ROOT_DIR%\Registro de Control de Producto\Codigos\Dashboard_PO"
set "MAILER_DIR=%ROOT_DIR%\Registro de Actividad\Codigos"
set "DASHBOARD_LOG=%ROOT_DIR%\_runtime_logs\dashboard.log"
set "MAILER_LOG=%ROOT_DIR%\Registro de Actividad\Codigos\logs\activity_mailer.log"

:loop
CLS
call :mostrar_estado
call :mostrar_menu
choice /C DMRNFq /N
if errorlevel 6 goto :fin
if errorlevel 5 goto :loop
if errorlevel 4 call :iniciar_mailer    & goto :loop
if errorlevel 3 call :iniciar_dashboard & goto :loop
if errorlevel 2 call :detener_mailer    & goto :loop
if errorlevel 1 call :detener_dashboard & goto :loop
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
    "" ^
    "Write-Host '--- PUERTO 8080 (Dashboard) ---' -ForegroundColor Cyan;" ^
    "$port = Get-NetTCPConnection -LocalPort 8080 -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1;" ^
    "if ($port) {" ^
    "    Write-Host '[OK] Puerto 8080 activo. PID: ' -ForegroundColor Green -NoNewline;" ^
    "    Write-Host $port.OwningProcess;" ^
    "} else {" ^
    "    Write-Host '[DETENIDO] Nadie escucha en puerto 8080.' -ForegroundColor Red;" ^
    "}" ^
    "" ^
    "Write-Host '';" ^
    "Write-Host '--- PROCESOS PYTHON ACTIVOS ---' -ForegroundColor Cyan;" ^
    "$procs = Get-CimInstance Win32_Process -Filter \"Name='python.exe'\" | Select-Object ProcessId, CommandLine, CreationDate;" ^
    "if ($procs) {" ^
    "    foreach ($p in $procs) {" ^
    "        $script = if ($p.CommandLine -match 'app\.py') { 'Dashboard (app.py)' }" ^
    "                  elseif ($p.CommandLine -match 'activity_mailer\.py') { 'Activity Mailer' }" ^
    "                  else { 'Python (otro)' };" ^
    "        $uptime = if ($p.CreationDate) { $d = (Get-Date) - $p.CreationDate; ('{0}h {1}m' -f [int]$d.TotalHours, $d.Minutes) } else { '?' };" ^
    "        $color = if ($script -eq 'Python (otro)') { 'Yellow' } else { 'Green' };" ^
    "        Write-Host ('[PID {0}] {1,-25} Activo hace: {2}' -f $p.ProcessId, $script, $uptime) -ForegroundColor $color;" ^
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
echo   F = Refrescar               Q = Salir
echo ==========================================================
goto :eof


:: -------------------------------------------------------
:detener_dashboard
echo.
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
    "$p = Get-CimInstance Win32_Process -Filter \"Name='python.exe'\" | Where-Object { $_.CommandLine -match 'app\.py' } | Select-Object -First 1;" ^
    "if ($p) {" ^
    "    Stop-Process -Id $p.ProcessId -Force -ErrorAction SilentlyContinue;" ^
    "    Write-Host ('[OK] Dashboard (PID {0}) detenido.' -f $p.ProcessId) -ForegroundColor Yellow;" ^
    "} else {" ^
    "    Write-Host '[INFO] Dashboard no estaba corriendo.' -ForegroundColor DarkGray;" ^
    "}"
timeout /t 2 /nobreak >nul
goto :eof


:: -------------------------------------------------------
:detener_mailer
echo.
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
    "$lock = [System.IO.Path]::GetFullPath('%ROOT_DIR%\Registro de Actividad\Codigos\data\activity_mailer.lock');" ^
    "$p = Get-CimInstance Win32_Process -Filter \"Name='python.exe'\" | Where-Object { $_.CommandLine -match 'activity_mailer\.py' } | Select-Object -First 1;" ^
    "if ($p) {" ^
    "    Stop-Process -Id $p.ProcessId -Force -ErrorAction SilentlyContinue;" ^
    "    Write-Host ('[OK] Activity Mailer (PID {0}) detenido.' -f $p.ProcessId) -ForegroundColor Yellow;" ^
    "} else {" ^
    "    Write-Host '[INFO] Activity Mailer no estaba corriendo.' -ForegroundColor DarkGray;" ^
    "}" ^
    "if (Test-Path $lock) { Remove-Item $lock -Force; Write-Host '[OK] Lock file eliminado.' -ForegroundColor DarkGray }"
timeout /t 2 /nobreak >nul
goto :eof


:: -------------------------------------------------------
:iniciar_dashboard
echo.
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
    "$p = Get-CimInstance Win32_Process -Filter \"Name='python.exe'\" | Where-Object { $_.CommandLine -match 'app\.py' };" ^
    "if ($p) { Write-Host '[INFO] Dashboard ya esta corriendo. Detenerlo primero con D.' -ForegroundColor DarkGray; exit }" ^
    "$port = Get-NetTCPConnection -LocalPort 8080 -State Listen -ErrorAction SilentlyContinue;" ^
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
    "$p = Get-CimInstance Win32_Process -Filter \"Name='python.exe'\" | Where-Object { $_.CommandLine -match 'activity_mailer\.py' };" ^
    "if ($p) { Write-Host '[INFO] Activity Mailer ya esta corriendo. Detenerlo primero con M.' -ForegroundColor DarkGray; exit }" ^
    "$lock = [System.IO.Path]::GetFullPath('%ROOT_DIR%\Registro de Actividad\Codigos\data\activity_mailer.lock');" ^
    "if (Test-Path $lock) { Remove-Item $lock -Force; Write-Host '[INFO] Lock huerfano eliminado.' -ForegroundColor DarkGray }" ^
    "Write-Host 'Lanzando Activity Mailer...' -ForegroundColor Yellow;" ^
    "$wd = [System.IO.Path]::GetFullPath('%MAILER_DIR%');" ^
    "$out = [System.IO.Path]::GetFullPath('%MAILER_LOG%');" ^
    "Start-Process -FilePath 'cmd.exe' -WorkingDirectory $wd -ArgumentList '/c call run_activity_mailer.bat 2>&1' -WindowStyle Hidden -RedirectStandardOutput $out;" ^
    "Start-Sleep -Seconds 4;" ^
    "$p2 = Get-CimInstance Win32_Process -Filter \"Name='python.exe'\" | Where-Object { $_.CommandLine -match 'activity_mailer\.py' };" ^
    "if ($p2) { Write-Host '[OK] Activity Mailer levantado correctamente.' -ForegroundColor Green } else { Write-Host '[ERROR] Activity Mailer no inicio. Revisar log.' -ForegroundColor Red }"
timeout /t 2 /nobreak >nul
goto :eof


:: -------------------------------------------------------
:fin
exit /b 0
