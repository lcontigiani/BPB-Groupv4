
import os

files_to_fix = [
    r"//bpbsrv03/lcontigiani/Oficina Tecnica/Registro de Control de Producto/Codigos/Dashboard_PO/app.py",
    r"//bpbsrv03/lcontigiani/Oficina Tecnica/Registro de Control de Producto/Codigos/Dashboard_PO/static/script.js",
    r"//bpbsrv03/lcontigiani/Oficina Tecnica/Registro de Control de Producto/Codigos/Dashboard_PO/templates/index.html"
]

replacements = {
    # Double encoded UTF-8 read as Latin-1 and saved again
    "Ã©": "é",
    "Ã³": "ó",
    "Ã¡": "á",
    "Ãº": "ú",
    "Ã±": "ñ",
    "Ã": "í",  # Be careful with this one, do it last or checking context? 
                # Actually í is \xc3\xad. \xad is soft hyphen. 
                # If we see Ã followed by nothing visible, it might be í.
                # safely skip single Ã for now unless we are sure.
    "Ã\xad": "í", # Explicit soft hyphen
    "TÃ©cnica": "Técnica", # Specific fix for the user report
    "BÃºsqueda": "Búsqueda",
    "HistÃ³rico": "Histórico",
    "MÃ¡s": "Más",
    "AÃ±o": "Año",
    "DescripciÃ³n": "Descripción",
    "Ã‰": "É",
    "Ã“": "Ó",
    "Ã\x81": "Á", # \x81 is PAD? No. Á is \xc3\x81. \x81 is undefined in latin1 (C1 ctrl). 
                  # Windows-1252: \x81 is undefined.
                  # Maybe it won't occur as Mojibake easily.
}

def fix_mojibake(filepath):
    print(f"Checking {filepath} for Mojibake...")
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        new_content = content
        changes = 0
        
        # Specific known words first
        for bad, good in [("TÃ©cnica", "Técnica"), ("DescripciÃ³n", "Descripción"), ("Oficina TÃ©cnica", "Oficina Técnica")]:
            if bad in new_content:
                new_content = new_content.replace(bad, good)
                changes += 1
                
        # General chars
        for bad, good in [("Ã©", "é"), ("Ã³", "ó"), ("Ã¡", "á"), ("Ãº", "ú"), ("Ã±", "ñ"), ("Ã\xad", "í")]:
             if bad in new_content:
                count = new_content.count(bad)
                new_content = new_content.replace(bad, good)
                changes += count
                print(f"  -> Replaced {count} occurrences of {bad} with {good}")

        if changes > 0:
            print(f"  -> Applied {changes} corrections.")
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(new_content)
            print("  -> Saved.")
        else:
            print("  -> No Mojibake found.")
            
    except Exception as e:
        print(f"  -> Error: {e}")

if __name__ == "__main__":
    for f in files_to_fix:
        if os.path.exists(f):
            fix_mojibake(f)
