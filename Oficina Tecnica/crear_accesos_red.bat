@echo off
setlocal EnableExtensions
TITLE BPB Oficina Tecnica - Crear Accesos de Red
CLS

set "ROOT_DIR=%~dp0"
if "%ROOT_DIR:~-1%"=="\" set "ROOT_DIR=%ROOT_DIR:~0,-1%"
set "OUTPUT_DIR=%ROOT_DIR%\_accesos_red"

for /f "tokens=2 delims=:" %%I in ('ipconfig ^| findstr /R /C:"IPv4"') do (
    set "HOST_IP=%%I"
    goto :ip_ready
)

:ip_ready
set "HOST_IP=%HOST_IP: =%"
if not defined HOST_IP set "HOST_IP=192.168.0.137"

set "LOCAL_URL=http://127.0.0.1:8080/"
set "IP_URL=http://%HOST_IP%:8080/"

if not exist "%OUTPUT_DIR%" mkdir "%OUTPUT_DIR%"

:: --- Acceso LOCAL (solo esta PC) ---
>"%OUTPUT_DIR%\Oficina Tecnica - Local.url" echo [InternetShortcut]
>>"%OUTPUT_DIR%\Oficina Tecnica - Local.url" echo URL=%LOCAL_URL%
>>"%OUTPUT_DIR%\Oficina Tecnica - Local.url" echo IconFile=%SystemRoot%\system32\SHELL32.dll
>>"%OUTPUT_DIR%\Oficina Tecnica - Local.url" echo IconIndex=220

:: --- Acceso RED (otras PCs por IP) ---
>"%OUTPUT_DIR%\Oficina Tecnica - Red (%HOST_IP%).url" echo [InternetShortcut]
>>"%OUTPUT_DIR%\Oficina Tecnica - Red (%HOST_IP%).url" echo URL=%IP_URL%
>>"%OUTPUT_DIR%\Oficina Tecnica - Red (%HOST_IP%).url" echo IconFile=%SystemRoot%\system32\SHELL32.dll
>>"%OUTPUT_DIR%\Oficina Tecnica - Red (%HOST_IP%).url" echo IconIndex=220

:: --- LEER.txt informativo ---
>"%OUTPUT_DIR%\LEER.txt" echo Accesos generados para la red BPB.
>>"%OUTPUT_DIR%\LEER.txt" echo.
>>"%OUTPUT_DIR%\LEER.txt" echo  [Esta PC]       %LOCAL_URL%
>>"%OUTPUT_DIR%\LEER.txt" echo  [Otras PCs LAN] %IP_URL%
>>"%OUTPUT_DIR%\LEER.txt" echo.
>>"%OUTPUT_DIR%\LEER.txt" echo Compartir "Oficina Tecnica - Red (%HOST_IP%).url" con las otras PCs.
>>"%OUTPUT_DIR%\LEER.txt" echo Si la IP del servidor cambia, volver a correr este bat.

if not "%~1"=="--silent" (
    echo.
    echo Accesos generados en:
    echo   %OUTPUT_DIR%
    echo.
    echo   Esta PC ^(local^):  %LOCAL_URL%
    echo   Otras PCs ^(red^):  %IP_URL%
    echo.
    pause
)
exit /b 0
