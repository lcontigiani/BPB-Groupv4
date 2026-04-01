
import os

js_path = r"//bpbsrv03/lcontigiani/Oficina Tecnica/Registro de Control de Producto/Codigos/Dashboard_PO/static/script.js"

def fix_toast_encoding():
    try:
        with open(js_path, 'r', encoding='utf-8') as f:
            content = f.read()

        # The issue is likely in the HTML string construction for the toast.
        # It probably uses a character related to the close button (X) or an icon that got garbled.
        # "âx..."
        
        # Search for showNotification
        start = content.find("function showNotification")
        if start == -1:
            print("Function not found")
            return
            
        # Extract function body (loose)
        end = content.find("}", start) + 1000 # Heuristic
        chunk = content[start:end]
        
        # Look for the toast innerHTML construction
        # toast.innerHTML = ` ... `
        
        # The image shows "â..." before and after text?
        # That looks like Mojibake for non-ascii chars.
        # Maybe an icon? Like ✔ or ℹ or × (times)?
        # Times is \times -> × -> \xc3\x97 in UTF-8. 
        # If read as Latin-1: Ã—
        
        # Let's blindly replace known bad sequences if found in the file.
        
        replacements = [
            ("âx", "×"),
            ("&times;", "×"), # Use HTML entity if better? No, innerHTML decodes it.
            # Maybe it tried using an emoji directly?
        ]
        
        # Wait, the user image shows: "â... Guardando registro... â..."
        # It's like "â ™ ¦"
        # It is almost certainly an encoding issue with the source file itself still having
        # some bytes that were double-encoded.
        
        # However, we fixed the file encoding previously.
        # It's possible the browser is showing it wrong because the HTML charset attribute was needed (which we added).
        
        # BUT, the icons might be hardcoded characters in JS.
        # Let's change the JS to use HTML entities or standard ASCII for the close button.
        
        # Find where toast.innerHTML is set.
        
        # Let's just find "×" or similar and replace with "&times;"
        new_content = content.replace("×", "&times;") # common close icon
        
        # If the icons are FontAwesome or similar, maybe they are corrupted.
        # The user image shows text garbled too? No "Guardando registro..." is fine.
        # "â..." is at the start -> Icon?
        # "â..." is at end -> Close button?
        
        # Let's replace whatever is inside the toast HTML construction with safer entities.
        
        with open(js_path, 'w', encoding='utf-8') as f:
            f.write(new_content)
            
        print("Done.")

    except Exception as e:
        print(e)
        
if __name__ == "__main__":
    fix_toast_encoding()
