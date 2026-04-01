import argparse
import difflib
import io
from pathlib import Path
from typing import Dict, Iterable, List, Tuple

import msoffcrypto
import pandas as pd


BASE_DIR = Path(__file__).resolve().parent
REGISTROS_DIR = BASE_DIR / "R016-01"
FABRICAS_CSV = BASE_DIR / "Fabricas" / "Listado Maestro de Codificacion Fabricas.csv"
DEFAULT_PASSWORD = "bpb"


def load_fabricas_map(path: Path) -> Dict[str, str]:
    """Return factory code -> suffix map (e.g., '195' -> 'HLBR')."""
    mapping: Dict[str, str] = {}
    for line in path.read_text(encoding="utf-8").splitlines():
        if ";" not in line:
            continue
        code, name = line.split(";", 1)
        mapping[code.strip()] = name.strip()
    return mapping


def suffix_from_po_code(po_code: str, fabricas: Dict[str, str]) -> str:
    """Extract numeric prefix before '-' and map to factory suffix."""
    prefix = po_code.split("-", 1)[0].strip()
    return fabricas.get(prefix, "")


def generate_candidates(base_code: str, suffix: str) -> List[str]:
    """Generate candidate strings with suffix and common normalizations."""
    base = base_code.upper().strip()
    suffix = suffix.upper().strip()
    candidates = set()

    def add(s: str):
        candidates.add(s.replace(" ", ""))

    if suffix:
        if base.endswith(f"-{suffix}"):
            add(base)
        else:
            add(f"{base}-{suffix}")
    add(base)
    # Handle potential O/0 swaps
    add(base.replace("O", "0"))
    add(base.replace("0", "O"))
    if suffix:
        add(f"{base.replace('O', '0')}-{suffix}")
        add(f"{base.replace('0', 'O')}-{suffix}")

    # Remove hyphens for a loose variant
    for c in list(candidates):
        add(c.replace("-", ""))
    return list(candidates)


def normalize_no_suffix(base_code: str) -> List[str]:
    """Variants sin sufijo (para detectar coincidencia de familia)."""
    base = base_code.upper().strip()
    cands = set([base, base.replace("O", "0"), base.replace("0", "O")])
    for c in list(cands):
        cands.add(c.replace("-", ""))
    return list(cands)


def build_core_variants(base_code: str, suffix: str) -> List[str]:
    """
    Devuelve partes nucleares del código (sin prefijo B&P/BPB ni sufijo de fábrica).
    Sirve para dar bonus si aparece como subcadena, evitando penalizar prefijos tipo 040-.
    """
    code = base_code.upper().strip()
    for pref in ("B&P-", "BPB-"):
        if code.startswith(pref):
            code = code[len(pref) :]
            break
    suf = suffix.upper().strip()
    cores = set()
    cores.add(code)
    if suf and code.endswith(suf):
        cores.add(code[: -len(suf)].rstrip("-"))
    # variantes sin guiones
    for c in list(cores):
        cores.add(c.replace("-", ""))
    return list(cores)


def best_match_in_series(
    series: pd.Series,
    targets_suffix: Iterable[str],
    targets_base: Iterable[str],
    cores: Iterable[str],
) -> Tuple[float, str, int, str, int]:
    """
    Return best match in series.
    Outputs: (score, value, row_number, kind, next_empty_row)
    kind: 'suffix' if matched a suffix target, 'base' if matched base-only, 'none' otherwise.
    next_empty_row: first empty row after last non-empty cell in the series (1-based).
    """
    best_score = -1.0
    best_val = ""
    best_row = -1
    best_kind = "none"
    last_nonempty_idx = -1

    for idx, raw in series.items():
        if pd.isna(raw):
            continue
        last_nonempty_idx = max(last_nonempty_idx, idx)
        val_norm = str(raw).strip().upper().replace(" ", "")

        # bonus si es exactamente B&P (no BPB)
        prefix_bonus = 0.05 if val_norm.startswith("B&P") else 0.0

        # bonus por contener el núcleo (sin prefijo ni sufijo), para no castigar prefijos 040-/042-
        core_bonus = 0.0
        for core in cores:
            if core and core in val_norm:
                core_bonus = max(core_bonus, 0.2)

        def check_targets(targets, kind):
            nonlocal best_score, best_val, best_row, best_kind
            for target in targets:
                score = difflib.SequenceMatcher(None, target, val_norm).ratio()
                if target == val_norm:
                    score += 1.0  # exact bonus
                score += prefix_bonus + core_bonus
                if score > best_score:
                    best_score = score
                    best_val = str(raw).strip()
                    best_row = int(idx) + 1  # pandas index -> Excel row
                    best_kind = kind

        check_targets(targets_suffix, "suffix")
        check_targets(targets_base, "base")

    next_empty_row = (last_nonempty_idx + 2) if last_nonempty_idx >= 0 else 1
    return best_score, best_val, best_row, best_kind, next_empty_row


def read_workbook(path: Path):
    """Read all sheets column B (index 1). Tries openpyxl, xlrd, and password unlock."""
    suffix = path.suffix.lower()
    is_xlsx = suffix in [".xlsx", ".xlsm"]
    primary_engine = "openpyxl" if is_xlsx else "xlrd"
    secondary_engine = "xlrd" if is_xlsx else "openpyxl"

    def read(target):
        return pd.read_excel(
            target, sheet_name=None, usecols=[1], header=None, engine=primary_engine
        )

    def read_secondary(target):
        return pd.read_excel(
            target, sheet_name=None, usecols=[1], header=None, engine=secondary_engine
        )

    try:
        return read(path)
    except Exception:
        try:
            return read_secondary(path)
        except Exception:
            # try decrypt with password
            bio = io.BytesIO()
            with open(path, "rb") as f:
                office_file = msoffcrypto.OfficeFile(f)
                office_file.load_key(password=DEFAULT_PASSWORD)
                office_file.decrypt(bio)
            bio.seek(0)
            try:
                return read(bio)
            except Exception:
                return read_secondary(bio)


def search_product(base_code: str, po_code: str, top: int = 5):
    fabricas = load_fabricas_map(FABRICAS_CSV)
    suffix = suffix_from_po_code(po_code, fabricas)
    candidates_with_suffix = generate_candidates(base_code, suffix)
    candidates_base_only = normalize_no_suffix(base_code)
    cores = build_core_variants(base_code, suffix)

    results = []
    for wb_path in sorted(REGISTROS_DIR.glob("R016-01*.xls*")):
        try:
            sheets = read_workbook(wb_path)
            for sheet_name, df in sheets.items():
                score, val, row_no, kind, next_empty = best_match_in_series(
                    df.iloc[:, 0], candidates_with_suffix, candidates_base_only, cores
                )
                results.append(
                    {
                        "score": score,
                        "file": wb_path.name,
                        "sheet": sheet_name,
                        "row": row_no,
                        "value": val,
                        "suffix": suffix,
                        "kind": kind,
                        "next_empty_row": next_empty,
                    }
                )
        except Exception as e:
            results.append(
                {
                    "score": -1,
                    "file": wb_path.name,
                    "sheet": "ERROR",
                    "row": -1,
                    "value": str(e),
                    "suffix": suffix,
                    "kind": "error",
                    "next_empty_row": -1,
                }
            )
    results.sort(key=lambda x: x["score"], reverse=True)
    return results[:top], suffix, candidates_with_suffix, candidates_base_only


def main():
    parser = argparse.ArgumentParser(description="Buscar producto en registros R016-01 (columna B).")
    parser.add_argument("--product", required=True, help="Código base del producto, ej. B&P-040-51310")
    parser.add_argument("--po-code", required=True, help="Código del PDF, ej. 195-51310 (prefijo es la fábrica)")
    parser.add_argument("--top", type=int, default=5, help="Cantidad de resultados a mostrar")
    args = parser.parse_args()

    top_results, suffix, cand_with, cand_base = search_product(args.product, args.po_code, args.top)

    print(f"Producto base: {args.product}")
    print(f"PO code: {args.po_code} -> sufijo fábrica: {suffix}")
    print(f"Candidatos con sufijo: {cand_with}")
    print(f"Candidatos base (sin sufijo): {cand_base}")
    print(f"Cores (bonus substrings): {build_core_variants(args.product, suffix)}")
    print("\nMejores coincidencias:")
    for r in top_results:
        print(
            f"{r['score']:.3f} | {r['file']} | hoja={r['sheet']} | fila={r['row']} | kind={r['kind']} | next_empty={r['next_empty_row']} | valor='{r['value']}'"
        )


if __name__ == "__main__":
    main()
