@echo off
TITLE BPB Dashboard - Acceso Cliente v2
ECHO ==========================================
ECHO   CONECTANDO AL SERVIDOR PRINCIPAL...
ECHO ==========================================
ECHO.
ECHO Servidor: BPBSRV03
ECHO.
ECHO Intentando conectar por Nombre de Red (Hostname)...
start http://BPBSRV03:5000

ECHO.
ECHO Intentando conectar por Direccion IP (192.168.0.137)...
start http://192.168.0.137:5000

ECHO.
ECHO Si se abren dos pestañas, usa la que funcione.
ECHO Si ninguna funciona, verifica que el Firewall/Antivirus permita el puerto 5000.
ECHO.
PAUSE
EXIT
