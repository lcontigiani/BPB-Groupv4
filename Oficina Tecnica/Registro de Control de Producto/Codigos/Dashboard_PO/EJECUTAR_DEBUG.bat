@echo off
TITLE Diagnostico Tabla Auxiliar
CLS
ECHO ==========================================================
ECHO    HERRAMIENTA DE DIAGNOSTICO - TABLA AUXILIAR
ECHO ==========================================================
ECHO.
ECHO Esta herramienta te ayudara a ver por que no sale la tabla.
ECHO Necesitaras copiar y pegar:
ECHO   1. El ID de la PO (ej: PO-250113-1)
ECHO   2. El Codigo de Producto (el primer dato de la tabla roja)
ECHO.

:: Path Safe
pushd "\\BPBSRV03\lcontigiani\Oficina Tecnica\Registro de Control de Producto\Codigos\Dashboard_PO"

:: Detect Python
SET PYTHON_CMD=python
%PYTHON_CMD% --version >nul 2>&1
IF %ERRORLEVEL% NEQ 0 SET PYTHON_CMD=py

%PYTHON_CMD% debug_aux_lookup.py
pause
