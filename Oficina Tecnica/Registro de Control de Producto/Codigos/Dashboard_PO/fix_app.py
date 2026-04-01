
import os

file_path = r"\\bpbsrv03\lcontigiani\Oficina Tecnica\Registro de Control de Producto\Codigos\Dashboard_PO\app.py"

with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Indices are 0-based. Line N in editor is index N-1.

# Block 1: Keep 1 to 284
# 1-based: 1..284. 0-based: 0..284 (exclusive of 284? No. lines[0:284] gets 0..283. So we want 0..284)
# Line 284 is "ALLOWED_EXTENSIONS = ...". Index 283.
# So lines[0:284] covers indices 0 to 283 (Lines 1 to 284).
new_lines = lines[0:284]

# Skip 285 to 499.
# Line 285 is index 284.
# Line 499 is index 498.
# Next desired line is 500 ("def allowed_file"). Index 499.
# So we resume at index 499.

# Block 2: Keep 500 to 503
# 1-based: 500..503.
# Index: 499..502.
# python slice: lines[499:503]
new_lines.extend(lines[499:503])

# Skip 504 to 537.
# Line 504 is index 503.
# Line 537 is index 536.
# Next desired is 538 ("@app.route...login"). Index 537.
# Resume at index 537.

# Block 3: Keep 538 to 637
# 1-based: 538..637.
# Index: 537..636.
# python slice: lines[537:637]
new_lines.extend(lines[537:637])

# Skip 638 to 708.
# Line 638 is index 637.
# Line 708 is index 707.
# Next desired is 709 ("@app.route...check_session"). Index 708.
# Resume at index 708.

# Block 4: Keep 709 to End.
new_lines.extend(lines[708:])

# Backup
backup_path = file_path + ".bak"
with open(backup_path, 'w', encoding='utf-8') as f:
    f.writelines(lines)

# Write New
with open(file_path, 'w', encoding='utf-8') as f:
    f.writelines(new_lines)

print("File patched successfully.")
