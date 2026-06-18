@echo off
REM ============================================================
REM   MIMO Arena launcher (Windows)
REM   1) Edit PROJECT_DIR below to point at YOUR project folder.
REM   2) Save, then double-click this file to start the arena.
REM ============================================================

REM --- CHANGE THIS to your project folder ---------------------
set "PROJECT_DIR=D:\Workspace\Itqan Upgrade"

REM --- Where this arena tool lives (auto-detected) ------------
set "ARENA_DIR=%~dp0"

REM --- Optional knobs -----------------------------------------
set "MIMO_EXECUTORS=2"
set "MIMO_BIN=mimo"

echo ============================================================
echo   MIMO Arena
echo   Project : %PROJECT_DIR%
echo   Tool    : %ARENA_DIR%
echo ============================================================

REM Install python deps the first time (safe to re-run).
python -m pip install --quiet fastapi "uvicorn[standard]" pydantic

REM Point the arena at your project and launch.
set "MIMO_ROOT=%PROJECT_DIR%"
python "%ARENA_DIR%run.py"

pause
