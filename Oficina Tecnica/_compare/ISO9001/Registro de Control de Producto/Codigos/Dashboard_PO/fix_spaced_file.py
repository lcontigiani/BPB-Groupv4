
import os
import re

files = [
    r"//bpbsrv03/lcontigiani/Oficina Tecnica/Registro de Control de Producto/Codigos/Dashboard_PO/app.py",
    # scripts.js might be corrupt too check it
    r"//bpbsrv03/lcontigiani/Oficina Tecnica/Registro de Control de Producto/Codigos/Dashboard_PO/static/script.js"
]

def is_spaced(line):
    # Heuristic: line has > 10 chars, and > 40% are spaces, and matches char-space-char-space
    if len(line.strip()) < 10: return False
    # Check simple pattern: Are ordinary alphanumeric chars followed by spaces?
    # e.g. "i m p o r t "
    if re.search(r'([a-zA-Z0-9_]\s){5,}', line):
        return True
    return False

def clean_line(line):
    # Try to grab every even char
    # "H e l l o " -> "Hello"
    # But we need to be careful about alignment. 
    # Usually it's "C h a r " or " C h a r".
    # Let's try to detect if it's 0-indexed or 1-indexed.
    
    # Try 0-indexed compression
    c0 = line[0::2]
    # Try 1-indexed compression
    c1 = line[1::2]
    
    # Simple heuristic: which one looks more like python/js?
    # if c0 has words like "import", "def", "var", "function"
    keywords = ["import", "def", "class", "return", "var", "const", "function", "if", "else", "print", "jsonify"]
    
    score0 = sum(1 for k in keywords if k in c0)
    score1 = sum(1 for k in keywords if k in c1)
    
    if score0 > score1:
        return c0
    elif score1 > score0:
        return c1
    else:
        # Fallback: Check if one has too many weird chars?
        # Default to 0?
        # If line is "  A C T I V I T Y" (2 spaces start)
        # 0: " A T V T"
        # 1: " C I I Y"
        # Hard.
        
        # Let's look at the spaces.
        # If line[1::2] are ALL spaces?
        chars0 = line[0::2]
        spaces0 = line[1::2]
        
        chars1 = line[1::2]
        spaces1 = line[0::2] # Wait, this slice logic depends on length
        
        # Check if spaces0 contains mostly spaces
        space_ratio0 = spaces0.count(' ') / max(1, len(spaces0))
        if space_ratio0 > 0.8:
            return chars0
            
        return line # Don't touch if unsure

def fix_file(fp):
    print(f"Fixing {fp}...")
    try:
        with open(fp, 'r', encoding='utf-8') as f:
            lines = f.readlines()
    except:
        print("Fail to read utf-8")
        return

    new_lines = []
    fixed_count = 0
    
    corrupt_block_started = False
    
    for line in lines:
        if is_spaced(line):
            corrupt_block_started = True
            cleaned = clean_line(line)
            # If cleaned ends with newline, keep it, else add it
            if not cleaned.endswith('\n'): cleaned += '\n'
            new_lines.append(cleaned)
            fixed_count += 1
        else:
            new_lines.append(line)
            
    if fixed_count > 0:
        print(f"  -> Fixed {fixed_count} corrupt lines.")
        with open(fp, 'w', encoding='utf-8') as f:
            f.writelines(new_lines)
    else:
        print("  -> No corrupt lines detected.")

if __name__ == "__main__":
    for f in files:
        if os.path.exists(f):
            fix_file(f)
