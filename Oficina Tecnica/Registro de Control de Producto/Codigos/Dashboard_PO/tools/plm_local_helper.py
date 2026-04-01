from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import quote, unquote, urlparse
import json
import os
import subprocess

HOST = '127.0.0.1'
PORT = 51377

CAD_FILE_TYPES = [
    ('Archivos CAD', '*.sldprt *.sldasm *.slddrw *.step *.stp *.iges *.igs *.x_t *.x_b *.dxf *.dwg'),
    ('Todos los archivos', '*.*')
]


def path_to_file_uri(path_value):
    raw = os.path.abspath(str(path_value))
    if raw.startswith('\\\\'):
        unc = raw[2:]
        parts = [seg for seg in unc.split('\\') if seg]
        if len(parts) < 2:
            return ''
        host = parts[0]
        encoded = [quote(seg) for seg in parts[1:]]
        return f"file://{host}/" + '/'.join(encoded)
    return Path(raw).as_uri()


def file_uri_to_path(raw_value):
    value = str(raw_value or '').strip()
    if not value:
        return ''

    if value.lower().startswith('file://'):
        parsed = urlparse(value)
        netloc = unquote(str(parsed.netloc or '')).strip()
        path_value = unquote(str(parsed.path or ''))

        if netloc:
            return ('\\\\' + netloc + path_value.replace('/', '\\')).rstrip('\\')

        if path_value.startswith('/') and len(path_value) >= 3 and path_value[2] == ':':
            path_value = path_value[1:]

        return path_value.replace('/', '\\').strip()

    return value


def pick_cad_file():
    import tkinter as tk
    from tkinter import filedialog

    root = tk.Tk()
    root.withdraw()
    root.attributes('-topmost', True)

    selected = filedialog.askopenfilename(
        title='Seleccionar archivo CAD',
        filetypes=CAD_FILE_TYPES
    )

    root.update_idletasks()
    root.destroy()
    return str(selected or '').strip()


class Handler(BaseHTTPRequestHandler):
    def _send_json(self, payload, code=200):
        body = json.dumps(payload, ensure_ascii=False).encode('utf-8')
        self.send_response(code)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Content-Length', str(len(body)))
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self):
        self._send_json({'status': 'ok'})

    def do_POST(self):
        try:
            content_length = int(self.headers.get('Content-Length', '0') or '0')
            raw = self.rfile.read(content_length) if content_length > 0 else b'{}'
            data = json.loads(raw.decode('utf-8') or '{}')
        except Exception:
            data = {}

        if self.path == '/pick-cad':
            try:
                selected = pick_cad_file()
                if not selected:
                    self._send_json({'status': 'cancelled'})
                    return

                if not os.path.exists(selected):
                    self._send_json({'status': 'error', 'message': f'Archivo no encontrado: {selected}'}, 404)
                    return

                shortcut = path_to_file_uri(selected)
                if not shortcut:
                    self._send_json({'status': 'error', 'message': 'No se pudo generar acceso directo.'}, 500)
                    return

                self._send_json({
                    'status': 'success',
                    'shortcut': shortcut,
                    'path': selected,
                    'filename': os.path.basename(selected)
                })
                return
            except Exception as exc:
                self._send_json({'status': 'error', 'message': str(exc)}, 500)
                return

        if self.path == '/open-file':
            try:
                shortcut = data.get('shortcut')
                path_value = file_uri_to_path(shortcut)
                if not path_value:
                    self._send_json({'status': 'error', 'message': 'Shortcut invalido.'}, 400)
                    return

                if not os.path.exists(path_value):
                    self._send_json({'status': 'error', 'message': f'Archivo no encontrado: {path_value}'}, 404)
                    return

                if hasattr(os, 'startfile'):
                    os.startfile(path_value)
                else:
                    subprocess.Popen(['xdg-open', path_value], shell=False)

                self._send_json({'status': 'success'})
                return
            except Exception as exc:
                self._send_json({'status': 'error', 'message': str(exc)}, 500)
                return

        if self.path == '/health':
            self._send_json({'status': 'success'})
            return

        self._send_json({'status': 'error', 'message': 'Ruta no soportada.'}, 404)


def main():
    server = ThreadingHTTPServer((HOST, PORT), Handler)
    print(f'PLM local helper running on http://{HOST}:{PORT}')
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()


if __name__ == '__main__':
    main()
