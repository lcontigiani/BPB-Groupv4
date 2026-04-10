@echo off
setlocal EnableExtensions
TITLE BPB - Configurar Energia
CLS

echo ==========================================================
echo   BPB Oficina Tecnica - Configurar Energia del Sistema
echo ==========================================================
echo.
echo Aplicando configuracion para evitar apagados automaticos...
echo.

:: Evitar que el monitor se apague (enchufado)
powercfg /change monitor-timeout-ac 0
:: Evitar que el monitor se apague (bateria)
powercfg /change monitor-timeout-dc 0

:: Evitar que el disco se apague
powercfg /change disk-timeout-ac 0
powercfg /change disk-timeout-dc 0

:: Evitar suspension (enchufado)
powercfg /change standby-timeout-ac 0
:: Evitar suspension (bateria)
powercfg /change standby-timeout-dc 0

:: Evitar hibernacion
powercfg /change hibernate-timeout-ac 0
powercfg /change hibernate-timeout-dc 0
powercfg /hibernate off

if %errorlevel%==0 (
    echo [OK] Configuracion aplicada correctamente:
    echo.
    echo   - Suspension:   DESACTIVADA
    echo   - Hibernacion:  DESACTIVADA
    echo   - Apagado disco: DESACTIVADO
    echo   - Apagado monitor: DESACTIVADO
    echo.
    echo La computadora no se apagara ni suspendera automaticamente.
) else (
    echo [ERROR] Algunos cambios requieren permisos de Administrador.
    echo Ejecuta este archivo como Administrador.
)

echo.
pause
exit /b 0
