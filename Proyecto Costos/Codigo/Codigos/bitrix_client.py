import json
import os
from typing import Dict, List, Optional

import requests

from config import BITRIX_WEBHOOK_URL


class BitrixClient:
    def __init__(self, base_url: Optional[str] = None):
        self.base_url = (base_url or BITRIX_WEBHOOK_URL or "").rstrip("/")
        if not self.base_url:
            raise ValueError("BITRIX_WEBHOOK_URL no configurado.")

    def _build_url(self, method: str) -> str:
        return f"{self.base_url}/{method}.json"

    def call(self, method: str, params: Optional[Dict] = None) -> Dict:
        url = self._build_url(method)
        try:
            res = requests.post(url, data=params or {}, timeout=20)
        except Exception as exc:
            raise RuntimeError(f"Error llamando a Bitrix {method}: {exc}")

        if res.status_code != 200:
            raise RuntimeError(f"Bitrix {method} status {res.status_code}: {res.text}")

        try:
            data = res.json()
        except Exception as exc:
            raise RuntimeError(f"Bitrix {method} no devolvio JSON: {exc}")

        if "error" in data:
            raise RuntimeError(f"Bitrix {method} error: {data.get('error_description') or data.get('error')}")
        return data.get("result", data)

    def get_profile(self) -> Dict:
        return self.call("profile")

    def find_user_by_email(self, email: str) -> Optional[Dict]:
        if not email:
            return None
        res = self.call("user.get", {"FILTER": {"EMAIL": email}})
        if isinstance(res, list) and res:
            return res[0]
        return None

    def find_users_by_emails(self, emails: List[str]) -> Dict[str, Optional[Dict]]:
        result: Dict[str, Optional[Dict]] = {}
        for email in emails:
            user = self.find_user_by_email(email)
            result[email] = user
        return result

    def create_task(
        self,
        title: str,
        description: str,
        deadline_iso: Optional[str],
        responsible_id: int,
        accomplice_ids: Optional[List[int]] = None,
        auditor_ids: Optional[List[int]] = None,
    ) -> int:
        # Bitrix Cloud acepta formato fields[KEY] en x-www-form-urlencoded
        payload: Dict[str, str] = {
            "fields[TITLE]": title,
            "fields[DESCRIPTION]": description,
            "fields[RESPONSIBLE_ID]": str(responsible_id),
        }
        if deadline_iso:
            payload["fields[DEADLINE]"] = deadline_iso
        if accomplice_ids:
            for idx, acc in enumerate(accomplice_ids):
                payload[f"fields[ACCOMPLICES][{idx}]"] = str(acc)
        if auditor_ids:
            for idx, aud in enumerate(auditor_ids):
                payload[f"fields[AUDITORS][{idx}]"] = str(aud)

        params = payload

        result = self.call("tasks.task.add", params)
        # El resultado puede venir como {"task": {...}, "taskId": "123"} o solo id.
        if isinstance(result, dict):
            task_id = result.get("taskId") or result.get("task", {}).get("id")
        else:
            task_id = result
        if not task_id:
            raise RuntimeError(f"No se obtuvo task_id al crear tarea: {result}")
        return int(task_id)

    def add_comment(self, task_id: int, text: str) -> int:
        payload = {
            "taskId": str(task_id),
            "fields[POST_MESSAGE]": text,
        }
        res = self.call("task.commentitem.add", payload)
        if isinstance(res, dict):
            if "id" in res:
                try:
                    return int(res["id"])
                except Exception:
                    return 0
            if "result" in res:
                try:
                    return int(res["result"])
                except Exception:
                    return 0
        try:
            return int(res)
        except Exception:
            return 0

    def complete_task(self, task_id: int) -> bool:
        payload = {"taskId": str(task_id)}
        try:
            self.call("tasks.task.complete", payload)
            return True
        except Exception:
            return False
