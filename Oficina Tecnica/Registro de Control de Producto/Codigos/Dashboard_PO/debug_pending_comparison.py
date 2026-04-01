
import json
from pathlib import Path
from datetime import datetime, timedelta

# Config paths
ACTIVITY_BASE_PATH = Path(r"//BPBSRV03/lcontigiani/Oficina Tecnica/Registro de Actividad/Codigos")
ACTIVITY_STATE_FILE = ACTIVITY_BASE_PATH / "data/activity_mailer_state.json"

# Simulate session user
SESSION_USER = "lcontigiani" # As seen in app.py

def debug_compare():
    print(f"--- COMPARISON DEBUG: {SESSION_USER} ---")
    
    # 1. Resolve User (Backup Style)
    # The backup style was:
    # if raw_user in users_db: email = ...
    
    # Let's see what users.json allows
    USERS_FILE = Path(r"//BPBSRV03/lcontigiani/Oficina Tecnica/Registro de Control de Producto/Codigos/Usuarios/users.json")
    user_email = SESSION_USER
    
    if USERS_FILE.exists():
        with open(USERS_FILE, 'r', encoding='utf-8') as f:
            users_db = json.load(f)
        
        # In backup logic:
        # key = raw_user (lcontigiani)
        # Does 'lcontigiani' exist in users_db?
        exists = SESSION_USER in users_db
        print(f"UsersDB has key '{SESSION_USER}': {exists}")
        
        if exists:
            # This is what backup expected
            val = users_db[SESSION_USER]
            print(f"  -> Value: {val}")
        else:
            # If not, backup logic fails to resolve email from 'lcontigiani' if strict match required
            print(f"  -> Backup logic would FAIL to resolve '{SESSION_USER}' if keys are full emails.")
            print("  -> Keys available:", list(users_db.keys()))

    # 2. Check State File with 'lcontigiani' as email (fallback)
    if not ACTIVITY_STATE_FILE.exists(): return
    
    with open(ACTIVITY_STATE_FILE, 'r', encoding='utf-8') as f:
        state = json.load(f)
        
    for camp in state.get('campaigns', [])[:3]: # check first 3
        rcpts = camp.get('recipients', [])
        print(f"Campaign {camp.get('date')}: Recipients: {rcpts}")
        if SESSION_USER in rcpts:
            print(f"  -> MATCH FOUND for '{SESSION_USER}'")
        elif "lcontigiani@bpbargentina.com" in rcpts:
             print(f"  -> MATCH FOUND for 'lcontigiani@bpbargentina.com'")
        else:
             print("  -> No match")

if __name__ == "__main__":
    debug_compare()
