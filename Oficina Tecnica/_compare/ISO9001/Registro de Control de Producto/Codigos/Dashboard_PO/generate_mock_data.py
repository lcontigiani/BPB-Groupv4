import os
import csv
import json
import random
from pathlib import Path

# Configuration
BASE_DIR = Path("mock_data")
NUM_FOLDERS = 5

def create_mock_data():
    if not BASE_DIR.exists():
        BASE_DIR.mkdir()

    for i in range(1, NUM_FOLDERS + 1):
        po_number = f"PO{1290 + i}"
        folder_path = BASE_DIR / f"{po_number} Ejemplo"
        if not folder_path.exists():
            folder_path.mkdir(exist_ok=True)
            
        print(f"Creating mock data for {po_number}...")

        # 1. Create Dummy PDFs with Naming Convention
        # Structure: (PO{number}-)Name(-Rev {Letter})
        pdf_names = [
            f"({po_number}-)Part A-Inspection(-Rev A).pdf",
            f"({po_number}-)Part B-Drawing(-Rev B).pdf",
            f"({po_number}-)Final Report.pdf" 
        ]
        
        for p_name in pdf_names:
            pdf_path = folder_path / p_name
            with open(pdf_path, 'wb') as f:
                f.write(b"%PDF-1.4 mock content")
            
            # Create matching CSV for "Datos de Registro" in ROOT folder
            base_name = p_name.rsplit('.', 1)[0]
            csv_path = folder_path / f"{base_name}.csv"
            with open(csv_path, 'w', newline='') as f:
                writer = csv.writer(f)
                writer.writerow(["Control Parameter", "Value", "Tolerance", "Result"])
                writer.writerow(["Diameter", f"{random.uniform(10.0, 10.5):.2f}", "+/- 0.5", "OK"])
                writer.writerow(["Length", f"{random.uniform(100, 101):.1f}", "+/- 1.0", "OK"])
                writer.writerow(["Hardness", "45 HRC", "Min 40", "OK"])

        # 2. Main PO CSV (optional or keep as summary)
        csv_path = folder_path / f"data_{po_number}.csv"
        with open(csv_path, 'w', newline='') as f:
            writer = csv.writer(f)
            writer.writerow(["Item", "Quantity", "Description", "Status"])
            writer.writerow(["A-101", random.randint(10, 100), "Steel Pipe", "Pending"])
            writer.writerow(["B-202", random.randint(5, 50), "Flange", "Delivered"])

        # 3. Create JSON
        json_path = folder_path / f"info_{po_number}.json"
        data = {
            "supplier": f"Supplier {random.choice(['A', 'B', 'C'])}",
            "date": f"2025-01-{random.randint(10, 31)}",
            "total_cost": random.randint(1000, 5000),
            "approved": random.choice([True, False]),
            "notes": "Please verify before shipping."
        }
        with open(json_path, 'w') as f:
            json.dump(data, f, indent=4)

if __name__ == "__main__":
    create_mock_data()
    print("Mock data generated successfully in 'mock_data' folder.")
