"""Persistent chat store, backed by SQLite (was: one JSON file per chat).

Public API is unchanged (create/get/list/add_message/rename/delete) so the
orchestrator and server keep working without edits. Two wins over the old
JSON store:
  - add_message() is a single atomic INSERT, not a full-file rewrite. A crash
    mid-write can't corrupt the whole conversation anymore.
  - history() returns only the last N messages via an indexed query, so we can
    feed the AI a bounded, fast context window instead of reading everything.
"""
from __future__ import annotations
import json
import time
import uuid
from typing import List, Optional

from . import db


def _row_to_msg(r) -> dict:
    return {
        "id": r["id"],
        "sender": r["sender"],
        "role": r["role"],
        "text": r["text"],
        "ts": r["ts"],
        "meta": json.loads(r["meta"] or "{}"),
    }


class ChatStore:
    def create(self, title: str = "New mission") -> dict:
        chat_id = uuid.uuid4().hex[:12]
        now = time.time()
        db.execute(
            "INSERT INTO chats (id, title, created, updated) VALUES (?, ?, ?, ?)",
            (chat_id, title or "New mission", now, now),
        )
        return {
            "id": chat_id,
            "title": title or "New mission",
            "created": now,
            "updated": now,
            "messages": [],
        }

    def get(self, chat_id: str) -> Optional[dict]:
        row = db.query_one("SELECT * FROM chats WHERE id = ?", (chat_id,))
        if not row:
            return None
        msgs = db.query_all(
            "SELECT * FROM messages WHERE chat_id = ? ORDER BY ts ASC", (chat_id,)
        )
        return {
            "id": row["id"],
            "title": row["title"],
            "created": row["created"],
            "updated": row["updated"],
            "messages": [_row_to_msg(m) for m in msgs],
        }

    def list(self) -> List[dict]:
        rows = db.query_all(
            """
            SELECT c.id, c.title, c.updated,
                   (SELECT COUNT(*) FROM messages m WHERE m.chat_id = c.id) AS count
            FROM chats c
            ORDER BY c.updated DESC
            """
        )
        return [
            {"id": r["id"], "title": r["title"], "updated": r["updated"], "count": r["count"]}
            for r in rows
        ]

    def history(self, chat_id: str, limit: int = 20) -> List[dict]:
        """Last `limit` messages (oldest-first) — ideal for AI context windows."""
        rows = db.query_all(
            "SELECT * FROM messages WHERE chat_id = ? ORDER BY ts DESC LIMIT ?",
            (chat_id, limit),
        )
        return [_row_to_msg(m) for m in reversed(rows)]

    def add_message(self, chat_id: str, sender: str, role: str, text: str,
                    meta: Optional[dict] = None) -> Optional[dict]:
        chat = db.query_one("SELECT * FROM chats WHERE id = ?", (chat_id,))
        if not chat:
            return None
        now = time.time()
        msg = {
            "id": uuid.uuid4().hex[:8],
            "sender": sender,
            "role": role,
            "text": text,
            "ts": now,
            "meta": meta or {},
        }
        db.execute(
            "INSERT INTO messages (id, chat_id, sender, role, text, ts, meta) "
            "VALUES (?, ?, ?, ?, ?, ?, ?)",
            (msg["id"], chat_id, sender, role, text, now,
             json.dumps(meta or {}, ensure_ascii=False)),
        )
        # Auto-title from the first user message.
        new_title = None
        if chat["title"] in ("New mission", "") and role == "user":
            new_title = (text or "").strip()[:48] or "Mission"
        if new_title:
            db.execute("UPDATE chats SET title = ?, updated = ? WHERE id = ?",
                       (new_title, now, chat_id))
        else:
            db.execute("UPDATE chats SET updated = ? WHERE id = ?", (now, chat_id))
        return msg

    def rename(self, chat_id: str, title: str) -> bool:
        title = (title or "").strip()
        if not title:
            return False
        cur = db.execute("UPDATE chats SET title = ?, updated = ? WHERE id = ?",
                         (title, time.time(), chat_id))
        return cur.rowcount > 0

    def delete(self, chat_id: str) -> bool:
        cur = db.execute("DELETE FROM chats WHERE id = ?", (chat_id,))
        return cur.rowcount > 0


chat_store = ChatStore()
