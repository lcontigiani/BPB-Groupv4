
import json
from pathlib import Path
from datetime import datetime, timedelta

# Config paths
ACTIVITY_BASE_PATH = Path(r"//BPBSRV03/lcontigiani/Oficina Tecnica/Registro de Actividad/Codigos")
ACTIVITY_STATE_FILE = ACTIVITY_BASE_PATH / "data/activity_mailer_state.json"

# Mimic app.py exactly
def check_app_logic(user_email_session):
    print(f"\n--- Checking for user: '{user_email_session}' ---")
    
    # 1. Resolve logic mimicking app.py
    # We assume we don't need to read users.json because we want to test IF the resolved string works
    # But let's replicate the strip/lower
    user_email = user_email_session.strip().lower()
    print(f"Normalized User Email: '{user_email}'")

    if not ACTIVITY_STATE_FILE.exists():
        print("State file not found")
        return

    with open(ACTIVITY_STATE_FILE, 'r', encoding='utf-8') as f:
        state = json.load(f)

    campaigns = state.get('campaigns', [])
    today = datetime.now().date()
    
    pending = []

    for idx, camp in enumerate(campaigns):
        camp_date = camp.get('date')
        show_camp = False
        try:
            if camp_date:
                d_obj = datetime.strptime(camp_date, '%Y-%m-%d').date()
                
                # 3 Working Days Filter
                wdays = 0
                curr = d_obj
                while curr < today:
                        curr += timedelta(days=1)
                        if curr.weekday() < 5:
                            wdays += 1
                
                if wdays < 3:
                    show_camp = True
        except Exception as e:
            print(f"Date error: {e}")
            pass
        
        if not show_camp:
            # print(f"Campaign {camp_date} skipped (date filter)")
            continue

        responses = camp.get('responses', {})
        
        # Check if user is in recipients list
        recipients = [r.strip().lower() for r in camp.get('recipients', [])]
        
        if user_email not in recipients:
            # print(f"Campaign {camp_date} skipped (email '{user_email}' not in {recipients})")
            # If this is the campaign from today, print detailed info
            if camp_date == "2026-01-22":
                print(f"!! TARGET CAMPAIGN SKIPPED !!")
                print(f"   Recipients: {recipients}")
                print(f"   User Email: '{user_email}'")
                print(f"   Match result: {user_email in recipients}")
            continue

        if any(email_key.strip().lower() == user_email for email_key in responses):
            print(f"Campaign {camp_date} skipped (already responded)")
            continue

        print(f"FOUND PENDING: {camp_date} - {camp.get('subject')}")
        pending.append(camp)

    print(f"Total Pending: {len(pending)}")

# Test with both possibilities
check_app_logic("lcontigiani@bpbargentina.com")
check_app_logic("lcontigiani")
