import os
import time
import threading
import ctypes
import re
import zipfile
import json
import xml.etree.ElementTree as ET
from typing import Optional, Dict, List
from datetime import datetime, timedelta, date

import win32security
import win32evtlog
import win32con
from watchdog.events import FileSystemEventHandler

from config import (
    DEFAULT_REGISTRO_SUBDIR,
    USERS_CSV_PATH,
    SUBJECT_STATE_PATH,
    REMINDER_STATE_PATH,
    PLANILLA_STATE_PATH,
    REMINDER_INTERVAL_SECONDS,
    REMINDER_LEAD_DAYS,
    EMAIL_TO,
    DEFAULT_FROM_NAME,
    USER_EMAIL_MAP,
    REMINDER_DEFAULT_RECIPIENTS,
    SUMMARY_DEFAULT_RECIPIENTS,
    SERVER_BASE_DIR,
    BITRIX_WEBHOOK_URL,
    BITRIX_CREATE_TASKS,
    BITRIX_RESPONSIBLE_ID,
    BITRIX_ACCOMPLICES_IDS,
    BITRIX_AUDITORS_IDS,
    BITRIX_TASK_ID,
    EPEC_FACTURAS_DIR,
)
from utils import (
    log,
    parse_recipients,
    load_user_email_map_from_csv,
    load_holidays,
    last_business_day_of_month,
    shift_business_days,
    is_business_day,
    month_label_es,
)
from email_utils import send_email
from bitrix_client import BitrixClient
from factura_epec import procesar_factura

try:
    from PyPDF2 import PdfReader
except Exception:
    PdfReader = None

try:
    import pytesseract  # type: ignore
    from pdf2image import convert_from_path  # type: ignore
except Exception:
    pytesseract = None
    convert_from_path = None

try:
    import openpyxl  # type: ignore
except Exception:
    openpyxl = None


class NotificadorHandler(FileSystemEventHandler):
    def __init__(self, workspaces: List[Dict[str, str]]):
        self.workspaces = workspaces
        self.ultimo_evento = {}
        self.drive_device_cache = {}
        self.pdf_warning_logged = False
        self.ocr_warning_logged = False
        self.poppler_warning_logged = False
        self.excel_warning_logged = False
        self.excel_parse_warning_logged = False
        self.excel_cache: Dict[str, Dict[str, Optional[str]]] = {}
        self.email_warning_logged = False
        self.workspace_warning_logged = False
        self.missing_workspace_logged_paths = set()
        self.subject_state: Dict[str, Dict[str, object]] = self._load_subject_state()
        self.dynamic_user_map = load_user_email_map_from_csv(USERS_CSV_PATH)
        self.recent_excel_users: Dict[str, Dict[str, object]] = {}
        self.reminder_state: Dict[str, object] = self._load_reminder_state()
        self.holidays = load_holidays()
        self.planilla_state: Dict[str, object] = self._load_planilla_state()
        self.factura_last_processed = {}

    def _project_label_from_path(self, path: str, workspace: Optional[Dict[str, str]]) -> str:
        parts = os.path.normpath(path).split(os.sep)
        lowered = [p.lower() for p in parts]
        try:
            idx = lowered.index(DEFAULT_REGISTRO_SUBDIR.lower())
            if idx > 0:
                candidate = parts[idx - 1]
                if candidate:
                    return candidate
        except ValueError:
            pass

        if workspace and workspace.get("base_dir"):
            return os.path.basename(workspace.get("base_dir"))

        return os.path.basename(os.path.dirname(path)) or "Desconocido"

    def _planilla_label_from_path(self, path: str) -> Optional[str]:
        parts = os.path.normpath(path).split(os.sep)
        lowered = [p.lower() for p in parts]
        try:
            idx = lowered.index(DEFAULT_REGISTRO_SUBDIR.lower())
            if idx + 1 < len(parts):
                return parts[idx + 1]
        except ValueError:
            pass
        return None

    def _es_factura_epec(self, path: str) -> bool:
        if not EPEC_FACTURAS_DIR:
            return False
        try:
            return os.path.abspath(path).lower().startswith(os.path.abspath(EPEC_FACTURAS_DIR).lower())
        except Exception:
            return False

    def _should_process_factura(self, path: str) -> bool:
        ahora = time.time()
        last = self.factura_last_processed.get(path)
        if last and (ahora - last) < 30:
            return False
        self.factura_last_processed[path] = ahora
        return True

    def _procesar_factura_epec(self, path: str):
        if not self._es_factura_epec(path):
            return
        if not path.lower().endswith(".pdf"):
            return
        if not self._should_process_factura(path):
            return
        try:
            ok = procesar_factura(path)
            if ok:
                log(f"Factura EPEC procesada: {path}", "INFO")
            else:
                log(f"No se pudo procesar factura EPEC: {path}", "WARN")
        except Exception as exc:
            log(f"Error al procesar factura EPEC {path}: {exc}", "ERROR")

    def _load_subject_state(self) -> Dict[str, Dict[str, object]]:
        if not os.path.isfile(SUBJECT_STATE_PATH):
            return {}
        try:
            with open(SUBJECT_STATE_PATH, "r", encoding="utf-8") as f:
                data = json.load(f)
            if not isinstance(data, dict):
                return {}
            cleaned: Dict[str, Dict[str, object]] = {}
            for key, value in data.items():
                if not isinstance(value, dict):
                    continue
                counter = int(value.get("counter", 0))
                last_ts_raw = value.get("last_ts")
                last_ts = None
                if isinstance(last_ts_raw, (int, float)):
                    last_ts = datetime.fromtimestamp(last_ts_raw)
                elif isinstance(last_ts_raw, str):
                    try:
                        last_ts = datetime.fromisoformat(last_ts_raw)
                    except Exception:
                        last_ts = None
                cleaned[key] = {"counter": counter, "last_ts": last_ts, "subject": value.get("subject")}
            return cleaned
        except Exception as exc:
            log(f"No se pudo cargar subject_state desde {SUBJECT_STATE_PATH}: {exc}", "WARN")
            return {}

    def _save_subject_state(self):
        try:
            os.makedirs(os.path.dirname(SUBJECT_STATE_PATH), exist_ok=True)
            serializable: Dict[str, Dict[str, object]] = {}
            for key, value in self.subject_state.items():
                last_ts = value.get("last_ts")
                if isinstance(last_ts, datetime):
                    last_ts_val: object = last_ts.timestamp()
                else:
                    last_ts_val = None
                serializable[key] = {
                    "counter": int(value.get("counter", 0)),
                    "last_ts": last_ts_val,
                    "subject": value.get("subject"),
                }
            with open(SUBJECT_STATE_PATH, "w", encoding="utf-8") as f:
                json.dump(serializable, f)
        except Exception as exc:
            log(f"No se pudo guardar subject_state en {SUBJECT_STATE_PATH}: {exc}", "WARN")

    def _load_reminder_state(self) -> Dict[str, object]:
        if not os.path.isfile(REMINDER_STATE_PATH):
            return {}
        try:
            with open(REMINDER_STATE_PATH, "r", encoding="utf-8") as f:
                data = json.load(f)
            return data if isinstance(data, dict) else {}
        except Exception as exc:
            log(f"No se pudo cargar reminder_state desde {REMINDER_STATE_PATH}: {exc}", "WARN")
            return {}

    def _save_reminder_state(self):
        try:
            os.makedirs(os.path.dirname(REMINDER_STATE_PATH), exist_ok=True)
            with open(REMINDER_STATE_PATH, "w", encoding="utf-8") as f:
                json.dump(self.reminder_state, f)
        except Exception as exc:
            log(f"No se pudo guardar reminder_state en {REMINDER_STATE_PATH}: {exc}", "WARN")

    def _load_planilla_state(self) -> Dict[str, object]:
        if not os.path.isfile(PLANILLA_STATE_PATH):
            return {}
        try:
            with open(PLANILLA_STATE_PATH, "r", encoding="utf-8") as f:
                data = json.load(f)
            return data if isinstance(data, dict) else {}
        except Exception as exc:
            log(f"No se pudo cargar planilla_state desde {PLANILLA_STATE_PATH}: {exc}", "WARN")
            return {}

    def _save_planilla_state(self):
        try:
            os.makedirs(os.path.dirname(PLANILLA_STATE_PATH), exist_ok=True)
            with open(PLANILLA_STATE_PATH, "w", encoding="utf-8") as f:
                json.dump(self.planilla_state, f)
        except Exception as exc:
            log(f"No se pudo guardar planilla_state en {PLANILLA_STATE_PATH}: {exc}", "WARN")

    def _workspace_for_path(self, path: str) -> Optional[Dict[str, str]]:
        normalized = os.path.abspath(path).lower()
        best_match = None
        for ws in self.workspaces:
            base = ws.get("base_dir", "").lower()
            if not base:
                continue
            if normalized.startswith(base):
                if not best_match or len(base) > len(best_match.get("base_dir", "")):
                    best_match = ws
        return best_match

    def es_temporal(self, path: str):
        name = os.path.basename(path).lower()
        ext = os.path.splitext(path)[1].lower()
        if ext == ".tmp":
            return True
        if name.startswith("~$"):
            return True
        if name.startswith("mso"):
            return True
        return False

    def evento_valido(self, path: str):
        ahora = datetime.now()
        last = self.ultimo_evento.get(path)
        if last and (ahora - last).total_seconds() < 0.5:
            return False
        self.ultimo_evento[path] = ahora
        return True

    def wait_for_file(self, path, attempts=6, delay=0.2):
        if not os.path.exists(path):
            return False
        size_prev = None
        for _ in range(attempts):
            try:
                if os.path.isdir(path):
                    return True
                size = os.path.getsize(path)
                if size_prev is not None and size_prev == size:
                    return True
                size_prev = size
            except:
                pass
            time.sleep(delay)
        return False

    def get_file_owner(self, path):
        try:
            sd = win32security.GetFileSecurity(path, win32security.OWNER_SECURITY_INFORMATION)
            owner_sid = sd.GetSecurityDescriptorOwner()
            name, domain, _ = win32security.LookupAccountSid(None, owner_sid)
            return f"{domain}\\{name}"
        except:
            return "unknown"

    def get_user_from_security_log(self, path, since_dt):
        path_candidates = self._path_candidates(path)
        try:
            handle = win32evtlog.OpenEventLog(None, "Security")
            flags = win32evtlog.EVENTLOG_BACKWARDS_READ | win32evtlog.EVENTLOG_SEQUENTIAL_READ
            total = 0
            while True:
                events = win32evtlog.ReadEventLog(handle, flags, 0)
                if not events:
                    break
                for ev in events:
                    total += 1
                    if total > 2000:
                        log(f"Se detuvo la lectura del log de seguridad por limite (2000) para {path}", "WARN")
                        return None
                    if ev.EventID not in (4663, 4656):
                        continue
                    if ev.TimeGenerated < since_dt:
                        return None
                    inserts = ev.StringInserts or []
                    if not inserts:
                        continue
                    lower_inserts = [str(item).lower() for item in inserts]
                    touched_path = any(
                        any(candidate in insert for candidate in path_candidates)
                        for insert in lower_inserts
                    )
                    if not touched_path:
                        continue
                    user = None
                    domain = None
                    try:
                        if getattr(ev, "Sid", None):
                            resolved_user, resolved_domain, _ = win32security.LookupAccountSid(None, ev.Sid)
                            user = resolved_user
                            domain = resolved_domain
                    except:
                        pass
                    if not user and inserts:
                        try:
                            sid_str = inserts[0]
                            sid_obj = win32security.ConvertStringSidToSid(sid_str)
                            resolved_user, resolved_domain, _ = win32security.LookupAccountSid(None, sid_obj)
                            user = resolved_user
                            domain = resolved_domain
                        except:
                            pass
                    if not user:
                        if len(inserts) >= 2:
                            user = inserts[1]
                        if len(inserts) >= 3:
                            domain = inserts[2]
                    if user:
                        return f"{domain}\\{user}" if domain else user
        except Exception as exc:
            log(f"Error leyendo log de seguridad para {path}: {exc}", "WARN")
            return None
        return None

    def _path_candidates(self, path):
        normalized = os.path.abspath(path)
        variants = {normalized.lower()}
        if not normalized.startswith("\\\\?\\"):
            variants.add(f"\\\\?\\{normalized}".lower())
        nt_variant = self._to_nt_path(normalized)
        if nt_variant:
            variants.add(nt_variant.lower())
        return [v for v in variants if v]

    def _to_nt_path(self, path):
        drive, tail = os.path.splitdrive(path)
        if not drive:
            return path
        letter = drive.rstrip("\\").upper()
        cached = self.drive_device_cache.get(letter)
        if not cached:
            buf = ctypes.create_unicode_buffer(1024)
            res = ctypes.windll.kernel32.QueryDosDeviceW(letter, buf, 1024)
            cached = buf.value if res else letter
            self.drive_device_cache[letter] = cached
        return f"{cached}{tail}"

    def get_user_from_pdf(self, path):
        if not path.lower().endswith(".pdf"):
            return None
        if PdfReader is None:
            if not self.pdf_warning_logged:
                log("PyPDF2 no esta instalado; no se puede leer el nombre desde el PDF.", "WARN")
                self.pdf_warning_logged = True
            return None
        try:
            reader = PdfReader(path)
        except Exception as exc:
            log(f"No se pudo abrir el PDF {path}: {exc}", "WARN")
            return None
        text_chunks = []
        for page in getattr(reader, "pages", []):
            try:
                text = page.extract_text() or ""
                if text:
                    text_chunks.append(text)
            except Exception:
                continue
        combined_text = "\n".join(text_chunks).strip()
        found = self._extract_user_from_text(combined_text)
        if found:
            return found
        try:
            if hasattr(reader, "get_form_text_fields"):
                fields = reader.get_form_text_fields()
            elif hasattr(reader, "get_fields"):
                fields = reader.get_fields()
            else:
                fields = None
        except Exception:
            fields = None
        if isinstance(fields, dict):
            for key, value in fields.items():
                normalized_key = str(key or "").strip().lower()
                field_value = self._field_to_string(value)
                if not field_value:
                    continue
                if normalized_key in {"aprobado", "aprobado_por", "aprobado por"}:
                    return field_value
                pair_text = f"{key}: {field_value}"
                found = self._extract_user_from_text(pair_text)
                if found:
                    return found
        ocr_user = self._ocr_user_from_pdf(path)
        if ocr_user:
            return ocr_user
        log(f"No se detecto usuario en PDF {path}", "WARN")
        return None

    def _field_to_string(self, value):
        if value is None:
            return None
        if isinstance(value, str):
            return value.strip() or None
        if isinstance(value, dict):
            raw = value.get("/V") or value.get("V") or ""
            return str(raw).strip() or None
        try:
            return str(value).strip() or None
        except Exception:
            return None

    def _clean_candidate(self, candidate):
        if not candidate:
            return None
        cleaned = candidate.strip(":- \t\r\n")
        if not cleaned:
            return None
        lowered = cleaned.lower()
        blacklist = [
            "notas",
            "oee",
            "overall",
            "horas",
            "maquinarias",
            "disponibilidad",
            "rendimiento",
            "calidad",
        ]
        if any(word in lowered for word in blacklist):
            return None
        if len(cleaned) > 80:
            return None
        return cleaned

    def _ocr_user_from_pdf(self, path: str) -> Optional[str]:
        if convert_from_path is None or pytesseract is None:
            if not self.ocr_warning_logged:
                log("OCR no disponible (falta pdf2image/pytesseract); instale dependencias para usar respaldo OCR.", "WARN")
                self.ocr_warning_logged = True
            return None
        poppler_path = os.environ.get("POPPLER_PATH") or None
        if not poppler_path and not self.poppler_warning_logged:
            log("Para OCR de PDFs puede requerirse POPPLER_PATH apuntando a binarios de poppler.", "WARN")
            self.poppler_warning_logged = True
        try:
            images = convert_from_path(
                path,
                fmt="png",
                dpi=200,
                first_page=1,
                last_page=1,
                poppler_path=poppler_path,
            )
        except Exception as exc:
            log(f"No se pudo convertir PDF a imagen para OCR ({path}): {exc}", "WARN")
            return None
        for img in images:
            try:
                text = pytesseract.image_to_string(img, lang="spa+eng")
            except Exception as exc:
                log(f"OCR fallo para {path}: {exc}")
                continue
            found = self._extract_user_from_text(text)
            if found:
                return found
        return None

    def _extract_user_from_text(self, text):
        if not text:
            return None
        pattern = re.compile(r"aprobado\s+por[:\s-]*([^\n\r]+)", re.IGNORECASE)
        match = pattern.search(text)
        if match:
            candidate = self._clean_candidate(match.group(1))
            if candidate:
                return candidate
        lines = text.splitlines()
        for idx, line in enumerate(lines):
            lower_line = line.lower()
            if "aprobado por" not in lower_line:
                continue
            start = lower_line.index("aprobado por") + len("aprobado por")
            fragment = line[start:].lstrip(": \t.-")
            candidate = self._clean_candidate(fragment)
            if candidate:
                return candidate
            if idx + 1 < len(lines):
                next_line = lines[idx + 1].strip()
                candidate = self._clean_candidate(next_line)
                if candidate:
                    return candidate
        return None

    def resolver_usuario(self, path, owner):
        since = datetime.now() - timedelta(seconds=30)
        excel_user = self.get_user_from_excel(path)
        user_from_log = self.get_user_from_security_log(path, since)
        user_from_pdf = None
        if not user_from_log and not excel_user:
            user_from_pdf = self.get_user_from_pdf(path)
        recent_excel_user = self._recent_excel_user_for(path)
        resolved = excel_user or recent_excel_user or user_from_log or user_from_pdf or owner or "NOT FOUND"
        if resolved in {"NOT FOUND", owner} and not (excel_user or user_from_log or user_from_pdf):
            log(f"No se pudo determinar usuario; se usa owner/NOT FOUND para {path}", "WARN")
        return resolved, user_from_log, user_from_pdf, excel_user or recent_excel_user

    def _resolve_excel_path(self, event_path: str) -> Optional[str]:
        workspace = self._workspace_for_path(event_path)
        if not workspace:
            if event_path not in self.missing_workspace_logged_paths:
                log(f"No se encontro workspace para {event_path}; se omite deteccion Excel.", "WARN")
                self.missing_workspace_logged_paths.add(event_path)
            return None
        hint = workspace.get("excel_hint")
        if hint and os.path.exists(hint):
            return hint
        search_dir = os.path.dirname(event_path)
        if os.path.basename(search_dir).lower() == DEFAULT_REGISTRO_SUBDIR.lower():
            search_dir = os.path.dirname(search_dir)
        base_dir = workspace.get("base_dir", "")
        base_lower = base_dir.lower()
        if not base_lower:
            log(f"Workspace sin base_dir para {event_path}", "WARN")
            return None
        current = search_dir
        for _ in range(10):
            if not current:
                break
            if not os.path.abspath(current).lower().startswith(base_lower):
                break
            candidate = self._first_excel_in_dir(current)
            if candidate:
                return candidate
            parent = os.path.dirname(current)
            if parent == current:
                break
            current = parent
        if not self.excel_warning_logged:
            log(f"No se encontro Excel para evento en {event_path} (workspace {workspace.get('name')}).", "WARN")
            self.excel_warning_logged = True
        return None

    def _first_excel_in_dir(self, directory: str) -> Optional[str]:
        try:
            names = os.listdir(directory)
        except Exception as exc:
            log(f"No se pudo listar {directory} buscando Excel: {exc}", "WARN")
            return None
        preferred_exts = [".xlsm", ".xlsx", ".xlsb", ".xls"]
        for ext in preferred_exts:
            for name in names:
                if name.lower().endswith(ext):
                    candidate = os.path.join(directory, name)
                    if os.path.isfile(candidate):
                        return candidate
        return None

    def get_user_from_excel(self, event_path: str):
        path = self._resolve_excel_path(event_path)
        if not path:
            return None
        try:
            mtime = os.path.getmtime(path)
        except Exception as exc:
            log(f"No se pudo leer metadata de Excel {path}: {exc}", "WARN")
            return None
        cached = self.excel_cache.get(path)
        if cached and cached.get("mtime") == mtime:
            return cached.get("user")
        user = self._read_excel_last_modified_by(path)
        self.excel_cache[path] = {"mtime": mtime, "user": user}
        if not user:
            log(f"Excel {path} sin last_modified_by utilizable.", "WARN")
        return user

    def _read_excel_last_modified_by(self, path):
        if openpyxl is not None:
            try:
                wb = openpyxl.load_workbook(path, read_only=True, keep_links=False, data_only=True)
                user = getattr(wb.properties, "last_modified_by", None)
                wb.close()
                cleaned = self._clean_candidate(user)
                if cleaned:
                    return cleaned
            except Exception as exc:
                if not self.excel_parse_warning_logged:
                    log(f"No se pudo leer last_modified_by con openpyxl ({path}): {exc}", "WARN")
                    self.excel_parse_warning_logged = True
        try:
            with zipfile.ZipFile(path) as zf:
                with zf.open("docProps/core.xml") as f:
                    xml_bytes = f.read()
            root = ET.fromstring(xml_bytes)
            ns = {"cp": "http://schemas.openxmlformats.org/package/2006/metadata/core-properties"}
            node = root.find("cp:lastModifiedBy", ns)
            if node is not None and node.text:
                cleaned = self._clean_candidate(node.text)
                if cleaned:
                    return cleaned
        except Exception as exc:
            if not self.excel_parse_warning_logged:
                log(f"No se pudo leer lastModifiedBy desde core.xml ({path}): {exc}", "WARN")
                self.excel_parse_warning_logged = True
        return None

    def _resolve_recipients(self, resolved_user: Optional[str]) -> List[str]:
        base = parse_recipients(os.environ.get("EMAIL_TO") or EMAIL_TO)
        user_norm = (resolved_user or "").strip().lower()
        if user_norm and user_norm in self.dynamic_user_map:
            base.append(self.dynamic_user_map[user_norm])
        elif user_norm and user_norm in USER_EMAIL_MAP:
            base.append(USER_EMAIL_MAP[user_norm])
        seen = set()
        final = []
        for r in base:
            key = r.lower()
            if key not in seen:
                final.append(r)
                seen.add(key)
        return final

    def _summary_recipients(self) -> List[str]:
        raw = os.environ.get("SUMMARY_RECIPIENTS") or os.environ.get("SUMMARY_EMAILS")
        recipients = parse_recipients(raw)
        if not recipients:
            recipients = parse_recipients(os.environ.get("EMAIL_TO") or EMAIL_TO)
        if not recipients:
            recipients = SUMMARY_DEFAULT_RECIPIENTS
        seen = set()
        final = []
        for r in recipients:
            key = r.lower()
            if key not in seen:
                final.append(r)
                seen.add(key)
        return final

    def _remember_excel_user(self, path: str, user: Optional[str]):
        if not user:
            return
        directory = os.path.dirname(path)
        self.recent_excel_users[directory] = {"user": user, "ts": datetime.now()}

    def _recent_excel_user_for(self, path: str, max_age_seconds: int = 120) -> Optional[str]:
        directory = os.path.dirname(path)
        data = self.recent_excel_users.get(directory)
        if not data:
            return None
        ts = data.get("ts")
        if isinstance(ts, datetime):
            if (datetime.now() - ts).total_seconds() <= max_age_seconds:
                return data.get("user")
        return None

    def _notify_email(self, event_label: str, path: str, resolved_user: str, user_from_excel, user_from_log, user_from_pdf, owner: str, delay_seconds: int = 0):
        if delay_seconds > 0:
            threading.Thread(
                target=self._notify_email_delayed,
                args=(event_label, path, owner, delay_seconds),
                daemon=True,
            ).start()
            return
        workspace = self._workspace_for_path(path)
        project_label = self._project_label_from_path(path, workspace)
        folder_planilla = os.path.basename(os.path.dirname(path)) or "Desconocido"
        planilla_name = os.path.basename(path)
        event_ts = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        subject = self._subject_for(project_label)
        body = (
            f"Se ha detectado un nuevo registro de la planilla {folder_planilla} en \"{project_label}\"\n"
            f"\n"
            f"- Planilla: {planilla_name}\n"
            f"- Fecha: {event_ts}\n"
            f"- Usuario detectado: {resolved_user or 'NOT FOUND'}"
        )
        recipients = self._resolve_recipients(resolved_user)
        attachment = path if path.lower().endswith(".pdf") else None
        threading.Thread(target=send_email, args=(subject, body, attachment, recipients), daemon=True).start()

    def _notify_email_delayed(self, event_label: str, path: str, owner: str, delay_seconds: int):
        time.sleep(delay_seconds)
        resolved_user, user_from_log, user_from_pdf, user_from_excel = self.resolver_usuario(path, owner)
        self._notify_email(event_label, path, resolved_user, user_from_excel, user_from_log, user_from_pdf, owner, delay_seconds=0)

    def _subject_for(self, base_project: str) -> str:
        now = datetime.now()
        state = self.subject_state.get(base_project, {"counter": 0, "last_ts": None, "subject": None})
        last_ts = state.get("last_ts")
        if last_ts and isinstance(last_ts, datetime):
            delta = (now - last_ts).total_seconds()
        else:
            delta = None
        if delta is not None and delta <= 30 and state.get("subject"):
            state["last_ts"] = now
            self.subject_state[base_project] = state
            self._save_subject_state()
            return str(state.get("subject"))
        counter = int(state.get("counter", 0)) + 1
        subject = f"Modificacion en {base_project} #{counter}"
        self.subject_state[base_project] = {"counter": counter, "last_ts": now, "subject": subject}
        self._save_subject_state()
        return subject

    def start_reminder_scheduler(self, interval_seconds: int = REMINDER_INTERVAL_SECONDS):
        thread = threading.Thread(target=self._reminder_loop, args=(interval_seconds,), daemon=True)
        thread.start()

    def _reminder_loop(self, interval_seconds: int):
        interval = max(300, interval_seconds)
        while True:
            try:
                self._check_and_send_reminder()
            except Exception as exc:
                log(f"Error en loop de recordatorio mensual: {exc}", "WARN")
            time.sleep(interval)

    def _check_and_send_reminder(self):
        now = datetime.now()
        recipients = self._resolve_reminder_recipients()
        if not recipients:
            log("No hay destinatarios configurados para recordatorio mensual; se omite envio.", "WARN")
            return

        today = now.date()
        last_bd = last_business_day_of_month(today, self.holidays)
        notice_offset = max(0, REMINDER_LEAD_DAYS - 1)
        notice_day = last_bd if notice_offset == 0 else shift_business_days(last_bd, -notice_offset, self.holidays)
        reminder_day = shift_business_days(last_bd, -1, self.holidays)  # Penultimo dia habil
        deadline_date_str = f"{last_bd:%d/%m/%Y}"
        deadline_time_str = "12:00 hs."
        excel_listing = self._excel_listing_text()
        period_key = self._current_period_key(today)
        period_data = self._ensure_planilla_period(period_key)
        expected = self._expected_planillas()
        modified_set = set(period_data.get("modified") or [])
        month_label = month_label_es(last_bd)

        if today >= notice_day and today <= last_bd:
            self._maybe_send_with_guard(
                key="notice",
                send_after=self._combine_with_time(notice_day, 10, 0),
                subject=f"Revision de Planillas de costos - {month_label}",
                body=self._build_notice_body(deadline_date_str, deadline_time_str, excel_listing),
                recipients=recipients,
            )
            self._maybe_create_bitrix_task(period_key, last_bd, deadline_time_str, excel_listing)

        if today >= reminder_day and today <= last_bd:
            self._maybe_send_with_guard(
                key="reminder",
                send_after=self._combine_with_time(reminder_day, 10, 0),
                subject=f"Recordatorio Revision de Planillas de costos - {month_label}",
                body=self._build_reminder_body(deadline_date_str, deadline_time_str, excel_listing),
                recipients=recipients,
            )
            self._maybe_add_bitrix_comment(period_key, reminder_day, deadline_date_str, deadline_time_str, expected, modified_set)

        # Envio de resumen de planillas al responsable en la fecha limite
        summary_recipients = self._summary_recipients()
        if summary_recipients:
            if today == reminder_day:
                self._maybe_send_summary(
                    key="summary_reminder",
                    send_after=self._combine_with_time(reminder_day, 10, 0),
                    deadline_date=deadline_date_str,
                    deadline_time=deadline_time_str,
                    recipients=summary_recipients,
                )
            if today == last_bd:
                self._maybe_send_summary(
                    key="summary_deadline",
                    send_after=self._combine_with_time(last_bd, 12, 0),
                    deadline_date=deadline_date_str,
                    deadline_time=deadline_time_str,
                    recipients=summary_recipients,
                )
        # Envio de resumen de planillas al responsable (recordatorio y fecha limite)

    def _combine_with_time(self, day: date, hour: int, minute: int) -> datetime:
        return datetime(day.year, day.month, day.day, hour, minute, 0)

    def _resolve_reminder_recipients(self) -> List[str]:
        raw = os.environ.get("REMINDER_RECIPIENTS") or os.environ.get("REMINDER_EMAILS")
        recipients = parse_recipients(raw)
        if not recipients:
            recipients = parse_recipients(os.environ.get("EMAIL_TO") or EMAIL_TO)
        if not recipients:
            recipients = parse_recipients(",".join(REMINDER_DEFAULT_RECIPIENTS))
        # Eliminar duplicados preservando orden
        seen = set()
        final = []
        for r in recipients:
            key = r.lower()
            if key not in seen:
                final.append(r)
                seen.add(key)
        return final

    def _maybe_send_with_guard(self, key: str, send_after: datetime, subject: str, body: str, recipients: List[str]):
        now = datetime.now()
        if now < send_after:
            return

        month_key = send_after.strftime("%Y-%m")
        sent_record = self.reminder_state.get("sent", {})
        last_for_key = sent_record.get(key)
        if isinstance(last_for_key, str) and last_for_key == month_key:
            return

        sent = send_email(subject, body, None, recipients_override=recipients)
        if sent:
            sent_record[key] = month_key
            self.reminder_state["sent"] = sent_record
            self._save_reminder_state()

    def _maybe_send_summary(self, key: str, send_after: datetime, deadline_date: str, deadline_time: str, recipients: List[str]):
        now = datetime.now()
        if now < send_after:
            return

        period_key = self._current_period_key(now.date())
        period_data = self._ensure_planilla_period(period_key)
        summary_sent = period_data.get("summary_sent") or []
        if key in summary_sent:
            return

        expected = self._expected_planillas()
        modified_set = set(period_data.get("modified") or [])
        body = self._build_summary_body(deadline_date, deadline_time, expected, modified_set)
        subject = f"Estado de planillas {period_key}"

        sent = send_email(subject, body, None, recipients_override=recipients)
        if sent:
            summary_sent.append(key)
            period_data["summary_sent"] = summary_sent
            self.planilla_state[period_key] = period_data
            self._cleanup_old_periods()
            self._save_planilla_state()

    def _current_period_key(self, day: date) -> str:
        return f"{day.year}-{day.month:02d}"

    def _ensure_planilla_period(self, period_key: str) -> Dict[str, object]:
        data = self.planilla_state.get(period_key)
        if not isinstance(data, dict):
            data = {"modified": [], "summary_sent": [], "bitrix_task_id": None, "bitrix_comment_sent": []}
        if "modified" not in data or not isinstance(data.get("modified"), list):
            data["modified"] = []
        summary_sent = data.get("summary_sent")
        if isinstance(summary_sent, bool):
            summary_sent = ["summary_deadline"] if summary_sent else []
        if not isinstance(summary_sent, list):
            summary_sent = []
        data["summary_sent"] = summary_sent
        if "bitrix_task_id" not in data:
            data["bitrix_task_id"] = None
        if "bitrix_comment_sent" not in data or not isinstance(data.get("bitrix_comment_sent"), list):
            data["bitrix_comment_sent"] = []
        self.planilla_state[period_key] = data
        return data

    def _cleanup_old_periods(self, keep: int = 3):
        keys = sorted(self.planilla_state.keys())
        if len(keys) <= keep:
            return
        for k in keys[:-keep]:
            self.planilla_state.pop(k, None)

    def _mark_planilla_modified(self, project_label: str, planilla_label: Optional[str]):
        if not project_label:
            return
        planilla_label = planilla_label or "General"
        period_key = self._current_period_key(datetime.now().date())
        period_data = self._ensure_planilla_period(period_key)
        modified_list = period_data.get("modified") or []
        key = f"{project_label}|{planilla_label}"
        if key not in modified_list:
            modified_list.append(key)
        period_data["modified"] = modified_list
        self.planilla_state[period_key] = period_data
        self._cleanup_old_periods()
        self._save_planilla_state()

    # ============================================================
    # Bitrix (creacion de tarea y comentario en recordatorio)
    # ============================================================

    def _bitrix_client(self) -> Optional[BitrixClient]:
        if not BITRIX_WEBHOOK_URL:
            return None
        try:
            return BitrixClient(BITRIX_WEBHOOK_URL)
        except Exception as exc:
            log(f"Bitrix no disponible: {exc}", "WARN")
            return None

    def _maybe_create_bitrix_task(self, period_key: str, last_bd: date, deadline_time_str: str, excel_listing: str):
        if not BITRIX_CREATE_TASKS:
            return
        client = self._bitrix_client()
        if client is None:
            return

        period_data = self._ensure_planilla_period(period_key)
        if period_data.get("bitrix_task_id"):
            return

        deadline_dt = datetime.combine(last_bd, datetime.min.time()).replace(hour=12, minute=0, second=0)
        deadline_date_str = f"{last_bd:%d/%m/%Y}"
        description = self._build_notice_body(deadline_date_str, deadline_time_str, excel_listing)
        month_label = last_bd.strftime("%B %Y")
        title = f"Revision de Planillas - {month_label}"

        try:
            task_id = client.create_task(
                title=title,
                description=description,
                deadline_iso=deadline_dt.strftime("%Y-%m-%dT%H:%M:%S"),
                responsible_id=BITRIX_RESPONSIBLE_ID,
                accomplice_ids=BITRIX_ACCOMPLICES_IDS,
                auditor_ids=BITRIX_AUDITORS_IDS,
            )
            period_data["bitrix_task_id"] = task_id
            self.planilla_state[period_key] = period_data
            self._save_planilla_state()
            log(f"Tarea Bitrix creada ID {task_id} para periodo {period_key}", "INFO")
        except Exception as exc:
            log(f"No se pudo crear tarea Bitrix: {exc}", "WARN")

    def _maybe_add_bitrix_comment(self, period_key: str, target_day: date, deadline_date_str: str, deadline_time_str: str, expected: List[Dict[str, str]], modified_set: set):
        client = self._bitrix_client()
        if client is None:
            return
        period_data = self._ensure_planilla_period(period_key)
        sent = period_data.get("bitrix_comment_sent") or []
        if "reminder" in sent:
            return

        task_id = period_data.get("bitrix_task_id")
        if not task_id and BITRIX_TASK_ID:
            try:
                task_id = int(BITRIX_TASK_ID)
            except Exception:
                task_id = None
        if not task_id:
            log(f"No hay tarea Bitrix asociada al periodo {period_key}; no se agrega comentario.", "WARN")
            return

        try:
            text, has_pending = self._build_pending_comment(target_day, deadline_date_str, deadline_time_str, expected, modified_set)
            client.add_comment(int(task_id), text)
            if not has_pending:
                final_text = (
                    f"Se verifica al {target_day:%d/%m/%Y} que no quedan planillas pendientes. "
                    "Se cierra la tarea automaticamente."
                )
                client.add_comment(int(task_id), final_text)
                client.complete_task(int(task_id))
                sent.append("final")
            sent.append("reminder")
            period_data["bitrix_comment_sent"] = sent
            self.planilla_state[period_key] = period_data
            self._save_planilla_state()
            log(f"Comentario de pendientes agregado en tarea Bitrix {task_id} para periodo {period_key}", "INFO")
        except Exception as exc:
            log(f"No se pudo agregar comentario a tarea Bitrix {task_id}: {exc}", "WARN")

    def _build_pending_comment(self, today: date, deadline_date_str: str, deadline_time_str: str, expected: List[Dict[str, str]], modified_set: set):
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
        lines.append(f"PD: Se recuerda la ruta donde se encuentran los archivos mencionados:\n{SERVER_BASE_DIR}")
        return "\n".join(lines), bool(projects)

    def _expected_planillas(self) -> List[Dict[str, str]]:
        items: List[Dict[str, str]] = []
        base_dir = SERVER_BASE_DIR
        if not os.path.exists(base_dir):
            return items
        try:
            projects = [d for d in os.listdir(base_dir) if os.path.isdir(os.path.join(base_dir, d))]
        except Exception as exc:
            log(f"No se pudo listar subdirectorios en {base_dir}: {exc}", "WARN")
            return items

        for project in projects:
            reg_dir = os.path.join(base_dir, project, DEFAULT_REGISTRO_SUBDIR)
            if not os.path.isdir(reg_dir):
                items.append({"project": project, "planilla": None})
                continue
            try:
                planillas = [p for p in os.listdir(reg_dir) if os.path.isdir(os.path.join(reg_dir, p))]
            except Exception as exc:
                log(f"No se pudo listar planillas en {reg_dir}: {exc}", "WARN")
                items.append({"project": project, "planilla": None})
                continue
            if not planillas:
                items.append({"project": project, "planilla": None})
            for plan in planillas:
                items.append({"project": project, "planilla": plan})
        return items

    def _build_summary_body(self, deadline_date: str, deadline_time: str, expected: List[Dict[str, str]], modified: set) -> str:
        lines = []
        lines.append("Buenos dias,")
        lines.append("")
        lines.append("Resumen de planillas guardadas al cierre del periodo:")
        lines.append("")

        projects: Dict[str, List[str]] = {}
        for item in expected:
            project = item.get("project") or "SinNombre"
            plan = item.get("planilla") or "Sin planilla"
            key = f"{project}|{plan}"
            status = "[OK]" if key in modified else "[PEND]"
            entry = f"- {status} {plan}"
            projects.setdefault(project, []).append(entry)

        for project, entries in projects.items():
            lines.append(f"{project}:")
            for entry in entries:
                lines.append(entry)
            lines.append("")

        lines.append(f"Fecha limite: {deadline_date} a las {deadline_time}")
        return "\n".join(lines)
    def _excel_listing_text(self) -> str:
        lines: List[str] = []
        base_dir = SERVER_BASE_DIR
        if not os.path.exists(base_dir):
            return "- Ruta de base no accesible."

        try:
            subdirs = [d for d in os.listdir(base_dir) if os.path.isdir(os.path.join(base_dir, d))]
        except Exception as exc:
            log(f"No se pudo listar subdirectorios en {base_dir}: {exc}", "WARN")
            return "- No se pudieron listar las carpetas de proyectos."

        exts = (".xlsm", ".xlsx", ".xlsb", ".xls")
        for sub in subdirs:
            full_sub = os.path.join(base_dir, sub)
            excel_name = None
            try:
                for entry in os.listdir(full_sub):
                    if entry.lower().endswith(exts) and os.path.isfile(os.path.join(full_sub, entry)):
                        excel_name = os.path.splitext(entry)[0]
                        break
            except Exception as exc:
                log(f"No se pudo listar {full_sub}: {exc}", "WARN")
            if excel_name:
                lines.append(f"- {excel_name}")
            else:
                lines.append("- no se encontro archivo Excel.")

        return "\n".join(lines) if lines else "- No se encontraron carpetas de proyecto."

    def _build_notice_body(self, deadline_date: str, deadline_time: str, excel_listing: str) -> str:
        return (
            "Buenos dias,\n\n"
            "Se informa la necesidad de revisar las planillas de costos correspondientes a sus respectivas areas.\n\n"
            "Listado de archivos:\n"
            f"{excel_listing}\n\n"
            f"La finalizacion de esta tarea sera requerida antes del {deadline_date} a las {deadline_time}.\n\n"
            "Ante cualquier consulta o inconveniente, pueden comunicarse con Lorenzo Contigiani.\n\n"
            f"PD: Se recuerda la ruta donde se encuentran los archivos mencionados:\n{SERVER_BASE_DIR}\n"
        )

    def _build_reminder_body(self, deadline_date: str, deadline_time: str, excel_listing: str) -> str:
        return (
            "Buenos dias,\n\n"
            "Se recuerda la necesidad de revisar las planillas de costos correspondientes a sus respectivas areas.\n\n"
            "Listado de archivos:\n"
            f"{excel_listing}\n\n"
            f"La finalizacion de esta tarea sera requerida antes del {deadline_date} a las {deadline_time}.\n\n"
            "Ante cualquier consulta o inconveniente, pueden comunicarse con Lorenzo Contigiani.\n\n"
            f"PD: Se recuerda la ruta donde se encuentran los archivos mencionados:\n{SERVER_BASE_DIR}\n"
        )

    def on_created(self, event):
        if event.is_directory:
            return
        path = event.src_path
        if self.es_temporal(path) or not self.evento_valido(path):
            return
        workspace = self._workspace_for_path(path)
        workspace_name = workspace.get("name") if workspace else "UNKNOWN"
        self.wait_for_file(path)
        owner = self.get_file_owner(path)
        resolved_user, user_from_log, user_from_pdf, user_from_excel = self.resolver_usuario(path, owner)
        self._procesar_factura_epec(path)
        project_label = self._project_label_from_path(path, workspace)
        planilla_label = self._planilla_label_from_path(path)
        self._mark_planilla_modified(project_label, planilla_label)
        msg = (
            f"[NUEVO ARCHIVO] {path}\n"
            f"  User detectado: {resolved_user}\n"
            f"  User Excel: {user_from_excel or 'NOT FOUND'}\n"
            f"  User log: {user_from_log or 'NOT FOUND'}\n"
            f"  User PDF: {user_from_pdf or 'NOT FOUND'}\n"
            f"  Workspace: {workspace_name}\n"
            f"  Owner: {owner}\n"
            f"  Folder: {os.path.dirname(path)}\n"
            f"  File: {os.path.basename(path)}"
        )
        log(msg)

    def on_modified(self, event):
        if event.is_directory:
            return
        path = event.src_path
        if self.es_temporal(path) or not self.evento_valido(path):
            return
        workspace = self._workspace_for_path(path)
        workspace_name = workspace.get("name") if workspace else "UNKNOWN"
        self.wait_for_file(path)
        owner = self.get_file_owner(path)
        resolved_user, user_from_log, user_from_pdf, user_from_excel = self.resolver_usuario(path, owner)
        self._procesar_factura_epec(path)
        project_label = self._project_label_from_path(path, workspace)
        planilla_label = self._planilla_label_from_path(path)
        self._mark_planilla_modified(project_label, planilla_label)
        if path.lower().endswith((".xlsm", ".xlsx", ".xls", ".xlsb")):
            self._remember_excel_user(path, resolved_user)
        msg = (
            f"[CAMBIO] {path}\n"
            f"  User detectado: {resolved_user}\n"
            f"  User Excel: {user_from_excel or 'NOT FOUND'}\n"
            f"  User log: {user_from_log or 'NOT FOUND'}\n"
            f"  User PDF: {user_from_pdf or 'NOT FOUND'}\n"
            f"  Workspace: {workspace_name}\n"
            f"  Owner: {owner}"
        )
        log(msg)
        if path.lower().endswith(".pdf"):
            self._notify_email("CAMBIO", path, resolved_user, user_from_excel, user_from_log, user_from_pdf, owner, delay_seconds=6)
        else:
            log(f"Se omite envio de email (no es PDF): {path}", "INFO")

    def on_deleted(self, event):
        if event.is_directory:
            return
        path = event.src_path
        workspace = self._workspace_for_path(path)
        workspace_name = workspace.get("name") if workspace else "UNKNOWN"
        log(f"[ELIMINADO] {path} (workspace {workspace_name})")

    def on_moved(self, event):
        old = event.src_path
        new = event.dest_path
        if self.es_temporal(new):
            return
        if not self.evento_valido(new):
            return
        workspace = self._workspace_for_path(new)
        workspace_name = workspace.get("name") if workspace else "UNKNOWN"
        owner = self.get_file_owner(new)
        resolved_user, user_from_log, user_from_pdf, user_from_excel = self.resolver_usuario(new, owner)
        self._procesar_factura_epec(new)
        project_label = self._project_label_from_path(new, workspace)
        planilla_label = self._planilla_label_from_path(new)
        self._mark_planilla_modified(project_label, planilla_label)
        if new.lower().endswith((".xlsm", ".xlsx", ".xls", ".xlsb")):
            self._remember_excel_user(new, resolved_user)
        msg = (
            f"[RENOMBRADO] {old} -> {new}\n"
            f"  User detectado: {resolved_user}\n"
            f"  User Excel: {user_from_excel or 'NOT FOUND'}\n"
            f"  User log: {user_from_log or 'NOT FOUND'}\n"
            f"  User PDF: {user_from_pdf or 'NOT FOUND'}\n"
            f"  Workspace: {workspace_name}\n"
            f"  Owner: {owner}"
        )
        log(msg)
        if new.lower().endswith(".pdf"):
            self._notify_email("RENOMBRADO", new, resolved_user, user_from_excel, user_from_log, user_from_pdf, owner, delay_seconds=6)
        else:
            log(f"Se omite envio de email (no es PDF): {new}", "INFO")
