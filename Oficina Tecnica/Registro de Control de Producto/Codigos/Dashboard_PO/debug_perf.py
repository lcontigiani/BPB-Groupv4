
import time
from decimal import Decimal
import sys

# Add path to import logistics_solver
sys.path.append(r'c:\Users\Lorenzo\Desktop\Logistica\Logistica\Registro de Control de Producto\Codigos\Dashboard_PO')

from logistics_solver import Packer, Bin, Item, RotationType

def test_packing_performance(pallet_type, qty=5000):
    print(f"--- Testing {pallet_type} with {qty} items ---")
    
    packer = Packer()
    
    # Define Bin based on Pallet Type
    if pallet_type == 'collars':
        # Collars: 120x80 minus wall thickness (1.9cm each side? or total?)
        # App logic: w = 120 - 3.8 = 116.2
        # h = 10 boards * 19.5 = ~195 (Example high height)
        bin_w = Decimal('116.2')
        bin_d = Decimal('76.2')
        bin_h = Decimal('150') # Arbitrary
        bin_name = "Collars-Bin"
    else:
        # Standard Euro
        bin_w = Decimal('120')
        bin_d = Decimal('80')
        bin_h = Decimal('165') # 180 - 15
        bin_name = "Euro-Bin"
        
    main_bin = Bin(bin_name, bin_w, bin_h, bin_d, max_weight=Decimal(2000))
    packer.add_bin(main_bin)
    
    # Create Items (Standard Box 20x20x20)
    items = []
    for i in range(qty):
        items.append(Item(f"Item-{i}", Decimal(20), Decimal(20), Decimal(20), Decimal(1)))
        
    print("Starting Pack...")
    start_time = time.time()
    
    # Pack
    for it in items:
        packer.add_item(it)
        
    packer.pack(bigger_first=True)
    
    duration = time.time() - start_time
    print(f"Packed {len(packer.bins[0].items)} items.")
    print(f"Unfitted: {len(packer.unfit_items)}")
    print(f"Duration: {duration:.4f} seconds")
    print("-" * 30)

if __name__ == "__main__":
    # Test Standard first (Baseline)
    test_packing_performance('standard', qty=5000)
    
    # Test Collars (Problematic?)
    test_packing_performance('collars', qty=5000)
