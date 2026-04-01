
import requests

def check_model(model_name):
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key=INVALID_KEY"
    resp = requests.post(url, json={"contents": [{"parts": [{"text": "hi"}]}]})
    print(f"Model {model_name}: Status {resp.status_code}")

check_model("gemini-9.9-unicorn")
