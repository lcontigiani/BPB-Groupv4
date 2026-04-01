
import os

files = [
    r"//bpbsrv03/lcontigiani/Oficina Tecnica/Registro de Control de Producto/Codigos/Dashboard_PO/static/script.js",
    r"//bpbsrv03/lcontigiani/Oficina Tecnica/Registro de Control de Producto/Codigos/Dashboard_PO/app.py"
]

def check():
    for fp in files:
        print(f"--- Checking {os.path.basename(fp)} ---")
        try:
            with open(fp, 'r', encoding='utf-8') as f:
                content = f.read()
        except:
            with open(fp, 'r', encoding='latin-1') as f:
                content = f.read()
        
        if "script.js" in fp:
            # Check for the selector
            if "#results-table" in content:
                print("FOUND WRONG SELECTOR: #results-table")
            if "#po-table" in content:
                print("Found #po-table (Good if in the right place)")
            
            # Show the appended logic snippet
            idx = content.find("function injectPendingActivities")
            if idx != -1:
                print("Snippet found:")
                print(content[idx:idx+300])
            else:
                print("injectPendingActivities function NOT FOUND")

        if "app.py" in fp:
            if "/api/activity-submit" in content:
                print("Found /api/activity-submit endpoint")
            else:
                print("MISSING /api/activity-submit endpoint")

if __name__ == "__main__":
    check()
