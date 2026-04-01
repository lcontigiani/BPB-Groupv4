@echo off
setlocal

REM Moverse al directorio donde esta este archivo
pushd "%~dp0"

echo ==========================================
echo    VINCULAR CARPETA CON GITHUB
echo ==========================================
echo Repositorio: https://github.com/lcontigiani/Logistica.git
echo.

REM 1. Verificar Git
where git >nul 2>&1
if errorlevel 1 (
  echo [ERROR] Git no esta instalado o no se encuentra en el PATH.
  pause
  popd
  exit /b 1
)

REM 2. Inicializar si no existe
if not exist ".git" (
    echo [INFO] Inicializando repositorio Git...
    git init
)

REM 3. Configurar Remoto
echo [INFO] Configurando repositorio remoto...
git remote remove origin >nul 2>&1
git remote add origin https://github.com/lcontigiani/Logistica.git

REM 4. Preparar rama y archivos
echo [INFO] Preparando archivos para subir...
git branch -M main
git add -A
git commit -m "Configuracion inicial y subida de proyecto"

REM 5. Subir
echo [INFO] Subiendo a GitHub...
git push -u origin main

if errorlevel 1 (
    echo [ERROR] Si el repositorio remoto ya tiene archivos (ej. README), puede fallar.
) else (
    echo [EXITO] Proyecto vinculado y subido correctamente.
)

pause
popd
endlocal