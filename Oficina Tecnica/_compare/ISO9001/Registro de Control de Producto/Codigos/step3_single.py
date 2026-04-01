import argparse
import json
import logging
import re
from pathlib import Path
from typing import Dict, List, Optional

import csv

import extract_to_csv
import extract_to_csv_bolas_fixed
from automation import find_best_aux_match
from step3_prepare_outputs import extract_notes_with_gemini, normalize_dimensions, normalize_retainer
from PIL import Image

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
    """
    Desde un nombre de PDF tipo 'PO1291-51310-Rev B' devuelve '51310'.
    Si no hay 'Rev', devuelve lo que sigue al primer '-'.
    """
    stem = Path(name).stem
    m = re.search(r"^PO\d+\s*[-_ ]\s*(.+?)\s*[-_ ]?\s*rev\b", stem, flags=re.I)
    if m:
        return m.group(1).strip(" -_")
    parts = stem.split("-")
    return "-".join(parts[1:]).strip() if len(parts) > 1 else stem


def pick_latest_json_for_pdf(pdf: Path, json_dir: Path) -> Optional[Path]:
    """
    Busca el json de ese PDF en json_dir, eligiendo la revisión más alta.
    Formatos esperados:
      <pdf.stem>_notes_extracted_gemini.json
      <pdf.stem>_notes_extracted_gemini - Rev.A.json
      <pdf.stem>_notes_extracted_gemini - Rev.B.json
    """
    prefix = f"{pdf.stem}_notes_extracted_gemini"
    best_path = None
    best_rank = -1
    pattern = re.compile(rf"^{re.escape(prefix)}(?: - Rev\.([A-Za-z0-9]+))?\.json$", re.I)
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
    """
    Busca la mejor fila del aux_matches comparando contra columna 'Codigo'.
    Preferimos que contenga el target; usa ratio como desempate.
    """
    t_norm = norm_str(target)
    best = None
    best_score = -1.0
    for r in rows:
        code = r.get("Codigo") or ""
        c_norm = norm_str(code)
        if not c_norm:
            continue
        contain = t_norm in c_norm or c_norm in t_norm
        ratio = 0.0
        try:
            import difflib

            ratio = difflib.SequenceMatcher(None, t_norm, c_norm).ratio()
        except Exception:
            pass
        score = ratio + (0.5 if contain else 0.0)
        if score > best_score:
            best_score = score
            best = r
    return best


def infer_type_from_aux_name(name: str) -> str:
    s = (name or "").lower()
    if "bol" in s:
        return "bolas"
    if "rod" in s:
        return "rodillos"
    if "esp" in s:
        return "especiales"
    return "desconocido"


def generate_csv_from_json(product_code: str, data: Dict, tipo: str, out_path: Path) -> None:
    """
    Despacha al extractor correcto según tipo.
    """
    if tipo == "bolas":
        row = extract_to_csv_bolas_fixed.build_row(product_code, data)
        extract_to_csv_bolas_fixed.write_csv(out_path, row)
    else:  # default rodillos/especiales -> usa extractor base
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


def main():
    ap = argparse.ArgumentParser(description="Generar CSV para un solo PDF de prueba (usa json + aux_matches existentes).")
    ap.add_argument("--pdf", required=True, help="Ruta al PDF de prueba dentro de una PO de Pruebas")
    ap.add_argument("--po-dir", required=True, help="Ruta a la carpeta PO (que contiene json/ y csv_Auxiliar/)")
    ap.add_argument("--registros-root", default=r"\\192.168.0.55\utn\REGISTROS\R016-01", help="Ruta a los R016-01 para matching auxiliar")
    ap.add_argument("--fabricas-csv", default=r"\\BPBSRV03\lcontigiani\Oficina Tecnica\Registro de Control de Producto\Auxiliares\Fabricas\Listado Maestro de Codificacion Fabricas.csv", help="CSV maestro de fabricas")
    ap.add_argument("--register-password", default="bpb", help="Password de los R016-01")
    args = ap.parse_args()

    pdf = Path(args.pdf)
    po_dir = Path(args.po_dir)
    json_dir = po_dir / "json"
    aux_csv_dir = po_dir / "csv_Auxiliar"
    out_csv_dir = po_dir / "csv"
    # Aseguramos estructura básica de carpetas de prueba
    ensure_dir(json_dir)
    ensure_dir(aux_csv_dir)
    ensure_dir(out_csv_dir)

    logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")

    # 1) Obtener JSON: si no existe, lo generamos con Gemini
    json_path = pick_latest_json_for_pdf(pdf, json_dir)
    if not json_path or not json_path.exists():
        # Manejo de imagen o pdf directamente con Gemini (reutilizamos prompt de extract_notes_with_gemini)
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
            except Exception:
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

        img_bytes = render_first_page_png_any(pdf)
        if not img_bytes:
            raise FileNotFoundError(f"No se pudo generar imagen para {pdf.name}")
        text_first = extract_text_first_page(pdf)

        # Llamado directo a Gemini replicando extract_notes_with_gemini
        from base64 import b64encode
        import requests

        api_key = (Path(__file__).parent / "gemini.key")
        if api_key.exists():
            api_key = api_key.read_text(encoding="utf-8").strip()
        else:
            alt = Path(__file__).parent / "gemini.key.txt"
            api_key = alt.read_text(encoding="utf-8").strip() if alt.exists() else None
        if not api_key:
            raise FileNotFoundError("GEMINI_API_KEY no disponible")

        prompt = (
            "Eres un extractor técnico de planos de rodamientos. Devuelve SOLO JSON plano (sin markdown) con EXACTAMENTE estos campos y estructura (igual al ejemplo existente):\n"
            "{\n"
            "  \"purchase_order\": \"<numero OC si aparece>\",\n"
            "  \"code\": \"<codigo exacto del campo Código/Code del rotulo, incluyendo prefijo numérico si existe ej 100-SAB211-55DG>\",\n"
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
            "  \"seal_torque\": {\"low_Nm\": number, \"high_Nm\": number} (si aparece rango tipo 0.451-0.676 Nm),\n"
            "  \"lubricant\": {\"type\": \"texto\", \"fill\": \"texto\"} (fill puede incluir % y/o gramos en la misma cadena),\n"
            "  \"retainer\": {\"material\": \"Steel/Brass/...\"},\n"
            "  \"revision_history\": [{\"rev\":\"A/B/C...\", \"date\":\"dd/mm/yyyy\", \"by\":\"\"}, ...]\n"
            "}\n"
            "Reglas clave:\n"
            "- Usa mm y tolerancias con signo (ej -0.15). Si falta dato: null.\n"
            "- No inventes. Copia exactamente lo que veas (incluye PO y código marcado en pieza/rótulo).\n"
            "- Usa la última fecha/revisión si hay tabla de revisiones; incluye la lista completa en revision_history.\n"
            "- Para retainer, si ves 'Two steel cage' u otro texto con steel/brass, devuelve solo el material capitalizado.\n"
            "- Para lubricant, type: material base (ej 'Polyrex'), fill: texto con % y/o gramos tal como se ve.\n"
            "- Sin texto extra ni markdown, solo el JSON solicitado."
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
        data = json.loads(m.group(0)) if m else json.loads(text_resp)

        data["dimensions"] = normalize_dimensions(data.get("dimensions") or {})
        if "retainer" in data and isinstance(data["retainer"], dict):
            mat = data["retainer"].get("material")
            if mat:
                data["retainer"]["material"] = normalize_retainer(mat)
        json_path = json_dir / f"{pdf.stem}_notes_extracted_gemini.json"
        json_path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
        logging.info("JSON generado con Gemini en %s", json_path)
    else:
        data = json.loads(json_path.read_text(encoding="utf-8"))

    raw_code = data.get("code") or ""
    m_code = re.match(r"^(\d{3})[- ]?(.*)$", str(raw_code).strip())
    if m_code:
        data["proveedor"] = m_code.group(1)
        data["code"] = m_code.group(2)

    product_key = extract_product_key_from_pdf_name(pdf.name)
    factory_map = load_factory_map(Path(args.fabricas_csv))
    match_target = build_match_name(product_key, data, factory_map)

    aux_rows = load_aux_matches(aux_csv_dir)
    match_row = best_aux_row(match_target, aux_rows) if aux_rows else None

    # Si no hay aux_matches existentes, calculamos uno y lo escribimos
    if not match_row:
        file_name, match_val, score = find_best_aux_match(match_target, Path(args.registros_root), password=args.register_password)
        tipo = infer_type_from_aux_name(file_name)
        out_matches = aux_csv_dir / "aux_matches.csv"
        with open(out_matches, "w", newline="", encoding="utf-8") as f:
            w = csv.writer(f, delimiter=";")
            w.writerow(["Codigo", "Match_Target", "Archivo_Auxiliar", "Coincidencia", "Score", "Tipo"])
            w.writerow([product_key, match_target, file_name, match_val, f"{score:.3f}", tipo])
        logging.info("aux_matches generado en %s", out_matches)
        match_row = {"Codigo": product_key, "Archivo_Auxiliar": file_name, "Tipo": tipo}

    if match_row:
        aux_name = match_row.get("Archivo_Auxiliar") or ""
        tipo = match_row.get("Tipo") or infer_type_from_aux_name(aux_name)
    else:
        tipo = "desconocido"
        logging.warning("Sin match auxiliar para %s; usando tipo desconocido", product_key)

    out_path = out_csv_dir / f"{pdf.stem}.csv"
    generate_csv_from_json(product_key, data, tipo, out_path)
    logging.info("CSV generado en %s (tipo=%s)", out_path, tipo)


if __name__ == "__main__":
    main()
