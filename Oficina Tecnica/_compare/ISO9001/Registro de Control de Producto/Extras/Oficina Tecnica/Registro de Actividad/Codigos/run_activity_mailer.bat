@echo off
REM Arranca el mailer asegurando el directorio y el interprete correcto
pushd "\\192.168.0.13\lcontigiani\Oficina Tecnica\Registro de Actividad\Codigos"
REM Forzar credenciales de costos para SMTP/IMAP (evita tomar variables de entorno anteriores)
set "SMTP_USER=costos@bpbargentina.com"
set "SMTP_PASS=ksoe dybt byya zcrz"
set "IMAP_USER=costos@bpbargentina.com"
set "IMAP_PASS=ksoe dybt byya zcrz"
set "SMTP_FROM_ADDR=costos@bpbargentina.com"
set "SMTP_FROM_NAME=Oficina Tecnica"
"C:\Users\lcontigiani\AppData\Local\Programs\Python\Python314\python.exe" activity_mailer.py --loop
