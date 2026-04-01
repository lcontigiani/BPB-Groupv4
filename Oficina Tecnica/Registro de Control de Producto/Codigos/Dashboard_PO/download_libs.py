import os
import requests

LIBS_DIR = os.path.join(os.getcwd(), 'static', 'libs')
os.makedirs(LIBS_DIR, exist_ok=True)

URLS = {
    "three.min.js": "https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js",
    "OrbitControls.js": "https://unpkg.com/three@0.128.0/examples/js/controls/OrbitControls.js"
}

def download_file(url, filename):
    path = os.path.join(LIBS_DIR, filename)
    print(f"Downloading {filename}...")
    try:
        r = requests.get(url, timeout=10)
        if r.status_code == 200:
            with open(path, 'wb') as f:
                f.write(r.content)
            print(f"Saved to {path}")
        else:
            print(f"Failed to download {filename}: {r.status_code}")
    except Exception as e:
        print(f"Error downloading {filename}: {e}")

if __name__ == "__main__":
    for name, url in URLS.items():
        download_file(url, name)
