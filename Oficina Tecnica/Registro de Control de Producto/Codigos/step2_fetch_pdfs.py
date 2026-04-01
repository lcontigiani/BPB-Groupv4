import argparse
import logging
import os
import re
import shutil
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
from typing import Dict, List, Optional, Set, Tuple

import csv
import yaml


def load_config(path: Path) -> Dict:
    path = path.expanduser().resolve()
    raw = yaml.safe_load(path.read_text(encoding="utf-8")) or {}
    
    # Determine Root Directory
    # Prefer env root only if it resolves processed_dir correctly; otherwise fallback to config location.
    env_root = os.environ.get("BPB_BASE_DIR")
    config_root = path.parent.parent
    root = config_root
    if env_root:
        try:
            env_path = Path(env_root)
            if env_path.exists():
                pd = raw.get("processed_dir") or raw.get("in process_dir")
                if pd:
                    pd_path = Path(pd)
                    if pd_path.is_absolute() or (env_path / pd_path).exists():
                        root = env_path
                else:
                    root = env_path
        except Exception:
            root = config_root
    
    def resolve(p: Optional[str]) -> Optional[Path]:
        if not p:
            return None
        pth = Path(p)
        if not pth.is_absolute():
            pth = root / pth
        return pth

    return {
        "processed_dir": resolve(raw.get("processed_dir") or raw.get("in process_dir")),
        "output_root": resolve(raw.get("output_root")),
        "product_pdf_dir": resolve(raw.get("product_pdf_dir")),
        "log_file": resolve(raw.get("logging", {}).get("file", "step2.log")),
        "log_level": str(raw.get("logging", {}).get("level", "INFO")).upper(),
    }


def setup_logging(log_file: Path, level: str) -> None:
    log_file.parent.mkdir(parents=True, exist_ok=True)
    logging.basicConfig(
        level=getattr(logging, level, logging.INFO),
        format="%(asctime)s [%(levelname)s] %(message)s",
        handlers=[logging.FileHandler(log_file, encoding="utf-8"), logging.StreamHandler()],
    )


def all_registro_dirs(processed_dir: Path) -> List[Path]:
    return [p for p in processed_dir.iterdir() if p.is_dir() and "Registro - R" in p.name]


def read_search_keys_from_csv(csv_path: Path) -> List[str]:
    """
    Devuelve lista única de claves de búsqueda:
    - Si 'Observac_PO' trae número, usar ese.
    - Si no, usar 'PO' (número) salvo 'Sin OC' o '0'.
    """
    keys: List[str] = []
    with open(csv_path, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f, delimiter=";")
        for row in reader:
            obs = (row.get("Observac_PO") or "").strip()
            po = (row.get("PO") or "").strip()
            candidate = ""
            if obs:
                m = re.findall(r"\d+", obs)
                if m:
                    candidate = m[0]
            if not candidate:
                if po and po.lower() != "sin oc":
                    m = re.findall(r"\d+", po)
                    if m:
                        candidate = m[0]
            if candidate == "0":
                continue
            if candidate:
                keys.append(candidate)
    uniq = []
    seen = set()
    for k in keys:
        if k not in seen:
            seen.add(k)
            uniq.append(k)
    return uniq


def read_codes_from_resumen(csv_path: Path) -> List[str]:
    codes: List[str] = []
    with open(csv_path, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f, delimiter=";")
        for row in reader:
            code = (row.get("Codigo") or "").strip()
            if code:
                codes.append(code)
    return codes


def find_previous_codes_for_po(po: str, current_reg: Path, processed_dir: Path) -> Optional[List[str]]:
    """
    Busca en registros previos (processed_dir) un resumen que contenga la PO.
    Devuelve la lista de códigos (col A) de ese resumen o None si no se encuentra.
    """

    def seq(p: Path) -> int:
        m = re.search(r"R(\d{4})", p.name)
        return int(m.group(1)) if m else -1

    regs = [p for p in processed_dir.iterdir() if p.is_dir() and "Registro - R" in p.name]
    regs.sort(key=seq, reverse=True)
    for reg in regs:
        if reg == current_reg:
            continue
        res = reg / "resumen.csv"
        if not res.exists():
            continue
        try:
            with open(res, newline="", encoding="utf-8") as f:
                reader = csv.DictReader(f, delimiter=";")
                rows = list(reader)
        except Exception:
            continue
        found = False
        for row in rows:
            obs = (row.get("Observac_PO") or "").strip()
            po_col = (row.get("PO") or "").strip()
            nums = re.findall(r"\d+", obs) if obs else []
            if not nums and po_col and po_col.lower() != "sin oc":
                nums = re.findall(r"\d+", po_col)
            if any(n == po for n in nums):
                found = True
                break
        if found:
            codes = [(r.get("Codigo") or "").strip() for r in rows if (r.get("Codigo") or "").strip()]
            return codes
    return None


def parse_revision(path: Path) -> Tuple[str, int]:
    """
    Devuelve clave de comparacion (basename sin rev, rev_index)
    Rev.0 si no hay A/B/C...; A=1, B=2...
    """
    name = path.stem.upper()
    rev_idx = 0
    m = re.search(r"\s*REV[ ._-]?([A-Z])", name)
    if m:
        rev_idx = ord(m.group(1)) - ord("A") + 1
    base = re.sub(r"\s*REV[ ._-]?[A-Z]", "", name)
    base = re.sub(r"[\s._-]+$", "", base)  # eliminar separadores finales
    return base, rev_idx


def pick_latest_by_revision(paths: List[Path]) -> List[Path]:
    best: Dict[str, Tuple[int, Path]] = {}
    for p in paths:
        base, rev = parse_revision(p)
        cur = best.get(base)
        if cur is None or rev > cur[0]:
            best[base] = (rev, p)
    return [v[1] for v in best.values()]


import subprocess

def find_pdfs_for_targets(root: Path, target_pos: List[str]) -> Dict[str, List[Path]]:
    """
    OPTIMIZADO: Escanea el directorio UNA SOLA VEZ y construye un índice en memoria.
    Se eliminó la búsqueda CMD por inconsistencia en resultados (patrones limitados).
    Ahora usamos siempre el escaneo completo en memoria que garantiza regex robusto (PO...1234).
    """
    target_set = set(target_pos)
    if not target_set:
        return {}
    
    logging.info(f"Modo 'Batch Scan' activado (Indexado Único) para {len(target_set)} POs...")
    logging.info(f"Escaneando directorio de PDFs: {root}")
    
    po_index: Dict[str, List[Path]] = {}
    
    try:
        count = 0
        regex_po = re.compile(r"PO\s*[-_.]?\s*(\d+)", re.IGNORECASE)
        
        for path in root.rglob("*.pdf"):
            if not path.is_file(): continue
            count += 1
            matches = regex_po.findall(path.name)
            for po_num in matches:
                if po_num in target_set:
                    if po_num not in po_index: po_index[po_num] = []
                    po_index[po_num].append(path)
                    
        logging.info(f"Escaneo completado. {count} PDFs analizados.")
        
    except Exception as e:
        logging.error(f"Error Batch Scan: {e}")
        return {}
    
    final_results: Dict[str, List[Path]] = {}
    
    for po in target_set:
        paths = po_index.get(po, [])
        if paths:
            # Restauramos filtro de revisión (correcto)
            reduced_paths = pick_latest_by_revision(paths)
            final_results[po] = reduced_paths
            logging.info(f"PO {po}: Seleccionados {len(reduced_paths)} archivos (de {len(paths)} candidatos).")
            
    return final_results

def latest_registro_dir(processed_dir: Path) -> Path:
    dirs = [p for p in processed_dir.iterdir() if p.is_dir() and "Registro - R" in p.name]
    if not dirs:
        raise FileNotFoundError("No se encontraron carpetas 'Registro - Rxxxx - fecha' en processed_dir.")

    def seq(p: Path) -> int:
        m = re.search(r"R(\d{4})", p.name)
        return int(m.group(1)) if m else -1

    dirs.sort(key=seq, reverse=True)
    return dirs[0]


def main():
    parser = argparse.ArgumentParser(description="Paso 2: traer PDFs por PO comparando resúmenes.")
    parser.add_argument("--config", default="config.yaml", help="Ruta al config.yaml")
    parser.add_argument("--registro", default=None, help="Nombre o ruta del registro a procesar")
    args = parser.parse_args()

    cfg = load_config(Path(args.config).expanduser())
    setup_logging(cfg["log_file"], cfg["log_level"])

    processed_dir = cfg["processed_dir"]
    output_root = cfg["output_root"]
    product_pdf_dir = cfg["product_pdf_dir"]
    if not processed_dir or not processed_dir.exists():
        raise FileNotFoundError("processed_dir no encontrado en config.")
    if not output_root:
        raise FileNotFoundError("output_root no definido en config.")
    if not product_pdf_dir or not product_pdf_dir.exists():
        raise FileNotFoundError("product_pdf_dir no existe.")

    # Si se especifica un registro, usalo; si no, procesamos el ULTIMO registro
    if args.registro:
        reg_dir = Path(args.registro)
        if not reg_dir.is_absolute():
            reg_dir = processed_dir / args.registro
        if not reg_dir.exists():
            raise FileNotFoundError(f"Registro no existe: {reg_dir}")
    else:
        reg_dir = latest_registro_dir(processed_dir)
    csv_path = reg_dir / "resumen.csv"
    if not csv_path.exists():
        raise FileNotFoundError(f"No existe resumen.csv en {reg_dir}")

    keys = read_search_keys_from_csv(csv_path)
    current_codes = read_codes_from_resumen(csv_path)

    logging.info("Procesando ÚLTIMO REGISTRO: %s", reg_dir.name)
    logging.info("Claves de búsqueda: %s", len(keys))

    en_progreso_dir = output_root / "Entrantes"
    procesado_dir = output_root / "Procesado"
    
    # LIMPIEZA INICIAL DE ENTRANTES
    # Garantiza que Step 3 solo vea lo que corresponde a este lote
    if en_progreso_dir.exists():
        try:
            shutil.rmtree(en_progreso_dir)
            logging.info("Carpeta 'Entrantes' limpiada.")
        except Exception as e:
            logging.warning("No se pudo limpiar Entrantes: %s", e)
            
    en_progreso_dir.mkdir(parents=True, exist_ok=True)
    procesado_dir.mkdir(parents=True, exist_ok=True)


    # Búsqueda dirigida de PDFs por PO (mucho más rápido que indexar todo)
    logging.info("Buscando PDFs para %d POs en %s ...", len(keys), product_pdf_dir)
    pdf_index = find_pdfs_for_targets(product_pdf_dir, keys)
    logging.info("Búsqueda completada. POs encontradas: %s", len(pdf_index))

    def process_po(po: str):
        dest_po_dir = en_progreso_dir / f"PO{po}"

        proc_po_dir = procesado_dir / f"PO{po}"
        # Si ya está procesado y no está en Entrantes, quizás no necesitamos descargarlo de nuevo para Step 3?
        # El usuario quiere que lo que esté en el registro se procese.
        # Si ya está en Procesado, Step 3 no lo verá a menos que lo copiemos a Entrantes.
        # Si copiamos a Entrantes, Step 3 lo procesará nuevamente y moverá a En Progreso.
        # Esto podría duplicar trabajo si ya existe en En Progreso.
        # Pero asumimos flow idempotente.

        pdfs = pdf_index.get(po, [])
        if not pdfs:
            logging.warning("No se encontraron PDFs para PO %s", po)
            return f"{po}: sin PDFs"
        
        dest_po_dir.mkdir(parents=True, exist_ok=True)
        copied = 0
        for p in pdfs:
            dest = dest_po_dir / p.name
            try:
                shutil.copy2(p, dest)
                copied += 1
            except Exception as exc:
                logging.warning("No se pudo copiar %s: %s", p, exc)
        if copied > 0:
            return f"{po}: copiados {copied}"
        else:
            return f"{po}: verificada (sin nuevos)"

    results: List[str] = []
    with ThreadPoolExecutor(max_workers=8) as executor:
        future_map = {executor.submit(process_po, po): po for po in keys}
        for fut in as_completed(future_map):
            res = fut.result()
            if res:
                results.append(res)
    logging.info("Resumen paso 2: %s", "; ".join(results))


if __name__ == "__main__":
    main()
