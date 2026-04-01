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

ECHO.
ECHO [CONFIG] Forzando directorio base:
ECHO %BPB_BASE_DIR%
ECHO.

:: Run App
python "%SCRIPT_DIR%\app.py"

PAUSE
