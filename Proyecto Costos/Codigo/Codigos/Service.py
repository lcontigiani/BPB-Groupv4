import os
import sys
import time
from watchdog.observers import Observer

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
VENDOR_DIR = os.path.join(CURRENT_DIR, "site-packages")
if os.path.isdir(VENDOR_DIR) and VENDOR_DIR not in sys.path:
    sys.path.insert(0, VENDOR_DIR)

from config import DEFAULT_REGISTRO_SUBDIR, WORKSPACES, LOCK_PATH
from utils import log
from notificador import NotificadorHandler

_LOCK_FD = None


def _acquire_lock():
    """Evita instancias duplicadas mediante un lockfile simple."""
    global _LOCK_FD
    try:
        os.makedirs(os.path.dirname(LOCK_PATH), exist_ok=True)
        _LOCK_FD = os.open(LOCK_PATH, os.O_CREAT | os.O_EXCL | os.O_WRONLY)
        os.write(_LOCK_FD, str(os.getpid()).encode("ascii", "ignore"))
        return True
    except FileExistsError:
        # Si el lock es muy viejo se asume caida previa y se regenera.
        try:
            age = time.time() - os.path.getmtime(LOCK_PATH)
            if age > 12 * 60 * 60:
                os.remove(LOCK_PATH)
                return _acquire_lock()
        except Exception:
            pass
        log(f"Ya hay una instancia en ejecucion (lock {LOCK_PATH}).", "ERROR")
        return False
    except Exception as exc:
        log(f"No se pudo crear lock {LOCK_PATH}: {exc}", "ERROR")
        return False


def _release_lock():
    """Libera el lockfile al finalizar."""
    global _LOCK_FD
    try:
        if _LOCK_FD is not None:
            os.close(_LOCK_FD)
    except Exception:
        pass
    try:
        if os.path.exists(LOCK_PATH):
            os.remove(LOCK_PATH)
    except Exception:
        pass


def _build_workspaces():
    prepared = []
    for ws in WORKSPACES:
        base_dir = ws.get("base_dir")
        if not base_dir:
            continue
        registro_dir = os.path.join(base_dir, DEFAULT_REGISTRO_SUBDIR) if DEFAULT_REGISTRO_SUBDIR else None
        prepared.append(
            {
                "name": ws.get("name", base_dir),
                "base_dir": os.path.abspath(base_dir),
                "registro_dir": registro_dir,
                "excel_hint": ws.get("excel_hint"),
            }
        )
    return prepared


def iniciar_servicio():
    if not _acquire_lock():
        return
    try:
        workspaces = _build_workspaces()
        observer = Observer()
        available = []

        for ws in workspaces:
            base_dir = ws.get("base_dir")
            if not base_dir:
                continue
            if not os.path.exists(base_dir):
                log(f"Workspace '{ws.get('name')}' no accesible: {base_dir}", "WARN")
                continue
            registro_dir = ws.get("registro_dir")
            watch_path = registro_dir if registro_dir and os.path.exists(registro_dir) else base_dir
            if not os.path.exists(watch_path):
                log(f"No se encontro ruta de monitoreo para workspace '{ws.get('name')}' (probado {watch_path})", "WARN")
                continue
            available.append({"workspace": ws, "watch_path": watch_path})

        if not available:
            log("ERROR: Ninguna ruta de monitoreo disponible; el servicio no se inicia.", "ERROR")
            return

        event_handler = NotificadorHandler(workspaces)
        event_handler.start_reminder_scheduler()

        for target in available:
            name = target["workspace"].get("name")
            watch_path = target["watch_path"]
            log(f"Monitoreando workspace '{name}' en {watch_path}")
            observer.schedule(event_handler, watch_path, recursive=True)

        observer.start()
        log("Servicio iniciado correctamente.")

        try:
            while True:
                time.sleep(1)
        except KeyboardInterrupt:
            observer.stop()
        except Exception as exc:
            log(f"Watcher detenido por error: {exc}", "ERROR")
            observer.stop()

        observer.join()
        log("Servicio detenido correctamente.")
    finally:
        _release_lock()


if __name__ == "__main__":
    iniciar_servicio()
