
import json
import os
from pathlib import Path

path = Path(r"//BPBSRV03/lcontigiani/Oficina Tecnica/Registro de Actividad/Codigos/data/activity_mailer_state.json")

print(f"Reading {path}")
try:
    with open(path, 'r', encoding='utf-8') as f:
        data = json.load(f)
        
    campaigns = data.get('campaigns', [])
    print(f"Found {len(campaigns)} campaigns.")
    
    found = False
    new_campaigns = []
    
    for c in campaigns:
        d = c.get('date')
        print(f" - {d} (Sent: {c.get('sent_at')})")
        if d == "2026-01-20":
            print("   -> FOUND TARGET DATE! Removing this entry.")
            found = True
            continue 
            
        # Also check for "20/01/2026" just in case format is weird
        if d == "20/01/2026":
            print("   -> FOUND TARGET DATE (Slash format)! Removing.")
            found = True
            continue
            
        new_campaigns.append(c)
        
    if found:
        data['campaigns'] = new_campaigns
        with open(path, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        print("File updated. Entry removed.")
    else:
        print("Target date NOT found in campaigns.")

except Exception as e:
    print(f"Error: {e}")
