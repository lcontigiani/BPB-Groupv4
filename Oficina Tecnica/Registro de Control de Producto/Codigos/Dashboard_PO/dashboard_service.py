"""
Servicio de Windows para el Dashboard de Oficina Tecnica BPB.
Instalacion: python dashboard_service.py install
Desinstalacion: python dashboard_service.py remove
"""
import os
import subprocess
import sys
from pathlib import Path

import win32event
import win32service
import win32serviceutil
import servicemanager


class DashboardService(win32serviceutil.ServiceFramework):
    _svc_name_ = "BPBDashboard"
    _svc_display_name_ = "BPB Oficina Tecnica - Dashboard"
    _svc_description_ = "Servidor web del Dashboard de Oficina Tecnica BPB (Flask/Waitress puerto 8080)"

    def __init__(self, args):
        win32serviceutil.ServiceFramework.__init__(self, args)
        self.hWaitStop = win32event.CreateEvent(None, 0, 0, None)
        self.process = None

    def SvcStop(self):
        self.ReportServiceStatus(win32service.SERVICE_STOP_PENDING)
        if self.process and self.process.poll() is None:
            self.process.terminate()
            try:
                self.process.wait(timeout=10)
            except subprocess.TimeoutExpired:
                self.process.kill()
        win32event.SetEvent(self.hWaitStop)

    def SvcDoRun(self):
        servicemanager.LogMsg(
            servicemanager.EVENTLOG_INFORMATION_TYPE,
            servicemanager.PYS_SERVICE_STARTED,
            (self._svc_name_, "")
        )
        self.main()

    def main(self):
        script_dir = Path(__file__).resolve().parent
        app_py = script_dir / "app.py"

        # Dashboard_PO -> Codigos -> Registro de Control de Producto
        base_dir = script_dir.parent.parent
        # Registro de Control de Producto -> Oficina Tecnica
        oficina_dir = base_dir.parent
        log_dir = oficina_dir / "_runtime_logs"
        log_dir.mkdir(exist_ok=True)
        log_file = log_dir / "dashboard.log"

        env = os.environ.copy()
        env["BPB_SERVER_HOST"] = "0.0.0.0"
        env["BPB_SERVER_PORT"] = "8080"
        env["BPB_BROWSER_HOST"] = "127.0.0.1"
        env["BPB_BASE_DIR"] = str(base_dir)
        env["BPB_NO_BROWSER"] = "1"

        with open(log_file, "a", encoding="utf-8") as log:
            self.process = subprocess.Popen(
                [sys.executable, str(app_py)],
                cwd=str(script_dir),
                env=env,
                stdout=log,
                stderr=log,
            )

        win32event.WaitForSingleObject(self.hWaitStop, win32event.INFINITE)


if __name__ == "__main__":
    win32serviceutil.HandleCommandLine(DashboardService)
