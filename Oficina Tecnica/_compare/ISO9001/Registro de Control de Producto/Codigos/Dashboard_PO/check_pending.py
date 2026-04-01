
import json
from pathlib import Path

# Configurate paths exactly as app.py
ACTIVITY_BASE_PATH = Path(r"//BPBSRV03/lcontigiani/Oficina Tecnica/Registro de Actividad/Codigos")
ACTIVITY_STATE_FILE = ACTIVITY_BASE_PATH / "data/activity_mailer_state.json"

USER_EMAIL = "lcontigiani" # Simulate session username without @

print(f"Checking pending for: {USER_EMAIL}")
print(f"File: {ACTIVITY_STATE_FILE}")

if not ACTIVITY_STATE_FILE.exists():
    print("ERROR: File does not exist!")
    exit()

try:
    with open(ACTIVITY_STATE_FILE, 'r', encoding='utf-8') as f:
        state = json.load(f)

    campaigns = state.get('campaigns', [])
    pending_count = 0

    for camp in campaigns:
        date = camp.get('date')
        token = camp.get('token')
        
        # 1. Check Sent
        if not camp.get('sent_at'):
            continue

        # 2. Check Recipient
        is_recipient = False
        recipients = camp.get('recipients', [])
        for r in recipients:
            target_r = ""
            if isinstance(r, str):
                target_r = r.strip().lower()
            elif isinstance(r, dict):
                target_r = r.get('email', '').strip().lower()
            
            if target_r:
                # Match full email OR username part (handle lcontigiani vs lcontigiani@bpb...)
                if target_r == USER_EMAIL or target_r.split('@')[0] == USER_EMAIL.split('@')[0]:
                    is_recipient = True
                    break
        
        if not is_recipient:
            continue

        # 3. Check Response
        responses = camp.get('responses', {})
        user_responded = False
        for email_key in responses:
            key_email = email_key.strip().lower()
            if key_email == USER_EMAIL or key_email.split('@')[0] == USER_EMAIL.split('@')[0]:
                user_responded = True
                break
        
        if not user_responded:
            print(f" [PENDING] Date: {date} | Token: {token}")
            pending_count += 1
        else:
            # print(f" [DONE]    Date: {date}")
            pass

    print(f"Total Pending Found: {pending_count}")

except Exception as e:
    print(f"Error: {e}")
