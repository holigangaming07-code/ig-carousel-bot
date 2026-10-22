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
          "/slide.html": "template/slide.html", "/fonts.css": "template/fonts.css"}
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

    def auto(self, method, path, q, body):
        try:
            code, data = auto_handle(method, path, q, body)
        except Exception as e:  # noqa: BLE001
            code, data = 500, {"error": str(e)}
        self.send(code, data)

    def do_GET(self):
        u = urlparse(self.path)
        q = parse_qs(u.query)
        if u.path.startswith("/api/auto/"):
            return self.auto("GET", u.path, q, b"")
        if u.path.startswith("/runfile/"):
            parts = u.path.split("/", 3)
            d = safe_run_dir(parts[2]) if len(parts) > 3 else None
            fp = os.path.normpath(os.path.join(d, parts[3])) if d else None
            if fp and fp.startswith(d) and os.path.isfile(fp):
                with open(fp, "rb") as f:
                    return self.send(200, f.read(), mimetypes.guess_type(fp)[0] or "image/jpeg")
            return self.send(404, {"error": "yok"})
        if u.path in STATIC:
            p = os.path.join(ROOT, STATIC[u.path])
            ctype = (mimetypes.guess_type(p)[0] or "text/plain") + "; charset=utf-8"
            with open(p, "rb") as f:
                return self.send(200, f.read(), ctype)
        m = re.match(r"^/rv/(layout\.json|[1-8]\.jpg)$", u.path)
        if m:
            with open(os.path.join(ROOT, "template", "rv", m.group(1)), "rb") as f:
                return self.send(200, f.read(), "application/json" if m.group(1).endswith("json") else "image/jpeg")
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
        if u.path.startswith("/api/auto/"):
            return self.auto("POST", u.path, q, body)
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


# ---------------------------------------------------------------------------
# Otomasyon paneli: GitHub Actions botunu gh CLI ile yönetir
# ---------------------------------------------------------------------------
import subprocess
from concurrent.futures import ThreadPoolExecutor

GH = shutil.which("gh") or r"C:\Program Files\GitHub CLI\gh.exe"
WORKFLOW = "post.yml"
NOWIN = getattr(subprocess, "CREATE_NO_WINDOW", 0)
GIT_ID = ["-c", "user.name=Studio", "-c", "user.email=studio@local"]


def run_cmd(args, timeout=60, cwd=None):
    try:
        r = subprocess.run(args, capture_output=True, text=True, encoding="utf-8", errors="replace",
                           timeout=timeout, cwd=cwd or ROOT, creationflags=NOWIN)
        return r.returncode, (r.stdout or "") + (r.stderr or "")
    except Exception as e:  # noqa: BLE001
        return 1, str(e)


def repo_name():
    try:
        with open(POSTS, encoding="utf-8") as f:
            return json.load(f).get("repo") or ""
    except Exception:  # noqa: BLE001
        return ""


def gh(args, timeout=60):
    return run_cmd([GH] + args, timeout)


def read_crons():
    p = os.path.join(ROOT, ".github", "workflows", WORKFLOW)
    try:
        with open(p, encoding="utf-8") as f:
            return re.findall(r'cron:\s*"([^"]+)"', f.read())
    except Exception:  # noqa: BLE001
        return []


def auto_status():
    repo = repo_name()
    jobs = {
        "auth": lambda: gh(["auth", "status"], 20),
        "runs": lambda: gh(["run", "list", "-R", repo, "-L", "12", "--json", "databaseId,status,conclusion,createdAt,updatedAt,event,url,headBranch"], 40),
        "wf": lambda: gh(["api", f"repos/{repo}/actions/workflows/{WORKFLOW}"], 30),
        "secrets": lambda: gh(["secret", "list", "-R", repo], 30),
        "git": lambda: run_cmd(["git", "status", "--porcelain", "-b"], 20),
    }
    with ThreadPoolExecutor(max_workers=5) as ex:
        futs = {k: ex.submit(fn) for k, fn in jobs.items()}
        res = {k: f.result() for k, f in futs.items()}
    out = {"repo": repo, "crons": read_crons()}
    rc, txt = res["auth"]
    m = re.search(r"account (\S+)", txt)
    out["gh"] = {"ok": rc == 0, "user": m.group(1) if m else "", "msg": "" if rc == 0 else txt.strip()[:200]}
    rc, txt = res["runs"]
    try:
        out["runs"] = json.loads(txt) if rc == 0 else []
    except ValueError:
        out["runs"] = []
    rc, txt = res["wf"]
    try:
        out["workflow"] = json.loads(txt).get("state", "?") if rc == 0 else "?"
    except ValueError:
        out["workflow"] = "?"
    rc, txt = res["secrets"]
    out["secrets"] = [ln.split()[0] for ln in txt.splitlines() if ln.strip()] if rc == 0 else []
    rc, txt = res["git"]
    lines = txt.splitlines()
    head = lines[0] if lines else ""
    out["git"] = {"dirty": [ln[3:] for ln in lines[1:]], "ahead": int((re.search(r"ahead (\d+)", head) or [0, 0])[1]),
                  "behind": int((re.search(r"behind (\d+)", head) or [0, 0])[1])}
    return out


def safe_run_dir(run_id):
    if not re.match(r"^\d{5,20}$", str(run_id)):
        return None
    return os.path.join(OUT, "runs", str(run_id))


def auto_handle(method, path, q, body):
    """(kod, veri) döndürür."""
    repo = repo_name()
    if path == "/api/auto/status" and method == "GET":
        return 200, auto_status()
    if path == "/api/auto/run" and method == "POST":
        o = json.loads(body.decode("utf-8") or "{}")
        args = ["workflow", "run", WORKFLOW, "-R", repo, "-f", f"dry_run={'true' if o.get('dry_run', True) else 'false'}",
                "-f", f"mode={o.get('mode') if o.get('mode') in ('popular', 'rising') else 'popular'}"]
        if o.get("post_id") and re.match(r"^[\w.\-]{1,80}$", o["post_id"]):
            args += ["-f", f"post_id={o['post_id']}"]
        rc, txt = gh(args, 40)
        return (200 if rc == 0 else 500), {"ok": rc == 0, "msg": txt.strip()[:300]}
    if path == "/api/auto/toggle" and method == "POST":
        o = json.loads(body.decode("utf-8") or "{}")
        rc, txt = gh(["workflow", "enable" if o.get("enable") else "disable", WORKFLOW, "-R", repo], 40)
        return (200 if rc == 0 else 500), {"ok": rc == 0, "msg": txt.strip()[:300]}
    if path == "/api/auto/cancel" and method == "POST":
        o = json.loads(body.decode("utf-8") or "{}")
        if not re.match(r"^\d{5,20}$", str(o.get("id", ""))):
            return 400, {"error": "geçersiz id"}
        rc, txt = gh(["run", "cancel", str(o["id"]), "-R", repo], 40)
        return (200 if rc == 0 else 500), {"ok": rc == 0, "msg": txt.strip()[:300]}
    if path == "/api/auto/download" and method == "POST":
        o = json.loads(body.decode("utf-8") or "{}")
        d = safe_run_dir(o.get("id"))
        if not d:
            return 400, {"error": "geçersiz id"}
        shutil.rmtree(d, ignore_errors=True)
        rc, txt = gh(["run", "download", str(o["id"]), "-R", repo, "-D", d], 120)
        if rc != 0:
            return 500, {"ok": False, "msg": txt.strip()[:300]}
        files = []
        for base, _, names in os.walk(d):
            for n in names:
                if n.lower().endswith((".jpg", ".jpeg", ".png")):
                    files.append(os.path.relpath(os.path.join(base, n), d).replace("\\", "/"))
        files.sort(key=lambda s: [int(t) if t.isdigit() else t for t in re.split(r"(\d+)", s)])
        return 200, {"ok": True, "files": files}
    if path == "/api/auto/open" and method == "POST":
        o = json.loads(body.decode("utf-8") or "{}")
        d = safe_run_dir(o.get("id"))
        if d and os.path.isdir(d):
            os.startfile(d)
            return 200, {"ok": True}
        return 404, {"ok": False}
    if path == "/api/auto/pull" and method == "POST":
        rc, txt = run_cmd(["git", "pull", "--rebase", "--autostash"], 90)
        return (200 if rc == 0 else 500), {"ok": rc == 0, "msg": txt.strip()[-300:]}
    if path == "/api/auto/push" and method == "POST":
        run_cmd(["git", "add", "content/posts.json"], 20)
        rc0, st = run_cmd(["git", "status", "--porcelain", "content/posts.json"], 20)
        if st.strip():
            rc, txt = run_cmd(["git"] + GIT_ID + ["commit", "-m", "Studio: ayarlar/postlar güncellendi"], 30)
            if rc != 0:
                return 500, {"ok": False, "msg": txt.strip()[-300:]}
        rc, txt = run_cmd(["git", "pull", "--rebase", "--autostash"], 90)
        if rc != 0:
            return 500, {"ok": False, "msg": txt.strip()[-300:]}
        rc, txt = run_cmd(["git", "push"], 90)
        return (200 if rc == 0 else 500), {"ok": rc == 0, "msg": txt.strip()[-300:]}
    return 404, {"error": "yok"}


if __name__ == "__main__":
    import sys
    p = int(sys.argv[1]) if len(sys.argv) > 1 else 8765
    print(f"http://127.0.0.1:{p}")
    serve(p, idle_exit=False)
