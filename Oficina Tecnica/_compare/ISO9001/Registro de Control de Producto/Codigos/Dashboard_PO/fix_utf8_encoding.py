import codecs

path = r"\\bpbsrv03\lcontigiani\Oficina Tecnica\Registro de Control de Producto\Codigos\Dashboard_PO\static\script.js"

print(f"Reading {path}...")
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

print("Replacing text...")
new_content = content.replace('Ãltimos', 'Últimos')

print("Writing back...")
with open(path, 'w', encoding='utf-8') as f:
    f.write(new_content)

print("✓ Fixed UTF-8 encoding issue")
