@echo off
setlocal EnableExtensions
TITLE Oficina Tecnica Dashboard Debug Launcher
CLS
ECHO ==========================================================
ECHO    INICIANDO DASHBOARD - MODO DIAGNOSTICO
ECHO ==========================================================
ECHO.

pushd "%~dp0" >nul 2>&1
if errorlevel 1 (
    ECHO [ERROR] No pude acceder a la carpeta del dashboard.
    PAUSE
    EXIT /B 1
)

SET "APP_DIR=%CD%"
SET "PYTHON_VERSION=3.14.0"
SET "PYTHON_INSTALLER=%TEMP%\python-%PYTHON_VERSION%-amd64.exe"
SET "PYTHON_EXE="
SET "PIP_TARGETS=flask pyyaml requests Pillow pdfplumber openpyxl msoffcrypto-tool waitress"

ECHO Ruta APP_DIR detectada: %APP_DIR%
ECHO.

call :resolve_python
IF NOT DEFINED PYTHON_EXE (
    ECHO [INFO] Python no encontrado. Instalando Python %PYTHON_VERSION%...
    call :install_python
    IF ERRORLEVEL 1 GOTO :fatal
    call :resolve_python
)

IF NOT DEFINED PYTHON_EXE (
    ECHO [ERROR] Python sigue sin estar disponible despues de la instalacion.
    GOTO :fatal
)

ECHO Python detectado en:
ECHO   %PYTHON_EXE%
"%PYTHON_EXE%" --version
ECHO.

ECHO [PASO 1] Intento de instalacion LOCAL (libs)...
"%PYTHON_EXE%" -m pip install %PIP_TARGETS% --no-index --find-links "%APP_DIR%\libs" --disable-pip-version-check --quiet
ECHO [DIAGNOSTICO] ErrorLevel tras Paso 1: %ERRORLEVEL%

IF %ERRORLEVEL% NEQ 0 (
    ECHO.
    ECHO [PASO 2] Instalacion local fallo. Intentando ONLINE...
    "%PYTHON_EXE%" -m pip install %PIP_TARGETS% --disable-pip-version-check --timeout 30
)

IF %ERRORLEVEL% NEQ 0 (
    ECHO.
    ECHO [ERROR] No se pudieron instalar las dependencias.
    GOTO :fatal
)

ECHO.
ECHO [DIAGNOSTICO] ErrorLevel tras instalacion: %ERRORLEVEL%
ECHO Iniciando aplicacion...
ECHO.

"%PYTHON_EXE%" "%APP_DIR%\app.py"
SET "APP_EXIT=%ERRORLEVEL%"

IF %APP_EXIT% NEQ 0 (
    ECHO.
    ECHO [ERROR FINAL] La aplicacion no pudo iniciar. Codigo: %APP_EXIT%
    GOTO :fatal
)

GOTO :end

:resolve_python
SET "PYTHON_EXE="
for /f "delims=" %%I in ('where.exe python 2^>nul') do (
    if not defined PYTHON_EXE SET "PYTHON_EXE=%%~fI"
)
IF DEFINED PYTHON_EXE (
    "%PYTHON_EXE%" --version >nul 2>&1
    IF ERRORLEVEL 1 SET "PYTHON_EXE="
)
IF DEFINED PYTHON_EXE GOTO :eof

for %%I in (
    "%LocalAppData%\Programs\Python\Python314\python.exe"
    "%ProgramFiles%\Python314\python.exe"
    "%ProgramFiles%\Python314-32\python.exe"
    "%ProgramFiles(x86)%\Python314-32\python.exe"
) do (
    if not defined PYTHON_EXE if exist %%~I SET "PYTHON_EXE=%%~I"
)
IF DEFINED PYTHON_EXE (
    "%PYTHON_EXE%" --version >nul 2>&1
    IF ERRORLEVEL 1 SET "PYTHON_EXE="
)
GOTO :eof

:install_python
ECHO [INFO] Descargando instalador oficial de Python %PYTHON_VERSION%...
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
    "[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; " ^
    "$url='https://www.python.org/ftp/python/%PYTHON_VERSION%/python-%PYTHON_VERSION%-amd64.exe'; " ^
    "Invoke-WebRequest -Uri $url -OutFile '%PYTHON_INSTALLER%'"
IF %ERRORLEVEL% NEQ 0 (
    ECHO [ERROR] No se pudo descargar Python.
    EXIT /B 1
)

ECHO [INFO] Ejecutando instalador silencioso de Python...
start /wait "" "%PYTHON_INSTALLER%" /quiet InstallAllUsers=0 PrependPath=1 Include_pip=1 Include_test=0 Include_launcher=1 SimpleInstall=1
IF %ERRORLEVEL% NEQ 0 (
    ECHO [ERROR] El instalador de Python devolvio un error.
    EXIT /B 1
)

SET "PATH=%LocalAppData%\Programs\Python\Python314;%LocalAppData%\Programs\Python\Python314\Scripts;%PATH%"
"%LocalAppData%\Programs\Python\Python314\python.exe" -m ensurepip --upgrade >nul 2>&1
EXIT /B 0

:fatal
ECHO.
ECHO Fin del script con errores.
PAUSE
popd
EXIT /B 1

:end
ECHO.
ECHO Fin del script.
PAUSE
popd
EXIT /B 0
