"""Shared SQLite layer for the Arena.

Why SQLite (vs the old JSON files):
  - Atomic INSERTs instead of read-modify-write of the whole chat on every
    message. A crash can never corrupt the entire conversation.
  - Safe concurrent writes from many executor threads (WAL mode).
  - Fast history queries ("last N messages of this chat") for feeding the AI
    context, without loading a giant file into memory each time.

IMPORTANT: SQLite sits BEHIND the bridge. It never talks to the AI directly.
The maestro (Gemini) keeps reading/writing the JSON inbox/outbox files; the AI
workers keep talking over stdin/stdout. The DB only persists what the system
already produces.

Connections are per-thread (sqlite3 objects are not shareable across threads).
"""
from __future__ import annotations
import sqlite3
import threading
from typing import Any, Iterable, Optional

from . import config

_local = threading.local()
_init_lock = threading.Lock()
_initialized = False

SCHEMA = """
CREATE TABLE IF NOT EXISTS chats (
    id      TEXT PRIMARY KEY,
    title   TEXT NOT NULL,
    created REAL NOT NULL,
    updated REAL NOT NULL
);

-- Runtime settings (key -> JSON value). Lets the UI tune models, timeouts,
-- toggles, etc. without restarting. Defaults come from config.py.
CREATE TABLE IF NOT EXISTS settings (
    key   TEXT PRIMARY KEY,
    value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS messages (
    id       TEXT PRIMARY KEY,
    chat_id  TEXT NOT NULL,
    sender   TEXT NOT NULL,
    role     TEXT NOT NULL,
    text     TEXT NOT NULL,
    ts       REAL NOT NULL,
    meta     TEXT NOT NULL DEFAULT '{}',
    FOREIGN KEY (chat_id) REFERENCES chats(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_messages_chat_ts ON messages(chat_id, ts);

-- Mission state machine: planning -> assigned -> running -> review -> done/failed
CREATE TABLE IF NOT EXISTS missions (
    id          TEXT PRIMARY KEY,
    chat_id     TEXT,
    title       TEXT NOT NULL DEFAULT '',
    status      TEXT NOT NULL DEFAULT 'planning',
    plan        TEXT NOT NULL DEFAULT '{}',
    created     REAL NOT NULL,
    updated     REAL NOT NULL
);

CREATE TABLE IF NOT EXISTS mission_tasks (
    id          TEXT PRIMARY KEY,
    mission_id  TEXT NOT NULL,
    worker_id   TEXT,
    persona     TEXT NOT NULL DEFAULT 'coder',
    message     TEXT NOT NULL DEFAULT '',
    files       TEXT NOT NULL DEFAULT '[]',
    status      TEXT NOT NULL DEFAULT 'pending',
    answer      TEXT NOT NULL DEFAULT 'unknown',
    attempts    INTEGER NOT NULL DEFAULT 0,
    summary     TEXT NOT NULL DEFAULT '',
    created     REAL NOT NULL,
    updated     REAL NOT NULL,
    FOREIGN KEY (mission_id) REFERENCES missions(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_tasks_mission ON mission_tasks(mission_id);

-- Audit log: every command/task/edit the AI workers run, for security + debug.
CREATE TABLE IF NOT EXISTS audit_log (
    id      INTEGER PRIMARY KEY AUTOINCREMENT,
    ts      REAL NOT NULL,
    actor   TEXT NOT NULL,
    action  TEXT NOT NULL,
    target  TEXT NOT NULL DEFAULT '',
    detail  TEXT NOT NULL DEFAULT ''
);
CREATE INDEX IF NOT EXISTS idx_audit_ts ON audit_log(ts);
"""


def _connect() -> sqlite3.Connection:
    config.ensure_dirs()
    conn = sqlite3.connect(str(config.DB_PATH), timeout=30, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    # WAL = concurrent readers while a writer is active; far fewer "db locked".
    conn.execute("PRAGMA journal_mode=WAL;")
    conn.execute("PRAGMA synchronous=NORMAL;")
    conn.execute("PRAGMA foreign_keys=ON;")
    conn.execute("PRAGMA busy_timeout=30000;")
    return conn


def _ensure_schema() -> None:
    global _initialized
    if _initialized:
        return
    with _init_lock:
        if _initialized:
            return
        conn = _connect()
        try:
            conn.executescript(SCHEMA)
            # --- lightweight migrations for older DBs ---
            cols = {r[1] for r in conn.execute("PRAGMA table_info(mission_tasks)")}
            if "persona" not in cols:
                conn.execute(
                    "ALTER TABLE mission_tasks ADD COLUMN persona "
                    "TEXT NOT NULL DEFAULT 'coder'"
                )
            conn.commit()
        finally:
            conn.close()
        _initialized = True


def conn() -> sqlite3.Connection:
    """Return this thread's connection, creating it (and the schema) on demand."""
    _ensure_schema()
    c = getattr(_local, "conn", None)
    if c is None:
        c = _connect()
        _local.conn = c
    return c


def execute(sql: str, params: Iterable[Any] = ()) -> sqlite3.Cursor:
    c = conn()
    cur = c.execute(sql, tuple(params))
    c.commit()
    return cur


def query_one(sql: str, params: Iterable[Any] = ()) -> Optional[sqlite3.Row]:
    return conn().execute(sql, tuple(params)).fetchone()


def query_all(sql: str, params: Iterable[Any] = ()) -> list[sqlite3.Row]:
    return conn().execute(sql, tuple(params)).fetchall()
