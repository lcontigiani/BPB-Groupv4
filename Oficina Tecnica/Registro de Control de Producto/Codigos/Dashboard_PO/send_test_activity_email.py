
import json
import uuid
import datetime
from pathlib import Path

# Configuration
# Adjust strictly to your server path
ACTIVITY_BASE_PATH = Path(r"//BPBSRV03/lcontigiani/Oficina Tecnica/Registro de Actividad/Codigos")
ACTIVITY_STATE_FILE = ACTIVITY_BASE_PATH / "data/activity_mailer_state.json"

TARGET_EMAIL = "lcontigiani@bpbargentina.com"

def send_test_email():
    print(f"--- Sending TEST Activity Email to {TARGET_EMAIL} ---")
    
    if not ACTIVITY_STATE_FILE.exists():
        print(f"ERROR: State file not found at {ACTIVITY_STATE_FILE}")
        return

    try:
        with open(ACTIVITY_STATE_FILE, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        campaigns = data.get('campaigns', [])
        today_str = datetime.date.today().strftime("%Y-%m-%d")
        
        # Check if campaign already exists for today
        target_camp = None
        for camp in campaigns:
            if camp.get('date') == today_str:
                target_camp = camp
                break
        
        if target_camp:
            print(f"Campaign for {today_str} already exists.")
            # Add user if not present
            if TARGET_EMAIL not in target_camp.get('recipients', []):
                target_camp['recipients'].append(TARGET_EMAIL)
                print(f"Added {TARGET_EMAIL} to recipients.")
            else:
                print(f"{TARGET_EMAIL} is already in recipients.")
        else:
            print(f"Creating NEW campaign for {today_str}.")
            new_camp = {
                "date": today_str,
                "sent_at": datetime.datetime.now().strftime("%Y-%m-%dT%H:%M:%S"),
                "subject": f"Registro de Actividad Diario {datetime.date.today().strftime('%d/%m/%y')}",
                "token": str(uuid.uuid4())[:8],
                "recipients": [TARGET_EMAIL],
                "responses": {}
            }
            # Insert at beginning (newest first)
            data['campaigns'].insert(0, new_camp)
            print("Campaign created.")

        # Save
        with open(ACTIVITY_STATE_FILE, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        
        print("SUCCESS: State file updated.")
        
    except Exception as e:
        print(f"ERROR: {e}")

if __name__ == "__main__":
    send_test_email()
