
import os
import shutil

files_to_fix = [
    r"//bpbsrv03/lcontigiani/Oficina Tecnica/Registro de Control de Producto/Codigos/Dashboard_PO/static/script.js",
    r"//bpbsrv03/lcontigiani/Oficina Tecnica/Registro de Control de Producto/Codigos/Dashboard_PO/app.py"
]

def repair_file(filepath):
    print(f"Repairing {filepath}...")
    content = None
    
    # Try different encodings
    encodings = ['utf-8', 'utf-16', 'utf-16-le', 'latin-1', 'cp1252']
    
    for enc in encodings:
        try:
            with open(filepath, 'r', encoding=enc) as f:
                content = f.read()
            # Basic sanity check: if it's really code, it shouldn't have null bytes (unless binary, but these are text)
            # If we read with wrong encoding (e.g. utf-8 on utf-16), we might get garbage or fail.
            # If we read utf-16 as utf-8, we often get \x00.
            if '\x00' not in content:
                print(f"  -> Successfully read with {enc}")
                break
        except Exception:
            continue
            
    if content is None:
        print("  -> FAILED to determine encoding.")
        return

    # Backup
    try:
        shutil.copy2(filepath, filepath + ".bak")
    except:
        pass

    # Save as UTF-8
    try:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print("  -> Saved as UTF-8.")
    except Exception as e:
        print(f"  -> Error saving: {e}")

if __name__ == "__main__":
    for f in files_to_fix:
        if os.path.exists(f):
            repair_file(f)
        else:
            print(f"File not found: {f}")
