
import os
import argparse
from pathlib import Path
import pdfplumber
import pypdfium2 as pdfium
import pytesseract
from PIL import Image

def extract_debug(pdf_path):
    print(f"--- DEBUGGING: {pdf_path} ---")
    
    # 1. PDFPlumber Text
    print("\n[PDFPLUMBER TEXT]")
    try:
        with pdfplumber.open(pdf_path) as pdf:
            for i, page in enumerate(pdf.pages):
                if i > 2: break
                text = page.extract_text()
                print(f"--- Page {i+1} ---")
                print(text)
                print("----------------")
    except Exception as e:
        print(f"PDFPlumber failed: {e}")

    # 2. OCR Text
    print("\n[TESSERACT OCR TEXT]")
    try:
        doc = pdfium.PdfDocument(pdf_path)
        for i, page in enumerate(doc):
            if i > 2: break
            bitmap = page.render(scale=2)
            pil_image = bitmap.to_pil()
            text = pytesseract.image_to_string(pil_image)
            print(f"--- Page {i+1} ---")
            print(text)
            print("----------------")
    except Exception as e:
        print(f"OCR failed: {e}")

if __name__ == "__main__":
    # Hardcoded path to the latest file in in process, or failed, or incoming
    # We'll try to find one.
    root = Path(r"\\BPBSRV03\lcontigiani\Oficina Tecnica\Registro de Control de Producto")
    
    # Search for a recent PDF in in process
    in process_dir = root / "P1 - Registros Solicitados" / "in process"
    pdfs = list(in process_dir.glob("**/*.pdf"))
    if pdfs:
        # Pick the most recent
        latest = max(pdfs, key=lambda p: p.stat().st_mtime)
        extract_debug(latest)
    else:
        print("No PDF found to debug.")
