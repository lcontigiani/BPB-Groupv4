from pathlib import Path
import os

base = Path(r"\\192.168.0.13\lcontigiani\Oficina Tecnica\Registro de Control de Producto")
aux = base / "Auxiliares/indices_auxiliar"

print(f"Checking path: {aux}")
if aux.exists():
    print("Path exists!")
    files = list(aux.glob('*.csv'))
    print(f"Found {len(files)} CSV files:")
    for f in files:
        print(f" - {f.name}")
else:
    print("Path does NOT exist.")
    print(f"Parent exists? {aux.parent.exists()}")
    print(f"Base exists? {base.exists()}")
