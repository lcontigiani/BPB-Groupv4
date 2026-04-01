import os
import csv
import sys

# Rutas Hardcoded
BASE_PO = r"\\bpbsrv03\lcontigiani\Oficina Tecnica\Registro de Control de Producto\P2 - Purchase Order"
BASE_AUX = r"\\bpbsrv03\lcontigiani\Oficina Tecnica\Registro de Control de Producto\Auxiliares\indices_auxiliar"

def test_lookup(po_name, product_code_a):
    print(f"Testing lookup for PO: {po_name}, Code: {product_code_a}")
    
    # 1. Find aux_matches.csv
    po_path = os.path.join(BASE_PO, po_name)
    aux_matches_path = os.path.join(po_path, "csv_Auxiliar", "aux_matches.csv")
    
    if not os.path.exists(aux_matches_path):
        # Try case insensitive search for csv_auxiliar
        found = False
        for item in os.listdir(po_path):
            if item.lower() == "csv_auxiliar":
                aux_matches_path = os.path.join(po_path, item, "aux_matches.csv")
                found = True
                break
        if not found or not os.path.exists(aux_matches_path):
            print(f"ERROR: aux_matches.csv not found at {aux_matches_path}")
            return

    print(f"Found aux_matches: {aux_matches_path}")
    
    target_c = None
    target_d = None
    
    # Try different delimiters
    delimiters = [';', ',']
    
    for delim in delimiters:
        if target_c: break
        print(f"Trying delimiter: '{delim}'")
        try:
            with open(aux_matches_path, 'r', encoding='latin-1') as f:
                reader = csv.reader(f, delimiter=delim)
                for i, row in enumerate(reader):
                    if len(row) < 4: continue
                    
                    # DEBUG: Search anywhere
                    if "B&P-047-ASL-205-25MM" in str(row):
                         print(f"DEBUG FIND: Found 'B&P-047-ASL-205-25MM' in Row {i}, index: {row.index('B&P-047-ASL-205-25MM') if 'B&P-047-ASL-205-25MM' in row else 'substring'}")
                         print(f"Row: {row}")

                    if row[0].strip() == product_code_a.strip():
                        print(f"  MATCH FOUND in COL A (0) Row {i} with delimiter '{delim}'!")
                        target_c = row[2].strip()
                        target_d = row[3].strip()
                        break
                    
                    if row[1].strip() == product_code_a.strip():
                        print(f"  MATCH FOUND in COL B (1) Row {i} with delimiter '{delim}'!")
                        target_c = row[2].strip()
                        target_d = row[3].strip()
                        break
        except Exception as e:
            print(f"  Error reading with {delim}: {e}")

    if not target_c:
        print("No match found in aux_matches.")
        return

    # 2. Find file in indices_auxiliar (Revised Logic)
    target_c_base = os.path.splitext(target_c)[0]
    # Try adding _Auxiliar.csv
    aux_filename = f"{target_c_base}_Auxiliar.csv"
    
    aux_file_path = os.path.join(BASE_AUX, aux_filename)
    # Check if exact match exists, if not try case insensitive partial
    if not os.path.exists(aux_file_path):
        print(f"WARN: Exact path {aux_file_path} not found.")
        # Try finding in dir
        try:
             for f in os.listdir(BASE_AUX):
                 if f.lower() == aux_filename.lower():
                     aux_file_path = os.path.join(BASE_AUX, f)
                     print(f"Found via case-insensitive: {aux_file_path}")
                     break
        except: pass

    if not os.path.exists(aux_file_path):
        print(f"ERROR: Aux file not found at {aux_file_path}")
        print("DEBUG: Listing BASE_AUX files:")
        try:
             files = os.listdir(BASE_AUX)
             for f in files[:20]:
                 print(f" - {f}")
        except Exception as e: print(f"Cannot list dir: {e}")
        return
        
    print(f"Found Aux File: {aux_file_path}")
    
    # 3. Search in Aux File (Col B == Target D)
    found_final = False
    for delim in delimiters:
        if found_final: break
        print(f"Searching in Aux File with delimiter '{delim}'...")
        try:
            with open(aux_file_path, 'r', encoding='latin-1') as f:
                reader = csv.reader(f, delimiter=delim)
                header = next(reader, None)
                print(f"  Header: {header}")
                
                for i, row in enumerate(reader):
                    if len(row) < 2: continue
                    # Match Col B (index 1) with Target D
                    if row[1].strip() == target_d:
                        print(f"  MATCH FOUND in Aux File Row {i}!")
                        print(f"  Row Content: {row}")
                        found_final = True
                        break
        except Exception as e:
            print(f"  Error reading aux file with {delim}: {e}")

if __name__ == "__main__":
    test_lookup("PO1059", "B&P-048-CF5202-2RST-")
