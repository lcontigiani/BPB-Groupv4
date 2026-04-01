import os
import sys
import datetime
from typing import List, Dict

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
VENDOR_DIR = os.path.join(CURRENT_DIR, "site-packages")
if os.path.isdir(VENDOR_DIR) and VENDOR_DIR not in sys.path:
    sys.path.insert(0, VENDOR_DIR)

from config import (
    BITRIX_WEBHOOK_URL,
    BITRIX_CREATE_TASKS,
    BITRIX_RESPONSIBLE_ID,
    BITRIX_ACCOMPLICES_IDS,
    BITRIX_AUDITORS_IDS,
)
from bitrix_client import BitrixClient
from utils import load_holidays, last_business_day_of_month, shift_business_days, month_label_es
from notificador import NotificadorHandler
from Service import _build_workspaces


def _deadline_and_notice_dates(today: datetime.date, holidays) -> Dict[str, datetime.date]:
    last_bd = last_business_day_of_month(today, holidays)
    notice_day = shift_business_days(last_bd, -4, holidays)  # 5 hábiles antes (incluyendo último)
    reminder_day = shift_business_days(last_bd, -1, holidays)
    return {"last_bd": last_bd, "notice_day": notice_day, "reminder_day": reminder_day}


def _excel_listing_text(handler: NotificadorHandler) -> str:
    return handler._excel_listing_text()


def _build_description(deadline_date: str, deadline_time: str, excel_listing: str) -> str:
    return (
        "Buenos dias,\n\n"
        "Se informa la necesidad de revisar las planillas de costos correspondientes a sus respectivas areas.\n\n"
        "Listado de archivos:\n"
        f"{excel_listing}\n\n"
        f"La finalizacion de esta tarea sera requerida antes del {deadline_date} a las {deadline_time}.\n\n"
        "Ante cualquier consulta o inconveniente, pueden comunicarse con Lorenzo Contigiani.\n"
    )


def create_monthly_task():
    if not BITRIX_CREATE_TASKS:
        return None

    client = BitrixClient(BITRIX_WEBHOOK_URL)
    holidays = load_holidays()
    today = datetime.date.today()
    dates = _deadline_and_notice_dates(today, holidays)
    last_bd = dates["last_bd"]
    deadline_dt = datetime.datetime.combine(last_bd, datetime.time(hour=12, minute=0, second=0))

    handler = NotificadorHandler(_build_workspaces())
    excel_listing = _excel_listing_text(handler)
    deadline_date_str = f"{last_bd:%d/%m/%Y}"
    deadline_time_str = "12:00 hs."
    description = _build_description(deadline_date_str, deadline_time_str, excel_listing)

    month_label = month_label_es(last_bd)
    title = f"Revision de Planillas - {month_label}"
    responsible_id = BITRIX_RESPONSIBLE_ID
    accomplices = BITRIX_ACCOMPLICES_IDS
    auditors = BITRIX_AUDITORS_IDS

    task_id = client.create_task(
        title=title,
        description=description,
        deadline_iso=deadline_dt.strftime("%Y-%m-%dT%H:%M:%S"),
        responsible_id=responsible_id,
        accomplice_ids=accomplices,
        auditor_ids=auditors,
    )
    return task_id


def add_pending_comment(task_id: int):
    client = BitrixClient(BITRIX_WEBHOOK_URL)
    holidays = load_holidays()
    today = datetime.date.today()
    last_bd = last_business_day_of_month(today, holidays)
    deadline_date_str = f"{last_bd:%d/%m/%Y}"
    deadline_time_str = "12:00 hs."

    handler = NotificadorHandler(_build_workspaces())
    expected = handler._expected_planillas()
    period_key = handler._current_period_key(today)
    period_data = handler._ensure_planilla_period(period_key)
    modified_set = set(period_data.get("modified") or [])

    projects: Dict[str, List[str]] = {}
    for item in expected:
        project = item.get("project") or "SinNombre"
        plan = item.get("planilla") or "Sin planilla"
        key = f"{project}|{plan}"
        if key in modified_set:
            continue
        projects.setdefault(project, []).append(plan)

    lines = []
    lines.append(f"Buenos dias, al dia de la fecha, siendo {today:%d/%m/%Y}, se encuentran faltantes de revision las siguientes planillas:")
    for project, plans in projects.items():
        lines.append(f"[B]{project}:[/B]")
        for p in plans:
            lines.append(f"- {p}")
    if not projects:
        lines.append("- No hay planillas pendientes.")
    lines.append("")
    lines.append(f"La finalizacion de esta tarea sera requerida antes del {deadline_date_str} a las {deadline_time_str}.")
    lines.append("")
    lines.append("Ante cualquier consulta o inconveniente, pueden comunicarse con Lorenzo Contigiani.")
    lines.append("")
    lines.append("PD: Se recuerda la ruta donde se encuentran los archivos mencionados:")
    lines.append(r"\\BPBSRV03\lcontigiani\Proyecto Costos\Analisis de Procesos")
    text = "\n".join(lines)

    client.add_comment(task_id, text)
    return text


if __name__ == "__main__":
    # Prueba manual: agregar comentario a una tarea especifica (5113)
    TASK_ID = int(os.environ.get("BITRIX_TEST_TASK_ID", "5113"))
    text = add_pending_comment(TASK_ID)
    print("Comentario agregado a tarea", TASK_ID)
