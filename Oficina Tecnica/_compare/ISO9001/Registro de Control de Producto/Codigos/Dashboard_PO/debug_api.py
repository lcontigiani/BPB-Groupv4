import requests
import json

try:
    print("Fetching /api/data...")
    res = requests.get("http://127.0.0.1:5000/api/data")
    data = res.json()
    
    print(f"Total POs: {len(data)}")
    
    po1053 = next((p for p in data if p["id"] == "PO1053"), None)
    
    if po1053:
        print("PO1053 Found!")
        pdfs = po1053.get("files", {}).get("pdfs", [])
        print(f"PDF Count: {len(pdfs)}")
        if len(pdfs) > 0:
            print("First 3 PDFs:")
            for p in pdfs[:3]:
                print(f"- {p}")
        else:
            print("PDF List is EMPTY.")
            
        csvs = po1053.get("files", {}).get("csvs", [])
        print(f"CSV Count: {len(csvs)}")
        
    else:
        print("PO1053 NOT FOUND in logic.")

except Exception as e:
    print(f"Error: {e}")
