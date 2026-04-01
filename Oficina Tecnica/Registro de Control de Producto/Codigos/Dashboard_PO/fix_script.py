
import os

file_path = r"//bpbsrv03/lcontigiani/Oficina Tecnica/Registro de Control de Producto/Codigos/Dashboard_PO/static/script.js"

def fix_file():
    content = ""
    encoding_used = 'utf-8'
    
    # Read
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
    except UnicodeDecodeError:
        print("UTF-8 failed, trying latin-1")
        try:
            with open(file_path, 'r', encoding='latin-1') as f:
                content = f.read()
            encoding_used = 'latin-1'
        except Exception as e:
            print(f"Failed to read file: {e}")
            return

    # Fix 1: Wrong selector in appended code
    old_selector = "document.querySelector('#results-table tbody')"
    new_selector = "document.querySelector('#po-table tbody')"
    
    if old_selector in content:
        content = content.replace(old_selector, new_selector)
        print("Fixed table selector.")
    else:
        print("Selector not found (maybe already fixed).")

    # Fix 2: Hook up the function call
    # We want to call loadPendingActivities() at the end of renderPOList
    # Look for the end of renderPOList. It ends with a '}'
    # But that's hard to find uniquely.
    # Let's simple call it inside renderPOList, maybe at the beginning?
    # No, if we call it at the beginning, renderPOList will clear the table later.
    # We need to call it AFTER table is populated.
    # renderPOList iterates data.forEach... 
    # Let's look for the closing brace of renderPOList.
    # Or easier: Find where renderPOList is DEFINED, and add the call at the end of the function body.
    # Since regex is hard without viewing, let's just Append the call to the fetch success in fetchData?
    # No, renderPOList is called in multiple places (filtering).
    
    # Better hook: Inside renderPOList, find `tbody.innerHTML = '';` and append/replace logic?
    # No. 
    # Let's try to match: "function renderPOList(data) {" 
    # and verify if we can insert it at the end? 
    # Actually, the appended code uses `window._pendingActivities`.
    # Let's change `renderPOList` signature or body.
    
    # Let's look for a known unique string near the end of renderPOList.
    # Based on previous `read` output, `renderPOList` does `tbody.innerHTML = '';` then loops.
    # We probably can't robustly parse the end of the function without viewing it.
    # HOWEVER, we can stick the call in `loadDashboardData` or `fetchData` right after `renderPOList(allData)` is called.
    
    # In `fetchData`:
    # renderPOList(allData);
    # loadPendingActivities(); (We need to add this)
    
    target_call = "renderPOList(allData);"
    insertion = "renderPOList(allData);\n        if(typeof loadPendingActivities === 'function') { loadPendingActivities(); }"
    
    if target_call in content:
        # Check if already added
        if "if(typeof loadPendingActivities === 'function')" not in content:
            content = content.replace(target_call, insertion)
            print("Injected loadPendingActivities call.")
    
    # Write back
    try:
        with open(file_path, 'w', encoding=encoding_used) as f:
            f.write(content)
        print("File saved successfully.")
    except Exception as e:
        print(f"Error writing file: {e}")

if __name__ == "__main__":
    fix_file()
