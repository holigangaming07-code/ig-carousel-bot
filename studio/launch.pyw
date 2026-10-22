"""Masaüstü kısayolunun açtığı başlatıcı: sunucuyu başlatır, uygulamayı Edge/Chrome app penceresinde açar."""
import os
import subprocess
import sys
import threading
import time

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import server  # noqa: E402

BROWSERS = [
    r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
    r"C:\Program Files\Microsoft\Edge\Application\msedge.exe",
    r"C:\Program Files\Google\Chrome\Application\chrome.exe",
    r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
]


def main():
    port = server.free_port()
    url = f"http://127.0.0.1:{port}/"
    exe = next((b for b in BROWSERS if os.path.exists(b)), None)
    profile = os.path.join(os.environ.get("LOCALAPPDATA", server.ROOT), "ig-carousel-studio")

    def open_window():
        time.sleep(0.6)
        if exe:
            subprocess.Popen([exe, f"--app={url}", f"--user-data-dir={profile}",
                              "--window-size=1500,920", "--no-first-run"])
        else:
            import webbrowser
            webbrowser.open(url)

    threading.Thread(target=open_window, daemon=True).start()
    server.serve(port)  # pencere kapanınca (ping kesilince) kendiliğinden biter


if __name__ == "__main__":
    main()
