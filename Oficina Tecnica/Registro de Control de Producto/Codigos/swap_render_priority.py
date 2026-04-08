
import sys
from pathlib import Path

target_file = Path(__file__).resolve().with_name("step3_prepare_outputs.py")
content = target_file.read_text(encoding="utf-8")

# Attempt 1: Swap blocks programmatically
# We search for the "pdfium" block and the "pdfplumber" block

block_pdfium = """    # 1. Primer intento: pdfium (desde bytes)
    if pdfium is not None:
        try:
            doc = pdfium.PdfDocument(file_bytes)
            if len(doc) > 0:
                page = doc[0]
                bitmap = page.render(scale=3.0)
                img = bitmap.to_pil()
                img = _preprocess_pil(img)
                buf = io.BytesIO()
                img.save(buf, format="PNG")
                doc.close()
                return buf.getvalue()
        except Exception as exc:
            logging.warning("Fallo pdfium con %s: %s", pdf_path.name, exc)"""

block_pdfplumber = """    # 2. Respaldo: pdfplumber -> PIL (desde bytes)
    if pdfplumber is not None:
        try:
            with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
                if not pdf.pages:
                    return None
                page = pdf.pages[0]
                pil_img = page.to_image(resolution=300).original
                pil_img = _preprocess_pil(pil_img)
                buf = io.BytesIO()
                pil_img.save(buf, format="PNG")
                return buf.getvalue()
        except Exception as exc:
            logging.warning("Fallo pdfplumber con %s: %s", pdf_path.name, exc)"""

# New Logic: Plumber first
new_layout = """    # 1. Primer intento: pdfplumber (Safe)
    if pdfplumber is not None:
        try:
            with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
                if not pdf.pages:
                    return None
                page = pdf.pages[0]
                pil_img = page.to_image(resolution=300).original
                pil_img = _preprocess_pil(pil_img)
                buf = io.BytesIO()
                pil_img.save(buf, format="PNG")
                return buf.getvalue()
        except Exception as exc:
            logging.warning("Fallo pdfplumber con %s: %s", pdf_path.name, exc)

    # 2. Respaldo: pdfium (Risky)
    if pdfium is not None:
        try:
            doc = pdfium.PdfDocument(file_bytes)
            if len(doc) > 0:
                page = doc[0]
                bitmap = page.render(scale=3.0)
                img = bitmap.to_pil()
                img = _preprocess_pil(img)
                buf = io.BytesIO()
                img.save(buf, format="PNG")
                doc.close()
                return buf.getvalue()
        except Exception as exc:
            logging.warning("Fallo pdfium con %s: %s", pdf_path.name, exc)"""

# Try to find exactly what I wrote last time in 1135
# Actually let's find roughly
if "if pdfium is not None:" in content and "doc = pdfium.PdfDocument(file_bytes)" in content:
   # Remove the old blocks and insert the new one
   # We can find the start of the section and replace until the end of the function
   start_marker = "    if not file_bytes: return None"
   end_marker = "    return None"
   
   idx_start = content.find(start_marker)
   # Find the Last return None of the function?
   # The function ends with return None
   # But there might be other return Nones.
   # We want the block AFTER "if not file_bytes: return None"
   
   if idx_start != -1:
        # Construct exact replacement
        # We need to act carefully.
        # Let's replace the pdfium block first, then the plumbing block
        pass

# Simpler approach: String Replace exact blocks if they match my previous write
if block_pdfium in content:
    content = content.replace(block_pdfium, "___PDFIUM___")
if block_pdfplumber in content:
     content = content.replace(block_pdfplumber, "___PLUMBER___")
     
if "___PDFIUM___" in content and "___PLUMBER___" in content:
    # Swap names essentially, but content is different
    # Actually just replace the placeholders with swapped code
    
    # Plumber First
    content = content.replace("___PDFIUM___", """    # 1. Primer intento: pdfplumber (Safe/Python)
    if pdfplumber is not None:
        try:
            with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
                if not pdf.pages:
                    return None
                page = pdf.pages[0]
                pil_img = page.to_image(resolution=300).original
                pil_img = _preprocess_pil(pil_img)
                buf = io.BytesIO()
                pil_img.save(buf, format="PNG")
                return buf.getvalue()
        except Exception as exc:
            logging.warning("Fallo pdfplumber con %s: %s", pdf_path.name, exc)""")
            
    content = content.replace("___PLUMBER___", """    # 2. Respaldo: pdfium (Risky)
    if pdfium is not None:
        try:
            doc = pdfium.PdfDocument(file_bytes)
            if len(doc) > 0:
                page = doc[0]
                bitmap = page.render(scale=3.0)
                img = bitmap.to_pil()
                img = _preprocess_pil(img)
                buf = io.BytesIO()
                img.save(buf, format="PNG")
                doc.close()
                return buf.getvalue()
        except Exception as exc:
            logging.warning("Fallo pdfium con %s: %s", pdf_path.name, exc)""")
            
    target_file.write_text(content, encoding="utf-8")
    print("SUCCESS: Swapped Pdfium and Plumber priority.")
else:
    print("FAILED: Could not find exact blocks.")
    # Fallback to direct string replacement of specific lines if needed
