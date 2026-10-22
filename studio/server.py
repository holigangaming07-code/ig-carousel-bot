"""IG Carousel Studio - yerel sunucu (sadece standart kütüphane)."""
import io
import json
import mimetypes
import os
import re
import shutil
import socket
import threading
import time
import zipfile
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import parse_qs, urlparse

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
POSTS = os.path.join(ROOT, "content", "posts.json")
OUT = os.path.join(ROOT, "output")
STATIC = {"/": "studio/index.html", "/app.js": "studio/app.js", "/app.css": "studio/app.css",
          "/slides.js": "scripts/slides.js", "/theme.css": "template/theme.css",
          "/slide.html": "template/slide.html"}
ID_RE = re.compile(r"^[\w.\-]{1,80}$")
last_ping = [time.time()]
seen_ping = [False]


class Handler(BaseHTTPRequestHandler):
    def log_message(self, *a):
        pass

    def send(self, code, body=b"", ctype="application/json", extra=None):
        if isinstance(body, (dict, list)):
            body = json.dumps(body, ensure_ascii=False).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        for k, v in (extra or {}).items():
            self.send_header(k, v)
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        u = urlparse(self.path)
        q = parse_qs(u.query)
        if u.path in STATIC:
            p = os.path.join(ROOT, STATIC[u.path])
            ctype = (mimetypes.guess_type(p)[0] or "text/plain") + "; charset=utf-8"
            with open(p, "rb") as f:
                return self.send(200, f.read(), ctype)
        if u.path == "/api/posts":
            with open(POSTS, encoding="utf-8") as f:
                return self.send(200, f.read().encode("utf-8"))
        if u.path == "/api/ping":
            last_ping[0] = time.time()
            seen_ping[0] = True
            return self.send(200, {"ok": True})
        if u.path == "/api/zip":
            pid = (q.get("id") or [""])[0]
            d = os.path.join(OUT, pid)
            if not ID_RE.match(pid) or not os.path.isdir(d):
                return self.send(404, {"error": "Önce dışa aktar."})
            buf = io.BytesIO()
            with zipfile.ZipFile(buf, "w", zipfile.ZIP_STORED) as z:
                for n in sorted(os.listdir(d)):
                    z.write(os.path.join(d, n), n)
            return self.send(200, buf.getvalue(), "application/zip",
                             {"Content-Disposition": f'attachment; filename="{pid}.zip"'})
        self.send(404, {"error": "yok"})

    def do_POST(self):
        u = urlparse(self.path)
        q = parse_qs(u.query)
        n = int(self.headers.get("Content-Length") or 0)
        body = self.rfile.read(n)
        if u.path == "/api/posts":
            try:
                data = json.loads(body.decode("utf-8"))
            except ValueError as e:
                return self.send(400, {"error": str(e)})
            if os.path.exists(POSTS):
                shutil.copyfile(POSTS, POSTS + ".bak")
            with open(POSTS, "w", encoding="utf-8", newline="\n") as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
                f.write("\n")
            return self.send(200, {"ok": True})
        if u.path == "/api/export":
            pid = (q.get("id") or [""])[0]
            idx = int((q.get("n") or ["0"])[0])
            if not ID_RE.match(pid) or idx < 1:
                return self.send(400, {"error": "geçersiz id"})
            d = os.path.join(OUT, pid)
            if idx == 1:
                shutil.rmtree(d, ignore_errors=True)
            os.makedirs(d, exist_ok=True)
            with open(os.path.join(d, f"slide-{idx}.jpg"), "wb") as f:
                f.write(body)
            return self.send(200, {"ok": True})
        if u.path == "/api/open-output":
            pid = (q.get("id") or [""])[0]
            d = os.path.join(OUT, pid) if ID_RE.match(pid) else OUT
            os.makedirs(d, exist_ok=True)
            os.startfile(d)
            return self.send(200, {"ok": True})
        self.send(404, {"error": "yok"})


def free_port():
    s = socket.socket()
    s.bind(("127.0.0.1", 0))
    p = s.getsockname()[1]
    s.close()
    return p


def serve(port, idle_exit=True):
    httpd = ThreadingHTTPServer(("127.0.0.1", port), Handler)

    def watchdog():
        while True:
            time.sleep(2)
            idle = time.time() - last_ping[0]
            if idle_exit and ((seen_ping[0] and idle > 15) or idle > 60):
                httpd.shutdown()
                return

    threading.Thread(target=watchdog, daemon=True).start()
    httpd.serve_forever()


if __name__ == "__main__":
    import sys
    p = int(sys.argv[1]) if len(sys.argv) > 1 else 8765
    print(f"http://127.0.0.1:{p}")
    serve(p, idle_exit=False)
