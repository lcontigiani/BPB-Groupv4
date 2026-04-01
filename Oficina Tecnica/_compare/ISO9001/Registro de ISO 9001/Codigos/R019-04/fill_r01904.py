"""
Actualizar R019-04 (Project) desde un CSV de eventos de R019-02 y un
JSON de duraciones modelo para comparar (baseline vs real).

Uso:
  python Codigos/R019-04/fill_r01904.py eventos.csv --modelo modelo.json
  python Codigos/R019-04/fill_r01904.py eventos.csv --modelo modelo.json --out R019-04-ejemplo.mpp
  python Codigos/R019-04/fill_r01904.py eventos.csv --modelo modelo.json --inplace
"""

from __future__ import annotations

import csv
import json
from datetime import datetime, time, timedelta
from pathlib import Path
import os
import sys
import tempfile
from typing import Dict, List, Tuple

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
        return None
    for fmt in (
        "%Y-%m-%d",
        "%Y/%m/%d",
        "%d/%m/%Y",
        "%Y-%m-%d %H:%M",
        "%Y-%m-%d %H:%M:%S",
    ):
        try:
            return datetime.strptime(value, fmt)
        except ValueError:
            continue
    try:
        return datetime.fromisoformat(value)
    except ValueError:
        return None


def task_name(event: Dict[str, str]) -> str:
    desc = (event.get("descripcion") or "").strip()
    if desc:
        return desc[:60]
    etapa = (event.get("etapa") or "").strip()
    if etapa:
        return etapa[:60]
    parts = [event.get("etapa"), event.get("area"), event.get("empresa")]
    name = " | ".join([p for p in parts if p])
    return name if name else "Evento"


def build_notes(event: Dict[str, str]) -> str:
    lines = []
    if event.get("descripcion"):
        lines.append(f"Descripcion: {event['descripcion']}")
    if event.get("resultado"):
        lines.append(f"Resultado: {event['resultado']}")
    if event.get("accion"):
        lines.append(f"Accion: {event['accion']}")
    if event.get("usuario"):
        lines.append(f"Usuario: {event['usuario']}")
    return "\n".join(lines)


def load_model(path: Path | None) -> Tuple[Dict[str, int], int, datetime | None]:
    if not path:
        return {}, 1, None
    data = json.loads(path.read_text(encoding="utf-8"))
    durations = data.get("duraciones", data)
    default = int(data.get("duracion_default", 1))
    start_raw = data.get("fecha_inicio_proyecto")
    start_dt = parse_date(start_raw) if start_raw else None
    cleaned = {}
    for k, v in durations.items():
        try:
            cleaned[str(k)] = int(v)
        except (TypeError, ValueError):
            continue
    return cleaned, default, start_dt


def main() -> None:
    if len(sys.argv) < 2:
        print("Uso: python Codigos/fill_r01904.py eventos.csv --modelo modelo.json [--out archivo.mpp|--inplace]")
        sys.exit(1)

    csv_path = Path(sys.argv[1]).resolve()
    inplace = "--inplace" in sys.argv
    out_path = None
    model_path = None
    include_notes = "--notes" in sys.argv
    if "--out" in sys.argv:
        idx = sys.argv.index("--out")
        if idx + 1 < len(sys.argv):
            out_path = Path(sys.argv[idx + 1]).resolve()
    if "--modelo" in sys.argv:
        idx = sys.argv.index("--modelo")
        if idx + 1 < len(sys.argv):
            model_path = Path(sys.argv[idx + 1]).resolve()

    base = Path(__file__).resolve().parent
    docs_root = base.parent.parent
    model = docs_root / "R019-04-Modelo.mpp"
    if not model.exists():
        alt = docs_root / "R019-04" / "R019-04-Modelo.mpp"
        if alt.exists():
            model = alt
        else:
            mpp_files = list(docs_root.glob("*.mpp"))
            if not mpp_files:
                raise FileNotFoundError("No se encontró ningún .mpp en la carpeta.")
            model = mpp_files[0]

    dest = model if inplace else (out_path or (docs_root / "R019-04" / "R019-04-salida.mpp"))

    eventos = parse_csv(csv_path)
    if not eventos:
        raise ValueError("El CSV no tiene filas de eventos.")

    # Copia local para evitar problemas con rutas UNC y acentos (archivo temporal único)
    fd, tmp_name = tempfile.mkstemp(prefix="r01904-", suffix=".mpp")
    os.close(fd)
    tmp = Path(tmp_name)
    tmp.write_bytes(model.read_bytes())

    app = Dispatch("MSProject.Application")
    try:
        app.Visible = False
    except Exception:
        pass
    try:
        app.DisplayAlerts = False
    except Exception:
        pass
    app.FileOpen(str(tmp), ReadOnly=False)
    proj = app.ActiveProject

    # Limpiar tareas existentes
    for i in range(proj.Tasks.Count, 0, -1):
        t = proj.Tasks(i)
        if t is not None:
            t.Delete()

    # Duraciones modelo para baseline
    model_durations, default_duration, model_start = load_model(model_path)

    # Crear tareas
    dates: List[Tuple[Dict[str, str], datetime | None]] = [
        (e, parse_date(e.get("fecha", ""))) for e in eventos
    ]

    # Base para el baseline (se alinea al inicio real de la primera tarea)
    baseline_cursor = None
    if model_start:
        proj.ProjectStart = datetime.combine(model_start.date(), time(9, 0))
        baseline_cursor = proj.ProjectStart

    for idx, (event, dt) in enumerate(dates, start=1):
        task = proj.Tasks.Add(task_name(event))
        if include_notes:
            notes = build_notes(event)
            if notes:
                task.Notes = notes
        # Campos auxiliares (mapeados a columnas Etapa/Area/Empresa/Descripcion del modelo)
        if event.get("etapa"):
            task.Text1 = event["etapa"]
        if event.get("area"):
            task.Text2 = event["area"]
        if event.get("empresa"):
            task.Text3 = event["empresa"]
        if event.get("descripcion"):
            task.Text4 = event["descripcion"]
        if event.get("resultado"):
            task.Text5 = event["resultado"]

        if dt:
            # Hora base 09:00 inicio, 18:00 fin para el real
            start_dt = datetime.combine(dt.date(), time(9, 0))
            next_dt = dates[idx][1] if idx < len(dates) else None
            if next_dt:
                finish_dt = datetime.combine(next_dt.date(), time(18, 0))
            else:
                finish_dt = start_dt
                task.Milestone = True
            task.Start = start_dt
            task.Finish = finish_dt

        # Baseline (modelo)
        etapa = event.get("etapa", "")
        dur_days = model_durations.get(etapa, default_duration)
        if baseline_cursor is None and dt:
            baseline_cursor = start_dt
        if baseline_cursor:
            base_start = baseline_cursor
            base_finish = base_start + timedelta(days=dur_days)
            try:
                task.BaselineStart = base_start
                task.BaselineFinish = base_finish
                try:
                    task.BaselineDuration = f"{dur_days}d"
                except Exception:
                    pass
            except Exception:
                pass
            baseline_cursor = base_finish
        # Predecesor secuencial
        if idx > 1:
            task.Predecessors = str(idx - 1)

    # Guardar salida
    if inplace:
        app.FileSave()
    else:
        app.FileSaveAs(str(dest))
    app.FileCloseAll(True)
    app.Quit()

    try:
        tmp.unlink()
    except Exception:
        pass

    print(f"Actualizado: {dest}")


if __name__ == "__main__":
    main()
