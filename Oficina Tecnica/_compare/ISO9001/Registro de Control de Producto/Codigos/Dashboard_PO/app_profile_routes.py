
@app.route('/api/profile/update', methods=['POST'])
def update_profile():
    if not session.get('user'):
        return jsonify({"status": "error", "message": "No autheticado"}), 401
    
    username = session.get('user')
    data = request.json
    new_name = data.get('display_name')
    new_password = data.get('password')
    
    try:
        with open(USERS_FILE, 'r') as f:
            users = json.load(f)
            
        if username not in users:
            return jsonify({"status": "error", "message": "Usuario no encontrado"}), 404
            
        # Update Display Name
        if new_name:
            users[username]['display_name'] = new_name
            
        # Update Password
        if new_password:
            users[username]['password'] = generate_password_hash(new_password)
            
        with open(USERS_FILE, 'w') as f:
            json.dump(users, f, indent=4)
            
        log_action(username, "Profile Update", "Updated profile settings")
        return jsonify({"status": "success", "message": "Perfil actualizado"})
        
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/api/profile/upload_photo', methods=['POST'])
def upload_profile_photo():
    if not session.get('user'):
        return jsonify({"status": "error", "message": "No autheticado"}), 401
        
    username = session.get('user')
    
    if 'file' not in request.files:
         return jsonify({"status": "error", "message": "No file part"}), 400
         
    file = request.files['file']
    if file.filename == '':
         return jsonify({"status": "error", "message": "No selected file"}), 400
         
    if file:
        try:
            # Use hashed username to avoid filesystem issues and keep unique
            import hashlib
            safe_name = hashlib.md5(username.encode()).hexdigest() + os.path.splitext(file.filename)[1]
            target_path = PROFILE_PICS_DIR / safe_name
            
            file.save(target_path)
            
            # Update User Record
            with open(USERS_FILE, 'r') as f:
                users = json.load(f)
            
            if username in users:
                users[username]['profile_pic'] = safe_name
                with open(USERS_FILE, 'w') as f:
                    json.dump(users, f, indent=4)
                    
            return jsonify({"status": "success", "filename": safe_name})
            
        except Exception as e:
             return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/api/profile/photo/<filename>')
def get_profile_photo(filename):
    return send_from_directory(PROFILE_PICS_DIR, filename)

@app.route('/api/profile/history')
def get_my_history():
    if not session.get('user'):
        return jsonify({"status": "error", "message": "No autheticado"}), 401
        
    username = session.get('user')
    try:
        if not LOG_FILE.exists():
            return jsonify([])
            
        with open(LOG_FILE, 'r') as f:
            logs = json.load(f)
            
        # Filter for current user
        my_logs = [l for l in logs if l.get('user') == username]
        my_logs.reverse() # Newest first
        return jsonify(my_logs)
        
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

