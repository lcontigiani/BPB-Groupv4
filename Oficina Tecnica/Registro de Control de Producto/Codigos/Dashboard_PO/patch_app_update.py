@app.route('/api/activity-update', methods=['POST'])
def update_activity_entry():
    if not session.get('user'):
        return jsonify({"status": "error", "message": "No autenticado"}), 401
    
    data = request.json
    token = data.get('token')
    new_desc = data.get('description')
    new_time = data.get('time')

    if not token or not new_desc or not new_time:
         return jsonify({"status": "error", "message": "Faltan datos requeridos"}), 400

    ACTIVITY_BASE = BASE_DIR.parent / "Registro de Actividad" / "Codigos"
    CONFIG_DIR = ACTIVITY_BASE / "config"
    DATA_DIR = ACTIVITY_BASE / "data/respuestas_csv"
    DESTINATARIOS_FILE = CONFIG_DIR / "destinatarios.csv"

    user_email = session.get('user')
    target_filename = None

    try:
        # 1. Lookup User Filename
        if not DESTINATARIOS_FILE.exists():
             return jsonify({'status': 'error', 'message': 'Configuración no encontrada.'}), 500

        with open(DESTINATARIOS_FILE, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                if row.get('EMAIL', '').strip().lower() == str(user_email).strip().lower():
                    target_filename = f"{row['NOMBRE'].strip()} {row['APELLIDO'].strip()}.csv"
                    break
        
        if not target_filename:
             return jsonify({'status': 'error', 'message': 'Usuario no autorizado.'}), 403

        csv_path = DATA_DIR / target_filename
        if not csv_path.exists():
             return jsonify({'status': 'error', 'message': 'Archivo de registros no encontrado.'}), 404

        # 2. Read All Rows
        updated_rows = []
        found = False
        
        # We need to detect encoding/delimiter or assume standard. 
        # Since get_activity_history implies successful read, we assume UTF-8 and comma (or whatever matches).
        # We'll stick to 'utf-8'.
        
        # Read and stored in memory
        with open(csv_path, 'r', encoding='utf-8', newline='') as f:
            reader = csv.reader(f)
            header = next(reader, None)
            if header:
                updated_rows.append(header)
            
            for row in reader:
                # Row structure: Date, Time, Token, Project, Effort, Desc, Obs
                # Index 2 is Token
                if len(row) > 2 and row[2] == token:
                    # Update Row
                    # Index 4 is Time (Tiempo)
                    # Index 5 is Description (Descripcion)
                    if len(row) > 5:
                        row[4] = new_time
                        row[5] = new_desc
                        # Also log modification in Observation (Index 6)
                        timestamp = datetime.now().strftime("%d/%m %H:%M")
                        mod_note = f"[Modificado el {timestamp}]"
                        if len(row) > 6:
                             row[6] = mod_note
                        else:
                             row.append(mod_note)
                        
                        found = True
                updated_rows.append(row)

        if not found:
            return jsonify({'status': 'error', 'message': 'Registro no encontrado.'}), 404

        # 3. Write Back
        with open(csv_path, 'w', encoding='utf-8', newline='') as f:
            writer = csv.writer(f)
            writer.writerows(updated_rows)

        return jsonify({'status': 'success', 'message': 'Registro actualizado correctamente.'})

    except Exception as e:
        print(f"Update Error: {e}")
        return jsonify({'status': 'error', 'message': f'Error interno: {str(e)}'}), 500
