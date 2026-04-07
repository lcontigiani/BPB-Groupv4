import os
import csv
from pathlib import Path
from io import StringIO

# CONFIGURATION (Misma que app.py)
BASE_DIR = Path(r"\\192.168.0.13\lcontigiani\Oficina Tecnica\Registro de Control de Producto")
PRODUCTION_PATH = BASE_DIR / "P2 - Purchase Order"
AUXILIAR_DIR = BASE_DIR / "Auxiliares/indices_auxiliar"

def debug_lookup():
    print("==========================================")
    print("   DIAGNOSTICO DE BUSQUEDA AUXILIAR")
    print("==========================================")
    print("Este script simula paso a paso lo que hace el servidor.\n")
    
    po_input = input("1. Copia y pega el ID de la PO (ej: PO-250113-1): ").strip()
    prod_input = input("2. Copia y pega el CODIGO PRODUCTO (ej: B&P-048-CF5202-2RST-): ").strip()
    
    print("\n------------------------------------------")
    print("INICIANDO RASTREO...")
    
    # 1. PO Folder
    po_path = PRODUCTION_PATH / po_input
    if not po_path.exists():
        print(f"[ERROR CRITICO] La carpeta de la PO no existe:\n  {po_path}")
        input("Presiona Enter para salir..."); return

    print(f"[OK] Carpeta PO encontrada.")
    
    # 2. aux_matches.csv
    aux_matches = po_path / "csv_Auxiliar" / "aux_matches.csv"
    if not aux_matches.exists():
        print(f"[INFO] No estaba en 'csv_Auxiliar', probando minusculas...")
        aux_matches = po_path / "csv_auxiliar" / "aux_matches.csv"
        
    if not aux_matches.exists():
        print(f"[ERROR CRITICO] No se encontro 'aux_matches.csv' en ninguna subcarpeta 'csv_Auxiliar'.")
        print("Ubicaciones probadas dentro de la PO:")
        print(f" - csv_Auxiliar/aux_matches.csv")
        print(f" - csv_auxiliar/aux_matches.csv")
        print("Contenido real de la carpeta PO:")
        try:
             for item in po_path.iterdir(): print(f" - {item.name}")
        except: pass
        input("Presiona Enter para salir..."); return
        
    print(f"[OK] Archivo aux_matches.csv encontrado.")
    
    # 3. Reading Matches
    target_c = None
    target_d = None
    
    try:
        encodings = ['utf-8-sig', 'cp1252', 'latin-1']
        content = None
        used_enc = ''
        for enc in encodings:
            try:
                with open(aux_matches, 'r', encoding=enc) as f:
                    content = f.read()
                    used_enc = enc
                    break
            except: continue
            
        print(f"[INFO] Archivo leido con encoding: {used_enc}")
        
        delimiter = ';' if content.count(';') > content.count(',') else ','
        print(f"[INFO] Delimitador detectado: '{delimiter}'")
        
        reader = csv.reader(StringIO(content), delimiter=delimiter)
        
        found_match = False
        print(f"[BUSCANDO] Buscando '{prod_input}' en Columna A (indice 0)...")
        
        first_rows = []
        
        for i, row in enumerate(reader):
            if i < 3: first_rows.append(row) # Save for debug verify
            if not row: continue
            
            # Check length
            if len(row) < 4:
                continue
                
            col_a = row[0].strip()
            
            if col_a == prod_input:
                print(f"\n[EXITO] ENCONTRADO en Fila {i+1}!")
                print(f"  Datos Fila completa: {row}")
                target_c = row[2].strip()
                target_d = row[3].strip()
                
                print(f"  -> COLUMNA C (Archivo): '{target_c}'")
                print(f"  -> COLUMNA D (Llave):   '{target_d}'")
                found_match = True
                break
                
        if not found_match:
            print(f"\n[FALLO] No se encontro el producto en 'aux_matches.csv'.")
            print("Verifica que sea EXACTAMENTE igual. Primeras 3 filas del archivo para referencia:")
            for r in first_rows: print(f"  {r}")
            input("Presiona Enter para salir..."); return

    except Exception as e:
        print(f"[ERROR] Excepcion leyendo aux_matches: {e}")
        input("Presiona Enter para salir..."); return

    # 4. Target Algo
    target_c_base = os.path.splitext(target_c)[0]
    aux_filename = f"{target_c_base}_Auxiliar.csv"
    
    print("\n------------------------------------------")
    print(f"[PASO SIGUIENTE] Buscando archivo auxiliar: '{aux_filename}'")
    
    aux_path = AUXILIAR_DIR / aux_filename
    
    if not aux_path.exists():
        print(f"[INFO] No encontrado exacto. Escaneando directorio '{AUXILIAR_DIR.name}'...")
        found_path = None
        if AUXILIAR_DIR.exists():
            for item in AUXILIAR_DIR.iterdir():
                if item.name.lower() == aux_filename.lower():
                    found_path = item
                    print(f"[OK] Encontrado archivo con nombre similar: {item.name}")
                    aux_path = found_path
                    break
        if not found_path:
             print(f"\n[ERROR] El archivo auxiliar NO EXISTE en la carpeta Auxiliares.")
             print(f"Buscabamos: '{aux_filename}'\n")
             print("------------------------------------------")
             print("ARCHIVOS DISPONIBLES EN LA CARPETA:")
             try:
                 count = 0
                 found_any = False
                 for f in AUXILIAR_DIR.iterdir():
                     if f.is_file():
                        print(f" - {f.name}")
                        found_any = True
                        count += 1
                        if count >= 15: 
                            print(f" ... y {len(list(AUXILIAR_DIR.iterdir())) - count} mas.")
                            break
                 if not found_any: print(" (Carpeta vacia o sin archivos visibles)")
             except Exception as e:
                 print(f"Error listando carpeta: {e}")
             
             print("------------------------------------------")
             print("TIP: Compara el nombre esperado con los de la lista.")
             input("Presiona Enter para salir..."); return
    else:
        print(f"[OK] Archivo auxiliar existe.")

    # 5. Search Key
    print(f"[BUSCANDO] Buscando llave '{target_d}' en COLUMNA B (indice 1) del auxiliar...")
    
    try:
        content_aux = None
        for enc in ['utf-8-sig', 'cp1252', 'latin-1']:
            try:
                with open(aux_path, 'r', encoding=enc) as f:
                    content_aux = f.read()
                    break
            except: continue
            
        delimiter_aux = ';' if content_aux.count(';') > content_aux.count(',') else ','
        print(f"[INFO] Delimitador Auxiliar: '{delimiter_aux}'")
        
        reader_aux = csv.reader(StringIO(content_aux), delimiter=delimiter_aux)
        rows_aux = list(reader_aux)
        
        found_data = False
        
        if len(rows_aux) > 0:
            print(f"[INFO] Headers detectados (Fila 1): {rows_aux[0]}")
            
            for i, row in enumerate(rows_aux):
                if len(row) < 2: continue
                col_b = row[1].strip()
                
                if col_b == target_d:
                    print(f"\n[EXITO FINAL] DATOS ENCONTRADOS en Fila {i+1}!")
                    print(f"  Fila COMPLETA a devolver: {row}")
                    found_data = True
                    break
        
        if not found_data:
            print(f"\n[FALLO] La llave '{target_d}' NO APARECE en la Columna B del archivo auxiliar.")
            print("Posibles causas:")
            print(" 1. La llave esta en otra columna?")
            print(" 2. El archivo auxiliar tiene los datos mal formateados?")
            
    except Exception as e:
        print(f"[ERROR] Leyendo archivo auxiliar: {e}")

    print("\n==========================================")
    input("Diagnostico finalizado. Presiona Enter para cerrar.")

if __name__ == "__main__":
    debug_lookup()
