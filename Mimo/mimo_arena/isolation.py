"""Per-worker isolation via git worktrees.

When config.ISOLATE_WORKTREES is on, each executor task runs inside its own
git worktree (a separate working directory backed by a temporary branch).
Benefits:
  • A bad edit by one worker can't corrupt the shared tree — it's contained.
  • On success we merge the branch back into the original; on failure we throw
    the worktree away (free rollback).

If git isn't available or ROOT isn't a git repo, everything degrades gracefully
to running in the shared ROOT (returns None), so the arena still works.
"""
from __future__ import annotations
import subprocess
import time
from pathlib import Path
from typing import Optional

from . import config, settings


def _git(*args: str, cwd: Path = None) -> subprocess.CompletedProcess:
    return subprocess.run(
        ["git", *args],
        cwd=str(cwd or config.ROOT),
        capture_output=True, encoding="utf-8", errors="replace",
    )


def is_git_repo() -> bool:
    r = _git("rev-parse", "--is-inside-work-tree")
    return r.returncode == 0 and "true" in (r.stdout or "")


def create_worktree(worker_id: str) -> Optional[dict]:
    """Make an isolated worktree+branch for this worker. Returns
    {"path", "branch"} or None if isolation isn't possible."""
    if not settings.get("isolate.worktrees", config.ISOLATE_WORKTREES) or not is_git_repo():
        return None
    config.ensure_dirs()
    branch = f"arena/{worker_id}-{int(time.time())}"
    path = config.WORKTREES_DIR / f"{worker_id}-{int(time.time())}"
    r = _git("worktree", "add", "-b", branch, str(path))
    if r.returncode != 0:
        return None
    return {"path": str(path), "branch": branch}


def finalize_worktree(wt: dict, success: bool) -> str:
    """Merge the branch back on success, then always remove the worktree.
    Returns a short human-readable note for the audit log / UI."""
    if not wt:
        return "no-isolation"
    branch, path = wt["branch"], wt["path"]
    note = ""
    if success:
        # commit any pending changes in the worktree, then merge into ROOT
        _git("add", "-A", cwd=Path(path))
        _git("commit", "-m", f"arena: {branch}", cwd=Path(path))
        m = _git("merge", "--no-ff", "-m", f"arena merge {branch}", branch)
        note = "merged" if m.returncode == 0 else f"merge-conflict: {m.stderr.strip()[:160]}"
    else:
        note = "discarded"
    # tear down the worktree and its temp branch
    _git("worktree", "remove", "--force", path)
    _git("branch", "-D", branch)
    return note
