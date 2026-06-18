---
title: Supporting Phase Containment
impact: HIGH
impactDescription: >
  Defects that escape their phase of introduction cost exponentially more to fix. Phase
  containment through modeling and reviews is the TA's primary contribution to reducing
  the cost of quality and preventing defect propagation in the SDLC.
tags:
  - phase-containment
  - defect-prevention
  - shift-left
  - test-basis-quality
  - ch5
---

# Supporting Phase Containment

## Definition

**Phase containment**: Detecting and removing defects in the **same phase of the SDLC in which they were introduced**.

In Agile software development, the **shift-left approach** applies similarly — find defects as early as possible.

## Why Phase Containment Matters

- Reduces the cost of quality
- The test basis is the critical input to test analysis and test design
- Poor test basis quality multiplies effort and defects downstream
- Early attention to test basis quality minimizes later effort

**Economic principle**: Defect cost grows exponentially with late detection. Finding a defect in requirements costs 1x; finding it in production can cost 100-1000x.

## TA's Role in Phase Containment

The TA contributes to phase containment through:
1. **Modeling for testing** — creates models of the test object to find specification defects
2. **Reviewing the test basis** — applies review techniques to find defects in documents

Both activities target the test basis (requirements, specifications, models) before development begins.

## Two Approaches

### 1. Using Models to Detect Defects

**Detecting defects in specifications**:
- TA formally represents informal specifications using models
- When creating the model, test conditions are mapped to model elements
- Formalization reveals defects: incompleteness, inconsistencies, ambiguities
- The model transformation finds defects that reviews in the original form might miss

**Model types and their defect targets**:

| Model Type | Defects Detected |
|-----------|-----------------|
| Domain models | Overlapping partitions, gaps, empty partitions, incorrect parameter combinations |
| Combinatorial models | Missing or invalid parameter combinations |
| CRUD matrices | Incomplete entity lifecycles, missing operations |
| State-based models | Missing/faulty transitions, deadlocks, endless loops, nondeterminism, missing exceptions |
| Scenario models (activity diagrams) | Missing actions, incorrect order, missing exception handling, dead ends |
| Decision tables | Inconsistent/overlapping rules, incomplete conditions, missing actions |
| Metamorphic relations | Defects in business rules, omissions, inconsistencies, redundancies |

**Detecting defects in existing models**:

If the test basis already contains models, the TA analyzes them for:

| Model | Typical Defects |
|-------|----------------|
| State transition diagrams | Missing/wrong states, improper transitions, incorrect guard conditions, unreachable states, nondeterminism |
| Activity diagrams | Missing/unreachable/dead-end actions, incorrect order, wrong guard conditions, missing synchronization |
| Decision tables | Overlapping rules, inconsistent rules, infeasible rules, incompleteness |

All models can also contain: syntax errors, typos, duplicates, inconsistent naming.

**Model-Based Testing (MBT)**:
- MBT tool designs and generates test cases from an MBT model
- Effective in finding specification anomalies through comprehensive coverage
- Graphical models foster stakeholder communication and shared understanding
- See ISTQB-MBT v1.1 for details

### 2. Applying Review Techniques

Five review techniques the TA uses (see review-techniques rule):
1. Ad hoc reviewing
2. Checklist-based reviewing
3. Scenario-based reviewing
4. Role-based reviewing
5. Perspective-based reading (PBR)

**Review technique selection factors**:
- Reviewing goals and project objectives
- Available resources
- Test basis type (textual, model-based, scenario-based)
- Associated risks
- Business domain
- Company culture

## Modeling vs. Review: Key Distinction

| Approach | Mechanism | Strength |
|---------|-----------|---------|
| Modeling | **Transform** the specification into a model | Finds defects that are invisible in original text |
| Review | **Check** the specification in its original form | Finds defects in context; stakeholder understanding |

They are **complementary** — use both for maximum phase containment effectiveness.

## Phase Containment in Agile

In Agile (shift-left):
- Apply 3 amigos / BDD to find requirement defects in sprint planning
- Use acceptance criteria as basis for review and modeling
- Model user stories using CRUD matrices, state diagrams for behavioral stories
- Apply decision tables for stories with complex business rules

## Phase Containment Effectiveness (PCE)

```
PCE = Defects introduced and removed in the same phase / Total defects introduced in that phase
```

High PCE indicates successful phase containment. Track per SDLC phase.

## References
- ISTQB CTAL-TA v4.0, Section 5.2
- ISO/IEC 20246:2017 (work product reviews)
- ISTQB-MBT v1.1 (model-based testing)
- ISTQB CTAL-TA v4.0, Section 5.2.1 and 5.2.2
