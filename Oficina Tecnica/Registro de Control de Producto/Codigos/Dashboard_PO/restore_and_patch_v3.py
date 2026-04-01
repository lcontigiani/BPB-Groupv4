import os

backup_file = "app.py.bak_nulls"
target_file = "app.py"

if not os.path.exists(backup_file):
    print(f"Error: {backup_file} not found.")
    exit(1)

print(f"Reading {backup_file}...")
with open(backup_file, 'rb') as f:
    content_bin = f.read()

# 1. Remove Hull Bytes
if b'\x00' in content_bin:
    print("Removing null bytes...")
    content_bin = content_bin.replace(b'\x00', b'')

# 2. Decode
try:
    content = content_bin.decode('utf-8')
except UnicodeDecodeError:
    # Fallback
    content = content_bin.decode('latin-1')

lines = content.splitlines(keepends=True)

# 3. Find the Appended Header (The Route) at the end
# The route starts with @app.route('/api/activity-update'
route_start_idx = -1
for i in range(len(lines) - 1, -1, -1):
    if "@app.route('/api/activity-update'" in lines[i]:
        route_start_idx = i
        break

if route_start_idx == -1:
    print("Warning: Route definition not found at the end. Maybe it was never appended?")
    # If not found, we might need to verify if it's elsewhere.
    # For now, let's assume if it is NOT found, we might need to add it manually.
    # But based on history, it WAS appended.
    # We will proceed checking if it is somewhere else.
    pass
else:
    print(f"Found route at line {route_start_idx}. Extracting...")

route_content = []
if route_start_idx != -1:
    route_content = lines[route_start_idx:]
    # Truncate lines to remove it from end
    lines = lines[:route_start_idx]

# 4. Clean up any trailing junk in valid lines (like duplicates of server start)
# Step 591 showed duplicate "Waitress no encontrado..." lines at the end. 
# We should be careful.
# If route_start_idx was found, we stripped the route.
# Now let's look at the NEW end of lines.
# It likely ends with `app.run(...)` or something.
# We won't try too much magic here, risk of deleting valid code.

# 5. Find Insertion Point (if __name__ == '__main__':)
insert_idx = -1
for i, line in enumerate(lines):
    if "if __name__ == '__main__':" in line:
        insert_idx = i
        break

if insert_idx != -1:
    print(f"Found insertion point at line {insert_idx}. Inserting route...")
    
    # We need to make sure we have the route content. 
    # If we didn't extract it (because it wasn't at the end), we might need to define it.
    if not route_content:
        # Check if it exists elsewhere
        exists = any("@app.route('/api/activity-update'" in l for l in lines)
        if exists:
            print("Route already exists in file. No insertion needed.")
        else:
            print("Injecting route from scratch (should not happen if backup is correct).")
            # We fail safe here or read from patch_app_update.py?
            # Let's read from patch_app_update.py just in case
            if os.path.exists("patch_app_update.py"):
                 with open("patch_app_update.py", "r", encoding="utf-8") as f:
                     route_content = f.readlines()
            else:
                 print("Critical: Could not find route code source.")
    
    if route_content:
        # Insert
        # Ensure newlines
        lines_to_insert = ["\n", "\n"] + route_content + ["\n", "\n"]
        lines[insert_idx:insert_idx] = lines_to_insert
        print("Route inserted successfully.")

else:
    print("Error: Could not find 'if __name__ == '__main__':' block.")
    # If we can't find main, the file is weird. But we should save anyway to fix nulls?
    
# 6. Write to app.py
print(f"Writing to {target_file}...")
with open(target_file, 'w', encoding='utf-8') as f:
    f.writelines(lines)

print("Done.")
