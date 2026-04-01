import os

file_path = "app.py"

if os.path.exists(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    # Find where the MAIN block start
    start_index = -1
    for i, line in enumerate(lines):
        if "if __name__ == '__main__':" in line:
            start_index = i
            break
    
    # Find where the new route logic begins (it was moved to ~5831)
    route_index = -1
    for i, line in enumerate(lines):
        if "@app.route('/api/activity-update'" in line:
            route_index = i
            break
            
    # We want route_index < start_index. 
    # Current state: start_index (~5811) < route_index (~5831).
    
    if start_index != -1 and route_index != -1 and route_index > start_index:
        print(f"Found Main Block at {start_index} and Route at {route_index}. Moving Route ABOVE Main...")
        
        # Identify the end of the route function. It goes until end of file usually, or until next function.
        # Since it's at the end or close to it, we can assume it goes until the end.
        # But wait, lines 6150+ in previous view showed the server start code *after* the open_browser definition? 
        # Actually my previous view_file was lines 5800-5850. The file has 6254 lines.
        # This means the route is inserted in the MIDDLE of main block or something?
        
        # Let's read the whole file content logically.
        # I will extract the route block specifically.
        
        route_lines = []
        # Consume from route_index until end of function (empty line or next dedent?)
        # Since I know I appended it, it's likely a contiguous block.
        # Let's count how many lines it is.
        # It ends at line ~5920 (based on length).
        
        # Actually, let's just grab everything from route_index to the end of the route function.
        # How do I know where it ends? it ends when the logic ends. 
        # In the previous view, it went from 6165 to 6254 (89 lines).
        # So I will grab 90 lines.
        
        route_block = lines[route_index:route_index+95] # Safe margin
        
        # The lines that ARE NOT the route
        other_lines = lines[:route_index] + lines[route_index+95:]
        
        # Now I need to insert route_block before start_index in `other_lines`.
        # But `start_index` was calculated on original `lines`.
        # I need to recalculate or just work with the original split.
        
        top_part = lines[:start_index]
        bottom_part_including_route = lines[start_index:]
        
        # Remove route from bottom part
        # relative route index
        rel_route_idx = route_index - start_index
        
        bottom_clean = bottom_part_including_route[:rel_route_idx] + bottom_part_including_route[rel_route_idx+95:]
        
        # Assemble
        new_content_lines = top_part + route_block + bottom_clean
        
        new_content = "".join(new_content_lines)
        
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(new_content)
            
        print("Fixed app.py reordering (v2).")
        
    else:
        print("Conditions not met for reorder v2.")
        print(f"Main: {start_index}, Route: {route_index}")

else:
    print("app.py not found")
