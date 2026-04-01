@echo off
setlocal
set "LOG=\\BPBSRV03\lcontigiani\Proyecto Costos\Codigo\Logs\Launcher.log"
set "PYTHON_EXE=C:\Users\lcontigiani\AppData\Local\Programs\Python\Python314\python.exe"
set "WORKDIR=\\BPBSRV03\lcontigiani\Proyecto Costos\Codigo\Codigos"

REM Config SMTP
set "SMTP_HOST=smtp.gmail.com"
set "SMTP_PORT=465"
set "SMTP_USER=costos@bpbargentina.com"
set "SMTP_PASS=owob tfyq qlel pyaz"
set "SMTP_STARTTLS=0"
set "SMTP_FROM=costos@bpbargentina.com"
set "EMAIL_TO=lcontigiani@bpbargentina.com"

echo [%date% %time%] Lanzador iniciado >> "%LOG%"
if not exist "%PYTHON_EXE%" (
    echo [%date% %time%] ERROR: No se encontro PYTHON_EXE en %PYTHON_EXE% >> "%LOG%"
    exit /b 1
)
pushd "%WORKDIR%" || (
    echo [%date% %time%] ERROR: No se pudo cambiar a %WORKDIR% >> "%LOG%"
    exit /b 1
)
"%PYTHON_EXE%" Service.py >> "%LOG%" 2>&1
set "RC=%ERRORLEVEL%"
echo [%date% %time%] Service.py finalizado rc=%RC% >> "%LOG%"
popd
endlocal
