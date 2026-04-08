#!/bin/bash

set -u

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
APP_DIR="$SCRIPT_DIR/Registro de Control de Producto/Codigos/Dashboard_PO"
BASE_DIR="$SCRIPT_DIR/Registro de Control de Producto"
VENV_DIR="$APP_DIR/.venv_mac"
HOST="127.0.0.1"
PORT=""

find_free_port() {
  local candidate
  for candidate in 5000 5001 5002 8000 8080; do
    if ! lsof -nP -iTCP:"$candidate" -sTCP:LISTEN >/dev/null 2>&1; then
      echo "$candidate"
      return 0
    fi
  done
  return 1
}

echo "=========================================================="
echo "   INICIANDO DASHBOARD - MACOS"
echo "=========================================================="
echo

if [ ! -d "$APP_DIR" ]; then
  echo "[ERROR] No se encontro la carpeta de la app:"
  echo "$APP_DIR"
  read -r -p "Presiona Enter para cerrar..."
  exit 1
fi

if ! command -v python3 >/dev/null 2>&1; then
  echo "[ERROR] python3 no esta instalado o no esta en el PATH."
  read -r -p "Presiona Enter para cerrar..."
  exit 1
fi

export BPB_BASE_DIR="$BASE_DIR"
export PYTHONUNBUFFERED=1
PORT="$(find_free_port)"

if [ -z "$PORT" ]; then
  echo "[ERROR] No encontre un puerto libre para iniciar la app."
  read -r -p "Presiona Enter para cerrar..."
  exit 1
fi

export BPB_SERVER_HOST="0.0.0.0"
export BPB_BROWSER_HOST="$HOST"
export BPB_SERVER_PORT="$PORT"

URL="http://$HOST:$PORT"

cd "$APP_DIR" || exit 1

if [ ! -d "$VENV_DIR" ]; then
  echo "[INFO] Creando entorno virtual local..."
  python3 -m venv "$VENV_DIR"
fi

# shellcheck disable=SC1091
source "$VENV_DIR/bin/activate"

echo "[INFO] Actualizando pip..."
python -m pip install --upgrade pip >/dev/null 2>&1

echo "[INFO] Verificando dependencias..."
python -m pip install \
  flask \
  waitress \
  pyyaml \
  requests \
  pillow \
  pdfplumber \
  openpyxl \
  msoffcrypto-tool \
  watchdog \
  pypdfium2 \
  pytesseract \
  pyscrypt \
  xlrd \
  >/dev/null 2>&1

if [ $? -ne 0 ]; then
  echo "[ERROR] No se pudieron instalar las dependencias Python."
  echo "Revisa la conexion o instala manualmente los paquetes faltantes."
  read -r -p "Presiona Enter para cerrar..."
  exit 1
fi

echo
echo "[CONFIG] BPB_BASE_DIR=$BPB_BASE_DIR"
echo "[CONFIG] PUERTO=$BPB_SERVER_PORT"
echo "[APP] Ejecutando dashboard en $URL"
echo

( sleep 2; open "$URL" >/dev/null 2>&1 ) &

python app.py
EXIT_CODE=$?

echo
if [ $EXIT_CODE -ne 0 ]; then
  echo "[ERROR] La aplicacion termino con codigo $EXIT_CODE."
else
  echo "[OK] La aplicacion finalizo correctamente."
fi

read -r -p "Presiona Enter para cerrar..."
exit $EXIT_CODE
