import json
import csv
import re
from pathlib import Path
from datetime import datetime

COLS = [
    "Codigo",
    "Juego",
    "Juego+",
    "Juego-",
    "Fecha Rev. Plano",
    "Rev.",
    "Observaciones",
]


def load_standard_json(path: Path) -> dict:
    txt = path.read_text(encoding="utf-8", errors="ignore").strip()
    if txt.startswith("```"):
        txt = txt.strip("`").strip()
    m = re.search(r"\{.*\}", txt, re.S)
    data = json.loads(m.group(0)) if m else {}
    return data if isinstance(data, dict) else {}


def format_number(val):
    if val in (None, "", "null", "-"):
        return "-"
    try:
        num = float(val)
    except Exception:
        s = str(val)
        if "." in s:
            s = s.replace(".", ",")
        if s.endswith(",0"):
            s = s[:-2]
        return s
    s = f"{num:.4f}"
    s = s.rstrip("0").rstrip(".")
    s = s.replace(".", ",")
    if s.endswith(",0"):
        s = s[:-2]
    return s


def pick_latest_revision(revhist, root_rev, root_date):
    def parse_date(d):
        if not d:
            return None
        for fmt in ("%d/%m/%Y", "%Y-%m-%d", "%d/%m/%y"):
            try:
                return datetime.strptime(d, fmt)
            except Exception:
                continue
        return None

    candidates = []
    if root_rev or root_date:
        candidates.append({"rev": root_rev, "date": root_date})
    for item in revhist or []:
        candidates.append(item)

    latest = None
    latest_dt = None
    for item in candidates:
        dt = parse_date(item.get("date"))
        if dt and (latest_dt is None or dt > latest_dt):
            latest_dt = dt
            latest = item
    if latest:
        return latest.get("rev"), latest.get("date")
    return root_rev or "0", root_date


def format_date(v: str) -> str:
    if v in (None, "", "null", "-"):
        return "-"
    s = str(v)
    m = re.match(r"(\d{4})-(\d{2})-(\d{2})", s)
    if m:
        return f"{m.group(3)}/{m.group(2)}/{m.group(1)}"
    m = re.match(r"(\d{2})/(\d{2})/(\d{2,4})", s)
    if m:
        day, month, year = m.group(1), m.group(2), m.group(3)
        if len(year) == 2:
            year = "20" + year
        return f"{day}/{month}/{year}"
    return s


def build_row(code: str, data: dict) -> dict:
    row = {k: "-" for k in COLS}
    row["Codigo"] = code

    rc = data.get("radial_clearance") or {}
    rc_range = rc.get("range_um") or {}
    # Si no hay clase de juego, debe decir "NO EXISTE"
    row["Juego"] = rc.get("class") or "NO EXISTE"
    row["Juego-"] = format_number(rc_range.get("min")) if rc_range.get("min") not in (None, "", "null") else "NO EXISTE"
    row["Juego+"] = format_number(rc_range.get("max")) if rc_range.get("max") not in (None, "", "null") else "NO EXISTE"

    revhist = data.get("revision_history") or []
    rev, date = pick_latest_revision(revhist, data.get("revision"), data.get("date"))
    row["Rev."] = rev or "0"
    row["Fecha Rev. Plano"] = format_date(date)

    row["Observaciones"] = data.get("notes") or "-"
    return row


def write_csv(path: Path, row: dict):
    with open(path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=COLS, delimiter=";")
        writer.writeheader()
        writer.writerow(row)


def main():
    import argparse

    ap = argparse.ArgumentParser(description="Genera CSV (especiales) desde JSON estándar Gemini.")
    ap.add_argument("--product-code", required=True)
    ap.add_argument("--input", required=True, help="notes_extracted_gemini.json")
    ap.add_argument("--output", required=True)
    args = ap.parse_args()

    data = load_standard_json(Path(args.input))
    row = build_row(args.product_code, data)
    write_csv(Path(args.output), row)
    print("CSV written", args.output)
    print(row)


if __name__ == "__main__":
    main()
