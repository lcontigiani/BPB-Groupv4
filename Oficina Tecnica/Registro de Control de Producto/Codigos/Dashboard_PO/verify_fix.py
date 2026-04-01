
import time
import sys
from decimal import Decimal

# Add path to import app logic
sys.path.append(r'c:\Users\Lorenzo\Desktop\Logistica\Logistica\Registro de Control de Producto\Codigos\Dashboard_PO')

from app import _do_pack_internal

def verify_performance():
    print("--- Verifying 'Collars' Single Pallet Maximization ---")
    
    # Simulate Request Data
    # 1. Container: None (Single Pallet Mode)
    container_data = {}
    
    # 2. Items: 10,000 small items (which caused the slowness)
    items_data = [{
        'id': 'Box-Small',
        'w': 20, 'h': 20, 'd': 20,
        'weight': 1,
        'qty': 10000 
    }]
    
    # 3. Config: Collars, Maximize=True
    config = {
        'pallet_type': 'collars',
        'container_type': 'none',
        'maximize': True,
        'boards_count': 4,
        'safety_factor_dims': 0,
        'safety_factor_weight': 0
    }
    
    print("Starting Optimization Test...")
    start_time = time.time()
    
    try:
        # Call the internal function directly
        result = _do_pack_internal(container_data, items_data, config)
        
        duration = time.time() - start_time
        print(f"Total Duration: {duration:.4f} seconds")
        
        # Analyze Result (if readable)
        # _do_pack_internal returns (packed_top_level, unfitted_final, result_bin)
        packed, unfitted, bin_res = result
        
        print(f"Packed Items: {len(packed)}")
        print(f"Unfitted Items: {len(unfitted)}")
        if len(unfitted) > 8000:
             print("FAILURE: Unfitted count is still huge (Optimization Cap didn't work?)")
        else:
             print("SUCCESS: Unfitted count is reasonable (Cap likely applied).")
             
    except Exception as e:
        print(f"Error during test: {e}")

if __name__ == "__main__":
    verify_performance()
