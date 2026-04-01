
AUXILIAR_DIR = BASE_DIR / "Auxiliares/indices_auxiliar"

@app.route('/api/auxiliar-indices')
def get_auxiliar_indices():
    files = []
    if not AUXILIAR_DIR.exists():
        # Create it if it doesn't exist? Or just return empty
        # Better to just return empty for safety
        return jsonify([])
        
    for file in AUXILIAR_DIR.glob('*.csv'):
        # Check if it is a file
        if file.is_file():
            files.append(file.name)
            
    return jsonify(files)

@app.route('/api/auxiliar-csv/<filename>')
def get_auxiliar_csv(filename):
    # Security: Ensure filename is basename only
    filename = secure_filename(filename)
    target = AUXILIAR_DIR / filename
    
    if not target.exists():
        return jsonify({"status": "error", "message": "File not found"}), 404
        
    try:
        rows = []
        headers = []
        with open(target, 'r', encoding='utf-8', errors='replace') as f:
            # Attempt to sniff delimiter
            sample = f.read(1024)
            f.seek(0)
            sniffer = csv.Sniffer()
            try:
                dialect = sniffer.sniff(sample)
            except csv.Error:
                dialect = 'excel' # Fallback
            
            reader = csv.reader(f, dialect)
            rows_list = list(reader)
            
            if rows_list:
                headers = rows_list[0]
                rows = rows_list[1:]
                
        return jsonify({"status": "success", "headers": headers, "rows": rows})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500
