
import os

APP_PATH = r"//bpbsrv03/lcontigiani/Oficina Tecnica/Registro de Control de Producto/Codigos/Dashboard_PO/app.py"

# BLOCK 1: get_pending_activity
BLOCK_1_TARGET = """    try:
        if USERS_FILE.exists() and raw_user and '@' not in raw_user:
            with open(USERS_FILE, 'r', encoding='utf-8') as f:
                users_db = json.load(f)
            if raw_user in users_db:
                email_val = users_db[raw_user].get('email') or users_db[raw_user].get('correo')
                if email_val:
                    user_email = email_val.strip().lower()
    except Exception as e:
        print(f"[ACTIVITY] Warning resolving email: {e}")"""

BLOCK_1_REPLACEMENT = """    try:
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

# BLOCK 2: submit_activity_record
BLOCK_2_TARGET = """    # 1. First, ensure we have the correct email from users.json if possible
    try:
        if USERS_FILE.exists():
            with open(USERS_FILE, 'r') as f:
                users_db = json.load(f)
            key = raw_user if raw_user in users_db else user_email
            if key in users_db:
                email_val = users_db[key].get('email') or users_db[key].get('correo')
                if email_val:
                    user_email = email_val.strip().lower()
    except Exception as e:
        print(f"[ACTIVITY] Warning resolving user email: {e}")"""

BLOCK_2_REPLACEMENT = """    # 1. First, ensure we have the correct email from users.json if possible
    try:
        if USERS_FILE.exists():
            with open(USERS_FILE, 'r') as f:
                users_db = json.load(f)
            
            # Try direct match
            key = raw_user if raw_user in users_db else user_email
            if key in users_db:
                email_val = users_db[key].get('email') or users_db[key].get('correo')
                if email_val:
                    user_email = email_val.strip().lower()
            
            # Try prefix match
            elif raw_user and '@' not in raw_user:
                 for k in users_db.keys():
                    if k.strip().lower().split('@')[0] == raw_user.strip().lower():
                        user_email = k
                        email_val = users_db[k].get('email') or users_db[k].get('correo')
                        if email_val: 
                            user_email = email_val.strip().lower()
                        break
    except Exception as e:
        print(f"[ACTIVITY] Warning resolving user email: {e}")"""

def patch_file():
    print(f"Reading {APP_PATH}...")
    with open(APP_PATH, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Normalize line endings just in case
    # content = content.replace('\r\n', '\n')
    
    new_content = content
    
    if BLOCK_1_TARGET in new_content:
        print("Block 1 found. Replacing...")
        new_content = new_content.replace(BLOCK_1_TARGET, BLOCK_1_REPLACEMENT)
    else:
        print("ERROR: Block 1 NOT found (Check match string)")
    
    if BLOCK_2_TARGET in new_content:
        print("Block 2 found. Replacing...")
        new_content = new_content.replace(BLOCK_2_TARGET, BLOCK_2_REPLACEMENT)
    else:
        print("ERROR: Block 2 NOT found (Check match string)")
    
    if new_content != content:
        print("Writing updated content...")
        with open(APP_PATH, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print("SUCCESS.")
    else:
        print("No changes made.")

if __name__ == "__main__":
    patch_file()
