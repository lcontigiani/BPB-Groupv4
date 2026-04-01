@echo off
TITLE Configurando Firewall para Dashboard
ECHO ==========================================
ECHO   ABRIENDO PUERTO 5000 (FIREWALL)
ECHO ==========================================
ECHO.

netsh advfirewall firewall add rule name="BPB Dashboard" dir=in action=allow protocol=TCP localport=5000

IF %ERRORLEVEL% EQU 0 (
    ECHO.
    ECHO [EXITO] Puerto 5000 abierto correctamente.
    ECHO Ahora las otras computadoras podran usar ACCESO_CLIENTE.bat sin problemas.
) ELSE (
    ECHO.
    ECHO [ERROR] FALLO POR FALTA DE PERMISOS.
    ECHO ---------------------------------------------------------
    ECHO IMPORTANTE: Debes cerrar esto, hacer CLIC DERECHO sobre
    ECHO este archivo y elegir "EJECUTAR COMO ADMINISTRADOR".
    ECHO ---------------------------------------------------------
)
PAUSE
