@echo off
TITLE Oficina Tecnica Dashboard Debug Launcher
CLS
ECHO ==========================================================
ECHO    INICIANDO DASHBOARD - MODO DIAGNOSTICO
ECHO ==========================================================
ECHO.

SET "APP_DIR=\\192.168.0.13\lcontigiani\Oficina Tecnica\Registro de Control de Producto\Codigos\Dashboard_PO"
ECHO Ruta APP_DIR detectada: %APP_DIR%
ECHO.

:: Verificar que Python/Pip exista
python --version >nul 2>&1
IF %ERRORLEVEL% NEQ 0 (
    ECHO [ERROR] Python no encontrado en el PATH.
    ECHO Asegurate de tener Python instalado y aÃ±adido al PATH.
    PAUSE
    EXIT /B
)

ECHO Python encontrado. Verificando librerias...
ECHO.

:: Intento 1: OFFLINE
ECHO [PASO 1] Intento de instalacion LOCAL (libs)...
powershell -NoProfile -ExecutionPolicy Bypass -Command "$p='%APP_DIR%\libs'; pip install flask pyyaml requests Pillow pdfplumber openpyxl --no-index --find-links $p --quiet"

ECHO [DIAGNOSTICO] ErrorLevel tras Paso 1: %ERRORLEVEL%

IF %ERRORLEVEL% NEQ 0 (
    ECHO.
    ECHO [PASO 2] Instalacion local fallo. Intentando ONLINE...
    powershell -NoProfile -ExecutionPolicy Bypass -Command "pip install flask pyyaml requests Pillow pdfplumber openpyxl --disable-pip-version-check --timeout 5"
)

ECHO.
ECHO [DIAGNOSTICO] ErrorLevel tras instalacion: %ERRORLEVEL%
ECHO Iniciando aplicacion...
ECHO.

powershell -NoProfile -ExecutionPolicy Bypass -Command "python '%APP_DIR%\app.py'"

IF %ERRORLEVEL% NEQ 0 (
    ECHO.
    ECHO [AVISO] Fallo 'python', probando 'py'...
    powershell -NoProfile -ExecutionPolicy Bypass -Command "py '%APP_DIR%\app.py'"
)

IF %ERRORLEVEL% NEQ 0 (
    ECHO.
    ECHO [ERROR FINAL] La aplicacion no pudo iniciar.
)

ECHO.
ECHO Fin del script.
PAUSE
