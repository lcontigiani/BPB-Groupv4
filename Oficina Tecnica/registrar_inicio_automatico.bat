@echo off
setlocal EnableExtensions
TITLE BPB - Registrar Inicio Automatico
CLS

set "ROOT_DIR=%~dp0"
if "%ROOT_DIR:~-1%"=="\" set "ROOT_DIR=%ROOT_DIR:~0,-1%"
set "LAUNCHER=%ROOT_DIR%\iniciar_servidor_oficina_tecnica.bat"
set "TASK_NAME=BPB Oficina Tecnica - Inicio Automatico"

echo ==========================================================
echo   BPB Oficina Tecnica - Registro de Inicio Automatico
echo ==========================================================
echo.
echo Lanzador: %LAUNCHER%
echo Tarea:    %TASK_NAME%
echo Disparo:  Al iniciar sesion (%USERNAME%)
echo.

:: Eliminar tarea previa si existe (para poder actualizar)
schtasks /delete /tn "%TASK_NAME%" /f >nul 2>&1

:: Crear la tarea programada
schtasks /create ^
    /tn "%TASK_NAME%" ^
    /tr "cmd.exe /c \"%LAUNCHER%\"" ^
    /sc onlogon ^
    /ru "%USERNAME%" ^
    /delay 0001:00 ^
    /rl highest ^
    /f >nul 2>&1

if %errorlevel%==0 (
    echo [OK] Tarea registrada correctamente.
    echo.
    echo El servidor se iniciara automaticamente cuando inicies sesion.
    echo Delay de 1 minuto para dar tiempo a que la red este lista.
    echo.
    echo Para eliminar el inicio automatico, ejecutar:
    echo   eliminar_inicio_automatico.bat
) else (
    echo [ERROR] No se pudo registrar la tarea.
    echo Intentá ejecutar este archivo como Administrador.
)

echo.
pause
exit /b 0
