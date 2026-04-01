import argparse
import csv
import shutil
import re
import os
from pathlib import Path
from datetime import datetime

try:
    import openpyxl
except ImportError:
    openpyxl = None


def get_base_dir() -> Path:
    # Priority 1: Environment Variable
    env_root = os.environ.get("BPB_BASE_DIR")
    if env_root:
        return Path(env_root)
    # Priority 2: Relative to CWD (assuming running from Codigos/)
    # If we are in Codigos, root is parent.
    cwd = Path.cwd()
    if cwd.name.lower() == "codigos":
        return cwd.parent
    return cwd

BASE_DIR = get_base_dir()

def export_xlsx_to_csv(xlsx_path: Path, csv_path: Path) -> None:
    if openpyxl is None:
        raise RuntimeError("openpyxl no disponible para leer XLSX")
    wb = openpyxl.load_workbook(xlsx_path, read_only=True, data_only=True)
    sh = wb.active
    with open(csv_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f, delimiter=";")
        for row in sh.iter_rows(values_only=True):
            writer.writerow(list(row))
    wb.close()


def to_str(v):
    return "" if v is None else str(v).strip()


def parse_date(val: str):
    for fmt in ("%d/%m/%Y", "%d/%m/%y", "%Y-%m-%d"):
        try:
            return datetime.strptime(val.strip(), fmt)
        except Exception:
            continue
    return None


def build_resumen(src_csv: Path, out_csv: Path) -> None:
    # Columnas por letra: Codigo=E, PO=L, Observac=I (1-based -> 5,12,9), extra Col D (1-based ->4, Fecha)
    col_codigo, col_po, col_obs, col_d, col_fecha = 4, 11, 8, 3, 3

    rows = []
    with open(src_csv, newline="", encoding="utf-8", errors="ignore") as f_in:
        reader = csv.reader(f_in, delimiter=";")
        for row in reader:
            rows.append(row)

    # Encontrar fecha más reciente (columna A suponiendo fecha)
    max_dt = None
    max_raw = None
    for r in rows:
        if len(r) <= col_fecha:
            continue
        raw_date = to_str(r[col_fecha])
        if not raw_date:
            continue
        dt = parse_date(raw_date)
        if dt is not None:
            if max_dt is None or dt > max_dt:
                max_dt = dt
                max_raw = raw_date
        else:
            # si no parsea, guardamos el último no vacío como fallback
            max_raw = raw_date

    with open(out_csv, "w", newline="", encoding="utf-8") as f_out:
        writer = csv.DictWriter(
            f_out, fieldnames=["Codigo", "PO", "Observac_PO", "Columna_D"], delimiter=";"
        )
        writer.writeheader()
        for row in rows:
            if len(row) <= max(col_codigo, col_po, col_obs, col_d):
                continue
            # filtrar por fecha más actual
            raw_date = to_str(row[col_fecha])
            if max_dt:
                dt = parse_date(raw_date)
                if dt is None or dt != max_dt:
                    continue
            else:
                if max_raw and raw_date != max_raw:
                    continue
            codigo = to_str(row[col_codigo])
            po = to_str(row[col_po])
            obs = to_str(row[col_obs])
            col_d_val = to_str(row[col_d])
            if not codigo and not po and not obs and not col_d_val:
                continue
            # Limpiar Observac: solo números SI están precedidos por '#'
            obs_clean = ""
            if obs:
                m_hash = re.search(r"#\s*(\d+)", obs)
                if m_hash:
                    obs_clean = m_hash.group(1)
            writer.writerow({"Codigo": codigo, "PO": po, "Observac_PO": obs_clean, "Columna_D": col_d_val})


def build_resumen_all(src_csv: Path, out_csv: Path) -> None:
    """Genera resumen sin filtrar por fecha (todas las filas con datos)."""
    col_codigo, col_po, col_obs, col_d = 4, 11, 8, 3
    rows = []
    with open(src_csv, newline="", encoding="utf-8", errors="ignore") as f_in:
        reader = csv.reader(f_in, delimiter=";")
        for row in reader:
            rows.append(row)
    with open(out_csv, "w", newline="", encoding="utf-8") as f_out:
        writer = csv.DictWriter(
            f_out, fieldnames=["Codigo", "PO", "Observac_PO", "Columna_D"], delimiter=";"
        )
        writer.writeheader()
        for row in rows:
            if len(row) <= max(col_codigo, col_po, col_obs, col_d):
                continue
            codigo = to_str(row[col_codigo])
            po = to_str(row[col_po])
            obs = to_str(row[col_obs])
            col_d_val = to_str(row[col_d])
            if not codigo and not po and not obs and not col_d_val:
                continue
            obs_clean = ""
            if obs:
                m_hash = re.search(r"#\s*(\d+)", obs)
                if m_hash:
                    obs_clean = m_hash.group(1)
            writer.writerow({"Codigo": codigo, "PO": po, "Observac_PO": obs_clean, "Columna_D": col_d_val})

def main():
    default_xlsx = BASE_DIR / "Auxiliares/Ingresos/Ingresos diarios.xlsx"
    default_csv = BASE_DIR / "Auxiliares/Ingresos/Ingresos diarios.csv"

    ap = argparse.ArgumentParser(description="Procesa 'Ingresos diarios' (xlsx/csv) y genera resumen.csv")
    ap.add_argument(
        "--xlsx",
        default=str(default_xlsx),
        help="Ruta al XLSX origen",
    )
    ap.add_argument(
        "--csv",
        default=str(default_csv),
        help="Ruta al CSV (se sobrescribe si hay XLSX)",
    )
    ap.add_argument(
        "--just-update-csv", 
        action="store_true", 
        help="Solo actualiza CSV de ingresos y resumen_all, sin generar nuevo Registro"
    )
    args = ap.parse_args()

    xlsx_path = Path(args.xlsx)
    csv_path = Path(args.csv)

    # Auto-detect XLSM if XLSX is missing
    if not xlsx_path.exists() and xlsx_path.suffix.lower() == ".xlsx":
        maybe_xlsm = xlsx_path.with_suffix(".xlsm")
        if maybe_xlsm.exists():
            xlsx_path = maybe_xlsm
            print(f"Aviso: Archivo .xlsx no encontrado, usando .xlsm detectado: {xlsx_path}")

    if xlsx_path.exists():
        export_xlsx_to_csv(xlsx_path, csv_path)
        print(f"CSV exportado desde XLSX -> {csv_path}")
    elif not csv_path.exists():
        raise FileNotFoundError("No se encontró ni XLSX ni CSV de ingresos.")

    if args.just_update_csv:
        # Generar temp y all pero sin crear carpeta de Registro
        # Esto sirve para que el listado manual tenga datos frescos
        resumen_temp = csv_path.with_name("resumen_temp.csv")
        resumen_all = csv_path.with_name("resumen_all.csv")
        build_resumen(csv_path, resumen_temp)
        build_resumen_all(csv_path, resumen_all)
        print(f"Modo Update-Only: CSVs actualizados ({resumen_all})")
        return

    # Copiar resumen a P1 processed creando un nuevo registro
    processed_root = BASE_DIR / "P1 - Registros Solicitados/in process"
    seq_candidates = [
        BASE_DIR / "P1 - Registros Solicitados/Auxiliar/.registro_seq.txt",
        BASE_DIR / "P1 - Registros Solicitados/Auxiliar/.registro_seq",
    ]
    seq_path = next((p for p in seq_candidates if p.exists()), None)
    if seq_path is None:
        raise FileNotFoundError(f"No se encontró archivo de secuencia (.registro_seq.txt / .registro_seq) en {seq_candidates[0].parent}")
    processed_root.mkdir(parents=True, exist_ok=True)
    seq_path.parent.mkdir(parents=True, exist_ok=True)
    try:
        raw_seq = seq_path.read_text(encoding="utf-8").strip()
        m = re.search(r"(\d+)", raw_seq)
        current = int(m.group(1)) if m else 0
    except Exception:
        raise ValueError(f"No se pudo leer la secuencia en {seq_path}")
    # Generar resumen temporal (última fecha) y resumen all (todas las fechas)
    resumen_temp = csv_path.with_name("resumen_temp.csv")
    resumen_all = csv_path.with_name("resumen_all.csv")
    build_resumen(csv_path, resumen_temp)
    build_resumen_all(csv_path, resumen_all)

    # Buscar último resumen previo
    prev_resumen = None
    # intentar con el número actual
    for p in processed_root.glob(f"Registro - R{current:04d}*"):
        cand = p / "resumen.csv"
        if cand.exists():
            prev_resumen = cand
            break
    # si no, tomar el más alto disponible
    if prev_resumen is None:
        def seq_num(path: Path):
            m = re.search(r"R(\d{4})", path.name)
            return int(m.group(1)) if m else -1
        dirs = [p for p in processed_root.glob("Registro - R*") if p.is_dir()]
        if dirs:
            dirs.sort(key=seq_num, reverse=True)
            cand = dirs[0] / "resumen.csv"
            if cand.exists():
                prev_resumen = cand

    if prev_resumen and prev_resumen.exists():
        try:
            same = resumen_temp.read_bytes() == prev_resumen.read_bytes()
        except Exception:
            same = False
        if same:
            print("resumen.csv idéntico al registro anterior; NO se crea un nuevo registro.")
            return

    new_num = current + 1
    seq_path.write_text(f"R{new_num:04d}", encoding="utf-8")
    folder = processed_root / f"Registro - R{new_num:04d} - {datetime.now():%Y-%m-%d}"
    folder.mkdir(parents=True, exist_ok=True)

    resumen_path = folder / "resumen.csv"
    shutil.copy2(resumen_temp, resumen_path)
    shutil.copy2(resumen_all, folder / "resumen_all.csv")
    print(f"resumen.csv generado en {resumen_path} (y resumen_all.csv)")


if __name__ == "__main__":
    main()
