"""
Rellenar el R019-01 usando los marcadores/campos definidos en la plantilla.

Uso desde PowerShell/CMD en la carpeta raiz del proyecto:
  python Codigos/R019-01/fill_r01901.py payload.json

Si no se pasa archivo JSON, usa un conjunto mínimo de prueba.
Las claves del JSON deben coincidir con los nombres de marcadores/campos
por ejemplo:
{
  "Solicita": "Cliente X",
  "Numero_de_Registro": "N°175",
  "chk_Planos_SI": true,
  "chk_Planos_NO": false
}
"""

from pathlib import Path
import json
import sys
from typing import Optional

ISO_DOCS_ROOT = Path(r"\\192.168.0.55\utn\REGISTROS\REG.DISEÑOS Y DESARROLLOS")
R01901_OUTPUT_DIR = ISO_DOCS_ROOT / "R019-01- Datos de entrada"


def load_payload(path: Path) -> dict:
    if path and path.exists():
        with path.open(encoding="utf-8") as fh:
            return json.load(fh)
    # Datos de muestra mínimos
    return {
        "Solicita": "Cliente de prueba",
        "Numero_de_Registro": "N°000",
        "Descripcion_Aplicacion_Producto": "Prueba de carga automática.",
        "chk_Planos_SI": True,
        "chk_Planos_NO": False,
    }


def set_text(doc, name: str, value: str) -> None:
    val = "" if value is None else str(value)
    try:
        if doc.Bookmarks.Exists(name):
            rng = doc.Bookmarks(name).Range
            rng.Text = val
            # El bookmark se pierde al escribir; lo reponemos.
            doc.Bookmarks.Add(name, rng)
            return
    except Exception:
        pass
    try:
        ff = doc.FormFields(name)
        ff.Result = val
        return
    except Exception:
        pass
    try:
        col = doc.SelectContentControlsByTitle(name)
        if col and col.Count > 0:
            col.Item(1).Range.Text = val
    except Exception:
        pass


def set_checkbox(doc, name: str, state: bool) -> None:
    val = bool(state)
    try:
        ff = doc.FormFields(name)
        ff.CheckBox.Value = val
        return
    except Exception:
        pass
    try:
        col = doc.SelectContentControlsByTitle(name)
        if col and col.Count > 0:
            col.Item(1).Checked = val
    except Exception:
        pass


def resolve_template_path(docs_dir: Path) -> Path:
    candidates = [
        docs_dir / "R019-01-Modelo.docx",
        docs_dir / "R019-01-Modelo.doc",
    ]
    for cand in candidates:
        if cand.exists():
            return cand
    matches = list(docs_dir.glob("R019-01-Modelo.*"))
    if matches:
        return matches[0]
    raise FileNotFoundError(f"No se encontró plantilla R019-01-Modelo en {docs_dir}")


def generate_r01901(payload: dict, output_path: Path, template_path: Optional[Path] = None) -> Path:
    import pythoncom
    from win32com.client import Dispatch

    docs_dir = output_path.parent
    src = template_path or resolve_template_path(docs_dir)

    pythoncom.CoInitialize()
    word = Dispatch("Word.Application")
    try:
        word.Visible = False
        doc_src = word.Documents.Open(str(src), ReadOnly=True)
        doc_src.SaveAs(str(output_path))
        doc_src.Close(False)

        doc = word.Documents.Open(str(output_path), ReadOnly=False)
        try:
            for key, val in payload.items():
                if key.startswith("chk_"):
                    set_checkbox(doc, key, val)
                else:
                    set_text(doc, key, val)
            doc.Save()
        finally:
            doc.Close(False)
    finally:
        word.Quit()
        pythoncom.CoUninitialize()
    return output_path


def update_r01901(payload: dict, output_path: Path) -> Path:
    import pythoncom
    from win32com.client import Dispatch

    if not output_path.exists():
        raise FileNotFoundError(f"No se encontró el archivo: {output_path}")

    pythoncom.CoInitialize()
    word = Dispatch("Word.Application")
    try:
        word.Visible = False
        doc = word.Documents.Open(str(output_path), ReadOnly=False)
        try:
            for key, val in payload.items():
                if key.startswith("chk_"):
                    set_checkbox(doc, key, val)
                else:
                    set_text(doc, key, val)
            doc.Save()
        finally:
            doc.Close(False)
    finally:
        word.Quit()
        pythoncom.CoUninitialize()
    return output_path


def main() -> None:
    base = Path(__file__).resolve().parent
    iso_root = base.parent.parent
    docs_dir = R01901_OUTPUT_DIR
    template_dir = iso_root / "R019-01"
    template_path = resolve_template_path(template_dir)

    payload_path = Path(sys.argv[1]) if len(sys.argv) > 1 else None
    data = load_payload(payload_path) if payload_path else load_payload(None)

    output_name = sys.argv[2] if len(sys.argv) > 2 else "R019-01-salida.docx"
    dest = docs_dir / output_name
    docs_dir.mkdir(parents=True, exist_ok=True)

    generate_r01901(data, dest, template_path=template_path)
    print(f"Archivo generado: {dest}")


if __name__ == "__main__":
    main()
