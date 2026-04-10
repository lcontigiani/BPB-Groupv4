@echo off
setlocal EnableExtensions
TITLE BPB - Eliminar Inicio Automatico
CLS

set "TASK_NAME=BPB Oficina Tecnica - Inicio Automatico"

echo ==========================================================
echo   BPB Oficina Tecnica - Eliminar Inicio Automatico
echo ==========================================================
echo.

schtasks /delete /tn "%TASK_NAME%" /f >nul 2>&1

if %errorlevel%==0 (
    echo [OK] Tarea eliminada. El servidor ya no iniciara automaticamente.
) else (
    echo [INFO] La tarea no existia o ya habia sido eliminada.
)

echo.
pause
exit /b 0
