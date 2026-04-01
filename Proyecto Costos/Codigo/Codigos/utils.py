import os
import json
import csv
from datetime import datetime, date, timedelta
from typing import Optional, List, Dict, Set
from config import LOG_PATH, HOLIDAYS_BASE, HOLIDAYS_PATH, VACATION_WINDOWS


def log(msg: str, level: str = "INFO"):
    try:
        os.makedirs(os.path.dirname(LOG_PATH), exist_ok=True)
        with open(LOG_PATH, "a", encoding="utf-8") as f:
            f.write(f"{datetime.now():%Y-%m-%d %H:%M:%S} [{level}] {msg}\n")
    except:  # pragma: no cover - logging no debe romper flujo
        pass


def parse_recipients(raw: Optional[str]) -> List[str]:
    if not raw:
        return []
    parts = [item.strip() for item in str(raw).replace(";", ",").split(",")]
    return [p for p in parts if p]


def load_user_email_map_from_csv(path: str) -> Dict[str, str]:
    mapping: Dict[str, str] = {}
    if not os.path.isfile(path):
        return mapping
    try:
        with open(path, "r", encoding="utf-8-sig", newline="") as f:
            reader = csv.DictReader(f)
            for row in reader:
                name = (row.get("NOMBRE") or "").strip()
                lastname = (row.get("APELLIDO") or "").strip()
                email = (row.get("EMAIL") or "").strip()
                if not email:
                    continue
                full = f"{name} {lastname}".strip().lower()
                if full:
                    mapping[full] = email
                if name:
                    mapping.setdefault(name.lower(), email)
                if lastname:
                    mapping.setdefault(lastname.lower(), email)
    except Exception as exc:
        log(f"No se pudo cargar mapa de usuarios desde CSV {path}: {exc}", "WARN")
    return mapping


def load_holidays() -> Set[date]:
    holidays: Set[date] = set()
    for item in HOLIDAYS_BASE:
        try:
            holidays.add(datetime.fromisoformat(item).date())
        except Exception:
            continue

    if HOLIDAYS_PATH and os.path.isfile(HOLIDAYS_PATH):
        try:
            if HOLIDAYS_PATH.lower().endswith(".json"):
                with open(HOLIDAYS_PATH, "r", encoding="utf-8") as f:
                    data = json.load(f)
                items = data if isinstance(data, list) else []
            else:
                # CSV/Texto: una fecha por linea, primera columna
                items = []
                with open(HOLIDAYS_PATH, "r", encoding="utf-8") as f:
                    for line in f:
                        parts = line.strip().split(",")
                        if parts and parts[0].strip():
                            items.append(parts[0].strip())
            for raw in items:
                try:
                    holidays.add(datetime.fromisoformat(str(raw)).date())
                except Exception:
                    continue
        except Exception as exc:
            log(f"No se pudieron cargar feriados desde {HOLIDAYS_PATH}: {exc}", "WARN")

    # Agregar ventanas de vacaciones como no habiles
    for start_str, end_str in VACATION_WINDOWS:
        try:
            start = datetime.fromisoformat(start_str).date()
            end = datetime.fromisoformat(end_str).date()
            current = start
            while current <= end:
                holidays.add(current)
                current = current + timedelta(days=1)
        except Exception as exc:
            log(f"No se pudo procesar ventana de vacaciones {start_str} - {end_str}: {exc}", "WARN")

    return holidays


def is_business_day(day: date, holidays: Set[date]) -> bool:
    if day.weekday() >= 5:  # 5,6 = sabado, domingo
        return False
    if day in holidays:
        return False
    return True


def shift_business_days(start: date, delta: int, holidays: Set[date]) -> date:
    current = start
    step = 1 if delta > 0 else -1
    remaining = abs(delta)
    while remaining > 0:
        current = current + timedelta(days=step)
        if is_business_day(current, holidays):
            remaining -= 1
    return current


def last_business_day_of_month(any_day: date, holidays: Set[date]) -> date:
    # Ir al primer dia del mes siguiente y retroceder hasta dia habil
    first_next = (any_day.replace(day=1) + timedelta(days=32)).replace(day=1)
    current = first_next - timedelta(days=1)
    while not is_business_day(current, holidays):
        current = current - timedelta(days=1)
    return current


def month_label_es(day: date) -> str:
    months = [
        "enero",
        "febrero",
        "marzo",
        "abril",
        "mayo",
        "junio",
        "julio",
        "agosto",
        "septiembre",
        "octubre",
        "noviembre",
        "diciembre",
    ]
    name = months[day.month - 1].capitalize()
    return f"{name} {day.year}"
