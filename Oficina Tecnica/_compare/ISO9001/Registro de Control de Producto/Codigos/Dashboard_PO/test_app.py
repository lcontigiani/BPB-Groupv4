import os
# Set environment variable BEFORE importing app to avoid network timeout
os.environ['FLASK_TEST_MODE'] = 'true'

import unittest
import json
import shutil
from pathlib import Path
from app import app, MOCK_PATH

class DashboardTestCase(unittest.TestCase):
    def setUp(self):
        self.app = app.test_client()
        self.app.testing = True
        
        # Ensure mock data exists and is clean for testing
        if MOCK_PATH.exists():
            shutil.rmtree(MOCK_PATH)
        
        # Run the generation script logic manually or import it
        # Importing locally to avoid issues
        import generate_mock_data
        generate_mock_data.create_mock_data()

    def test_get_data(self):
        response = self.app.get('/api/data')
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertTrue(len(data) > 0)
        print(f"Verified GET /api/data: Found {len(data)} POs")

    def test_update_data(self):
        # Get a PO ID to test with
        response = self.app.get('/api/data')
        data = json.loads(response.data)
        target_po = data[0]
        po_id = target_po['id']
        
        # Helper to get current value
        current_val = target_po['content']['json'].get('supplier')
        new_val = "Updated Supplier Test"
        
        print(f"Testing update for {po_id}: Changing '{current_val}' to '{new_val}'")
        
        # Send Update
        response = self.app.post('/api/update', 
            data=json.dumps({
                'po_id': po_id, 
                'field': 'supplier', 
                'value': new_val
            }),
            content_type='application/json'
        )
        self.assertEqual(response.status_code, 200)
        result = json.loads(response.data)
        self.assertEqual(result['status'], 'success')
        
        # Verify persistence
        response = self.app.get('/api/data')
        data = json.loads(response.data)
        updated_po = next(p for p in data if p['id'] == po_id)
        self.assertEqual(updated_po['content']['json']['supplier'], new_val)
        print("Verified persistence of update.")

if __name__ == '__main__':
    unittest.main()
