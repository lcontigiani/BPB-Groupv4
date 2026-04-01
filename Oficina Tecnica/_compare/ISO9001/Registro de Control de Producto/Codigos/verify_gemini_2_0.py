
import os
import requests
from pathlib import Path

def verify():
    # Load Key
    api_key = None
    here = Path(".")
    for name in ("gemini.key", "gemini.key.txt"):
        pth = here / name
        if pth.exists():
            api_key = pth.read_text("utf-8").strip()
            break
            
    if not api_key:
        print("FAIL: No API Key found.")
        return

    # Use 2.0-flash
    model = "gemini-2.0-flash"
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"
    prompt = "Return JSON: {\"items\": [{\"code\": \"TEST\", \"po\": \"123\"}]}"
    payload = {"contents": [{"parts": [{"text": prompt}]}]}
    
    try:
        resp = requests.post(url, json=payload, timeout=30)
        print(f"Model: {model} Status: {resp.status_code}")
        if resp.status_code == 200:
            print("Response:", resp.text[:200])
        else:
            print("Error:", resp.text)
    except Exception as e:
        print(f"Exception: {e}")

if __name__ == "__main__":
    verify()
