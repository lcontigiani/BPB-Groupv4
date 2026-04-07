import argparse
import json
import logging
import re
import io
from pathlib import Path
from typing import Dict, List, Optional

import csv
from PIL import Image

import extract_to_csv
import extract_to_csv_bolas_fixed
from step3_prepare_outputs import normalize_dimensions, normalize_retainer

try:
    import pypdfium2 as pdfium
except ImportError:
    pdfium = None

try:
    import pdfplumber
except ImportError:
    pdfplumber = None


def ensure_dir(p: Path) -> None:
    p.mkdir(parents=True, exist_ok=True)


def norm_str(s: str) -> str:
    return re.sub(r"[^A-Z0-9]", "", s.upper())


def extract_product_key_from_pdf_name(name: str) -> str:
    stem = Path(name).stem
    # Tomar lo que está entre el primer "-" y el segmento "-rev" (normalizado)
    m = re.search(r"-\s*(.+?)\s*[-_ ]?rev\b", stem, flags=re.I)
    if m:
        return m.group(1).strip(" -_")
    # Fallback: quitar prefijo PO\d+- y devolver el resto sin espacios
    cleaned = re.sub(r"^PO\d+\s*[-_ ]\s*", "", stem, flags=re.I)
    return cleaned.strip(" -_")


def pick_latest_json_for_pdf(pdf: Path, json_dir: Path) -> Optional[Path]:
    prefix = f"{pdf.stem}_notes_extracted_gemini"
    best_path = None
    best_rank = -1
    pattern = re.compile(rf"^{re.escape(prefix)}(?: - Rev\\.([A-Za-z0-9]+))?\\.json$", re.I)
    for cand in json_dir.glob(f"{prefix}*.json"):
        m = pattern.match(cand.name)
        if not m:
            continue
        rev = m.group(1)
        if rev is None:
            rank = 0
        elif len(rev) == 1 and rev.isalpha():
            rank = ord(rev.upper()) - ord("A") + 1
        else:
            try:
                rank = int(rev)
            except Exception:
                rank = 1
        if rank > best_rank:
            best_rank = rank
            best_path = cand
    return best_path


def load_aux_matches(aux_csv_dir: Path) -> List[Dict[str, str]]:
    rows: List[Dict[str, str]] = []
    path = aux_csv_dir / "aux_matches.csv"
    if not path.exists():
        return rows
    with open(path, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f, delimiter=";")
        for r in reader:
            rows.append(r)
    return rows


def best_aux_row(target: str, rows: List[Dict[str, str]]) -> Optional[Dict[str, str]]:
    t_norm = norm_str(target)
    best = None
    best_score = -1.0
    for r in rows:
        code = r.get("Codigo") or ""
        c_norm = norm_str(code)
        if not c_norm:
            continue
        contain = t_norm in c_norm or c_norm in t_norm
        try:
            import difflib

            ratio = difflib.SequenceMatcher(None, t_norm, c_norm).ratio()
        except Exception:
            ratio = 0.0
        score = ratio + (0.5 if contain else 0.0)
        if score > best_score:
            best_score = score
            best = r
    return best


def infer_type_from_aux_name(name: str) -> str:
    s = (name or "").lower()
    # Mapeo específico por nombre de archivo auxiliar
    if "inspeccion de especiales" in s:
        return "Especial"
    if "inspeccion rod. autocentrantes" in s:
        return "Autocentrante"
    if "inspeccion rod. agricola" in s:
        return "Agricola"
    if "inspeccion rod. de bolas" in s:
        return "Bolas"
    if "inspeccion rod. de rodillo" in s:
        return "Rodillo"
    # fallback por palabra clave
    if "bol" in s:
        return "Bolas"
    if "rod" in s:
        return "Rodillo"
    if "esp" in s:
        return "Especial"
    return "desconocido"


def generate_csv_from_json(product_code: str, data: Dict, tipo: str, out_path: Path) -> None:
    if tipo == "bolas":
        row = extract_to_csv_bolas_fixed.build_row(product_code, data)
        extract_to_csv_bolas_fixed.write_csv(out_path, row)
    else:
        row = extract_to_csv.extract_row(product_code, data)
        extract_to_csv.write_csv(out_path, row)


def load_factory_map(path: Optional[Path]) -> Dict[str, str]:
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
    except Exception:
        pass
    return mapping


def build_match_name(product_code: str, data: Dict, factory_map: Dict[str, str]) -> str:
    prov = str(data.get("proveedor") or "").strip()
    fac = factory_map.get(prov)
    return f"{product_code} - {fac}" if fac else product_code


def find_best_aux_match_csv(target: str, indices_dir: Path) -> tuple:
    """
    Busca coincidencia en los CSV de indices_auxiliar (columna B).
    Retorna (archivo_csv, valor, score)
    """
    if not indices_dir or not indices_dir.exists():
        return "", "", 0.0
    t_norm = norm_str(target)
    best_score = 0.0
    best_val = ""
    best_file = ""
    for csv_path in indices_dir.glob("*.csv"):
        try:
            with open(csv_path, newline="", encoding="utf-8", errors="ignore") as f:
                reader = csv.reader(f, delimiter=";")
                header_skipped = False
                for row in reader:
                    # Saltar cabecera
                    if not header_skipped:
                        header_skipped = True
                        # si la cabecera tiene menos de 2 col, igual seguimos; se valida len más abajo
                    if len(row) < 2:
                        continue
                    if len(row) < 2:
                        continue
                    val = row[1]
                    v_norm = norm_str(str(val))
                    if not v_norm:
                        continue
                    try:
                        import difflib

                        ratio = difflib.SequenceMatcher(None, t_norm, v_norm).ratio()
                    except Exception:
                        ratio = 0.0
                    contain = t_norm in v_norm or v_norm in t_norm
                    bonus = 0.5 if contain else 0.0
                    if "especial" in csv_path.name.lower():
                        bonus += 0.05
                    score = ratio + bonus
                    if score > best_score:
                        best_score = score
                        best_val = str(val)
                        best_file = csv_path.name
        except Exception:
            continue
    return best_file, best_val, best_score


def render_first_page_png_any(path: Path) -> Optional[bytes]:
    suf = path.suffix.lower()
    if suf in {".png", ".jpg", ".jpeg", ".tif", ".tiff"}:
        try:
            img = Image.open(path).convert("RGB")
            buf = io.BytesIO()
            img.save(buf, format="PNG")
            return buf.getvalue()
        except Exception:
            return None
    if pdfium is None:
        return None
    try:
        doc = pdfium.PdfDocument(path)
        if len(doc) == 0:
            return None
        page = doc[0]
        bitmap = page.render(scale=3.0)
        img = bitmap.to_pil()
        buf = io.BytesIO()
        img.save(buf, format="PNG")
        doc.close()
        return buf.getvalue()
    except Exception as exc:
        logging.warning("pdfium no pudo renderizar %s: %s", path, exc)
        # Fallback con pdfplumber si está disponible
        if pdfplumber is not None:
            try:
                with pdfplumber.open(path) as pdfp:
                    if not pdfp.pages:
                        return None
                    img = pdfp.pages[0].to_image(resolution=300).original.convert("RGB")
                    buf = io.BytesIO()
                    img.save(buf, format="PNG")
                    return buf.getvalue()
            except Exception as exc2:
                logging.warning("pdfplumber tampoco pudo renderizar %s: %s", path, exc2)
        return None


def extract_text_first_page(path: Path) -> str:
    if pdfplumber is None or path.suffix.lower() not in {".pdf"}:
        return ""
    try:
        with pdfplumber.open(path) as pdfp:
            if not pdfp.pages:
                return ""
            return pdfp.pages[0].extract_text() or ""
    except Exception:
        return ""


def call_gemini(img_bytes: bytes, text_first: str) -> Dict:
    from base64 import b64encode
    import requests

    api_key_path = Path(__file__).parent / "gemini.key"
    if api_key_path.exists():
        api_key = api_key_path.read_text(encoding="utf-8").strip()
    else:
        alt = Path(__file__).parent / "gemini.key.txt"
        api_key = alt.read_text(encoding="utf-8").strip() if alt.exists() else None
    if not api_key:
        raise FileNotFoundError("GEMINI_API_KEY no disponible")

    prompt = (
        "Eres un extractor técnico de planos de rodamientos. Devuelve SOLO JSON plano (sin markdown) con EXACTAMENTE estos campos y estructura (igual al ejemplo existente):\n"
        "{\n"
        "  \"purchase_order\": \"<numero OC si aparece>\",\n"
        "  \"code\": \"<codigo exacto del campo Código/Code del rotulo, incluyendo prefijo numérico ej 100-SAB211-55DG>\",\n"
        "  \"proveedor\": \"<3 primeros dígitos del code, antes del guion>\",\n"
        "  \"revision\": \"<letra o 0>\",\n"
        "  \"date\": \"dd/mm/yyyy\",\n"
        "  \"dimensions\": {\n"
        "     \"thickness\": {\"value_mm\": number, \"tol_plus_mm\": number, \"tol_minus_mm\": number},\n"
        "     \"outer_thickness\": {\"value_mm\": number, \"tol_plus_mm\": number, \"tol_minus_mm\": number},\n"
        "     \"inner_thickness\": {\"value_mm\": number, \"tol_plus_mm\": number, \"tol_minus_mm\": number},\n"
        "     \"outer_dia\": {\"value_mm\": number, \"tol_plus_mm\": number, \"tol_minus_mm\": number},\n"
        "     \"inner_dia\": {\"value_mm\": number, \"tol_plus_mm\": number, \"tol_minus_mm\": number}\n"
        "  },\n"
        "  \"radial_clearance\": {\"class\": \"C3\" u otra, \"range_um\": {\"min\": number, \"max\": number}},\n"
        "  \"axial_clearance\": null o {\"range_um\": {\"min\": number, \"max\": number}},\n"
        "  \"hardness_hrc\": {\"inner_plus\": number, \"inner_minus\": number, \"outer_plus\": number, \"outer_minus\": number},\n"
        "  \"seal_torque\": {\"low_Nm\": number, \"high_Nm\": number},\n"
        "  \"lubricant\": {\"type\": \"texto\", \"fill\": \"texto\"},\n"
        "  \"retainer\": {\"material\": \"Steel/Brass/...\"},\n"
        "  \"revision_history\": [{\"rev\":\"A/B/C...\", \"date\":\"dd/mm/yyyy\", \"by\":\"\"}, ...]\n"
        "}\n"
        "Reglas clave: usa mm con signo; si falta dato null; no inventes; usa última revisión/fecha disponible; asegúrate de incluir 'proveedor' = 3 primeros dígitos del code."
    )

    parts = [{"text": prompt}, {"inline_data": {"mime_type": "image/png", "data": b64encode(img_bytes).decode()}}]
    if text_first:
        parts.append({"text": f"TEXTO_PDFPLUMBER:\n{text_first[:6000]}"})

    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={api_key}"
    resp = requests.post(url, json={"contents": [{"parts": parts}]}, timeout=150)
    resp.raise_for_status()
    data_resp = resp.json()
    text_resp = data_resp["candidates"][0]["content"]["parts"][0]["text"]
    m = re.search(r"\{.*\}", text_resp, re.S)
    return json.loads(m.group(0)) if m else json.loads(text_resp)


def main():
    ap = argparse.ArgumentParser(description="Prueba: generar json + aux_matches + csv para un PDF en carpeta Pruebas.")
    ap.add_argument("--pdf", help="Ruta al PDF o imagen de prueba (dentro de Codigos/Pruebas). Si se omite, se usa el primer .pdf/.png/.jpg en Pruebas.")
    ap.add_argument("--aux-indices-dir", default=r"\\192.168.0.13\lcontigiani\Oficina Tecnica\Registro de Control de Producto\Auxiliares\indices_auxiliar", help="Ruta a indices_auxiliar (CSVs exportados)")
    ap.add_argument("--fabricas-csv", default=r"\\192.168.0.13\lcontigiani\Oficina Tecnica\Registro de Control de Producto\Auxiliares\Fabricas\Listado Maestro de Codificacion Fabricas.csv", help="CSV maestro de fabricas")
    args = ap.parse_args()

    if args.pdf:
        pdf = Path(args.pdf)
    else:
        base = Path(__file__).parent / "Pruebas"
        candidates = list(base.glob("*.pdf")) + list(base.glob("*.png")) + list(base.glob("*.jpg")) + list(base.glob("*.jpeg"))
        if not candidates:
            raise FileNotFoundError("No se encontró ningún PDF/imagen en la carpeta Pruebas.")
        pdf = candidates[0]
        logging.warning("Usando archivo detectado automáticamente: %s", pdf)
    base_dir = pdf.parent
    json_dir = base_dir / "json"
    aux_csv_dir = base_dir / "csv_Auxiliar"
    out_csv_dir = base_dir / "csv"
    ensure_dir(json_dir)
    ensure_dir(aux_csv_dir)
    ensure_dir(out_csv_dir)

    logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")

    # Obtener/generar JSON
    json_path = pick_latest_json_for_pdf(pdf, json_dir)
    if not json_path or not json_path.exists():
        img_bytes = render_first_page_png_any(pdf)
        if not img_bytes:
            raise FileNotFoundError(f"No se pudo generar imagen para {pdf.name}")
        text_first = extract_text_first_page(pdf)
        data = call_gemini(img_bytes, text_first)
        data["dimensions"] = normalize_dimensions(data.get("dimensions") or {})
        if "retainer" in data and isinstance(data["retainer"], dict):
            mat = data["retainer"].get("material")
            if mat:
                data["retainer"]["material"] = normalize_retainer(mat)
        # Fijar proveedor si viene embebido en code o falta
        raw_code = data.get("code") or ""
        m_code = re.match(r"^(\\d{3})[- ]?(.*)$", str(raw_code).strip())
        if m_code:
            data["proveedor"] = m_code.group(1)
            data["code"] = m_code.group(2)
        json_path = json_dir / f"{pdf.stem}_notes_extracted_gemini.json"
        json_path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
        logging.info("JSON generado con Gemini en %s", json_path)
    else:
        data = json.loads(json_path.read_text(encoding="utf-8"))
        # Separar proveedor
    raw_code = data.get("code") or ""
    m_code = re.match(r"^(\\d{3})[- ]?(.*)$", str(raw_code).strip())
    if m_code:
        data["proveedor"] = m_code.group(1)
        data["code"] = m_code.group(2)

    factory_map = load_factory_map(Path(args.fabricas_csv))
    # Usar el nombre del PDF (sin la parte de Rev) como base para el match, como en el flujo original
    product_key = extract_product_key_from_pdf_name(pdf.name)
    product_base = product_key
    match_target = build_match_name(product_base, data, factory_map)

    # aux_matches: regeneramos siempre usando indices_auxiliar (CSVs)
    out_matches = aux_csv_dir / "aux_matches.csv"
    if out_matches.exists():
        try:
            out_matches.unlink()
        except Exception:
            pass
    file_name, match_val, score = find_best_aux_match_csv(match_target, Path(args.aux_indices_dir))
    tipo_tmp = infer_type_from_aux_name(file_name)
    with open(out_matches, "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f, delimiter=";")
        w.writerow(["Codigo", "Match_Target", "Archivo_Auxiliar", "Coincidencia", "Score", "Tipo"])
        w.writerow([product_base, match_target, file_name, match_val, f"{score:.3f}", tipo_tmp])
    logging.info("aux_matches generado en %s", out_matches)
    match_row = {"Codigo": product_base, "Archivo_Auxiliar": file_name, "Tipo": tipo_tmp}

    aux_name = match_row.get("Archivo_Auxiliar") or ""
    tipo = match_row.get("Tipo") or infer_type_from_aux_name(aux_name)

    out_path = out_csv_dir / f"{pdf.stem}.csv"
    generate_csv_from_json(product_base, data, tipo, out_path)
    logging.info("CSV generado en %s (tipo=%s)", out_path, tipo)


if __name__ == "__main__":
    main()
