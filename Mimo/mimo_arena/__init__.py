"""MIMO Arena — multi-agent orchestration over the local `mimo` CLI.

Gemini acts as the maestro (reads/writes JSON), a dedicated MIMO Scout
analyzes the project and produces the plan, and N MIMO executors run tasks
in parallel with a file-lock manager preventing conflicts.
"""
__version__ = "1.0.0"
