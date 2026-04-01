import json
import csv
import re
from pathlib import Path
from datetime import datetime

COLS = [
    "Codigo",
    "C",
    "C+",
    "C-",
    "B",
    "B+",
    "B-",
    "D",
    "D+",
    "D-",
    "d",
    "d+",
    "d-",
    "GR",
    "GR+",
    "GR-",
    "ARO INT+",
    "ARO INT -",
    "ARO EXT +",
    "ARO EXT -",
    "Fecha Rev. Plano",
    "Rev.",
]


def load_json(path: Path) -> dict:
    txt = path.read_text(encoding="utf-8", errors="ignore").strip()
    if txt.startswith("```"):
        txt = txt.strip("`").strip()
    # If already pure JSON
    try:
        data = json.loads(txt)
        if isinstance(data, dict):
            return data
    except Exception:
        pass
    # Fallback: extract first JSON object
    m = re.search(r"\{.*\}", txt, re.S)
    return json.loads(m.group(0)) if m else {}


def to_um_str(val):
    if val in (None, "", "null"):
        return "-"
    try:
        return str(int(round(float(val) * 1000)))
    except Exception:
        return str(val)


def val_str(val):
    if val in (None, "", "null"):
        return "-"
    return str(val)


def format_number(val):
    """Return value as string with comma decimal separator and no trailing ,0."""
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
    # trim trailing zeros
    s = s.rstrip("0").rstrip(".")
    s = s.replace(".", ",")
    if s.endswith(",0"):
        s = s[:-2]
    return s


def pick_latest_revision(revhist, root_rev, root_date):
    """Pick the revision entry with the latest date (dd/mm/yyyy or yyyy-mm-dd)."""
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
    # yyyy-mm-dd
    m = re.match(r"(\d{4})-(\d{2})-(\d{2})", s)
    if m:
        return f"{m.group(3)}/{m.group(2)}/{m.group(1)}"
    # dd/mm/yyyy or dd/mm/yy
    m = re.match(r"(\d{2})/(\d{2})/(\d{2,4})", s)
    if m:
        day, month, year = m.group(1), m.group(2), m.group(3)
        if len(year) == 2:
            year = "20" + year
        return f"{day}/{month}/{year}"
    return s


def extract_row(code: str, data: dict) -> dict:
    row = {k: "-" for k in COLS}
    row["Codigo"] = code

    dims = data.get("dimensions") or {}
    th = dims.get("thickness") or {}
    od = dims.get("outer_dia") or {}
    idd = dims.get("inner_dia") or {}

    row["C"] = format_number(th.get("value_mm"))
    row["C+"] = to_um_str(th.get("tol_plus_mm"))
    row["C-"] = to_um_str(th.get("tol_minus_mm"))
    row["B"] = row["C"]
    row["B+"] = row["C+"]
    row["B-"] = row["C-"]

    row["D"] = format_number(od.get("value_mm"))
    row["D+"] = to_um_str(od.get("tol_plus_mm"))
    row["D-"] = to_um_str(od.get("tol_minus_mm"))

    row["d"] = format_number(idd.get("value_mm"))
    row["d+"] = to_um_str(idd.get("tol_plus_mm"))
    row["d-"] = to_um_str(idd.get("tol_minus_mm"))

    rc = data.get("radial_clearance") or {}
    rc_range = rc.get("range_um") or {}
    row["GR"] = val_str(rc.get("class"))
    row["GR-"] = format_number(rc_range.get("min"))
    row["GR+"] = format_number(rc_range.get("max"))

    hrc = data.get("hardness_hrc") or {}
    inner_plus = hrc.get("inner_plus")
    inner_minus = hrc.get("inner_minus")
    outer_plus = hrc.get("outer_plus")
    outer_minus = hrc.get("outer_minus")
    # If outer is missing, inherit inner
    if outer_plus in (None, "", "null"):
        outer_plus = inner_plus
    if outer_minus in (None, "", "null"):
        outer_minus = inner_minus

    row["ARO INT+"] = format_number(inner_plus)
    row["ARO INT -"] = format_number(inner_minus)
    row["ARO EXT +"] = format_number(outer_plus)
    row["ARO EXT -"] = format_number(outer_minus)

    revhist = data.get("revision_history") or []
    rev, date = pick_latest_revision(revhist, data.get("revision"), data.get("date"))
    row["Rev."] = val_str(rev)
    row["Fecha Rev. Plano"] = format_date(date)

    return row


def write_csv(path: Path, row: dict):
    with open(path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=COLS, delimiter=";")
        writer.writeheader()
        writer.writerow(row)


def main():
    import argparse

    ap = argparse.ArgumentParser(description="Genera CSV para rodillo desde JSON estándar.")
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
