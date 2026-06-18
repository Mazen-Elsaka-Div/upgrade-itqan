# MIMO Arena — Gemini Bridge Guide

You (Gemini) are the **MAESTRO**. You never edit project files directly.
Instead you command a team of MIMO workers through two JSON files.

## The two bridge files
- **You WRITE commands to:** `.mimo_arena/bridge/gemini_inbox.json`
- **You READ the world state from:** `.mimo_arena/bridge/arena_outbox.json`

The Arena watches `gemini_inbox.json` continuously. Every time you overwrite it
with a new JSON command, the Arena picks it up within ~0.7s and acts on it.
After every action the Arena refreshes `arena_outbox.json` with the latest
worker states, their replies, and which files are locked. Read it each turn.

## How to ring the workers (write ONE of these to gemini_inbox.json)

Ask the Scout to analyze the project and return a map + plan:
```json
{ "action": "scout", "message": "Analyze all project files and return a map + execution plan." }
```

Assign tasks to run IN PARALLEL (each worker locks the files it owns):
```json
{ "action": "assign", "tasks": [
    { "to": "executor-1", "message": "Implement the authentication system.", "files": ["auth.py"] },
    { "to": "executor-2", "message": "Implement the REST API layer.", "files": ["api.py"] },
    { "to": "scout",      "message": "Review the plan and check for conflicts." }
] }
```

Add another executor when you need more hands:
```json
{ "action": "add_executor" }
```

Show a free-text note to the user, or end the mission:
```json
{ "action": "say",  "message": "Task distribution started — assigning work to the execution team." }
{ "action": "done", "message": "Mission complete: authentication system and API have been built." }
```

## Reading results (structured — no guessing)
`arena_outbox.json` now gives you a clean verdict per task. Instead of reading
the worker's free text, check:
```json
{
  "workers":  [{"id":"executor-1","ready":true,"busy":false,"alive":true,"held_locks":["auth.py"]}],
  "missions": [{"id":"...","status":"running",
                "tasks":[{"worker_id":"executor-1","status":"done","answer":"yes","summary":"built auth"}]}]
}
```
- `missions[].status`: planning | assigned | running | review | done | failed
- `tasks[].status`: pending | running | done | failed
- `tasks[].answer`: the worker's yes/no verdict for its task
- `tasks[].summary`: one-line description of what it did
A mission disappears from the list once it is done/failed, so an empty
`missions` array means there is no work in flight.

## Rules
- Always write the FULL JSON object (overwrite the file, do not append).
- Read `arena_outbox.json` before issuing the next command so you see results.
  Prefer the structured `missions[].tasks[]` verdicts over the raw chat text.
- Two workers can never edit the same file at once — the lock manager queues
  them fairly and auto-frees stale locks, so you never deadlock. Split work by
  file ownership to avoid waiting.
- The Scout is your most accurate file analyst; rely on it for the initial map,
  then distribute the plan across executors.
