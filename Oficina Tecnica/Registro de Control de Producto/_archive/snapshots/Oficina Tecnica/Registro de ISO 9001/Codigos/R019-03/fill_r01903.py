"""
Actualizar R019-03 desde un JSON y agregar una nueva fila.

Uso:
  python Codigos/R019-03/fill_r01903.py payload.json
  python Codigos/R019-03/fill_r01903.py payload.json --inplace

Por defecto genera una copia: R019-03-salida.xlsm en la carpeta superior.
"""

from __future__ import annotations

import json
from datetime import datetime
from pathlib import Path
import sys
from typing import Optional

from win32com.client import Dispatch


def parse_date(value: str | None) -> Optional[datetime]:
    if not value:
        return None
    value = value.strip()
    for fmt in ("%Y-%m-%d", "%Y/%m/%d", "%d/%m/%Y", "%Y-%m-%d %H:%M", "%Y-%m-%d %H:%M:%S"):
        try:
            return datetime.strptime(value, fmt)
        except ValueError:
            continue
    try:
        return datetime.fromisoformat(value)
    except ValueError:
        return None


def main() -> None:
    if len(sys.argv) < 2:
        print("Uso: python Codigos/R019-03/fill_r01903.py payload.json [--inplace]")
        sys.exit(1)

    payload_path = Path(sys.argv[1]).resolve()
    inplace = "--inplace" in sys.argv

    base = Path(__file__).resolve().parent
    docs_root = base.parent.parent
    src = docs_root / "R019-03 - Listado de Diseños y Desarrollos- Rev2.xlsm"
    dest = src if inplace else docs_root / "R019-03-salida.xlsm"

    if not src.exists():
        raise FileNotFoundError(f"No se encontró el archivo base: {src}")

    if not inplace:
        dest.write_bytes(src.read_bytes())

    payload = json.loads(payload_path.read_text(encoding="utf-8"))
    codigo = (payload.get("codigo_producto") or "").strip()
    empresa = (payload.get("empresa") or "").strip()
    descripcion = (payload.get("descripcion") or "").strip()
    fecha_inicio = parse_date(payload.get("fecha_inicio", "")) or datetime.now()
    fecha_fin = parse_date(payload.get("fecha_finalizacion", "")) if payload.get("fecha_finalizacion") else None
    valoracion = payload.get("valoracion", "")
    ubicacion = payload.get("ubicacion", "")

    if not descripcion:
        if codigo and empresa:
            descripcion = f"{codigo} - {empresa}"
        else:
            descripcion = codigo or empresa

    excel = Dispatch("Excel.Application")
    excel.Visible = False
    excel.DisplayAlerts = False
    wb = excel.Workbooks.Open(str(dest))
    ws = wb.Worksheets(1)

    # Buscar la última fila con DyD N° (columna A)
    xl_up = -4162
    last_row = ws.Cells(ws.Rows.Count, 1).End(xl_up).Row
    if last_row < 7:
        last_row = 6
    new_row = last_row + 1

    # Copiar solo formato de la última fila con datos (o fila 7 como plantilla)
    template_row = last_row if last_row >= 7 else 7
    ws.Rows(template_row).Copy()
    ws.Rows(new_row).PasteSpecial(Paste=-4122)  # xlPasteFormats
    excel.CutCopyMode = False

    # DyD N° = último + 1
    last_dyd = ws.Cells(last_row, 1).Value
    try:
        next_dyd = int(last_dyd) + 1
    except Exception:
        next_dyd = 1

    ws.Cells(new_row, 1).Value = next_dyd
    ws.Cells(new_row, 2).Value = descripcion
    ws.Cells(new_row, 3).Value = fecha_inicio
    ws.Cells(new_row, 4).Value = fecha_fin if fecha_fin else ""
    ws.Cells(new_row, 5).Value = valoracion
    ws.Cells(new_row, 6).Value = ubicacion

    wb.Save()
    wb.Close()
    excel.Quit()

    print(f"Actualizado: {dest}")


if __name__ == "__main__":
    main()
