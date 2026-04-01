from logistics_solver import Packer, Bin, Item
import time

def test_packing():
    print("--- 3D Bin Packing Test ---")
    start_time = time.time()

    packer = Packer()

    # Define Bin (e.g., 20ft Standard Container)
    # Inner dimensions approx: 5898mm x 2352mm x 2393mm
    # Converted to cm: 590 x 235 x 239
    # Max weight: 28000 kg
    bin_name = "20ft Container"
    packer.add_bin(Bin(bin_name, 590, 235, 239, 28000))

    # Define Items
    # Adding a mix of items
    
    # 50 boxes of Type A (50x30x20 cm, 10kg)
    for i in range(50):
        packer.add_item(Item('Box-TypeA', 50, 30, 20, 10))
    
    # 20 boxes of Type B (100x50x50 cm, 50kg)
    for i in range(20):
        packer.add_item(Item('Box-TypeB', 100, 50, 50, 50))
        
    # 5 large crates Type C (120x80x100 cm, 200kg)
    for i in range(5):
        packer.add_item(Item('Crate-TypeC', 120, 80, 100, 200))

    # Run Packer
    print("Packing items...")
    packer.pack(bigger_first=True)

    # Output Results
    for b in packer.bins:
        print(f"\nBin: {b.name}")
        print(f"Packed Items: {len(b.items)}")
        print(f"Total Weight: {b.get_total_weight()} / {b.max_weight}")
        print(f"Volume Efficiency: {float(sum([i.get_volume() for i in b.items])) / float(b.get_volume()) * 100:.2f}%")
        
        print("Sample Packed Items:")
        for i, item in enumerate(b.items[:5]): # Show first 5
            print(f" - {item.string()}")

    print(f"\nUnfitted Items: {len(packer.unfit_items)}")
    print(f"Total Time: {time.time() - start_time:.4f}s")
    print("---------------------------")

if __name__ == "__main__":
    test_packing()
