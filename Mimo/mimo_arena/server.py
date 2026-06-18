"""FastAPI server: serves the web UI, exposes REST + WebSocket, and bridges
to Gemini via JSON files. Run with:  python run.py
"""
from __future__ import annotations
import asyncio
import json
from pathlib import Path
from typing import List, Optional

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

from . import config, missions, personas, settings
from .orchestrator import Orchestrator
from .chat_store import chat_store

config.ensure_dirs()
WEB_DIR = Path(__file__).parent / "web"

app = FastAPI(title="MIMO Arena")


# --- WebSocket hub ----------------------------------------------------------
class Hub:
    def __init__(self) -> None:
        self.clients: List[WebSocket] = []
        self.loop: Optional[asyncio.AbstractEventLoop] = None

    async def connect(self, ws: WebSocket) -> None:
        await ws.accept()
        self.clients.append(ws)

    def disconnect(self, ws: WebSocket) -> None:
        if ws in self.clients:
            self.clients.remove(ws)

    def broadcast(self, event: dict) -> None:
        """Thread-safe: called from orchestrator worker threads."""
        if not self.loop:
            return
        asyncio.run_coroutine_threadsafe(self._broadcast(event), self.loop)

    async def _broadcast(self, event: dict) -> None:
        dead = []
        for ws in self.clients:
            try:
                await ws.send_text(json.dumps(event, ensure_ascii=False))
            except Exception:
                dead.append(ws)
        for ws in dead:
            self.disconnect(ws)


hub = Hub()

# --- in-memory trace ring-buffer (last 500 trace events) --------------------
from collections import deque
import threading as _threading
_trace_lock = _threading.Lock()
_trace_ring: deque = deque(maxlen=500)

_original_broadcast = None

def _traced_broadcast(event: dict) -> None:
    """Intercept broadcast to capture trace events into the ring buffer."""
    if event.get("type") == "trace":
        with _trace_lock:
            _trace_ring.append(event)
    hub.broadcast(event)

orch = Orchestrator(broadcaster=_traced_broadcast)


@app.on_event("startup")
async def _startup() -> None:
    hub.loop = asyncio.get_event_loop()
    # Boot workers in a thread so the server starts responding immediately.
    await asyncio.get_event_loop().run_in_executor(None, orch.boot)
    # Resume any mission that was interrupted by a previous crash/restart.
    await asyncio.get_event_loop().run_in_executor(None, orch.resume_open_missions)


@app.on_event("shutdown")
async def _shutdown() -> None:
    orch.shutdown()


# --- request models ---------------------------------------------------------
class MessageIn(BaseModel):
    text: str
    to: str = "scout"
    persona: Optional[str] = None
    skills: list[str] = []


class SettingsIn(BaseModel):
    values: dict


class CommandIn(BaseModel):
    action: str
    message: Optional[str] = None
    tasks: Optional[list] = None


class RenameIn(BaseModel):
    title: str


# --- pages ------------------------------------------------------------------
@app.get("/", response_class=HTMLResponse)
async def index() -> str:
    return (WEB_DIR / "index.html").read_text(encoding="utf-8")


app.mount("/static", StaticFiles(directory=str(WEB_DIR)), name="static")


# --- REST: state + workers --------------------------------------------------
@app.get("/api/state")
async def get_state():
    return JSONResponse(orch.world_state())


@app.get("/api/missions")
async def list_missions():
    """Open (unfinished) missions with their per-task structured verdicts."""
    return JSONResponse(missions.open_missions())


@app.get("/api/missions/{mission_id}")
async def get_mission(mission_id: str):
    m = missions.get_mission(mission_id)
    if not m:
        return JSONResponse({"error": "not found"}, status_code=404)
    return JSONResponse(m)


@app.post("/api/missions/resume")
async def resume_missions():
    """Re-run any mission interrupted by a crash/restart."""
    n = await asyncio.get_event_loop().run_in_executor(None, orch.resume_open_missions)
    return {"resumed_scan": n}


@app.get("/api/audit")
async def get_audit(limit: int = 100):
    """Tail of the audit log — every command/edit the workers ran."""
    return JSONResponse(missions.audit_tail(limit))


@app.get("/api/personas")
async def get_personas():
    """Full persona catalog: roles, skills with install status, hybrid flag."""
    return JSONResponse(personas.list_public())


@app.get("/api/skills")
async def get_skills():
    """All installed skills from .claude/skills/ with metadata."""
    return JSONResponse(personas.list_installed_skills())


@app.get("/api/trace")
async def get_trace(limit: int = 200):
    """Last N live trace events (worker stage transitions, LLM calls, etc.)."""
    with _trace_lock:
        events = list(_trace_ring)[-limit:]
    return JSONResponse(events)


@app.get("/api/settings")
async def get_settings():
    """All settings + metadata so the Settings panel renders itself."""
    return JSONResponse(settings.all_with_meta())


@app.put("/api/settings")
async def put_settings(body: SettingsIn):
    """Persist a batch of settings; takes effect on the next task."""
    updated = settings.update(body.values)
    missions.audit("user", "settings.update", "", ",".join(updated.keys()))
    return JSONResponse({"ok": True, "updated": updated})


@app.post("/api/executors")
async def add_executor():
    wid = orch.add_executor()
    return {"worker_id": wid}


@app.post("/api/shutdown")
async def shutdown_server():
    """Stop all workers and terminate the server process (from the UI)."""
    hub.broadcast({"type": "message", "role": "system",
                   "sender": "system", "text": "Shutting down the server and all workers..."})
    orch.shutdown()

    def _kill() -> None:
        import os
        import signal
        import time
        time.sleep(0.6)  # let the HTTP response flush first
        os.kill(os.getpid(), signal.SIGINT)

    import threading
    threading.Thread(target=_kill, daemon=True).start()
    return {"ok": True}


# --- REST: chats ------------------------------------------------------------
@app.get("/api/chats")
async def list_chats():
    return chat_store.list()


@app.post("/api/chats")
async def create_chat():
    chat = chat_store.create()
    orch.set_active_chat(chat["id"])
    return chat


@app.get("/api/chats/{chat_id}")
async def get_chat(chat_id: str):
    chat = chat_store.get(chat_id)
    if not chat:
        return JSONResponse({"error": "not found"}, status_code=404)
    orch.set_active_chat(chat_id)
    return chat


@app.put("/api/chats/{chat_id}")
async def rename_chat(chat_id: str, body: RenameIn):
    return {"ok": chat_store.rename(chat_id, body.title)}


@app.delete("/api/chats/{chat_id}")
async def delete_chat(chat_id: str):
    return {"ok": chat_store.delete(chat_id)}


# --- REST: messaging + Gemini command injection -----------------------------
@app.post("/api/message")
async def send_message(body: MessageIn):
    if not orch.active_chat_id:
        chat = chat_store.create()
        orch.set_active_chat(chat["id"])
    missions.audit(
        "user",
        "api.message",
        body.to,
        json.dumps(
            {
                "persona": body.persona,
                "skills": body.skills,
                "text_preview": body.text[:120],
            },
            ensure_ascii=False,
        ),
    )
    # run off the event loop
    asyncio.get_event_loop().run_in_executor(
        None, orch.user_message, body.text, body.to, body.persona, body.skills
    )
    return {"ok": True, "chat_id": orch.active_chat_id}


@app.post("/api/command")
async def send_command(body: CommandIn):
    """Lets the UI (or a manual tester) inject a Gemini-style command."""
    orch.submit_command(body.model_dump(exclude_none=True))
    return {"ok": True}


# --- WebSocket --------------------------------------------------------------
@app.websocket("/ws")
async def ws_endpoint(ws: WebSocket):
    await hub.connect(ws)
    try:
        # send initial state on connect
        await ws.send_text(json.dumps({"type": "state", **orch.world_state()},
                                      ensure_ascii=False))
        while True:
            await ws.receive_text()  # keepalive; UI drives via REST
    except WebSocketDisconnect:
        hub.disconnect(ws)
    except Exception:
        hub.disconnect(ws)
