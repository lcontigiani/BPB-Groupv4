"""
Actualizar R019-02 desde un JSON (cabecera) y un CSV (eventos).

Uso:
  python Codigos/R019-02/fill_r01902.py cabecera.json eventos.csv
  python Codigos/R019-02/fill_r01902.py cabecera.json eventos.csv --inplace

Por defecto genera una copia: R019-02-salida.xls en la carpeta superior.
"""

from __future__ import annotations

import csv
import json
from datetime import datetime
from pathlib import Path
import sys
from typing import Dict, List

from win32com.client import Dispatch


EXPECTED_COLS = [
    "fecha",
    "etapa",
    "area",
    "empresa",
    "descripcion",
    "resultado",
    "accion",
    "usuario",
]


def normalize_col(name: str) -> str:
    if name is None:
        return ""
    text = name.strip().lower()
    # Normalizar acentos comunes para comparar
    replacements = {
        "á": "a",
        "é": "e",
        "í": "i",
        "ó": "o",
        "ú": "u",
        "ñ": "n",
    }
    for src, dst in replacements.items():
        text = text.replace(src, dst)
    return text


def parse_csv(path: Path) -> List[Dict[str, str]]:
    raw = path.read_text(encoding="utf-8-sig", errors="replace")
    try:
        dialect = csv.Sniffer().sniff(raw.splitlines()[0])
        delimiter = dialect.delimiter
    except Exception:
        delimiter = "," if "," in raw.splitlines()[0] else ";"

    rows: List[Dict[str, str]] = []
    with path.open(newline="", encoding="utf-8-sig") as fh:
        reader = csv.DictReader(fh, delimiter=delimiter)
        if not reader.fieldnames:
            raise ValueError("El CSV no tiene encabezados.")
        colmap = {normalize_col(n): n for n in reader.fieldnames}
        missing = [c for c in EXPECTED_COLS if c not in colmap]
        if missing:
            raise ValueError(f"Faltan columnas en CSV: {', '.join(missing)}")
        for row in reader:
            out = {c: (row.get(colmap[c]) or "").strip() for c in EXPECTED_COLS}
            rows.append(out)
    return rows


def parse_date(value: str):
    if not value:
        return ""
    for fmt in ("%Y-%m-%d", "%Y/%m/%d", "%d/%m/%Y", "%Y-%m-%d %H:%M", "%Y-%m-%d %H:%M:%S"):
        try:
            return datetime.strptime(value, fmt)
        except ValueError:
            continue
    try:
        return datetime.fromisoformat(value)
    except ValueError:
        return value


def main() -> None:
    if len(sys.argv) < 3:
        print("Uso: python Codigos/fill_r01902.py cabecera.json eventos.csv [--inplace]")
        sys.exit(1)

    header_path = Path(sys.argv[1]).resolve()
    csv_path = Path(sys.argv[2]).resolve()
    inplace = "--inplace" in sys.argv

    base = Path(__file__).resolve().parent
    docs_root = base.parent.parent
    src = docs_root / "R019-02-Modelo.xls"
    dest = src if inplace else docs_root / "R019-02-salida.xls"

    if not src.exists():
        raise FileNotFoundError(f"No se encontró el archivo base: {src}")

    if not inplace:
        dest.write_bytes(src.read_bytes())

    header = json.loads(header_path.read_text(encoding="utf-8"))
    eventos = parse_csv(csv_path)

    excel = Dispatch("Excel.Application")
    excel.Visible = False
    excel.DisplayAlerts = False
    wb = excel.Workbooks.Open(str(dest))
    ws = wb.Worksheets(1)

    # Cabecera
    producto = header.get("producto", "")
    codigo = header.get("codigo_producto", "")
    ultima_rev = header.get("ultima_revision_plano", "")

    ws.Cells(2, 2).Value = producto  # B2
    ws.Cells(2, 3).Value = f"Ultima Revisión Plano: {ultima_rev}"  # C2
    ws.Cells(2, 7).Value = codigo  # G2

    # Encabezados tabla (fila 3)
    ws.Cells(3, 1).Value = "Fecha"
    ws.Cells(3, 2).Value = "Etapa"
    ws.Cells(3, 3).Value = "Area"
    ws.Cells(3, 4).Value = "Empresa"
    ws.Cells(3, 5).Value = "Descripción"
    ws.Cells(3, 6).Value = "Resultados"
    ws.Cells(3, 7).Value = "Acción"
    ws.Cells(3, 8).Value = "Ord / Usuario"

    # Buscar última fila con fecha en columna A
    xl_up = -4162
    last_row = ws.Cells(ws.Rows.Count, 1).End(xl_up).Row
    start_row = 4 if last_row < 4 else last_row + 1

    row = start_row
    template_row = 4
    for e in eventos:
        # Copiar solo formato desde la fila plantilla para mantener estilos.
        ws.Rows(template_row).Copy()
        ws.Rows(row).PasteSpecial(Paste=-4122)  # xlPasteFormats
        excel.CutCopyMode = False

        ws.Cells(row, 1).Value = parse_date(e["fecha"])
        ws.Cells(row, 2).Value = e["etapa"]
        ws.Cells(row, 3).Value = e["area"]
        ws.Cells(row, 4).Value = e["empresa"]
        ws.Cells(row, 5).Value = e["descripcion"]
        ws.Cells(row, 6).Value = e["resultado"]
        ws.Cells(row, 7).Value = e["accion"]
        ws.Cells(row, 8).Value = e["usuario"]
        row += 1

    wb.Save()
    wb.Close()
    excel.Quit()

    print(f"Actualizado: {dest}")


if __name__ == "__main__":
    main()
