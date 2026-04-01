from PIL import Image
from collections import Counter

def get_dominant_color(image_path):
    try:
        img = Image.open(image_path)
        img = img.convert("RGBA")
        width, height = img.size
        
        # Sample center pixels or just generic red search
        colors = []
        for x in range(0, width, 10):
            for y in range(0, height, 10):
                r, g, b, a = img.getpixel((x, y))
                if a > 0: # Ignore transparent
                    # Filter for Reddish colors
                    if r > 150 and g < 100 and b < 100:
                        colors.append((r, g, b))
        
        if not colors:
            print("No significant red found.")
            return

        most_common = Counter(colors).most_common(1)[0][0]
        print(f"Dominant Red: #{most_common[0]:02x}{most_common[1]:02x}{most_common[2]:02x}")

    except Exception as e:
        print(f"Error: {e}")

image_path = r"\\bpbsrv03\lcontigiani\Oficina Tecnica\Registro de Control de Producto\Codigos\Dashboard_PO\Recursos B&P\ISO\SF_ISO - BPB.png"
get_dominant_color(image_path)
