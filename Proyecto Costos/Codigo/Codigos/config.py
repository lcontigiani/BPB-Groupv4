import os

# Rutas y configuracion base (centralizado en BPBSRV03)
SERVER_CODE_DIR = r"\\BPBSRV03\lcontigiani\Proyecto Costos\Codigo"
LOG_PATH = os.path.join(SERVER_CODE_DIR, "Logs", "NotificadorService.log")
SERVER_BASE_DIR = r"\\BPBSRV03\lcontigiani\Proyecto Costos\Analisis de Procesos"
DEFAULT_REGISTRO_SUBDIR = "Registro - Planillas"
WORKSPACES = [
    {
        "name": "srv-analisis-procesos",
        "base_dir": SERVER_BASE_DIR,
    },
]
# Lock file (renombrado para evitar bloqueos residuales)
LOCK_PATH = os.path.join(os.path.dirname(LOG_PATH), "NotificadorService.v2.lock")

# SMTP fallbacks (usados cuando no hay variables de entorno, util para ejecucion directa)
SMTP_DEFAULTS = {
    "host": "smtp.gmail.com",
    "port": 465,
    "user": "no-reply@bpbargentina.com",
    "pass": "mtky inyj bntn oxii",
    "ssl": True,
    "starttls": False,
    "from_addr": "no-reply@bpbargentina.com",
    "from_name": "Oficina Tecnica",
}

# EPEC Electric bills (automatic load)
EPEC_FACTURAS_DIR = os.path.join(
    SERVER_BASE_DIR,
    "Auxiliares",
    "Analisis de Costos Electricos",
    "Registro - Planillas",
    "Registro de Facturas",
)
EPEC_EXCEL_PATH = os.path.join(
    SERVER_BASE_DIR,
    "Auxiliares",
    "Analisis de Costos Electricos",
    "Analisis de Costos Electricos.xlsm",
)
EPEC_SHEET_NAME = "INFO-Factura"

# Email
EMAIL_TO = os.environ.get(
    "EMAIL_TO",
    "lcontigiani@bpbargentina.com,jpghella@bpbargentina.com,jguardia@bpbargentina.com,lcochis@bpbargentina.com,rortiz@bpbargentina.com",
)
DEFAULT_FROM_NAME = os.environ.get("SMTP_FROM_NAME", "Oficina Tecnica")
USER_EMAIL_MAP = {
    "lcontigiani": "lcontigiani@bpbargentina.com",
    "lorenzo contigiani": "lcontigiani@bpbargentina.com",
    # Agregar aqui otros usuarios: "nombre detectado": "correo@dominio"
}

USERS_CSV_PATH = os.path.join(SERVER_CODE_DIR, "Usuarios_Firmas.csv")

SUBJECT_STATE_PATH = os.path.join(os.path.dirname(LOG_PATH), "NotificadorService.subjects.json")
REMINDER_STATE_PATH = os.path.join(os.path.dirname(LOG_PATH), "NotificadorService.reminder.json")
PLANILLA_STATE_PATH = os.path.join(os.path.dirname(LOG_PATH), "NotificadorService.planillas.json")
REMINDER_LEAD_DAYS = int(os.environ.get("REMINDER_LEAD_DAYS", "5"))
REMINDER_INTERVAL_SECONDS = int(os.environ.get("REMINDER_INTERVAL_SECONDS", str(6 * 60 * 60)))  # Default: cada 6 horas
REMINDER_DEFAULT_RECIPIENTS = [
    "lcontigiani@bpbargentina.com",
    "jpghella@bpbargentina.com",
    "jguardia@bpbargentina.com",
    "lcochis@bpbargentina.com",
    "rortiz@bpbargentina.com",
]

# Resumenes: solo Lorenzo por defecto
SUMMARY_DEFAULT_RECIPIENTS = ["lcontigiani@bpbargentina.com"]

# Bitrix
BITRIX_WEBHOOK_URL = os.environ.get("BITRIX_WEBHOOK_URL", "").strip()
BITRIX_TASK_ID = os.environ.get("BITRIX_TASK_ID", "").strip()
BITRIX_CREATE_TASKS = os.environ.get("BITRIX_CREATE_TASKS", "1") not in {"0", "false", "False"}
BITRIX_RESPONSIBLE_ID = int(os.environ.get("BITRIX_RESPONSIBLE_ID", "135"))
_bitrix_accomplices_raw = os.environ.get("BITRIX_ACCOMPLICES_IDS", "61,27,37").strip()
if _bitrix_accomplices_raw:
    BITRIX_ACCOMPLICES_IDS = [int(x) for x in _bitrix_accomplices_raw.split(",") if x.strip().isdigit()]
else:
    BITRIX_ACCOMPLICES_IDS = []
_bitrix_auditors_raw = os.environ.get("BITRIX_AUDITORS_IDS", "31").strip()  # Luciano Cochis como observador
if _bitrix_auditors_raw:
    BITRIX_AUDITORS_IDS = [int(x) for x in _bitrix_auditors_raw.split(",") if x.strip().isdigit()]
else:
    BITRIX_AUDITORS_IDS = []
HOLIDAYS_PATH = os.environ.get("HOLIDAYS_PATH")  # Opcional, permite cargar feriados desde archivo CSV/JSON simple

# Lista base de feriados Argentina 2025 (Cordoba) en formato YYYY-MM-DD. Se pueden extender con HOLIDAYS_PATH.
HOLIDAYS_BASE = {
    "2025-01-01",
    "2025-02-17",
    "2025-02-18",
    "2025-03-24",
    "2025-04-02",
    "2025-04-18",
    "2025-05-01",
    "2025-05-25",
    "2025-06-16",
    "2025-06-20",
    "2025-07-09",
    "2025-08-18",
    "2025-10-13",
    "2025-11-24",
    "2025-12-08",
    "2025-12-25",
}

# Ventanas de vacaciones (inclusive) para tratarlas como no habiles.
VACATION_WINDOWS = [
    ("2025-12-22", "2026-01-04"),
    ("2026-12-22", "2027-01-04"),
]
