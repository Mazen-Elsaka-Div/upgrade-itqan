"""File-lock manager — the core conflict-prevention mechanism.

Rule you chose: a worker that wants to edit a file LOCKS it on entry. If
another worker wants the same file it waits in a queue and takes the lock when
it frees, instead of two workers clobbering each other.

Hardening added on top of the original design:
  • TTL / auto-release: a lock older than config.LOCK_TTL is treated as stale
    (its owner crashed or hung) and reclaimed automatically — no more deadlocks.
  • Fair FIFO queue: when a lock frees, it is handed to the worker that has
    waited longest, not whoever happens to wake first (no starvation).
  • Event-based waiting via threading.Condition instead of busy sleep loops.

Locks are advisory, coordinated in this single process, and mirrored to disk
for inspection. Re-entrant for the same owner.
"""
from __future__ import annotations
import json
import threading
import time
from pathlib import Path
from typing import Dict, List, Optional

from . import config


class LockManager:
    def __init__(self) -> None:
        self._cv = threading.Condition()
        # path -> {"owner": worker_id, "intent": str, "ts": float}
        self._locks: Dict[str, dict] = {}
        # path -> [worker_id, ...] waiting, in arrival order (FIFO fairness)
        self._waiters: Dict[str, List[str]] = {}

    # --- normalization ------------------------------------------------------
    @staticmethod
    def _norm(path: str) -> str:
        return str(Path(path).as_posix()).lstrip("./")

    # --- internal helpers (call while holding self._cv) ---------------------
    def _reap_if_stale(self, key: str) -> None:
        """Drop a lock whose owner has held it past the TTL (assumed crashed)."""
        cur = self._locks.get(key)
        if cur and (time.time() - cur["ts"]) > config.LOCK_TTL:
            del self._locks[key]

    def _first_in_line(self, key: str, worker_id: str) -> bool:
        """True if this worker is at the head of the queue (or queue is empty)."""
        q = self._waiters.get(key)
        return not q or q[0] == worker_id

    # --- core ---------------------------------------------------------------
    def try_acquire(self, path: str, worker_id: str, intent: str = "editing") -> bool:
        """Returns True if the worker now holds the lock (or already did)."""
        key = self._norm(path)
        with self._cv:
            self._reap_if_stale(key)
            cur = self._locks.get(key)
            if cur is None and self._first_in_line(key, worker_id):
                self._locks[key] = {"owner": worker_id, "intent": intent, "ts": time.time()}
                self._drop_waiter(key, worker_id)
                self._persist_locked()
                self._cv.notify_all()
                return True
            if cur is not None and cur["owner"] == worker_id:
                cur["intent"] = intent
                cur["ts"] = time.time()  # refresh TTL on continued use
                return True
            # taken (or not our turn) -> register as waiter once, in order
            q = self._waiters.setdefault(key, [])
            if worker_id not in q:
                q.append(worker_id)
            self._persist_locked()
            return False

    def acquire(self, path: str, worker_id: str, intent: str = "editing",
                timeout: float = None) -> bool:
        """Block (fairly) until the lock is held or `timeout` elapses."""
        if timeout is None:
            timeout = config.LOCK_WAIT_TIMEOUT
        key = self._norm(path)
        deadline = time.time() + timeout
        with self._cv:
            q = self._waiters.setdefault(key, [])
            if worker_id not in q and self._locks.get(key, {}).get("owner") != worker_id:
                q.append(worker_id)
            while True:
                self._reap_if_stale(key)
                cur = self._locks.get(key)
                if cur is not None and cur["owner"] == worker_id:
                    return True
                if cur is None and self._first_in_line(key, worker_id):
                    self._locks[key] = {"owner": worker_id, "intent": intent, "ts": time.time()}
                    self._drop_waiter(key, worker_id)
                    self._persist_locked()
                    self._cv.notify_all()
                    return True
                remaining = deadline - time.time()
                if remaining <= 0:
                    self._drop_waiter(key, worker_id)
                    self._persist_locked()
                    self._cv.notify_all()
                    return False
                # wake at least at TTL granularity so stale locks get reaped
                self._cv.wait(timeout=min(remaining, 1.0))

    def release(self, path: str, worker_id: str) -> bool:
        key = self._norm(path)
        with self._cv:
            cur = self._locks.get(key)
            if not cur or cur["owner"] != worker_id:
                return False
            del self._locks[key]
            self._persist_locked()
            self._cv.notify_all()
            return True

    def release_all(self, worker_id: str) -> List[str]:
        """Release every lock held by a worker (call this on task end/crash)."""
        released = []
        with self._cv:
            for key, info in list(self._locks.items()):
                if info["owner"] == worker_id:
                    del self._locks[key]
                    released.append(key)
            for key, q in self._waiters.items():
                if worker_id in q:
                    q.remove(worker_id)
            if released:
                self._persist_locked()
                self._cv.notify_all()
        return released

    def owner_of(self, path: str) -> Optional[str]:
        with self._cv:
            self._reap_if_stale(self._norm(path))
            cur = self._locks.get(self._norm(path))
            return cur["owner"] if cur else None

    def _drop_waiter(self, key: str, worker_id: str) -> None:
        q = self._waiters.get(key)
        if q and worker_id in q:
            q.remove(worker_id)
        if q is not None and not q:
            self._waiters.pop(key, None)

    def snapshot(self) -> dict:
        with self._cv:
            return self._snapshot_locked()

    def _snapshot_locked(self) -> dict:
        return {
            "locks": {
                k: {"owner": v["owner"], "intent": v["intent"], "ts": v["ts"]}
                for k, v in self._locks.items()
            },
            "waiters": {k: list(v) for k, v in self._waiters.items() if v},
        }

    def _persist_locked(self) -> None:
        try:
            config.ensure_dirs()
            (config.BRIDGE_DIR / "locks.json").write_text(
                json.dumps(self._snapshot_locked(), ensure_ascii=False, indent=2),
                encoding="utf-8",
            )
        except Exception:
            pass


lock_manager = LockManager()
