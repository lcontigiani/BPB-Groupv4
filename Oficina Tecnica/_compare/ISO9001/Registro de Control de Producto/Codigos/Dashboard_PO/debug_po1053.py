
import csv
from pathlib import Path

FILE_PATH = Path(r"\\BPBSRV03\lcontigiani\Oficina Tecnica\Registro de Control de Producto\Auxiliares\Ingresos\resumen_all.csv")
PO_ID = "1053"

if not FILE_PATH.exists():
    print("File not found")
    exit()

encodings = ['utf-8-sig', 'cp1252', 'latin-1']
content = None
used_enc = ""
for enc in encodings:
    try:
        content = FILE_PATH.read_text(encoding=enc)
        used_enc = enc
        break
    except Exception as e:
        print(f"Failed {enc}: {e}")

if content is None:
    print("Could not read file")
    exit()

print(f"Read success with {used_enc}")

lines = [ln for ln in content.splitlines() if ln.strip()]
print(f"Total lines: {len(lines)}")

if not lines:
    print("Empty file")
    exit()

first_line = lines[0]
delimiter = ';' if first_line.count(';') >= first_line.count(',') else ','
print(f"Delimiter: '{delimiter}'")

reader = csv.reader(lines, delimiter=delimiter)
all_rows = list(reader)
header = all_rows[0]
data_rows = all_rows[1:]

target_po_clean = str(PO_ID).strip().lower()

matches = []
print(f"Searching for '{target_po_clean}'...")

for i, row in enumerate(data_rows):
    match = False
    vals_checked = []
    
    # Logic from app.py
    if len(row) > 1:
        val1 = row[1].strip().lower()
        vals_checked.append(f"row[1]='{val1}'")
        if target_po_clean in val1: match = True
    if len(row) > 2:
        val2 = row[2].strip().lower()
        vals_checked.append(f"row[2]='{val2}'")
        if target_po_clean in val2: match = True
            
    if match:
        matches.append(row)
        print(f"MATCH Line {i+2}: {row} (Checked: {vals_checked})")
    else:
        # Check if it SHOULD have matched (contains 1053 anywhere?)
        raw = str(row).lower()
        if target_po_clean in raw:
             print(f"MISSED Line {i+2}: {row} (Checked: {vals_checked})")

print(f"Total matches: {len(matches)}")
