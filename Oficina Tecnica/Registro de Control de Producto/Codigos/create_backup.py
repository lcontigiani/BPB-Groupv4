import shutil
import os
import time
from pathlib import Path

# Configuration
SOURCE_DIR = Path(r"\\bpbsrv03\lcontigiani\Oficina Tecnica\Registro de Control de Producto\Codigos")
BACKUP_ROOT = SOURCE_DIR / "Backup"

# Create timestamped folder name
timestamp = time.strftime('%Y-%m-%d_%H-%M-%S')
backup_folder_name = f"Backup_System_{timestamp}"
DEST_DIR = BACKUP_ROOT / backup_folder_name

# Items to backup (Folders and specific root files)
folders_to_copy = ["Dashboard_PO", "Usuarios", "Extras"]
files_dict = {
    "scripts": [
        "automation.py", 
        "requirements.txt", 
        "config.yaml",
        "search_registros.py",
        "extract_to_csv.py"
    ]
}

def create_backup():
    print(f"Starting backup to: {DEST_DIR}")
    
    try:
        if not DEST_DIR.exists():
            DEST_DIR.mkdir(parents=True, exist_ok=True)
            
        # 1. Copy Folders
        for folder_name in folders_to_copy:
            src = SOURCE_DIR / folder_name
            dst = DEST_DIR / folder_name
            
            if src.exists():
                print(f"Copying folder: {folder_name}...")
                shutil.copytree(src, dst, dirs_exist_ok=True)
            else:
                print(f"Warning: Folder {folder_name} not found.")

        # 2. Copy Root Scripts
        print("Copying root scripts...")
        for script in files_dict["scripts"]:
            src = SOURCE_DIR / script
            dst = DEST_DIR / script
            if src.exists():
                 shutil.copy2(src, dst)

        print(f"Backup completed successfully at:\n{DEST_DIR}")

    except Exception as e:
        print(f"Backup failed: {e}")

if __name__ == "__main__":
    create_backup()
