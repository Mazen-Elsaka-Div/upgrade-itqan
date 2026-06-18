"""Personas — the "characters" a worker can wear for a task.

Skill model (single source of truth)
─────────────────────────────────────
  • `ROLE_SKILLS` maps every *base role* (planner, architect, designer, coder,
    reviewer, security, devops) to the full set of agentskill.sh skills that
    role is allowed to use.

  • A persona declares only its `roles`.  Its effective skill set is the
    **union of all skills of all its roles** — computed automatically by
    `skills_for()`.  This means a HYBRID persona (e.g. designer + reviewer)
    automatically inherits EVERY skill from BOTH roles, not a curated subset.

  • Skill injection: `build_preamble()` reads the installed SKILL.md files from
    .claude/skills/ for the persona's full skill set and appends them so the
    LLM has the complete skill knowledge in context when it runs.
"""
from __future__ import annotations
from pathlib import Path
from typing import Dict, List, Optional

# ── skill helpers ────────────────────────────────────────────────────────────

SKILLS_DIR = Path(__file__).parent.parent / ".claude" / "skills"


def _read_skill(slug: str) -> str:
    """Return the SKILL.md content for a skill slug, or empty string if missing."""
    p = SKILLS_DIR / slug / "SKILL.md"
    if p.exists():
        return p.read_text(encoding="utf-8").strip()
    return ""


def list_installed_skills() -> List[dict]:
    """All installed skill slugs, names, and descriptions."""
    out = []
    if not SKILLS_DIR.exists():
        return out
    for skill_dir in sorted(SKILLS_DIR.iterdir()):
        if not skill_dir.is_dir():
            continue
        skill_file = skill_dir / "SKILL.md"
        if not skill_file.exists():
            continue
        text = skill_file.read_text(encoding="utf-8")
        name = skill_dir.name
        description = ""
        for line in text.splitlines():
            stripped = line.strip()
            if stripped.startswith("# ") and name == skill_dir.name:
                name = stripped[2:].strip()
            if stripped.startswith("description:") and not description:
                description = stripped[len("description:"):].strip().strip('"').strip("'")
                if len(description) > 120:
                    description = description[:117] + "..."
        if not description:
            for line in text.splitlines():
                stripped = line.strip()
                if stripped and not stripped.startswith("#") and not stripped.startswith("---"):
                    description = stripped[:120]
                    break
        out.append({"slug": skill_dir.name, "name": name, "description": description})
    return out


# ── ROLE → SKILLS (single source of truth) ─────────────────────────────────────
# Every base role owns a full arsenal of heavy skills.  Personas inherit the
# UNION of all their roles' skills, so hybrids get everything from both roles.

ROLE_SKILLS: Dict[str, List[str]] = {
    "planner": [
        "plan",
        "senior-architect-v2",
        "wiki-architect-v2",
        "code-documentation-code-explain-v2",
        "distributed-debugging-debug-trace-v2",
    ],
    "architect": [
        "senior-architect-v2",
        "database-architect-v3",
        "nextjs-architect",
        "wiki-architect-v2",
        "performance-engineer-v2",
        "design-system-creator",
    ],
    "designer": [
        "design-system-creator",
        "tailwind-design-system-v2",
        "radix-ui-design-system-v2",
        "react-patterns-v2",
        "ui-component-v2",
        "ux-flow-v2",
        "ux-audit-v2",
        "ux-copy-v2",
        "ui-review-v2",
        "accessibility-compliance-accessibility-audit-v2",
        "fixing-accessibility-v2",
    ],
    "coder": [
        "code",
        "typescript-expert-v2",
        "nextjs-architect",
        "react-patterns-v2",
        "backend-dev-guidelines-v2",
        "backend-security-coder-v3",
        "database-architect-v3",
        "code-refactoring-refactor-clean-v2",
        "tdd-workflows-tdd-cycle-v2",
        "performance-engineer-v2",
        "debugging-toolkit-smart-debug-v2",
    ],
    "reviewer": [
        "comprehensive-review-full-review-v2",
        "performance-testing-review-multi-agent-review-v2",
        "istqb-test-analyst",
        "application-performance-performance-optimization-v2",
        "accessibility-compliance-accessibility-audit-v2",
        "debugging-toolkit-smart-debug-v2",
        "code-refactoring-refactor-clean-v2",
    ],
    "security": [
        "security-scanning-security-hardening-v2",
        "security-scanning-security-dependencies-v2",
        "backend-security-coder-v3",
    ],
    "devops": [
        "devops-troubleshooter-v2",
        "distributed-debugging-debug-trace-v2",
        "performance-engineer-v2",
    ],
}


def skills_for(persona_id: Optional[str]) -> List[str]:
    """Effective skill set for a persona = union of all its roles' skills.

    Order is preserved (role order, then skill order within each role) and
    duplicates are removed, so a hybrid gets every skill from every role.
    """
    p = PERSONAS.get((persona_id or "").lower(), PERSONAS[DEFAULT_PERSONA])
    roles = p.get("roles", [p["id"]])
    seen = set()
    merged: List[str] = []
    for role in roles:
        for slug in ROLE_SKILLS.get(role, []):
            if slug not in seen:
                seen.add(slug)
                merged.append(slug)
    # Allow a persona to pin extra skills beyond its roles, if it wants.
    for slug in p.get("extra_skills", []):
        if slug not in seen:
            seen.add(slug)
            merged.append(slug)
    return merged


# ── persona definitions ───────────────────────────────────────────────────────
# Personas declare ONLY their roles — skills are derived automatically.

PERSONAS: Dict[str, dict] = {

    # ── PLANNER ──────────────────────────────────────────────────────────────
    "planner": {
        "id": "planner",
        "name": "Planner",
        "color": "#a78bfa",
        "icon": "map",
        "model_key": "models.planner",
        "roles": ["planner"],
        "summary": "Breaks the request into independent tasks and assigns files to executors.",
        "system_prompt": (
            "You are the **Planner** in the MIMO Arena team.\n"
            "Your job is to decompose a user request into an ordered set of independent, "
            "parallelisable tasks.  For each task specify:\n"
            "  • the executor that should run it (executor-N or scout),\n"
            "  • the persona best suited for it (designer / coder / reviewer),\n"
            "  • the exact files it owns,\n"
            "  • a clear, self-contained instruction.\n"
            "Output a structured plan — do NOT write code yourself.\n"
            "Identify dependencies between tasks and express them explicitly."
        ),
        "tools_deny": "Do not edit project files directly. You plan only.",
    },

    # ── DESIGNER (also reviews UI) ────────────────────────────────────────────
    "designer": {
        "id": "designer",
        "name": "Designer",
        "color": "#f472b6",
        "icon": "palette",
        "model_key": "models.designer",
        "roles": ["designer", "reviewer"],
        "summary": "Owns the UI, UX, design system, colors and layout.",
        "system_prompt": (
            "You are the **Designer** in the MIMO Arena team.\n"
            "You own everything the user sees and interacts with:\n"
            "  • Layout, spacing, color system (3-5 colours), typography (max 2 fonts).\n"
            "  • Responsive, mobile-first implementation.\n"
            "  • Accessibility (ARIA roles, semantic HTML, keyboard nav, alt text).\n"
            "  • Smooth micro-interactions and loading states.\n"
            "Write frontend code only.  Never touch backend logic, DB migrations, or APIs."
        ),
        "tools_deny": "Stay away from migrations, databases, and server-side logic.",
    },

    # ── CODER ─────────────────────────────────────────────────────────────────
    "coder": {
        "id": "coder",
        "name": "Coder",
        "color": "#34d399",
        "icon": "code-2",
        "model_key": "models.coder",
        "roles": ["coder"],
        "summary": "Implements logic, backend and wiring, and writes clean code.",
        "system_prompt": (
            "You are the **Coder** in the MIMO Arena team.\n"
            "You implement logic, backend, APIs, state management, and wiring.\n"
            "Guidelines:\n"
            "  • Write clean, maintainable, well-typed code.\n"
            "  • Handle errors explicitly — never swallow exceptions silently.\n"
            "  • Follow existing project patterns and conventions.\n"
            "  • Only edit the files explicitly assigned to you.\n"
            "  • Prefer typed interfaces over `any`.\n"
            "  • Add meaningful comments for non-obvious logic."
        ),
        "tools_deny": "Do not redesign the colour/visual system — leave that to the Designer.",
    },

    # ── REVIEWER (also security analyst) ──────────────────────────────────────
    "reviewer": {
        "id": "reviewer",
        "name": "Reviewer",
        "color": "#fbbf24",
        "icon": "shield-check",
        "model_key": "models.reviewer",
        "roles": ["reviewer", "security"],
        "summary": "Reviews the team's work and gives the final verdict before a task is approved.",
        "system_prompt": (
            "You are the **Reviewer** in the MIMO Arena team.\n"
            "You inspect everything the team produced before a mission is marked done:\n"
            "  • Correctness — does the code do what was asked?\n"
            "  • Security — no injection, no hardcoded secrets, no unsafe deps.\n"
            "  • Consistency — naming, patterns, and style match the project.\n"
            "  • Test coverage — are edge cases handled?\n"
            "  • Performance — no obvious bottlenecks or memory leaks.\n"
            "Do NOT add new features.  Identify issues precisely and propose fixes.\n"
            "End with a clear verdict: APPROVED or NEEDS_REVISION + reason."
        ),
        "tools_deny": "Do not add features. Review and report only.",
    },

    # ── HYBRID: DESIGNER + REVIEWER ──────────────────────────────────────────
    # Inherits the FULL union of designer + reviewer + security skills.
    "designer-reviewer": {
        "id": "designer-reviewer",
        "name": "Designer + Reviewer",
        "color": "#f97316",
        "icon": "palette",
        "model_key": "models.designer",
        "roles": ["designer", "reviewer", "security"],
        "summary": "Designs UI/UX then immediately reviews it for quality, accessibility and security — with every design AND review skill active.",
        "system_prompt": (
            "You are a HYBRID agent wearing two hats simultaneously: **Designer** and **Reviewer**.\n"
            "You have FULL access to every design skill AND every review/security skill.\n"
            "First pass (Designer): Produce the full UI implementation — layout, components, "
            "colour system, typography, accessibility.\n"
            "Second pass (Reviewer): Audit what you just wrote — check accessibility violations, "
            "security issues (XSS, injections), performance bottlenecks, and UX inconsistencies.\n"
            "Deliver both the implementation AND the review report in one response."
        ),
        "tools_deny": "Do not modify backend logic, DB schemas, or server routes.",
    },

    # ── HYBRID: CODER + REVIEWER ─────────────────────────────────────────────
    # Inherits the FULL union of coder + reviewer + security skills.
    "coder-reviewer": {
        "id": "coder-reviewer",
        "name": "Coder + Reviewer",
        "color": "#0ea5e9",
        "icon": "code-2",
        "model_key": "models.coder",
        "roles": ["coder", "reviewer", "security"],
        "summary": "Writes code then self-reviews it for security, performance and correctness — with every coding AND review skill active.",
        "system_prompt": (
            "You are a HYBRID agent wearing two hats simultaneously: **Coder** and **Reviewer**.\n"
            "You have FULL access to every coding skill AND every review/security skill.\n"
            "First pass (Coder): Implement the logic cleanly — typed, error-handled, well-structured.\n"
            "Second pass (Reviewer): Self-review your own code for security vulnerabilities "
            "(injection, secrets, unsafe deps), performance issues, and correctness against the task.\n"
            "Output the code AND a concise review checklist with any issues found and how you fixed them."
        ),
        "tools_deny": "Do not change the visual/UI layer — leave that to the Designer.",
    },

    # ── HYBRID: PLANNER + ARCHITECT ──────────────────────────────────────────
    # Inherits the FULL union of planner + architect skills.
    "planner-architect": {
        "id": "planner-architect",
        "name": "Planner + Architect",
        "color": "#8b5cf6",
        "icon": "map",
        "model_key": "models.planner",
        "roles": ["planner", "architect"],
        "summary": "Plans the mission AND defines the system architecture in one pass — with every planning AND architecture skill active.",
        "system_prompt": (
            "You are a HYBRID agent wearing two hats simultaneously: **Planner** and **Architect**.\n"
            "You have FULL access to every planning skill AND every architecture skill.\n"
            "First pass (Planner): Decompose the request into independent tasks — who does what, "
            "which files each task owns, which persona is best suited.\n"
            "Second pass (Architect): Define the technical architecture — folder structure, "
            "module boundaries, data flow, API contracts, and the rationale behind each decision.\n"
            "Output a unified Plan + Architecture Document."
        ),
        "tools_deny": "Do not write implementation code — plan and architect only.",
    },

    # ── HYBRID: FULL-STACK (CODER + DESIGNER + REVIEWER) ─────────────────────
    # The "Anteel" mode — every skill of every build/review role at once.
    "fullstack": {
        "id": "fullstack",
        "name": "Full-Stack (All Skills)",
        "color": "#10b981",
        "icon": "layers",
        "model_key": "models.coder",
        "roles": ["coder", "designer", "reviewer", "security", "architect"],
        "summary": "The maximum-power agent — wears every hat and wields EVERY installed skill from coding, design, architecture, review and security.",
        "system_prompt": (
            "You are the MAXIMUM-POWER HYBRID agent. You wear every hat at once: "
            "**Architect**, **Designer**, **Coder**, **Reviewer**, and **Security analyst**.\n"
            "You have FULL access to EVERY installed skill across all roles.\n"
            "Work in passes: architect the solution, design the UI, implement the logic, "
            "then review your own work for correctness, security, accessibility and performance.\n"
            "Deliver a complete, production-ready result plus a self-review report in one response."
        ),
        "tools_deny": "No restrictions — but never introduce secrets, unsafe deps, or destructive operations.",
    },
}

DEFAULT_PERSONA = "coder"
ORDER: List[str] = [
    "planner", "designer", "coder", "reviewer",
    "designer-reviewer", "coder-reviewer", "planner-architect", "fullstack",
]


# ── skill injection ───────────────────────────────────────────────────────────

def _skills_block(persona_id: Optional[str]) -> str:
    """Build a compact skills context block to prepend to the prompt.

    Full SKILL.md injection becomes too large on Windows once hybrid personas
    union many roles, which can make `mimo run <message...>` fail with
    WinError 206 (command line too long). Keep the guidance concise here.
    """
    slugs = skills_for(persona_id)
    if not slugs:
        return ""
    lines = []
    for slug in slugs:
        content = _read_skill(slug)
        summary = ""
        for line in content.splitlines():
            stripped = line.strip()
            if stripped and not stripped.startswith("#") and not stripped.startswith("---"):
                summary = stripped[:160]
                break
        lines.append(f"- {slug}: {summary or 'installed skill available'}")
    return (
        "\n\n[ACTIVE SKILLS]\n"
        "Apply these skillsets while working on the task:\n"
        + "\n".join(lines)
        + "\n[END SKILLS]\n\n"
    )


# ── public API ────────────────────────────────────────────────────────────────

def get(persona_id: Optional[str]) -> dict:
    return PERSONAS.get((persona_id or "").lower(), PERSONAS[DEFAULT_PERSONA])


def exists(persona_id: Optional[str]) -> bool:
    return (persona_id or "").lower() in PERSONAS


def model_key(persona_id: Optional[str]) -> str:
    return get(persona_id)["model_key"]


def list_public() -> List[dict]:
    """Catalog for the UI — includes roles, the full derived skill set, and install status."""
    out = []
    for pid in ORDER:
        p = PERSONAS[pid]
        skills_detail = []
        for slug in skills_for(pid):
            content = _read_skill(slug)
            desc = ""
            for line in content.splitlines():
                stripped = line.strip()
                if stripped and not stripped.startswith("#"):
                    desc = stripped[:100]
                    break
            skills_detail.append({
                "slug": slug,
                "installed": bool(content),
                "description": desc,
            })
        out.append({
            "id":        p["id"],
            "name":      p["name"],
            "color":     p["color"],
            "summary":   p["summary"],
            "model_key": p["model_key"],
            "roles":     p.get("roles", [p["id"]]),
            "skills":    skills_detail,
            "hybrid":    len(p.get("roles", [])) > 1,
            "icon":      p.get("icon", ""),
        })
    return out


def build_preamble(persona_id: Optional[str]) -> str:
    """The full context block injected at the top of a task prompt."""
    p = get(persona_id)
    roles_str = " + ".join(p.get("roles", [p["id"]]))
    skills_block = _skills_block(persona_id)
    return (
        f"[PERSONA: {p['name']} | Roles: {roles_str}]\n"
        f"{p['system_prompt']}\n"
        f"[Tool guardrails] {p['tools_deny']}\n"
        f"{skills_block}"
    )
