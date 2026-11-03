import http.server
import socketserver
import os
import webbrowser
import sys

# Ensure UTF-8 output in Windows console if supported
if sys.platform.startswith('win'):
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

PORT = 8080
DIRECTORY = os.path.dirname(os.path.abspath(__file__))

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate')
        super().end_headers()

def run_server():
    os.chdir(DIRECTORY)
    current_port = PORT
    for attempt in range(5):
        try:
            with socketserver.TCPServer(("", current_port), Handler) as httpd:
                url = f"http://localhost:{current_port}"
                print("=" * 60)
                print(f"[ARIANA GRANDE] Greatest Hits Web App is running!")
                print(f"[LINK] Open in browser: {url}")
                print(f"[DIR]  Serving: {DIRECTORY}")
                print("=" * 60)
                print("Press Ctrl+C to stop the server.")
                
                if "--no-browser" not in sys.argv:
                    webbrowser.open(url)
                
                httpd.serve_forever()
                break
        except OSError:
            print(f"Port {current_port} is busy, trying port {current_port + 1}...")
            current_port += 1

if __name__ == "__main__":
    run_server()
