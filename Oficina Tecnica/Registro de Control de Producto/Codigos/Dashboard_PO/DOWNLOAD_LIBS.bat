@echo off
TITLE Descargando Librerias para Modo Offline
ECHO ====================================================
ECHO   PREPARANDO INSTALADORES OFFLINE (Libs)
ECHO ====================================================
ECHO.
ECHO Este script descarga las librerias necesarias (Flask, PyYAML)
ECHO y las guarda en la carpeta 'libs' para que otras computadoras
ECHO sin internet puedan instalarlas.
ECHO.

SET "LIBS_DIR=%~dp0libs"
IF NOT EXIST "%LIBS_DIR%" MKDIR "%LIBS_DIR%"

ECHO Descargando paquetes en: %LIBS_DIR%
ECHO.

:: Descargar paquetes actuales (basados en el Python de estad maquina)
:: Descargar paquetes actuales (basados en el Python de estad maquina)
pip download flask pyyaml requests Pillow pdfplumber openpyxl msoffcrypto-tool --dest "%LIBS_DIR%" --prefer-binary

IF %ERRORLEVEL% NEQ 0 (
    ECHO.
    ECHO [ERROR] Algo fallo en la descarga. Revisa tu conexion.
) ELSE (
    ECHO.
    ECHO [EXITO] Librerias descargadas correctamente.
    ECHO Ahora las otras computadoras podran instalarse desde aqui.
)

PAUSE
