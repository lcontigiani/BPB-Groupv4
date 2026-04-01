
import os

file_path = r"\\bpbsrv03\lcontigiani\Oficina Tecnica\Registro de Control de Producto\Codigos\Dashboard_PO\templates\index.html"

with open(file_path, 'rb') as f:
    lines = f.readlines()
    
# Check specific interesting lines (0-indexed in list, 1-indexed in file)
# Line 7: Title
# Line 20: h2
# Line 24: Password placeholder
# Line 38: Button

indices = [6, 19, 23, 37]

for i in indices:
    if i < len(lines):
        print(f"Line {i+1}: {lines[i]}")
