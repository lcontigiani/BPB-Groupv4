import codecs

path = r"\\bpbsrv03\lcontigiani\Oficina Tecnica\Registro de Control de Producto\Codigos\Dashboard_PO\static\script.js"

print(f"Reading {path} as binary...")
with open(path, 'rb') as f:
    content_bytes = f.read()

print("Searching for malformed text...")
# The Ã character followed by ltimos is likely the bytes C3 83 (Ã in UTF-8) + ltimos
# We want Ú which is C3 9A in UTF-8

# Replace the hex patterns
# Ãltimos =  C3 83 6C 74 69 6D 6F 73
# Últimos should be C3 9A 6C 74 69 6D 6F 73 (Ú = C3 9A)

target = b'\xc3\x83ltimos'  # Ãltimos in UTF-8 bytes
replacement = b'\xc3\x9altimos'  # Últimos in UTF-8 bytes

if target in content_bytes:
    print(f"Found {content_bytes.count(target)} occurrence(s)")
    new_content = content_bytes.replace(target, replacement)
    
    print("Writing back...")
    with open(path, 'wb') as f:
        f.write(new_content)
    
    print("Fixed UTF-8 encoding issue successfully")
else:
    print("!!! Target pattern not found. Showing nearby hex for debugging...")
    # Find "ltimos" and show context
    search_term = b'ltimos 7 d'
    idx = content_bytes.find(search_term)
    if idx > 0:
        print(f"Found 'ltimos 7 d' at index {idx}")
        context = content_bytes[idx-10:idx+20]
        print(f"Hex context: {context.hex(' ')}")
        print(f"Text context: {context}")
