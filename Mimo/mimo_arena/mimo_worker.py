"""A single MIMO worker = its own `mimo serve` process on its own port,
its own session, and its own message file. Fully isolated from siblings,
which is exactly why they can run truly in parallel.

Upgrades over the original:
  • LIVE STREAMING: ask() now uses Popen and reads mimo's JSON-event stream
    line by line, invoking on_chunk(text) as each token arrives. The UI feels
    instant instead of waiting for the whole task to finish.
  • HEARTBEAT: every streamed line bumps last_beat, and alive() reports whether
    the worker is still producing output, so the orchestrator can restart a
    silently-hung worker.
  • cwd override: a task can run inside a git worktree for isolation.
"""
from __future__ import annotations
import json
import re
import socket
import subprocess
import threading
import time
from pathlib import Path
from typing import Callable, Optional

from . import config, settings

_ANSI_RE = re.compile(r"\x1b\[[0-9;?]*[ -/]*[@-~]")


def strip_ansi(text: str) -> str:
    if not text:
        return text
    text = _ANSI_RE.sub("", text)
    text = re.sub(r"\x1b", "", text)
    return text


def find_free_port(preferred: int = 0) -> int:
    if preferred:
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            try:
                s.bind((config.HOST, preferred))
                return preferred
            except OSError:
                pass
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.bind((config.HOST, 0))
        return s.getsockname()[1]


def _port_open(port: int) -> bool:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.settimeout(0.5)
        return s.connect_ex((config.HOST, port)) == 0


def _text_from_event(obj: dict) -> Optional[str]:
    """Pull the assistant text out of one mimo JSON event, if present."""
    if isinstance(obj.get("text"), str):
        return obj["text"]
    part = obj.get("part")
    if isinstance(part, dict) and isinstance(part.get("text"), str):
        return part["text"]
    return None


def extract_text(raw: str) -> str:
    """Parse a full mimo JSON-event stream into one clean text blob.

    Kept for callers that already have the whole output buffered.
    """
    if not raw:
        return ""
    chunks, saw_json = [], False
    for line in raw.splitlines():
        line = line.strip()
        if not line:
            continue
        try:
            obj = json.loads(line)
            saw_json = True
        except Exception:
            continue
        if isinstance(obj, dict):
            t = _text_from_event(obj)
            if t is not None:
                chunks.append(t)
    if chunks:
        return strip_ansi("".join(chunks)).strip()
    return strip_ansi(raw).strip() if not saw_json else ""


class MimoWorker:
    def __init__(self, worker_id: str, role: str = "executor", preferred_port: int = 0):
        self.id = worker_id
        self.role = role  # "scout" | "executor"
        self.preferred_port = preferred_port
        self.port: Optional[int] = None
        self.proc: Optional[subprocess.Popen] = None
        self.ready = False
        self.busy = False
        self.current_task: Optional[str] = None
        self.last_output: str = ""
        self.held_locks: list[str] = []
        self.last_beat: float = time.time()
        self._session_started = False
        self._mu = threading.Lock()

    # --- lifecycle ----------------------------------------------------------
    def start(self) -> None:
        if self.ready:
            return
        self.port = find_free_port(self.preferred_port)
        self.proc = subprocess.Popen(
            [config.MIMO_BIN, "serve", "--port", str(self.port)],
            cwd=str(config.ROOT),
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
        deadline = time.time() + config.SERVE_TIMEOUT
        while time.time() < deadline:
            if _port_open(self.port):
                self.ready = True
                self.last_beat = time.time()
                return
            if self.proc.poll() is not None:
                raise RuntimeError(f"[{self.id}] mimo serve exited early")
            time.sleep(0.4)
        raise TimeoutError(f"[{self.id}] mimo serve did not become ready on :{self.port}")

    def _msg_file(self) -> Path:
        config.ensure_dirs()
        return config.BRIDGE_DIR / f"_msg_{self.id}.txt"

    def ask(self, message: str, on_chunk: Optional[Callable[[str], None]] = None,
            cwd: Optional[str] = None, model: Optional[str] = None) -> str:
        """Send a prompt and stream the reply.

        on_chunk(text) is called for every assistant text fragment as it
        arrives (live). The full concatenated reply is also returned.
        cwd lets the orchestrator run this task inside an isolated worktree.
        model overrides the LLM mimo uses for this task (persona-driven); empty
        means mimo's own default.
        """
        if not self.ready:
            self.start()
        mf = self._msg_file()
        mf.write_text(message, encoding="utf-8")
        with self._mu:
            self.busy = True
            self.current_task = message
        self.last_beat = time.time()
        run_cwd = cwd or str(config.ROOT)
        cmd = [
            config.MIMO_BIN, "run", message,
            "--attach", f"http://{config.HOST}:{self.port}",
            "--dangerously-skip-permissions",
            "--format", "json",
        ]
        model = (model or "").strip()
        if model:
            cmd += ["--model", model]
        if self._session_started:
            cmd.append("--continue")

        task_timeout = float(settings.get("task.timeout", config.TASK_TIMEOUT))
        chunks: list[str] = []
        proc: Optional[subprocess.Popen] = None
        try:
            proc = subprocess.Popen(
                cmd, cwd=run_cwd,
                stdout=subprocess.PIPE, stderr=subprocess.PIPE,
                encoding="utf-8", errors="replace", bufsize=1,
            )
            deadline = time.time() + task_timeout
            for line in proc.stdout:  # blocks per line, streams as mimo emits
                self.last_beat = time.time()  # heartbeat on every line
                line = line.strip()
                if not line:
                    if time.time() > deadline:
                        raise subprocess.TimeoutExpired(cmd, task_timeout)
                    continue
                try:
                    obj = json.loads(line)
                except Exception:
                    continue
                if isinstance(obj, dict):
                    t = _text_from_event(obj)
                    if t:
                        chunks.append(t)
                        if on_chunk:
                            try:
                                on_chunk(strip_ansi(t))
                            except Exception:
                                pass
                if time.time() > deadline:
                    raise subprocess.TimeoutExpired(cmd, task_timeout)
            proc.wait(timeout=10)
            out = strip_ansi("".join(chunks)).strip()
            if not out:
                err = proc.stderr.read() if proc.stderr else ""
                out = strip_ansi(err or "").strip()
            self._session_started = True
            self.last_output = out
            return out
        except subprocess.TimeoutExpired:
            if proc and proc.poll() is None:
                proc.kill()
            self.last_output = f"[{self.id}] task timed out after {task_timeout}s"
            raise
        finally:
            with self._mu:
                self.busy = False
                self.current_task = None
            self.last_beat = time.time()

    def stop(self) -> None:
        if self.proc and self.proc.poll() is None:
            try:
                self.proc.terminate()
                try:
                    self.proc.wait(timeout=5)
                except subprocess.TimeoutExpired:
                    self.proc.kill()
            except Exception:
                pass
        self.ready = False
        self._session_started = False

    def restart(self) -> None:
        """Hard-cycle the worker (used by the heartbeat watchdog)."""
        self.stop()
        time.sleep(0.3)
        self.start()

    # --- health -------------------------------------------------------------
    def alive(self) -> bool:
        """A worker is unhealthy if its serve process died, or if it's been
        busy yet silent (no streamed output) past the heartbeat timeout."""
        if self.proc is None or self.proc.poll() is not None:
            return False
        hb = float(settings.get("heartbeat.timeout", config.HEARTBEAT_TIMEOUT))
        if self.busy and (time.time() - self.last_beat) > hb:
            return False
        return True

    # --- status -------------------------------------------------------------
    def status(self) -> dict:
        return {
            "id": self.id,
            "role": self.role,
            "port": self.port,
            "ready": self.ready,
            "busy": self.busy,
            "alive": self.alive(),
            "last_beat": self.last_beat,
            "current_task": (self.current_task or "")[:120],
            "held_locks": list(self.held_locks),
        }
