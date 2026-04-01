import os

file_path = "app.py"
backup_path = "app.py.bak_nulls"

if os.path.exists(file_path):
    # Create backup
    with open(file_path, 'rb') as f_in, open(backup_path, 'wb') as f_out:
        content = f_in.read()
        f_out.write(content)
    
    print(f"Backup created at {backup_path}")

    # Fix
    with open(file_path, 'rb') as f:
        content = f.read()

    # check if nulls exist
    if b'\x00' in content:
        print("Null bytes detected. Removing...")
        content = content.replace(b'\x00', b'')
        
        with open(file_path, 'wb') as f:
            f.write(content)
        print("Fixed app.py")
    else:
        print("No null bytes found.")
else:
    print("app.py not found")
