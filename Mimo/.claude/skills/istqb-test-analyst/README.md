ISTQB Test Analyst Skill
========================

This repository contains an **ISTQB Advanced Level Test Analyst (CTAL‑TA v4.0)** skill for AI coding/testing agents (Claude Code, Cursor, Copilot, and others that support the `SKILL.md` open standard).

The skill packages the CTAL‑TA syllabus into agent‑friendly rules, commands, and references so agents can:

- Analyze and improve test bases
- Perform risk‑based test analysis and design
- Select and apply black‑box and experience‑based test techniques
- Design high/low‑level test cases and support defect prevention

Repository structure
--------------------

- `SKILL.md` – main skill definition and entrypoint (frontmatter + instructions)
- `rules/` – one concept per file (risk-based testing, domain testing, state transition testing, decision tables, defect prevention, etc.)
- `command/` – step‑by‑step workflows (analyze test basis, select technique, design test cases, conduct risk analysis, prevent defects)
- `references/` – CTAL‑TA learning objectives, syllabus mapping, and glossary

Installing the skill
--------------------

```bash
npx skills add https://github.com/enesberber/istqb-test-analyst --skill istqb-test-analyst
```

After installation, compatible agents (e.g. Claude Code, Cursor, Copilot) will auto‑activate this skill whenever a task involves **test analysis, black‑box test techniques, risk‑based testing, or CTAL‑TA exam topics**.

License
-------

This project is licensed under the **MIT License** (see `LICENSE`).
