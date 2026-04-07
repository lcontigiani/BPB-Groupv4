import argparse
import json
import logging
import re
from pathlib import Path
from typing import Dict, List, Tuple, Optional

import csv
import yaml

import step3_prepare_outputs as s3  # reutilizamos funciones existentes
from automation import export_auxiliar_csvs, find_best_aux_match


def load_config(path: Path) -> Dict:
    raw = yaml.safe_load(path.read_text(encoding="utf-8")) or {}
    base = path.parent

    def resolve(p: Optional[str]) -> Optional[Path]:
        if not p:
            return None
        pth = Path(p)
        if not pth.is_absolute():
            pth = base / pth
        return pth

    return {
        "registros_root": resolve(raw.get("registros_root_dir") or raw.get("register_root_dir") or r"\\192.168.0.55\utn\REGISTROS"),
        "aux_indices_dir": resolve(raw.get("aux_indices_dir") or r"\\192.168.0.13\lcontigiani\Oficina Tecnica\Registro de Control de Producto\Auxiliares\indices_auxiliar"),
        "register_password": raw.get("register_password", "bpb"),
        "fabricas_csv": resolve(raw.get("fabricas_csv") or r"\\192.168.0.13\lcontigiani\Oficina Tecnica\Registro de Control de Producto\Auxiliares\Fabricas\Listado Maestro de Codificacion Fabricas.csv"),
        "log_file": resolve(raw.get("logging", {}).get("file", "step3.log")),
        "log_level": str(raw.get("logging", {}).get("level", "INFO")).upper(),
    }


def load_factory_map(path: Path) -> Dict[str, str]:
    mapping: Dict[str, str] = {}
    if not path or not path.exists():
        return mapping
    try:
        with open(path, newline="", encoding="utf-8") as f:
            reader = csv.reader(f, delimiter=";")
            for row in reader:
                if len(row) >= 2:
                    key = str(row[0]).strip()
                    val = str(row[1]).strip()
                    if key:
                        mapping[key] = val
    except Exception as exc:
        logging.warning("No se pudo leer fabricas_csv %s: %s", path, exc)
    return mapping


def build_match_name(product_code: str, data: Dict, factory_map: Dict[str, str]) -> str:
    prov = str(data.get("proveedor") or "").strip()
    fac = factory_map.get(prov)
    return f"{product_code} - {fac}" if fac else product_code


def process_pdf(pdf: Path, cfg: Dict, factory_map: Dict[str, str], registros_root: Path, aux_rows: List[List[str]], json_dir: Path) -> None:
    # producto desde nombre de archivo
    prod_guess = s3.product_from_filename(pdf.stem)
    product_code = prod_guess or pdf.stem

    data = s3.load_existing_notes(pdf)
    regen = False
    if not data:
        data = s3.extract_notes_with_gemini(pdf)
        regen = True
    if not data:
        logging.warning("Sin datos para %s", pdf)
        return
    dims = s3.normalize_dimensions(data.get("dimensions") or {})
    data["dimensions"] = dims
    if "retainer" in data and isinstance(data["retainer"], dict):
        mat = data["retainer"].get("material")
        if mat:
            data["retainer"]["material"] = s3.normalize_retainer(mat)
    raw_code = data.get("code") or ""
    m_code = re.match(r"^(\d{3})[- ]?(.*)$", str(raw_code).strip())
    if m_code:
        data["proveedor"] = m_code.group(1)
        data["code"] = m_code.group(2)
    match_target = build_match_name(product_code, data, factory_map)
    prod_type = s3.detect_product_type(match_target, registros_root)
    file_name, match_val, score = find_best_aux_match(match_target, registros_root, password=cfg.get("register_password", "bpb"))

    json_dir.mkdir(parents=True, exist_ok=True)
    json_base = json_dir / f"{pdf.stem}_notes_extracted_gemini.json"
    json_path = s3.next_rev_path(json_base) if json_base.exists() else json_base
    json_path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")

    aux_rows.append([product_code, match_target, file_name, match_val, f"{score:.3f}", prod_type])
    logging.info("Generado json para %s (regen=%s, tipo=%s)", pdf.name, regen, prod_type)


def main():
    parser = argparse.ArgumentParser(description="Prueba individual: genera json y aux_matches desde Codigos/Pruebas.")
    parser.add_argument("--config", default="config.yaml", help="Ruta al config.yaml")
    args = parser.parse_args()

    cfg = load_config(Path(args.config).expanduser())
    logging.basicConfig(level=getattr(logging, cfg["log_level"], logging.INFO), format="%(asctime)s [%(levelname)s] %(message)s")

    base_dir = Path(__file__).parent
    pruebas_dir = base_dir / "Pruebas"
    json_dir = pruebas_dir / "json"
    aux_csv_dir = pruebas_dir / "csv_Auxiliar"
    aux_csv_dir.mkdir(parents=True, exist_ok=True)

    registros_root = cfg["registros_root"]
    # exportar Auxiliar (por si hace falta snapshot)
    try:
        export_auxiliar_csvs(registros_root, cfg.get("aux_indices_dir"), password=cfg.get("register_password", "bpb"))
    except Exception as exc:
        logging.warning("No se pudo exportar auxiliares en prueba: %s", exc)

    factory_map = load_factory_map(cfg.get("fabricas_csv"))

    pdfs = [p for p in pruebas_dir.iterdir() if p.suffix.lower() == ".pdf"]
    if not pdfs:
        logging.error("No hay PDFs en %s", pruebas_dir)
        return

    aux_rows: List[List[str]] = []
    for pdf in pdfs:
        process_pdf(pdf, cfg, factory_map, registros_root, aux_rows, json_dir)

    if aux_rows:
        out_matches = aux_csv_dir / "aux_matches.csv"
        with open(out_matches, "w", newline="", encoding="utf-8") as f:
            w = csv.writer(f, delimiter=";")
            w.writerow(["Codigo", "Match_Target", "Archivo_Auxiliar", "Coincidencia", "Score", "Tipo"])
            for r in aux_rows:
                w.writerow(r)
        logging.info("aux_matches.csv generado en %s", out_matches)
    else:
        logging.warning("No se generaron filas en aux_matches.")


if __name__ == "__main__":
    main()
