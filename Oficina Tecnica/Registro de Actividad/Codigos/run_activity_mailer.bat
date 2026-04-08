@echo off
REM Arranca el mailer asegurando el directorio y el interprete correcto
setlocal EnableExtensions
pushd "%~dp0"
if errorlevel 1 exit /b 1
REM Forzar credenciales no-reply para SMTP/IMAP (evita tomar variables de entorno anteriores)
set "SMTP_USER=no-reply@bpbargentina.com"
set "SMTP_PASS=mtky inyj bntn oxii"
set "IMAP_USER=no-reply@bpbargentina.com"
set "IMAP_PASS=mtky inyj bntn oxii"
set "SMTP_FROM_ADDR=no-reply@bpbargentina.com"
set "SMTP_FROM_NAME=Oficina Tecnica"
where python >nul 2>&1
if not errorlevel 1 (
    python activity_mailer.py --loop
    goto :end
)

where py >nul 2>&1
if not errorlevel 1 (
    py -3 activity_mailer.py --loop
    goto :end
)

echo No se encontro Python en PATH.
exit /b 1

:end
popd
