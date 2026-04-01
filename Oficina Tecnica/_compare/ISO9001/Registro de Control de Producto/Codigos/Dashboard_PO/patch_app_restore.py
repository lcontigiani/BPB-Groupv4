
import os

APP_PATH = r"//bpbsrv03/lcontigiani/Oficina Tecnica/Registro de Control de Producto/Codigos/Dashboard_PO/app.py"

# The current block we just modified
TARGET_BLOCK = """    # Resolver email real del usuario (en users.json el username puede no ser el email completo)
    raw_user = session.get('user')
    user_email = raw_user.strip().lower() if raw_user else ''
    try:
        if USERS_FILE.exists() and raw_user:
            with open(USERS_FILE, 'r', encoding='utf-8') as f:
                users_db = json.load(f)
            
            # 1. Direct match
            if raw_user in users_db:
                email_val = users_db[raw_user].get('email') or users_db[raw_user].get('correo')
                if email_val:
                    user_email = email_val.strip().lower()
            
            # 2. Match by prefix if no @
            elif '@' not in raw_user:
                for k in users_db.keys():
                    if k.strip().lower().split('@')[0] == raw_user.strip().lower():
                        user_email = k
                        email_val = users_db[k].get('email') or users_db[k].get('correo')
                        if email_val:
                            user_email = email_val.strip().lower()
                        break

    except Exception as e:
        print(f"[ACTIVITY] Warning resolving email: {e}")"""

# The logic from the backup (simplified again)
RESTORE_BLOCK = """    # Resolver email real del usuario (en users.json el username puede no ser el email completo)
    raw_user = session.get('user')
    user_email = raw_user.strip().lower() if raw_user else ''
    try:
        if USERS_FILE.exists() and raw_user and '@' not in raw_user:
            with open(USERS_FILE, 'r', encoding='utf-8') as f:
                users_db = json.load(f)
            if raw_user in users_db:
                email_val = users_db[raw_user].get('email') or users_db[raw_user].get('correo')
                if email_val:
                    user_email = email_val.strip().lower()
    except Exception as e:
        print(f"[ACTIVITY] Warning resolving email: {e}")"""

def restore_file():
    print(f"Reading {APP_PATH}...")
    with open(APP_PATH, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # We might need to handle line endings or slight whitespace diffs
    # A robust way is to just look for the function start and replace until the logic block end?
    # Or just replace the block I know I inserted.
    
    if TARGET_BLOCK in content:
        print("Detailed resolution block found. Restoring backup logic...")
        new_content = content.replace(TARGET_BLOCK, RESTORE_BLOCK)
        with open(APP_PATH, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print("SUCCESS: Restored to backup logic.")
    else:
        print("ERROR: Could not find the modified block to replace.")
        # Debug: print snippet
        start = content.find("def get_pending_activity")
        if start != -1:
            print(f"-- Snippet in file --\n{content[start:start+600]}")

if __name__ == "__main__":
    restore_file()
