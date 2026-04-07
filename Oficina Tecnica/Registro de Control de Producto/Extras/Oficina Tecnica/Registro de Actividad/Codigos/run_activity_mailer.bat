@echo off
REM Arranca el mailer asegurando el directorio y el interprete correcto
pushd "\\192.168.0.13\lcontigiani\Oficina Tecnica\Registro de Actividad\Codigos"
REM Forzar credenciales no-reply para SMTP/IMAP (evita tomar variables de entorno anteriores)
set "SMTP_USER=no-reply@bpbargentina.com"
set "SMTP_PASS=mtky inyj bntn oxii"
set "IMAP_USER=no-reply@bpbargentina.com"
set "IMAP_PASS=mtky inyj bntn oxii"
set "SMTP_FROM_ADDR=no-reply@bpbargentina.com"
set "SMTP_FROM_NAME=Oficina Tecnica"
"C:\Users\lcontigiani\AppData\Local\Programs\Python\Python314\python.exe" activity_mailer.py --loop
