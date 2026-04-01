
path = r"//bpbsrv03/lcontigiani/Oficina Tecnica/Registro de Control de Producto/Codigos/Dashboard_PO/static/script.js"
search_term = "Historial Personal"

try:
    with open(path, 'r', encoding='utf-8') as f:
        for i, line in enumerate(f, 1):
            if search_term in line:
                print(f"Found at line {i}: {line.strip()}")
except Exception as e:
    print(f"Error: {e}")
