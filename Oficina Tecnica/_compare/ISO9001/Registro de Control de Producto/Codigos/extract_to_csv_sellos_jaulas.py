import json
import csv
import re
from pathlib import Path
from datetime import datetime

COLS = [
    "Codigo",
    "Fecha Rev. Plano",
    "Rev.",
]


def load_json(path: Path) -> dict:
    txt = path.read_text(encoding="utf-8", errors="ignore").strip()
    if txt.startswith("```"):
        txt = txt.strip("`").strip()
    try:
        data = json.loads(txt)
        if isinstance(data, dict):
            return data
    except Exception:
        pass
    m = re.search(r"\{.*\}", txt, re.S)
    return json.loads(m.group(0)) if m else {}


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


def extract_row(code: str, data: dict) -> dict:
    row = {k: "-" for k in COLS}
    row["Codigo"] = code

    revhist = data.get("revision_history") or []
    rev, date = pick_latest_revision(revhist, data.get("revision"), data.get("date"))
    row["Rev."] = rev or "0"
    row["Fecha Rev. Plano"] = format_date(date)

    return row


def write_csv(path: Path, row: dict):
    with open(path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=COLS, delimiter=";")
        writer.writeheader()
        writer.writerow(row)


def main():
    import argparse

    ap = argparse.ArgumentParser(description="Genera CSV (Sellos y Jaulas) desde JSON estándar.")
    ap.add_argument("--product-code", required=True)
    ap.add_argument("--input", required=True, help="notes_extracted_gemini.json")
    ap.add_argument("--output", required=True)
    args = ap.parse_args()

    data = load_json(Path(args.input))
    row = extract_row(args.product_code, data)
    write_csv(Path(args.output), row)
    print("CSV written", args.output)
    print(row)


if __name__ == "__main__":
    main()
