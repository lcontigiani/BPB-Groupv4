try:
    import openpyxl
    print("openpyxl is installed location:", openpyxl.__file__)
except ImportError as e:
    print("openpyxl is NOT installed:", e)

try:
    import shutil
    print("shutil ok")
except:
    print("shutil missing")
