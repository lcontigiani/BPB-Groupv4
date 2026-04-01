import argparse
import csv
import shutil
import re
import os
import time
from pathlib import Path
from datetime import datetime

try:
    import openpyxl
except ImportError:
    openpyxl = None

try:
    import win32com.client  # type: ignore
    import pythoncom  # type: ignore
except Exception:
    win32com = None
    pythoncom = None


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




def refresh_excel_com(xlsx_path: Path, timeout_sec: int = 180) -> bool:
    """Abre el Excel con COM, refresca conexiones/calculo y guarda."""
    if win32com is None or pythoncom is None:
        return False
    pythoncom.CoInitialize()
    excel = None
    wb = None
    try:
        excel = win32com.client.DispatchEx("Excel.Application")
        excel.Visible = False
        excel.DisplayAlerts = False
        try:
            # Forzar c?lculo autom?tico
            excel.Calculation = -4105  # xlCalculationAutomatic
        except Exception:
            pass
        wb = excel.Workbooks.Open(str(xlsx_path), UpdateLinks=3, ReadOnly=False)
        wb.RefreshAll()
        try:
            # Espera a que terminen queries as?ncronas si existen
            excel.CalculateUntilAsyncQueriesDone()
        except Exception:
            pass
        start = time.time()
        while True:
            try:
                if excel.CalculationState == 0:  # xlDone
                    break
            except Exception:
                break
            if time.time() - start > timeout_sec:
                break
            time.sleep(0.5)
        wb.Save()
        return True
    except Exception as exc:
        print(f"[WARN] No se pudo refrescar Excel via COM: {exc}")
        return False
    finally:
        try:
            if wb is not None:
                wb.Close(SaveChanges=True)
        except Exception:
            pass
        try:
            if excel is not None:
                excel.Quit()
        except Exception:
            pass
        try:
            pythoncom.CoUninitialize()
        except Exception:
            pass

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


def load_resumen_rows(path: Path) -> set:
    rows = set()
    with open(path, newline="", encoding="utf-8", errors="ignore") as f_in:
        reader = csv.reader(f_in, delimiter=";")
        header = next(reader, None)
        for row in reader:
            if not any(cell.strip() for cell in row if cell is not None):
                continue
            rows.add(tuple(to_str(cell) for cell in row))
    return rows


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
    ap.add_argument(
        "--refresh-excel",
        action="store_true",
        help="Refresca el Excel de ingresos (conexiones y c?lculo) antes de exportar a CSV",
    )
    ap.add_argument(
        "--refresh-timeout",
        type=int,
        default=180,
        help="Timeout (segundos) para esperar el refresh/calculo de Excel",
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
        if args.refresh_excel:
            refreshed = refresh_excel_com(xlsx_path, timeout_sec=args.refresh_timeout)
            if refreshed:
                print("Excel refrescado correctamente antes de exportar CSV.")
            else:
                raise RuntimeError("No se pudo refrescar el Excel. Verifique que Excel est? instalado y que el archivo no est? abierto.")
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

    # Comparar resumen_all contra backup local
    resumen_all_backup = resumen_all.with_name("resumen_all_backup.csv")
    has_new_rows = True
    if resumen_all_backup.exists():
        try:
            prev_rows = load_resumen_rows(resumen_all_backup)
            new_rows = load_resumen_rows(resumen_all)
            has_new_rows = len(new_rows - prev_rows) > 0
        except Exception:
            has_new_rows = True

    # Actualizar backup siempre
    try:
        shutil.copy2(resumen_all, resumen_all_backup)
    except Exception as exc:
        print(f"[WARN] No se pudo actualizar backup: {exc}")

    if not has_new_rows:
        print("resumen_all.csv sin nuevas lineas respecto al backup; NO se crea un nuevo registro.")
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
