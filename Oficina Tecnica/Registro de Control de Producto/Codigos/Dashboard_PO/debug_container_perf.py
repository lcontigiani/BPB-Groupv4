
import time
import sys
from decimal import Decimal

# Add path to import logistics_solver
sys.path.append(r'c:\Users\Lorenzo\Desktop\Logistica\Logistica\Registro de Control de Producto\Codigos\Dashboard_PO')

from logistics_solver import Packer, Bin, Item

def test_container_fill(pallet_type, total_items_qty=10000):
    print(f"\n--- Testing Full Container Fill: {pallet_type} ---")
    
    packer = Packer()
    
    # Define Bin Factory
    if pallet_type == 'collars':
        # 116.2 x 76.2 x 150 (Approx 3 layers of 20 high?)
        # Let's say fits ~100 items
        w, d, h = Decimal('116.2'), Decimal('76.2'), Decimal('100')
        def bin_factory():
            return Bin("Collars", w, h, d, Decimal(2000))
    else:
        # 120 x 80 x 165
        w, d, h = Decimal('120'), Decimal('80'), Decimal('150')
        def bin_factory():
            return Bin("Euro", w, h, d, Decimal(2000))

    # Create Items
    items = []
    # 20x20x20 items
    for i in range(total_items_qty):
        items.append(Item(f"Itm-{i}", Decimal(20), Decimal(20), Decimal(20), Decimal(1)))
        
    print(f"Items to Pack: {len(items)}")
    
    start_time = time.time()
    
    # Use pack_to_many_bins
    # We need to simulate the app logic where we keep creating bins until items are done
    # But usually we have a limit (Container Capacity). 
    # For Maximization, allow infinite bins (we want to see speed).
    
    try:
        bins = packer.pack_to_many_bins(bin_factory, items, sort_items=True)
        duration = time.time() - start_time
        
        print(f"Generated {len(bins)} Pallets.")
        print(f"Time: {duration:.4f}s")
        if duration > 0:
            print(f"Avg Time per Pallet: {duration/len(bins):.4f}s")
    except KeyboardInterrupt:
        print("Interrupted!")

if __name__ == "__main__":
    # Test Standard
    test_container_fill('standard', total_items_qty=5000)
    
    # Test Collars
    test_container_fill('collars', total_items_qty=5000)
