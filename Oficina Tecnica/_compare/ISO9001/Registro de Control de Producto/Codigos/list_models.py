
import requests
from pathlib import Path

def list_models():
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

    url = f"https://generativelanguage.googleapis.com/v1beta/models?key={api_key}"
    resp = requests.get(url)
    data = resp.json()
    if 'models' in data:
        for m in data['models']:
            print(m['name'])
    else:
        print(data)

if __name__ == "__main__":
    list_models()
