
import os

file_path = r"\\bpbsrv03\lcontigiani\Oficina Tecnica\Registro de Control de Producto\Codigos\Dashboard_PO\app.py"

with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

new_lines = []

# Keep imports and config (Lines 1 to 21)
# 0-based: 0 to 20
new_lines.extend(lines[0:21])

# Append Missing MOCK_PATH (It was deleted before)
new_lines.append('MOCK_PATH = Path("mock_data")\n')

# Keep log_action function and history route (Lines 22 to 68)
# 0-based: 21 to 67
new_lines.extend(lines[21:68])

# Keep update routes (Lines 69 to 159)
# 0-based: 68 to 158
new_lines.extend(lines[68:159])

# Keep upload route (Lines 163 to 198)
# 0-based: 162 to 197
new_lines.extend(lines[162:198])

# Keep admin utils (approve, update_role, delete_user) (201 to 282)
# 0-based: 200 to 281
new_lines.extend(lines[200:282])

# Keep Constants and Path Logic (283 to 305)
# 0-based: 282 to 304
new_lines.extend(lines[282:305])

# Keep Routes Group 2 (Home, Data) - THESE WERE MISSING
# I need to re-add 'home' and 'get_data' which got deleted in the previous fix!
# I will reconstruct them here.

home_route = """
@app.route('/')
def home():
    return render_template('index.html')

@app.route('/api/data')
def get_data():
    results = []
    if not DATA_DIR.exists():
        return jsonify({"error": "Data directory not found", "path": str(DATA_DIR)}), 404
        
    for folder in DATA_DIR.iterdir():
        if folder.is_dir():
            po_data = {
                "id": folder.name,
                "path": str(folder),
                "files": {"pdfs": [], "csvs": [], "json": None},
                "content": {"json": {}, "csvs": []}
            }
            # Simplistic scan for recovery
            for file in folder.iterdir():
                if file.is_file():
                    if file.suffix.lower() == '.pdf': po_data["files"]["pdfs"].append(file.name)
                    elif file.suffix.lower() == '.json':
                        po_data["files"]["json"] = file.name
                        try:
                            with open(file, 'r', encoding='utf-8') as f: po_data["content"]["json"] = json.load(f)
                        except: pass
                    elif file.suffix.lower() == '.csv':
                        po_data["files"]["csvs"].append(file.name)
                        try:
                            with open(file, 'r', encoding='utf-8', errors='replace') as f:
                                reader = csv.DictReader(f, delimiter=';')
                                headers = [str(h) for h in (reader.fieldnames or [])]
                                rows = [{str(k): v for k, v in row.items()} for row in reader]
                                po_data["content"]["csvs"].append({"filename": file.name, "headers": headers, "rows": rows})
                        except: pass
            
            # Scan csv subdir
            csv_subdir = folder / 'csv'
            if csv_subdir.exists():
                for file in csv_subdir.iterdir():
                    if file.is_file() and file.suffix.lower() == '.csv':
                        po_data["files"]["csvs"].append(file.name)
                        try:
                            with open(file, 'r', encoding='utf-8', errors='replace') as f:
                                reader = csv.DictReader(f, delimiter=';')
                                headers = [str(h) for h in (reader.fieldnames or [])]
                                rows = [{str(k): v for k, v in row.items()} for row in reader]
                                po_data["content"]["csvs"].append({"filename": file.name, "headers": headers, "rows": rows})
                        except: pass
            results.append(po_data)
    return jsonify(results)
"""
new_lines.append(home_route)

# Resume with remaining routes (Login, Register, Admin Users, Check Session, Files, Main)
# Lines 289 to End
# 0-based: 288 to End
new_lines.extend(lines[288:])

with open(file_path, 'w', encoding='utf-8') as f:
    f.writelines(new_lines)

print("File patched successfully.")
