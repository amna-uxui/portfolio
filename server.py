# Local preview server for the portfolio.
# Same as "python -m http.server", but tells the browser not to keep old
# copies of files, so every normal refresh shows your latest changes.
# Run it with:  python server.py   then open http://localhost:5500

from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

PORT = 5500


class NoCacheHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store")  # always fetch the newest file
        super().end_headers()


print(f"Portfolio running at http://localhost:{PORT}  (press Ctrl+C to stop)")
ThreadingHTTPServer(("", PORT), NoCacheHandler).serve_forever()
