
import os
import re
import json
import logging
from pathlib import Path
import requests

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

    print(f"Key found: {api_key[:4]}***")

    # Mock content
    prompt = "Return JSON: {\"items\": [{\"code\": \"TEST-CODE\", \"po\": \"12345\"}]}"
    
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={api_key}"
    payload = {"contents": [{"parts": [{"text": prompt}]}]}
    
    try:
        resp = requests.post(url, json=payload, timeout=30)
        print(f"Status: {resp.status_code}")
        if resp.status_code == 200:
            print("Response:", resp.text[:200])
            print("SUCCESS: Model reachable and working.")
        else:
            print("FAIL: API Error", resp.text)
    except Exception as e:
        print(f"FAIL: Exception {e}")

if __name__ == "__main__":
    verify()
