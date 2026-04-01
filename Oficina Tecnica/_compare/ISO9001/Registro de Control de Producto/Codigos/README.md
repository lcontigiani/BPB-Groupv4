
# Registros Automaticos

Automatiza el procesamiento de planos PDF que llegan a `Registros/`, extrae datos clave (codigos de producto, ordenes de compra y, si es posible, cotas), copia los archivos de referencia y actualiza un Excel de registro en carpetas por producto bajo `Registro {fecha}`.

## Estructura creada
- `Registros/`: carpeta de entrada para los PDF a vigilar.
- `in process/` y `failed/`: destino para PDF procesados o con errores.
- `automation.py`: script principal.
- `config.yaml`: rutas y patrones configurables.
- `requirements.txt`: dependencias Python (pdfplumber, openpyxl, pyyaml, opcionalmente openai; watchdog se usaria si se agrega watch por eventos).

## Configuracion rapida
1) Ajusta `config.yaml` con rutas absolutas o relativas:
   - `product_pdf_dir`: carpeta de planos base; se buscan como `PO{OC}-*-Rev.{letra}` y se elige la revision mas alta.
   - `register_root_dir`: raiz donde viven los registros `R016-01*.xlsx`. Se escanean hasta encontrar uno con el codigo en la columna B.
   - `register_excel`: si defines una ruta fija, se usa directamente y se omite la busqueda.
   - `aux_excel`: no usado por ahora (dejalo vacio).
   - Patrones `product_code_patterns` y `order_patterns` para reconocer datos en el PDF.
   - Columnas en `register_columns` para mapear los encabezados del Excel; `code_column` es B=2.
   - `pdf_parsing.max_products`: limita cantidad de codigos procesados por PDF (0 sin limite).
   - `pdf_parsing.ocr_enabled`: true para usar OCR (Tesseract) cuando el PDF no tiene capa de texto.
   - `pdf_parsing.tesseract_cmd`: deja vacio si Tesseract esta en PATH; si no, pon la ruta a `tesseract.exe`.
2) Instala dependencias: `python -m pip install -r requirements.txt`.
3) Ejecuta una corrida unica: `python automation.py --once`.
   - O deja la vigilancia activa: `python automation.py --watch`.

## Funcionamiento
- Cada PDF nuevo en `Registros/` se procesa y se mueve a `in process/` o `failed/`.
- Se crea una carpeta `Registro yyyy-mm-dd HHMMSS/` por lote. Dentro, una subcarpeta por codigo de producto con:
  - Copia del PDF entrante.
  - Copia del Excel de registro encontrado en `register_root_dir` (o el fijo), ya actualizado con codigo y OC, dejando notas con las cotas extraidas si las hay.
  - Copia del PDF base del producto si se encuentra en `product_pdf_dir` (se elige la revision mas alta).
  - `notes.txt` con las decisiones tomadas y cualquier falta de datos.
- Si `openai.enabled` esta en `true` y hay `OPENAI_API_KEY`, se usa la API para afinar la extraccion de datos del PDF.
- Si `ocr_enabled` esta en `true`, se usa Tesseract sobre las paginas iniciales cuando no hay texto extraible.

## Limitaciones y ajustes pendientes
- Las cotas o revisiones dependen del texto disponible en el PDF; para planos vectoriales complejos puede requerir ajustar patrones o activar la capa OpenAI.
- El mapeo de columnas del Excel debe alinearse con tu hoja: ajusta `register_columns.sheet_name`, `code_column` y los nombres en `headers`. Actualmente se rellenan OC y notas; las demas cotas especificas deben mapearse manualmente a columnas con nombres conocidos.
- La busqueda de registros abre los Excel `R016-01*.xlsx` hasta encontrar el codigo en la columna B; puede demorar si hay muchos archivos en red.
- Define la ubicacion real de tus archivos base (Excel y planos) en `config.yaml` antes de ejecutar.
