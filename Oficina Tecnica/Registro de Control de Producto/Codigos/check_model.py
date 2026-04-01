
import requests
import os

api_key = "test_key" # I don't need a real key to check if the model name is valid 404 vs 401
# Actually 400 or 404 usually if model not found. 
# But I can't really test without a key properly. 
# I will check the file gemini.key to see if I can use it (I shouldn't output it).
# The code reads it from gemini.key.

def check_model(model_name):
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key=INVALID_KEY"
    resp = requests.post(url, json={"contents": [{"parts": [{"text": "hi"}]}]})
    print(f"Model {model_name}: Status {resp.status_code}")
    # If 404: resource not found (model likely wrong)
    # If 400: invalid key (model likely found but key rejected)
    
check_model("gemini-2.5-flash")
check_model("gemini-1.5-flash")
