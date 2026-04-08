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
from win32com.client import Dispatch


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


def main() -> None:
    base = Path(__file__).resolve().parent
    docs_root = base.parent.parent
    src = docs_root / "R019-01-Modelo.doc"
    dest = docs_root / "R019-01-salida.doc"

    payload_path = Path(sys.argv[1]) if len(sys.argv) > 1 else None
    data = load_payload(payload_path) if payload_path else load_payload(None)

    word = Dispatch("Word.Application")
    doc_src = word.Documents.Open(str(src), ReadOnly=True)
    doc_src.SaveAs(str(dest))
    doc_src.Close(False)

    doc = word.Documents.Open(str(dest), ReadOnly=False)
    try:
        for key, val in data.items():
            if key.startswith("chk_"):
                set_checkbox(doc, key, val)
            else:
                set_text(doc, key, val)
        doc.Save()
        print(f"Archivo generado: {dest}")
    finally:
        doc.Close(False)
        word.Quit()


if __name__ == "__main__":
    main()
