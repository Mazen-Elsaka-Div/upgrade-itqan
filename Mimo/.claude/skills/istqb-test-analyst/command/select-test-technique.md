---
title: Select Test Technique
description: >
  Decision guide for selecting the most appropriate test technique(s) for a given risk
  and context. Covers analysis of risk type, coverage needs, constraints, and technique
  combinations. K4-level analysis: match techniques to risk characteristics.
usage: >
  Use during test design when selecting which technique(s) to apply to a test condition
  or feature. Also use during risk analysis to propose test activities per identified risk.
tags:
  - technique-selection
  - risk-based-testing
  - test-design
  - k4-analysis
---

# Command: Select Test Technique

## When to Use

Use this command when:
- Designing test cases and selecting the approach for a feature
- Completing risk analysis and proposing test activities per risk
- Reviewing an existing test suite for technique coverage
- Responding to new risk information that requires technique adjustment

## Step 1: Analyze the Risk Type

Identify what kind of defect the risk represents:

```
What is the nature of the potential defect?
│
├── Incorrect handling of data values or boundaries
│   → Data-based techniques
│
├── Missing or incorrect behavior in specific states or workflows
│   → Behavior-based techniques
│
├── Incorrect application of business rules or logic
│   → Rule-based techniques
│
├── Hard to specify; unknown unknowns; usability/exploratory
│   → Experience-based techniques
│
└── Multiple defect types → Combination of techniques
```

## Step 2: Match Risk to Technique

### Data-Based Techniques

| Situation | Technique | Coverage Criterion |
|-----------|-----------|------------------|
| Single variable with boundary conditions | Domain testing | ON/OFF (simplified) or ON/OFF/IN/OUT (reliable) |
| Multiple interacting parameters | Combinatorial testing | Pairwise (N=2) or N-wise |
| Large input space, no domain knowledge | Random testing | Time/count-based |

**Domain testing**: Single or multi-variable numeric/ordinal inputs with boundary conditions.
**Combinatorial**: Configuration or parameter combinations; ~97% of failures from 1-2 interactions.
**Random**: When bias avoidance matters; requires automated oracle.

### Behavior-Based Techniques

| Situation | Technique | Coverage Criterion |
|-----------|-----------|------------------|
| Data entity lifecycle (create/read/update/delete) | CRUD testing | Completeness + lifecycle coverage |
| State-dependent system behavior | State Transition | 0-switch (minimum), 1-switch (standard), round-trip (loops) |
| End-to-end user workflows | Scenario-based | All scenarios (no loops) or simple loop coverage |

**CRUD**: Any system that manages data entities.
**State Transition**: Embedded systems, order lifecycles, account states, workflow systems.
**Scenario-based**: User acceptance testing, end-to-end functional testing.

### Rule-Based Techniques

| Situation | Technique | Coverage Criterion |
|-----------|-----------|------------------|
| Multiple conditions determining an outcome | Decision Table | One test per rule (minimized) or full table (high risk) |
| No oracle / AI-based / probabilistic system | Metamorphic Testing | One source + multiple follow-up test cases per MR |

**Decision Table**: Business rules, pricing logic, approval workflows, eligibility checks.
**Metamorphic**: AI systems, complex algorithms, scientific computing, systems without oracles.

### Experience-Based Techniques

| Situation | Technique |
|-----------|-----------|
| Structured exploration of unknown areas | Session-based testing (with charter) |
| Known failure patterns or risk areas | Checklist-based testing |
| Diverse environment/user coverage needed | Crowd testing |
| Low risk, tight schedule | Any experience-based technique |

## Step 3: Assess Coverage Rigor Based on Risk Level

| Risk Level | Coverage Target |
|-----------|----------------|
| CRITICAL | Most rigorous: full decision table, reliable domain coverage, 1-switch + round-trip, all combinations |
| HIGH | Standard rigorous: simplified domain, 1-switch, minimized decision table, pairwise |
| MEDIUM | Standard: simplified domain, 0-switch, minimized table |
| LOW | Lightweight: experience-based, ad-hoc, or selective coverage |

## Step 4: Apply Contextual Filters

Check these factors before finalizing:

**Test Basis**:
- Has models (state diagrams, decision tables) → use matching technique
- Scenario-based specification → scenario-based testing
- No oracle available → metamorphic testing

**Tester Knowledge**:
- TA unfamiliar with technique → don't use for critical assignments
- Low domain knowledge → avoid pure exploratory testing

**SDLC**:
- Sequential → formal techniques preferred
- Iterative/Agile → lightweight or automatable techniques

**Constraints**:
- Tight deadline → prioritize fast techniques; skip complex coverage
- Budget limited → select highest coverage per test effort

**Regulatory**:
- ISO 26262 (automotive): requires EP, BVA, error guessing by ASIL level
- Other standards: check for mandated techniques

## Step 5: Select Primary Technique

Based on steps 1-4, select the primary technique. Document rationale:
- Which risk type it addresses
- Which coverage criterion will be applied
- Why this technique was chosen over alternatives

## Steps 6-7: Complementary Technique and Documentation

Add a secondary technique if needed (exploratory follow-up, checklist for known patterns, BVA for scenario boundaries). Common combos: Domain+Scenario, State Transition+BVA, Decision Table+Domain, Systematic+Exploratory.

Document: selected technique(s), coverage criterion, rationale, and known gaps.

## Related Rules
- [technique-selection](../rules/technique-selection.md)
- [domain-testing](../rules/domain-testing.md)
- [combinatorial-testing](../rules/combinatorial-testing.md)
- [state-transition-testing](../rules/state-transition-testing.md)
- [decision-table-testing](../rules/decision-table-testing.md)
- [metamorphic-testing](../rules/metamorphic-testing.md)