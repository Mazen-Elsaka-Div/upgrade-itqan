r"""Mission state machine + audit log, persisted in SQLite.

A "mission" is one end-to-end job the maestro hands to the arena. It moves
through explicit states so the system can be inspected, resumed after a crash,
and reasoned about:

    planning -> assigned -> running -> review -> done
                                            \-> failed

Each mission owns N tasks (one per worker). Tasks carry a structured result
(status + answer + summary) so the maestro reads a clean verdict instead of
parsing free text. Everything lives in the DB, so if the process dies you can
reload the open missions and pick up where you left off.

The audit log records every meaningful action a worker/maestro takes — vital
because the workers run real terminal commands with skipped permissions.
"""
from __future__ import annotations
import json
import time
import uuid
from typing import List, Optional

from . import db

MISSION_STATES = ("planning", "assigned", "running", "review", "done", "failed")
TASK_STATES = ("pending", "running", "done", "failed")


# --- audit ------------------------------------------------------------------
def audit(actor: str, action: str, target: str = "", detail: str = "") -> None:
    db.execute(
        "INSERT INTO audit_log (ts, actor, action, target, detail) VALUES (?,?,?,?,?)",
        (time.time(), actor, action, target, detail),
    )


def audit_tail(limit: int = 100) -> List[dict]:
    rows = db.query_all(
        "SELECT * FROM audit_log ORDER BY id DESC LIMIT ?", (limit,)
    )
    return [dict(r) for r in reversed(rows)]


# --- missions ---------------------------------------------------------------
def create_mission(title: str = "", chat_id: Optional[str] = None,
                   plan: Optional[dict] = None) -> str:
    mid = uuid.uuid4().hex[:12]
    now = time.time()
    db.execute(
        "INSERT INTO missions (id, chat_id, title, status, plan, created, updated) "
        "VALUES (?,?,?,?,?,?,?)",
        (mid, chat_id, title, "planning", json.dumps(plan or {}, ensure_ascii=False), now, now),
    )
    audit("system", "mission.create", mid, title)
    return mid


def set_mission_status(mission_id: str, status: str) -> None:
    if status not in MISSION_STATES:
        raise ValueError(f"invalid mission status: {status}")
    db.execute("UPDATE missions SET status = ?, updated = ? WHERE id = ?",
               (status, time.time(), mission_id))
    audit("system", "mission.status", mission_id, status)


def add_task(mission_id: str, worker_id: str, message: str,
             files: Optional[list] = None, persona: str = "coder") -> str:
    tid = uuid.uuid4().hex[:12]
    now = time.time()
    db.execute(
        "INSERT INTO mission_tasks "
        "(id, mission_id, worker_id, persona, message, files, status, created, updated) "
        "VALUES (?,?,?,?,?,?,?,?,?)",
        (tid, mission_id, worker_id, persona, message,
         json.dumps(files or [], ensure_ascii=False), "pending", now, now),
    )
    return tid


def set_task_status(task_id: str, status: str, answer: str = None,
                    summary: str = None, bump_attempt: bool = False) -> None:
    if status not in TASK_STATES:
        raise ValueError(f"invalid task status: {status}")
    sets = ["status = ?", "updated = ?"]
    params: list = [status, time.time()]
    if answer is not None:
        sets.append("answer = ?")
        params.append(answer)
    if summary is not None:
        sets.append("summary = ?")
        params.append(summary)
    if bump_attempt:
        sets.append("attempts = attempts + 1")
    params.append(task_id)
    db.execute(f"UPDATE mission_tasks SET {', '.join(sets)} WHERE id = ?", params)


def get_mission(mission_id: str) -> Optional[dict]:
    row = db.query_one("SELECT * FROM missions WHERE id = ?", (mission_id,))
    if not row:
        return None
    m = dict(row)
    m["plan"] = json.loads(m.get("plan") or "{}")
    tasks = db.query_all(
        "SELECT * FROM mission_tasks WHERE mission_id = ? ORDER BY created ASC",
        (mission_id,),
    )
    out = []
    for t in tasks:
        d = dict(t)
        d["files"] = json.loads(d.get("files") or "[]")
        out.append(d)
    m["tasks"] = out
    return m


def open_missions() -> List[dict]:
    """Missions that are not finished — what a resume() would reload."""
    rows = db.query_all(
        "SELECT id FROM missions WHERE status NOT IN ('done','failed') "
        "ORDER BY updated DESC"
    )
    return [get_mission(r["id"]) for r in rows]
