import shutil
import os
from pathlib import Path

source = Path(r"\\bpbsrv03\lcontigiani\Oficina Tecnica\Registro de Control de Producto\Codigos\Dashboard_PO\Recursos B&P\ISO\SF_ISO - BYP.png")
# Target: static root
dest_dir = Path(r"\\bpbsrv03\lcontigiani\Oficina Tecnica\Registro de Control de Producto\Codigos\Dashboard_PO\static")
dest = dest_dir / "new_iso_logo.png"

print(f"Copying from {source} to {dest}")

if not dest_dir.exists():
    print(f"Destination directory {dest_dir} does not exist!")
else:
    try:
        shutil.copy2(source, dest)
        print("Copy successful!")
    except Exception as e:
        print(f"Copy failed: {e}")
