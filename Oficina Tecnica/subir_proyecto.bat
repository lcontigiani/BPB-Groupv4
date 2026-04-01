@echo off
setlocal

REM Use pushd to map UNC path to a drive letter
pushd "%~dp0"
if errorlevel 1 (
  echo ERROR: No pude acceder a la carpeta del proyecto.
  pause
  exit /b 1
)

echo === Subir proyecto ===
where git >nul 2>&1
if errorlevel 1 (
  echo ERROR: Git no esta en el PATH.
  echo Abri esta ventana con "Git Bash" o instala Git.
  pause
  popd
  exit /b 1
)

for /f "delims=" %%I in ('git status --porcelain') do set HAS_CHANGES=1
if not defined HAS_CHANGES (
  echo No hay cambios para subir.
  pause
  popd
  exit /b 0
)

git add -A
if errorlevel 1 (
  echo ERROR en git add.
  pause
  popd
  exit /b 1
)

git commit -m "Auto sync"
if errorlevel 1 (
  echo ERROR en git commit. (Puede ser que no haya cambios)
  pause
  popd
  exit /b 1
)

git push
if errorlevel 1 (
  echo ERROR en git push.
  pause
  popd
  exit /b 1
)

echo Subida completa.
pause
popd
endlocal