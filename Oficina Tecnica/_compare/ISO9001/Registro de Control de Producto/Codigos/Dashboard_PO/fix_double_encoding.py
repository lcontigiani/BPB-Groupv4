path = r"\\bpbsrv03\lcontigiani\Oficina Tecnica\Registro de Control de Producto\Codigos\Dashboard_PO\static\script.js"

print(f"Reading {path} as binary...")
with open(path, 'rb') as f:
    content_bytes = f.read()

# From hex analysis: c3 83 c2 9a 6c 74 69 6d 6f 73
# This is doubly-encoded Ú
# We want c3 9a 6c 74 69 6d 6f 73 (proper UTF-8 for Últimos)

target = b'\xc3\x83\xc2\x9altimos'  # Doubly-encoded Ãltimos
replacement = b'\xc3\x9altimos'  # Proper Últimos

occurences = content_bytes.count(target)
print(f"Found {occurences} occurrence(s) of doubly-encoded text")

if occurences > 0:
    new_content = content_bytes.replace(target, replacement)
    
    with open(path, 'wb') as f:
        f.write(new_content)
    
    print("SUCCESS: Fixed UTF-8 double encoding")
else:
    print("ERROR: Target pattern not found")
