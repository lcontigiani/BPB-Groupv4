@echo off
setlocal EnableExtensions
TITLE BPB Oficina Tecnica - Host Local
CLS

set "ROOT_DIR=%~dp0"
if "%ROOT_DIR:~-1%"=="\" set "ROOT_DIR=%ROOT_DIR:~0,-1%"

set "DASHBOARD_DIR=%ROOT_DIR%\Registro de Control de Producto\Codigos\Dashboard_PO"
set "MAILER_DIR=%ROOT_DIR%\Registro de Actividad\Codigos"
set "RUNTIME_LOG_DIR=%ROOT_DIR%\_runtime_logs"
set "HOST_IP="

for /f "tokens=2 delims=:" %%I in ('ipconfig ^| findstr /R /C:"IPv4"') do (
    set "HOST_IP=%%I"
    goto :ip_ready
)

:ip_ready
set "HOST_IP=%HOST_IP: =%"
if not defined HOST_IP set "HOST_IP=192.168.0.137"

call "%ROOT_DIR%\crear_accesos_red.bat" --silent

set "BPB_SERVER_HOST=0.0.0.0"
set "BPB_SERVER_PORT=8080"
set "BPB_BROWSER_HOST=127.0.0.1"
set "BPB_DASHBOARD_URL=http://%HOST_IP%:8080/"
set "BPB_BASE_DIR=%ROOT_DIR%\Registro de Control de Producto"
set "DASHBOARD_LOG=%RUNTIME_LOG_DIR%\dashboard.log"
set "MAILER_LOG=%RUNTIME_LOG_DIR%\activity_mailer.log"

echo ==========================================================
echo   BPB Oficina Tecnica - Host Local
echo ==========================================================
echo Host LAN IP: %HOST_IP%
echo URL LAN:  %BPB_DASHBOARD_URL%
echo Puerto:   %BPB_SERVER_PORT%
echo.

>"%ROOT_DIR%\dashboard_url.txt" echo %BPB_DASHBOARD_URL%
if not exist "%RUNTIME_LOG_DIR%" mkdir "%RUNTIME_LOG_DIR%"

if exist "%DASHBOARD_DIR%\CONFIGURAR_FIREWALL.bat" (
    call "%DASHBOARD_DIR%\CONFIGURAR_FIREWALL.bat" --no-pause >nul 2>&1
)

set "DASHBOARD_STARTED=0"
set "MAILER_STARTED=0"

powershell -NoProfile -ExecutionPolicy Bypass -Command ^
    "if (Get-NetTCPConnection -LocalPort 8080 -State Listen -ErrorAction SilentlyContinue) { exit 1 } else { exit 0 }"
if %errorlevel%==1 (
    echo [YA ACTIVO] Dashboard ya corriendo en puerto 8080. No se reinicia.
) else (
    echo Iniciando dashboard en segundo plano...
    powershell -NoProfile -ExecutionPolicy Bypass -Command ^
        "$wd = [System.IO.Path]::GetFullPath('%DASHBOARD_DIR%');" ^
        "$out = [System.IO.Path]::GetFullPath('%DASHBOARD_LOG%');" ^
        "Start-Process -FilePath 'cmd.exe' -WorkingDirectory $wd -ArgumentList '/c call run_dashboard_v2.bat 2>&1' -WindowStyle Hidden -RedirectStandardOutput $out"
    set "DASHBOARD_STARTED=1"
)

powershell -NoProfile -ExecutionPolicy Bypass -Command ^
    "$p = Get-CimInstance Win32_Process -Filter \"Name='python.exe'\" | Where-Object { $_.CommandLine -match 'activity_mailer\.py' };" ^
    "if ($p) { exit 1 } else { exit 0 }"
if %errorlevel%==1 (
    echo [YA ACTIVO] Activity Mailer ya corriendo. No se reinicia.
) else (
    if exist "%MAILER_DIR%\data\activity_mailer.lock" (
        echo [INFO] Lock huerfano detectado. Limpiando...
        del "%MAILER_DIR%\data\activity_mailer.lock" >nul 2>&1
    )
    echo Iniciando activity mailer en segundo plano...
    powershell -NoProfile -ExecutionPolicy Bypass -Command ^
        "$wd = [System.IO.Path]::GetFullPath('%MAILER_DIR%');" ^
        "$out = [System.IO.Path]::GetFullPath('%MAILER_LOG%');" ^
        "Start-Process -FilePath 'cmd.exe' -WorkingDirectory $wd -ArgumentList '/c call run_activity_mailer.bat 2>&1' -WindowStyle Hidden -RedirectStandardOutput $out"
    set "MAILER_STARTED=1"
)

echo.
if "%DASHBOARD_STARTED%"=="1" echo   [INICIADO] Dashboard
if "%MAILER_STARTED%"=="1"   echo   [INICIADO] Activity Mailer
if "%DASHBOARD_STARTED%"=="0" if "%MAILER_STARTED%"=="0" echo   [SIN CAMBIOS] Todos los servicios ya estaban activos.
echo.
echo Acceso local: http://127.0.0.1:8080/
echo Acceso de red: %BPB_DASHBOARD_URL%
echo.
echo Logs:
echo   - %DASHBOARD_LOG%
echo   - %MAILER_LOG%
echo.
echo Esta ventana es solo el lanzador.
echo Si el inicio fue correcto, el sistema sigue funcionando aunque esta ventana se cierre.
echo.
echo Verificacion rapida:
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
    "Start-Sleep -Seconds 15; " ^
    "$ok = Get-NetTCPConnection -LocalPort 8080 -ErrorAction SilentlyContinue | Where-Object { $_.State -eq 'Listen' } | Select-Object -First 1; " ^
    "if ($ok) { Write-Host '[OK] Dashboard escuchando en puerto 8080.' } else { Write-Host '[ERROR] No se detecto escucha en puerto 8080. Revisar log:'; Write-Host '%DASHBOARD_LOG%' }"
echo.
pause
exit /b 0
