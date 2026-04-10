@echo off
TITLE BPB Dashboard - LOCAL DEV MODE
CLS
ECHO ==========================================================
ECHO    INICIANDO DASHBOARD - MODO LOCAL (COPIA)
ECHO ==========================================================
ECHO.

:: Set paths
SET "SCRIPT_DIR=%~dp0"
IF %SCRIPT_DIR:~-1%==\ SET SCRIPT_DIR=%SCRIPT_DIR:~0,-1%

:: Calculate Base Dir (Up 2 levels: Dashboard_PO -> Codigos -> ProjectRoot)
pushd "%SCRIPT_DIR%\..\.."
SET "LOCAL_BASE=%CD%"
popd

:: Force App to use Local Base
SET "BPB_BASE_DIR=%LOCAL_BASE%"
SET "BPB_SERVER_HOST=0.0.0.0"
SET "BPB_SERVER_PORT=8080"
SET "BPB_BROWSER_HOST=127.0.0.1"

ECHO.
ECHO [CONFIG] Forzando directorio base:
ECHO %BPB_BASE_DIR%
ECHO.
ECHO [CONFIG] Host servidor: %BPB_SERVER_HOST%
ECHO [CONFIG] Puerto: %BPB_SERVER_PORT%
ECHO.

:: Run App
python "%SCRIPT_DIR%\app.py"

PAUSE
