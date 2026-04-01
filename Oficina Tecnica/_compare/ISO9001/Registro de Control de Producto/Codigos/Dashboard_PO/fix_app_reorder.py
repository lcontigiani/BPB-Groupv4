import os

file_path = "app.py"

if os.path.exists(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    # Find where the server start block begins
    start_index = -1
    for i, line in enumerate(lines):
        if "Timer(1.5, open_browser).start()" in line:
            start_index = i
            break
    
    # Find where the new route logic begins (at the end)
    route_index = -1
    for i, line in enumerate(lines):
        if "@app.route('/api/activity-update'" in line:
            route_index = i
            break
            
    if start_index != -1 and route_index != -1 and route_index > start_index:
        print(f"Found Server Start at {start_index} and Route at {route_index}. Moving...")
        
        # Extract route lines
        route_lines = lines[route_index:]
        
        # Extract main block lines (from start_index up to route_index)
        main_block_lines = lines[start_index:route_index]
        
        # Extract top lines
        top_lines = lines[:start_index]
        
        # Reasemble: Top + Route + Main
        new_content = "".join(top_lines + route_lines + main_block_lines)
        
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(new_content)
            
        print("Reordered app.py successfully.")
        
    else:
        print("Could not find patterns or route is already before server start.")
        print(f"Start: {start_index}, Route: {route_index}")

else:
    print("app.py not found")
