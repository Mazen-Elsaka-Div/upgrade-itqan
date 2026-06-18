#!/usr/bin/env bash
# ============================================================
#   MIMO Arena launcher (Git Bash / macOS / Linux)
#   1) Edit PROJECT_DIR below to point at YOUR project folder.
#   2) Run:  bash start-arena.sh
# ============================================================

# --- CHANGE THIS to your project folder ---------------------
PROJECT_DIR="/d/Workspace/Itqan Upgrade"

# --- Where this arena tool lives (auto-detected) ------------
ARENA_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# --- Optional knobs -----------------------------------------
export MIMO_EXECUTORS="${MIMO_EXECUTORS:-2}"
export MIMO_BIN="${MIMO_BIN:-mimo}"

echo "============================================================"
echo "  MIMO Arena"
echo "  Project : $PROJECT_DIR"
echo "  Tool    : $ARENA_DIR"
echo "============================================================"

# Install python deps the first time (safe to re-run).
python -m pip install --quiet fastapi "uvicorn[standard]" pydantic

# Point the arena at your project and launch.
export MIMO_ROOT="$PROJECT_DIR"
python "$ARENA_DIR/run.py"
