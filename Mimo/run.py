#!/usr/bin/env python3
"""MIMO Arena launcher.

Usage (from your project root, where `mimo` should run):
    pip install -r mimo_arena/requirements.txt
    python run.py

Then open the printed URL in your browser.

Environment overrides (all optional):
    MIMO_ROOT        directory where mimo runs        (default: cwd)
    MIMO_BIN         path to the mimo binary          (default: "mimo")
    MIMO_EXECUTORS   how many executors at boot       (default: 2)
    MIMO_PORT        web UI port                       (default: 8765)
    MIMO_BASE_PORT   first mimo serve port            (default: 4097)
"""
import os
import sys
import webbrowser
import threading

import uvicorn

from mimo_arena import config


def _open_browser(url: str) -> None:
    try:
        webbrowser.open(url)
    except Exception:
        pass


def main() -> None:
    config.bootstrap()
    url = f"http://{config.HOST}:{config.PORT}"
    print("=" * 64)
    print("  MIMO Arena")
    print(f"  Project root : {config.ROOT}")
    print(f"  mimo bin     : {config.MIMO_BIN}")
    print(f"  Executors    : {config.DEFAULT_EXECUTORS} (+ 1 scout)")
    print(f"  Web UI       : {url}")
    print("-" * 64)
    print("  Gemini bridge (tell Gemini to use these files):")
    print(f"    • write commands -> {config.GEMINI_INBOX}")
    print(f"    • read state     -> {config.ARENA_OUTBOX}")
    print(f"    • full guide     -> {config.GEMINI_GUIDE}")
    print("=" * 64)
    # open browser shortly after the server starts
    threading.Timer(1.5, _open_browser, args=[url]).start()
    uvicorn.run("mimo_arena.server:app", host=config.HOST, port=config.PORT,
                log_level="info")


if __name__ == "__main__":
    sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
    main()
