"""Runtime settings store — the single source of truth the UI can tune live.

Defaults come from config.py (which itself reads env vars), but any value can
be overridden at runtime from the Settings panel and is persisted in the
`settings` table. Hot paths (worker model, task timeout, retries, isolation,
auto-review) read THROUGH this module instead of reading config constants
directly, so a change in the UI takes effect on the next task without a
restart.

Values are stored as JSON so numbers/bools/strings round-trip cleanly.
The DEFAULTS dict also defines each field's type + UI grouping, which the
server hands to the front-end so the Settings panel renders itself.
"""
from __future__ import annotations
import json
from typing import Any, Dict

from . import config, db

# group: which Settings section it appears under in the UI
# type:  "model" | "int" | "float" | "bool"  -> how the UI renders the control
DEFAULTS: Dict[str, dict] = {
    # --- Models ---
    "models.default":  {"value": config.MODEL_DEFAULT,  "type": "model", "group": "models",
                        "label": "Default model"},
    "models.maestro":  {"value": config.MODEL_MAESTRO,  "type": "model", "group": "models",
                        "label": "Maestro model (Gemini)"},
    "models.scout":    {"value": config.MODEL_SCOUT,    "type": "model", "group": "models",
                        "label": "Scout model"},
    "models.planner":  {"value": config.MODEL_PLANNER,  "type": "model", "group": "models",
                        "label": "Planner model"},
    "models.designer": {"value": config.MODEL_DESIGNER, "type": "model", "group": "models",
                        "label": "Designer model"},
    "models.coder":    {"value": config.MODEL_CODER,    "type": "model", "group": "models",
                        "label": "Coder model"},
    "models.reviewer": {"value": config.MODEL_REVIEWER, "type": "model", "group": "models",
                        "label": "Reviewer model"},
    # --- Execution ---
    "task.timeout":    {"value": config.TASK_TIMEOUT,   "type": "int", "group": "execution",
                        "label": "Task timeout (seconds)", "min": 30, "max": 7200},
    "task.retries":    {"value": config.TASK_MAX_RETRIES, "type": "int", "group": "execution",
                        "label": "Retry attempts", "min": 0, "max": 6},
    "executors.default": {"value": config.DEFAULT_EXECUTORS, "type": "int", "group": "execution",
                        "label": "Executors at boot", "min": 1, "max": 12},
    "review.auto":     {"value": config.REVIEW_AUTO,    "type": "bool", "group": "execution",
                        "label": "Auto-review after each task"},
    # --- Reliability ---
    "heartbeat.timeout": {"value": config.HEARTBEAT_TIMEOUT, "type": "float", "group": "reliability",
                        "label": "Worker heartbeat timeout (seconds)", "min": 10, "max": 600},
    "lock.ttl":        {"value": config.LOCK_TTL,       "type": "float", "group": "reliability",
                        "label": "Lock TTL before release (seconds)", "min": 30, "max": 3600},
    "lock.wait":       {"value": config.LOCK_WAIT_TIMEOUT, "type": "float", "group": "reliability",
                        "label": "Lock queue wait (seconds)", "min": 5, "max": 600},
    "bridge.poll":     {"value": config.BRIDGE_POLL,    "type": "float", "group": "reliability",
                        "label": "Bridge poll interval (seconds)", "min": 0.1, "max": 5},
    # --- Isolation ---
    "isolate.worktrees": {"value": config.ISOLATE_WORKTREES, "type": "bool", "group": "isolation",
                        "label": "Isolate each executor in a git worktree"},
    # --- Skills (next phase) ---
    "skills.per_task_default": {"value": config.SKILLS_PER_TASK_DEFAULT, "type": "int",
                        "group": "skills", "label": "Skills injected per task (default)", "min": 0, "max": 5},
    "skills.per_task_max": {"value": config.SKILLS_PER_TASK_MAX, "type": "int",
                        "group": "skills", "label": "Max skills per task", "min": 1, "max": 8},
}

GROUPS = [
    {"id": "models",      "label": "Models"},
    {"id": "execution",   "label": "Execution"},
    {"id": "reliability", "label": "Reliability"},
    {"id": "isolation",   "label": "Isolation"},
    {"id": "skills",      "label": "Skills"},
]

_cache: Dict[str, Any] = {}


def _coerce(meta: dict, raw: Any) -> Any:
    t = meta.get("type")
    try:
        if t == "int":
            return int(raw)
        if t == "float":
            return float(raw)
        if t == "bool":
            if isinstance(raw, str):
                return raw.strip().lower() in ("1", "true", "yes", "on")
            return bool(raw)
        return "" if raw is None else str(raw)
    except (ValueError, TypeError):
        return meta.get("value")


def load() -> None:
    """Populate the cache from defaults, then overlay any DB overrides."""
    _cache.clear()
    for k, meta in DEFAULTS.items():
        _cache[k] = meta["value"]
    try:
        for row in db.query_all("SELECT key, value FROM settings"):
            if row["key"] in DEFAULTS:
                _cache[row["key"]] = _coerce(DEFAULTS[row["key"]], json.loads(row["value"]))
    except Exception:
        pass


def get(key: str, default: Any = None) -> Any:
    if not _cache:
        load()
    if key in _cache:
        return _cache[key]
    return DEFAULTS.get(key, {}).get("value", default)


def set(key: str, value: Any) -> Any:
    """Validate + persist a single setting, returning the stored value."""
    if key not in DEFAULTS:
        raise KeyError(f"unknown setting: {key}")
    coerced = _coerce(DEFAULTS[key], value)
    db.execute(
        "INSERT INTO settings (key, value) VALUES (?, ?) "
        "ON CONFLICT(key) DO UPDATE SET value = excluded.value",
        (key, json.dumps(coerced, ensure_ascii=False)),
    )
    _cache[key] = coerced
    return coerced


def update(values: Dict[str, Any]) -> Dict[str, Any]:
    out = {}
    for k, v in values.items():
        if k in DEFAULTS:
            out[k] = set(k, v)
    return out


def all_with_meta() -> dict:
    """Everything the Settings panel needs to render + current values."""
    if not _cache:
        load()
    fields = []
    for k, meta in DEFAULTS.items():
        fields.append({
            "key": k,
            "value": _cache.get(k, meta["value"]),
            "type": meta["type"],
            "group": meta["group"],
            "label": meta["label"],
            "min": meta.get("min"),
            "max": meta.get("max"),
        })
    return {"groups": GROUPS, "fields": fields}


def model_for(setting_key: str) -> str:
    """Resolve a persona/role model, falling back to the default model."""
    val = (get(setting_key) or "").strip()
    if val:
        return val
    return (get("models.default") or "").strip()
